import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  registerForPushNotificationsAsync, 
  scheduleReminderNotification, 
  cancelScheduledNotification,
  rescheduleNotification
} from '@/utils/notifications';

type ReminderType = 'feeding' | 'sleep' | 'medication' | 'appointment';
type RepeatType = 'none' | 'daily' | 'weekly';

export type Reminder = {
  id: string;
  type: ReminderType;
  title: string;
  body: string;
  time: Date;
  repeat: RepeatType;
  enabled: boolean;
  metadata: Record<string, any>;
  notificationId?: string;
};

type ReminderContextType = {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
};

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadReminders();
      registerForPushNotificationsAsync();
    }
  }, [user]);

  const loadReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user?.id)
        .order('time', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedReminders = data.map(reminder => ({
          ...reminder,
          time: new Date(reminder.time),
        }));
        setReminders(formattedReminders);
        
        // Schedule notifications for all enabled reminders
        formattedReminders.forEach(async (reminder) => {
          if (reminder.enabled) {
            const notificationId = await scheduleReminderNotification(reminder);
            if (notificationId) {
              updateReminder(reminder.id, { notificationId });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id'>) => {
    try {
      const { error, data } = await supabase
        .from('reminders')
        .insert({
          user_id: user?.id,
          type: reminder.type,
          title: reminder.title,
          body: reminder.body,
          time: reminder.time.toISOString(),
          repeat: reminder.repeat,
          enabled: reminder.enabled,
          metadata: reminder.metadata,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newReminder = { ...data, time: new Date(data.time) };
        
        // Schedule notification if reminder is enabled
        if (newReminder.enabled) {
          const notificationId = await scheduleReminderNotification(newReminder);
          if (notificationId) {
            newReminder.notificationId = notificationId;
            await supabase
              .from('reminders')
              .update({ metadata: { ...newReminder.metadata, notificationId } })
              .eq('id', newReminder.id);
          }
        }
        
        setReminders(prev => [...prev, newReminder]);
      }
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return;

      // Cancel existing notification if it exists
      if (reminder.notificationId) {
        await cancelScheduledNotification(reminder.notificationId);
      }

      const { error } = await supabase
        .from('reminders')
        .update({
          ...updates,
          time: updates.time?.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      const updatedReminder = { ...reminder, ...updates };
      
      // Schedule new notification if reminder is enabled
      if (updatedReminder.enabled) {
        const notificationId = await scheduleReminderNotification(updatedReminder);
        if (notificationId) {
          updatedReminder.notificationId = notificationId;
          await supabase
            .from('reminders')
            .update({ 
              metadata: { 
                ...updatedReminder.metadata, 
                notificationId 
              } 
            })
            .eq('id', id);
        }
      }

      setReminders(prev => prev.map(reminder =>
        reminder.id === id ? updatedReminder : reminder
      ));

      // Handle repeating reminders
      if (updatedReminder.repeat !== 'none' && updatedReminder.enabled) {
        await rescheduleNotification(updatedReminder);
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return;

      // Cancel notification if it exists
      if (reminder.notificationId) {
        await cancelScheduledNotification(reminder.notificationId);
      }

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setReminders(prev => prev.filter(reminder => reminder.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    try {
      await updateReminder(id, { enabled: !reminder.enabled });
    } catch (error) {
      console.error('Error toggling reminder:', error);
      throw error;
    }
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminder,
      }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}
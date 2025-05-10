import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id'>) => {
    try {
      const { error } = await supabase
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
        });

      if (error) throw error;

      await loadReminders();
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
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

      setReminders(prev => prev.map(reminder =>
        reminder.id === id ? { ...reminder, ...updates } : reminder
      ));
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
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
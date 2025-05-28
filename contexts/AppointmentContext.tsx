import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays } from 'date-fns';

export type AppointmentType = 'checkup' | 'vaccination' | 'sick_visit' | 'follow_up' | 'other';

export type Pediatrician = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export type Appointment = {
  id: string;
  pediatricianId: string;
  date: Date;
  type: AppointmentType;
  notes?: string;
  reminderSent: boolean;
};

type AppointmentContextType = {
  pediatricians: Pediatrician[];
  appointments: Appointment[];
  loadPediatricians: () => Promise<void>;
  loadAppointments: () => Promise<void>;
  addPediatrician: (pediatrician: Omit<Pediatrician, 'id'>) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'reminderSent'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Omit<Appointment, 'id'>>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  generateHealthSummary: (appointmentId: string) => Promise<string>;
};

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const [pediatricians, setPediatricians] = useState<Pediatrician[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { user } = useAuth();

  const loadPediatricians = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from('pediatricians').select('*').eq('user_id', user.id);
    if (error) throw error;
    setPediatricians(data || []);
  }, [user]);

  const loadAppointments = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    if (error) throw error;
    setAppointments(
      (data || []).map((a) => ({
        id: a.id,
        pediatricianId: a.pediatrician_id,
        date: new Date(a.date),
        type: a.type as AppointmentType,
        notes: a.notes,
        reminderSent: a.reminder_sent,
      }))
    );
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPediatricians();
      loadAppointments();
    }
  }, [user, loadPediatricians, loadAppointments]);

  const addPediatrician = async (pediatrician: Omit<Pediatrician, 'id'>) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('pediatricians')
      .insert({ user_id: user.id, ...pediatrician })
      .select()
      .single();
    if (error) throw error;
    setPediatricians((prev) => [...prev, data]);
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'reminderSent'>) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        pediatrician_id: appointment.pediatricianId,
        date: appointment.date.toISOString(),
        type: appointment.type,
        notes: appointment.notes,
        reminder_sent: false,
      })
      .select()
      .single();
    if (error) throw error;
    setAppointments((prev) => [
      ...prev,
      {
        id: data.id,
        pediatricianId: data.pediatrician_id,
        date: new Date(data.date),
        type: data.type as AppointmentType,
        notes: data.notes,
        reminderSent: data.reminder_sent,
      },
    ]);
  };

  const updateAppointment = async (id: string, updates: Partial<Omit<Appointment, 'id'>>) => {
    if (!user?.id) return;
    const updateData: any = {};
    if (updates.pediatricianId) updateData.pediatrician_id = updates.pediatricianId;
    if (updates.date) updateData.date = updates.date.toISOString();
    if (updates.type) updateData.type = updates.type;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (Object.keys(updateData).length === 0) return;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;

    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              pediatricianId: data.pediatrician_id,
              date: new Date(data.date),
              type: data.type,
              notes: data.notes,
            }
          : appointment
      )
    );
  };

  const deleteAppointment = async (id: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
  };

  const generateHealthSummary = async (appointmentId: string) => {
    if (!user?.id) return '';
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    // Get recent health data
    const { data: sleepData } = await supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', addDays(new Date(), -7).toISOString())
      .order('start_time', { ascending: false });

    // Get growth measurements
    const { data: growthData } = await supabase
      .from('growth_measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1);

    // Get health logs
    const { data: healthLogs } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .in('type', ['temperature', 'medication', 'milestone'])
      .gte('start_time', addDays(new Date(), -7).toISOString())
      .order('start_time', { ascending: false });

    // Generate summary
    let summary = `Health Summary for Appointment on ${format(appointment.date, 'MMMM d, yyyy')}\n\n`;

    // Add sleep patterns
    if (sleepData?.length) {
      summary += 'Sleep Patterns (Last 7 Days):\n';
      const totalSleep = sleepData.reduce((acc, curr) => acc + (curr.duration || 0), 0);
      const avgSleep = totalSleep / sleepData.length;
      summary += `- Average sleep duration: ${Math.round(avgSleep / 60)}h ${Math.round(avgSleep % 60)}m\n`;
      summary += `- Number of naps: ${sleepData.filter(s => s.type === 'nap').length}\n`;
      summary += `- Night sleep sessions: ${sleepData.filter(s => s.type === 'night').length}\n\n`;
    }

    // Add latest growth measurements
    if (growthData?.length) {
      const latestGrowth = growthData[0];
      summary += 'Latest Growth Measurements:\n';
      if (latestGrowth.weight) {
        summary += `- Weight: ${latestGrowth.weight}${latestGrowth.weight_unit}\n`;
      }
      if (latestGrowth.height) {
        summary += `- Height: ${latestGrowth.height}${latestGrowth.height_unit}\n`;
      }
      if (latestGrowth.head_circumference) {
        summary += `- Head Circumference: ${latestGrowth.head_circumference}${latestGrowth.head_unit}\n`;
      }
      summary += '\n';
    }

    // Add health events
    if (healthLogs?.length) {
      summary += 'Recent Health Events:\n';
      healthLogs.forEach(log => {
        const date = format(new Date(log.start_time), 'MMM d');
        const type = log.type.charAt(0).toUpperCase() + log.type.slice(1);
        summary += `- ${date}: ${type}${log.notes ? ` - ${log.notes}` : ''}\n`;
      });
      summary += '\n';
    }

    return summary;
  };

  return (
    <AppointmentContext.Provider
      value={{
        pediatricians,
        appointments,
        loadPediatricians,
        loadAppointments,
        addPediatrician,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        generateHealthSummary,
      }}>
      {children}
    </AppointmentContext.Provider>
  );
}

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { ACTIVITY_TYPE_MAP } from '@/utils/activityTypes';

export type HealthIssue = 
  | 'constipation'
  | 'vomiting'
  | 'diaper_rash'
  | 'body_rash'
  | 'diarrhea'
  | 'fever'
  | 'other';

export type Severity = 'mild' | 'moderate' | 'severe';

export type HealthLog = {
  id: string;
  type: 'temperature' | 'medication' | 'other';
  value: number;
  unit: string;
  date: Date;
  notes?: string;
};

type HealthLogContextType = {
  healthLogs: HealthLog[];
  addHealthLog: (log: HealthLog) => Promise<void>;
  updateHealthLog: (log: HealthLog) => Promise<void>;
  deleteHealthLog: (id: string) => Promise<void>;
  refreshHealthLogs: () => Promise<void>;
};

const HealthLogContext = createContext<HealthLogContextType | undefined>(undefined);

export function HealthLogProvider({ children }: { children: React.ReactNode }) {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);

  const refreshHealthLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activities')
        .select('metadata')
        .eq('user_id', user.id)
        .in('type', [ACTIVITY_TYPE_MAP.temperature, ACTIVITY_TYPE_MAP.medication])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const records = data.map(record => ({
          ...record.metadata,
          date: new Date(record.metadata.date),
        }));
        setHealthLogs(records);
      }
    } catch (error) {
      console.error('Error refreshing health logs:', error);
    }
  };

  useEffect(() => {
    refreshHealthLogs();
  }, []);

  const addHealthLog = async (log: HealthLog) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          type: ACTIVITY_TYPE_MAP[log.type],
          metadata: log,
          status: 'completed',
          start_time: new Date().toISOString(),
        });

      if (error) throw error;
      await refreshHealthLogs();
    } catch (error) {
      console.error('Error adding health log:', error);
    }
  };

  const updateHealthLog = async (log: HealthLog) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .update({
          metadata: log,
          updated_at: new Date().toISOString(),
        })
        .eq('metadata->id', log.id)
        .eq('user_id', user.id)
        .eq('type', ACTIVITY_TYPE_MAP[log.type]);

      if (error) throw error;
      await refreshHealthLogs();
    } catch (error) {
      console.error('Error updating health log:', error);
    }
  };

  const deleteHealthLog = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('metadata->id', id)
        .eq('user_id', user.id)
        .in('type', [ACTIVITY_TYPE_MAP.temperature, ACTIVITY_TYPE_MAP.medication]);

      if (error) throw error;
      await refreshHealthLogs();
    } catch (error) {
      console.error('Error deleting health log:', error);
    }
  };

  return (
    <HealthLogContext.Provider
      value={{
        healthLogs,
        addHealthLog,
        updateHealthLog,
        deleteHealthLog,
        refreshHealthLogs,
      }}>
      {children}
    </HealthLogContext.Provider>
  );
}

export function useHealthLogContext() {
  const context = useContext(HealthLogContext);
  if (context === undefined) {
    throw new Error('useHealthLogContext must be used within a HealthLogProvider');
  }
  return context;
}
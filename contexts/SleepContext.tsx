import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

type SleepSession = {
  id: string;
  type: 'nap' | 'night';
  startTime: Date;
  endTime?: Date;
  duration?: number;
};

type SleepContextType = {
  sleepSessions: SleepSession[];
  currentSession: SleepSession | null;
  addSleepSession: (session: SleepSession) => Promise<void>;
  startSleepSession: (type: 'nap' | 'night') => void;
  stopSleepSession: () => Promise<void>;
  saveSleepSession: (session: SleepSession) => Promise<void>;
  setCurrentSession: (session: SleepSession | null) => void;
};

const SleepContext = createContext<SleepContextType | undefined>(undefined);

export function SleepProvider({ children }: { children: React.ReactNode }) {
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);
  const [currentSession, setCurrentSession] = useState<SleepSession | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSleepSessions();
    }
  }, [user]);

  const loadSleepSessions = async () => {
    try {
      if (!user?.id) {
        console.warn('No authenticated user for loading sleep sessions');
        return;
      }

      const { data, error } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error loading sleep sessions:', error);
        throw error;
      }

      if (data) {
        const sessions = data.map(record => ({
          id: record.id,
          type: record.type as 'nap' | 'night',
          startTime: new Date(record.start_time),
          endTime: record.end_time ? new Date(record.end_time) : undefined,
          duration: record.duration,
        }));
        setSleepSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading sleep sessions:', error);
    }
  };

  const addSleepSession = async (session: SleepSession) => {
    try {
      if (!user?.id) {
        throw new Error('No authenticated user');
      }

      console.log('Adding sleep session:', {
        user_id: user.id,
        type: session.type,
        start_time: session.startTime.toISOString(),
        end_time: session.endTime?.toISOString(),
        duration: session.duration,
      });

      const { error } = await supabase
        .from('sleep_records')
        .insert({
          user_id: user.id,
          type: session.type,
          start_time: session.startTime.toISOString(),
          end_time: session.endTime?.toISOString(),
          duration: session.duration,
        });

      if (error) {
        console.error('Error saving sleep session:', error);
        throw error;
      }

      await loadSleepSessions();
    } catch (error) {
      console.error('Error saving sleep session:', error);
      throw error;
    }
  };

  const startSleepSession = (type: 'nap' | 'night') => {
    if (!user?.id) {
      console.error('No authenticated user');
      return;
    }

    const newSession: SleepSession = {
      id: Date.now().toString(),
      type,
      startTime: new Date(),
    };
    setCurrentSession(newSession);
  };

  const stopSleepSession = async () => {
    if (currentSession) {
      const endTime = new Date();
      const durationInMinutes = Math.floor(
        (endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60)
      );
      const completedSession: SleepSession = {
        ...currentSession,
        endTime,
        duration: durationInMinutes,
      };
      setCurrentSession(completedSession);
    }
  };

  const saveSleepSession = async (session: SleepSession) => {
    try {
      await addSleepSession(session);
      setCurrentSession(null);
      await loadSleepSessions();
    } catch (error) {
      console.error('Error saving sleep session:', error);
      throw error;
    }
  };

  return (
    <SleepContext.Provider
      value={{
        sleepSessions,
        currentSession,
        addSleepSession,
        startSleepSession,
        stopSleepSession,
        saveSleepSession,
        setCurrentSession,
      }}>
      {children}
    </SleepContext.Provider>
  );
}

export function useSleepContext() {
  const context = useContext(SleepContext);
  if (context === undefined) {
    throw new Error('useSleepContext must be used within a SleepProvider');
  }
  return context;
}
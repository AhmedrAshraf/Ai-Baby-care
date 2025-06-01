import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

type DatabaseFeedingSession = {
  id?: string;
  type: 'breast' | 'bottle' | 'solid';
  start_time: string;
  end_time?: string;
  duration?: number;
  amount?: number;
  unit?: 'ml' | 'oz';
  side?: 'left' | 'right' | 'both';
  food_type?: string;
  notes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
};

type FeedingSession = {
  id: string;
  type: 'breast' | 'bottle' | 'solid';
  startTime: Date;  // Change back to Date for database compatibility
  endTime?: Date;
  duration?: number;
  amount?: number;
  unit?: 'ml' | 'oz';
  side?: 'left' | 'right' | 'both';
  foodType?: string;
  notes?: string;
  user_id?: string;
};

type ElapsedTime = {
  hours: number;
  minutes: number;
  seconds: number;
};

type FeedingContextType = {
  feedingSessions: FeedingSession[];
  currentSession: FeedingSession | null;
  showTimer: boolean;
  elapsedTime: ElapsedTime;
  addFeedingSession: (session: FeedingSession) => Promise<void>;
  startBreastfeeding: (side: 'left' | 'right') => Promise<void>;
  stopBreastfeeding: () => Promise<void>;
  setShowTimer: (show: boolean) => void;
};

const FeedingContext = createContext<FeedingContextType | undefined>(undefined);

export function FeedingProvider({ children }: { children: React.ReactNode }) {
  const [feedingSessions, setFeedingSessions] = useState<FeedingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FeedingSession | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<ElapsedTime>({ hours: 0, minutes: 0, seconds: 0 });
  const { user } = useAuth();

  // Check for active session when component mounts
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        if (!user?.id) return;

        const { data: activeSession, error } = await supabase
          .from('feeding_sessions')
          .select('*')
          .eq('user_id', user.id)
          .is('end_time', null)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return;
          console.error('Error checking for active session:', error);
          throw error;
        }

        if (activeSession) {
          // Adjust for timezone offset
          const startTime = new Date(activeSession.start_time);
          const timezoneOffset = startTime.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
          const adjustedStartTime = new Date(startTime.getTime() - timezoneOffset);

          const session: FeedingSession = {
            id: activeSession.id,
            type: activeSession.type,
            startTime: adjustedStartTime,
            endTime: activeSession.end_time ? new Date(activeSession.end_time) : undefined,
            foodType: activeSession.food_type,
            user_id: activeSession.user_id,
            side: activeSession.side,
            amount: activeSession.amount,
            unit: activeSession.unit,
            notes: activeSession.notes,
            duration: activeSession.duration
          };
          setCurrentSession(session);
          setShowTimer(true);
        }
      } catch (error) {
        console.error('Error in checkActiveSession:', error);
      }
    };

    checkActiveSession();
  }, [user]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession && showTimer) {
      const updateTimer = () => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setElapsedTime({ hours, minutes, seconds });
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentSession, showTimer]);

  const loadFeedingSessions = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('feeding_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Error loading feeding sessions:', error);
        throw error;
      }

      if (data) {
        const sessions = data.map(session => ({
          ...session,
          startTime: new Date(session.start_time),
          endTime: session.end_time ? new Date(session.end_time) : undefined,
          foodType: session.food_type,
        }));
        setFeedingSessions(sessions);
      }
    } catch (error) {
      console.error('Error in loadFeedingSessions:', error);
    }
  };

  const addFeedingSession = async (session: FeedingSession) => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('feeding_sessions')
        .insert({
          user_id: user.id,
          type: session.type,
          start_time: session.startTime.toISOString(),
          end_time: session.endTime?.toISOString(),
          duration: session.duration,
          amount: session.amount,
          unit: session.unit,
          side: session.side,
          food_type: session.foodType,
          notes: session.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding feeding session:', error);
        throw error;
      }

      if (data) {
        const formattedSession = {
          ...data,
          startTime: new Date(data.start_time),
          endTime: data.end_time ? new Date(data.end_time) : undefined,
          foodType: data.food_type,
        };
        setFeedingSessions(prev => [formattedSession, ...prev]);
      }
    } catch (error) {
      console.error('Error in addFeedingSession:', error);
    }
  };

  const startBreastfeeding = async (side: 'left' | 'right') => {
    try {
      if (!user?.id) return;

      const { data: existingSession, error: checkError } = await supabase
        .from('feeding_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking for existing session:', checkError);
        throw checkError;
      }

      if (existingSession) return;

      const startDate = new Date();
      
      const sessionData: Omit<DatabaseFeedingSession, 'id'> = {
        user_id: user.id,
        type: 'breast',
        start_time: startDate.toISOString(),
        side,
        created_at: startDate.toISOString(),
        updated_at: startDate.toISOString()
      };

      const { data, error } = await supabase
        .from('feeding_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        console.error('Error creating breastfeeding session:', error);
        throw error;
      }

      if (data) {
        const formattedSession: FeedingSession = {
          id: data.id,
          type: data.type,
          startTime: startDate,
          endTime: undefined,
          foodType: data.food_type,
          user_id: data.user_id,
          side: data.side,
          amount: data.amount,
          unit: data.unit,
          notes: data.notes,
          duration: data.duration
        };
        setCurrentSession(formattedSession);
        setShowTimer(true);
      }
    } catch (error) {
      console.error('Error in startBreastfeeding:', error);
    }
  };

  const stopBreastfeeding = async () => {
    try {
      if (!currentSession || !user?.id) return;

      const endDate = new Date();
      const durationInMinutes = Math.floor(
        (endDate.getTime() - currentSession.startTime.getTime()) / (1000 * 60)
      );

      if (durationInMinutes < 1) {
        const { error } = await supabase
          .from('feeding_sessions')
          .delete()
          .eq('id', currentSession.id);

        if (error) {
          console.error('Error deleting short session:', error);
          throw error;
        }

        setCurrentSession(null);
        setShowTimer(false);
        setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const { error } = await supabase
        .from('feeding_sessions')
        .update({
          end_time: endDate.toISOString(),
          duration: durationInMinutes,
          updated_at: endDate.toISOString()
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error('Error updating breastfeeding session:', error);
        throw error;
      }

      const completedSession: FeedingSession = {
        ...currentSession,
        endTime: endDate,
        duration: durationInMinutes,
      };

      setFeedingSessions(prev => [completedSession, ...prev]);
      setCurrentSession(null);
      setShowTimer(false);
      setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
    } catch (error) {
      console.error('Error in stopBreastfeeding:', error);
    }
  };

  return (
    <FeedingContext.Provider
      value={{
        feedingSessions,
        currentSession,
        showTimer,
        elapsedTime,
        addFeedingSession,
        startBreastfeeding,
        stopBreastfeeding,
        setShowTimer,
      }}>
      {children}
    </FeedingContext.Provider>
  );
}

export function useFeedingContext() {
  const context = useContext(FeedingContext);
  if (context === undefined) {
    throw new Error('useFeedingContext must be used within a FeedingProvider');
  }
  return context;
}
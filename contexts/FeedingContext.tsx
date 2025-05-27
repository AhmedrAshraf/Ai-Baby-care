import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

type FeedingSession = {
  id: string;
  type: 'breast' | 'bottle' | 'solid';
  startTime: Date;
  end_time?: Date;
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
  addFeedingSession: (session: FeedingSession) => void;
  startBreastfeeding: (side: 'left' | 'right') => void;
  stopBreastfeeding: () => void;
  setShowTimer: (show: boolean) => void;
};

const FeedingContext = createContext<FeedingContextType | undefined>(undefined);

export function FeedingProvider({ children }: { children: React.ReactNode }) {
  const [feedingSessions, setFeedingSessions] = useState<FeedingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<FeedingSession | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<ElapsedTime>({ hours: 0, minutes: 0, seconds: 0 });
  const { user } = useAuth();

  // Load saved feeding sessions and check for active session
  useEffect(() => {
    loadFeedingSessions();
    checkForActiveSession();
  }, [user]);

  const loadFeedingSessions = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('feeding_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      if (data) {
        const sessions = data.map(session => ({
          ...session,
          startTime: new Date(session.start_time),
          end_time: session.end_time ? new Date(session.end_time) : undefined,
          foodType: session.food_type,
        }));
        setFeedingSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading feeding sessions:', error);
    }
  };

  const checkForActiveSession = async () => {
    try {
      if (!user?.id) return;

      // Find the most recent session without an end_time
      const { data, error } = await supabase
        .from('feeding_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active session found
          return;
        }
        throw error;
      }

      if (data) {
        const activeSession = {
          ...data,
          startTime: new Date(data.start_time),
          end_time: data.end_time ? new Date(data.end_time) : undefined,
          foodType: data.food_type,
        };
        setCurrentSession(activeSession);
        setShowTimer(true);
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showTimer && currentSession) {
      interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000);
        
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;
        
        setElapsedTime({ hours, minutes, seconds });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showTimer, currentSession]);

  const addFeedingSession = async (session: FeedingSession) => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('feeding_sessions')
        .insert({
          user_id: user.id,
          type: session.type,
          start_time: session.startTime.toISOString(),
          end_time: session.end_time?.toISOString(),
          duration: session.duration,
          amount: session.amount,
          unit: session.unit,
          side: session.side,
          food_type: session.foodType,
          notes: session.notes,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const formattedSession = {
          ...data,
          startTime: new Date(data.start_time),
          end_time: data.end_time ? new Date(data.end_time) : undefined,
          foodType: data.food_type,
        };
        setFeedingSessions(prev => [formattedSession, ...prev]);
      }
    } catch (error) {
      console.error('Error adding feeding session:', error);
    }
  };

  const startBreastfeeding = async (side: 'left' | 'right') => {
    try {
      if (!user?.id) return;

      // Check if there's already an active session
      const { data: existingSession, error: checkError } = await supabase
        .from('feeding_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSession) {
        console.log('Active session already exists');
        return;
      }

      const newSession: FeedingSession = {
        id: Date.now().toString(),
        type: 'breast',
        startTime: new Date(),
        side,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('feeding_sessions')
        .insert({
          user_id: user.id,
          type: 'breast',
          start_time: newSession.startTime.toISOString(),
          side,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const formattedSession = {
          ...data,
          startTime: new Date(data.start_time),
          end_time: data.end_time ? new Date(data.end_time) : undefined,
          foodType: data.food_type,
        };
        setCurrentSession(formattedSession);
        setShowTimer(true);
      }
    } catch (error) {
      console.error('Error starting breastfeeding session:', error);
    }
  };

  const stopBreastfeeding = async () => {
    try {
      if (!currentSession || !user?.id) return;

      const endTime = new Date();
      const durationInMinutes = Math.floor(
        (endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60)
      );

      const { error } = await supabase
        .from('feeding_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration: durationInMinutes,
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      const completedSession: FeedingSession = {
        ...currentSession,
        end_time: endTime,
        duration: durationInMinutes,
      };

      setFeedingSessions(prev => [completedSession, ...prev]);
      setCurrentSession(null);
      setShowTimer(false);
      setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
    } catch (error) {
      console.error('Error stopping breastfeeding session:', error);
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
import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveData, loadData } from '@/utils/storage';

type FeedingSession = {
  id: string;
  type: 'breast' | 'bottle' | 'solid';
  startTime: Date;
  duration?: number;
  amount?: number;
  unit?: 'ml' | 'oz';
  side?: 'left' | 'right' | 'both';
  foodType?: string;
  notes?: string;
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

  // Load saved feeding sessions
  useEffect(() => {
    loadData<FeedingSession[]>('FEEDING_SESSIONS').then(data => {
      if (data) {
        // Convert date strings back to Date objects
        const sessions = data.map(session => ({
          ...session,
          startTime: new Date(session.startTime),
        }));
        setFeedingSessions(sessions);
      }
    });
  }, []);

  // Save feeding sessions whenever they change
  useEffect(() => {
    saveData('FEEDING_SESSIONS', feedingSessions);
  }, [feedingSessions]);

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

  const addFeedingSession = (session: FeedingSession) => {
    setFeedingSessions(prev => [session, ...prev]);
  };

  const startBreastfeeding = (side: 'left' | 'right') => {
    const newSession: FeedingSession = {
      id: Date.now().toString(),
      type: 'breast',
      startTime: new Date(),
      side,
    };
    setCurrentSession(newSession);
    setShowTimer(true);
  };

  const stopBreastfeeding = () => {
    if (currentSession) {
      const endTime = new Date();
      const durationInMinutes = Math.floor(
        (endTime.getTime() - currentSession.startTime.getTime()) / (1000 * 60)
      );
      const completedSession: FeedingSession = {
        ...currentSession,
        duration: durationInMinutes,
      };
      setFeedingSessions(prev => [completedSession, ...prev]);
      setCurrentSession(null);
      setShowTimer(false);
      setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
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
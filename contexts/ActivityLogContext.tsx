import React, { createContext, useContext, useEffect, useState } from 'react';
import { activityLogger, ActivityEventType, ActivityLogData } from '@/utils/activity-logger';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityLogContextType {
  logActivity: (data: ActivityLogData) => Promise<void>;
  getActivityHistory: (options?: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: ActivityEventType[];
    limit?: number;
    offset?: number;
  }) => Promise<any[]>;
  loading: boolean;
  error: string | null;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export function ActivityLogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      activityLogger.setUserId(user.id);
    }
  }, [user]);

  const logActivity = async (data: ActivityLogData) => {
    try {
      setLoading(true);
      setError(null);
      await activityLogger.logActivity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log activity');
      console.error('Error logging activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityHistory = async (options?: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: ActivityEventType[];
    limit?: number;
    offset?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const history = await activityLogger.getActivityHistory(options);
      return history;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity history');
      console.error('Error fetching activity history:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return (
    <ActivityLogContext.Provider
      value={{
        logActivity,
        getActivityHistory,
        loading,
        error,
      }}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const context = useContext(ActivityLogContext);
  if (context === undefined) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
}
import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveData, loadData } from '@/utils/storage';

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
  type: HealthIssue;
  timestamp: Date;
  severity: Severity;
  temperature?: number;
  notes?: string;
  photoUrl?: string;
};

type HealthLogContextType = {
  healthLogs: HealthLog[];
  addHealthLog: (log: HealthLog) => void;
  updateHealthLog: (log: HealthLog) => void;
  deleteHealthLog: (id: string) => void;
};

const HealthLogContext = createContext<HealthLogContextType | undefined>(undefined);

export function HealthLogProvider({ children }: { children: React.ReactNode }) {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);

  useEffect(() => {
    loadData<HealthLog[]>('HEALTH_LOGS').then(data => {
      if (data) {
        const logs = data.map(log => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
        setHealthLogs(logs);
      }
    });
  }, []);

  useEffect(() => {
    if (healthLogs.length > 0) {
      saveData('HEALTH_LOGS', healthLogs);
    }
  }, [healthLogs]);

  const addHealthLog = (log: HealthLog) => {
    setHealthLogs(prev => [log, ...prev]);
  };

  const updateHealthLog = (log: HealthLog) => {
    setHealthLogs(prev => prev.map(l => 
      l.id === log.id ? log : l
    ));
  };

  const deleteHealthLog = (id: string) => {
    setHealthLogs(prev => prev.filter(l => l.id !== id));
  };

  return (
    <HealthLogContext.Provider
      value={{
        healthLogs,
        addHealthLog,
        updateHealthLog,
        deleteHealthLog,
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
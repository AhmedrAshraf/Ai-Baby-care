import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveData, loadData } from '@/utils/storage';

type Milestone = {
  id: string;
  age: string;
  title: string;
  description: string;
  completed: boolean;
  upcoming: boolean;
  imageUrl: string;
  completedDate?: Date;
};

type MilestoneContextType = {
  milestones: Milestone[];
  addMilestone: (milestone: Milestone) => void;
  toggleMilestone: (id: string) => void;
  updateMilestone: (milestone: Milestone) => void;
};

const MilestoneContext = createContext<MilestoneContextType | undefined>(undefined);

export function MilestoneProvider({ children }: { children: React.ReactNode }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    loadData<Milestone[]>('MILESTONES').then(data => {
      if (data) {
        const records = data.map(record => ({
          ...record,
          completedDate: record.completedDate ? new Date(record.completedDate) : undefined,
        }));
        setMilestones(records);
      }
    });
  }, []);

  useEffect(() => {
    saveData('MILESTONES', milestones);
  }, [milestones]);

  const addMilestone = (milestone: Milestone) => {
    setMilestones(prev => [milestone, ...prev]);
  };

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(milestone =>
      milestone.id === id
        ? {
            ...milestone,
            completed: !milestone.completed,
            upcoming: false,
            completedDate: !milestone.completed ? new Date() : undefined,
          }
        : milestone
    ));
  };

  const updateMilestone = (milestone: Milestone) => {
    setMilestones(prev => prev.map(m => 
      m.id === milestone.id ? milestone : m
    ));
  };

  return (
    <MilestoneContext.Provider
      value={{
        milestones,
        addMilestone,
        toggleMilestone,
        updateMilestone,
      }}>
      {children}
    </MilestoneContext.Provider>
  );
}

export function useMilestoneContext() {
  const context = useContext(MilestoneContext);
  if (context === undefined) {
    throw new Error('useMilestoneContext must be used within a MilestoneProvider');
  }
  return context;
}
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { ACTIVITY_TYPE_MAP } from '@/utils/activityTypes';

type Milestone = {
  id: string;
  title: string;
  date: Date;
  description?: string;
  category: string;
};

type MilestoneContextType = {
  milestones: Milestone[];
  addMilestone: (milestone: Milestone) => Promise<void>;
  updateMilestone: (milestone: Milestone) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  refreshMilestones: () => Promise<void>;
};

const MilestoneContext = createContext<MilestoneContextType | undefined>(undefined);

export function MilestoneProvider({ children }: { children: React.ReactNode }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const refreshMilestones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activities')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('type', ACTIVITY_TYPE_MAP.milestone)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const records = data.map(record => ({
          ...record.metadata,
          date: new Date(record.metadata.date),
        }));
        setMilestones(records);
      }
    } catch (error) {
      console.error('Error refreshing milestones:', error);
    }
  };

  useEffect(() => {
    refreshMilestones();
  }, []);

  const addMilestone = async (milestone: Milestone) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          type: ACTIVITY_TYPE_MAP.milestone,
          metadata: milestone,
          status: 'completed',
          start_time: new Date().toISOString(),
        });

      if (error) throw error;
      await refreshMilestones();
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  const updateMilestone = async (milestone: Milestone) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .update({
          metadata: milestone,
          updated_at: new Date().toISOString(),
        })
        .eq('metadata->id', milestone.id)
        .eq('user_id', user.id)
        .eq('type', ACTIVITY_TYPE_MAP.milestone);

      if (error) throw error;
      await refreshMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('metadata->id', id)
        .eq('user_id', user.id)
        .eq('type', ACTIVITY_TYPE_MAP.milestone);

      if (error) throw error;
      await refreshMilestones();
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  return (
    <MilestoneContext.Provider
      value={{
        milestones,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        refreshMilestones,
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
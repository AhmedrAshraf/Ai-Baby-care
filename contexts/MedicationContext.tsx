import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { ACTIVITY_TYPE_MAP } from '@/utils/activityTypes';

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
};

type MedicationContextType = {
  medications: Medication[];
  addMedication: (medication: Medication) => Promise<void>;
  updateMedication: (medication: Medication) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  refreshMedications: () => Promise<void>;
};

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);

  const refreshMedications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activities')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('type', ACTIVITY_TYPE_MAP.medication)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const records = data.map(record => ({
          ...record.metadata,
          startDate: new Date(record.metadata.startDate),
          endDate: record.metadata.endDate ? new Date(record.metadata.endDate) : undefined,
        }));
        setMedications(records);
      }
    } catch (error) {
      console.error('Error refreshing medications:', error);
    }
  };

  useEffect(() => {
    refreshMedications();
  }, []);

  const addMedication = async (medication: Medication) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          type: ACTIVITY_TYPE_MAP.medication,
          metadata: medication,
          status: 'completed',
          start_time: new Date().toISOString(),
        });

      if (error) throw error;
      await refreshMedications();
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  const updateMedication = async (medication: Medication) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .update({
          metadata: medication,
          updated_at: new Date().toISOString(),
        })
        .eq('metadata->id', medication.id)
        .eq('user_id', user.id)
        .eq('type', ACTIVITY_TYPE_MAP.medication);

      if (error) throw error;
      await refreshMedications();
    } catch (error) {
      console.error('Error updating medication:', error);
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('metadata->id', id)
        .eq('user_id', user.id)
        .eq('type', ACTIVITY_TYPE_MAP.medication);

      if (error) throw error;
      await refreshMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        addMedication,
        updateMedication,
        deleteMedication,
        refreshMedications,
      }}>
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedicationContext() {
  const context = useContext(MedicationContext);
  if (context === undefined) {
    throw new Error('useMedicationContext must be used within a MedicationProvider');
  }
  return context;
}
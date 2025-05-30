import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

type Vaccination = {
  id: string;
  name: string;
  date: Date;
  nextDose?: Date;
  notes?: string;
};

type VaccinationContextType = {
  vaccinations: Vaccination[];
  addVaccination: (vaccination: Vaccination) => Promise<void>;
  updateVaccination: (vaccination: Vaccination) => Promise<void>;
  deleteVaccination: (id: string) => Promise<void>;
  refreshVaccinations: () => Promise<void>;
};

const VaccinationContext = createContext<VaccinationContextType | undefined>(undefined);

export function VaccinationProvider({ children }: { children: React.ReactNode }) {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

  const refreshVaccinations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('activities')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('type', 'medication')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const records = data.map(record => ({
          ...record.metadata,
          date: new Date(record.metadata.date),
          nextDose: record.metadata.nextDose ? new Date(record.metadata.nextDose) : undefined,
        }));
        setVaccinations(records);
      }
    } catch (error) {
      console.error('Error refreshing vaccinations:', error);
    }
  };

  useEffect(() => {
    refreshVaccinations();
  }, []);

  const addVaccination = async (vaccination: Vaccination) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          type: 'medication',
          metadata: vaccination,
          status: 'completed',
          start_time: new Date().toISOString(),
        });

      if (error) throw error;
      await refreshVaccinations();
    } catch (error) {
      console.error('Error adding vaccination:', error);
    }
  };

  const updateVaccination = async (vaccination: Vaccination) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .update({
          metadata: vaccination,
          updated_at: new Date().toISOString(),
        })
        .eq('metadata->id', vaccination.id)
        .eq('user_id', user.id)
        .eq('type', 'medication');

      if (error) throw error;
      await refreshVaccinations();
    } catch (error) {
      console.error('Error updating vaccination:', error);
    }
  };

  const deleteVaccination = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('metadata->id', id)
        .eq('user_id', user.id)
        .eq('type', 'medication');

      if (error) throw error;
      await refreshVaccinations();
    } catch (error) {
      console.error('Error deleting vaccination:', error);
    }
  };

  return (
    <VaccinationContext.Provider
      value={{
        vaccinations,
        addVaccination,
        updateVaccination,
        deleteVaccination,
        refreshVaccinations,
      }}>
      {children}
    </VaccinationContext.Provider>
  );
}

export function useVaccinationContext() {
  const context = useContext(VaccinationContext);
  if (context === undefined) {
    throw new Error('useVaccinationContext must be used within a VaccinationProvider');
  }
  return context;
}
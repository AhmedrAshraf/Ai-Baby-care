import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveData, loadData } from '@/utils/storage';

type Vaccination = {
  id: string;
  name: string;
  date: Date;
  nextDose?: Date;
  notes?: string;
};

type VaccinationContextType = {
  vaccinations: Vaccination[];
  addVaccination: (vaccination: Vaccination) => void;
  updateVaccination: (vaccination: Vaccination) => void;
  deleteVaccination: (id: string) => void;
};

const VaccinationContext = createContext<VaccinationContextType | undefined>(undefined);

export function VaccinationProvider({ children }: { children: React.ReactNode }) {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

  useEffect(() => {
    loadData<Vaccination[]>('VACCINATIONS').then(data => {
      if (data) {
        const records = data.map(record => ({
          ...record,
          date: new Date(record.date),
          nextDose: record.nextDose ? new Date(record.nextDose) : undefined,
        }));
        setVaccinations(records);
      }
    });
  }, []);

  useEffect(() => {
    saveData('VACCINATIONS', vaccinations);
  }, [vaccinations]);

  const addVaccination = (vaccination: Vaccination) => {
    setVaccinations(prev => [vaccination, ...prev]);
  };

  const updateVaccination = (vaccination: Vaccination) => {
    setVaccinations(prev => prev.map(v => 
      v.id === vaccination.id ? vaccination : v
    ));
  };

  const deleteVaccination = (id: string) => {
    setVaccinations(prev => prev.filter(v => v.id !== id));
  };

  return (
    <VaccinationContext.Provider
      value={{
        vaccinations,
        addVaccination,
        updateVaccination,
        deleteVaccination,
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
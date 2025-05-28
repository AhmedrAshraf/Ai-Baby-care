import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveData, loadData } from '@/utils/storage';

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
  addMedication: (medication: Medication) => void;
  updateMedication: (medication: Medication) => void;
  deleteMedication: (id: string) => void;
};

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    loadData<Medication[]>('MEDICATIONS').then(data => {
      if (data) {
        const records = data.map(record => ({
          ...record,
          startDate: new Date(record.startDate),
          endDate: record.endDate ? new Date(record.endDate) : undefined,
        }));
        setMedications(records);
      }
    });
  }, []);

  useEffect(() => {
    saveData('MEDICATIONS', medications);
  }, [medications]);

  const addMedication = (medication: Medication) => {
    setMedications(prev => [medication, ...prev]);
  };

  const updateMedication = (medication: Medication) => {
    setMedications(prev => prev.map(m => 
      m.id === medication.id ? medication : m
    ));
  };

  const deleteMedication = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        addMedication,
        updateMedication,
        deleteMedication,
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
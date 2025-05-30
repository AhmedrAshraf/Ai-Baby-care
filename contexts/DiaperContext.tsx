import React, { createContext, useContext, useState, useEffect } from 'react';
// import { saveData, loadData } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';

type DiaperChange = {
  id: string;
  timestamp: Date;
  type: 'wet' | 'dirty' | 'both';
  brand?: string;
  size?: string;
  notes?: string;
};

type DiaperSupply = {
  id: string;
  brand: string;
  size: string;
  count: number;
  lowStockThreshold: number;
  purchaseUrl?: string;
};

type DiaperContextType = {
  diaperChanges: DiaperChange[];
  supplies: DiaperSupply[];
  addDiaperChange: (change: DiaperChange) => void;
  updateSupply: (supply: DiaperSupply) => void;
  decrementSupply: (supplyId: string) => void;
};

const DiaperContext = createContext<DiaperContextType | undefined>(undefined);

export function DiaperProvider({ children }: { children: React.ReactNode }) {
  const [diaperChanges, setDiaperChanges] = useState<DiaperChange[]>([]);
  const [supplies, setSupplies] = useState<DiaperSupply[]>([]);
  const { user } = useAuth();

  // useEffect(() => {
  //   if (user) {
  //     loadData<DiaperChange[]>('diaper_change').then(data => {
  //       if (data) {
  //         const changes = data.map(change => ({
  //           ...change,
  //           timestamp: new Date(change.timestamp),
  //         }));
  //         setDiaperChanges(changes);
  //       }
  //     });
  //   }
  // }, [user]);

  useEffect(() => {
    if (user && diaperChanges.length > 0) {
      saveData('diaper_change', diaperChanges);
    }
  }, [diaperChanges, user]);

  const addDiaperChange = (change: DiaperChange) => {
    setDiaperChanges(prev => [change, ...prev]);
  };

  const updateSupply = (supply: DiaperSupply) => {
    setSupplies(prev => {
      const index = prev.findIndex(s => s.id === supply.id);
      if (index >= 0) {
        const newSupplies = [...prev];
        newSupplies[index] = supply;
        return newSupplies;
      }
      return [...prev, supply];
    });
  };

  const decrementSupply = (supplyId: string) => {
    setSupplies(prev => prev.map(supply => 
      supply.id === supplyId
        ? { ...supply, count: Math.max(0, supply.count - 1) }
        : supply
    ));
  };

  return (
    <DiaperContext.Provider
      value={{
        diaperChanges,
        supplies,
        addDiaperChange,
        updateSupply,
        decrementSupply,
      }}>
      {children}
    </DiaperContext.Provider>
  );
}

export function useDiaperContext() {
  const context = useContext(DiaperContext);
  if (context === undefined) {
    throw new Error('useDiaperContext must be used within a DiaperProvider');
  }
  return context;
}
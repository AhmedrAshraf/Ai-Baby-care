import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';

type DiaperChange = {
  id: string;
  timestamp: Date;
  type: 'wet' | 'dirty' | 'both';
  brand?: string;
  size?: string;
  notes?: string;
  user_id?: string;
  metadata?: {
    type: 'wet' | 'dirty' | 'both';
    notes?: string;
  };
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
  addDiaperChange: (change: DiaperChange) => Promise<void>;
  updateSupply: (supply: DiaperSupply) => void;
  decrementSupply: (supplyId: string) => void;
};

const DiaperContext = createContext<DiaperContextType | undefined>(undefined);

export function DiaperProvider({ children }: { children: React.ReactNode }) {
  const [diaperChanges, setDiaperChanges] = useState<DiaperChange[]>([]);
  const [supplies, setSupplies] = useState<DiaperSupply[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDiaperChanges();
    }
  }, [user]);

  const loadDiaperChanges = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'diaper_change')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const changes = data.map((change: any) => ({
          ...change,
          timestamp: new Date(change.created_at),
        }));
        setDiaperChanges(changes);
      }
    } catch (error) {
      console.error('Error loading diaper changes:', error);
    }
  };

  const addDiaperChange = async (change: DiaperChange) => {
    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: user?.id,
          type: 'diaper_change',
          created_at: change.timestamp.toISOString(),
          updated_at: change.timestamp.toISOString(),
          metadata: {
            type: change.type,
            notes: change.notes
          }
        });

      if (error) throw error;

      await loadDiaperChanges(); // Reload the changes after adding
    } catch (error) {
      console.error('Error adding diaper change:', error);
      throw error;
    }
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
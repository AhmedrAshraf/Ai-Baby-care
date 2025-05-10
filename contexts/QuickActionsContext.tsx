import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

type QuickAction = {
  id: string;
  type: string;
  lastUsed: Date;
  metadata: Record<string, any>;
};

type QuickActionsContextType = {
  actions: QuickAction[];
  updateLastUsed: (type: string) => Promise<void>;
  getLastUsed: (type: string) => Date | null;
};

const QuickActionsContext = createContext<QuickActionsContextType | undefined>(undefined);

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadQuickActions();
    }
  }, [user]);

  const loadQuickActions = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('user_id', user?.id)
        .order('last_used', { ascending: false });

      if (error) throw error;

      if (data) {
        const quickActions = data.map(action => ({
          id: action.id,
          type: action.type,
          lastUsed: new Date(action.last_used),
          metadata: action.metadata,
        }));
        setActions(quickActions);
      }
    } catch (error) {
      console.error('Error loading quick actions:', error);
    }
  };

  const updateLastUsed = async (type: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('quick_actions')
        .upsert({
          user_id: user.id,
          type,
          last_used: new Date().toISOString(),
        }, {
          onConflict: 'user_id,type'
        });

      if (error) throw error;

      await loadQuickActions();
    } catch (error) {
      console.error('Error updating quick action:', error);
    }
  };

  const getLastUsed = (type: string): Date | null => {
    const action = actions.find(a => a.type === type);
    return action ? action.lastUsed : null;
  };

  return (
    <QuickActionsContext.Provider
      value={{
        actions,
        updateLastUsed,
        getLastUsed,
      }}>
      {children}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions() {
  const context = useContext(QuickActionsContext);
  if (context === undefined) {
    throw new Error('useQuickActions must be used within a QuickActionsProvider');
  }
  return context;
}
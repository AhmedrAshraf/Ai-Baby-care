import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Alert } from 'react-native';

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
  isLoading: boolean;
};

const QuickActionsContext = createContext<QuickActionsContextType | undefined>(undefined);

export function QuickActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadQuickActions();
    } else {
      setActions([]);
    }
  }, [user]);

  const loadQuickActions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_used', { ascending: false });

      if (error) {
        if (error.code === 'PGRST301') {
          // Session expired, will be handled by auth
          return;
        }
        throw error;
      }

      if (data) {
        const quickActions = data.map(action => ({
          id: action.id,
          type: action.type,
          lastUsed: new Date(action.last_used),
          metadata: action.metadata || {},
        }));
        setActions(quickActions);
      }
    } catch (error) {
      console.error('Error loading quick actions:', error);
      // Don't show alert for network errors as they're temporary
      if (error instanceof Error && !error.message.includes('Network request failed')) {
        Alert.alert('Error', 'Failed to load quick actions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateLastUsed = async (type: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('quick_actions')
        .upsert({
          user_id: user.id,
          type,
          last_used: new Date().toISOString(),
        }, {
          onConflict: 'user_id,type'
        })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST301') {
          // Session expired, will be handled by auth
          return;
        }
        throw error;
      }

      if (data) {
        setActions(prevActions => {
          const existingAction = prevActions.find(a => a.type === type);
          if (existingAction) {
            return prevActions.map(a => 
              a.type === type 
                ? { ...a, lastUsed: new Date(data.last_used) }
                : a
            );
          } else {
            return [...prevActions, {
              id: data.id,
              type: data.type,
              lastUsed: new Date(data.last_used),
              metadata: data.metadata || {}
            }];
          }
        });
      }
    } catch (error) {
      console.error('Error updating quick action:', error);
      // Don't show alert for network errors as they're temporary
      if (error instanceof Error && !error.message.includes('Network request failed')) {
        Alert.alert('Error', 'Failed to update quick action');
      }
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
        isLoading,
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
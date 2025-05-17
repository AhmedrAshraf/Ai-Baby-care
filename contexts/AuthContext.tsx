import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User, WeakPassword } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setUser: (user: User) => void;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session; weakPassword?: WeakPassword }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useProtectedRoute(user: User | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      console.log('Redirecting to /(auth)');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      console.log('Redirecting to /(tabs)');
      router.replace('/(tabs)');
    }
  }, [user, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useProtectedRoute(user);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (userId: string, metadata: any) => {
    try {
      const { error } = await supabase.from('user_profiles').insert({
        user_id: userId,
        parent_name: metadata.parent_name,
        baby_name: metadata.baby_name,
        baby_birthday: metadata.baby_birthday,
        baby_gender: metadata.baby_gender,
        relationship_to_child: metadata.relationship_to_child,
        baby_photo_url: metadata.baby_photo_url,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            email_confirmed: true,
          }
        }
      });

      if (error) throw error;

      // Create user profile if registration successful
      if (data.user) {
        await createUserProfile(data.user.id, metadata);
        // Automatically sign in after registration
        await signIn(email, password);
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      await AsyncStorage.multiRemove([
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'supabase.auth.expires_at',
        'supabase.auth.expires_in'
      ]);

      await AsyncStorage.setItem('supabase.auth.token', data.session?.access_token || '');
      if (data.session?.refresh_token) {
        await AsyncStorage.setItem('supabase.auth.refreshToken', data.session.refresh_token);
      }
      if (data.session?.expires_at) {
        await AsyncStorage.setItem('supabase.auth.expires_at', data.session.expires_at.toString());
      }
      if (data.session?.expires_in) {
        await AsyncStorage.setItem('supabase.auth.expires_in', data.session.expires_in.toString());
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setSession(null);
      setUser(null);

      await AsyncStorage.multiRemove([
        'supabase.auth.token',
        'supabase.auth.refreshToken',
        'supabase.auth.expires_at',
        'supabase.auth.expires_in'
      ]);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      signUp,
      signIn,
      signOut,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
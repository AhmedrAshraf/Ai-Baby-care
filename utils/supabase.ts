import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Enhanced retry configuration
const retryConfig = {
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  networkRetries: 3,
  retryDelay: (retryCount: number) => Math.min(1000 * Math.pow(2, retryCount), 10000), // Exponential backoff
};

// Try creating client with enhanced configuration first
let supabase: SupabaseClient;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web/2.1.0',
      },
    },
    ...retryConfig,
  });
} catch (error) {
  // Fallback to basic client if enhanced config fails
  console.warn('Failed to create enhanced Supabase client, falling back to basic client:', error);
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
    }
  });
}

export { supabase };

// Helper function to get the current user's ID
export const getCurrentUserId = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user?.id;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Simplified network connectivity check
export const checkNetworkConnectivity = async () => {
  try {
    // First check navigator.onLine if available
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('No internet connection detected');
    }

    // Simple ping to Supabase
    const response = await fetch(`${supabaseUrl}/auth/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
};
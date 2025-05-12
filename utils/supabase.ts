import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Missing environment variables. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in the .env file.');
}

// Enhanced retry and timeout configuration with auth-specific settings
const retryConfig = {
  retryableStatusCodes: [408, 429, 500, 502, 503, 504, 520, 521, 522, 524],
  networkRetries: 5,
  retryDelay: (retryCount: number) => {
    const baseDelay = 1000;
    const maxDelay = 15000;
    const exponentialDelay = baseDelay * Math.pow(1.5, retryCount);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, maxDelay);
  },
  timeoutSettings: {
    deadlineTimeout: 30000,
    connectionTimeout: 15000,
  }
};

// Custom fetch implementation with enhanced error handling and API key injection
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Always include the API key in headers
      const enhancedInit = {
        ...init,
        headers: {
          ...init?.headers,
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Client-Platform': Platform.OS,
          'X-Retry-Attempt': attempt.toString(),
        },
      };

      // Implement timeout for each attempt
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(input, {
        ...enhancedInit,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Check for API key related errors
      if (response.status === 401 || response.status === 403) {
        const responseData = await response.json().catch(() => ({}));
        if (responseData?.message?.includes('API key')) {
          console.error('[Auth] API key error:', responseData.message);
          // Try to refresh the session
          await supabase.auth.refreshSession();
        }
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        await new Promise(resolve => 
          setTimeout(resolve, (parseInt(retryAfter || '5') * 1000))
        );
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (lastError.name === 'AbortError' && lastError.message.includes('user')) {
        throw lastError;
      }

      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
        );
      }
    }
  }

  throw lastError;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: __DEV__,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'X-Client-Info': `react-native-${Platform.OS}/${Platform.Version.toString()}`,
    },
    fetch: customFetch,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
  db: {
    schema: 'public',
  },
  ...retryConfig,
});

// Helper function to ensure API key is present in requests
const ensureValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!session || error) {
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (!refreshedSession || refreshError) {
        console.warn('[Auth] Session refresh failed:', refreshError?.message);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('[Auth] Session validation error:', error);
    return false;
  }
};

// Enhanced getCurrentUserId with session validation
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    await ensureValidSession();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('[Auth] Error fetching user:', error.message);
      return null;
    }
    return user?.id || null;
  } catch (error) {
    console.error('[Auth] Critical error getting current user:', error);
    return null;
  }
};

// Enhanced isAuthenticated with session validation
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const isValid = await ensureValidSession();
    if (!isValid) return false;

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[Auth] Error fetching session:', error.message);
      return false;
    }
    return !!session;
  } catch (error) {
    console.error('[Auth] Critical error checking authentication:', error);
    return false;
  }
};

// Enhanced network connectivity check
export const checkNetworkConnectivity = async () => {
  const endpoints = [
    supabaseUrl,
    'https://www.google.com',
    'https://www.cloudflare.com',
  ];
  
  const checkEndpoint = async (url: string, timeout: number = 5000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'apikey': supabaseAnonKey,
          'X-Client-Platform': Platform.OS,
          'X-Client-Version': Platform.Version.toString(),
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  };

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const results = await Promise.all(
        endpoints.map(endpoint => checkEndpoint(endpoint))
      );

      if (results.some(result => result === true)) {
        return true;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(1000 * Math.pow(1.5, attempts), 5000))
        );
      }
    } catch (error) {
      console.error('[Network] Check failed:', {
        errorType: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        attempt: attempts + 1,
      });
      
      attempts++;
      if (attempts < maxAttempts) {
        continue;
      }
    }
  }

  throw new Error('[Network] Connectivity check failed after multiple attempts');
};
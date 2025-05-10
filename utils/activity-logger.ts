import { supabase } from './supabase';

export type ActivityEventType = 
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'profile.update'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'settings.change'
  | 'app.error';

export interface ActivityLogData {
  eventType: ActivityEventType;
  eventData?: Record<string, any>;
  metadata?: Record<string, any>;
}

class ActivityLogger {
  private static instance: ActivityLogger;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public async logActivity(data: ActivityLogData) {
    try {
      if (!this.userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user for activity logging');
          return;
        }
        this.userId = user.id;
      }

      const { error } = await supabase.from('activity_logs').insert({
        user_id: this.userId,
        event_type: data.eventType,
        event_data: data.eventData || {},
        metadata: {
          ...data.metadata,
          platform: typeof window !== 'undefined' ? 'web' : 'native',
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
        ip_address: null, // Will be set by Supabase Edge Functions
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  public async getActivityHistory(options?: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: ActivityEventType[];
    limit?: number;
    offset?: number;
  }) {
    try {
      if (!this.userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        this.userId = user.id;
      }

      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (options?.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      if (options?.eventTypes?.length) {
        query = query.in('event_type', options.eventTypes);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching activity history:', error);
      return [];
    }
  }
}

export const activityLogger = ActivityLogger.getInstance();
import { supabase } from '@/utils/supabase';

// Map activity types to database enum values
const ACTIVITY_TYPE_MAP = {
  feeding: 'feeding',
  sleep: 'sleep',
  nap: 'nap',
  diaper_change: 'diaper_change',
  medication: 'medication',
  temperature: 'temperature',
  growth: 'growth',
  milestone: 'milestone',
  other: 'other'
} as const;

export async function saveData(key: string, data: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user, skipping save operation');
      return;
    }

    // Map the activity type to valid enum value
    const activityType = ACTIVITY_TYPE_MAP[key as keyof typeof ACTIVITY_TYPE_MAP] || 'other';

    const { error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        type: activityType,
        metadata: data,
        status: 'completed',
        start_time: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user, skipping load operation');
      return null;
    }

    // Map the activity type to valid enum value
    const activityType = ACTIVITY_TYPE_MAP[key as keyof typeof ACTIVITY_TYPE_MAP] || 'other';

    const { data, error } = await supabase
      .from('activities')
      .select('metadata')
      .eq('user_id', user.id)
      .eq('type', activityType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.metadata as T || null;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return null;
  }
}
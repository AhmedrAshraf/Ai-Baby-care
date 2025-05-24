import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Filter, ChevronLeft, ChevronRight, Activity } from 'lucide-react-native';
import { format, subDays } from 'date-fns';
import { useActivityLog } from '@/contexts/ActivityLogContext';
import Header from '@/components/Header';

export default function ActivityHistoryScreen() {
  const { getActivityHistory, loading, error } = useActivityLog();
  const [activities, setActivities] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState(7); // Default to 7 days

  useEffect(() => {
    loadActivities();
  }, [dateRange]);

  const loadActivities = async () => {
    try {
      const history = await getActivityHistory({
        startDate: subDays(new Date(), dateRange),
        limit: 50,
      });
      console.log('Loaded activities:', history); // Debug log
      setActivities(history || []); // Ensure we always set an array
    } catch (err) {
      console.error('Error loading activities:', err);
      setActivities([]);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'auth.login':
        return <Activity size={20} color="#10B981" />;
      case 'auth.logout':
        return <Activity size={20} color="#EF4444" />;
      default:
        return <Activity size={20} color="#6B7280" />;
    }
  };

  const getEventDescription = (event: any) => {
    switch (event.event_type) {
      case 'auth.login':
        return 'Logged in';
      case 'auth.logout':
        return 'Logged out';
      case 'profile.update':
        return 'Updated profile';
      default:
        return event.event_type.replace('.', ' ').toLowerCase();
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Activity History"
        useGradient
        bottomElement={
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, dateRange === 7 && styles.filterButtonActive]}
              onPress={() => setDateRange(7)}>
              <Text style={[styles.filterButtonText, dateRange === 7 && styles.filterButtonTextActive]}>
                7 Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, dateRange === 30 && styles.filterButtonActive]}
              onPress={() => setDateRange(30)}>
              <Text style={[styles.filterButtonText, dateRange === 30 && styles.filterButtonTextActive]}>
                30 Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, dateRange === 90 && styles.filterButtonActive]}
              onPress={() => setDateRange(90)}>
              <Text style={[styles.filterButtonText, dateRange === 90 && styles.filterButtonTextActive]}>
                90 Days
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No activities found</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                {getEventIcon(activity.event_type)}
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>
                    {getEventDescription(activity)}
                  </Text>
                  <Text style={styles.activityTime}>
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </Text>
                </View>
              </View>
              {activity.event_data && Object.keys(activity.event_data).length > 0 && (
                <View style={styles.activityDetails}>
                  <Text style={styles.detailsText}>
                    {JSON.stringify(activity.event_data, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  filterButtonTextActive: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  activityTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  activityDetails: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  detailsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
  },
});
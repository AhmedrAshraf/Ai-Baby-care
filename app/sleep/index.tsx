import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Moon,
  Sun,
  Play,
  Pause,
  X,
  ChartLine as LineChart,
  Clock,
  CircleAlert as AlertCircle,
  ArrowLeft,
  Timer,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Volume2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  differenceInMinutes,
  addMinutes,
} from 'date-fns';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';

type SleepSession = {
  id?: string;
  type: 'nap' | 'night';
  start_time: Date;
  end_time?: Date;
  duration?: number;
  user_id?: string;
};

type DatabaseSleepSession = {
  id: string;
  type: 'nap' | 'night';
  start_time: string;
  end_time?: string;
  duration?: number;
  user_id?: string;
};

type ElapsedTime = {
  hours: number;
  minutes: number;
  seconds: number;
};

type DailySleepStats = {
  totalSleep: number;
  nightSleep: number;
  naps: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
};

export default function SleepScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const DAY_WIDTH = (SCREEN_WIDTH - 40) / 7;
  const { user } = useAuth();

  const router = useRouter();
  const [showSleepOptions, setShowSleepOptions] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<SleepSession | null>(
    null
  );
  const [elapsedTime, setElapsedTime] = useState<ElapsedTime>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingActiveSession, setIsCheckingActiveSession] = useState(true);

  // Check for active session when component mounts
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        setIsCheckingActiveSession(true);
        if (!user) {
          setIsCheckingActiveSession(false);
          return;
        }

        const { data: activeSession, error } = await supabase
          .from('sleep_records')
          .select('*')
          .eq('user_id', user.id)
          .is('end_time', null)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }

        if (activeSession) {
          setCurrentSession({
            ...activeSession,
            start_time: new Date(activeSession.start_time),
            end_time: activeSession.end_time ? new Date(activeSession.end_time) : undefined,
          });
          setIsTracking(true);
          
          // Calculate initial elapsed time
          const startTime = new Date(activeSession.start_time);
          const now = new Date();
          const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          const hours = Math.floor(diffInSeconds / 3600);
          const minutes = Math.floor((diffInSeconds % 3600) / 60);
          const seconds = diffInSeconds % 60;
          setElapsedTime({ hours, minutes, seconds });
        }
      } catch (error) {
        console.error('Error checking active session:', error);
      } finally {
        setIsCheckingActiveSession(false);
      }
    };

    checkActiveSession();
  }, [user]);

  // Load sleep sessions
  const loadSleepSessions = async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('sleep_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: false });

      if (error) throw error;

      const formattedSessions = (data as DatabaseSleepSession[]).map(
        (session) => ({
          ...session,
          start_time: new Date(session.start_time),
          end_time: session.end_time ? new Date(session.end_time) : undefined,
        })
      );

      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading sleep sessions:', error);
      Alert.alert('Error', 'Failed to load sleep sessions');
    } finally {
      setIsLoading(false);
    }
  };

  // Load sessions when date changes
  useEffect(() => {
    loadSleepSessions();
  }, [selectedDate, user]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && currentSession) {
      interval = setInterval(() => {
        const now = new Date();
        const startTime = new Date(currentSession.start_time);

        // Ensure we're working with valid dates
        if (isNaN(startTime.getTime()) || isNaN(now.getTime())) {
          console.error('Invalid date detected in timer');
          return;
        }

        const diffInSeconds = Math.floor(
          (now.getTime() - startTime.getTime()) / 1000
        );

        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;

        setElapsedTime({ hours, minutes, seconds });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentSession]);

  const startTracking = async (type: 'nap' | 'night') => {
    try {
      if (!user) {
        Alert.alert('Error', 'Please login to track sleep sessions');
        return;
      }

      // Check if there's already an active session
      const { data: activeSession, error: activeError } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single();

      if (activeError && activeError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw activeError;
      }

      if (activeSession) {
        Alert.alert(
          'Active Session',
          'You already have an active sleep session. Please stop the current session before starting a new one.'
        );
        return;
      }

      const newSession: SleepSession = {
        type,
        start_time: new Date(),
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('sleep_records')
        .insert([
          {
            type: newSession.type,
            start_time: newSession.start_time.toISOString(),
            user_id: newSession.user_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentSession({
        ...data,
        start_time: new Date(data.start_time),
        end_time: data.end_time ? new Date(data.end_time) : undefined,
      });
      setIsTracking(true);
      setShowSleepOptions(false);
      setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
    } catch (error) {
      console.error('Error starting sleep session:', error);
      Alert.alert('Error', 'Failed to start sleep session');
    }
  };

  const stopTracking = async () => {
    try {
      if (!currentSession || !user) return;

      const end_time = new Date();
      const start_time = new Date(currentSession.start_time);

      // Ensure we're working with valid dates
      if (isNaN(start_time.getTime()) || isNaN(end_time.getTime())) {
        Alert.alert(
          'Invalid Time',
          'Unable to calculate sleep duration. Please try again.'
        );
        return;
      }

      // Calculate duration in minutes
      const durationInMinutes = Math.max(
        0,
        Math.floor((end_time.getTime() - start_time.getTime()) / (1000 * 60))
      );

      // Validate duration
      if (durationInMinutes > 1440) { // 24 hours in minutes
        Alert.alert(
          'Invalid Duration',
          'Sleep duration cannot exceed 24 hours. Please check your device time settings.'
        );
        return;
      }

      // Show confirmation dialog
      Alert.alert(
        'Stop Sleep Session',
        'Are you sure you want to stop tracking this sleep session?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('sleep_records')
                  .update({
                    end_time: end_time.toISOString(),
                    duration: durationInMinutes,
                  })
                  .eq('id', currentSession.id);

                if (error) {
                  console.error('Supabase error:', error);
                  throw error;
                }

                const completedSession: SleepSession = {
                  ...currentSession,
                  end_time,
                  duration: durationInMinutes,
                };

                setSessions((prev) => [completedSession, ...prev]);
                setCurrentSession(null);
                setIsTracking(false);
                setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
              } catch (error) {
                console.error('Error stopping sleep session:', error);
                Alert.alert('Error', 'Failed to stop sleep session. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error stopping sleep session:', error);
      Alert.alert('Error', 'Failed to stop sleep session. Please try again.');
    }
  };

  const formatTime = (time: ElapsedTime) => {
    const { hours, minutes, seconds } = time;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}`;
  };

  const calculateDailyStats = (date: Date): DailySleepStats => {
    const daysSessions = sessions.filter(
      (session) => session.end_time && isSameDay(session.start_time, date)
    );

    const totalSleep = daysSessions.reduce(
      (acc, session) => acc + (session.duration || 0),
      0
    );
    const nightSleep = daysSessions
      .filter((session) => session.type === 'night')
      .reduce((acc, session) => acc + (session.duration || 0), 0);
    const naps = daysSessions.filter(
      (session) => session.type === 'nap'
    ).length;

    let quality: DailySleepStats['quality'] = 'poor';
    if (totalSleep >= 840) quality = 'excellent'; // 14+ hours
    else if (totalSleep >= 720) quality = 'good'; // 12+ hours
    else if (totalSleep >= 600) quality = 'fair'; // 10+ hours

    return {
      totalSleep,
      nightSleep,
      naps,
      quality,
    };
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate((current) =>
      direction === 'prev' ? subDays(current, 7) : addDays(current, 7)
    );
  };

  const getQualityColor = (quality: DailySleepStats['quality']) => {
    switch (quality) {
      case 'excellent':
        return '#10B981';
      case 'good':
        return '#3B82F6';
      case 'fair':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
    }
  };

  const dayColumnStyle = {
    width: DAY_WIDTH - 8,
    alignItems: 'center' as const,
    padding: 8,
    borderRadius: 8,
  };

  return (
    <View style={styles.container}>
      <Header
        title="Sleep Tracking"
        showBackButton
        useGradient
        bottomElement={
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, true && styles.activeTab]}
              onPress={() => {}}
            >
              <Moon size={20} color={true ? '#7C3AED' : '#FFFFFF'} />
              <Text style={[styles.tabText, true && styles.activeTabText]}>
                Sleep
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, false && styles.activeTab]}
              onPress={() => router.push('/sleep/white-noise')}
            >
              <Volume2 size={20} color={false ? '#7C3AED' : '#FFFFFF'} />
              <Text style={[styles.tabText, false && styles.activeTabText]}>
                White Noise
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content}>
        {isCheckingActiveSession ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Checking active sessions...</Text>
          </View>
        ) : (
          <>
            {isTracking && currentSession && (
              <View style={styles.timerCard}>
                <View style={styles.timerHeader}>
                  <Timer size={24} color="#7C3AED" />
                  <Text style={styles.timerTitle}>
                    {currentSession.type === 'nap' ? 'Nap' : 'Night Sleep'} in
                    Progress
                  </Text>
                </View>
                <Text style={styles.timerDisplay}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.timerSubtext}>
                  Started at {format(currentSession.start_time, 'hh:mm a')}
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => navigateWeek('prev')}>
                  <ChevronLeft size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>
                  {format(weekDays[0], 'MMM d')} -{' '}
                  {format(weekDays[6], 'MMM d, yyyy')}
                </Text>
                <TouchableOpacity onPress={() => navigateWeek('next')}>
                  <ChevronRight size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.weekContainer}>
                {weekDays.map((day, index) => {
                  const stats = calculateDailyStats(day);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        dayColumnStyle,
                        isSameDay(day, selectedDate) && styles.selectedDay,
                      ]}
                      onPress={() => setSelectedDate(day)}
                    >
                      <Text style={styles.dayName}>{format(day, 'EEE')}</Text>
                      <Text style={styles.dayNumber}>{format(day, 'd')}</Text>
                      <View
                        style={[
                          styles.sleepIndicator,
                          { backgroundColor: getQualityColor(stats.quality) },
                        ]}
                      >
                        <Text style={styles.sleepHours}>
                          {Math.floor(stats.totalSleep / 60)}h
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Summary</Text>
              <View style={styles.summaryCard}>
                {(() => {
                  const stats = calculateDailyStats(selectedDate);
                  return (
                    <>
                      <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                          <Moon size={20} color="#7C3AED" />
                          <Text style={styles.summaryLabel}>Night Sleep</Text>
                          <Text style={styles.summaryValue}>
                            {formatDuration(stats.nightSleep)}
                          </Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Sun size={20} color="#F59E0B" />
                          <Text style={styles.summaryLabel}>Naps</Text>
                          <Text style={styles.summaryValue}>{stats.naps}</Text>
                        </View>
                      </View>
                      <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                          <Clock size={20} color="#3B82F6" />
                          <Text style={styles.summaryLabel}>Total Sleep</Text>
                          <Text style={styles.summaryValue}>
                            {formatDuration(stats.totalSleep)}
                          </Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <LineChart size={20} color="#10B981" />
                          <Text style={styles.summaryLabel}>Quality</Text>
                          <Text
                            style={[
                              styles.summaryValue,
                              { color: getQualityColor(stats.quality) },
                            ]}
                          >
                            {stats.quality.charAt(0).toUpperCase() +
                              stats.quality.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </>
                  );
                })()}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sleep Sessions</Text>
              {isLoading ? (
                <Text style={styles.loadingText}>Loading sessions...</Text>
              ) : sessions.length === 0 ? (
                <Text style={styles.emptyText}>
                  No sleep sessions recorded for this day
                </Text>
              ) : (
                sessions.map((session, index) => (
                  <View key={index} style={styles.sleepSession}>
                    <View style={styles.sessionTime}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.sessionTimeText}>
                        {format(session.start_time, 'hh:mm a')}
                        {session.end_time &&
                          ` - ${format(session.end_time, 'hh:mm a')}`}
                      </Text>
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionType}>
                        {session.type === 'night' ? 'Night Sleep' : 'Nap'}
                      </Text>
                      {session.duration && (
                        <Text style={styles.sessionDuration}>
                          {formatDuration(session.duration)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {!isTracking ? (
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => setShowSleepOptions(true)}
        >
          <Play size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Sleep Session</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.stopButton} onPress={stopTracking}>
          <Pause size={24} color="#FFFFFF" />
          <Text style={styles.stopButtonText}>Stop Tracking</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showSleepOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSleepOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Sleep Session</Text>
              <TouchableOpacity onPress={() => setShowSleepOptions(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.sleepOption}
              onPress={() => startTracking('nap')}
            >
              <Sun size={24} color="#7C3AED" />
              <View style={styles.sleepOptionContent}>
                <Text style={styles.sleepOptionTitle}>Start Nap</Text>
                <Text style={styles.sleepOptionDescription}>
                  Track daytime sleep session
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sleepOption}
              onPress={() => startTracking('night')}
            >
              <Moon size={24} color="#7C3AED" />
              <View style={styles.sleepOptionContent}>
                <Text style={styles.sleepOptionTitle}>Start Night Sleep</Text>
                <Text style={styles.sleepOptionDescription}>
                  Track overnight sleep duration
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#7C3AED',
  },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  timerDisplay: {
    fontSize: 64,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  timerSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedDay: {
    backgroundColor: '#F3F4F6',
  },
  dayName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sleepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepHours: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginVertical: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  sleepSession: {
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
  sessionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  sessionDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  sleepOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sleepOptionContent: {
    marginLeft: 16,
  },
  sleepOptionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  sleepOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Utensils, Clock, X, Plus, Baby, ArrowLeft, ArrowRight, Timer, Droplet, Apple, Bell, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { format, addHours, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import { supabase } from '../utils/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';

type FeedingSession = {
  // id: string;
  type: 'breast' | 'bottle' | 'solid';
  start_Time: Date;
  end_time?: Date;
  duration?: number;
  amount?: number;
  unit?: 'ml' | 'oz';
  side?: 'left' | 'right' | 'both';
  foodType?: string;
  notes?: string;
  user_id?: string;
};

type DatabaseFeedingSession = {
  type: 'breast' | 'bottle' | 'solid';
  start_time: string;
  end_time?: string;
  duration?: number;
  amount?: number;
  unit?: 'ml' | 'oz';
  side?: 'left' | 'right' | 'both';
  food_type?: string;
  notes?: string;
  user_id?: string;
};

type ElapsedTime = {
  hours: number;
  minutes: number;
  seconds: number;
};

type DateRange = 'day' | 'week' | 'month';

export default function FeedingScreen() {
  const router = useRouter();
  const {user} = useAuth();
  const [activeTab, setActiveTab] = useState<'breast' | 'bottle' | 'solid'>('breast');
  const [showNewSession, setShowNewSession] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [currentSession, setCurrentSession] = useState<FeedingSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState<ElapsedTime>({ hours: 0, minutes: 0, seconds: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>('day');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const [foodType, setFoodType] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedingSessions, setFeedingSessions] = useState<FeedingSession[]>([]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showTimer && currentSession) {
      interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - currentSession.start_Time.getTime()) / 1000);
        
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;
        
        setElapsedTime({ hours, minutes, seconds });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showTimer, currentSession]);

  // Load feeding sessions effect
  useEffect(() => {
    loadFeedingSessions();
  }, [selectedDate, dateRange]);

  const loadFeedingSessions = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('feeding_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      if (dateRange === 'day') {
        query = query
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString());
      } else if (dateRange === 'week') {
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        query = query
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString());
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }
      
      if (!data) {
        setFeedingSessions([]);
        return;
      }

      const formattedSessions = (data as DatabaseFeedingSession[]).map(session => ({
        ...session,
        start_Time: new Date(session.start_time),
        end_time: session.end_time ? new Date(session.end_time) : undefined,
        foodType: session.food_type,
      }));

      setFeedingSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading feeding sessions:', error);
      Alert.alert(
        'Error',
        'Failed to load feeding sessions. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveFeedingSession = async (session: FeedingSession) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to save feeding sessions');
        return;
      }

      const dbSession: DatabaseFeedingSession = {
        type: session.type,
        start_time: session.start_Time.toISOString(),
        end_time: session.end_time?.toISOString(),
        duration: session.duration,
        amount: session.amount,
        unit: session.unit,
        side: session.side,
        food_type: session.foodType,
        notes: session.notes,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('feeding_sessions')
        .insert([dbSession])
        .select()
        .single();

      if (error) throw error;

      const formattedSession: FeedingSession = {
        ...data,
        start_Time: new Date(data.start_time),
        end_time: data.end_time ? new Date(data.end_time) : undefined,
        foodType: data.food_type,
      };

      setFeedingSessions(prev => [formattedSession, ...prev]);
    } catch (error) {
      console.error('Error saving feeding session:', error);
      Alert.alert('Error', 'Failed to save feeding session');
    }
  };

  const handleStartBreastfeeding = async (side: 'left' | 'right') => {
    try {
      const newSession: FeedingSession = {
        // id: crypto.randomUUID(),
        type: 'breast',
        start_Time: new Date(),
        side,
      };
      setCurrentSession(newSession);
      setShowTimer(true);
      setShowNewSession(false);
    } catch (error) {
      console.error('Error starting breastfeeding session:', error);
      Alert.alert('Error', 'Failed to start breastfeeding session');
    }
  };

  const handleStopBreastfeeding = async () => {
    try {
      if (!currentSession) return;

      const end_time = new Date();
      const durationInMinutes = Math.floor(
        (end_time.getTime() - currentSession.start_Time.getTime()) / (1000 * 60)
      );
      
      const completedSession: FeedingSession = {
        ...currentSession,
        end_time,
        duration: durationInMinutes,
      };

      await saveFeedingSession(completedSession);
      setCurrentSession(null);
      setShowTimer(false);
      setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
    } catch (error) {
      console.error('Error stopping breastfeeding session:', error);
      Alert.alert('Error', 'Failed to stop breastfeeding session');
    }
  };

  const handleSwitchSide = async () => {
    try {
      if (!currentSession) return;

      // Stop current session
      await handleStopBreastfeeding();
      
      // Start new session with opposite side
      const newSide = currentSession.side === 'left' ? 'right' : 'left';
      await handleStartBreastfeeding(newSide);
    } catch (error) {
      console.error('Error switching sides:', error);
      Alert.alert('Error', 'Failed to switch sides');
    }
  };

  const handleBottleFeeding = async () => {
    const newSession: FeedingSession = {
      type: 'bottle',
      start_Time: new Date(),
      end_time: new Date(),
      amount: Number(amount),
      unit,
      notes,
    };
    await saveFeedingSession(newSession);
    setShowNewSession(false);
    resetForm();
  };

  const handleSolidFood = async () => {
    const newSession: FeedingSession = {
      user_id: user?.id,
      type: 'solid',
      start_Time: new Date(),
      end_time: new Date(),
      foodType,
      notes,
    };
    await saveFeedingSession(newSession);
    setShowNewSession(false);
    resetForm();
  };

  const formatTime = (time: ElapsedTime) => {
    const { hours, minutes, seconds } = time;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetForm = () => {
    setAmount('');
    setUnit('ml');
    setFoodType('');
    setNotes('');
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(current => {
      switch (dateRange) {
        case 'day':
          return direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        case 'week':
          return direction === 'prev' ? subDays(current, 7) : addDays(current, 7);
        case 'month':
          return direction === 'prev' ? subDays(current, 30) : addDays(current, 30);
      }
    });
  };

  const getDateRangeText = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    
    switch (dateRange) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy');
      case 'week':
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      default:
        return ''; // Add default return to prevent direct text node
    }
  };

  const getFilteredSessions = () => {
    return feedingSessions.filter(session => 
      isSameDay(session.start_Time, selectedDate)
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feeding Tracker</Text>
        </View>

        <View style={styles.dateControls}>
          <View style={styles.dateRangeSelector}>
            {(['day', 'week', 'month'] as DateRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.dateRangeButton, dateRange === range && styles.dateRangeButtonActive]}
                onPress={() => setDateRange(range)}>
                <Text style={[styles.dateRangeText, dateRange === range && styles.dateRangeTextActive]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dateNavigator}>
            <TouchableOpacity onPress={() => navigateDate('prev')}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.dateRangeLabel}>{getDateRangeText() || ''}</Text>
            <TouchableOpacity onPress={() => navigateDate('next')}>
              <ChevronRight size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'breast' && styles.activeTab]}
            onPress={() => setActiveTab('breast')}>
            <Baby size={20} color={activeTab === 'breast' ? '#7C3AED' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 'breast' && styles.activeTabText]}>
              Breastfeeding
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bottle' && styles.activeTab]}
            onPress={() => setActiveTab('bottle')}>
            <Droplet size={20} color={activeTab === 'bottle' ? '#7C3AED' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 'bottle' && styles.activeTabText]}>
              Bottle
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'solid' && styles.activeTab]}
            onPress={() => setActiveTab('solid')}>
            <Apple size={20} color={activeTab === 'solid' ? '#7C3AED' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 'solid' && styles.activeTabText]}>
              Solid Food
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {showTimer && currentSession && (
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Timer size={24} color="#7C3AED" />
              <Text style={styles.timerTitle}>
                Breastfeeding - {currentSession.side && currentSession.side.charAt(0).toUpperCase() + currentSession.side.slice(1)} Side
              </Text>
            </View>
            <Text style={styles.timerDisplay}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.timerSubtext}>
              Started at {format(currentSession.start_Time, 'hh:mm a')}
            </Text>
            <TouchableOpacity
              style={styles.switchSideButton}
              onPress={handleSwitchSide}>
              <Text style={styles.switchSideText}>Switch Side</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopBreastfeeding}>
              <Text style={styles.stopButtonText}>Stop Feeding</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Feedings</Text>
          {getFilteredSessions().map(session => (
            <View key={session.id} style={styles.feedingItem}>
              <View style={styles.feedingTime}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.feedingTimeText}>
                  {format(session.start_Time, 'hh:mm a')}
                </Text>
              </View>
              <View style={styles.feedingDetails}>
                <Text style={styles.feedingType}>
                  {session.type === 'breast' ? 'Breastfeeding' :
                   session.type === 'bottle' ? 'Bottle Feeding' : 'Solid Food'}
                </Text>
                {session.type === 'breast' && session.side && (
                  <Text style={styles.feedingInfo}>
                    {session.side} side, {session.duration} mins
                  </Text>
                )}
                {session.type === 'bottle' && session.amount && (
                  <Text style={styles.feedingInfo}>
                    {session.amount}{session.unit}
                  </Text>
                )}
                {session.type === 'solid' && session.foodType && (
                  <Text style={styles.feedingInfo}>{session.foodType}</Text>
                )}
                {session.notes && (
                  <Text style={styles.feedingNotes}>{session.notes}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowNewSession(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showNewSession}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewSession(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Feeding Session</Text>
              <TouchableOpacity onPress={() => setShowNewSession(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {activeTab === 'breast' && (
              <View style={styles.breastfeedingOptions}>
                <TouchableOpacity
                  style={styles.sideOption}
                  onPress={() => handleStartBreastfeeding('left')}>
                  <ArrowLeft size={24} color="#7C3AED" />
                  <Text style={styles.sideOptionText}>Left Side</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sideOption}
                  onPress={() => handleStartBreastfeeding('right')}>
                  <ArrowRight size={24} color="#7C3AED" />
                  <Text style={styles.sideOptionText}>Right Side</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'bottle' && (
              <View style={styles.bottleOptions}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <View style={styles.amountInput}>
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                    />
                    <View style={styles.unitSelector}>
                      <TouchableOpacity
                        style={[styles.unitOption, unit === 'ml' && styles.selectedUnit]}
                        onPress={() => setUnit('ml')}>
                        <Text style={[styles.unitText, unit === 'ml' && styles.selectedUnitText]}>
                          ml
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.unitOption, unit === 'oz' && styles.selectedUnit]}
                        onPress={() => setUnit('oz')}>
                        <Text style={[styles.unitText, unit === 'oz' && styles.selectedUnitText]}>
                          oz
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add notes (optional)"
                    multiline
                  />
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleBottleFeeding}>
                  <Text style={styles.saveButtonText}>Save Bottle Feeding</Text>
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'solid' && (
              <View style={styles.solidOptions}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Food Type</Text>
                  <TextInput
                    style={styles.input}
                    value={foodType}
                    onChangeText={setFoodType}
                    placeholder="Enter food type"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add notes (optional)"
                    multiline
                  />
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSolidFood}>
                  <Text style={styles.saveButtonText}>Save Solid Food</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  dateControls: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateRangeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  dateRangeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  dateRangeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  dateRangeTextActive: {
    color: '#7C3AED',
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRangeLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  activeTabText: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    padding: 20,
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
    marginBottom: 24,
  },
  switchSideButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  switchSideText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  feedingItem: {
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
  feedingTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedingTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  feedingDetails: {
    flex: 1,
  },
  feedingType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  feedingInfo: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  feedingNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
  breastfeedingOptions: {
    gap: 16,
  },
  sideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sideOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  unitOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  selectedUnit: {
    backgroundColor: '#7C3AED',
  },
  unitText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  selectedUnitText: {
    color: '#FFFFFF',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  bottleOptions: {
    gap: 16,
  },
  solidOptions: {
    gap: 16,
  },
});
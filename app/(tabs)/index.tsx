import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, Baby, Utensils, Plus, Camera, Activity, Syringe, Volume2, MessageCircle, Scroll, Variable as BabyCarriage, Users, Brain, Dumbbell, Music, CircleAlert as AlertCircle, Bell, Menu } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSleepContext } from '@/contexts/SleepContext';
import { format, formatDistanceToNow } from 'date-fns';
import { QuickAction } from '@/components/QuickAction';
import { useSidebar } from '@/contexts/SidebarContext';
import Header from '@/components/Header';

type UserProfile = {
  parent_name: string;
  baby_name: string;
  baby_birthday: string;
  baby_gender: 'boy' | 'girl';
};

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { currentSession, stopSleepSession, saveSleepSession, setCurrentSession } = useSleepContext();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.user_metadata) {
      setUserProfile({
        parent_name: user?.user_metadata?.parent_name || '',
        baby_name: user?.user_metadata?.baby_name || '',
        baby_birthday: user?.user_metadata?.baby_birthday || '',
        baby_gender: user?.user_metadata?.baby_gender || '',
      });
    }
  }, [user]);

  const getGreeting = () => {
    const hour = currentTime?.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleStopSleep = async () => {
    await stopSleepSession();
    setShowSaveDialog(true);
  };

  const handleSaveSleep = async () => {
    if (currentSession) {
      try {
        await saveSleepSession(currentSession);
        setShowSaveDialog(false);
      } catch (error) {
        console.error('Error saving sleep session:', error);
      }
    }
  };

  const formatScheduleTime = (hours: number, minutes: number) => {
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, 'h:mm a');
  };

  const getBabyAge = () => {
    if (!userProfile?.baby_birthday) return '';
    return formatDistanceToNow(new Date(userProfile.baby_birthday || ''), { addSuffix: false });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{userProfile?.parent_name || user?.email?.split('@')?.[0] || 'Parent'}</Text>
            </View>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Menu size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.babyInfo}>
            <View style={styles.babyProfile}>
              <Image
                source={{ uri: user?.user_metadata.baby_photo_url || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800' }}
                style={styles.babyImage}
              />
              <TouchableOpacity style={styles.editPhotoButton}>
                <Camera size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.babyDetails}>
              <Text style={styles.babyName}>{userProfile?.baby_name || 'Baby'}</Text>
              <Text style={styles.babyAge}>
                {getBabyAge()} old
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickAction
            type="sleep"
            icon={<Moon size={24} color="#FFFFFF" />}
            title={currentSession ? 'Stop Sleep' : 'Sleep'}
            onPress={() => {
              if (currentSession) {
                handleStopSleep();
              } else {
                router.push('/sleep');
              }
            }}
            color="#8B5CF6"
          />

          <QuickAction
            type="feeding"
            icon={<Utensils size={24} color="#FFFFFF" />}
            title="Feeding"
            onPress={() => router.push('/feeding')}
            color="#EC4899"
          />

          <QuickAction
            type="diapers"
            icon={<BabyCarriage size={24} color="#FFFFFF" />}
            title="Diapers"
            onPress={() => router.push('/diapers')}
            color="#14B8A6"
          />

          <QuickAction
            type="health"
            icon={<Activity size={24} color="#FFFFFF" />}
            title="Baby Health Log"
            onPress={() => router.push('/health-log')}
            color="#10B981"
          />

          <QuickAction
            type="vaccinations"
            icon={<Syringe size={24} color="#FFFFFF" />}
            title="Vaccinations"
            onPress={() => router.push('/(tabs)/vaccinations')}
            color="#F59E0B"
          />

          <QuickAction
            type="milestones"
            icon={<Scroll size={24} color="#FFFFFF" />}
            title="Milestones"
            onPress={() => router.push('/milestones')}
            color="#6366F1"
          />

          <QuickAction
            type="sitter"
            icon={<Users size={24} color="#FFFFFF" />}
            title="Find Sitter"
            onPress={() => router.push('/find-sitter')}
            color="#EC4899"
          />

          <QuickAction
            type="ask"
            icon={<MessageCircle size={24} color="#FFFFFF" />}
            title="Ask AI"
            onPress={() => router.push('/(tabs)/ask')}
            color="#7C3AED"
          />

          <QuickAction
            type="reminder"
            icon={<Bell size={24} color="#FFFFFF" />}
            title="Set Reminder"
            onPress={() => router.push('/reminders')}
            color="#3B82F6"
          />
        </View>
      </View>

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleTime}>
            <Text style={styles.timeText}>{formatScheduleTime(7, 0)}</Text>
            <View style={[styles.timeIndicator, { backgroundColor: '#FCD34D' }]} />
          </View>
          <View style={styles.scheduleContent}>
            <Sun size={24} color="#FCD34D" />
            <Text style={styles.scheduleText}>Wake Window</Text>
            <Text style={styles.scheduleDuration}>1h 30m</Text>
          </View>
        </View>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleTime}>
            <Text style={styles.timeText}>{formatScheduleTime(8, 30)}</Text>
            <View style={[styles.timeIndicator, { backgroundColor: '#8B5CF6' }]} />
          </View>
          <View style={styles.scheduleContent}>
            <Moon size={24} color="#8B5CF6" />
            <Text style={styles.scheduleText}>Morning Nap</Text>
            <Text style={styles.scheduleDuration}>1h 15m</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sleep Analysis</Text>
        <View style={styles.analysisCard}>
          <View style={styles.analysisContent}>
            <Text style={styles.analysisTitle}>Sweet Spot for Bedtime</Text>
            <Text style={styles.analysisDescription}>
              Based on {userProfile?.baby_name || 'your baby'}'s sleep patterns, the ideal bedtime is between {formatScheduleTime(19, 0)} and {formatScheduleTime(19, 30)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activities by Age (3-6 months)</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activitiesContainer}>
          <View style={styles.activityCard}>
            <View style={[styles.activityIcon, { backgroundColor: '#8B5CF6' }]}>
              <Brain size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.activityTitle}>Sensory Play</Text>
            <Text style={styles.activityDescription}>
              Introduce different textures and sounds to stimulate senses
            </Text>
          </View>

          <View style={styles.activityCard}>
            <View style={[styles.activityIcon, { backgroundColor: '#10B981' }]}>
              <Dumbbell size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.activityTitle}>Tummy Time</Text>
            <Text style={styles.activityDescription}>
              15-30 minutes daily to strengthen neck and shoulders
            </Text>
          </View>

          <View style={styles.activityCard}>
            <View style={[styles.activityIcon, { backgroundColor: '#EC4899' }]}>
              <Music size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.activityTitle}>Music & Movement</Text>
            <Text style={styles.activityDescription}>
              Sing songs and help baby move to rhythm
            </Text>
          </View>
        </ScrollView>
      </View>
      
      <Modal
        visible={showSaveDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveDialog(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Sleep Session</Text>
            <Text style={styles.modalText}>
              Would you like to save this sleep session?
              {currentSession?.duration && (
                `\nDuration: ${Math.floor(currentSession.duration / 60)}h ${currentSession.duration % 60}m`
              )}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setCurrentSession(null);
                  setShowSaveDialog(false);
                }}>
                <Text style={styles.modalButtonTextSecondary}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveSleep}>
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    color: '#E5E7EB',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  menuButton: {
    padding: 8,
    marginLeft: 16,
  },
  babyInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  babyProfile: {
    position: 'relative',
  },
  babyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editPhotoButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#7C3AED',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  babyDetails: {
    marginLeft: 16,
    flex: 1,
  },
  babyName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  babyAge: {
    color: '#E5E7EB',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  scheduleSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTime: {
    width: 80,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  timeIndicator: {
    width: 2,
    height: 40,
    marginTop: 8,
  },
  scheduleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginLeft: 12,
  },
  scheduleText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  scheduleDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  analysisContent: {
    padding: 16,
  },
  analysisTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  analysisDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  activitiesContainer: {
    paddingRight: 20,
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#7C3AED',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  modalButtonTextSecondary: {
    color: '#4B5563',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
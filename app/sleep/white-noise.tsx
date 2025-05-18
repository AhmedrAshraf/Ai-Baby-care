import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Volume2, Pause, Play, Clock, Moon, Wind, Waves, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useWhiteNoiseContext } from '@/contexts/WhiteNoiseContext';
import Header from '@/components/Header';

const SOUNDS = [
  { id: 'white', title: 'White Noise', icon: Volume2, type: 'white' as const, color: '#8B5CF6' },
  { id: 'rain', title: 'Rain Sounds', icon: Wind, type: 'rain' as const, color: '#10B981' },
  { id: 'ocean', title: 'Ocean Waves', icon: Waves, type: 'ocean' as const, color: '#3B82F6' },
  { id: 'lullaby', title: 'Lullaby', icon: Moon, type: 'lullaby' as const, color: '#EC4899' },
];

export default function WhiteNoiseScreen() {
  const router = useRouter();
  const { isPlaying, currentSound, timer, playSound, stopSound, setTimer } = useWhiteNoiseContext();

  return (
    <View style={styles.container}>
      <Header
        title="White Noise"
        showBackButton
        useGradient
        bottomElement={
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, false && styles.activeTab]}
              onPress={() => router.back()}>
              <Moon size={20} color={false ? '#7C3AED' : '#FFFFFF'} />
              <Text style={[styles.tabText, false && styles.activeTabText]}>
                Sleep
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, true && styles.activeTab]}
              onPress={() => {}}>
              <Volume2 size={20} color={true ? '#7C3AED' : '#FFFFFF'} />
              <Text style={[styles.tabText, true && styles.activeTabText]}>
                White Noise
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.content}>
        <View style={styles.player}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => {
              if (isPlaying) {
                stopSound();
              } else if (currentSound) {
                playSound(currentSound);
              } else {
                playSound(SOUNDS[0]);
              }
            }}>
            {isPlaying ? (
              <Pause size={32} color="#7C3AED" />
            ) : (
              <Play size={32} color="#7C3AED" />
            )}
          </TouchableOpacity>
          <View style={styles.timerContainer}>
            <Clock size={20} color="#FFFFFF" />
            <Text style={styles.timerText}>{timer} min</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound Library</Text>
          <View style={styles.soundGrid}>
            {SOUNDS.map((sound) => (
              <TouchableOpacity
                key={sound.id}
                style={[
                  styles.soundCard,
                  currentSound?.id === sound.id && styles.soundCardActive,
                ]}
                onPress={() => playSound(sound)}>
                <View
                  style={[
                    styles.soundIcon,
                    { backgroundColor: sound.color },
                  ]}>
                  <sound.icon size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.soundTitle}>{sound.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timer</Text>
          <View style={styles.timerGrid}>
            {[15, 30, 45, 60].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.timerCard,
                  timer === minutes && styles.timerCardActive,
                ]}
                onPress={() => setTimer(minutes)}>
                <Text
                  style={[
                    styles.timerCardText,
                    timer === minutes && styles.timerCardTextActive,
                  ]}>
                  {minutes} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  content: {
    flex: 1,
    padding: 20,
  },
  player: {
    alignItems: 'center',
    marginBottom: 32,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  soundCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  soundCardActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#7C3AED',
    borderWidth: 2,
  },
  soundIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  soundTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
  },
  timerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerCard: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timerCardActive: {
    backgroundColor: '#7C3AED',
  },
  timerCardText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  timerCardTextActive: {
    color: '#FFFFFF',
  },
});
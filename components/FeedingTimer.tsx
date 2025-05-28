import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Timer } from 'lucide-react-native';
import { format } from 'date-fns';
import { useFeedingContext } from '@/contexts/FeedingContext';

type Props = {
  onSwitchSide?: () => void;
};

export function FeedingTimer({ onSwitchSide }: Props) {
  const { currentSession, elapsedTime, stopBreastfeeding } = useFeedingContext();

  if (!currentSession) return null;

  const formatTime = (time: { hours: number; minutes: number; seconds: number }) => {
    const { hours, minutes, seconds } = time;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerCard}>
      <View style={styles.timerHeader}>
        <Timer size={24} color="#7C3AED" />
        <Text style={styles.timerTitle}>
          Breastfeeding - {currentSession.side?.charAt(0).toUpperCase() + currentSession.side?.slice(1)} Side
        </Text>
      </View>
      <Text style={styles.timerDisplay}>{formatTime(elapsedTime)}</Text>
      <Text style={styles.timerSubtext}>
        Started at {format(currentSession.startTime, 'hh:mm a')}
      </Text>
      {onSwitchSide && (
        <TouchableOpacity
          style={styles.switchSideButton}
          onPress={onSwitchSide}>
          <Text style={styles.switchSideText}>Switch Side</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.stopButton}
        onPress={stopBreastfeeding}>
        <Text style={styles.stopButtonText}>Stop Feeding</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
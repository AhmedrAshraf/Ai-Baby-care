import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

  const sideText = currentSession.side 
    ? `${currentSession.side.charAt(0).toUpperCase()}${currentSession.side.slice(1)}`
    : '';

  return (
    <View style={styles.timerCard}>
      <View style={styles.timerHeader}>
        <Timer size={24} color="#7C3AED" />
        <Text style={styles.timerTitle}>
          Breastfeeding - {sideText} Side
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  timerDisplay: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 8,
  },
  timerSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  switchSideButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  switchSideText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#7C3AED',
    textAlign: 'center',
  },
  stopButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 8,
  },
  stopButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
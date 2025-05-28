import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { format, isSameDay } from 'date-fns';
import { useFeedingContext } from '@/contexts/FeedingContext';

type Props = {
  selectedDate: Date;
};

export function FeedingList({ selectedDate }: Props) {
  const { feedingSessions } = useFeedingContext();

  const filteredSessions = feedingSessions.filter(session => 
    isSameDay(session.startTime, selectedDate)
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Today's Feedings</Text>
      {filteredSessions.map(session => (
        <View key={session.id} style={styles.feedingItem}>
          <View style={styles.feedingTime}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.feedingTimeText}>
              {format(session.startTime, 'hh:mm a')}
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
  );
}

const styles = StyleSheet.create({
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
});
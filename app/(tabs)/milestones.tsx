import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Header from '@/components/Header';

export default function MilestonesScreen() {
  const [milestones, setMilestones] = useState<any[]>([]);

  return (
    <View style={styles.container}>
      <Header
        title="Development Milestones"
        useGradient
        bottomElement={
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
          </View>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {milestones.map((milestone, index) => (
          <View key={index}>
            {/* Milestone content */}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
}); 
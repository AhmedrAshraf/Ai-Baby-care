import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

type Milestone = {
  id: string;
  age: string;
  title: string;
  description: string;
  completed: boolean;
  upcoming: boolean;
  imageUrl: string;
};

const MILESTONES: Milestone[] = [
  {
    id: '1',
    age: '2-4 months',
    title: 'Social Smiling',
    description: 'Your baby should start smiling in response to your smiles and generally be more expressive.',
    completed: true,
    upcoming: false,
    imageUrl: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=800',
  },
  {
    id: '2',
    age: '4-6 months',
    title: 'First Rolls',
    description: 'Watch for your baby to roll from tummy to back, and shortly after, from back to tummy.',
    completed: false,
    upcoming: true,
    imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800',
  },
  // Add more milestones as needed
];

export default function MilestonesScreen() {
  const [milestones, setMilestones] = useState<Milestone[]>(MILESTONES);

  const toggleMilestone = (id: string) => {
    setMilestones(prev =>
      prev.map(milestone =>
        milestone.id === id
          ? { ...milestone, completed: !milestone.completed, upcoming: false }
          : milestone
      )
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}>
        <View style={styles.headerContent}>
          {/* back button */}
            <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
                <Text style={styles.headerTitle}>Development Milestones</Text>
        </View>
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
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {milestones.map(milestone => (
          <TouchableOpacity
            key={milestone.id}
            style={styles.milestoneCard}
            onPress={() => toggleMilestone(milestone.id)}>
            <Image
              source={{ uri: milestone.imageUrl }}
              style={styles.milestoneImage}
            />
            <View style={styles.milestoneContent}>
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneAge}>{milestone.age}</Text>
                {milestone.completed ? (
                  <CheckCircle2 size={24} color="#10B981" />
                ) : milestone.upcoming ? (
                  <AlertCircle size={24} color="#F59E0B" />
                ) : (
                  <ChevronRight size={24} color="#6B7280" />
                )}
              </View>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={styles.milestoneDescription}>{milestone.description}</Text>
              {milestone.completed && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
              {milestone.upcoming && (
                <View style={[styles.completedBadge, styles.upcomingBadge]}>
                  <Text style={[styles.completedText, styles.upcomingText]}>Coming Soon</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginLeft: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  milestoneImage: {
    width: '100%',
    height: 160,
  },
  milestoneContent: {
    padding: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneAge: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  milestoneTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  milestoneDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 20,
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  completedText: {
    color: '#059669',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  upcomingBadge: {
    backgroundColor: '#FEF3C7',
  },
  upcomingText: {
    color: '#D97706',
  },
});
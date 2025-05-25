import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, Zap, TrendingUp, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

export default function AnalysisScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        <Text style={styles.headerTitle}>Sleep Analysis</Text>
        </View> 
        <View style={styles.periodSelector}>
          <TouchableOpacity style={[styles.periodButton, styles.periodButtonActive]}>
            <Text style={[styles.periodText, styles.periodTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.periodButton}>
            <Text style={styles.periodText}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.periodButton}>
            <Text style={styles.periodText}>3 Months</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Moon size={24} color="#8B5CF6" />
              <Text style={styles.statNumber}>14.5h</Text>
              <Text style={styles.statLabel}>Avg. Daily Sleep</Text>
            </View>
            <View style={styles.statCard}>
              <Sun size={24} color="#FCD34D" />
              <Text style={styles.statNumber}>3.2h</Text>
              <Text style={styles.statLabel}>Avg. Wake Window</Text>
            </View>
            <View style={styles.statCard}>
              <Zap size={24} color="#10B981" />
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>Sleep Quality</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#EC4899" />
              <Text style={styles.statNumber}>2.8</Text>
              <Text style={styles.statLabel}>Naps per Day</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Patterns</Text>
          <View style={styles.patternCard}>
            <Text style={styles.patternTitle}>Consistent Bedtime</Text>
            <Text style={styles.patternDescription}>
              Emma has maintained a consistent bedtime between 7:00 PM and 7:30 PM, which is ideal for her age.
            </Text>
            <View style={styles.recommendationBox}>
              <Text style={styles.recommendationTitle}>Recommendation</Text>
              <Text style={styles.recommendationText}>
                Continue with the current bedtime routine as it's working well for Emma's sleep rhythm.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Total Sleep Time</Text>
              <Text style={styles.progressTrend}>+5% from last week</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>
            <Text style={styles.progressText}>
              Emma is getting optimal sleep for her age group (3-6 months)
            </Text>
          </View>
        </View>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  periodTextActive: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    padding: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  patternCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  patternTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  patternDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  recommendationBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  recommendationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  progressTrend: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});
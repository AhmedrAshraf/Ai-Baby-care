import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Baby, Moon, Utensils, Activity, Plus } from 'lucide-react-native';

type TrackingCategory = {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  lastRecord?: string;
  timestamp?: string;
};

const CATEGORIES: TrackingCategory[] = [
  {
    id: 'sleep',
    title: 'Sleep',
    icon: <Moon size={24} color="#7C3AED" />,
    color: '#7C3AED',
    lastRecord: '8 hours',
    timestamp: '2:00 AM - 10:00 AM',
  },
  {
    id: 'feeding',
    title: 'Feeding',
    icon: <Utensils size={24} color="#10B981" />,
    color: '#10B981',
    lastRecord: 'Breast feeding',
    timestamp: '30 mins ago',
  },
  {
    id: 'growth',
    title: 'Growth',
    icon: <Baby size={24} color="#F59E0B" />,
    color: '#F59E0B',
    lastRecord: '6.2 kg, 60 cm',
    timestamp: 'Updated 2 days ago',
  },
  {
    id: 'activity',
    title: 'Activity',
    icon: <Activity size={24} color="#EC4899" />,
    color: '#EC4899',
    lastRecord: 'Tummy time',
    timestamp: '2 hours ago',
  },
];

export default function TrackingScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('sleep');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}>
        <Text style={styles.headerTitle}>Track Baby's Day</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}>
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}>
              {category.icon}
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          {CATEGORIES.map(category => (
            <View key={category.id} style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIcon}>
                  {category.icon}
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryTitle}>{category.title}</Text>
                  <Text style={styles.summaryLastRecord}>{category.lastRecord}</Text>
                </View>
                <Text style={styles.summaryTimestamp}>{category.timestamp}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.addButton}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summarySection: {
    marginBottom: 24,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  summaryLastRecord: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  summaryTimestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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
});
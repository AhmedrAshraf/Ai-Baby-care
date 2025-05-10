import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Droplet, Wind, Timer, ShoppingCart, Package, TriangleAlert as AlertTriangle, Plus, X, Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useDiaperContext } from '@/contexts/DiaperContext';

type DateRange = 'day' | 'week' | 'month';

export default function DiapersScreen() {
  const router = useRouter();
  const { diaperChanges, supplies, addDiaperChange } = useDiaperContext();
  const [showNewChange, setShowNewChange] = useState(false);
  const [selectedType, setSelectedType] = useState<'wet' | 'dirty' | 'both'>('wet');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>('day');

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(current => {
      switch (dateRange) {
        case 'day':
          return direction === 'prev' ? subDays(current, 1) : addDays(current, 1);
        case 'week':
          return direction === 'prev' ? subDays(current, 7) : addDays(current, 7);
        case 'month':
          return direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
      }
    });
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy');
      case 'week': {
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
    }
  };

  const getFilteredChanges = () => {
    return diaperChanges.filter(change => {
      switch (dateRange) {
        case 'day':
          return isSameDay(change.timestamp, selectedDate);
        case 'week': {
          const start = startOfWeek(selectedDate);
          const end = endOfWeek(selectedDate);
          return change.timestamp >= start && change.timestamp <= end;
        }
        case 'month': {
          const start = startOfMonth(selectedDate);
          const end = endOfMonth(selectedDate);
          return change.timestamp >= start && change.timestamp <= end;
        }
      }
    });
  };

  const getDiaperCounts = () => {
    const filteredChanges = getFilteredChanges();
    return {
      wet: filteredChanges.filter(change => change.type === 'wet').length,
      dirty: filteredChanges.filter(change => change.type === 'dirty').length,
      both: filteredChanges.filter(change => change.type === 'both').length,
      total: filteredChanges.length,
    };
  };

  const handleAddChange = () => {
    const newChange = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: selectedType,
      brand: 'Pampers', // Default brand
      size: '2', // Default size
      notes: notes.trim() || undefined,
    };

    addDiaperChange(newChange);
    setShowNewChange(false);
    setSelectedType('wet');
    setNotes('');
  };

  const getTypeIcon = (type: 'wet' | 'dirty' | 'both') => {
    switch (type) {
      case 'wet':
        return <Droplet size={20} color="#3B82F6" />;
      case 'dirty':
        return <Wind size={20} color="#F59E0B" />;
      case 'both':
        return <AlertTriangle size={20} color="#EC4899" />;
    }
  };

  const getTypeLabel = (type: 'wet' | 'dirty' | 'both') => {
    switch (type) {
      case 'wet':
        return { text: 'Wet', color: '#3B82F6', bgColor: '#EFF6FF' };
      case 'dirty':
        return { text: 'Dirty', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'both':
        return { text: 'Both', color: '#EC4899', bgColor: '#FCE7F3' };
    }
  };

  const counts = getDiaperCounts();

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
          <Text style={styles.headerTitle}>Diaper Tracking</Text>
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
            <Text style={styles.dateRangeLabel}>{getDateRangeText()}</Text>
            <TouchableOpacity onPress={() => navigateDate('next')}>
              <ChevronRight size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Changes</Text>
            <Text style={styles.statValue}>{counts.total}</Text>
            <Text style={styles.statSubtext}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>By Type</Text>
            <View style={styles.typeStats}>
              <View style={styles.typeStat}>
                <Droplet size={16} color="#3B82F6" />
                <Text style={styles.typeCount}>{counts.wet}</Text>
                <Text style={styles.typeLabel}>Wet</Text>
              </View>
              <View style={styles.typeStat}>
                <Wind size={16} color="#F59E0B" />
                <Text style={styles.typeCount}>{counts.dirty}</Text>
                <Text style={styles.typeLabel}>Dirty</Text>
              </View>
              <View style={styles.typeStat}>
                <AlertTriangle size={16} color="#EC4899" />
                <Text style={styles.typeCount}>{counts.both}</Text>
                <Text style={styles.typeLabel}>Both</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Changes</Text>
          {getFilteredChanges().map(change => (
            <View key={change.id} style={styles.changeCard}>
              <View style={styles.changeTime}>
                <Timer size={16} color="#6B7280" />
                <Text style={styles.changeTimeText}>
                  {format(change.timestamp, 'h:mm a')}
                </Text>
              </View>
              <View style={styles.changeDetails}>
                <View style={[
                  styles.typeTag,
                  { backgroundColor: getTypeLabel(change.type).bgColor }
                ]}>
                  {getTypeIcon(change.type)}
                  <Text style={[
                    styles.typeText,
                    { color: getTypeLabel(change.type).color }
                  ]}>
                    {getTypeLabel(change.type).text}
                  </Text>
                </View>
                <Text style={styles.changeBrandText}>
                  {change.brand} - Size {change.size}
                </Text>
              </View>
              {change.notes && (
                <Text style={styles.changeNotes}>{change.notes}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowNewChange(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showNewChange}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChange(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Diaper Change</Text>
              <TouchableOpacity onPress={() => setShowNewChange(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.typeOptions}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedType === 'wet' && styles.selectedTypeOption,
                ]}
                onPress={() => setSelectedType('wet')}>
                <Droplet size={24} color={selectedType === 'wet' ? '#FFFFFF' : '#3B82F6'} />
                <Text style={[
                  styles.typeOptionText,
                  selectedType === 'wet' && styles.selectedTypeOptionText,
                ]}>Wet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedType === 'dirty' && styles.selectedTypeOption,
                ]}
                onPress={() => setSelectedType('dirty')}>
                <Wind size={24} color={selectedType === 'dirty' ? '#FFFFFF' : '#F59E0B'} />
                <Text style={[
                  styles.typeOptionText,
                  selectedType === 'dirty' && styles.selectedTypeOptionText,
                ]}>Dirty</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedType === 'both' && styles.selectedTypeOption,
                ]}
                onPress={() => setSelectedType('both')}>
                <AlertTriangle size={24} color={selectedType === 'both' ? '#FFFFFF' : '#EC4899'} />
                <Text style={[
                  styles.typeOptionText,
                  selectedType === 'both' && styles.selectedTypeOptionText,
                ]}>Both</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes..."
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddChange}>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Change</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  statSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  typeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  typeStat: {
    alignItems: 'center',
  },
  typeCount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 4,
  },
  typeLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
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
  changeCard: {
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
  changeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  changeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  changeBrandText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  changeNotes: {
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
  modalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  selectedTypeOption: {
    backgroundColor: '#7C3AED',
  },
  typeOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  selectedTypeOptionText: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
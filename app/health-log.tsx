import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CircleAlert as AlertCircle, Plus, X, Camera, Thermometer, Clock, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useHealthLogContext, HealthIssue, Severity, HealthLog } from '@/contexts/HealthLogContext';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

type DateRange = 'day' | 'week' | 'month';

const HEALTH_ISSUES: { type: HealthIssue; label: string; color: string }[] = [
  { type: 'fever', label: 'Fever', color: '#EF4444' },
  { type: 'vomiting', label: 'Vomiting', color: '#F59E0B' },
  { type: 'diarrhea', label: 'Diarrhea', color: '#10B981' },
  { type: 'constipation', label: 'Constipation', color: '#6366F1' },
  { type: 'diaper_rash', label: 'Diaper Rash', color: '#EC4899' },
  { type: 'body_rash', label: 'Body Rash', color: '#8B5CF6' },
  { type: 'other', label: 'Other', color: '#6B7280' },
];

const SEVERITY_LEVELS: { level: Severity; label: string; color: string }[] = [
  { level: 'mild', label: 'Mild', color: '#10B981' },
  { level: 'moderate', label: 'Moderate', color: '#F59E0B' },
  { level: 'severe', label: 'Severe', color: '#EF4444' },
];

export default function HealthLogScreen() {
  const router = useRouter();
  const { healthLogs, addHealthLog } = useHealthLogContext();
  const [showNewLog, setShowNewLog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>('day');
  const [selectedType, setSelectedType] = useState<HealthIssue | null>(null);
  const [customIssue, setCustomIssue] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | null>(null);
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [showCustomIssueInput, setShowCustomIssueInput] = useState(false);

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setPhotoUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled) {
          setPhotoUrl(result.assets[0].uri);
        }
      }
    }
  };

  const handleAddLog = () => {
    if (!selectedType || !selectedSeverity) return;

    const newLog: HealthLog = {
      id: Date.now().toString(),
      type: selectedType,
      severity: selectedSeverity,
      timestamp: new Date(),
      temperature: temperature ? parseFloat(temperature) : undefined,
      notes: `${customIssue ? `Issue: ${customIssue}\n` : ''}${notes.trim()}`,
      photoUrl,
    };

    addHealthLog(newLog);
    resetForm();
    setShowNewLog(false);
  };

  const resetForm = () => {
    setSelectedType(null);
    setCustomIssue('');
    setSelectedSeverity(null);
    setTemperature('');
    setNotes('');
    setPhotoUrl(undefined);
    setShowCustomIssueInput(false);
  };

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
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    
    switch (dateRange) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy');
      case 'week':
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      default:
        return '';
    }
  };

  const getFilteredLogs = () => {
    return healthLogs.filter(log => {
      switch (dateRange) {
        case 'day':
          return isSameDay(log.timestamp, selectedDate);
        case 'week': {
          const start = startOfWeek(selectedDate);
          const end = endOfWeek(selectedDate);
          return log.timestamp >= start && log.timestamp <= end;
        }
        case 'month': {
          const start = startOfMonth(selectedDate);
          const end = endOfMonth(selectedDate);
          return log.timestamp >= start && log.timestamp <= end;
        }
      }
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Baby Health Log</Text>
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
            <View style={styles.dateRangeLabel}>
              <Text style={styles.dateRangeLabelText}>
                {getDateRangeText()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigateDate('next')}>
              <ChevronRight size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {getFilteredLogs().map(log => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logHeader}>
              <View style={styles.logTime}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.logTimeText}>
                  {format(log.timestamp, 'MMM d, hh:mm a')}
                </Text>
              </View>
              <View style={[
                styles.severityTag,
                { backgroundColor: SEVERITY_LEVELS.find(s => s.level === log.severity)?.color }
              ]}>
                <Text style={styles.severityText}>
                  {SEVERITY_LEVELS.find(s => s.level === log.severity)?.label || ''}
                </Text>
              </View>
            </View>
            <View style={styles.logDetails}>
              <Text style={styles.issueType}>
                {log.type === 'other' && log.notes?.startsWith('Issue: ')
                  ? log.notes.split('\n')[0].replace('Issue: ', '')
                  : HEALTH_ISSUES.find(i => i.type === log.type)?.label || ''}
              </Text>
              {log.temperature && (
                <View style={styles.temperatureRow}>
                  <Thermometer size={16} color="#6B7280" />
                  <Text style={styles.temperatureText}>{log.temperature}°C</Text>
                </View>
              )}
              {log.notes && (
                <Text style={styles.notes}>
                  {log.type === 'other'
                    ? log.notes.split('\n').slice(1).join('\n')
                    : log.notes}
                </Text>
              )}
              {log.photoUrl && (
                <View style={styles.photoIndicator}>
                  <Camera size={16} color="#6B7280" />
                  <Text style={styles.photoText}>Photo attached</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowNewLog(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showNewLog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewLog(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Health Log</Text>
              <TouchableOpacity onPress={() => setShowNewLog(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.sectionTitle}>Issue Type</Text>
              <View style={styles.issueGrid}>
                {HEALTH_ISSUES.map(issue => (
                  <TouchableOpacity
                    key={issue.type}
                    style={[
                      styles.issueOption,
                      selectedType === issue.type && { backgroundColor: issue.color },
                    ]}
                    onPress={() => {
                      setSelectedType(issue.type);
                      setShowCustomIssueInput(issue.type === 'other');
                    }}>
                    <AlertCircle
                      size={24}
                      color={selectedType === issue.type ? '#FFFFFF' : issue.color}
                    />
                    <Text style={[
                      styles.issueOptionText,
                      selectedType === issue.type && styles.selectedOptionText,
                    ]}>
                      {issue.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showCustomIssueInput && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Specify Issue</Text>
                  <TextInput
                    style={styles.input}
                    value={customIssue}
                    onChangeText={setCustomIssue}
                    placeholder="Enter the health issue"
                  />
                </View>
              )}

              <Text style={styles.sectionTitle}>Severity</Text>
              <View style={styles.severityOptions}>
                {SEVERITY_LEVELS.map(severity => (
                  <TouchableOpacity
                    key={severity.level}
                    style={[
                      styles.severityOption,
                      selectedSeverity === severity.level && { backgroundColor: severity.color },
                    ]}
                    onPress={() => setSelectedSeverity(severity.level)}>
                    <Text style={[
                      styles.severityOptionText,
                      selectedSeverity === severity.level && styles.selectedOptionText,
                    ]}>
                      {severity.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Temperature (Optional)</Text>
              <TextInput
                style={styles.input}
                value={temperature}
                onChangeText={setTemperature}
                placeholder="Enter temperature in °C"
                keyboardType="numeric"
              />

              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional notes or observations"
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.photoButton}
                onPress={handleTakePhoto}>
                <Camera size={24} color="#7C3AED" />
                <Text style={styles.photoButtonText}>
                  {photoUrl ? 'Change Photo' : 'Take Photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!selectedType || !selectedSeverity || (selectedType === 'other' && !customIssue)) && styles.saveButtonDisabled,
                ]}
                onPress={handleAddLog}
                disabled={!selectedType || !selectedSeverity || (selectedType === 'other' && !customIssue)}>
                <Text style={styles.saveButtonText}>Save Health Log</Text>
              </TouchableOpacity>
            </ScrollView>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
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
    flex: 1,
    alignItems: 'center',
  },
  dateRangeLabelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  severityTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  logDetails: {
    gap: 8,
  },
  issueType: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  temperatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  temperatureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  modalScroll: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  issueOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  issueOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  severityOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  severityOption: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  severityOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginBottom: 24,
  },
  notesInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  photoButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#7C3AED',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
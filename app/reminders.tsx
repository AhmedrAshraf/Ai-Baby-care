import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Bell, Clock, X, Plus, Check, Repeat, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useReminders } from '@/contexts/ReminderContext';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

type ReminderType = 'feeding' | 'sleep' | 'medication' | 'appointment';

export default function RemindersScreen() {
  const router = useRouter();
  const { reminders, addReminder, toggleReminder, deleteReminder } = useReminders();
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [selectedType, setSelectedType] = useState<ReminderType>('feeding');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [time, setTime] = useState(new Date());
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleAddReminder = async () => {
    if (!title.trim() || !body.trim()) return;

    try {
      await addReminder({
        type: selectedType,
        title: title.trim(),
        body: body.trim(),
        time,
        repeat,
        enabled: true,
        metadata: {},
      });
      setShowNewReminder(false);
      resetForm();
    } catch (error) {
      console.error('Error adding reminder:', error);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteReminder(id);
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const resetForm = () => {
    setSelectedType('feeding');
    setTitle('');
    setBody('');
    setTime(new Date());
    setRepeat('none');
  };

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
          <Text style={styles.headerTitle}>Reminders</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Reminders Set</Text>
            <Text style={styles.emptyStateText}>
              Add reminders for feeding times, medication schedules, and appointments
            </Text>
          </View>
        ) : (
          reminders.map(reminder => (
            <View key={reminder.id} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <Bell size={20} color="#7C3AED" />
                <Text style={styles.reminderTitle}>{reminder.title}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteReminder(reminder.id)}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.reminderBody}>{reminder.body}</Text>
              <View style={styles.reminderMeta}>
                <View style={styles.metaItem}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {format(reminder.time, 'h:mm a')}
                  </Text>
                </View>
                {reminder.repeat !== 'none' && (
                  <View style={styles.metaItem}>
                    <Repeat size={16} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {reminder.repeat.charAt(0).toUpperCase() + reminder.repeat.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowNewReminder(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showNewReminder}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewReminder(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <TouchableOpacity onPress={() => setShowNewReminder(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter reminder title"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={body}
                  onChangeText={setBody}
                  placeholder="Enter reminder message"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}>
                  <Clock size={20} color="#6B7280" />
                  <Text style={styles.timeButtonText}>
                    {format(time, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              </View>

              {showTimePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour={false}
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setTime(selectedTime);
                    }
                  }}
                />
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Repeat</Text>
                <View style={styles.repeatOptions}>
                  {(['none', 'daily', 'weekly'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.repeatOption,
                        repeat === option && styles.repeatOptionActive
                      ]}
                      onPress={() => setRepeat(option)}>
                      <Text style={[
                        styles.repeatOptionText,
                        repeat === option && styles.repeatOptionTextActive
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!title.trim() || !body.trim()) && styles.saveButtonDisabled
                ]}
                onPress={handleAddReminder}
                disabled={!title.trim() || !body.trim()}>
                <Text style={styles.saveButtonText}>Set Reminder</Text>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
  reminderCard: {
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
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
    marginLeft: 12,
  },
  deleteButton: {
    padding: 4,
  },
  reminderBody: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
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
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  timeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  repeatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  repeatOption: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  repeatOptionActive: {
    backgroundColor: '#7C3AED',
  },
  repeatOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  repeatOptionTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Platform, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, Clock, Mail, Plus, X, Edit2, Trash2, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAppointments, AppointmentType, Appointment } from '@/contexts/AppointmentContext';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { pediatricians, appointments, addPediatrician, addAppointment, updateAppointment, deleteAppointment, generateHealthSummary } = useAppointments();
  const [showNewPediatrician, setShowNewPediatrician] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState('');
  const [selectedPediatrician, setSelectedPediatrician] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AppointmentType>('checkup');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newPediatrician, setNewPediatrician] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const handleAddPediatrician = async () => {
    if (!newPediatrician.name || !newPediatrician.email) {
      Alert.alert('Required Fields', 'Name and email are required');
      return;
    }

    try {
      await addPediatrician(newPediatrician);
      setShowNewPediatrician(false);
      setNewPediatrician({ name: '', email: '', phone: '', address: '', notes: '' });
      setShowNewAppointment(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to add pediatrician');
    }
  };

  const handleEmailSummary = async (appointmentId: string) => {
    try {
      const summary = await generateHealthSummary(appointmentId);
      setEmailContent(summary);
      setSelectedAppointmentId(appointmentId);
      setShowEmailPreview(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate health summary');
    }
  };

  const resetForm = () => {
    setSelectedPediatrician('');
    setSelectedType('checkup');
    setNotes('');
    setValidationError(null);
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
          <Text style={styles.headerTitle}>Appointments</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No appointments scheduled yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap the + button to add one</Text>
          </View>
        ) : (
          appointments.map(appointment => {
            const pediatrician = pediatricians.find(p => p.id === appointment.pediatricianId);
            return (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentDate}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.dateText}>
                      {format(appointment.date, 'MMM d, yyyy')}
                    </Text>
                  </View>
                  <Text style={styles.appointmentType}>
                    {appointment.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.pediatricianInfo}>
                  <Text style={styles.pediatricianName}>{pediatrician?.name}</Text>
                  <Text style={styles.pediatricianEmail}>{pediatrician?.email}</Text>
                </View>

                {appointment.notes && (
                  <Text style={styles.notes}>{appointment.notes}</Text>
                )}

                <View style={styles.appointmentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEmailSummary(appointment.id)}>
                    <Mail size={16} color="#7C3AED" />
                    <Text style={styles.actionButtonText}>Email Summary</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          if (pediatricians.length === 0) {
            setShowNewPediatrician(true);
          } else {
            setShowNewAppointment(true);
          }
        }}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showNewPediatrician}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewPediatrician(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Pediatrician</Text>
              <TouchableOpacity onPress={() => setShowNewPediatrician(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name*</Text>
                <TextInput
                  style={styles.input}
                  value={newPediatrician.name}
                  onChangeText={name => setNewPediatrician(prev => ({ ...prev, name }))}
                  placeholder="Enter pediatrician's name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email*</Text>
                <TextInput
                  style={styles.input}
                  value={newPediatrician.email}
                  onChangeText={email => setNewPediatrician(prev => ({ ...prev, email }))}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={newPediatrician.phone}
                  onChangeText={phone => setNewPediatrician(prev => ({ ...prev, phone }))}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newPediatrician.address}
                  onChangeText={address => setNewPediatrician(prev => ({ ...prev, address }))}
                  placeholder="Enter office address"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!newPediatrician.name || !newPediatrician.email) && styles.submitButtonDisabled
                ]}
                onPress={handleAddPediatrician}
                disabled={!newPediatrician.name || !newPediatrician.email}>
                <Text style={styles.submitButtonText}>Add Pediatrician</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNewAppointment}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowNewAppointment(false);
          setIsEditing(false);
          setEditingAppointment(null);
          resetForm();
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Appointment' : 'New Appointment'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowNewAppointment(false);
                  setIsEditing(false);
                  setEditingAppointment(null);
                  resetForm();
                }}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {validationError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{validationError}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pediatrician*</Text>
                <View style={styles.pediatricianOptions}>
                  {pediatricians.map(pediatrician => (
                    <TouchableOpacity
                      key={pediatrician.id}
                      style={[
                        styles.pediatricianOption,
                        selectedPediatrician === pediatrician.id && styles.selectedPediatricianOption
                      ]}
                      onPress={() => setSelectedPediatrician(pediatrician.id)}>
                      <Text style={[
                        styles.pediatricianOptionText,
                        selectedPediatrician === pediatrician.id && styles.selectedPediatricianOptionText
                      ]}>
                        {pediatrician.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type*</Text>
                <View style={styles.typeOptions}>
                  {(['checkup', 'vaccination', 'sick_visit', 'follow_up', 'other'] as AppointmentType[]).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        selectedType === type && styles.selectedTypeOption
                      ]}
                      onPress={() => setSelectedType(type)}>
                      <Text style={[
                        styles.typeOptionText,
                        selectedType === type && styles.selectedTypeOptionText
                      ]}>
                        {type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about the appointment"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!selectedPediatrician || !selectedType || loading) && styles.submitButtonDisabled
                ]}
                onPress={handleAddAppointment}
                disabled={!selectedPediatrician || !selectedType || loading}>
                <Text style={styles.submitButtonText}>
                  {loading ? 'Saving...' : isEditing ? 'Update Appointment' : 'Schedule Appointment'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEmailPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmailPreview(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Email Preview</Text>
              <TouchableOpacity onPress={() => setShowEmailPreview(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.emailPreview}>
              <Text style={styles.emailPreviewText}>{emailContent}</Text>
            </ScrollView>

            <View style={styles.emailActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEmailPreview(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => {
                  setShowEmailPreview(false);
                }}>
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send Email</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  appointmentType: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#7C3AED',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pediatricianInfo: {
    marginBottom: 12,
  },
  pediatricianName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  pediatricianEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#7C3AED',
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
  emailPreview: {
    backgroundColor: '#F9FAFB',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    maxHeight: '60%',
  },
  emailPreviewText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 20,
  },
  emailActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  pediatricianOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pediatricianOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
  },
  selectedPediatricianOption: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  pediatricianOptionText: {
    color: '#374151',
    fontSize: 14,
    textAlign: 'center',
  },
  selectedPediatricianOptionText: {
    color: '#FFFFFF',
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
  },
  selectedTypeOption: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  typeOptionText: {
    color: '#374151',
    fontSize: 14,
    textAlign: 'center',
  },
  selectedTypeOptionText: {
    color: '#FFFFFF',
  },
});
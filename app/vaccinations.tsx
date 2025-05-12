import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Plus, Syringe, X, Calendar, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { format, startOfWeek, endOfWeek } from 'date-fns';

type Vaccination = {
  id: string;
  name: string;
  date: Date;
  nextDose?: Date;
  notes?: string;
};

type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
};

export default function VaccinationsScreen() {
  const router = useRouter();
  const [showNewVaccination, setShowNewVaccination] = useState(false);
  const [showNewMedication, setShowNewMedication] = useState(false);
  const [activeTab, setActiveTab] = useState<'vaccinations' | 'medications'>('vaccinations');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('day');
  
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([
    {
      id: '1',
      name: 'DTaP',
      date: new Date(2024, 0, 15),
      nextDose: new Date(2024, 3, 15),
      notes: 'First dose completed',
    },
    {
      id: '2',
      name: 'Hepatitis B',
      date: new Date(2024, 0, 1),
      nextDose: new Date(2024, 3, 1),
      notes: 'No adverse reactions',
    },
  ]);

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Vitamin D Drops',
      dosage: '400 IU',
      frequency: 'Once daily',
      startDate: new Date(2024, 0, 1),
      notes: 'Give with feeding',
    },
    {
      id: '2',
      name: 'Iron Supplement',
      dosage: '10mg',
      frequency: 'Twice daily',
      startDate: new Date(2024, 0, 15),
      endDate: new Date(2024, 1, 15),
      notes: 'After meals',
    },
  ]);

  const [newVaccination, setNewVaccination] = useState({
    name: '',
    notes: '',
  });

  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    notes: '',
  });

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

  const handleAddVaccination = () => {
    if (newVaccination.name.trim()) {
      const vaccination: Vaccination = {
        id: Date.now().toString(),
        name: newVaccination.name,
        date: new Date(),
        notes: newVaccination.notes,
      };
      setVaccinations(prev => [vaccination, ...prev]);
      setNewVaccination({ name: '', notes: '' });
      setShowNewVaccination(false);
    }
  };

  const handleAddMedication = () => {
    if (newMedication.name.trim() && newMedication.dosage.trim() && newMedication.frequency.trim()) {
      const medication: Medication = {
        id: Date.now().toString(),
        name: newMedication.name,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        startDate: new Date(),
        notes: newMedication.notes,
      };
      setMedications(prev => [medication, ...prev]);
      setNewMedication({ name: '', dosage: '', frequency: '', notes: '' });
      setShowNewMedication(false);
    }
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
          <Text style={styles.headerTitle}>Health Records</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vaccinations' && styles.activeTab]}
            onPress={() => setActiveTab('vaccinations')}>
            <Syringe size={20} color={activeTab === 'vaccinations' ? '#7C3AED' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 'vaccinations' && styles.activeTabText]}>
              Vaccinations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'medications' && styles.activeTab]}
            onPress={() => setActiveTab('medications')}>
            <AlertCircle size={20} color={activeTab === 'medications' ? '#7C3AED' : '#FFFFFF'} />
            <Text style={[styles.tabText, activeTab === 'medications' && styles.activeTabText]}>
              Medications
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {activeTab === 'vaccinations' ? (
          <View>
            {vaccinations.map(vaccination => (
              <View key={vaccination.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Syringe size={20} color="#7C3AED" />
                  <Text style={styles.cardTitle}>{vaccination.name}</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.dateRow}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.dateText}>
                      Administered: {format(vaccination.date, 'MMM d, yyyy')}
                    </Text>
                  </View>
                  {vaccination.nextDose && (
                    <View style={styles.dateRow}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.dateText}>
                        Next dose: {format(vaccination.nextDose, 'MMM d, yyyy')}
                      </Text>
                    </View>
                  )}
                  {vaccination.notes && (
                    <Text style={styles.notes}>{vaccination.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {medications.map(medication => (
              <View key={medication.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <AlertCircle size={20} color="#7C3AED" />
                  <Text style={styles.cardTitle}>{medication.name}</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.medicationDetails}>
                    <Text style={styles.dosageText}>
                      Dosage: {medication.dosage}
                    </Text>
                    <Text style={styles.frequencyText}>
                      {medication.frequency}
                    </Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.dateText}>
                      Started: {format(medication.startDate, 'MMM d, yyyy')}
                    </Text>
                  </View>
                  {medication.endDate && (
                    <View style={styles.dateRow}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.dateText}>
                        Ended: {format(medication.endDate, 'MMM d, yyyy')}
                      </Text>
                    </View>
                  )}
                  {medication.notes && (
                    <Text style={styles.notes}>{medication.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => activeTab === 'vaccinations' ? setShowNewVaccination(true) : setShowNewMedication(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showNewVaccination}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewVaccination(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vaccination</Text>
              <TouchableOpacity onPress={() => setShowNewVaccination(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vaccination Name</Text>
              <TextInput
                style={styles.input}
                value={newVaccination.name}
                onChangeText={text => setNewVaccination(prev => ({ ...prev, name: text }))}
                placeholder="Enter vaccination name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newVaccination.notes}
                onChangeText={text => setNewVaccination(prev => ({ ...prev, notes: text }))}
                placeholder="Add any notes or reactions"
                multiline
                numberOfLines={4}
              />
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddVaccination}>
              <Text style={styles.submitButtonText}>Add Vaccination</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showNewMedication}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewMedication(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity onPress={() => setShowNewMedication(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medication Name</Text>
              <TextInput
                style={styles.input}
                value={newMedication.name}
                onChangeText={text => setNewMedication(prev => ({ ...prev, name: text }))}
                placeholder="Enter medication name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dosage</Text>
              <TextInput
                style={styles.input}
                value={newMedication.dosage}
                onChangeText={text => setNewMedication(prev => ({ ...prev, dosage: text }))}
                placeholder="Enter dosage (e.g., 5ml, 10mg)"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                style={styles.input}
                value={newMedication.frequency}
                onChangeText={text => setNewMedication(prev => ({ ...prev, frequency: text }))}
                placeholder="Enter frequency (e.g., twice daily)"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newMedication.notes}
                onChangeText={text => setNewMedication(prev => ({ ...prev, notes: text }))}
                placeholder="Add any notes or instructions"
                multiline
                numberOfLines={4}
              />
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddMedication}>
              <Text style={styles.submitButtonText}>Add Medication</Text>
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  activeTabText: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  cardContent: {
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  notes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  medicationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dosageText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  frequencyText: {
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
    padding: 24,
    maxHeight: '80%',
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
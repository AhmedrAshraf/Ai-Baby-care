import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Syringe, X, Plus, Calendar, Clock, CircleAlert as AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useVaccinationContext } from '@/contexts/VaccinationContext';
import { useMedicationContext } from '@/contexts/MedicationContext';
import Header from '@/components/Header';

type DateRange = 'day' | 'week' | 'month';

const VACCINATIONS = [
  'DTaP (Diphtheria, Tetanus, Pertussis)',
  'IPV (Polio)',
  'MMR (Measles, Mumps, Rubella)',
  'Hib (Haemophilus influenzae type b)',
  'Hepatitis B',
  'Varicella (Chickenpox)',
  'PCV13 (Pneumococcal)',
  'Rotavirus',
  'Influenza',
  'Other',
];

const MEDICATIONS = [
  'Acetaminophen (Tylenol)',
  'Ibuprofen',
  'Vitamin D Drops',
  'Iron Supplement',
  'Multivitamin',
  'Probiotic',
  'Other',
];

export default function VaccinationsScreen() {
  const router = useRouter();
  const { vaccinations, addVaccination } = useVaccinationContext();
  const { medications, addMedication } = useMedicationContext();
  const [showNewItem, setShowNewItem] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange>('day');
  const [activeTab, setActiveTab] = useState<'vaccinations' | 'medications'>('vaccinations');
  const [showVaccinationDropdown, setShowVaccinationDropdown] = useState(false);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const [selectedVaccination, setSelectedVaccination] = useState('');
  const [selectedMedication, setSelectedMedication] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [notes, setNotes] = useState('');

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

  const getFilteredItems = () => {
    const items = activeTab === 'vaccinations' ? vaccinations : medications;
    return items.filter(item => {
      const itemDate = activeTab === 'vaccinations' 
        ? (item as typeof vaccinations[0]).date 
        : (item as typeof medications[0]).startDate;

      switch (dateRange) {
        case 'day':
          return isSameDay(itemDate, selectedDate);
        case 'week': {
          const start = startOfWeek(selectedDate);
          const end = endOfWeek(selectedDate);
          return itemDate >= start && itemDate <= end;
        }
        case 'month': {
          const start = startOfMonth(selectedDate);
          const end = endOfMonth(selectedDate);
          return itemDate >= start && itemDate <= end;
        }
      }
    });
  };

  const handleAddItem = () => {
    if (activeTab === 'vaccinations' && selectedVaccination) {
      const name = selectedVaccination === 'Other' ? customItem : selectedVaccination;
      addVaccination({
        id: Date.now().toString(),
        name,
        date: new Date(),
        notes,
      });
      setSelectedVaccination('');
      setCustomItem('');
      setNotes('');
      setShowNewItem(false);
      setShowVaccinationDropdown(false);
    } else if (activeTab === 'medications' && selectedMedication) {
      const name = selectedMedication === 'Other' ? customItem : selectedMedication;
      addMedication({
        id: Date.now().toString(),
        name,
        dosage,
        frequency,
        startDate: new Date(),
        notes,
      });
      setSelectedMedication('');
      setCustomItem('');
      setDosage('');
      setFrequency('');
      setNotes('');
      setShowNewItem(false);
      setShowMedicationDropdown(false);
    }
  };

  const resetForm = () => {
    setSelectedVaccination('');
    setSelectedMedication('');
    setCustomItem('');
    setDosage('');
    setFrequency('');
    setNotes('');
    setShowVaccinationDropdown(false);
    setShowMedicationDropdown(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Health Records"
        showBackButton
        useGradient
        bottomElement={
          <>
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
          </>
        }
      />

      <ScrollView style={styles.content}>
        {getFilteredItems().map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {activeTab === 'vaccinations' ? (
                <Syringe size={20} color="#7C3AED" />
              ) : (
                <AlertCircle size={20} color="#7C3AED" />
              )}
              <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.dateRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.dateText}>
                  {format(
                    activeTab === 'vaccinations' 
                      ? (item as typeof vaccinations[0]).date 
                      : (item as typeof medications[0]).startDate,
                    'MMM d, yyyy'
                  )}
                </Text>
              </View>
              {activeTab === 'medications' && (
                <View style={styles.medicationDetails}>
                  <Text style={styles.dosageText}>
                    Dosage: {(item as typeof medications[0]).dosage}
                  </Text>
                  <Text style={styles.frequencyText}>
                    {(item as typeof medications[0]).frequency}
                  </Text>
                </View>
              )}
              {item.notes && (
                <Text style={styles.notes}>{item.notes}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowNewItem(true)}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showNewItem}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewItem(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {activeTab === 'vaccinations' ? 'Vaccination' : 'Medication'}
              </Text>
              <TouchableOpacity onPress={() => setShowNewItem(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Select {activeTab === 'vaccinations' ? 'Vaccination' : 'Medication'}
                </Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => {
                    if (activeTab === 'vaccinations') {
                      setShowVaccinationDropdown(!showVaccinationDropdown);
                      setShowMedicationDropdown(false);
                    } else {
                      setShowMedicationDropdown(!showMedicationDropdown);
                      setShowVaccinationDropdown(false);
                    }
                  }}>
                  <Text style={styles.dropdownText}>
                    {activeTab === 'vaccinations' 
                      ? (selectedVaccination || 'Select Vaccination')
                      : (selectedMedication || 'Select Medication')}
                  </Text>
                  <ChevronRight size={20} color="#6B7280" />
                </TouchableOpacity>

                {showVaccinationDropdown && (
                  <View style={styles.dropdownOptions}>
                    {VACCINATIONS.map(vaccine => (
                      <TouchableOpacity
                        key={vaccine}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setSelectedVaccination(vaccine);
                          setShowVaccinationDropdown(false);
                        }}>
                        <Text style={styles.dropdownOptionText}>{vaccine}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {showMedicationDropdown && (
                  <View style={styles.dropdownOptions}>
                    {MEDICATIONS.map(med => (
                      <TouchableOpacity
                        key={med}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setSelectedMedication(med);
                          setShowMedicationDropdown(false);
                        }}>
                        <Text style={styles.dropdownOptionText}>{med}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {((activeTab === 'vaccinations' && selectedVaccination === 'Other') ||
                (activeTab === 'medications' && selectedMedication === 'Other')) && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Specify {activeTab === 'vaccinations' ? 'Vaccination' : 'Medication'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={customItem}
                    onChangeText={setCustomItem}
                    placeholder={`Enter ${activeTab === 'vaccinations' ? 'vaccination' : 'medication'} name`}
                  />
                </View>
              )}

              {activeTab === 'medications' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Dosage</Text>
                    <TextInput
                      style={styles.input}
                      value={dosage}
                      onChangeText={setDosage}
                      placeholder="Enter dosage (e.g., 5ml, 10mg)"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Frequency</Text>
                    <TextInput
                      style={styles.input}
                      value={frequency}
                      onChangeText={setFrequency}
                      placeholder="Enter frequency (e.g., twice daily)"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes or reactions"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!selectedVaccination && !selectedMedication) && styles.saveButtonDisabled
                ]}
                onPress={handleAddItem}
                disabled={!selectedVaccination && !selectedMedication}>
                <Text style={styles.saveButtonText}>
                  Add {activeTab === 'vaccinations' ? 'Vaccination' : 'Medication'}
                </Text>
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    paddingHorizontal: 20,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 20,
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
  notes: {
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
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  dropdownOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
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
    height: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
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
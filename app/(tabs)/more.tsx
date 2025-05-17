import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Switch, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Bell, Shield, Users, FileText, CircleHelp as HelpCircle, ChevronRight, LogOut, Globe, Moon, Sun, Volume2, Check, Mail, Camera, CreditCard as Edit2, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
];

const MENU_ITEMS = [
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings size={24} color="#6B7280" />,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: <Bell size={24} color="#6B7280" />,
    badge: 3,
  },
  {
    id: 'language',
    title: 'Language',
    icon: <Globe size={24} color="#6B7280" />,
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: <Shield size={24} color="#6B7280" />,
    description: 'Manage your data and security settings',
  },
  {
    id: 'community',
    title: 'Community',
    icon: <Users size={24} color="#6B7280" />,
    description: 'Connect with other parents and share experiences',
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    icon: <FileText size={24} color="#6B7280" />,
    description: 'Read our terms of service and policies',
  },
  {
    id: 'support',
    title: 'Help & Support',
    icon: <HelpCircle size={24} color="#6B7280" />,
    description: 'Get help and access support resources',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    icon: <Mail size={24} color="#6B7280" />,
    description: 'Reach out to our support team',
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCommunityModal, setCommunityModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: {
      pushEnabled: true,
      emailEnabled: true,
      feedingReminders: true,
      sleepReminders: true,
      medicationReminders: true,
      appointmentReminders: true,
    },
    sound: {
      enabled: true,
      volume: 0.8,
    },
    security: {
      twoFactor: false,
    },
  });

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      // Web implementation
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setProfileImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Native implementation
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    }
  };

  const handleMenuItemPress = (id: string) => {
    switch (id) {
      case 'language':
        setShowLanguageModal(true);
        break;
      case 'settings':
        setShowSettingsModal(true);
        break;
      case 'privacy':
        setShowPrivacyModal(true);
        break;
      case 'community':
        setCommunityModal(true);
        break;
      case 'terms':
        setShowTermsModal(true);
        break;
    }
  };

  const toggleSetting = (path: string) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      let current = newSettings as any;
      const keys = path.split('.');
      const lastKey = keys.pop()!;
      
      for (const key of keys) {
        current = current[key];
      }
      
      current[lastKey] = !current[lastKey];
      return newSettings;
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}>
        <TouchableOpacity 
          style={styles.profile}
          // onPress={() => setShowProfileModal(true)}>
          onPress={() => router.push('/edit-profile')}>
          <View style={styles.avatarContainer}>
            {profileImage || user?.user_metadata.baby_photo_url ? (
              <Image
                source={{ uri: profileImage || user?.user_metadata.baby_photo_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={32} color="#FFFFFF" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.editPhotoButton}
              onPress={handlePickImage}>
              <Camera size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.user_metadata?.parent_name || 'Sarah Johnson'}</Text>
            <Text style={styles.email}>{user?.email || 'sarah.j@example.com'}</Text>
            <View style={styles.editProfileButton}>
              <Edit2 size={12} color="#FFFFFF" />
              <Text style={styles.editProfileText}>Edits Profile</Text>
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>i
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === MENU_ITEMS.length - 1 && styles.lastMenuItem,
              ]}
              onPress={() => handleMenuItemPress(item.id)}>
              <View style={styles.menuItemContent}>
                {item.icon}
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  {item.description && (
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  )}
                </View>
              </View>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : (
                <ChevronRight size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}>
          <LogOut size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <ChevronRight size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {LANGUAGES.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === language.code && styles.selectedLanguage,
                  ]}
                  onPress={() => {
                    setSelectedLanguage(language.code);
                    setShowLanguageModal(false);
                  }}>
                  <Text style={[
                    styles.languageText,
                    selectedLanguage === language.code && styles.selectedLanguageText,
                  ]}>
                    {language.name}
                  </Text>
                  {selectedLanguage === language.code && (
                    <Check size={20} color="#7C3AED" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <ChevronRight size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Appearance</Text>
                <View style={styles.settingItem}>
                  <View style={styles.settingLabel}>
                    {settings.darkMode ? <Moon size={20} color="#6B7280" /> : <Sun size={20} color="#6B7280" />}
                    <Text style={styles.settingText}>Dark Mode</Text>
                  </View>
                  <Switch
                    value={settings.darkMode}
                    onValueChange={() => toggleSetting('darkMode')}
                    trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Notifications</Text>
                <View style={styles.settingItem}>
                  <View style={styles.settingLabel}>
                    <Bell size={20} color="#6B7280" />
                    <Text style={styles.settingText}>Push Notifications</Text>
                  </View>
                  <Switch
                    value={settings.notifications.pushEnabled}
                    onValueChange={() => toggleSetting('notifications.pushEnabled')}
                    trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  />
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingText}>Feeding Reminders</Text>
                  <Switch
                    value={settings.notifications.feedingReminders}
                    onValueChange={() => toggleSetting('notifications.feedingReminders')}
                    trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  />
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingText}>Sleep Reminders</Text>
                  <Switch
                    value={settings.notifications.sleepReminders}
                    onValueChange={() => toggleSetting('notifications.sleepReminders')}
                    trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  />
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingText}>Medication Reminders</Text>
                  <Switch
                    value={settings.notifications.medicationReminders}
                    onValueChange={() => toggleSetting('notifications.medicationReminders')}
                    trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  />
                </View>
                <View style={styles.settingItem}>
                  <Text style={styles.settingText}>Appointment Reminders</Text>
                  <Switch
                    value={settings.notifications.appointmentReminders}
                    onValueChange={() => toggleSetting('notifications.appointmentReminders')}
                    trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={styles.settingSectionTitle}>Sound</Text>
                <View style={styles.settingItem}>
                  <View style={styles.settingLabel}>
                    <Volume2 size={20} color="#6B7280" />
                    <Text style={styles.settingText}>Sound Effects</Text>
                  </View>
                  <Switch
                    value={settings.sound.enabled}
                    onValueChange={() => toggleSetting('sound.enabled')}
                    trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <ChevronRight size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.profileEditSection}>
                <TouchableOpacity 
                  style={styles.profileImageEdit}
                  onPress={handlePickImage}>
                  {profileImage || user?.user_metadata.baby_photo_url ? (
                    <Image
                      source={{ uri: profileImage || user?.user_metadata.baby_photo_url }}
                      style={styles.profileImageLarge}
                    />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <User size={40} color="#6B7280" />
                    </View>
                  )}
                  <View style={styles.editOverlay}>
                    <Camera size={24} color="#FFFFFF" />
                    <Text style={styles.editOverlayText}>Change Photo</Text>
                  </View>
                </TouchableOpacity>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={user?.user_metadata?.parent_name || ''}
                    placeholder="Enter your name"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={user?.email || ''}
                    placeholder="Enter your email"
                    editable={false}
                  />
                </View>
                
                <TouchableOpacity style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy & Security Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy & Security</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <ChevronRight size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.privacySection}>
                <Text style={styles.sectionTitle}>Data Privacy</Text>
                <Text style={styles.sectionText}>
                  We take your privacy seriously. Your data is encrypted and stored securely.
                  You have full control over your personal information and can request data
                  deletion at any time.
                </Text>
                
                <Text style={styles.sectionTitle}>Security Settings</Text>
                <View style={styles.settingItem}>
                  <Text style={styles.settingText}>Two-Factor Authentication</Text>
                  <Switch
                    value={settings.security?.twoFactor}
                    onValueChange={() => toggleSetting('security.twoFactor')}
                    trackColor={{ false: '#D1D5DB', true: '#7C3AED' }}
                  />
                </View>
                
                <Text style={styles.sectionTitle}>Data Management</Text>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Export My Data</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
                  <Text style={styles.dangerButtonText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Community Modal */}
      <Modal
        visible={showCommunityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCommunityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Community</Text>
              <TouchableOpacity onPress={() => setCommunityModal(false)}>
                <ChevronRight size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.communitySection}>
                <Text style={styles.sectionTitle}>Parent Groups</Text>
                <View style={styles.groupList}>
                  {/* Add group items here */}
                  <View style={styles.groupItem}>
                    <Text style={styles.groupName}>New Parents Support</Text>
                    <Text style={styles.groupMembers}>1,234 members</Text>
                    <TouchableOpacity style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>Join</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Add more groups */}
                </View>
                
                <Text style={styles.sectionTitle}>Discussion Forums</Text>
                <View style={styles.forumList}>
                  {/* Add forum topics */}
                  <TouchableOpacity style={styles.forumItem}>
                    <Text style={styles.forumTitle}>Sleep Training Tips</Text>
                    <Text style={styles.forumPosts}>156 posts</Text>
                  </TouchableOpacity>
                  {/* Add more forums */}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <ChevronRight size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>1. Terms of Use</Text>
                <Text style={styles.termsText}>
                  By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
                </Text>
                
                <Text style={styles.termsTitle}>2. Privacy Policy</Text>
                <Text style={styles.termsText}>
                  Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you through our app.
                </Text>
                
                <Text style={styles.termsTitle}>3. User Rights & Responsibilities</Text>
                <Text style={styles.termsText}>
                  Users are responsible for maintaining the confidentiality of their account and password information.
                </Text>
                
                {/* Add more terms sections */}
              </View>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  editPhotoButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#7C3AED',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  email: {
    color: '#E5E7EB',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  menuItemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 24,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  modalScroll: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  selectedLanguage: {
    backgroundColor: '#F3F4F6',
  },
  languageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  selectedLanguageText: {
    color: '#7C3AED',
    fontFamily: 'Inter-SemiBold',
  },
  settingSection: {
    marginBottom: 24,
  },
  settingSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  profileEditSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImageEdit: {
    position: 'relative',
    marginBottom: 24,
  },
  profileImageLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    alignItems: 'center',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  editOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  privacySection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: '#FEE2E2',
  },
  dangerButtonText: {
    color: '#EF4444',
  },
  communitySection: {
    paddingVertical: 20,
  },
  groupList: {
    marginBottom: 24,
  },
  groupItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  forumList: {
    marginTop: 12,
  },
  forumItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  forumTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  forumPosts: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  termsSection: {
    paddingVertical: 20,
  },
  termsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    marginBottom: 24,
    lineHeight: 20,
  },
});
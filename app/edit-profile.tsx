import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, Eye, EyeOff, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';
import { useActivityLog } from '@/contexts/ActivityLogContext';

const CLOUDINARY_CLOUD_NAME = 'do0qfrr5y';
const CLOUDINARY_UPLOAD_PRESET = 'desist';

type RelationshipType = 'mother' | 'father' | 'guardian' | 'other';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { logActivity } = useActivityLog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyBirthday, setBabyBirthday] = useState('');
  const [babyGender, setBabyGender] = useState<'boy' | 'girl' | ''>('');
  const [relationshipToChild, setRelationshipToChild] = useState<RelationshipType>('guardian');
  const [customRelationship, setCustomRelationship] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (user) {
        setParentName(user?.user_metadata.parent_name || '');
        setEmail(user.email || '');
        setBabyName(user?.user_metadata.baby_name || '');
        setBabyBirthday(user?.user_metadata.baby_birthday ? new Date(user?.user_metadata.baby_birthday).toISOString().split('T')[0] : '');
        setBabyGender(user?.user_metadata.baby_gender || '');
        setRelationshipToChild((user?.user_metadata.relationship_to_child || 'guardian') as RelationshipType);
        setCustomRelationship(user?.user_metadata.relationship_to_child || '');
        setProfileImage(user?.user_metadata.baby_photo_url || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
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
          mediaTypes: ImagePicker.MediaTypeOptions.images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled) {
          setProfileImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to select image');
    }
  };

  const uploadBabyPhoto = async (userId: string): Promise<string | null> => {
    try {
      if (!profileImage) return null;

      const formData = new FormData();
      formData.append('file', {
        uri: profileImage,
        type: 'image/jpeg',
        name: `${userId}-${Date.now()}.jpg`,
      } as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const validateForm = () => {
    if (!parentName.trim()) {
      setError('Your name is required');
      return false;
    }

    if (!babyName.trim()) {
      setError('Baby\'s name is required');
      return false;
    }

    if (!babyBirthday.trim()) {
      setError('Baby\'s birthday is required');
      return false;
    }

    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayRegex.test(babyBirthday)) {
      setError('Please enter baby\'s birthday in YYYY-MM-DD format');
      return false;
    }

    if (!babyGender) {
      setError('Please select baby\'s gender');
      return false;
    }

    if (!relationshipToChild) {
      setError('Please select your relationship to the child');
      return false;
    }

    if (relationshipToChild === 'other' && !customRelationship.trim()) {
      setError('Please specify your relationship to the child');
      return false;
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setError('Current password is required to change password');
        return false;
      }

      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return false;
      }

      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let photoUrl = null;
      if (profileImage && profileImage !== user.user_metadata.baby_photo_url) {
        try {
          photoUrl = await uploadBabyPhoto(user.id);
        } catch (error) {
          console.error('Photo upload failed:', error);
          setError('Failed to upload photo. Please try again.');
          return;
        }
      }

      const updates = {
        parent_name: parentName.trim(),
        baby_name: babyName.trim(),
        baby_photo_url: photoUrl || user.user_metadata.baby_photo_url,
        baby_birthday: new Date(babyBirthday.trim()).toISOString(),
        baby_gender: babyGender,
        relationship_to_child: relationshipToChild === 'other' ? customRelationship : relationshipToChild,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      if (newPassword && currentPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
      }

      await logActivity({
        eventType: 'profile.update',
        eventData: { updated: ['profile', ...(newPassword ? ['password'] : [])] }
      });

      setSuccess('Profile updated successfully');
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...updates
        }
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.background}
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        
        <TouchableOpacity 
          style={styles.photoContainer}
          onPress={handlePickImage}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.babyPhoto}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <User size={32} color="#6B7280" />
              <Text style={styles.photoPlaceholderText}>Add Baby Photo</Text>
            </View>
          )}
          <View style={styles.editPhotoButton}>
            <Camera size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={parentName}
                onChangeText={setParentName}
                placeholder="Enter your name"
                autoComplete="name"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F3F4F6' }]}
                value={email}
                editable={false}
                placeholder="Your email address"
              />
            </View>
          </View>

          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter current password"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter new password"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholder="Confirm new password"
                editable={!loading}
              />
            </View>
          </View> */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Baby Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Baby's Name</Text>
              <TextInput
                style={styles.input}
                value={babyName}
                onChangeText={setBabyName}
                placeholder="Enter baby's name"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Baby's Birthday</Text>
              <TextInput
                style={styles.input}
                value={babyBirthday}
                onChangeText={setBabyBirthday}
                placeholder="YYYY-MM-DD"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Baby's Gender</Text>
              <View style={styles.genderOptions}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    babyGender === 'boy' && styles.selectedGenderOption
                  ]}
                  onPress={() => setBabyGender('boy')}
                  disabled={loading}>
                  <Text style={[
                    styles.genderOptionText,
                    babyGender === 'boy' && styles.selectedGenderOptionText
                  ]}>Boy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    babyGender === 'girl' && styles.selectedGenderOption
                  ]}
                  onPress={() => setBabyGender('girl')}
                  disabled={loading}>
                  <Text style={[
                    styles.genderOptionText,
                    babyGender === 'girl' && styles.selectedGenderOptionText
                  ]}>Girl</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Relationship to Child</Text>
              <View style={styles.relationshipOptions}>
                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    relationshipToChild === 'mother' && styles.selectedRelationshipOption
                  ]}
                  onPress={() => {
                    setRelationshipToChild('mother');
                    setCustomRelationship('');
                  }}
                  disabled={loading}>
                  <Text style={[
                    styles.relationshipOptionText,
                    relationshipToChild === 'mother' && styles.selectedRelationshipOptionText
                  ]}>Mother</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    relationshipToChild === 'father' && styles.selectedRelationshipOption
                  ]}
                  onPress={() => {
                    setRelationshipToChild('father');
                    setCustomRelationship('');
                  }}
                  disabled={loading}>
                  <Text style={[
                    styles.relationshipOptionText,
                    relationshipToChild === 'father' && styles.selectedRelationshipOptionText
                  ]}>Father</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    relationshipToChild === 'guardian' && styles.selectedRelationshipOption
                  ]}
                  onPress={() => {
                    setRelationshipToChild('guardian');
                    setCustomRelationship('');
                  }}
                  disabled={loading}>
                  <Text style={[
                    styles.relationshipOptionText,
                    relationshipToChild === 'guardian' && styles.selectedRelationshipOptionText
                  ]}>Guardian</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.relationshipOption,
                    relationshipToChild === 'other' && styles.selectedRelationshipOption
                  ]}
                  onPress={() => setRelationshipToChild('other')}
                  disabled={loading}>
                  <Text style={[
                    styles.relationshipOptionText,
                    relationshipToChild === 'other' && styles.selectedRelationshipOptionText
                  ]}>Other</Text>
                </TouchableOpacity>
              </View>

              {relationshipToChild === 'other' && (
                <TextInput
                  style={[styles.input, styles.customRelationshipInput]}
                  value={customRelationship}
                  onChangeText={setCustomRelationship}
                  placeholder="Specify your relationship"
                  maxLength={50}
                  editable={!loading}
                />
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '30%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  babyPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  editPhotoButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingRight: 16,
  },
  eyeButton: {
    padding: 4,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedGenderOption: {
    backgroundColor: '#7C3AED',
  },
  genderOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  selectedGenderOptionText: {
    color: '#FFFFFF',
  },
  relationshipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipOption: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedRelationshipOption: {
    backgroundColor: '#7C3AED',
  },
  relationshipOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  selectedRelationshipOptionText: {
    color: '#FFFFFF',
  },
  customRelationshipInput: {
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
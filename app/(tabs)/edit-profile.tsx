import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Camera, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';
import { uploadPhoto, updateProfilePhoto } from '@/utils/supabase';
import { useActivityLog } from '@/contexts/ActivityLogContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
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
  const [relationshipToChild, setRelationshipToChild] = useState('guardian');
  const [customRelationship, setCustomRelationship] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setParentName(profile.parent_name || '');
        setBabyName(profile.baby_name || '');
        setBabyBirthday(profile.baby_birthday ? new Date(profile.baby_birthday).toISOString().split('T')[0] : '');
        setBabyGender(profile.baby_gender || '');
        setRelationshipToChild(profile.relationship_to_child || 'guardian');
        setProfileImage(profile.baby_photo_url || null);
      }

      setEmail(user.email || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    }
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') {
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
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to select image');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!user) throw new Error('No authenticated user');

      // Upload new photo if changed
      let photoUrl = null;
      if (profileImage && !profileImage.startsWith('http')) {
        photoUrl = await uploadPhoto(profileImage, user.id);
        if (photoUrl) {
          await updateProfilePhoto(photoUrl);
        }
      }

      // Update profile data
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          parent_name: parentName,
          baby_name: babyName,
          baby_birthday: babyBirthday,
          baby_gender: babyGender,
          relationship_to_child: relationshipToChild === 'other' ? customRelationship : relationshipToChild,
          ...(photoUrl && { baby_photo_url: photoUrl }),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }

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
      
      // Clear sensitive fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.photoContainer}
          onPress={handlePickImage}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera size={40} color="#6B7280" />
              <Text style={styles.photoPlaceholderText}>Add Baby Photo</Text>
            </View>
          )}
          <View style={styles.editPhotoButton}>
            <Camera size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parent Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={parentName}
              onChangeText={setParentName}
              placeholder="Enter your name"
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

        <View style={styles.section}>
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
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Baby Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Baby's Name</Text>
            <TextInput
              style={styles.input}
              value={babyName}
              onChangeText={setBabyName}
              placeholder="Enter baby's name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Baby's Birthday</Text>
            <TextInput
              style={styles.input}
              value={babyBirthday}
              onChangeText={setBabyBirthday}
              placeholder="YYYY-MM-DD"
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
                onPress={() => setBabyGender('boy')}>
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
                onPress={() => setBabyGender('girl')}>
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
                }}>
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
                }}>
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
                }}>
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
                onPress={() => setRelationshipToChild('other')}>
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
              />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
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
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  profilePhoto: {
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 24,
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
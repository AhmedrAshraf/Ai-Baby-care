import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';
import { takePhoto, pickImage, handleWebImageUpload } from '@/utils/camera';

const CLOUDINARY_CLOUD_NAME = 'do0qfrr5y';
const CLOUDINARY_UPLOAD_PRESET = 'desist';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

type RelationshipType = 'mother' | 'father' | 'guardian' | 'other';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('ahmed@gmail.com');
  const [password, setPassword] = useState('123456');
  const [confirmPassword, setConfirmPassword] = useState('123456');
  const [parentName, setParentName] = useState('Ahmed');
  const [babyName, setBabyName] = useState('John');
  const [babyBirthday, setBabyBirthday] = useState('2020-01-01');
  const [babyGender, setBabyGender] = useState<'boy' | 'girl' | ''>('boy');
  const [relationshipToChild, setRelationshipToChild] = useState<RelationshipType>('guardian');
  const [customRelationship, setCustomRelationship] = useState('Guardian');
  const [babyPhoto, setBabyPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const validateForm = () => {
    console.log('Validating form');
    // Check each field individually and provide specific error messages
    if (!email.trim()) {
      setError('Email is required');
      console.log('Email is required');
      return false;
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      console.log('Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      setError('Password is required');
      console.log('Password is required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      console.log('Password must be at least 6 characters long');
      return false;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      console.log('Please confirm your password');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      console.log('Passwords do not match');
      return false;
    }

    if (!parentName || !parentName.trim()) {
      setError('Your name is required');
      console.log('Your name is required');
      return false;
    }

    if (!babyName.trim()) {
      setError('Baby\'s name is required');
      console.log('Baby\'s name is required');
      return false;
    }

    if (!babyBirthday.trim()) {
      setError('Baby\'s birthday is required');
      return false;
    }

    // Validate baby birthday format (YYYY-MM-DD)
    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayRegex.test(babyBirthday)) {
      setError('Please enter baby\'s birthday in YYYY-MM-DD format');
      console.log('Invalid birthday format');
      return false;
    }

    if (!babyGender) {
      setError('Please select baby\'s gender');
      console.log('Please select baby\'s gender');
      return false;
    }

    if (!relationshipToChild) {
      setError('Please select your relationship to the child');
      console.log('Please select your relationship to the child');
      return false;
    }

    if (relationshipToChild === 'other' && !customRelationship.trim()) {
      setError('Please specify your relationship to the child');
      console.log('Please specify your relationship to the child');
      return false;
    }

    if (relationshipToChild === 'other' && customRelationship.length > 50) {
      setError('Custom relationship must be 50 characters or less');
      console.log('Custom relationship must be 50 characters or less');
      return false;
    }

    if (!babyPhoto) {
      setError('Please select a baby photo');
      console.log('Please select a baby photo');
      return false;
    }

    return true;
  };
  const handlePickImage = async () => {
    try {
      let result;
      if (Platform.OS === 'web') {
        result = await handleWebImageUpload();
      } else {
        result = await pickImage();
      }

      if (!result.cancelled && result.uri) {
        setBabyPhoto(result.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to select image');
    }
  };

  const uploadBabyPhoto = async (userId: string): Promise<string | null> => {
    try {
      if (!babyPhoto) return null;
      console.log('Attempting to upload baby photo to Cloudinary');

      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', {
        uri: babyPhoto,
        type: 'image/jpeg',
        name: `${userId}-${Date.now()}.jpg`,
      } as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      // Add retry logic for upload
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempting Cloudinary upload (attempt ${retryCount + 1})...`);

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
            console.error('Cloudinary upload error:', errorData);
            throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
          }

          const data = await response.json();
          console.log('Upload successful:', data);

          // Return the secure URL of the uploaded image
          return data.secure_url;
        } catch (error) {
          console.error(`Error uploading to Cloudinary (attempt ${retryCount + 1}):`, error);
          retryCount++;
          
          if (retryCount === maxRetries) {
            throw new Error(`Failed to upload photo after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
          
          // Wait before retrying with exponential backoff
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw new Error('Failed to upload photo after multiple attempts');
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const finalRelationship = relationshipToChild === 'other' ? customRelationship : relationshipToChild;
      
      // Upload baby photo first if selected
      let photoUrl = null;
      if (babyPhoto) {
        try {
          // Generate temporary ID for photo upload
          const tempId = `temp-${Date.now()}`;
          photoUrl = await uploadBabyPhoto(tempId);
          if (!photoUrl) {
            throw new Error('Failed to upload photo: No URL returned from Cloudinary');
          }
          console.log('Photo uploaded successfully:', photoUrl);
        } catch (photoError) {
          console.error('Photo upload failed:', photoError);
          setError('Failed to upload photo. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Validate and format data according to schema constraints
      const profileData = {
        parent_name: parentName.trim() || '',
        baby_name: babyName.trim() || '',
        baby_photo_url: photoUrl || '',
        baby_birthday: new Date(babyBirthday.trim()).toISOString() || '',
        baby_gender: babyGender as 'boy' | 'girl' || '',
        relationship_to_child: finalRelationship || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to sign up with data:', {
        email: email.trim(),
        ...profileData,
        hasPhoto: !!photoUrl
      });

      // Add retry logic for signup
      let retryCount = 0;
      const maxRetries = 3;
      let lastError = null;

      while (retryCount < maxRetries) {
        try {
          // Sign up with metadata
          const { data, error: signUpError } = await signUp(email.trim(), password, profileData);
          
          if (signUpError) {
            console.error(`Sign up error (attempt ${retryCount + 1}):`, signUpError);
            if (signUpError.message === 'User already registered' || 
                signUpError.message?.includes('already registered') ||
                signUpError.message?.includes('already exists') ||
                signUpError.code === 'user_already_exists' ||
                signUpError.code === '422') {
              setError('An account with this email already exists. Please sign in instead.');
              return;
            }
            lastError = signUpError;
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retrying signup (attempt ${retryCount + 1})...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              continue;
            }
            throw signUpError;
          }

          if (!data?.user?.id) {
            throw new Error('Failed to create user account');
          }

          console.log('User created successfully:', data.user.id);

          // Create user profile record with retry
          let profileRetryCount = 0;
          while (profileRetryCount < maxRetries) {
            try {
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: data.user.id,
                  ...profileData
                });

              if (profileError) {
                console.error(`Profile creation error (attempt ${profileRetryCount + 1}):`, profileError);
                lastError = profileError;
                profileRetryCount++;
                if (profileRetryCount < maxRetries) {
                  console.log(`Retrying profile creation (attempt ${profileRetryCount + 1})...`);
                  await new Promise(resolve => setTimeout(resolve, 1000 * profileRetryCount));
                  continue;
                }
                throw profileError;
              }

              console.log('User profile created successfully');
              break;
            } catch (error) {
              if (profileRetryCount === maxRetries - 1) throw error;
              profileRetryCount++;
            }
          }

          // Navigate directly to tabs
          router.replace('/(tabs)');
          return;
        } catch (error) {
          lastError = error;
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Retrying signup (attempt ${retryCount + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      // If we get here, all retries failed
      throw lastError || new Error('Failed to create account after multiple attempts');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message?.includes('Network request failed') || 
          error.message?.includes('Unable to connect')) {
        setError('Network connection issue. Please check your internet connection and try again.');
      } else {
        setError(error.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setParentName('');
    setBabyName('');
    setBabyBirthday('');
    setBabyGender('');
    setRelationshipToChild('guardian');
    setCustomRelationship('');
    setBabyPhoto(null);
    setError('');
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
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity 
          style={styles.photoContainer}
          onPress={handlePickImage}>
          {babyPhoto ? (
            <Image
              source={{ uri: babyPhoto }}
              style={styles.babyPhoto}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera size={32} color="#6B7280" />
              <Text style={styles.photoPlaceholderText}>Add Baby Photo</Text>
            </View>
          )}
          <View style={styles.editPhotoButton}>
            <Camera size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.tryAgainButton}
              onPress={clearForm}>
              <Text style={styles.tryAgainText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={parentName}
              onChangeText={(text) => {
                setParentName(text);
                setError('');
              }}
              placeholder="Enter your name"
              autoComplete="name"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              placeholder="Create a password"
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              placeholder="Confirm your password"
              secureTextEntry
              autoComplete="new-password"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Baby's Name</Text>
            <TextInput
              style={styles.input}
              value={babyName}
              onChangeText={(text) => {
                setBabyName(text);
                setError('');
              }}
              placeholder="Enter baby's name"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Baby's Birthday</Text>
            <TextInput
              style={styles.input}
              value={babyBirthday}
              onChangeText={(text) => {
                setBabyBirthday(text);
                setError('');
              }}
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
                editable={!loading}
              />
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!email.trim() || !password.trim() || !confirmPassword.trim() || loading) && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={!email.trim() || !password.trim() || !confirmPassword.trim() || loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/login')}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
    height: '40%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
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
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  customRelationshipInput: {
    marginTop: 12,
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
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  signInButton: {
    padding: 4,
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#7C3AED',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  tryAgainButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  tryAgainText: {
    color: '#7C3AED',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});
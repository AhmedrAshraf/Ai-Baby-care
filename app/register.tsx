import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { checkNetworkConnectivity } from '@/utils/supabase';
import { Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

type RelationshipType = 'mother' | 'father' | 'guardian' | 'other';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyBirthday, setBabyBirthday] = useState('');
  const [babyGender, setBabyGender] = useState<'boy' | 'girl' | ''>('');
  const [relationshipToChild, setRelationshipToChild] = useState<RelationshipType>('guardian');
  const [customRelationship, setCustomRelationship] = useState('');
  const [babyPhoto, setBabyPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const validateForm = () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || 
        !parentName.trim() || !babyName.trim() || !babyBirthday.trim() ||
        !babyGender || !relationshipToChild || 
        (relationshipToChild === 'other' && !customRelationship.trim())) {
      setError('Please fill in all fields');
      return false;
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Validate baby birthday format (YYYY-MM-DD)
    const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!birthdayRegex.test(babyBirthday)) {
      setError('Please enter baby\'s birthday in YYYY-MM-DD format');
      return false;
    }

    if (relationshipToChild === 'other' && customRelationship.length > 50) {
      setError('Custom relationship must be 50 characters or less');
      return false;
    }

    return true;
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
              setBabyPhoto(reader.result as string);
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
          setBabyPhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to select image');
    }
  };

  const uploadBabyPhoto = async (userId: string): Promise<string | null> => {
    if (!babyPhoto) return null;

    try {
      const photoName = `${userId}-${Date.now()}.jpg`;
      const photoPath = `baby-photos/${photoName}`;

      let photoBlob: Blob;
      if (Platform.OS === 'web' && babyPhoto.startsWith('data:')) {
        // Convert base64 to blob for web
        const response = await fetch(babyPhoto);
        photoBlob = await response.blob();
      } else {
        // Convert uri to blob for native
        const response = await fetch(babyPhoto);
        photoBlob = await response.blob();
      }

      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(photoPath, photoBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(photoPath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Check network connectivity
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      const finalRelationship = relationshipToChild === 'other' ? customRelationship : relationshipToChild;

      const { data, error: signUpError } = await signUp(email.trim(), password, {
        metadata: {
          parent_name: parentName,
          baby_name: babyName,
          baby_birthday: babyBirthday,
          baby_gender: babyGender,
          relationship_to_child: finalRelationship,
        }
      });
      
      if (signUpError) {
        if (signUpError.message === 'User already registered' || 
            signUpError.message?.includes('already registered') ||
            signUpError.message?.includes('already exists') ||
            signUpError.code === 'user_already_exists' ||
            signUpError.code === '422') {
          setError('An account with this email already exists. Please sign in instead.');
          return;
        }
        throw signUpError;
      }

      // Upload baby photo if selected
      if (data?.user && babyPhoto) {
        const photoUrl = await uploadBabyPhoto(data.user.id);
        if (photoUrl) {
          // Update user profile with photo URL
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ baby_photo_url: photoUrl })
            .eq('user_id', data.user.id);

          if (updateError) {
            console.error('Error updating profile with photo:', updateError);
          }
        }
      }

      // Navigate directly to tabs instead of verification
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to create account');
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
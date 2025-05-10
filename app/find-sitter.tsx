import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Users, Star, Clock, Shield, Award, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const CARE_COM_URL = 'https://www.care.com/babysitters';

export default function FindSitterScreen() {
  const router = useRouter();

  const handleOpenCare = async () => {
    const canOpen = await Linking.canOpenURL(CARE_COM_URL);
    if (canOpen) {
      await Linking.openURL(CARE_COM_URL);
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
          <Text style={styles.headerTitle}>Find Your Perfect Sitter</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1543342384-1f1350e27861?w=800' }}
            style={styles.heroImage}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Trusted Childcare on Care.com</Text>
            <Text style={styles.heroDescription}>
              Find experienced nannies and babysitters who can provide the care your child deserves
            </Text>
            <TouchableOpacity
              style={styles.findButton}
              onPress={handleOpenCare}>
              <Text style={styles.findButtonText}>Search on Care.com</Text>
              <ExternalLink size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Care.com?</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <Shield size={24} color="#7C3AED" />
              <Text style={styles.benefitTitle}>Verified Profiles</Text>
              <Text style={styles.benefitDescription}>
                Background checks and identity verification for peace of mind
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <Star size={24} color="#7C3AED" />
              <Text style={styles.benefitTitle}>Reviews & Ratings</Text>
              <Text style={styles.benefitDescription}>
                Read authentic reviews from other parents
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <Clock size={24} color="#7C3AED" />
              <Text style={styles.benefitTitle}>Flexible Scheduling</Text>
              <Text style={styles.benefitDescription}>
                Find care that fits your schedule
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <Award size={24} color="#7C3AED" />
              <Text style={styles.benefitTitle}>Quality Care</Text>
              <Text style={styles.benefitDescription}>
                Experienced caregivers with relevant certifications
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to Look For</Text>
          <View style={styles.checklistCard}>
            <Text style={styles.checklistItem}>✓ Experience with infants and young children</Text>
            <Text style={styles.checklistItem}>✓ CPR and First Aid certification</Text>
            <Text style={styles.checklistItem}>✓ Clean background check</Text>
            <Text style={styles.checklistItem}>✓ Positive references from other families</Text>
            <Text style={styles.checklistItem}>✓ Availability matching your schedule</Text>
            <Text style={styles.checklistItem}>✓ Communication style that fits your family</Text>
          </View>
        </View>
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
  },
  heroSection: {
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroContent: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  findButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  findButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  benefitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  benefitDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checklistItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },
});
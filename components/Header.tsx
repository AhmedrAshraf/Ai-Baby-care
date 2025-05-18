import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu, ArrowLeft } from 'lucide-react-native';
import { useSidebar } from '@/contexts/SidebarContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  useGradient?: boolean;
  bottomElement?: React.ReactNode;
  hideMenuButton?: boolean;
}

export default function Header({ 
  title, 
  showBackButton = false,
  rightElement,
  useGradient = false,
  bottomElement,
  hideMenuButton = false
}: HeaderProps) {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();

  const headerContent = (
    <>
      <View style={styles.topRow}>
        {showBackButton && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={useGradient ? '#FFFFFF' : '#1F2937'} />
          </TouchableOpacity>
        )}
        
        <Text style={[
          styles.title, 
          { color: useGradient ? '#FFFFFF' : '#1F2937' },
          showBackButton && styles.titleWithBack
        ]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightContainer}>
          {rightElement}
          {!hideMenuButton && (
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Menu size={24} color={useGradient ? '#FFFFFF' : '#1F2937'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {bottomElement && (
        <View style={styles.bottomContainer}>
          {bottomElement}
        </View>
      )}
    </>
  );

  if (useGradient) {
    return (
      <LinearGradient
        colors={['#7C3AED', '#6D28D9']}
        style={styles.header}>
        {headerContent}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.header, { backgroundColor: '#FFFFFF' }]}>
      {headerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  titleWithBack: {
    marginLeft: 4,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 8,
  },
  bottomContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  }
}); 
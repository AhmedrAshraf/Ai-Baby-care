import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Baby, 
  Moon, 
  Syringe, 
  MessageCircle, 
  Activity, 
  Menu, 
  X, 
  Settings, 
  LogOut,
  Utensils,
  Variable as BabyCarriage,
  Bell,
  Users,
  Scroll as ScrollIcon,
  Brain,
  Music,
  Heart,
  Calendar,
  ChartBar
} from 'lucide-react-native';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const menuItems = [
  { icon: Baby, label: 'Today', route: '/(tabs)', color: '#8B5CF6' },
  { icon: Moon, label: 'Sleep', route: '/(tabs)/sleep', color: '#EC4899' },
  { icon: Syringe, label: 'Health', route: '/(tabs)/vaccinations', color: '#10B981' },
  { icon: MessageCircle, label: 'Ask AI', route: '/(tabs)/ask', color: '#6366F1' },
  { icon: Activity, label: 'Activity History', route: '/(tabs)/activity-history', color: '#F59E0B' },
];

const quickActions = [
  { icon: Utensils, label: 'Feeding', route: '/feeding', color: '#EC4899' },
  { icon: BabyCarriage, label: 'Diapers', route: '/diapers', color: '#14B8A6' },
  { icon: Heart, label: 'Health Log', route: '/health-log', color: '#10B981' },
  { icon: ScrollIcon, label: 'Milestones', route: '/milestones', color: '#6366F1' },
  { icon: Users, label: 'Find Sitter', route: '/find-sitter', color: '#F472B6' },
  { icon: Bell, label: 'Reminders', route: '/reminders', color: '#3B82F6' },
  { icon: ChartBar, label: 'Analysis', route: '/analysis', color: '#3B82F6' },
  
];

const bottomMenuItems = [
  { icon: Settings, label: 'Settings', route: '/settings', color: '#4B5563' },
  { icon: LogOut, label: 'Logout', route: '/logout', color: '#EF4444' },
];

export default function Sidebar() {
  const router = useRouter();
  const { isOpen, closeSidebar } = useSidebar();
  const { user, signOut } = useAuth();

  if (!isOpen) return null;

  const handleNavigation = (route: string) => {
    if (route === '/logout') {
      signOut();
      return;
    }
    router.push(route as any);
    closeSidebar();
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sidebar}>
        <LinearGradient
          colors={['#7C3AED', '#6D28D9']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Image
                source={{ 
                  uri: user?.user_metadata?.profile_photo_url || 
                       'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800'
                }}
                style={styles.profileImage}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {user?.user_metadata?.parent_name || user?.email?.split('@')[0] || 'User'}
                </Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Main Menu</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <item.icon size={20} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            {quickActions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <item.icon size={20} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.menuSection}>
            {bottomMenuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <item.icon size={20} color={item.color} />
                </View>
                <Text style={[styles.menuText, item.route === '/logout' && styles.logoutText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  closeButton: {
    padding: 8,
    marginLeft: 16,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 16,
  },
  menuSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  logoutText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
    marginHorizontal: 16,
  },
}); 
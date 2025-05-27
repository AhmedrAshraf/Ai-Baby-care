import React from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ActivityLogProvider } from '@/contexts/ActivityLogContext';
import { QuickActionsProvider } from '@/contexts/QuickActionsContext';
import { FeedingProvider } from '@/contexts/FeedingContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { SleepProvider } from '@/contexts/SleepContext';
import Sidebar from '../components/Sidebar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { DiaperProvider } from '@/contexts/DiaperContext';
import { VaccinationProvider } from '@/contexts/VaccinationContext';
import { MedicationProvider } from '@/contexts/MedicationContext';
import { MilestoneProvider } from '@/contexts/MilestoneContext';
import { WhiteNoiseProvider } from '@/contexts/WhiteNoiseContext';
import { HealthLogProvider } from '@/contexts/HealthLogContext';
import { ReminderProvider } from '@/contexts/ReminderContext';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthProvider>
      <SidebarProvider>
        <ActivityLogProvider>
          <HealthLogProvider>
          <DiaperProvider>
            <WhiteNoiseProvider>
              <ReminderProvider>
              <MilestoneProvider>
                <VaccinationProvider>
                  <MedicationProvider>
                  <QuickActionsProvider>
                    <FeedingProvider>
                      <SleepProvider>
                        <View style={{ flex: 1, paddingBottom: 22, backgroundColor: '#fff'}}>
                          <StatusBar style="dark" />
                          <Stack screenOptions={{ headerShown: false }} />
                          <Sidebar />
                        </View>
                      </SleepProvider>
                    </FeedingProvider>
                  </QuickActionsProvider>
                </MedicationProvider>
                </VaccinationProvider>
              </MilestoneProvider>
              </ReminderProvider>
            </WhiteNoiseProvider>
            </DiaperProvider>
          </HealthLogProvider>
        </ActivityLogProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}

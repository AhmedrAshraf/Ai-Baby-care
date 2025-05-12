import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider } from '@/contexts/AuthContext';
import { SleepProvider } from '@/contexts/SleepContext';
import { QuickActionsProvider } from '@/contexts/QuickActionsContext';
import { DiaperProvider } from '@/contexts/DiaperContext';
import { VaccinationProvider } from '@/contexts/VaccinationContext';
import { MedicationProvider } from '@/contexts/MedicationContext';
import { HealthLogProvider } from '@/contexts/HealthLogContext';
import { ReminderProvider } from '@/contexts/ReminderContext';
import { ActivityLogProvider } from '@/contexts/ActivityLogContext';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ActivityLogProvider>
        <QuickActionsProvider>
          <SleepProvider>
            <DiaperProvider>
              <VaccinationProvider>
                <MedicationProvider>
                  <HealthLogProvider>
                    <ReminderProvider>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="login" />
                        {/* <Stack.Screen name="register" /> */}
                        <Stack.Screen name="verify" />
                        {/* <Stack.Screen name="forgot-password" /> */}
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
                      </Stack>
                      <StatusBar style="auto" />
                    </ReminderProvider>
                  </HealthLogProvider>
                </MedicationProvider>
              </VaccinationProvider>
            </DiaperProvider>
          </SleepProvider>
        </QuickActionsProvider>
      </ActivityLogProvider>
    </AuthProvider>
  );
}
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function SleepLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="white-noise" />
    </Stack>
  );
}
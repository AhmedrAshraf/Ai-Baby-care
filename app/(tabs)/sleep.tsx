import React from 'react';
import { View, StyleSheet } from 'react-native';
import SleepScreen from '../sleep';

export default function TabSleepScreen() {
  return (
    <View style={styles.container}>
      <SleepScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useQuickActions } from '@/contexts/QuickActionsContext';
import { formatDistanceToNow } from 'date-fns';

type QuickActionProps = {
  type: string;
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  color: string;
};

export function QuickAction({ type, icon, title, onPress, color }: QuickActionProps) {
  const { getLastUsed, updateLastUsed } = useQuickActions();
  const lastUsed = getLastUsed(type);

  const handlePress = async () => {
    await updateLastUsed(type);
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={handlePress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={styles.actionText}>{title}</Text>
      {lastUsed && (
        <Text style={styles.lastUsed}>
          Last: {formatDistanceToNow(lastUsed, { addSuffix: true })}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
  },
  lastUsed: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLoading } from '../contexts/LoadingContext';

const LoadingOverlay = () => {
  const { isLoading, loadingCount } = useLoading();

  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#fff" />
      <Text style={styles.count}>{loadingCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  count: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
});

export default LoadingOverlay;

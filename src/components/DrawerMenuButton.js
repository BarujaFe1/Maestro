import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DrawerActions } from '@react-navigation/native';

function tryOpenDrawer(navigation) {
  if (!navigation) return false;

  if (typeof navigation.openDrawer === 'function') {
    navigation.openDrawer();
    return true;
  }

  try {
    navigation.dispatch(DrawerActions.openDrawer());
    return true;
  } catch {
    // noop
  }

  const parent = navigation.getParent?.();
  if (parent) return tryOpenDrawer(parent);

  return false;
}

export default function DrawerMenuButton({ navigation, color = '#111' }) {
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={() => tryOpenDrawer(navigation)}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={[styles.icon, { color }]}>{'☰'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6 },
  icon: { fontSize: 20, fontWeight: '800' },
});

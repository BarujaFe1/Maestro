import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { UNITS } from '../constants/units';

export default function UnitSwitcher({ value, onChange }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.wrap}>
      {UNITS.map((unit) => {
        const active = unit.id === value;
        return (
          <TouchableOpacity
            key={unit.id}
            style={[styles.item, active && { backgroundColor: unit.color, borderColor: unit.color }]}
            onPress={() => onChange(unit.id)}
          >
            <Text style={[styles.itemText, active && styles.itemTextActive]}>{unit.shortLabel}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    item: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    itemText: { color: theme.colors.text, fontWeight: '900' },
    itemTextActive: { color: '#ffffff' },
  });
}

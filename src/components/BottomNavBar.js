import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const ITEMS = [
  { key: 'Today', label: 'Hoje', icon: '⌂' },
  { key: 'StudentsHome', label: 'Alunos', icon: '👥' },
  { key: 'LessonsHome', label: 'Aulas', icon: '🎼' },
  { key: 'AttendanceHome', label: 'Presença', icon: '✓' },
];

export default function BottomNavBar({ activeRoute, navigation }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.wrap}>
      {ITEMS.map((item) => {
        const active = item.key === activeRoute;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => {
              if (item.key !== activeRoute) navigation.navigate(item.key);
            }}
          >
            <View style={[styles.iconBadge, active && styles.iconBadgeActive]}>
              <Text style={[styles.icon, active && styles.active]}>{item.icon}</Text>
            </View>
            <Text style={[styles.label, active && styles.active]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: 8,
      paddingBottom: 12,
      paddingHorizontal: 8,
    },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    iconBadge: {
      minWidth: 34,
      height: 34,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    iconBadgeActive: { backgroundColor: theme.colors.accentSoft },
    icon: { color: theme.colors.textMuted, fontSize: 16 },
    label: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '800' },
    active: { color: theme.colors.accent },
  });
}

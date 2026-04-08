import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LESSON_TYPE_OPTIONS, LESSON_STATUS, getLessonTypeLabel } from '../constants/lessonTypes';
import { useTheme } from '../theme/ThemeProvider';

export default function LessonTypeTabs({ value, expectedType, status, onChange }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const toneStyle =
    status === LESSON_STATUS.EXPECTED
      ? styles.statusExpected
      : status === LESSON_STATUS.DIVERGENT
      ? styles.statusDivergent
      : styles.statusException;

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {LESSON_TYPE_OPTIONS.map((option) => {
          const active = option.value === value;
          const isExpected = option.value === expectedType;
          return (
            <TouchableOpacity key={option.value} style={[styles.tab, active && styles.tabActive]} onPress={() => onChange(option.value)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{option.label}</Text>
              {isExpected ? <Text style={[styles.badge, active && styles.badgeActive]}>Esperada</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={[styles.statusBox, toneStyle]}>
        <Text style={styles.statusText}>Tipo esperado: {getLessonTypeLabel(expectedType)}</Text>
      </View>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { marginBottom: 4 },
    tabsRow: { flexDirection: 'row', gap: 8 },
    tab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 12,
      alignItems: 'center',
      gap: 5,
    },
    tabActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.chipBg },
    tabText: { color: theme.colors.text, fontWeight: '900' },
    tabTextActive: { color: theme.colors.accent },
    badge: {
      fontSize: 11,
      color: theme.colors.textMuted,
      backgroundColor: theme.colors.surfaceSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: 'hidden',
    },
    badgeActive: { color: theme.colors.accent },
    statusBox: { marginTop: 8, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12 },
    statusExpected: { backgroundColor: theme.colors.successSoft },
    statusDivergent: { backgroundColor: theme.colors.warningSoft },
    statusException: { backgroundColor: theme.colors.dangerSoft },
    statusText: { color: theme.colors.text, fontWeight: '800' },
  });
}

import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { clampScore } from '../utils/normalizers';

export default function ScoreInputRow({ label, value, onChange }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  const changeBy = (step) => onChange(clampScore(numericValue + step));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => changeBy(-0.5)}>
          <Text style={styles.stepText}>−</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={String(numericValue)}
          onChangeText={(text) => onChange(clampScore(text.replace(',', '.')))}
        />
        <TouchableOpacity style={styles.stepBtn} onPress={() => changeBy(0.5)}>
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 10
    },
    label: { flex: 1, color: theme.colors.text, fontWeight: '800' },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stepBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    stepText: { color: theme.colors.text, fontWeight: '900', fontSize: 18 },
    input: {
      minWidth: 56,
      textAlign: 'center',
      backgroundColor: theme.colors.inputBg,
      color: theme.colors.inputText,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontWeight: '900'
    }
  });
}

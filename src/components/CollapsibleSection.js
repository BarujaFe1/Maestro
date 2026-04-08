import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function CollapsibleSection({ title, subtitle, open, onToggle, children, rightText }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {!!rightText && <Text style={styles.rightText}>{rightText}</Text>}
        <Text style={styles.chevron}>{open ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 12,
      overflow: 'hidden'
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14
    },
    body: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: 14
    },
    title: { color: theme.colors.text, fontWeight: '900', fontSize: 15 },
    subtitle: { color: theme.colors.textMuted, marginTop: 4, fontWeight: '700', fontSize: 12 },
    rightText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12 },
    chevron: { color: theme.colors.textMuted, fontWeight: '900', fontSize: 14 }
  });
}

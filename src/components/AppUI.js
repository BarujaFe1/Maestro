import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function PageHeader({ title, subtitle, right }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {right ? <View style={{ marginLeft: 12 }}>{right}</View> : null}
    </View>
  );
}

export function SectionCard({ title, subtitle, right, children, style, compact = false }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      {(title || subtitle || right) ? (
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            {!!title && <Text style={styles.cardTitle}>{title}</Text>}
            {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function ContextBanner({ title, description, tone = 'info' }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const toneStyle = tone === 'success' ? styles.bannerSuccess : tone === 'warning' ? styles.bannerWarning : tone === 'danger' ? styles.bannerDanger : styles.bannerInfo;
  return (
    <View style={[styles.banner, toneStyle]}>
      <Text style={styles.bannerTitle}>{title}</Text>
      {!!description && <Text style={styles.bannerText}>{description}</Text>}
    </View>
  );
}

export function AppField({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', autoCapitalize = 'sentences', style }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={{ marginBottom: 10 }}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        style={[styles.field, multiline && { minHeight: 92, textAlignVertical: 'top' }, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function ButtonBase({ title, onPress, variant = 'primary', disabled = false, size = 'md', loading = false }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const containerStyle = variant === 'secondary' ? styles.secondaryBtn : variant === 'danger' ? styles.dangerBtn : variant === 'quiet' ? styles.quietBtn : styles.primaryBtn;
  const textStyle = variant === 'secondary' ? styles.secondaryBtnText : variant === 'danger' ? styles.primaryBtnText : variant === 'quiet' ? styles.quietBtnText : styles.primaryBtnText;
  const sizeStyle = size === 'sm' ? styles.btnSm : styles.btnMd;

  return (
    <TouchableOpacity style={[containerStyle, sizeStyle, disabled && { opacity: 0.65 }]} onPress={onPress} disabled={disabled || loading}>
      {loading ? <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'quiet' ? theme.colors.text : '#fff'} /> : <Text style={textStyle}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function PrimaryButton(props) { return <ButtonBase {...props} variant="primary" />; }
export function SecondaryButton(props) { return <ButtonBase {...props} variant="secondary" />; }
export function DangerButton(props) { return <ButtonBase {...props} variant="danger" />; }
export function QuietButton(props) { return <ButtonBase {...props} variant="quiet" />; }

export function Chip({ label, active = false, onPress, tone = 'default', small = false }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const containerStyle = tone === 'danger' ? styles.chipDanger : active ? styles.chipActive : styles.chip;
  const textStyle = tone === 'danger' ? styles.chipDangerText : active ? styles.chipActiveText : styles.chipText;
  return (
    <TouchableOpacity style={[containerStyle, small && styles.chipSmall]} onPress={onPress}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SuggestionChip({ label, onPress }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <TouchableOpacity style={styles.suggestionChip} onPress={onPress}>
      <Text style={styles.suggestionPrefix}>+</Text>
      <Text style={styles.suggestionText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState({ title, subtitle }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function ActionRow({ children, style, wrap = false }) {
  return <View style={[{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
}

function makeStyles(theme) {
  return StyleSheet.create({
    header: { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.text },
    headerSubtitle: { marginTop: 3, fontSize: 13, lineHeight: 18, color: theme.colors.textMuted },
    card: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      shadowColor: theme.colors.shadow,
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: theme.mode === 'dark' ? 0 : 2,
    },
    cardCompact: { padding: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
    cardTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 15 },
    cardSubtitle: { marginTop: 2, fontSize: 12, lineHeight: 17, color: theme.colors.textMuted },
    banner: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12 },
    bannerInfo: { backgroundColor: theme.colors.accentSoft },
    bannerSuccess: { backgroundColor: theme.colors.successSoft },
    bannerWarning: { backgroundColor: theme.colors.warningSoft },
    bannerDanger: { backgroundColor: theme.colors.dangerSoft },
    bannerTitle: { color: theme.colors.text, fontWeight: '900' },
    bannerText: { color: theme.colors.textMuted, marginTop: 3, lineHeight: 17 },
    fieldLabel: { color: theme.colors.text, fontSize: 13, fontWeight: '800', marginBottom: 6 },
    field: {
      backgroundColor: theme.colors.inputBg,
      color: theme.colors.inputText,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontWeight: '700'
    },
    primaryBtn: { backgroundColor: theme.colors.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    secondaryBtn: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    dangerBtn: { backgroundColor: theme.colors.danger, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    quietBtn: { backgroundColor: theme.colors.surfaceMuted, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    btnMd: { paddingVertical: 12, paddingHorizontal: 14 },
    btnSm: { paddingVertical: 9, paddingHorizontal: 12 },
    primaryBtnText: { color: '#fff', fontWeight: '900' },
    secondaryBtnText: { color: theme.colors.text, fontWeight: '900' },
    quietBtnText: { color: theme.colors.textMuted, fontWeight: '900' },
    chip: { backgroundColor: theme.colors.surfaceSoft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 10 },
    chipText: { color: theme.colors.text, fontWeight: '800' },
    chipActive: { backgroundColor: theme.colors.chipBg, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 10 },
    chipActiveText: { color: theme.colors.chipText, fontWeight: '900' },
    chipDanger: { backgroundColor: theme.colors.dangerSoft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 10 },
    chipDangerText: { color: theme.colors.danger, fontWeight: '900' },
    chipSmall: { paddingVertical: 6, paddingHorizontal: 9 },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.surfaceSoft,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    suggestionPrefix: { color: theme.colors.accent, fontWeight: '900' },
    suggestionText: { color: theme.colors.text, fontWeight: '800' },
    emptyWrap: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 18, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { color: theme.colors.text, fontWeight: '900' },
    emptySubtitle: { color: theme.colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  });
}

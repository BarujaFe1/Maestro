import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { mergeUniqueItems } from '../utils/bulkInputParser';
import { useTheme } from '../theme/ThemeProvider';
import { QuietButton, SuggestionChip } from './AppUI';

export default function BulkEntryField({
  title,
  placeholder,
  helperText,
  parser,
  items,
  onChange,
  mapParsed = (parsed) => parsed,
  getItemKey = (item) => item,
  getItemLabel = (item) => String(item),
  suggestions = [],
  embedded = false,
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [input, setInput] = useState('');

  const preview = useMemo(() => {
    const parsed = parser ? parser(input) : [];
    return mapParsed(parsed);
  }, [input, parser, mapParsed]);

  const addPreview = () => {
    if (!preview.length) return;
    const next = mergeUniqueItems(items, preview, getItemKey);
    onChange(next);
    setInput('');
  };

  const removeItem = (item) => {
    onChange((items || []).filter((current) => getItemKey(current) !== getItemKey(item)));
  };

  return (
    <View style={[styles.block, embedded && styles.embeddedBlock]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <QuietButton title="Adicionar" size="sm" onPress={addPreview} disabled={!preview.length} />
      </View>
      {!!helperText && <Text style={styles.helper}>{helperText}</Text>}

      <TextInput
        style={[styles.input, embedded && styles.embeddedInput]}
        value={input}
        onChangeText={setInput}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
      />

      {!!preview.length && (
        <View style={styles.metaBlock}>
          <Text style={styles.metaTitle}>Prévia</Text>
          <View style={styles.chipsWrap}>
            {preview.map((item) => (
              <View key={`preview-${String(getItemKey(item))}`} style={styles.previewChip}>
                <Text style={styles.previewChipText}>{getItemLabel(item)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!!suggestions.length && (
        <View style={styles.metaBlock}>
          <Text style={styles.metaTitle}>Recentes</Text>
          <View style={styles.chipsWrap}>
            {suggestions.map((item) => (
              <SuggestionChip
                key={`suggestion-${String(getItemKey(item))}`}
                label={getItemLabel(item)}
                onPress={() => onChange(mergeUniqueItems(items, [item], getItemKey))}
              />
            ))}
          </View>
        </View>
      )}

      {!!items?.length && (
        <View style={styles.metaBlock}>
          <Text style={styles.metaTitle}>Selecionados</Text>
          <View style={styles.chipsWrap}>
            {items.map((item) => (
              <TouchableOpacity key={String(getItemKey(item))} style={styles.selectedChip} onPress={() => removeItem(item)}>
                <Text style={styles.selectedChipText}>{getItemLabel(item)} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    block: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    embeddedBlock: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      marginBottom: 12,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    title: { color: theme.colors.text, fontWeight: '900' },
    helper: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 8, lineHeight: 17 },
    input: {
      backgroundColor: theme.colors.inputBg,
      color: theme.colors.inputText,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
    },
    embeddedInput: { marginTop: 6 },
    metaBlock: { marginTop: 10 },
    metaTitle: { color: theme.colors.textSoft, fontSize: 12, fontWeight: '800', marginBottom: 6 },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    previewChip: { backgroundColor: theme.colors.surfaceSoft, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 10 },
    previewChipText: { color: theme.colors.text, fontWeight: '800' },
    selectedChip: { backgroundColor: theme.colors.chipBg, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    selectedChipText: { color: theme.colors.chipText, fontWeight: '900' },
  });
}

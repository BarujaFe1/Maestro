import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export default function MultiSelectModal({
  label,
  values = [],
  options = [],
  onChange,
  placeholder = 'Selecionar itens',
  searchable = true,
  onCreateOption,
  createLabel = 'Adicionar novo item'
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((item) => String(item.label).toLowerCase().includes(query));
  }, [options, search]);

  const selectedLabels = useMemo(() => {
    const map = new Map((options || []).map((item) => [item.value, item.label]));
    return values.map((value) => map.get(value) || value);
  }, [options, values]);

  const toggleValue = (value) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    onChange([...values, value]);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        style={styles.field}
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
      >
        <Text style={[styles.fieldText, !selectedLabels.length && { color: theme.colors.placeholder }]} numberOfLines={2}>
          {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
        </Text>
        <Text style={styles.chev}>▾</Text>
      </Pressable>

      {!!selectedLabels.length && (
        <View style={styles.chipsWrap}>
          {selectedLabels.map((labelText, index) => (
            <TouchableOpacity key={`${labelText}-${index}`} style={styles.chip} onPress={() => onChange(values.filter((item) => item !== values[index]))}>
              <Text style={styles.chipText}>{labelText} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Modal visible={open} animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label || 'Selecionar itens'}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={styles.close}>Concluir</Text>
            </TouchableOpacity>
          </View>

          {searchable && (
            <TextInput
              style={styles.search}
              placeholder="Buscar..."
              placeholderTextColor={theme.colors.placeholder}
              value={search}
              onChangeText={setSearch}
            />
          )}

          {!!onCreateOption && (
            <TouchableOpacity style={styles.createBtn} onPress={() => onCreateOption(search)}>
              <Text style={styles.createText}>{createLabel}</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.value)}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const active = values.includes(item.value);
              return (
                <TouchableOpacity style={[styles.item, active && styles.itemActive]} onPress={() => toggleValue(item.value)}>
                  <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
                  <Text style={[styles.itemCheck, active && styles.itemCheckActive]}>{active ? 'Selecionado' : 'Toque para marcar'}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    label: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 6 },
    field: {
      backgroundColor: theme.colors.inputBg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    fieldText: { flex: 1, fontWeight: '800', color: theme.colors.inputText, paddingRight: 12 },
    chev: { color: theme.colors.textMuted, fontSize: 16, fontWeight: '900' },
    modalWrap: { flex: 1, backgroundColor: theme.colors.bg },
    modalHeader: {
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
    close: { color: theme.colors.accent, fontWeight: '900' },
    search: {
      backgroundColor: theme.colors.inputBg,
      color: theme.colors.inputText,
      marginHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12
    },
    createBtn: {
      marginHorizontal: 12,
      marginTop: 10,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center'
    },
    createText: { color: theme.colors.text, fontWeight: '900' },
    item: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10
    },
    itemActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.chipBg
    },
    itemText: { color: theme.colors.text, fontWeight: '800' },
    itemTextActive: { color: theme.colors.accent, fontWeight: '900' },
    itemCheck: { color: theme.colors.textMuted, marginTop: 4, fontSize: 12, fontWeight: '700' },
    itemCheckActive: { color: theme.colors.accent },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: { backgroundColor: theme.colors.chipBg, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    chipText: { color: theme.colors.chipText, fontWeight: '900' }
  });
}

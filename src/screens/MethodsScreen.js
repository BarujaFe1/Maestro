import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { deleteMethod, listCustomMethods, listInstruments, listOfficialMethods, saveMethod } from '../services/db';
import SelectModal from '../components/SelectModal';
import { useTheme } from '../theme/ThemeProvider';
import { ActionRow, AppField, Chip, EmptyState, PageHeader, PrimaryButton, QuietButton, SecondaryButton, SectionCard } from '../components/AppUI';

const emptyForm = { id: null, name: '', instruments: [], active: true, notes: '' };

const CustomMethodRow = React.memo(function CustomMethodRow({ item, onEdit, onDelete }) {
  return (
    <SectionCard title={item.name} subtitle={`Compatível com: ${item.instruments?.length ? item.instruments.join(', ') : 'Todos'}`} compact>
      {!!item.notes && <Text style={{ color: '#64748b' }}>Obs.: {item.notes}</Text>}
      <ActionRow style={{ marginTop: 10 }}>
        <View style={{ flex: 1 }}><SecondaryButton title="Editar" onPress={() => onEdit(item)} size="sm" /></View>
        <View style={{ flex: 1 }}><SecondaryButton title="Excluir" onPress={() => onDelete(item)} size="sm" /></View>
      </ActionRow>
    </SectionCard>
  );
});

export default function MethodsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [officialMethods, setOfficialMethods] = useState([]);
  const [customMethods, setCustomMethods] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [instrumentToAdd, setInstrumentToAdd] = useState('');

  const instrumentOptions = useMemo(() => (instruments || []).map((i) => ({ label: i.label, value: i.label })), [instruments]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [official, custom, inst] = await Promise.all([listOfficialMethods(), listCustomMethods(), listInstruments()]);
      setOfficialMethods(Array.isArray(official) ? official : []);
      setCustomMethods(Array.isArray(custom) ? custom : []);
      setInstruments(Array.isArray(inst) ? inst : []);
    } catch (e) {
      setLoadError(e.message || 'Falha ao carregar métodos.');
      setOfficialMethods([]);
      setCustomMethods([]);
      setInstruments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredOfficial = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (officialMethods || []).filter((item) => {
      const matchesQuery = !q || item.name.toLowerCase().includes(q);
      const matchesInstrument = !instrumentFilter || (item.instruments || []).includes(instrumentFilter);
      return matchesQuery && matchesInstrument;
    });
  }, [officialMethods, query, instrumentFilter]);

  const filteredCustom = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (customMethods || []).filter((item) => {
      const matchesQuery = !q || item.name.toLowerCase().includes(q);
      const matchesInstrument = !instrumentFilter || (item.instruments || []).includes(instrumentFilter);
      return matchesQuery && matchesInstrument;
    });
  }, [customMethods, query, instrumentFilter]);

  const officialByInstrument = useMemo(() => {
    const groups = {};
    (instruments || []).forEach((instrument) => { groups[instrument.label] = []; });
    filteredOfficial.forEach((method) => {
      (method.instruments || []).forEach((instrumentLabel) => {
        if (!groups[instrumentLabel]) groups[instrumentLabel] = [];
        groups[instrumentLabel].push(method);
      });
    });
    return groups;
  }, [filteredOfficial, instruments]);

  const openNew = () => {
    setForm(emptyForm);
    setInstrumentToAdd('');
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setForm({ ...emptyForm, ...item, instruments: item.instruments || [] });
    setInstrumentToAdd('');
    setModalVisible(true);
  };

  const addInstrument = () => {
    if (!instrumentToAdd || form.instruments.includes(instrumentToAdd)) return;
    setForm((prev) => ({ ...prev, instruments: [...prev.instruments, instrumentToAdd] }));
    setInstrumentToAdd('');
  };

  const removeInstrument = (instrument) => setForm((prev) => ({ ...prev, instruments: prev.instruments.filter((i) => i !== instrument) }));

  const onSave = async () => {
    if (!form.name.trim()) return Alert.alert('Atenção', 'Informe o nome do método.');
    if (!form.instruments.length) return Alert.alert('Atenção', 'Selecione pelo menos um instrumento compatível.');
    try {
      await saveMethod({ ...form, name: form.name.trim() });
      setModalVisible(false);
      load();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar método.');
    }
  };

  const onDelete = (item) => {
    Alert.alert('Excluir método', `Deseja excluir "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteMethod(item.id); load(); } },
    ]);
  };

  const openPdf = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Não foi possível abrir', 'Este dispositivo não conseguiu abrir o PDF deste método.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Não foi possível abrir', 'Tente novamente mais tarde ou copie o link do método.');
    }
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={filteredCustom}
        keyExtractor={(item) => item.id}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={8}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accent} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <PageHeader title="Métodos" subtitle="Catálogo oficial, PDFs de apoio e métodos customizados da base." right={<PrimaryButton title="Novo método" size="sm" onPress={openNew} />} />

            {loadError ? (
              <SectionCard title="Não foi possível carregar tudo" subtitle={loadError}>
                <PrimaryButton title="Tentar novamente" onPress={load} />
              </SectionCard>
            ) : null}

            <SectionCard title="Busca e recorte" compact>
              <AppField label="Buscar método" value={query} onChangeText={setQuery} placeholder="Ex.: Almeida Dias" />
              <SelectModal label="Instrumento" value={instrumentFilter} options={[{ label: 'Todos', value: '' }, ...instrumentOptions]} onChange={setInstrumentFilter} placeholder="Todos" />
            </SectionCard>

            <SectionCard title="Catálogo oficial" subtitle="Métodos de referência por instrumento, com PDF quando disponível.">
              {(instruments || []).map((instrument) => {
                if (instrumentFilter && instrumentFilter !== instrument.label) return null;
                const items = officialByInstrument[instrument.label] || [];
                return (
                  <View key={instrument.id} style={styles.instrumentGroup}>
                    <Text style={styles.instrumentTitle}>{instrument.label}</Text>
                    {items.length ? items.map((method) => (
                      <View key={`${instrument.id}-${method.id}`} style={styles.officialCard}>
                        <View style={styles.officialHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{method.name}{method.volume ? ` • Vol. ${method.volume}` : ''}</Text>
                            <Text style={styles.meta}>{method.family || instrument.family}{method.total_pages ? ` • ${method.total_pages} páginas` : ''}</Text>
                          </View>
                          <Chip label="Oficial" active small />
                        </View>
                        {method.pdf_url ? (
                          <ActionRow style={{ marginTop: 8 }}>
                            <QuietButton title="Abrir PDF" size="sm" onPress={() => openPdf(method.pdf_url)} />
                          </ActionRow>
                        ) : null}
                      </View>
                    )) : <Text style={styles.emptyInline}>Sem método oficial catalogado para este instrumento.</Text>}
                  </View>
                );
              })}
            </SectionCard>

            <SectionCard title="Métodos customizados" subtitle={`${filteredCustom.length} item(ns) no recorte atual.`} compact />
          </View>
        }
        ListEmptyComponent={<EmptyState title="Nenhum método customizado" subtitle="Você pode cadastrar um método próprio sem afetar o catálogo oficial." />}
        renderItem={({ item }) => <CustomMethodRow item={item} onEdit={openEdit} onDelete={onDelete} />}
      />

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <PageHeader title={form.id ? 'Editar método' : 'Novo método'} subtitle="Cadastro de método customizado." />
          <AppField label="Nome do método" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Nome do método" />
          <SelectModal label="Adicionar instrumento compatível" value={instrumentToAdd} options={[{ label: 'Selecionar', value: '' }, ...instrumentOptions]} onChange={setInstrumentToAdd} allowClear />
          <QuietButton title="Adicionar instrumento" onPress={addInstrument} size="sm" />
          <View style={styles.chipsWrap}>
            {(form.instruments || []).map((instrument) => (
              <TouchableOpacity key={instrument} style={styles.chip} onPress={() => removeInstrument(instrument)}>
                <Text style={styles.chipText}>{instrument} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
          <AppField label="Observações" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Observações do método" multiline />
          <ActionRow>
            <View style={{ flex: 1 }}><SecondaryButton title="Cancelar" onPress={() => setModalVisible(false)} /></View>
            <View style={{ flex: 1 }}><PrimaryButton title="Salvar" onPress={onSave} /></View>
          </ActionRow>
        </ScrollView>
      </Modal>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    instrumentGroup: { marginBottom: 14 },
    instrumentTitle: { color: theme.colors.text, fontWeight: '900', marginBottom: 8 },
    officialCard: { padding: 12, borderRadius: 14, backgroundColor: theme.colors.surfaceMuted, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
    officialHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    name: { color: theme.colors.text, fontWeight: '900' },
    meta: { color: theme.colors.textMuted, marginTop: 4 },
    emptyInline: { color: theme.colors.textMuted, fontStyle: 'italic', paddingVertical: 4 },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { backgroundColor: theme.colors.chipBg, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    chipText: { color: theme.colors.chipText, fontWeight: '900' },
  });
}

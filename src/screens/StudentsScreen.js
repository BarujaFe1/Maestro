import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import { deleteStudent, listStudents, saveStudent } from '../services/db';
import SelectModal from '../components/SelectModal';
import { CONGREGATIONS, GRADUATIONS, INSTRUMENTS, INSTRUMENT_FAMILIES, getFamilyByInstrument } from '../data/catalogs';
import { useTheme } from '../theme/ThemeProvider';
import { ActionRow, AppField, EmptyState, PageHeader, PrimaryButton, QuietButton, SecondaryButton, SectionCard } from '../components/AppUI';

const emptyForm = {
  id: null,
  full_name: '',
  category: '',
  instrument: '',
  level: '',
  start_date: dayjs().format('YYYY-MM-DD'),
  status: 'ativo',
  observations: '',
  congregation: '',
  address: '',
  phone: '',
  birth_date: '',
  baptism_date: '',
  instrument_change_note: ''
};

const initialFilters = { search: '', instrument: '', category: '', level: '', status: '' };

const StudentRow = React.memo(function StudentRow({ item, onOpen, onEdit, onDelete, theme }) {
  const styles = makeStyles(theme);
  return (
    <TouchableOpacity style={styles.card} onPress={() => onOpen(item.id)}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.meta}>{item.instrument || '-'} • {item.category || '-'} • {item.level || '-'}</Text>
          <Text style={styles.meta}>{item.congregation || '-'} • {item.status || '-'}</Text>
        </View>
        <QuietButton title="Editar" size="sm" onPress={() => onEdit(item)} />
      </View>
      <ActionRow style={{ marginTop: 10 }}>
        <View style={{ flex: 1 }}><SecondaryButton title="Abrir" onPress={() => onOpen(item.id)} size="sm" /></View>
        <View style={{ flex: 1 }}><SecondaryButton title="Excluir" onPress={() => onDelete(item)} size="sm" /></View>
      </ActionRow>
    </TouchableOpacity>
  );
});

export default function StudentsScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [filters, setFilters] = useState(initialFilters);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [customCongregation, setCustomCongregation] = useState('');

  const instrumentOptions = useMemo(() => INSTRUMENTS.map((i) => ({ label: i.label, value: i.label })), []);
  const familyOptions = useMemo(() => INSTRUMENT_FAMILIES.map((v) => ({ label: v, value: v })), []);
  const graduationOptions = useMemo(() => GRADUATIONS.map((v) => ({ label: v, value: v })), []);
  const statusOptions = useMemo(() => ['ativo', 'inativo'].map((v) => ({ label: v, value: v })), []);
  const congregationOptions = useMemo(() => [...CONGREGATIONS, 'Outra'].map((v) => ({ label: v, value: v })), []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listStudents(filters);
      setStudents(data || []);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setForm({ ...emptyForm });
    setCustomCongregation('');
    setModalVisible(true);
  };

  const openEdit = (student) => {
    const isCustom = student.congregation && !CONGREGATIONS.includes(student.congregation);
    setForm({ ...emptyForm, ...student, congregation: isCustom ? 'Outra' : (student.congregation || '') });
    setCustomCongregation(isCustom ? student.congregation : '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setForm(emptyForm);
    setCustomCongregation('');
  };

  const onSelectInstrument = (instrument) => {
    const family = getFamilyByInstrument(instrument);
    setForm((prev) => ({ ...prev, instrument, category: family }));
  };

  const onSave = async () => {
    if (!form.full_name?.trim()) return Alert.alert('Atenção', 'Informe o nome completo.');
    if (!form.instrument) return Alert.alert('Atenção', 'Selecione o instrumento.');
    if (!form.level) return Alert.alert('Atenção', 'Selecione a graduação.');

    try {
      setSaving(true);
      const finalCongregation = form.congregation === 'Outra' ? customCongregation.trim() : form.congregation;
      await saveStudent({ ...form, full_name: form.full_name.trim(), congregation: finalCongregation || null });
      closeModal();
      await load();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (student) => {
    Alert.alert('Excluir aluno', `Deseja excluir "${student.full_name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { try { await deleteStudent(student.id); await load(); } catch (e) { Alert.alert('Erro', e.message || 'Falha ao excluir.'); } } },
    ]);
  };

  const clearFilters = async () => {
    setFilters(initialFilters);
    try {
      setLoading(true);
      const data = await listStudents(initialFilters);
      setStudents(data || []);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao limpar filtros.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accent} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <PageHeader title="Alunos" subtitle="Consulta rápida, filtros úteis e cadastro sem excesso de ruído." right={<PrimaryButton title="Novo aluno" size="sm" onPress={openNew} />} />

            <SectionCard title="Filtros" subtitle={`${students.length} resultado(s) no recorte atual.`} compact>
              <AppField label="Buscar por nome" value={filters.search} onChangeText={(v) => setFilters((f) => ({ ...f, search: v }))} placeholder="Ex.: João" />
              <SelectModal label="Instrumento" value={filters.instrument} options={[{ label: 'Todos', value: '' }, ...instrumentOptions]} onChange={(v) => setFilters((f) => ({ ...f, instrument: v }))} />
              <ActionRow>
                <View style={{ flex: 1 }}><SelectModal label="Família" value={filters.category} options={[{ label: 'Todas', value: '' }, ...familyOptions]} onChange={(v) => setFilters((f) => ({ ...f, category: v }))} /></View>
                <View style={{ flex: 1 }}><SelectModal label="Graduação" value={filters.level} options={[{ label: 'Todas', value: '' }, ...graduationOptions]} onChange={(v) => setFilters((f) => ({ ...f, level: v }))} /></View>
              </ActionRow>
              <SelectModal label="Status" value={filters.status} options={[{ label: 'Todos', value: '' }, ...statusOptions]} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
              <ActionRow>
                <View style={{ flex: 1 }}><PrimaryButton title="Aplicar" onPress={load} size="sm" /></View>
                <View style={{ flex: 1 }}><SecondaryButton title="Limpar" onPress={clearFilters} size="sm" /></View>
              </ActionRow>
            </SectionCard>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Nenhum aluno encontrado" subtitle="Ajuste os filtros ou cadastre um novo aluno." />}
        renderItem={({ item }) => <StudentRow item={item} onOpen={(studentId) => navigation.navigate('StudentDetail', { studentId })} onEdit={openEdit} onDelete={onDelete} theme={theme} />}
      />

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <PageHeader title={form.id ? 'Editar aluno' : 'Novo aluno'} subtitle="Cadastro enxuto com família do instrumento preenchida automaticamente." />
          <AppField label="Nome completo" value={form.full_name} onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))} placeholder="Nome completo" />
          <SectionCard title="Família do instrumento" compact><Text style={styles.readonlyText}>{form.category || 'Será preenchida automaticamente'}</Text></SectionCard>
          <SelectModal label="Instrumento" value={form.instrument} options={instrumentOptions} onChange={onSelectInstrument} />
          <SelectModal label="Graduação" value={form.level} options={graduationOptions} onChange={(v) => setForm((f) => ({ ...f, level: v }))} />
          <SelectModal label="Congregação" value={form.congregation} options={congregationOptions} onChange={(v) => setForm((f) => ({ ...f, congregation: v }))} />
          {form.congregation === 'Outra' ? <AppField label="Congregação personalizada" value={customCongregation} onChangeText={setCustomCongregation} placeholder="Digite a congregação" /> : null}
          <AppField label="Início das aulas" value={form.start_date} onChangeText={(v) => setForm((f) => ({ ...f, start_date: v }))} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <AppField label="Endereço" value={form.address} onChangeText={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Endereço" />
          <AppField label="Celular" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="Número de celular" keyboardType="phone-pad" />
          <AppField label="Nascimento" value={form.birth_date} onChangeText={(v) => setForm((f) => ({ ...f, birth_date: v }))} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <AppField label="Batismo" value={form.baptism_date} onChangeText={(v) => setForm((f) => ({ ...f, baptism_date: v }))} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <AppField label="Mudança de instrumento" value={form.instrument_change_note} onChangeText={(v) => setForm((f) => ({ ...f, instrument_change_note: v }))} placeholder="Ex.: Violino → Viola" />
          <SelectModal label="Status" value={form.status} options={statusOptions} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
          <AppField label="Observações" value={form.observations} onChangeText={(v) => setForm((f) => ({ ...f, observations: v }))} placeholder="Observações gerais" multiline />
          <ActionRow>
            <View style={{ flex: 1 }}><SecondaryButton title="Cancelar" onPress={closeModal} /></View>
            <View style={{ flex: 1 }}><PrimaryButton title="Salvar" onPress={onSave} loading={saving} /></View>
          </ActionRow>
        </ScrollView>
      </Modal>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    card: { backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    name: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
    meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, fontWeight: '700' },
    readonlyText: { color: theme.colors.text, fontWeight: '900' },
  });
}

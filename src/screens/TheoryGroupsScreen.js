import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../theme/ThemeProvider';
import { useOperational } from '../context/OperationalContext';
import { listStudentsBasic } from '../services/db';
import { getUnitById, resolveStudentUnitId } from '../constants/units';
import { deleteTheoryGroup, listTheoryGroups, saveTheoryGroup } from '../utils/theoryGroupsStore';
import UnitSwitcher from '../components/UnitSwitcher';
import { AppField, Chip, DangerButton, EmptyState, PageHeader, PrimaryButton, SectionCard } from '../components/AppUI';

export default function TheoryGroupsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { activeUnitId, setActiveUnitId } = useOperational();

  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', student_ids: [] });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsData, groupsData] = await Promise.all([
        listStudentsBasic(),
        listTheoryGroups(activeUnitId),
      ]);
      setStudents(studentsData || []);
      setGroups(groupsData || []);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar grupos teóricos.');
    } finally {
      setLoading(false);
    }
  }, [activeUnitId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filteredStudents = useMemo(
    () => (students || []).filter((student) => {
      const inferred = resolveStudentUnitId(student);
      return !inferred || inferred === activeUnitId;
    }),
    [students, activeUnitId]
  );

  const unit = getUnitById(activeUnitId);

  const toggleStudent = (studentId) => {
    setForm((prev) => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter((id) => id !== studentId)
        : [...prev.student_ids, studentId],
    }));
  };

  const resetForm = () => setForm({ id: '', name: '', student_ids: [] });

  const onSave = async () => {
    try {
      setSaving(true);
      await saveTheoryGroup({ ...form, unit_id: activeUnitId });
      resetForm();
      load();
      Alert.alert('Sucesso', 'Grupo teórico salvo.');
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar grupo.');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (group) => setForm({ id: group.id, name: group.name, student_ids: group.student_ids || [] });

  const onDelete = (group) => {
    Alert.alert('Excluir grupo', `Deseja excluir o grupo "${group.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteTheoryGroup(group.id);
          if (form.id === group.id) resetForm();
          load();
        },
      },
    ]);
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      data={groups}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accent} />}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View>
          <PageHeader title="Grupos teóricos" subtitle="Cadastre grupos de alunos para agilizar aulas teóricas em grupo." />
          <SectionCard title="Unidade" subtitle="Os grupos são separados por unidade.">
            <UnitSwitcher value={activeUnitId} onChange={setActiveUnitId} />
            <Text style={styles.helper}>Unidade atual: {unit.label}</Text>
          </SectionCard>

          <SectionCard title={form.id ? 'Editar grupo' : 'Novo grupo'} subtitle="Defina o nome e marque os alunos que pertencem ao grupo.">
            <AppField label="Nome do grupo" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} placeholder="Ex.: Teoria sábado 1" />
            <Text style={styles.blockTitle}>Alunos do grupo</Text>
            <View style={styles.chipsWrap}>
              {filteredStudents.map((student) => (
                <Chip
                  key={student.id}
                  label={student.full_name}
                  active={form.student_ids.includes(student.id)}
                  onPress={() => toggleStudent(student.id)}
                />
              ))}
            </View>
            <View style={styles.buttonRow}>
              <View style={{ flex: 1 }}><PrimaryButton title={saving ? 'Salvando...' : form.id ? 'Atualizar grupo' : 'Salvar grupo'} onPress={onSave} disabled={saving} /></View>
              <View style={{ flex: 1 }}><DangerButton title="Limpar" onPress={resetForm} /></View>
            </View>
          </SectionCard>
        </View>
      }
      ListEmptyComponent={<EmptyState title="Nenhum grupo teórico" subtitle="Cadastre o primeiro grupo para usar seleção rápida em aulas teóricas." />}
      renderItem={({ item }) => (
        <SectionCard title={item.name} subtitle={`${(item.student_ids || []).length} aluno(s) • ${unit.label}`}>
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }}><PrimaryButton title="Editar" onPress={() => onEdit(item)} /></View>
            <View style={{ flex: 1 }}><DangerButton title="Excluir" onPress={() => onDelete(item)} /></View>
          </View>
        </SectionCard>
      )}
    />
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    helper: { color: theme.colors.textMuted },
    blockTitle: { color: theme.colors.text, fontWeight: '900', marginBottom: 8 },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    buttonRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  });
}

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import KpiCard from '../components/KpiCard';
import SelectModal from '../components/SelectModal';
import { GRADUATIONS, META_STATUSES } from '../data/catalogs';
import { listGroups, listTeachers, syncGoalsDashboard } from '../services/db';
import { useTheme } from '../theme/ThemeProvider';

const initialFilters = {
  instrument: '',
  level: '',
  status: '',
  group_id: '',
  teacher_id: ''
};

export default function GoalsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [filters, setFilters] = useState(initialFilters);
  const [bundle, setBundle] = useState({ students: [], goals: [], computed: [] });
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    try {
      const [goalBundle, groupsData, teachersData] = await Promise.all([
        syncGoalsDashboard(filters),
        listGroups(),
        listTeachers()
      ]);
      setBundle(goalBundle);
      setGroups(groupsData);
      setTeachers(teachersData);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao carregar metas.');
    }
  }, [filters]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const rows = useMemo(() => {
    const goalsMap = Object.fromEntries((bundle.goals || []).map((goal) => [goal.student_id, goal]));
    return (bundle.computed || []).map((item) => {
      const goal = goalsMap[item.student_id] || item;
      return {
        ...item,
        goal,
        progress_percent: goal.progress_percent || item.progress_percent || 0,
        status: goal.status || item.status || 'em atenção',
        target_level: goal.target_level || item.target_level,
        target_date: goal.target_date || item.target_date
      };
    }).filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      return true;
    }).sort((a, b) => (b.progress_percent || 0) - (a.progress_percent || 0));
  }, [bundle, filters.status]);

  const kpis = useMemo(() => ({
    total: rows.length,
    near: rows.filter((item) => item.progress_percent >= 80 && item.progress_percent < 100).length,
    delayed: rows.filter((item) => item.status === 'atrasado').length,
    attention: rows.filter((item) => item.status === 'em atenção').length
  }), [rows]);

  const instrumentOptions = useMemo(() => {
    const values = [...new Set((bundle.students || []).map((item) => item.instrument).filter(Boolean))];
    return [{ label: 'Todos', value: '' }, ...values.map((item) => ({ label: item, value: item }))];
  }, [bundle.students]);
  const levelOptions = useMemo(() => [{ label: 'Todas', value: '' }, ...GRADUATIONS.map((item) => ({ label: item, value: item }))], []);
  const statusOptions = useMemo(() => [{ label: 'Todos', value: '' }, ...META_STATUSES.map((item) => ({ label: item, value: item }))], []);
  const groupOptions = useMemo(() => [{ label: 'Todos', value: '' }, ...groups.map((item) => ({ label: item.name, value: item.id }))], [groups]);
  const teacherOptions = useMemo(() => [{ label: 'Todos', value: '' }, ...teachers.map((item) => ({ label: item.full_name, value: item.id }))], [teachers]);

  return (
    <View style={styles.wrap}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.student_id}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Metas</Text>
            <Text style={styles.subtitle}>Meta ativa principal por aluno, calculada sobre programa mínimo e histórico real.</Text>

            <View style={styles.kpiGrid}>
              <KpiCard title="Metas ativas" value={kpis.total} />
              <KpiCard title="Próximos da etapa" value={kpis.near} subtitle="80% ou mais" />
              <KpiCard title="Atrasados" value={kpis.delayed} />
              <KpiCard title="Em atenção" value={kpis.attention} />
            </View>

            <SelectModal label="Instrumento" value={filters.instrument} options={instrumentOptions} onChange={(value) => setFilters((prev) => ({ ...prev, instrument: value }))} />
            <SelectModal label="Graduação atual" value={filters.level} options={levelOptions} onChange={(value) => setFilters((prev) => ({ ...prev, level: value }))} />
            <SelectModal label="Status" value={filters.status} options={statusOptions} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} />
            <SelectModal label="Grupo" value={filters.group_id} options={groupOptions} onChange={(value) => setFilters((prev) => ({ ...prev, group_id: value }))} />
            <SelectModal label="Instrutor" value={filters.teacher_id} options={teacherOptions} onChange={(value) => setFilters((prev) => ({ ...prev, teacher_id: value }))} />

            <View style={styles.row}>
              <TouchableOpacity style={styles.primaryBtn} onPress={load}>
                <Text style={styles.primaryText}>Recalcular metas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setFilters(initialFilters)}>
                <Text style={styles.secondaryText}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setDetail(item)}>
            <Text style={styles.name}>{item.student?.full_name || 'Aluno'}</Text>
            <Text style={styles.meta}>{item.student?.instrument || '-'} • {item.current_level || item.student?.level || '-'}</Text>
            <Text style={styles.meta}>Meta: {item.target_level || '-'} • {item.status}</Text>
            <Text style={styles.meta}>Progresso: {Number(item.progress_percent || 0).toFixed(1)}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Number(item.progress_percent || 0))}%` }]} />
            </View>
            {!!item.target_date && <Text style={styles.meta}>Data alvo: {item.target_date}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma meta encontrada para os filtros atuais.</Text>}
      />

      <Modal visible={!!detail} animationType="slide">
        <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <Text style={styles.title}>{detail?.student?.full_name || 'Meta do aluno'}</Text>
          <Text style={styles.subtitle}>{detail?.student?.instrument || '-'} • {detail?.current_level || detail?.student?.level || '-'} → {detail?.target_level || '-'}</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <Text style={styles.meta}>Status: {detail?.status || '-'}</Text>
            <Text style={styles.meta}>Objetivo: {detail?.objective || detail?.goal?.objective || '-'}</Text>
            <Text style={styles.meta}>Progresso global: {Number(detail?.progress_percent || 0).toFixed(1)}%</Text>
            <Text style={styles.meta}>Data alvo: {detail?.target_date || '-'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Quebra por critério</Text>
            {Object.entries(detail?.progress_snapshot?.breakdown || detail?.goal?.progress_snapshot?.breakdown || {}).map(([key, value]) => (
              <View key={key} style={styles.breakdownRow}>
                <Text style={styles.metaStrong}>{key}</Text>
                <Text style={styles.meta}>{Number(value || 0).toFixed(1)}%</Text>
              </View>
            ))}
          </View>

          {!!(detail?.alerts?.length || detail?.goal?.progress_snapshot?.alerts?.length) && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Alertas / observações</Text>
              {(detail?.alerts || detail?.goal?.progress_snapshot?.alerts || []).map((item, index) => (
                <Text key={`${item}-${index}`} style={styles.meta}>• {item}</Text>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Snapshots estruturados</Text>
            <Text style={styles.code}>{JSON.stringify(detail?.goal?.requirements_snapshot || detail?.requirements_snapshot || [], null, 2)}</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setDetail(null)}>
            <Text style={styles.primaryText}>Fechar</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: { flex: 1, backgroundColor: theme.colors.bg },
    title: { fontSize: 22, fontWeight: '900', color: theme.colors.text, marginBottom: 6 },
    subtitle: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 12, fontWeight: '700' },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    row: { flexDirection: 'row', gap: 8, marginTop: 10 },
    card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 10 },
    name: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
    meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, fontWeight: '700' },
    metaStrong: { fontSize: 12, color: theme.colors.text, fontWeight: '900' },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    progressTrack: { height: 10, borderRadius: 999, backgroundColor: theme.colors.border, marginTop: 10, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: theme.colors.accent, borderRadius: 999 },
    sectionTitle: { fontSize: 15, fontWeight: '900', color: theme.colors.text, marginBottom: 8 },
    code: { color: theme.colors.textMuted, fontSize: 11, fontFamily: undefined },
    primaryBtn: { flex: 1, backgroundColor: theme.colors.accent, padding: 12, borderRadius: 10, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '900' },
    secondaryBtn: { flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 10, alignItems: 'center' },
    secondaryText: { color: theme.colors.text, fontWeight: '900' },
    empty: { color: theme.colors.textMuted, fontWeight: '700', paddingVertical: 18 }
  });
}

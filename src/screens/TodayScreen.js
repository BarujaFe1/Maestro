import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import { getDatasetForReports } from '../services/db';
import { buildGroupAnalytics } from '../utils/analytics';
import { useOperational } from '../context/OperationalContext';
import { getLessonTypeLabel } from '../constants/lessonTypes';
import { getUnitById, resolveStudentUnitId } from '../constants/units';
import { formatDateDisplay } from '../utils/calendarRules';
import { useTheme } from '../theme/ThemeProvider';
import UnitSwitcher from '../components/UnitSwitcher';
import KpiCard from '../components/KpiCard';
import { ActionRow, ContextBanner, PageHeader, PrimaryButton, SecondaryButton, SectionCard } from '../components/AppUI';

export default function TodayScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { activeUnitId, setActiveUnitId, selectedDate, expectedLessonType, nextLesson, setSelectedDate, resetToExpectedType, statusInfo } = useOperational();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);

  const unit = useMemo(() => getUnitById(activeUnitId), [activeUnitId]);
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const from = dayjs(selectedDate).subtract(30, 'day').format('YYYY-MM-DD');
      const dataset = await getDatasetForReports({ from, to: selectedDate });
      const filteredStudents = (dataset.students || []).filter((student) => {
        const inferred = resolveStudentUnitId(student);
        return !inferred || inferred === activeUnitId;
      });
      const allowedIds = new Set(filteredStudents.map((s) => s.id));
      const filteredLessons = (dataset.lessons || []).filter((lesson) => allowedIds.has(lesson.student_id));
      setGroup(buildGroupAnalytics(filteredStudents, filteredLessons));
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [activeUnitId, selectedDate]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accent} />}
    >
      <PageHeader title="Hoje" subtitle="Tudo o que você precisa para conduzir a rotina do dia." />

      <SectionCard title="Sessão" subtitle="Unidade e data que orientam as ações do dia.">
        <UnitSwitcher value={activeUnitId} onChange={setActiveUnitId} />
        <Text style={styles.helper}>Data: {formatDateDisplay(selectedDate)}</Text>
        {!isToday ? (
          <TouchableOpacity onPress={() => { setSelectedDate(dayjs().format('YYYY-MM-DD')); resetToExpectedType(); }}>
            <Text style={styles.link}>Voltar para hoje</Text>
          </TouchableOpacity>
        ) : null}
      </SectionCard>

      <ContextBanner
        tone={statusInfo.status === 'esperado' ? 'success' : statusInfo.status === 'divergente' ? 'warning' : 'danger'}
        title={`${getLessonTypeLabel(expectedLessonType)} do ${unit.label}`}
        description={statusInfo.reason}
      />

      <SectionCard title="Próxima aula" subtitle="Referência de calendário da unidade ativa.">
        <Text style={styles.primaryMetric}>{formatDateDisplay(nextLesson.date)}</Text>
        <Text style={styles.helper}>{getLessonTypeLabel(nextLesson.expectedType)}</Text>
        <ActionRow style={{ marginTop: 12 }}>
          <View style={{ flex: 1 }}><PrimaryButton title="Abrir Aulas" onPress={() => navigation.navigate('LessonsHome')} /></View>
          <View style={{ flex: 1 }}><SecondaryButton title="Abrir Presença" onPress={() => navigation.navigate('AttendanceHome')} /></View>
        </ActionRow>
      </SectionCard>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCol}><KpiCard title="Alunos ativos" value={group?.kpis.activeStudents ?? '-'} subtitle={`Total: ${group?.kpis.studentsCount ?? '-'}`} /></View>
        <View style={styles.kpiCol}><KpiCard title="Registros 30d" value={group?.kpis.lessonsCount ?? '-'} subtitle={`Média: ${group?.kpis.avgGroupScore ?? '-'}`} /></View>
      </View>

      <SectionCard title="Alertas" subtitle="Apenas o que pede ação rápida. A análise completa fica em Relatórios.">
        {(group?.noRegisterAlerts || []).length ? (
          group.noRegisterAlerts.slice(0, 4).map((item) => (
            <View key={`${item.name}-${item.instrument}`} style={styles.row}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowMeta}>{item.instrument || '-'} • {item.daysNoRegister ?? 'Sem aulas'} dias sem registro</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum alerta importante no recorte atual.</Text>
        )}
      </SectionCard>
    </ScrollView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    helper: { color: theme.colors.textMuted, marginTop: 2 },
    link: { color: theme.colors.accent, fontWeight: '900', marginTop: 8 },
    primaryMetric: { color: theme.colors.text, fontSize: 22, fontWeight: '900' },
    kpiRow: { flexDirection: 'row', gap: 10 },
    kpiCol: { flex: 1 },
    row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    rowTitle: { color: theme.colors.text, fontWeight: '900' },
    rowMeta: { color: theme.colors.textMuted, marginTop: 4 },
    emptyText: { color: theme.colors.textMuted },
  });
}

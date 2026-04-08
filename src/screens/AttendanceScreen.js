import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { listStudentsBasic } from '../services/db';
import { useOperational } from '../context/OperationalContext';
import { getUnitById, resolveStudentUnitId } from '../constants/units';
import { formatDateDisplay } from '../utils/calendarRules';
import { clearAttendanceMutationQueue, loadAttendanceMap, queueAttendanceMutation, saveAttendanceMap } from '../utils/attendanceStore';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { ActionRow, Chip, ContextBanner, EmptyState, PageHeader, PrimaryButton, SecondaryButton, SectionCard } from '../components/AppUI';

const STATUSES = ['presente', 'falta', 'justificada', 'atraso', 'reposição'];

function buildEntry(status, oldEntry, userId) {
  return {
    status,
    note: oldEntry?.note || '',
    updated_at: new Date().toISOString(),
    updated_by: userId || null,
    source: 'manual',
  };
}

const AttendanceRow = React.memo(function AttendanceRow({ item, currentStatus, onSetStatus, theme }) {
  const styles = makeStyles(theme);
  return (
    <View style={styles.rowCard}>
      <View style={styles.rowTopCompact}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.meta}>{item.instrument || '-'} • {item.congregation || 'Congregação não informada'}</Text>
        </View>
        <View style={styles.statusPill}><Text style={styles.statusPillText}>{currentStatus || 'pendente'}</Text></View>
      </View>
      <View style={styles.chipsWrapCompact}>
        {STATUSES.map((status) => <Chip key={status} label={status} small active={currentStatus === status} onPress={() => onSetStatus(item.id, status)} />)}
      </View>
    </View>
  );
});

export default function AttendanceScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { session } = useAuth();
  const { activeUnitId, selectedDate, selectedLessonType } = useOperational();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState({});
  const [mapReady, setMapReady] = useState(false);

  const unit = getUnitById(activeUnitId);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listStudentsBasic();
      setStudents(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    let active = true;
    setMapReady(false);
    loadAttendanceMap(activeUnitId, selectedDate, selectedLessonType).then((stored) => {
      if (!active) return;
      setMap(stored || {});
      setMapReady(true);
    });
    return () => { active = false; };
  }, [activeUnitId, selectedDate, selectedLessonType]);

  useEffect(() => {
    if (!mapReady) return;
    saveAttendanceMap(activeUnitId, selectedDate, map, selectedLessonType).catch(() => null);
  }, [map, mapReady, activeUnitId, selectedDate, selectedLessonType]);

  const filtered = useMemo(() => students.filter((student) => {
    const inferred = resolveStudentUnitId(student);
    return !inferred || inferred === activeUnitId;
  }), [students, activeUnitId]);

  const setStatus = async (studentId, status) => {
    setMap((prev) => {
      const entry = buildEntry(status, prev[studentId], session?.user?.id);
      return { ...prev, [studentId]: entry };
    });
    await queueAttendanceMutation(activeUnitId, selectedDate, selectedLessonType, {
      student_id: studentId,
      ...buildEntry(status, map[studentId], session?.user?.id),
    });
  };

  const setAll = async (status) => {
    const next = {};
    for (const student of filtered) {
      next[student.id] = buildEntry(status, map[student.id], session?.user?.id);
    }
    setMap(next);
    await queueAttendanceMutation(activeUnitId, selectedDate, selectedLessonType, {
      bulk: true,
      status,
      student_ids: filtered.map((student) => student.id),
      updated_by: session?.user?.id || null,
      updated_at: new Date().toISOString(),
      source: 'bulk',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        windowSize={7}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accent} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <PageHeader title="Presença" subtitle="Chamada rápida por unidade, data e tipo de aula." />
            <ContextBanner tone="info" title={`${unit.label} • ${formatDateDisplay(selectedDate)}`} description={`Sessão atual: ${selectedLessonType === 'instrumental' ? 'Instrumental' : 'Teórica'}`} />
            <SectionCard title="Ações em lote" subtitle="Aplique um padrão e ajuste apenas exceções." compact>
              <ActionRow>
                <View style={{ flex: 1 }}><PrimaryButton title="Todos presentes" onPress={() => setAll('presente')} size="sm" /></View>
                <View style={{ flex: 1 }}><SecondaryButton title="Todos faltaram" onPress={() => setAll('falta')} size="sm" /></View>
              </ActionRow>
            </SectionCard>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Nenhum aluno disponível" subtitle="Verifique a unidade ativa e o cadastro de alunos." />}
        renderItem={({ item }) => <AttendanceRow item={item} currentStatus={map[item.id]?.status || ''} onSetStatus={setStatus} theme={theme} />}
      />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    rowCard: { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 10, marginBottom: 8 },
    rowTopCompact: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    name: { color: theme.colors.text, fontWeight: '900' },
    meta: { color: theme.colors.textMuted, marginTop: 3, fontSize: 12 },
    statusPill: { backgroundColor: theme.colors.surfaceMuted, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999 },
    statusPillText: { color: theme.colors.textMuted, fontWeight: '900', textTransform: 'capitalize', fontSize: 11 },
    chipsWrapCompact: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  });
}

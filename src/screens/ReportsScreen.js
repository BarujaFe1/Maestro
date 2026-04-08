import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import ViewShot from 'react-native-view-shot';
import dayjs from 'dayjs';

import { getDatasetForReports, listMethods, listTeachers } from '../services/db';
import { exportChartAsImage, exportExcel, exportHtmlPdf, buildGroupReportHtml } from '../utils/exporters';
import { buildFullReports } from '../utils/reportInsights';
import { useTheme } from '../theme/ThemeProvider';
import { ActionRow, AppField, Chip, ContextBanner, EmptyState, PageHeader, PrimaryButton, QuietButton, SecondaryButton, SectionCard } from '../components/AppUI';
import KpiCard from '../components/KpiCard';
import SelectModal from '../components/SelectModal';
import { UNITS, resolveStudentUnitId } from '../constants/units';

const MODULES = [
  { id: 'overview', label: 'Visão' },
  { id: 'operations', label: 'Operação' },
  { id: 'engagement', label: 'Frequência' },
  { id: 'pedagogy', label: 'Pedagógico' },
  { id: 'methods', label: 'Métodos' },
  { id: 'team', label: 'Equipe' },
];

function StatTextRow({ label, value, help, theme }) {
  const styles = makeStyles(theme);
  return (
    <View style={styles.listRowInline}>
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{label}</Text>
        {!!help && <Text style={styles.listMeta}>{help}</Text>}
      </View>
      <Text style={styles.listMetaStrong}>{value}</Text>
    </View>
  );
}

function InsightPill({ text, tone = 'info', theme }) {
  const styles = makeStyles(theme);
  const bg = tone === 'warning' ? theme.colors.warningSoft : tone === 'success' ? theme.colors.successSoft : theme.colors.accentSoft;
  return (
    <View style={[styles.insightPill, { backgroundColor: bg }]}>
      <Text style={styles.insightPillText}>{text}</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 56, 280);

  const [filters, setFilters] = useState({
    from: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
    instrument: '',
    category: '',
    teacher_id: '',
    method_id: '',
    unit_id: '',
  });
  const [dataset, setDataset] = useState({ students: [], lessons: [] });
  const [teachers, setTeachers] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [moduleId, setModuleId] = useState('overview');
  const chartRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, teachersData, methodsData] = await Promise.all([
        getDatasetForReports(filters),
        listTeachers(),
        listMethods(),
      ]);
      setDataset(data);
      setTeachers(teachersData || []);
      setMethods(methodsData || []);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const teacherMap = useMemo(() => new Map((teachers || []).map((item) => [item.id, item.full_name])), [teachers]);
  const methodMap = useMemo(() => new Map((methods || []).map((item) => [item.id, item.name])), [methods]);
  const teacherOptions = useMemo(() => [{ label: 'Todos', value: '' }, ...teachers.map((item) => ({ label: item.full_name, value: item.id }))], [teachers]);
  const methodOptions = useMemo(() => [{ label: 'Todos', value: '' }, ...methods.map((item) => ({ label: item.name, value: item.id }))], [methods]);
  const unitOptions = useMemo(() => [{ label: 'Todas', value: '' }, ...UNITS.map((item) => ({ label: item.label, value: item.id }))], []);

  const filteredDataset = useMemo(() => {
    let students = dataset.students || [];
    let lessons = dataset.lessons || [];

    if (filters.unit_id) {
      const allowed = new Set(students.filter((student) => resolveStudentUnitId(student) === filters.unit_id).map((student) => student.id));
      students = students.filter((student) => allowed.has(student.id));
      lessons = lessons.filter((lesson) => allowed.has(lesson.student_id));
    }

    if (filters.teacher_id) lessons = lessons.filter((lesson) => lesson.teacher_id === filters.teacher_id);
    if (filters.method_id) lessons = lessons.filter((lesson) => lesson.method_id === filters.method_id);

    return { students, lessons };
  }, [dataset, filters]);

  const report = useMemo(() => buildFullReports({
    students: filteredDataset.students,
    lessons: filteredDataset.lessons,
    methods,
    teachers,
    filters,
  }), [filteredDataset, methods, teachers, filters]);

  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: theme.colors.card,
    backgroundGradientTo: theme.colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.mode === 'dark' ? '229,231,235' : '15,23,42'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.mode === 'dark' ? '148,163,184' : '71,85,105'}, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.colors.accent },
    propsForBackgroundLines: { stroke: theme.colors.border },
    fillShadowGradientFrom: theme.colors.accent,
    fillShadowGradientTo: theme.colors.accent,
    fillShadowGradientFromOpacity: 0.18,
    fillShadowGradientToOpacity: 0.02,
  }), [theme]);

  const onExportPdf = async () => {
    try {
      const html = buildGroupReportHtml({
        filters: {
          ...filters,
          unit_label: unitOptions.find((item) => item.value === filters.unit_id)?.label || 'Todas',
          teacher_label: teacherMap.get(filters.teacher_id) || 'Todos',
          method_label: methodMap.get(filters.method_id) || 'Todos',
        },
        group: report.group,
        modules: report,
      });
      await exportHtmlPdf({ html, fileName: `relatorio-maestro-${dayjs().format('YYYYMMDD-HHmm')}.pdf` });
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao exportar PDF.');
    }
  };

  const onExportExcel = async () => {
    try {
      const rows = report.group.ranking.map((row, index) => ({
        'Posição': index + 1,
        'Aluno': row.name,
        'Instrumento': row.instrument || '-',
        'Família': row.category || '-',
        'Graduação': row.level || '-',
        'Evolução': row.progressDelta,
        'Média': row.avgScore,
        'Registros': row.totalLessons,
        'Estagnação': row.flags?.stagnation ? 'Sim' : 'Não',
        'Queda': row.flags?.decline ? 'Sim' : 'Não',
      }));
      await exportExcel({ rows, sheetName: 'Relatórios', fileName: `relatorio-maestro-${dayjs().format('YYYYMMDD-HHmm')}.xlsx` });
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao exportar Excel.');
    }
  };

  const onExportChart = async () => {
    if (!chartRef.current) return;
    try {
      await exportChartAsImage(chartRef.current, `grafico-maestro-${dayjs().format('YYYYMMDD-HHmm')}.png`);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao exportar gráfico.');
    }
  };

  const topInsights = [
    `Período com ${report.group.kpis.lessonsCount} registro(s)`,
    report.operations.summary.withoutLesson ? `${report.operations.summary.withoutLesson} aluno(s) sem aula no dia final do recorte` : 'Nenhuma pendência crítica no dia final do recorte',
    report.riskRows[0] ? `${report.riskRows[0].name} está com o maior risco calculado` : 'Sem risco destacado no recorte',
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accent} />}
    >
      <PageHeader title="Relatórios" subtitle="Leitura analítica por módulo, com filtros claros e exportações úteis." />

      <SectionCard title="Recorte" subtitle="Defina o período e refine a leitura só quando precisar.">
        <ActionRow>
          <View style={{ flex: 1 }}><AppField label="De" value={filters.from} onChangeText={(value) => setFilters((prev) => ({ ...prev, from: value }))} placeholder="YYYY-MM-DD" autoCapitalize="none" /></View>
          <View style={{ flex: 1 }}><AppField label="Até" value={filters.to} onChangeText={(value) => setFilters((prev) => ({ ...prev, to: value }))} placeholder="YYYY-MM-DD" autoCapitalize="none" /></View>
        </ActionRow>
        <SelectModal label="Unidade" value={filters.unit_id} options={unitOptions} onChange={(value) => setFilters((prev) => ({ ...prev, unit_id: value }))} placeholder="Todas" />
        <ActionRow>
          <View style={{ flex: 1 }}><AppField label="Instrumento" value={filters.instrument} onChangeText={(value) => setFilters((prev) => ({ ...prev, instrument: value }))} placeholder="Ex.: Violino" /></View>
          <View style={{ flex: 1 }}><AppField label="Família" value={filters.category} onChangeText={(value) => setFilters((prev) => ({ ...prev, category: value }))} placeholder="Ex.: Cordas" /></View>
        </ActionRow>

        <QuietButton title={showAdvanced ? 'Ocultar filtros avançados' : 'Mostrar filtros avançados'} size="sm" onPress={() => setShowAdvanced((prev) => !prev)} />
        {showAdvanced ? (
          <View style={{ marginTop: 10 }}>
            <SelectModal label="Professor" value={filters.teacher_id} options={teacherOptions} onChange={(value) => setFilters((prev) => ({ ...prev, teacher_id: value }))} placeholder="Todos" />
            <SelectModal label="Método" value={filters.method_id} options={methodOptions} onChange={(value) => setFilters((prev) => ({ ...prev, method_id: value }))} placeholder="Todos" />
          </View>
        ) : null}

        <ActionRow>
          <View style={{ flex: 1 }}><PrimaryButton title="Atualizar" onPress={load} /></View>
          <View style={{ flex: 1 }}><SecondaryButton title="Exportar PDF" onPress={onExportPdf} /></View>
        </ActionRow>
      </SectionCard>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCol}><KpiCard title="Alunos" value={report.group.kpis.studentsCount} subtitle={`Ativos: ${report.group.kpis.activeStudents}`} /></View>
        <View style={styles.kpiCol}><KpiCard title="Registros" value={report.group.kpis.lessonsCount} subtitle={`Média geral: ${report.group.kpis.avgGroupScore}`} /></View>
      </View>
      <View style={styles.kpiRow}>
        <View style={styles.kpiCol}><KpiCard title="Pendências" value={report.operations.summary.withoutLesson} subtitle={`Divergências: ${report.operations.summary.divergent}`} /></View>
        <View style={styles.kpiCol}><KpiCard title="Risco" value={report.riskRows.filter((row) => row.riskScore >= 40).length} subtitle={`Quedas: ${report.group.kpis.declineCount}`} /></View>
      </View>

      <SectionCard title="Leitura rápida" compact>
        <View style={styles.insightWrap}>
          {topInsights.map((item) => <InsightPill key={item} text={item} theme={theme} />)}
        </View>
      </SectionCard>

      <SectionCard title="Módulos" compact>
        <View style={styles.moduleWrap}>
          {MODULES.map((module) => <Chip key={module.id} label={module.label} active={moduleId === module.id} onPress={() => setModuleId(module.id)} />)}
        </View>
      </SectionCard>

      <ViewShot ref={chartRef}>
        {moduleId === 'overview' ? (
          <>
            {report.monthlySeries.labels.length >= 2 ? (
              <SectionCard title="Tendência temporal" subtitle="Volume de lançamentos ao longo do período.">
                <LineChart data={{ labels: report.monthlySeries.labels, datasets: [{ data: report.monthlySeries.values }] }} width={chartWidth} height={220} chartConfig={chartConfig} bezier fromZero style={{ borderRadius: 12 }} />
                <Text style={styles.chartHint}>Nos meses com menor volume, confira cobertura da aula e pendências operacionais.</Text>
              </SectionCard>
            ) : null}
            <SectionCard title="Alertas" subtitle="Quem precisa de atenção imediata.">
              {report.group.noRegisterAlerts.length ? report.group.noRegisterAlerts.slice(0, 8).map((row) => (
                <StatTextRow key={`${row.name}-${row.instrument}`} label={row.name} value={`${row.daysNoRegister ?? 'Sem aulas'} dias`} help={row.instrument || '-'} theme={theme} />
              )) : <EmptyState title="Sem alertas críticos" subtitle="O recorte atual não mostrou ausência recente de registro." />}
            </SectionCard>
            <SectionCard title="Ranking de evolução" subtitle="Comparativo rápido do grupo no período.">
              {report.group.ranking.length ? report.group.ranking.slice(0, 12).map((row, idx) => (
                <StatTextRow key={row.student_id} label={`${idx + 1}. ${row.name}`} value={`Δ ${row.progressDelta} • média ${row.avgScore}`} help={`${row.instrument || '-'} • ${row.level || '-'}`} theme={theme} />
              )) : <EmptyState title="Sem ranking" subtitle="Ainda não há dados suficientes neste recorte." />}
            </SectionCard>
          </>
        ) : null}

        {moduleId === 'operations' ? (
          <>
            <SectionCard title="Pendências do dia" subtitle={`Tomando ${dayjs(report.operations.day).format('DD/MM/YYYY')} como referência do recorte.`}>
              <View style={styles.kpiRow}>
                <View style={styles.kpiCol}><KpiCard title="Com aula" value={report.operations.summary.withLesson} subtitle={`Completas: ${report.operations.summary.complete}`} /></View>
                <View style={styles.kpiCol}><KpiCard title="Sem aula" value={report.operations.summary.withoutLesson} subtitle={`Só presença: ${report.operations.summary.attendanceOnly}`} /></View>
              </View>
              {(report.operations.pending || []).slice(0, 10).map((row) => (
                <StatTextRow key={row.student_id} label={row.name} value={row.hasLesson ? (row.complete ? 'Completa' : 'Incompleta') : 'Sem registro'} help={`${row.instrument || '-'} • esperado: ${row.expectedType || '-'}`} theme={theme} />
              ))}
            </SectionCard>
            <SectionCard title="Exceções operacionais" subtitle="Aulas fora do padrão, trocas manuais ou divergências de calendário.">
              {report.operations.exceptions.length ? report.operations.exceptions.slice(0, 10).map((lesson) => (
                <StatTextRow key={lesson.id} label={lesson.lesson_date} value={lesson.override_reason || lesson.lesson_type || 'Exceção'} help={lesson.student_id || 'Sem aluno'} theme={theme} />
              )) : <EmptyState title="Sem exceções" subtitle="Nenhuma divergência operacional encontrada no recorte." />}
            </SectionCard>
          </>
        ) : null}

        {moduleId === 'engagement' ? (
          <>
            <SectionCard title="Risco de evasão" subtitle="Score explicável usando ausência recente, queda e estagnação.">
              {report.riskRows.length ? report.riskRows.slice(0, 12).map((row) => (
                <StatTextRow key={row.student_id} label={row.name} value={`${row.riskScore} pts`} help={`${row.instrument || '-'} • ${row.daysNoRegister ?? '-'} dias sem registro`} theme={theme} />
              )) : <EmptyState title="Sem dados" subtitle="Ainda não há dados suficientes para risco de evasão." />}
            </SectionCard>
            <SectionCard title="Engajamento por unidade" subtitle="Comparativo entre GEM Central e Jardim Santa Marta.">
              {report.unitComparison.map((row) => (
                <StatTextRow key={row.unit_id} label={row.label} value={`${row.lessonsCount} aulas`} help={`${row.studentsCount} alunos • média ${row.avgScore}`} theme={theme} />
              ))}
            </SectionCard>
          </>
        ) : null}

        {moduleId === 'pedagogy' ? (
          <>
            <SectionCard title="Estagnação e aceleração" subtitle="Identifique quem travou e quem avançou acima da média.">
              <View style={styles.kpiRow}>
                <View style={styles.kpiCol}><KpiCard title="Estagnação" value={report.group.kpis.stagnatedCount} subtitle="últimas aulas" /></View>
                <View style={styles.kpiCol}><KpiCard title="Acelerados" value={report.group.kpis.acceleratedCount} subtitle="acima da média" /></View>
              </View>
              <View style={{ marginTop: 10 }}>
                {report.group.ranking.filter((row) => row.flags?.stagnation || row.flags?.accelerated || row.flags?.decline).slice(0, 12).map((row) => (
                  <StatTextRow key={row.student_id} label={row.name} value={row.flags?.decline ? 'Queda' : row.flags?.accelerated ? 'Acelerado' : 'Estagnado'} help={`${row.instrument || '-'} • média ${row.avgScore}`} theme={theme} />
                ))}
              </View>
            </SectionCard>
            <SectionCard title="Distribuição de conteúdo" subtitle="Leitura rápida da mistura pedagógica no período.">
              <View style={styles.kpiRow}>
                <View style={styles.kpiCol}><KpiCard title="Hinos" value={report.content.hymns} subtitle="lançados" /></View>
                <View style={styles.kpiCol}><KpiCard title="Coros" value={report.content.choirs} subtitle="lançados" /></View>
              </View>
              <View style={styles.kpiRow}>
                <View style={styles.kpiCol}><KpiCard title="Páginas" value={report.content.pages} subtitle="trabalhadas" /></View>
                <View style={styles.kpiCol}><KpiCard title="Lições" value={report.content.lessons} subtitle="trabalhadas" /></View>
              </View>
            </SectionCard>
          </>
        ) : null}

        {moduleId === 'methods' ? (
          <>
            <SectionCard title="Uso de métodos" subtitle="Quais métodos puxam mais aulas no período.">
              {report.methodsUsage.length ? report.methodsUsage.slice(0, 12).map((row) => (
                <StatTextRow key={row.method} label={row.method} value={`${row.count} aulas`} help={`${row.pages} páginas • ${row.lessons} lições • ${row.content} conteúdos`} theme={theme} />
              )) : <EmptyState title="Sem uso de métodos" subtitle="Ainda não há lançamentos suficientes para consolidar esse recorte." />}
            </SectionCard>
            {report.methodsUsage.length >= 2 ? (
              <SectionCard title="Métodos mais usados" subtitle="Comparativo rápido das maiores ocorrências.">
                <BarChart
                  data={{ labels: report.methodsUsage.slice(0, 5).map((item) => item.method.slice(0, 7)), datasets: [{ data: report.methodsUsage.slice(0, 5).map((item) => item.count) }] }}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  fromZero
                  style={{ borderRadius: 12 }}
                />
              </SectionCard>
            ) : null}
          </>
        ) : null}

        {moduleId === 'team' ? (
          <>
            <SectionCard title="Carga de atendimento" subtitle="Volume de alunos e lançamentos por professor.">
              {report.teacherStats.length ? report.teacherStats.map((row) => (
                <StatTextRow key={row.teacher_id} label={row.name} value={`${row.lessonsCount} lançamentos`} help={`${row.studentsCount} alunos • média ${row.avgScore}`} theme={theme} />
              )) : <EmptyState title="Sem dados" subtitle="Ainda não há dados suficientes por professor." />}
            </SectionCard>
            <SectionCard title="Consistência de lançamentos" subtitle="Score de completude dos registros por professor.">
              {report.teacherCompleteness.length ? report.teacherCompleteness.map((row) => (
                <StatTextRow key={row.teacher_id} label={row.name} value={`${row.completeness}/7`} help={`${row.lessonsCount} aulas avaliadas`} theme={theme} />
              )) : <EmptyState title="Sem dados" subtitle="Ainda não há dados suficientes para consistência de lançamentos." />}
            </SectionCard>
          </>
        ) : null}
      </ViewShot>

      <SectionCard title="Exportações" subtitle="Arquivos legíveis para compartilhar ou continuar a análise fora do app.">
        <ActionRow>
          <View style={{ flex: 1 }}><SecondaryButton title="Exportar Excel" onPress={onExportExcel} /></View>
          <View style={{ flex: 1 }}><SecondaryButton title="Exportar gráfico" onPress={onExportChart} /></View>
        </ActionRow>
      </SectionCard>
    </ScrollView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    kpiRow: { flexDirection: 'row', gap: 10 },
    kpiCol: { flex: 1 },
    listRowInline: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    listTitle: { color: theme.colors.text, fontWeight: '900' },
    listMeta: { color: theme.colors.textMuted, marginTop: 3 },
    listMetaStrong: { color: theme.colors.textMuted, fontWeight: '800' },
    moduleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    insightWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    insightPill: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    insightPillText: { color: theme.colors.text, fontWeight: '800' },
    chartHint: { color: theme.colors.textMuted, marginTop: 10 },
  });
}

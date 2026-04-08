import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import SelectModal from '../components/SelectModal';
import { useTheme } from '../theme/ThemeProvider';
import { listMethods, listRecentLessons, listStudentsBasic, listTeachers, saveLesson } from '../services/db';
import { VOICES } from '../data/catalogs';
import { useOperational } from '../context/OperationalContext';
import { getUnitById, resolveStudentUnitId } from '../constants/units';
import { LESSON_TYPES, getLessonTypeLabel } from '../constants/lessonTypes';
import { formatDateDisplay } from '../utils/calendarRules';
import { parseNumericBatch, parseTextBatch, uniqueByKey } from '../utils/bulkInputParser';
import { buildRecentLessonSummary, normalizeLessonArray } from '../utils/lessonAdapters';
import { listTheoryGroups } from '../utils/theoryGroupsStore';
import { mergeAttendanceEntries } from '../utils/attendanceStore';
import UnitSwitcher from '../components/UnitSwitcher';
import LessonTypeTabs from '../components/LessonTypeTabs';
import BulkEntryField from '../components/BulkEntryField';
import { ActionRow, AppField, Chip, ContextBanner, EmptyState, PageHeader, PrimaryButton, SecondaryButton, SectionCard } from '../components/AppUI';

const EVALUATION_TOPICS = [
  { key: 'skill_rhythm', label: 'Ritmo' },
  { key: 'skill_reading', label: 'Leitura / Solfejo' },
  { key: 'skill_technique', label: 'Técnica' },
  { key: 'skill_posture', label: 'Postura' },
  { key: 'skill_musicality', label: 'Musicalidade' },
];

function inferRecentSuggestions(recentLessons, studentId) {
  const source = (recentLessons || []).filter((item) => !studentId || item.student_id === studentId).map(normalizeLessonArray);

  const pages = uniqueByKey(
    source.flatMap((item) => item.page_items || []).map(String),
    (value) => value
  ).slice(0, 6);

  const lessons = uniqueByKey(
    source.flatMap((item) => item.lesson_items || []).map(String),
    (value) => value.toLowerCase()
  ).slice(0, 6);

  const content = uniqueByKey(
    source.flatMap((item) => item.content_items || []),
    (value) => `${value.type}-${value.number}`
  ).slice(0, 8);

  return { pages, lessons, content };
}

function emptyEvaluation() {
  return {
    skill_rhythm: '',
    skill_reading: '',
    skill_technique: '',
    skill_posture: '',
    skill_musicality: '',
  };
}

function parseEvaluationToPayload(evaluation) {
  const entries = {};
  EVALUATION_TOPICS.forEach(({ key }) => {
    const raw = String(evaluation[key] ?? '').trim();
    entries[key] = raw === '' ? null : Number(raw);
  });
  const nums = Object.values(entries).filter((value) => Number.isFinite(value));
  const performance_score = nums.length ? Number((nums.reduce((acc, cur) => acc + cur, 0) / nums.length).toFixed(2)) : null;
  return { ...entries, performance_score };
}

function validateEvaluation(evaluation) {
  for (const { key, label } of EVALUATION_TOPICS) {
    const raw = String(evaluation[key] ?? '').trim();
    const num = Number(raw);
    if (raw === '' || !Number.isFinite(num) || num < 0 || num > 10) {
      return { valid: false, message: `Informe uma nota de 0 a 10 para ${label}.` };
    }
  }
  return { valid: true };
}

function EvaluationBlock({ evaluation, onChange }) {
  const average = parseEvaluationToPayload(evaluation).performance_score;
  return (
    <SectionCard title="Avaliação pedagógica" subtitle="Preencha as 5 notas fixas de 0 a 10 para esta aula.">
      {EVALUATION_TOPICS.map((topic) => (
        <AppField
          key={topic.key}
          label={topic.label}
          value={String(evaluation[topic.key] ?? '')}
          onChangeText={(value) => onChange(topic.key, value.replace(/[^0-9.]/g, ''))}
          placeholder="0 a 10"
          keyboardType="numeric"
          autoCapitalize="none"
        />
      ))}
      <Text style={{ fontWeight: '800' }}>Média da aula: {average != null ? average.toFixed(2) : '-'}</Text>
    </SectionCard>
  );
}

export default function LessonCenterScreen({ navigation }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const {
    activeUnitId,
    setActiveUnitId,
    selectedDate,
    setSelectedDate,
    selectedLessonType,
    setSelectedLessonType,
    expectedLessonType,
    statusInfo,
    setHasManualTypeOverride,
  } = useOperational();

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [methods, setMethods] = useState([]);
  const [recentLessons, setRecentLessons] = useState([]);
  const [theoryGroups, setTheoryGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  const [evaluation, setEvaluation] = useState(emptyEvaluation());

  const [instrumental, setInstrumental] = useState({
    student_id: '',
    teacher_id: '',
    method_id: '',
    attendance: true,
    page_items: [],
    lesson_items: [],
    content_items: [],
    observations: '',
    voices: [],
    solfejo: false,
    musicItemKind: 'hino',
  });

  const [theoretical, setTheoretical] = useState({
    teacher_id: '',
    student_ids: [],
    theme: '',
    topic_items: [],
    msa_items: [],
    observations: '',
    group_id: '',
    attendance_map: {},
  });

  const load = useCallback(async () => {
    try {
      const [studentsData, teachersData, methodsData, lessonsData, groupsData] = await Promise.all([
        listStudentsBasic(),
        listTeachers(),
        listMethods(),
        listRecentLessons(20),
        listTheoryGroups(activeUnitId),
      ]);
      setStudents(studentsData || []);
      setTeachers(teachersData || []);
      setMethods(methodsData || []);
      setRecentLessons(lessonsData || []);
      setTheoryGroups(groupsData || []);
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao carregar dados da área Aulas.');
    }
  }, [activeUnitId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const unit = useMemo(() => getUnitById(activeUnitId), [activeUnitId]);

  const filteredStudents = useMemo(
    () => students.filter((student) => {
      const inferred = resolveStudentUnitId(student);
      return !inferred || inferred === activeUnitId;
    }),
    [students, activeUnitId]
  );

  const selectedStudent = useMemo(
    () => filteredStudents.find((item) => item.id === instrumental.student_id),
    [filteredStudents, instrumental.student_id]
  );

  const filteredMethods = useMemo(() => {
    const instrument = selectedStudent?.instrument;
    if (!instrument) return methods;
    return methods.filter((method) => !method.instruments?.length || method.instruments.includes(instrument));
  }, [methods, selectedStudent?.instrument]);

  const selectedGroup = useMemo(
    () => theoryGroups.find((group) => group.id === theoretical.group_id) || null,
    [theoryGroups, theoretical.group_id]
  );

  const selectedGroupStudents = useMemo(() => {
    if (!selectedGroup) return [];
    const ids = new Set(selectedGroup.student_ids || []);
    return filteredStudents.filter((student) => ids.has(student.id));
  }, [selectedGroup, filteredStudents]);

  const studentOptions = useMemo(
    () => filteredStudents.map((student) => ({ label: `${student.full_name} • ${student.instrument || '-'}`, value: student.id })),
    [filteredStudents]
  );

  const teacherOptions = useMemo(
    () => teachers.map((teacher) => ({ label: `${teacher.full_name} • ${teacher.instrument || '-'}`, value: teacher.id })),
    [teachers]
  );

  const methodOptions = useMemo(
    () => filteredMethods.map((method) => ({ label: method.name, value: method.id })),
    [filteredMethods]
  );

  const theoryGroupOptions = useMemo(
    () => theoryGroups.map((group) => ({ label: group.name, value: group.id })),
    [theoryGroups]
  );

  const suggestions = useMemo(() => inferRecentSuggestions(recentLessons, instrumental.student_id), [recentLessons, instrumental.student_id]);

  const applyLessonTypeChange = (nextType) => {
    if (nextType === expectedLessonType) {
      setSelectedLessonType(nextType);
      setHasManualTypeOverride(false);
      return;
    }

    Alert.alert(
      'Aula fora do padrão esperado',
      `O calendário sugere ${getLessonTypeLabel(expectedLessonType).toLowerCase()} para ${formatDateDisplay(selectedDate)}. Deseja continuar como ${getLessonTypeLabel(nextType).toLowerCase()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            setSelectedLessonType(nextType);
            setHasManualTypeOverride(true);
          },
        },
      ]
    );
  };

  const toggleVoice = (voice) => {
    setInstrumental((prev) => ({
      ...prev,
      voices: prev.voices.includes(voice) ? prev.voices.filter((item) => item !== voice) : [...prev.voices, voice],
    }));
  };

  const addMusicItemsFromNumbers = (numbers) => numbers.map((number) => ({
    type: instrumental.musicItemKind,
    number,
    voices: instrumental.voices,
    solfejo: !!instrumental.solfejo,
  }));

  const updateEvaluation = (key, value) => setEvaluation((prev) => ({ ...prev, [key]: value }));

  const saveInstrumental = async () => {
    if (!instrumental.student_id) return Alert.alert('Atenção', 'Selecione o aluno.');
    if (!instrumental.teacher_id) return Alert.alert('Atenção', 'Selecione o professor.');
    if (!instrumental.method_id) return Alert.alert('Atenção', 'Selecione o método.');
    const validation = validateEvaluation(evaluation);
    if (!validation.valid) return Alert.alert('Atenção', validation.message);

    try {
      setSaving(true);
      await saveLesson({
        student_id: instrumental.student_id,
        teacher_id: instrumental.teacher_id,
        method_id: instrumental.method_id,
        lesson_date: selectedDate,
        observations: `[${unit.shortLabel}] [${getLessonTypeLabel(selectedLessonType)}] ${instrumental.observations}`.trim(),
        content_items: instrumental.content_items,
        page_items: instrumental.page_items,
        lesson_items: instrumental.lesson_items,
        attendance: instrumental.attendance,
        ...parseEvaluationToPayload(evaluation),
      });

      if (instrumental.attendance) {
        await mergeAttendanceEntries(activeUnitId, selectedDate, { [instrumental.student_id]: 'presente' }, selectedLessonType);
      }

      Alert.alert('Sucesso', 'Aula instrumental salva.');
      setInstrumental((prev) => ({
        ...prev,
        page_items: [],
        lesson_items: [],
        content_items: [],
        observations: '',
        voices: [],
        solfejo: false,
      }));
      setEvaluation(emptyEvaluation());
      load();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar aula instrumental.');
    } finally {
      setSaving(false);
    }
  };

  const saveTheoretical = async () => {
    if (!theoretical.teacher_id) return Alert.alert('Atenção', 'Selecione o professor.');
    const validation = validateEvaluation(evaluation);
    if (!validation.valid) return Alert.alert('Atenção', validation.message);

    try {
      setSaving(true);
      const evalPayload = parseEvaluationToPayload(evaluation);

      if (selectedGroup) {
        const allGroupStudentIds = selectedGroupStudents.map((student) => student.id);
        const attendanceMap = {};
        allGroupStudentIds.forEach((studentId) => {
          attendanceMap[studentId] = theoretical.attendance_map[studentId] === 'falta' ? 'falta' : 'presente';
        });
        const presentIds = allGroupStudentIds.filter((studentId) => attendanceMap[studentId] === 'presente');
        if (!presentIds.length) return Alert.alert('Atenção', 'Marque ao menos um aluno presente no grupo.');

        await mergeAttendanceEntries(activeUnitId, selectedDate, attendanceMap, selectedLessonType);

        for (const studentId of presentIds) {
          await saveLesson({
            student_id: studentId,
            teacher_id: theoretical.teacher_id,
            method_id: null,
            lesson_date: selectedDate,
            observations: `[${unit.shortLabel}] [${getLessonTypeLabel(selectedLessonType)}] Grupo: ${selectedGroup.name} | Tema: ${theoretical.theme || 'Sem tema'} | ${theoretical.observations || ''}`.trim(),
            content_items: [],
            page_items: [],
            lesson_items: [...theoretical.topic_items, ...theoretical.msa_items],
            attendance: true,
            ...evalPayload,
          });
        }
      } else {
        if (!theoretical.student_ids.length) return Alert.alert('Atenção', 'Selecione ao menos um aluno.');
        const attendanceMap = {};
        theoretical.student_ids.forEach((studentId) => { attendanceMap[studentId] = 'presente'; });
        await mergeAttendanceEntries(activeUnitId, selectedDate, attendanceMap, selectedLessonType);

        for (const studentId of theoretical.student_ids) {
          await saveLesson({
            student_id: studentId,
            teacher_id: theoretical.teacher_id,
            method_id: null,
            lesson_date: selectedDate,
            observations: `[${unit.shortLabel}] [${getLessonTypeLabel(selectedLessonType)}] Tema: ${theoretical.theme || 'Sem tema'} | ${theoretical.observations || ''}`.trim(),
            content_items: [],
            page_items: [],
            lesson_items: [...theoretical.topic_items, ...theoretical.msa_items],
            attendance: true,
            ...evalPayload,
          });
        }
      }

      Alert.alert('Sucesso', 'Aula teórica salva.');
      setTheoretical((prev) => ({
        ...prev,
        student_ids: [],
        theme: '',
        topic_items: [],
        msa_items: [],
        observations: '',
        group_id: '',
        attendance_map: {},
      }));
      setEvaluation(emptyEvaluation());
      load();
    } catch (e) {
      Alert.alert('Erro', e.message || 'Falha ao salvar aula teórica.');
    } finally {
      setSaving(false);
    }
  };

  const onSelectTheoryGroup = (groupId) => {
    const group = theoryGroups.find((item) => item.id === groupId);
    const defaultAttendanceMap = {};
    (group?.student_ids || []).forEach((studentId) => {
      defaultAttendanceMap[studentId] = 'presente';
    });
    setTheoretical((prev) => ({
      ...prev,
      group_id: groupId,
      student_ids: groupId ? [] : prev.student_ids,
      attendance_map: defaultAttendanceMap,
    }));
  };

  const setTheoryAttendanceStatus = (studentId, status) => {
    setTheoretical((prev) => ({
      ...prev,
      attendance_map: { ...prev.attendance_map, [studentId]: status },
    }));
  };

  return (
    <FlatList
      data={recentLessons}
      keyExtractor={(item) => item.id}
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View>
          <PageHeader title="Aulas" subtitle="Lançamento guiado por unidade, data e tipo de aula." />

          <SectionCard title="Contexto operacional" subtitle="A mesma referência visual e lógica usada em Hoje e Presença.">
            <UnitSwitcher value={activeUnitId} onChange={setActiveUnitId} />
            <AppField
              label="Data da aula"
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />
            <Text style={styles.helper}>Visualização humana: {formatDateDisplay(selectedDate)}</Text>
            <LessonTypeTabs value={selectedLessonType} expectedType={expectedLessonType} status={statusInfo.status} onChange={applyLessonTypeChange} />
            <ContextBanner
              tone={statusInfo.status === 'esperado' ? 'success' : statusInfo.status === 'divergente' ? 'warning' : 'danger'}
              title={`Tipo esperado: ${getLessonTypeLabel(expectedLessonType)}`}
              description={statusInfo.reason}
            />
          </SectionCard>

          {selectedLessonType === LESSON_TYPES.INSTRUMENTAL ? (
            <ScrollView scrollEnabled={false}>
              <SectionCard title="Aula individual / instrumental" subtitle="Aluno, professor, método, conteúdo e avaliação da aula.">
                <SelectModal
                  label="Aluno"
                  value={instrumental.student_id}
                  options={studentOptions}
                  onChange={(value) => setInstrumental((prev) => ({ ...prev, student_id: value, method_id: '' }))}
                  placeholder="Selecionar aluno"
                />
                <SelectModal
                  label="Professor"
                  value={instrumental.teacher_id}
                  options={teacherOptions}
                  onChange={(value) => setInstrumental((prev) => ({ ...prev, teacher_id: value }))}
                  placeholder="Selecionar professor"
                />
                <SelectModal
                  label="Método"
                  value={instrumental.method_id}
                  options={methodOptions}
                  onChange={(value) => setInstrumental((prev) => ({ ...prev, method_id: value }))}
                  placeholder="Selecionar método"
                />
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Marcar presença neste lançamento</Text>
                  <Switch value={instrumental.attendance} onValueChange={(value) => setInstrumental((prev) => ({ ...prev, attendance: value }))} />
                </View>
              </SectionCard>

              <BulkEntryField
                title="Páginas trabalhadas"
                placeholder="Ex.: 12-15, 18"
                helperText="Aceita números e intervalos."
                parser={parseNumericBatch}
                items={instrumental.page_items}
                onChange={(items) => setInstrumental((prev) => ({ ...prev, page_items: items.map(String) }))}
                mapParsed={(parsed) => parsed.map(String)}
                getItemKey={(item) => String(item)}
                getItemLabel={(item) => `Página ${item}`}
                suggestions={suggestions.pages}
              />

              <BulkEntryField
                title="Lições e exercícios"
                placeholder="Ex.: Lição 3, Escala de Dó, Arpejo"
                helperText="Aceita itens textuais separados por vírgula."
                parser={parseTextBatch}
                items={instrumental.lesson_items}
                onChange={(items) => setInstrumental((prev) => ({ ...prev, lesson_items: items }))}
                getItemKey={(item) => item}
                getItemLabel={(item) => item}
                suggestions={suggestions.lessons}
              />

              <SectionCard title="Conteúdo musical" subtitle="Defina o tipo do lote, selecione vozes quando necessário e adicione números em lote.">
                <ActionRow style={{ marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton title={`Tipo: ${instrumental.musicItemKind === 'hino' ? 'Hinos' : 'Coros'}`} onPress={() => setInstrumental((prev) => ({ ...prev, musicItemKind: prev.musicItemKind === 'hino' ? 'coro' : 'hino' }))} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton title={instrumental.solfejo ? 'Solfejo: sim' : 'Solfejo: não'} onPress={() => setInstrumental((prev) => ({ ...prev, solfejo: !prev.solfejo }))} />
                  </View>
                </ActionRow>
                <Text style={styles.voiceTitle}>Vozes aplicadas ao lote</Text>
                <View style={styles.voiceWrap}>
                  {VOICES.map((voice) => (
                    <Chip key={voice} label={voice} active={instrumental.voices.includes(voice)} onPress={() => toggleVoice(voice)} />
                  ))}
                </View>
              </SectionCard>

              <BulkEntryField
                title={instrumental.musicItemKind === 'hino' ? 'Hinos em lote' : 'Coros em lote'}
                placeholder={instrumental.musicItemKind === 'hino' ? 'Ex.: 15, 23, 47-52' : 'Ex.: 1, 2, 4-6'}
                helperText="O tipo atual, as vozes selecionadas e a marcação de solfejo serão aplicados ao lote inteiro."
                parser={parseNumericBatch}
                items={instrumental.content_items}
                onChange={(items) => setInstrumental((prev) => ({ ...prev, content_items: items }))}
                mapParsed={addMusicItemsFromNumbers}
                getItemKey={(item) => `${item.type}-${item.number}`}
                getItemLabel={(item) => `${item.type === 'hino' ? 'Hino' : 'Coro'} ${item.number}${item.voices?.length ? ` • ${item.voices.join('/')}` : ''}${item.solfejo ? ' • Solfejo' : ''}`}
                suggestions={suggestions.content}
              />

              <EvaluationBlock evaluation={evaluation} onChange={updateEvaluation} />

              <SectionCard title="Observações" subtitle="Registre dificuldade, orientação ou recado importante desta aula.">
                <AppField
                  value={instrumental.observations}
                  onChangeText={(value) => setInstrumental((prev) => ({ ...prev, observations: value }))}
                  placeholder="Observações da aula"
                  multiline
                />
                <PrimaryButton title={saving ? 'Salvando...' : 'Salvar aula'} onPress={saveInstrumental} disabled={saving} />
              </SectionCard>
            </ScrollView>
          ) : (
            <ScrollView scrollEnabled={false}>
              <SectionCard
                title="Aula teórica em grupo"
                subtitle="Professor, grupo opcional, presença por aluno, tema e conteúdos da aula."
                right={<SecondaryButton title="Grupos" onPress={() => (navigation.getParent?.() || navigation).navigate('GruposTeoricos')} />}
              >
                <SelectModal
                  label="Professor"
                  value={theoretical.teacher_id}
                  options={teacherOptions}
                  onChange={(value) => setTheoretical((prev) => ({ ...prev, teacher_id: value }))}
                  placeholder="Selecionar professor"
                />
                <SelectModal
                  label="Grupo de alunos"
                  value={theoretical.group_id}
                  options={theoryGroupOptions}
                  onChange={onSelectTheoryGroup}
                  placeholder="Selecionar grupo (opcional)"
                  allowClear
                />
                <AppField
                  label="Tema da aula"
                  value={theoretical.theme}
                  onChangeText={(value) => setTheoretical((prev) => ({ ...prev, theme: value }))}
                  placeholder="Ex.: leitura rítmica, teoria básica, revisão de MSA"
                />
                {selectedGroup ? (
                  <>
                    <Text style={styles.voiceTitle}>Presença do grupo</Text>
                    {selectedGroupStudents.map((student) => {
                      const status = theoretical.attendance_map[student.id] === 'falta' ? 'falta' : 'presente';
                      return (
                        <View key={student.id} style={styles.attendanceRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentName}>{student.full_name}</Text>
                            <Text style={styles.helper}>{student.instrument || '-'}</Text>
                          </View>
                          <View style={styles.attendanceChips}>
                            <Chip label="Presente" active={status === 'presente'} onPress={() => setTheoryAttendanceStatus(student.id, 'presente')} />
                            <Chip label="Falta" active={status === 'falta'} onPress={() => setTheoryAttendanceStatus(student.id, 'falta')} />
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <Text style={styles.voiceTitle}>Alunos da aula</Text>
                    <View style={styles.studentWrap}>
                      {filteredStudents.map((student) => {
                        const active = theoretical.student_ids.includes(student.id);
                        return (
                          <Chip
                            key={student.id}
                            label={student.full_name}
                            active={active}
                            onPress={() =>
                              setTheoretical((prev) => ({
                                ...prev,
                                student_ids: active ? prev.student_ids.filter((id) => id !== student.id) : [...prev.student_ids, student.id],
                              }))
                            }
                          />
                        );
                      })}
                    </View>
                  </>
                )}
              </SectionCard>

              <BulkEntryField
                title="Tópicos trabalhados"
                placeholder="Ex.: leitura rítmica, compasso simples, escala de dó"
                helperText="Separe os tópicos por vírgula."
                parser={parseTextBatch}
                items={theoretical.topic_items}
                onChange={(items) => setTheoretical((prev) => ({ ...prev, topic_items: items }))}
                getItemKey={(item) => item}
                getItemLabel={(item) => item}
              />

              <BulkEntryField
                title="Solfejo, teoria, MSA e exercícios"
                placeholder="Ex.: MSA fase 3, solfejo 431-440, ditado rítmico"
                helperText="Use este bloco para conteúdos teóricos recorrentes e exercícios aplicados."
                parser={parseTextBatch}
                items={theoretical.msa_items}
                onChange={(items) => setTheoretical((prev) => ({ ...prev, msa_items: items }))}
                getItemKey={(item) => item}
                getItemLabel={(item) => item}
              />

              <EvaluationBlock evaluation={evaluation} onChange={updateEvaluation} />

              <SectionCard title="Observações" subtitle="Registre recados, encaminhamentos ou pontos de atenção da aula teórica.">
                <AppField
                  value={theoretical.observations}
                  onChangeText={(value) => setTheoretical((prev) => ({ ...prev, observations: value }))}
                  placeholder="Observações da aula teórica"
                  multiline
                />
                <PrimaryButton title={saving ? 'Salvando...' : 'Salvar aula teórica'} onPress={saveTheoretical} disabled={saving} />
              </SectionCard>
            </ScrollView>
          )}

          <SectionCard title="Últimas aulas" subtitle="Histórico recente para conferência rápida.">
            <Text style={styles.helper}>Os lançamentos mais recentes permanecem acessíveis sem trocar de tela.</Text>
          </SectionCard>
        </View>
      }
      ListEmptyComponent={<EmptyState title="Nenhuma aula recente" subtitle="Salve um lançamento para começar a preencher o histórico." />}
      renderItem={({ item }) => {
        const summary = buildRecentLessonSummary(item);
        return (
          <SectionCard title={`${item.student_name || 'Aluno'} • ${formatDateDisplay(item.lesson_date)}`} subtitle={`Professor: ${item.teacher_name || '-'} • Método: ${item.method_name_resolved || '-'}`}>
            <Text style={styles.recentMeta}><Text style={styles.recentLabel}>Conteúdo:</Text> {summary.contentLabel}</Text>
            <Text style={styles.recentMeta}><Text style={styles.recentLabel}>Páginas:</Text> {summary.pagesLabel}</Text>
            <Text style={styles.recentMeta}><Text style={styles.recentLabel}>Lições:</Text> {summary.lessonsLabel}</Text>
          </SectionCard>
        );
      }}
    />
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    helper: { color: theme.colors.textMuted },
    switchRow: {
      backgroundColor: theme.colors.inputBg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      marginTop: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchLabel: { color: theme.colors.text, fontWeight: '900' },
    voiceTitle: { color: theme.colors.text, fontWeight: '900', marginBottom: 8 },
    voiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    studentWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    attendanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    attendanceChips: { flexDirection: 'row', gap: 8 },
    studentName: { color: theme.colors.text, fontWeight: '800' },
    recentMeta: { color: theme.colors.textMuted, marginTop: 4 },
    recentLabel: { color: theme.colors.text, fontWeight: '800' },
  });
}

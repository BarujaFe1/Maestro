import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

import SelectModal from '../components/SelectModal';
import { CONGREGATIONS } from '../data/catalogs';
import { listActiveGroupRoster, listGroups, listInstruments, listStudents, listTeachers, saveGroup, setStudentGroupMembership } from '../services/db';
import { useTheme } from '../theme/ThemeProvider';

const emptyForm = {
  id: null,
  name: '',
  congregation: '',
  focus_instrument_id: '',
  notes: '',
  titular_teacher_id: '',
  reserva_teacher_id: '',
  start_date: dayjs().format('YYYY-MM-DD')
};

export default function GroupsScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [roster, setRoster] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [memberStudentId, setMemberStudentId] = useState('');
  const [memberStartDate, setMemberStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [memberNote, setMemberNote] = useState('');

  const load = useCallback(async () => {
    try {
      const [groupsData, teachersData, studentsData, instrumentsData] = await Promise.all([
        listGroups(),
        listTeachers(),
        listStudents({ status: 'ativo' }),
        listInstruments({ activeOnly: true })
      ]);
      setGroups(groupsData);
      setTeachers(teachersData);
      setStudents(studentsData);
      setInstruments(instrumentsData);
      const nextSelected = selectedGroupId || groupsData[0]?.id || '';
      setSelectedGroupId(nextSelected);
      if (nextSelected) {
        const rosterData = await listActiveGroupRoster(nextSelected);
        setRoster(rosterData);
      } else {
        setRoster([]);
      }
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao carregar grupos.');
    }
  }, [selectedGroupId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openNew = () => {
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (group) => {
    setForm({
      ...emptyForm,
      ...group,
      titular_teacher_id: group.titular_assignment?.teacher_id || '',
      reserva_teacher_id: group.reserva_assignment?.teacher_id || '',
      focus_instrument_id: group.focus_instrument_id || ''
    });
    setModalVisible(true);
  };

  const teacherOptions = useMemo(() => [{ label: 'Nenhum', value: '' }, ...teachers.map((item) => ({ label: `${item.full_name} • ${item.instrument || '-'}`, value: item.id }))], [teachers]);
  const instrumentOptions = useMemo(() => [{ label: 'Sem foco predominante', value: '' }, ...instruments.map((item) => ({ label: item.name, value: item.id }))], [instruments]);
  const groupOptions = useMemo(() => groups.map((item) => ({ label: `${item.name} • ${item.congregation || 'Sem congregação'}`, value: item.id })), [groups]);
  const congregationOptions = useMemo(() => CONGREGATIONS.map((item) => ({ label: item, value: item })), []);

  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId) || null, [groups, selectedGroupId]);
  const assignedStudentIds = new Set(roster.map((item) => item.student_id));
  const memberStudentOptions = useMemo(
    () => students
      .filter((student) => !assignedStudentIds.has(student.id) || student.active_group_id !== selectedGroupId)
      .map((student) => ({ label: `${student.full_name} • ${student.instrument || '-'} • ${student.level || '-'}`, value: student.id })),
    [students, selectedGroupId, roster]
  );

  const onSaveGroup = async () => {
    if (!form.name.trim()) return Alert.alert('Atenção', 'Informe o nome da turma/grupo.');
    if (!form.congregation) return Alert.alert('Atenção', 'Selecione a congregação.');
    try {
      const saved = await saveGroup({
        ...form,
        name: form.name.trim(),
        titular_teacher_id: form.titular_teacher_id || null,
        reserva_teacher_id: form.reserva_teacher_id || null,
        focus_instrument_id: form.focus_instrument_id || null
      });
      setModalVisible(false);
      setSelectedGroupId(saved.id);
      await load();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao salvar grupo.');
    }
  };

  const onBindStudent = async () => {
    if (!selectedGroupId) return Alert.alert('Atenção', 'Selecione um grupo.');
    if (!memberStudentId) return Alert.alert('Atenção', 'Selecione o aluno.');
    try {
      await setStudentGroupMembership(memberStudentId, selectedGroupId, memberStartDate, memberNote);
      setMemberStudentId('');
      setMemberStartDate(dayjs().format('YYYY-MM-DD'));
      setMemberNote('');
      setMemberModalVisible(false);
      await load();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao vincular aluno ao grupo.');
    }
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Grupos / Turmas</Text>
            <Text style={styles.subtitle}>Vínculo formal entre alunos e instrutores com histórico de vigência.</Text>

            <View style={styles.row}>
              <TouchableOpacity style={styles.primaryBtn} onPress={openNew}>
                <Text style={styles.primaryText}>+ Novo grupo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => selectedGroup && openEdit(selectedGroup)}>
                <Text style={styles.secondaryText}>Editar selecionado</Text>
              </TouchableOpacity>
            </View>

            <SelectModal label="Grupo selecionado" value={selectedGroupId} options={groupOptions} onChange={setSelectedGroupId} />

            {selectedGroup && (
              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>{selectedGroup.name}</Text>
                <Text style={styles.meta}>{selectedGroup.congregation || 'Sem congregação'} • {selectedGroup.focus_instrument_name || 'Sem foco predominante'}</Text>
                <Text style={styles.meta}>Titular: {selectedGroup.titular_assignment?.teacher?.full_name || '—'}</Text>
                <Text style={styles.meta}>Reserva: {selectedGroup.reserva_assignment?.teacher?.full_name || '—'}</Text>
                {!!selectedGroup.notes && <Text style={styles.meta}>Obs.: {selectedGroup.notes}</Text>}
                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={() => setMemberModalVisible(true)}>
                  <Text style={styles.primaryText}>+ Vincular aluno</Text>
                </TouchableOpacity>
              </View>
            )}

            {!!selectedGroup && <Text style={styles.sectionTitle}>Alunos ativos no grupo</Text>}
          </View>
        }
        renderItem={({ item }) => {
          if (item.id !== selectedGroupId) return null;
          return roster.length ? (
            <View>
              {roster.map((member) => (
                <View key={member.id} style={styles.card}>
                  <Text style={styles.name}>{member.student?.full_name || 'Aluno'}</Text>
                  <Text style={styles.meta}>{member.student?.instrument || '-'} • {member.student?.level || '-'}</Text>
                  <Text style={styles.meta}>Vigência: {member.start_date} até {member.end_date || 'atual'}</Text>
                  {!!member.notes && <Text style={styles.meta}>Obs.: {member.notes}</Text>}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Nenhum aluno ativo neste grupo.</Text>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Cadastre o primeiro grupo.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <Text style={styles.title}>{form.id ? 'Editar grupo' : 'Novo grupo'}</Text>
          <TextInput style={styles.input} placeholder="Nome da turma/grupo" placeholderTextColor={theme.colors.placeholder} value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <SelectModal label="Congregação" value={form.congregation} options={congregationOptions} onChange={(value) => setForm((prev) => ({ ...prev, congregation: value }))} />
          <SelectModal label="Instrumento predominante (opcional)" value={form.focus_instrument_id} options={instrumentOptions} onChange={(value) => setForm((prev) => ({ ...prev, focus_instrument_id: value }))} />
          <SelectModal label="Instrutor titular" value={form.titular_teacher_id} options={teacherOptions} onChange={(value) => setForm((prev) => ({ ...prev, titular_teacher_id: value }))} />
          <SelectModal label="Instrutor reserva" value={form.reserva_teacher_id} options={teacherOptions} onChange={(value) => setForm((prev) => ({ ...prev, reserva_teacher_id: value }))} />
          <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]} multiline placeholder="Observações do grupo" placeholderTextColor={theme.colors.placeholder} value={form.notes} onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))} />
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onSaveGroup}>
              <Text style={styles.primaryText}>Salvar grupo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      <Modal visible={memberModalVisible} animationType="slide">
        <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          <Text style={styles.title}>Vincular aluno ao grupo</Text>
          <Text style={styles.subtitle}>Ao salvar, o vínculo ativo anterior do aluno será encerrado com histórico.</Text>
          <SelectModal label="Aluno" value={memberStudentId} options={memberStudentOptions} onChange={setMemberStudentId} />
          <TextInput style={styles.input} placeholder="Data de início (YYYY-MM-DD)" placeholderTextColor={theme.colors.placeholder} value={memberStartDate} onChangeText={setMemberStartDate} />
          <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]} multiline placeholder="Observação do vínculo" placeholderTextColor={theme.colors.placeholder} value={memberNote} onChangeText={setMemberNote} />
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMemberModalVisible(false)}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onBindStudent}>
              <Text style={styles.primaryText}>Vincular aluno</Text>
            </TouchableOpacity>
          </View>
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
    sectionTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text, marginBottom: 8, marginTop: 12 },
    heroCard: { backgroundColor: theme.colors.card, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 14, marginBottom: 12 },
    heroTitle: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
    input: {
      backgroundColor: theme.colors.inputBg,
      color: theme.colors.inputText,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      fontWeight: '700'
    },
    card: { backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginBottom: 10 },
    name: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
    meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4, fontWeight: '700' },
    row: { flexDirection: 'row', gap: 8, marginTop: 10 },
    primaryBtn: { flex: 1, backgroundColor: theme.colors.accent, padding: 12, borderRadius: 10, alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '900' },
    secondaryBtn: { flex: 1, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, padding: 12, borderRadius: 10, alignItems: 'center' },
    secondaryText: { color: theme.colors.text, fontWeight: '900' },
    empty: { color: theme.colors.textMuted, fontWeight: '700', paddingVertical: 16 }
  });
}

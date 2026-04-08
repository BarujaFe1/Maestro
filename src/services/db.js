import { supabase } from '../lib/supabase';
import { logError } from '../utils/logger';
import { normalizeInstrumentLabel, getFamilyByInstrument, INSTRUMENTS } from '../data/catalogs';
import { normalizeLessonDraftForSave, validateLessonPayload } from '../utils/lessonPayload';
import { buildRecentLessonSummary, normalizeLessonRecordFromDb } from '../utils/lessonAdapters';
import { getFallbackMethodOption, getOfficialMethodById, listOfficialMethods as listOfficialMethodsLocal, listOfficialMethodsByInstrument, validateOfficialMethodForInstrument } from '../utils/methodCatalog';

function throwIfError(error, context = 'DB') {
  if (!error) return;
  logError(`Supabase error: ${context}`, error, {
    code: error.code,
    details: error.details,
    hint: error.hint,
    message: error.message,
  });
  throw error;
}


function inferLessonTypeFromRecord(record = {}) {
  if (record.lesson_type === 'instrumental' || record.lesson_type === 'theoretical') return record.lesson_type;
  const pageItems = Array.isArray(record.page_items) ? record.page_items : [];
  const contentItems = Array.isArray(record.content_items) ? record.content_items : [];
  const lessonItems = Array.isArray(record.lesson_items) ? record.lesson_items : [];
  const hasInstrumentalSignals = pageItems.length > 0 || contentItems.length > 0 || !!record.method_id || !!record.method_name || !!record.pages || !!record.hymns;
  if (hasInstrumentalSignals) return 'instrumental';
  const hasTheoreticalSignals = lessonItems.length > 0 || !!record.lesson_name || !!record.technical_notes || !!record.observations;
  return hasTheoreticalSignals ? 'theoretical' : 'instrumental';
}

function withDerivedLessonType(record) {
  if (!record) return record;
  return { ...record, lesson_type: inferLessonTypeFromRecord(record) };
}

function stripUnsupportedLessonColumns(payload = {}) {
  const next = { ...payload };
  delete next.lesson_type;
  delete next.schema_version;
  delete next.schemaVersion;
  delete next.override_reason;
  return next;
}

export async function getMyProfile() {
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData?.user?.id;
  if (!uid) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
  if (error && error.code === 'PGRST116') return null;
  throwIfError(error, 'getMyProfile');
  return data;
}

export async function listProfilesBasic() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, role, org_id').order('full_name', { ascending: true });
  throwIfError(error, 'listProfilesBasic');
  return data || [];
}

export async function upsertMyProfileName(full_name) {
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData?.user?.id;
  if (!uid) throw new Error('Usuário não autenticado');

  const { error } = await supabase.from('profiles').upsert({ id: uid, full_name, role: 'instrutor' });
  throwIfError(error, 'upsertMyProfileName');
  return true;
}

export async function listInstruments() {
  return INSTRUMENTS.map((item) => ({ id: item.id, label: item.label, family: item.family }));
}

export async function listStudents(filters = {}) {
  let q = supabase.from('students').select('*').order('full_name', { ascending: true });
  if (filters.search) q = q.ilike('full_name', `%${filters.search}%`);
  if (filters.instrument) q = q.eq('instrument', normalizeInstrumentLabel(filters.instrument));
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.level) q = q.eq('level', filters.level);
  if (filters.status) q = q.eq('status', filters.status);

  const { data, error } = await q;
  throwIfError(error, 'listStudents');
  return data || [];
}

export async function listStudentsBasic() {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, instrument, category, level, congregation, status')
    .order('full_name', { ascending: true });

  throwIfError(error, 'listStudentsBasic');
  return data || [];
}

export async function getStudentById(id) {
  const { data, error } = await supabase.from('students').select('*').eq('id', id).single();
  throwIfError(error, 'getStudentById');
  return data;
}

export async function saveStudent(student) {
  const normalizedInstrument = normalizeInstrumentLabel(student.instrument?.trim() || '');
  const family = getFamilyByInstrument(normalizedInstrument) || student.category || '';

  const payload = {
    id: student.id || undefined,
    full_name: student.full_name?.trim(),
    instrument: normalizedInstrument,
    category: family,
    level: student.level?.trim() || '',
    start_date: student.start_date,
    status: student.status || 'ativo',
    observations: student.observations || null,
    congregation: student.congregation || null,
    address: student.address || null,
    phone: student.phone || null,
    birth_date: student.birth_date || null,
    baptism_date: student.baptism_date || null,
    instrument_change_note: student.instrument_change_note || null,
  };

  if (student.id) {
    const { data, error } = await supabase.from('students').update(payload).eq('id', student.id).select().single();
    throwIfError(error, 'saveStudent.update');
    return data;
  }

  const { data, error } = await supabase.from('students').insert(payload).select().single();
  throwIfError(error, 'saveStudent.insert');
  return data;
}

export async function deleteStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id);
  throwIfError(error, 'deleteStudent');
  return true;
}

export async function listTeachers() {
  const { data, error } = await supabase.from('teachers').select('*').order('full_name', { ascending: true });
  throwIfError(error, 'listTeachers');
  return data || [];
}

export async function saveTeacher(teacher) {
  const payload = {
    id: teacher.id || undefined,
    full_name: teacher.full_name?.trim(),
    instrument: teacher.instrument?.trim() || '',
    congregation: teacher.congregation || null,
    role_kind: teacher.role_kind || 'Instrutor',
    active: teacher.active ?? true,
  };

  if (teacher.id) {
    const { data, error } = await supabase.from('teachers').update(payload).eq('id', teacher.id).select().single();
    throwIfError(error, 'saveTeacher.update');
    return data;
  }

  const { data, error } = await supabase.from('teachers').insert(payload).select().single();
  throwIfError(error, 'saveTeacher.insert');
  return data;
}

export async function deleteTeacher(id) {
  const { error } = await supabase.from('teachers').delete().eq('id', id);
  throwIfError(error, 'deleteTeacher');
  return true;
}

export async function listOfficialMethods() {
  return listOfficialMethodsLocal().map((item) => ({ ...item }));
}

export async function listCustomMethods() {
  const { data, error } = await supabase.from('methods').select('*').order('name', { ascending: true });
  throwIfError(error, 'listCustomMethods');
  return (data || []).map((item) => ({ ...item, source: 'custom' }));
}

export async function listMethodsByInstrument(instrument) {
  const normalized = normalizeInstrumentLabel(instrument);
  const official = listOfficialMethodsByInstrument(normalized).map((item) => ({ ...item, source: 'official' }));
  const custom = await listCustomMethods();
  const filteredCustom = custom.filter((item) => !item.instruments?.length || item.instruments.includes(normalized));
  return [...official, ...filteredCustom];
}

export async function listMethods() {
  const [official, custom] = await Promise.all([listOfficialMethods(), listCustomMethods()]);
  return [...official, ...custom];
}

export async function saveMethod(method) {
  if (!Array.isArray(method.instruments) || !method.instruments.length) {
    throw new Error('Método precisa ter pelo menos um instrumento compatível.');
  }

  const payload = {
    id: method.id || undefined,
    name: method.name?.trim(),
    instruments: (method.instruments || []).map((value) => normalizeInstrumentLabel(value)).filter(Boolean),
    active: method.active ?? true,
    notes: method.notes || null,
  };

  if (method.id) {
    const { data, error } = await supabase.from('methods').update(payload).eq('id', method.id).select().single();
    throwIfError(error, 'saveMethod.update');
    return data;
  }

  const { data, error } = await supabase.from('methods').insert(payload).select().single();
  throwIfError(error, 'saveMethod.insert');
  return data;
}

export async function deleteMethod(id) {
  const { error } = await supabase.from('methods').delete().eq('id', id);
  throwIfError(error, 'deleteMethod');
  return true;
}

export async function listLessonsByStudent(studentId) {
  const { data, error } = await supabase
    .from('lesson_records')
    .select('*')
    .eq('student_id', studentId)
    .order('lesson_date', { ascending: false })
    .order('created_at', { ascending: false });

  throwIfError(error, 'listLessonsByStudent');
  return (data || []).map((record) => withDerivedLessonType(normalizeLessonRecordFromDb(record)));
}

export async function getLessonById(id) {
  const { data, error } = await supabase.from('lesson_records').select('*').eq('id', id).single();
  throwIfError(error, 'getLessonById');
  return withDerivedLessonType(normalizeLessonRecordFromDb(data));
}

export async function listRecentLessons(limit = 30) {
  const { data: lessons, error } = await supabase
    .from('lesson_records')
    .select('*')
    .order('launched_at', { ascending: false })
    .limit(limit);

  throwIfError(error, 'listRecentLessons');
  const list = lessons || [];

  const studentIds = [...new Set(list.map((l) => l.student_id).filter(Boolean))];
  const teacherIds = [...new Set(list.map((l) => l.teacher_id).filter(Boolean))];
  const customMethodIds = [...new Set(list.map((l) => l.method_id).filter((value) => value && !getOfficialMethodById(value)))];

  const studentsMap = {};
  const teachersMap = {};
  const methodsMap = {};

  if (studentIds.length) {
    const r = await supabase.from('students').select('id, full_name, instrument, category, congregation').in('id', studentIds);
    throwIfError(r.error, 'listRecentLessons.students');
    (r.data || []).forEach((s) => { studentsMap[s.id] = s; });
  }

  if (teacherIds.length) {
    const r = await supabase.from('teachers').select('id, full_name').in('id', teacherIds);
    throwIfError(r.error, 'listRecentLessons.teachers');
    (r.data || []).forEach((t) => { teachersMap[t.id] = t.full_name; });
  }

  if (customMethodIds.length) {
    const r = await supabase.from('methods').select('id, name').in('id', customMethodIds);
    throwIfError(r.error, 'listRecentLessons.methods');
    (r.data || []).forEach((m) => { methodsMap[m.id] = m.name; });
  }

  return list.map((record) => {
    const officialMethod = getOfficialMethodById(record.method_id);
    const student = studentsMap[record.student_id] || {};
    const normalized = withDerivedLessonType(normalizeLessonRecordFromDb(record));
    const summary = buildRecentLessonSummary(normalized);
    return {
      ...normalized,
      student_name: student.full_name || 'N/A',
      teacher_name: teachersMap[record.teacher_id] || 'N/A',
      method_name_resolved: officialMethod?.name || methodsMap[record.method_id] || record.method_name || 'Método não informado',
      student_instrument: student.instrument || '',
      category: student.category || '',
      congregation: student.congregation || '',
      summary,
    };
  });
}

export async function saveLesson(lesson) {
  const payload = normalizeLessonDraftForSave(lesson, lesson.lesson_type || 'instrumental');
  const validation = validateLessonPayload({ ...payload, instrument: lesson.student_instrument || lesson.instrument || '' }, payload.lesson_type);
  if (!validation.valid) throw new Error(validation.errors[0]);

  if (payload.method_id && (lesson.student_instrument || lesson.instrument)) {
    const officialValidation = validateOfficialMethodForInstrument(payload.method_id, lesson.student_instrument || lesson.instrument);
    if (!officialValidation.valid) throw new Error('O método oficial selecionado não é compatível com o instrumento do aluno.');
  }

  const dbPayload = stripUnsupportedLessonColumns(payload);
  const { data, error } = await supabase.from('lesson_records').upsert(dbPayload.id ? { ...dbPayload, id: dbPayload.id } : dbPayload).select();
  throwIfError(error, 'saveLesson');
  return data?.[0];
}

export async function deleteLesson(id) {
  const { error } = await supabase.from('lesson_records').delete().eq('id', id);
  throwIfError(error, 'deleteLesson');
  return true;
}

export async function getDatasetForReports({ from, to, instrument, category } = {}) {
  const students = await listStudents({ instrument, category });
  const ids = students.map((s) => s.id);
  if (!ids.length) return { students: [], lessons: [] };

  let q = supabase.from('lesson_records').select('*').in('student_id', ids);
  if (from) q = q.gte('lesson_date', from);
  if (to) q = q.lte('lesson_date', to);

  const { data, error } = await q.order('lesson_date', { ascending: true });
  throwIfError(error, 'getDatasetForReports');

  return { students, lessons: (data || []).map((record) => withDerivedLessonType(normalizeLessonRecordFromDb(record))) };
}

export async function getRawBackupData() {
  const students = await listStudents({});
  const lessonsQuery = await supabase.from('lesson_records').select('*');
  throwIfError(lessonsQuery.error, 'getRawBackupData.lessons');

  const teachers = await listTeachers();
  const methods = await listMethods();
  const profiles = await listProfilesBasic().catch(() => []);

  return {
    exported_at: new Date().toISOString(),
    students,
    lessons: lessonsQuery.data || [],
    teachers,
    methods,
    profiles,
  };
}

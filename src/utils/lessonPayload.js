import { getInstrumentByLabel, isKnownContentNumber } from '../data/catalogs';
import { LESSON_TYPES } from '../constants/lessonTypes';
import { LESSON_SCHEMA_VERSION, normalizeContentItem, normalizeLessonItem, normalizePageItem, stringifyContentItems } from './lessonAdapters';
import { validateOfficialMethodForInstrument } from './methodCatalog';

function compactArray(values) {
  return (values || []).filter((value) => value !== null && value !== undefined && String(value).trim() !== '');
}

export function validateLessonPayload(input, lessonType = LESSON_TYPES.INSTRUMENTAL) {
  const errors = [];
  if (!input?.teacher_id) errors.push('Professor é obrigatório.');
  if (!input?.lesson_date) errors.push('Data da aula é obrigatória.');
  if (lessonType === LESSON_TYPES.INSTRUMENTAL && !input?.student_id) errors.push('Aluno é obrigatório na aula instrumental.');
  if (lessonType === LESSON_TYPES.THEORETICAL && !Array.isArray(input?.student_ids) && !input?.student_id) errors.push('Selecione ao menos um aluno na aula teórica.');
  if (lessonType === LESSON_TYPES.INSTRUMENTAL && !input?.method_id && !input?.method_name) errors.push('Selecione um método ou informe o método manualmente.');
  if (input?.method_id && input?.instrument) {
    const validation = validateOfficialMethodForInstrument(input.method_id, input.instrument);
    if (!validation.valid) errors.push('O método oficial selecionado não é compatível com o instrumento do aluno.');
  }
  return { valid: errors.length === 0, errors };
}

export function normalizeLessonInputForSave(lesson, lessonType = LESSON_TYPES.INSTRUMENTAL) {
  const pageItems = compactArray(Array.isArray(lesson.page_items) ? lesson.page_items.map(normalizePageItem) : []);
  const lessonItems = compactArray(Array.isArray(lesson.lesson_items) ? lesson.lesson_items.map(normalizeLessonItem) : []);
  const contentItems = compactArray(Array.isArray(lesson.content_items) ? lesson.content_items.map(normalizeContentItem) : []);
  const firstContent = contentItems[0] || null;

  const safeContentItems = contentItems.filter((item) => {
    if (item.type === 'hino' || item.type === 'coro') {
      return item.number == null ? false : isKnownContentNumber(item.type, item.number);
    }
    return !!item.label || item.number != null;
  });

  const instrument = lesson.instrument || lesson.student_instrument || '';
  const family = instrument ? getInstrumentByLabel(instrument)?.family || lesson.category || null : lesson.category || null;

  return {
    id: lesson.id,
    schemaVersion: LESSON_SCHEMA_VERSION,
    student_id: lesson.student_id || null,
    teacher_id: lesson.teacher_id,
    method_id: lesson.method_id || null,
    lesson_date: lesson.lesson_date,
    method_name: lesson.method_name || null,
    pages: pageItems.length ? pageItems.join(', ') : null,
    lesson_name: lessonItems.length ? lessonItems.join(', ') : null,
    hymns: safeContentItems.length ? stringifyContentItems(safeContentItems) : null,
    technical_notes: lesson.observations || lesson.technical_notes || null,
    attendance: lesson.attendance ?? true,
    skill_rhythm: lesson.skill_rhythm ?? null,
    skill_reading: lesson.skill_reading ?? null,
    skill_technique: lesson.skill_technique ?? null,
    skill_posture: lesson.skill_posture ?? null,
    skill_musicality: lesson.skill_musicality ?? null,
    performance_score: lesson.performance_score ?? null,
    performance_concept: lesson.performance_concept ?? null,
    content_group: firstContent?.type || null,
    content_number: firstContent?.number || null,
    voices: firstContent?.voices || [],
    solfejo: !!firstContent?.solfejo,
    content_items: safeContentItems,
    page_items: pageItems,
    lesson_items: lessonItems,
    lesson_type: lessonType,
    family,
    override_reason: lesson.override_reason || null,
    launched_at: lesson.launched_at || new Date().toISOString(),
  };
}

export const normalizeLessonDraftForSave = normalizeLessonInputForSave;

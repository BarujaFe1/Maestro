export const LESSON_TYPES = {
  INSTRUMENTAL: 'instrumental',
  THEORETICAL: 'theoretical',
};

export const LESSON_TYPE_OPTIONS = [
  { label: 'Instrumental', value: LESSON_TYPES.INSTRUMENTAL },
  { label: 'Teórica', value: LESSON_TYPES.THEORETICAL },
];

export const LESSON_STATUS = {
  EXPECTED: 'esperado',
  DIVERGENT: 'divergente',
  EXCEPTION: 'excecao',
};

export function getLessonTypeLabel(type) {
  if (type === LESSON_TYPES.INSTRUMENTAL) return 'Instrumental';
  if (type === LESSON_TYPES.THEORETICAL) return 'Teórica';
  return 'Não definido';
}

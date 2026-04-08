import dayjs from 'dayjs';
import { LESSON_STATUS, LESSON_TYPES } from '../constants/lessonTypes';
import { getUnitById } from '../constants/units';

function normalizeDate(dateLike) {
  return dayjs(dateLike).isValid() ? dayjs(dateLike) : dayjs();
}

export function alternateLessonType(type) {
  return type === LESSON_TYPES.THEORETICAL ? LESSON_TYPES.INSTRUMENTAL : LESSON_TYPES.THEORETICAL;
}

export function getExpectedLessonType(unitId, dateLike) {
  const unit = getUnitById(unitId);
  const date = normalizeDate(dateLike).startOf('day');
  const anchor = dayjs(unit.anchorDate).startOf('day');
  const diffWeeks = Math.floor(date.diff(anchor, 'day') / 7);
  const sameParity = Math.abs(diffWeeks) % 2 === 0;
  const expectedType = sameParity ? unit.anchorLessonType : alternateLessonType(unit.anchorLessonType);

  return {
    expectedType,
    isOnExpectedWeekday: date.day() === unit.weekday,
    weekdayLabel: unit.weekdayLabel,
    diffWeeks,
  };
}

export function getOperationalLessonStatus({ unitId, dateLike, selectedLessonType, hasManualTypeOverride = false }) {
  const info = getExpectedLessonType(unitId, dateLike);

  if (!info.isOnExpectedWeekday) {
    return { ...info, status: LESSON_STATUS.EXCEPTION, reason: `Data fora do dia padrão da unidade (${info.weekdayLabel}).` };
  }

  if (selectedLessonType === info.expectedType && !hasManualTypeOverride) {
    return { ...info, status: LESSON_STATUS.EXPECTED, reason: 'Tipo compatível com o calendário.' };
  }

  if (selectedLessonType !== info.expectedType) {
    return { ...info, status: LESSON_STATUS.DIVERGENT, reason: 'Tipo divergente do esperado para esta data.' };
  }

  return { ...info, status: LESSON_STATUS.EXCEPTION, reason: 'Exceção confirmada manualmente.' };
}

export function getNextLessonDateForUnit(unitId, fromDateLike = dayjs()) {
  const unit = getUnitById(unitId);
  let cursor = normalizeDate(fromDateLike).startOf('day');
  for (let i = 0; i < 14; i += 1) {
    if (cursor.day() === unit.weekday) break;
    cursor = cursor.add(1, 'day');
  }
  return cursor;
}

export function getNextLessonSummary(unitId, fromDateLike = dayjs()) {
  const date = getNextLessonDateForUnit(unitId, fromDateLike);
  const { expectedType } = getExpectedLessonType(unitId, date);
  return { date: date.format('YYYY-MM-DD'), expectedType };
}

export function formatDateDisplay(dateLike) {
  return normalizeDate(dateLike).format('DD/MM/YYYY');
}

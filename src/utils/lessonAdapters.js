function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && safeString(value) !== '');
}

export const LESSON_SCHEMA_VERSION = 3;

export function normalizePageItem(item) {
  if (item === null || item === undefined) return null;
  if (typeof item === 'number') return String(item);
  if (typeof item === 'string') return safeString(item);
  if (typeof item === 'object') return safeString(firstDefined(item.label, item.value, item.page, item.number, item.raw));
  return null;
}

export function normalizeLessonItem(item) {
  if (item === null || item === undefined) return null;
  if (typeof item === 'number' || typeof item === 'string') return safeString(item);
  if (typeof item === 'object') return safeString(firstDefined(item.label, item.value, item.lesson, item.name, item.title, item.raw));
  return null;
}

export function normalizeContentItem(item) {
  if (item === null || item === undefined) return null;

  if (typeof item === 'number' || /^\d+$/.test(String(item))) {
    return { type: 'hino', number: Number(item), voices: [], solfejo: false, label: '' };
  }

  if (typeof item === 'string') {
    const lower = item.toLowerCase();
    const type = lower.includes('coro') ? 'coro' : lower.includes('peça') || lower.includes('peca') ? 'peca_musical' : 'hino';
    const numMatch = item.match(/(\d+)/);
    return {
      type,
      number: numMatch ? Number(numMatch[1]) : null,
      voices: [],
      solfejo: lower.includes('solfejo'),
      label: item,
    };
  }

  if (typeof item === 'object') {
    const type = firstDefined(item.type, item.kind, 'hino');
    const numberRaw = firstDefined(item.number, item.value, item.content_number);
    const number = numberRaw == null || numberRaw === '' ? null : Number(numberRaw);
    const voices = Array.isArray(item.voices) ? item.voices.map((v) => safeString(v)).filter(Boolean) : [];
    const solfejo = !!firstDefined(item.solfejo, item.has_solfejo, false);
    const label = safeString(firstDefined(item.label, item.name, item.raw));
    return {
      type: ['hino', 'coro', 'peca_musical', 'técnica', 'escala'].includes(type) ? type : 'hino',
      number: Number.isFinite(number) ? number : null,
      voices,
      solfejo,
      label,
    };
  }

  return null;
}

export function normalizeLessonRecordFromDb(record) {
  const pageItems = Array.isArray(record?.page_items) ? record.page_items.map(normalizePageItem).filter(Boolean) : [];
  const lessonItems = Array.isArray(record?.lesson_items) ? record.lesson_items.map(normalizeLessonItem).filter(Boolean) : [];
  const contentItems = Array.isArray(record?.content_items) ? record.content_items.map(normalizeContentItem).filter(Boolean) : [];

  return {
    ...record,
    schemaVersion: LESSON_SCHEMA_VERSION,
    page_items: pageItems,
    lesson_items: lessonItems,
    content_items: contentItems,
  };
}

export const normalizeLessonArray = normalizeLessonRecordFromDb;

export function stringifyContentItems(items = []) {
  return items
    .map((item) => normalizeContentItem(item))
    .filter(Boolean)
    .map((item) => {
      if (item.type === 'peca_musical' || item.type === 'técnica' || item.type === 'escala') return item.label || `${item.type} ${item.number || ''}`.trim();
      const kind = item.type === 'coro' ? 'Coro' : 'Hino';
      const base = item.number ? `${kind} ${item.number}` : kind;
      return item.label ? `${base} • ${item.label}` : base;
    })
    .join(', ');
}

export function buildRecentLessonSummary(record) {
  const normalized = normalizeLessonRecordFromDb(record);
  return {
    pagesLabel: normalized.page_items.length ? normalized.page_items.join(', ') : '-',
    lessonsLabel: normalized.lesson_items.length ? normalized.lesson_items.join(', ') : '-',
    contentLabel: normalized.content_items.length ? stringifyContentItems(normalized.content_items) : '-',
  };
}

export function sanitizeRecentSuggestions(recentSuggestions = {}, methodSuggestions = {}) {
  const unique = (list, keyFn) => (list || []).filter((item, index, arr) => arr.findIndex((other) => keyFn(other) === keyFn(item)) === index);
  return {
    pages: unique([...(recentSuggestions.pages || []), ...(methodSuggestions.pages || [])], (v) => String(v)).slice(0, 12),
    lessons: unique([...(recentSuggestions.lessons || []), ...(methodSuggestions.lessons || [])], (v) => String(v).toLowerCase()).slice(0, 12),
    content: unique([...(recentSuggestions.content || []), ...(methodSuggestions.content || [])], (v) => `${v.type}-${v.number || v.label || ''}`).slice(0, 12),
  };
}

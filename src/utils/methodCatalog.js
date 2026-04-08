import { RAW_METHOD_CATALOG } from '../data/methodCatalog';
import { getFamilyByInstrument, normalizeInstrumentLabel } from '../data/catalogs';

export const METHOD_ID_ALIASES = {
  'nabok-pires-camargo-clarinete': 'nabor-pires-camargo-clarinete',
  'nabok-pires-camargo-clarone': 'nabor-pires-camargo-clarone',
};

function safeString(value) {
  return value == null ? '' : String(value).trim();
}

function uniqueBy(list, keyFn) {
  return (list || []).filter((item, index, arr) => arr.findIndex((other) => keyFn(other) === keyFn(item)) === index);
}

export function resolveMethodAlias(methodId) {
  const raw = safeString(methodId);
  if (!raw) return '';
  return METHOD_ID_ALIASES[raw] || raw;
}

function sanitizeStructure(structure = []) {
  return (Array.isArray(structure) ? structure : []).map((row, index) => ({
    lesson: Number(row.lesson) || index + 1,
    pageitems: Array.isArray(row.pageitems) ? row.pageitems.map((v) => String(v)) : [],
    lessonitems: Array.isArray(row.lessonitems) ? row.lessonitems.map((v) => safeString(v)).filter(Boolean) : [],
    contentitems: Array.isArray(row.contentitems) ? row.contentitems : [],
  }));
}

const OFFICIAL_METHOD_CATALOG = RAW_METHOD_CATALOG.map((entry) => {
  const method = entry.method || {};
  const id = resolveMethodAlias(method.id);
  const instruments = (method.instruments || []).map((v) => normalizeInstrumentLabel(v)).filter(Boolean);
  return {
    id,
    alias_ids: uniqueBy([id, ...(method.aliases || [])].map(resolveMethodAlias).filter(Boolean), (v) => v),
    name: safeString(method.name) || id,
    volume: Number.isFinite(Number(method.volume)) ? Number(method.volume) : null,
    instruments,
    family: instruments[0] ? getFamilyByInstrument(instruments[0]) : safeString(method.family),
    total_pages: Number(method.total_pages) || 0,
    pdf_url: safeString(method.pdf_url) || '',
    structure: sanitizeStructure(entry.structure || []),
    source: 'official',
  };
});

const METHOD_BY_ID = new Map();
OFFICIAL_METHOD_CATALOG.forEach((item) => {
  item.alias_ids.forEach((alias) => METHOD_BY_ID.set(alias, item));
});

export function listOfficialMethods() {
  return [...OFFICIAL_METHOD_CATALOG].sort((a, b) => a.name.localeCompare(b.name) || (a.volume || 0) - (b.volume || 0));
}

export function listOfficialMethodsByInstrument(instrumentLabel) {
  const normalized = normalizeInstrumentLabel(instrumentLabel);
  return listOfficialMethods().filter((item) => item.instruments.includes(normalized));
}

export function getOfficialMethodById(methodId) {
  return METHOD_BY_ID.get(resolveMethodAlias(methodId)) || null;
}

export function validateOfficialMethodForInstrument(methodId, instrumentLabel) {
  const official = getOfficialMethodById(methodId);
  if (!official) return { valid: true, mode: 'legacy' };
  const normalizedInstrument = normalizeInstrumentLabel(instrumentLabel);
  return {
    valid: official.instruments.includes(normalizedInstrument),
    mode: 'official',
    method: official,
  };
}

export function getMethodSuggestions(methodId) {
  const official = getOfficialMethodById(methodId);
  if (!official) return { pages: [], lessons: [], content: [] };

  const pages = uniqueBy(official.structure.flatMap((row) => row.pageitems || []).map(String), (v) => v).slice(0, 12);
  const lessons = uniqueBy(official.structure.flatMap((row) => row.lessonitems || []), (v) => String(v).toLowerCase()).slice(0, 12);

  return { pages, lessons, content: [] };
}

export function sanitizeRecentSuggestions(recentSuggestions = {}, methodSuggestions = {}) {
  const unique = (list, keyFn) => (list || []).filter((item, index, arr) => arr.findIndex((other) => keyFn(other) === keyFn(item)) === index);
  return {
    pages: unique([...(recentSuggestions.pages || []), ...(methodSuggestions.pages || [])], (v) => String(v)).slice(0, 12),
    lessons: unique([...(recentSuggestions.lessons || []), ...(methodSuggestions.lessons || [])], (v) => String(v).toLowerCase()).slice(0, 12),
    content: unique([...(recentSuggestions.content || []), ...(methodSuggestions.content || [])], (v) => `${v.type}-${v.number || v.label || ''}`).slice(0, 12),
  };
}

export function getFallbackMethodOption(instrumentLabel) {
  const normalized = normalizeInstrumentLabel(instrumentLabel);
  return {
    id: '',
    name: 'Método não catalogado',
    volume: null,
    instruments: normalized ? [normalized] : [],
    family: normalized ? getFamilyByInstrument(normalized) : '',
    total_pages: 0,
    pdf_url: '',
    structure: [],
    source: 'fallback',
  };
}

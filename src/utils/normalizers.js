export function uniqueList(list = []) {
  return Array.from(new Set((list || []).filter(Boolean)));
}

export function normalizeVoice(voice) {
  const map = {
    soprano: 'Soprano',
    contralto: 'Contralto',
    tenor: 'Tenor',
    baixo: 'Baixo'
  };
  const key = String(voice || '').trim().toLowerCase();
  return map[key] || String(voice || '').trim();
}

export function extractFirstNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function expandNumericRangeToken(token) {
  const raw = String(token || '').trim();
  if (!raw) return [];

  const rangeMatch = raw.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (!rangeMatch) return [raw];

  const start = Number(rangeMatch[1]);
  const end = Number(rangeMatch[2]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [raw];
  if (end < start) return [raw];
  const out = [];
  for (let n = start; n <= end; n += 1) out.push(String(n));
  return out;
}

export function tokenizeCommaSeparatedInput(input) {
  return String(input || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizePageInput(input) {
  const tokens = tokenizeCommaSeparatedInput(input);
  return uniqueList(tokens.flatMap(expandNumericRangeToken).map((item) => String(item).trim()).filter(Boolean));
}

export function normalizeLessonInput(input) {
  const tokens = tokenizeCommaSeparatedInput(input);
  return uniqueList(tokens.flatMap((token) => {
    const range = token.match(/^(?:li[cç][aã]o\s*)?(\d+)\s*[-–]\s*(\d+)$/i);
    if (!range) return [token.trim()];
    const start = Number(range[1]);
    const end = Number(range[2]);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [token.trim()];
    const out = [];
    for (let n = start; n <= end; n += 1) out.push(String(n));
    return out;
  }));
}

export function toPageRows(items = []) {
  return uniqueList(items).map((label, index) => ({
    page_label: String(label).trim(),
    page_number: extractFirstNumber(label),
    position: index
  }));
}

export function toLessonRows(items = []) {
  return uniqueList(items).map((label, index) => ({
    lesson_label: String(label).trim(),
    lesson_number: extractFirstNumber(label),
    position: index
  }));
}

export function normalizeContentItems(items = []) {
  return (items || []).map((item, index) => ({
    content_type: item.content_type || item.type,
    content_number: Number(item.content_number || item.number),
    voices: uniqueList((item.voices || []).map(normalizeVoice)),
    solfejo: !!item.solfejo,
    position: index
  })).filter((item) => item.content_type && Number.isFinite(item.content_number));
}

export function normalizeTheoryItems(items = []) {
  return uniqueList(items.map((item) => String(item).trim()).filter(Boolean)).map((label, index) => ({
    phase_label: label,
    phase_number: extractFirstNumber(label),
    position: index,
    method_name: 'MSA - 2023'
  }));
}

export function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Number(n.toFixed(2))));
}

export function averageScores(scores = {}) {
  const values = Object.values(scores).map(Number).filter(Number.isFinite);
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

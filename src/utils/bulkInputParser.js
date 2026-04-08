function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function uniqueByKey(list, getKey = (item) => item) {
  const seen = new Set();
  return (list || []).filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseNumericBatch(raw) {
  const text = compactText(raw);
  if (!text) return [];

  const tokens = text.replace(/;/g, ',').split(',').map((part) => compactText(part)).filter(Boolean);
  const numbers = [];

  for (const token of tokens) {
    const rangeMatch = token.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      const lower = Math.min(start, end);
      const upper = Math.max(start, end);
      for (let i = lower; i <= upper; i += 1) numbers.push(i);
      continue;
    }

    const numeric = token.match(/^\d+$/);
    if (numeric) numbers.push(Number(token));
  }

  return uniqueByKey(numbers).sort((a, b) => a - b);
}

export function parseTextBatch(raw) {
  const text = String(raw || '').replace(/\n/g, ',');
  const tokens = text.split(',').map((part) => compactText(part)).filter(Boolean);
  return uniqueByKey(tokens, (item) => item.toLowerCase());
}

export function mergeUniqueItems(currentItems, nextItems, getKey = (item) => item) {
  return uniqueByKey([...(currentItems || []), ...(nextItems || [])], getKey);
}

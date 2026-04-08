import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'maestro_theory_groups_v1';

function createId() {
  return `tg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readAll() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(groups) {
  await AsyncStorage.setItem(KEY, JSON.stringify(groups || []));
  return true;
}

export async function listTheoryGroups(unitId) {
  const all = await readAll();
  return unitId ? all.filter((group) => group.unit_id === unitId) : all;
}

export async function getTheoryGroup(groupId) {
  const all = await readAll();
  return all.find((group) => group.id === groupId) || null;
}

export async function saveTheoryGroup(group) {
  const all = await readAll();
  const normalized = {
    id: group.id || createId(),
    name: String(group.name || '').trim(),
    unit_id: group.unit_id || null,
    student_ids: Array.isArray(group.student_ids) ? [...new Set(group.student_ids.filter(Boolean))] : [],
    updated_at: new Date().toISOString(),
  };

  if (!normalized.name) throw new Error('Informe o nome do grupo.');
  if (!normalized.unit_id) throw new Error('Informe a unidade do grupo.');

  const idx = all.findIndex((item) => item.id === normalized.id);
  if (idx >= 0) all[idx] = normalized;
  else all.unshift(normalized);

  await writeAll(all);
  return normalized;
}

export async function deleteTheoryGroup(groupId) {
  const all = await readAll();
  const next = all.filter((group) => group.id !== groupId);
  await writeAll(next);
  return true;
}

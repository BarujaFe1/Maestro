import AsyncStorage from '@react-native-async-storage/async-storage';

function makeKey(unitId, date, lessonType = 'any') {
  return `maestro_attendance:${unitId}:${date}:${lessonType}`;
}

function normalizeMap(map) {
  if (!map || typeof map !== 'object') return {};
  const next = {};
  Object.entries(map).forEach(([studentId, value]) => {
    if (!studentId) return;
    if (typeof value === 'string') next[studentId] = value;
    else if (value && typeof value.status === 'string') next[studentId] = value.status;
  });
  return next;
}

export async function loadAttendanceMap(unitId, date, lessonType = 'any') {
  const raw = await AsyncStorage.getItem(makeKey(unitId, date, lessonType));
  if (!raw) return {};
  try {
    return normalizeMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

export async function saveAttendanceMap(unitId, date, map, lessonType = 'any') {
  await AsyncStorage.setItem(makeKey(unitId, date, lessonType), JSON.stringify(normalizeMap(map || {})));
  return true;
}

export async function mergeAttendanceEntries(unitId, date, partialMap, lessonType = 'any') {
  const current = await loadAttendanceMap(unitId, date, lessonType);
  const next = { ...current, ...normalizeMap(partialMap) };
  await saveAttendanceMap(unitId, date, next, lessonType);
  return next;
}

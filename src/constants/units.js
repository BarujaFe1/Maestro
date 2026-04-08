export const UNIT_IDS = {
  CENTRAL: 'gem_central',
  SANTA_MARTA: 'gem_jardim_santa_marta',
};

export const UNITS = [
  {
    id: UNIT_IDS.CENTRAL,
    label: 'GEM Central',
    shortLabel: 'Central',
    color: '#2563eb',
    weekday: 2,
    weekdayLabel: 'terça-feira',
    anchorDate: '2026-04-07',
    anchorLessonType: 'theoretical',
    congregationAliases: ['GEM Central', 'Central', 'Jardim São Gabriel - Vargem Grande do Sul', 'Jardim São Gabriel'],
  },
  {
    id: UNIT_IDS.SANTA_MARTA,
    label: 'GEM Jardim Santa Marta',
    shortLabel: 'Santa Marta',
    color: '#0f766e',
    weekday: 6,
    weekdayLabel: 'sábado',
    anchorDate: '2026-04-04',
    anchorLessonType: 'theoretical',
    congregationAliases: ['GEM Jardim Santa Marta', 'Jardim Santa Marta - Vargem Grande do Sul', 'Jardim Santa Marta'],
  },
];

export function getUnitById(unitId) {
  return UNITS.find((unit) => unit.id === unitId) || UNITS[0];
}

export function resolveStudentUnitId(student) {
  const raw = String(student?.unit_id || student?.congregation || '').trim().toLowerCase();
  if (!raw) return null;

  const direct = UNITS.find((unit) => unit.id === raw);
  if (direct) return direct.id;

  for (const unit of UNITS) {
    if (unit.congregationAliases.some((alias) => alias.toLowerCase() === raw)) return unit.id;
  }

  return null;
}

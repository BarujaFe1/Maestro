const OFFICIAL_INSTRUMENTS = [
  { id: 'violino', label: 'Violino', family: 'Cordas', aliases: ['Violino'] },
  { id: 'viola', label: 'Viola', family: 'Cordas', aliases: ['Viola'] },
  { id: 'violoncelo', label: 'Violoncelo', family: 'Cordas', aliases: ['Violoncelo', 'Violoncello'] },

  { id: 'baritono_pisto', label: 'Bartono Pisto', family: 'Metais', aliases: ['Bartono Pisto', 'Barítono Pisto', 'Baritono Pisto', 'Barítono (Pisto)'] },
  { id: 'cornet', label: 'Cornet', family: 'Metais', aliases: ['Cornet'] },
  { id: 'eufonio', label: 'Eufônio', family: 'Metais', aliases: ['Eufônio', 'Eufonio'] },
  { id: 'flugelhorn', label: 'Flugelhorn', family: 'Metais', aliases: ['Flugelhorn'] },
  { id: 'trombone', label: 'Trombone', family: 'Metais', aliases: ['Trombone'] },
  { id: 'trombonito', label: 'Trombonito', family: 'Metais', aliases: ['Trombonito'] },
  { id: 'trompa', label: 'Trompa', family: 'Metais', aliases: ['Trompa'] },
  { id: 'trompete', label: 'Trompete', family: 'Metais', aliases: ['Trompete'] },
  { id: 'tuba', label: 'Tuba', family: 'Metais', aliases: ['Tuba'] },

  { id: 'clarinete', label: 'Clarinete', family: 'Madeiras', aliases: ['Clarinete'] },
  { id: 'clarinete_alto', label: 'Clarinete Alto', family: 'Madeiras', aliases: ['Clarinete Alto'] },
  { id: 'clarinete_baixo_clarone', label: 'Clarinete Baixo (Clarone)', family: 'Madeiras', aliases: ['Clarinete Baixo (Clarone)', 'Clarone', 'Clarinete Baixo'] },
  { id: 'flauta', label: 'Flauta', family: 'Madeiras', aliases: ['Flauta'] },
  { id: 'corne_ingles', label: 'Corne Inglês', family: 'Madeiras', aliases: ['Corne Inglês', 'Corne Ingles'] },
  { id: 'fagote', label: 'Fagote', family: 'Madeiras', aliases: ['Fagote'] },
  { id: 'oboe', label: 'Oboé', family: 'Madeiras', aliases: ['Oboé', 'Oboe'] },
  { id: 'oboe_damore', label: "Oboé D'Amore", family: 'Madeiras', aliases: ["Oboé D'Amore", "Oboe D'Amore"] },
  { id: 'sax_soprano_reto', label: 'Saxofone Soprano (Reto)', family: 'Madeiras', aliases: ['Saxofone Soprano (Reto)', 'Saxofone Soprano', 'Sax Soprano'] },
  { id: 'sax_alto', label: 'Saxofone Alto', family: 'Madeiras', aliases: ['Saxofone Alto'] },
  { id: 'sax_tenor', label: 'Saxofone Tenor', family: 'Madeiras', aliases: ['Saxofone Tenor'] },
  { id: 'sax_baritono', label: 'Saxofone Barítono', family: 'Madeiras', aliases: ['Saxofone Barítono', 'Saxofone Baritono'] },
];

export const INSTRUMENTS = OFFICIAL_INSTRUMENTS;
export const INSTRUMENT_FAMILIES = [...new Set(INSTRUMENTS.map((item) => item.family))];
export const VOICES = ['Soprano', 'Contralto', 'Tenor', 'Baixo'];
export const CONTENT_GROUPS = ['hino', 'coro'];
export const REPERTOIRE_TYPES = [
  { id: 'hino', label: 'Hino' },
  { id: 'coro', label: 'Coro' },
];
export const GRADUATIONS = ['Aluno', 'Toca nos Ensaios', 'Toca nas RJM', 'Toca nos Cultos Oficiais', 'Oficializado'];
export const CONGREGATIONS = ['Jardim São Gabriel - Vargem Grande do Sul', 'Jardim Santa Marta - Vargem Grande do Sul'];
export const TEACHER_ROLES = ['Instrutor', 'Encarregado local'];
export const HYMNS_CATALOG = [];
export const CHOIRS_CATALOG = [];

export function getFamilyByInstrument(instrumentLabel) {
  const found = getInstrumentByLabel(instrumentLabel);
  return found?.family || '';
}

export function getInstrumentByLabel(label) {
  const raw = String(label || '').trim().toLowerCase();
  if (!raw) return null;
  return INSTRUMENTS.find((item) => item.label.toLowerCase() === raw || item.aliases.some((alias) => String(alias).toLowerCase() === raw)) || null;
}

export function normalizeInstrumentLabel(label) {
  return getInstrumentByLabel(label)?.label || String(label || '').trim();
}

export function buildContentNumberOptions(kind, max = 500) {
  return Array.from({ length: max }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
}

export function isKnownContentNumber(kind, number) {
  const catalog = kind === 'hino' ? HYMNS_CATALOG : kind === 'coro' ? CHOIRS_CATALOG : [];
  if (!catalog.length) return true;
  return catalog.some((item) => Number(item.number) === Number(number));
}

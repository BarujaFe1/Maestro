import dayjs from 'dayjs';
import { GOAL_WEIGHTS, getNextGraduation } from '../data/catalogs';
import { averageScores, extractFirstNumber } from './normalizers';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function avg(list = []) {
  const values = (list || []).map(Number).filter(Number.isFinite);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentage(numerator, denominator) {
  if (!denominator || denominator <= 0) return null;
  return Math.max(0, Math.min(100, Number(((numerator / denominator) * 100).toFixed(2))));
}

function findRequirementsForStudent(student, requirements = []) {
  const targetLevel = getNextGraduation(student?.level);
  if (!targetLevel) return [];
  return requirements.filter((row) => row.instrument_name === student.instrument && row.current_level === student.level && row.target_level === targetLevel && row.active !== false);
}

export function buildStudentTrail(student, lessons = [], attendance = []) {
  const hymnMap = new Map();
  const solfejoHymnMap = new Map();
  const voicesMap = new Map();
  const pageProgress = {};
  const lessonProgress = {};
  const theoryProgress = { maxPhase: 0, labels: new Set(), completed: false };
  const evaluationScores = [];
  const contentHistory = [];

  (lessons || []).forEach((lesson) => {
    if (lesson.is_canceled) return;

    const methodName = lesson.method_name_resolved || lesson.method_name || lesson.method_label || lesson.method_id || '';
    const methodKey = normalizeText(methodName);

    (lesson.content_items || []).forEach((item) => {
      if (String(item.content_type || item.type).toLowerCase() !== 'hino') {
        contentHistory.push(item);
        return;
      }
      const hymnNumber = Number(item.content_number || item.number);
      if (!Number.isFinite(hymnNumber)) return;
      hymnMap.set(hymnNumber, true);
      if (item.solfejo) solfejoHymnMap.set(hymnNumber, true);
      const voices = voicesMap.get(hymnNumber) || new Set();
      (item.voices || []).forEach((voice) => voices.add(voice));
      voicesMap.set(hymnNumber, voices);
      contentHistory.push(item);
    });

    (lesson.page_items || []).forEach((item) => {
      const pageNumber = Number(item.page_number ?? extractFirstNumber(item.page_label));
      if (!methodKey || !Number.isFinite(pageNumber)) return;
      pageProgress[methodKey] = Math.max(pageProgress[methodKey] || 0, pageNumber);
    });

    (lesson.lesson_items || []).forEach((item) => {
      const lessonNumber = Number(item.lesson_number ?? extractFirstNumber(item.lesson_label));
      if (!methodKey || !Number.isFinite(lessonNumber)) return;
      lessonProgress[methodKey] = Math.max(lessonProgress[methodKey] || 0, lessonNumber);
    });

    (lesson.theory_items || []).forEach((item) => {
      const phaseLabel = String(item.phase_label || '').trim();
      const phaseNumber = Number(item.phase_number ?? extractFirstNumber(phaseLabel));
      if (phaseLabel) theoryProgress.labels.add(phaseLabel);
      if (Number.isFinite(phaseNumber)) theoryProgress.maxPhase = Math.max(theoryProgress.maxPhase, phaseNumber);
      if (/completo/i.test(phaseLabel) || /revis[aã]o/i.test(phaseLabel)) theoryProgress.completed = true;
    });

    const evaluation = lesson.evaluation || {};
    const score = Number(evaluation.avg_score ?? lesson.evaluation_avg ?? averageScores({
      rhythm: evaluation.rhythm ?? lesson.skill_rhythm,
      reading_solfejo: evaluation.reading_solfejo ?? lesson.skill_reading,
      technique: evaluation.technique ?? lesson.skill_technique,
      posture: evaluation.posture ?? lesson.skill_posture,
      musicality: evaluation.musicality ?? lesson.skill_musicality
    }));

    if (Number.isFinite(score)) evaluationScores.push(score);
  });

  const attendanceMap = new Map();
  (attendance || []).forEach((item) => {
    attendanceMap.set(item.attendance_date, item.status || 'presente');
  });

  return {
    student,
    hymnNumbers: Array.from(hymnMap.keys()).sort((a, b) => a - b),
    solfejoHymnNumbers: Array.from(solfejoHymnMap.keys()).sort((a, b) => a - b),
    hymnVoices: Object.fromEntries(Array.from(voicesMap.entries()).map(([number, voices]) => [number, Array.from(voices)])),
    pageProgress,
    lessonProgress,
    theoryProgress: {
      ...theoryProgress,
      labels: Array.from(theoryProgress.labels)
    },
    evaluationScores,
    evaluationAverage: Number(avg(evaluationScores).toFixed(2)),
    attendance,
    attendanceMap,
    presenceCount: (attendance || []).filter((item) => ['presente', 'reposição', 'atraso'].includes(item.status)).length,
    consecutiveAbsences: getConsecutiveAbsences(attendance),
    contentHistory
  };
}

function progressForRange(hymnNumbers = [], start, end) {
  const total = Math.max(0, (end - start) + 1);
  const count = hymnNumbers.filter((number) => number >= start && number <= end).length;
  return { count, total, percent: percentage(count, total) };
}

function calculatePathProgress(items = [], getter) {
  const byPath = {};
  const mandatory = [];

  items.forEach((item) => {
    if (item.path_group) {
      byPath[item.path_group] = byPath[item.path_group] || [];
      byPath[item.path_group].push(item);
    } else {
      mandatory.push(item);
    }
  });

  const mandatoryScores = mandatory.map(getter).filter((value) => value != null);
  const mandatoryProgress = mandatoryScores.length ? avg(mandatoryScores) : null;
  const pathScores = Object.values(byPath).map((groupItems) => {
    const values = groupItems.map(getter).filter((value) => value != null);
    return values.length ? avg(values) : null;
  }).filter((value) => value != null);
  const bestPath = pathScores.length ? Math.max(...pathScores) : null;

  if (mandatoryProgress == null && bestPath == null) return null;
  if (mandatoryProgress != null && bestPath != null) return Number(avg([mandatoryProgress, bestPath]).toFixed(2));
  return Number((mandatoryProgress ?? bestPath ?? 0).toFixed(2));
}

function getRequiredVoicePercent(range, requiredVoices = [], hymnVoices = {}) {
  if (!requiredVoices?.length) return null;
  const hymnNumbers = Array.from({ length: (range.end - range.start) + 1 }, (_, index) => range.start + index);
  const count = hymnNumbers.filter((number) => {
    const voices = hymnVoices[number] || [];
    return requiredVoices.every((voice) => voices.includes(voice));
  }).length;
  return percentage(count, hymnNumbers.length);
}

export function computeGoalProgress(student, requirements = [], trail) {
  const targetLevel = getNextGraduation(student?.level);
  const studentRequirements = requirements.length ? requirements : findRequirementsForStudent(student, []);
  const alerts = [];

  if (!targetLevel) {
    return {
      hasStructuredGoal: false,
      current_level: student?.level || null,
      target_level: null,
      objective: 'Aluno já está na última etapa cadastrada.',
      status: 'concluído',
      progress_percent: 100,
      breakdown: {},
      alerts: []
    };
  }

  if (!studentRequirements.length) {
    return {
      hasStructuredGoal: false,
      current_level: student?.level || null,
      target_level: targetLevel,
      objective: `Sem requisitos estruturados para ${student?.instrument || 'o instrumento'} nesta transição.`,
      status: 'em atenção',
      progress_percent: 0,
      breakdown: {},
      alerts: ['Requisitos pedagógicos ainda não parametrizados para esta transição.'],
      target_date: null
    };
  }

  const pagesRequirements = studentRequirements.filter((row) => row.requirement_type === 'method_page');
  const lessonRequirements = studentRequirements.filter((row) => row.requirement_type === 'method_lesson');
  const hymnRequirements = studentRequirements.filter((row) => row.requirement_type === 'hymn_range');
  const solfejoRequirements = studentRequirements.filter((row) => row.requirement_type === 'solfejo_range');
  const theoryRequirements = studentRequirements.filter((row) => row.requirement_type === 'theory_phase');
  const completeRequirements = studentRequirements.filter((row) => row.requirement_type === 'method_complete' || row.requirement_type === 'note');

  if (completeRequirements.some((row) => row.measurable === false)) {
    alerts.push('Há requisitos “completo” ou observações normativas que exigem parametrização/admin para medição automática total.');
  }

  const pagesPercent = calculatePathProgress(pagesRequirements, (row) => {
    const target = Number(row.page_target);
    const current = trail.pageProgress[normalizeText(row.method_name)] || 0;
    if (!Number.isFinite(target) || target <= 0) return null;
    return Math.min(100, (current / target) * 100);
  });

  const lessonsPercent = calculatePathProgress(lessonRequirements, (row) => {
    const target = Number(row.lesson_target_number);
    const current = trail.lessonProgress[normalizeText(row.method_name)] || 0;
    if (!Number.isFinite(target) || target <= 0) return null;
    return Math.min(100, (current / target) * 100);
  });

  const hinosPercent = hymnRequirements.length
    ? avg(hymnRequirements.map((row) => {
        if (row.requires_full_hinario) {
          const numbers = trail.hymnNumbers;
          const basePercent = percentage(numbers.length, 480) || 0;
          const voicePercent = getRequiredVoicePercent({ start: 1, end: 480 }, row.required_voices, trail.hymnVoices);
          return voicePercent != null ? avg([basePercent, voicePercent]) : basePercent;
        }
        const start = Number(row.hymn_from || 1);
        const end = Number(row.hymn_to || 480);
        const coverage = progressForRange(trail.hymnNumbers, start, end).percent || 0;
        const voicePercent = getRequiredVoicePercent({ start, end }, row.required_voices, trail.hymnVoices);
        return voicePercent != null ? avg([coverage, voicePercent]) : coverage;
      }))
    : null;

  const solfejoPercent = solfejoRequirements.length
    ? avg(solfejoRequirements.map((row) => {
        const start = Number(row.hymn_from || 1);
        const end = Number(row.hymn_to || 480);
        if (row.requires_full_hinario) {
          return percentage(trail.solfejoHymnNumbers.length, 480) || 0;
        }
        return progressForRange(trail.solfejoHymnNumbers, start, end).percent || 0;
      }))
    : null;

  const theoryPercent = theoryRequirements.length
    ? avg(theoryRequirements.map((row) => {
        if (row.completion_mode === 'complete_with_review') {
          return trail.theoryProgress.completed ? 100 : 0;
        }
        const target = Number(row.theory_phase);
        if (!Number.isFinite(target) || target <= 0) return 0;
        return Math.min(100, (trail.theoryProgress.maxPhase / target) * 100);
      }))
    : null;

  const evaluationPercent = percentage(trail.evaluationAverage, 10);

  const weightedEntries = [
    ['hinos', hinosPercent],
    ['licoes', lessonsPercent],
    ['paginas', pagesPercent],
    ['teoria', theoryPercent],
    ['solfejo', solfejoPercent],
    ['avaliacao', evaluationPercent]
  ].filter(([, value]) => value != null);

  const denominator = weightedEntries.reduce((sum, [key]) => sum + (GOAL_WEIGHTS[key] || 0), 0);
  const numerator = weightedEntries.reduce((sum, [key, value]) => sum + ((GOAL_WEIGHTS[key] || 0) * value), 0);
  const globalPercent = denominator ? Number((numerator / denominator).toFixed(2)) : 0;

  const targetDate = student.start_date ? dayjs(student.start_date).add(180, 'day').format('YYYY-MM-DD') : null;
  const isLate = targetDate ? dayjs().isAfter(dayjs(targetDate), 'day') && globalPercent < 100 : false;
  const isAttention = !isLate && globalPercent < 60;

  const status = globalPercent >= 100
    ? 'concluído'
    : isLate
      ? 'atrasado'
      : isAttention
        ? 'em atenção'
        : 'em dia';

  const normativeNotes = studentRequirements.filter((row) => row.requirement_type === 'note').map((row) => row.notes || row.raw_requirement).filter(Boolean);

  return {
    hasStructuredGoal: true,
    current_level: student.level,
    target_level: targetLevel,
    objective: `Evoluir de ${student.level} para ${targetLevel} em ${student.instrument}.`,
    target_date: targetDate,
    status,
    progress_percent: globalPercent,
    breakdown: {
      hinos: Number((hinosPercent ?? 0).toFixed(2)),
      licoes: Number((lessonsPercent ?? 0).toFixed(2)),
      paginas: Number((pagesPercent ?? 0).toFixed(2)),
      teoria: Number((theoryPercent ?? 0).toFixed(2)),
      solfejo: Number((solfejoPercent ?? 0).toFixed(2)),
      avaliacao: Number((evaluationPercent ?? 0).toFixed(2))
    },
    alerts,
    normative_notes: normativeNotes,
    requirements_count: studentRequirements.length
  };
}

export function buildGoalSnapshot(student, requirements, trail) {
  const progress = computeGoalProgress(student, requirements, trail);
  return {
    ...progress,
    trail: {
      hymns_count: trail.hymnNumbers.length,
      solfejo_hymns_count: trail.solfejoHymnNumbers.length,
      evaluation_average: trail.evaluationAverage,
      presence_count: trail.presenceCount,
      consecutive_absences: trail.consecutiveAbsences,
      max_theory_phase: trail.theoryProgress.maxPhase,
      page_progress: trail.pageProgress,
      lesson_progress: trail.lessonProgress,
      voices_history: trail.hymnVoices
    }
  };
}

export function getConsecutiveAbsences(attendance = []) {
  const ordered = [...(attendance || [])].sort((a, b) => dayjs(b.attendance_date).valueOf() - dayjs(a.attendance_date).valueOf());
  let count = 0;
  for (const item of ordered) {
    if (item.status === 'falta' || item.status === 'justificada') {
      count += 1;
      continue;
    }
    break;
  }
  return count;
}

export function buildInstructorSummary(groups = [], memberships = [], goals = [], attendance = []) {
  const groupMap = Object.fromEntries((groups || []).map((group) => [group.id, group]));
  const membershipMap = {};
  (memberships || []).forEach((membership) => {
    membershipMap[membership.group_id] = membershipMap[membership.group_id] || [];
    membershipMap[membership.group_id].push(membership.student_id);
  });

  return (groups || []).map((group) => {
    const studentIds = membershipMap[group.id] || [];
    const goalRows = (goals || []).filter((goal) => studentIds.includes(goal.student_id));
    const attendanceRows = (attendance || []).filter((item) => studentIds.includes(item.student_id));
    return {
      group_id: group.id,
      group_name: group.name,
      congregation: group.congregation,
      student_count: studentIds.length,
      avg_goal_progress: Number(avg(goalRows.map((goal) => Number(goal.progress_percent))).toFixed(2)),
      attendance_rate: Number(avg(attendanceRows.map((item) => ['presente', 'reposição', 'atraso'].includes(item.status) ? 100 : 0)).toFixed(2)),
      overdue_goals: goalRows.filter((goal) => goal.status === 'atrasado').length,
      attention_goals: goalRows.filter((goal) => goal.status === 'em atenção').length,
      meta: groupMap[group.id]
    };
  });
}

import dayjs from 'dayjs';
import { buildGroupAnalytics, buildStudentAnalytics, getLessonScore } from './analytics';
import { getExpectedLessonType } from './calendarRules';
import { resolveStudentUnitId, UNITS } from '../constants/units';

function monthKey(date) {
  return dayjs(date).format('YYYY-MM');
}

function monthLabel(key) {
  return dayjs(`${key}-01`).format('MM/YY');
}

function safeAvg(values) {
  const valid = (values || []).filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!valid.length) return 0;
  return valid.reduce((acc, value) => acc + value, 0) / valid.length;
}

function countFilled(lesson) {
  let score = 0;
  if (lesson.teacher_id) score += 1;
  if (lesson.method_id || lesson.method_name) score += 1;
  if ((lesson.page_items || []).length) score += 1;
  if ((lesson.lesson_items || []).length) score += 1;
  if ((lesson.content_items || []).length) score += 1;
  if (lesson.technical_notes || lesson.observations) score += 1;
  if (lesson.performance_score || lesson.performance_concept) score += 1;
  return score;
}

export function buildMonthlySeries(lessons = []) {
  const bucket = {};
  for (const lesson of lessons) {
    if (!lesson.lesson_date) continue;
    const key = monthKey(lesson.lesson_date);
    bucket[key] = (bucket[key] || 0) + 1;
  }
  const keys = Object.keys(bucket).sort();
  return {
    labels: keys.map(monthLabel),
    values: keys.map((key) => bucket[key]),
  };
}

export function buildMethodUsage(lessons = [], methods = []) {
  const methodNames = new Map((methods || []).map((method) => [method.id, method.name]));
  const bucket = {};
  for (const lesson of lessons) {
    const key = lesson.method_id || lesson.method_name || 'Método não informado';
    const label = methodNames.get(lesson.method_id) || lesson.method_name || key;
    if (!bucket[label]) bucket[label] = { method: label, count: 0, pages: 0, lessons: 0, content: 0 };
    bucket[label].count += 1;
    bucket[label].pages += (lesson.page_items || []).length;
    bucket[label].lessons += (lesson.lesson_items || []).length;
    bucket[label].content += (lesson.content_items || []).length;
  }
  return Object.values(bucket).sort((a, b) => b.count - a.count);
}

export function buildTeacherStats(lessons = [], students = [], teachers = []) {
  const studentsByTeacher = {};
  const lessonBucket = {};
  const scoresBucket = {};
  const teacherMap = new Map((teachers || []).map((teacher) => [teacher.id, teacher.full_name]));
  const studentMap = new Map((students || []).map((student) => [student.id, student]));

  for (const lesson of lessons) {
    const teacherId = lesson.teacher_id || 'sem-professor';
    lessonBucket[teacherId] = (lessonBucket[teacherId] || 0) + 1;
    studentsByTeacher[teacherId] = studentsByTeacher[teacherId] || new Set();
    if (lesson.student_id) studentsByTeacher[teacherId].add(lesson.student_id);
    const score = getLessonScore(lesson);
    if (Number.isFinite(score)) {
      scoresBucket[teacherId] = scoresBucket[teacherId] || [];
      scoresBucket[teacherId].push(score);
    }
  }

  return Object.keys(lessonBucket).map((teacherId) => ({
    teacher_id: teacherId,
    name: teacherMap.get(teacherId) || 'Professor não identificado',
    studentsCount: studentsByTeacher[teacherId] ? studentsByTeacher[teacherId].size : 0,
    lessonsCount: lessonBucket[teacherId] || 0,
    avgScore: Number(safeAvg(scoresBucket[teacherId]).toFixed(2)),
  })).sort((a, b) => b.lessonsCount - a.lessonsCount);
}

export function buildUnitComparison(students = [], lessons = []) {
  return UNITS.map((unit) => {
    const unitStudents = students.filter((student) => resolveStudentUnitId(student) === unit.id);
    const allowed = new Set(unitStudents.map((student) => student.id));
    const unitLessons = lessons.filter((lesson) => allowed.has(lesson.student_id));
    return {
      unit_id: unit.id,
      label: unit.label,
      studentsCount: unitStudents.length,
      lessonsCount: unitLessons.length,
      avgScore: Number(safeAvg(unitLessons.map(getLessonScore)).toFixed(2)),
    };
  });
}

export function buildOperationalReports(students = [], lessons = [], filters = {}) {
  const day = filters.to || dayjs().format('YYYY-MM-DD');
  const lessonsOnDay = lessons.filter((lesson) => lesson.lesson_date === day);
  const byStudent = new Map(lessonsOnDay.map((lesson) => [lesson.student_id, lesson]));

  const pending = students.map((student) => {
    const lesson = byStudent.get(student.id) || null;
    const unitId = resolveStudentUnitId(student);
    const expectedType = unitId ? getExpectedLessonType(unitId, day).expectedType : null;
    const lessonType = lesson?.lesson_type || null;
    const isComplete = !!lesson && !!lesson.teacher_id && (!!lesson.method_id || !!lesson.method_name || lessonType === 'theoretical') && (((lesson.page_items || []).length + (lesson.lesson_items || []).length + (lesson.content_items || []).length) > 0 || !!(lesson.technical_notes || lesson.observations));
    return {
      student_id: student.id,
      name: student.full_name,
      instrument: student.instrument,
      expectedType,
      recordedType: lessonType,
      hasLesson: !!lesson,
      complete: isComplete,
      attendanceOnly: !!lesson && lesson.attendance === true && !isComplete,
      override: !!lesson?.override_reason,
    };
  });

  const exceptions = lessonsOnDay.filter((lesson) => !!lesson.override_reason || (lesson.student_id && (() => {
    const student = students.find((item) => item.id === lesson.student_id);
    const unitId = student ? resolveStudentUnitId(student) : null;
    if (!unitId || !lesson.lesson_type) return false;
    return getExpectedLessonType(unitId, lesson.lesson_date).expectedType !== lesson.lesson_type;
  })()));

  return {
    day,
    pending,
    summary: {
      expected: students.length,
      withLesson: pending.filter((row) => row.hasLesson).length,
      complete: pending.filter((row) => row.complete).length,
      attendanceOnly: pending.filter((row) => row.attendanceOnly).length,
      withoutLesson: pending.filter((row) => !row.hasLesson).length,
      divergent: pending.filter((row) => row.recordedType && row.expectedType && row.recordedType !== row.expectedType).length,
    },
    exceptions,
  };
}

export function buildRiskRows(students = [], lessons = []) {
  const byStudent = {};
  for (const lesson of lessons) {
    byStudent[lesson.student_id] = byStudent[lesson.student_id] || [];
    byStudent[lesson.student_id].push(lesson);
  }

  return students.map((student) => {
    const analytics = buildStudentAnalytics(student, byStudent[student.id] || []);
    const riskScore = Math.min(100,
      (analytics.kpis.daysNoRegister || 0) * 1.4 +
      (analytics.flags.decline ? 18 : 0) +
      (analytics.flags.stagnation ? 12 : 0) +
      (analytics.kpis.totalLessons < 3 ? 10 : 0)
    );
    return {
      student_id: student.id,
      name: student.full_name,
      instrument: student.instrument,
      daysNoRegister: analytics.kpis.daysNoRegister,
      avgScore: analytics.kpis.avgScore,
      decline: analytics.flags.decline,
      stagnation: analytics.flags.stagnation,
      accelerated: analytics.flags.accelerated,
      riskScore: Math.round(riskScore),
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

export function buildContentDistribution(lessons = []) {
  return {
    hymns: lessons.reduce((acc, lesson) => acc + (lesson.content_items || []).filter((item) => item.type === 'hino').length, 0),
    choirs: lessons.reduce((acc, lesson) => acc + (lesson.content_items || []).filter((item) => item.type === 'coro').length, 0),
    pages: lessons.reduce((acc, lesson) => acc + (lesson.page_items || []).length, 0),
    lessons: lessons.reduce((acc, lesson) => acc + (lesson.lesson_items || []).length, 0),
  };
}

export function buildCompletionByTeacher(lessons = [], teachers = []) {
  const teacherMap = new Map((teachers || []).map((teacher) => [teacher.id, teacher.full_name]));
  const bucket = {};

  for (const lesson of lessons) {
    const teacherId = lesson.teacher_id || 'sem-professor';
    bucket[teacherId] = bucket[teacherId] || [];
    bucket[teacherId].push(countFilled(lesson));
  }

  return Object.entries(bucket).map(([teacherId, values]) => ({
    teacher_id: teacherId,
    name: teacherMap.get(teacherId) || 'Professor não identificado',
    completeness: Number(safeAvg(values).toFixed(2)),
    lessonsCount: values.length,
  })).sort((a, b) => b.completeness - a.completeness);
}

export function buildFullReports({ students = [], lessons = [], methods = [], teachers = [], filters = {} }) {
  const group = buildGroupAnalytics(students, lessons);
  const operations = buildOperationalReports(students, lessons, filters);
  const riskRows = buildRiskRows(students, lessons);
  const content = buildContentDistribution(lessons);
  const methodsUsage = buildMethodUsage(lessons, methods);
  const teacherStats = buildTeacherStats(lessons, students, teachers);
  const teacherCompleteness = buildCompletionByTeacher(lessons, teachers);
  const unitComparison = buildUnitComparison(students, lessons);
  const monthlySeries = buildMonthlySeries(lessons);

  return {
    group,
    operations,
    riskRows,
    content,
    methodsUsage,
    teacherStats,
    teacherCompleteness,
    unitComparison,
    monthlySeries,
  };
}

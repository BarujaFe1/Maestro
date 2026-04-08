import dayjs from 'dayjs';

function avg(values = []) {
  const list = values.map(Number).filter(Number.isFinite);
  if (!list.length) return 0;
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function round(value, digits = 2) {
  return Number((Number(value || 0)).toFixed(digits));
}

function groupBy(items = [], keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

function attendanceRate(attendance = []) {
  if (!attendance.length) return null;
  const presentish = attendance.filter((item) => ['presente', 'reposição', 'atraso'].includes(item.status)).length;
  return round((presentish / attendance.length) * 100);
}

function consecutiveAbsences(attendance = []) {
  const ordered = [...attendance].sort((a, b) => String(b.attendance_date).localeCompare(String(a.attendance_date)));
  let count = 0;
  for (const item of ordered) {
    if (item.status === 'falta' || item.status === 'justificada') {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

function lessonAverageScore(lessons = []) {
  const scores = lessons
    .map((lesson) => Number(lesson.evaluation?.avg_score ?? lesson.evaluation_avg))
    .filter(Number.isFinite);
  return scores.length ? round(avg(scores)) : null;
}

function getLastLessonDate(lessons = []) {
  const ordered = [...lessons].sort((a, b) => String(b.lesson_date).localeCompare(String(a.lesson_date)));
  return ordered[0]?.lesson_date || null;
}

function computeDecline(lessons = []) {
  const scores = [...lessons]
    .filter((lesson) => !lesson.is_canceled)
    .sort((a, b) => String(b.lesson_date).localeCompare(String(a.lesson_date)))
    .map((lesson) => Number(lesson.evaluation?.avg_score ?? lesson.evaluation_avg))
    .filter(Number.isFinite);

  if (scores.length < 4) return { recentAvg: null, previousAvg: null, declined: false, delta: null };
  const recent = scores.slice(0, 3);
  const previous = scores.slice(3, 6);
  if (!previous.length) return { recentAvg: round(avg(recent)), previousAvg: null, declined: false, delta: null };
  const recentAvg = round(avg(recent));
  const previousAvg = round(avg(previous));
  return {
    recentAvg,
    previousAvg,
    declined: recentAvg < previousAvg,
    delta: round(recentAvg - previousAvg)
  };
}

function computeStagnation(goal, lessons = []) {
  const lastLessonDate = getLastLessonDate(lessons);
  const noLessonFor45Days = lastLessonDate ? dayjs().diff(dayjs(lastLessonDate), 'day') >= 45 : true;
  const progress = Number(goal?.progress_percent || goal?.progress_snapshot?.progress_percent || 0);
  return noLessonFor45Days || progress < 30;
}

export function buildReportsModel(bundle) {
  const students = bundle.students || [];
  const lessons = (bundle.lessons || []).filter((lesson) => !lesson.is_canceled);
  const attendance = bundle.attendance || [];
  const goals = bundle.goals || [];
  const groups = bundle.groups || [];
  const assignments = bundle.assignments || [];
  const teachers = bundle.teachers || [];

  const lessonsByStudent = groupBy(lessons, (lesson) => lesson.student_id);
  const attendanceByStudent = groupBy(attendance, (item) => item.student_id);
  const goalsByStudent = Object.fromEntries(goals.map((goal) => [goal.student_id, goal]));
  const activeMemberships = (bundle.memberships || []).filter((item) => !item.end_date);
  const membershipByStudent = Object.fromEntries(activeMemberships.map((item) => [item.student_id, item]));
  const groupById = Object.fromEntries(groups.map((group) => [group.id, group]));
  const teacherById = Object.fromEntries(teachers.map((teacher) => [teacher.id, teacher]));

  const activeAssignments = assignments.filter((item) => !item.end_date);
  const assignmentsByGroup = groupBy(activeAssignments, (item) => item.group_id);

  const studentRows = students.map((student) => {
    const studentLessons = lessonsByStudent[student.id] || [];
    const studentAttendance = attendanceByStudent[student.id] || [];
    const goal = goalsByStudent[student.id] || null;
    const membership = membershipByStudent[student.id] || null;
    const group = membership ? groupById[membership.group_id] : null;
    const groupAssignments = membership ? (assignmentsByGroup[membership.group_id] || []) : [];
    const titular = groupAssignments.find((item) => item.role_kind === 'titular');
    const reserva = groupAssignments.find((item) => item.role_kind === 'reserva');
    const decline = computeDecline(studentLessons);
    const progressPercent = Number(goal?.progress_percent || goal?.progress_snapshot?.progress_percent || 0);
    const targetDate = goal?.target_date || goal?.progress_snapshot?.target_date || null;
    const late = targetDate ? dayjs().isAfter(dayjs(targetDate), 'day') && progressPercent < 100 : goal?.status === 'atrasado';

    return {
      student_id: student.id,
      student_name: student.full_name,
      instrument: student.instrument,
      level: student.level,
      congregation: student.congregation,
      group_name: group?.name || '',
      group_id: group?.id || null,
      titular_teacher_id: titular?.teacher_id || null,
      reserva_teacher_id: reserva?.teacher_id || null,
      titular_teacher: titular ? (teacherById[titular.teacher_id]?.full_name || '') : '',
      reserva_teacher: reserva ? (teacherById[reserva.teacher_id]?.full_name || '') : '',
      progress_percent: progressPercent,
      goal_status: goal?.status || 'em atenção',
      target_level: goal?.target_level || '',
      target_date: targetDate,
      lesson_count: studentLessons.length,
      last_lesson_date: getLastLessonDate(studentLessons),
      attendance_rate: attendanceRate(studentAttendance),
      consecutive_absences: consecutiveAbsences(studentAttendance),
      avg_score: lessonAverageScore(studentLessons),
      decline: decline.declined,
      decline_delta: decline.delta,
      stagnation: computeStagnation(goal, studentLessons),
      late,
      goal,
      student,
      lessons: studentLessons,
      attendance: studentAttendance
    };
  });

  const byInstrument = Object.values(groupBy(studentRows, (row) => row.instrument || 'Sem instrumento')).map((rows) => ({
    instrument: rows[0]?.instrument || 'Sem instrumento',
    students: rows.length,
    avg_progress: round(avg(rows.map((row) => row.progress_percent))),
    avg_score: round(avg(rows.map((row) => row.avg_score).filter((value) => value != null))),
    attendance_rate: round(avg(rows.map((row) => row.attendance_rate).filter((value) => value != null)))
  })).sort((a, b) => b.avg_progress - a.avg_progress);

  const byGraduation = Object.values(groupBy(studentRows, (row) => row.level || 'Sem graduação')).map((rows) => ({
    level: rows[0]?.level || 'Sem graduação',
    students: rows.length,
    avg_progress: round(avg(rows.map((row) => row.progress_percent))),
    near_next_stage: rows.filter((row) => row.progress_percent >= 80 && row.progress_percent < 100).length,
    delayed: rows.filter((row) => row.late).length
  }));

  const byInstructor = [];
  teachers.forEach((teacher) => {
    const titularRows = studentRows.filter((row) => row.titular_teacher_id === teacher.id);
    const reservaRows = studentRows.filter((row) => row.reserva_teacher_id === teacher.id);
    if (!titularRows.length && !reservaRows.length) return;
    byInstructor.push({
      teacher_id: teacher.id,
      teacher_name: teacher.full_name,
      titular_students: titularRows.length,
      reserva_students: reservaRows.length,
      avg_progress_titular: titularRows.length ? round(avg(titularRows.map((row) => row.progress_percent))) : null,
      avg_progress_reserva: reservaRows.length ? round(avg(reservaRows.map((row) => row.progress_percent))) : null,
      avg_attendance_titular: titularRows.length ? round(avg(titularRows.map((row) => row.attendance_rate).filter((v) => v != null))) : null,
      avg_attendance_reserva: reservaRows.length ? round(avg(reservaRows.map((row) => row.attendance_rate).filter((v) => v != null))) : null,
      avg_score_titular: titularRows.length ? round(avg(titularRows.map((row) => row.avg_score).filter((v) => v != null))) : null,
      avg_score_reserva: reservaRows.length ? round(avg(reservaRows.map((row) => row.avg_score).filter((v) => v != null))) : null
    });
  });

  const nearNextStage = studentRows.filter((row) => row.progress_percent >= 80 && row.progress_percent < 100).sort((a, b) => b.progress_percent - a.progress_percent);
  const delayedGoals = studentRows.filter((row) => row.late).sort((a, b) => a.progress_percent - b.progress_percent);
  const noRecentLaunch = studentRows.filter((row) => {
    if (!row.last_lesson_date) return true;
    return dayjs().diff(dayjs(row.last_lesson_date), 'day') > 30;
  });
  const declineRows = studentRows.filter((row) => row.decline).sort((a, b) => a.decline_delta - b.decline_delta);
  const stagnationRows = studentRows.filter((row) => row.stagnation).sort((a, b) => a.progress_percent - b.progress_percent);
  const frequencyRanking = [...studentRows].filter((row) => row.attendance_rate != null).sort((a, b) => (b.attendance_rate || 0) - (a.attendance_rate || 0));
  const progressRanking = [...studentRows].sort((a, b) => (b.progress_percent || 0) - (a.progress_percent || 0));

  const kpis = {
    students_count: students.length,
    lessons_count: lessons.length,
    attendance_count: attendance.length,
    goals_active_count: goals.filter((goal) => goal.is_active).length,
    avg_progress: round(avg(studentRows.map((row) => row.progress_percent))),
    avg_attendance: round(avg(studentRows.map((row) => row.attendance_rate).filter((value) => value != null))),
    near_next_stage_count: nearNextStage.length,
    delayed_count: delayedGoals.length,
    no_recent_launch_count: noRecentLaunch.length
  };

  return {
    kpis,
    studentRows,
    byInstrument,
    byGraduation,
    byInstructor,
    nearNextStage,
    delayedGoals,
    noRecentLaunch,
    declineRows,
    stagnationRows,
    frequencyRanking,
    progressRanking
  };
}

export function buildReportsExportRows(model) {
  return model.studentRows.map((row) => ({
    aluno: row.student_name,
    instrumento: row.instrument,
    graduacao_atual: row.level,
    proxima_etapa: row.target_level,
    progresso_meta_percentual: row.progress_percent,
    status_meta: row.goal_status,
    data_alvo: row.target_date,
    turma: row.group_name,
    instrutor_titular: row.titular_teacher,
    instrutor_reserva: row.reserva_teacher,
    media_avaliacao: row.avg_score,
    frequencia_percentual: row.attendance_rate,
    faltas_consecutivas: row.consecutive_absences,
    ultimo_lancamento: row.last_lesson_date,
    lancamentos: row.lesson_count,
    atraso_meta: row.late ? 'Sim' : 'Não',
    queda_desempenho: row.decline ? 'Sim' : 'Não',
    estagnacao: row.stagnation ? 'Sim' : 'Não'
  }));
}

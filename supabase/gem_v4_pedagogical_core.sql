-- GEM V4 - núcleo pedagógico, presença, grupos, auditoria e compatibilidade
-- Execute APÓS schema.sql, gem_v2_upgrade.sql, gem_v3_multi_items.sql e gem_collab_org.sql

create extension if not exists pgcrypto;

-- =========================================================
-- Ajustes de compatibilidade do legado
-- =========================================================
alter table if exists public.lesson_records
  alter column instructor_id drop not null;

alter table if exists public.teachers
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

alter table if exists public.lesson_records
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists is_canceled boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists canceled_by uuid references auth.users(id) on delete set null,
  add column if not exists canceled_reason text,
  add column if not exists evaluation_avg numeric(5,2),
  add column if not exists observations text;

update public.lesson_records
set created_by = coalesce(created_by, instructor_id),
    updated_by = coalesce(updated_by, instructor_id)
where created_by is null or updated_by is null;

-- =========================================================
-- Catálogo oficial de instrumentos e relação N:N com métodos
-- =========================================================
create table if not exists public.instrument_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  family text not null default '',
  aliases text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.method_instruments (
  method_id uuid not null references public.methods(id) on delete cascade,
  instrument_id uuid not null references public.instrument_catalog(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (method_id, instrument_id)
);

create index if not exists idx_method_instruments_instrument on public.method_instruments(instrument_id);

-- =========================================================
-- Itens estruturados de lançamento
-- =========================================================
create table if not exists public.lesson_content_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lesson_records(id) on delete cascade,
  content_type text not null check (content_type in ('hino', 'coro')),
  content_number integer not null,
  voices text[] not null default '{}',
  solfejo boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_page_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lesson_records(id) on delete cascade,
  method_id uuid references public.methods(id) on delete set null,
  method_name text,
  page_label text not null,
  page_number integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_lesson_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lesson_records(id) on delete cascade,
  method_id uuid references public.methods(id) on delete set null,
  method_name text,
  lesson_label text not null,
  lesson_number integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_theory_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lesson_records(id) on delete cascade,
  method_name text not null default 'MSA - 2023',
  phase_label text not null,
  phase_number integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_evaluations (
  lesson_id uuid primary key references public.lesson_records(id) on delete cascade,
  rhythm numeric(4,2) not null default 0 check (rhythm >= 0 and rhythm <= 10),
  reading_solfejo numeric(4,2) not null default 0 check (reading_solfejo >= 0 and reading_solfejo <= 10),
  technique numeric(4,2) not null default 0 check (technique >= 0 and technique <= 10),
  posture numeric(4,2) not null default 0 check (posture >= 0 and posture <= 10),
  musicality numeric(4,2) not null default 0 check (musicality >= 0 and musicality <= 10),
  avg_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_lesson_content_items_lesson on public.lesson_content_items(lesson_id, position);
create index if not exists idx_lesson_page_items_lesson on public.lesson_page_items(lesson_id, position);
create index if not exists idx_lesson_lesson_items_lesson on public.lesson_lesson_items(lesson_id, position);
create index if not exists idx_lesson_theory_items_lesson on public.lesson_theory_items(lesson_id, position);

-- =========================================================
-- Grupos / turmas e vínculos de instrutores e alunos
-- =========================================================
create table if not exists public.student_groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  congregation text,
  focus_instrument_id uuid references public.instrument_catalog(id) on delete set null,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create unique index if not exists idx_student_groups_org_name on public.student_groups(org_id, name);

create table if not exists public.group_instructor_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  group_id uuid not null references public.student_groups(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  role_kind text not null check (role_kind in ('titular', 'reserva')),
  start_date date not null default current_date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_group_instructor_assignments_group on public.group_instructor_assignments(group_id, role_kind, end_date);
create index if not exists idx_group_instructor_assignments_teacher on public.group_instructor_assignments(teacher_id, end_date);

create table if not exists public.student_group_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  group_id uuid not null references public.student_groups(id) on delete cascade,
  start_date date not null default current_date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_student_group_memberships_student on public.student_group_memberships(student_id, end_date);
create index if not exists idx_student_group_memberships_group on public.student_group_memberships(group_id, end_date);

-- =========================================================
-- Presença consolidada por aluno/dia
-- =========================================================
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  group_id uuid references public.student_groups(id) on delete set null,
  attendance_date date not null,
  status text not null default 'presente' check (status in ('presente', 'falta', 'justificada', 'atraso', 'reposição')),
  source_kind text not null default 'manual' check (source_kind in ('manual', 'derived_from_lesson', 'manual_override')),
  note text,
  derived_lesson_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (student_id, attendance_date)
);

create index if not exists idx_attendance_records_org_date on public.attendance_records(org_id, attendance_date);
create index if not exists idx_attendance_records_student_date on public.attendance_records(student_id, attendance_date);

-- =========================================================
-- Programa mínimo / requisitos globais e metas do aluno
-- =========================================================
create table if not exists public.curriculum_requirements (
  id uuid primary key default gen_random_uuid(),
  instrument_name text not null,
  current_level text not null,
  target_level text not null,
  stage_code text not null,
  path_group text,
  requirement_type text not null check (requirement_type in ('method_page', 'method_lesson', 'method_complete', 'theory_phase', 'solfejo_range', 'hymn_range', 'note')),
  method_name text,
  page_target integer,
  lesson_target_label text,
  lesson_target_number integer,
  theory_phase integer,
  completion_mode text,
  hymn_from integer,
  hymn_to integer,
  requires_full_hinario boolean not null default false,
  required_voices text[] not null default '{}',
  measurable boolean not null default true,
  weight_group text,
  raw_requirement text,
  notes text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_curriculum_requirements_lookup on public.curriculum_requirements(instrument_name, current_level, target_level, stage_code, active);

create table if not exists public.student_goals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  current_level text not null,
  target_level text not null,
  objective text,
  target_date date,
  status text not null default 'em atenção' check (status in ('em dia', 'em atenção', 'atrasado', 'concluído')),
  progress_percent numeric(5,2) not null default 0,
  is_active boolean not null default true,
  progress_snapshot jsonb not null default '{}'::jsonb,
  requirements_snapshot jsonb not null default '[]'::jsonb,
  notes text,
  concluded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create unique index if not exists idx_student_goals_active_unique on public.student_goals(student_id) where is_active;
create index if not exists idx_student_goals_org on public.student_goals(org_id, status, is_active);

-- =========================================================
-- Auditoria
-- =========================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  table_name text not null,
  row_id uuid,
  action text not null,
  changed_by uuid references auth.users(id) on delete set null,
  change_summary text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_table on public.audit_logs(org_id, table_name, created_at desc);
create index if not exists idx_audit_logs_row on public.audit_logs(row_id, created_at desc);

-- =========================================================
-- Triggers genéricos de auditoria / actor / updated_at
-- =========================================================
create or replace function public.set_actor_audit_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.created_at is null then
      new.created_at := now();
    end if;

    if new.updated_at is null then
      new.updated_at := now();
    end if;
  elsif tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;

  -- ajuste específico para lesson_records:
  -- o schema real usa teacher_id, não instructor_id
  if tg_table_name = 'lesson_records' and new.teacher_id is null then
    new.teacher_id := old.teacher_id;
  end if;

  return new;
end;
$$;

create or replace function public.audit_change_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_row_id uuid;
  v_summary text;
begin
  if tg_op = 'DELETE' then
    v_org := old.org_id;
    v_row_id := old.id;
    v_summary := format('%s excluído/cancelado', tg_table_name);
    insert into public.audit_logs(org_id, table_name, row_id, action, changed_by, change_summary, old_data, new_data)
    values (v_org, tg_table_name, v_row_id, tg_op, auth.uid(), v_summary, to_jsonb(old), null);
    return old;
  end if;

  v_org := new.org_id;
  v_row_id := new.id;
  v_summary := format('%s %s', tg_table_name, case when tg_op = 'INSERT' then 'criado' else 'alterado' end);

  insert into public.audit_logs(org_id, table_name, row_id, action, changed_by, change_summary, old_data, new_data)
  values (v_org, tg_table_name, v_row_id, tg_op, auth.uid(), v_summary, case when tg_op = 'UPDATE' then to_jsonb(old) else null end, to_jsonb(new));

  return new;
end;
$$;

create or replace function public.apply_standard_audit_triggers(p_table text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute format('drop trigger if exists trg_%s_updated_at on public.%I', p_table, p_table);
  execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', p_table, p_table);

  execute format('drop trigger if exists trg_%s_actor on public.%I', p_table, p_table);
  execute format('create trigger trg_%s_actor before insert or update on public.%I for each row execute function public.set_actor_audit_fields()', p_table, p_table);
end;
$$;

select public.apply_standard_audit_triggers('lesson_records');
select public.apply_standard_audit_triggers('lesson_evaluations');
select public.apply_standard_audit_triggers('student_groups');
select public.apply_standard_audit_triggers('group_instructor_assignments');
select public.apply_standard_audit_triggers('student_group_memberships');
select public.apply_standard_audit_triggers('attendance_records');
select public.apply_standard_audit_triggers('student_goals');

-- lesson_evaluations does not have org_id/id, so only updated_at/actor are useful there.
drop trigger if exists trg_lesson_evaluations_audit on public.lesson_evaluations;

drop trigger if exists trg_lesson_records_audit on public.lesson_records;
create trigger trg_lesson_records_audit
after insert or update or delete on public.lesson_records
for each row execute function public.audit_change_log();

drop trigger if exists trg_student_groups_audit on public.student_groups;
create trigger trg_student_groups_audit
after insert or update or delete on public.student_groups
for each row execute function public.audit_change_log();

drop trigger if exists trg_group_instructor_assignments_audit on public.group_instructor_assignments;
create trigger trg_group_instructor_assignments_audit
after insert or update or delete on public.group_instructor_assignments
for each row execute function public.audit_change_log();

drop trigger if exists trg_student_group_memberships_audit on public.student_group_memberships;
create trigger trg_student_group_memberships_audit
after insert or update or delete on public.student_group_memberships
for each row execute function public.audit_change_log();

drop trigger if exists trg_attendance_records_audit on public.attendance_records;
create trigger trg_attendance_records_audit
after insert or update or delete on public.attendance_records
for each row execute function public.audit_change_log();

drop trigger if exists trg_student_goals_audit on public.student_goals;
create trigger trg_student_goals_audit
after insert or update or delete on public.student_goals
for each row execute function public.audit_change_log();

-- instrument_catalog / curriculum_requirements não são org-scoped; usam só updated_at
create or replace function public.set_master_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_instrument_catalog_updated_at on public.instrument_catalog;
create trigger trg_instrument_catalog_updated_at before update on public.instrument_catalog for each row execute function public.set_master_updated_at();

drop trigger if exists trg_curriculum_requirements_updated_at on public.curriculum_requirements;
create trigger trg_curriculum_requirements_updated_at before update on public.curriculum_requirements for each row execute function public.set_master_updated_at();

-- =========================================================
-- Preenchimento automático de org_id em novas tabelas
-- =========================================================
create or replace function public.set_org_id_from_profile_if_null()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  if new.org_id is not null then
    return new;
  end if;
  select public.my_org_id() into v_org;
  if v_org is null then
    raise exception 'Usuário sem organização ativa.';
  end if;
  new.org_id := v_org;
  return new;
end;
$$;

drop trigger if exists trg_student_groups_set_org on public.student_groups;
create trigger trg_student_groups_set_org before insert on public.student_groups for each row execute function public.set_org_id_from_profile_if_null();

drop trigger if exists trg_group_instructor_assignments_set_org on public.group_instructor_assignments;
create trigger trg_group_instructor_assignments_set_org before insert on public.group_instructor_assignments for each row execute function public.set_org_id_from_profile_if_null();

drop trigger if exists trg_student_group_memberships_set_org on public.student_group_memberships;
create trigger trg_student_group_memberships_set_org before insert on public.student_group_memberships for each row execute function public.set_org_id_from_profile_if_null();

drop trigger if exists trg_attendance_records_set_org on public.attendance_records;
create trigger trg_attendance_records_set_org before insert on public.attendance_records for each row execute function public.set_org_id_from_profile_if_null();

drop trigger if exists trg_student_goals_set_org on public.student_goals;
create trigger trg_student_goals_set_org before insert on public.student_goals for each row execute function public.set_org_id_from_profile_if_null();

-- =========================================================
-- Funções utilitárias de presença
-- =========================================================
create or replace function public.get_active_group_for_student(p_student_id uuid, p_on_date date default current_date)
returns uuid
language sql
stable
as $$
  select m.group_id
  from public.student_group_memberships m
  where m.student_id = p_student_id
    and m.start_date <= p_on_date
    and (m.end_date is null or m.end_date >= p_on_date)
  order by m.start_date desc, m.created_at desc
  limit 1
$$;

create or replace function public.refresh_attendance_for_student_day(p_student_id uuid, p_date date, p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_existing public.attendance_records;
  v_group_id uuid;
begin
  select count(*)::integer into v_count
  from public.lesson_records
  where student_id = p_student_id
    and lesson_date = p_date
    and coalesce(is_canceled, false) = false;

  select * into v_existing
  from public.attendance_records
  where student_id = p_student_id
    and attendance_date = p_date
  limit 1;

  v_group_id := public.get_active_group_for_student(p_student_id, p_date);

  if v_count > 0 then
    if v_existing.id is null then
      insert into public.attendance_records(org_id, student_id, group_id, attendance_date, status, source_kind, derived_lesson_count, created_by, updated_by)
      values (p_org_id, p_student_id, v_group_id, p_date, 'presente', 'derived_from_lesson', v_count, auth.uid(), auth.uid());
    else
      update public.attendance_records
      set derived_lesson_count = v_count,
          group_id = coalesce(group_id, v_group_id),
          status = case when source_kind = 'derived_from_lesson' then 'presente' else status end,
          updated_by = coalesce(auth.uid(), updated_by),
          updated_at = now()
      where id = v_existing.id;
    end if;
  else
    if v_existing.id is not null then
      if v_existing.source_kind = 'derived_from_lesson' then
        delete from public.attendance_records where id = v_existing.id;
      else
        update public.attendance_records
        set derived_lesson_count = 0,
            updated_by = coalesce(auth.uid(), updated_by),
            updated_at = now()
        where id = v_existing.id;
      end if;
    end if;
  end if;
end;
$$;

create or replace function public.lesson_attendance_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_attendance_for_student_day(old.student_id, old.lesson_date, old.org_id);
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.student_id is distinct from new.student_id or old.lesson_date is distinct from new.lesson_date then
      perform public.refresh_attendance_for_student_day(old.student_id, old.lesson_date, old.org_id);
    end if;
    perform public.refresh_attendance_for_student_day(new.student_id, new.lesson_date, new.org_id);
    return new;
  end if;

  perform public.refresh_attendance_for_student_day(new.student_id, new.lesson_date, new.org_id);
  return new;
end;
$$;

drop trigger if exists trg_lesson_records_attendance on public.lesson_records;
create trigger trg_lesson_records_attendance
after insert or update or delete on public.lesson_records
for each row execute function public.lesson_attendance_after_change();

-- =========================================================
-- RPC transacional para salvar lançamento estruturado
-- =========================================================
create or replace function public.upsert_lesson_record_v2(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_method_name text;
  v_eval jsonb;
  v_avg numeric(5,2);
  v_first_content jsonb;
begin
  v_id := nullif(p_payload->>'id', '')::uuid;

  if nullif(p_payload->>'method_id', '') is not null then
    select name into v_method_name from public.methods where id = (p_payload->>'method_id')::uuid;
  else
    v_method_name := null;
  end if;

  v_first_content := coalesce((select value from jsonb_array_elements(coalesce(p_payload->'content_items', '[]'::jsonb)) limit 1), '{}'::jsonb);
  v_eval := coalesce(p_payload->'evaluation', '{}'::jsonb);
  v_avg := round((
    coalesce((v_eval->>'rhythm')::numeric, 0) +
    coalesce((v_eval->>'reading_solfejo')::numeric, 0) +
    coalesce((v_eval->>'technique')::numeric, 0) +
    coalesce((v_eval->>'posture')::numeric, 0) +
    coalesce((v_eval->>'musicality')::numeric, 0)
  ) / 5.0, 2);

  if v_id is null then
    insert into public.lesson_records (
      org_id,
      student_id,
      instructor_id,
      teacher_id,
      method_id,
      method_name,
      lesson_date,
      content_group,
      content_number,
      voices,
      solfejo,
      pages,
      lesson_name,
      hymns,
      technical_notes,
      observations,
      attendance,
      performance_score,
      skill_rhythm,
      skill_reading,
      skill_technique,
      skill_posture,
      skill_musicality,
      launched_at,
      evaluation_avg,
      created_by,
      updated_by,
      is_canceled
    ) values (
      public.my_org_id(),
      (p_payload->>'student_id')::uuid,
      auth.uid(),
      nullif(p_payload->>'teacher_id', '')::uuid,
      nullif(p_payload->>'method_id', '')::uuid,
      v_method_name,
      coalesce((p_payload->>'lesson_date')::date, current_date),
      nullif(v_first_content->>'content_type', ''),
      nullif(v_first_content->>'content_number', '')::integer,
      coalesce(array(select jsonb_array_elements_text(coalesce(v_first_content->'voices', '[]'::jsonb))), '{}'),
      coalesce((v_first_content->>'solfejo')::boolean, false),
      nullif(p_payload->>'pages_legacy', ''),
      nullif(p_payload->>'lessons_legacy', ''),
      nullif(p_payload->>'hymns_legacy', ''),
      nullif(p_payload->>'technical_notes', ''),
      nullif(p_payload->>'observations', ''),
      coalesce((p_payload->>'attendance')::boolean, true),
      v_avg,
      coalesce((v_eval->>'rhythm')::numeric, 0),
      coalesce((v_eval->>'reading_solfejo')::numeric, 0),
      coalesce((v_eval->>'technique')::numeric, 0),
      coalesce((v_eval->>'posture')::numeric, 0),
      coalesce((v_eval->>'musicality')::numeric, 0),
      now(),
      v_avg,
      auth.uid(),
      auth.uid(),
      false
    ) returning id into v_id;
  else
    update public.lesson_records set
      student_id = (p_payload->>'student_id')::uuid,
      teacher_id = nullif(p_payload->>'teacher_id', '')::uuid,
      method_id = nullif(p_payload->>'method_id', '')::uuid,
      method_name = v_method_name,
      lesson_date = coalesce((p_payload->>'lesson_date')::date, lesson_date),
      content_group = nullif(v_first_content->>'content_type', ''),
      content_number = nullif(v_first_content->>'content_number', '')::integer,
      voices = coalesce(array(select jsonb_array_elements_text(coalesce(v_first_content->'voices', '[]'::jsonb))), '{}'),
      solfejo = coalesce((v_first_content->>'solfejo')::boolean, false),
      pages = nullif(p_payload->>'pages_legacy', ''),
      lesson_name = nullif(p_payload->>'lessons_legacy', ''),
      hymns = nullif(p_payload->>'hymns_legacy', ''),
      technical_notes = nullif(p_payload->>'technical_notes', ''),
      observations = nullif(p_payload->>'observations', ''),
      attendance = coalesce((p_payload->>'attendance')::boolean, true),
      performance_score = v_avg,
      skill_rhythm = coalesce((v_eval->>'rhythm')::numeric, 0),
      skill_reading = coalesce((v_eval->>'reading_solfejo')::numeric, 0),
      skill_technique = coalesce((v_eval->>'technique')::numeric, 0),
      skill_posture = coalesce((v_eval->>'posture')::numeric, 0),
      skill_musicality = coalesce((v_eval->>'musicality')::numeric, 0),
      evaluation_avg = v_avg,
      is_canceled = false,
      canceled_at = null,
      canceled_by = null,
      canceled_reason = null,
      updated_by = auth.uid(),
      updated_at = now()
    where id = v_id;
  end if;

  delete from public.lesson_content_items where lesson_id = v_id;
  delete from public.lesson_page_items where lesson_id = v_id;
  delete from public.lesson_lesson_items where lesson_id = v_id;
  delete from public.lesson_theory_items where lesson_id = v_id;

  insert into public.lesson_content_items(lesson_id, content_type, content_number, voices, solfejo, position)
  select
    v_id,
    value->>'content_type',
    (value->>'content_number')::integer,
    coalesce(array(select jsonb_array_elements_text(coalesce(value->'voices', '[]'::jsonb))), '{}'),
    coalesce((value->>'solfejo')::boolean, false),
    row_number() over () - 1
  from jsonb_array_elements(coalesce(p_payload->'content_items', '[]'::jsonb));

  insert into public.lesson_page_items(lesson_id, method_id, method_name, page_label, page_number, position)
  select
    v_id,
    nullif(p_payload->>'method_id', '')::uuid,
    v_method_name,
    value->>'page_label',
    nullif(value->>'page_number', '')::integer,
    row_number() over () - 1
  from jsonb_array_elements(coalesce(p_payload->'page_items', '[]'::jsonb));

  insert into public.lesson_lesson_items(lesson_id, method_id, method_name, lesson_label, lesson_number, position)
  select
    v_id,
    nullif(p_payload->>'method_id', '')::uuid,
    v_method_name,
    value->>'lesson_label',
    nullif(value->>'lesson_number', '')::integer,
    row_number() over () - 1
  from jsonb_array_elements(coalesce(p_payload->'lesson_items', '[]'::jsonb));

  insert into public.lesson_theory_items(lesson_id, method_name, phase_label, phase_number, position)
  select
    v_id,
    coalesce(nullif(value->>'method_name', ''), 'MSA - 2023'),
    value->>'phase_label',
    nullif(value->>'phase_number', '')::integer,
    row_number() over () - 1
  from jsonb_array_elements(coalesce(p_payload->'theory_items', '[]'::jsonb));

  insert into public.lesson_evaluations(lesson_id, rhythm, reading_solfejo, technique, posture, musicality, avg_score, created_by, updated_by)
  values (
    v_id,
    coalesce((v_eval->>'rhythm')::numeric, 0),
    coalesce((v_eval->>'reading_solfejo')::numeric, 0),
    coalesce((v_eval->>'technique')::numeric, 0),
    coalesce((v_eval->>'posture')::numeric, 0),
    coalesce((v_eval->>'musicality')::numeric, 0),
    v_avg,
    auth.uid(),
    auth.uid()
  )
  on conflict (lesson_id) do update set
    rhythm = excluded.rhythm,
    reading_solfejo = excluded.reading_solfejo,
    technique = excluded.technique,
    posture = excluded.posture,
    musicality = excluded.musicality,
    avg_score = excluded.avg_score,
    updated_at = now(),
    updated_by = auth.uid();

  return v_id;
end;
$$;

create or replace function public.cancel_lesson_record_v2(p_lesson_id uuid, p_reason text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lesson_records
  set is_canceled = true,
      canceled_at = now(),
      canceled_by = auth.uid(),
      canceled_reason = p_reason,
      updated_at = now(),
      updated_by = auth.uid()
  where id = p_lesson_id;

  return found;
end;
$$;

grant execute on function public.upsert_lesson_record_v2(jsonb) to authenticated;
grant execute on function public.cancel_lesson_record_v2(uuid, text) to authenticated;
grant execute on function public.refresh_attendance_for_student_day(uuid, date, uuid) to authenticated;

-- =========================================================
-- RLS - novas tabelas
-- =========================================================
alter table public.instrument_catalog enable row level security;
alter table public.method_instruments enable row level security;
alter table public.lesson_content_items enable row level security;
alter table public.lesson_page_items enable row level security;
alter table public.lesson_lesson_items enable row level security;
alter table public.lesson_theory_items enable row level security;
alter table public.lesson_evaluations enable row level security;
alter table public.student_groups enable row level security;
alter table public.group_instructor_assignments enable row level security;
alter table public.student_group_memberships enable row level security;
alter table public.attendance_records enable row level security;
alter table public.curriculum_requirements enable row level security;
alter table public.student_goals enable row level security;
alter table public.audit_logs enable row level security;

-- instrumentos / currículo: leitura autenticada, edição só admin
create policy instrument_catalog_select_authenticated on public.instrument_catalog for select to authenticated using (true);
create policy instrument_catalog_admin_all on public.instrument_catalog for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy curriculum_requirements_select_authenticated on public.curriculum_requirements for select to authenticated using (true);
create policy curriculum_requirements_admin_all on public.curriculum_requirements for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- method_instruments: acompanhar política de methods
create policy method_instruments_select_org on public.method_instruments
for select to authenticated
using (
  exists (
    select 1 from public.methods m
    where m.id = method_instruments.method_id
      and public.is_member_of_org(m.org_id)
  )
);

create policy method_instruments_modify_admin_or_org on public.method_instruments
for all to authenticated
using (
  exists (
    select 1 from public.methods m
    where m.id = method_instruments.method_id
      and public.is_member_of_org(m.org_id)
  )
)
with check (
  exists (
    select 1 from public.methods m
    where m.id = method_instruments.method_id
      and public.is_member_of_org(m.org_id)
  )
);

-- child tables de lesson_records
create policy lesson_content_items_select_org on public.lesson_content_items
for select to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_content_items.lesson_id and public.is_member_of_org(l.org_id)));
create policy lesson_content_items_modify_org on public.lesson_content_items
for all to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_content_items.lesson_id and public.is_member_of_org(l.org_id)))
with check (exists (select 1 from public.lesson_records l where l.id = lesson_content_items.lesson_id and public.is_member_of_org(l.org_id)));

create policy lesson_page_items_select_org on public.lesson_page_items
for select to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_page_items.lesson_id and public.is_member_of_org(l.org_id)));
create policy lesson_page_items_modify_org on public.lesson_page_items
for all to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_page_items.lesson_id and public.is_member_of_org(l.org_id)))
with check (exists (select 1 from public.lesson_records l where l.id = lesson_page_items.lesson_id and public.is_member_of_org(l.org_id)));

create policy lesson_lesson_items_select_org on public.lesson_lesson_items
for select to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_lesson_items.lesson_id and public.is_member_of_org(l.org_id)));
create policy lesson_lesson_items_modify_org on public.lesson_lesson_items
for all to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_lesson_items.lesson_id and public.is_member_of_org(l.org_id)))
with check (exists (select 1 from public.lesson_records l where l.id = lesson_lesson_items.lesson_id and public.is_member_of_org(l.org_id)));

create policy lesson_theory_items_select_org on public.lesson_theory_items
for select to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_theory_items.lesson_id and public.is_member_of_org(l.org_id)));
create policy lesson_theory_items_modify_org on public.lesson_theory_items
for all to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_theory_items.lesson_id and public.is_member_of_org(l.org_id)))
with check (exists (select 1 from public.lesson_records l where l.id = lesson_theory_items.lesson_id and public.is_member_of_org(l.org_id)));

create policy lesson_evaluations_select_org on public.lesson_evaluations
for select to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_evaluations.lesson_id and public.is_member_of_org(l.org_id)));
create policy lesson_evaluations_modify_org on public.lesson_evaluations
for all to authenticated
using (exists (select 1 from public.lesson_records l where l.id = lesson_evaluations.lesson_id and public.is_member_of_org(l.org_id)))
with check (exists (select 1 from public.lesson_records l where l.id = lesson_evaluations.lesson_id and public.is_member_of_org(l.org_id)));

-- org tables
create policy student_groups_org_all on public.student_groups
for all to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

create policy group_instructor_assignments_org_all on public.group_instructor_assignments
for all to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

create policy student_group_memberships_org_all on public.student_group_memberships
for all to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

create policy attendance_records_org_all on public.attendance_records
for all to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

create policy student_goals_org_all on public.student_goals
for all to authenticated
using (public.is_member_of_org(org_id))
with check (public.is_member_of_org(org_id));

create policy audit_logs_select_org on public.audit_logs
for select to authenticated
using (org_id is null or public.is_member_of_org(org_id));

-- =========================================================
-- Seed inicial do catálogo oficial de instrumentos
-- =========================================================
insert into public.instrument_catalog(name, family, aliases) values
  ('Violino', 'Cordas', array['Violino']),
  ('Viola', 'Cordas', array['Viola']),
  ('Violoncelo', 'Cordas', array['Violoncelo']),
  ('Trompete', 'Metais', array['Trompete Dó ou SIB', 'Trompete Dó ou Sib', 'Trompete']),
  ('Cornet', 'Metais', array['Cornet SIB', 'Cornet Sib', 'Cornet']),
  ('Flugelhorn', 'Metais', array['Flugelhorn SIB', 'Flugelhorn Sib', 'Flugelhorn']),
  ('Trompa', 'Metais', array['Trompa Fá / SIB', 'Trompa Fá / Sib', 'Trompa']),
  ('Trombone', 'Metais', array['Trombone SIB', 'Trombone Sib', 'Trombone']),
  ('Eufônio', 'Metais', array['Eufônio SIB', 'Eufônio Sib', 'Barítono (Pisto)', 'Eufônio']),
  ('Tuba', 'Metais', array['Tuba SIB-DÓ-MIB-FÁ', 'Tuba Sib-Dó-Mib-Fá', 'Tuba']),
  ('Flauta', 'Madeiras', array['Flauta']),
  ('Oboé', 'Madeiras', array['Oboé']),
  ('Oboé D''Amore', 'Madeiras', array['Oboé D''Amore', 'Oboé D’Amore']),
  ('Corne Inglês', 'Madeiras', array['Corne Inglês']),
  ('Fagote', 'Madeiras', array['Fagote']),
  ('Clarinete', 'Madeiras', array['Clarinete SIB', 'Clarinete Sib', 'Clarinete']),
  ('Clarinete Alto', 'Madeiras', array['Clarinete Alto MIB', 'Clarinete Alto Mib', 'Clarinete Alto']),
  ('Clarinete Baixo (Clarone)', 'Madeiras', array['Clarinete Baixo SIB', 'Clarinete Baixo Sib', 'Clarinete Baixo (Clarone)']),
  ('Saxofone Soprano (Reto)', 'Madeiras', array['Saxofone Soprano SIB', 'Saxofone Soprano Sib', 'Saxofone Soprano (Reto)']),
  ('Saxofone Alto', 'Madeiras', array['Saxofone Alto MIB', 'Saxofone Alto Mib', 'Saxofone Alto']),
  ('Saxofone Tenor', 'Madeiras', array['Saxofone Tenor SIB', 'Saxofone Tenor Sib', 'Saxofone Tenor']),
  ('Saxofone Barítono', 'Madeiras', array['Saxofone Barítono MIB', 'Saxofone Barítono Mib', 'Saxofone Barítono'])
on conflict (name) do update set family = excluded.family, aliases = excluded.aliases;

-- =========================================================
-- Backfill compatível
-- =========================================================
insert into public.method_instruments(method_id, instrument_id)
select m.id, i.id
from public.methods m
join public.instrument_catalog i
  on exists (
    select 1
    from unnest(coalesce(m.instruments, '{}')) as label
    where lower(label) = lower(i.name)
       or lower(label) = any(select lower(alias) from unnest(i.aliases) alias)
  )
on conflict do nothing;

insert into public.lesson_content_items(lesson_id, content_type, content_number, voices, solfejo, position)
select
  l.id,
  coalesce(item.value->>'type', item.value->>'content_type'),
  coalesce(nullif(item.value->>'number', '')::integer, nullif(item.value->>'content_number', '')::integer),
  coalesce(array(select jsonb_array_elements_text(coalesce(item.value->'voices', '[]'::jsonb))), '{}'),
  coalesce((item.value->>'solfejo')::boolean, false),
  row_number() over (partition by l.id order by l.created_at) - 1
from public.lesson_records l,
     lateral jsonb_array_elements(coalesce(l.content_items, '[]'::jsonb)) item(value)
where not exists (select 1 from public.lesson_content_items x where x.lesson_id = l.id)
on conflict do nothing;

insert into public.lesson_content_items(lesson_id, content_type, content_number, voices, solfejo, position)
select l.id, l.content_group, l.content_number, coalesce(l.voices, '{}'), coalesce(l.solfejo, false), 0
from public.lesson_records l
where not exists (select 1 from public.lesson_content_items x where x.lesson_id = l.id)
  and l.content_group is not null
  and l.content_number is not null;

insert into public.lesson_page_items(lesson_id, method_id, method_name, page_label, page_number, position)
select
  l.id,
  l.method_id,
  l.method_name,
  page_label,
  nullif(regexp_replace(page_label, '\\D', '', 'g'), '')::integer,
  row_number() over (partition by l.id order by page_label) - 1
from public.lesson_records l,
     lateral unnest(coalesce(l.page_items, '{}')) page_label
where not exists (select 1 from public.lesson_page_items x where x.lesson_id = l.id)
on conflict do nothing;

insert into public.lesson_lesson_items(lesson_id, method_id, method_name, lesson_label, lesson_number, position)
select
  l.id,
  l.method_id,
  l.method_name,
  lesson_label,
  nullif(regexp_replace(lesson_label, '\\D', '', 'g'), '')::integer,
  row_number() over (partition by l.id order by lesson_label) - 1
from public.lesson_records l,
     lateral unnest(coalesce(l.lesson_items, '{}')) lesson_label
where not exists (select 1 from public.lesson_lesson_items x where x.lesson_id = l.id)
on conflict do nothing;

insert into public.lesson_evaluations(lesson_id, rhythm, reading_solfejo, technique, posture, musicality, avg_score, created_by, updated_by)
select
  l.id,
  coalesce(l.skill_rhythm, 0),
  coalesce(l.skill_reading, 0),
  coalesce(l.skill_technique, 0),
  coalesce(l.skill_posture, 0),
  coalesce(l.skill_musicality, 0),
  coalesce(l.performance_score, round((coalesce(l.skill_rhythm, 0) + coalesce(l.skill_reading, 0) + coalesce(l.skill_technique, 0) + coalesce(l.skill_posture, 0) + coalesce(l.skill_musicality, 0)) / 5.0, 2)),
  coalesce(l.created_by, l.instructor_id),
  coalesce(l.updated_by, l.instructor_id)
from public.lesson_records l
where not exists (select 1 from public.lesson_evaluations e where e.lesson_id = l.id);

insert into public.attendance_records(org_id, student_id, group_id, attendance_date, status, source_kind, derived_lesson_count, created_by, updated_by)
select
  l.org_id,
  l.student_id,
  public.get_active_group_for_student(l.student_id, l.lesson_date),
  l.lesson_date,
  'presente',
  'derived_from_lesson',
  count(*)::integer,
  coalesce(max(l.created_by), max(l.instructor_id)),
  coalesce(max(l.updated_by), max(l.instructor_id))
from public.lesson_records l
where coalesce(l.is_canceled, false) = false
group by l.org_id, l.student_id, l.lesson_date
on conflict (student_id, attendance_date) do update
set derived_lesson_count = excluded.derived_lesson_count,
    status = case when public.attendance_records.source_kind = 'derived_from_lesson' then excluded.status else public.attendance_records.status end,
    source_kind = case when public.attendance_records.source_kind = 'derived_from_lesson' then excluded.source_kind else public.attendance_records.source_kind end;

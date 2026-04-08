alter table if exists public.lesson_records add column if not exists performance_score numeric(4,2);
alter table if exists public.lesson_records add column if not exists skill_rhythm smallint;
alter table if exists public.lesson_records add column if not exists skill_reading smallint;
alter table if exists public.lesson_records add column if not exists skill_technique smallint;
alter table if exists public.lesson_records add column if not exists skill_posture smallint;
alter table if exists public.lesson_records add column if not exists skill_musicality smallint;

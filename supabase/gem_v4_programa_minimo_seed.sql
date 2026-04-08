-- GEM V4 - seed do programa mínimo oficial (2023)
-- Fonte: Programa Mínimo Para Músicos 2023.
-- Regras com measurable = false exigem parametrização complementar do admin para medir “completo”.

truncate table public.curriculum_requirements;

-- =========================================================
-- Base comum: teoria, solfejo e observações gerais
-- =========================================================
with instruments_all(instrument_name) as (
  values
    ('Violino'),('Viola'),('Violoncelo'),('Flauta'),('Oboé'),('Oboé D''Amore'),('Corne Inglês'),('Fagote'),
    ('Clarinete'),('Clarinete Alto'),('Clarinete Baixo (Clarone)'),('Saxofone Soprano (Reto)'),('Saxofone Alto'),
    ('Saxofone Tenor'),('Saxofone Barítono'),('Trompete'),('Cornet'),('Flugelhorn'),('Trompa'),('Trombone'),('Eufônio'),('Tuba')
)
insert into public.curriculum_requirements (
  instrument_name, current_level, target_level, stage_code, requirement_type,
  theory_phase, completion_mode, measurable, weight_group, raw_requirement, notes, sort_order
)
select instrument_name, 'Toca nos Ensaios', 'Toca nas RJM', 'rjm', 'theory_phase', 12, 'phase', true, 'teoria', 'MSA 2023 até Fase 12', 'Teoria estruturada do programa mínimo.', 900
from instruments_all
union all
select instrument_name, 'Toca nas RJM', 'Toca nos Cultos Oficiais', 'cultos', 'theory_phase', 16, 'phase', true, 'teoria', 'MSA 2023 até Fase 16', 'Teoria estruturada do programa mínimo.', 901
from instruments_all
union all
select instrument_name, 'Toca nos Cultos Oficiais', 'Oficializado', 'oficializacao', 'theory_phase', null, 'complete_with_review', true, 'teoria', 'MSA 2023 completo com revisão', 'Teoria completa com revisão.', 902
from instruments_all;

with instruments_all(instrument_name) as (
  values
    ('Violino'),('Viola'),('Violoncelo'),('Flauta'),('Oboé'),('Oboé D''Amore'),('Corne Inglês'),('Fagote'),
    ('Clarinete'),('Clarinete Alto'),('Clarinete Baixo (Clarone)'),('Saxofone Soprano (Reto)'),('Saxofone Alto'),
    ('Saxofone Tenor'),('Saxofone Barítono'),('Trompete'),('Cornet'),('Flugelhorn'),('Trompa'),('Trombone'),('Eufônio'),('Tuba')
)
insert into public.curriculum_requirements (
  instrument_name, current_level, target_level, stage_code, requirement_type,
  hymn_from, hymn_to, requires_full_hinario, measurable, weight_group, raw_requirement, notes, sort_order
)
select instrument_name, 'Toca nos Ensaios', 'Toca nas RJM', 'rjm', 'solfejo_range', 431, 480, false, true, 'solfejo', 'Solfejo: hinos 431 a 480', 'Cobertura automática baseada em itens com solfejo marcado.', 910
from instruments_all
union all
select instrument_name, 'Toca nas RJM', 'Toca nos Cultos Oficiais', 'cultos', 'solfejo_range', 1, 480, true, true, 'solfejo', 'Solfejo: todos os hinos', 'Cobertura automática do hinário completo.', 911
from instruments_all
union all
select instrument_name, 'Toca nos Cultos Oficiais', 'Oficializado', 'oficializacao', 'solfejo_range', 1, 480, true, true, 'solfejo', 'Solfejo: todos os hinos', 'Cobertura automática do hinário completo.', 912
from instruments_all;

with instruments_all(instrument_name) as (
  values
    ('Violino'),('Viola'),('Violoncelo'),('Flauta'),('Oboé'),('Oboé D''Amore'),('Corne Inglês'),('Fagote'),
    ('Clarinete'),('Clarinete Alto'),('Clarinete Baixo (Clarone)'),('Saxofone Soprano (Reto)'),('Saxofone Alto'),
    ('Saxofone Tenor'),('Saxofone Barítono'),('Trompete'),('Cornet'),('Flugelhorn'),('Trompa'),('Trombone'),('Eufônio'),('Tuba')
)
insert into public.curriculum_requirements (
  instrument_name, current_level, target_level, stage_code, requirement_type,
  measurable, raw_requirement, notes, sort_order
)
select instrument_name, 'Toca nos Cultos Oficiais', 'Oficializado', 'oficializacao', 'note', false,
  'Todos os instrumentos deverão saber executar a voz principal, voz alternativa e o soprano, devendo ser apresentados nos testes.',
  'Observação normativa geral do programa mínimo.', 999
from instruments_all;

-- =========================================================
-- Hinos por instrumento: cordas com vozes explícitas, demais por cobertura do hinário
-- =========================================================
insert into public.curriculum_requirements (
  instrument_name, current_level, target_level, stage_code, requirement_type,
  hymn_from, hymn_to, requires_full_hinario, required_voices, measurable, weight_group, raw_requirement, notes, sort_order
)
values
('Violino','Toca nos Ensaios','Toca nas RJM','rjm','hymn_range',431,480,false,array['Soprano'],true,'hinos','Hinos 431 a 480, soprano no natural',null,1000),
('Violino','Toca nas RJM','Toca nos Cultos Oficiais','cultos','hymn_range',1,480,true,array['Soprano'],true,'hinos','Hinário completo, soprano 8ª acima','A altura/oitava permanece como observação normativa.',1001),
('Violino','Toca nos Cultos Oficiais','Oficializado','oficializacao','hymn_range',1,480,true,array['Soprano','Contralto'],true,'hinos','Hinário completo, soprano 8ª acima e contralto natural','A altura/oitava permanece como observação normativa.',1002),
('Viola','Toca nos Ensaios','Toca nas RJM','rjm','hymn_range',431,480,false,array['Tenor'],true,'hinos','Hinos 431 a 480, tenor no natural',null,1010),
('Viola','Toca nas RJM','Toca nos Cultos Oficiais','cultos','hymn_range',1,480,true,array['Tenor'],true,'hinos','Hinário completo, tenor no natural',null,1011),
('Viola','Toca nos Cultos Oficiais','Oficializado','oficializacao','hymn_range',1,480,true,array['Tenor'],true,'hinos','Hinário completo, tenor no natural','Obs.: 1ª e 3ª posições.',1012),
('Violoncelo','Toca nos Ensaios','Toca nas RJM','rjm','hymn_range',431,480,false,array['Baixo'],true,'hinos','Hinos 431 a 480, baixo no natural',null,1020),
('Violoncelo','Toca nas RJM','Toca nos Cultos Oficiais','cultos','hymn_range',1,480,true,array['Baixo'],true,'hinos','Hinário completo, baixo no natural',null,1021),
('Violoncelo','Toca nos Cultos Oficiais','Oficializado','oficializacao','hymn_range',1,480,true,array['Baixo'],true,'hinos','Hinário completo, baixo no natural',null,1022);

with winds_brass(instrument_name) as (
  values
    ('Flauta'),('Oboé'),('Oboé D''Amore'),('Corne Inglês'),('Fagote'),('Clarinete'),('Clarinete Alto'),('Clarinete Baixo (Clarone)'),
    ('Saxofone Soprano (Reto)'),('Saxofone Alto'),('Saxofone Tenor'),('Saxofone Barítono'),('Trompete'),('Cornet'),('Flugelhorn'),('Trompa'),('Trombone'),('Eufônio'),('Tuba')
)
insert into public.curriculum_requirements (
  instrument_name, current_level, target_level, stage_code, requirement_type,
  hymn_from, hymn_to, requires_full_hinario, measurable, weight_group, raw_requirement, notes, sort_order
)
select instrument_name, 'Toca nos Ensaios', 'Toca nas RJM', 'rjm', 'hymn_range', 431, 480, false, true, 'hinos', 'Hinos 431 a 480', 'A cobertura automática mede os números de hinos; a validação fina de voz pode ser complementada pelo admin.', 1030
from winds_brass
union all
select instrument_name, 'Toca nas RJM', 'Toca nos Cultos Oficiais', 'cultos', 'hymn_range', 1, 480, true, true, 'hinos', 'Hinário completo', 'A cobertura automática mede os números de hinos; a validação fina de voz pode ser complementada pelo admin.', 1031
from winds_brass
union all
select instrument_name, 'Toca nos Cultos Oficiais', 'Oficializado', 'oficializacao', 'hymn_range', 1, 480, true, true, 'hinos', 'Hinário completo', 'A cobertura automática mede os números de hinos; a validação fina de voz pode ser complementada pelo admin.', 1032
from winds_brass;

-- =========================================================
-- Cordas
-- =========================================================
insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,page_target,weight_group,raw_requirement,sort_order)
values
('Violino','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','N. Laoureux Vol. 1',35,'paginas','N. Laoureux Vol. 1 até pág. 35',10),
('Violino','Toca nos Ensaios','Toca nas RJM','rjm','B','method_page','Método CCB',46,'paginas','Método CCB até pág. 46',11),
('Violino','Toca nos Ensaios','Toca nas RJM','rjm','B','method_lesson','H. Sitt Vol. 1',null,'licoes','H. Sitt Vol. 1 até lição 4',12),
('Violino','Toca nos Ensaios','Toca nas RJM','rjm','C','method_page','Método Facilitado - Ed. Britten',40,'paginas','Método Facilitado - Ed. Britten até pág. 40',13);
update public.curriculum_requirements set lesson_target_number = 4 where instrument_name = 'Violino' and sort_order = 12;

insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,page_target,completion_mode,measurable,weight_group,raw_requirement,sort_order)
values
('Violino','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_complete','N. Laoureux Vol. 1',null,'complete',false,'paginas','N. Laoureux Vol. 1 completo',20),
('Violino','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','N. Laoureux Vol. 3',15,'page',true,'paginas','Vol. 3 até pág. 15',21),
('Violino','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_page','Método CCB',67,'page',true,'paginas','CCB até pág. 67',22),
('Violino','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_lesson','H. Sitt Vol. 1',null,'lesson',true,'licoes','H. Sitt Vol. 1 até lição 14',23),
('Violino','Toca nas RJM','Toca nos Cultos Oficiais','cultos','C','method_page','Método Facilitado - Ed. Britten',55,'page',true,'paginas','Método Facilitado - Ed. Britten até pág. 55',24);
update public.curriculum_requirements set lesson_target_number = 14 where instrument_name = 'Violino' and sort_order = 23;

insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,page_target,completion_mode,measurable,weight_group,raw_requirement,notes,sort_order)
values
('Violino','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','N. Laoureux Vol. 1',null,'complete',false,'paginas','N. Laoureux Vol. 1 completo','O documento cita também Vol. 3 pág. 15 e 44-53.',30),
('Violino','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','N. Laoureux Vol. 3',53,'page',true,'paginas','Vol. 3 até pág. 15 e 44 a 53','A medição automática usa a maior página; a observação dos dois trechos permanece registrada.',31),
('Violino','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','Método CCB',null,'complete',false,'paginas','Método CCB completo','Exige parametrização do total completo.',32),
('Violino','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','H. Sitt Op. 32 Vol. 1',null,'complete',false,'licoes','H. Sitt Op. 32 Vol. 1 completo','Exige parametrização do total completo.',33),
('Violino','Toca nos Cultos Oficiais','Oficializado','oficializacao','C','method_complete','Método Facilitado - Ed. Britten',null,'complete',false,'paginas','Método Facilitado - Ed. Britten completo','Exige parametrização do total completo.',34);

insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,lesson_target_number,page_target,completion_mode,measurable,weight_group,raw_requirement,sort_order)
values
('Viola','Toca nos Ensaios','Toca nas RJM','rjm','A','method_lesson','Beginning Strings',6,null,'lesson',true,'licoes','Beginning Strings até lição VI',40),
('Viola','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Berta Volmer Vol. 1',31,'page',true,'paginas','Berta Volmer Vol. 1 até pág. 31',41),
('Viola','Toca nos Ensaios','Toca nas RJM','rjm','B','method_page','Método Facilitado - Ed. Britten',40,'page',true,'paginas','Método Facilitado - Ed. Britten até pág. 40',42),
('Viola','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Berta Volmer Vol. 1',62,'page',true,'paginas','Berta Volmer Vol. 1 até pág. 62',43),
('Viola','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','A Tune a Day C.P. Herfurth Vol. 3',16,'page',true,'paginas','A Tune a Day Vol. 3 até pág. 16',44),
('Viola','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_page','Método Facilitado - Ed. Britten',55,'page',true,'paginas','Método Facilitado - Ed. Britten até pág. 55',45),
('Viola','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','Berta Volmer Vol. 1',null,'complete',false,'paginas','Berta Volmer Vol. 1 completo',46),
('Viola','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','A Tune a Day C.P. Herfurth Vol. 3',null,'complete',false,'paginas','A Tune a Day Vol. 3 completo',47),
('Viola','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','Método Facilitado - Ed. Britten',null,'complete',false,'paginas','Método Facilitado - Ed. Britten completo',48);

insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,lesson_target_number,page_target,completion_mode,measurable,weight_group,raw_requirement,sort_order)
values
('Violoncelo','Toca nos Ensaios','Toca nas RJM','rjm','A','method_lesson','Beginning Strings',6,null,'lesson',true,'licoes','Beginning Strings até lição VI',60),
('Violoncelo','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Dotzauer Vol. 1',34,'page',true,'paginas','Dotzauer Vol. 1 até pág. 34',61),
('Violoncelo','Toca nos Ensaios','Toca nas RJM','rjm','B','method_page','Método Facilitado - Ed. Britten',40,'page',true,'paginas','Método Facilitado - Ed. Britten até pág. 40',62),
('Violoncelo','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_complete','Dotzauer Vol. 1',null,'complete',false,'paginas','Dotzauer Vol. 1 completo',63),
('Violoncelo','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Dotzauer Vol. 2',3,'page',true,'paginas','Dotzauer Vol. 2 até pág. 03',64),
('Violoncelo','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_page','Método Facilitado - Ed. Britten',52,'page',true,'paginas','Método Facilitado - Ed. Britten até pág. 52',65),
('Violoncelo','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','Dotzauer Vol. 1',null,'complete',false,'paginas','Dotzauer Vol. 1 completo',66),
('Violoncelo','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','Dotzauer Vol. 2',19,'page',true,'paginas','Dotzauer Vol. 2 até pág. 19',67),
('Violoncelo','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','Método Facilitado - Ed. Britten',null,'complete',false,'paginas','Método Facilitado - Ed. Britten completo',68);

-- =========================================================
-- Madeiras
-- =========================================================
insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,page_target,lesson_target_number,completion_mode,measurable,weight_group,raw_requirement,sort_order)
values
('Flauta','Toca nos Ensaios','Toca nas RJM','rjm','A','method_lesson','Parés',null,41,'lesson',true,'licoes','Parés até lição 41',80),
('Flauta','Toca nos Ensaios','Toca nas RJM','rjm','B','method_page','Galli',41,null,'page',true,'paginas','Galli até pág. 41',81),
('Flauta','Toca nos Ensaios','Toca nas RJM','rjm','C','method_lesson','Método Prático - Almeida Dias',null,13,'lesson',true,'licoes','Método Prático - Almeida Dias até fase 13',82),
('Flauta','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_lesson','Parés',null,62,'lesson',true,'licoes','Parés até lição 62',83),
('Flauta','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_complete','Galli',null,null,'complete',false,'paginas','Galli completo',84),
('Flauta','Toca nas RJM','Toca nos Cultos Oficiais','cultos','C','method_lesson','Método Prático - Almeida Dias',null,25,'lesson',true,'licoes','Método Prático - Almeida Dias até fase 25',85),
('Flauta','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','Parés',null,null,'complete',false,'licoes','Parés completo',86),
('Flauta','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','Galli',null,null,'complete',false,'paginas','Galli completo',87),
('Flauta','Toca nos Cultos Oficiais','Oficializado','oficializacao','C','method_complete','Método Prático - Almeida Dias',null,null,'complete',false,'licoes','Método Prático - Almeida Dias completo',88),
('Oboé','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Giampieri',21,null,'page',true,'paginas','Giampieri até pág. 21 (ou similar)',100),
('Oboé','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Giampieri',30,null,'page',true,'paginas','Giampieri até pág. 30 (ou similar)',101),
('Oboé','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','Giampieri',50,null,'page',true,'paginas','Giampieri até pág. 50 (ou similar)',102),
('Oboé D''Amore','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Giampieri',21,null,'page',true,'paginas','Giampieri até pág. 21 (ou similar)',103),
('Oboé D''Amore','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Giampieri',30,null,'page',true,'paginas','Giampieri até pág. 30 (ou similar)',104),
('Oboé D''Amore','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','Giampieri',50,null,'page',true,'paginas','Giampieri até pág. 50 (ou similar)',105),
('Corne Inglês','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Giampieri',21,null,'page',true,'paginas','Giampieri até pág. 21 (ou similar)',106),
('Corne Inglês','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Giampieri',30,null,'page',true,'paginas','Giampieri até pág. 30 (ou similar)',107),
('Corne Inglês','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','Giampieri',50,null,'page',true,'paginas','Giampieri até pág. 50 (ou similar)',108),
('Fagote','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Giampieri',18,null,'page',true,'paginas','Giampieri até pág. 18',110),
('Fagote','Toca nos Ensaios','Toca nas RJM','rjm','B','method_lesson','Weissenborn',null,12,'lesson',true,'licoes','Weissenborn até módulo 12',111),
('Fagote','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Giampieri',26,null,'page',true,'paginas','Giampieri até pág. 26',112),
('Fagote','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_lesson','Weissenborn',null,18,'lesson',true,'licoes','Weissenborn até módulo 18',113),
('Fagote','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','Giampieri',43,null,'page',true,'paginas','Giampieri até pág. 43',114),
('Fagote','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_lesson','Weissenborn',null,22,'lesson',true,'licoes','Weissenborn até módulo 22',115);

-- Clarinetes
insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,page_target,lesson_target_number,completion_mode,measurable,weight_group,raw_requirement,sort_order)
values
('Clarinete','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Giampieri',28,null,'page',true,'paginas','Giampieri até pág. 28',120),
('Clarinete','Toca nos Ensaios','Toca nas RJM','rjm','B','method_page','Domingos Pecci',29,null,'page',true,'paginas','Domingos Pecci até pág. 29',121),
('Clarinete','Toca nos Ensaios','Toca nas RJM','rjm','C','method_lesson','Galper Book 1',null,26,'lesson',true,'licoes','Galper Book 1 lição 26 / exercício 110',122),
('Clarinete','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Giampieri',41,null,'page',true,'paginas','Giampieri até pág. 41',123),
('Clarinete','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_page','Domingos Pecci',36,null,'page',true,'paginas','Domingos Pecci até pág. 36',124),
('Clarinete','Toca nas RJM','Toca nos Cultos Oficiais','cultos','C','method_lesson','Nabor Pires Camargo',null,36,'lesson',true,'licoes','Nabor Pires Camargo até lição 36',125),
('Clarinete','Toca nas RJM','Toca nos Cultos Oficiais','cultos','D','method_complete','Galper Book 1',null,null,'complete',false,'licoes','Galper Book 1 completo',126),
('Clarinete','Toca nas RJM','Toca nos Cultos Oficiais','cultos','D','method_page','Galper Book 2',18,null,'page',true,'paginas','Galper Book 2 até pág. 18',127),
('Clarinete','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','Giampieri',63,null,'page',true,'paginas','Giampieri até pág. 63',128),
('Clarinete','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','Domingos Pecci',null,null,'complete',false,'paginas','Domingos Pecci completo',129),
('Clarinete','Toca nos Cultos Oficiais','Oficializado','oficializacao','C','method_complete','Nabor Pires Camargo',null,null,'complete',false,'licoes','Nabor Pires Camargo completo',130),
('Clarinete','Toca nos Cultos Oficiais','Oficializado','oficializacao','D','method_complete','Galper Book 1',null,null,'complete',false,'licoes','Galper Book 1 completo',131),
('Clarinete','Toca nos Cultos Oficiais','Oficializado','oficializacao','D','method_page','Galper Book 2',29,null,'page',true,'paginas','Galper Book 2 até pág. 29',132),
('Clarinete Alto','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Giampieri',28,null,'page',true,'paginas','Giampieri até pág. 28',133),
('Clarinete Alto','Toca nos Ensaios','Toca nas RJM','rjm','B','method_lesson','Galper Book 1',null,26,'lesson',true,'licoes','Galper Book 1 lição 26 / exercício 110',134),
('Clarinete Alto','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Giampieri',36,null,'page',true,'paginas','Giampieri até pág. 36',135),
('Clarinete Alto','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_complete','Galper Book 1',null,null,'complete',false,'licoes','Galper Book 1 completo',136),
('Clarinete Alto','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_page','Galper Book 2',18,null,'page',true,'paginas','Galper Book 2 até pág. 18',137),
('Clarinete Alto','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','Giampieri',null,null,'complete',false,'paginas','Giampieri completo',138),
('Clarinete Alto','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','Galper Book 1',null,null,'complete',false,'licoes','Galper Book 1 completo',139),
('Clarinete Alto','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_page','Galper Book 2',29,null,'page',true,'paginas','Galper Book 2 até pág. 29',140),
('Clarinete Baixo (Clarone)','Toca nos Ensaios','Toca nas RJM','rjm','A','method_page','Giampieri',28,null,'page',true,'paginas','Giampieri até pág. 28',141),
('Clarinete Baixo (Clarone)','Toca nos Ensaios','Toca nas RJM','rjm','B','method_lesson','Galper Book 1',null,26,'lesson',true,'licoes','Galper Book 1 lição 26 / exercício 110',142),
('Clarinete Baixo (Clarone)','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Giampieri',36,null,'page',true,'paginas','Giampieri até pág. 36',143),
('Clarinete Baixo (Clarone)','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_complete','Galper Book 1',null,null,'complete',false,'licoes','Galper Book 1 completo',144),
('Clarinete Baixo (Clarone)','Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_page','Galper Book 2',18,null,'page',true,'paginas','Galper Book 2 até pág. 18',145),
('Clarinete Baixo (Clarone)','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','Giampieri',null,null,'complete',false,'paginas','Giampieri completo',146),
('Clarinete Baixo (Clarone)','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','Galper Book 1',null,null,'complete',false,'licoes','Galper Book 1 completo',147),
('Clarinete Baixo (Clarone)','Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_page','Galper Book 2',29,null,'page',true,'paginas','Galper Book 2 até pág. 29',148);

-- Saxofones
with saxes(instrument_name) as (
  values ('Saxofone Soprano (Reto)'),('Saxofone Alto'),('Saxofone Tenor'),('Saxofone Barítono')
)
insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,page_target,lesson_target_number,completion_mode,measurable,weight_group,raw_requirement,sort_order)
select instrument_name, current_level, target_level, stage_code, path_group, requirement_type, method_name, page_target, lesson_target_number, completion_mode, measurable, weight_group, raw_requirement, sort_order
from (
  select instrument_name, 'Toca nos Ensaios'::text current_level, 'Toca nas RJM'::text target_level, 'rjm'::text stage_code, 'A'::text path_group, 'method_page'::text requirement_type, 'Giampieri'::text method_name, 21::int page_target, null::int lesson_target_number, 'page'::text completion_mode, true::boolean measurable, 'paginas'::text weight_group, 'Giampieri até pág. 21'::text raw_requirement, 160::int sort_order from saxes
  union all
  select instrument_name, 'Toca nos Ensaios','Toca nas RJM','rjm','B','method_page','Amadeu Russo',22,null,'page',true,'paginas','Amadeu Russo até pág. 22',161 from saxes
  union all
  select instrument_name, 'Toca nos Ensaios','Toca nas RJM','rjm','C','method_lesson','Método Prático - Almeida Dias',null,13,'lesson',true,'licoes','Método Prático - Almeida Dias até fase 13',162 from saxes
  union all
  select instrument_name, 'Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Giampieri',30,null,'page',true,'paginas','Giampieri até pág. 30',163 from saxes
  union all
  select instrument_name, 'Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_page','Amadeu Russo',40,null,'page',true,'paginas','Amadeu Russo até pág. 40',164 from saxes
  union all
  select instrument_name, 'Toca nas RJM','Toca nos Cultos Oficiais','cultos','C','method_lesson','Método Prático - Almeida Dias',null,25,'lesson',true,'licoes','Método Prático - Almeida Dias até fase 25',165 from saxes
  union all
  select instrument_name, 'Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','Giampieri',50,null,'page',true,'paginas','Giampieri até pág. 50',166 from saxes
  union all
  select instrument_name, 'Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_page','Amadeu Russo',55,null,'page',true,'paginas','Amadeu Russo até pág. 55',167 from saxes
  union all
  select instrument_name, 'Toca nos Cultos Oficiais','Oficializado','oficializacao','C','method_complete','Método Prático - Almeida Dias',null,null,'complete',false,'licoes','Método Prático - Almeida Dias completo',168 from saxes
) x;

-- =========================================================
-- Metais
-- =========================================================
with trumpets(instrument_name) as (
  values ('Trompete'),('Cornet'),('Flugelhorn')
)
insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,page_target,lesson_target_number,completion_mode,measurable,weight_group,raw_requirement,sort_order)
select instrument_name, current_level, target_level, stage_code, path_group, requirement_type, method_name, page_target, lesson_target_number, completion_mode, measurable, weight_group, raw_requirement, sort_order
from (
  select instrument_name, 'Toca nos Ensaios'::text current_level, 'Toca nas RJM'::text target_level, 'rjm'::text stage_code, 'A'::text path_group, 'method_page'::text requirement_type, 'Amadeu Russo'::text method_name, 23::int page_target, null::int lesson_target_number, 'page'::text completion_mode, true::boolean measurable, 'paginas'::text weight_group, 'Amadeu Russo até pág. 23'::text raw_requirement, 180::int sort_order from trumpets
  union all
  select instrument_name, 'Toca nos Ensaios','Toca nas RJM','rjm','B','method_lesson','Método Prático - Almeida Dias',null,13,'lesson',true,'licoes','Método Prático - Almeida Dias até fase 13',181 from trumpets
  union all
  select instrument_name, 'Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_page','Amadeu Russo',31,null,'page',true,'paginas','Amadeu Russo até pág. 31',182 from trumpets
  union all
  select instrument_name, 'Toca nas RJM','Toca nos Cultos Oficiais','cultos','B','method_lesson','Método Prático - Almeida Dias',null,25,'lesson',true,'licoes','Método Prático - Almeida Dias até fase 25',183 from trumpets
  union all
  select instrument_name, 'Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_page','Amadeu Russo',40,null,'page',true,'paginas','Amadeu Russo até pág. 40',184 from trumpets
  union all
  select instrument_name, 'Toca nos Cultos Oficiais','Oficializado','oficializacao','B','method_complete','Método Prático - Almeida Dias',null,null,'complete',false,'licoes','Método Prático - Almeida Dias completo',185 from trumpets
) x;

insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,lesson_target_number,completion_mode,measurable,weight_group,raw_requirement,sort_order)
values
('Trompa','Toca nos Ensaios','Toca nas RJM','rjm','A','method_complete','Rubank Elementar',null,'complete',false,'licoes','Rubank Elementar completo',190),
('Trompa','Toca nos Ensaios','Toca nas RJM','rjm','A','method_lesson','Método Prático - para trompa',73,'lesson',true,'licoes','Método Prático - para trompa até lição 73',191),
('Trompa','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_complete','Rubank Elementar',null,'complete',false,'licoes','Rubank Elementar completo',192),
('Trompa','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_complete','Rubank Intermediate',null,'complete',false,'licoes','Rubank Intermediate completo',193),
('Trompa','Toca nas RJM','Toca nos Cultos Oficiais','cultos','A','method_lesson','Método Prático - para trompa',105,'lesson',true,'licoes','Método Prático - para trompa até lição 105',194),
('Trompa','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','Rubank Elementar',null,'complete',false,'licoes','Rubank Elementar completo',195),
('Trompa','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','Rubank Intermediate',null,'complete',false,'licoes','Rubank Intermediate completo',196),
('Trompa','Toca nos Cultos Oficiais','Oficializado','oficializacao','A','method_complete','Método Prático - para trompa',null,'complete',false,'licoes','Método Prático - para trompa completo',197);

with low_brass(instrument_name) as (
  values ('Trombone'),('Eufônio'),('Tuba')
)
insert into public.curriculum_requirements (instrument_name,current_level,target_level,stage_code,path_group,requirement_type,method_name,lesson_target_number,completion_mode,measurable,weight_group,raw_requirement,sort_order)
select instrument_name, current_level, target_level, stage_code, 'A', requirement_type, 'Método Prático - Almeida Dias', lesson_target_number, completion_mode, measurable, 'licoes', raw_requirement, sort_order
from (
  select instrument_name, 'Toca nos Ensaios'::text current_level, 'Toca nas RJM'::text target_level, 'rjm'::text stage_code, 'method_lesson'::text requirement_type, 13::int lesson_target_number, 'lesson'::text completion_mode, true::boolean measurable, 'Método Prático - Almeida Dias até fase 13'::text raw_requirement, 200::int sort_order from low_brass
  union all
  select instrument_name, 'Toca nas RJM','Toca nos Cultos Oficiais','cultos','method_lesson',25,'lesson',true,'Método Prático - Almeida Dias até fase 25',201 from low_brass
  union all
  select instrument_name, 'Toca nos Cultos Oficiais','Oficializado','oficializacao','method_complete',null,'complete',false,'Método Prático - Almeida Dias completo',202 from low_brass
) x;


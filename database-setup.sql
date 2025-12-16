-- =============================================
-- UniClub Database Setup
-- Версия: 4.2 (Финальная)
-- =============================================
-- 
-- КАК ИСПОЛЬЗОВАТЬ:
-- 1. Зайди в Supabase Dashboard (supabase.com)
-- 2. Выбери свой проект
-- 3. Слева нажми "SQL Editor"
-- 4. Нажми "+ New query"
-- 5. Скопируй и вставь ВЕСЬ этот код
-- 6. Нажми "Run" (зелёная кнопка)
--
-- =============================================

-- =============================================
-- ШАГ 1: УДАЛЯЕМ СТАРЫЕ ТАБЛИЦЫ (если есть)
-- =============================================

DROP TABLE IF EXISTS notification_reads CASCADE;
DROP TABLE IF EXISTS group_notifications CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS club_subscriptions CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS subgroups CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;
DROP TABLE IF EXISTS directions CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;

-- =============================================
-- ШАГ 2: СОЗДАЁМ ТАБЛИЦЫ
-- =============================================

-- 2.1 Факультеты
CREATE TABLE faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Направления подготовки
CREATE TABLE directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Учебные группы
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  direction_id UUID REFERENCES directions(id) ON DELETE CASCADE,
  course INTEGER DEFAULT 1,
  year INTEGER,
  leader_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Подгруппы
CREATE TABLE subgroups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  group_id UUID REFERENCES study_groups(id) ON DELETE SET NULL,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE SET NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем связь: староста группы
ALTER TABLE study_groups 
ADD CONSTRAINT fk_leader 
FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2.6 Расписание
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lesson_type TEXT DEFAULT 'lecture',
  week_type TEXT DEFAULT 'all',
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Уведомления группы
CREATE TABLE group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 Прочитанные уведомления
CREATE TABLE notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES group_notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- 2.9 Клубы
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  cover_image TEXT,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  members_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  contact_email TEXT,
  contact_phone TEXT,
  meeting_schedule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 Подписки на клубы
CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, student_id)
);

-- 2.11 Мероприятия
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  online_link TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_university_wide BOOLEAN DEFAULT false,
  is_registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMPTZ,
  cover_image TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 Регистрации на мероприятия
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- =============================================
-- ШАГ 3: ТРИГГЕРЫ (автоматическое обновление)
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_faculties_updated BEFORE UPDATE ON faculties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_directions_updated BEFORE UPDATE ON directions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_study_groups_updated BEFORE UPDATE ON study_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_schedules_updated BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_clubs_updated BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_events_updated BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION update_club_members()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clubs SET members_count = members_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clubs SET members_count = members_count - 1 WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_club_members AFTER INSERT OR DELETE ON club_subscriptions FOR EACH ROW EXECUTE FUNCTION update_club_members();

CREATE OR REPLACE FUNCTION update_event_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET current_participants = current_participants + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET current_participants = current_participants - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_event_participants AFTER INSERT OR DELETE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_event_participants();

-- =============================================
-- ШАГ 4: НАСТРОЙКА БЕЗОПАСНОСТИ (RLS)
-- =============================================

ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faculties_all" ON faculties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "directions_all" ON directions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "study_groups_all" ON study_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "subgroups_all" ON subgroups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "schedules_all" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "group_notifications_all" ON group_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notification_reads_all" ON notification_reads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "clubs_all" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "club_subscriptions_all" ON club_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "events_all" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "event_registrations_all" ON event_registrations FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ШАГ 5: ИНДЕКСЫ (для скорости)
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_group ON users(group_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_directions_faculty ON directions(faculty_id);
CREATE INDEX idx_groups_direction ON study_groups(direction_id);
CREATE INDEX idx_subgroups_group ON subgroups(group_id);
CREATE INDEX idx_schedules_group ON schedules(group_id);
CREATE INDEX idx_schedules_day ON schedules(day_of_week);
CREATE INDEX idx_notifications_group ON group_notifications(group_id);
CREATE INDEX idx_clubs_admin ON clubs(admin_id);
CREATE INDEX idx_club_subs_club ON club_subscriptions(club_id);
CREATE INDEX idx_club_subs_student ON club_subscriptions(student_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_club ON events(club_id);

-- =============================================
-- ШАГ 6: ТЕСТОВЫЕ ДАННЫЕ
-- =============================================

DO $$
DECLARE
  -- Пользователи (v_ prefix чтобы не путать с колонками)
  v_admin_id UUID;
  v_leader_id UUID;
  v_student1_id UUID;
  v_student2_id UUID;
  v_student3_id UUID;
  
  -- Факультеты
  v_faculty_fit UUID;
  v_faculty_ef UUID;
  v_faculty_uf UUID;
  v_faculty_fiy UUID;
  
  -- Направления
  v_dir_pi UUID;
  v_dir_ib UUID;
  v_dir_pri UUID;
  v_dir_ek UUID;
  v_dir_men UUID;
  v_dir_ur UUID;
  v_dir_ling UUID;
  
  -- Группы
  v_group_pi21 UUID;
  v_group_pi22 UUID;
  v_group_pi11 UUID;
  v_group_ib21 UUID;
  v_group_ib11 UUID;
  v_group_ek21 UUID;
  v_group_u21 UUID;
  
  -- Подгруппы
  v_sub_pi21_1 UUID;
  v_sub_pi21_2 UUID;
  v_sub_pi22_1 UUID;
  v_sub_pi22_2 UUID;
  v_sub_ib21_1 UUID;
  v_sub_ib21_2 UUID;
  
  -- Клубы
  v_club_it UUID;
  v_club_robot UUID;
  v_club_chess UUID;
  v_club_cinema UUID;
  v_club_sport UUID;
  v_club_music UUID;

BEGIN

  -- =============================================
  -- ФАКУЛЬТЕТЫ
  -- =============================================
  
  INSERT INTO faculties (name, code, description) VALUES
  ('Факультет информационных технологий', 'ФИТ', 'Программирование, анализ данных, кибербезопасность')
  RETURNING id INTO v_faculty_fit;
  
  INSERT INTO faculties (name, code, description) VALUES
  ('Экономический факультет', 'ЭФ', 'Экономика, финансы, менеджмент')
  RETURNING id INTO v_faculty_ef;
  
  INSERT INTO faculties (name, code, description) VALUES
  ('Юридический факультет', 'ЮФ', 'Право, юриспруденция')
  RETURNING id INTO v_faculty_uf;
  
  INSERT INTO faculties (name, code, description) VALUES
  ('Факультет иностранных языков', 'ФИЯ', 'Лингвистика, перевод')
  RETURNING id INTO v_faculty_fiy;

  -- =============================================
  -- НАПРАВЛЕНИЯ
  -- =============================================
  
  INSERT INTO directions (name, code, faculty_id) VALUES
  ('Программная инженерия', '09.03.04', v_faculty_fit)
  RETURNING id INTO v_dir_pi;
  
  INSERT INTO directions (name, code, faculty_id) VALUES
  ('Информационная безопасность', '10.03.01', v_faculty_fit)
  RETURNING id INTO v_dir_ib;
  
  INSERT INTO directions (name, code, faculty_id) VALUES
  ('Прикладная информатика', '09.03.03', v_faculty_fit)
  RETURNING id INTO v_dir_pri;
  
  INSERT INTO directions (name, code, faculty_id) VALUES
  ('Экономика', '38.03.01', v_faculty_ef)
  RETURNING id INTO v_dir_ek;
  
  INSERT INTO directions (name, code, faculty_id) VALUES
  ('Менеджмент', '38.03.02', v_faculty_ef)
  RETURNING id INTO v_dir_men;
  
  INSERT INTO directions (name, code, faculty_id) VALUES
  ('Юриспруденция', '40.03.01', v_faculty_uf)
  RETURNING id INTO v_dir_ur;
  
  INSERT INTO directions (name, code, faculty_id) VALUES
  ('Лингвистика', '45.03.02', v_faculty_fiy)
  RETURNING id INTO v_dir_ling;

  -- =============================================
  -- ГРУППЫ
  -- =============================================
  
  INSERT INTO study_groups (name, direction_id, course, year) VALUES
  ('ПИ-21', v_dir_pi, 2, 2023)
  RETURNING id INTO v_group_pi21;
  
  INSERT INTO study_groups (name, direction_id, course, year) VALUES
  ('ПИ-22', v_dir_pi, 2, 2023)
  RETURNING id INTO v_group_pi22;
  
  INSERT INTO study_groups (name, direction_id, course, year) VALUES
  ('ПИ-11', v_dir_pi, 1, 2024)
  RETURNING id INTO v_group_pi11;
  
  INSERT INTO study_groups (name, direction_id, course, year) VALUES
  ('ИБ-21', v_dir_ib, 2, 2023)
  RETURNING id INTO v_group_ib21;
  
  INSERT INTO study_groups (name, direction_id, course, year) VALUES
  ('ИБ-11', v_dir_ib, 1, 2024)
  RETURNING id INTO v_group_ib11;
  
  INSERT INTO study_groups (name, direction_id, course, year) VALUES
  ('ЭК-21', v_dir_ek, 2, 2023)
  RETURNING id INTO v_group_ek21;
  
  INSERT INTO study_groups (name, direction_id, course, year) VALUES
  ('Ю-21', v_dir_ur, 2, 2023)
  RETURNING id INTO v_group_u21;

  -- =============================================
  -- ПОДГРУППЫ
  -- =============================================
  
  INSERT INTO subgroups (name, group_id) VALUES
  ('1 подгруппа', v_group_pi21)
  RETURNING id INTO v_sub_pi21_1;
  
  INSERT INTO subgroups (name, group_id) VALUES
  ('2 подгруппа', v_group_pi21)
  RETURNING id INTO v_sub_pi21_2;
  
  INSERT INTO subgroups (name, group_id) VALUES
  ('1 подгруппа', v_group_pi22)
  RETURNING id INTO v_sub_pi22_1;
  
  INSERT INTO subgroups (name, group_id) VALUES
  ('2 подгруппа', v_group_pi22)
  RETURNING id INTO v_sub_pi22_2;
  
  INSERT INTO subgroups (name, group_id) VALUES
  ('1 подгруппа', v_group_ib21)
  RETURNING id INTO v_sub_ib21_1;
  
  INSERT INTO subgroups (name, group_id) VALUES
  ('2 подгруппа', v_group_ib21)
  RETURNING id INTO v_sub_ib21_2;

  -- =============================================
  -- ПОЛЬЗОВАТЕЛИ
  -- =============================================
  
  -- Админ
  INSERT INTO users (email, password, password_hash, full_name, role) VALUES
  ('admin@uniclub.ru', 'admin123', 'YWRtaW4xMjM=', 'Администратор Системы', 'main_admin')
  RETURNING id INTO v_admin_id;
  
  -- Староста группы ПИ-21
  INSERT INTO users (email, password, password_hash, full_name, role, group_id, subgroup_id) VALUES
  ('leader@uniclub.ru', 'leader123', 'bGVhZGVyMTIz', 'Иванов Иван Иванович', 'group_leader', v_group_pi21, v_sub_pi21_1)
  RETURNING id INTO v_leader_id;
  
  -- Студенты
  INSERT INTO users (email, password, password_hash, full_name, role, group_id, subgroup_id) VALUES
  ('student@uniclub.ru', 'student123', 'c3R1ZGVudDEyMw==', 'Петров Пётр Петрович', 'student', v_group_pi21, v_sub_pi21_1)
  RETURNING id INTO v_student1_id;
  
  INSERT INTO users (email, password, password_hash, full_name, role, group_id, subgroup_id) VALUES
  ('sidorova@uniclub.ru', 'student123', 'c3R1ZGVudDEyMw==', 'Сидорова Анна Сергеевна', 'student', v_group_pi21, v_sub_pi21_2)
  RETURNING id INTO v_student2_id;
  
  INSERT INTO users (email, password, password_hash, full_name, role, group_id, subgroup_id) VALUES
  ('kozlov@uniclub.ru', 'student123', 'c3R1ZGVudDEyMw==', 'Козлов Дмитрий Александрович', 'student', v_group_pi22, v_sub_pi22_1)
  RETURNING id INTO v_student3_id;

  -- =============================================
  -- НАЗНАЧАЕМ СТАРОСТУ
  -- =============================================
  
  UPDATE study_groups SET leader_id = v_leader_id WHERE id = v_group_pi21;

  -- =============================================
  -- КЛУБЫ
  -- =============================================
  
  INSERT INTO clubs (name, description, icon, members_count) VALUES
  ('IT-клуб', 'Изучаем языки программирования, разрабатываем проекты', '💻', 0)
  RETURNING id INTO v_club_it;
  
  INSERT INTO clubs (name, description, icon, members_count) VALUES
  ('Робототехника', 'Создаём и программируем роботов', '🤖', 0)
  RETURNING id INTO v_club_robot;
  
  INSERT INTO clubs (name, description, icon, members_count) VALUES
  ('Шахматный клуб', 'Турниры, обучение, разбор партий', '♟️', 0)
  RETURNING id INTO v_club_chess;
  
  INSERT INTO clubs (name, description, icon, members_count) VALUES
  ('Киноклуб', 'Совместные просмотры и обсуждения фильмов', '🎬', 0)
  RETURNING id INTO v_club_cinema;
  
  INSERT INTO clubs (name, description, icon, members_count) VALUES
  ('Спортивный клуб', 'Футбол, баскетбол, волейбол', '⚽', 0)
  RETURNING id INTO v_club_sport;
  
  INSERT INTO clubs (name, description, icon, members_count) VALUES
  ('Музыкальный клуб', 'Вокал, инструменты, группы', '🎵', 0)
  RETURNING id INTO v_club_music;

  -- =============================================
  -- ПОДПИСКИ НА КЛУБЫ
  -- =============================================
  
  INSERT INTO club_subscriptions (club_id, student_id) VALUES
  (v_club_it, v_leader_id),
  (v_club_it, v_student1_id),
  (v_club_robot, v_student1_id),
  (v_club_chess, v_student2_id);

  -- =============================================
  -- МЕРОПРИЯТИЯ
  -- =============================================
  
  INSERT INTO events (title, description, club_id, event_date, location, is_university_wide) VALUES
  ('Хакатон UniCode 2025', 'Командный хакатон по разработке веб-приложений', v_club_it, NOW() + INTERVAL '7 days', 'Главный корпус, ауд. 301', true),
  ('Турнир по шахматам', 'Ежемесячный турнир среди студентов', v_club_chess, NOW() + INTERVAL '3 days', 'Библиотека', false),
  ('День первокурсника', 'Праздничное мероприятие для первокурсников', NULL, NOW() + INTERVAL '14 days', 'Актовый зал', true),
  ('Мастер-класс по Python', 'Введение в программирование на Python', v_club_it, NOW() + INTERVAL '5 days', 'Компьютерный класс 205', false);

  -- =============================================
  -- РАСПИСАНИЕ ДЛЯ ГРУППЫ ПИ-21
  -- =============================================
  
  -- Понедельник
  INSERT INTO schedules (group_id, subgroup_id, day_of_week, subject, teacher, room, start_time, end_time, lesson_type, week_type) VALUES
  (v_group_pi21, NULL, 1, 'Математический анализ', 'Смирнов А.В.', '101', '08:30', '10:00', 'lecture', 'all'),
  (v_group_pi21, NULL, 1, 'Программирование', 'Козлова Е.И.', '205', '10:15', '11:45', 'lecture', 'all'),
  (v_group_pi21, v_sub_pi21_1, 1, 'Программирование', 'Козлова Е.И.', '305', '12:00', '13:30', 'lab', 'all'),
  (v_group_pi21, v_sub_pi21_2, 1, 'Программирование', 'Козлова Е.И.', '306', '12:00', '13:30', 'lab', 'all');
  
  -- Вторник
  INSERT INTO schedules (group_id, subgroup_id, day_of_week, subject, teacher, room, start_time, end_time, lesson_type, week_type) VALUES
  (v_group_pi21, NULL, 2, 'Физика', 'Иванов П.С.', '201', '08:30', '10:00', 'lecture', 'all'),
  (v_group_pi21, NULL, 2, 'Английский язык', 'Johnson M.', '102', '10:15', '11:45', 'practice', 'all'),
  (v_group_pi21, NULL, 2, 'Дискретная математика', 'Петрова О.А.', '103', '12:00', '13:30', 'lecture', 'odd'),
  (v_group_pi21, NULL, 2, 'Дискретная математика', 'Петрова О.А.', '103', '12:00', '13:30', 'practice', 'even');
  
  -- Среда
  INSERT INTO schedules (group_id, subgroup_id, day_of_week, subject, teacher, room, start_time, end_time, lesson_type, week_type) VALUES
  (v_group_pi21, NULL, 3, 'Алгоритмы и структуры данных', 'Сидоров К.М.', '201', '10:15', '11:45', 'lecture', 'all'),
  (v_group_pi21, v_sub_pi21_1, 3, 'Алгоритмы и структуры данных', 'Сидоров К.М.', '305', '12:00', '13:30', 'practice', 'all'),
  (v_group_pi21, v_sub_pi21_2, 3, 'Алгоритмы и структуры данных', 'Сидоров К.М.', '306', '13:45', '15:15', 'practice', 'all');
  
  -- Четверг
  INSERT INTO schedules (group_id, subgroup_id, day_of_week, subject, teacher, room, start_time, end_time, lesson_type, week_type) VALUES
  (v_group_pi21, NULL, 4, 'Базы данных', 'Николаев Д.Р.', '202', '08:30', '10:00', 'lecture', 'all'),
  (v_group_pi21, NULL, 4, 'Базы данных', 'Николаев Д.Р.', '305', '10:15', '11:45', 'lab', 'all'),
  (v_group_pi21, NULL, 4, 'Философия', 'Морозова Л.Н.', '101', '12:00', '13:30', 'seminar', 'all');
  
  -- Пятница
  INSERT INTO schedules (group_id, subgroup_id, day_of_week, subject, teacher, room, start_time, end_time, lesson_type, week_type) VALUES
  (v_group_pi21, NULL, 5, 'Математический анализ', 'Смирнов А.В.', '101', '08:30', '10:00', 'practice', 'all'),
  (v_group_pi21, NULL, 5, 'Физика', 'Иванов П.С.', '201', '10:15', '11:45', 'practice', 'odd'),
  (v_group_pi21, v_sub_pi21_1, 5, 'Физика', 'Иванов П.С.', '301', '10:15', '11:45', 'lab', 'even'),
  (v_group_pi21, v_sub_pi21_2, 5, 'Физика', 'Иванов П.С.', '302', '12:00', '13:30', 'lab', 'even');

  -- =============================================
  -- УВЕДОМЛЕНИЯ ОТ СТАРОСТЫ
  -- =============================================
  
  INSERT INTO group_notifications (group_id, sender_id, title, message, is_important) VALUES
  (v_group_pi21, v_leader_id, 'Изменение в расписании', 'Завтра пара по программированию перенесена с 10:15 на 12:00. Аудитория та же.', true),
  (v_group_pi21, v_leader_id, 'Собрание группы', 'В пятницу после пар собираемся в 301 аудитории для обсуждения поездки на конференцию.', false);

END $$;

-- =============================================
-- ГОТОВО!
-- =============================================

SELECT '✅ База данных UniClub успешно создана!' AS result;

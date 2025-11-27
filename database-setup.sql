-- ========================================
-- SQL СКРИПТ ДЛЯ СОЗДАНИЯ БАЗЫ ДАННЫХ
-- ИСПРАВЛЕННАЯ ВЕРСИЯ
-- Иерархия: Факультет → Направление → Группа
-- ========================================

-- Удаляем старые таблицы (если есть)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS club_subscriptions CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;
DROP TABLE IF EXISTS directions CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- СТРУКТУРА УНИВЕРСИТЕТА
-- ========================================

-- Факультеты
CREATE TABLE faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT, -- Аббревиатура (ФИТ, ЭФ и т.д.)
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Направления (внутри факультетов)
CREATE TABLE directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT, -- Код направления
  created_at TIMESTAMP DEFAULT NOW()
);

-- Учебные группы (внутри направлений)
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id UUID REFERENCES directions(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Например: ИВТ-21-1
  course INTEGER NOT NULL DEFAULT 1, -- Курс (1-6)
  year INTEGER, -- Год набора
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- ПОЛЬЗОВАТЕЛИ
-- ========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('main_admin', 'club_admin', 'group_leader', 'student')),
  -- Привязка к структуре университета
  faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
  direction_id UUID REFERENCES directions(id) ON DELETE SET NULL,
  group_id UUID REFERENCES study_groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Связь студентов с группами (для учета членства)
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- ========================================
-- КЛУБЫ
-- ========================================

CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎭',
  category TEXT,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Админ клуба
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, student_id)
);

-- ========================================
-- МЕРОПРИЯТИЯ
-- ========================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  location TEXT,
  max_participants INTEGER,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  is_university_wide BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ========================================
-- РАСПИСАНИЕ
-- Привязано к конкретной группе
-- ========================================

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE, -- ВАЖНО: привязка к группе
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6), -- 1=Пн, 6=Сб
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  lesson_type TEXT DEFAULT 'lecture', -- lecture, practice, lab
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- УВЕДОМЛЕНИЯ
-- ========================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('club', 'group', 'university')),
  target_id UUID, -- ID клуба или группы
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- БЕЗОПАСНОСТЬ (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Политики чтения (все могут читать)
CREATE POLICY "read_faculties" ON faculties FOR SELECT USING (true);
CREATE POLICY "read_directions" ON directions FOR SELECT USING (true);
CREATE POLICY "read_study_groups" ON study_groups FOR SELECT USING (true);
CREATE POLICY "read_users" ON users FOR SELECT USING (true);
CREATE POLICY "read_group_members" ON group_members FOR SELECT USING (true);
CREATE POLICY "read_clubs" ON clubs FOR SELECT USING (true);
CREATE POLICY "read_club_subscriptions" ON club_subscriptions FOR SELECT USING (true);
CREATE POLICY "read_events" ON events FOR SELECT USING (true);
CREATE POLICY "read_event_registrations" ON event_registrations FOR SELECT USING (true);
CREATE POLICY "read_schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "read_notifications" ON notifications FOR SELECT USING (true);

-- Политики записи (упрощённые для разработки)
CREATE POLICY "write_faculties" ON faculties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_directions" ON directions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_study_groups" ON study_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_group_members" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_club_subscriptions" ON club_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_event_registrations" ON event_registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "write_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- ========================================

-- Главный администратор
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@university.com', 'YWRtaW4xMjM=', 'Главный Администратор', 'main_admin');

-- Факультет
INSERT INTO faculties (id, name, code, description) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Факультет информационных технологий', 'ФИТ', 'Подготовка IT-специалистов');

-- Направления
INSERT INTO directions (id, faculty_id, name, code) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Информатика и вычислительная техника', '09.03.01'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Программная инженерия', '09.03.04');

-- Группы
INSERT INTO study_groups (id, direction_id, name, course, year) VALUES
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'ИВТ-21-1', 3, 2021),
('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222222', 'ИВТ-21-2', 3, 2021),
('33333333-3333-3333-3333-333333333335', '22222222-2222-2222-2222-222222222223', 'ПИ-22-1', 2, 2022);

-- Староста (привязан к группе)
INSERT INTO users (email, password_hash, full_name, role, faculty_id, direction_id, group_id) 
VALUES (
  'leader@university.com', 
  'bGVhZGVyMTIz', 
  'Мария Староста', 
  'group_leader',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Студент
INSERT INTO users (email, password_hash, full_name, role, faculty_id, direction_id, group_id) 
VALUES (
  'student@university.com', 
  'c3R1ZGVudDEyMw==', 
  'Иван Студентов', 
  'student',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Клубы
INSERT INTO clubs (name, description, icon) VALUES 
  ('IT-клуб', 'Программирование, хакатоны, технологии', '💻'),
  ('Спортивный клуб', 'Здоровый образ жизни и спорт', '⚽'),
  ('Музыкальный клуб', 'Музыка, концерты, творчество', '🎵');

-- Тестовое расписание для группы ИВТ-21-1
INSERT INTO schedules (group_id, day_of_week, start_time, end_time, subject, teacher, room, lesson_type) VALUES
('33333333-3333-3333-3333-333333333333', 1, '08:30', '10:00', 'Математический анализ', 'Иванов И.И.', '101', 'lecture'),
('33333333-3333-3333-3333-333333333333', 1, '10:15', '11:45', 'Программирование', 'Петров П.П.', '305', 'practice'),
('33333333-3333-3333-3333-333333333333', 2, '08:30', '10:00', 'Физика', 'Сидоров С.С.', '201', 'lecture'),
('33333333-3333-3333-3333-333333333333', 3, '10:15', '11:45', 'Базы данных', 'Козлова К.К.', '310', 'lab');

-- ========================================
-- ГОТОВО!
-- ========================================
-- Тестовые аккаунты:
-- admin@university.com / admin123 (Главный админ)
-- leader@university.com / leader123 (Староста группы ИВТ-21-1)
-- student@university.com / student123 (Студент группы ИВТ-21-1)
-- ========================================

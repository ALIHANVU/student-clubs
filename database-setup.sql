-- =============================================
-- UniClub Database Setup v2
-- Новая структура: Факультет → Направление → Группа → Подгруппа
-- =============================================

-- Удаляем старые таблицы если есть (осторожно в продакшене!)
-- DROP TABLE IF EXISTS group_notifications CASCADE;
-- DROP TABLE IF EXISTS subgroups CASCADE;
-- DROP TABLE IF EXISTS schedules CASCADE;
-- DROP TABLE IF EXISTS study_groups CASCADE;
-- DROP TABLE IF EXISTS directions CASCADE;
-- DROP TABLE IF EXISTS faculties CASCADE;

-- =============================================
-- СТРУКТУРА УНИВЕРСИТЕТА
-- =============================================

-- Таблица факультетов
CREATE TABLE IF NOT EXISTS faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица направлений (принадлежит факультету)
CREATE TABLE IF NOT EXISTS directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица групп (принадлежит направлению)
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  direction_id UUID REFERENCES directions(id) ON DELETE CASCADE,
  course INTEGER DEFAULT 1,
  year INTEGER,
  leader_id UUID, -- ID старосты (будет ссылка на users после создания)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица подгрупп (принадлежит группе)
CREATE TABLE IF NOT EXISTS subgroups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- например "1 подгруппа", "2 подгруппа"
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ПОЛЬЗОВАТЕЛИ
-- =============================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  password_hash TEXT,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('main_admin', 'club_admin', 'group_leader', 'student')),
  group_id UUID REFERENCES study_groups(id) ON DELETE SET NULL,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем внешний ключ для старосты группы
ALTER TABLE study_groups 
ADD CONSTRAINT fk_leader 
FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================
-- РАСПИСАНИЕ
-- =============================================

-- Таблица расписания (привязано к группе и опционально к подгруппе)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE CASCADE, -- NULL = для всей группы
  day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 6) NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lesson_type TEXT DEFAULT 'lecture' CHECK (lesson_type IN ('lecture', 'practice', 'lab', 'seminar')),
  week_type TEXT DEFAULT 'all' CHECK (week_type IN ('all', 'odd', 'even')), -- все недели, нечётная, чётная
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- УВЕДОМЛЕНИЯ ДЛЯ ГРУПП
-- =============================================

-- Таблица уведомлений от старосты группе
CREATE TABLE IF NOT EXISTS group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица прочитанных уведомлений
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES group_notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- =============================================
-- КЛУБЫ
-- =============================================

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  members_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, student_id)
);

-- =============================================
-- СОБЫТИЯ
-- =============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  max_participants INTEGER,
  is_university_wide BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =============================================

-- Админ
INSERT INTO users (email, password, password_hash, full_name, role) VALUES
('admin@uniclub.ru', 'admin123', 'YWRtaW4xMjM=', 'Администратор', 'main_admin')
ON CONFLICT (email) DO NOTHING;

-- Факультеты
INSERT INTO faculties (id, name, code, description) VALUES
('f1000000-0000-0000-0000-000000000001', 'Факультет информационных технологий', 'ФИТ', 'Программирование, анализ данных, кибербезопасность'),
('f1000000-0000-0000-0000-000000000002', 'Экономический факультет', 'ЭФ', 'Экономика, финансы, менеджмент'),
('f1000000-0000-0000-0000-000000000003', 'Юридический факультет', 'ЮФ', 'Право, юриспруденция')
ON CONFLICT DO NOTHING;

-- Направления
INSERT INTO directions (id, name, code, faculty_id) VALUES
('d1000000-0000-0000-0000-000000000001', 'Программная инженерия', '09.03.04', 'f1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000002', 'Информационная безопасность', '10.03.01', 'f1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000003', 'Экономика', '38.03.01', 'f1000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Группы
INSERT INTO study_groups (id, name, direction_id, course, year) VALUES
('g1000000-0000-0000-0000-000000000001', 'ПИ-21', 'd1000000-0000-0000-0000-000000000001', 2, 2023),
('g1000000-0000-0000-0000-000000000002', 'ПИ-22', 'd1000000-0000-0000-0000-000000000001', 2, 2023),
('g1000000-0000-0000-0000-000000000003', 'ИБ-21', 'd1000000-0000-0000-0000-000000000002', 2, 2023)
ON CONFLICT DO NOTHING;

-- Подгруппы
INSERT INTO subgroups (id, name, group_id) VALUES
('s1000000-0000-0000-0000-000000000001', '1 подгруппа', 'g1000000-0000-0000-0000-000000000001'),
('s1000000-0000-0000-0000-000000000002', '2 подгруппа', 'g1000000-0000-0000-0000-000000000001'),
('s1000000-0000-0000-0000-000000000003', '1 подгруппа', 'g1000000-0000-0000-0000-000000000002'),
('s1000000-0000-0000-0000-000000000004', '2 подгруппа', 'g1000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Клубы
INSERT INTO clubs (name, description, icon, members_count) VALUES
('Программирование', 'Изучаем языки программирования и создаём проекты', '💻', 45),
('Робототехника', 'Создаём и программируем роботов', '🤖', 28),
('Шахматы', 'Турниры и обучение шахматам', '♟️', 32)
ON CONFLICT DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgroups ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Политики - разрешаем всё для демо
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON faculties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON directions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON study_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON subgroups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON group_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notification_reads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON club_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON events FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_users_subgroup ON users(subgroup_id);
CREATE INDEX IF NOT EXISTS idx_directions_faculty ON directions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_groups_direction ON study_groups(direction_id);
CREATE INDEX IF NOT EXISTS idx_subgroups_group ON subgroups(group_id);
CREATE INDEX IF NOT EXISTS idx_schedules_group ON schedules(group_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_notifications_group ON group_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);

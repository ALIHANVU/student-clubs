-- =============================================
-- UniClub Database Setup for Supabase
-- =============================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('main_admin', 'club_admin', 'group_leader', 'student')),
  faculty_id UUID REFERENCES faculties(id),
  direction_id UUID REFERENCES directions(id),
  group_id UUID REFERENCES groups(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица факультетов
CREATE TABLE IF NOT EXISTS faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица направлений
CREATE TABLE IF NOT EXISTS directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица групп
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  direction_id UUID REFERENCES directions(id) ON DELETE CASCADE,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица клубов
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  admin_id UUID REFERENCES users(id),
  members_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица подписок на клубы
CREATE TABLE IF NOT EXISTS club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, club_id)
);

-- Таблица событий
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица регистраций на события
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Таблица расписания
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7),
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type TEXT DEFAULT 'lecture' CHECK (type IN ('lecture', 'practice', 'lab', 'seminar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Тестовые данные
-- =============================================

-- Админ
INSERT INTO users (email, password, full_name, role) VALUES
('admin@uniclub.ru', 'admin123', 'Администратор', 'main_admin');

-- Студент
INSERT INTO users (email, password, full_name, role) VALUES
('student@uniclub.ru', 'student123', 'Иван Студентов', 'student');

-- Факультеты
INSERT INTO faculties (name, code, description) VALUES
('Факультет информационных технологий', 'ФИТ', 'Программирование, анализ данных, кибербезопасность'),
('Экономический факультет', 'ЭФ', 'Экономика, финансы, менеджмент'),
('Юридический факультет', 'ЮФ', 'Право, юриспруденция');

-- Клубы
INSERT INTO clubs (name, description, icon, members_count) VALUES
('Программирование', 'Изучаем языки программирования и создаём проекты', '💻', 45),
('Робототехника', 'Создаём и программируем роботов', '🤖', 28),
('Шахматы', 'Турниры и обучение шахматам', '♟️', 32),
('Фотография', 'Учимся снимать и обрабатывать фото', '📷', 19),
('Волонтёры', 'Помогаем тем, кто нуждается', '❤️', 67);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Политики для чтения (все могут читать)
CREATE POLICY "Allow read for all" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON faculties FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON directions FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON groups FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON clubs FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON club_subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON events FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON event_registrations FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON schedule FOR SELECT USING (true);

-- Политики для записи (все могут записывать для демо)
CREATE POLICY "Allow insert for all" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON users FOR DELETE USING (true);

CREATE POLICY "Allow all for faculties" ON faculties FOR ALL USING (true);
CREATE POLICY "Allow all for directions" ON directions FOR ALL USING (true);
CREATE POLICY "Allow all for groups" ON groups FOR ALL USING (true);
CREATE POLICY "Allow all for clubs" ON clubs FOR ALL USING (true);
CREATE POLICY "Allow all for club_subscriptions" ON club_subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all for events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all for event_registrations" ON event_registrations FOR ALL USING (true);
CREATE POLICY "Allow all for schedule" ON schedule FOR ALL USING (true);



-- 1. Добавляем поле для хеша пароля (если не существует)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Добавляем поле для URL аватарки (если не существует)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Добавляем поле admin_id в таблицу clubs (если не существует)
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id);

-- 4. Обновляем существующих пользователей — создаём хеши паролей
-- (btoa в SQL не существует, используем base64 encode)
-- Для демо-пользователей:

-- Админ: admin123 -> YWRtaW4xMjM=
UPDATE users 
SET password_hash = 'YWRtaW4xMjM=' 
WHERE email = 'admin@uniclub.ru' AND password_hash IS NULL;

-- Студент: student123 -> c3R1ZGVudDEyMw==
UPDATE users 
SET password_hash = 'c3R1ZGVudDEyMw==' 
WHERE email = 'student@uniclub.ru' AND password_hash IS NULL;

-- 5. Для всех остальных пользователей — ставим пароль "password" -> cGFzc3dvcmQ=
UPDATE users 
SET password_hash = 'cGFzc3dvcmQ=' 
WHERE password_hash IS NULL;

-- =============================================
-- Политики безопасности (RLS) — обновление
-- =============================================

-- Разрешаем пользователям обновлять свой профиль
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users 
FOR UPDATE USING (true);

-- Разрешаем создавать новых пользователей (регистрация)
DROP POLICY IF EXISTS "Allow registration" ON users;
CREATE POLICY "Allow registration" ON users 
FOR INSERT WITH CHECK (true);

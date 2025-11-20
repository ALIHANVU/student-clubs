-- ========================================
-- SQL СКРИПТ ДЛЯ СОЗДАНИЯ БАЗЫ ДАННЫХ
-- Скопируйте этот код в SQL Editor в Supabase
-- ========================================

-- Создаём таблицу пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('main_admin', 'club_admin', 'group_leader', 'student')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу факультетов
CREATE TABLE faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу направлений
CREATE TABLE directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу курсов
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id UUID REFERENCES directions(id) ON DELETE CASCADE,
  course_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу учебных групп
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу студентов в группах
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- Создаём таблицу клубов
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу подписок на клубы
CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, student_id)
);

-- Создаём таблицу мероприятий
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  location TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  is_university_wide BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу расписания
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  subject TEXT NOT NULL,
  room TEXT,
  teacher TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Создаём таблицу уведомлений
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('club', 'group', 'university')),
  target_id UUID,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Включаем Row Level Security (безопасность)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE directions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Создаём политики доступа (кто что может видеть)
-- Все могут читать базовую информацию
CREATE POLICY "Anyone can read faculties" ON faculties FOR SELECT USING (true);
CREATE POLICY "Anyone can read directions" ON directions FOR SELECT USING (true);
CREATE POLICY "Anyone can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Anyone can read study_groups" ON study_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can read clubs" ON clubs FOR SELECT USING (true);
CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Anyone can read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can read group_members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Anyone can read club_subscriptions" ON club_subscriptions FOR SELECT USING (true);
CREATE POLICY "Anyone can read notifications" ON notifications FOR SELECT USING (true);

-- Политики для вставки данных (временно разрешаем всем для простоты)
CREATE POLICY "Anyone can insert faculties" ON faculties FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert directions" ON directions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert courses" ON courses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert study_groups" ON study_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert clubs" ON clubs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert schedules" ON schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert group_members" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert club_subscriptions" ON club_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Политики для удаления данных
CREATE POLICY "Anyone can delete club_subscriptions" ON club_subscriptions FOR DELETE USING (true);

-- Создаём первого администратора
-- Логин: admin@university.com
-- Пароль: admin123
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('admin@university.com', 'admin123', 'Главный администратор', 'main_admin');

-- Создаём тестовые данные для примера (опционально)

-- Тестовый факультет
INSERT INTO faculties (name) VALUES ('Факультет информационных технологий');

-- Тестовый клуб
INSERT INTO clubs (name, description) VALUES 
  ('IT-клуб', 'Клуб для студентов, интересующихся программированием'),
  ('Спортивный клуб', 'Занятия спортом и здоровый образ жизни');

-- Тестовый студент
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('student@university.com', 'student123', 'Иван Студентов', 'student');

-- Тестовый староста
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('leader@university.com', 'leader123', 'Мария Староста', 'group_leader');

-- Тестовый админ клуба
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('clubadmin@university.com', 'club123', 'Петр Организатор', 'club_admin');

-- ========================================
-- ГОТОВО! База данных создана
-- ========================================

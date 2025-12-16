-- =============================================
-- UniClub Database Setup v3
-- Полная структура: Факультет → Направление → Группа → Подгруппа
-- Роли: main_admin, club_admin, group_leader, student
-- =============================================

-- =============================================
-- УДАЛЕНИЕ СТАРЫХ ТАБЛИЦ (осторожно в продакшене!)
-- Раскомментируйте если нужно пересоздать с нуля
-- =============================================

/*
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
*/

-- =============================================
-- 1. СТРУКТУРА УНИВЕРСИТЕТА
-- =============================================

-- Факультеты
CREATE TABLE IF NOT EXISTS faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,                    -- Сокращение (ФИТ, ЭФ и т.д.)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Направления подготовки (принадлежат факультету)
CREATE TABLE IF NOT EXISTS directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,                           -- Код направления (09.03.04)
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Учебные группы (принадлежат направлению)
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- Например: ПИ-21, ИБ-22
  direction_id UUID REFERENCES directions(id) ON DELETE CASCADE,
  course INTEGER DEFAULT 1 CHECK (course BETWEEN 1 AND 6),
  year INTEGER,                        -- Год поступления
  leader_id UUID,                      -- ID старосты (внешний ключ добавим позже)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Подгруппы (принадлежат группе)
CREATE TABLE IF NOT EXISTS subgroups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- "1 подгруппа", "2 подгруппа"
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ПОЛЬЗОВАТЕЛИ
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,                       -- Для демо (в проде использовать auth)
  password_hash TEXT,                  -- Base64 хэш пароля
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('main_admin', 'club_admin', 'group_leader', 'student')),
  group_id UUID REFERENCES study_groups(id) ON DELETE SET NULL,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE SET NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавляем внешний ключ для старосты группы
ALTER TABLE study_groups 
DROP CONSTRAINT IF EXISTS fk_leader;

ALTER TABLE study_groups 
ADD CONSTRAINT fk_leader 
FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================
-- 3. РАСПИСАНИЕ
-- =============================================

CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  subgroup_id UUID REFERENCES subgroups(id) ON DELETE CASCADE,  -- NULL = для всей группы
  day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 6) NOT NULL,  -- 1=Пн, 6=Сб
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lesson_type TEXT DEFAULT 'lecture' CHECK (lesson_type IN ('lecture', 'practice', 'lab', 'seminar')),
  week_type TEXT DEFAULT 'all' CHECK (week_type IN ('all', 'odd', 'even')),  -- все/нечёт/чёт
  notes TEXT,                          -- Дополнительные заметки
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. УВЕДОМЛЕНИЯ ДЛЯ ГРУПП
-- =============================================

-- Уведомления от старосты группе
CREATE TABLE IF NOT EXISTS group_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,  -- Когда уведомление станет неактуальным
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Отметки о прочтении уведомлений
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES group_notifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

-- =============================================
-- 5. КЛУБЫ
-- =============================================

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  cover_image TEXT,                    -- URL обложки
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  members_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  contact_email TEXT,
  contact_phone TEXT,
  meeting_schedule TEXT,               -- Расписание встреч текстом
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Подписки на клубы
CREATE TABLE IF NOT EXISTS club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'organizer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, student_id)
);

-- =============================================
-- 6. МЕРОПРИЯТИЯ
-- =============================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,   -- Дата окончания (для многодневных)
  location TEXT,
  online_link TEXT,                    -- Ссылка для онлайн-мероприятий
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_university_wide BOOLEAN DEFAULT false,
  is_registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  cover_image TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Регистрации на мероприятия
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- =============================================
-- 7. ФУНКЦИИ И ТРИГГЕРЫ
-- =============================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автообновления updated_at
DROP TRIGGER IF EXISTS update_faculties_updated_at ON faculties;
CREATE TRIGGER update_faculties_updated_at BEFORE UPDATE ON faculties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_directions_updated_at ON directions;
CREATE TRIGGER update_directions_updated_at BEFORE UPDATE ON directions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_groups_updated_at ON study_groups;
CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция подсчёта участников клуба
CREATE OR REPLACE FUNCTION update_club_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clubs SET members_count = members_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clubs SET members_count = members_count - 1 WHERE id = OLD.club_id;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_club_members ON club_subscriptions;
CREATE TRIGGER update_club_members
AFTER INSERT OR DELETE ON club_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_club_members_count();

-- Функция подсчёта участников мероприятия
CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events SET current_participants = current_participants + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events SET current_participants = current_participants - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_event_participants ON event_registrations;
CREATE TRIGGER update_event_participants
AFTER INSERT OR DELETE ON event_registrations
FOR EACH ROW EXECUTE FUNCTION update_event_participants_count();

-- =============================================
-- 8. ТЕСТОВЫЕ ДАННЫЕ
-- =============================================

-- Главный администратор
INSERT INTO users (id, email, password, password_hash, full_name, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@uniclub.ru', 'admin123', 'YWRtaW4xMjM=', 'Администратор Системы', 'main_admin')
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Факультеты
INSERT INTO faculties (id, name, code, description) VALUES
('f1000000-0000-0000-0000-000000000001', 'Факультет информационных технологий', 'ФИТ', 'Программирование, анализ данных, кибербезопасность, искусственный интеллект'),
('f1000000-0000-0000-0000-000000000002', 'Экономический факультет', 'ЭФ', 'Экономика, финансы, менеджмент, бухгалтерский учёт'),
('f1000000-0000-0000-0000-000000000003', 'Юридический факультет', 'ЮФ', 'Право, юриспруденция, правоведение'),
('f1000000-0000-0000-0000-000000000004', 'Факультет иностранных языков', 'ФИЯ', 'Лингвистика, перевод, международные отношения')
ON CONFLICT DO NOTHING;

-- Направления
INSERT INTO directions (id, name, code, faculty_id) VALUES
-- ФИТ
('d1000000-0000-0000-0000-000000000001', 'Программная инженерия', '09.03.04', 'f1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000002', 'Информационная безопасность', '10.03.01', 'f1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000003', 'Прикладная информатика', '09.03.03', 'f1000000-0000-0000-0000-000000000001'),
-- ЭФ
('d1000000-0000-0000-0000-000000000004', 'Экономика', '38.03.01', 'f1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000005', 'Менеджмент', '38.03.02', 'f1000000-0000-0000-0000-000000000002'),
-- ЮФ
('d1000000-0000-0000-0000-000000000006', 'Юриспруденция', '40.03.01', 'f1000000-0000-0000-0000-000000000003'),
-- ФИЯ
('d1000000-0000-0000-0000-000000000007', 'Лингвистика', '45.03.02', 'f1000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Группы
INSERT INTO study_groups (id, name, direction_id, course, year) VALUES
-- Программная инженерия
('g1000000-0000-0000-0000-000000000001', 'ПИ-21', 'd1000000-0000-0000-0000-000000000001', 2, 2023),
('g1000000-0000-0000-0000-000000000002', 'ПИ-22', 'd1000000-0000-0000-0000-000000000001', 2, 2023),
('g1000000-0000-0000-0000-000000000003', 'ПИ-11', 'd1000000-0000-0000-0000-000000000001', 1, 2024),
-- Информационная безопасность
('g1000000-0000-0000-0000-000000000004', 'ИБ-21', 'd1000000-0000-0000-0000-000000000002', 2, 2023),
('g1000000-0000-0000-0000-000000000005', 'ИБ-11', 'd1000000-0000-0000-0000-000000000002', 1, 2024),
-- Экономика
('g1000000-0000-0000-0000-000000000006', 'ЭК-21', 'd1000000-0000-0000-0000-000000000004', 2, 2023),
-- Юриспруденция
('g1000000-0000-0000-0000-000000000007', 'Ю-21', 'd1000000-0000-0000-0000-000000000006', 2, 2023)
ON CONFLICT DO NOTHING;

-- Подгруппы
INSERT INTO subgroups (id, name, group_id) VALUES
('s1000000-0000-0000-0000-000000000001', '1 подгруппа', 'g1000000-0000-0000-0000-000000000001'),
('s1000000-0000-0000-0000-000000000002', '2 подгруппа', 'g1000000-0000-0000-0000-000000000001'),
('s1000000-0000-0000-0000-000000000003', '1 подгруппа', 'g1000000-0000-0000-0000-000000000002'),
('s1000000-0000-0000-0000-000000000004', '2 подгруппа', 'g1000000-0000-0000-0000-000000000002'),
('s1000000-0000-0000-0000-000000000005', '1 подгруппа', 'g1000000-0000-0000-0000-000000000004'),
('s1000000-0000-0000-0000-000000000006', '2 подгруппа', 'g1000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Тестовые пользователи (староста и студенты)
INSERT INTO users (id, email, password, password_hash, full_name, role, group_id, subgroup_id) VALUES
-- Староста группы ПИ-21
('a0000000-0000-0000-0000-000000000002', 'leader@uniclub.ru', 'leader123', 'bGVhZGVyMTIz', 'Иванов Иван Иванович', 'group_leader', 'g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001'),
-- Студенты
('a0000000-0000-0000-0000-000000000003', 'student@uniclub.ru', 'student123', 'c3R1ZGVudDEyMw==', 'Петров Пётр Петрович', 'student', 'g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001'),
('a0000000-0000-0000-0000-000000000004', 'sidorova@uniclub.ru', 'student123', 'c3R1ZGVudDEyMw==', 'Сидорова Анна Сергеевна', 'student', 'g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002'),
('a0000000-0000-0000-0000-000000000005', 'kozlov@uniclub.ru', 'student123', 'c3R1ZGVudDEyMw==', 'Козлов Дмитрий Александрович', 'student', 'g1000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000003')
ON CONFLICT (email) DO UPDATE SET 
  password = EXCLUDED.password,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  group_id = EXCLUDED.group_id,
  subgroup_id = EXCLUDED.subgroup_id;

-- Назначаем старосту группе ПИ-21
UPDATE study_groups 
SET leader_id = 'a0000000-0000-0000-0000-000000000002' 
WHERE id = 'g1000000-0000-0000-0000-000000000001';

-- Клубы
INSERT INTO clubs (id, name, description, icon, members_count) VALUES
('c1000000-0000-0000-0000-000000000001', 'IT-клуб', 'Изучаем языки программирования, разрабатываем проекты, участвуем в хакатонах', '💻', 0),
('c1000000-0000-0000-0000-000000000002', 'Робототехника', 'Создаём и программируем роботов, участвуем в соревнованиях', '🤖', 0),
('c1000000-0000-0000-0000-000000000003', 'Шахматный клуб', 'Турниры, обучение, разбор партий', '♟️', 0),
('c1000000-0000-0000-0000-000000000004', 'Киноклуб', 'Совместные просмотры и обсуждения фильмов', '🎬', 0),
('c1000000-0000-0000-0000-000000000005', 'Спортивный клуб', 'Футбол, баскетбол, волейбол и другие виды спорта', '⚽', 0),
('c1000000-0000-0000-0000-000000000006', 'Музыкальный клуб', 'Вокал, инструменты, группы', '🎵', 0)
ON CONFLICT DO NOTHING;

-- Подписки на клубы
INSERT INTO club_subscriptions (club_id, student_id) VALUES
('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- Мероприятия
INSERT INTO events (id, title, description, club_id, event_date, location, is_university_wide) VALUES
('e1000000-0000-0000-0000-000000000001', 'Хакатон UniCode 2025', 'Командный хакатон по разработке веб-приложений. Призовой фонд 100 000 рублей!', 'c1000000-0000-0000-0000-000000000001', NOW() + INTERVAL '7 days', 'Главный корпус, ауд. 301', true),
('e1000000-0000-0000-0000-000000000002', 'Турнир по шахматам', 'Ежемесячный турнир среди студентов. Победитель получает сертификат на книги', 'c1000000-0000-0000-0000-000000000003', NOW() + INTERVAL '3 days', 'Библиотека, читальный зал', false),
('e1000000-0000-0000-0000-000000000003', 'День первокурсника', 'Праздничное мероприятие для первокурсников', NULL, NOW() + INTERVAL '14 days', 'Актовый зал', true),
('e1000000-0000-0000-0000-000000000004', 'Мастер-класс по Python', 'Введение в программирование на Python для начинающих', 'c1000000-0000-0000-0000-000000000001', NOW() + INTERVAL '5 days', 'Компьютерный класс 205', false)
ON CONFLICT DO NOTHING;

-- Расписание для группы ПИ-21
INSERT INTO schedules (group_id, subgroup_id, day_of_week, subject, teacher, room, start_time, end_time, lesson_type, week_type) VALUES
-- Понедельник
('g1000000-0000-0000-0000-000000000001', NULL, 1, 'Математический анализ', 'Смирнов А.В.', '101', '08:30', '10:00', 'lecture', 'all'),
('g1000000-0000-0000-0000-000000000001', NULL, 1, 'Программирование', 'Козлова Е.И.', '205', '10:15', '11:45', 'lecture', 'all'),
('g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 1, 'Программирование', 'Козлова Е.И.', '305', '12:00', '13:30', 'lab', 'all'),
('g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002', 1, 'Программирование', 'Козлова Е.И.', '306', '12:00', '13:30', 'lab', 'all'),
-- Вторник
('g1000000-0000-0000-0000-000000000001', NULL, 2, 'Физика', 'Иванов П.С.', '201', '08:30', '10:00', 'lecture', 'all'),
('g1000000-0000-0000-0000-000000000001', NULL, 2, 'Английский язык', 'Johnson M.', '102', '10:15', '11:45', 'practice', 'all'),
('g1000000-0000-0000-0000-000000000001', NULL, 2, 'Дискретная математика', 'Петрова О.А.', '103', '12:00', '13:30', 'lecture', 'odd'),
('g1000000-0000-0000-0000-000000000001', NULL, 2, 'Дискретная математика', 'Петрова О.А.', '103', '12:00', '13:30', 'practice', 'even'),
-- Среда
('g1000000-0000-0000-0000-000000000001', NULL, 3, 'Алгоритмы и структуры данных', 'Сидоров К.М.', '201', '10:15', '11:45', 'lecture', 'all'),
('g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 3, 'Алгоритмы и структуры данных', 'Сидоров К.М.', '305', '12:00', '13:30', 'practice', 'all'),
('g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002', 3, 'Алгоритмы и структуры данных', 'Сидоров К.М.', '306', '13:45', '15:15', 'practice', 'all'),
-- Четверг
('g1000000-0000-0000-0000-000000000001', NULL, 4, 'Базы данных', 'Николаев Д.Р.', '202', '08:30', '10:00', 'lecture', 'all'),
('g1000000-0000-0000-0000-000000000001', NULL, 4, 'Базы данных', 'Николаев Д.Р.', '305', '10:15', '11:45', 'lab', 'all'),
('g1000000-0000-0000-0000-000000000001', NULL, 4, 'Философия', 'Морозова Л.Н.', '101', '12:00', '13:30', 'seminar', 'all'),
-- Пятница
('g1000000-0000-0000-0000-000000000001', NULL, 5, 'Математический анализ', 'Смирнов А.В.', '101', '08:30', '10:00', 'practice', 'all'),
('g1000000-0000-0000-0000-000000000001', NULL, 5, 'Физика', 'Иванов П.С.', '201', '10:15', '11:45', 'practice', 'odd'),
('g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 5, 'Физика', 'Иванов П.С.', '301', '10:15', '11:45', 'lab', 'even'),
('g1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000002', 5, 'Физика', 'Иванов П.С.', '302', '12:00', '13:30', 'lab', 'even')
ON CONFLICT DO NOTHING;

-- Тестовое уведомление от старосты
INSERT INTO group_notifications (group_id, sender_id, title, message, is_important) VALUES
('g1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Изменение в расписании', 'Завтра пара по программированию перенесена с 10:15 на 12:00. Аудитория та же.', true),
('g1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Собрание группы', 'В пятницу после пар собираемся в 301 аудитории для обсуждения поездки на конференцию.', false)
ON CONFLICT DO NOTHING;

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Включаем RLS для всех таблиц
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

-- Для демо разрешаем всё (в продакшене нужны более строгие политики)
-- Удаляем существующие политики
DROP POLICY IF EXISTS "Allow all faculties" ON faculties;
DROP POLICY IF EXISTS "Allow all directions" ON directions;
DROP POLICY IF EXISTS "Allow all study_groups" ON study_groups;
DROP POLICY IF EXISTS "Allow all subgroups" ON subgroups;
DROP POLICY IF EXISTS "Allow all users" ON users;
DROP POLICY IF EXISTS "Allow all schedules" ON schedules;
DROP POLICY IF EXISTS "Allow all group_notifications" ON group_notifications;
DROP POLICY IF EXISTS "Allow all notification_reads" ON notification_reads;
DROP POLICY IF EXISTS "Allow all clubs" ON clubs;
DROP POLICY IF EXISTS "Allow all club_subscriptions" ON club_subscriptions;
DROP POLICY IF EXISTS "Allow all events" ON events;
DROP POLICY IF EXISTS "Allow all event_registrations" ON event_registrations;

-- Создаём новые политики
CREATE POLICY "Allow all faculties" ON faculties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all directions" ON directions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all study_groups" ON study_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all subgroups" ON subgroups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all group_notifications" ON group_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all notification_reads" ON notification_reads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all club_subscriptions" ON club_subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all event_registrations" ON event_registrations FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 10. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =============================================

-- Пользователи
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_users_subgroup ON users(subgroup_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Структура университета
CREATE INDEX IF NOT EXISTS idx_directions_faculty ON directions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_groups_direction ON study_groups(direction_id);
CREATE INDEX IF NOT EXISTS idx_groups_leader ON study_groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_subgroups_group ON subgroups(group_id);

-- Расписание
CREATE INDEX IF NOT EXISTS idx_schedules_group ON schedules(group_id);
CREATE INDEX IF NOT EXISTS idx_schedules_subgroup ON schedules(subgroup_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_group_day ON schedules(group_id, day_of_week);

-- Уведомления
CREATE INDEX IF NOT EXISTS idx_notifications_group ON group_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON group_notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON group_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON notification_reads(notification_id);

-- Клубы
CREATE INDEX IF NOT EXISTS idx_clubs_admin ON clubs(admin_id);
CREATE INDEX IF NOT EXISTS idx_club_subs_club ON club_subscriptions(club_id);
CREATE INDEX IF NOT EXISTS idx_club_subs_student ON club_subscriptions(student_id);

-- Мероприятия
CREATE INDEX IF NOT EXISTS idx_events_club ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_university_wide ON events(is_university_wide);
CREATE INDEX IF NOT EXISTS idx_event_regs_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_regs_user ON event_registrations(user_id);

-- =============================================
-- 11. ПОЛЕЗНЫЕ ПРЕДСТАВЛЕНИЯ (VIEWS)
-- =============================================

-- Представление: Полная информация о группах
CREATE OR REPLACE VIEW v_groups_full AS
SELECT 
  sg.id,
  sg.name,
  sg.course,
  sg.year,
  sg.leader_id,
  d.id AS direction_id,
  d.name AS direction_name,
  d.code AS direction_code,
  f.id AS faculty_id,
  f.name AS faculty_name,
  f.code AS faculty_code,
  u.full_name AS leader_name,
  (SELECT COUNT(*) FROM users WHERE group_id = sg.id) AS students_count
FROM study_groups sg
LEFT JOIN directions d ON sg.direction_id = d.id
LEFT JOIN faculties f ON d.faculty_id = f.id
LEFT JOIN users u ON sg.leader_id = u.id;

-- Представление: Расписание с информацией о группе
CREATE OR REPLACE VIEW v_schedule_full AS
SELECT 
  s.*,
  sg.name AS group_name,
  sub.name AS subgroup_name,
  d.name AS direction_name,
  f.name AS faculty_name
FROM schedules s
LEFT JOIN study_groups sg ON s.group_id = sg.id
LEFT JOIN subgroups sub ON s.subgroup_id = sub.id
LEFT JOIN directions d ON sg.direction_id = d.id
LEFT JOIN faculties f ON d.faculty_id = f.id;

-- Представление: Пользователи с полной информацией
CREATE OR REPLACE VIEW v_users_full AS
SELECT 
  u.*,
  sg.name AS group_name,
  sg.course,
  sub.name AS subgroup_name,
  d.name AS direction_name,
  f.name AS faculty_name,
  (SELECT sg2.name FROM study_groups sg2 WHERE sg2.leader_id = u.id LIMIT 1) AS leads_group
FROM users u
LEFT JOIN study_groups sg ON u.group_id = sg.id
LEFT JOIN subgroups sub ON u.subgroup_id = sub.id
LEFT JOIN directions d ON sg.direction_id = d.id
LEFT JOIN faculties f ON d.faculty_id = f.id;

-- =============================================
-- ГОТОВО!
-- =============================================

-- Выводим статистику
SELECT '✅ База данных UniClub v3 успешно создана!' AS status;

SELECT 'Статистика:' AS info;
SELECT 'Факультетов: ' || COUNT(*) FROM faculties;
SELECT 'Направлений: ' || COUNT(*) FROM directions;
SELECT 'Групп: ' || COUNT(*) FROM study_groups;
SELECT 'Подгрупп: ' || COUNT(*) FROM subgroups;
SELECT 'Пользователей: ' || COUNT(*) FROM users;
SELECT 'Клубов: ' || COUNT(*) FROM clubs;
SELECT 'Мероприятий: ' || COUNT(*) FROM events;
SELECT 'Записей в расписании: ' || COUNT(*) FROM schedules;

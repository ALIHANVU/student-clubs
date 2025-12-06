# 🎓 UniClub — Студенческая платформа

Современное веб-приложение для управления студенческими клубами, мероприятиями и расписанием.

## ✨ Особенности

- **iOS Design System** — аутентичный Apple HIG дизайн
- **PWA** — работает как нативное приложение
- **Dark Mode** — автоматическая тёмная тема
- **Микроанимации** — 15+ анимаций для плавного UX
- **Rounded Tab Bar** — современный нижний бар навигации
- **Pull-to-Refresh** — обновление свайпом вниз
- **Haptic Feedback** — тактильная обратная связь
- **Offline Support** — работает без интернета

## 🚀 Установка

### 1. Клонирование и установка зависимостей

```bash
cd uniclub-final
npm install
```

### 2. Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```
3. Заполните переменные окружения из настроек Supabase

### 3. Создание таблиц в Supabase

Выполните SQL в редакторе Supabase:

```sql
-- Факультеты
CREATE TABLE faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Направления
CREATE TABLE directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID REFERENCES faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Учебные группы
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id UUID REFERENCES directions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  course INT NOT NULL DEFAULT 1,
  year INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  faculty_id UUID REFERENCES faculties(id),
  direction_id UUID REFERENCES directions(id),
  group_id UUID REFERENCES study_groups(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Участники групп
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, student_id)
);

-- Клубы
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎭',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Подписки на клубы
CREATE TABLE club_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, student_id)
);

-- Мероприятия
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  location TEXT,
  is_university_wide BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Расписание
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT,
  room TEXT,
  lesson_type TEXT DEFAULT 'lecture',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Тестовые пользователи
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@uniclub.ru', 'YWRtaW4xMjM=', 'Администратор', 'main_admin'),
('leader@uniclub.ru', 'bGVhZGVyMTIz', 'Староста Группы', 'group_leader'),
('student@uniclub.ru', 'c3R1ZGVudDEyMw==', 'Студент Иванов', 'student');
```

### 4. Запуск

```bash
npm start
```

Приложение откроется на http://localhost:3000

## 👥 Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@uniclub.ru | admin123 |
| Староста | leader@uniclub.ru | leader123 |
| Студент | student@uniclub.ru | student123 |

## 📱 PWA Иконки

Создайте иконки в папке `public/icons/`:
- icon-72.png, icon-96.png, icon-128.png, icon-144.png
- icon-152.png, icon-192.png, icon-384.png, icon-512.png
- icon-32.png (favicon)

Используйте [RealFaviconGenerator.net](https://realfavicongenerator.net) для генерации всех размеров.

## 🏗️ Структура проекта

```
src/
├── components/     # UI компоненты
├── context/        # React Context
├── hooks/          # Custom hooks
├── pages/          # Страницы приложения
├── styles/         # CSS стили
└── utils/          # Утилиты и константы
```

## 🎨 Дизайн-система

Приложение использует iOS 17 дизайн-систему:
- SF Pro шрифты
- Семантические цвета iOS
- Правильные spacing и radius
- Backdrop blur эффекты
- Native-like анимации

## 📄 Лицензия

MIT

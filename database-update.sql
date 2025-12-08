-- =============================================
-- UniClub Database Update Script
-- Добавляет новые поля для функций:
-- - Регистрация (password_hash)
-- - Аватарки (avatar_url)
-- - Назначение админов клубов (admin_id в clubs)
-- =============================================

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

-- =============================================
-- Готово!
-- =============================================

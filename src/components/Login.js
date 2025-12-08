/**
 * Login Page — с регистрацией
 */
import React, { useState, useCallback, memo } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { IconGraduationCap, IconMail, IconLock, IconLogIn, IconUser } from './Icons';

export const LoginPage = memo(function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Заполните все поля');
      haptic.error();
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ищем пользователя в базе
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (fetchError || !user) {
        throw new Error('Пользователь не найден');
      }

      // Проверяем пароль (простое сравнение для демо)
      // В реальном приложении нужно использовать bcrypt
      const passwordHash = btoa(password);
      if (user.password_hash !== passwordHash && user.password !== password) {
        throw new Error('Неверный пароль');
      }

      onLogin(user);
      haptic.success();
    } catch (err) {
      setError(err.message || 'Ошибка входа');
      haptic.error();
    } finally {
      setLoading(false);
    }
  }, [email, password, onLogin]);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setError('Заполните все обязательные поля');
      haptic.error();
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      haptic.error();
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      haptic.error();
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Проверяем, не занят ли email
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existing) {
        throw new Error('Пользователь с таким email уже существует');
      }

      // Создаём нового пользователя
      const passwordHash = btoa(password);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          full_name: fullName.trim(),
          role: 'student',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw new Error('Ошибка создания аккаунта');
      }

      onLogin(newUser);
      haptic.success();
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
      haptic.error();
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword, fullName, onLogin]);

  const switchMode = useCallback(() => {
    setIsRegister(!isRegister);
    setError('');
    setPassword('');
    setConfirmPassword('');
    haptic.light();
  }, [isRegister]);

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="login-logo">
            <IconGraduationCap size={36} color="white" />
          </div>
          <h1 className="login-title">UniClub</h1>
          <p className="login-subtitle">
            {isRegister ? 'Создайте аккаунт' : 'Студенческая платформа'}
          </p>
        </header>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <div className="form-field">
              <label className="form-label">Имя и фамилия *</label>
              <div className="input-with-icon">
                <IconUser size={20} color="var(--text-tertiary)" />
                <input
                  type="text"
                  className="input input-icon"
                  placeholder="Иван Иванов"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Email *</label>
            <div className="input-with-icon">
              <IconMail size={20} color="var(--text-tertiary)" />
              <input
                type="email"
                className="input input-icon"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus={!isRegister}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Пароль *</label>
            <div className="input-with-icon">
              <IconLock size={20} color="var(--text-tertiary)" />
              <input
                type="password"
                className="input input-icon"
                placeholder={isRegister ? 'Минимум 6 символов' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-field">
              <label className="form-label">Подтвердите пароль *</label>
              <div className="input-with-icon">
                <IconLock size={20} color="var(--text-tertiary)" />
                <input
                  type="password"
                  className="input input-icon"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <>
                <IconLogIn size={20} />
                {isRegister ? 'Зарегистрироваться' : 'Войти'}
              </>
            )}
          </button>
        </form>

        <div className="login-switch">
          <p>
            {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
            <button type="button" className="login-switch-btn" onClick={switchMode}>
              {isRegister ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>

        {!isRegister && (
          <div className="login-demo">
            <p>Демо аккаунты:</p>
            <div className="demo-accounts">
              <button 
                type="button" 
                className="demo-btn"
                onClick={() => { setEmail('admin@uniclub.ru'); setPassword('admin123'); }}
              >
                👑 Админ
              </button>
              <button 
                type="button" 
                className="demo-btn"
                onClick={() => { setEmail('student@uniclub.ru'); setPassword('student123'); }}
              >
                🎓 Студент
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default LoginPage;

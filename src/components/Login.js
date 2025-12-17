/**
 * Login — Оптимизированный
 */
import React, { useState, useCallback, memo } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';
import { IconGraduationCap, IconMail, IconLock, IconUser } from './Icons';

export const LoginPage = memo(function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateForm = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) { setError('Заполните все поля'); haptic.error(); return; }

    setLoading(true);
    setError('');

    try {
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', form.email.toLowerCase().trim())
        .single();

      if (fetchError || !user) throw new Error('Пользователь не найден');

      const passwordHash = btoa(form.password);
      if (user.password_hash !== passwordHash && user.password !== form.password) throw new Error('Неверный пароль');

      onLogin(user);
      haptic.success();
    } catch (err) {
      setError(err.message || 'Ошибка входа');
      haptic.error();
    } finally {
      setLoading(false);
    }
  }, [form.email, form.password, onLogin]);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim() || !form.fullName.trim()) { setError('Заполните все поля'); haptic.error(); return; }
    if (form.password.length < 6) { setError('Пароль минимум 6 символов'); haptic.error(); return; }
    if (form.password !== form.confirmPassword) { setError('Пароли не совпадают'); haptic.error(); return; }

    setLoading(true);
    setError('');

    try {
      const { data: existing } = await supabase.from('users').select('id').eq('email', form.email.toLowerCase().trim()).single();
      if (existing) throw new Error('Email уже занят');

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ email: form.email.toLowerCase().trim(), password_hash: btoa(form.password), full_name: form.fullName.trim(), role: 'student' })
        .select()
        .single();

      if (insertError) throw new Error('Ошибка регистрации');

      onLogin(newUser);
      haptic.success();
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
      haptic.error();
    } finally {
      setLoading(false);
    }
  }, [form, onLogin]);

  const setDemo = useCallback((email, password) => {
    setForm(prev => ({ ...prev, email, password }));
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="login-logo"><IconGraduationCap size={36} color="white" /></div>
          <h1 className="login-title">UniClub</h1>
          <p className="login-subtitle">{isRegister ? 'Создайте аккаунт' : 'Студенческая платформа'}</p>
        </header>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <div className="form-field">
              <label className="form-label">Имя и фамилия *</label>
              <div className="input-with-icon">
                <IconUser size={20} color="var(--text-tertiary)" />
                <input type="text" className="input input-icon" placeholder="Иван Иванов" value={form.fullName} onChange={(e) => updateForm('fullName', e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-field">
            <label className="form-label">Email *</label>
            <div className="input-with-icon">
              <IconMail size={20} color="var(--text-tertiary)" />
              <input type="email" className="input input-icon" placeholder="email@example.com" value={form.email} onChange={(e) => updateForm('email', e.target.value)} autoFocus={!isRegister} />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Пароль *</label>
            <div className="input-with-icon">
              <IconLock size={20} color="var(--text-tertiary)" />
              <input type="password" className="input input-icon" placeholder={isRegister ? 'Минимум 6 символов' : '••••••••'} value={form.password} onChange={(e) => updateForm('password', e.target.value)} />
            </div>
          </div>

          {isRegister && (
            <div className="form-field">
              <label className="form-label">Подтвердите пароль *</label>
              <div className="input-with-icon">
                <IconLock size={20} color="var(--text-tertiary)" />
                <input type="password" className="input input-icon" placeholder="Повторите пароль" value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : (isRegister ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <div className="login-switch">
          <p>{isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
            <button type="button" className="login-switch-btn" onClick={() => { setIsRegister(!isRegister); setError(''); haptic.light(); }}>
              {isRegister ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>

        {!isRegister && (
          <div className="login-demo">
            <p>Демо аккаунты:</p>
            <div className="demo-accounts">
              <button type="button" className="demo-btn" onClick={() => setDemo('admin@uniclub.ru', 'admin123')}>👑 Админ</button>
              <button type="button" className="demo-btn" onClick={() => setDemo('student@uniclub.ru', 'student123')}>🎓 Студент</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default LoginPage;

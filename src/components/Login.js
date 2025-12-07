/**
 * Login Page — с иконками Apple style
 */
import React, { useState, useCallback, memo } from 'react';
import { haptic } from '../utils/haptic';
import { IconGraduationCap, IconMail, IconLock, IconLogIn } from './Icons';

export const LoginPage = memo(function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Заполните все поля');
      haptic.error();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLogin(email.toLowerCase().trim(), password);
      haptic.success();
    } catch (err) {
      setError(err.message || 'Ошибка входа');
      haptic.error();
    } finally {
      setLoading(false);
    }
  }, [email, password, onLogin]);

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-header">
          <div className="login-logo">
            <IconGraduationCap size={36} color="white" />
          </div>
          <h1 className="login-title">UniClub</h1>
          <p className="login-subtitle">Студенческая платформа</p>
        </header>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <div className="input-with-icon">
              <IconMail size={20} color="var(--text-tertiary)" />
              <input
                type="email"
                className="input input-icon"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Пароль</label>
            <div className="input-with-icon">
              <IconLock size={20} color="var(--text-tertiary)" />
              <input
                type="password"
                className="input input-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

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
                Войти
              </>
            )}
          </button>
        </form>

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
      </div>
    </div>
  );
});

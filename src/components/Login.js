import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { DEMO_CREDENTIALS } from '../utils/constants';
import { FormField, Input, Button } from './UI';
import { haptic } from '../utils/haptic';

/**
 * Login & Registration Page Component
 */
export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
    haptic.light();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const passwordHash = btoa(password);
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .single();

      if (err || !data) {
        setError('Неверный email или пароль');
        haptic.error();
        setLoading(false);
        return;
      }

      haptic.success();
      onLogin(data);
    } catch (err) {
      setError('Произошла ошибка при входе');
      haptic.error();
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!fullName.trim()) {
      setError('Введите имя и фамилию');
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

    try {
      // Check if email exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        setError('Пользователь с таким email уже существует');
        haptic.error();
        setLoading(false);
        return;
      }

      // Create user
      const passwordHash = btoa(password);
      const { data, error: createError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          full_name: fullName.trim(),
          role: 'student'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setSuccess('Регистрация успешна! Теперь войдите в систему.');
      haptic.success();
      
      // Switch to login after 2 seconds
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setError('Ошибка регистрации. Попробуйте позже.');
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🎓</div>
          <h1>UniClub</h1>
          <p>Студенческая платформа</p>
        </div>

        {/* Mode Tabs */}
        <div className="login-tabs">
          <button 
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Вход
          </button>
          <button 
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Регистрация
          </button>
        </div>

        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="success-alert">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {mode === 'login' ? (
          /* Login Form */
          <form className="login-form" onSubmit={handleLogin}>
            <FormField label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                autoComplete="email"
              />
            </FormField>

            <FormField label="Пароль">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        ) : (
          /* Registration Form */
          <form className="login-form" onSubmit={handleRegister}>
            <FormField label="Имя и фамилия">
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван"
                required
                autoFocus
                autoComplete="name"
              />
            </FormField>

            <FormField label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </FormField>

            <FormField label="Пароль">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                required
                autoComplete="new-password"
              />
            </FormField>

            <FormField label="Подтвердите пароль">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
                autoComplete="new-password"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        )}

        {mode === 'login' && (
          <div className="demo-credentials">
            <p className="demo-credentials-title">Тестовые аккаунты</p>
            <div className="demo-credentials-list">
              {DEMO_CREDENTIALS.map((cred, index) => (
                <div key={index} className="demo-credential">
                  <code>{cred.email}</code> / <code>{cred.password}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;

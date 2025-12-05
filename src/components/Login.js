import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { DEMO_CREDENTIALS } from '../utils/constants';
import { FormField, Input, Button } from './UI';
import { haptic } from '../utils/haptic';

export function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [faculties, setFaculties] = useState([]);
  const [directions, setDirections] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    if (mode === 'register') loadFaculties();
  }, [mode]);

  useEffect(() => {
    if (selectedFaculty) {
      loadDirections(selectedFaculty);
      setSelectedDirection('');
      setSelectedGroup('');
      setGroups([]);
    }
  }, [selectedFaculty]);

  useEffect(() => {
    if (selectedDirection) {
      loadGroups(selectedDirection);
      setSelectedGroup('');
    }
  }, [selectedDirection]);

  const loadFaculties = async () => {
    const { data } = await supabase.from('faculties').select('id, name, code').order('name');
    setFaculties(data || []);
  };

  const loadDirections = async (facultyId) => {
    const { data } = await supabase.from('directions').select('id, name, code').eq('faculty_id', facultyId).order('name');
    setDirections(data || []);
  };

  const loadGroups = async (directionId) => {
    const { data } = await supabase.from('study_groups').select('id, name, course').eq('direction_id', directionId).order('name');
    setGroups(data || []);
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setFullName('');
    setSelectedFaculty(''); setSelectedDirection(''); setSelectedGroup('');
    setError(''); setSuccess('');
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
        .eq('email', email.toLowerCase().trim())
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
    setError(''); setSuccess('');

    if (!fullName.trim()) { setError('Введите имя и фамилию'); haptic.error(); return; }
    if (password.length < 6) { setError('Пароль должен быть минимум 6 символов'); haptic.error(); return; }
    if (password !== confirmPassword) { setError('Пароли не совпадают'); haptic.error(); return; }
    if (!selectedFaculty || !selectedDirection || !selectedGroup) { setError('Выберите факультет, направление и группу'); haptic.error(); return; }

    setLoading(true);

    try {
      const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).single();
      if (existing) { setError('Пользователь с таким email уже существует'); haptic.error(); setLoading(false); return; }

      const passwordHash = btoa(password);
      const { data, error: createError } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          full_name: fullName.trim(),
          role: 'student',
          faculty_id: selectedFaculty,
          direction_id: selectedDirection,
          group_id: selectedGroup
        })
        .select()
        .single();

      if (createError) throw createError;

      await supabase.from('group_members').insert({ group_id: selectedGroup, student_id: data.id });

      setSuccess('Регистрация успешна! Теперь войдите.');
      haptic.success();
      
      setTimeout(() => {
        setMode('login');
        resetForm();
      }, 2000);

    } catch (err) {
      setError('Ошибка регистрации');
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

        <div className="login-tabs">
          <button className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Вход</button>
          <button className={`login-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Регистрация</button>
        </div>

        {error && <div className="error-alert"><span>⚠️</span><span>{error}</span></div>}
        {success && <div className="success-alert"><span>✅</span><span>{success}</span></div>}

        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleLogin}>
            <FormField label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required autoFocus />
            </FormField>
            <FormField label="Пароль">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </FormField>
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegister}>
            <FormField label="Имя и фамилия">
              <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван" required autoFocus />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
            </FormField>
            <FormField label="Пароль">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" required />
            </FormField>
            <FormField label="Подтвердите пароль">
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" required />
            </FormField>
            <FormField label="Факультет">
              <select className="form-select" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)} required>
                <option value="">Выберите факультет</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.code ? `${f.code} — ${f.name}` : f.name}</option>)}
              </select>
            </FormField>
            <FormField label="Направление">
              <select className="form-select" value={selectedDirection} onChange={(e) => setSelectedDirection(e.target.value)} required disabled={!selectedFaculty}>
                <option value="">{selectedFaculty ? 'Выберите направление' : 'Сначала выберите факультет'}</option>
                {directions.map(d => <option key={d.id} value={d.id}>{d.code ? `${d.code} — ${d.name}` : d.name}</option>)}
              </select>
            </FormField>
            <FormField label="Группа">
              <select className="form-select" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} required disabled={!selectedDirection}>
                <option value="">{selectedDirection ? 'Выберите группу' : 'Сначала выберите направление'}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.course} курс)</option>)}
              </select>
            </FormField>
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        )}

        {mode === 'login' && (
          <div className="demo-credentials">
            <p className="demo-credentials-title">Тестовые аккаунты</p>
            <div className="demo-credentials-list">
              {DEMO_CREDENTIALS.map((cred, i) => (
                <div key={i} className="demo-credential">
                  <span className="demo-label">{cred.label}:</span> <code>{cred.email}</code> / <code>{cred.password}</code>
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

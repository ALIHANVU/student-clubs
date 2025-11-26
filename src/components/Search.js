import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { haptic } from '../utils/haptic';

/**
 * Global Search Component
 */
export function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ clubs: [], events: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults({ clubs: [], events: [], users: [] });
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults({ clubs: [], events: [], users: [] });
        return;
      }

      setLoading(true);
      try {
        const [clubsRes, eventsRes, usersRes] = await Promise.all([
          supabase
            .from('clubs')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5),
          supabase
            .from('events')
            .select('*')
            .ilike('title', `%${query}%`)
            .limit(5),
          supabase
            .from('users')
            .select('id, full_name, email, role')
            .ilike('full_name', `%${query}%`)
            .limit(5)
        ]);

        setResults({
          clubs: clubsRes.data || [],
          events: eventsRes.data || [],
          users: usersRes.data || []
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.clubs.length + results.events.length + results.users.length;

  const filteredResults = activeTab === 'all' 
    ? results 
    : { 
        clubs: activeTab === 'clubs' ? results.clubs : [],
        events: activeTab === 'events' ? results.events : [],
        users: activeTab === 'users' ? results.users : []
      };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <div className="search-input-wrapper">
            <span className="search-input-icon">🔍</span>
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Поиск клубов, мероприятий, людей..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                className="search-clear" 
                onClick={() => { setQuery(''); haptic.light(); }}
              >
                ✕
              </button>
            )}
          </div>
          <button className="search-cancel" onClick={onClose}>
            Отмена
          </button>
        </div>

        {query.length >= 2 && (
          <div className="search-tabs">
            {[
              { id: 'all', label: 'Все' },
              { id: 'clubs', label: `Клубы (${results.clubs.length})` },
              { id: 'events', label: `События (${results.events.length})` },
              { id: 'users', label: `Люди (${results.users.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                className={`search-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); haptic.light(); }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="loading-spinner" />
            </div>
          ) : query.length < 2 ? (
            <div className="search-empty">
              <span className="search-empty-icon">🔍</span>
              <p>Введите минимум 2 символа</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="search-empty">
              <span className="search-empty-icon">😕</span>
              <p>Ничего не найдено</p>
            </div>
          ) : (
            <>
              {filteredResults.clubs.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">Клубы</div>
                  {filteredResults.clubs.map(club => (
                    <div key={club.id} className="search-result-item" onClick={() => { haptic.light(); onClose(); }}>
                      <div className="search-result-icon">🎭</div>
                      <div className="search-result-content">
                        <div className="search-result-title">{club.name}</div>
                        <div className="search-result-subtitle">{club.description || 'Клуб'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredResults.events.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">Мероприятия</div>
                  {filteredResults.events.map(event => (
                    <div key={event.id} className="search-result-item" onClick={() => { haptic.light(); onClose(); }}>
                      <div className="search-result-icon">📅</div>
                      <div className="search-result-content">
                        <div className="search-result-title">{event.title}</div>
                        <div className="search-result-subtitle">{event.location || 'Мероприятие'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredResults.users.length > 0 && (
                <div className="search-section">
                  <div className="search-section-title">Люди</div>
                  {filteredResults.users.map(user => (
                    <div key={user.id} className="search-result-item" onClick={() => { haptic.light(); onClose(); }}>
                      <div className="search-result-icon">👤</div>
                      <div className="search-result-content">
                        <div className="search-result-title">{user.full_name}</div>
                        <div className="search-result-subtitle">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GlobalSearch;

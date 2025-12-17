/**
 * Hooks — Супер-оптимизированные
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cachedQuery, invalidateCache } from '../utils/supabase';
import { STORAGE_KEY } from '../utils/constants';

// Auth hook — минимальный
export function useAuth() {
  const [state, setState] = useState({ user: null, loading: true });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ user: JSON.parse(saved), loading: false });
      else setState(s => ({ ...s, loading: false }));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const login = useCallback((userData) => {
    setState({ user: userData, loading: false });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, loading: false });
    localStorage.removeItem(STORAGE_KEY);
    invalidateCache();
  }, []);

  const updateUser = useCallback((updates) => {
    setState(prev => {
      const updated = { ...prev.user, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { ...prev, user: updated };
    });
  }, []);

  return { ...state, login, logout, updateUser };
}

// Online status — с throttling
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on, { passive: true });
    window.addEventListener('offline', off, { passive: true });
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return isOnline;
}

// Modal hook
export function useModal(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);
  return useMemo(() => ({
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(p => !p)
  }), [isOpen]);
}

// Mobile detection — с debounce
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsMobile(window.innerWidth <= 768);
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return isMobile;
}

// Data fetching — оптимизированный
export function useData(key, fetchFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const mountedRef = useRef(true);
  const fetchRef = useRef(fetchFn);
  
  useEffect(() => { fetchRef.current = fetchFn; }, [fetchFn]);

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await cachedQuery(key, fetchRef.current);
      if (mountedRef.current) setState({ data: result, loading: false, error: null });
    } catch (err) {
      if (mountedRef.current) setState({ data: null, loading: false, error: err });
    }
  }, [key]);

  const refresh = useCallback(async () => {
    invalidateCache(key);
    await load();
  }, [key, load]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line
  }, [key, ...deps]);

  return { ...state, refresh };
}

// Intersection observer — для lazy loading
export function useInView(options = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView];
}

// Stable callback — не меняется между рендерами
export function useStableCallback(callback) {
  const ref = useRef(callback);
  useEffect(() => { ref.current = callback; });
  return useCallback((...args) => ref.current(...args), []);
}

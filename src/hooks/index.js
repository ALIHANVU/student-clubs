/**
 * Custom Hooks
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Auth hook
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { user, loading, login, logout, updateUser };
}

/**
 * Supabase query hook
 */
export function useSupabaseQuery(table, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from(table).select(options.select || '*');
      
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: err } = await query;
      
      if (err) throw err;
      setData(result || []);
      setError(null);
    } catch (err) {
      setError(err);
      console.error(`Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table, JSON.stringify(options)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Supabase count hook
 */
export function useSupabaseCount(table, options = {}) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        let query = supabase.from(table).select('id', { count: 'exact', head: true });
        
        if (options.eq) {
          Object.entries(options.eq).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        const { count: result } = await query;
        setCount(result || 0);
      } catch (err) {
        console.error(`Error counting ${table}:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [table, JSON.stringify(options)]);

  return { count, loading };
}

/**
 * Local storage hook
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * Mobile detection hook
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

/**
 * Modal hook
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}

/**
 * Swipe gesture hook for swipeable items
 */
export function useSwipeGesture(onSwipeLeft, onSwipeRight, options = {}) {
  const { threshold = 50, enabled = true } = options;
  const touchStart = useRef({ x: 0, y: 0 });
  const touchEnd = useRef({ x: 0, y: 0 });

  const onTouchStart = useCallback((e) => {
    if (!enabled) return;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    touchEnd.current = { ...touchStart.current };
  }, [enabled]);

  const onTouchMove = useCallback((e) => {
    if (!enabled) return;
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  }, [enabled]);

  const onTouchEnd = useCallback(() => {
    if (!enabled) return;
    
    const deltaX = touchStart.current.x - touchEnd.current.x;
    const deltaY = touchStart.current.y - touchEnd.current.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
  }, [enabled, threshold, onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

/**
 * Long press hook
 */
export function useLongPress(callback, options = {}) {
  const { delay = 400, enabled = true } = options;
  const timeout = useRef(null);
  const prevented = useRef(false);

  const start = useCallback((e) => {
    if (!enabled) return;
    prevented.current = false;
    timeout.current = setTimeout(() => {
      prevented.current = true;
      callback(e);
    }, delay);
  }, [callback, delay, enabled]);

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  }, []);

  const shouldPreventClick = useCallback(() => {
    return prevented.current;
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    shouldPreventClick
  };
}

/**
 * Online status hook
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Offline cache hook
 */
export function useOfflineCache(key, fetchFn, options = {}) {
  const { ttl = 5 * 60 * 1000 } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const isOnline = useOnlineStatus();

  const getCached = useCallback(() => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > ttl;
        return { data, isExpired };
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }
    return { data: null, isExpired: true };
  }, [key, ttl]);

  const setCache = useCallback((newData) => {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }, [key]);

  const refresh = useCallback(async (force = false) => {
    const { data: cachedData, isExpired } = getCached();

    if (!isOnline) {
      if (cachedData) {
        setData(cachedData);
        setIsFromCache(true);
      }
      setLoading(false);
      return;
    }

    if (cachedData && !isExpired && !force) {
      setData(cachedData);
      setIsFromCache(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const freshData = await fetchFn();
      setData(freshData);
      setCache(freshData);
      setIsFromCache(false);
    } catch (error) {
      console.error('Fetch error:', error);
      if (cachedData) {
        setData(cachedData);
        setIsFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, getCached, setCache, isOnline]);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (isOnline && isFromCache) {
      refresh(true);
    }
  }, [isOnline]);

  return { data, loading, isFromCache, refresh, isOnline };
}

/**
 * Page transition hook
 */
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('forward');

  const transition = useCallback((newDirection = 'forward') => {
    setDirection(newDirection);
    setIsTransitioning(true);
    
    return new Promise(resolve => {
      setTimeout(() => {
        setIsTransitioning(false);
        resolve();
      }, 300);
    });
  }, []);

  return { isTransitioning, direction, transition };
}

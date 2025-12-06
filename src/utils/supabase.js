/**
 * Supabase Client — Оптимизированный с кэшированием
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lbkpillzvxlgorybgdug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxia3BpbGx6dnhsZ29yeWJnZHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDY0NDcsImV4cCI6MjA3OTIyMjQ0N30.2D_09Z-fdASS241wCmEi1nHq8uTA-6pd-Yp0mtLG01s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Оптимизация реалтайма - отключаем если не нужен
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Простой кэш для запросов
const cache = new Map();
const CACHE_TTL = 30000; // 30 секунд

export async function cachedQuery(key, queryFn, ttl = CACHE_TTL) {
  const cached = cache.get(key);
  const now = Date.now();
  
  if (cached && now - cached.time < ttl) {
    return cached.data;
  }
  
  const data = await queryFn();
  cache.set(key, { data, time: now });
  return data;
}

export function invalidateCache(keyPattern) {
  if (!keyPattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(keyPattern)) {
      cache.delete(key);
    }
  }
}

export default supabase;

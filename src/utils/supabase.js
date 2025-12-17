/**
 * Supabase Client — Супер-оптимизированный
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lbkpillzvxlgorybgdug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxia3BpbGx6dnhsZ29yeWJnZHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDY0NDcsImV4cCI6MjA3OTIyMjQ0N30.2D_09Z-fdASS241wCmEi1nHq8uTA-6pd-Yp0mtLG01s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 1 } }
});

// Оптимизированный кэш с LRU
class LRUCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key) {
    if (!this.cache.has(key)) return null;
    const item = this.cache.get(key);
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    // Перемещаем в конец (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.data;
  }
  
  set(key, data, ttl = 30000) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expires: Date.now() + ttl });
  }
  
  invalidate(pattern) {
    if (!pattern) { this.cache.clear(); return; }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }
}

const queryCache = new LRUCache(50);

// Запрос с кэшированием
export async function cachedQuery(key, queryFn, ttl = 30000) {
  const cached = queryCache.get(key);
  if (cached) return cached;
  
  const data = await queryFn();
  queryCache.set(key, data, ttl);
  return data;
}

export function invalidateCache(pattern) {
  queryCache.invalidate(pattern);
}

// Батчинг запросов — собираем несколько запросов в один
const pendingBatches = new Map();

export async function batchedQuery(table, ids, select = '*') {
  const key = `${table}:${select}`;
  
  if (!pendingBatches.has(key)) {
    pendingBatches.set(key, {
      ids: new Set(),
      promise: null,
      resolve: null
    });
    
    // Откладываем выполнение на следующий тик
    pendingBatches.get(key).promise = new Promise(resolve => {
      pendingBatches.get(key).resolve = resolve;
      
      setTimeout(async () => {
        const batch = pendingBatches.get(key);
        pendingBatches.delete(key);
        
        const { data } = await supabase
          .from(table)
          .select(select)
          .in('id', Array.from(batch.ids));
        
        batch.resolve(data || []);
      }, 10);
    });
  }
  
  ids.forEach(id => pendingBatches.get(key).ids.add(id));
  return pendingBatches.get(key).promise;
}

export default supabase;

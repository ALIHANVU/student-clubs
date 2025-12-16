/**
 * Debounce utility для оптимизации производительности
 * Используется для поиска, чтобы не выполнять фильтрацию на каждый символ
 */

export function debounce(func, wait = 300) {
  let timeout;
  
  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  // Метод для отмены (cleanup)
  debounced.cancel = function() {
    clearTimeout(timeout);
  };
  
  return debounced;
}

/**
 * Throttle utility для оптимизации scroll событий
 * Ограничивает количество вызовов функции во времени
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * RequestAnimationFrame wrapper для плавных анимаций
 * Синхронизирует обновления с частотой обновления экрана
 */
export function rafThrottle(callback) {
  let requestId = null;
  let lastArgs = null;
  
  const later = (context) => () => {
    requestId = null;
    callback.apply(context, lastArgs);
  };
  
  const throttled = function(...args) {
    lastArgs = args;
    if (requestId === null) {
      requestId = requestAnimationFrame(later(this));
    }
  };
  
  throttled.cancel = () => {
    if (requestId !== null) {
      cancelAnimationFrame(requestId);
      requestId = null;
    }
  };
  
  return throttled;
}

/**
 * Мемоизация функций для кэширования результатов
 */
export function memoize(fn) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    // Ограничиваем размер кэша
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}

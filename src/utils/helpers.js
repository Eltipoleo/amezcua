// =============================================
// DEBOUNCE - Optimiza eventos de entrada
// =============================================
export function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// =============================================
// CACHE MANUAL EN MEMORIA
// =============================================
const cache = new Map();
const CACHE_TTL = 60000; // 1 minuto

export const cacheService = {
  get(key) {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    return item.data;
  },

  set(key, data, ttl = CACHE_TTL) {
    cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  },

  invalidate(key) {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  },

  has(key) {
    return this.get(key) !== null;
  }
};

// =============================================
// ABORT CONTROLLER MANAGER
// =============================================
const controllers = new Map();

export const abortManager = {
  create(key) {
    // Cancela la peticion anterior si existe
    this.abort(key);
    const controller = new AbortController();
    controllers.set(key, controller);
    return controller.signal;
  },

  abort(key) {
    const controller = controllers.get(key);
    if (controller) {
      controller.abort();
      controllers.delete(key);
    }
  },

  abortAll() {
    controllers.forEach(controller => controller.abort());
    controllers.clear();
  }
};

// =============================================
// INTERSECTION OBSERVER PARA ANIMACIONES
// =============================================
export function createScrollAnimationObserver(options = {}) {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observerOptions = { ...defaultOptions, ...options };

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
}

// =============================================
// PARALLAX HELPER
// =============================================
export function handleParallax(e, element, intensity = 0.05) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const deltaX = (e.clientX - centerX) * intensity;
  const deltaY = (e.clientY - centerY) * intensity;
  return { x: deltaX, y: deltaY };
}

// =============================================
// MAGNETIC BUTTON EFFECT
// =============================================
export function magneticEffect(e, element, strength = 0.3) {
  if (!element) return { x: 0, y: 0 };
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  return {
    x: x * strength,
    y: y * strength
  };
}

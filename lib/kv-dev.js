/**
 * Development fallback for KV database
 * Uses in-memory storage when Upstash is unavailable
 * Persists across module reloads using global reference
 */

// Use global to persist store across module reloads in development
if (!global.__kvDevStore) {
  global.__kvDevStore = new Map();
}

const devStore = global.__kvDevStore;

export const kvDev = {
  async get(key) {
    const value = devStore.get(key);
    return value || null;
  },
  
  async set(key, value, options) {
    // Options like { ex: seconds } are ignored in dev mode
    devStore.set(key, value);
    return "OK";
  },
  
  async del(key) {
    devStore.delete(key);
    return 1;
  },
  
  async incr(key) {
    const current = (devStore.get(key) || 0);
    const newValue = typeof current === 'number' ? current + 1 : 1;
    devStore.set(key, newValue);
    return newValue;
  },
  
  async expire(key, seconds) {
    // Simple TTL - not implemented for dev
    return 1;
  },
  
  async keys(pattern) {
    // Simple pattern matching for dev (only supports * suffix)
    const keys = Array.from(devStore.keys());
    if (pattern === "*") {
      return keys;
    }
    
    // Convert pattern to regex (e.g., "user:*" becomes "user:")
    const prefix = pattern.replace("*", "");
    return keys.filter(key => key.startsWith(prefix));
  }
};

export default kvDev;

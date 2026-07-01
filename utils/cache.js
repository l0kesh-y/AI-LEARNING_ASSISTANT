/**
 * In-memory cache using node-cache.
 * TTLs are tuned per data type:
 *  - Dashboard / analytics : 60s  (refreshes frequently)
 *  - Document list          : 30s
 *  - Flashcard list         : 30s
 *  - Quiz list              : 30s
 */
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 60, checkperiod: 30, useClones: false });

/**
 * Build a namespaced cache key scoped to a user.
 * @param {string} prefix  e.g. 'dashboard' | 'documents' | 'flashcards'
 * @param {string} userId  Mongoose ObjectId string
 * @param {string} [extra] optional extra discriminator (e.g. query params hash)
 */
const key = (prefix, userId, extra = '') => `${prefix}:${userId}${extra ? ':' + extra : ''}`;

/**
 * Invalidate all cache keys that start with a given prefix for a user.
 * Call this after any write (POST / PUT / DELETE) to keep cache coherent.
 */
const invalidateUser = (prefix, userId) => {
  const pattern = `${prefix}:${userId}`;
  const keys = cache.keys().filter(k => k.startsWith(pattern));
  keys.forEach(k => cache.del(k));
};

/**
 * Express middleware for caching GET requests.
 * Creates a cache key from the full URL and userId.
 * @param {number} ttl - Time to live in seconds
 */
const cacheMiddleware = (ttl = 30) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Build cache key from URL and userId
    const cacheKey = `${req.originalUrl}:${req.userId || 'anonymous'}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Store original res.json to intercept the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(cacheKey, data, ttl);
      return originalJson(data);
    };

    next();
  };
};

module.exports = { cache, key, invalidateUser, cacheMiddleware };

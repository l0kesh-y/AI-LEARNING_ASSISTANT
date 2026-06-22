/**
 * Groq API Key Load Balancer
 * Round-robin distribution across multiple API keys with
 * failure detection and automatic failover.
 */
const Groq = require('groq-sdk');

class GroqLoadBalancer {
  constructor() {
    this.keys = this._loadKeys();
    this.clients = this.keys.map(key => new Groq({ apiKey: key }));
    this.currentIndex = 0;
    this.failedKeys = new Set();
    this.failureCounts = new Map();
    this.lastReset = Date.now();
    this.RESET_INTERVAL_MS = 60 * 1000; // reset failure counts every 60s
    this.MAX_FAILURES = 3;

    if (this.keys.length === 0) {
      throw new Error('No GROQ_API_KEY environment variables found.');
    }

    console.log(`[GroqLB] Initialized with ${this.keys.length} API key(s).`);
  }

  _loadKeys() {
    const keys = [];
    // Support GROQ_API_KEY_1 through GROQ_API_KEY_6, plus legacy GROQ_API_KEY
    for (let i = 1; i <= 6; i++) {
      const key = process.env[`GROQ_API_KEY_${i}`];
      if (key && key.trim()) keys.push(key.trim());
    }
    // Fallback: single key
    if (keys.length === 0 && process.env.GROQ_API_KEY) {
      keys.push(process.env.GROQ_API_KEY.trim());
    }
    return keys;
  }

  _resetIfNeeded() {
    if (Date.now() - this.lastReset > this.RESET_INTERVAL_MS) {
      this.failedKeys.clear();
      this.failureCounts.clear();
      this.lastReset = Date.now();
      console.log('[GroqLB] Failure counts reset.');
    }
  }

  _getNextIndex() {
    this._resetIfNeeded();
    const total = this.clients.length;
    let attempts = 0;

    while (attempts < total) {
      const idx = this.currentIndex % total;
      this.currentIndex = (this.currentIndex + 1) % total;
      if (!this.failedKeys.has(idx)) return idx;
      attempts++;
    }

    // All keys failed — reset and try again
    console.warn('[GroqLB] All keys exhausted, resetting failed set.');
    this.failedKeys.clear();
    this.failureCounts.clear();
    return 0;
  }

  _markFailure(index) {
    const count = (this.failureCounts.get(index) || 0) + 1;
    this.failureCounts.set(index, count);
    if (count >= this.MAX_FAILURES) {
      this.failedKeys.add(index);
      console.warn(`[GroqLB] Key #${index + 1} marked as failed after ${count} errors.`);
    }
  }

  /**
   * Proxy for groq.chat.completions.create with automatic retry on different keys.
   */
  async createCompletion(params, retries = 0) {
    const index = this._getNextIndex();
    const client = this.clients[index];

    try {
      const result = await client.chat.completions.create(params);
      return result;
    } catch (err) {
      const isRateLimit = err?.status === 429 || err?.message?.includes('rate_limit');
      const isAuth = err?.status === 401;

      if (isRateLimit || isAuth) {
        this._markFailure(index);
        console.warn(`[GroqLB] Key #${index + 1} error (${err.status}), trying next key.`);
      }

      const availableKeys = this.clients.length - this.failedKeys.size;
      if (retries < availableKeys && availableKeys > 0) {
        return this.createCompletion(params, retries + 1);
      }

      throw err;
    }
  }

  getStats() {
    return {
      totalKeys: this.keys.length,
      activeKeys: this.keys.length - this.failedKeys.size,
      failedKeys: this.failedKeys.size,
      currentIndex: this.currentIndex,
    };
  }
}

// Singleton instance
let instance = null;

const getGroqClient = () => {
  if (!instance) instance = new GroqLoadBalancer();
  return instance;
};

module.exports = { getGroqClient };

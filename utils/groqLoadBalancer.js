/**
 * Groq API Key Load Balancer
 * 
 * Manages multiple Groq API keys with round-robin distribution,
 * automatic failure detection, and failover to ensure high availability.
 * 
 * Features:
 * - Round-robin key rotation for load distribution
 * - Automatic failover when keys hit rate limits (429) or auth errors (401)
 * - Failure tracking with automatic reset every 60 seconds
 * - Supports up to 6 API keys (GROQ_API_KEY_1 through GROQ_API_KEY_6)
 * - Falls back to single GROQ_API_KEY for backward compatibility
 * 
 * Usage:
 *   const { getGroqClient } = require('./utils/groqLoadBalancer');
 *   const groq = getGroqClient();
 *   const response = await groq.createCompletion({ ... });
 */
const Groq = require('groq-sdk');

class GroqLoadBalancer {
  constructor() {
    // Load all available API keys from environment variables
    this.keys = this._loadKeys();
    
    // Create a Groq client instance for each API key
    this.clients = this.keys.map(key => new Groq({ apiKey: key }));
    
    // Current index for round-robin rotation
    this.currentIndex = 0;
    
    // Set of key indices that have exceeded MAX_FAILURES
    this.failedKeys = new Set();
    
    // Map tracking failure counts per key index
    this.failureCounts = new Map();
    
    // Timestamp of last failure count reset
    this.lastReset = Date.now();
    
    // Reset failure counts every 60 seconds to give keys another chance
    this.RESET_INTERVAL_MS = 60 * 1000;
    
    // Maximum failures before marking a key as failed (increased from 3 to 5 for network tolerance)
    this.MAX_FAILURES = 5;

    // Ensure at least one API key is configured
    if (this.keys.length === 0) {
      throw new Error('No GROQ_API_KEY environment variables found.');
    }

    console.log(`[GroqLB] Initialized with ${this.keys.length} API key(s). Keys: ${this.keys.map((k, i) => `#${i+1}(${k.substring(0,8)}...)`).join(', ')}`);
  }

  /**
   * Load API keys from environment variables
   * 
   * Supports:
   * - GROQ_API_KEY_1 through GROQ_API_KEY_6 (numbered keys for load balancing)
   * - GROQ_API_KEY (single key fallback for backward compatibility)
   * 
   * @returns {string[]} Array of API key strings
   */
  _loadKeys() {
    const keys = [];
    
    // Load numbered keys (GROQ_API_KEY_1 through GROQ_API_KEY_6)
    for (let i = 1; i <= 6; i++) {
      const key = process.env[`GROQ_API_KEY_${i}`];
      if (key && key.trim()) keys.push(key.trim());
    }
    
    // Fallback to single key if no numbered keys found
    if (keys.length === 0 && process.env.GROQ_API_KEY) {
      keys.push(process.env.GROQ_API_KEY.trim());
    }
    
    return keys;
  }

  /**
   * Reset failure tracking if RESET_INTERVAL_MS has elapsed
   * 
   * This gives previously failed keys another chance to work,
   * useful for temporary rate limits or network issues.
   */
  _resetIfNeeded() {
    if (Date.now() - this.lastReset > this.RESET_INTERVAL_MS) {
      this.failedKeys.clear();
      this.failureCounts.clear();
      this.lastReset = Date.now();
      console.log('[GroqLB] Failure counts reset - all keys reactivated.');
    }
  }

  /**
   * Get the next available key index using round-robin strategy
   * 
   * Skips keys that are currently marked as failed.
   * If all keys are failed, resets the failure tracking and starts over.
   * 
   * @returns {number} Index of the next key to use
   */
  _getNextIndex() {
    // Reset failures if enough time has passed
    this._resetIfNeeded();
    
    const total = this.clients.length;
    let attempts = 0;

    // Try to find a non-failed key using round-robin
    while (attempts < total) {
      const idx = this.currentIndex % total;
      this.currentIndex = (this.currentIndex + 1) % total;
      
      // Return this index if the key hasn't failed
      if (!this.failedKeys.has(idx)) return idx;
      
      attempts++;
    }

    // All keys have failed - reset everything and try again
    console.warn('[GroqLB] All keys exhausted, resetting failed set for fresh attempt.');
    this.failedKeys.clear();
    this.failureCounts.clear();
    return 0;
  }

  /**
   * Mark a key as failed and track failure count
   * 
   * If a key reaches MAX_FAILURES, it's added to the failedKeys set
   * and won't be used until the next reset interval.
   * 
   * @param {number} index - Index of the failed key
   */
  _markFailure(index) {
    // Increment failure count for this key
    const count = (this.failureCounts.get(index) || 0) + 1;
    this.failureCounts.set(index, count);
    
    // Mark as failed if it exceeds the threshold
    if (count >= this.MAX_FAILURES) {
      this.failedKeys.add(index);
      console.warn(`[GroqLB] Key #${index + 1} marked as failed after ${count} errors.`);
    }
  }

  /**
   * Create a chat completion with automatic failover
   * 
   * This method wraps the Groq chat.completions.create API with:
   * - Automatic retry on rate limit (429) or auth (401) errors
   * - Round-robin key rotation on failure
   * - Full reset and final attempt if all keys fail
   * 
   * @param {Object} params - Parameters for chat.completions.create
   * @param {Array} params.messages - Array of message objects
   * @param {string} params.model - Model name (e.g., 'llama-3.1-8b-instant')
   * @param {number} params.temperature - Temperature for response generation
   * @param {number} params.max_tokens - Maximum tokens in response
   * @param {number} retries - Current retry count (internal use)
   * 
   * @returns {Promise<Object>} Groq API response
   * @throws {Error} If all keys fail or non-recoverable error occurs
   */
  async createCompletion(params, retries = 0) {
    const maxRetries = this.clients.length;
    
    // If we've tried all keys, do a full reset and one last attempt
    if (retries >= maxRetries) {
      this.failedKeys.clear();
      this.failureCounts.clear();
      this.currentIndex = 0;
      console.warn('[GroqLB] All keys failed, forcing full reset and retrying with key #1.');
    }

    // Get next available key
    const index = this._getNextIndex();
    const client = this.clients[index];

    try {
      // Attempt API call with current key
      const result = await client.chat.completions.create(params);
      return result;
    } catch (err) {
      // Check if error is recoverable (rate limit or authentication)
      const isRateLimit = err?.status === 429 || err?.message?.includes('rate_limit');
      const isAuth = err?.status === 401;

      // If recoverable, mark as failure and try next key
      if (isRateLimit || isAuth) {
        this._markFailure(index);
        console.warn(`[GroqLB] Key #${index + 1} error (${err.status}), trying next key.`);
        
        if (retries < maxRetries) {
          return this.createCompletion(params, retries + 1);
        }
      }

      // Non-recoverable error or all retries exhausted
      throw err;
    }
  }

  /**
   * Get current load balancer statistics
   * 
   * @returns {Object} Statistics object containing:
   *   - totalKeys: Total number of configured API keys
   *   - activeKeys: Number of keys currently available
   *   - failedKeys: Number of keys currently marked as failed
   *   - currentIndex: Current position in round-robin rotation
   */
  getStats() {
    return {
      totalKeys: this.keys.length,
      activeKeys: this.keys.length - this.failedKeys.size,
      failedKeys: this.failedKeys.size,
      currentIndex: this.currentIndex,
    };
  }
}

// Singleton instance - shared across entire application
let instance = null;

/**
 * Get the singleton GroqLoadBalancer instance
 * 
 * Creates a new instance on first call, returns existing instance on subsequent calls.
 * 
 * @returns {GroqLoadBalancer} The load balancer instance
 */
const getGroqClient = () => {
  if (!instance) instance = new GroqLoadBalancer();
  return instance;
};

/**
 * Reset the singleton instance
 * 
 * Useful for reloading configuration after environment variable changes.
 * Next call to getGroqClient() will create a fresh instance.
 */
const resetGroqClient = () => { 
  instance = null; 
};

module.exports = { getGroqClient, resetGroqClient };

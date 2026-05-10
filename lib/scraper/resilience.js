/**
 * Retry and Circuit Breaker for Resilient API Calls
 */

import { scraperLogger } from '@/lib/logger';

/**
 * Exponential backoff retry mechanism
 */
export async function retryWithBackoff(
  fn,
  options = {}
) {
  const {
    maxRetries = 3,
    initialDelayMs = 500,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    jitter = true,
    onRetry = null,
    context = '',
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        scraperLogger.error(
          `Max retries (${maxRetries}) exhausted`,
          `retryWithBackoff:${context}`,
          { error: error.message }
        );
        throw error;
      }

      let delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt);
      if (jitter) {
        delayMs += Math.random() * delayMs * 0.1; // 10% jitter
      }
      delayMs = Math.min(delayMs, maxDelayMs);

      if (onRetry) {
        onRetry(attempt, delayMs, error);
      }

      scraperLogger.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delayMs)}ms`,
        `retryWithBackoff:${context}`,
        { error: error.message }
      );

      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Circuit breaker for preventing cascading failures
 */
export class CircuitBreaker {
  constructor(
    name,
    options = {}
  ) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute

    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn, fallback = null) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        scraperLogger.info(`Circuit breaker entering HALF_OPEN`, `CircuitBreaker:${this.name}`);
      } else {
        scraperLogger.warn(`Circuit breaker is OPEN`, `CircuitBreaker:${this.name}`);
        if (fallback) return fallback();
        throw new Error(`Circuit breaker OPEN for ${this.name}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successes = 0;
        scraperLogger.info(`Circuit breaker CLOSED`, `CircuitBreaker:${this.name}`);
      }
    }
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      scraperLogger.error(
        `Circuit breaker OPEN after ${this.failures} failures`,
        `CircuitBreaker:${this.name}`
      );
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
    };
  }
}

/**
 * Sleep utility
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

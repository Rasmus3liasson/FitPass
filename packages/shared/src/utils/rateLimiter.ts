interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blocked: boolean;
  blockedUntil?: number;
}

/**
 * Client-side rate limiter to prevent brute force attacks
 * Tracks attempts per identifier (email, user ID, etc.)
 */
export class RateLimiter {
  private static attempts = new Map<string, RateLimitEntry>();

  // Configurable limits
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Check if action is allowed for this identifier
   * @param identifier - Usually email or device ID
   * @param action - Type of action (e.g., 'login', 'register')
   * @returns { allowed: boolean, remainingAttempts?: number, retryAfter?: number }
   */
  static checkLimit(
    identifier: string,
    action: string
  ): {
    allowed: boolean;
    remainingAttempts?: number;
    retryAfter?: number;
    message?: string;
  } {
    const key = `${action}:${identifier.toLowerCase()}`;
    const now = Date.now();
    const entry = this.attempts.get(key);

    // If blocked, check if block expired
    if (entry?.blocked) {
      if (entry.blockedUntil && now < entry.blockedUntil) {
        const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
        return {
          allowed: false,
          retryAfter,
          message: `För många försök. Försök igen om ${Math.ceil(retryAfter / 60)} minuter.`,
        };
      }
      // Block expired, reset
      this.attempts.delete(key);
    }

    // No previous attempts or window expired
    if (!entry || now - entry.firstAttempt > this.WINDOW_MS) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        blocked: false,
      });
      return {
        allowed: true,
        remainingAttempts: this.MAX_ATTEMPTS - 1,
      };
    }

    // Increment attempts
    entry.count++;

    // Check if limit exceeded
    if (entry.count > this.MAX_ATTEMPTS) {
      entry.blocked = true;
      entry.blockedUntil = now + this.BLOCK_DURATION_MS;

      return {
        allowed: false,
        retryAfter: Math.ceil(this.BLOCK_DURATION_MS / 1000),
        message: `För många försök. Kontot är tillfälligt låst i ${this.BLOCK_DURATION_MS / 60000} minuter.`,
      };
    }

    return {
      allowed: true,
      remainingAttempts: this.MAX_ATTEMPTS - entry.count,
    };
  }

  /**
   * Reset attempts for identifier (call after successful action)
   */
  static reset(identifier: string, action: string): void {
    const key = `${action}:${identifier.toLowerCase()}`;
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limit data (for testing/admin purposes)
   */
  static clearAll(): void {
    this.attempts.clear();
  }

  /**
   * Clean up expired entries (call periodically)
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      // Remove expired entries
      if (now - entry.firstAttempt > this.WINDOW_MS && !entry.blocked) {
        this.attempts.delete(key);
      }
      // Remove expired blocks
      if (entry.blocked && entry.blockedUntil && now > entry.blockedUntil) {
        this.attempts.delete(key);
      }
    }
  }

  /**
   * Get current status for identifier
   * Useful for displaying warnings to users
   */
  static getStatus(
    identifier: string,
    action: string
  ): {
    attempts: number;
    remaining: number;
    blocked: boolean;
    blockedUntil?: Date;
  } | null {
    const key = `${action}:${identifier.toLowerCase()}`;
    const entry = this.attempts.get(key);

    if (!entry) {
      return null;
    }

    return {
      attempts: entry.count,
      remaining: Math.max(0, this.MAX_ATTEMPTS - entry.count),
      blocked: entry.blocked,
      blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil) : undefined,
    };
  }
}

// Run cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => RateLimiter.cleanup(), 5 * 60 * 1000);
}

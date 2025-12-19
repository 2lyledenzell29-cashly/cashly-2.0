import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimitMiddleware {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs; // 15 minutes default
    this.maxRequests = maxRequests; // 100 requests default
  }

  // Rate limiting middleware
  limit = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.getKey(req);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);

    // Get or create rate limit entry
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.windowMs
      };
    }

    const entry = this.store[key];

    // Reset if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.windowMs;
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
      
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Try again in ${resetTimeSeconds} seconds.`,
          details: {
            limit: this.maxRequests,
            windowMs: this.windowMs,
            resetTime: entry.resetTime
          }
        }
      } as ApiResponse);
      return;
    }

    // Increment counter
    entry.count++;

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': this.maxRequests.toString(),
      'X-RateLimit-Remaining': (this.maxRequests - entry.count).toString(),
      'X-RateLimit-Reset': entry.resetTime.toString()
    });

    next();
  };

  private getKey(req: Request): string {
    // Use user ID if authenticated, otherwise fall back to IP
    const userId = req.user?.userId;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  private cleanup(now: number): void {
    // Remove expired entries to prevent memory leaks
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime + this.windowMs) {
        delete this.store[key];
      }
    });
  }
}

// Create rate limiters for different use cases
export const adminRateLimit = new RateLimitMiddleware(15 * 60 * 1000, 50); // 50 requests per 15 minutes for admin
export const generalRateLimit = new RateLimitMiddleware(15 * 60 * 1000, 100); // 100 requests per 15 minutes for general use
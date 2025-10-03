import { logInfo, logWarn } from '../error/ErrorLogger';

export interface PerformanceStrategiesOptions {
  enableAdaptiveStrategy?: boolean;
  enableCachingStrategy?: boolean;
  enableBatchStrategy?: boolean;
}

export interface AdaptiveStrategyOptions {
  fastThreshold: number;
  slowThreshold: number;
}

export interface CachingStrategyOptions {
  ttl: number;
  maxSize: number;
}

export interface BatchStrategyOptions {
  batchSize: number;
  delay: number;
}

export interface RetryStrategyOptions {
  maxRetries: number;
  delay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface CircuitBreakerStrategyOptions {
  failureThreshold: number;
  timeout: number;
  resetTimeout: number;
  failureCondition?: (error: Error) => boolean;
}

export interface ThrottleStrategyOptions {
  rateLimit: number;
  windowMs: number;
}

export interface StrategyContext {
  operationType: string;
  performanceRequirements: Record<string, any>;
}

export interface StrategyMetrics {
  executions: number;
  successes: number;
  failures: number;
  averageLatency: number;
  totalLatency: number;
}

export interface UsageStatistics {
  totalExecutions: number;
  successRate: number;
  averageLatency: number;
  strategies: Record<string, StrategyMetrics>;
}

/**
 * Strategy interface for performance optimization
 */
export interface PerformanceStrategy {
  execute<T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T>;
}

/**
 * Batch strategy interface for processing multiple operations
 */
export interface BatchStrategy {
  execute<T>(operations: (() => Promise<T>)[]): Promise<T[]>;
}

/**
 * Performance strategies for different optimization scenarios
 */
export class PerformanceStrategies {
  private metrics: Map<string, StrategyMetrics>;
  private usageStats: UsageStatistics;

  constructor(_options: PerformanceStrategiesOptions = {}) {
    this.metrics = new Map();
    this.usageStats = {
      totalExecutions: 0,
      successRate: 0,
      averageLatency: 0,
      strategies: {}
    };
  }

  /**
   * Create adaptive strategy that switches based on performance
   */
  createAdaptiveStrategy(options: AdaptiveStrategyOptions): PerformanceStrategy {
    let isFastMode = true;
    // Track last switch time for adaptive strategy
    let lastSwitchTime: number = Date.now();
    
    return {
      execute: async <T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
        const startTime = Date.now();
        
        try {
          const result = await operation(...args);
          const duration = Date.now() - startTime;
          
          // Update strategy based on performance
          if (isFastMode && duration > options.slowThreshold) {
            isFastMode = false;
            lastSwitchTime = Date.now();
            logWarn(`Switched to slow mode due to performance degradation. Last switch: ${lastSwitchTime}`);
          } else if (!isFastMode && duration < options.fastThreshold) {
            isFastMode = true;
            lastSwitchTime = Date.now();
            logInfo(`Switched to fast mode due to performance improvement. Last switch: ${lastSwitchTime}`);
          }
          
          this.updateMetrics('adaptive', duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          this.updateMetrics('adaptive', duration, false);
          throw error;
        }
      }
    };
  }

  /**
   * Create caching strategy for repeated operations
   */
  createCachingStrategy(options: CachingStrategyOptions): PerformanceStrategy {
    const cache = new Map<string, { value: any; timestamp: number }>();
    
    return {
      execute: async <T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
        const key = JSON.stringify(args);
        const now = Date.now();
        
        // Check cache
        if (cache.has(key)) {
          const cached = cache.get(key)!;
          if (now - cached.timestamp < options.ttl) {
            this.updateMetrics('caching', 0, true);
            return cached.value;
          } else {
            cache.delete(key);
          }
        }
        
        const startTime = Date.now();
        
        try {
          const result = await operation(...args);
          const duration = Date.now() - startTime;
          
          // Cache result
          if (cache.size >= options.maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey!);
          }
          
          cache.set(key, {
            value: result,
            timestamp: now
          });
          
          this.updateMetrics('caching', duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          this.updateMetrics('caching', duration, false);
          throw error;
        }
      }
    };
  }

  /**
   * Create batch strategy for processing multiple operations
   */
  createBatchStrategy(options: BatchStrategyOptions): BatchStrategy {
    return {
      execute: async <T>(operations: (() => Promise<T>)[]): Promise<T[]> => {
        const results: T[] = [];
        
        for (let i = 0; i < operations.length; i += options.batchSize) {
          const batch = operations.slice(i, i + options.batchSize);
          const startTime = Date.now();
          
          try {
            const batchResults = await Promise.allSettled(
              batch.map(operation => operation())
            );
            
            const allResults = batchResults.map(result => {
              if (result.status === 'fulfilled') {
                return result.value;
              } else {
                return result.reason;
              }
            });
            
            results.push(...allResults);
            
            const duration = Date.now() - startTime;
            this.updateMetrics('batch', duration, true);
            
            if (options.delay > 0 && i + options.batchSize < operations.length) {
              await new Promise(resolve => setTimeout(resolve, options.delay));
            }
          } catch (error) {
            const duration = Date.now() - startTime;
            this.updateMetrics('batch', duration, false);
            throw error;
          }
        }
        
        return results;
      }
    };
  }

  /**
   * Create retry strategy for handling failures
   */
  createRetryStrategy(options: RetryStrategyOptions): PerformanceStrategy {
    return {
      execute: async <T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
        let lastError: Error;
        let delay = options.delay;
        
        for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
          const startTime = Date.now();
          
          try {
            const result = await operation(...args);
            const duration = Date.now() - startTime;
            this.updateMetrics('retry', duration, true);
            return result;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const duration = Date.now() - startTime;
            
            // Check if we should retry
            if (options.retryCondition && !options.retryCondition(lastError)) {
              this.updateMetrics('retry', duration, false);
              throw lastError;
            }
            
            if (attempt === options.maxRetries) {
              this.updateMetrics('retry', duration, false);
              throw lastError;
            }
            
            this.updateMetrics('retry', duration, false);
            
            if (delay > 0) {
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= options.backoffMultiplier;
            }
          }
        }
        
        throw lastError!;
      }
    };
  }

  /**
   * Create circuit breaker strategy for handling service failures
   */
  createCircuitBreakerStrategy(options: CircuitBreakerStrategyOptions): PerformanceStrategy {
    let state: 'closed' | 'open' | 'half-open' = 'closed';
    let failureCount = 0;
    let lastFailureTime = 0;
    let lastError: Error;
    
    return {
      execute: async <T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
        const now = Date.now();
        
        // Check if circuit should be reset
        if (state === 'open' && now - lastFailureTime > options.resetTimeout) {
          state = 'half-open';
          failureCount = 0;
        }
        
        // Reject if circuit is open
        if (state === 'open') {
          throw new Error('Circuit breaker is open');
        }
        
        const startTime = Date.now();
        
        try {
          const result = await operation(...args);
          const duration = Date.now() - startTime;
          
          // Reset circuit on success
          if (state === 'half-open') {
            state = 'closed';
            failureCount = 0;
          }
          
          this.updateMetrics('circuit-breaker', duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Check if error should be counted as failure
          if (!options.failureCondition || options.failureCondition(lastError)) {
            failureCount++;
            lastFailureTime = now;
            
            if (failureCount >= options.failureThreshold) {
              state = 'open';
              logWarn('Circuit breaker opened due to failures');
            }
          }
          
          this.updateMetrics('circuit-breaker', duration, false);
          throw lastError;
        }
      }
    };
  }

  /**
   * Create throttle strategy for rate limiting
   */
  createThrottleStrategy(options: ThrottleStrategyOptions): PerformanceStrategy {
    const requests: number[] = [];
    
    return {
      execute: async <T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
        const now = Date.now();
        
        // Remove old requests outside the window
        while (requests.length > 0 && (requests[0] ?? 0) <= now - options.windowMs) {
          requests.shift();
        }
        
        // Check if we're within rate limit
        if (requests.length >= options.rateLimit) {
          const waitTime = (requests[0] ?? 0) + options.windowMs - now;
          if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Remove expired requests after waiting
            while (requests.length > 0 && (requests[0] ?? 0) <= Date.now() - options.windowMs) {
              requests.shift();
            }
          }
        }
        
        requests.push(now);
        
        const startTime = Date.now();
        
        try {
          const result = await operation(...args);
          const duration = Date.now() - startTime;
          this.updateMetrics('throttle', duration, true);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          this.updateMetrics('throttle', duration, false);
          throw error;
        }
      }
    };
  }

  /**
   * Compose multiple strategies
   */
  composeStrategies(strategies: PerformanceStrategy[]): PerformanceStrategy {
    return {
      execute: async <T>(operation: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
        let currentOperation = operation;
        
        // Apply strategies in reverse order (innermost first)
        for (let i = strategies.length - 1; i >= 0; i--) {
          const strategy = strategies[i];
          if (strategy) {
            const wrappedOperation = currentOperation;
            
            currentOperation = async (...args: any[]) => {
              return await strategy.execute(wrappedOperation, ...args);
            };
          }
        }
        
        return await currentOperation(...args);
      }
    };
  }

  /**
   * Select appropriate strategy based on context
   */
  selectStrategy(context: StrategyContext): PerformanceStrategy {
    switch (context.operationType) {
      case 'cache':
        return this.createCachingStrategy({
          ttl: 60000,
          maxSize: 1000
        });
      
      case 'network':
        return this.createRetryStrategy({
          maxRetries: 3,
          delay: 1000,
          backoffMultiplier: 2
        });
      
      case 'batch':
        return this.createBatchStrategy({
          batchSize: 10,
          delay: 100
        }) as any;
      
      case 'adaptive':
        return this.createAdaptiveStrategy({
          fastThreshold: 100,
          slowThreshold: 1000
        });
      
      default:
        return this.createRetryStrategy({
          maxRetries: 1,
          delay: 0,
          backoffMultiplier: 1
        });
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Map<string, StrategyMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get usage statistics
   */
  getUsageStatistics(): UsageStatistics {
    this.updateUsageStats();
    return { ...this.usageStats };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.usageStats = {
      totalExecutions: 0,
      successRate: 0,
      averageLatency: 0,
      strategies: {}
    };
  }

  /**
   * Update metrics for a strategy
   */
  private updateMetrics(strategyName: string, latency: number, success: boolean): void {
    if (!this.metrics.has(strategyName)) {
      this.metrics.set(strategyName, {
        executions: 0,
        successes: 0,
        failures: 0,
        averageLatency: 0,
        totalLatency: 0
      });
    }
    
    const metrics = this.metrics.get(strategyName)!;
    metrics.executions++;
    metrics.totalLatency += latency;
    metrics.averageLatency = metrics.totalLatency / metrics.executions;
    
    if (success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(): void {
    let totalExecutions = 0;
    let totalSuccesses = 0;
    let totalLatency = 0;
    
    for (const [name, metrics] of this.metrics) {
      totalExecutions += metrics.executions;
      totalSuccesses += metrics.successes;
      totalLatency += metrics.totalLatency;
      
      this.usageStats.strategies[name] = { ...metrics };
    }
    
    this.usageStats.totalExecutions = totalExecutions;
    this.usageStats.successRate = totalExecutions > 0 ? totalSuccesses / totalExecutions : 0;
    this.usageStats.averageLatency = totalExecutions > 0 ? totalLatency / totalExecutions : 0;
  }
}

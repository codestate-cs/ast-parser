export interface PerformanceUtilsOptions {
  enableCaching?: boolean;
  maxCacheSize?: number;
  enableProfiling?: boolean;
}

export interface BenchmarkResult {
  name: string;
  duration: number;
  memoryUsage: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface PerformanceMetrics {
  name: string;
  duration: number;
  memoryUsage: number;
}

export interface PerformanceAnalysis {
  averageDuration: number;
  totalDuration: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  slowestOperation?: string;
  fastestOperation?: string;
}

export interface Bottleneck {
  name: string;
  type: 'duration' | 'memory';
  value: number;
  threshold: number;
}

export interface OptimizationSuggestion {
  type: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  estimatedImprovement?: number;
}

/**
 * Performance utilities for optimization and monitoring
 */
export class PerformanceUtils {
  private options: Required<PerformanceUtilsOptions>;
  private cacheMap: Map<string, { value: any; timestamp: number; ttl: number }>;
  private metrics: PerformanceMetrics[];

  constructor(options: PerformanceUtilsOptions = {}) {
    this.options = {
      enableCaching: options.enableCaching ?? true,
      maxCacheSize: options.maxCacheSize ?? 1000,
      enableProfiling: options.enableProfiling ?? true
    };
    this.cacheMap = new Map();
    this.metrics = [];
  }

  /**
   * Benchmark a function execution
   */
  async benchmark<T>(name: string, fn: () => T | Promise<T>): Promise<BenchmarkResult> {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();
    
    try {
      await fn();
      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();
      
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      const memoryUsage = endMemory.heapUsed - startMemory.heapUsed;
      
      const benchmarkResult: BenchmarkResult = {
        name,
        duration,
        memoryUsage,
        success: true,
        timestamp: new Date()
      };
      
      if (this.options.enableProfiling) {
        this.metrics.push({
          name,
          duration,
          memoryUsage: Math.abs(memoryUsage)
        });
      }
      
      return benchmarkResult;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      return {
        name,
        duration,
        memoryUsage: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    immediate: boolean = false
  ): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const debounced = ((...args: Parameters<T>) => {
      const callNow = immediate && !timeoutId;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (!immediate) {
          fn(...args);
        }
      }, delay);
      
      if (callNow) {
        fn(...args);
      }
    }) as T & { cancel: () => void };
    
    debounced.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    return debounced;
  }

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T {
    let lastCall = 0;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn(...args);
      }
    }) as T;
  }

  /**
   * Memoize function results
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    maxSize: number = this.options.maxCacheSize
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = fn(...args);
      
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Retry failed operations
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Batch operations for better performance
   */
  async batch<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 10
  ): Promise<(T | Error)[]> {
    const results: (T | Error)[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(operation => operation())
      );
      
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      ));
    }
    
    return results;
  }

  /**
   * Cache function results with TTL
   */
  cacheFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    ttl: number = 60000,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    return (async (...args: Parameters<T>) => {
      if (!this.options.enableCaching) {
        return await fn(...args);
      }
      
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const now = Date.now();
      
      // Check cache
      if (this.cacheMap.has(key)) {
        const cached = this.cacheMap.get(key)!;
        if (now - cached.timestamp < cached.ttl) {
          return cached.value;
        } else {
          this.cacheMap.delete(key);
        }
      }
      
      // Execute function and cache result
      const result = await fn(...args);
      
      if (this.cacheMap.size >= this.options.maxCacheSize) {
        const firstKey = this.cacheMap.keys().next().value;
        this.cacheMap.delete(firstKey);
      }
      
      this.cacheMap.set(key, {
        value: result,
        timestamp: now,
        ttl
      });
      
      return result;
    }) as T;
  }

  /**
   * Analyze performance metrics
   */
  analyzePerformance(metrics: PerformanceMetrics[]): PerformanceAnalysis {
    if (metrics.length === 0) {
      return {
        averageDuration: 0,
        totalDuration: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0
      };
    }
    
    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0);
    
    const slowest = metrics.reduce((max, m) => m.duration > max.duration ? m : max);
    const fastest = metrics.reduce((min, m) => m.duration < min.duration ? m : min);
    
    return {
      averageDuration: totalDuration / metrics.length,
      totalDuration,
      averageMemoryUsage: totalMemoryUsage / metrics.length,
      peakMemoryUsage: Math.max(...metrics.map(m => m.memoryUsage)),
      slowestOperation: slowest.name,
      fastestOperation: fastest.name
    };
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks(
    metrics: PerformanceMetrics[],
    durationThreshold: number = 1000,
    memoryThreshold: number = 100000000
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    
    for (const metric of metrics) {
      if (metric.duration > durationThreshold) {
        bottlenecks.push({
          name: metric.name,
          type: 'duration',
          value: metric.duration,
          threshold: durationThreshold
        });
      }
      
      if (metric.memoryUsage > memoryThreshold) {
        bottlenecks.push({
          name: metric.name,
          type: 'memory',
          value: metric.memoryUsage,
          threshold: memoryThreshold
        });
      }
    }
    
    return bottlenecks;
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(metrics: PerformanceMetrics[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    if (metrics.length === 0) {
      return suggestions;
    }
    
    const analysis = this.analyzePerformance(metrics);
    
    // Duration-based suggestions
    if (analysis.averageDuration > 1000) {
      suggestions.push({
        type: 'performance',
        description: 'Consider optimizing slow operations',
        impact: 'high',
        estimatedImprovement: 30
      });
    }
    
    // Memory-based suggestions
    if (analysis.peakMemoryUsage > 100000000) {
      suggestions.push({
        type: 'memory',
        description: 'Consider implementing memory optimization strategies',
        impact: 'medium',
        estimatedImprovement: 25
      });
    }
    
    // Cache suggestions
    if (analysis.averageDuration > 500) {
      suggestions.push({
        type: 'caching',
        description: 'Consider implementing caching for frequently accessed data',
        impact: 'high',
        estimatedImprovement: 50
      });
    }
    
    // Batch processing suggestions
    if (metrics.length > 100) {
      suggestions.push({
        type: 'batching',
        description: 'Consider implementing batch processing for bulk operations',
        impact: 'medium',
        estimatedImprovement: 20
      });
    }
    
    return suggestions;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cacheMap.size,
      maxSize: this.options.maxCacheSize,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cacheMap.clear();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cacheMap.clear();
    this.metrics = [];
  }
}

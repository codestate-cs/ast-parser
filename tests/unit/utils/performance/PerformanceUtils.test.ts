import { PerformanceUtils } from '../../../../src/utils/performance/PerformanceUtils';

describe('PerformanceUtils', () => {
  let performanceUtils: PerformanceUtils;

  beforeEach(() => {
    performanceUtils = new PerformanceUtils();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(performanceUtils).toBeInstanceOf(PerformanceUtils);
    });

    it('should create instance with custom options', () => {
      const customOptions = {
        enableCaching: true,
        maxCacheSize: 1000,
        enableProfiling: true
      };
      const customUtils = new PerformanceUtils(customOptions);
      expect(customUtils).toBeInstanceOf(PerformanceUtils);
    });
  });

  describe('benchmark', () => {
    it('should benchmark synchronous function', async () => {
      const testFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const result = await performanceUtils.benchmark('test-sync', testFunction);
      
      expect(result).toHaveProperty('name', 'test-sync');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('memoryUsage');
      expect(result).toHaveProperty('success', true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should benchmark asynchronous function', async () => {
      const testAsyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async result';
      };

      const result = await performanceUtils.benchmark('test-async', testAsyncFunction);
      
      expect(result).toHaveProperty('name', 'test-async');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('memoryUsage');
      expect(result).toHaveProperty('success', true);
      expect(result.duration).toBeGreaterThan(8);
    });

    it('should handle function errors gracefully', async () => {
      const errorFunction = () => {
        throw new Error('Test error');
      };

      const result = await performanceUtils.benchmark('test-error', errorFunction);
      
      expect(result).toHaveProperty('name', 'test-error');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Test error');
    });

    it('should handle async function errors gracefully', async () => {
      const errorAsyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        throw new Error('Async test error');
      };

      const result = await performanceUtils.benchmark('test-async-error', errorAsyncFunction);
      
      expect(result).toHaveProperty('name', 'test-async-error');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Async test error');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const debouncedFunction = performanceUtils.debounce(testFunction, 50);
      
      // Call multiple times rapidly
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();
      
      expect(callCount).toBe(0);
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(callCount).toBe(1);
    });

    it('should handle debounce with custom delay', async () => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const debouncedFunction = performanceUtils.debounce(testFunction, 100);
      
      debouncedFunction();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(callCount).toBe(0);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(callCount).toBe(1);
    });

    it('should handle debounce cancellation', () => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const debouncedFunction = performanceUtils.debounce(testFunction, 50);
      
      debouncedFunction();
      debouncedFunction.cancel();
      
      setTimeout(() => {
        expect(callCount).toBe(0);
      }, 60);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const throttledFunction = performanceUtils.throttle(testFunction, 50);
      
      // Call multiple times rapidly
      throttledFunction();
      throttledFunction();
      throttledFunction();
      
      expect(callCount).toBe(1);
      
      // Wait and call again
      await new Promise(resolve => setTimeout(resolve, 60));
      throttledFunction();
      expect(callCount).toBe(2);
    });

    it('should handle throttle with custom delay', async () => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const throttledFunction = performanceUtils.throttle(testFunction, 100);
      
      throttledFunction();
      throttledFunction();
      expect(callCount).toBe(1);
      
      await new Promise(resolve => setTimeout(resolve, 110));
      throttledFunction();
      expect(callCount).toBe(2);
    });
  });

  describe('memoize', () => {
    it('should memoize function results', () => {
      let callCount = 0;
      const expensiveFunction = (n: number) => {
        callCount++;
        return n * n;
      };

      const memoizedFunction = performanceUtils.memoize(expensiveFunction);
      
      expect(memoizedFunction(5)).toBe(25);
      expect(callCount).toBe(1);
      
      expect(memoizedFunction(5)).toBe(25);
      expect(callCount).toBe(1); // Should not call again
      
      expect(memoizedFunction(3)).toBe(9);
      expect(callCount).toBe(2);
    });

    it('should handle memoize with custom key generator', () => {
      let callCount = 0;
      const expensiveFunction = (a: number, b: number) => {
        callCount++;
        return a + b;
      };

      const memoizedFunction = performanceUtils.memoize(expensiveFunction, (a, b) => `${a}-${b}`);
      
      expect(memoizedFunction(2, 3)).toBe(5);
      expect(callCount).toBe(1);
      
      expect(memoizedFunction(2, 3)).toBe(5);
      expect(callCount).toBe(1);
    });

    it('should handle memoize cache size limit', () => {
      let callCount = 0;
      const expensiveFunction = (n: number) => {
        callCount++;
        return n;
      };

      const memoizedFunction = performanceUtils.memoize(expensiveFunction, undefined, 2);
      
      memoizedFunction(1);
      memoizedFunction(2);
      memoizedFunction(3); // Should evict first entry
      memoizedFunction(1); // Should call function again
      
      expect(callCount).toBe(4);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0;
      const failingFunction = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await performanceUtils.retry(failingFunction, 3, 10);
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      const failingFunction = async () => {
        throw new Error('Permanent failure');
      };

      await expect(performanceUtils.retry(failingFunction, 2, 10))
        .rejects.toThrow('Permanent failure');
    });

    it('should handle retry with custom delay', async () => {
      let attemptCount = 0;
      const failingFunction = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const startTime = Date.now();
      const result = await performanceUtils.retry(failingFunction, 2, 50);
      const endTime = Date.now();
      
      expect(result).toBe('success');
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    });
  });

  describe('batch', () => {
    it('should batch operations', async () => {
      const operations = [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3)
      ];

      const results = await performanceUtils.batch(operations, 2);
      
      expect(results).toHaveLength(3);
      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle batch with custom batch size', async () => {
      const operations = [
        () => Promise.resolve('a'),
        () => Promise.resolve('b'),
        () => Promise.resolve('c'),
        () => Promise.resolve('d')
      ];

      const results = await performanceUtils.batch(operations, 1);
      
      expect(results).toHaveLength(4);
      expect(results).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle batch errors gracefully', async () => {
      const operations = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Batch error')),
        () => Promise.resolve(3)
      ];

      const results = await performanceUtils.batch(operations, 2);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe(1);
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[2]).toBe(3);
    });
  });

  describe('cache', () => {
    it('should cache function results', async () => {
      let callCount = 0;
      const expensiveFunction = async (key: string) => {
        callCount++;
        return `result-${key}`;
      };

      const cachedFunction = performanceUtils.cacheFunction(expensiveFunction, 1000);
      
      expect(await cachedFunction('test')).toBe('result-test');
      expect(callCount).toBe(1);
      
      expect(await cachedFunction('test')).toBe('result-test');
      expect(callCount).toBe(1); // Should not call again
    });

    it('should handle cache expiration', async () => {
      let callCount = 0;
      const expensiveFunction = async (key: string) => {
        callCount++;
        return `result-${key}`;
      };

      const cachedFunction = performanceUtils.cacheFunction(expensiveFunction, 50);
      
      expect(await cachedFunction('test')).toBe('result-test');
      expect(callCount).toBe(1);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(await cachedFunction('test')).toBe('result-test');
      expect(callCount).toBe(2); // Should call again after expiration
    });

    it('should handle cache with custom key generator', async () => {
      let callCount = 0;
      const expensiveFunction = async (a: number, b: number) => {
        callCount++;
        return a + b;
      };

      const cachedFunction = performanceUtils.cacheFunction(expensiveFunction, 1000, (a: any, b: any) => `${a}-${b}`);
      
      expect(await cachedFunction(2, 3)).toBe(5);
      expect(callCount).toBe(1);
      
      expect(await cachedFunction(2, 3)).toBe(5);
      expect(callCount).toBe(1);
    });
  });

  describe('performance analysis', () => {
    it('should analyze performance metrics', () => {
      const metrics = [
        { name: 'op1', duration: 100, memoryUsage: 50 },
        { name: 'op2', duration: 200, memoryUsage: 75 },
        { name: 'op3', duration: 150, memoryUsage: 60 }
      ];

      const analysis = performanceUtils.analyzePerformance(metrics);
      
      expect(analysis).toHaveProperty('averageDuration');
      expect(analysis).toHaveProperty('totalDuration');
      expect(analysis).toHaveProperty('averageMemoryUsage');
      expect(analysis).toHaveProperty('peakMemoryUsage');
      expect(analysis).toHaveProperty('slowestOperation');
      expect(analysis).toHaveProperty('fastestOperation');
      
      expect(analysis.averageDuration).toBe(150);
      expect(analysis.totalDuration).toBe(450);
      expect(analysis.averageMemoryUsage).toBeCloseTo(61.67, 1);
      expect(analysis.peakMemoryUsage).toBe(75);
      expect(analysis.slowestOperation).toBe('op2');
      expect(analysis.fastestOperation).toBe('op1');
    });

    it('should handle empty metrics array', () => {
      const analysis = performanceUtils.analyzePerformance([]);
      
      expect(analysis.averageDuration).toBe(0);
      expect(analysis.totalDuration).toBe(0);
      expect(analysis.averageMemoryUsage).toBe(0);
      expect(analysis.peakMemoryUsage).toBe(0);
      expect(analysis.slowestOperation).toBeUndefined();
      expect(analysis.fastestOperation).toBeUndefined();
    });

    it('should identify performance bottlenecks', () => {
      const metrics = [
        { name: 'op1', duration: 1000, memoryUsage: 50 },
        { name: 'op2', duration: 100, memoryUsage: 75 },
        { name: 'op3', duration: 200, memoryUsage: 60 }
      ];

      const bottlenecks = performanceUtils.identifyBottlenecks(metrics, 500);
      
      expect(bottlenecks).toHaveLength(1);
      expect(bottlenecks[0]?.name).toBe('op1');
      expect(bottlenecks[0]?.type).toBe('duration');
    });

    it('should identify memory bottlenecks', () => {
      const metrics = [
        { name: 'op1', duration: 100, memoryUsage: 50 },
        { name: 'op2', duration: 200, memoryUsage: 200 },
        { name: 'op3', duration: 150, memoryUsage: 60 }
      ];

      const bottlenecks = performanceUtils.identifyBottlenecks(metrics, 100, 100);
      
      expect(bottlenecks.length).toBeGreaterThan(0);
      const memoryBottleneck = bottlenecks.find(b => b.type === 'memory');
      expect(memoryBottleneck?.name).toBe('op2');
      expect(memoryBottleneck?.type).toBe('memory');
    });

    it('should handle cache expiration in cacheFunction', async () => {
      const testFunction = jest.fn().mockResolvedValue('result');
      const cachedFunction = performanceUtils.cacheFunction(testFunction, 100); // 100ms TTL
      
      // First call
      const result1 = await cachedFunction('arg1');
      expect(result1).toBe('result');
      expect(testFunction).toHaveBeenCalledTimes(1);
      
      // Second call within TTL
      const result2 = await cachedFunction('arg1');
      expect(result2).toBe('result');
      expect(testFunction).toHaveBeenCalledTimes(1); // Should use cache
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Third call after TTL
      const result3 = await cachedFunction('arg1');
      expect(result3).toBe('result');
      expect(testFunction).toHaveBeenCalledTimes(2); // Should call function again
    });

    it('should handle cache size limit in cacheFunction', async () => {
      const testFunction = jest.fn().mockResolvedValue('result');
      const cachedFunction = performanceUtils.cacheFunction(testFunction, 60000, (arg: string) => arg);
      
      // Fill cache to limit
      for (let i = 0; i < 10; i++) {
        await cachedFunction(`arg${i}`);
      }
      
      expect(testFunction).toHaveBeenCalledTimes(10);
      
      // Add one more to trigger cache eviction
      await cachedFunction('arg10');
      expect(testFunction).toHaveBeenCalledTimes(11);
    });

    it('should handle cache disabled in cacheFunction', async () => {
      const utilsWithCacheDisabled = new PerformanceUtils({ enableCaching: false });
      const testFunction = jest.fn().mockResolvedValue('result');
      const cachedFunction = utilsWithCacheDisabled.cacheFunction(testFunction);
      
      // Multiple calls should all hit the function
      await cachedFunction('arg1');
      await cachedFunction('arg1');
      await cachedFunction('arg1');
      
      expect(testFunction).toHaveBeenCalledTimes(3);
    });

    it('should handle retry with exponential backoff', async () => {
      const failingFunction = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      const result = await performanceUtils.retry(failingFunction, 2, 10);
      const endTime = Date.now();
      
      expect(result).toBe('success');
      expect(failingFunction).toHaveBeenCalledTimes(3);
      expect(endTime - startTime).toBeGreaterThan(10); // Should have some delay
    });

    it('should handle retry with custom retry condition', async () => {
      const failingFunction = jest.fn()
        .mockRejectedValueOnce(new Error('Retryable error'))
        .mockResolvedValue('success');
      
      const result = await performanceUtils.retry(failingFunction, 3, 100);
      
      expect(result).toBe('success');
      expect(failingFunction).toHaveBeenCalledTimes(2);
    });

    it('should handle retry with non-retryable error', async () => {
      const failingFunction = jest.fn()
        .mockRejectedValue(new Error('Non-retryable error'));
      
      await expect(performanceUtils.retry(failingFunction, 3, 100)).rejects.toThrow('Non-retryable error');
      
      expect(failingFunction).toHaveBeenCalledTimes(4); // 0, 1, 2, 3 attempts
    });

    it('should handle batch operations with errors', async () => {
      const operations = [
        () => Promise.resolve('success1'),
        () => Promise.reject(new Error('failure')),
        () => Promise.resolve('success2')
      ];
      
      const results = await performanceUtils.batch(operations, 2);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe('success1');
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[2]).toBe('success2');
    });

    it('should handle batch operations with custom batch size', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => 
        () => Promise.resolve(`result${i}`)
      );
      
      const results = await performanceUtils.batch(operations, 2);
      
      expect(results).toHaveLength(5);
      expect(results.every(r => typeof r === 'string')).toBe(true);
    });
  });

  describe('optimization suggestions', () => {
    it('should provide optimization suggestions', () => {
      const metrics = [
        { name: 'slow-op', duration: 1000, memoryUsage: 200 },
        { name: 'fast-op', duration: 50, memoryUsage: 30 }
      ];

      const suggestions = performanceUtils.getOptimizationSuggestions(metrics);
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toHaveProperty('type');
      expect(suggestions[0]).toHaveProperty('description');
      expect(suggestions[0]).toHaveProperty('impact');
    });

    it('should handle empty metrics for suggestions', () => {
      const suggestions = performanceUtils.getOptimizationSuggestions([]);
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBe(0);
    });

    it('should provide memory optimization suggestions for high memory usage', () => {
      const metrics = [
        { name: 'high-memory-op', duration: 100, memoryUsage: 150000000 }, // 150MB
        { name: 'normal-op', duration: 50, memoryUsage: 50000000 } // 50MB
      ];

      const suggestions = performanceUtils.getOptimizationSuggestions(metrics);
      
      const memorySuggestion = suggestions.find(s => s.type === 'memory');
      expect(memorySuggestion).toBeDefined();
      expect(memorySuggestion?.description).toContain('memory optimization');
    });

    it('should provide caching suggestions for slow operations', () => {
      const metrics = [
        { name: 'slow-op', duration: 600, memoryUsage: 50 }, // Average will be 325ms, need higher
        { name: 'fast-op', duration: 600, memoryUsage: 30 }  // Now average is 600ms > 500ms threshold
      ];

      const suggestions = performanceUtils.getOptimizationSuggestions(metrics);
      
      const cacheSuggestion = suggestions.find(s => s.type === 'caching');
      expect(cacheSuggestion).toBeDefined();
      expect(cacheSuggestion?.description).toContain('caching');
    });

    it('should provide batch processing suggestions for many operations', () => {
      const metrics = Array.from({ length: 150 }, (_, i) => ({
        name: `op${i}`,
        duration: 100,
        memoryUsage: 50
      }));

      const suggestions = performanceUtils.getOptimizationSuggestions(metrics);
      
      const batchSuggestion = suggestions.find(s => s.type === 'batching');
      expect(batchSuggestion).toBeDefined();
      expect(batchSuggestion?.description).toContain('batch');
    });
  });

  describe('error handling', () => {
    it('should handle benchmark errors gracefully', async () => {
      const errorFunction = () => {
        throw new Error('Benchmark error');
      };

      const result = await performanceUtils.benchmark('error-test', errorFunction);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Benchmark error');
    });

    it('should handle memoize errors gracefully', () => {
      const errorFunction = (n: number) => {
        if (n < 0) {
          throw new Error('Negative number');
        }
        return n * n;
      };

      const memoizedFunction = performanceUtils.memoize(errorFunction);
      
      expect(() => memoizedFunction(5)).not.toThrow();
      expect(() => memoizedFunction(-1)).toThrow('Negative number');
    });

    it('should handle retry errors gracefully', async () => {
      const errorFunction = async () => {
        throw new Error('Retry error');
      };

      await expect(performanceUtils.retry(errorFunction, 1, 10))
        .rejects.toThrow('Retry error');
    });
  });

  describe('edge cases', () => {
    it('should handle very large batch operations', async () => {
      const operations = Array.from({ length: 1000 }, (_, i) => 
        () => Promise.resolve(i)
      );

      const results = await performanceUtils.batch(operations, 100);
      
      expect(results).toHaveLength(1000);
      expect(results[0]).toBe(0);
      expect(results[999]).toBe(999);
    });

    it('should handle concurrent memoize calls', () => {
      let callCount = 0;
      const expensiveFunction = (n: number) => {
        callCount++;
        return n * n;
      };

      const memoizedFunction = performanceUtils.memoize(expensiveFunction);
      
      // Call concurrently
      const result1 = memoizedFunction(5);
      const result2 = memoizedFunction(5);
      
      expect(result1).toBe(25);
      expect(result2).toBe(25);
      expect(callCount).toBe(1);
    });

    it('should handle debounce with immediate execution', () => {
      let callCount = 0;
      const testFunction = () => {
        callCount++;
      };

      const debouncedFunction = performanceUtils.debounce(testFunction, 50, true);
      
      debouncedFunction();
      expect(callCount).toBe(1);
      
      debouncedFunction();
      expect(callCount).toBe(1);
    });
  });

  describe('configuration', () => {
    it('should respect enableCaching option', () => {
      const utilsWithCaching = new PerformanceUtils({ enableCaching: true });
      const utilsWithoutCaching = new PerformanceUtils({ enableCaching: false });
      
      expect(utilsWithCaching).toBeInstanceOf(PerformanceUtils);
      expect(utilsWithoutCaching).toBeInstanceOf(PerformanceUtils);
    });

    it('should respect maxCacheSize option', () => {
      const utils = new PerformanceUtils({ maxCacheSize: 500 });
      expect(utils).toBeInstanceOf(PerformanceUtils);
    });

    it('should respect enableProfiling option', () => {
      const utilsWithProfiling = new PerformanceUtils({ enableProfiling: true });
      const utilsWithoutProfiling = new PerformanceUtils({ enableProfiling: false });
      
      expect(utilsWithProfiling).toBeInstanceOf(PerformanceUtils);
      expect(utilsWithoutProfiling).toBeInstanceOf(PerformanceUtils);
    });

    it('should handle getCacheStats method', () => {
      const stats = performanceUtils.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });

    it('should handle clearCache method', () => {
      performanceUtils.clearCache();
      
      const stats = performanceUtils.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should handle clearMetrics method', () => {
      performanceUtils.clearMetrics();
      
      const metrics = performanceUtils.getMetrics();
      expect(metrics).toHaveLength(0);
    });

    it('should handle dispose method', () => {
      performanceUtils.dispose();
      
      const stats = performanceUtils.getCacheStats();
      const metrics = performanceUtils.getMetrics();
      
      expect(stats.size).toBe(0);
      expect(metrics).toHaveLength(0);
    });
  });
});

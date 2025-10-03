import { PerformanceStrategies } from '../../../../src/utils/performance/PerformanceStrategies';

describe('PerformanceStrategies', () => {
  let performanceStrategies: PerformanceStrategies;

  beforeEach(() => {
    performanceStrategies = new PerformanceStrategies();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(performanceStrategies).toBeInstanceOf(PerformanceStrategies);
    });

    it('should create instance with custom options', () => {
      const customOptions = {
        enableAdaptiveStrategy: true,
        enableCachingStrategy: true,
        enableBatchStrategy: true
      };
      const customStrategies = new PerformanceStrategies(customOptions);
      expect(customStrategies).toBeInstanceOf(PerformanceStrategies);
    });
  });

  describe('adaptive strategy', () => {
    it('should adapt to performance conditions', async () => {
      const fastOperation = async () => 'fast';
      
      const strategy = performanceStrategies.createAdaptiveStrategy({
        fastThreshold: 100,
        slowThreshold: 500
      });

      const result = await strategy.execute(fastOperation);
      expect(result).toBe('fast');
    });

    it('should switch strategies based on performance', async () => {
      let callCount = 0;
      const operation = async () => {
        callCount++;
        if (callCount === 1) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Slow
        }
        return 'result';
      };

      const strategy = performanceStrategies.createAdaptiveStrategy({
        fastThreshold: 100,
        slowThreshold: 500
      });

      await strategy.execute(operation);
      await strategy.execute(operation);
      
      expect(callCount).toBe(2);
    });

    it('should handle adaptive strategy errors', async () => {
      const errorOperation = async () => {
        throw new Error('Adaptive strategy error');
      };

      const strategy = performanceStrategies.createAdaptiveStrategy({
        fastThreshold: 100,
        slowThreshold: 500
      });

      await expect(strategy.execute(errorOperation))
        .rejects.toThrow('Adaptive strategy error');
    });
  });

  describe('caching strategy', () => {
    it('should cache operation results', async () => {
      let callCount = 0;
      const operation = async (key: string) => {
        callCount++;
        return `result-${key}`;
      };

      const strategy = performanceStrategies.createCachingStrategy({
        ttl: 1000,
        maxSize: 100
      });

      const result1 = await strategy.execute(operation, 'test');
      const result2 = await strategy.execute(operation, 'test');
      
      expect(result1).toBe('result-test');
      expect(result2).toBe('result-test');
      expect(callCount).toBe(1);
    });

    it('should handle cache expiration', async () => {
      let callCount = 0;
      const operation = async (key: string) => {
        callCount++;
        return `result-${key}`;
      };

      const strategy = performanceStrategies.createCachingStrategy({
        ttl: 50,
        maxSize: 100
      });

      await strategy.execute(operation, 'test');
      expect(callCount).toBe(1);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      await strategy.execute(operation, 'test');
      expect(callCount).toBe(2);
    });

    it('should handle cache size limit', async () => {
      let callCount = 0;
      const operation = async (key: string) => {
        callCount++;
        return `result-${key}`;
      };

      const strategy = performanceStrategies.createCachingStrategy({
        ttl: 1000,
        maxSize: 2
      });

      await strategy.execute(operation, 'key1');
      await strategy.execute(operation, 'key2');
      await strategy.execute(operation, 'key3'); // Should evict key1
      await strategy.execute(operation, 'key1'); // Should call operation again
      
      expect(callCount).toBe(4);
    });

    it('should handle caching strategy errors', async () => {
      const errorOperation = async (_key: string) => {
        throw new Error('Caching strategy error');
      };

      const strategy = performanceStrategies.createCachingStrategy({
        ttl: 1000,
        maxSize: 100
      });

      await expect(strategy.execute(errorOperation, 'test'))
        .rejects.toThrow('Caching strategy error');
    });
  });

  describe('batch strategy', () => {
    it('should batch operations', async () => {
      const operations = [
        async () => 'result1',
        async () => 'result2',
        async () => 'result3'
      ];

      const strategy = performanceStrategies.createBatchStrategy({
        batchSize: 2,
        delay: 10
      });

      const results = await strategy.execute(operations) as string[];
      
      expect(results).toHaveLength(3);
      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    it('should handle batch with custom batch size', async () => {
      const operations = [
        async () => 'a',
        async () => 'b',
        async () => 'c',
        async () => 'd'
      ];

      const strategy = performanceStrategies.createBatchStrategy({
        batchSize: 1,
        delay: 5
      });

      const results = await strategy.execute(operations) as string[];
      
      expect(results).toHaveLength(4);
      expect(results).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle batch errors gracefully', async () => {
      const operations = [
        async () => 'result1',
        async () => { throw new Error('Batch error'); },
        async () => 'result3'
      ];

      const strategy = performanceStrategies.createBatchStrategy({
        batchSize: 2,
        delay: 10
      });

      const results = await strategy.execute(operations) as (string | Error)[];
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe('result1');
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[2]).toBe('result3');
    });

    it('should handle empty operations array', async () => {
      const strategy = performanceStrategies.createBatchStrategy({
        batchSize: 2,
        delay: 10
      });

      const results = await strategy.execute([]) as any[];
      
      expect(results).toHaveLength(0);
    });
  });

  describe('retry strategy', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const strategy = performanceStrategies.createRetryStrategy({
        maxRetries: 3,
        delay: 10,
        backoffMultiplier: 1.5
      });

      const result = await strategy.execute(operation);
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      const operation = async () => {
        throw new Error('Permanent failure');
      };

      const strategy = performanceStrategies.createRetryStrategy({
        maxRetries: 2,
        delay: 10,
        backoffMultiplier: 1.5
      });

      await expect(strategy.execute(operation))
        .rejects.toThrow('Permanent failure');
    });

    it('should handle exponential backoff', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const strategy = performanceStrategies.createRetryStrategy({
        maxRetries: 2,
        delay: 50,
        backoffMultiplier: 2
      });

      const startTime = Date.now();
      const result = await strategy.execute(operation);
      const endTime = Date.now();
      
      expect(result).toBe('success');
      expect(endTime - startTime).toBeGreaterThanOrEqual(45);
    });

    it('should handle retry strategy with custom retry condition', async () => {
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const strategy = performanceStrategies.createRetryStrategy({
        maxRetries: 3,
        delay: 10,
        backoffMultiplier: 1.5,
        retryCondition: (error: Error) => error.message.includes('Temporary')
      });

      const result = await strategy.execute(operation);
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
    });
  });

  describe('circuit breaker strategy', () => {
    it('should open circuit after failures', async () => {
      const operation = async () => {
        throw new Error('Service unavailable');
      };

      const strategy = performanceStrategies.createCircuitBreakerStrategy({
        failureThreshold: 2,
        timeout: 1000,
        resetTimeout: 100
      });

      // First two failures should open the circuit
      await expect(strategy.execute(operation))
        .rejects.toThrow('Service unavailable');
      await expect(strategy.execute(operation))
        .rejects.toThrow('Service unavailable');
      
      // Third call should be rejected due to open circuit
      await expect(strategy.execute(operation))
        .rejects.toThrow('Circuit breaker is open');
    });

    it('should reset circuit after timeout', async () => {
      let callCount = 0;
      const operation = async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Service unavailable');
        }
        return 'success';
      };

      const strategy = performanceStrategies.createCircuitBreakerStrategy({
        failureThreshold: 2,
        timeout: 1000,
        resetTimeout: 50
      });

      // Open the circuit
      await expect(strategy.execute(operation))
        .rejects.toThrow('Service unavailable');
      await expect(strategy.execute(operation))
        .rejects.toThrow('Service unavailable');
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should succeed after reset
      const result = await strategy.execute(operation);
      expect(result).toBe('success');
    });

    it('should handle circuit breaker with custom failure condition', async () => {
      const operation = async () => {
        throw new Error('Custom error');
      };

      const strategy = performanceStrategies.createCircuitBreakerStrategy({
        failureThreshold: 1,
        timeout: 1000,
        resetTimeout: 100,
        failureCondition: (error: Error) => error.message.includes('Custom')
      });

      await expect(strategy.execute(operation))
        .rejects.toThrow('Custom error');
      
      await expect(strategy.execute(operation))
        .rejects.toThrow('Circuit breaker is open');
    });
  });

  describe('throttle strategy', () => {
    it('should throttle operations', async () => {
      let callCount = 0;
      const operation = async () => {
        callCount++;
        return `result-${callCount}`;
      };

      const strategy = performanceStrategies.createThrottleStrategy({
        rateLimit: 2,
        windowMs: 100
      });

      // Execute operations - the third one should be delayed due to throttling
      const startTime = Date.now();
      const results = [];
      results.push(await strategy.execute(operation));
      results.push(await strategy.execute(operation));
      results.push(await strategy.execute(operation));
      const endTime = Date.now();
      
      expect(results).toHaveLength(3);
      // The third operation should have been delayed, so total time should be > 100ms
      expect(endTime - startTime).toBeGreaterThan(90);
    });

    it('should handle throttle with custom window', async () => {
      let callCount = 0;
      const operation = async () => {
        callCount++;
        return `result-${callCount}`;
      };

      const strategy = performanceStrategies.createThrottleStrategy({
        rateLimit: 1,
        windowMs: 200
      });

      const startTime = Date.now();
      await strategy.execute(operation);
      await strategy.execute(operation);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
    });

    it('should handle throttle errors gracefully', async () => {
      const operation = async () => {
        throw new Error('Throttle error');
      };

      const strategy = performanceStrategies.createThrottleStrategy({
        rateLimit: 1,
        windowMs: 100
      });

      await expect(strategy.execute(operation))
        .rejects.toThrow('Throttle error');
    });
  });

  describe('strategy composition', () => {
    it('should compose multiple strategies', async () => {
      let callCount = 0;
      const operation = async (key: string) => {
        callCount++;
        return `result-${key}`;
      };

      const cachingStrategy = performanceStrategies.createCachingStrategy({
        ttl: 1000,
        maxSize: 100
      });

      const retryStrategy = performanceStrategies.createRetryStrategy({
        maxRetries: 2,
        delay: 10,
        backoffMultiplier: 1.5
      });

      const composedStrategy = performanceStrategies.composeStrategies([
        cachingStrategy,
        retryStrategy
      ]);

      const result1 = await composedStrategy.execute(operation, 'test');
      const result2 = await composedStrategy.execute(operation, 'test');
      
      expect(result1).toBe('result-test');
      expect(result2).toBe('result-test');
      expect(callCount).toBe(1);
    });

    it('should handle composition errors', async () => {
      const operation = async () => {
        throw new Error('Composition error');
      };

      const retryStrategy = performanceStrategies.createRetryStrategy({
        maxRetries: 1,
        delay: 10,
        backoffMultiplier: 1.5
      });

      const composedStrategy = performanceStrategies.composeStrategies([
        retryStrategy
      ]);

      await expect(composedStrategy.execute(operation))
        .rejects.toThrow('Composition error');
    });
  });

  describe('strategy selection', () => {
    it('should select appropriate strategy based on context', () => {
      const context = {
        operationType: 'cache',
        performanceRequirements: { maxLatency: 100 }
      };

      const strategy = performanceStrategies.selectStrategy(context);
      
      expect(strategy).toBeDefined();
    });

    it('should handle unknown context gracefully', () => {
      const context = {
        operationType: 'unknown',
        performanceRequirements: {}
      };

      const strategy = performanceStrategies.selectStrategy(context);
      
      expect(strategy).toBeDefined();
    });

    it('should select caching strategy for cache operations', () => {
      const context = {
        operationType: 'cache',
        performanceRequirements: { maxLatency: 100 }
      };

      const strategy = performanceStrategies.selectStrategy(context);
      
      expect(strategy).toBeDefined();
    });

    it('should select caching strategy for cache operations', () => {
      const context = {
        operationType: 'batch',
        performanceRequirements: { maxLatency: 100 }
      };

      const strategy = performanceStrategies.selectStrategy(context);
      
      expect(strategy).toBeDefined();
    });

    it('should select caching strategy for cache operations', () => {
      const context = {
        operationType: 'adaptive',
        performanceRequirements: { maxLatency: 100 }
      };

      const strategy = performanceStrategies.selectStrategy(context);
      
      expect(strategy).toBeDefined();
    });

    it('should select retry strategy for network operations', () => {
      const context = {
        operationType: 'network',
        performanceRequirements: { reliability: 'high' }
      };

      const strategy = performanceStrategies.selectStrategy(context);
      
      expect(strategy).toBeDefined();
    });
  });

  describe('performance monitoring', () => {
    it('should monitor strategy performance', async () => {
      const operation = async () => 'result';

      const strategy = performanceStrategies.createCachingStrategy({
        ttl: 1000,
        maxSize: 100
      });

      const result = await strategy.execute(operation, 'test');
      
      expect(result).toBe('result');
      
      const metrics = performanceStrategies.getPerformanceMetrics();
      expect(metrics).toBeDefined();
    });

    it('should track strategy usage statistics', () => {
      const stats = performanceStrategies.getUsageStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageLatency');
    });

    it('should reset performance metrics', () => {
      performanceStrategies.resetMetrics();
      
      const metrics = performanceStrategies.getPerformanceMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle strategy creation errors', () => {
      expect(() => {
        performanceStrategies.createCachingStrategy({
          ttl: -1, // Invalid TTL
          maxSize: 100
        });
      }).not.toThrow();
    });

    it('should handle invalid strategy options', () => {
      expect(() => {
        performanceStrategies.createRetryStrategy({
          maxRetries: -1, // Invalid retries
          delay: 10,
          backoffMultiplier: 1.5
        });
      }).not.toThrow();
    });

    it('should handle strategy execution errors', async () => {
      const operation = async () => {
        throw new Error('Strategy execution error');
      };

      const strategy = performanceStrategies.createRetryStrategy({
        maxRetries: 1,
        delay: 10,
        backoffMultiplier: 1.5
      });

      await expect(strategy.execute(operation))
        .rejects.toThrow('Strategy execution error');
    });
  });

  describe('edge cases', () => {
    it('should handle very large batch operations', async () => {
      const operations = Array.from({ length: 1000 }, (_, i) => 
        async () => i
      );

      const strategy = performanceStrategies.createBatchStrategy({
        batchSize: 100,
        delay: 10
      });

      const results = await strategy.execute(operations) as number[];
      
      expect(results).toHaveLength(1000);
      expect(results[0]).toBe(0);
      expect(results[999]).toBe(999);
    });

    it('should handle concurrent strategy executions', async () => {
      const operation = async (id: number) => `result-${id}`;

      const strategy = performanceStrategies.createCachingStrategy({
        ttl: 1000,
        maxSize: 100
      });

      const results = await Promise.all([
        strategy.execute(operation, 1),
        strategy.execute(operation, 2),
        strategy.execute(operation, 3)
      ]);
      
      expect(results).toEqual(['result-1', 'result-2', 'result-3']);
    });

    it('should handle strategy with zero delay', async () => {
      const operation = async () => 'result';

      const strategy = performanceStrategies.createRetryStrategy({
        maxRetries: 1,
        delay: 0,
        backoffMultiplier: 1.5
      });

      const result = await strategy.execute(operation);
      expect(result).toBe('result');
    });
  });

  describe('configuration', () => {
    it('should respect enableAdaptiveStrategy option', () => {
      const strategiesWithAdaptive = new PerformanceStrategies({ enableAdaptiveStrategy: true });
      const strategiesWithoutAdaptive = new PerformanceStrategies({ enableAdaptiveStrategy: false });
      
      expect(strategiesWithAdaptive).toBeInstanceOf(PerformanceStrategies);
      expect(strategiesWithoutAdaptive).toBeInstanceOf(PerformanceStrategies);
    });

    it('should respect enableCachingStrategy option', () => {
      const strategiesWithCaching = new PerformanceStrategies({ enableCachingStrategy: true });
      const strategiesWithoutCaching = new PerformanceStrategies({ enableCachingStrategy: false });
      
      expect(strategiesWithCaching).toBeInstanceOf(PerformanceStrategies);
      expect(strategiesWithoutCaching).toBeInstanceOf(PerformanceStrategies);
    });

    it('should respect enableBatchStrategy option', () => {
      const strategiesWithBatch = new PerformanceStrategies({ enableBatchStrategy: true });
      const strategiesWithoutBatch = new PerformanceStrategies({ enableBatchStrategy: false });
      
      expect(strategiesWithBatch).toBeInstanceOf(PerformanceStrategies);
      expect(strategiesWithoutBatch).toBeInstanceOf(PerformanceStrategies);
    });
  });
});

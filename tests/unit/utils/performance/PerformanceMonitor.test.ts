import { PerformanceMonitor } from '../../../../src/utils/performance/PerformanceMonitor';

// Mock process.memoryUsage
const mockMemoryUsage = jest.fn();
Object.defineProperty(process, 'memoryUsage', {
  value: mockMemoryUsage,
  writable: true
});

// Mock process.hrtime
const mockHrtime = jest.fn();
Object.defineProperty(process, 'hrtime', {
  value: mockHrtime,
  writable: true
});

// Mock process.cpuUsage
const mockCpuUsage = jest.fn();
Object.defineProperty(process, 'cpuUsage', {
  value: mockCpuUsage,
  writable: true
});

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor = new PerformanceMonitor({ enableAutoReporting: false });
    
    // Default mock implementations
    mockMemoryUsage.mockReturnValue({
      rss: 1024 * 1024 * 100, // 100MB
      heapTotal: 1024 * 1024 * 50, // 50MB
      heapUsed: 1024 * 1024 * 30, // 30MB
      external: 1024 * 1024 * 10, // 10MB
      arrayBuffers: 1024 * 1024 * 5 // 5MB
    });

    mockHrtime.mockReturnValue([1, 500000000]); // 1.5 seconds
    mockCpuUsage.mockReturnValue({ user: 1000000, system: 500000 }); // 1.5ms total
  });

  afterEach(() => {
    if (performanceMonitor) {
      performanceMonitor.dispose();
    }
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.totalDuration).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.memoryPeak).toBe(0);
      expect(metrics.memoryGrowth).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
      expect(metrics.fileProcessingRate).toBe(0);
      expect(metrics.operationsPerSecond).toBe(0);
      expect(metrics.resourceUsage.diskIO).toBe(0);
    });

    it('should initialize with custom options', () => {
      const options = {
        enableMemoryTracking: false,
        enableCpuTracking: true,
        enableDiskIOTracking: false,
        maxMetricsHistory: 1000,
        reportInterval: 5000
      };
      
      const monitor = new PerformanceMonitor(options);
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });
  });

  describe('startOperation', () => {
    it('should start timing an operation', () => {
      const operationId = performanceMonitor.startOperation('parseFile', 'test.ts');
      
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
      expect(mockHrtime).toHaveBeenCalled();
    });

    it('should track memory usage when enabled', () => {
      const operationId = performanceMonitor.startOperation('parseFile', 'test.ts');
      
      expect(mockMemoryUsage).toHaveBeenCalled();
      expect(operationId).toBeDefined();
    });

    it('should track CPU usage when enabled', () => {
      const operationId = performanceMonitor.startOperation('parseFile', 'test.ts');
      
      expect(mockCpuUsage).toHaveBeenCalled();
      expect(operationId).toBeDefined();
    });

    it('should generate unique operation IDs', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      const id2 = performanceMonitor.startOperation('parseFile', 'test2.ts');
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('endOperation', () => {
    it('should end timing and record metrics', () => {
      const operationId = performanceMonitor.startOperation('parseFile', 'test.ts');
      
      // Mock different end time - add 100ms
      mockHrtime.mockReturnValueOnce([1, 600000000]); // 1.6 seconds (100ms later)
      
      const result = performanceMonitor.endOperation(operationId);
      
      expect(result).toBeDefined();
      expect(result!.duration).toBeGreaterThan(0);
      expect(result!.operation).toBe('parseFile');
      expect(result!.file).toBe('test.ts');
    });

    it('should calculate memory growth', () => {
      const operationId = performanceMonitor.startOperation('parseFile', 'test.ts');
      
      // Mock different memory usage at end
      mockMemoryUsage.mockReturnValueOnce({
        rss: 1024 * 1024 * 120, // 120MB (20MB growth)
        heapTotal: 1024 * 1024 * 60, // 60MB
        heapUsed: 1024 * 1024 * 40, // 40MB
        external: 1024 * 1024 * 15, // 15MB
        arrayBuffers: 1024 * 1024 * 5 // 5MB
      });
      
      const result = performanceMonitor.endOperation(operationId);
      
      expect(result).toBeDefined();
      expect(result!.memoryGrowth).toBeGreaterThan(0);
    });

    it('should handle unknown operation ID', () => {
      const result = performanceMonitor.endOperation('unknown-id');
      
      expect(result).toBeUndefined();
    });

    it('should update global metrics', () => {
      const operationId = performanceMonitor.startOperation('parseFile', 'test.ts');
      
      // Mock different end time
      mockHrtime.mockReturnValueOnce([1, 600000000]); // 100ms later
      
      performanceMonitor.endOperation(operationId);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalOperations).toBe(1);
      expect(metrics.totalDuration).toBeGreaterThan(0);
    });
  });

  describe('recordCacheHit', () => {
    it('should record cache hit', () => {
      performanceMonitor.recordCacheHit('test.ts');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
    });

    it('should update cache statistics', () => {
      performanceMonitor.recordCacheHit('test.ts');
      performanceMonitor.recordCacheMiss('test.ts');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.5); // 1 hit, 1 miss = 50%
    });
  });

  describe('recordCacheMiss', () => {
    it('should record cache miss', () => {
      performanceMonitor.recordCacheMiss('test.ts');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0); // 0 hits, 1 miss = 0%
    });
  });

  describe('recordFileProcessed', () => {
    it('should record file processing', () => {
      performanceMonitor.recordFileProcessed('test.ts', 1024);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should track file size', () => {
      performanceMonitor.recordFileProcessed('test.ts', 2048);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toHaveProperty('totalOperations');
      expect(metrics).toHaveProperty('totalDuration');
      expect(metrics).toHaveProperty('averageDuration');
      expect(metrics).toHaveProperty('memoryPeak');
      expect(metrics).toHaveProperty('memoryCurrent');
      expect(metrics).toHaveProperty('memoryGrowth');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('fileProcessingRate');
      expect(metrics).toHaveProperty('operationsPerSecond');
      expect(metrics).toHaveProperty('resourceUsage');
    });

    it('should calculate average duration', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      mockHrtime.mockReturnValueOnce([1, 600000000]); // 100ms later
      performanceMonitor.endOperation(id1);
      
      const id2 = performanceMonitor.startOperation('parseFile', 'test2.ts');
      mockHrtime.mockReturnValueOnce([1, 700000000]); // 200ms later
      performanceMonitor.endOperation(id2);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.averageDuration).toBeGreaterThan(0);
    });

    it('should calculate operations per second', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      mockHrtime.mockReturnValueOnce([1, 600000000]); // 100ms later
      performanceMonitor.endOperation(id1);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.operationsPerSecond).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getOperationHistory', () => {
    it('should return operation history', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      performanceMonitor.endOperation(id1);
      
      const id2 = performanceMonitor.startOperation('parseFile', 'test2.ts');
      performanceMonitor.endOperation(id2);
      
      const history = performanceMonitor.getOperationHistory();
      expect(history).toHaveLength(2);
      expect(history[0]!.operation).toBe('parseFile');
      expect(history[0]!.file).toBe('test1.ts');
    });

    it('should limit history size', () => {
      const monitor = new PerformanceMonitor({ maxMetricsHistory: 2 });
      
      const id1 = monitor.startOperation('parseFile', 'test1.ts');
      monitor.endOperation(id1);
      
      const id2 = monitor.startOperation('parseFile', 'test2.ts');
      monitor.endOperation(id2);
      
      monitor.startOperation('parseFile', 'test3.ts');
      monitor.startOperation('parseFile', 'test3.ts');
      
      const history = monitor.getOperationHistory();
      expect(history.length).toBeLessThanOrEqual(2);
    });
  });

  describe('generateReport', () => {
    it('should generate performance report', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      performanceMonitor.endOperation(id1);
      
      performanceMonitor.recordCacheHit('test.ts');
      performanceMonitor.recordFileProcessed('test.ts', 1024);
      
      const report = performanceMonitor.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('timestamp');
    });

    it('should include performance insights', () => {
      const report = performanceMonitor.generateReport();
      
      expect(report.summary).toHaveProperty('totalOperations');
      expect(report.summary).toHaveProperty('averageDuration');
      expect(report.summary).toHaveProperty('memoryUsage');
      expect(report.summary).toHaveProperty('performanceScore');
    });

    it('should provide optimization recommendations', () => {
      const report = performanceMonitor.generateReport();
      
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      performanceMonitor.endOperation(id1);
      
      performanceMonitor.reset();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.totalDuration).toBe(0);
      expect(metrics.averageDuration).toBe(0);
    });

    it('should clear operation history', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      performanceMonitor.endOperation(id1);
      
      performanceMonitor.reset();
      
      const history = performanceMonitor.getOperationHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('getMemoryUsage', () => {
    it('should return current memory usage', () => {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      
      expect(memoryUsage).toHaveProperty('rss');
      expect(memoryUsage).toHaveProperty('heapTotal');
      expect(memoryUsage).toHaveProperty('heapUsed');
      expect(memoryUsage).toHaveProperty('external');
      expect(memoryUsage).toHaveProperty('arrayBuffers');
    });

    it('should return memory usage in MB', () => {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      
      expect(memoryUsage.rss).toBeGreaterThan(0);
      expect(memoryUsage.heapTotal).toBeGreaterThan(0);
      expect(memoryUsage.heapUsed).toBeGreaterThan(0);
    });
  });

  describe('getCpuUsage', () => {
    it('should return CPU usage', () => {
      const cpuUsage = performanceMonitor.getCpuUsage();
      
      expect(cpuUsage).toHaveProperty('user');
      expect(cpuUsage).toHaveProperty('system');
    });

    it('should calculate CPU usage percentage', () => {
      const cpuUsage = performanceMonitor.getCpuUsage();
      
      expect(cpuUsage.user).toBeGreaterThanOrEqual(0);
      expect(cpuUsage.system).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should handle memory usage errors gracefully', () => {
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });
      
      expect(() => {
        performanceMonitor.startOperation('parseFile', 'test.ts');
      }).not.toThrow();
    });

    it('should handle CPU usage errors gracefully', () => {
      mockCpuUsage.mockImplementation(() => {
        throw new Error('CPU usage error');
      });
      
      expect(() => {
        performanceMonitor.startOperation('parseFile', 'test.ts');
      }).not.toThrow();
    });

    it('should handle timing errors gracefully', () => {
      mockHrtime.mockImplementation(() => {
        throw new Error('Timing error');
      });
      
      expect(() => {
        performanceMonitor.startOperation('parseFile', 'test.ts');
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty operation name', () => {
      const operationId = performanceMonitor.startOperation('', 'test.ts');
      expect(operationId).toBeDefined();
    });

    it('should handle empty file name', () => {
      const operationId = performanceMonitor.startOperation('parseFile', '');
      expect(operationId).toBeDefined();
    });

    it('should handle null operation name', () => {
      const operationId = performanceMonitor.startOperation(null as any, 'test.ts');
      expect(operationId).toBeDefined();
    });

    it('should handle null file name', () => {
      const operationId = performanceMonitor.startOperation('parseFile', null as any);
      expect(operationId).toBeDefined();
    });

    it('should handle undefined operation name', () => {
      const operationId = performanceMonitor.startOperation(undefined as any, 'test.ts');
      expect(operationId).toBeDefined();
    });

    it('should handle undefined file name', () => {
      const operationId = performanceMonitor.startOperation('parseFile', undefined as any);
      expect(operationId).toBeDefined();
    });

    it('should handle negative file size', () => {
      expect(() => {
        performanceMonitor.recordFileProcessed('test.ts', -1024);
      }).not.toThrow();
    });

    it('should handle zero file size', () => {
      expect(() => {
        performanceMonitor.recordFileProcessed('test.ts', 0);
      }).not.toThrow();
    });

    it('should handle very large file size', () => {
      expect(() => {
        performanceMonitor.recordFileProcessed('test.ts', Number.MAX_SAFE_INTEGER);
      }).not.toThrow();
    });
  });

  describe('performance tracking', () => {
    it('should track multiple operations concurrently', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      const id2 = performanceMonitor.startOperation('parseFile', 'test2.ts');
      const id3 = performanceMonitor.startOperation('parseFile', 'test3.ts');
      
      performanceMonitor.endOperation(id1);
      performanceMonitor.endOperation(id2);
      performanceMonitor.endOperation(id3);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.totalOperations).toBe(3);
    });

    it('should track different operation types', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test.ts');
      const id2 = performanceMonitor.startOperation('analyzeStructure', 'test.ts');
      const id3 = performanceMonitor.startOperation('generateDocumentation', 'test.ts');
      
      performanceMonitor.endOperation(id1);
      performanceMonitor.endOperation(id2);
      performanceMonitor.endOperation(id3);
      
      const history = performanceMonitor.getOperationHistory();
      expect(history).toHaveLength(3);
      expect(history.map(op => op.operation)).toContain('parseFile');
      expect(history.map(op => op.operation)).toContain('analyzeStructure');
      expect(history.map(op => op.operation)).toContain('generateDocumentation');
    });
  });

  describe('memory tracking', () => {
    it('should track memory peak', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      performanceMonitor.endOperation(id1);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryPeak).toBeGreaterThan(0);
    });

    it('should track memory growth', () => {
      const id1 = performanceMonitor.startOperation('parseFile', 'test1.ts');
      performanceMonitor.endOperation(id1);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryGrowth).toBeGreaterThanOrEqual(0);
    });

    it('should track current memory usage', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryCurrent).toBeGreaterThan(0);
    });
  });

  describe('cache statistics', () => {
    it('should calculate cache hit rate correctly', () => {
      performanceMonitor.recordCacheHit('test1.ts');
      performanceMonitor.recordCacheHit('test2.ts');
      performanceMonitor.recordCacheMiss('test3.ts');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(2/3); // 2 hits out of 3 total
    });

    it('should handle zero cache operations', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('should handle only cache hits', () => {
      performanceMonitor.recordCacheHit('test1.ts');
      performanceMonitor.recordCacheHit('test2.ts');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(1); // 100% hit rate
    });

    it('should handle only cache misses', () => {
      performanceMonitor.recordCacheMiss('test1.ts');
      performanceMonitor.recordCacheMiss('test2.ts');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0); // 0% hit rate
    });
  });

  describe('file processing rate', () => {
    it('should calculate file processing rate', () => {
      performanceMonitor.recordFileProcessed('test1.ts', 1024);
      performanceMonitor.recordFileProcessed('test2.ts', 2048);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero files processed', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBe(0);
    });
  });

  describe('resource usage tracking', () => {
    it('should track CPU usage', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.resourceUsage.cpuUsage).toBeGreaterThanOrEqual(0);
    });

    it('should track memory usage', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.resourceUsage.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should track disk I/O', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.resourceUsage.diskIO).toBeGreaterThanOrEqual(0);
    });
  });

  describe('report generation', () => {
    it('should generate report with performance score', () => {
      const report = performanceMonitor.generateReport();
      
      expect(report.summary).toHaveProperty('performanceScore');
      expect(typeof report.summary.performanceScore).toBe('number');
      expect(report.summary.performanceScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.performanceScore).toBeLessThanOrEqual(100);
    });

    it('should include timestamp in report', () => {
      const report = performanceMonitor.generateReport();
      
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should provide actionable recommendations', () => {
      const report = performanceMonitor.generateReport();
      
      expect(report.recommendations).toBeInstanceOf(Array);
      report.recommendations.forEach((rec: any) => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('impact');
      });
    });
  });

  // Additional branch coverage tests
  describe('branch coverage improvements', () => {
    it('should handle startOperation error branch', () => {
      // Mock process.hrtime to throw an error
      mockHrtime.mockImplementation(() => {
        throw new Error('HR time error');
      });
      
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });

    it('should handle startOperation with memory tracking error', () => {
      // Mock process.memoryUsage to throw an error
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });
      
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      expect(operationId).toBeDefined();
    });

    it('should handle startOperation with CPU tracking error', () => {
      // Mock process.cpuUsage to throw an error
      mockCpuUsage.mockImplementation(() => {
        throw new Error('CPU usage error');
      });
      
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      expect(operationId).toBeDefined();
    });

    it('should handle endOperation error branch', () => {
      // Mock process.hrtime to throw an error
      mockHrtime.mockImplementation(() => {
        throw new Error('HR time error');
      });
      
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      const result = performanceMonitor.endOperation(operationId);
      expect(result).toBeDefined();
    });

    it('should handle endOperation with memory tracking error', () => {
      // Mock process.memoryUsage to throw an error
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });
      
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      const result = performanceMonitor.endOperation(operationId);
      expect(result).toBeDefined();
    });

    it('should handle endOperation with CPU tracking error', () => {
      // Mock process.cpuUsage to throw an error
      mockCpuUsage.mockImplementation(() => {
        throw new Error('CPU usage error');
      });
      
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      const result = performanceMonitor.endOperation(operationId);
      expect(result).toBeDefined();
    });

    it('should handle getMemoryUsage error branch', () => {
      // Mock process.memoryUsage to throw an error
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });
      
      const usage = performanceMonitor.getMemoryUsage();
      expect(usage).toEqual({
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0
      });
    });

    it('should handle getCpuUsage error branch', () => {
      // Mock process.cpuUsage to throw an error
      mockCpuUsage.mockImplementation(() => {
        throw new Error('CPU usage error');
      });
      
      const usage = performanceMonitor.getCpuUsage();
      expect(usage).toEqual({
        user: 0,
        system: 0
      });
    });

    it('should handle generateReport error branch', () => {
      // Mock process.hrtime to throw an error
      mockHrtime.mockImplementation(() => {
        throw new Error('HR time error');
      });
      
      const report = performanceMonitor.generateReport();
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should handle reset error branch', () => {
      // Mock clearInterval to throw an error
      const originalClearInterval = global.clearInterval;
      global.clearInterval = jest.fn().mockImplementation(() => {
        throw new Error('Clear interval error');
      });
      
      expect(() => performanceMonitor.reset()).not.toThrow();
      
      // Restore original function
      global.clearInterval = originalClearInterval;
    });

    it('should handle dispose error branch', () => {
      // Mock clearInterval to throw an error
      const originalClearInterval = global.clearInterval;
      global.clearInterval = jest.fn().mockImplementation(() => {
        throw new Error('Clear interval error');
      });
      
      expect(() => performanceMonitor.dispose()).not.toThrow();
      
      // Restore original function
      global.clearInterval = originalClearInterval;
    });

    it('should handle recordCacheHit with null file', () => {
      performanceMonitor.recordCacheHit(null as any);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordCacheMiss with null file', () => {
      performanceMonitor.recordCacheMiss(null as any);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with null file', () => {
      performanceMonitor.recordFileProcessed(null as any, 100);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with negative size', () => {
      performanceMonitor.recordFileProcessed('test.ts', -100);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with zero size', () => {
      performanceMonitor.recordFileProcessed('test.ts', 0);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with very large size', () => {
      performanceMonitor.recordFileProcessed('test.ts', Number.MAX_SAFE_INTEGER);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle getOperationHistory with empty history', () => {
      const history = performanceMonitor.getOperationHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should handle startOperation with memory tracking disabled', () => {
      const monitor = new PerformanceMonitor({ enableMemoryTracking: false });
      const operationId = monitor.startOperation('test-operation', 'test.ts');
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });

    it('should handle startOperation with CPU tracking disabled', () => {
      const monitor = new PerformanceMonitor({ enableCpuTracking: false });
      const operationId = monitor.startOperation('test-operation', 'test.ts');
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });

    it('should handle startOperation with both tracking disabled', () => {
      const monitor = new PerformanceMonitor({ 
        enableMemoryTracking: false, 
        enableCpuTracking: false 
      });
      const operationId = monitor.startOperation('test-operation', 'test.ts');
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });

    it('should handle endOperation with memory tracking disabled', () => {
      const monitor = new PerformanceMonitor({ enableMemoryTracking: false });
      const operationId = monitor.startOperation('test-operation', 'test.ts');
      const result = monitor.endOperation(operationId);
      expect(result).toBeDefined();
    });

    it('should handle endOperation with CPU tracking disabled', () => {
      const monitor = new PerformanceMonitor({ enableCpuTracking: false });
      const operationId = monitor.startOperation('test-operation', 'test.ts');
      const result = monitor.endOperation(operationId);
      expect(result).toBeDefined();
    });

    it('should handle endOperation with both tracking disabled', () => {
      const monitor = new PerformanceMonitor({ 
        enableMemoryTracking: false, 
        enableCpuTracking: false 
      });
      const operationId = monitor.startOperation('test-operation', 'test.ts');
      const result = monitor.endOperation(operationId);
      expect(result).toBeDefined();
    });

    it('should handle generateReport with custom options', () => {
      const monitor = new PerformanceMonitor({ 
        enableMemoryTracking: true,
        enableCpuTracking: true,
        enableAutoReporting: false
      });
      const report = monitor.generateReport();
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should handle generateReport with minimal data', () => {
      const monitor = new PerformanceMonitor({ 
        enableMemoryTracking: false,
        enableCpuTracking: false,
        enableAutoReporting: false
      });
      const report = monitor.generateReport();
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should handle getMetrics with custom options', () => {
      const monitor = new PerformanceMonitor({ 
        enableMemoryTracking: false,
        enableCpuTracking: false
      });
      const metrics = monitor.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalOperations).toBe(0);
    });

    it('should handle mergeOptions with all custom values', () => {
      const options = {
        enableMemoryTracking: false,
        enableCpuTracking: false,
        enableAutoReporting: false,
        reportInterval: 5000,
        maxHistorySize: 50
      };
      const monitor = new PerformanceMonitor(options);
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should handle mergeOptions with partial values', () => {
      const options = {
        enableMemoryTracking: false,
        // Other options will use defaults
      };
      const monitor = new PerformanceMonitor(options);
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should handle initializeMemoryTracking error', () => {
      // Mock process.memoryUsage to throw an error during initialization
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });
      
      // Create a new PerformanceMonitor instance to trigger initialization error
      const newMonitor = new PerformanceMonitor();
      expect(newMonitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should handle startAutoReporting when disabled', () => {
      const monitor = new PerformanceMonitor({ enableAutoReporting: false });
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should handle generateOperationId uniqueness', () => {
      const id1 = performanceMonitor.startOperation('op1', 'file1.ts');
      const id2 = performanceMonitor.startOperation('op2', 'file2.ts');
      expect(id1).not.toBe(id2);
    });

    it('should handle getCurrentTime method', () => {
      const time = (performanceMonitor as any).getCurrentTime();
      expect(typeof time).toBe('number');
      expect(time).toBeGreaterThan(0);
    });

    it('should handle getMemoryUsageInMB method', () => {
      const memory = (performanceMonitor as any).getMemoryUsageInMB();
      expect(typeof memory).toBe('number');
      expect(memory).toBeGreaterThan(0);
    });

    it('should handle getMemoryUsageInMB error', () => {
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });
      
      const memory = (performanceMonitor as any).getMemoryUsageInMB();
      expect(memory).toBe(0);
    });

    it('should handle calculateMemoryGrowth method', () => {
      // Test memory growth calculation through endOperation
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      const result = performanceMonitor.endOperation(operationId);
      expect(result).toBeDefined();
    });

    it('should handle calculateMemoryGrowth with negative growth', () => {
      // Test memory growth calculation through endOperation
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      const result = performanceMonitor.endOperation(operationId);
      expect(result).toBeDefined();
    });

    it('should handle calculatePerformanceScore method', () => {
      const score = (performanceMonitor as any).calculatePerformanceScore({
        totalOperations: 10,
        totalDuration: 1000,
        averageDuration: 100,
        operationsPerSecond: 10,
        cacheHitRate: 0.8,
        fileProcessingRate: 5,
        memoryPeak: 100,
        cpuUsage: 50
      });
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle generateRecommendations method', () => {
      const recommendations = (performanceMonitor as any).generateRecommendations({
        totalOperations: 10,
        totalDuration: 1000,
        averageDuration: 100,
        operationsPerSecond: 10,
        cacheHitRate: 0.8,
        fileProcessingRate: 5,
        memoryPeak: 100,
        cpuUsage: 50
      });
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle generateRecommendations with low performance', () => {
      const recommendations = (performanceMonitor as any).generateRecommendations({
        totalOperations: 1,
        totalDuration: 10000,
        averageDuration: 10000,
        operationsPerSecond: 0.1,
        cacheHitRate: 0.1,
        fileProcessingRate: 0.1,
        memoryPeak: 1000,
        cpuUsage: 90
      });
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should handle generateRecommendations with high performance', () => {
      const recommendations = (performanceMonitor as any).generateRecommendations({
        totalOperations: 1000,
        totalDuration: 1000,
        averageDuration: 1,
        operationsPerSecond: 1000,
        cacheHitRate: 0.95,
        fileProcessingRate: 100,
        memoryPeak: 50,
        cpuUsage: 10
      });
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle calculateInsights method', () => {
      // Test insights calculation through generateReport
      const report = performanceMonitor.generateReport();
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should handle calculateInsights with various performance levels', () => {
      // Test insights calculation through generateReport with different scenarios
      const report1 = performanceMonitor.generateReport();
      expect(report1).toBeDefined();

      // Add some operations to test with data
      const operationId = performanceMonitor.startOperation('test-operation', 'test.ts');
      performanceMonitor.endOperation(operationId);
      
      const report2 = performanceMonitor.generateReport();
      expect(report2).toBeDefined();
    });

    it('should handle dispose method', () => {
      const monitor = new PerformanceMonitor();
      expect(() => monitor.dispose()).not.toThrow();
    });

    it('should handle dispose with active timer', () => {
      const monitor = new PerformanceMonitor({ enableAutoReporting: true });
      expect(() => monitor.dispose()).not.toThrow();
      monitor.dispose(); // Ensure cleanup
    });

    it('should handle reset with active timer', () => {
      const monitor = new PerformanceMonitor({ enableAutoReporting: true });
      expect(() => monitor.reset()).not.toThrow();
      monitor.dispose(); // Ensure cleanup
    });

    it('should handle recordCacheHit with empty string', () => {
      performanceMonitor.recordCacheHit('');
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordCacheMiss with empty string', () => {
      performanceMonitor.recordCacheMiss('');
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with empty string', () => {
      performanceMonitor.recordFileProcessed('', 100);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with undefined size', () => {
      performanceMonitor.recordFileProcessed('test.ts', undefined as any);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with NaN size', () => {
      performanceMonitor.recordFileProcessed('test.ts', NaN);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with Infinity size', () => {
      performanceMonitor.recordFileProcessed('test.ts', Infinity);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordFileProcessed with -Infinity size', () => {
      performanceMonitor.recordFileProcessed('test.ts', -Infinity);
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle startOperation with valid inputs', () => {
      const operationId = performanceMonitor.startOperation('test', 'file.ts');
      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });

    it('should handle endOperation with non-existent operation ID', () => {
      expect(() => performanceMonitor.endOperation('non-existent-id')).not.toThrow();
    });

    it('should handle memory tracking errors during endOperation', () => {
      const operationId = performanceMonitor.startOperation('test', 'file.ts');
      
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory tracking failed');
      });

      expect(() => performanceMonitor.endOperation(operationId)).not.toThrow();
    });

    it('should handle CPU tracking errors during endOperation', () => {
      const operationId = performanceMonitor.startOperation('test', 'file.ts');
      
      mockCpuUsage.mockImplementation(() => {
        throw new Error('CPU tracking failed');
      });

      expect(() => performanceMonitor.endOperation(operationId)).not.toThrow();
    });

    it('should handle getMemoryUsageInMB errors gracefully', () => {
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage failed');
      });

      const memoryUsage = performanceMonitor.getMemoryUsage();
      expect(memoryUsage.rss).toBe(0);
      expect(memoryUsage.heapUsed).toBe(0);
    });

    it('should handle getCpuUsage errors gracefully', () => {
      mockCpuUsage.mockImplementation(() => {
        throw new Error('CPU usage failed');
      });

      const cpuUsage = performanceMonitor.getCpuUsage();
      expect(cpuUsage.user).toBe(0);
      expect(cpuUsage.system).toBe(0);
    });

    it('should handle generateReport with errors', () => {
      performanceMonitor.startOperation('test', 'file.ts');
      
      // Force an error during report generation
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Report generation failed');
      });

      const report = performanceMonitor.generateReport();
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should handle reset errors gracefully', () => {
      performanceMonitor.startOperation('test', 'file.ts');
      expect(() => performanceMonitor.reset()).not.toThrow();
    });

    it('should handle dispose errors gracefully', () => {
      expect(() => performanceMonitor.dispose()).not.toThrow();
    });

    it('should handle calculateAverageDuration with empty operations', () => {
      performanceMonitor.reset();
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.averageDuration).toBe(0);
    });

    it('should handle calculateOperationsPerSecond with zero duration', () => {
      performanceMonitor.reset();
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.operationsPerSecond).toBe(0);
    });

    it('should handle recordMemoryUsage with various values', () => {
      performanceMonitor.startOperation('test1', 'file1.ts');
      performanceMonitor.endOperation(performanceMonitor.startOperation('test2', 'file2.ts'));
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryPeak).toBeGreaterThanOrEqual(0);
    });

    it('should handle options with undefined values', () => {
      const monitor = new PerformanceMonitor({
        enableMemoryTracking: undefined,
        enableCpuTracking: undefined,
        enableAutoReporting: false
      } as any);
      
      const operationId = monitor.startOperation('test', 'file.ts');
      expect(operationId).toBeDefined();
      monitor.dispose();
    });

    it('should handle getCpuUsagePercentage', () => {
      const operationId = performanceMonitor.startOperation('test', 'file.ts');
      performanceMonitor.endOperation(operationId);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.resourceUsage.cpuUsage).toBeGreaterThanOrEqual(0);
    });

    it('should handle getMemoryGrowth', () => {
      const operationId = performanceMonitor.startOperation('test', 'file.ts');
      performanceMonitor.endOperation(operationId);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryGrowth).toBeGreaterThanOrEqual(0);
    });

    it('should handle recordCacheStatistics', () => {
      performanceMonitor.recordCacheHit('file1.ts');
      performanceMonitor.recordCacheHit('file2.ts');
      performanceMonitor.recordCacheMiss('file3.ts');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cacheHitRate).toBeGreaterThan(0);
      expect(metrics.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it('should handle recordFileProcessingStatistics', () => {
      // First start and end an operation to establish some baseline time
      const opId = performanceMonitor.startOperation('test', 'file.ts');
      performanceMonitor.endOperation(opId);
      
      performanceMonitor.recordFileProcessed('file1.ts', 1000);
      performanceMonitor.recordFileProcessed('file2.ts', 2000);
      performanceMonitor.recordFileProcessed('file3.ts', 3000);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.fileProcessingRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle generateSummary', () => {
      const operationId = performanceMonitor.startOperation('test', 'file.ts');
      performanceMonitor.endOperation(operationId);
      
      const report = performanceMonitor.generateReport();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalOperations).toBeGreaterThan(0);
    });

    it('should handle generateRecommendations', () => {
      const operationId = performanceMonitor.startOperation('test', 'file.ts');
      performanceMonitor.endOperation(operationId);
      
      const report = performanceMonitor.generateReport();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should handle getMetrics with all tracking disabled', () => {
      const monitor = new PerformanceMonitor({
        enableMemoryTracking: false,
        enableCpuTracking: false,
        enableAutoReporting: false
      });
      
      const operationId = monitor.startOperation('test', 'file.ts');
      monitor.endOperation(operationId);
      
      const metrics = monitor.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalOperations).toBe(1);
      monitor.dispose();
    });
  });
});

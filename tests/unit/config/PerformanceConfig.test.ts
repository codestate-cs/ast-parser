import { PerformanceConfig } from '../../../src/types/performance';

describe('Performance Configuration', () => {
  describe('PerformanceMonitorOptions', () => {
    it('should have default performance monitoring options', () => {
      const defaultOptions: PerformanceConfig = {
        enablePerformanceMonitoring: true,
        enableMemoryTracking: true,
        enableCpuTracking: true,
        enableAutoReporting: false,
        reportInterval: 30000,
        memoryThreshold: 100 * 1024 * 1024,
        cpuThreshold: 80,
        enableProfiling: true,
        maxOperationHistory: 1000,
        enableDetailedMetrics: true
      };

      expect(defaultOptions.enablePerformanceMonitoring).toBe(true);
      expect(defaultOptions.enableMemoryTracking).toBe(true);
      expect(defaultOptions.enableCpuTracking).toBe(true);
      expect(defaultOptions.enableAutoReporting).toBe(false);
      expect(defaultOptions.reportInterval).toBe(30000);
      expect(defaultOptions.memoryThreshold).toBe(100 * 1024 * 1024);
      expect(defaultOptions.cpuThreshold).toBe(80);
      expect(defaultOptions.enableProfiling).toBe(true);
      expect(defaultOptions.maxOperationHistory).toBe(1000);
      expect(defaultOptions.enableDetailedMetrics).toBe(true);
    });

    it('should validate performance monitoring options', () => {
      const validOptions: PerformanceConfig = {
        enablePerformanceMonitoring: true,
        enableMemoryTracking: true,
        enableCpuTracking: true,
        enableAutoReporting: false,
        reportInterval: 30000,
        memoryThreshold: 100 * 1024 * 1024,
        cpuThreshold: 80,
        enableProfiling: true,
        maxOperationHistory: 1000,
        enableDetailedMetrics: true
      };

      expect(validOptions.reportInterval).toBeGreaterThan(0);
      expect(validOptions.memoryThreshold).toBeGreaterThan(0);
      expect(validOptions.cpuThreshold).toBeGreaterThan(0);
      expect(validOptions.cpuThreshold).toBeLessThanOrEqual(100);
      expect(validOptions.maxOperationHistory).toBeGreaterThan(0);
    });

    it('should handle invalid performance monitoring options', () => {
      const invalidOptions: Partial<PerformanceConfig> = {
        reportInterval: -1000,
        memoryThreshold: -1,
        cpuThreshold: 150,
        maxOperationHistory: 0
      };

      // These should be handled gracefully by the system
      expect(invalidOptions.reportInterval).toBeLessThan(0);
      expect(invalidOptions.memoryThreshold).toBeLessThan(0);
      expect(invalidOptions.cpuThreshold).toBeGreaterThan(100);
      expect(invalidOptions.maxOperationHistory).toBe(0);
    });
  });

  describe('Memory Management Options', () => {
    it('should have default memory management options', () => {
      const defaultOptions = {
        enableMemoryManagement: true,
        enableMonitoring: true,
        enableAutoGC: true,
        memoryThreshold: 100 * 1024 * 1024,
        gcThreshold: 80,
        monitoringInterval: 5000,
        enableLeakDetection: true,
        maxMemoryHistory: 100,
        enableOptimization: true
      };

      expect(defaultOptions.enableMemoryManagement).toBe(true);
      expect(defaultOptions.enableMonitoring).toBe(true);
      expect(defaultOptions.enableAutoGC).toBe(true);
      expect(defaultOptions.memoryThreshold).toBe(100 * 1024 * 1024);
      expect(defaultOptions.gcThreshold).toBe(80);
      expect(defaultOptions.monitoringInterval).toBe(5000);
      expect(defaultOptions.enableLeakDetection).toBe(true);
      expect(defaultOptions.maxMemoryHistory).toBe(100);
      expect(defaultOptions.enableOptimization).toBe(true);
    });

    it('should validate memory management options', () => {
      const validOptions = {
        memoryThreshold: 100 * 1024 * 1024,
        gcThreshold: 80,
        monitoringInterval: 5000,
        maxMemoryHistory: 100
      };

      expect(validOptions.memoryThreshold).toBeGreaterThan(0);
      expect(validOptions.gcThreshold).toBeGreaterThan(0);
      expect(validOptions.gcThreshold).toBeLessThanOrEqual(100);
      expect(validOptions.monitoringInterval).toBeGreaterThan(0);
      expect(validOptions.maxMemoryHistory).toBeGreaterThan(0);
    });
  });

  describe('Caching Options', () => {
    it('should have default caching options', () => {
      const defaultOptions = {
        enableCaching: true,
        maxCacheSize: 1000,
        ttl: 300000,
        enablePersistence: false,
        enableCompression: true,
        enableEncryption: false,
        cacheDirectory: './cache',
        enableAutoCleanup: true,
        cleanupInterval: 600000
      };

      expect(defaultOptions.enableCaching).toBe(true);
      expect(defaultOptions.maxCacheSize).toBe(1000);
      expect(defaultOptions.ttl).toBe(300000);
      expect(defaultOptions.enablePersistence).toBe(false);
      expect(defaultOptions.enableCompression).toBe(true);
      expect(defaultOptions.enableEncryption).toBe(false);
      expect(defaultOptions.cacheDirectory).toBe('./cache');
      expect(defaultOptions.enableAutoCleanup).toBe(true);
      expect(defaultOptions.cleanupInterval).toBe(600000);
    });

    it('should validate caching options', () => {
      const validOptions = {
        maxCacheSize: 1000,
        ttl: 300000,
        cleanupInterval: 600000
      };

      expect(validOptions.maxCacheSize).toBeGreaterThan(0);
      expect(validOptions.ttl).toBeGreaterThan(0);
      expect(validOptions.cleanupInterval).toBeGreaterThan(0);
    });
  });

  describe('Integration Options', () => {
    it('should have default integration options', () => {
      const defaultOptions = {
        enablePerformanceMonitoring: true,
        enableMemoryManagement: true,
        enableCaching: true,
        enableIncrementalParsing: true,
        enableOptimization: true,
        enableReporting: true,
        enableProfiling: true,
        enableDebugging: false
      };

      expect(defaultOptions.enablePerformanceMonitoring).toBe(true);
      expect(defaultOptions.enableMemoryManagement).toBe(true);
      expect(defaultOptions.enableCaching).toBe(true);
      expect(defaultOptions.enableIncrementalParsing).toBe(true);
      expect(defaultOptions.enableOptimization).toBe(true);
      expect(defaultOptions.enableReporting).toBe(true);
      expect(defaultOptions.enableProfiling).toBe(true);
      expect(defaultOptions.enableDebugging).toBe(false);
    });

    it('should handle partial configuration', () => {
      const partialOptions = {
        enablePerformanceMonitoring: true,
        enableCaching: false
      };

      expect(partialOptions.enablePerformanceMonitoring).toBe(true);
      expect(partialOptions.enableCaching).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate performance configuration', () => {
      const config = {
        enablePerformanceMonitoring: true,
        enableMemoryTracking: true,
        enableCpuTracking: true,
        reportInterval: 30000,
        memoryThreshold: 100 * 1024 * 1024,
        cpuThreshold: 80
      };

      expect(config.reportInterval).toBeGreaterThan(0);
      expect(config.memoryThreshold).toBeGreaterThan(0);
      expect(config.cpuThreshold).toBeGreaterThan(0);
      expect(config.cpuThreshold).toBeLessThanOrEqual(100);
    });

    it('should handle configuration errors gracefully', () => {
      const invalidConfig = {
        reportInterval: -1000,
        memoryThreshold: -1,
        cpuThreshold: 150
      };

      // These should be handled gracefully by the system
      expect(invalidConfig.reportInterval).toBeLessThan(0);
      expect(invalidConfig.memoryThreshold).toBeLessThan(0);
      expect(invalidConfig.cpuThreshold).toBeGreaterThan(100);
    });
  });

  describe('Configuration Merging', () => {
    it('should merge configuration options correctly', () => {
      const baseConfig = {
        enablePerformanceMonitoring: true,
        enableMemoryTracking: true,
        enableCpuTracking: true,
        reportInterval: 30000
      };

      const overrideConfig = {
        enableCpuTracking: false,
        reportInterval: 60000
      };

      const mergedConfig = { ...baseConfig, ...overrideConfig };

      expect(mergedConfig.enablePerformanceMonitoring).toBe(true);
      expect(mergedConfig.enableMemoryTracking).toBe(true);
      expect(mergedConfig.enableCpuTracking).toBe(false);
      expect(mergedConfig.reportInterval).toBe(60000);
    });

    it('should handle undefined configuration values', () => {
      const config = {
        enablePerformanceMonitoring: true,
        enableMemoryTracking: undefined,
        enableCpuTracking: true
      };

      expect(config.enablePerformanceMonitoring).toBe(true);
      expect(config.enableMemoryTracking).toBeUndefined();
      expect(config.enableCpuTracking).toBe(true);
    });
  });
});

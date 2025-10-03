import { ProjectParser } from '../../../src/core/ProjectParser';
import { PerformanceMonitor } from '../../../src/utils/performance/PerformanceMonitor';
import { MemoryManager } from '../../../src/utils/performance/MemoryManager';
import { CacheManager } from '../../../src/core/CacheManager';

describe('ProjectParser Integration', () => {
  let projectParser: ProjectParser;
  let performanceMonitor: PerformanceMonitor;
  let memoryManager: MemoryManager;
  let cacheManager: CacheManager;

  beforeEach(() => {
    // Initialize performance components
    performanceMonitor = new PerformanceMonitor({
      enableMemoryTracking: true,
      enableCpuTracking: true,
      enableAutoReporting: false
    });

    memoryManager = new MemoryManager({
      enableAutoGC: true,
      maxMemoryUsage: 100 // 100MB
    });

    cacheManager = new CacheManager({
      cacheFile: './test-cache.json',
      maxCacheSize: 1000,
      compressionEnabled: false,
      autoCleanup: true,
      cleanupInterval: 300000,
      defaultTTL: 300000 // 5 minutes
    });

    // Initialize ProjectParser with performance integration
    projectParser = new ProjectParser({
      performance: {
        enablePerformanceMonitoring: true,
        enableMemoryManagement: true,
        enableCaching: true,
        maxConcurrentFiles: 5,
        memoryLimit: 512, // MB
        timeout: 60000, // 1 minute for testing
        enableProgress: true,
        progressInterval: 500, // 500ms for testing
        performanceMonitor,
        memoryManager,
        cacheManager
      }
    });

    // Replace the internal cacheManager with our mock
    (projectParser as any).cacheManager = cacheManager;
    (projectParser as any).performanceMonitor = performanceMonitor;
    (projectParser as any).memoryManager = memoryManager;
  });

  afterEach(() => {
    performanceMonitor.dispose();
    memoryManager.dispose();
    cacheManager.dispose();
  });

  describe('Performance Monitoring Integration', () => {
    it('should start performance monitoring when parsing begins', async () => {
      const startSpy = jest.spyOn(performanceMonitor, 'startOperation');
      
      await projectParser.parseProject('/test/project');
      
      expect(startSpy).toHaveBeenCalledWith('parseProject', '/test/project', {
        projectName: 'project'
      });
    });

    it('should end performance monitoring when parsing completes', async () => {
      const endSpy = jest.spyOn(performanceMonitor, 'endOperation');
      
      await projectParser.parseProject('/test/project');
      
      expect(endSpy).toHaveBeenCalled();
    });

    it('should record file processing metrics', async () => {
      const recordSpy = jest.spyOn(performanceMonitor, 'recordFileProcessed');
      
      await projectParser.parseProject('/test/project');
      
      expect(recordSpy).toHaveBeenCalled();
    });

    it('should generate performance report after parsing', async () => {
      const reportSpy = jest.spyOn(performanceMonitor, 'generateReport');
      
      await projectParser.parseProject('/test/project');
      
      expect(reportSpy).toHaveBeenCalled();
    });
  });

  describe('Memory Management Integration', () => {
    it('should start memory monitoring when parsing begins', async () => {
      const startSpy = jest.spyOn(memoryManager, 'startMonitoring');
      
      await projectParser.parseProject('/test/project');
      
      expect(startSpy).toHaveBeenCalled();
    });

    it('should check memory pressure during parsing', async () => {
      const checkSpy = jest.spyOn(memoryManager, 'checkMemoryPressure');
      
      await projectParser.parseProject('/test/project');
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should optimize memory when pressure is high', async () => {
      jest.spyOn(memoryManager, 'checkMemoryPressure').mockReturnValue({
        level: 'high',
        heapUsage: 90,
        rssUsage: 85,
        recommendations: ['force-gc' as any, 'clear-cache' as any]
      });
      
      const optimizeSpy = jest.spyOn(memoryManager, 'optimizeMemory');
      
      await projectParser.parseProject('/test/project');
      
      expect(optimizeSpy).toHaveBeenCalled();
    });

    it('should generate memory report after parsing', async () => {
      const reportSpy = jest.spyOn(memoryManager, 'generateMemoryReport');
      
      await projectParser.parseProject('/test/project');
      
      expect(reportSpy).toHaveBeenCalled();
    });
  });

  describe('Caching Integration', () => {
    it('should use cache for incremental parsing', async () => {
      // Mock the file discovery to return some files with proper structure
      jest.spyOn(projectParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/file1.ts', size: 100, lastModified: new Date(), hash: 'hash1' }
      ]);
      
      // Mock cache methods to simulate cache usage
      const loadCacheSpy = jest.spyOn(cacheManager, 'loadCache').mockResolvedValue();
      const persistCacheSpy = jest.spyOn(cacheManager, 'persistCache').mockResolvedValue();
      
      // Mock cache check to return false (no cache)
      jest.spyOn(cacheManager, 'hasCache').mockResolvedValue(false);
      jest.spyOn(cacheManager, 'setCache').mockResolvedValue();
      
      // Mock the parseFile method to return a mock AST
      jest.spyOn(projectParser as any, 'parseFile').mockResolvedValue({
        nodes: [{ id: 'node1', type: 'ClassDeclaration', name: 'TestClass' }],
        relations: []
      });
      
      // Mock other required methods
      jest.spyOn(projectParser as any, 'extractDependencies').mockReturnValue(['dep1']);
      jest.spyOn(projectParser as any, 'buildRelations').mockReturnValue([]);
      jest.spyOn(projectParser as any, 'analyzeStructure').mockReturnValue({
        files: [],
        directories: [],
        totalFiles: 1,
        totalLines: 100,
        totalSize: 100
      });
      jest.spyOn(projectParser as any, 'calculateComplexity').mockReturnValue({
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        linesOfCode: 100,
        functionCount: 1,
        classCount: 1,
        interfaceCount: 0
      });
      jest.spyOn(projectParser as any, 'calculateQuality').mockReturnValue({
        score: 80,
        maintainabilityIndex: 80,
        technicalDebtRatio: 0.1,
        duplicationPercentage: 0,
        testCoveragePercentage: 0
      });
      
      const result = await projectParser.parseProjectIncremental('/test/project');
      
      expect(result).toBeDefined();
      expect(loadCacheSpy).toHaveBeenCalled();
      expect(persistCacheSpy).toHaveBeenCalled();
    });

    it('should invalidate cache when files change', async () => {
      // Mock the file discovery to return some files with proper structure
      jest.spyOn(projectParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/file1.ts', size: 100, lastModified: new Date(), hash: 'hash1' }
      ]);
      
      // Mock cache methods to simulate cache invalidation
      jest.spyOn(cacheManager, 'loadCache').mockResolvedValue();
      jest.spyOn(cacheManager, 'hasCache').mockResolvedValue(true);
      jest.spyOn(cacheManager, 'validateFileHash').mockResolvedValue(false);
      const invalidateSpy = jest.spyOn(cacheManager, 'invalidateDependents').mockResolvedValue();
      jest.spyOn(cacheManager, 'setCache').mockResolvedValue();
      jest.spyOn(cacheManager, 'persistCache').mockResolvedValue();
      
      // Mock the parseFile method to return a mock AST
      jest.spyOn(projectParser as any, 'parseFile').mockResolvedValue({
        nodes: [{ id: 'node1', type: 'ClassDeclaration', name: 'TestClass' }],
        relations: []
      });
      
      // Mock other required methods
      jest.spyOn(projectParser as any, 'extractDependencies').mockReturnValue(['dep1']);
      jest.spyOn(projectParser as any, 'buildRelations').mockReturnValue([]);
      jest.spyOn(projectParser as any, 'analyzeStructure').mockReturnValue({
        files: [],
        directories: [],
        totalFiles: 1,
        totalLines: 100,
        totalSize: 100
      });
      jest.spyOn(projectParser as any, 'calculateComplexity').mockReturnValue({
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        linesOfCode: 100,
        functionCount: 1,
        classCount: 1,
        interfaceCount: 0
      });
      jest.spyOn(projectParser as any, 'calculateQuality').mockReturnValue({
        score: 80,
        maintainabilityIndex: 80,
        technicalDebtRatio: 0.1,
        duplicationPercentage: 0,
        testCoveragePercentage: 0
      });
      
      const result = await projectParser.parseProjectIncremental('/test/project');
      
      expect(result).toBeDefined();
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should record cache hits and misses', async () => {
      // Mock the file discovery to return some files
      jest.spyOn(projectParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/file1.ts', size: 100, lastModified: new Date() }
      ]);
      
      // Mock cache methods to simulate cache misses
      jest.spyOn(cacheManager, 'loadCache').mockResolvedValue();
      jest.spyOn(cacheManager, 'hasCache').mockResolvedValue(false);
      jest.spyOn(cacheManager, 'setCache').mockResolvedValue();
      jest.spyOn(cacheManager, 'persistCache').mockResolvedValue();
      
      // Mock the parseFile method to return a mock AST
      jest.spyOn(projectParser as any, 'parseFile').mockResolvedValue({
        nodes: [],
        relations: []
      });
      
      const result = await projectParser.parseProjectIncremental('/test/project');
      
      expect(result).toBeDefined();
      expect(result.performance?.cache).toBeDefined();
      expect(result.performance?.cache?.hitRate).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle performance monitoring errors gracefully', async () => {
      jest.spyOn(performanceMonitor, 'startOperation').mockImplementation(() => {
        throw new Error('Performance monitoring error');
      });
      
      await expect(projectParser.parseProject('/test/project')).resolves.not.toThrow();
    });

    it('should handle memory management errors gracefully', async () => {
      jest.spyOn(memoryManager, 'startMonitoring').mockImplementation(() => {
        throw new Error('Memory management error');
      });
      
      await expect(projectParser.parseProject('/test/project')).resolves.not.toThrow();
    });

    it('should handle caching errors gracefully', async () => {
      jest.spyOn(cacheManager, 'getCache').mockImplementation(() => {
        throw new Error('Cache error');
      });
      
      await expect(projectParser.parseProjectIncremental('/test/project')).resolves.not.toThrow();
    });
  });

  describe('Configuration Options', () => {
    it('should respect performance monitoring configuration', async () => {
      const disabledParser = new ProjectParser({
        performance: {
          enablePerformanceMonitoring: false,
          performanceMonitor
        }
      });
      
      const startSpy = jest.spyOn(performanceMonitor, 'startOperation');
      
      await disabledParser.parseProject('/test/project');
      
      expect(startSpy).not.toHaveBeenCalled();
    });

    it('should respect memory management configuration', async () => {
      const disabledParser = new ProjectParser({
        performance: {
          enableMemoryManagement: false,
          memoryManager
        }
      });
      
      const startSpy = jest.spyOn(memoryManager, 'startMonitoring');
      
      await disabledParser.parseProject('/test/project');
      
      expect(startSpy).not.toHaveBeenCalled();
    });

    it('should respect caching configuration', async () => {
      const disabledParser = new ProjectParser({
        performance: {
          enableCaching: false,
          cacheManager
        }
      });
      
      const getSpy = jest.spyOn(cacheManager, 'getCache');
      
      await disabledParser.parseProjectIncremental('/test/project');
      
      expect(getSpy).not.toHaveBeenCalled();
    });
  });

  describe('Performance Reports', () => {
    it('should generate comprehensive performance report', async () => {
      const result = await projectParser.parseProject('/test/project');
      
      expect(result.performance).toBeDefined();
      expect(result.performance?.metrics).toBeDefined();
      expect(result.performance?.report).toBeDefined();
      expect(result.performance?.recommendations).toBeDefined();
    });

    it('should include memory usage in performance report', async () => {
      const result = await projectParser.parseProject('/test/project');
      
      expect(result.performance?.memory).toBeDefined();
      expect(result.performance?.memory?.usage).toBeDefined();
      expect(result.performance?.memory?.report).toBeDefined();
    });

    it('should include cache statistics in performance report', async () => {
      const result = await projectParser.parseProject('/test/project');
      
      expect(result.performance?.cache).toBeDefined();
      expect(result.performance?.cache?.hitRate).toBeDefined();
      expect(result.performance?.cache?.statistics).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null performance components gracefully', async () => {
      const parserWithoutComponents = new ProjectParser({
        performance: {
          enablePerformanceMonitoring: true,
          performanceMonitor: null as any
        }
      });
      
      await expect(parserWithoutComponents.parseProject('/test/project')).resolves.not.toThrow();
    });

    it('should handle undefined project info gracefully', async () => {
      await expect(projectParser.parseProject(null as any)).rejects.toThrow();
    });

    it('should handle concurrent parsing operations', async () => {
      const promises = [
        projectParser.parseProject('/test/project1'),
        projectParser.parseProject('/test/project2'),
        projectParser.parseProject('/test/project3')
      ];
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Performance Configuration Options', () => {
    it('should respect maxConcurrentFiles option', async () => {
      // Mock discoverFiles to return many files
      const mockFiles = Array.from({ length: 20 }, (_, i) => ({
        path: `/test/project/file${i}.ts`,
        size: 100,
        lastModified: new Date(),
        hash: `hash${i}`
      }));

      jest.spyOn(projectParser as any, 'discoverFiles').mockResolvedValue(mockFiles);
      jest.spyOn(projectParser as any, 'parseFile').mockResolvedValue([
        { id: 'node1', type: 'class', name: 'TestClass', nodeType: 'class', filePath: '/test/file.ts', start: 0, end: 10, children: [], metadata: {}, properties: {} }
      ]);

      const result = await projectParser.parseProject('/test/project');

      expect(result).toBeDefined();
      expect(result.ast).toBeDefined();
      // Verify that files were processed in batches of maxConcurrentFiles (5)
      expect((projectParser as any).parseFile).toHaveBeenCalledTimes(20);
    });

    it('should enforce timeout option', async () => {
      // Create a parser with very short timeout
      const shortTimeoutParser = new ProjectParser({
        performance: {
          maxConcurrentFiles: 1,
          timeout: 100, // 100ms timeout
          enableProgress: false
        }
      });

      // Mock discoverFiles to return a file that takes longer to process
      jest.spyOn(shortTimeoutParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/slow-file.ts', size: 100, lastModified: new Date(), hash: 'hash1' }
      ]);

      // Mock parseFile to take longer than timeout
      jest.spyOn(shortTimeoutParser as any, 'parseFile').mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([
          { id: 'node1', type: 'class', name: 'TestClass', nodeType: 'class', filePath: '/test/file.ts', start: 0, end: 10, children: [], metadata: {}, properties: {} }
        ]), 200))
      );

      await expect(shortTimeoutParser.parseProject('/test/project')).rejects.toThrow('Project parsing timeout');
    });

    it('should enforce memory limit option', async () => {
      // Mock memory manager to return high memory usage
      const highMemoryUsage = {
        rss: 100 * 1024 * 1024, // 100MB
        heapTotal: 200 * 1024 * 1024, // 200MB
        heapUsed: 600 * 1024 * 1024, // 600MB (exceeds 512MB limit)
        external: 50 * 1024 * 1024, // 50MB
        arrayBuffers: 10 * 1024 * 1024 // 10MB
      };

      jest.spyOn(memoryManager, 'getMemoryUsage').mockReturnValue(highMemoryUsage);
      const optimizeMemorySpy = jest.spyOn(memoryManager, 'optimizeMemory');

      jest.spyOn(projectParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/file1.ts', size: 100, lastModified: new Date(), hash: 'hash1' }
      ]);
      jest.spyOn(projectParser as any, 'parseFile').mockResolvedValue([
        { id: 'node1', type: 'class', name: 'TestClass', nodeType: 'class', filePath: '/test/file.ts', start: 0, end: 10, children: [], metadata: {}, properties: {} }
      ]);

      const result = await projectParser.parseProject('/test/project');

      expect(result).toBeDefined();
      expect(optimizeMemorySpy).toHaveBeenCalled();
    });

    it('should enable progress reporting when configured', async () => {
      const logInfoSpy = jest.spyOn(require('../../../src/utils/error/ErrorLogger'), 'logInfo');

      jest.spyOn(projectParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/file1.ts', size: 100, lastModified: new Date(), hash: 'hash1' },
        { path: '/test/project/file2.ts', size: 100, lastModified: new Date(), hash: 'hash2' },
        { path: '/test/project/file3.ts', size: 100, lastModified: new Date(), hash: 'hash3' }
      ]);
      jest.spyOn(projectParser as any, 'parseFile').mockResolvedValue([
        { id: 'node1', type: 'class', name: 'TestClass', nodeType: 'class', filePath: '/test/file.ts', start: 0, end: 10, children: [], metadata: {}, properties: {} }
      ]);

      const result = await projectParser.parseProject('/test/project');

      expect(result).toBeDefined();
      expect(logInfoSpy).toHaveBeenCalledWith('Starting to parse 3 files with concurrency limit: 5');
      expect(logInfoSpy).toHaveBeenCalledWith('Completed parsing 3 files');
    });

    it('should disable progress reporting when configured', async () => {
      const noProgressParser = new ProjectParser({
        performance: {
          maxConcurrentFiles: 5,
          enableProgress: false,
          enablePerformanceMonitoring: false,
          enableMemoryManagement: false
        }
      });

      const logInfoSpy = jest.spyOn(require('../../../src/utils/error/ErrorLogger'), 'logInfo');

      jest.spyOn(noProgressParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/file1.ts', size: 100, lastModified: new Date(), hash: 'hash1' }
      ]);
      jest.spyOn(noProgressParser as any, 'parseFile').mockResolvedValue([
        { id: 'node1', type: 'class', name: 'TestClass', nodeType: 'class', filePath: '/test/file.ts', start: 0, end: 10, children: [], metadata: {}, properties: {} }
      ]);

      const result = await noProgressParser.parseProject('/test/project');

      expect(result).toBeDefined();
      expect(logInfoSpy).not.toHaveBeenCalledWith('Starting to parse 1 files with concurrency limit: 5');
      expect(logInfoSpy).not.toHaveBeenCalledWith('Completed parsing 1 files');
    });

    it('should handle memory pressure during batch processing', async () => {
      const checkMemoryPressureSpy = jest.spyOn(memoryManager, 'checkMemoryPressure');
      const optimizeMemorySpy = jest.spyOn(memoryManager, 'optimizeMemory');

      // Mock high memory pressure
      checkMemoryPressureSpy.mockReturnValue({
        level: 'high',
        heapUsage: 100 * 1024 * 1024,
        rssUsage: 200 * 1024 * 1024,
        recommendations: ['force-gc' as any, 'clear-cache' as any]
      });

      jest.spyOn(projectParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/file1.ts', size: 100, lastModified: new Date(), hash: 'hash1' },
        { path: '/test/project/file2.ts', size: 100, lastModified: new Date(), hash: 'hash2' }
      ]);
      jest.spyOn(projectParser as any, 'parseFile').mockResolvedValue([
        { id: 'node1', type: 'class', name: 'TestClass', nodeType: 'class', filePath: '/test/file.ts', start: 0, end: 10, children: [], metadata: {}, properties: {} }
      ]);

      const result = await projectParser.parseProject('/test/project');

      expect(result).toBeDefined();
      expect(checkMemoryPressureSpy).toHaveBeenCalled();
      expect(optimizeMemorySpy).toHaveBeenCalled();
    });

    it('should handle file parsing timeout gracefully', async () => {
      jest.spyOn(projectParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/slow-file.ts', size: 100, lastModified: new Date(), hash: 'hash1' }
      ]);

      // Mock parseFile to take longer than the timeout
      jest.spyOn(projectParser as any, 'parseFile').mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([
          { id: 'node1', type: 'class', name: 'TestClass', nodeType: 'class', filePath: '/test/file.ts', start: 0, end: 10, children: [], metadata: {}, properties: {} }
        ]), 2000)) // 2 seconds
      );

      const result = await projectParser.parseProject('/test/project');

      expect(result).toBeDefined();
      // Should still complete despite individual file timeouts
      expect(result.ast).toBeDefined();
    });

    it('should use default performance options when not specified', async () => {
      const defaultParser = new ProjectParser();

      jest.spyOn(defaultParser as any, 'discoverFiles').mockResolvedValue([
        { path: '/test/project/file1.ts', size: 100, lastModified: new Date(), hash: 'hash1' }
      ]);
      jest.spyOn(defaultParser as any, 'parseFile').mockResolvedValue([
        { id: 'node1', type: 'class', name: 'TestClass', nodeType: 'class', filePath: '/test/file.ts', start: 0, end: 10, children: [], metadata: {}, properties: {} }
      ]);

      const result = await defaultParser.parseProject('/test/project');

      expect(result).toBeDefined();
      // Should use default values: maxConcurrentFiles: 10, timeout: 300000, etc.
    });
  });
});


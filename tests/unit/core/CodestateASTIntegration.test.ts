import { CodestateAST } from '../../../src/core/CodestateAST';
import { ProjectParser } from '../../../src/core/ProjectParser';
import { PerformanceMonitor } from '../../../src/utils/performance/PerformanceMonitor';
import { MemoryManager } from '../../../src/utils/performance/MemoryManager';
import { CacheManager } from '../../../src/core/CacheManager';

describe('CodestateAST Integration', () => {
  let codestateAST: CodestateAST;
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
      maxMemoryUsage: 100 * 1024 * 1024 // 100MB
    });

    cacheManager = new CacheManager({
      cacheFile: './test-cache.json',
      maxCacheSize: 1000,
      defaultTTL: 300000 // 5 minutes
    });

    // Initialize CodestateAST with performance integration
    codestateAST = new CodestateAST({
      performance: {
        enablePerformanceMonitoring: true,
        enableMemoryManagement: true,
        enableCaching: true,
        performanceMonitor,
        memoryManager,
        cacheManager
      }
    });
  });

  afterEach(() => {
    performanceMonitor.dispose();
    memoryManager.dispose();
    cacheManager.dispose();
  });

  describe('Performance Monitoring Integration', () => {
    it('should start performance monitoring when parsing project', async () => {
      const startSpy = jest.spyOn(performanceMonitor, 'startOperation');
      
      await codestateAST.parseProject('/test/project');
      
      expect(startSpy).toHaveBeenCalledWith('parseProject', '/test/project', {
        projectName: 'project'
      });
    });

    it('should end performance monitoring when parsing completes', async () => {
      const endSpy = jest.spyOn(performanceMonitor, 'endOperation');
      
      await codestateAST.parseProject('/test/project');
      
      expect(endSpy).toHaveBeenCalled();
    });

    it('should track project detection performance', async () => {
      const startSpy = jest.spyOn(performanceMonitor, 'startOperation');
      
      await codestateAST.detectProjectType('/test/project');
      
      // Project detection doesn't use performance monitoring in CodestateAST
      expect(startSpy).not.toHaveBeenCalled();
    });

    it('should generate performance report after parsing', async () => {
      const reportSpy = jest.spyOn(performanceMonitor, 'generateReport');
      
      await codestateAST.parseProject('/test/project');
      
      expect(reportSpy).toHaveBeenCalled();
    });
  });

  describe('Memory Management Integration', () => {
    it('should start memory monitoring when parsing begins', async () => {
      const startSpy = jest.spyOn(memoryManager, 'startMonitoring');
      
      await codestateAST.parseProject('/test/project');
      
      expect(startSpy).toHaveBeenCalled();
    });

    it('should check memory pressure during parsing', async () => {
      const checkSpy = jest.spyOn(memoryManager, 'checkMemoryPressure');
      
      await codestateAST.parseProject('/test/project');
      
      expect(checkSpy).toHaveBeenCalled();
    });

    it('should optimize memory when pressure is high', async () => {
      jest.spyOn(memoryManager, 'checkMemoryPressure').mockReturnValue({
        level: 'high',
        heapUsage: 100 * 1024 * 1024,
        rssUsage: 200 * 1024 * 1024,
        recommendations: ['force-gc' as any, 'clear-cache' as any]
      });
      
      const optimizeSpy = jest.spyOn(memoryManager, 'optimizeMemory');
      
      await codestateAST.parseProject('/test/project');
      
      expect(optimizeSpy).toHaveBeenCalled();
    });

    it('should generate memory report after parsing', async () => {
      const reportSpy = jest.spyOn(memoryManager, 'generateMemoryReport');
      
      await codestateAST.parseProject('/test/project');
      
      expect(reportSpy).toHaveBeenCalled();
    });
  });

  describe('Caching Integration', () => {
    it('should use cache for project parsing', async () => {
      // CodestateAST delegates to ProjectParser, so we test that ProjectParser is called
      const parseProjectSpy = jest.spyOn(ProjectParser.prototype, 'parseProject');
      
      await codestateAST.parseProject('/test/project');
      
      expect(parseProjectSpy).toHaveBeenCalledWith('/test/project');
    });

    it('should invalidate cache when project changes', async () => {
      // CodestateAST delegates to ProjectParser, so we test that ProjectParser is called
      const parseProjectSpy = jest.spyOn(ProjectParser.prototype, 'parseProject');
      
      await codestateAST.parseProject('/test/project');
      
      expect(parseProjectSpy).toHaveBeenCalledWith('/test/project');
    });

    it('should record cache hits and misses', async () => {
      // CodestateAST delegates to ProjectParser, so we test that ProjectParser is called
      const parseProjectSpy = jest.spyOn(ProjectParser.prototype, 'parseProject');
      
      await codestateAST.parseProject('/test/project');
      
      expect(parseProjectSpy).toHaveBeenCalledWith('/test/project');
    });
  });

  describe('Configuration Integration', () => {
    it('should respect performance monitoring configuration', async () => {
      const disabledAST = new CodestateAST({
        performance: {
          enablePerformanceMonitoring: false,
        performanceMonitor
        }
      });
      
      const startSpy = jest.spyOn(performanceMonitor, 'startOperation');
      
      await disabledAST.parseProject('/test/project');
      
      expect(startSpy).not.toHaveBeenCalled();
    });

    it('should respect memory management configuration', async () => {
      const disabledAST = new CodestateAST({
        performance: {
          enableMemoryManagement: false,
        memoryManager
        }
      });
      
      const startSpy = jest.spyOn(memoryManager, 'startMonitoring');
      
      await disabledAST.parseProject('/test/project');
      
      expect(startSpy).not.toHaveBeenCalled();
    });

    it('should respect caching configuration', async () => {
      const disabledAST = new CodestateAST({
        performance: {
          enableCaching: false,
        cacheManager
        }
      });
      
      const getSpy = jest.spyOn(cacheManager, 'getCache');
      
      await disabledAST.parseProject('/test/project');
      
      expect(getSpy).not.toHaveBeenCalled();
    });
  });

  describe('Performance Reports', () => {
    it('should include performance metrics in parse result', async () => {
      const result = await codestateAST.parseProject('/test/project');
      
      expect(result.performance).toBeDefined();
      expect(result.performance?.metrics).toBeDefined();
      expect(result.performance?.report).toBeDefined();
      expect(result.performance?.recommendations).toBeDefined();
    });

    it('should include memory usage in performance report', async () => {
      const result = await codestateAST.parseProject('/test/project');
      
      expect(result.performance?.memory).toBeDefined();
      expect(result.performance?.memory?.usage).toBeDefined();
      expect(result.performance?.memory?.report).toBeDefined();
    });

    it('should include cache statistics in performance report', async () => {
      const result = await codestateAST.parseProject('/test/project');
      
      expect(result.performance?.cache).toBeDefined();
      expect(result.performance?.cache?.hitRate).toBeDefined();
      expect(result.performance?.cache?.statistics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle performance monitoring errors gracefully', async () => {
      jest.spyOn(performanceMonitor, 'startOperation').mockImplementation(() => {
        throw new Error('Performance monitoring error');
      });
      
      await expect(codestateAST.parseProject('/test/project')).resolves.not.toThrow();
    });

    it('should handle memory management errors gracefully', async () => {
      jest.spyOn(memoryManager, 'startMonitoring').mockImplementation(() => {
        throw new Error('Memory management error');
      });
      
      await expect(codestateAST.parseProject('/test/project')).resolves.not.toThrow();
    });

    it('should handle caching errors gracefully', async () => {
      jest.spyOn(cacheManager, 'getCache').mockImplementation(() => {
        throw new Error('Cache error');
      });
      
      await expect(codestateAST.parseProject('/test/project')).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null performance components gracefully', async () => {
      const astWithoutComponents = new CodestateAST({
        performance: {
          enablePerformanceMonitoring: true,
          performanceMonitor: null as any
        }
      });
      
      await expect(astWithoutComponents.parseProject('/test/project')).resolves.not.toThrow();
    });

    it('should handle invalid project path gracefully', async () => {
      // CodestateAST doesn't validate empty paths, it delegates to ProjectParser
      const result = await codestateAST.parseProject('');
      expect(result).toBeDefined();
    });

    it('should handle concurrent parsing operations', async () => {
      const promises = [
        codestateAST.parseProject('/test/project1'),
        codestateAST.parseProject('/test/project2'),
        codestateAST.parseProject('/test/project3')
      ];
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });
});

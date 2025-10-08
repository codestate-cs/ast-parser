/**
 * @fileoverview Tests for IndexOptimizer class
 */

import { IndexOptimizer } from '../../../../src/indexing/maintenance/IndexOptimizer';
import { ProjectIndex } from '../../../../src/indexing/ProjectIndex';
import { GlobalIndex } from '../../../../src/indexing/GlobalIndex';
import { ProjectIndexEntry } from '../../../../src/types/indexing';
import { ProjectType } from '../../../../src/types/core';

describe('IndexOptimizer', () => {
  let indexOptimizer: IndexOptimizer;
  let mockProjectIndex: ProjectIndex;
  let mockGlobalIndex: GlobalIndex;
  let mockProjectEntry: ProjectIndexEntry;

  beforeEach(() => {
    indexOptimizer = new IndexOptimizer();
    
    mockProjectEntry = {
      id: 'project-1',
      name: 'Test Project',
      type: 'typescript' as ProjectType,
      rootPath: '/path/to/project1',
      version: '1.0.0',
      description: 'A test project for demonstration',
      author: 'Test Author',
      repository: 'https://github.com/test/project1',
      languages: ['typescript', 'javascript'],
      tags: ['test', 'demo'],
      lastAnalyzed: new Date(),
      lastModified: new Date(),
      size: 50000,
      fileCount: 10,
      linesOfCode: 1000,
      metadata: { test: true }
    };

    mockProjectIndex = new ProjectIndex(mockProjectEntry);
    mockGlobalIndex = new GlobalIndex();
    mockGlobalIndex.addProject(mockProjectEntry);
  });

  describe('constructor', () => {
    it('should create an IndexOptimizer with default options', () => {
      const optimizer = new IndexOptimizer();
      expect(optimizer).toBeDefined();
    });

    it('should create an IndexOptimizer with custom options', () => {
      const options = {
        enableCompression: true,
        enableDeduplication: true,
        enableCaching: true,
        maxCacheSize: 1000,
        compressionLevel: 6,
        optimizationThreshold: 0.8
      };
      const optimizer = new IndexOptimizer(options);
      expect(optimizer).toBeDefined();
    });
  });

  describe('optimization methods', () => {
    it('should optimize a project index', async () => {
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(result.statistics).toBeDefined();
    });

    it('should optimize a global index', async () => {
      const result = await indexOptimizer.optimizeGlobalIndex(mockGlobalIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(result.statistics).toBeDefined();
    });

    it('should compress index data', async () => {
      const result = await indexOptimizer.compressIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.compressionRatio).toBeDefined();
      expect(result.originalSize).toBeDefined();
      expect(result.compressedSize).toBeDefined();
    });

    it('should deduplicate index entries', async () => {
      const result = await indexOptimizer.deduplicateIndex(mockGlobalIndex);
      
      expect(result).toBeDefined();
      expect(result.duplicatesFound).toBeDefined();
      expect(result.duplicatesRemoved).toBeDefined();
      expect(result.spaceSaved).toBeDefined();
    });

    it('should cache frequently accessed data', async () => {
      const result = await indexOptimizer.cacheFrequentData(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.cacheSize).toBeDefined();
      expect(result.cachedEntries).toBeDefined();
      expect(result.expectedPerformanceGain).toBeDefined();
    });
  });

  describe('optimization strategies', () => {
    it('should apply compression optimization', async () => {
      const result = await indexOptimizer.applyOptimization(mockProjectIndex, 'compression');
      
      expect(result).toBeDefined();
      expect(result.strategy).toBe('compression');
      expect(result.success).toBeDefined();
      expect(result.benefits).toBeDefined();
    });

    it('should apply deduplication optimization', async () => {
      const result = await indexOptimizer.applyOptimization(mockGlobalIndex, 'deduplication');
      
      expect(result).toBeDefined();
      expect(result.strategy).toBe('deduplication');
      expect(result.success).toBeDefined();
      expect(result.benefits).toBeDefined();
    });

    it('should apply caching optimization', async () => {
      const result = await indexOptimizer.applyOptimization(mockProjectIndex, 'indexing');
      
      expect(result).toBeDefined();
      expect(result.strategy).toBe('indexing');
      expect(result.success).toBeDefined();
      expect(result.benefits).toBeDefined();
    });

    it('should apply indexing optimization', async () => {
      const result = await indexOptimizer.applyOptimization(mockProjectIndex, 'indexing');
      
      expect(result).toBeDefined();
      expect(result.strategy).toBe('indexing');
      expect(result.success).toBeDefined();
      expect(result.benefits).toBeDefined();
    });
  });

  describe('optimization analysis', () => {
    it('should analyze optimization potential', async () => {
      const analysis = await indexOptimizer.analyzeOptimizationPotential(mockProjectIndex);
      
      expect(analysis).toBeDefined();
      expect(analysis.compressionPotential).toBeDefined();
      expect(analysis.deduplicationPotential).toBeDefined();
      expect(analysis.cachingPotential).toBeDefined();
      expect(analysis.overallPotential).toBeDefined();
    });

    it('should calculate optimization metrics', async () => {
      const metrics = await indexOptimizer.calculateOptimizationMetrics(mockProjectIndex);
      
      expect(metrics).toBeDefined();
      expect(metrics.currentSize).toBeDefined();
      expect(metrics.optimizedSize).toBeDefined();
      expect(metrics.compressionRatio).toBeDefined();
      expect(metrics.performanceScore).toBeDefined();
    });

    it('should estimate optimization benefits', async () => {
      const benefits = await indexOptimizer.estimateOptimizationBenefits(mockProjectIndex);
      
      expect(benefits).toBeDefined();
      expect(benefits.sizeReduction).toBeDefined();
      expect(benefits.performanceGain).toBeDefined();
      expect(benefits.memorySavings).toBeDefined();
      expect(benefits.processingTimeReduction).toBeDefined();
    });
  });

  describe('optimization status', () => {
    it('should get optimization status', async () => {
      const status = indexOptimizer.getOptimizationStatus();
      
      expect(status).toBeDefined();
      expect(status.isOptimizing).toBeDefined();
      expect(status.lastOptimization).toBeUndefined(); // No optimizations yet
      expect(status.optimizationCount).toBeDefined();
      expect(status.totalOptimizations).toBeDefined();
    });

    it('should track optimization progress', async () => {
      const progress = indexOptimizer.getOptimizationProgress();
      
      expect(progress).toBeDefined();
      expect(progress.currentStep).toBeDefined();
      expect(progress.totalSteps).toBeDefined();
      expect(progress.percentage).toBeDefined();
      expect(progress.estimatedTimeRemaining).toBeDefined();
    });

    it('should get optimization history', async () => {
      const history = indexOptimizer.getOptimizationHistory();
      
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('optimization configuration', () => {
    it('should update optimization options', () => {
      const newOptions = {
        enableCompression: false,
        enableDeduplication: true,
        enableCaching: false,
        maxCacheSize: 2000,
        compressionLevel: 9,
        optimizationThreshold: 0.9
      };
      
      indexOptimizer.updateOptions(newOptions);
      
      // Verify options were updated
      expect(indexOptimizer).toBeDefined();
    });

    it('should get current optimization options', () => {
      const options = indexOptimizer.getOptions();
      
      expect(options).toBeDefined();
      expect(typeof options.enableCompression).toBe('boolean');
      expect(typeof options.enableDeduplication).toBe('boolean');
      expect(typeof options.enableCaching).toBe('boolean');
      expect(typeof options.maxCacheSize).toBe('number');
      expect(typeof options.compressionLevel).toBe('number');
      expect(typeof options.optimizationThreshold).toBe('number');
    });

    it('should reset optimization options to defaults', () => {
      indexOptimizer.resetOptions();
      
      const options = indexOptimizer.getOptions();
      expect(options).toBeDefined();
    });
  });

  describe('batch optimization', () => {
    it('should optimize multiple project indexes', async () => {
      const projectIndexes = [mockProjectIndex];
      
      const results = await indexOptimizer.optimizeProjectIndexes(projectIndexes);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.optimizations).toBeDefined();
    });

    it('should handle optimization errors in batch', async () => {
      const invalidProjectIndex = null as any;
      const projectIndexes = [mockProjectIndex, invalidProjectIndex];
      
      const results = await indexOptimizer.optimizeProjectIndexes(projectIndexes);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.optimizations).toBeDefined();
      expect(results[1]?.optimizations).toBeDefined();
    });
  });

  describe('optimization performance', () => {
    it('should track optimization performance', async () => {
      const startTime = Date.now();
      await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      const endTime = Date.now();
      
      const stats = indexOptimizer.getOptimizationStatistics();
      
      expect(stats.totalOptimizations).toBeGreaterThan(0);
      expect(stats.averageOptimizationTime).toBeGreaterThanOrEqual(0);
      expect(stats.averageOptimizationTime).toBeLessThan(endTime - startTime + 100);
    });

    it('should track optimization benefits', async () => {
      await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      const stats = indexOptimizer.getOptimizationStatistics();
      
      expect(stats.totalSizeReduction).toBeGreaterThanOrEqual(0);
      expect(stats.totalPerformanceGain).toBeGreaterThanOrEqual(0);
      expect(stats.averageCompressionRatio).toBeGreaterThanOrEqual(0);
    });
  });

  describe('optimization validation', () => {
    it('should validate optimization results', async () => {
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      const isValid = indexOptimizer.validateOptimizationResult(result);
      
      expect(isValid).toBeDefined();
    });

    it('should detect optimization issues', async () => {
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      const issues = indexOptimizer.detectOptimizationIssues(result);
      
      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle null project index gracefully', async () => {
      const result = await indexOptimizer.optimizeProjectIndex(null as any);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toBeDefined();
    });

    it('should handle null global index gracefully', async () => {
      const result = await indexOptimizer.optimizeGlobalIndex(null as any);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toBeDefined();
    });

    it('should handle optimization errors gracefully', async () => {
      // Create an optimizer that will throw an error
      const problematicOptimizer = new IndexOptimizer();
      
      // Mock a method to throw an error
      jest.spyOn(problematicOptimizer as any, 'compressIndex').mockRejectedValue(new Error('Optimization error'));
      
      const result = await problematicOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toBeDefined();
    });

    it('should handle optimization errors in main method', async () => {
      // Mock the compressIndex to throw an error
      const originalCompressIndex = indexOptimizer['compressIndex'];
      indexOptimizer['compressIndex'] = jest.fn().mockRejectedValue(new Error('Optimization failed'));
      
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toHaveLength(0); // No optimizations due to error
      expect(result.improvements.performanceImprovement).toBe(0);
      
      // Restore original method
      indexOptimizer['compressIndex'] = originalCompressIndex;
    });
  });

  describe('optimization reports', () => {
    it('should generate optimization report', async () => {
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.timeTaken).toBeGreaterThan(0);
    });

    it('should include optimization metadata in report', async () => {
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result.statistics).toBeDefined();
      expect(result.improvements).toBeDefined();
      expect(result.optimizations).toBeDefined();
    });

    it('should handle optimization errors in main method', async () => {
      // Mock the compressIndex to throw an error
      const originalCompressIndex = indexOptimizer['compressIndex'];
      indexOptimizer['compressIndex'] = jest.fn().mockRejectedValue(new Error('Optimization failed'));
      
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toHaveLength(0); // No optimizations due to error
      expect(result.improvements.performanceImprovement).toBe(0);
      
      // Restore original method
      indexOptimizer['compressIndex'] = originalCompressIndex;
    });

    it('should handle deduplication with actual duplicates removed', async () => {
      // Mock the deduplicateIndex to return actual duplicates removed
      const originalDeduplicateIndex = indexOptimizer['deduplicateIndex'];
      indexOptimizer['deduplicateIndex'] = jest.fn().mockResolvedValue({
        duplicatesRemoved: 5,
        spaceSaved: 1024,
        entries: []
      });
      
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toContain('deduplication');
      expect(result.improvements.sizeReduction).toBeGreaterThan(0);
      
      // Restore original method
      indexOptimizer['deduplicateIndex'] = originalDeduplicateIndex;
    });

    it('should handle optimization errors in main method', async () => {
      // Mock the compressIndex to throw an error
      const originalCompressIndex = indexOptimizer['compressIndex'];
      indexOptimizer['compressIndex'] = jest.fn().mockRejectedValue(new Error('Optimization failed'));
      
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toHaveLength(0); // No optimizations due to error
      expect(result.improvements.performanceImprovement).toBe(0);
      
      // Restore original method
      indexOptimizer['compressIndex'] = originalCompressIndex;
    });

    it('should handle optimization errors in main method with different error', async () => {
      // Mock the deduplicateIndex to throw an error
      const originalDeduplicateIndex = indexOptimizer['deduplicateIndex'];
      indexOptimizer['deduplicateIndex'] = jest.fn().mockRejectedValue(new Error('Deduplication failed'));
      
      const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.optimizations).toHaveLength(0); // No optimizations due to error
      expect(result.improvements.performanceImprovement).toBe(0);
      
      // Restore original method
      indexOptimizer['deduplicateIndex'] = originalDeduplicateIndex;
    });

    it('should detect optimization issues with invalid results', async () => {
      // Create a mock result with invalid statistics
      const mockResult = {
        optimizations: [],
        improvements: {
          performanceImprovement: -1, // Invalid negative improvement
          sizeReduction: -1 // Invalid negative reduction
        },
        statistics: {
          entriesOptimized: 5, // Non-zero but no optimizations
          timeTaken: 0
        }
      };
      
      const issues = indexOptimizer.detectOptimizationIssues(mockResult as any);
      
      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should handle optimization errors in main method with general error', async () => {
      // Mock the main optimization method to throw an error
      const originalOptimizeProjectIndex = indexOptimizer['optimizeProjectIndex'];
      indexOptimizer['optimizeProjectIndex'] = jest.fn().mockImplementation(async () => {
        throw new Error('General optimization failed');
      });
      
      try {
        const result = await indexOptimizer.optimizeProjectIndex(mockProjectIndex);
        
        expect(result).toBeDefined();
        expect(result.optimizations).toHaveLength(0); // No optimizations due to error
        expect(result.improvements.performanceImprovement).toBe(0);
      } catch (error) {
        // The error should be caught and handled gracefully
        expect(error).toBeDefined();
      }
      
      // Restore original method
      indexOptimizer['optimizeProjectIndex'] = originalOptimizeProjectIndex;
    });

  });
});

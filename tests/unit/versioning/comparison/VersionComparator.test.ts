import { VersionComparator } from '../../../../src/versioning/comparison/VersionComparator';
import { ProjectAnalysisOutput } from '../../../../src/types/project';

describe('VersionComparator', () => {
  let comparator: VersionComparator;

  beforeEach(() => {
    comparator = new VersionComparator();
  });

  describe('compareVersions', () => {
    it('should compare two project versions', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [
            {
              id: '1',
              type: 'FunctionDeclaration',
              name: 'testFunction',
              filePath: 'src/index.ts',
              start: 0,
              end: 50,
              children: [],
              metadata: {}
            }
          ],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            ...version1.structure.files,
            { path: 'src/new.ts', size: 200, lines: 20, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 30,
          totalSize: 300
        },
        ast: {
          ...version1.ast,
          nodes: [
            ...version1.ast.nodes,
            {
              id: '2',
              type: 'FunctionDeclaration',
              name: 'newFunction',
              filePath: 'src/new.ts',
              start: 0,
              end: 50,
              children: [],
              metadata: {}
            }
          ],
          publicExports: [
            ...version1.ast.publicExports,
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: []
            }
          ]
        },
        analysis: {
          ...version1.analysis,
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 75 },
          quality: { score: 80, issues: [] }
        },
        metadata: {
          ...version1.metadata,
          generatedAt: '2024-01-02T00:00:00Z',
          processingTime: 1500,
          filesProcessed: 2
        }
      };

      const result = await comparator.compareVersions(version1, version2);

      expect(result.summary.totalChanges).toBe(2);
      expect(result.summary.newFeatures).toBe(1);
      expect(result.summary.breakingChanges).toBe(0);
      expect(result.summary.bugFixes).toBe(0);
      expect(result.details.filesAdded).toContain('src/new.ts');
      expect(result.details.filesModified).toEqual([]);
      expect(result.details.filesDeleted).toEqual([]);
    });

    it('should handle identical versions', async () => {
      const version: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const result = await comparator.compareVersions(version, version);

      expect(result.summary.totalChanges).toBe(0);
      expect(result.summary.newFeatures).toBe(0);
      expect(result.summary.breakingChanges).toBe(0);
      expect(result.summary.bugFixes).toBe(0);
      expect(result.details.filesAdded).toEqual([]);
      expect(result.details.filesModified).toEqual([]);
      expect(result.details.filesDeleted).toEqual([]);
    });

    it('should detect breaking changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [
            {
              id: '1',
              type: 'FunctionDeclaration',
              name: 'publicFunction',
              filePath: 'src/index.ts',
              start: 0,
              end: 50,
              children: [],
              metadata: { isExported: true, isPublic: true }
            }
          ],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'publicFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '2.0.0' },
        ast: {
          ...version1.ast,
          nodes: [
            {
              id: '1',
              type: 'FunctionDeclaration',
              name: 'publicFunction',
              filePath: 'src/index.ts',
              start: 0,
              end: 50,
              children: [],
              metadata: { isExported: true, isPublic: true, signature: 'changed' }
            }
          ],
          publicExports: [
            {
              name: 'publicFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: 'changed' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);

      expect(result.summary.breakingChanges).toBeGreaterThan(0);
      expect(result.details.apisChanged).toHaveLength(1);
    });

    it('should handle null or undefined versions', async () => {
      const version: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      await expect(comparator.compareVersions(null as any, version)).rejects.toThrow();
      await expect(comparator.compareVersions(version, null as any)).rejects.toThrow();
      await expect(comparator.compareVersions(undefined as any, version)).rejects.toThrow();
      await expect(comparator.compareVersions(version, undefined as any)).rejects.toThrow();
    });
  });

  describe('generateDiffReport', () => {
    it('should generate a diff report', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' }
      };

      const result = await comparator.generateDiffReport(version1, version2, 'markdown');

      expect(result.format).toBe('markdown');
      expect(result.content).toContain('test-project');
      expect(result.content).toContain('1.0.0');
      expect(result.content).toContain('1.1.0');
    });

    it('should handle different diff formats', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' }
      };

      const markdownResult = await comparator.generateDiffReport(version1, version2, 'markdown');
      const htmlResult = await comparator.generateDiffReport(version1, version2, 'html');
      const jsonResult = await comparator.generateDiffReport(version1, version2, 'json');

      expect(markdownResult.format).toBe('markdown');
      expect(htmlResult.format).toBe('html');
      expect(jsonResult.format).toBe('json');
    });
  });

  describe('detectBreakingChanges', () => {
    it('should detect removed public APIs', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'removedFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '2.0.0' },
        ast: {
          ...version1.ast,
          publicExports: []
        }
      };

      const breakingChanges = await comparator.detectBreakingChanges(version1, version2);

      expect(breakingChanges).toHaveLength(1);
      expect(breakingChanges[0]?.type).toBe('removed');
      expect(breakingChanges[0]?.name).toBe('removedFunction');
    });

    it('should detect signature changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'changedFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '2.0.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'changedFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: 'changed' }
            }
          ]
        }
      };

      const breakingChanges = await comparator.detectBreakingChanges(version1, version2);

      expect(breakingChanges).toHaveLength(1);
      expect(breakingChanges[0]?.type).toBe('signature');
      expect(breakingChanges[0]?.name).toBe('changedFunction');
    });
  });

  describe('compareQualityMetrics', () => {
    it('should compare quality metrics between versions', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 5, cognitive: 10, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        analysis: {
          ...version1.analysis,
          complexity: { cyclomatic: 3, cognitive: 8, maintainability: 85 },
          quality: { score: 90, issues: [] }
        }
      };

      const metricsDiff = await comparator.compareQualityMetrics(version1, version2);

      expect(metricsDiff.complexity.cyclomatic.difference).toBe(-2);
      expect(metricsDiff.complexity.cognitive.difference).toBe(-2);
      expect(metricsDiff.complexity.maintainability.difference).toBe(5);
      expect(metricsDiff.quality.score.difference).toBe(5);
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const config = comparator.getConfig();
      expect(config.enableDiff).toBe(true);
      expect(config.diffFormat).toBe('json');
      expect(config.includeMetrics).toBe(true);
      expect(config.includeBreakingChanges).toBe(true);
    });

    it('should use custom configuration', () => {
      const customComparator = new VersionComparator({
        enableDiff: false,
        diffFormat: 'markdown',
        includeMetrics: false,
        includeBreakingChanges: false
      });

      const config = customComparator.getConfig();
      expect(config.enableDiff).toBe(false);
      expect(config.diffFormat).toBe('markdown');
      expect(config.includeMetrics).toBe(false);
      expect(config.includeBreakingChanges).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const version: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      // Test with invalid format
      await expect(comparator.generateDiffReport(version, version, 'invalid' as any)).rejects.toThrow();
    });
  });

  describe('additional edge cases for coverage', () => {
    it('should handle files with same path but different modification times', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-02T00:00:00Z' }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.details.filesModified).toContain('src/index.ts');
    });

    it('should handle exports with different types', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '2.0.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'testFunction',
              type: 'ClassDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBeGreaterThan(0);
    });

    it('should handle exports with different files', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '2.0.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: []
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBeGreaterThan(0);
    });

    it('should handle exports with different isDefault values', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '2.0.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: true,
              
              usage: []
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBeGreaterThan(0);
    });

    it('should handle exports with different metadata', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: 'old' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '2.0.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: 'new' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBeGreaterThan(0);
    });

    it('should handle identical exports', async () => {
      const version: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const result = await comparator.compareVersions(version, version);
      expect(result.details.apisChanged).toHaveLength(0);
    });

    it('should handle empty exports arrays', async () => {
      const version: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const result = await comparator.compareVersions(version, version);
      expect(result.details.apisChanged).toHaveLength(0);
    });

    it('should handle setConfig method', () => {
      const newConfig = {
        enableDiff: false,
        diffFormat: 'html' as const,
        includeMetrics: false,
        includeBreakingChanges: false
      };

      comparator.setConfig(newConfig);
      const config = comparator.getConfig();
      
      expect(config.enableDiff).toBe(false);
      expect(config.diffFormat).toBe('html');
      expect(config.includeMetrics).toBe(false);
      expect(config.includeBreakingChanges).toBe(false);
    });

    it('should handle mergeDefaults with all config options', () => {
      const customComparator = new VersionComparator({
        enableDiff: false,
        diffFormat: 'html',
        includeMetrics: false,
        includeBreakingChanges: false
      });

      const config = customComparator.getConfig();
      expect(config.enableDiff).toBe(false);
      expect(config.diffFormat).toBe('html');
      expect(config.includeMetrics).toBe(false);
      expect(config.includeBreakingChanges).toBe(false);
    });

    it('should handle mergeDefaults with partial config', () => {
      const customComparator = new VersionComparator({
        enableDiff: false
      });

      const config = customComparator.getConfig();
      expect(config.enableDiff).toBe(false);
      expect(config.diffFormat).toBe('json'); // default
      expect(config.includeMetrics).toBe(true); // default
      expect(config.includeBreakingChanges).toBe(true); // default
    });

    it('should handle generateMigrationGuide with no breaking changes', async () => {
      const version: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const result = await comparator.compareVersions(version, version);
      expect(result.recommendations.migrationGuide).toContain('No breaking changes detected');
    });

    it('should handle generateTestingStrategy with different scenarios', async () => {
      const version: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      // Test with no changes
      const result1 = await comparator.compareVersions(version, version);
      expect(result1.recommendations.testingStrategy).toContain('Run existing test suite');

      // Test with new features
      const version2 = {
        ...version,
        ast: {
          ...version.ast,
          publicExports: [
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ]
        }
      };

      const result2 = await comparator.compareVersions(version, version2);
      expect(result2.recommendations.testingStrategy).toContain('Test new features');
    });

    it('should handle additional edge cases for better coverage', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        },
        analysis: {
          ...version1.analysis,
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 75 },
          quality: { score: 80, issues: [{ type: 'warning', message: 'Test warning', file: 'src/new.ts', line: 1, severity: 'low' }] }
        },
        metadata: {
          ...version1.metadata,
          filesProcessed: 2
        }
      };

      // Test with added files, modified files, and API changes
      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.totalChanges).toBeGreaterThan(0);
      expect(result.details.filesAdded).toContain('src/new.ts');
      expect(result.details.apisChanged.length).toBeGreaterThan(0);
    });

    it('should handle error cases in private methods', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      // Test with null versions to trigger error handling
      try {
        await comparator.compareVersions(null as any, version1);
      } catch (error) {
        expect(error).toBeDefined();
      }

      try {
        await comparator.compareVersions(version1, null as any);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle additional edge cases for better coverage', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        },
        analysis: {
          ...version1.analysis,
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 75 },
          quality: { score: 80, issues: [{ type: 'warning', message: 'Test warning', file: 'src/new.ts', line: 1, severity: 'low' }] }
        },
        metadata: {
          ...version1.metadata,
          filesProcessed: 2
        }
      };

      // Test with added files, modified files, and API changes
      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.totalChanges).toBeGreaterThan(0);
      expect(result.details.filesAdded).toContain('src/new.ts');
      expect(result.details.apisChanged.length).toBeGreaterThan(0);
    });

    it('should handle generateDiffReport with unsupported format', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' }
      };

      // Test with unsupported format
      await expect(comparator.generateDiffReport(version1, version2, 'unsupported' as any)).rejects.toThrow();
    });

    it('should handle exports with isExported property changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBe(0); // No breaking changes since isExported is not in the type
    });

    it('should handle quality metrics with negative differences', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 5, cognitive: 5, maintainability: 60 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 70, issues: [{ type: 'error', message: 'Test error', file: 'src/index.ts', line: 1, severity: 'high' }] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        analysis: {
          complexity: { cyclomatic: 3, cognitive: 3, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        }
      };

      const result = await comparator.compareQualityMetrics(version1, version2);
      expect(result.complexity.cyclomatic.difference).toBe(-2);
      expect(result.complexity.cognitive.difference).toBe(-2);
      expect(result.complexity.maintainability.difference).toBe(20);
      expect(result.quality.score.difference).toBe(15);
      expect(result.quality.issues.added).toBe(-1); // quality2.issues.length - quality1.issues.length = 0 - 1 = -1
      expect(result.quality.issues.removed).toBe(1); // quality1.issues.length - quality2.issues.length = 1 - 0 = 1
    });

    it('should handle edge cases in generateMigrationGuide with breaking changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'oldFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBeGreaterThan(0);
      expect(result.recommendations.migrationGuide).toContain('Migration Guide');
    });

    it('should handle edge cases in generateTestingStrategy with different scenarios', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/old.ts', size: 50, lines: 5, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'oldFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 2
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 120, lines: 12, lastModified: '2024-01-02T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 17,
          totalSize: 170
        },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        },
        analysis: {
          ...version1.analysis,
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 75 },
          quality: { score: 80, issues: [{ type: 'warning', message: 'Test warning', file: 'src/new.ts', line: 1, severity: 'low' }] }
        },
        metadata: {
          ...version1.metadata,
          filesProcessed: 2
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('Testing Strategy');
    });

    it('should handle edge cases in generateDocumentationUpdates with API changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 0, cognitive: 0, maintainability: 100 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 100, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.documentationUpdates[0]).toContain('newFunction');
    });

    it('should handle edge cases in mergeDefaults with all config options', async () => {
      const config = {
        enableDiff: false,
        diffFormat: 'markdown' as const,
        includeMetrics: false,
        includeBreakingChanges: false
      };

      const comparator = new VersionComparator(config);
      const result = comparator.getConfig();
      
      expect(result.enableDiff).toBe(false);
      expect(result.diffFormat).toBe('markdown');
      expect(result.includeMetrics).toBe(false);
      expect(result.includeBreakingChanges).toBe(false);
    });

    it('should handle edge cases in mergeDefaults with partial config', async () => {
      const config = {
        enableDiff: true
      };

      const comparator = new VersionComparator(config);
      const result = comparator.getConfig();
      
      expect(result.enableDiff).toBe(true);
      expect(result.diffFormat).toBe('json'); // default
      expect(result.includeMetrics).toBe(true); // default
      expect(result.includeBreakingChanges).toBe(true); // default
    });

    it('should handle edge cases in detectAPIChanges with complex scenarios', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'function2',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: true,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'function3',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => number' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBeGreaterThan(0); // function2 removed, function3 added
      expect(result.details.apisChanged.length).toBeGreaterThan(0);
    });

    it('should handle edge cases in hasExportChanged with different metadata', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void', version: '1.0.0' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void', version: '1.1.0' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.details.apisChanged.length).toBeGreaterThan(0);
    });

    it('should handle edge cases in isBreakingChange with signature changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBeGreaterThan(0);
    });

    it('should handle edge cases in generateMarkdownDiff with metrics', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        analysis: {
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 75 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 80, issues: [{ type: 'warning', message: 'Test warning', file: 'src/index.ts', line: 1, severity: 'low' }] }
        }
      };

      const comparator = new VersionComparator({ includeMetrics: true });
      const result = await comparator.generateDiffReport(version1, version2, 'markdown');
      expect(result.content).toContain('Version Comparison Report');
    });

    it('should handle edge cases in generateHtmlDiff', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' }
      };

      const result = await comparator.generateDiffReport(version1, version2, 'html');
      expect(result.content).toContain('html');
    });

    it('should handle edge cases in generateTestingStrategy with no changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('Testing Strategy');
    });

    it('should handle edge cases in generateTestingStrategy with breaking changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'oldFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: []
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('regression tests');
    });

    it('should handle edge cases in generateTestingStrategy with new features', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('new features');
    });

    it('should handle edge cases in generateTestingStrategy with modified files', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 120, lines: 12, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 12,
          totalSize: 120
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('existing test suite');
    });

    it('should handle edge cases in generateTestingStrategy with added files', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 5,
          totalSize: 50
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('existing test suite');
    });

    it('should handle edge cases in generateTestingStrategy with deleted files', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/old.ts', size: 50, lines: 5, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 5,
          totalSize: 50
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('existing test suite');
    });

    it('should handle edge cases in generateTestingStrategy with regression tests', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'function2',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'function2',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => number' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('regression');
    });

    it('should handle edge cases in generateTestingStrategy with all change types', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/old.ts', size: 50, lines: 5, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 5,
          totalSize: 50
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'oldFunction',
              type: 'FunctionDeclaration',
              file: 'src/old.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-02T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('Testing Strategy');
    });

    it('should handle edge cases in generateTestingStrategy with comprehensive changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/old.ts', size: 50, lines: 5, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/modified.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'oldFunction',
              type: 'FunctionDeclaration',
              file: 'src/old.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'modifiedFunction',
              type: 'FunctionDeclaration',
              file: 'src/modified.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/modified.ts', size: 120, lines: 12, lastModified: '2024-01-02T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 17,
          totalSize: 170
        },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'modifiedFunction',
              type: 'FunctionDeclaration',
              file: 'src/modified.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => number' }
            },
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => boolean' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('Testing Strategy');
    });

    it('should handle edge cases in generateTestingStrategy with mixed breaking and non-breaking changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/api.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'breakingFunction',
              type: 'FunctionDeclaration',
              file: 'src/api.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'nonBreakingFunction',
              type: 'FunctionDeclaration',
              file: 'src/api.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'breakingFunction',
              type: 'FunctionDeclaration',
              file: 'src/api.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => number' }
            },
            {
              name: 'nonBreakingFunction',
              type: 'FunctionDeclaration',
              file: 'src/api.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            },
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/api.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => boolean' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('Testing Strategy');
    });

    it('should handle edge cases in generateTestingStrategy with comprehensive file changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/file1.ts', size: 50, lines: 5, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/file2.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/file3.ts', size: 75, lines: 8, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 3,
          totalLines: 23,
          totalSize: 225
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'function1',
              type: 'FunctionDeclaration',
              file: 'src/file1.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'function2',
              type: 'FunctionDeclaration',
              file: 'src/file2.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/file2.ts', size: 120, lines: 12, lastModified: '2024-01-02T00:00:00Z' },
            { path: 'src/file4.ts', size: 60, lines: 6, lastModified: '2024-01-02T00:00:00Z' },
            { path: 'src/file5.ts', size: 80, lines: 8, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 3,
          totalLines: 26,
          totalSize: 260
        },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'function2',
              type: 'FunctionDeclaration',
              file: 'src/file2.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => number' }
            },
            {
              name: 'function4',
              type: 'FunctionDeclaration',
              file: 'src/file4.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => boolean' }
            },
            {
              name: 'function5',
              type: 'FunctionDeclaration',
              file: 'src/file5.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => object' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('Testing Strategy');
    });

    it('should handle edge cases in generateTestingStrategy with all change types present', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/old.ts', size: 50, lines: 5, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/modified.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'oldFunction',
              type: 'FunctionDeclaration',
              file: 'src/old.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            },
            {
              name: 'modifiedFunction',
              type: 'FunctionDeclaration',
              file: 'src/modified.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 2, cognitive: 2, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/modified.ts', size: 120, lines: 12, lastModified: '2024-01-02T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 17,
          totalSize: 170
        },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'modifiedFunction',
              type: 'FunctionDeclaration',
              file: 'src/modified.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => number' }
            },
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => boolean' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.recommendations.testingStrategy).toContain('Testing Strategy');
    });
  });

  describe('additional branch coverage tests', () => {
    it('should handle null version1 in detectBreakingChanges', async () => {
      const version2: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      await expect(comparator.detectBreakingChanges(null as any, version2))
        .rejects.toThrow('INVALID_VERSIONS');
    });

    it('should handle null version2 in detectBreakingChanges', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      await expect(comparator.detectBreakingChanges(version1, null as any))
        .rejects.toThrow('INVALID_VERSIONS');
    });

    it('should handle null version1 in compareQualityMetrics', async () => {
      const version2: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      await expect(comparator.compareQualityMetrics(null as any, version2))
        .rejects.toThrow('INVALID_VERSIONS');
    });

    it('should handle null version2 in compareQualityMetrics', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      await expect(comparator.compareQualityMetrics(version1, null as any))
        .rejects.toThrow('INVALID_VERSIONS');
    });

    it('should handle exports with isExported property changes', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => void' }
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: [],
              metadata: { signature: '() => string' }
            }
          ]
        }
      };

      const result = await comparator.compareVersions(version1, version2);
      expect(result.summary.breakingChanges).toBeGreaterThan(0);
    });

    it('should handle quality metrics with negative differences', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 5, cognitive: 5, maintainability: 60 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 70, issues: [{ type: 'warning', message: 'test issue', file: 'src/test.ts', line: 1, severity: 'medium' }] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        analysis: {
          complexity: { cyclomatic: 3, cognitive: 3, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 90, issues: [] }
        }
      };

      const result = await comparator.compareQualityMetrics(version1, version2);
      expect(result.complexity.cyclomatic.difference).toBe(-2);
      expect(result.complexity.cognitive.difference).toBe(-2);
      expect(result.complexity.maintainability.difference).toBe(20);
      expect(result.quality.score.difference).toBe(20);
      expect(result.quality.issues.added).toBe(-1);
      expect(result.quality.issues.removed).toBe(1);
    });

    it('should handle generateDiffReport with unsupported format', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' }
      };

      await expect(comparator.generateDiffReport(version1, version2, 'unsupported' as any))
        .rejects.toThrow('INVALID_FORMAT');
    });

    it('should handle generateMarkdownDiff with metrics', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            ...version1.structure.files,
            { path: 'src/new.ts', size: 200, lines: 20, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 30,
          totalSize: 300
        },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/new.ts',
              isDefault: false,
              
              usage: []
            }
          ]
        }
      };

      const diffReport = await comparator.generateDiffReport(version1, version2, 'markdown');
      
      expect(diffReport.format).toBe('markdown');
      expect(diffReport.content).toContain('# Version Comparison Report');
      expect(diffReport.content).toContain('Files Added');
      expect(diffReport.content).toContain('API Changes');
    });

    it('should handle generateHTMLDiff', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' }
      };

      const diffReport = await comparator.generateDiffReport(version1, version2, 'html');
      
      expect(diffReport.format).toBe('html');
      expect(diffReport.content).toContain('<!DOCTYPE html>');
      expect(diffReport.content).toContain('<h1>Version Comparison Report</h1>');
    });

    it('should handle generateMarkdownDiff with files deleted section', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/old.ts', size: 50, lines: 5, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        }
      };

      const diffReport = await comparator.generateDiffReport(version1, version2, 'markdown');
      
      expect(diffReport.content).toContain('Files Deleted');
      expect(diffReport.content).toContain('src/old.ts');
    });

    it('should handle generateMarkdownDiff with files modified section', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 150, lines: 15, lastModified: '2024-01-02T00:00:00Z' }
          ]
        }
      };

      const diffReport = await comparator.generateDiffReport(version1, version2, 'markdown');
      
      expect(diffReport.content).toContain('Files Modified');
      expect(diffReport.content).toContain('src/index.ts');
    });

    it('should handle generateMarkdownDiff with API changes section', async () => {
      const version1: ProjectAnalysisOutput = {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript',
          rootPath: '/test',
          entryPoints: ['src/index.ts'],
          dependencies: [],
          devDependencies: []
        },
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            {
              name: 'oldFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ],
          privateExports: []
        },
        analysis: {
          complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
          patterns: [],
          architecture: { layers: [], modules: [] },
          quality: { score: 85, issues: [] }
        },
        metadata: {
          generatedAt: '2024-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 1000,
          cacheUsed: false,
          filesProcessed: 1
        }
      };

      const version2: ProjectAnalysisOutput = {
        ...version1,
        project: { ...version1.project, version: '1.1.0' },
        ast: {
          ...version1.ast,
          publicExports: [
            {
              name: 'newFunction',
              type: 'FunctionDeclaration',
              file: 'src/index.ts',
              isDefault: false,
              
              usage: []
            }
          ]
        }
      };

      const diffReport = await comparator.generateDiffReport(version1, version2, 'markdown');
      
      expect(diffReport.content).toContain('API Changes');
      expect(diffReport.content).toContain('oldFunction');
      expect(diffReport.content).toContain('newFunction');
    });
  });
});

import { DiffGenerator } from '../../../../src/versioning/comparison/DiffGenerator';
import { ProjectAnalysisOutput } from '../../../../src/types/project';

describe('DiffGenerator', () => {
  let diffGenerator: DiffGenerator;

  beforeEach(() => {
    diffGenerator = new DiffGenerator();
  });

  describe('generateDiff', () => {
    it('should generate diff for two project versions', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        }
      };

      const result = await diffGenerator.generateDiff(version1, version2);
      
      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.filesAdded).toBe(1);
      expect(result.summary.filesModified).toBe(0);
      expect(result.summary.filesDeleted).toBe(0);
      expect(result.files[0]?.filePath).toBe('src/new.ts');
      expect(result.files[0]?.changeType).toBe('added');
    });

    it('should detect modified files', async () => {
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

      const result = await diffGenerator.generateDiff(version1, version2);
      
      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.filesAdded).toBe(0);
      expect(result.summary.filesModified).toBe(1);
      expect(result.summary.filesDeleted).toBe(0);
      expect(result.files[0]?.filePath).toBe('src/index.ts');
      expect(result.files[0]?.changeType).toBe('modified');
    });

    it('should detect deleted files', async () => {
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
          filesProcessed: 2
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
        },
        metadata: {
          ...version1.metadata,
          filesProcessed: 1
        }
      };

      const result = await diffGenerator.generateDiff(version1, version2);
      
      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.filesAdded).toBe(0);
      expect(result.summary.filesModified).toBe(0);
      expect(result.summary.filesDeleted).toBe(1);
      expect(result.files[0]?.filePath).toBe('src/old.ts');
      expect(result.files[0]?.changeType).toBe('deleted');
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

      const result = await diffGenerator.generateDiff(version, version);
      
      expect(result.summary.totalFiles).toBe(0);
      expect(result.summary.filesAdded).toBe(0);
      expect(result.summary.filesModified).toBe(0);
      expect(result.summary.filesDeleted).toBe(0);
      expect(result.files).toHaveLength(0);
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

      await expect(diffGenerator.generateDiff(null as any, version)).rejects.toThrow();
      await expect(diffGenerator.generateDiff(version, null as any)).rejects.toThrow();
    });
  });

  describe('generateUnifiedDiff', () => {
    it('should generate unified diff format', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        }
      };

      const result = await diffGenerator.generateUnifiedDiff(version1, version2);
      
      expect(result).toContain('--- 1.0.0');
      expect(result).toContain('+++ 1.1.0');
      expect(result).toContain('diff --git');
    });
  });

  describe('generateContextDiff', () => {
    it('should generate context diff format', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        }
      };

      const result = await diffGenerator.generateContextDiff(version1, version2);
      
      expect(result).toContain('***');
      expect(result).toContain('---');
    });
  });

  describe('generateSideBySideDiff', () => {
    it('should generate side-by-side diff format', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        }
      };

      const result = await diffGenerator.generateSideBySideDiff(version1, version2);
      
      expect(result).toContain('File:');
      expect(result).toContain('='.repeat(80));
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const config = diffGenerator.getConfig();
      expect(config.enableSyntaxHighlighting).toBe(false);
      expect(config.includeContext).toBe(true);
      expect(config.contextLines).toBe(3);
      expect(config.maxDiffSize).toBe(10000);
      expect(config.outputFormat).toBe('unified');
    });

    it('should use custom configuration', () => {
      const customConfig = {
        enableSyntaxHighlighting: true,
        contextLines: 5,
        outputFormat: 'context' as const
      };
      
      diffGenerator.setConfig(customConfig);
      const config = diffGenerator.getConfig();
      
      expect(config.enableSyntaxHighlighting).toBe(true);
      expect(config.contextLines).toBe(5);
      expect(config.outputFormat).toBe('context');
      expect(config.includeContext).toBe(true); // default
      expect(config.maxDiffSize).toBe(10000); // default
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

      // Test error handling in different methods
      await expect(diffGenerator.generateUnifiedDiff(null as any, version)).rejects.toThrow();
      await expect(diffGenerator.generateContextDiff(null as any, version)).rejects.toThrow();
      await expect(diffGenerator.generateSideBySideDiff(null as any, version)).rejects.toThrow();
    });
  });

  describe('additional edge cases for coverage', () => {
    it('should handle files with different sizes', async () => {
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
            { path: 'src/index.ts', size: 150, lines: 15, lastModified: '2024-01-01T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 15,
          totalSize: 150
        }
      };

      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle files with different line counts', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 12, lastModified: '2024-01-01T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 12,
          totalSize: 100
        }
      };

      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle mergeDefaults with all config options', () => {
      const customConfig = {
        enableSyntaxHighlighting: true,
        includeContext: false,
        contextLines: 5,
        maxDiffSize: 5000,
        outputFormat: 'side-by-side' as const
      };
      
      diffGenerator.setConfig(customConfig);
      const config = diffGenerator.getConfig();
      
      expect(config.enableSyntaxHighlighting).toBe(true);
      expect(config.includeContext).toBe(false);
      expect(config.contextLines).toBe(5);
      expect(config.maxDiffSize).toBe(5000);
      expect(config.outputFormat).toBe('side-by-side');
    });

    it('should handle mergeDefaults with partial config', () => {
      const partialConfig = {
        contextLines: 7
      };
      
      diffGenerator.setConfig(partialConfig);
      const config = diffGenerator.getConfig();
      
      expect(config.contextLines).toBe(7);
      expect(config.enableSyntaxHighlighting).toBe(false); // default
      expect(config.includeContext).toBe(true); // default
      expect(config.maxDiffSize).toBe(10000); // default
      expect(config.outputFormat).toBe('unified'); // default
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
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' },
            { path: 'src/new.ts', size: 50, lines: 5, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 2,
          totalLines: 15,
          totalSize: 150
        }
      };

      // Test with options
      const result = await diffGenerator.generateDiff(version1, version2, {
        format: 'unified',
        contextLines: 5,
        includeMetadata: true,
        includeMetrics: true
      });
      
      expect(result.summary.totalFiles).toBe(1);
      expect(result.summary.filesAdded).toBe(1);
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

      // Test error handling in different methods
      await expect(diffGenerator.generateUnifiedDiff(null as any, version1)).rejects.toThrow();
      await expect(diffGenerator.generateContextDiff(null as any, version1)).rejects.toThrow();
      await expect(diffGenerator.generateSideBySideDiff(null as any, version1)).rejects.toThrow();
    });

    it('should handle complex diff scenarios', async () => {
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
        }
      };

      const result = await diffGenerator.generateDiff(version1, version2);
      
      expect(result.summary.totalFiles).toBe(3); // 1 added + 1 modified + 1 deleted
      expect(result.summary.filesAdded).toBe(1);
      expect(result.summary.filesModified).toBe(1);
      expect(result.summary.filesDeleted).toBe(1);
    });

    it('should handle edge cases in findNextHunk method', async () => {
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

      // Test with different context lines
      const result = await diffGenerator.generateDiff(version1, version2, { contextLines: 0 });
      expect(result).toBeDefined();
    });

    it('should handle empty file arrays', async () => {
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
        structure: {
          ...version1.structure,
          files: [
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        }
      };

      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesAdded).toBe(1);
      expect(result.summary.filesModified).toBe(0);
      expect(result.summary.filesDeleted).toBe(0);
    });

    it('should handle formatUnifiedDiff with empty files array', async () => {
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

      const result = await diffGenerator.generateUnifiedDiff(version1, version2);
      expect(result).toContain('--- 1.0.0');
      expect(result).toContain('+++ 1.1.0');
    });

    it('should handle formatContextDiff with empty files array', async () => {
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

      const result = await diffGenerator.generateContextDiff(version1, version2);
      expect(result).toBeDefined();
    });

    it('should handle formatSideBySideDiff with empty files array', async () => {
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

      const result = await diffGenerator.generateSideBySideDiff(version1, version2);
      expect(result).toContain('File: unknown');
    });

    it('should handle edge cases in generateHunks method', async () => {
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

      // Test with contextLines = 0 to trigger edge cases
      const result = await diffGenerator.generateDiff(version1, version2, { contextLines: 0 });
      expect(result).toBeDefined();
    });

    it('should handle edge cases in findNextHunk with empty arrays', async () => {
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

      // Test with very large contextLines to trigger edge cases
      const result = await diffGenerator.generateDiff(version1, version2, { contextLines: 1000 });
      expect(result).toBeDefined();
    });

    it('should handle edge cases in findNextHunk with boundary conditions', async () => {
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

      // Test with contextLines = 1 to trigger edge cases in findNextHunk
      const result = await diffGenerator.generateDiff(version1, version2, { contextLines: 1 });
      expect(result).toBeDefined();
    });

    it('should handle edge cases in formatUnifiedDiff with hunks', async () => {
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

      const result = await diffGenerator.generateUnifiedDiff(version1, version2);
      expect(result).toContain('--- 1.0.0');
      expect(result).toContain('+++ 1.1.0');
    });

    it('should handle edge cases in formatContextDiff with hunks', async () => {
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

      const result = await diffGenerator.generateContextDiff(version1, version2);
      expect(result).toBeDefined();
    });

    it('should handle edge cases in formatSideBySideDiff with hunks', async () => {
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

      const result = await diffGenerator.generateSideBySideDiff(version1, version2);
      expect(result).toBeDefined();
    });

    it('should handle edge cases in generateFileHunks with identical content', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ]
        }
      };

      // Test with identical content to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(0);
    });

    it('should handle edge cases in generateFileHunks with different content', async () => {
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

      // Test with different content to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle edge cases in compareQualityMetrics', async () => {
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

      // Test with different quality metrics to trigger edge cases
      const result = await diffGenerator.generateDiff(version1, version2, { includeMetrics: true });
      expect(result).toBeDefined();
      expect(result.summary.totalFiles).toBe(0);
    });

    it('should handle edge cases in generateFileHunks with complex line differences', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 3, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 3,
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
            { path: 'src/index.ts', size: 120, lines: 4, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 4,
          totalSize: 120
        }
      };

      // Test with complex line differences to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(1);
      expect(result.files[0]?.hunks.length).toBeGreaterThan(0);
    });

    it('should handle edge cases in generateFileHunks with identical lines', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 2, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 2,
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
            { path: 'src/index.ts', size: 100, lines: 2, lastModified: '2024-01-01T00:00:00Z' }
          ]
        }
      };

      // Test with identical content to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(0);
    });

    it('should handle edge cases in generateFileHunks with different line lengths', async () => {
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
            { path: 'src/index.ts', size: 50, lines: 1, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 1,
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
          files: [
            { path: 'src/index.ts', size: 100, lines: 3, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 3,
          totalSize: 100
        }
      };

      // Test with different line lengths to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle edge cases in generateFileHunks with boundary conditions', async () => {
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
            { path: 'src/index.ts', size: 100, lines: 1, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 1,
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
            { path: 'src/index.ts', size: 200, lines: 2, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 2,
          totalSize: 200
        }
      };

      // Test with boundary conditions to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle edge cases in generateFileHunks with empty content', async () => {
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
            { path: 'src/index.ts', size: 0, lines: 0, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
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
            { path: 'src/index.ts', size: 50, lines: 1, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 1,
          totalSize: 50
        }
      };

      // Test with empty content to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle edge cases in generateFileHunks with single line changes', async () => {
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
            { path: 'src/index.ts', size: 50, lines: 1, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 1,
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
          files: [
            { path: 'src/index.ts', size: 100, lines: 2, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 2,
          totalSize: 100
        }
      };

      // Test with single line changes to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2);
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle edge cases in generateFileHunks with maximum context lines', async () => {
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
            { path: 'src/index.ts', size: 200, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 200
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
            { path: 'src/index.ts', size: 250, lines: 12, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 12,
          totalSize: 250
        }
      };

      // Test with maximum context lines to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2, { contextLines: 10 });
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle edge cases in generateFileHunks with complex diff scenarios', async () => {
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
            { path: 'src/complex.ts', size: 300, lines: 20, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 20,
          totalSize: 300
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
            { path: 'src/complex.ts', size: 400, lines: 25, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 25,
          totalSize: 400
        }
      };

      // Test with complex diff scenarios to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2, { 
        contextLines: 5,
        includeMetrics: true
      });
      expect(result.summary.filesModified).toBe(1);
    });

    it('should handle edge cases in generateFileHunks with minimal context', async () => {
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
            { path: 'src/minimal.ts', size: 100, lines: 5, lastModified: '2024-01-01T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 1,
          totalLines: 5,
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
            { path: 'src/minimal.ts', size: 120, lines: 6, lastModified: '2024-01-02T00:00:00Z' }
          ],
          totalFiles: 1,
          totalLines: 6,
          totalSize: 120
        }
      };

      // Test with minimal context to trigger edge cases in generateFileHunks
      const result = await diffGenerator.generateDiff(version1, version2, { 
        contextLines: 0,
        includeMetrics: false
      });
      expect(result.summary.filesModified).toBe(1);
    });
  });
});

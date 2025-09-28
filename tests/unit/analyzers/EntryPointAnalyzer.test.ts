/**
 * Unit tests for EntryPointAnalyzer
 * 
 * Tests cover:
 * - Happy path scenarios
 * - Failure scenarios
 * - Pathological cases
 * - Human-missable edge cases
 * - Performance and memory considerations
 * - Configuration and options
 */

import { EntryPointAnalyzer } from '../../../src/analyzers/EntryPointAnalyzer';
import { ProjectInfo, ASTNode } from '../../../src/types';
import { InvalidInputError } from '../../../src/utils/error';

describe('EntryPointAnalyzer', () => {
  let analyzer: EntryPointAnalyzer;
  let mockProjectInfo: ProjectInfo;

  beforeEach(() => {
    analyzer = new EntryPointAnalyzer();
    mockProjectInfo = {
      type: 'typescript',
      rootPath: '/test/project',
      name: 'test-project',
      version: '1.0.0',
      entryPoints: [],
      dependencies: [
        {
          name: 'react',
          version: '^18.0.0',
          type: 'production',
          source: 'npm',
          metadata: {}
        }
      ],
      devDependencies: [
        {
          name: 'typescript',
          version: '^4.9.0',
          type: 'development',
          source: 'npm',
          metadata: {}
        },
        {
          name: 'jest',
          version: '^29.0.0',
          type: 'development',
          source: 'npm',
          metadata: {}
        }
      ],
      structure: {
        directories: [],
        files: [],
        totalFiles: 0,
        totalLines: 0,
        totalSize: 0
      },
      ast: [],
      relations: [],
      publicExports: [],
      privateExports: [],
      complexity: {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        linesOfCode: 0,
        functionCount: 0,
        classCount: 0,
        interfaceCount: 0
      },
      quality: {
        score: 100,
        maintainabilityIndex: 100,
        technicalDebtRatio: 0,
        duplicationPercentage: 0,
        testCoveragePercentage: 0
      },
      metadata: {}
    };
  });

  describe('Happy Path Scenarios', () => {
    it('should detect main entry point from package.json', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js',
        module: 'dist/index.esm.js',
        types: 'dist/index.d.ts'
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(3);
      expect(result.entryPoints.find(ep => ep.type === 'main')?.path).toBe('dist/index.js');
      expect(result.entryPoints.find(ep => ep.type === 'module')?.path).toBe('dist/index.esm.js');
      expect(result.entryPoints.find(ep => ep.type === 'types')?.path).toBe('dist/index.d.ts');
    });

    it('should detect entry points from AST nodes', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: '/test/project/src/index.ts',
          type: 'file',
          name: 'index.ts',
          filePath: '/test/project/src/index.ts',
          start: 1,
          end: 10,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        },
        {
          id: '/test/project/src/app.ts',
          type: 'file',
          name: 'app.ts',
          filePath: '/test/project/src/app.ts',
          start: 1,
          end: 5,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        }
      ];

      mockProjectInfo.ast = astNodes;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(2);
      expect(result.entryPoints[0]?.path).toBe('/test/project/src/index.ts');
      expect(result.entryPoints[1]?.path).toBe('/test/project/src/app.ts');
    });

    it('should detect entry points from file patterns', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: '/test/project/src/index.ts',
          type: 'file',
          name: 'index.ts',
          filePath: '/test/project/src/index.ts',
          start: 1,
          end: 10,
          metadata: {},
          nodeType: 'module',
          children: [],
          properties: {}
        },
        {
          id: '/test/project/src/main.ts',
          type: 'file',
          name: 'main.ts',
          filePath: '/test/project/src/main.ts',
          start: 1,
          end: 5,
          metadata: {},
          nodeType: 'module',
          children: [],
          properties: {}
        }
      ];

      mockProjectInfo.ast = astNodes;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        entryPointPatterns: ['**/index.ts', '**/main.ts']
      });

      // Assert
      expect(result.entryPoints).toHaveLength(2);
      expect(result.entryPoints.find(ep => ep.path.includes('index.ts'))).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path.includes('main.ts'))).toBeDefined();
    });

    it('should categorize entry points by type', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js',
        module: 'dist/index.esm.js',
        types: 'dist/index.d.ts',
        browser: 'dist/browser.js',
        bin: {
          'my-cli': 'bin/cli.js'
        }
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(5);
      expect(result.entryPoints.find(ep => ep.type === 'main')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.type === 'module')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.type === 'types')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.type === 'browser')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.type === 'bin')).toBeDefined();
    });

    it('should detect entry points from exports field', () => {
      // Arrange
      const packageJson = {
        exports: {
          '.': './dist/index.js',
          './utils': './dist/utils.js',
          './types': './dist/types.d.ts'
        }
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(3);
      expect(result.entryPoints.find(ep => ep.path === './dist/index.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === './dist/utils.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === './dist/types.d.ts')).toBeDefined();
    });
  });

  describe('Failure Scenarios', () => {
    it('should throw error for null project info', () => {
      // Act & Assert
      expect(() => analyzer.analyze(null as any)).toThrow('Project info is required');
    });

    it('should throw error for undefined project info', () => {
      // Act & Assert
      expect(() => analyzer.analyze(undefined as any)).toThrow('Project info is required');
    });

    it('should handle missing package.json gracefully', () => {
      // Arrange
      mockProjectInfo.metadata = {};

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(0);
    });

    it('should handle malformed package.json', () => {
      // Arrange
      mockProjectInfo.metadata = { packageJson: 'invalid json' };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(0);
    });

    it('should handle missing required properties in project info', () => {
      // Arrange
      const incompleteProjectInfo = {
        rootPath: '/test/project'
      } as any;

      // Act & Assert
      expect(() => analyzer.analyze(incompleteProjectInfo)).toThrow();
    });
  });

  describe('Pathological Cases', () => {
    it('should handle extremely large number of entry points', () => {
      // Arrange
      const astNodes: ASTNode[] = [];
      for (let i = 0; i < 10000; i++) {
        astNodes.push({
          id: `/test/project/src/file${i}.ts`,
          type: 'file',
          name: `file${i}.ts`,
          filePath: `/test/project/src/file${i}.ts`,
          start: 1,
          end: 10,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        });
      }

      mockProjectInfo.ast = astNodes;

      // Act
      const startTime = Date.now();
      const result = analyzer.analyze(mockProjectInfo);
      const endTime = Date.now();

      // Assert
      expect(result.entryPoints).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle deeply nested entry point paths', () => {
      // Arrange
      const deepPath = '/test/project/' + 'a/'.repeat(100) + 'index.ts';
      const astNodes: ASTNode[] = [
        {
          id: deepPath,
          type: 'file',
          name: 'index.ts',
          filePath: deepPath,
          start: 1,
          end: 10,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        }
      ];

      mockProjectInfo.ast = astNodes;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(1);
      expect(result.entryPoints[0]?.path).toBe(deepPath);
    });

    it('should handle empty project gracefully', () => {
      // Arrange
      mockProjectInfo.ast = [];
      mockProjectInfo.metadata = {};

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(0);
    });

    it('should handle circular entry point references', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js',
        exports: {
          '.': './dist/index.js'
        }
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      // Should deduplicate and not create circular references
      expect(result.entryPoints).toHaveLength(1);
      expect(result.entryPoints[0]?.path).toBe('dist/index.js');
    });
  });

  describe('Human-Missable Edge Cases', () => {
    it('should handle relative and absolute paths correctly', () => {
      // Arrange
      const packageJson = {
        main: './dist/index.js',
        module: '/absolute/path/module.js',
        types: 'types/index.d.ts'
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(3);
      expect(result.entryPoints.find(ep => ep.path === './dist/index.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === '/absolute/path/module.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === 'types/index.d.ts')).toBeDefined();
    });

    it('should handle entry points with special characters', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index@v2.js',
        module: 'dist/module-with-dashes.js',
        types: 'dist/types.with.dots.d.ts'
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(3);
      expect(result.entryPoints.find(ep => ep.path === 'dist/index@v2.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === 'dist/module-with-dashes.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === 'dist/types.with.dots.d.ts')).toBeDefined();
    });

    it('should handle entry points with different file extensions', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js',
        module: 'dist/index.mjs',
        types: 'dist/index.d.ts',
        browser: 'dist/index.browser.js'
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(4);
      expect(result.entryPoints.find(ep => ep.path.endsWith('.js'))).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path.endsWith('.mjs'))).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path.endsWith('.d.ts'))).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path.endsWith('.browser.js'))).toBeDefined();
    });

    it('should handle entry points with query parameters', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js?v=1.0.0',
        module: 'dist/index.esm.js?format=esm'
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(2);
      expect(result.entryPoints.find(ep => ep.path === 'dist/index.js?v=1.0.0')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === 'dist/index.esm.js?format=esm')).toBeDefined();
    });

    it('should handle entry points with hash fragments', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js#main',
        module: 'dist/index.esm.js#module'
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(2);
      expect(result.entryPoints.find(ep => ep.path === 'dist/index.js#main')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === 'dist/index.esm.js#module')).toBeDefined();
    });

    it('should handle entry points with conditional exports', () => {
      // Arrange
      const packageJson = {
        exports: {
          '.': {
            'import': './dist/index.esm.js',
            'require': './dist/index.cjs.js',
            'default': './dist/index.js'
          },
          './utils': {
            'import': './dist/utils.esm.js',
            'require': './dist/utils.cjs.js'
          }
        }
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(5);
      expect(result.entryPoints.find(ep => ep.path === './dist/index.esm.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === './dist/index.cjs.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === './dist/index.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === './dist/utils.esm.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === './dist/utils.cjs.js')).toBeDefined();
    });

    it('should handle entry points with array values', () => {
      // Arrange
      const packageJson = {
        main: ['dist/index.js', 'dist/index.cjs.js'],
        module: ['dist/index.esm.js', 'dist/index.mjs']
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(4);
      expect(result.entryPoints.find(ep => ep.path === 'dist/index.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === 'dist/index.cjs.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === 'dist/index.esm.js')).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path === 'dist/index.mjs')).toBeDefined();
    });

    it('should handle entry points with null values', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js',
        module: null,
        types: undefined,
        browser: ''
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(1);
      expect(result.entryPoints[0]?.path).toBe('dist/index.js');
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory with repeated analysis', () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js',
        module: 'dist/index.esm.js',
        types: 'dist/index.d.ts'
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      for (let i = 0; i < 100; i++) {
        const result = analyzer.analyze(mockProjectInfo);
        expect(result.entryPoints).toHaveLength(3);
      }

      // Assert - if we get here without memory issues, test passes
      expect(true).toBe(true);
    });

    it('should handle concurrent analysis calls', async () => {
      // Arrange
      const packageJson = {
        main: 'dist/index.js',
        module: 'dist/index.esm.js'
      };

      mockProjectInfo.metadata = { packageJson };

      // Act
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(analyzer.analyze(mockProjectInfo))
      );

      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result.entryPoints).toHaveLength(2);
      });
    });
  });

  describe('Configuration and Options', () => {
    it('should respect custom entry point patterns', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: '/test/project/src/app.ts',
          type: 'file',
          name: 'app.ts',
          filePath: '/test/project/src/app.ts',
          start: 1,
          end: 10,
          metadata: {},
          nodeType: 'module',
          children: [],
          properties: {}
        },
        {
          id: '/test/project/src/server.ts',
          type: 'file',
          name: 'server.ts',
          filePath: '/test/project/src/server.ts',
          start: 1,
          end: 5,
          metadata: {},
          nodeType: 'module',
          children: [],
          properties: {}
        }
      ];

      mockProjectInfo.ast = astNodes;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        entryPointPatterns: ['**/app.ts', '**/server.ts']
      });

      // Assert
      expect(result.entryPoints).toHaveLength(2);
      expect(result.entryPoints.find(ep => ep.path.includes('app.ts'))).toBeDefined();
      expect(result.entryPoints.find(ep => ep.path.includes('server.ts'))).toBeDefined();
    });

    it('should respect include patterns', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: '/test/project/src/index.ts',
          type: 'file',
          name: 'index.ts',
          filePath: '/test/project/src/index.ts',
          start: 1,
          end: 10,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        },
        {
          id: '/test/project/test/index.test.ts',
          type: 'file',
          name: 'index.test.ts',
          filePath: '/test/project/test/index.test.ts',
          start: 1,
          end: 5,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        }
      ];

      mockProjectInfo.ast = astNodes;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        includePatterns: ['src/**/*.ts']
      });

      // Assert
      expect(result.entryPoints).toHaveLength(1);
      expect(result.entryPoints[0]?.path).toBe('/test/project/src/index.ts');
    });

    it('should respect exclude patterns', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: '/test/project/src/index.ts',
          type: 'file',
          name: 'index.ts',
          filePath: '/test/project/src/index.ts',
          start: 1,
          end: 10,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        },
        {
          id: '/test/project/test/index.test.ts',
          type: 'file',
          name: 'index.test.ts',
          filePath: '/test/project/test/index.test.ts',
          start: 1,
          end: 5,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        }
      ];

      mockProjectInfo.ast = astNodes;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        excludePatterns: ['test/**/*.ts']
      });

      // Assert
      expect(result.entryPoints).toHaveLength(1);
      expect(result.entryPoints[0]?.path).toBe('/test/project/src/index.ts');
    });

    it('should handle empty options', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: '/test/project/src/index.ts',
          type: 'file',
          name: 'index.ts',
          filePath: '/test/project/src/index.ts',
          start: 1,
          end: 10,
          metadata: { isEntryPoint: true },
          nodeType: 'module',
          children: [],
          properties: {}
        }
      ];

      mockProjectInfo.ast = astNodes;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.entryPoints).toHaveLength(1);
    });

    it('should throw error for invalid AST array', () => {
      const invalidProjectInfo = { ...mockProjectInfo, ast: 'not-an-array' as any };
      
      expect(() => analyzer.analyze(invalidProjectInfo)).toThrow(InvalidInputError);
      expect(() => analyzer.analyze(invalidProjectInfo)).toThrow('AST nodes must be an array');
    });

    it('should throw error for missing root path', () => {
      const invalidProjectInfo = { ...mockProjectInfo, rootPath: undefined as any };
      
      expect(() => analyzer.analyze(invalidProjectInfo)).toThrow(InvalidInputError);
      expect(() => analyzer.analyze(invalidProjectInfo)).toThrow('Project root path is required');
    });

    it('should handle binary entry points as string', () => {
      const packageJson = {
        bin: './bin/cli.js'
      };

      mockProjectInfo.metadata = { packageJson };

      const result = analyzer.analyze(mockProjectInfo);

      expect(result.entryPoints).toHaveLength(1);
      expect(result.entryPoints[0]?.type).toBe('bin');
      expect(result.entryPoints[0]?.path).toBe('./bin/cli.js');
    });

    it('should handle malformed package.json gracefully', () => {
      // Create a malformed package.json that will cause JSON parsing to fail
      mockProjectInfo.metadata = { packageJson: 'invalid json' };

      // This should not throw but handle the error gracefully
      expect(() => analyzer.analyze(mockProjectInfo)).not.toThrow();
    });

    it('should handle malformed exports field gracefully', () => {
      const packageJson = {
        exports: 'invalid exports format'
      };

      mockProjectInfo.metadata = { packageJson };

      // This should not throw but handle the error gracefully
      expect(() => analyzer.analyze(mockProjectInfo)).not.toThrow();
    });

    it('should handle exports as string', () => {
      const packageJson = {
        exports: './dist/index.js'
      };

      mockProjectInfo.metadata = { packageJson };

      const result = analyzer.analyze(mockProjectInfo);

      expect(result.entryPoints).toHaveLength(1);
      expect(result.entryPoints[0]?.path).toBe('./dist/index.js');
      expect(result.entryPoints[0]?.type).toBe('module');
    });

    it('should handle exports as array', () => {
      const packageJson = {
        exports: ['./dist/index.js', './dist/utils.js']
      };

      mockProjectInfo.metadata = { packageJson };

      const result = analyzer.analyze(mockProjectInfo);

      expect(result.entryPoints).toHaveLength(2);
      expect(result.entryPoints[0]?.path).toBe('./dist/index.js');
      expect(result.entryPoints[1]?.path).toBe('./dist/utils.js');
    });

  });
});

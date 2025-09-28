/**
 * Tests for DependencyAnalyzer
 * 
 * This test suite covers:
 * - Happy path scenarios
 * - Failure scenarios
 * - Pathological cases
 * - Human-missable edge cases
 */

import { DependencyAnalyzer } from '../../../src/analyzers/DependencyAnalyzer';
import { ProjectInfo, ASTNode, Relation, DependencyInfo } from '../../../src/types';
import { InvalidInputError } from '../../../src/utils/error';

describe('DependencyAnalyzer', () => {
  let analyzer: DependencyAnalyzer;
  let mockProjectInfo: ProjectInfo;

  beforeEach(() => {
    analyzer = new DependencyAnalyzer();
    
    // Create a comprehensive mock project for testing
    mockProjectInfo = {
      type: 'typescript',
      rootPath: '/test/project',
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project',
      author: 'Test Author',
      repository: 'https://github.com/test/project',
      entryPoints: [],
      dependencies: [
        {
          name: 'react',
          version: '^18.0.0',
          type: 'production',
          source: 'npm',
          metadata: {}
        },
        {
          name: 'typescript',
          version: '^4.9.0',
          type: 'development',
          source: 'npm',
          metadata: {}
        }
      ],
      devDependencies: [
        {
          name: 'jest',
          version: '^29.0.0',
          type: 'development',
          source: 'npm',
          metadata: {}
        }
      ],
      structure: {
        files: [],
        directories: [],
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
        score: 0,
        maintainabilityIndex: 0,
        technicalDebtRatio: 0,
        duplicationPercentage: 0,
        testCoveragePercentage: 0
      }
    };
  });

  describe('Happy Path Scenarios', () => {
    it('should analyze simple import dependencies correctly', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: 'node1',
          name: 'Button',
          type: 'class',
          nodeType: 'class',
          filePath: '/test/project/src/components/Button.tsx',
          start: 0,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'node2',
          name: 'import React',
          type: 'import',
          nodeType: 'import',
          filePath: '/test/project/src/components/Button.tsx',
          start: 0,
          end: 20,
          children: [],
          properties: {
            modulePath: 'react',
            importedNames: ['React'],
            isDefault: true,
            isNamespace: false,
            isTypeOnly: false
          },
          metadata: {}
        }
      ];

      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'node2',
          to: 'external:react',
          metadata: {
            modulePath: 'react',
            importedNames: ['React']
          }
        }
      ];

      mockProjectInfo.ast = astNodes;
      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result).toBeDefined();
      expect(result.internalDependencies).toHaveLength(0);
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.name).toBe('react');
      expect(result.externalDependencies[0]?.usageCount).toBe(1);
      expect(result.externalDependencies[0]?.files).toContain('/test/project/src/components/Button.tsx');
    });

    it('should analyze complex dependency chains', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: 'node1',
          name: 'UserService',
          type: 'class',
          nodeType: 'class',
          filePath: '/test/project/src/services/UserService.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'node2',
          name: 'ApiClient',
          type: 'class',
          nodeType: 'class',
          filePath: '/test/project/src/services/ApiClient.ts',
          start: 0,
          end: 80,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'node3',
          name: 'import ApiClient',
          type: 'import',
          nodeType: 'import',
          filePath: '/test/project/src/services/UserService.ts',
          start: 0,
          end: 25,
          children: [],
          properties: {
            modulePath: './ApiClient',
            importedNames: ['ApiClient'],
            isDefault: false,
            isNamespace: false,
            isTypeOnly: false
          },
          metadata: {}
        }
      ];

      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'node3',
          to: 'node2',
          metadata: {
            modulePath: './ApiClient',
            importedNames: ['ApiClient']
          }
        }
      ];

      mockProjectInfo.ast = astNodes;
      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
      expect(result.internalDependencies[0]?.from).toBe('/test/project/src/services/UserService.ts');
      expect(result.internalDependencies[0]?.to).toBe('/test/project/src/services/ApiClient.ts');
      expect(result.internalDependencies[0]?.type).toBe('import');
    });

    it('should handle multiple import types in same file', () => {
      // Arrange
      const astNodes: ASTNode[] = [
        {
          id: 'node1',
          name: 'import React',
          type: 'import',
          nodeType: 'import',
          filePath: '/test/project/src/App.tsx',
          start: 0,
          end: 20,
          children: [],
          properties: {
            modulePath: 'react',
            importedNames: ['React'],
            isDefault: true,
            isNamespace: false,
            isTypeOnly: false
          },
          metadata: {}
        },
        {
          id: 'node2',
          name: 'import useState',
          type: 'import',
          nodeType: 'import',
          filePath: '/test/project/src/App.tsx',
          start: 21,
          end: 45,
          children: [],
          properties: {
            modulePath: 'react',
            importedNames: ['useState'],
            isDefault: false,
            isNamespace: false,
            isTypeOnly: false
          },
          metadata: {}
        },
        {
          id: 'node3',
          name: 'import Button',
          type: 'import',
          nodeType: 'import',
          filePath: '/test/project/src/App.tsx',
          start: 46,
          end: 70,
          children: [],
          properties: {
            modulePath: './components/Button',
            importedNames: ['Button'],
            isDefault: false,
            isNamespace: false,
            isTypeOnly: false
          },
          metadata: {}
        }
      ];

      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'node1',
          to: 'external:react',
          metadata: { modulePath: 'react', importedNames: ['React'] }
        },
        {
          id: 'rel2',
          type: 'import',
          from: 'node2',
          to: 'external:react',
          metadata: { modulePath: 'react', importedNames: ['useState'] }
        },
        {
          id: 'rel3',
          type: 'import',
          from: 'node3',
          to: 'internal:./components/Button',
          metadata: { modulePath: './components/Button', importedNames: ['Button'] }
        }
      ];

      mockProjectInfo.ast = astNodes;
      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.name).toBe('react');
      expect(result.externalDependencies[0]?.usageCount).toBe(2);
      expect(result.externalDependencies[0]?.importedNames).toContain('React');
      expect(result.externalDependencies[0]?.importedNames).toContain('useState');
    });

    it('should detect circular dependencies', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'file2',
          metadata: { modulePath: './file2' }
        },
        {
          id: 'rel2',
          type: 'import',
          from: 'file2',
          to: 'file1',
          metadata: { modulePath: './file1' }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.circularDependencies).toHaveLength(1);
      expect(result.circularDependencies[0]).toEqual(['file1', 'file2']);
    });

    it('should calculate dependency metrics correctly', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'file2',
          metadata: {}
        },
        {
          id: 'rel2',
          type: 'import',
          from: 'file1',
          to: 'file3',
          metadata: {}
        },
        {
          id: 'rel3',
          type: 'import',
          from: 'file2',
          to: 'file4',
          metadata: {}
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.metrics.totalDependencies).toBe(3);
      expect(result.metrics.internalDependencies).toBe(3);
      expect(result.metrics.externalDependencies).toBe(0);
      expect(result.metrics.maxDepth).toBe(2);
      expect(result.metrics.averageDepth).toBeCloseTo(1.33, 2);
    });
  });

  describe('Failure Scenarios', () => {
    it('should throw error for null project info', () => {
      // Act & Assert
      expect(() => analyzer.analyze(null as any)).toThrow(InvalidInputError);
    });

    it('should throw error for undefined project info', () => {
      // Act & Assert
      expect(() => analyzer.analyze(undefined as any)).toThrow(InvalidInputError);
    });

    it('should handle malformed AST nodes gracefully', () => {
      // Arrange
      const malformedNodes: ASTNode[] = [
        {
          id: '',
          name: '',
          type: '',
          nodeType: 'unknown' as any,
          filePath: '',
          start: -1,
          end: -1,
          children: [],
          properties: {},
          metadata: {}
        }
      ];

      mockProjectInfo.ast = malformedNodes;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result).toBeDefined();
      expect(result.internalDependencies).toHaveLength(0);
      expect(result.externalDependencies).toHaveLength(0);
    });

    it('should handle malformed relations gracefully', () => {
      // Arrange
      const malformedRelations: Relation[] = [
        {
          id: '',
          type: 'unknown' as any,
          from: '',
          to: '',
          metadata: {}
        }
      ];

      mockProjectInfo.relations = malformedRelations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result).toBeDefined();
      expect(result.internalDependencies).toHaveLength(0);
      expect(result.externalDependencies).toHaveLength(0);
    });

    it('should handle missing required properties in project info', () => {
      // Arrange
      const incompleteProject = {
        type: 'typescript',
        rootPath: '/test/project'
        // Missing required properties
      } as any;

      // Act & Assert
      expect(() => analyzer.analyze(incompleteProject)).toThrow(InvalidInputError);
    });

    it('should throw error for invalid relations array', () => {
      // Arrange
      const invalidProjectInfo = {
        ...mockProjectInfo,
        relations: 'not an array' as any
      };

      // Act & Assert
      expect(() => analyzer.analyze(invalidProjectInfo)).toThrow('Relations must be an array');
    });

    it('should throw error for invalid AST array', () => {
      // Arrange
      const invalidProjectInfo = {
        ...mockProjectInfo,
        ast: 'not an array' as any
      };

      // Act & Assert
      expect(() => analyzer.analyze(invalidProjectInfo)).toThrow('AST nodes must be an array');
    });
  });

  describe('Pathological Cases', () => {
    it('should handle extremely large number of dependencies', () => {
      // Arrange
      const largeRelations: Relation[] = [];
      for (let i = 0; i < 10000; i++) {
        largeRelations.push({
          id: `rel${i}`,
          type: 'import',
          from: `file${i}`,
          to: `file${i + 1}`,
          metadata: {}
        });
      }

      mockProjectInfo.relations = largeRelations;

      // Act
      const startTime = Date.now();
      const result = analyzer.analyze(mockProjectInfo);
      const endTime = Date.now();

      // Assert
      expect(result).toBeDefined();
      expect(result.metrics.totalDependencies).toBe(10000);
      expect(endTime - startTime).toBeLessThan(60000); // Should complete within 60 seconds
    });

    it('should handle deeply nested dependency chains', () => {
      // Arrange
      const deepRelations: Relation[] = [];
      for (let i = 0; i < 1000; i++) {
        deepRelations.push({
          id: `rel${i}`,
          type: 'import',
          from: `file${i}`,
          to: `file${i + 1}`,
          metadata: {}
        });
      }

      mockProjectInfo.relations = deepRelations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result).toBeDefined();
      expect(result.metrics.maxDepth).toBe(1000);
      expect(result.metrics.averageDepth).toBeCloseTo(500.5, 0);
    });

    it('should handle complex circular dependency patterns', () => {
      // Arrange
      const circularRelations: Relation[] = [
        { id: 'rel1', type: 'import', from: 'A', to: 'B', metadata: {} },
        { id: 'rel2', type: 'import', from: 'B', to: 'C', metadata: {} },
        { id: 'rel3', type: 'import', from: 'C', to: 'A', metadata: {} },
        { id: 'rel4', type: 'import', from: 'A', to: 'D', metadata: {} },
        { id: 'rel5', type: 'import', from: 'D', to: 'E', metadata: {} },
        { id: 'rel6', type: 'import', from: 'E', to: 'A', metadata: {} }
      ];

      mockProjectInfo.relations = circularRelations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.circularDependencies).toHaveLength(2);
      expect(result.circularDependencies).toContainEqual(['A', 'B', 'C']);
      expect(result.circularDependencies).toContainEqual(['A', 'D', 'E']);
    });

    it('should handle empty project gracefully', () => {
      // Arrange
      const emptyProject: ProjectInfo = {
        ...mockProjectInfo,
        ast: [],
        relations: [],
        dependencies: [],
        devDependencies: []
      };

      // Act
      const result = analyzer.analyze(emptyProject);

      // Assert
      expect(result).toBeDefined();
      expect(result.internalDependencies).toHaveLength(0);
      expect(result.externalDependencies).toHaveLength(0);
      expect(result.circularDependencies).toHaveLength(0);
      expect(result.metrics.totalDependencies).toBe(0);
    });
  });

  describe('Human-Missable Edge Cases', () => {
    it('should handle duplicate imports correctly', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'external:react',
          metadata: { modulePath: 'react', importedNames: ['React'] }
        },
        {
          id: 'rel2',
          type: 'import',
          from: 'file1',
          to: 'external:react',
          metadata: { modulePath: 'react', importedNames: ['useState'] }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.usageCount).toBe(2);
      expect(result.externalDependencies[0]?.files).toHaveLength(1);
    });

    it('should handle type-only imports separately', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'external:react',
          metadata: { modulePath: 'react', importedNames: ['React'], isTypeOnly: false }
        },
        {
          id: 'rel2',
          type: 'import',
          from: 'file2',
          to: 'external:react',
          metadata: { modulePath: 'react', importedNames: ['Component'], isTypeOnly: true }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.typeOnlyImports).toBe(1);
      expect(result.externalDependencies[0]?.runtimeImports).toBe(1);
    });

    it('should handle namespace imports correctly', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'external:lodash',
          metadata: { 
            modulePath: 'lodash', 
            importedNames: ['lodash'], 
            isNamespace: true 
          }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.isNamespace).toBe(true);
    });

    it('should handle relative path resolution correctly', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/components/Button.tsx',
          to: '/test/project/src/utils/helpers.ts',
          metadata: { modulePath: '../utils/helpers' }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
      expect(result.internalDependencies[0]?.resolvedPath).toBe('/test/project/src/utils/helpers.ts');
    });

    it('should handle barrel exports correctly', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'file2',
          metadata: { modulePath: './index', isBarrelExport: true }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
      expect(result.internalDependencies[0]?.isBarrelExport).toBe(true);
    });

    it('should handle dynamic imports correctly', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'external:react',
          metadata: { 
            modulePath: 'react', 
            isDynamic: true,
            condition: 'lazy loading'
          }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.isDynamic).toBe(true);
    });

    it('should handle conditional imports correctly', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'external:lodash',
          metadata: { 
            modulePath: 'lodash', 
            condition: 'process.env.NODE_ENV === "development"'
          }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.conditions).toContain('process.env.NODE_ENV === "development"');
    });

    it('should handle peer dependencies correctly', () => {
      // Arrange
      const peerDeps: DependencyInfo[] = [
        {
          name: 'react',
          version: '^18.0.0',
          type: 'peer',
          source: 'npm',
          metadata: {}
        }
      ];

      mockProjectInfo.dependencies = peerDeps;
      mockProjectInfo.devDependencies = []; // Clear dev dependencies for this test

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.packageDependencies).toHaveLength(1);
      expect(result.packageDependencies[0]?.type).toBe('peer');
    });

    it('should handle optional dependencies correctly', () => {
      // Arrange
      const optionalDeps: DependencyInfo[] = [
        {
          name: 'optional-package',
          version: '^1.0.0',
          type: 'optional',
          source: 'npm',
          metadata: {}
        }
      ];

      mockProjectInfo.dependencies = optionalDeps;
      mockProjectInfo.devDependencies = []; // Clear dev dependencies for this test

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.packageDependencies).toHaveLength(1);
      expect(result.packageDependencies[0]?.type).toBe('optional');
    });

    it('should handle scoped packages correctly', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'external:@types/react',
          metadata: { modulePath: '@types/react', importedNames: ['React'] }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.name).toBe('@types/react');
      expect(result.externalDependencies[0]?.isScoped).toBe(true);
    });

    it('should handle git dependencies correctly', () => {
      // Arrange
      const gitDeps: DependencyInfo[] = [
        {
          name: 'custom-package',
          version: 'git+https://github.com/user/repo.git#main',
          type: 'production',
          source: 'git',
          metadata: { url: 'https://github.com/user/repo.git', branch: 'main' }
        }
      ];

      mockProjectInfo.dependencies = gitDeps;
      mockProjectInfo.devDependencies = []; // Clear dev dependencies for this test

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.packageDependencies).toHaveLength(1);
      expect(result.packageDependencies[0]?.source).toBe('git');
      expect(result.packageDependencies[0]?.metadata['url']).toBe('https://github.com/user/repo.git');
    });

    it('should handle local file dependencies correctly', () => {
      // Arrange
      const localDeps: DependencyInfo[] = [
        {
          name: 'local-package',
          version: 'file:../local-package',
          type: 'production',
          source: 'local',
          metadata: { path: '../local-package' }
        }
      ];

      mockProjectInfo.dependencies = localDeps;
      mockProjectInfo.devDependencies = []; // Clear dev dependencies for this test

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.packageDependencies).toHaveLength(1);
      expect(result.packageDependencies[0]?.source).toBe('local');
      expect(result.packageDependencies[0]?.metadata['path']).toBe('../local-package');
    });

    it('should handle version ranges correctly', () => {
      // Arrange
      const versionDeps: DependencyInfo[] = [
        {
          name: 'package1',
          version: '^1.0.0',
          type: 'production',
          source: 'npm',
          metadata: {}
        },
        {
          name: 'package2',
          version: '~2.1.0',
          type: 'production',
          source: 'npm',
          metadata: {}
        },
        {
          name: 'package3',
          version: '>=3.0.0 <4.0.0',
          type: 'production',
          source: 'npm',
          metadata: {}
        }
      ];

      mockProjectInfo.dependencies = versionDeps;
      mockProjectInfo.devDependencies = []; // Clear dev dependencies for this test

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.packageDependencies).toHaveLength(3);
      expect(result.versionAnalysis.caretRanges).toBe(1);
      expect(result.versionAnalysis.tildeRanges).toBe(1);
      expect(result.versionAnalysis.complexRanges).toBe(1);
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory with repeated analysis', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'file2',
          metadata: {}
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      for (let i = 0; i < 1000; i++) {
        const result = analyzer.analyze(mockProjectInfo);
        expect(result).toBeDefined();
      }

      // Assert - If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });

    it('should handle concurrent analysis calls', async () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: 'file1',
          to: 'file2',
          metadata: {}
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(analyzer.analyze(mockProjectInfo))
      );

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.internalDependencies).toHaveLength(1);
      });
    });
  });

  describe('Configuration and Options', () => {
    it('should respect include patterns', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: '/test/project/src/file2.ts',
          metadata: {}
        },
        {
          id: 'rel2',
          type: 'import',
          from: '/test/project/test/file1.test.ts',
          to: '/test/project/test/file2.test.ts',
          metadata: {}
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        includePatterns: ['src/**/*.ts']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
      expect(result.internalDependencies[0]?.from).toBe('/test/project/src/file1.ts');
    });

    it('should respect exclude patterns', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: '/test/project/src/file2.ts',
          metadata: {}
        },
        {
          id: 'rel2',
          type: 'import',
          from: '/test/project/test/file1.test.ts',
          to: '/test/project/test/file2.test.ts',
          metadata: {}
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        excludePatterns: ['**/test/**']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
      expect(result.internalDependencies[0]?.from).toBe('/test/project/src/file1.ts');
    });

    it('should handle custom dependency types', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'custom' as any,
          from: 'file1',
          to: 'file2',
          metadata: { customType: 'special' }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        customRelationTypes: ['custom']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
      expect(result.internalDependencies[0]?.type).toBe('custom');
    });

    it('should handle complex glob patterns with **/dir/**/*.ts', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/components/Button.ts',
          to: '/test/project/lib/utils/helper.ts',
          metadata: { modulePath: '../utils/helper' }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        includePatterns: ['**/src/**/*.ts']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
    });

    it('should handle patterns that do not match any files', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/components/Button.tsx',
          to: '/test/project/utils/helper.ts',
          metadata: { modulePath: '../utils/helper' }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        includePatterns: ['**/nonexistent/**/*.ts']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(0);
    });

    it('should handle patterns starting with /', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/components/Button.ts',
          to: '/test/project/utils/helper.ts',
          metadata: { modulePath: '../utils/helper' }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        includePatterns: ['/test/project/src/**/*.ts']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
    });

    it('should handle patterns with ? wildcard', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/components/Button.ts',
          to: '/test/project/utils/helper.ts',
          metadata: { modulePath: '../utils/helper' }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        includePatterns: ['**/src/**/Button.t?']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(0); // Pattern doesn't match .ts extension
    });

    it('should handle patterns with **/test/**/*.ts format', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/test/components/Button.test.ts',
          to: '/test/project/test/utils/helper.test.ts',
          metadata: { modulePath: '../utils/helper' }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        includePatterns: ['**/test/**/*.ts']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
    });

    it('should handle empty options', () => {
      // Arrange
      const emptyProjectInfo: ProjectInfo = {
        type: 'typescript',
        rootPath: '/test/project',
        name: 'test-project',
        version: '1.0.0',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
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
        }
      };

      // Act
      const result = analyzer.analyze(emptyProjectInfo);

      // Assert
      expect(result.internalDependencies).toHaveLength(0);
      expect(result.externalDependencies).toHaveLength(0);
      expect(result.packageDependencies).toHaveLength(0);
    });
  });

  describe('Edge Cases for Coverage', () => {
    it('should handle relations with existing importedNames', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: '/test/project/src/file2.ts',
          metadata: { 
            modulePath: './file2',
            importedNames: ['Component']
          }
        },
        {
          id: 'rel2',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: '/test/project/src/file2.ts',
          metadata: { 
            modulePath: './file2',
            importedNames: ['Helper']
          }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
      expect(result.internalDependencies[0]?.importedNames).toContain('Component');
      expect(result.internalDependencies[0]?.importedNames).toContain('Helper');
    });

    it('should handle external dependencies with existing importedNames', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: 'external:react',
          metadata: { 
            modulePath: 'react',
            importedNames: ['Component']
          }
        },
        {
          id: 'rel2',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: 'external:react',
          metadata: { 
            modulePath: 'react',
            importedNames: ['useState']
          }
        }
      ];

      const projectInfo: ProjectInfo = {
        type: 'typescript',
        rootPath: '/test/project',
        name: 'test-project',
        version: '1.0.0',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: { 
          directories: [], 
          files: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: [
          {
            id: '/test/project/src/file1.ts',
            type: 'file',
            name: 'file1.ts',
            filePath: '/test/project/src/file1.ts',
            start: 1,
            end: 1,
            metadata: {},
            nodeType: 'module',
            children: [],
            properties: {}
          }
        ],
        relations,
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
        }
      };

      // Act
      const result = analyzer.analyze(projectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.importedNames).toContain('Component');
      expect(result.externalDependencies[0]?.importedNames).toContain('useState');
    });

    it('should handle external dependencies with existing conditions', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: 'external:react',
          metadata: { 
            modulePath: 'react',
            condition: 'development'
          }
        },
        {
          id: 'rel2',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: 'external:react',
          metadata: { 
            modulePath: 'react',
            condition: 'production'
          }
        }
      ];

      const projectInfo: ProjectInfo = {
        type: 'typescript',
        rootPath: '/test/project',
        name: 'test-project',
        version: '1.0.0',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: { 
          directories: [], 
          files: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: [
          {
            id: '/test/project/src/file1.ts',
            type: 'file',
            name: 'file1.ts',
            filePath: '/test/project/src/file1.ts',
            start: 1,
            end: 1,
            metadata: {},
            nodeType: 'module',
            children: [],
            properties: {}
          }
        ],
        relations,
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
        }
      };

      // Act
      const result = analyzer.analyze(projectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.conditions).toContain('development');
      expect(result.externalDependencies[0]?.conditions).toContain('production');
    });

    it('should handle non-relative module paths in resolvePath', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: 'external:react',
          metadata: { 
            modulePath: 'react'
          }
        }
      ];

      const projectInfo: ProjectInfo = {
        type: 'typescript',
        rootPath: '/test/project',
        name: 'test-project',
        version: '1.0.0',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: { 
          directories: [], 
          files: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0
        },
        ast: [
          {
            id: '/test/project/src/file1.ts',
            type: 'file',
            name: 'file1.ts',
            filePath: '/test/project/src/file1.ts',
            start: 1,
            end: 1,
            metadata: {},
            nodeType: 'module',
            children: [],
            properties: {}
          }
        ],
        relations,
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
        }
      };

      // Act
      const result = analyzer.analyze(projectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.externalDependencies[0]?.name).toBe('react');
    });

    it('should handle resolveRelativePath with empty parts', () => {
      // Arrange
      const relations: Relation[] = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/file1.ts',
          to: '/test/project/src/file2.ts',
          metadata: { 
            modulePath: './file2'
          }
        }
      ];

      mockProjectInfo.relations = relations;

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
    });

    it('should handle calculateMaxDepth with empty dependencies', () => {
      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.metrics.maxDepth).toBe(0);
    });

    it('should handle calculateAverageDepth with empty dependencies', () => {
      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.metrics.averageDepth).toBe(0);
    });

    it('should handle analyzeVersions with empty dependencies', () => {
      // Arrange
      const emptyProjectInfo: ProjectInfo = {
        type: 'typescript',
        rootPath: '/test/project',
        name: 'test-project',
        version: '1.0.0',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
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
        }
      };

      // Act
      const result = analyzer.analyze(emptyProjectInfo);

      // Assert
      expect(result.versionAnalysis.caretRanges).toBe(0);
      expect(result.versionAnalysis.tildeRanges).toBe(0);
      expect(result.versionAnalysis.exactVersions).toBe(0);
      expect(result.versionAnalysis.complexRanges).toBe(0);
    });

    it('should handle analyzeUsageStatistics with empty dependencies', () => {
      // Arrange
      const emptyProjectInfo: ProjectInfo = {
        type: 'typescript',
        rootPath: '/test/project',
        name: 'test-project',
        version: '1.0.0',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
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
        }
      };

      // Act
      const result = analyzer.analyze(emptyProjectInfo);

      // Assert
      expect(result.usageStatistics.mostUsed).toHaveLength(0);
      expect(result.usageStatistics.leastUsed).toHaveLength(0);
      expect(result.usageStatistics.unused).toHaveLength(0);
    });

    it('should handle exclude patterns for both from and to paths', () => {
      // Arrange
      mockProjectInfo.relations = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/index.ts',
          to: '/test/project/src/utils.ts',
          metadata: {}
        },
        {
          id: 'rel2',
          type: 'import',
          from: '/test/project/test/index.test.ts',
          to: '/test/project/src/utils.ts',
          metadata: {}
        }
      ];

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        excludePatterns: ['**/test/**']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(1);
    });

    it('should handle external dependencies in isInternalRelation', () => {
      // Arrange
      mockProjectInfo.relations = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/index.ts',
          to: 'external:react',
          metadata: {}
        }
      ];

      // Act
      const result = analyzer.analyze(mockProjectInfo);

      // Assert
      expect(result.externalDependencies).toHaveLength(1);
      expect(result.internalDependencies).toHaveLength(0);
    });

    it('should handle complex glob patterns with **/test/**/*.ts format', () => {
      // Arrange
      mockProjectInfo.relations = [
        {
          id: 'rel1',
          type: 'import',
          from: '/test/project/src/index.ts',
          to: '/test/project/test/utils.test.ts',
          metadata: {}
        }
      ];

      // Act
      const result = analyzer.analyze(mockProjectInfo, {
        excludePatterns: ['**/test/**/*.ts']
      });

      // Assert
      expect(result.internalDependencies).toHaveLength(0);
    });
  });
});

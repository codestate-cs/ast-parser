/**
 * Tests for IndexBuilder class
 */

import { IndexBuilder } from '../../../src/indexing/IndexBuilder';
import {
  IndexBuilderOptions,
} from '../../../src/types/indexing';
import { ProjectType, ProjectInfo } from '../../../src/types/core';

describe('IndexBuilder', () => {
  let indexBuilder: IndexBuilder;
  let mockProjectInfo: ProjectInfo;

  beforeEach(() => {
    mockProjectInfo = {
      type: 'typescript' as ProjectType,
      rootPath: '/path/to/project',
      name: 'Test Project',
      version: '1.0.0',
      description: 'A test project',
      author: 'Test Author',
      repository: 'https://github.com/test/project',
      entryPoints: [
        {
          path: '/path/to/project/src/index.ts',
          type: 'main',
          description: 'Main entry point',
          metadata: {},
        },
      ],
      dependencies: [
        {
          name: 'typescript',
          version: '^4.0.0',
          type: 'development',
          source: 'npm',
          metadata: {},
        },
      ],
      devDependencies: [],
      structure: {
        files: [
          {
            path: '/path/to/project/src/index.ts',
            name: 'index.ts',
            extension: '.ts',
            size: 1024,
            lines: 50,
            lastModified: new Date('2024-01-01'),
            hash: 'abc123',
          },
        ],
        directories: [
          {
            path: '/path/to/project/src',
            name: 'src',
            fileCount: 1,
            subdirectoryCount: 0,
            totalSize: 1024,
          },
        ],
        totalFiles: 1,
        totalLines: 50,
        totalSize: 1024,
      },
      ast: [],
      relations: [],
      publicExports: [],
      privateExports: [],
      complexity: {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        linesOfCode: 50,
        functionCount: 2,
        classCount: 1,
        interfaceCount: 1,
      },
      quality: {
        score: 85,
        maintainabilityIndex: 80,
        technicalDebtRatio: 0.15,
        duplicationPercentage: 5,
        testCoveragePercentage: 90,
      },
    };


    indexBuilder = new IndexBuilder();
  });

  describe('constructor', () => {
    it('should create an IndexBuilder with default options', () => {
      expect(indexBuilder).toBeInstanceOf(IndexBuilder);
    });

    it('should create an IndexBuilder with custom options', () => {
      const options: IndexBuilderOptions = {
        forceRebuild: true,
        includeMetadata: false,
        parallelProcessing: true,
        maxConcurrency: 5,
      };
      
      const builder = new IndexBuilder(options);
      expect(builder).toBeInstanceOf(IndexBuilder);
    });
  });

  describe('buildProjectIndex', () => {
    it('should build a project index from project info', async () => {
      const result = await indexBuilder.buildProjectIndex(mockProjectInfo);
      
      expect(result).toBeDefined();
      const project = result.getProject();
      expect(project).toMatchObject({
        name: mockProjectInfo.name,
        type: mockProjectInfo.type,
        rootPath: mockProjectInfo.rootPath,
        version: mockProjectInfo.version,
        description: mockProjectInfo.description,
        author: mockProjectInfo.author,
        repository: mockProjectInfo.repository,
      });
    });

    it('should include metadata when specified', async () => {
      const options: IndexBuilderOptions = {
        includeMetadata: true,
        forceRebuild: false,
        parallelProcessing: false,
        maxConcurrency: 1,
      };
      
      const builder = new IndexBuilder(options);
      const result = await builder.buildProjectIndex(mockProjectInfo);
      
      expect(result.getMetadata()).toBeDefined();
    });

    it('should generate consistent project IDs for same project', async () => {
      const result1 = await indexBuilder.buildProjectIndex(mockProjectInfo);
      const result2 = await indexBuilder.buildProjectIndex(mockProjectInfo);
      
      expect(result1.getProject().id).toBeDefined();
      expect(result2.getProject().id).toBeDefined();
      expect(result1.getProject().id).toBe(result2.getProject().id);
    });

    it('should calculate project statistics correctly', async () => {
      const result = await indexBuilder.buildProjectIndex(mockProjectInfo);
      const project = result.getProject();
      
      expect(project.size).toBe(mockProjectInfo.structure.totalSize);
      expect(project.fileCount).toBe(mockProjectInfo.structure.totalFiles);
      expect(project.linesOfCode).toBe(mockProjectInfo.structure.totalLines);
    });

    it('should extract languages from project', async () => {
      const result = await indexBuilder.buildProjectIndex(mockProjectInfo);
      const project = result.getProject();
      
      expect(project.languages).toContain('typescript');
    });

    it('should set timestamps correctly', async () => {
      const result = await indexBuilder.buildProjectIndex(mockProjectInfo);
      const project = result.getProject();
      const index = result.toInterface();
      
      expect(index.createdAt).toBeInstanceOf(Date);
      expect(index.updatedAt).toBeInstanceOf(Date);
      expect(project.lastAnalyzed).toBeInstanceOf(Date);
    });
  });

  describe('buildGlobalIndex', () => {
    it('should build a global index from multiple project infos', async () => {
      const projectInfos = [mockProjectInfo];
      
      const result = await indexBuilder.buildGlobalIndex(projectInfos);
      
      expect(result).toBeDefined();
      expect(result.listProjects()).toHaveLength(1);
      expect(result.getStatistics().totalProjects).toBe(1);
    });

    it('should handle multiple projects', async () => {
      const projectInfo2 = {
        ...mockProjectInfo,
        name: 'Test Project 2',
        rootPath: '/path/to/project2',
      };
      
      const projectInfos = [mockProjectInfo, projectInfo2];
      
      const result = await indexBuilder.buildGlobalIndex(projectInfos);
      
      expect(result.listProjects()).toHaveLength(2);
      expect(result.getStatistics().totalProjects).toBe(2);
    });

    it('should calculate global statistics correctly', async () => {
      const projectInfo2 = {
        ...mockProjectInfo,
        name: 'Test Project 2',
        rootPath: '/path/to/project2',
        structure: {
          ...mockProjectInfo.structure,
          totalSize: 2048,
          totalFiles: 2,
          totalLines: 100,
        },
      };
      
      const projectInfos = [mockProjectInfo, projectInfo2];
      
      const result = await indexBuilder.buildGlobalIndex(projectInfos);
      
      expect(result.getStatistics().totalSize).toBe(3072); // 1024 + 2048
      expect(result.getStatistics().totalFiles).toBe(3); // 1 + 2
      expect(result.getStatistics().totalLinesOfCode).toBe(150); // 50 + 100
    });

    it('should handle empty project list', async () => {
      const result = await indexBuilder.buildGlobalIndex([]);
      
      expect(result.listProjects()).toHaveLength(0);
      expect(result.getStatistics().totalProjects).toBe(0);
    });
  });

  describe('updateProjectIndex', () => {
    it('should update an existing project index', async () => {
      const originalIndex = await indexBuilder.buildProjectIndex(mockProjectInfo);
      const updatedProjectInfo = {
        ...mockProjectInfo,
        version: '2.0.0',
        description: 'Updated description',
      };
      
      const result = await indexBuilder.updateProjectIndex(originalIndex, updatedProjectInfo);
      const project = result.getProject();
      const originalProject = originalIndex.getProject();
      
      expect(project.version).toBe('2.0.0');
      expect(project.description).toBe('Updated description');
      expect(project.id).toBe(originalProject.id);
    });

    it('should preserve existing versions and branches', async () => {
      const originalIndex = await indexBuilder.buildProjectIndex(mockProjectInfo);
      originalIndex.addVersion({
        id: 'version-1',
        version: '1.0.0',
        type: 'semantic',
        createdAt: new Date('2024-01-01'),
        metadata: {},
      });
      
      const updatedProjectInfo = {
        ...mockProjectInfo,
        version: '2.0.0',
      };
      
      const result = await indexBuilder.updateProjectIndex(originalIndex, updatedProjectInfo);
      const versions = result.getVersions();
      
      expect(versions).toHaveLength(1);
      expect(versions[0]?.version).toBe('1.0.0');
    });

    it('should update timestamps', async () => {
      const originalIndex = await indexBuilder.buildProjectIndex(mockProjectInfo);
      const originalIndexInterface = originalIndex.toInterface();
      const originalUpdatedAt = originalIndexInterface.updatedAt;
      
      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updatedProjectInfo = {
        ...mockProjectInfo,
        version: '2.0.0',
      };
      
      const result = await indexBuilder.updateProjectIndex(originalIndex, updatedProjectInfo);
      const resultInterface = result.toInterface();
      
      expect(resultInterface.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('validateProjectInfo', () => {
    it('should return true for valid project info', () => {
      const isValid = indexBuilder.validateProjectInfo(mockProjectInfo);
      
      expect(isValid).toBe(true);
    });

    it('should throw error for invalid project info', () => {
      const invalidProjectInfo = {
        ...mockProjectInfo,
        name: '',
        rootPath: '',
      };
      
      expect(() => {
        indexBuilder.validateProjectInfo(invalidProjectInfo);
      }).toThrow('Project info is missing required fields');
    });

    it('should throw error for missing required fields', () => {
      const invalidProjectInfo = {
        ...mockProjectInfo,
        name: undefined as any,
        type: undefined as any,
      };
      
      expect(() => {
        indexBuilder.validateProjectInfo(invalidProjectInfo);
      }).toThrow('Project info is missing required fields');
    });
  });

  describe('extractProjectMetadata', () => {
    it('should extract metadata from project info', () => {
      const metadata = indexBuilder.extractProjectMetadata(mockProjectInfo);
      
      expect(metadata).toBeDefined();
      expect(metadata['dependencies']).toBeDefined();
      expect(metadata['entryPoints']).toBeDefined();
      expect(metadata['complexity']).toBeDefined();
      expect(metadata['quality']).toBeDefined();
    });

    it('should include dependency information', () => {
      const metadata = indexBuilder.extractProjectMetadata(mockProjectInfo);
      
      expect(metadata['dependencies']).toHaveLength(1);
      expect((metadata['dependencies'] as any[])[0].name).toBe('typescript');
    });

    it('should include entry point information', () => {
      const metadata = indexBuilder.extractProjectMetadata(mockProjectInfo);
      
      expect(metadata['entryPoints']).toHaveLength(1);
      expect((metadata['entryPoints'] as any[])[0].path).toBe('/path/to/project/src/index.ts');
    });
  });

  describe('generateProjectId', () => {
    it('should generate unique IDs for different projects', () => {
      const id1 = indexBuilder.generateProjectId(mockProjectInfo);
      const id2 = indexBuilder.generateProjectId({
        ...mockProjectInfo,
        name: 'Different Project',
        rootPath: '/different/path',
      });
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate consistent IDs for same project', () => {
      const id1 = indexBuilder.generateProjectId(mockProjectInfo);
      const id2 = indexBuilder.generateProjectId(mockProjectInfo);
      
      expect(id1).toBe(id2);
    });
  });

  describe('progress tracking', () => {
    it('should call progress callback when provided', async () => {
      const progressCallback = jest.fn();
      const options: IndexBuilderOptions = {
        onProgress: progressCallback,
        forceRebuild: false,
        includeMetadata: true,
        parallelProcessing: false,
        maxConcurrency: 1,
      };
      
      const builder = new IndexBuilder(options);
      await builder.buildProjectIndex(mockProjectInfo);
      
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should provide progress information', async () => {
      const progressCallback = jest.fn();
      const options: IndexBuilderOptions = {
        onProgress: progressCallback,
        forceRebuild: false,
        includeMetadata: true,
        parallelProcessing: false,
        maxConcurrency: 1,
      };
      
      const builder = new IndexBuilder(options);
      await builder.buildProjectIndex(mockProjectInfo);
      
      const progressCall = progressCallback.mock.calls[0][0];
      expect(progressCall).toMatchObject({
        step: expect.any(String),
        progress: expect.any(Number),
        itemsProcessed: expect.any(Number),
        totalItems: expect.any(Number),
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid project info gracefully', async () => {
      const invalidProjectInfo = {
        ...mockProjectInfo,
        name: '',
        rootPath: '',
      };
      
      expect(() => indexBuilder.buildProjectIndex(invalidProjectInfo)).toThrow();
    });

    it('should handle missing project info', () => {
      expect(() => indexBuilder.buildProjectIndex(null as any)).toThrow();
    });

    it('should handle empty project list', async () => {
      const result = await indexBuilder.buildGlobalIndex([]);
      
      expect(result).toBeDefined();
      expect(result.listProjects()).toHaveLength(0);
    });

    it('should handle project list with null entries', async () => {
      const projectInfo2 = {
        ...mockProjectInfo,
        name: 'Test Project 2',
        rootPath: '/path/to/project2',
      };
      
      const projectInfos: (ProjectInfo | null)[] = [
        mockProjectInfo,
        null,
        projectInfo2
      ];
      
      const result = await indexBuilder.buildGlobalIndex(projectInfos as any);
      
      expect(result).toBeDefined();
      expect(result.listProjects()).toHaveLength(2); // Only valid projects
    });

    it('should handle project list with undefined entries', async () => {
      const projectInfo2 = {
        ...mockProjectInfo,
        name: 'Test Project 2',
        rootPath: '/path/to/project2',
      };
      
      const projectInfos: (ProjectInfo | undefined)[] = [
        mockProjectInfo,
        undefined,
        projectInfo2
      ];
      
      const result = await indexBuilder.buildGlobalIndex(projectInfos as any);
      
      expect(result).toBeDefined();
      expect(result.listProjects()).toHaveLength(2); // Only valid projects
    });
  });

  describe('options handling', () => {
    it('should respect forceRebuild option', async () => {
      const options: IndexBuilderOptions = {
        forceRebuild: true,
        includeMetadata: true,
        parallelProcessing: false,
        maxConcurrency: 1,
      };
      
      const builder = new IndexBuilder(options);
      const result = await builder.buildProjectIndex(mockProjectInfo);
      
      expect(result).toBeDefined();
    });

    it('should respect includeMetadata option', async () => {
      const options: IndexBuilderOptions = {
        forceRebuild: false,
        includeMetadata: false,
        parallelProcessing: false,
        maxConcurrency: 1,
      };
      
      const builder = new IndexBuilder(options);
      const result = await builder.buildProjectIndex(mockProjectInfo);
      
      expect(result.getMetadata()).toEqual({});
    });
  });

  describe('language extraction', () => {
    it('should extract typescript language for typescript project', async () => {
      const result = await indexBuilder.buildProjectIndex(mockProjectInfo);
      const project = result.getProject();
      
      expect(project.languages).toContain('typescript');
    });

    it('should extract javascript language for javascript project', async () => {
      const jsProject = {
        ...mockProjectInfo,
        type: 'javascript' as ProjectType,
      };
      
      const result = await indexBuilder.buildProjectIndex(jsProject);
      const project = result.getProject();
      
      expect(project.languages).toContain('javascript');
    });

    it('should extract both typescript and javascript for react project', async () => {
      const reactProject = {
        ...mockProjectInfo,
        type: 'react' as ProjectType,
      };
      
      const result = await indexBuilder.buildProjectIndex(reactProject);
      const project = result.getProject();
      
      expect(project.languages).toContain('typescript');
      expect(project.languages).toContain('javascript');
    });

    it('should extract javascript language for node project', async () => {
      const nodeProject = {
        ...mockProjectInfo,
        type: 'node' as ProjectType,
      };
      
      const result = await indexBuilder.buildProjectIndex(nodeProject);
      const project = result.getProject();
      
      expect(project.languages).toContain('javascript');
    });

    it('should extract additional languages from dependencies', async () => {
      const projectWithPythonDep = {
        ...mockProjectInfo,
        dependencies: [
          ...mockProjectInfo.dependencies,
          {
            name: 'python-package',
            version: '1.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {},
          },
        ],
      };
      
      const result = await indexBuilder.buildProjectIndex(projectWithPythonDep);
      const project = result.getProject();
      
      expect(project.languages).toContain('python');
    });
  });

  describe('tag extraction', () => {
    it('should extract project type as tag', async () => {
      const result = await indexBuilder.buildProjectIndex(mockProjectInfo);
      const project = result.getProject();
      
      expect(project.tags).toContain('typescript');
    });

    it('should extract framework tags from dependencies', async () => {
      const reactProject = {
        ...mockProjectInfo,
        dependencies: [
          ...mockProjectInfo.dependencies,
          {
            name: 'react',
            version: '18.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {},
          },
        ],
      };
      
      const result = await indexBuilder.buildProjectIndex(reactProject);
      const project = result.getProject();
      
      expect(project.tags).toContain('react');
    });

    it('should extract quality-based tags', async () => {
      const highQualityProject = {
        ...mockProjectInfo,
        quality: {
          score: 95,
          maintainabilityIndex: 90,
          technicalDebtRatio: 0.05,
          duplicationPercentage: 2,
          testCoveragePercentage: 95,
        },
      };
      
      const result = await indexBuilder.buildProjectIndex(highQualityProject);
      const project = result.getProject();
      
      expect(project.tags).toContain('high-quality');
      expect(project.tags).toContain('well-tested');
      expect(project.tags).toContain('low-duplication');
    });

    it('should extract complexity-based tags', async () => {
      const lowComplexityProject = {
        ...mockProjectInfo,
        complexity: {
          cyclomaticComplexity: 5,
          cognitiveComplexity: 3,
          linesOfCode: 50,
          functionCount: 2,
          classCount: 1,
          interfaceCount: 1,
        },
      };
      
      const result = await indexBuilder.buildProjectIndex(lowComplexityProject);
      const project = result.getProject();
      
      expect(project.tags).toContain('low-complexity');
    });

    it('should handle errors gracefully in buildGlobalIndex', async () => {
      // Mock console.warn to avoid console output during tests
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      // Create a project info that will cause an error
      const invalidProjectInfo = {
        ...mockProjectInfo,
        name: '', // Invalid name to cause error
      };
      
      const projectInfos = [mockProjectInfo, invalidProjectInfo];
      
      const result = await indexBuilder.buildGlobalIndex(projectInfos);
      
      // Should still build the index with valid projects
      expect(result).toBeDefined();
      expect(result.listProjects()).toHaveLength(1); // Only the valid project
      
      // Restore console.warn
      console.warn = originalWarn;
    });

    it('should handle errors gracefully in buildGlobalIndex', async () => {
      // Mock console.warn to avoid console output during tests
      const originalWarn = console.warn;
      console.warn = jest.fn();
      
      // Create a project info that will cause an error
      const invalidProjectInfo = {
        ...mockProjectInfo,
        name: '', // Invalid name to cause error
      };
      
      const projectInfos = [mockProjectInfo, invalidProjectInfo];
      
      const result = await indexBuilder.buildGlobalIndex(projectInfos);
      
      // Should still build the index with valid projects
      expect(result).toBeDefined();
      expect(result.listProjects()).toHaveLength(1); // Only the valid project
      
      // Restore console.warn
      console.warn = originalWarn;
    });

    it('should throw error for project info missing structure', () => {
      const invalidProjectInfo = {
        ...mockProjectInfo,
        structure: undefined, // Missing structure
      };
      
      expect(() => indexBuilder.validateProjectInfo(invalidProjectInfo as any)).toThrow('Project info is missing structure information');
    });

    it('should extract javascript language for unknown project type', async () => {
      const unknownTypeProject = {
        ...mockProjectInfo,
        type: 'unknown' as any, // Unknown type
      };
      
      const result = await indexBuilder.buildProjectIndex(unknownTypeProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().languages).toContain('javascript'); // Should default to javascript
    });

    it('should extract go language from dependencies', async () => {
      const goProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'go-something',
            version: '1.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(goProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().languages).toContain('go');
    });

    it('should extract java language from dependencies', async () => {
      const javaProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'java-something',
            version: '1.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(javaProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().languages).toContain('java');
    });

    it('should extract vue framework tag from dependencies', async () => {
      const vueProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'vue-router',
            version: '4.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(vueProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().tags).toContain('vue');
    });

    it('should extract angular framework tag from dependencies', async () => {
      const angularProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'angular-core',
            version: '15.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(angularProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().tags).toContain('angular');
    });

    it('should extract express framework tag from dependencies', async () => {
      const expressProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'express-server',
            version: '4.18.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(expressProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().tags).toContain('express');
    });

    it('should extract koa framework tag from dependencies', async () => {
      const koaProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'koa-router',
            version: '12.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(koaProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().tags).toContain('koa');
    });

    it('should extract testing tag from dependencies', async () => {
      const testingProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'jest-testing',
            version: '29.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(testingProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().tags).toContain('testing');
    });

    it('should extract linting tag from dependencies', async () => {
      const lintingProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'eslint-config',
            version: '8.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(lintingProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().tags).toContain('linting');
    });

    it('should extract bundling tag from dependencies', async () => {
      const bundlingProject = {
        ...mockProjectInfo,
        dependencies: [
          {
            name: 'webpack-bundler',
            version: '5.0.0',
            type: 'production' as const,
            source: 'npm' as const,
            metadata: {}
          }
        ]
      };
      
      const result = await indexBuilder.buildProjectIndex(bundlingProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().tags).toContain('bundling');
    });

    it('should extract high-complexity tag from project complexity', async () => {
      const highComplexityProject = {
        ...mockProjectInfo,
        complexity: {
          cyclomaticComplexity: 25,
          cognitiveComplexity: 15,
          linesOfCode: 1000,
          functionCount: 50,
          classCount: 10,
          interfaceCount: 5,
        }
      };
      
      const result = await indexBuilder.buildProjectIndex(highComplexityProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().tags).toContain('high-complexity');
    });
  });
});

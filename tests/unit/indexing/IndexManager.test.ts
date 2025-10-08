/**
 * Tests for IndexManager class
 */

import { IndexManager } from '../../../src/indexing/IndexManager';
import { ProjectIndex } from '../../../src/indexing/ProjectIndex';
import {
  IndexManagerOptions,
  IndexConfig,
  ProjectIndexEntry,
  SearchQuery,
} from '../../../src/types/indexing';
import { ProjectInfo, ProjectType, Language } from '../../../src/types/core';

describe('IndexManager', () => {
  let indexManager: IndexManager;
  let mockProjectInfo: ProjectInfo[];
  let mockProjectEntries: ProjectIndexEntry[];

  beforeEach(() => {
    mockProjectInfo = [
      {
        name: 'Test Project',
        type: 'typescript' as ProjectType,
        rootPath: '/path/to/project1',
        version: '1.0.0',
        description: 'A test project for demonstration',
        author: 'Test Author',
        repository: 'https://github.com/test/project1',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: {
          totalFiles: 10,
          totalLines: 1000,
          totalSize: 50000,
          directories: [
            { path: 'src', name: 'src', fileCount: 5, subdirectoryCount: 2, totalSize: 25000 },
            { path: 'tests', name: 'tests', fileCount: 3, subdirectoryCount: 0, totalSize: 15000 },
            { path: 'docs', name: 'docs', fileCount: 2, subdirectoryCount: 0, totalSize: 10000 }
          ],
          files: [
            { path: 'src/index.ts', name: 'index.ts', extension: '.ts', size: 1000, lines: 50, lastModified: new Date(), hash: 'hash1' },
            { path: 'src/utils.ts', name: 'utils.ts', extension: '.ts', size: 2000, lines: 100, lastModified: new Date(), hash: 'hash2' }
          ]
        },
        ast: [],
        relations: [],
        publicExports: [],
        privateExports: [],
        complexity: {} as any,
        quality: {} as any,
        metadata: { test: true },
      },
      {
        name: 'React Application',
        type: 'react' as ProjectType,
        rootPath: '/path/to/project2',
        version: '2.0.0',
        description: 'A React application with modern features',
        author: 'React Developer',
        repository: 'https://github.com/react/app',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: {
          totalFiles: 10,
          totalLines: 1000,
          totalSize: 50000,
          directories: [
            { path: 'src', name: 'src', fileCount: 5, subdirectoryCount: 2, totalSize: 25000 },
            { path: 'tests', name: 'tests', fileCount: 3, subdirectoryCount: 0, totalSize: 15000 },
            { path: 'docs', name: 'docs', fileCount: 2, subdirectoryCount: 0, totalSize: 10000 }
          ],
          files: [
            { path: 'src/index.ts', name: 'index.ts', extension: '.ts', size: 1000, lines: 50, lastModified: new Date(), hash: 'hash1' },
            { path: 'src/utils.ts', name: 'utils.ts', extension: '.ts', size: 2000, lines: 100, lastModified: new Date(), hash: 'hash2' }
          ]
        },
        ast: [],
        relations: [],
        publicExports: [],
        privateExports: [],
        complexity: {} as any,
        quality: {} as any,
        metadata: { framework: 'react' },
      },
    ];

    mockProjectEntries = [
      {
        id: 'project-1',
        name: 'Test Project',
        type: 'typescript' as ProjectType,
        rootPath: '/path/to/project1',
        version: '1.0.0',
        description: 'A test project for demonstration',
        author: 'Test Author',
        repository: 'https://github.com/test/project1',
        languages: ['typescript' as Language],
        tags: ['test', 'example', 'demo'],
        lastAnalyzed: new Date('2024-01-01'),
        lastModified: new Date('2024-01-01'),
        size: 1024,
        fileCount: 10,
        linesOfCode: 100,
        metadata: { test: true },
      },
      {
        id: 'project-2',
        name: 'React Application',
        type: 'react' as ProjectType,
        rootPath: '/path/to/project2',
        version: '2.0.0',
        description: 'A React application with modern features',
        author: 'React Developer',
        repository: 'https://github.com/react/app',
        languages: ['typescript' as Language, 'javascript' as Language],
        tags: ['react', 'frontend', 'spa'],
        lastAnalyzed: new Date('2024-01-02'),
        lastModified: new Date('2024-01-02'),
        size: 2048,
        fileCount: 20,
        linesOfCode: 200,
        metadata: { framework: 'react' },
      },
    ];

    indexManager = new IndexManager();
  });

  describe('constructor', () => {
    it('should create an IndexManager with default options', () => {
      expect(indexManager).toBeInstanceOf(IndexManager);
    });

    it('should create an IndexManager with custom options', () => {
      const options: IndexManagerOptions = {
        config: {
          autoUpdate: true,
          updateInterval: 5,
          maxIndexSize: 1000000,
          compression: true,
          storagePath: '/tmp/index',
          enableSearch: true,
          searchConfig: {
            fullTextSearch: true,
            maxSearchIndexSize: 500000,
            searchCacheSize: 1000,
          },
        },
        searchOptions: {
          fuzzySearch: true,
          fuzzyThreshold: 0.8,
          regexSearch: false,
          caseSensitive: false,
          maxResults: 100,
          cacheSize: 1000,
          cacheTTL: 300000,
        },
        builderOptions: {
          forceRebuild: false,
          includeMetadata: true,
          parallelProcessing: true,
          maxConcurrency: 4,
          onProgress: () => {},
        },
        autoMaintenance: true,
        maintenanceInterval: 60,
      };
      
      const manager = new IndexManager(options);
      expect(manager).toBeInstanceOf(IndexManager);
    });
  });

  describe('configuration', () => {
    it('should set and get configuration', () => {
      const config: IndexConfig = {
        autoUpdate: true,
        updateInterval: 5,
        maxIndexSize: 1000000,
        compression: true,
        storagePath: '/tmp/index',
        enableSearch: true,
        searchConfig: {
          fullTextSearch: true,
          maxSearchIndexSize: 500000,
          searchCacheSize: 1000,
        },
      };
      
      indexManager.setConfig(config);
      const retrievedConfig = indexManager.getConfig();
      
      expect(retrievedConfig).toEqual(config);
    });

    it('should update configuration', () => {
      const initialConfig: IndexConfig = {
        autoUpdate: true,
        updateInterval: 5,
        maxIndexSize: 1000000,
        compression: true,
        storagePath: '/tmp/index',
        enableSearch: true,
        searchConfig: {
          fullTextSearch: true,
          maxSearchIndexSize: 500000,
          searchCacheSize: 1000,
        },
      };
      
      indexManager.setConfig(initialConfig);
      
      const updatedConfig: IndexConfig = {
        ...initialConfig,
        updateInterval: 10,
      };
      
      indexManager.updateConfig(updatedConfig);
      const retrievedConfig = indexManager.getConfig();
      
      expect(retrievedConfig.updateInterval).toBe(10);
    });
  });

  describe('project indexing', () => {
    it('should index a single project', async () => {
      const projectInfo = mockProjectInfo[0];
      if (!projectInfo) {
        throw new Error('Project info not found');
      }
      
      const result = await indexManager.indexProject(projectInfo);
      
      expect(result).toBeDefined();
      expect(result.getProject().name).toBe(projectInfo.name);
    });

    it('should index multiple projects', async () => {
      const results = await indexManager.indexProjects(mockProjectInfo);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.getProject().name).toBe('Test Project');
      expect(results[1]?.getProject().name).toBe('React Application');
    });

    it('should update an existing project', async () => {
      const firstProject = mockProjectInfo[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      await indexManager.indexProject(firstProject);
      
      const updatedProject: ProjectInfo = {
        ...firstProject,
        name: 'Updated Test Project',
      };
      
      const result = await indexManager.updateProject(updatedProject);
      
      expect(result).toBeDefined();
      expect(result.getProject().name).toBe('Updated Test Project');
    });

    it('should remove a project', async () => {
      const firstProject = mockProjectInfo[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      await indexManager.indexProject(firstProject);
      
      const result = await indexManager.removeProject(firstProject.name);
      
      expect(result).toBe(true);
    });

    it('should handle indexing errors gracefully', () => {
      const invalidProject = null as any;
      
      expect(() => indexManager.indexProject(invalidProject)).toThrow('Project info is required');
    });
  });

  describe('project retrieval', () => {
    beforeEach(async () => {
      await indexManager.indexProjects(mockProjectInfo);
    });

    it('should get a project by name', async () => {
      const project = await indexManager.getProject('Test Project');
      
      expect(project).toBeDefined();
      expect(project?.getProject().name).toBe('Test Project');
    });

    it('should get a project by ID', async () => {
      // First get the project by name to get its actual ID
      const projectByName = await indexManager.getProject('Test Project');
      expect(projectByName).toBeDefined();
      
      const projectId = projectByName!.getProject().id;
      const project = await indexManager.getProjectById(projectId);
      
      expect(project).toBeDefined();
      expect(project?.getProject().name).toBe('Test Project');
    });

    it('should return undefined for non-existent project ID', async () => {
      const result = await indexManager.getProjectById('non-existent-id');
      expect(result).toBeUndefined();
    });

    it('should list all projects', async () => {
      const projects = await indexManager.listProjects();
      
      expect(projects).toHaveLength(2);
      expect(projects.some((p: any) => p.project.name === 'Test Project')).toBe(true);
      expect(projects.some((p: any) => p.project.name === 'React Application')).toBe(true);
    });

    it('should get projects by type', async () => {
      const typescriptProjects = await indexManager.getProjectsByType('typescript');
      
      expect(typescriptProjects).toHaveLength(1);
      expect(typescriptProjects[0]?.getProject().name).toBe('Test Project');
    });

    it('should get projects by language', async () => {
      const javascriptProjects = await indexManager.getProjectsByLanguage('javascript');
      
      expect(javascriptProjects).toHaveLength(1);
      expect(javascriptProjects[0]?.getProject().name).toBe('React Application');
    });

    it('should get projects by author', async () => {
      const authorProjects = await indexManager.getProjectsByAuthor('Test Author');
      
      expect(authorProjects).toHaveLength(1);
      expect(authorProjects[0]?.getProject().name).toBe('Test Project');
    });

    it('should get projects by tag', async () => {
      const reactProjects = await indexManager.getProjectsByTag('react');
      
      expect(reactProjects).toHaveLength(1);
      expect(reactProjects[0]?.getProject().name).toBe('React Application');
    });
  });

  describe('search functionality', () => {
    beforeEach(async () => {
      await indexManager.indexProjects(mockProjectInfo);
    });

    it('should search projects', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'Test Project',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await indexManager.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
    });

    it('should search with filters', async () => {
      const query: SearchQuery = {
        criteria: {
          type: 'typescript',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await indexManager.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.type).toBe('typescript');
    });

    it('should return empty results for no matches', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'nonexistent',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await indexManager.search(query);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await indexManager.indexProjects(mockProjectInfo);
    });

    it('should get project statistics', async () => {
      const stats = await indexManager.getStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.totalProjects).toBe(2);
      expect(stats.projectsByType).toBeDefined();
      expect(stats.projectsByLanguage).toBeDefined();
    });

    it('should get index statistics', async () => {
      const stats = await indexManager.getIndexStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.totalProjects).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('index management', () => {
    it('should build index from project info', async () => {
      const progressCallback = jest.fn();
      
      const result = await indexManager.buildIndex(mockProjectInfo, {
        forceRebuild: false,
        includeMetadata: true,
        parallelProcessing: true,
        maxConcurrency: 2,
        onProgress: progressCallback,
      });
      
      expect(result).toBeDefined();
      expect(result.totalProjects).toBe(2);
      expect(progressCallback).toHaveBeenCalled();
    });

    it('should rebuild index', async () => {
      await indexManager.indexProjects(mockProjectInfo);
      
      const result = await indexManager.rebuildIndex();
      
      expect(result).toBeDefined();
      expect(result.totalProjects).toBe(2);
    });

    it('should clear index', async () => {
      await indexManager.indexProjects(mockProjectInfo);
      
      await indexManager.clearIndex();
      
      const projects = await indexManager.listProjects();
      expect(projects).toHaveLength(0);
    });

    it('should export index', async () => {
      await indexManager.indexProjects(mockProjectInfo);
      
      const exportedIndex = await indexManager.exportIndex();
      
      expect(exportedIndex).toBeDefined();
      expect(exportedIndex.projects).toHaveLength(2);
    });

    it('should import index', async () => {
      const exportedIndex = {
        projects: mockProjectEntries,
        statistics: {
          totalProjects: 2,
          projectsByType: { typescript: 1, react: 1, javascript: 0, node: 0, unknown: 0 },
          projectsByLanguage: { typescript: 2, javascript: 1, python: 0, go: 0, java: 0 },
          totalSize: 100000,
          totalFiles: 20,
          totalLinesOfCode: 5000,
          averageProjectSize: 50000,
          averageFilesPerProject: 10,
          averageLinesPerProject: 2500,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          version: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      
      await indexManager.importIndex(exportedIndex);
      
      const projects = await indexManager.listProjects();
      expect(projects).toHaveLength(2);
    });

    it('should handle invalid index data in importIndex', async () => {
      try {
        await indexManager.importIndex({} as any);
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Invalid index data');
      }
    });

    it('should handle null index data in importIndex', async () => {
      try {
        await indexManager.importIndex(null as any);
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Invalid index data');
      }
    });
  });

  describe('validation', () => {
    beforeEach(async () => {
      await indexManager.indexProjects(mockProjectInfo);
    });

    it('should validate index', async () => {
      const result = await indexManager.validateIndex();
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate specific project', async () => {
      const result = await indexManager.validateProject('Test Project');
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });

    it('should validate index with invalid projects', async () => {
      // First index a valid project
      await indexManager.indexProjects(mockProjectInfo);
      
      // Manually add an invalid project to the internal map
      const invalidProjectIndex = new ProjectIndex({
        id: 'invalid-project',
        name: '', // Invalid name
        type: 'typescript',
        rootPath: '/path/to/invalid',
        version: '1.0.0',
        description: 'Invalid project',
        author: 'Test Author',
        repository: 'https://github.com/test/invalid',
        languages: ['typescript'],
        tags: ['test'],
        lastAnalyzed: new Date('2024-01-01'),
        lastModified: new Date('2024-01-01'),
        size: 1024,
        fileCount: 10,
        linesOfCode: 100,
        metadata: {},
      });
      
      // Add the invalid project to the internal map
      indexManager['projectIndexes'].set('invalid-project', invalidProjectIndex);
      
      const result = await indexManager.validateIndex();
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate index with invalid projects', async () => {
      // First index a valid project
      await indexManager.indexProjects(mockProjectInfo);
      
      // Manually add an invalid project to the internal map
      const invalidProjectIndex = new ProjectIndex({
        id: 'invalid-project',
        name: '', // Invalid name
        type: 'typescript',
        rootPath: '/path/to/invalid',
        version: '1.0.0',
        description: 'Invalid project',
        author: 'Test Author',
        repository: 'https://github.com/test/invalid',
        languages: ['typescript'],
        tags: ['test'],
        lastAnalyzed: new Date('2024-01-01'),
        lastModified: new Date('2024-01-01'),
        size: 1024,
        fileCount: 10,
        linesOfCode: 100,
        metadata: {},
      });
      
      // Add the invalid project to the internal map
      indexManager['projectIndexes'].set('invalid-project', invalidProjectIndex);
      
      const result = await indexManager.validateIndex();
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate specific project that does not exist', async () => {
      const result = await indexManager.validateProject('non-existent-project');
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toBe('Project non-existent-project not found');
    });

    it('should not start if already running', async () => {
      await indexManager.start();
      expect(indexManager.isRunning()).toBe(true);
      
      // Try to start again
      await indexManager.start();
      expect(indexManager.isRunning()).toBe(true); // Should still be running
      
      await indexManager.stop();
    });

    it('should not stop if not running', async () => {
      expect(indexManager.isRunning()).toBe(false);
      
      // Try to stop when not running
      await indexManager.stop();
      expect(indexManager.isRunning()).toBe(false); // Should still be not running
    });

    it('should handle maintenance timer errors', async () => {
      // Mock optimizeIndex and cleanupIndex to throw errors
      const originalOptimizeIndex = indexManager.optimizeIndex;
      const originalCleanupIndex = indexManager.cleanupIndex;
      
      indexManager.optimizeIndex = jest.fn().mockImplementation(() => {
        throw new Error('Optimization failed');
      });
      indexManager.cleanupIndex = jest.fn().mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
      
      // Set a very short maintenance interval
      indexManager.setConfig({
        ...indexManager.getConfig(),
        updateInterval: 0.001 // 0.001 minutes = 60ms
      });
      
      await indexManager.start();
      
      // Wait for maintenance timer to run
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(indexManager.isRunning()).toBe(true);
      await indexManager.stop();
      
      // Restore original methods
      indexManager.optimizeIndex = originalOptimizeIndex;
      indexManager.cleanupIndex = originalCleanupIndex;
    });
  });

  describe('optimization', () => {
    beforeEach(async () => {
      await indexManager.indexProjects(mockProjectInfo);
    });

    it('should optimize index', async () => {
      const result = await indexManager.optimizeIndex();
      
      expect(result).toBeDefined();
      expect(result.optimizations).toContain('cleanup');
      expect(result.improvements).toBeDefined();
      expect(result.statistics).toBeDefined();
    });

    it('should get optimization status', async () => {
      const status = await indexManager.getOptimizationStatus();
      
      expect(status).toBeDefined();
      expect(status.lastOptimized).toBeDefined();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await indexManager.indexProjects(mockProjectInfo);
    });

    it('should cleanup index', async () => {
      const result = await indexManager.cleanupIndex();
      
      expect(result).toBeDefined();
      expect(result.operations).toHaveLength(1);
      expect(result.operations[0]?.type).toBe('remove_outdated');
      expect(result.statistics).toBeDefined();
    });

    it('should get cleanup status', async () => {
      const status = await indexManager.getCleanupStatus();
      
      expect(status).toBeDefined();
      expect(status.lastCleanup).toBeDefined();
    });
  });

  describe('lifecycle management', () => {
    it('should start index manager', async () => {
      await indexManager.start();
      
      expect(indexManager.isRunning()).toBe(true);
    });

    it('should stop index manager', async () => {
      await indexManager.start();
      await indexManager.stop();
      
      expect(indexManager.isRunning()).toBe(false);
    });

    it('should restart index manager', async () => {
      await indexManager.start();
      await indexManager.restart();
      
      expect(indexManager.isRunning()).toBe(true);
    });

    it('should run maintenance timer', async () => {
      // Set a very short update interval for testing
      indexManager.setConfig({
        ...indexManager.getConfig(),
        updateInterval: 0.001 // 0.001 minutes = 60ms
      });
      
      await indexManager.start();
      
      // Wait for maintenance to run
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(indexManager.isRunning()).toBe(true);
      
      await indexManager.stop();
    });
  });

  describe('error handling', () => {
    it('should handle invalid project info', async () => {
      const invalidProject = null as any;
      
      expect(() => indexManager.indexProject(invalidProject)).toThrow('Project info is required');
    });

    it('should handle invalid search query', () => {
      const invalidQuery = null as any;
      
      expect(() => indexManager.search(invalidQuery)).toThrow('Search query is required');
    });

    it('should handle invalid configuration', () => {
      const invalidConfig = null as any;
      
      expect(() => indexManager.setConfig(invalidConfig)).toThrow();
    });

    it('should emit error events when indexing fails', async () => {
      const errorHandler = jest.fn();
      indexManager.on('error', errorHandler);
      
      // Mock the IndexBuilder to throw an error
      const originalBuildProjectIndex = indexManager['indexBuilder'].buildProjectIndex;
      indexManager['indexBuilder'].buildProjectIndex = jest.fn().mockImplementation(() => {
        throw new Error('Build failed');
      });
      
      const firstProject = mockProjectInfo[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      expect(() => indexManager.indexProject(firstProject)).toThrow('Build failed');
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      
      // Restore original method
      indexManager['indexBuilder'].buildProjectIndex = originalBuildProjectIndex;
    });

    it('should emit error events when updating project fails', async () => {
      const errorHandler = jest.fn();
      indexManager.on('error', errorHandler);
      
      // Mock the IndexBuilder to throw an error
      const originalBuildProjectIndex = indexManager['indexBuilder'].buildProjectIndex;
      indexManager['indexBuilder'].buildProjectIndex = jest.fn().mockImplementation(() => {
        throw new Error('Update failed');
      });
      
      const firstProject = mockProjectInfo[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      expect(() => indexManager.updateProject(firstProject)).toThrow('Update failed');
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      
      // Restore original method
      indexManager['indexBuilder'].buildProjectIndex = originalBuildProjectIndex;
    });

    it('should handle null project info in updateProject', async () => {
      try {
        await indexManager.updateProject(null as any);
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Project info is required');
        // Note: Error event is not emitted for null checks outside try-catch
      }
    });

    it('should handle empty project name in removeProject', async () => {
      try {
        await indexManager.removeProject('');
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Project name is required');
      }
    });

    it('should handle null project name in removeProject', async () => {
      try {
        await indexManager.removeProject(null as any);
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Project name is required');
      }
    });

    it('should return false when removing non-existent project', async () => {
      const result = await indexManager.removeProject('non-existent-project');
      expect(result).toBe(false);
    });

    it('should emit error events when removing project fails', async () => {
      const errorHandler = jest.fn();
      indexManager.on('error', errorHandler);
      
      // Mock the globalIndex to throw an error
      const originalRemoveProject = indexManager['globalIndex'].removeProject;
      indexManager['globalIndex'].removeProject = jest.fn().mockImplementation(() => {
        throw new Error('Remove failed');
      });
      
      const firstProject = mockProjectInfo[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      // First index the project
      await indexManager.indexProject(firstProject);
      
      try {
        await indexManager.removeProject(firstProject.name);
        expect(true).toBe(false); // This should not be reached
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Remove failed');
        expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      }
      
      // Restore original method
      indexManager['globalIndex'].removeProject = originalRemoveProject;
    });

    it('should emit error events when search fails', async () => {
      const errorHandler = jest.fn();
      indexManager.on('error', errorHandler);
      
      // Mock the searchEngine to throw an error
      const originalSearch = indexManager['searchEngine'].search;
      indexManager['searchEngine'].search = jest.fn().mockImplementation(() => {
        throw new Error('Search failed');
      });
      
      const query = {
        criteria: { name: 'test' },
        options: { caseSensitive: false, exactMatch: false, includeMetadata: false, limit: 10, offset: 0 }
      };
      
      expect(() => indexManager.search(query)).toThrow('Search failed');
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      
      // Restore original method
      indexManager['searchEngine'].search = originalSearch;
    });
  });

  describe('event handling', () => {
    it('should emit index events', async () => {
      const eventHandler = jest.fn();
      indexManager.on('indexUpdated', eventHandler);
      
      const firstProject = mockProjectInfo[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      await indexManager.indexProject(firstProject);
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should emit search events', async () => {
      await indexManager.indexProjects(mockProjectInfo);
      
      const eventHandler = jest.fn();
      indexManager.on('searchPerformed', eventHandler);
      
      const query: SearchQuery = {
        criteria: { name: 'Test Project' },
        options: { caseSensitive: false, exactMatch: false, includeMetadata: false, limit: 10, offset: 0 },
      };
      
      await indexManager.search(query);
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should emit error events', async () => {
      const eventHandler = jest.fn();
      indexManager.on('error', eventHandler);
      
      try {
        // Force an error by passing null project info
        await indexManager.indexProject(null as any);
      } catch (error) {
        // Expected error - this should trigger the error event
      }
      
      expect(eventHandler).toHaveBeenCalled();
    });
  });
});

/**
 * Integration Tests for Complete Indexing System
 * 
 * These tests verify that all indexing components work together correctly
 * and provide end-to-end functionality testing.
 */

import {
  IndexManager,
  IndexingSystemFactory,
  ProjectIndex,
  SearchEngine,
  IndexBuilder,
  IndexValidator,
  IndexOptimizer,
  IndexCleanup
} from '../../src/indexing';
import { ProjectInfo, ProjectType } from '../../src/types/core';

describe('Indexing System Integration Tests', () => {
  let indexManager: IndexManager;
  let mockProjectInfo: ProjectInfo;

  beforeEach(() => {
    // Create a fresh IndexManager for each test
    indexManager = IndexingSystemFactory.createIndexManager();
    
    // Create a simple mock project for testing
    mockProjectInfo = {
      rootPath: '/path/to/test-project',
      name: 'Test Project',
      type: 'typescript' as ProjectType,
      version: '1.0.0',
      description: 'A test project for integration testing',
      author: 'Test Author',
      repository: 'https://github.com/test/test-project',
      entryPoints: [
        { path: 'src/index.ts', type: 'main', metadata: {} }
      ],
      dependencies: [
        { name: 'typescript', version: '^4.9.0', type: 'production', source: 'npm', metadata: {} }
      ],
      devDependencies: [
        { name: '@types/node', version: '^18.0.0', type: 'development', source: 'npm', metadata: {} }
      ],
      structure: {
        directories: [
          {
            path: 'src',
            name: 'src',
            fileCount: 1,
            subdirectoryCount: 0,
            totalSize: 1024
          }
        ],
        files: [
          {
            path: 'src/index.ts',
            name: 'index.ts',
            extension: 'ts',
            size: 512,
            lines: 50,
            lastModified: new Date('2023-01-01'),
            hash: 'file-hash'
          }
        ],
        totalFiles: 1,
        totalLines: 50,
        totalSize: 512
      },
      ast: [
        { 
          id: '1', 
          type: 'SourceFile',
          nodeType: 'SourceFile' as any, 
          name: 'index.ts', 
          start: 0, 
          end: 100,
          children: [],
          properties: {},
          filePath: 'src/index.ts',
          metadata: {}
        }
      ],
      relations: [
        { type: 'import', from: 'typescript', to: 'src/index.ts', id: 'rel-1', metadata: {} }
      ],
      publicExports: [
        { name: 'main', type: 'SourceFile' as any, file: 'src/index.ts', isDefault: false, metadata: {} }
      ],
      privateExports: [],
      complexity: {
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        linesOfCode: 50,
        functionCount: 1,
        classCount: 0,
        interfaceCount: 0
      },
      quality: {
        score: 90,
        maintainabilityIndex: 85,
        technicalDebtRatio: 0.1,
        duplicationPercentage: 5,
        testCoveragePercentage: 80
      },
      metadata: {
        tags: ['test', 'typescript'],
        createdAt: new Date('2023-01-01'),
        lastModified: new Date('2023-01-01')
      }
    };
  });

  describe('Complete Indexing Workflow', () => {
    it('should index a project successfully', async () => {
      // Step 1: Index the project
      const result = await indexManager.indexProject(mockProjectInfo);
      expect(result).toBeInstanceOf(ProjectIndex);
      expect(result.getProject().name).toBe('Test Project');

      // Step 2: Verify project is indexed
      const indexedProjects = await indexManager.listProjects();
      expect(indexedProjects).toHaveLength(1);

      // Step 3: Test project retrieval by name
      const retrievedProject = await indexManager.getProject('Test Project');
      expect(retrievedProject).toBeDefined();
      expect(retrievedProject?.getProject().name).toBe('Test Project');
    });

    it('should handle project updates', async () => {
      // Step 1: Index initial project
      await indexManager.indexProject(mockProjectInfo);

      // Step 2: Update the project
      const updatedProject: ProjectInfo = {
        ...mockProjectInfo,
        version: '1.1.0',
        description: 'Updated test project'
      };

      const updateResult = await indexManager.updateProject(updatedProject);
      expect(updateResult).toBeInstanceOf(ProjectIndex);
      expect(updateResult.getProject().version).toBe('1.1.0');
    });

    it('should handle project removal', async () => {
      // Step 1: Index the project
      await indexManager.indexProject(mockProjectInfo);

      // Step 2: Remove the project
      const removeResult = await indexManager.removeProject('Test Project');
      expect(removeResult).toBe(true);

      // Step 3: Verify project is removed
      const remainingProjects = await indexManager.listProjects();
      expect(remainingProjects).toHaveLength(0);
    });
  });

  describe('Search Engine Integration', () => {
    beforeEach(async () => {
      await indexManager.indexProject(mockProjectInfo);
    });

    it('should perform searches across indexed projects', async () => {
      // Test search functionality
      const searchResults = await indexManager.search({
        criteria: { name: 'Test Project' },
        options: { limit: 10 }
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0]?.project.name).toBe('Test Project');
    });

    it('should support complex search queries', async () => {
      // Search by multiple criteria
      const searchResults = await indexManager.search({
        criteria: {
          name: 'Project',
          type: 'typescript'
        },
        options: {
          limit: 10,
          sortBy: 'name'
        }
      });

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0]?.project.name).toBe('Test Project');
    });
  });

  describe('Index Validation Integration', () => {
    beforeEach(async () => {
      await indexManager.indexProject(mockProjectInfo);
    });

    it('should validate index integrity', async () => {
      // Validate the index
      const validationResult = await indexManager.validateIndex();
      expect(validationResult).toBeDefined();
    });

    it('should validate individual projects', async () => {
      const validationResult = await indexManager.validateProject('Test Project');
      expect(validationResult).toBeDefined();
    });
  });

  describe('Factory Pattern Integration', () => {
    it('should create all components with default configurations', () => {
      const indexManager = IndexingSystemFactory.createIndexManager();
      const searchEngine = IndexingSystemFactory.createSearchEngine();
      const indexBuilder = IndexingSystemFactory.createIndexBuilder();
      const validator = IndexingSystemFactory.createIndexValidator();
      const optimizer = IndexingSystemFactory.createIndexOptimizer();
      const cleanup = IndexingSystemFactory.createIndexCleanup();

      expect(indexManager).toBeInstanceOf(IndexManager);
      expect(searchEngine).toBeInstanceOf(SearchEngine);
      expect(indexBuilder).toBeInstanceOf(IndexBuilder);
      expect(validator).toBeInstanceOf(IndexValidator);
      expect(optimizer).toBeInstanceOf(IndexOptimizer);
      expect(cleanup).toBeInstanceOf(IndexCleanup);
    });

    it('should create components with custom configurations', () => {
      const customOptions = {
        enableCaching: false,
        maxResults: 50
      };

      const searchEngine = IndexingSystemFactory.createSearchEngine(customOptions);
      expect(searchEngine).toBeInstanceOf(SearchEngine);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid project info gracefully', async () => {
      const invalidProject: ProjectInfo = {
        rootPath: '/path/to/invalid',
        name: 'Invalid Project',
        type: 'typescript' as ProjectType,
        version: '1.0.0',
        description: '',
        author: '',
        repository: '',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: { directories: [], files: [], totalFiles: 0, totalLines: 0, totalSize: 0 },
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
        },
        metadata: {}
      };

      // Index should handle invalid data gracefully
      const results = await indexManager.indexProjects([invalidProject]);
      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(ProjectIndex);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple projects efficiently', async () => {
      // Create multiple projects
      const projects: ProjectInfo[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockProjectInfo,
        name: `Project ${i}`,
        version: `${i}.0.0`,
        rootPath: `/path/to/project-${i}`
      }));

      const startTime = Date.now();
      const results = await indexManager.indexProjects(projects);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second

      // Verify all projects are indexed
      const indexedProjects = await indexManager.listProjects();
      expect(indexedProjects).toHaveLength(5);
    });
  });
});
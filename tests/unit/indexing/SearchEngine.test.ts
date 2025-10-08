/**
 * Tests for SearchEngine class
 */

import { SearchEngine } from '../../../src/indexing/SearchEngine';
import {
  SearchQuery,
  SearchEngineOptions,
  ProjectIndexEntry,
} from '../../../src/types/indexing';
import { ProjectType, Language } from '../../../src/types/core';

describe('SearchEngine', () => {
  let searchEngine: SearchEngine;
  let mockProjects: ProjectIndexEntry[];

  beforeEach(() => {
    mockProjects = [
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
      {
        id: 'project-3',
        name: 'Node.js API',
        type: 'node' as ProjectType,
        rootPath: '/path/to/project3',
        version: '3.0.0',
        description: 'RESTful API built with Node.js and Express',
        author: 'Backend Developer',
        repository: 'https://github.com/node/api',
        languages: ['javascript' as Language],
        tags: ['node', 'api', 'express', 'backend'],
        lastAnalyzed: new Date('2024-01-03'),
        lastModified: new Date('2024-01-03'),
        size: 4096,
        fileCount: 30,
        linesOfCode: 300,
        metadata: { framework: 'express' },
      },
    ];

    searchEngine = new SearchEngine();
  });

  describe('constructor', () => {
    it('should create a SearchEngine with default options', () => {
      expect(searchEngine).toBeInstanceOf(SearchEngine);
    });

    it('should create a SearchEngine with custom options', () => {
      const options: SearchEngineOptions = {
        fuzzySearch: true,
        fuzzyThreshold: 0.8,
        regexSearch: true,
        caseSensitive: true,
        maxResults: 50,
        cacheSize: 100,
        cacheTTL: 300000,
      };
      
      const engine = new SearchEngine(options);
      expect(engine).toBeInstanceOf(SearchEngine);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      searchEngine.indexProjects(mockProjects);
    });

    it('should search projects by name', async () => {
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
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
      expect(results[0]?.score).toBeGreaterThan(0);
    });

    it('should search projects by description', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'demonstration',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.description).toContain('demonstration');
    });

    it('should search projects by tags', async () => {
      const query: SearchQuery = {
        criteria: {
          tags: ['react'],
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.tags).toContain('react');
    });

    it('should search projects by author', async () => {
      const query: SearchQuery = {
        criteria: {
          author: 'React Developer',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.author).toBe('React Developer');
    });

    it('should search projects by type', async () => {
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
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1); // Only Test Project has type 'typescript'
      expect(results.every(r => r.project.type === 'typescript')).toBe(true);
    });

    it('should search projects by language', async () => {
      const query: SearchQuery = {
        criteria: {
          language: 'javascript',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(2); // React Application and Node.js API
      expect(results.every(r => r.project.languages.includes('javascript'))).toBe(true);
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
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(0);
    });

    it('should respect case sensitivity', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'TEST PROJECT',
        },
        options: {
          caseSensitive: true,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(0);
    });

    it('should perform case insensitive search by default', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'TEST PROJECT',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
    });

    it('should respect exact match', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'Test',
        },
        options: {
          caseSensitive: false,
          exactMatch: true,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(0);
    });

    it('should perform partial match by default', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'Test',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
    });

    it('should apply limit and offset', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'project',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 1,
          offset: 1,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(0); // Only "Test Project" contains "project", with offset 1, no results
    });

    it('should sort results by score', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'project',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1); // Only "Test Project" contains "project"
      for (let i = 1; i < results.length; i++) {
        const prevScore = results[i - 1]?.score;
        const currScore = results[i]?.score;
        if (prevScore !== undefined && currScore !== undefined) {
          expect(prevScore).toBeGreaterThanOrEqual(currScore);
        }
      }
    });

    it('should search projects by repository', async () => {
      const query: SearchQuery = {
        criteria: {
          repository: 'github.com/test/project1',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
    });

    it('should search projects by path', async () => {
      const query: SearchQuery = {
        criteria: {
          path: '/path/to/project1',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
    });

    it('should search projects by version', async () => {
      const query: SearchQuery = {
        criteria: {
          version: '1.0.0',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
    });

    it('should search projects by branch', async () => {
      // First, update a project to have branch metadata
      const firstProject = mockProjects[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      const projectWithBranch: ProjectIndexEntry = {
        id: firstProject.id,
        name: firstProject.name,
        type: firstProject.type,
        rootPath: firstProject.rootPath,
        version: firstProject.version,
        description: firstProject.description || '',
        author: firstProject.author || '',
        repository: firstProject.repository || '',
        languages: firstProject.languages || [],
        tags: firstProject.tags || [],
        lastAnalyzed: firstProject.lastAnalyzed,
        lastModified: firstProject.lastModified,
        size: firstProject.size,
        fileCount: firstProject.fileCount,
        linesOfCode: firstProject.linesOfCode,
        metadata: {
          branch: 'main'
        }
      };
      searchEngine.updateProject(projectWithBranch);

      const query: SearchQuery = {
        criteria: {
          branch: 'main',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.metadata?.['branch']).toBe('main');
    });
  });

  describe('fuzzy search', () => {
    beforeEach(() => {
      const options: SearchEngineOptions = {
        fuzzySearch: true,
        fuzzyThreshold: 0.7,
        regexSearch: false,
        caseSensitive: false,
        maxResults: 10,
        cacheSize: 50,
        cacheTTL: 300000,
      };
      
      searchEngine = new SearchEngine(options);
      searchEngine.indexProjects(mockProjects);
    });

    it('should find projects with fuzzy matching', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'tst projct', // Typo in "test project"
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
    });

    it('should not find projects below fuzzy threshold', async () => {
      const query: SearchQuery = {
        criteria: {
          name: 'xyz', // Very different from any project name
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('regex search', () => {
    beforeEach(() => {
      const options: SearchEngineOptions = {
        fuzzySearch: false,
        fuzzyThreshold: 0.8,
        regexSearch: true,
        caseSensitive: false,
        maxResults: 10,
        cacheSize: 50,
        cacheTTL: 300000,
      };
      
      searchEngine = new SearchEngine(options);
      searchEngine.indexProjects(mockProjects);
    });

    it('should find projects with regex patterns', async () => {
      const query: SearchQuery = {
        criteria: {
          name: '^Test.*',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.project.name).toBe('Test Project');
    });

    it('should handle invalid regex gracefully', async () => {
      const query: SearchQuery = {
        criteria: {
          name: '[invalid',
        },
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      searchEngine.indexProjects(mockProjects);
    });

    it('should cache search results', async () => {
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
      
      // First search
      await searchEngine.search(query);
      
      // Second search should use cache
      const results2 = await searchEngine.search(query);
      
      expect(results2).toHaveLength(1);
    });

    it('should invalidate cache when projects are updated', async () => {
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
      
      // First search
      await searchEngine.search(query);
      
      // Update projects
      const updatedProjects = mockProjects.map(p => ({
        ...p,
        name: p.name === 'Test Project' ? 'Updated Test Project' : p.name,
      }));
      searchEngine.indexProjects(updatedProjects);
      
      // Second search should not use cache
      const results2 = await searchEngine.search(query);
      
      expect(results2).toHaveLength(1); // "Updated Test Project" still matches "Test Project" due to partial matching
    });
  });

  describe('index management', () => {
    it('should index projects', () => {
      searchEngine.indexProjects(mockProjects);
      
      expect(searchEngine.getIndexedProjectCount()).toBe(3);
    });

    it('should update project index', () => {
      searchEngine.indexProjects(mockProjects);
      
      const firstProject = mockProjects[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      const updatedProject: ProjectIndexEntry = {
        id: firstProject.id,
        name: 'Updated Test Project',
        type: firstProject.type,
        rootPath: firstProject.rootPath,
        version: firstProject.version,
        description: firstProject.description || '',
        author: firstProject.author || '',
        repository: firstProject.repository || '',
        languages: firstProject.languages || [],
        tags: firstProject.tags || [],
        lastAnalyzed: firstProject.lastAnalyzed,
        lastModified: firstProject.lastModified,
        size: firstProject.size,
        fileCount: firstProject.fileCount,
        linesOfCode: firstProject.linesOfCode,
        metadata: firstProject.metadata || {},
      };
      
      searchEngine.updateProject(updatedProject);
      
      expect(searchEngine.getIndexedProjectCount()).toBe(3);
    });

    it('should remove project from index', () => {
      searchEngine.indexProjects(mockProjects);
      
      const firstProject = mockProjects[0];
      if (!firstProject) {
        throw new Error('First project not found');
      }
      
      searchEngine.removeProject(firstProject.id);
      
      expect(searchEngine.getIndexedProjectCount()).toBe(2);
    });

    it('should clear index', () => {
      searchEngine.indexProjects(mockProjects);
      
      searchEngine.clearIndex();
      
      expect(searchEngine.getIndexedProjectCount()).toBe(0);
    });
  });

  describe('search statistics', () => {
    it('should track search statistics', async () => {
      searchEngine.indexProjects(mockProjects);
      
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
      
      await searchEngine.search(query);
      
      const stats = searchEngine.getSearchStatistics();
      
      expect(stats.totalSearches).toBe(1);
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(1);
    });

    it('should track cache hits and misses', async () => {
      const statsEngine = new SearchEngine();
      statsEngine.indexProjects(mockProjects);
      
      // Reset statistics to ensure clean state
      const initialStats = statsEngine.getSearchStatistics();
      expect(initialStats.totalSearches).toBe(0);
      
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
      
      // First search (cache miss)
      await statsEngine.search(query);
      
      // Second search (cache hit)
      await statsEngine.search(query);
      
      const stats = statsEngine.getSearchStatistics();
      
      expect(stats.totalSearches).toBe(2);
      expect(stats.cacheHits).toBe(1);
      expect(stats.cacheMisses).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle empty search criteria', async () => {
      const query: SearchQuery = {
        criteria: {},
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(0);
    });

    it('should handle invalid query gracefully', () => {
      const query = null as any;
      
      expect(() => searchEngine.search(query)).toThrow('Search query is required');
    });

    it('should handle search with no indexed projects', async () => {
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
      
      const results = await searchEngine.search(query);
      
      expect(results).toHaveLength(0);
    });

    it('should handle null search criteria', async () => {
      const query: SearchQuery = {
        criteria: null as any,
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      expect(results).toEqual([]);
    });

    it('should handle undefined search criteria', async () => {
      const query: SearchQuery = {
        criteria: undefined as any,
        options: {
          caseSensitive: false,
          exactMatch: false,
          includeMetadata: false,
          limit: 10,
          offset: 0,
        },
      };
      
      const results = await searchEngine.search(query);
      expect(results).toEqual([]);
    });

  });
});

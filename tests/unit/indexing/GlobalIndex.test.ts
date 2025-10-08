/**
 * Tests for GlobalIndex class
 */

import { GlobalIndex } from '../../../src/indexing/GlobalIndex';
import {
  ProjectIndexEntry,
  ProjectFilters,
} from '../../../src/types/indexing';
import { ProjectType, Language } from '../../../src/types/core';

describe('GlobalIndex', () => {
  let globalIndex: GlobalIndex;
  let mockProject1: ProjectIndexEntry;
  let mockProject2: ProjectIndexEntry;
  let mockProject3: ProjectIndexEntry;

  beforeEach(() => {
    mockProject1 = {
      id: 'project-1',
      name: 'Test Project 1',
      type: 'typescript' as ProjectType,
      rootPath: '/path/to/project1',
      version: '1.0.0',
      description: 'First test project',
      author: 'Author 1',
      repository: 'https://github.com/test/project1',
      languages: ['typescript' as Language],
      tags: ['test', 'example'],
      lastAnalyzed: new Date('2024-01-01'),
      lastModified: new Date('2024-01-01'),
      size: 1024,
      fileCount: 10,
      linesOfCode: 100,
      metadata: { test: true },
    };

    mockProject2 = {
      id: 'project-2',
      name: 'Test Project 2',
      type: 'javascript' as ProjectType,
      rootPath: '/path/to/project2',
      version: '2.0.0',
      description: 'Second test project',
      author: 'Author 2',
      repository: 'https://github.com/test/project2',
      languages: ['javascript' as Language],
      tags: ['test', 'demo'],
      lastAnalyzed: new Date('2024-01-02'),
      lastModified: new Date('2024-01-02'),
      size: 2048,
      fileCount: 20,
      linesOfCode: 200,
      metadata: { demo: true },
    };

    mockProject3 = {
      id: 'project-3',
      name: 'Another Project',
      type: 'typescript' as ProjectType,
      rootPath: '/path/to/project3',
      version: '3.0.0',
      description: 'Third test project',
      author: 'Author 1',
      repository: 'https://github.com/test/project3',
      languages: ['typescript' as Language, 'javascript' as Language],
      tags: ['production', 'api'],
      lastAnalyzed: new Date('2024-01-03'),
      lastModified: new Date('2024-01-03'),
      size: 4096,
      fileCount: 30,
      linesOfCode: 300,
      metadata: { production: true },
    };

    globalIndex = new GlobalIndex();
  });

  describe('constructor', () => {
    it('should create an empty GlobalIndex', () => {
      expect(globalIndex.getProjects()).toEqual([]);
      expect(globalIndex.getStatistics()).toEqual({
        totalProjects: 0,
        projectsByType: {},
        projectsByLanguage: {},
        totalSize: 0,
        totalFiles: 0,
        totalLinesOfCode: 0,
        averageProjectSize: 0,
        averageFilesPerProject: 0,
        averageLinesPerProject: 0,
      });
    });

    it('should set createdAt and updatedAt to current date', () => {
      const now = new Date();
      const index = globalIndex.toInterface();
      
      expect(index.createdAt).toBeInstanceOf(Date);
      expect(index.updatedAt).toBeInstanceOf(Date);
      expect(Math.abs(index.createdAt.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe('addProject', () => {
    it('should add a project to the index', () => {
      globalIndex.addProject(mockProject1);
      
      const projects = globalIndex.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(mockProject1);
    });

    it('should update the updatedAt timestamp when adding a project', () => {
      const beforeUpdate = globalIndex.toInterface().updatedAt;
      
      setTimeout(() => {
        globalIndex.addProject(mockProject1);
        const afterUpdate = globalIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });

    it('should not add duplicate projects', () => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject1);
      
      const projects = globalIndex.getProjects();
      expect(projects).toHaveLength(1);
    });

    it('should update statistics when adding projects', () => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
      
      const stats = globalIndex.getStatistics();
      expect(stats.totalProjects).toBe(2);
      expect(stats.projectsByType.typescript).toBe(1);
      expect(stats.projectsByType.javascript).toBe(1);
      expect(stats.totalSize).toBe(3072); // 1024 + 2048
      expect(stats.totalFiles).toBe(30); // 10 + 20
      expect(stats.totalLinesOfCode).toBe(300); // 100 + 200
    });
  });

  describe('removeProject', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
    });

    it('should remove a project by ID', () => {
      globalIndex.removeProject(mockProject1.id);
      
      const projects = globalIndex.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(mockProject2);
    });

    it('should update statistics when removing projects', () => {
      globalIndex.removeProject(mockProject1.id);
      
      const stats = globalIndex.getStatistics();
      expect(stats.totalProjects).toBe(1);
      expect(stats.projectsByType.typescript).toBeUndefined();
      expect(stats.projectsByType.javascript).toBe(1);
      expect(stats.totalSize).toBe(2048);
      expect(stats.totalFiles).toBe(20);
      expect(stats.totalLinesOfCode).toBe(200);
    });

    it('should update the updatedAt timestamp when removing a project', () => {
      const beforeUpdate = globalIndex.toInterface().updatedAt;
      
      setTimeout(() => {
        globalIndex.removeProject(mockProject1.id);
        const afterUpdate = globalIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });

    it('should not throw error when removing non-existent project', () => {
      expect(() => {
        globalIndex.removeProject('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('getProject', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
    });

    it('should return project by ID', () => {
      const project = globalIndex.getProject(mockProject1.id);
      
      expect(project).toEqual(mockProject1);
    });

    it('should return undefined for non-existent project', () => {
      const project = globalIndex.getProject('non-existent-id');
      
      expect(project).toBeUndefined();
    });
  });

  describe('updateProject', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
    });

    it('should update an existing project', () => {
      const updatedProject = { ...mockProject1, name: 'Updated Project' };
      
      globalIndex.updateProject(updatedProject);
      
      const project = globalIndex.getProject(mockProject1.id);
      expect(project?.name).toBe('Updated Project');
    });

    it('should preserve the project ID', () => {
      const updatedProject = { ...mockProject1, id: 'different-id' };
      
      globalIndex.updateProject(updatedProject);
      
      const project = globalIndex.getProject(mockProject1.id);
      expect(project?.id).toBe(mockProject1.id);
    });

    it('should update statistics when updating project', () => {
      const updatedProject = { ...mockProject1, size: 2048 };
      
      globalIndex.updateProject(updatedProject);
      
      const stats = globalIndex.getStatistics();
      expect(stats.totalSize).toBe(2048);
    });

    it('should update the updatedAt timestamp when updating project', () => {
      const beforeUpdate = globalIndex.toInterface().updatedAt;
      const updatedProject = { ...mockProject1, name: 'Updated Project' };
      
      setTimeout(() => {
        globalIndex.updateProject(updatedProject);
        const afterUpdate = globalIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });

    it('should not add project if it does not exist', () => {
      const newProject = { ...mockProject1, id: 'new-project' };
      
      globalIndex.updateProject(newProject);
      
      const project = globalIndex.getProject('new-project');
      expect(project).toBeUndefined();
    });
  });

  describe('getProjectsByType', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
      globalIndex.addProject(mockProject3);
    });

    it('should return projects filtered by type', () => {
      const typescriptProjects = globalIndex.getProjectsByType('typescript');
      
      expect(typescriptProjects).toHaveLength(2);
      expect(typescriptProjects.every(p => p.type === 'typescript')).toBe(true);
    });

    it('should return empty array for non-existent type', () => {
      const pythonProjects = globalIndex.getProjectsByType('python' as ProjectType);
      
      expect(pythonProjects).toEqual([]);
    });
  });

  describe('getProjectsByLanguage', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
      globalIndex.addProject(mockProject3);
    });

    it('should return projects filtered by language', () => {
      const typescriptProjects = globalIndex.getProjectsByLanguage('typescript');
      
      expect(typescriptProjects).toHaveLength(2);
      expect(typescriptProjects.every(p => p.languages.includes('typescript'))).toBe(true);
    });

    it('should return empty array for non-existent language', () => {
      const pythonProjects = globalIndex.getProjectsByLanguage('python' as Language);
      
      expect(pythonProjects).toEqual([]);
    });
  });

  describe('getProjectsByAuthor', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
      globalIndex.addProject(mockProject3);
    });

    it('should return projects filtered by author', () => {
      const author1Projects = globalIndex.getProjectsByAuthor('Author 1');
      
      expect(author1Projects).toHaveLength(2);
      expect(author1Projects.every(p => p.author === 'Author 1')).toBe(true);
    });

    it('should return empty array for non-existent author', () => {
      const unknownProjects = globalIndex.getProjectsByAuthor('Unknown Author');
      
      expect(unknownProjects).toEqual([]);
    });
  });

  describe('getProjectsByTag', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
      globalIndex.addProject(mockProject3);
    });

    it('should return projects filtered by tag', () => {
      const testProjects = globalIndex.getProjectsByTag('test');
      
      expect(testProjects).toHaveLength(2);
      expect(testProjects.every(p => p.tags.includes('test'))).toBe(true);
    });

    it('should return empty array for non-existent tag', () => {
      const unknownProjects = globalIndex.getProjectsByTag('unknown');
      
      expect(unknownProjects).toEqual([]);
    });
  });

  describe('searchProjects', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
      globalIndex.addProject(mockProject3);
    });

    it('should search projects by name', () => {
      const results = globalIndex.searchProjects('Test Project');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some(r => r.project.name.includes('Test Project'))).toBe(true);
    });

    it('should search projects by description', () => {
      const results = globalIndex.searchProjects('test project');
      
      expect(results).toHaveLength(3);
    });

    it('should return empty array for no matches', () => {
      const results = globalIndex.searchProjects('nonexistent');
      
      expect(results).toEqual([]);
    });

    it('should be case insensitive by default', () => {
      const results = globalIndex.searchProjects('TEST PROJECT');
      
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect case sensitivity when specified', () => {
      const results = globalIndex.searchProjects('TEST PROJECT', { caseSensitive: true });
      
      expect(results).toEqual([]);
    });
  });

  describe('listProjects', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
      globalIndex.addProject(mockProject3);
    });

    it('should return all projects when no filters provided', () => {
      const projects = globalIndex.listProjects();
      
      expect(projects).toHaveLength(3);
    });

    it('should filter by project type', () => {
      const filters: ProjectFilters = { type: 'typescript' };
      const projects = globalIndex.listProjects(filters);
      
      expect(projects).toHaveLength(2);
      expect(projects.every(p => p.type === 'typescript')).toBe(true);
    });

    it('should filter by language', () => {
      const filters: ProjectFilters = { language: 'javascript' };
      const projects = globalIndex.listProjects(filters);
      
      expect(projects).toHaveLength(2);
      expect(projects.every(p => p.languages.includes('javascript'))).toBe(true);
    });

    it('should filter by tags', () => {
      const filters: ProjectFilters = { tags: ['test'] };
      const projects = globalIndex.listProjects(filters);
      
      expect(projects).toHaveLength(2);
      expect(projects.every(p => p.tags.includes('test'))).toBe(true);
    });

    it('should filter by author', () => {
      const filters: ProjectFilters = { author: 'Author 1' };
      const projects = globalIndex.listProjects(filters);
      
      expect(projects).toHaveLength(2);
      expect(projects.every(p => p.author === 'Author 1')).toBe(true);
    });

    it('should filter by date range', () => {
      const filters: ProjectFilters = {
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-02'),
        },
      };
      const projects = globalIndex.listProjects(filters);
      
      expect(projects).toHaveLength(2);
    });

    it('should filter by size range', () => {
      const filters: ProjectFilters = {
        sizeRange: {
          min: 1000,
          max: 3000,
        },
      };
      const projects = globalIndex.listProjects(filters);
      
      expect(projects).toHaveLength(2);
    });

    it('should filter by file count range', () => {
      const filters: ProjectFilters = {
        fileCountRange: {
          min: 15,
          max: 25,
        },
      };
      const projects = globalIndex.listProjects(filters);
      
      expect(projects).toHaveLength(1);
    });

    it('should apply multiple filters', () => {
      const filters: ProjectFilters = {
        type: 'typescript',
        tags: ['test'],
      };
      const projects = globalIndex.listProjects(filters);
      
      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(mockProject1);
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics for empty index', () => {
      const stats = globalIndex.getStatistics();
      
      expect(stats).toEqual({
        totalProjects: 0,
        projectsByType: {},
        projectsByLanguage: {},
        totalSize: 0,
        totalFiles: 0,
        totalLinesOfCode: 0,
        averageProjectSize: 0,
        averageFilesPerProject: 0,
        averageLinesPerProject: 0,
      });
    });

    it('should return correct statistics for multiple projects', () => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
      globalIndex.addProject(mockProject3);
      
      const stats = globalIndex.getStatistics();
      
      expect(stats.totalProjects).toBe(3);
      expect(stats.projectsByType.typescript).toBe(2);
      expect(stats.projectsByType.javascript).toBe(1);
      expect(stats.projectsByLanguage.typescript).toBe(2);
      expect(stats.projectsByLanguage.javascript).toBe(2);
      expect(stats.totalSize).toBe(7168); // 1024 + 2048 + 4096
      expect(stats.totalFiles).toBe(60); // 10 + 20 + 30
      expect(stats.totalLinesOfCode).toBe(600); // 100 + 200 + 300
      expect(stats.averageProjectSize).toBeCloseTo(2389.33, 2);
      expect(stats.averageFilesPerProject).toBeCloseTo(20, 2);
      expect(stats.averageLinesPerProject).toBeCloseTo(200, 2);
    });
  });

  describe('toInterface', () => {
    it('should return the complete GlobalProjectIndex interface', () => {
      globalIndex.addProject(mockProject1);
      
      const index = globalIndex.toInterface();
      
      expect(index).toMatchObject({
        projects: [mockProject1],
        statistics: expect.any(Object),
        metadata: {},
      });
      expect(index.createdAt).toBeInstanceOf(Date);
      expect(index.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('setMetadata', () => {
    it('should set metadata for the index', () => {
      const metadata = { custom: 'value', test: 123 };
      
      globalIndex.setMetadata(metadata);
      
      const index = globalIndex.toInterface();
      expect(index.metadata).toEqual(metadata);
    });

    it('should merge with existing metadata', () => {
      globalIndex.setMetadata({ existing: 'value' });
      globalIndex.setMetadata({ new: 'value' });
      
      const index = globalIndex.toInterface();
      expect(index.metadata).toEqual({
        existing: 'value',
        new: 'value',
      });
    });
  });

  describe('getMetadata', () => {
    it('should return the current metadata', () => {
      const metadata = { custom: 'value' };
      globalIndex.setMetadata(metadata);
      
      expect(globalIndex.getMetadata()).toEqual(metadata);
    });

    it('should return empty object by default', () => {
      expect(globalIndex.getMetadata()).toEqual({});
    });
  });

  describe('isValid', () => {
    it('should return true for valid index', () => {
      expect(globalIndex.isValid()).toBe(true);
    });

    it('should return false if projects contain invalid data', () => {
      globalIndex.addProject({ ...mockProject1, id: '' });
      
      expect(globalIndex.isValid()).toBe(false);
    });

    it('should return false if project name is missing', () => {
      globalIndex.addProject({ ...mockProject1, name: '' });
      
      expect(globalIndex.isValid()).toBe(false);
    });

    it('should return false if project type is missing', () => {
      globalIndex.addProject({ ...mockProject1, type: '' as any });
      
      expect(globalIndex.isValid()).toBe(false);
    });

    it('should return false if project rootPath is missing', () => {
      globalIndex.addProject({ ...mockProject1, rootPath: '' });
      
      expect(globalIndex.isValid()).toBe(false);
    });
  });

  describe('clear', () => {
    beforeEach(() => {
      globalIndex.addProject(mockProject1);
      globalIndex.addProject(mockProject2);
    });

    it('should clear all projects', () => {
      globalIndex.clear();
      
      expect(globalIndex.getProjects()).toEqual([]);
      expect(globalIndex.getStatistics().totalProjects).toBe(0);
    });

    it('should update the updatedAt timestamp when clearing', () => {
      const beforeUpdate = globalIndex.toInterface().updatedAt;
      
      setTimeout(() => {
        globalIndex.clear();
        const afterUpdate = globalIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });
  });
});

/**
 * Tests for ProjectIndex class
 */

import { ProjectIndex } from '../../../src/indexing/ProjectIndex';
import {
  ProjectIndexEntry,
  VersionIndexEntry,
  BranchIndexEntry,
} from '../../../src/types/indexing';
import { ProjectType, Language } from '../../../src/types/core';

describe('ProjectIndex', () => {
  let projectIndex: ProjectIndex;
  let mockProjectEntry: ProjectIndexEntry;
  let mockVersionEntry: VersionIndexEntry;
  let mockBranchEntry: BranchIndexEntry;

  beforeEach(() => {
    mockProjectEntry = {
      id: 'test-project-1',
      name: 'Test Project',
      type: 'typescript' as ProjectType,
      rootPath: '/path/to/project',
      version: '1.0.0',
      description: 'A test project',
      author: 'Test Author',
      repository: 'https://github.com/test/project',
      languages: ['typescript' as Language],
      tags: ['test', 'example'],
      lastAnalyzed: new Date('2024-01-01'),
      lastModified: new Date('2024-01-01'),
      size: 1024,
      fileCount: 10,
      linesOfCode: 100,
      metadata: { test: true },
    };

    mockVersionEntry = {
      id: 'version-1',
      version: '1.0.0',
      type: 'semantic',
      branch: 'main',
      commitHash: 'abc123',
      createdAt: new Date('2024-01-01'),
      metadata: { release: true },
    };

    mockBranchEntry = {
      name: 'main',
      type: 'main',
      isActive: true,
      lastCommit: new Date('2024-01-01'),
      commitCount: 5,
      metadata: { default: true },
    };

    projectIndex = new ProjectIndex(mockProjectEntry);
  });

  describe('constructor', () => {
    it('should create a ProjectIndex with the provided project entry', () => {
      expect(projectIndex.getProject()).toEqual(mockProjectEntry);
    });

    it('should initialize with empty versions and branches arrays', () => {
      expect(projectIndex.getVersions()).toEqual([]);
      expect(projectIndex.getBranches()).toEqual([]);
    });

    it('should set createdAt and updatedAt to current date', () => {
      const now = new Date();
      const index = projectIndex.toInterface();
      
      expect(index.createdAt).toBeInstanceOf(Date);
      expect(index.updatedAt).toBeInstanceOf(Date);
      expect(Math.abs(index.createdAt.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe('addVersion', () => {
    it('should add a version to the index', () => {
      projectIndex.addVersion(mockVersionEntry);
      
      const versions = projectIndex.getVersions();
      expect(versions).toHaveLength(1);
      expect(versions[0]).toEqual(mockVersionEntry);
    });

    it('should update the updatedAt timestamp when adding a version', () => {
      const beforeUpdate = projectIndex.toInterface().updatedAt;
      
      // Wait a small amount to ensure timestamp difference
      setTimeout(() => {
        projectIndex.addVersion(mockVersionEntry);
        const afterUpdate = projectIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });

    it('should not add duplicate versions', () => {
      projectIndex.addVersion(mockVersionEntry);
      projectIndex.addVersion(mockVersionEntry);
      
      const versions = projectIndex.getVersions();
      expect(versions).toHaveLength(1);
    });

    it('should set as current version if it is the first version', () => {
      projectIndex.addVersion(mockVersionEntry);
      
      expect(projectIndex.getCurrentVersion()).toEqual(mockVersionEntry);
    });

    it('should not override current version unless explicitly set', () => {
      const version1 = { ...mockVersionEntry, version: '1.0.0' };
      const version2 = { ...mockVersionEntry, version: '2.0.0' };
      
      projectIndex.addVersion(version1);
      projectIndex.addVersion(version2);
      
      expect(projectIndex.getCurrentVersion()).toEqual(version1);
    });
  });

  describe('setCurrentVersion', () => {
    beforeEach(() => {
      projectIndex.addVersion(mockVersionEntry);
    });

    it('should set the current version', () => {
      projectIndex.setCurrentVersion(mockVersionEntry.id);
      
      expect(projectIndex.getCurrentVersion()).toEqual(mockVersionEntry);
    });

    it('should throw error if version does not exist', () => {
      expect(() => {
        projectIndex.setCurrentVersion('non-existent-id');
      }).toThrow('Version not found');
    });

    it('should update the updatedAt timestamp when setting current version', () => {
      const beforeUpdate = projectIndex.toInterface().updatedAt;
      
      setTimeout(() => {
        projectIndex.setCurrentVersion(mockVersionEntry.id);
        const afterUpdate = projectIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });
  });

  describe('addBranch', () => {
    it('should add a branch to the index', () => {
      projectIndex.addBranch(mockBranchEntry);
      
      const branches = projectIndex.getBranches();
      expect(branches).toHaveLength(1);
      expect(branches[0]).toEqual(mockBranchEntry);
    });

    it('should update the updatedAt timestamp when adding a branch', () => {
      const beforeUpdate = projectIndex.toInterface().updatedAt;
      
      setTimeout(() => {
        projectIndex.addBranch(mockBranchEntry);
        const afterUpdate = projectIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });

    it('should not add duplicate branches', () => {
      projectIndex.addBranch(mockBranchEntry);
      projectIndex.addBranch(mockBranchEntry);
      
      const branches = projectIndex.getBranches();
      expect(branches).toHaveLength(1);
    });

    it('should set as active branch if it is the first branch', () => {
      projectIndex.addBranch(mockBranchEntry);
      
      expect(projectIndex.getActiveBranch()).toEqual(mockBranchEntry);
    });

    it('should not override active branch unless explicitly set', () => {
      const branch1 = { ...mockBranchEntry, name: 'main' };
      const branch2 = { ...mockBranchEntry, name: 'develop' };
      
      projectIndex.addBranch(branch1);
      projectIndex.addBranch(branch2);
      
      expect(projectIndex.getActiveBranch()).toEqual(branch1);
    });
  });

  describe('setActiveBranch', () => {
    beforeEach(() => {
      projectIndex.addBranch(mockBranchEntry);
    });

    it('should set the active branch', () => {
      projectIndex.setActiveBranch(mockBranchEntry.name);
      
      expect(projectIndex.getActiveBranch()).toEqual(mockBranchEntry);
    });

    it('should throw error if branch does not exist', () => {
      expect(() => {
        projectIndex.setActiveBranch('non-existent-branch');
      }).toThrow('Branch not found');
    });

    it('should update the updatedAt timestamp when setting active branch', () => {
      const beforeUpdate = projectIndex.toInterface().updatedAt;
      
      setTimeout(() => {
        projectIndex.setActiveBranch(mockBranchEntry.name);
        const afterUpdate = projectIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });
  });

  describe('updateProject', () => {
    it('should update the project entry', () => {
      const updatedEntry = { ...mockProjectEntry, name: 'Updated Project' };
      
      projectIndex.updateProject(updatedEntry);
      
      expect(projectIndex.getProject()).toEqual(updatedEntry);
    });

    it('should update the updatedAt timestamp when updating project', () => {
      const beforeUpdate = projectIndex.toInterface().updatedAt;
      const updatedEntry = { ...mockProjectEntry, name: 'Updated Project' };
      
      setTimeout(() => {
        projectIndex.updateProject(updatedEntry);
        const afterUpdate = projectIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });

    it('should preserve the project ID', () => {
      const updatedEntry = { ...mockProjectEntry, id: 'different-id' };
      
      projectIndex.updateProject(updatedEntry);
      
      expect(projectIndex.getProject().id).toBe(mockProjectEntry.id);
    });
  });

  describe('getVersion', () => {
    beforeEach(() => {
      projectIndex.addVersion(mockVersionEntry);
    });

    it('should return version by ID', () => {
      const version = projectIndex.getVersion(mockVersionEntry.id);
      
      expect(version).toEqual(mockVersionEntry);
    });

    it('should return undefined for non-existent version', () => {
      const version = projectIndex.getVersion('non-existent-id');
      
      expect(version).toBeUndefined();
    });
  });

  describe('getBranch', () => {
    beforeEach(() => {
      projectIndex.addBranch(mockBranchEntry);
    });

    it('should return branch by name', () => {
      const branch = projectIndex.getBranch(mockBranchEntry.name);
      
      expect(branch).toEqual(mockBranchEntry);
    });

    it('should return undefined for non-existent branch', () => {
      const branch = projectIndex.getBranch('non-existent-branch');
      
      expect(branch).toBeUndefined();
    });
  });

  describe('removeVersion', () => {
    beforeEach(() => {
      projectIndex.addVersion(mockVersionEntry);
    });

    it('should remove version by ID', () => {
      projectIndex.removeVersion(mockVersionEntry.id);
      
      const versions = projectIndex.getVersions();
      expect(versions).toHaveLength(0);
    });

    it('should clear current version if it was removed', () => {
      projectIndex.setCurrentVersion(mockVersionEntry.id);
      projectIndex.removeVersion(mockVersionEntry.id);
      
      expect(projectIndex.getCurrentVersion()).toBeUndefined();
    });

    it('should update the updatedAt timestamp when removing version', () => {
      const beforeUpdate = projectIndex.toInterface().updatedAt;
      
      setTimeout(() => {
        projectIndex.removeVersion(mockVersionEntry.id);
        const afterUpdate = projectIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });
  });

  describe('removeBranch', () => {
    beforeEach(() => {
      projectIndex.addBranch(mockBranchEntry);
    });

    it('should remove branch by name', () => {
      projectIndex.removeBranch(mockBranchEntry.name);
      
      const branches = projectIndex.getBranches();
      expect(branches).toHaveLength(0);
    });

    it('should clear active branch if it was removed', () => {
      projectIndex.setActiveBranch(mockBranchEntry.name);
      projectIndex.removeBranch(mockBranchEntry.name);
      
      expect(projectIndex.getActiveBranch()).toBeUndefined();
    });

    it('should update the updatedAt timestamp when removing branch', () => {
      const beforeUpdate = projectIndex.toInterface().updatedAt;
      
      setTimeout(() => {
        projectIndex.removeBranch(mockBranchEntry.name);
        const afterUpdate = projectIndex.toInterface().updatedAt;
        expect(afterUpdate.getTime()).toBeGreaterThan(beforeUpdate.getTime());
      }, 10);
    });
  });

  describe('toInterface', () => {
    it('should return the complete ProjectIndex interface', () => {
      projectIndex.addVersion(mockVersionEntry);
      projectIndex.addBranch(mockBranchEntry);
      
      const index = projectIndex.toInterface();
      
      expect(index).toMatchObject({
        project: mockProjectEntry,
        versions: [mockVersionEntry],
        branches: [mockBranchEntry],
        currentVersion: mockVersionEntry,
        activeBranch: mockBranchEntry,
        metadata: {},
      });
      expect(index.createdAt).toBeInstanceOf(Date);
      expect(index.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('setMetadata', () => {
    it('should set metadata for the index', () => {
      const metadata = { custom: 'value', test: 123 };
      
      projectIndex.setMetadata(metadata);
      
      const index = projectIndex.toInterface();
      expect(index.metadata).toEqual(metadata);
    });

    it('should merge with existing metadata', () => {
      projectIndex.setMetadata({ existing: 'value' });
      projectIndex.setMetadata({ new: 'value' });
      
      const index = projectIndex.toInterface();
      expect(index.metadata).toEqual({
        existing: 'value',
        new: 'value',
      });
    });
  });

  describe('getMetadata', () => {
    it('should return the current metadata', () => {
      const metadata = { custom: 'value' };
      projectIndex.setMetadata(metadata);
      
      expect(projectIndex.getMetadata()).toEqual(metadata);
    });

    it('should return empty object by default', () => {
      expect(projectIndex.getMetadata()).toEqual({});
    });
  });

  describe('isValid', () => {
    it('should return true for valid index', () => {
      expect(projectIndex.isValid()).toBe(true);
    });

    it('should return false if project entry is missing required fields', () => {
      const invalidProject = { ...mockProjectEntry, id: '' };
      const invalidIndex = new ProjectIndex(invalidProject);
      
      expect(invalidIndex.isValid()).toBe(false);
    });

    it('should return false if project name is missing', () => {
      const invalidProject = { ...mockProjectEntry, name: '' };
      const invalidIndex = new ProjectIndex(invalidProject);
      
      expect(invalidIndex.isValid()).toBe(false);
    });

    it('should return false if project type is missing', () => {
      const invalidProject = { ...mockProjectEntry, type: '' as any };
      const invalidIndex = new ProjectIndex(invalidProject);
      
      expect(invalidIndex.isValid()).toBe(false);
    });

    it('should return false if project rootPath is missing', () => {
      const invalidProject = { ...mockProjectEntry, rootPath: '' };
      const invalidIndex = new ProjectIndex(invalidProject);
      
      expect(invalidIndex.isValid()).toBe(false);
    });

    it('should return false if versions contain invalid data', () => {
      projectIndex.addVersion({ ...mockVersionEntry, id: '' });
      
      expect(projectIndex.isValid()).toBe(false);
    });

    it('should return false if version version field is missing', () => {
      projectIndex.addVersion({ ...mockVersionEntry, version: '' });
      
      expect(projectIndex.isValid()).toBe(false);
    });

    it('should return false if version type is missing', () => {
      projectIndex.addVersion({ ...mockVersionEntry, type: '' as any });
      
      expect(projectIndex.isValid()).toBe(false);
    });

    it('should return false if branches contain invalid data', () => {
      projectIndex.addBranch({ ...mockBranchEntry, name: '' });
      
      expect(projectIndex.isValid()).toBe(false);
    });

    it('should return false if branch type is missing', () => {
      projectIndex.addBranch({ ...mockBranchEntry, type: '' as any });
      
      expect(projectIndex.isValid()).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return index statistics', () => {
      projectIndex.addVersion(mockVersionEntry);
      projectIndex.addBranch(mockBranchEntry);
      
      const stats = projectIndex.getStatistics();
      
      expect(stats).toEqual({
        versionCount: 1,
        branchCount: 1,
        hasCurrentVersion: true,
        hasActiveBranch: true,
        lastUpdated: expect.any(Date),
      });
    });
  });
});

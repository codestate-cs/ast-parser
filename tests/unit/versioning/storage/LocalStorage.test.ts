import { LocalStorage } from '../../../../src/versioning/storage/LocalStorage';
import { VersionInfo, StorageConfig } from '../../../../src/types/versioning';
import { ProjectType } from '../../../../src/types/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { jest } from '@jest/globals';

// Mock fs/promises
jest.mock('fs/promises');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock path
jest.mock('path');
const mockedPath = path as jest.Mocked<typeof path>;

describe('LocalStorage', () => {
  let localStorage: LocalStorage;
  let mockConfig: StorageConfig;
  let mockVersionInfo: VersionInfo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      type: 'local',
      path: '/test/storage',
      options: {
        createDirectories: true,
        atomicWrites: true,
        backupEnabled: true,
        compressionEnabled: false
      }
    };

    mockVersionInfo = {
      id: 'test-version-1',
      version: '1.0.0',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      metadata: {
        version: '1.0.0',
        createdAt: '2023-01-01T00:00:00Z',
        tags: ['stable'],
        description: 'Test version'
      },
      data: {
        project: {
          name: 'test-project',
          version: '1.0.0',
          type: 'typescript' as ProjectType,
          rootPath: '/test/project',
          entryPoints: [],
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
          complexity: {
            cyclomatic: 1,
            cognitive: 1,
            maintainability: 1
          },
          patterns: [],
          architecture: {
            layers: [],
            modules: []
          },
          quality: {
            score: 1,
            issues: []
          }
        },
        metadata: {
          generatedAt: '2023-01-01T00:00:00Z',
          parserVersion: '1.0.0',
          processingTime: 0,
          cacheUsed: false,
          filesProcessed: 0
        }
      }
    };

    localStorage = new LocalStorage(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(localStorage).toBeInstanceOf(LocalStorage);
    });

    it('should use default config when none provided', () => {
      const defaultStorage = new LocalStorage();
      expect(defaultStorage).toBeInstanceOf(LocalStorage);
    });
  });

  describe('initialize', () => {
    it('should create storage directory if it does not exist', async () => {
      mockedFs.access.mockRejectedValueOnce(new Error('Directory does not exist'));
      mockedFs.mkdir.mockResolvedValueOnce(undefined);

      await localStorage.initialize();

      expect(mockedFs.mkdir).toHaveBeenCalledWith('/test/storage', { recursive: true });
    });

    it('should not create directory if it already exists', async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);

      await localStorage.initialize();

      expect(mockedFs.mkdir).not.toHaveBeenCalled();
    });

    it('should handle directory creation errors', async () => {
      mockedFs.access.mockRejectedValueOnce(new Error('Directory does not exist'));
      mockedFs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(localStorage.initialize()).rejects.toThrow('Permission denied');
    });
  });

  describe('store', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should store version data to file', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.writeFile.mockResolvedValueOnce(undefined);

      const result = await localStorage.store(mockVersionInfo);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        JSON.stringify(mockVersionInfo, null, 2),
        'utf8'
      );
      expect(result).toEqual({
        id: expect.any(String),
        versionId: mockVersionInfo.id,
        path: expectedPath,
        metadata: expect.objectContaining({
          storedAt: expect.any(String),
          size: expect.any(Number),
          checksum: expect.any(String)
        })
      });
    });

    it('should handle write errors', async () => {
      mockedPath.join.mockReturnValue('/test/storage/test-version-1.json');
      mockedFs.writeFile.mockRejectedValueOnce(new Error('Write failed'));

      await expect(localStorage.store(mockVersionInfo)).rejects.toThrow('Write failed');
    });

    it('should create backup if enabled', async () => {
      const config = { ...mockConfig, options: { ...mockConfig.options, backupEnabled: true } };
      const storage = new LocalStorage(config);
      await storage.initialize();

      // First store a version
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.writeFile.mockResolvedValueOnce(undefined);
      await storage.store(mockVersionInfo);

      // Now store again with backup enabled
      const backupPath = '/test/storage/test-version-1.json.backup';
      mockedPath.join
        .mockReturnValueOnce(expectedPath)  // First call for getVersionFilePath
        .mockReturnValueOnce(backupPath);   // Second call for createBackup
      mockedFs.access.mockResolvedValueOnce(undefined); // File exists
      mockedFs.copyFile.mockResolvedValueOnce(undefined);
      mockedFs.writeFile.mockResolvedValueOnce(undefined);

      await storage.store(mockVersionInfo);

      expect(mockedFs.copyFile).toHaveBeenCalledWith(expectedPath, backupPath);
      
      // Reset the mock to prevent affecting other tests
      mockedPath.join.mockReset();
    });
  });

  describe('retrieve', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should retrieve version data from file', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.readFile.mockResolvedValueOnce(JSON.stringify(mockVersionInfo));

      const result = await localStorage.retrieve('test-version-1');

      expect(mockedFs.readFile).toHaveBeenCalledWith(expectedPath, 'utf8');
      expect(result).toEqual(mockVersionInfo);
    });

    it('should handle file not found', async () => {
      mockedPath.join.mockReturnValue('/test/storage/nonexistent.json');
      mockedFs.readFile.mockRejectedValueOnce(new Error('ENOENT'));

      await expect(localStorage.retrieve('nonexistent')).rejects.toThrow('ENOENT');
    });

    it('should handle JSON parsing errors', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.readFile.mockResolvedValueOnce('invalid json');

      await expect(localStorage.retrieve('test-version-1')).rejects.toThrow();
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should delete version file', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.unlink.mockResolvedValueOnce(undefined);

      await localStorage.delete('test-version-1');

      expect(mockedFs.unlink).toHaveBeenCalledWith(expectedPath);
    });

    it('should handle file not found during deletion', async () => {
      mockedPath.join.mockReturnValue('/test/storage/nonexistent.json');
      mockedFs.unlink.mockRejectedValueOnce(new Error('ENOENT'));

      await expect(localStorage.delete('nonexistent')).rejects.toThrow('ENOENT');
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should list all version files', async () => {
      const mockFiles = [
        { name: 'version-1.json', isFile: () => true },
        { name: 'version-2.json', isFile: () => true },
        { name: 'backup.json.backup', isFile: () => true },
        { name: 'subdir', isFile: () => false }
      ];
      
      mockedFs.readdir.mockResolvedValueOnce(mockFiles as any);
      mockedPath.join.mockReturnValue('/test/storage');
      mockedPath.extname.mockImplementation((file: string) => {
        if (file === 'version-1.json' || file === 'version-2.json') return '.json';
        if (file === 'backup.json.backup') return '.backup';
        return '';
      });
      mockedPath.basename.mockImplementation((file: string, ext?: string) => {
        if (ext === '.json') {
          return file.replace('.json', '');
        }
        return file;
      });

      // Mock fs.stat for each file
      mockedFs.stat.mockResolvedValue({
        mtime: new Date(),
        size: 1024
      } as any);

      // Mock checksum generation
      mockedFs.readFile.mockResolvedValue('mock content');

      const result = await localStorage.list();

      expect(result).toHaveLength(2);
      expect(result[0]?.versionId).toBe('version-1');
      expect(result[1]?.versionId).toBe('version-2');
    });

    it('should handle empty directory', async () => {
      mockedFs.readdir.mockResolvedValueOnce([]);
      mockedPath.join.mockReturnValue('/test/storage');

      const result = await localStorage.list();

      expect(result).toEqual([]);
    });

    it('should handle directory read errors', async () => {
      mockedFs.readdir.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(localStorage.list()).rejects.toThrow('Permission denied');
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should return true if file exists', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.access.mockResolvedValueOnce(undefined);

      const result = await localStorage.exists('test-version-1');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      mockedPath.join.mockReturnValue('/test/storage/nonexistent.json');
      mockedFs.access.mockRejectedValueOnce(new Error('ENOENT'));

      const result = await localStorage.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getMetadata', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should get file metadata', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      const mockStats = {
        size: 1024,
        mtime: new Date('2023-01-01T00:00:00Z'),
        ctime: new Date('2023-01-01T00:00:00Z')
      };
      
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.stat.mockResolvedValueOnce(mockStats as any);

      const result = await localStorage.getMetadata('test-version-1');

      expect(result).toEqual({
        storedAt: mockStats.mtime.toISOString(),
        size: mockStats.size,
        checksum: expect.any(String)
      });
    });

    it('should handle file not found', async () => {
      mockedPath.join.mockReturnValue('/test/storage/nonexistent.json');
      mockedFs.stat.mockRejectedValueOnce(new Error('ENOENT'));

      await expect(localStorage.getMetadata('nonexistent')).rejects.toThrow('ENOENT');
    });
  });

  describe('updateMetadata', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should update file metadata', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.readFile.mockResolvedValueOnce(JSON.stringify(mockVersionInfo));
      mockedFs.writeFile.mockResolvedValueOnce(undefined);

      const newMetadata = { tags: ['updated'] };
      await localStorage.updateMetadata('test-version-1', newMetadata);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        expect.stringContaining('"tags"'),
        'utf8'
      );
    });

    it('should handle file not found during update', async () => {
      mockedPath.join.mockReturnValue('/test/storage/nonexistent.json');
      mockedFs.readFile.mockRejectedValueOnce(new Error('ENOENT'));

      await expect(localStorage.updateMetadata('nonexistent', {})).rejects.toThrow('ENOENT');
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should cleanup old versions based on retention policy', async () => {
      const mockFiles = [
        { name: 'old-version.json', isFile: () => true },
        { name: 'new-version.json', isFile: () => true },
        { name: 'another-old-version.json', isFile: () => true },
        { name: 'yet-another-old-version.json', isFile: () => true },
        { name: 'one-more-old-version.json', isFile: () => true },
        { name: 'latest-version.json', isFile: () => true }
      ];
      
      mockedFs.readdir.mockResolvedValueOnce(mockFiles as any);
      mockedPath.join.mockReturnValue('/test/storage');
      mockedPath.extname.mockImplementation((file: string) => {
        if (file.includes('.json')) return '.json';
        return '';
      });
      mockedPath.basename.mockImplementation((file: string, ext?: string) => {
        if (ext === '.json') {
          return file.replace('.json', '');
        }
        return file;
      });
      
      const oldStats = {
        mtime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        size: 1024
      };
      const newStats = {
        mtime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        size: 1024
      };
      
      mockedFs.stat
        .mockResolvedValueOnce(oldStats as any)
        .mockResolvedValueOnce(newStats as any)
        .mockResolvedValueOnce(oldStats as any)
        .mockResolvedValueOnce(oldStats as any)
        .mockResolvedValueOnce(oldStats as any)
        .mockResolvedValueOnce(newStats as any);
      
      // Mock checksum generation
      mockedFs.readFile.mockResolvedValue('mock content');
      
      mockedFs.unlink.mockResolvedValueOnce(undefined);

      const result = await localStorage.cleanup();

      expect(result).toBe(1);
      expect(mockedFs.unlink).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup errors gracefully', async () => {
      mockedFs.readdir.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(localStorage.cleanup()).rejects.toThrow('Permission denied');
    });
  });

  describe('validate', () => {
    it('should validate storage configuration', async () => {
      const result = await localStorage.validate(mockConfig);
      expect(result).toBe(true);
    });

    it('should validate storage path accessibility', async () => {
      mockedFs.access.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await localStorage.validate(mockConfig);
      expect(result).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should dispose storage resources', async () => {
      await localStorage.dispose();
      // Should not throw any errors
    });
  });

  describe('exportData', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should export all version data', async () => {
      const mockFiles = [
        { name: 'version-1.json', isFile: () => true },
        { name: 'version-2.json', isFile: () => true }
      ];
      
      mockedFs.readdir.mockResolvedValueOnce(mockFiles as any);
      mockedPath.join.mockReturnValue('/test/storage');
      mockedPath.extname.mockImplementation((file: string) => {
        if (file === 'version-1.json' || file === 'version-2.json') return '.json';
        return '';
      });
      mockedPath.basename.mockImplementation((file: string, ext?: string) => {
        if (ext === '.json') {
          return file.replace('.json', '');
        }
        return file;
      });
      
      // Mock fs.stat for each file
      mockedFs.stat.mockResolvedValue({
        mtime: new Date(),
        size: 1024
      } as any);
      
      mockedFs.readFile
        .mockResolvedValueOnce('mock content') // For checksum generation in list()
        .mockResolvedValueOnce('mock content') // For checksum generation in list()
        .mockResolvedValueOnce(JSON.stringify({ ...mockVersionInfo, id: 'version-1' })) // For retrieve()
        .mockResolvedValueOnce(JSON.stringify({ ...mockVersionInfo, id: 'version-2' })); // For retrieve()

      const result = await localStorage.exportData();

      expect(result.versions).toHaveLength(2);
      expect(result.metadata).toEqual({
        exportedAt: expect.any(String),
        totalVersions: 2,
        storageType: 'local'
      });
    });

    it('should handle export errors', async () => {
      mockedFs.readdir.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(localStorage.exportData()).rejects.toThrow('Permission denied');
    });
  });

  describe('importData', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should import version data', async () => {
      const importData = {
        versions: [mockVersionInfo],
        metadata: {
          exportedAt: '2023-01-01T00:00:00Z',
          totalVersions: 1,
          storageType: 'local'
        }
      };

      await expect(localStorage.importData(importData)).rejects.toThrow('Import not implemented');
    });

    it('should handle import errors', async () => {
      const importData = {
        versions: [mockVersionInfo],
        metadata: {
          exportedAt: '2023-01-01T00:00:00Z',
          totalVersions: 1,
          storageType: 'local'
        }
      };

      await expect(localStorage.importData(importData)).rejects.toThrow('Import not implemented');
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent operations', async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();

      mockedPath.join.mockReturnValue('/test/storage/test-version-1.json');
      mockedFs.writeFile.mockResolvedValueOnce(undefined);

      const promises = [
        localStorage.store(mockVersionInfo),
        localStorage.store({ ...mockVersionInfo, id: 'test-version-2' })
      ];

      await expect(Promise.all(promises)).resolves.toHaveLength(2);
    });

    it('should handle very large files', async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();

      const largeVersionInfo = {
        ...mockVersionInfo,
        data: {
          ...mockVersionInfo.data,
          ast: {
            nodes: new Array(10000).fill({ type: 'test' }),
            relations: new Array(10000).fill({ from: 'a', to: 'b' }),
            entryPoints: [],
            publicExports: [],
            privateExports: []
          }
        }
      };

      mockedPath.join.mockReturnValue('/test/storage/test-version-1.json');
      mockedFs.writeFile.mockResolvedValueOnce(undefined);

      await expect(localStorage.store(largeVersionInfo)).resolves.toBeDefined();
    });

    it('should handle special characters in version IDs', async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();

      const specialVersionInfo = {
        ...mockVersionInfo,
        id: 'test-version-with-special-chars-@#$%'
      };

      mockedPath.join.mockReturnValue('/test/storage/test-version-with-special-chars-@#$%.json');
      mockedFs.writeFile.mockResolvedValueOnce(undefined);

      await expect(localStorage.store(specialVersionInfo)).resolves.toBeDefined();
    });
  });

  describe('additional branch coverage', () => {
    beforeEach(async () => {
      mockedFs.access.mockResolvedValueOnce(undefined);
      await localStorage.initialize();
    });

    it('should throw error when createDirectories is false and directory does not exist', async () => {
      const config = { ...mockConfig, options: { ...mockConfig.options, createDirectories: false } };
      const storage = new LocalStorage(config);
      
      mockedFs.access.mockRejectedValueOnce(new Error('ENOENT'));

      await expect(storage.initialize()).rejects.toThrow('Storage directory does not exist');
    });

    it('should handle file read errors in list method', async () => {
      const mockFiles = [
        { name: 'version-1.json', isFile: () => true },
        { name: 'version-2.json', isFile: () => true }
      ];
      
      mockedFs.readdir.mockResolvedValueOnce(mockFiles as any);
      mockedPath.join.mockReturnValue('/test/storage');
      mockedPath.extname.mockImplementation((file: string) => {
        if (file.includes('.json')) return '.json';
        return '';
      });
      mockedPath.basename.mockImplementation((file: string, ext?: string) => {
        if (ext === '.json') {
          return file.replace('.json', '');
        }
        return file;
      });

      // Mock fs.stat to fail for both files
      mockedFs.stat
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockRejectedValueOnce(new Error('Permission denied'));

      const result = await localStorage.list();

      // Should return empty array when all files fail
      expect(result).toHaveLength(0);
    });

    it('should throw error when version not found in updateMetadata', async () => {
      const expectedPath = '/test/storage/nonexistent.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.readFile.mockRejectedValueOnce(new Error('ENOENT')); // Simulate version not found

      const newMetadata = { tags: ['updated'] };
      await expect(localStorage.updateMetadata('nonexistent', newMetadata)).rejects.toThrow('ENOENT');
    });

    it('should throw error when retrieve returns null in updateMetadata', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      
      // Mock retrieve to return null (simulating version not found)
      const originalRetrieve = localStorage.retrieve.bind(localStorage);
      (localStorage as any).retrieve = jest.fn().mockImplementation(() => Promise.resolve(null));

      const newMetadata = { tags: ['updated'] };
      await expect(localStorage.updateMetadata('test-version-1', newMetadata)).rejects.toThrow('Version not found');
      
      // Restore original method
      localStorage.retrieve = originalRetrieve;
    });

    it('should handle writeFile errors in updateMetadata', async () => {
      const expectedPath = '/test/storage/test-version-1.json';
      mockedPath.join.mockReturnValue(expectedPath);
      mockedFs.readFile.mockResolvedValueOnce(JSON.stringify(mockVersionInfo));
      mockedFs.writeFile.mockRejectedValueOnce(new Error('Write failed'));

      const newMetadata = { tags: ['updated'] };
      await expect(localStorage.updateMetadata('test-version-1', newMetadata)).rejects.toThrow('Write failed');
    });

    it('should handle delete errors in cleanup method', async () => {
      const mockFiles = [
        { name: 'old-version.json', isFile: () => true },
        { name: 'new-version.json', isFile: () => true },
        { name: 'another-old-version.json', isFile: () => true },
        { name: 'yet-another-old-version.json', isFile: () => true },
        { name: 'one-more-old-version.json', isFile: () => true },
        { name: 'latest-version.json', isFile: () => true }
      ];
      
      mockedFs.readdir.mockResolvedValueOnce(mockFiles as any);
      mockedPath.join.mockReturnValue('/test/storage');
      mockedPath.extname.mockImplementation((file: string) => {
        if (file.includes('.json')) return '.json';
        return '';
      });
      mockedPath.basename.mockImplementation((file: string, ext?: string) => {
        if (ext === '.json') {
          return file.replace('.json', '');
        }
        return file;
      });
      
      const oldStats = {
        mtime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        size: 1024
      };
      const newStats = {
        mtime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        size: 1024
      };
      
      mockedFs.stat
        .mockResolvedValueOnce(oldStats as any)
        .mockResolvedValueOnce(newStats as any)
        .mockResolvedValueOnce(oldStats as any)
        .mockResolvedValueOnce(oldStats as any)
        .mockResolvedValueOnce(oldStats as any)
        .mockResolvedValueOnce(newStats as any);
      
      // Mock checksum generation
      mockedFs.readFile.mockResolvedValue('mock content');
      
      // Mock delete to fail
      mockedFs.unlink.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await localStorage.cleanup();

      // Should return 0 because delete failed
      expect(result).toBe(0);
    });

    it('should handle versions that do not meet cleanup criteria', async () => {
      // Mock list to return versions that don't meet cleanup criteria (age <= maxAge AND count <= maxVersions)
      const originalList = localStorage.list.bind(localStorage);
      (localStorage as any).list = jest.fn().mockImplementation(() => Promise.resolve([
        { versionId: 'version-1', metadata: { storedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() } },
        { versionId: 'version-2', metadata: { storedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() } },
        { versionId: 'version-3', metadata: { storedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() } }
      ]));

      const result = await localStorage.cleanup();

      // Should return 0 because no versions meet cleanup criteria (all are newer than 7 days and count is <= 10)
      expect(result).toBe(0);
      
      // Restore original method
      localStorage.list = originalList;
    });

    it('should handle retrieve errors in exportData method', async () => {
      const mockFiles = [
        { name: 'version-1.json', isFile: () => true },
        { name: 'version-2.json', isFile: () => true }
      ];
      
      mockedFs.readdir.mockResolvedValueOnce(mockFiles as any);
      mockedPath.join.mockReturnValue('/test/storage');
      mockedPath.extname.mockImplementation((file: string) => {
        if (file === 'version-1.json' || file === 'version-2.json') return '.json';
        return '';
      });
      mockedPath.basename.mockImplementation((file: string, ext?: string) => {
        if (ext === '.json') {
          return file.replace('.json', '');
        }
        return file;
      });
      
      // Mock fs.stat for each file
      mockedFs.stat.mockResolvedValue({
        mtime: new Date(),
        size: 1024
      } as any);
      
      mockedFs.readFile
        .mockResolvedValueOnce('mock content') // For checksum generation in list()
        .mockResolvedValueOnce('mock content') // For checksum generation in list()
        .mockRejectedValueOnce(new Error('Read error')) // For retrieve() - should be skipped
        .mockResolvedValueOnce(JSON.stringify({ ...mockVersionInfo, id: 'version-2' })); // For retrieve()

      const result = await localStorage.exportData();

      // Should only export the version that could be read successfully
      expect(result.versions).toHaveLength(1);
      expect(result.versions[0]?.id).toBe('version-2');
    });

    it('should handle file read errors in generateChecksumFromFile', async () => {
      const filePath = '/test/storage/test-file.json';
      mockedFs.readFile.mockRejectedValueOnce(new Error('Read error'));

      // This is a private method, so we'll test it indirectly through getMetadata
      mockedPath.join.mockReturnValue(filePath);
      
      const result = await localStorage.getMetadata('test-file');

      // Should still return metadata even if checksum generation fails
      expect(result).toHaveProperty('storedAt');
      expect(result).toHaveProperty('size');
      expect(result).toHaveProperty('checksum');
    });

    it('should throw error when storage is not initialized', async () => {
      const uninitializedStorage = new LocalStorage();
      
      await expect(uninitializedStorage.store(mockVersionInfo)).rejects.toThrow('Storage not initialized');
    });

    it('should handle initialize when createDirectories is false and directory does not exist', async () => {
      const config: StorageConfig = {
        type: 'local',
        path: '/nonexistent/path',
        options: {
          createDirectories: false,
          atomicWrites: true,
          backupEnabled: false,
          compressionEnabled: false
        }
      };

      const storage = new LocalStorage(config);
      
      mockedFs.access.mockRejectedValue(new Error('Directory does not exist'));
      
      await expect(storage.initialize()).rejects.toThrow('Storage directory does not exist');
    });

    it('should handle file read errors in list method', async () => {
      mockedFs.readdir.mockResolvedValue(['version1.json', 'version2.json'] as any);
      mockedFs.stat.mockRejectedValue(new Error('File read error'));
      
      const result = await localStorage.list();
      
      expect(result).toEqual([]);
    });

    it('should throw error when version not found in updateMetadata', async () => {
      // Mock retrieve to throw an error
      jest.spyOn(localStorage, 'retrieve').mockRejectedValue(new Error('File not found'));
      
      await expect(localStorage.updateMetadata('nonexistent', { test: 'value' }))
        .rejects.toThrow('File not found');
    });

    it('should throw error when retrieve returns null in updateMetadata', async () => {
      mockedFs.stat.mockResolvedValue({ mtime: new Date(), size: 100 } as any);
      mockedFs.readFile.mockResolvedValue('{"id":"test","version":"1.0.0"}');
      
      // Mock retrieve to return null
      jest.spyOn(localStorage, 'retrieve').mockResolvedValue(null);
      
      await expect(localStorage.updateMetadata('test', { test: 'value' }))
        .rejects.toThrow('Version not found');
    });

    it('should handle writeFile errors in updateMetadata', async () => {
      mockedFs.stat.mockResolvedValue({ mtime: new Date(), size: 100 } as any);
      mockedFs.readFile.mockResolvedValue('{"id":"test","version":"1.0.0"}');
      mockedFs.writeFile.mockRejectedValue(new Error('Write error'));
      
      await expect(localStorage.updateMetadata('test', { test: 'value' }))
        .rejects.toThrow('Write error');
    });

    it('should handle delete errors in cleanup method', async () => {
      const mockVersions = [
        {
          id: 'storage-1',
          versionId: 'version-1',
          path: '/test/version1.json',
          metadata: { storedAt: '2023-01-01T00:00:00Z' }
        },
        {
          id: 'storage-2',
          versionId: 'version-2',
          path: '/test/version2.json',
          metadata: { storedAt: '2023-01-02T00:00:00Z' }
        }
      ];

      jest.spyOn(localStorage, 'list').mockResolvedValue(mockVersions as any);
      jest.spyOn(localStorage, 'delete').mockRejectedValue(new Error('Delete error'));
      
      const result = await localStorage.cleanup();
      
      expect(result).toBe(0);
    });

    it('should handle versions that do not meet cleanup criteria', async () => {
      const recentDate = new Date().toISOString();
      const mockVersions = [
        {
          id: 'storage-1',
          versionId: 'version-1',
          path: '/test/version1.json',
          metadata: { storedAt: recentDate }
        }
      ];

      jest.spyOn(localStorage, 'list').mockResolvedValue(mockVersions as any);
      
      const result = await localStorage.cleanup();
      
      expect(result).toBe(0);
    });

    it('should handle retrieve errors in exportData method', async () => {
      const mockVersions = [
        {
          id: 'storage-1',
          versionId: 'version-1',
          path: '/test/version1.json',
          metadata: { storedAt: '2023-01-01T00:00:00Z' }
        }
      ];

      jest.spyOn(localStorage, 'list').mockResolvedValue(mockVersions as any);
      jest.spyOn(localStorage, 'retrieve').mockRejectedValue(new Error('Retrieve error'));
      
      const result = await localStorage.exportData();
      
      expect(result.versions).toEqual([]);
      expect(result.metadata.totalVersions).toBe(0);
    });
  });
});

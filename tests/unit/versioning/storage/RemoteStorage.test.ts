import { RemoteStorage } from '../../../../src/versioning/storage/RemoteStorage';
import { VersionInfo, StorageConfig } from '../../../../src/types/versioning';
import { ProjectType } from '../../../../src/types/core';

// Mock Response constructor
const createMockResponse = (overrides: Partial<Response> = {}): Response => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  type: 'basic',
  url: '',
  redirected: false,
  body: null,
  bodyUsed: false,
  arrayBuffer: jest.fn(),
  blob: jest.fn(),
  formData: jest.fn(),
  json: jest.fn(),
  text: jest.fn(),
  clone: jest.fn(),
  ...overrides
} as Response);
import { jest } from '@jest/globals';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('RemoteStorage', () => {
  let remoteStorage: RemoteStorage;
  let mockConfig: StorageConfig;
  let mockVersionInfo: VersionInfo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      type: 'remote',
      path: 'https://api.example.com/versions',
      options: {
        apiKey: 'test-api-key',
        timeout: 5000,
        retries: 1, // Set retries to 1 for faster tests
        compressionEnabled: true
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

    remoteStorage = new RemoteStorage(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(remoteStorage).toBeInstanceOf(RemoteStorage);
    });

    it('should use default config when none provided', () => {
      const defaultStorage = new RemoteStorage();
      expect(defaultStorage).toBeInstanceOf(RemoteStorage);
    });

    it('should handle config without API key', () => {
      const configWithoutKey = {
        type: 'remote' as const,
        path: 'https://api.example.com/versions',
        options: {
          timeout: 5000,
          retries: 2,
          compressionEnabled: false
        }
      };
      const storage = new RemoteStorage(configWithoutKey);
      expect(storage).toBeInstanceOf(RemoteStorage);
    });

    it('should handle config with undefined options', () => {
      const configWithUndefinedOptions = {
        type: 'remote' as const,
        path: 'https://api.example.com/versions',
        options: {
          apiKey: undefined,
          timeout: undefined,
          retries: undefined,
          compressionEnabled: undefined
        }
      };
      const storage = new RemoteStorage(configWithUndefinedOptions);
      expect(storage).toBeInstanceOf(RemoteStorage);
    });

    it('should use default timeout and retries when not provided', () => {
      const configWithMinimalOptions = {
        type: 'remote' as const,
        path: 'https://api.example.com/versions',
        options: {}
      };
      const storage = new RemoteStorage(configWithMinimalOptions);
      expect(storage).toBeInstanceOf(RemoteStorage);
    });
  });

  describe('initialize', () => {
    it('should initialize remote storage', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));

      await remoteStorage.initialize();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should handle initialization errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(remoteStorage.initialize()).rejects.toThrow();
    });

    it('should handle initialization failure with non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }));

      await expect(remoteStorage.initialize()).rejects.toThrow('Remote storage initialization failed');
    });

    it('should handle initialization without API key', async () => {
      const storageWithoutKey = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          timeout: 5000,
          retries: 1
        }
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));

      await storageWithoutKey.initialize();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('store', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should store version data via API', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({
          id: 'storage-123',
          versionId: 'test-version-1',
          path: 'https://api.example.com/versions/test-version-1',
          metadata: {
            storedAt: '2023-01-01T00:00:00Z',
            size: 1024,
            checksum: 'abc123'
          }
        })
      }));

      const result = await remoteStorage.store(mockVersionInfo);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(mockVersionInfo)
        })
      );

      expect(result).toEqual({
        id: 'storage-123',
        versionId: 'test-version-1',
        path: 'https://api.example.com/versions/test-version-1',
        metadata: {
          storedAt: '2023-01-01T00:00:00Z',
          size: 1024,
          checksum: 'abc123'
        }
      });
    });

    it('should handle store errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.store(mockVersionInfo)).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid data' })
      }));

      await expect(remoteStorage.store(mockVersionInfo)).rejects.toThrow();
    });
  });

  describe('retrieve', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should retrieve version data from API', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve(mockVersionInfo)
      }));

      const result = await remoteStorage.retrieve('test-version-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(result).toEqual(mockVersionInfo);
    });

    it('should return null when version not found', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      const result = await remoteStorage.retrieve('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.retrieve('test-version-1')).rejects.toThrow();
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should delete version via API', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ deleted: true })
      }));

      const result = await remoteStorage.delete('test-version-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(result).toBe(true);
    });

    it('should handle delete errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.delete('test-version-1')).rejects.toThrow();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should list all versions from API', async () => {
      const mockVersions = [
        {
          id: 'storage-1',
          versionId: 'version-1',
          path: 'https://api.example.com/versions/version-1',
          metadata: {
            storedAt: '2023-01-01T00:00:00Z',
            size: 1024,
            checksum: 'abc123'
          }
        },
        {
          id: 'storage-2',
          versionId: 'version-2',
          path: 'https://api.example.com/versions/version-2',
          metadata: {
            storedAt: '2023-01-02T00:00:00Z',
            size: 2048,
            checksum: 'def456'
          }
        }
      ];

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ versions: mockVersions })
      }));

      const result = await remoteStorage.list();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(result).toEqual(mockVersions);
    });

    it('should handle list errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.list()).rejects.toThrow();
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should check if version exists via API', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ exists: true })
      }));

      const result = await remoteStorage.exists('test-version-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1/exists',
        expect.objectContaining({
          method: 'HEAD',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(result).toBe(true);
    });

    it('should return false if version does not exist', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404
      }));

      const result = await remoteStorage.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getMetadata', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should get version metadata from API', async () => {
      const mockMetadata = {
        storedAt: '2023-01-01T00:00:00Z',
        size: 1024,
        checksum: 'abc123'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve(mockMetadata)
      }));

      const result = await remoteStorage.getMetadata('test-version-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1/metadata',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(result).toEqual(mockMetadata);
    });

    it('should handle metadata errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.getMetadata('test-version-1')).rejects.toThrow();
    });
  });

  describe('updateMetadata', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should update version metadata via API', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ updated: true })
      }));

      const newMetadata = { tags: ['updated'] };
      const result = await remoteStorage.updateMetadata('test-version-1', newMetadata);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1/metadata',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(newMetadata)
        })
      );

      expect(result).toBe(true);
    });

    it('should handle update errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.updateMetadata('test-version-1', {})).rejects.toThrow();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should cleanup old versions via API', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ deletedCount: 5 })
      }));

      const result = await remoteStorage.cleanup();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/cleanup',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(result).toBe(5);
    });

    it('should handle cleanup errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.cleanup()).rejects.toThrow();
    });
  });

  describe('validate', () => {
    it('should validate remote storage configuration', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));

      const result = await remoteStorage.validate(mockConfig);

      expect(result).toBe(true);
    });

    it('should validate storage accessibility', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await remoteStorage.validate(mockConfig);

      expect(result).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should dispose remote storage resources', async () => {
      await remoteStorage.dispose();
      // Should not throw any errors
    });
  });

  describe('exportData', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should export all version data from API', async () => {
      const mockExportData = {
        versions: [mockVersionInfo],
        metadata: {
          exportedAt: '2023-01-01T00:00:00Z',
          totalVersions: 1,
          storageType: 'remote'
        }
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve(mockExportData)
      }));

      const result = await remoteStorage.exportData();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/export',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );

      expect(result).toEqual(mockExportData);
    });

    it('should handle export errors', async () => {
      // Clear previous mocks and set up error
      jest.clearAllMocks();
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.exportData()).rejects.toThrow();
    });
  });

  describe('importData', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should import version data via API', async () => {
      const importData = {
        versions: [mockVersionInfo],
        metadata: {
          exportedAt: '2023-01-01T00:00:00Z',
          totalVersions: 1,
          storageType: 'remote'
        }
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ importedCount: 1, errors: [] })
      }));

      await remoteStorage.importData(importData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/import',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(importData)
        })
      );
    });

    it('should handle import errors', async () => {
      // Mock fetch to reject for all retry attempts
      mockFetch.mockRejectedValue(new Error('Network error'));

      const importData = {
        versions: [mockVersionInfo],
        metadata: {
          exportedAt: '2023-01-01T00:00:00Z',
          totalVersions: 1,
          storageType: 'remote'
        }
      };

      // Create a new instance with a fresh initialized state
      const tempStorage = new RemoteStorage(mockConfig);
      (tempStorage as any).initialized = true; // Bypass initialization

      await expect(tempStorage.importData(importData)).rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent operations', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();

      mockFetch.mockResolvedValue(createMockResponse({
        json: () => Promise.resolve({ success: true })
      }));

      const promises = [
        remoteStorage.store(mockVersionInfo),
        remoteStorage.store({ ...mockVersionInfo, id: 'test-version-2' })
      ];

      await expect(Promise.all(promises)).resolves.toHaveLength(2);
    });

    it('should handle very large files', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();

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

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ success: true })
      }));

      await expect(remoteStorage.store(largeVersionInfo)).resolves.toBeDefined();
    });

    it('should handle special characters in version IDs', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();

      const specialVersionInfo = {
        ...mockVersionInfo,
        id: 'test-version-with-special-chars-@#$%'
      };

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ success: true })
      }));

      await expect(remoteStorage.store(specialVersionInfo)).resolves.toBeDefined();
    });
  });

  describe('HTTP request handling', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should handle retry logic with exponential backoff', async () => {
      const storageWithRetries = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 1000,
          retries: 3
        }
      });

      // Mock initialization
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithRetries.initialize();

      // Clear the mock to start fresh for the store operation
      mockFetch.mockClear();

      // Mock fetch to fail twice then succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse({
          json: () => Promise.resolve({ success: true })
        }));

      await expect(storageWithRetries.store(mockVersionInfo)).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 calls for retries
    });

    it('should handle retry exhaustion', async () => {
      const storageWithRetries = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 1000,
          retries: 2
        }
      });

      // Mock initialization
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithRetries.initialize();

      // Mock fetch to always fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(storageWithRetries.store(mockVersionInfo)).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 for init + 3 for retries (2 retries + 1 initial)
    });

    it('should handle different HTTP methods', async () => {
      // Test GET request
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve(mockVersionInfo)
      }));
      await remoteStorage.retrieve('test-version-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1',
        expect.objectContaining({
          method: 'GET'
        })
      );

      // Test DELETE request
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ deleted: true })
      }));
      await remoteStorage.delete('test-version-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      // Test HEAD request
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ exists: true })
      }));
      await remoteStorage.exists('test-version-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1/exists',
        expect.objectContaining({
          method: 'HEAD'
        })
      );
    });

    it('should handle requests with and without body', async () => {
      // Test request with body
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ success: true })
      }));
      await remoteStorage.store(mockVersionInfo);

      // Verify the store call was made with body
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/versions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockVersionInfo)
        })
      );

      // Test request without body
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ versions: [] })
      }));
      await remoteStorage.list();

      // Verify the list call was made without body
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/versions',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should handle timeout scenarios', async () => {
      const storageWithShortTimeout = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 1, // Very short timeout
          retries: 1
        }
      });

      // Mock initialization
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithShortTimeout.initialize();

      // Mock fetch to timeout
      mockFetch.mockRejectedValue(new Error('Timeout'));

      await expect(storageWithShortTimeout.store(mockVersionInfo)).rejects.toThrow('Timeout');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should handle different API error status codes', async () => {
      // Test 400 Bad Request
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid data' })
      }));

      await expect(remoteStorage.store(mockVersionInfo)).rejects.toThrow('Failed to store version');

      // Test 401 Unauthorized
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      }));

      await expect(remoteStorage.retrieve('test-version-1')).rejects.toThrow('Failed to retrieve version');

      // Test 403 Forbidden
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      }));

      await expect(remoteStorage.delete('test-version-1')).rejects.toThrow('Failed to delete version');

      // Test 500 Internal Server Error
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }));

      await expect(remoteStorage.list()).rejects.toThrow('Failed to list versions');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      }));

      await expect(remoteStorage.retrieve('test-version-1')).rejects.toThrow('Invalid JSON');
    });

    it('should handle ensureInitialized error', async () => {
      const uninitializedStorage = new RemoteStorage(mockConfig);
      
      await expect(uninitializedStorage.store(mockVersionInfo)).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.retrieve('test-version-1')).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.delete('test-version-1')).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.list()).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.exists('test-version-1')).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.getMetadata('test-version-1')).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.updateMetadata('test-version-1', {})).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.cleanup()).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.exportData()).rejects.toThrow('Storage not initialized');
      await expect(uninitializedStorage.importData({})).rejects.toThrow('Storage not initialized');
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('String error');

      await expect(remoteStorage.store(mockVersionInfo)).rejects.toThrow();
    });
  });

  describe('additional edge cases', () => {
    it('should handle empty response from API', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();

      // Test empty list response
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({})
      }));

      const result = await remoteStorage.list();
      expect(result).toEqual([]);

      // Test empty cleanup response
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({})
      }));

      const cleanupResult = await remoteStorage.cleanup();
      expect(cleanupResult).toBe(0);
    });

    it('should handle store response with missing fields', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();

      // Test store response with missing fields
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({})
      }));

      const result = await remoteStorage.store(mockVersionInfo);
      expect(result).toEqual({
        id: expect.any(String),
        versionId: mockVersionInfo.id,
        path: `${mockConfig.path}/${mockVersionInfo.id}`,
        metadata: expect.any(Object)
      });
    });

    it('should handle different timeout values', async () => {
      const storageWithCustomTimeout = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 30000, // 30 seconds
          retries: 1
        }
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithCustomTimeout.initialize();

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ success: true })
      }));

      await expect(storageWithCustomTimeout.store(mockVersionInfo)).resolves.toBeDefined();
    });

    it('should handle different retry counts', async () => {
      // Test that different retry counts are properly configured
      const storageWithNoRetries = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 5000,
          retries: 0 // No retries
        }
      });

      const storageWithManyRetries = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 5000,
          retries: 5 // Many retries
        }
      });

      // Both should be created successfully
      expect(storageWithNoRetries).toBeInstanceOf(RemoteStorage);
      expect(storageWithManyRetries).toBeInstanceOf(RemoteStorage);
    });
  });

  describe('additional branch coverage', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await remoteStorage.initialize();
    });

    it('should handle exists method with network error', async () => {
      // Mock fetch to throw error for exists method
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await remoteStorage.exists('test-version-1');
      expect(result).toBe(false);
    });

    it('should handle getMetadata with non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }));

      await expect(remoteStorage.getMetadata('test-version-1')).rejects.toThrow('Failed to get metadata');
    });

    it('should handle updateMetadata with non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      }));

      await expect(remoteStorage.updateMetadata('test-version-1', {})).rejects.toThrow('Failed to update metadata');
    });

    it('should handle cleanup with non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      }));

      await expect(remoteStorage.cleanup()).rejects.toThrow('Failed to cleanup versions');
    });

    it('should handle exportData with non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      }));

      await expect(remoteStorage.exportData()).rejects.toThrow('Failed to export data');
    });

    it('should handle importData with non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      }));

      const importData = {
        versions: [mockVersionInfo],
        metadata: {
          exportedAt: '2023-01-01T00:00:00Z',
          totalVersions: 1,
          storageType: 'remote'
        }
      };

      await expect(remoteStorage.importData(importData)).rejects.toThrow('Failed to import data');
    });

    it('should handle makeRequest with body parameter', async () => {
      const testData = { test: 'data' };
      
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ success: true })
      }));

      await remoteStorage.updateMetadata('test-version-1', testData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/versions/test-version-1/metadata',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(testData)
        })
      );
    });

    it('should handle makeRequest without body parameter', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ versions: [] })
      }));

      await remoteStorage.list();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/versions',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should handle makeRequest with API key', async () => {
      const storageWithKey = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-api-key',
          timeout: 5000,
          retries: 1
        }
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithKey.initialize();

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ success: true })
      }));

      await storageWithKey.store(mockVersionInfo);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/versions',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should handle makeRequest without API key', async () => {
      const storageWithoutKey = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          timeout: 5000,
          retries: 1
        }
      });

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithoutKey.initialize();

      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ success: true })
      }));

      await storageWithoutKey.store(mockVersionInfo);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/versions',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });

    it('should handle retry logic with exponential backoff', async () => {
      const storageWithRetries = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 1000,
          retries: 3
        }
      });

      // Mock initialization
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithRetries.initialize();

      // Clear the mock to start fresh for the store operation
      mockFetch.mockClear();

      // Mock fetch to fail twice then succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse({
          json: () => Promise.resolve({ success: true })
        }));

      await expect(storageWithRetries.store(mockVersionInfo)).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 calls for retries
    });

    it('should handle retry exhaustion with lastError', async () => {
      const storageWithRetries = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 1000,
          retries: 2
        }
      });

      // Mock initialization
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithRetries.initialize();

      // Mock fetch to always fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(storageWithRetries.store(mockVersionInfo)).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 for init + 3 for retries (2 retries + 1 initial)
    });

    it('should handle retry exhaustion with null lastError', async () => {
      const storageWithRetries = new RemoteStorage({
        type: 'remote',
        path: 'https://api.example.com/versions',
        options: {
          apiKey: 'test-key',
          timeout: 1000,
          retries: 1
        }
      });

      // Mock initialization
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: () => Promise.resolve({ status: 'ok' })
      }));
      await storageWithRetries.initialize();

      // Mock fetch to reject with non-Error value
      mockFetch.mockRejectedValue('String error');

      await expect(storageWithRetries.store(mockVersionInfo)).rejects.toThrow('String error');
    });
  });
});

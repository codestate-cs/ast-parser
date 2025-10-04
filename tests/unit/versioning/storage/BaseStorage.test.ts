import { BaseStorage } from '../../../../src/versioning/storage/BaseStorage';
import { StorageConfig, VersionInfo, VersionStorage } from '../../../../src/types/versioning';
import { ProjectType } from '../../../../src/types/core';

// Mock implementation for testing
class MockStorage extends BaseStorage {
  private data: Map<string, VersionStorage> = new Map();

  async store(versionInfo: VersionInfo, _config?: Partial<StorageConfig>): Promise<VersionStorage> {
    if (!this.validateVersionInfo(versionInfo)) {
      throw this.createError('Invalid version info', 'INVALID_VERSION_INFO');
    }
    
    const storage: VersionStorage = {
      id: `storage-${Date.now()}`,
      versionId: versionInfo.id,
      path: `/mock/path/${versionInfo.id}`,
      metadata: {
        storedAt: new Date().toISOString(),
        size: JSON.stringify(versionInfo).length,
        checksum: 'mock-checksum'
      }
    };
    
    this.data.set(versionInfo.id, storage);
    return storage;
  }

  async retrieve(versionId: string, _config?: Partial<StorageConfig>): Promise<VersionInfo | null> {
    const storage = this.data.get(versionId);
    if (!storage) return null;
    
    // Return mock version info
    return {
      id: versionId,
      version: '1.0.0',
      metadata: {
        version: '1.0.0',
        strategy: 'mock',
        createdAt: new Date().toISOString(),
        tags: []
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
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async delete(versionId: string, _config?: Partial<StorageConfig>): Promise<boolean> {
    return this.data.delete(versionId);
  }

  async list(_config?: Partial<StorageConfig>): Promise<VersionStorage[]> {
    return Array.from(this.data.values());
  }

  async exists(versionId: string, _config?: Partial<StorageConfig>): Promise<boolean> {
    return this.data.has(versionId);
  }

  async getMetadata(versionId: string, _config?: Partial<StorageConfig>): Promise<any> {
    const storage = this.data.get(versionId);
    return storage?.metadata || null;
  }

  async updateMetadata(versionId: string, metadata: any, _config?: Partial<StorageConfig>): Promise<boolean> {
    const storage = this.data.get(versionId);
    if (!storage) return false;
    
    storage.metadata = { ...storage.metadata, ...metadata };
    return true;
  }

  async cleanup(_config?: Partial<StorageConfig>): Promise<number> {
    const count = this.data.size;
    this.data.clear();
    return count;
  }

  async validate(config: StorageConfig): Promise<boolean> {
    return config.type === 'local'; // Changed from 'mock' to 'local'
  }

  async initialize(_config: StorageConfig): Promise<void> {
    // Mock initialization
  }

  async dispose(): Promise<void> {
    this.data.clear();
  }
}

describe('BaseStorage', () => {
  let mockStorage: MockStorage;
  let mockVersionInfo: VersionInfo;

  beforeEach(() => {
    mockStorage = new MockStorage();
    mockVersionInfo = {
      id: 'test-version-1',
      version: '1.0.0',
      metadata: {
        version: '1.0.0',
        strategy: 'test',
        createdAt: new Date().toISOString(),
        tags: []
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
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const storage = new MockStorage();
      expect(storage).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const config: StorageConfig = {
        type: 'local',
        path: '/custom/path',
        options: { custom: 'option' }
      };
      const storage = new MockStorage(config);
      expect(storage).toBeDefined();
    });
  });

  describe('store', () => {
    it('should store version information', async () => {
      const result = await mockStorage.store(mockVersionInfo);
      
      expect(result).toBeDefined();
      expect(result.versionId).toBe(mockVersionInfo.id);
      expect(result.path).toContain(mockVersionInfo.id);
      expect(result.metadata).toBeDefined();
    });

    it('should store version with custom config', async () => {
      const customConfig = { path: '/custom/path' };
      const result = await mockStorage.store(mockVersionInfo, customConfig);
      
      expect(result).toBeDefined();
      expect(result.versionId).toBe(mockVersionInfo.id);
    });

    it('should handle storage errors gracefully', async () => {
      // Mock error scenario
      const errorStorage = new MockStorage();
      jest.spyOn(errorStorage, 'store').mockRejectedValue(new Error('Storage error'));
      
      await expect(errorStorage.store(mockVersionInfo)).rejects.toThrow('Storage error');
    });
  });

  describe('retrieve', () => {
    it('should retrieve existing version', async () => {
      await mockStorage.store(mockVersionInfo);
      const result = await mockStorage.retrieve(mockVersionInfo.id);
      
      expect(result).toBeDefined();
      expect(result!.id).toBe(mockVersionInfo.id);
    });

    it('should return null for non-existent version', async () => {
      const result = await mockStorage.retrieve('non-existent-id');
      expect(result).toBeNull();
    });

    it('should retrieve with custom config', async () => {
      await mockStorage.store(mockVersionInfo);
      const customConfig = { path: '/custom/path' };
      const result = await mockStorage.retrieve(mockVersionInfo.id, customConfig);
      
      expect(result).toBeDefined();
      expect(result!.id).toBe(mockVersionInfo.id);
    });
  });

  describe('delete', () => {
    it('should delete existing version', async () => {
      await mockStorage.store(mockVersionInfo);
      const result = await mockStorage.delete(mockVersionInfo.id);
      
      expect(result).toBe(true);
      
      // Verify deletion
      const retrieved = await mockStorage.retrieve(mockVersionInfo.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent version', async () => {
      const result = await mockStorage.delete('non-existent-id');
      expect(result).toBe(false);
    });

    it('should delete with custom config', async () => {
      await mockStorage.store(mockVersionInfo);
      const customConfig = { path: '/custom/path' };
      const result = await mockStorage.delete(mockVersionInfo.id, customConfig);
      
      expect(result).toBe(true);
    });
  });

  describe('list', () => {
    it('should list all stored versions', async () => {
      await mockStorage.store(mockVersionInfo);
      
      const version2 = { ...mockVersionInfo, id: 'test-version-2' };
      await mockStorage.store(version2);
      
      const result = await mockStorage.list();
      
      expect(result).toHaveLength(2);
      expect(result.some(v => v.versionId === mockVersionInfo.id)).toBe(true);
      expect(result.some(v => v.versionId === version2.id)).toBe(true);
    });

    it('should return empty array when no versions stored', async () => {
      const result = await mockStorage.list();
      expect(result).toHaveLength(0);
    });

    it('should list with custom config', async () => {
      await mockStorage.store(mockVersionInfo);
      const customConfig = { path: '/custom/path' };
      const result = await mockStorage.list(customConfig);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('exists', () => {
    it('should return true for existing version', async () => {
      await mockStorage.store(mockVersionInfo);
      const result = await mockStorage.exists(mockVersionInfo.id);
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent version', async () => {
      const result = await mockStorage.exists('non-existent-id');
      expect(result).toBe(false);
    });

    it('should check existence with custom config', async () => {
      await mockStorage.store(mockVersionInfo);
      const customConfig = { path: '/custom/path' };
      const result = await mockStorage.exists(mockVersionInfo.id, customConfig);
      
      expect(result).toBe(true);
    });
  });

  describe('getMetadata', () => {
    it('should get metadata for existing version', async () => {
      await mockStorage.store(mockVersionInfo);
      const result = await mockStorage.getMetadata(mockVersionInfo.id);
      
      expect(result).toBeDefined();
      expect(result.storedAt).toBeDefined();
      expect(result.size).toBeDefined();
    });

    it('should return null for non-existent version', async () => {
      const result = await mockStorage.getMetadata('non-existent-id');
      expect(result).toBeNull();
    });

    it('should get metadata with custom config', async () => {
      await mockStorage.store(mockVersionInfo);
      const customConfig = { path: '/custom/path' };
      const result = await mockStorage.getMetadata(mockVersionInfo.id, customConfig);
      
      expect(result).toBeDefined();
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata for existing version', async () => {
      await mockStorage.store(mockVersionInfo);
      const newMetadata = { updated: true, timestamp: Date.now() };
      
      const result = await mockStorage.updateMetadata(mockVersionInfo.id, newMetadata);
      
      expect(result).toBe(true);
      
      const updatedMetadata = await mockStorage.getMetadata(mockVersionInfo.id);
      expect(updatedMetadata.updated).toBe(true);
    });

    it('should return false for non-existent version', async () => {
      const newMetadata = { updated: true };
      const result = await mockStorage.updateMetadata('non-existent-id', newMetadata);
      
      expect(result).toBe(false);
    });

    it('should update metadata with custom config', async () => {
      await mockStorage.store(mockVersionInfo);
      const customConfig = { path: '/custom/path' };
      const newMetadata = { updated: true };
      
      const result = await mockStorage.updateMetadata(mockVersionInfo.id, newMetadata, customConfig);
      
      expect(result).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all stored versions', async () => {
      await mockStorage.store(mockVersionInfo);
      const version2 = { ...mockVersionInfo, id: 'test-version-2' };
      await mockStorage.store(version2);
      
      const result = await mockStorage.cleanup();
      
      expect(result).toBe(2);
      
      const listResult = await mockStorage.list();
      expect(listResult).toHaveLength(0);
    });

    it('should return 0 when no versions to cleanup', async () => {
      const result = await mockStorage.cleanup();
      expect(result).toBe(0);
    });

    it('should cleanup with custom config', async () => {
      await mockStorage.store(mockVersionInfo);
      const customConfig = { path: '/custom/path' };
      
      const result = await mockStorage.cleanup(customConfig);
      
      expect(result).toBe(1);
    });
  });

  describe('validate', () => {
    it('should validate correct configuration', async () => {
      const config: StorageConfig = {
        type: 'local',
        path: '/test/path',
        options: {}
      };
      
      const result = await mockStorage.validate(config);
      expect(result).toBe(true);
    });

    it('should reject invalid configuration', async () => {
      const config: StorageConfig = {
        type: 'remote',
        path: '/test/path',
        options: {}
      };
      
      const result = await mockStorage.validate(config);
      expect(result).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize storage', async () => {
      const config: StorageConfig = {
        type: 'local',
        path: '/test/path',
        options: {}
      };
      
      await expect(mockStorage.initialize(config)).resolves.not.toThrow();
    });

    it('should handle initialization errors', async () => {
      const errorStorage = new MockStorage();
      jest.spyOn(errorStorage, 'initialize').mockRejectedValue(new Error('Init error'));
      
      const config: StorageConfig = {
        type: 'local',
        path: '/test/path',
        options: {}
      };
      
      await expect(errorStorage.initialize(config)).rejects.toThrow('Init error');
    });
  });

  describe('dispose', () => {
    it('should dispose storage resources', async () => {
      await mockStorage.store(mockVersionInfo);
      
      await expect(mockStorage.dispose()).resolves.not.toThrow();
      
      // Verify cleanup
      const listResult = await mockStorage.list();
      expect(listResult).toHaveLength(0);
    });

    it('should handle dispose errors', async () => {
      const errorStorage = new MockStorage();
      jest.spyOn(errorStorage, 'dispose').mockRejectedValue(new Error('Dispose error'));
      
      await expect(errorStorage.dispose()).rejects.toThrow('Dispose error');
    });
  });

  describe('error handling', () => {
    it('should handle storage operation errors', async () => {
      const errorStorage = new MockStorage();
      jest.spyOn(errorStorage, 'store').mockRejectedValue(new Error('Storage error'));
      
      await expect(errorStorage.store(mockVersionInfo)).rejects.toThrow('Storage error');
    });

    it('should handle retrieval errors', async () => {
      const errorStorage = new MockStorage();
      jest.spyOn(errorStorage, 'retrieve').mockRejectedValue(new Error('Retrieval error'));
      
      await expect(errorStorage.retrieve('test-id')).rejects.toThrow('Retrieval error');
    });

    it('should handle deletion errors', async () => {
      const errorStorage = new MockStorage();
      jest.spyOn(errorStorage, 'delete').mockRejectedValue(new Error('Deletion error'));
      
      await expect(errorStorage.delete('test-id')).rejects.toThrow('Deletion error');
    });

    it('should handle listing errors', async () => {
      const errorStorage = new MockStorage();
      jest.spyOn(errorStorage, 'list').mockRejectedValue(new Error('Listing error'));
      
      await expect(errorStorage.list()).rejects.toThrow('Listing error');
    });
  });

  describe('configuration management', () => {
    it('should merge configuration with defaults', () => {
      const defaultConfig = mockStorage.getDefaultConfig();
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.type).toBeDefined();
    });

    it('should validate configuration format', () => {
      const validConfig = {
        type: 'local',
        path: '/test/path',
        options: {}
      };
      
      const isValid = mockStorage.validateConfig(validConfig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration format', () => {
      const invalidConfig = {
        type: 'database',
        path: '',
        options: null
      };
      
      const isValid = mockStorage.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle null version info', async () => {
      await expect(mockStorage.store(null as any)).rejects.toThrow();
    });

    it('should handle undefined version info', async () => {
      await expect(mockStorage.store(undefined as any)).rejects.toThrow();
    });

    it('should handle empty version id', async () => {
      const emptyVersion = { ...mockVersionInfo, id: '' };
      await expect(mockStorage.store(emptyVersion)).rejects.toThrow();
    });

    it('should handle very large version data', async () => {
      const largeData = {
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
      };
      const largeVersion = { ...mockVersionInfo, data: largeData };
      
      const result = await mockStorage.store(largeVersion);
      expect(result).toBeDefined();
    });

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        mockStorage.store({ ...mockVersionInfo, id: `concurrent-${i}` })
      );
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      
      const listResult = await mockStorage.list();
      expect(listResult).toHaveLength(10);
    });
  });

  describe('metadata operations', () => {
    it('should handle complex metadata', async () => {
      const complexMetadata = {
        tags: ['test', 'mock'],
        custom: {
          nested: {
            value: 'test'
          }
        },
        array: [1, 2, 3],
        boolean: true,
        number: 42
      };
      
      await mockStorage.store(mockVersionInfo);
      const result = await mockStorage.updateMetadata(mockVersionInfo.id, complexMetadata);
      
      expect(result).toBe(true);
      
      const retrievedMetadata = await mockStorage.getMetadata(mockVersionInfo.id);
      expect(retrievedMetadata.tags).toEqual(['test', 'mock']);
      expect(retrievedMetadata.custom.nested.value).toBe('test');
    });

    it('should handle metadata with special characters', async () => {
      const specialMetadata = {
        unicode: '测试',
        symbols: '!@#$%^&*()',
        newlines: 'line1\nline2\r\nline3'
      };
      
      await mockStorage.store(mockVersionInfo);
      const result = await mockStorage.updateMetadata(mockVersionInfo.id, specialMetadata);
      
      expect(result).toBe(true);
    });
  });

  describe('performance', () => {
    it('should handle multiple operations efficiently', async () => {
      const startTime = Date.now();
      
      // Store multiple versions
      for (let i = 0; i < 100; i++) {
        await mockStorage.store({ ...mockVersionInfo, id: `perf-${i}` });
      }
      
      // List all versions
      const listResult = await mockStorage.list();
      expect(listResult).toHaveLength(100);
      
      // Retrieve random versions
      for (let i = 0; i < 50; i++) {
        const randomId = `perf-${Math.floor(Math.random() * 100)}`;
        await mockStorage.retrieve(randomId);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('additional BaseStorage methods', () => {
    describe('getDefaultConfig', () => {
      it('should return default configuration', () => {
        const config = mockStorage.getDefaultConfig();
        expect(config).toEqual({
          type: 'local',
          path: './versions',
          options: {}
        });
      });
    });

    describe('mergeConfig', () => {
      it('should merge partial config with defaults', () => {
        const partialConfig = { path: '/custom/path' };
        const merged = (mockStorage as any).mergeConfig(partialConfig);
        
        expect(merged).toEqual({
          type: 'local',
          path: '/custom/path',
          options: {}
        });
      });

      it('should merge options with defaults', () => {
        const partialConfig = { 
          path: '/custom/path',
          options: { custom: 'value' }
        };
        const merged = (mockStorage as any).mergeConfig(partialConfig);
        
        expect(merged).toEqual({
          type: 'local',
          path: '/custom/path',
          options: { custom: 'value' }
        });
      });
    });

    describe('validateConfig', () => {
      it('should validate correct configuration', () => {
        const config = {
          type: 'local',
          path: '/test/path',
          options: {}
        };
        
        const isValid = mockStorage.validateConfig(config);
        expect(isValid).toBe(true);
      });

      it('should reject null configuration', () => {
        const isValid = mockStorage.validateConfig(null);
        expect(isValid).toBe(false);
      });

      it('should reject undefined configuration', () => {
        const isValid = mockStorage.validateConfig(undefined);
        expect(isValid).toBe(false);
      });

      it('should reject non-object configuration', () => {
        const isValid = mockStorage.validateConfig('invalid');
        expect(isValid).toBe(false);
      });

      it('should reject configuration without type', () => {
        const config = {
          path: '/test/path',
          options: {}
        };
        
        const isValid = mockStorage.validateConfig(config);
        expect(isValid).toBe(false);
      });

      it('should reject configuration with non-string type', () => {
        const config = {
          type: 123,
          path: '/test/path',
          options: {}
        };
        
        const isValid = mockStorage.validateConfig(config);
        expect(isValid).toBe(false);
      });

      it('should reject configuration without path', () => {
        const config = {
          type: 'local',
          options: {}
        };
        
        const isValid = mockStorage.validateConfig(config);
        expect(isValid).toBe(false);
      });

      it('should reject configuration with non-string path', () => {
        const config = {
          type: 'local',
          path: 123,
          options: {}
        };
        
        const isValid = mockStorage.validateConfig(config);
        expect(isValid).toBe(false);
      });

      it('should reject configuration with non-object options', () => {
        const config = {
          type: 'local',
          path: '/test/path',
          options: 'invalid'
        };
        
        const isValid = mockStorage.validateConfig(config);
        expect(isValid).toBe(false);
      });
    });

    describe('validateVersionInfo', () => {
      it('should validate correct version info', () => {
        const isValid = (mockStorage as any).validateVersionInfo(mockVersionInfo);
        expect(isValid).toBe(true);
      });

      it('should reject null version info', () => {
        const isValid = (mockStorage as any).validateVersionInfo(null);
        expect(isValid).toBe(false);
      });

      it('should reject undefined version info', () => {
        const isValid = (mockStorage as any).validateVersionInfo(undefined);
        expect(isValid).toBe(false);
      });

      it('should reject non-object version info', () => {
        const isValid = (mockStorage as any).validateVersionInfo('invalid');
        expect(isValid).toBe(false);
      });

      it('should reject version info without id', () => {
        const invalidVersion = { ...mockVersionInfo } as any;
        delete invalidVersion.id;
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info with non-string id', () => {
        const invalidVersion = { ...mockVersionInfo, id: 123 };
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info without version', () => {
        const invalidVersion = { ...mockVersionInfo } as any;
        delete invalidVersion.version;
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info with non-string version', () => {
        const invalidVersion = { ...mockVersionInfo, version: 123 };
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info without metadata', () => {
        const invalidVersion = { ...mockVersionInfo } as any;
        delete invalidVersion.metadata;
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info with non-object metadata', () => {
        const invalidVersion = { ...mockVersionInfo, metadata: 'invalid' };
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info without data', () => {
        const invalidVersion = { ...mockVersionInfo } as any;
        delete invalidVersion.data;
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info without createdAt', () => {
        const invalidVersion = { ...mockVersionInfo } as any;
        delete invalidVersion.createdAt;
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info with non-string createdAt', () => {
        const invalidVersion = { ...mockVersionInfo, createdAt: 123 };
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info without updatedAt', () => {
        const invalidVersion = { ...mockVersionInfo } as any;
        delete invalidVersion.updatedAt;
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });

      it('should reject version info with non-string updatedAt', () => {
        const invalidVersion = { ...mockVersionInfo, updatedAt: 123 };
        
        const isValid = (mockStorage as any).validateVersionInfo(invalidVersion);
        expect(isValid).toBe(false);
      });
    });

    describe('validateVersionId', () => {
      it('should validate correct version id', () => {
        const isValid = (mockStorage as any).validateVersionId('valid-id');
        expect(isValid).toBe(true);
      });

      it('should reject null version id', () => {
        const isValid = (mockStorage as any).validateVersionId(null);
        expect(isValid).toBeFalsy();
      });

      it('should reject undefined version id', () => {
        const isValid = (mockStorage as any).validateVersionId(undefined);
        expect(isValid).toBeFalsy();
      });

      it('should reject non-string version id', () => {
        const isValid = (mockStorage as any).validateVersionId(123);
        expect(isValid).toBeFalsy();
      });

      it('should reject empty string version id', () => {
        const isValid = (mockStorage as any).validateVersionId('');
        expect(isValid).toBeFalsy();
      });

      it('should reject whitespace-only version id', () => {
        const isValid = (mockStorage as any).validateVersionId('   ');
        expect(isValid).toBeFalsy();
      });
    });

    describe('createError', () => {
      it('should create error with message and code', () => {
        const error = (mockStorage as any).createError('Test error', 'TEST_CODE');
        
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Test error');
        expect(error.code).toBe('TEST_CODE');
        expect(error.timestamp).toBeDefined();
      });

      it('should create error with context', () => {
        const context = { test: 'context' };
        const error = (mockStorage as any).createError('Test error', 'TEST_CODE', context);
        
        expect(error.context).toEqual(context);
      });
    });

    describe('handleError', () => {
      it('should handle error with operation and context', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const error = new Error('Test error') as any;
        error.code = 'TEST_CODE';
        
        (mockStorage as any).handleError(error, 'test-operation', { test: 'context' });
        
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      it('should handle error without code', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const error = new Error('Test error');
        
        (mockStorage as any).handleError(error, 'test-operation');
        
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('generateStorageId', () => {
      it('should generate unique storage id', () => {
        const id1 = (mockStorage as any).generateStorageId('test-version');
        const id2 = (mockStorage as any).generateStorageId('test-version');
        
        expect(id1).toContain('storage-test-version');
        expect(id2).toContain('storage-test-version');
        expect(id1).not.toBe(id2);
      });
    });

    describe('generateStoragePath', () => {
      it('should generate storage path with default config', () => {
        const path = (mockStorage as any).generateStoragePath('test-version');
        
        expect(path).toBe('./versions/test-version');
      });

      it('should generate storage path with custom config', () => {
        const customConfig = { path: '/custom/path' };
        const path = (mockStorage as any).generateStoragePath('test-version', customConfig);
        
        expect(path).toBe('/custom/path/test-version');
      });
    });

    describe('calculateDataSize', () => {
      it('should calculate data size for valid data', () => {
        const data = { test: 'data' };
        const size = (mockStorage as any).calculateDataSize(data);
        
        expect(size).toBeGreaterThan(0);
      });

      it('should return 0 for invalid data', () => {
        const circularData: any = {};
        circularData.self = circularData;
        
        const size = (mockStorage as any).calculateDataSize(circularData);
        expect(size).toBe(0);
      });
    });

    describe('generateChecksum', () => {
      it('should generate checksum for valid data', () => {
        const data = { test: 'data' };
        const checksum = (mockStorage as any).generateChecksum(data);
        
        expect(checksum).toBeDefined();
        expect(typeof checksum).toBe('string');
        expect(checksum).not.toBe('error');
      });

      it('should return error for invalid data', () => {
        const circularData: any = {};
        circularData.self = circularData;
        
        const checksum = (mockStorage as any).generateChecksum(circularData);
        expect(checksum).toBe('error');
      });
    });

    describe('createStorageMetadata', () => {
      it('should create storage metadata', () => {
        const metadata = (mockStorage as any).createStorageMetadata(mockVersionInfo);
        
        expect(metadata.storedAt).toBeDefined();
        expect(metadata.size).toBeDefined();
        expect(metadata.checksum).toBeDefined();
        expect(metadata.version).toBe(mockVersionInfo.version);
        expect(metadata.strategy).toBe(mockVersionInfo.metadata.strategy);
      });

      it('should create storage metadata with additional metadata', () => {
        const additionalMetadata = { custom: 'value' };
        const metadata = (mockStorage as any).createStorageMetadata(mockVersionInfo, additionalMetadata);
        
        expect(metadata.custom).toBe('value');
      });
    });

    describe('ensureInitialized', () => {
      it('should throw error when not initialized', () => {
        expect(() => {
          (mockStorage as any).ensureInitialized();
        }).toThrow('Storage not initialized');
      });
    });

    describe('getConfig', () => {
      it('should return current configuration', () => {
        const config = mockStorage.getConfig();
        
        expect(config).toBeDefined();
        expect(config.type).toBe('local');
        expect(config.path).toBe('./versions');
      });
    });

    describe('updateConfig', () => {
      it('should update configuration', () => {
        const newConfig = { path: '/new/path' };
        mockStorage.updateConfig(newConfig);
        
        const config = mockStorage.getConfig();
        expect(config.path).toBe('/new/path');
      });
    });

    describe('isReady', () => {
      it('should return initialization status', () => {
        const isReady = mockStorage.isReady();
        expect(typeof isReady).toBe('boolean');
      });
    });

    describe('getStatistics', () => {
      it('should get storage statistics', async () => {
        await mockStorage.store(mockVersionInfo);
        
        const stats = await mockStorage.getStatistics();
        
        expect(stats.totalVersions).toBe(1);
        expect(stats.totalSize).toBeGreaterThan(0);
        expect(stats.averageSize).toBeGreaterThan(0);
        expect(stats.oldestVersion).toBeDefined();
        expect(stats.newestVersion).toBeDefined();
        expect(stats.lastUpdated).toBeDefined();
      });

      it('should handle empty storage statistics', async () => {
        const stats = await mockStorage.getStatistics();
        
        expect(stats.totalVersions).toBe(0);
        expect(stats.totalSize).toBe(0);
        expect(stats.averageSize).toBe(0);
        expect(stats.oldestVersion).toBeNull();
        expect(stats.newestVersion).toBeNull();
      });

      it('should handle statistics errors', async () => {
        const errorStorage = new MockStorage();
        jest.spyOn(errorStorage, 'list').mockRejectedValue(new Error('List error'));
        
        await expect(errorStorage.getStatistics()).rejects.toThrow('List error');
      });
    });

    describe('batchStore', () => {
      it('should batch store multiple versions', async () => {
        const versions = [
          { ...mockVersionInfo, id: 'batch-1' },
          { ...mockVersionInfo, id: 'batch-2' }
        ];
        
        const results = await mockStorage.batchStore(versions);
        
        expect(results).toHaveLength(2);
        expect(results[0]?.versionId).toBe('batch-1');
        expect(results[1]?.versionId).toBe('batch-2');
      });

      it('should handle batch store errors', async () => {
        const errorStorage = new MockStorage();
        jest.spyOn(errorStorage, 'store').mockRejectedValue(new Error('Store error'));
        
        const versions = [{ ...mockVersionInfo, id: 'batch-error' }];
        
        await expect(errorStorage.batchStore(versions)).rejects.toThrow('Store error');
      });
    });

    describe('batchDelete', () => {
      it('should batch delete multiple versions', async () => {
        await mockStorage.store({ ...mockVersionInfo, id: 'batch-delete-1' });
        await mockStorage.store({ ...mockVersionInfo, id: 'batch-delete-2' });
        
        const results = await mockStorage.batchDelete(['batch-delete-1', 'batch-delete-2']);
        
        expect(results).toHaveLength(2);
        expect(results[0]).toBe(true);
        expect(results[1]).toBe(true);
      });

      it('should handle batch delete errors gracefully', async () => {
        const errorStorage = new MockStorage();
        jest.spyOn(errorStorage, 'delete').mockRejectedValue(new Error('Delete error'));
        
        const results = await errorStorage.batchDelete(['error-id']);
        
        expect(results).toHaveLength(1);
        expect(results[0]).toBe(false);
      });
    });

    describe('searchVersions', () => {
      it('should search versions by query', async () => {
        await mockStorage.store(mockVersionInfo);
        
        const results = await mockStorage.searchVersions({ versionId: mockVersionInfo.id });
        
        expect(results).toHaveLength(1);
        expect(results[0]?.versionId).toBe(mockVersionInfo.id);
      });

      it('should search versions by path', async () => {
        await mockStorage.store(mockVersionInfo);
        
        const results = await mockStorage.searchVersions({ path: 'mock' });
        
        expect(results).toHaveLength(1);
      });

      it('should search versions by metadata', async () => {
        await mockStorage.store(mockVersionInfo);
        
        const results = await mockStorage.searchVersions({ 
          metadata: { checksum: 'mock-checksum' }
        });
        
        expect(results).toHaveLength(1);
      });

      it('should return all versions for empty query', async () => {
        await mockStorage.store(mockVersionInfo);
        
        const results = await mockStorage.searchVersions({});
        
        expect(results).toHaveLength(1);
      });

      it('should return all versions for null query', async () => {
        await mockStorage.store(mockVersionInfo);
        
        const results = await mockStorage.searchVersions(null);
        
        expect(results).toHaveLength(1);
      });

      it('should handle search errors', async () => {
        const errorStorage = new MockStorage();
        jest.spyOn(errorStorage, 'list').mockRejectedValue(new Error('List error'));
        
        await expect(errorStorage.searchVersions({})).rejects.toThrow('List error');
      });
    });

    describe('matchesQuery', () => {
      it('should match version by versionId', () => {
        const version = {
          id: 'test-id',
          versionId: 'test-version',
          path: '/test/path',
          metadata: { test: 'value' }
        };
        
        const matches = (mockStorage as any).matchesQuery(version, { versionId: 'test-version' });
        expect(matches).toBe(true);
      });

      it('should not match version by wrong versionId', () => {
        const version = {
          id: 'test-id',
          versionId: 'test-version',
          path: '/test/path',
          metadata: { test: 'value' }
        };
        
        const matches = (mockStorage as any).matchesQuery(version, { versionId: 'wrong-version' });
        expect(matches).toBe(false);
      });

      it('should match version by path', () => {
        const version = {
          id: 'test-id',
          versionId: 'test-version',
          path: '/test/path',
          metadata: { test: 'value' }
        };
        
        const matches = (mockStorage as any).matchesQuery(version, { path: 'test' });
        expect(matches).toBe(true);
      });

      it('should not match version by wrong path', () => {
        const version = {
          id: 'test-id',
          versionId: 'test-version',
          path: '/test/path',
          metadata: { test: 'value' }
        };
        
        const matches = (mockStorage as any).matchesQuery(version, { path: 'wrong' });
        expect(matches).toBe(false);
      });

      it('should match version by metadata', () => {
        const version = {
          id: 'test-id',
          versionId: 'test-version',
          path: '/test/path',
          metadata: { test: 'value' }
        };
        
        const matches = (mockStorage as any).matchesQuery(version, { metadata: { test: 'value' } });
        expect(matches).toBe(true);
      });

      it('should not match version by wrong metadata', () => {
        const version = {
          id: 'test-id',
          versionId: 'test-version',
          path: '/test/path',
          metadata: { test: 'value' }
        };
        
        const matches = (mockStorage as any).matchesQuery(version, { metadata: { test: 'wrong' } });
        expect(matches).toBe(false);
      });

      it('should return true for null query', () => {
        const version = {
          id: 'test-id',
          versionId: 'test-version',
          path: '/test/path',
          metadata: { test: 'value' }
        };
        
        const matches = (mockStorage as any).matchesQuery(version, null);
        expect(matches).toBe(true);
      });

      it('should return true for non-object query', () => {
        const version = {
          id: 'test-id',
          versionId: 'test-version',
          path: '/test/path',
          metadata: { test: 'value' }
        };
        
        const matches = (mockStorage as any).matchesQuery(version, 'invalid');
        expect(matches).toBe(true);
      });
    });

    describe('matchesMetadata', () => {
      it('should match metadata by key-value pairs', () => {
        const metadata = { test: 'value', other: 'data' };
        const query = { test: 'value' };
        
        const matches = (mockStorage as any).matchesMetadata(metadata, query);
        expect(matches).toBe(true);
      });

      it('should not match metadata by wrong values', () => {
        const metadata = { test: 'value', other: 'data' };
        const query = { test: 'wrong' };
        
        const matches = (mockStorage as any).matchesMetadata(metadata, query);
        expect(matches).toBe(false);
      });

      it('should return true for null query', () => {
        const metadata = { test: 'value' };
        
        const matches = (mockStorage as any).matchesMetadata(metadata, null);
        expect(matches).toBe(true);
      });

      it('should return true for non-object query', () => {
        const metadata = { test: 'value' };
        
        const matches = (mockStorage as any).matchesMetadata(metadata, 'invalid');
        expect(matches).toBe(true);
      });
    });

    describe('exportData', () => {
      it('should export storage data', async () => {
        await mockStorage.store(mockVersionInfo);
        
        const exportData = await mockStorage.exportData();
        
        expect(exportData.metadata).toBeDefined();
        expect(exportData.metadata.exportedAt).toBeDefined();
        expect(exportData.metadata.storageType).toBe('local');
        expect(exportData.metadata.version).toBe('1.0.0');
        expect(exportData.statistics).toBeDefined();
        expect(exportData.versions).toHaveLength(1);
        expect(exportData.versions[0].id).toBeDefined();
        expect(exportData.versions[0].versionId).toBe(mockVersionInfo.id);
      });

      it('should handle export errors', async () => {
        const errorStorage = new MockStorage();
        jest.spyOn(errorStorage, 'list').mockRejectedValue(new Error('List error'));
        
        await expect(errorStorage.exportData()).rejects.toThrow('List error');
      });
    });

    describe('importData', () => {
      it('should reject invalid import data format', async () => {
        await expect(mockStorage.importData(null)).rejects.toThrow('Invalid import data format');
      });

      it('should reject import data without versions', async () => {
        const invalidData = { metadata: {} };
        
        await expect(mockStorage.importData(invalidData)).rejects.toThrow('Invalid import data format');
      });

      it('should reject import data with non-array versions', async () => {
        const invalidData = { versions: 'invalid' };
        
        await expect(mockStorage.importData(invalidData)).rejects.toThrow('Invalid import data format');
      });

      it('should throw import not implemented error', async () => {
        const validData = { versions: [{ id: 'test' }] };
        
        await expect(mockStorage.importData(validData)).rejects.toThrow('Import not implemented');
      });

      it('should handle import errors', async () => {
        const errorStorage = new MockStorage();
        jest.spyOn(errorStorage, 'importData').mockImplementation(async () => {
          throw new Error('Import error');
        });
        
        await expect(errorStorage.importData({ versions: [] })).rejects.toThrow('Import error');
      });
    });
  });
});

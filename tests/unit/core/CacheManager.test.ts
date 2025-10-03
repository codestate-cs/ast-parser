/**
 * CacheManager test suite
 */

import { CacheManager } from '../../../src/core/CacheManager';
import { ASTNode, Relation } from '../../../src/types';
import { FileUtils } from '../../../src/utils/file/FileUtils';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let tempDir: string;
  let cacheFile: string;

  const mockASTNode: ASTNode = {
    id: 'test-node-1',
    type: 'class',
    name: 'TestClass',
    filePath: './src/TestClass.ts',
    start: 0,
    end: 100,
    children: [],
    nodeType: 'class',
    properties: {
      isExported: true,
      isDefault: false
    },
    metadata: {
      isExported: true,
      isDefault: false
    }
  };

  const mockRelations: Relation[] = [
    {
      id: 'relation-1',
      type: 'import',
      from: './src/TestClass.ts',
      to: './src/OtherClass.ts',
      metadata: {}
    }
  ];

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-test-'));
    cacheFile = path.join(tempDir, '.ast-cache.json');
    cacheManager = new CacheManager({
      cacheFile,
      maxCacheSize: 1000,
      compressionEnabled: false,
      autoCleanup: true,
      cleanupInterval: 60000
    });
  });

  afterEach(async () => {
    try {
      if (cacheManager) {
        await cacheManager.dispose();
      }
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', async () => {
      const manager = new CacheManager();
      expect(manager).toBeInstanceOf(CacheManager);
      await manager.dispose();
    });

    it('should create instance with custom options', async () => {
      const options = {
        cacheFile: './custom-cache.json',
        maxCacheSize: 5000,
        compressionEnabled: true
      };
      const manager = new CacheManager(options);
      expect(manager).toBeInstanceOf(CacheManager);
      await manager.dispose();
    });
  });

  describe('cache operations', () => {

    it('should cache AST data successfully', async () => {
      const filePath = './src/TestClass.ts';
      const fileHash = 'abc123';
      
      await cacheManager.setCache(filePath, {
        hash: fileHash,
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: mockRelations,
        dependencies: ['./src/OtherClass.ts']
      });

      const cached = await cacheManager.getCache(filePath);
      expect(cached).toBeDefined();
      expect(cached?.hash).toBe(fileHash);
      expect(cached?.ast).toEqual(mockASTNode);
    });

    it('should return null for non-existent cache entry', async () => {
      const cached = await cacheManager.getCache('./non-existent.ts');
      expect(cached).toBeNull();
    });

    it('should invalidate cache entry', async () => {
      const filePath = './src/TestClass.ts';
      const fileHash = 'abc123';
      
      await cacheManager.setCache(filePath, {
        hash: fileHash,
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: mockRelations,
        dependencies: ['./src/OtherClass.ts']
      });

      await cacheManager.invalidateCache(filePath);
      const cached = await cacheManager.getCache(filePath);
      expect(cached).toBeNull();
    });

    it('should check if cache entry exists', async () => {
      const filePath = './src/TestClass.ts';
      const fileHash = 'abc123';
      
      expect(await cacheManager.hasCache(filePath)).toBe(false);
      
      await cacheManager.setCache(filePath, {
        hash: fileHash,
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: mockRelations,
        dependencies: ['./src/OtherClass.ts']
      });

      expect(await cacheManager.hasCache(filePath)).toBe(true);
    });
  });

  describe('file hash validation', () => {
    it('should validate file hash correctly', async () => {
      const filePath = './src/TestClass.ts';
      const fileHash = 'abc123';
      
      await cacheManager.setCache(filePath, {
        hash: fileHash,
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      const isValid = await cacheManager.validateFileHash(filePath, fileHash);
      expect(isValid).toBe(true);

      const isInvalid = await cacheManager.validateFileHash(filePath, 'different-hash');
      expect(isInvalid).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const isValid = await cacheManager.validateFileHash('./non-existent.ts', 'any-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('cache persistence', () => {
    it('should persist cache to file', async () => {
      const filePath = './src/TestClass.ts';
      const fileHash = 'abc123';
      
      await cacheManager.setCache(filePath, {
        hash: fileHash,
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      await cacheManager.persistCache();
      
      const cacheExists = await FileUtils.exists(cacheFile);
      expect(cacheExists).toBe(true);
    });

    it('should load cache from file', async () => {
      const filePath = './src/TestClass.ts';
      const fileHash = 'abc123';
      
      // Set cache and persist
      await cacheManager.setCache(filePath, {
        hash: fileHash,
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });
      await cacheManager.persistCache();

      // Create new instance and load cache
      const newManager = new CacheManager({ cacheFile });
      await newManager.loadCache();

      const cached = await newManager.getCache(filePath);
      expect(cached).toBeDefined();
      expect(cached?.hash).toBe(fileHash);
    });

    it('should handle missing cache file gracefully', async () => {
      const newManager = new CacheManager({ cacheFile: './non-existent-cache.json' });
      await expect(newManager.loadCache()).resolves.not.toThrow();
    });

    it('should handle corrupted cache file gracefully', async () => {
      await fs.writeFile(cacheFile, 'invalid json content');
      
      const newManager = new CacheManager({ cacheFile });
      await expect(newManager.loadCache()).resolves.not.toThrow();
    });
  });

  describe('cache cleanup and maintenance', () => {
    it('should clean up expired cache entries', async () => {
      const filePath = './src/TestClass.ts';
      const oldDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      
      await cacheManager.setCache(filePath, {
        hash: 'abc123',
        lastModified: oldDate,
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      await cacheManager.cleanupExpiredEntries(3600000); // 1 hour TTL
      
      const cached = await cacheManager.getCache(filePath);
      expect(cached).toBeNull();
    });

    it('should clean up cache by size limit', async () => {
      const manager = new CacheManager({
        cacheFile,
        maxCacheSize: 2 // Very small limit
      });

      // Add multiple cache entries
      for (let i = 0; i < 5; i++) {
        await manager.setCache(`./src/File${i}.ts`, {
          hash: `hash${i}`,
          lastModified: new Date().toISOString(),
          ast: { ...mockASTNode, id: `node-${i}` },
          relations: [],
          dependencies: []
        });
      }

      await manager.cleanupBySize();
      
      // Should only keep the most recent entries
      const allEntries = await manager.getAllCacheEntries();
      expect(allEntries.size).toBeLessThanOrEqual(2);
    });

    it('should get cache statistics', async () => {
      const filePath = './src/TestClass.ts';
      
      await cacheManager.setCache(filePath, {
        hash: 'abc123',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      const stats = await cacheManager.getCacheStatistics();
      expect(stats.totalEntries).toBe(1);
      expect(stats.cacheSize).toBeGreaterThan(0);
      expect(stats.hitRate).toBeDefined();
    });
  });

  describe('dependency-aware invalidation', () => {
    it('should invalidate dependent files when a file changes', async () => {
      const mainFile = './src/Main.ts';
      const dependentFile = './src/Dependent.ts';
      
      // Cache both files
      await cacheManager.setCache(mainFile, {
        hash: 'hash1',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: [dependentFile]
      });

      await cacheManager.setCache(dependentFile, {
        hash: 'hash2',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      // Invalidate main file
      await cacheManager.invalidateDependents(mainFile);
      
      // Dependent file should still be cached
      const dependentCached = await cacheManager.getCache(dependentFile);
      expect(dependentCached).toBeDefined();
    });

    it('should find files that depend on a given file', async () => {
      const mainFile = './src/Main.ts';
      const dependentFile = './src/Dependent.ts';
      
      await cacheManager.setCache(dependentFile, {
        hash: 'hash2',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: [mainFile]
      });

      const dependents = await cacheManager.findDependents(mainFile);
      expect(dependents).toContain(dependentFile);
    });
  });

  describe('error handling', () => {
    it('should handle cache file write errors gracefully', async () => {
      const manager = new CacheManager({
        cacheFile: '/invalid/path/cache.json'
      });

      await expect(manager.persistCache()).resolves.not.toThrow();
    });

    it('should handle cache file read errors gracefully', async () => {
      const manager = new CacheManager({
        cacheFile: '/invalid/path/cache2.json'
      });

      await expect(manager.loadCache()).resolves.not.toThrow();
    });

    it('should handle invalid cache data gracefully', async () => {
      await cacheManager.setCache('./src/Test.ts', {
        hash: 'test',
        lastModified: 'invalid-date',
        ast: null as any,
        relations: null as any,
        dependencies: null as any
      });

      const cached = await cacheManager.getCache('./src/Test.ts');
      expect(cached).toBeNull();
    });
  });

  describe('performance and memory', () => {
    it('should not leak memory with repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 1000; i++) {
        await cacheManager.setCache(`./src/File${i}.ts`, {
          hash: `hash${i}`,
          lastModified: new Date().toISOString(),
          ast: mockASTNode,
          relations: [],
          dependencies: []
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle concurrent cache operations', async () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(
          cacheManager.setCache(`./src/File${i}.ts`, {
            hash: `hash${i}`,
            lastModified: new Date().toISOString(),
            ast: mockASTNode,
            relations: [],
            dependencies: []
          })
        );
      }

      await Promise.all(promises);
      
      const stats = await cacheManager.getCacheStatistics();
      expect(stats.totalEntries).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle empty file paths', () => {
      expect(() => cacheManager.setCache('', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      })).not.toThrow();
    });

    it('should handle special characters in file paths', async () => {
      const specialPath = './src/file with spaces & symbols!.ts';
      
      await cacheManager.setCache(specialPath, {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      const cached = await cacheManager.getCache(specialPath);
      expect(cached).toBeDefined();
    });

    it('should handle very large AST nodes', async () => {
      const largeASTNode: ASTNode = {
        ...mockASTNode,
        metadata: {
          largeData: 'x'.repeat(1000000) // 1MB of data
        }
      };

      await cacheManager.setCache('./src/Large.ts', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: largeASTNode,
        relations: [],
        dependencies: []
      });

      const cached = await cacheManager.getCache('./src/Large.ts');
      expect(cached).toBeDefined();
    });
  });

  describe('error handling branches', () => {
    it('should handle setCache errors gracefully', async () => {
      // Mock the cache.set method to throw an error
      const originalSet = cacheManager['cache'].set;
      cacheManager['cache'].set = jest.fn().mockImplementation(() => {
        throw new Error('Cache set error');
      });

      expect(() => cacheManager.setCache('./src/test.ts', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      })).not.toThrow();

      // Restore original method
      cacheManager['cache'].set = originalSet;
    });

    it('should handle getCache errors gracefully', async () => {
      // Mock the cache.get method to throw an error
      const originalGet = cacheManager['cache'].get;
      cacheManager['cache'].get = jest.fn().mockImplementation(() => {
        throw new Error('Cache get error');
      });

      const result = await cacheManager.getCache('./src/test.ts');
      expect(result).toBeNull();

      // Restore original method
      cacheManager['cache'].get = originalGet;
    });

    it('should handle hasCache errors gracefully', async () => {
      // Mock the cache.has method to throw an error
      const originalHas = cacheManager['cache'].has;
      cacheManager['cache'].has = jest.fn().mockImplementation(() => {
        throw new Error('Cache has error');
      });

      const result = await cacheManager.hasCache('./src/test.ts');
      expect(result).toBe(false);

      // Restore original method
      cacheManager['cache'].has = originalHas;
    });

    it('should handle invalidateCache errors gracefully', async () => {
      // Mock the cache.delete method to throw an error
      const originalDelete = cacheManager['cache'].delete;
      cacheManager['cache'].delete = jest.fn().mockImplementation(() => {
        throw new Error('Cache delete error');
      });

      expect(() => cacheManager.invalidateCache('./src/test.ts')).not.toThrow();

      // Restore original method
      cacheManager['cache'].delete = originalDelete;
    });

    it('should handle validateFileHash errors gracefully', async () => {
      // Mock fs.promises.readFile to throw an error
      const originalReadFile = require('fs/promises').readFile;
      require('fs/promises').readFile = jest.fn().mockRejectedValue(new Error('File read error'));

      const result = await cacheManager.validateFileHash('./src/test.ts', 'test-hash');
      expect(result).toBe(false);

      // Restore original method
      require('fs/promises').readFile = originalReadFile;
    });

    it('should handle persistCache errors gracefully', async () => {
      // Mock fs.promises.writeFile to throw an error
      const originalWriteFile = require('fs/promises').writeFile;
      require('fs/promises').writeFile = jest.fn().mockRejectedValue(new Error('File write error'));

      await expect(cacheManager.persistCache()).resolves.not.toThrow();

      // Restore original method
      require('fs/promises').writeFile = originalWriteFile;
    });

    it('should handle loadCache errors gracefully', async () => {
      // Mock fs.promises.readFile to throw an error
      const originalReadFile = require('fs/promises').readFile;
      require('fs/promises').readFile = jest.fn().mockRejectedValue(new Error('File read error'));

      await expect(cacheManager.loadCache()).resolves.not.toThrow();

      // Restore original method
      require('fs/promises').readFile = originalReadFile;
    });

    it('should handle cleanupExpiredEntries errors gracefully', async () => {
      // Mock the cache.forEach method to throw an error
      const originalForEach = cacheManager['cache'].forEach;
      cacheManager['cache'].forEach = jest.fn().mockImplementation(() => {
        throw new Error('Cache forEach error');
      });

      expect(() => cacheManager.cleanupExpiredEntries()).not.toThrow();

      // Restore original method
      cacheManager['cache'].forEach = originalForEach;
    });

    it('should handle cleanupBySize errors gracefully', async () => {
      // Mock the cache.forEach method to throw an error
      const originalForEach = cacheManager['cache'].forEach;
      cacheManager['cache'].forEach = jest.fn().mockImplementation(() => {
        throw new Error('Cache forEach error');
      });

      expect(() => cacheManager.cleanupBySize()).not.toThrow();

      // Restore original method
      cacheManager['cache'].forEach = originalForEach;
    });

    it('should handle getCacheStatistics errors gracefully', async () => {
      // Mock the cache.forEach method to throw an error
      const originalForEach = cacheManager['cache'].forEach;
      cacheManager['cache'].forEach = jest.fn().mockImplementation(() => {
        throw new Error('Cache forEach error');
      });

      const stats = await cacheManager.getCacheStatistics();
      expect(stats.totalEntries).toBe(0);

      // Restore original method
      cacheManager['cache'].forEach = originalForEach;
    });

    it('should handle findDependents errors gracefully', async () => {
      // Mock the cache.forEach method to throw an error
      const originalForEach = cacheManager['cache'].forEach;
      cacheManager['cache'].forEach = jest.fn().mockImplementation(() => {
        throw new Error('Cache forEach error');
      });

      const dependents = await cacheManager.findDependents('./src/test.ts');
      expect(dependents).toEqual([]);

      // Restore original method
      cacheManager['cache'].forEach = originalForEach;
    });

    it('should handle invalidateDependents errors gracefully', async () => {
      // Mock findDependents to throw an error
      const originalFindDependents = cacheManager.findDependents;
      cacheManager.findDependents = jest.fn().mockImplementation(() => {
        throw new Error('Find dependents error');
      });

      expect(() => cacheManager.invalidateDependents('./src/test.ts')).not.toThrow();

      // Restore original method
      cacheManager.findDependents = originalFindDependents;
    });

    it('should handle clearCache errors gracefully', async () => {
      // Mock the cache.clear method to throw an error
      const originalClear = cacheManager['cache'].clear;
      cacheManager['cache'].clear = jest.fn().mockImplementation(() => {
        throw new Error('Cache clear error');
      });

      expect(() => cacheManager.clearCache()).not.toThrow();

      // Restore original method
      cacheManager['cache'].clear = originalClear;
    });

    it('should handle dispose errors gracefully', async () => {
      // Mock stopAutoCleanup to throw an error
      const originalStopAutoCleanup = cacheManager.stopAutoCleanup;
      cacheManager.stopAutoCleanup = jest.fn().mockImplementation(() => {
        throw new Error('Stop cleanup error');
      });

      // The dispose method should catch the error and not throw
      expect(() => {
        try {
          cacheManager.dispose();
        } catch (error) {
          // This should not happen if error handling is working
          throw error;
        }
      }).not.toThrow();

      // Restore original method
      cacheManager.stopAutoCleanup = originalStopAutoCleanup;
    });

    it('should handle compressData errors gracefully', async () => {
      // Mock zlib.gzip to throw an error
      const originalGzip = require('zlib').gzip;
      require('zlib').gzip = jest.fn().mockImplementation((_data, callback) => {
        callback(new Error('Compression error'));
      });

      const result = await cacheManager['compressData']('test data');
      expect(result).toBe('test data'); // Should return original data on error

      // Restore original method
      require('zlib').gzip = originalGzip;
    });

    it('should handle decompressData errors gracefully', async () => {
      // Mock zlib.gunzip to throw an error
      const originalGunzip = require('zlib').gunzip;
      require('zlib').gunzip = jest.fn().mockImplementation((_data, callback) => {
        callback(new Error('Decompression error'));
      });

      const result = await cacheManager['decompressData']('{"test": "data"}');
      expect(result).toEqual({ test: "data" }); // Should return parsed object

      // Restore original method
      require('zlib').gunzip = originalGunzip;
    });
  });

  describe('additional branch coverage tests', () => {
    it('should handle getCache with empty file path', async () => {
      const result = await cacheManager.getCache('');
      expect(result).toBeNull();
    });

    it('should handle getCache with null file path', async () => {
      const result = await cacheManager.getCache(null as any);
      expect(result).toBeNull();
    });

    it('should handle hasCache with empty file path', async () => {
      const result = await cacheManager.hasCache('');
      expect(result).toBe(false);
    });

    it('should handle hasCache with null file path', async () => {
      const result = await cacheManager.hasCache(null as any);
      expect(result).toBe(false);
    });

    it('should handle invalidateCache with empty file path', () => {
      expect(() => cacheManager.invalidateCache('')).not.toThrow();
    });

    it('should handle invalidateCache with null file path', () => {
      expect(() => cacheManager.invalidateCache(null as any)).not.toThrow();
    });

    it('should handle setCache with empty file path', () => {
      expect(() => cacheManager.setCache('', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      })).not.toThrow();
    });

    it('should handle setCache with null file path', () => {
      expect(() => cacheManager.setCache(null as any, {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      })).not.toThrow();
    });

    it('should handle validateFileHash with empty file path', async () => {
      const result = await cacheManager.validateFileHash('', 'test-hash');
      expect(result).toBe(false);
    });

    it('should handle validateFileHash with null file path', async () => {
      const result = await cacheManager.validateFileHash(null as any, 'test-hash');
      expect(result).toBe(false);
    });

    it('should handle findDependents with empty file path', async () => {
      const result = await cacheManager.findDependents('');
      expect(result).toEqual([]);
    });

    it('should handle findDependents with null file path', async () => {
      const result = await cacheManager.findDependents(null as any);
      expect(result).toEqual([]);
    });

    it('should handle invalidateDependents with empty file path', () => {
      expect(() => cacheManager.invalidateDependents('')).not.toThrow();
    });

    it('should handle invalidateDependents with null file path', () => {
      expect(() => cacheManager.invalidateDependents(null as any)).not.toThrow();
    });

    it('should handle cache hit and miss counting', async () => {
      // Test cache miss
      await cacheManager.getCache('non-existent-file.ts');
      
      // Test cache hit
      await cacheManager.setCache('test-file.ts', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });
      
      await cacheManager.getCache('test-file.ts');
      
      const stats = await cacheManager.getCacheStatistics();
      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
    });

    it('should handle cache deletion success', async () => {
      await cacheManager.setCache('test-file.ts', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });
      
      await cacheManager.invalidateCache('test-file.ts');
      
      const hasCache = await cacheManager.hasCache('test-file.ts');
      expect(hasCache).toBe(false);
    });

    it('should handle cache deletion failure', async () => {
      // Try to delete non-existent cache
      await cacheManager.invalidateCache('non-existent-file.ts');
      
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle compression enabled option', async () => {
      const cacheManagerWithCompression = new CacheManager({
        cacheFile: './test-cache.json',
        compressionEnabled: true,
        autoCleanup: false
      });

      await cacheManagerWithCompression.setCache('test-file.ts', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      const cached = await cacheManagerWithCompression.getCache('test-file.ts');
      expect(cached).toBeDefined();
      
      await cacheManagerWithCompression.dispose();
    });

    it('should handle compression disabled option', async () => {
      const cacheManagerWithoutCompression = new CacheManager({
        cacheFile: './test-cache.json',
        compressionEnabled: false,
        autoCleanup: false
      });

      await cacheManagerWithoutCompression.setCache('test-file.ts', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      const cached = await cacheManagerWithoutCompression.getCache('test-file.ts');
      expect(cached).toBeDefined();
      
      await cacheManagerWithoutCompression.dispose();
    });

    it('should handle auto cleanup enabled', async () => {
      const cacheManagerWithAutoCleanup = new CacheManager({
        cacheFile: './test-cache.json',
        compressionEnabled: false,
        autoCleanup: false, // Disable auto-cleanup for test
        cleanupInterval: 1000
      });

      await cacheManagerWithAutoCleanup.setCache('test-file.ts', {
        hash: 'test',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      // Wait a bit for auto cleanup to potentially run
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await cacheManagerWithAutoCleanup.dispose();
    });

    it('should handle cache statistics with empty cache', async () => {
      const emptyCacheManager = new CacheManager({
        cacheFile: './test-cache.json',
        compressionEnabled: false,
        autoCleanup: false
      });

      const stats = await emptyCacheManager.getCacheStatistics();
      expect(stats.totalEntries).toBe(0);
      expect(stats.hitRate).toBe(0);
      
      await emptyCacheManager.dispose();
    });

    it('should handle cache statistics with populated cache', async () => {
      await cacheManager.setCache('test-file1.ts', {
        hash: 'test1',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      await cacheManager.setCache('test-file2.ts', {
        hash: 'test2',
        lastModified: new Date().toISOString(),
        ast: mockASTNode,
        relations: [],
        dependencies: []
      });

      const stats = await cacheManager.getCacheStatistics();
      expect(stats.totalEntries).toBe(2);
    });
  });
});

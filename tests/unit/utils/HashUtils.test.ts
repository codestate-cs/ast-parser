/**
 * Tests for HashUtils class
 */

import { HashUtils, HashAlgorithm } from '../../../src/utils';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('HashUtils', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashString', () => {
    it('should calculate hash for string content with default algorithm', () => {
      const content = 'test content';
      const hash = HashUtils.hashString(content);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should calculate hash for string content with MD5', () => {
      const content = 'test content';
      const hash = HashUtils.hashString(content, 'md5');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });

    it('should calculate hash for string content with SHA1', () => {
      const content = 'test content';
      const hash = HashUtils.hashString(content, 'sha1');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(40); // SHA1 produces 40 character hex string
    });

    it('should calculate hash for string content with SHA512', () => {
      const content = 'test content';
      const hash = HashUtils.hashString(content, 'sha512');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(128); // SHA512 produces 128 character hex string
    });

    it('should produce consistent hashes for same content', () => {
      const content = 'consistent content';
      const hash1 = HashUtils.hashString(content);
      const hash2 = HashUtils.hashString(content);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different content', () => {
      const hash1 = HashUtils.hashString('content 1');
      const hash2 = HashUtils.hashString('content 2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = HashUtils.hashString('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle special characters', () => {
      const content = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = HashUtils.hashString(content);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle unicode content', () => {
      const content = 'Unicode: 你好世界 🌍 émojis 🚀';
      const hash = HashUtils.hashString(content);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle large content', () => {
      const content = 'x'.repeat(10000);
      const hash = HashUtils.hashString(content);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('hashBuffer', () => {
    it('should calculate hash for buffer content', () => {
      const buffer = Buffer.from('test content');
      const hash = HashUtils.hashBuffer(buffer);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should calculate hash for buffer content with MD5', () => {
      const buffer = Buffer.from('test content');
      const hash = HashUtils.hashBuffer(buffer, 'md5');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });

    it('should produce consistent hashes for same buffer', () => {
      const buffer = Buffer.from('consistent content');
      const hash1 = HashUtils.hashBuffer(buffer);
      const hash2 = HashUtils.hashBuffer(buffer);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different buffers', () => {
      const buffer1 = Buffer.from('content 1');
      const buffer2 = Buffer.from('content 2');
      const hash1 = HashUtils.hashBuffer(buffer1);
      const hash2 = HashUtils.hashBuffer(buffer2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0);
      const hash = HashUtils.hashBuffer(buffer);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle binary buffer', () => {
      const buffer = Buffer.from([0xFF, 0xFE, 0xFD, 0xFC]);
      const hash = HashUtils.hashBuffer(buffer);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('hashFile', () => {
    it('should calculate hash for file content', async () => {
      const mockContent = 'test file content';
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const hash = await HashUtils.hashFile('test.txt');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should calculate hash for file content with custom algorithm', async () => {
      const mockContent = 'test file content';
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const hash = await HashUtils.hashFile('test.txt', 'md5');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });

    it('should produce consistent hashes for same file content', async () => {
      const mockContent = 'consistent content';
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);

      const hash1 = await HashUtils.hashFile('test1.txt');
      const hash2 = await HashUtils.hashFile('test2.txt');
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different file content', async () => {
      (mockFs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce('content 1')
        .mockResolvedValueOnce('content 2');

      const hash1 = await HashUtils.hashFile('test1.txt');
      const hash2 = await HashUtils.hashFile('test2.txt');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle file reading errors', async () => {
      (mockFs.promises.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(HashUtils.hashFile('/invalid/file.txt')).rejects.toThrow();
    });

    it('should handle empty file content', async () => {
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue('');

      const hash = await HashUtils.hashFile('empty.txt');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('hashMultiple', () => {
    it('should calculate hash for multiple values', () => {
      const values = ['value1', 'value2', 'value3'];
      const hash = HashUtils.hashMultiple(values);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should calculate hash for multiple values with custom algorithm', () => {
      const values = ['value1', 'value2', 'value3'];
      const hash = HashUtils.hashMultiple(values, 'md5');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });

    it('should produce consistent hashes for same values', () => {
      const values = ['value1', 'value2', 'value3'];
      const hash1 = HashUtils.hashMultiple(values);
      const hash2 = HashUtils.hashMultiple(values);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different values', () => {
      const values1 = ['value1', 'value2'];
      const values2 = ['value1', 'value2', 'value3'];
      const hash1 = HashUtils.hashMultiple(values1);
      const hash2 = HashUtils.hashMultiple(values2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty array', () => {
      const hash = HashUtils.hashMultiple([]);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('hashObject', () => {
    it('should calculate hash for object', () => {
      const obj = { key1: 'value1', key2: 'value2' };
      const hash = HashUtils.hashObject(obj);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should calculate hash for object with custom algorithm', () => {
      const obj = { key1: 'value1', key2: 'value2' };
      const hash = HashUtils.hashObject(obj, 'md5');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });

    it('should produce consistent hashes for same object', () => {
      const obj = { key1: 'value1', key2: 'value2' };
      const hash1 = HashUtils.hashObject(obj);
      const hash2 = HashUtils.hashObject(obj);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce same hash regardless of key order', () => {
      const obj1 = { key1: 'value1', key2: 'value2' };
      const obj2 = { key2: 'value2', key1: 'value1' };
      const hash1 = HashUtils.hashObject(obj1);
      const hash2 = HashUtils.hashObject(obj2);
      
      expect(hash1).toBe(hash2);
    });

    it('should handle empty object', () => {
      const hash = HashUtils.hashObject({});
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle nested objects', () => {
      const obj = { 
        key1: 'value1', 
        key2: { nested: 'value' },
        key3: [1, 2, 3]
      };
      const hash = HashUtils.hashObject(obj);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('hashFileStats', () => {
    it('should calculate hash for file stats', async () => {
      const mockStats = {
        size: 1024,
        mtime: new Date('2023-01-01T00:00:00Z'),
        ctime: new Date('2023-01-01T00:00:00Z'),
        isFile: true,
        isDirectory: false
      };
      
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'getStats').mockResolvedValue(mockStats);
      
      const hash = await HashUtils.hashFileStats('test.txt');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should handle file stats errors', async () => {
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'getStats').mockRejectedValue(new Error('Stats failed'));
      
      await expect(HashUtils.hashFileStats('/invalid/file.txt')).rejects.toThrow('Stats failed');
    });
  });

  describe('hashPath', () => {
    it('should calculate hash for file path', () => {
      const filePath = '/path/to/file.txt';
      const hash = HashUtils.hashPath(filePath);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should calculate hash for file path with custom algorithm', () => {
      const filePath = '/path/to/file.txt';
      const hash = HashUtils.hashPath(filePath, 'md5');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });
  });

  describe('generateRandomHash', () => {
    it('should generate random hash with default length', () => {
      const hash = HashUtils.generateRandomHash();
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(8);
    });

    it('should generate random hash with custom length', () => {
      const hash = HashUtils.generateRandomHash(16);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(16);
    });

    it('should generate different hashes on each call', () => {
      const hash1 = HashUtils.generateRandomHash();
      const hash2 = HashUtils.generateRandomHash();
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyHash', () => {
    it('should verify correct hash', () => {
      const content = 'test content';
      const hash = HashUtils.hashString(content);
      
      const isValid = HashUtils.verifyHash(content, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect hash', () => {
      const content = 'test content';
      const wrongHash = 'wrong hash';
      
      const isValid = HashUtils.verifyHash(content, wrongHash);
      expect(isValid).toBe(false);
    });

    it('should verify hash with custom algorithm', () => {
      const content = 'test content';
      const hash = HashUtils.hashString(content, 'md5');
      
      const isValid = HashUtils.verifyHash(content, hash, 'md5');
      expect(isValid).toBe(true);
    });
  });

  describe('verifyFileHash', () => {
    it('should verify correct file hash', async () => {
      const mockContent = 'test file content';
      const hash = HashUtils.hashString(mockContent);
      
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      
      const isValid = await HashUtils.verifyFileHash('test.txt', hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect file hash', async () => {
      const mockContent = 'test file content';
      const wrongHash = 'wrong hash';
      
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      
      const isValid = await HashUtils.verifyFileHash('test.txt', wrongHash);
      expect(isValid).toBe(false);
    });

    it('should handle file reading errors', async () => {
      (mockFs.promises.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      
      const isValid = await HashUtils.verifyFileHash('/invalid/file.txt', 'some hash');
      expect(isValid).toBe(false);
    });
  });

  describe('calculateChecksum', () => {
    it('should calculate checksum for file', async () => {
      const mockContent = 'test file content';
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(mockContent);
      
      const checksum = await HashUtils.calculateChecksum('test.txt');
      
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBe(64); // SHA256 produces 64 character hex string
    });
  });

  describe('quickHash', () => {
    it('should calculate quick hash using MD5', () => {
      const content = 'test content';
      const hash = HashUtils.quickHash(content);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });
  });

  describe('secureHash', () => {
    it('should calculate secure hash using SHA256', () => {
      const content = 'test content';
      const hash = HashUtils.secureHash(content);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });
  });

  describe('hashWithSalt', () => {
    it('should calculate hash with salt', () => {
      const content = 'test content';
      const salt = 'random salt';
      const hash = HashUtils.hashWithSalt(content, salt);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 produces 64 character hex string
    });

    it('should produce different hashes with different salts', () => {
      const content = 'test content';
      const salt1 = 'salt1';
      const salt2 = 'salt2';
      
      const hash1 = HashUtils.hashWithSalt(content, salt1);
      const hash2 = HashUtils.hashWithSalt(content, salt2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should calculate hash with salt using custom algorithm', () => {
      const content = 'test content';
      const salt = 'random salt';
      const hash = HashUtils.hashWithSalt(content, salt, 'md5');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });
  });

  describe('generateSalt', () => {
    it('should generate salt with default length', () => {
      const salt = HashUtils.generateSalt();
      
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBe(32); // 16 bytes = 32 hex characters
    });

    it('should generate salt with custom length', () => {
      const salt = HashUtils.generateSalt(8);
      
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBe(16); // 8 bytes = 16 hex characters
    });

    it('should generate different salts on each call', () => {
      const salt1 = HashUtils.generateSalt();
      const salt2 = HashUtils.generateSalt();
      
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('hashDirectoryStructure', () => {
    it('should calculate hash for directory structure with files only', async () => {
      const mockFiles = ['file1.txt', 'file2.txt'];
      const mockStats = {
        isFile: true,
        isDirectory: false,
        size: 100,
        mtime: new Date(),
        ctime: new Date()
      };
      
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'listDirectory').mockResolvedValue(mockFiles);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'getStats').mockResolvedValue(mockStats);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'join').mockImplementation((dir, file) => `${dir}/${file}`);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'readFile').mockResolvedValue('file content');
      
      const hash = await HashUtils.hashDirectoryStructure('/test');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should calculate hash for directory structure with subdirectories only', async () => {
      const mockFiles = ['subdir1', 'subdir2'];
      const mockDirStats = {
        isFile: false,
        isDirectory: true,
        size: 0,
        mtime: new Date(),
        ctime: new Date()
      };
      
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'listDirectory')
        .mockResolvedValueOnce(mockFiles) // First call for main directory
        .mockResolvedValueOnce(['file1.txt']) // First subdirectory
        .mockResolvedValueOnce(['file2.txt']); // Second subdirectory
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'getStats')
        .mockResolvedValueOnce(mockDirStats) // subdir1
        .mockResolvedValueOnce(mockDirStats) // subdir2
        .mockResolvedValueOnce({ ...mockDirStats, isDirectory: false, isFile: true }) // file1.txt in subdir1
        .mockResolvedValueOnce({ ...mockDirStats, isDirectory: false, isFile: true }); // file2.txt in subdir2
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'join').mockImplementation((dir, file) => `${dir}/${file}`);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'readFile').mockResolvedValue('file content');
      
      const hash = await HashUtils.hashDirectoryStructure('/test');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should calculate hash for mixed directory structure (files and subdirectories)', async () => {
      const mockFiles = ['file1.txt', 'subdir', 'file2.txt'];
      const mockFileStats = {
        isFile: true,
        isDirectory: false,
        size: 100,
        mtime: new Date(),
        ctime: new Date()
      };
      const mockDirStats = {
        isFile: false,
        isDirectory: true,
        size: 0,
        mtime: new Date(),
        ctime: new Date()
      };
      
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'listDirectory')
        .mockResolvedValueOnce(mockFiles) // Main directory
        .mockResolvedValueOnce(['nested-file.txt']); // Subdirectory contents
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'getStats')
        .mockResolvedValueOnce(mockFileStats) // file1.txt
        .mockResolvedValueOnce(mockDirStats) // subdir
        .mockResolvedValueOnce(mockFileStats) // file2.txt
        .mockResolvedValueOnce({ ...mockFileStats }); // nested-file.txt
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'join').mockImplementation((dir, file) => `${dir}/${file}`);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'readFile').mockResolvedValue('file content');
      
      const hash = await HashUtils.hashDirectoryStructure('/test');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle empty directory', async () => {
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'listDirectory').mockResolvedValue([]);
      
      const hash = await HashUtils.hashDirectoryStructure('/empty');
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should handle directory structure errors', async () => {
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'listDirectory').mockRejectedValue(new Error('Permission denied'));
      
      await expect(HashUtils.hashDirectoryStructure('/invalid/dir')).rejects.toThrow('Permission denied');
    });

    it('should handle errors during file stats retrieval', async () => {
      const mockFiles = ['file1.txt'];
      
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'listDirectory').mockResolvedValue(mockFiles);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'getStats').mockRejectedValue(new Error('Stats error'));
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'join').mockImplementation((dir, file) => `${dir}/${file}`);
      
      await expect(HashUtils.hashDirectoryStructure('/test')).rejects.toThrow('Stats error');
    });

    it('should handle errors during file reading', async () => {
      const mockFiles = ['file1.txt'];
      const mockStats = {
        isFile: true,
        isDirectory: false,
        size: 100,
        mtime: new Date(),
        ctime: new Date()
      };
      
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'listDirectory').mockResolvedValue(mockFiles);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'getStats').mockResolvedValue(mockStats);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'join').mockImplementation((dir, file) => `${dir}/${file}`);
      jest.spyOn(require('../../../src/utils/file/FileUtils').FileUtils, 'readFile').mockRejectedValue(new Error('Read error'));
      
      await expect(HashUtils.hashDirectoryStructure('/test')).rejects.toThrow('Read error');
    });
  });

  describe('HashAlgorithm type', () => {
    it('should accept valid hash algorithms', () => {
      const algorithms: HashAlgorithm[] = ['md5', 'sha1', 'sha256', 'sha512'];
      
      algorithms.forEach(algorithm => {
        const hash = HashUtils.hashString('test', algorithm);
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
      });
    });
  });
});

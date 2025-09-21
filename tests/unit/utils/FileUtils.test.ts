/**
 * Tests for FileUtils class
 */

import { FileUtils } from '../../../src/utils';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    stat: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    unlink: jest.fn(),
    copyFile: jest.fn(),
    rename: jest.fn(),
  },
}));

describe('FileUtils', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to default behavior (except mkdir which we'll set per test)
    (mockFs.promises.readFile as jest.Mock).mockResolvedValue('content');
    (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);
    (mockFs.promises.stat as jest.Mock).mockResolvedValue({
      size: 100,
      birthtime: new Date(),
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      isDirectory: () => false,
      isFile: () => true,
      isSymbolicLink: () => false,
    });
    (mockFs.promises.readdir as jest.Mock).mockResolvedValue(['file1.txt', 'file2.txt']);
    (mockFs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
    (mockFs.promises.copyFile as jest.Mock).mockResolvedValue(undefined);
    (mockFs.promises.rename as jest.Mock).mockResolvedValue(undefined);
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      const filePath = 'test.txt';
      const content = 'test content';
      
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(content);

      const result = await FileUtils.readFile(filePath);
      
      expect(result).toBe(content);
      expect(mockFs.promises.readFile).toHaveBeenCalledWith(filePath, 'utf8');
    });

    it('should read file with custom encoding', async () => {
      const filePath = 'test.txt';
      const content = Buffer.from('test content');
      const encoding = 'binary' as BufferEncoding;
      
      (mockFs.promises.readFile as jest.Mock).mockResolvedValue(content);

      const result = await FileUtils.readFile(filePath, { encoding });
      
      expect(result).toBe(content);
      expect(mockFs.promises.readFile).toHaveBeenCalledWith(filePath, encoding);
    });

    it('should throw error when file read fails', async () => {
      const filePath = 'nonexistent.txt';
      const error = new Error('File not found');
      
      (mockFs.promises.readFile as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.readFile(filePath)).rejects.toThrow();
    });
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      const filePath = 'test.txt';
      const content = 'test content';
      
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (mockFs.promises.access as jest.Mock).mockRejectedValue(new Error('File does not exist'));

      await FileUtils.writeFile(filePath, content, { overwrite: true });
      
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(filePath, content, 'utf8');
    });

    it('should create directory if needed', async () => {
      const filePath = 'dir/test.txt';
      const content = 'test content';
      
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (mockFs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      (mockFs.promises.access as jest.Mock).mockRejectedValue(new Error('File does not exist'));

      await FileUtils.writeFile(filePath, content, { createDir: true, overwrite: true });
      
      expect(mockFs.promises.mkdir).toHaveBeenCalledWith('dir', { recursive: true });
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(filePath, content, 'utf8');
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      const filePath = 'test.txt';
      
      (mockFs.promises.access as jest.Mock).mockResolvedValue(undefined);

      const result = await FileUtils.exists(filePath);
      
      expect(result).toBe(true);
      expect(mockFs.promises.access).toHaveBeenCalledWith(filePath);
    });

    it('should return false if file does not exist', async () => {
      const filePath = 'nonexistent.txt';
      
      (mockFs.promises.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await FileUtils.exists(filePath);
      
      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return file statistics', async () => {
      const filePath = 'test.txt';
      const mockStats = {
        size: 100,
        birthtime: new Date('2023-01-01'),
        atime: new Date('2023-01-02'),
        mtime: new Date('2023-01-03'),
        ctime: new Date('2023-01-04'),
        isDirectory: () => false,
        isFile: () => true,
        isSymbolicLink: () => false,
      };
      
      (mockFs.promises.stat as jest.Mock).mockResolvedValue(mockStats);

      const result = await FileUtils.getStats(filePath);
      
      expect(result).toBeDefined();
      expect(result.size).toBe(100);
      expect(result.isFile).toBe(true);
      expect(result.isDirectory).toBe(false);
    });
  });

  describe('path utilities', () => {
    it('should get file extension', () => {
      expect(FileUtils.getExtension('test.ts')).toBe('.ts');
      expect(FileUtils.getExtension('test.tsx')).toBe('.tsx');
      expect(FileUtils.getExtension('test.js')).toBe('.js');
      expect(FileUtils.getExtension('test.jsx')).toBe('.jsx');
    });

    it('should get base name', () => {
      expect(FileUtils.getBaseName('test.ts')).toBe('test');
      expect(FileUtils.getBaseName('test.tsx')).toBe('test');
    });

    it('should get file name', () => {
      expect(FileUtils.getFileName('test.ts')).toBe('test.ts');
      expect(FileUtils.getFileName('test.tsx')).toBe('test.tsx');
    });

    it('should get directory name', () => {
      expect(FileUtils.getDirName('/path/to/test.ts')).toBe('/path/to');
    });

    it('should join paths', () => {
      expect(FileUtils.join('path', 'to', 'file.ts')).toBe(path.join('path', 'to', 'file.ts'));
    });

    it('should resolve paths', () => {
      expect(FileUtils.resolve('path', 'to', 'file.ts')).toBe(path.resolve('path', 'to', 'file.ts'));
    });

    it('should normalize paths', () => {
      expect(FileUtils.normalize('/path/to/../file.ts')).toBe(path.normalize('/path/to/../file.ts'));
    });

    it('should get relative paths', () => {
      expect(FileUtils.relative('/path/to', '/path/to/file.ts')).toBe(path.relative('/path/to', '/path/to/file.ts'));
    });
  });

  describe('additional file operations', () => {
    it('should ensure directory exists', async () => {
      (mockFs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
      
      await FileUtils.ensureDirectory('new-dir');
      expect(mockFs.promises.mkdir).toHaveBeenCalledWith('new-dir', { recursive: true });
    });

    it('should list directory contents', async () => {
      const mockFiles = ['file1.ts', 'file2.js', 'subdir'];
      (mockFs.promises.readdir as jest.Mock).mockResolvedValue(mockFiles);
      
      const files = await FileUtils.listDirectory('test-dir');
      expect(files).toEqual(mockFiles);
    });

    it('should backup file', async () => {
      (mockFs.promises.copyFile as jest.Mock).mockResolvedValue(undefined);
      
      await FileUtils.backupFile('test.txt');
      expect(mockFs.promises.copyFile).toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const filePath = 'test.txt';
      
      (mockFs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

      await FileUtils.deleteFile(filePath);
      
      expect(mockFs.promises.unlink).toHaveBeenCalledWith(filePath);
    });

    it('should handle delete errors', async () => {
      const filePath = 'test.txt';
      const error = new Error('Permission denied');
      
      (mockFs.promises.unlink as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.deleteFile(filePath)).rejects.toThrow('Failed to delete file');
    });
  });

  describe('copyFile', () => {
    it('should copy file successfully', async () => {
      const sourcePath = 'source.txt';
      const destPath = 'dest.txt';
      
      (mockFs.promises.copyFile as jest.Mock).mockResolvedValue(undefined);

      await FileUtils.copyFile(sourcePath, destPath);
      
      expect(mockFs.promises.copyFile).toHaveBeenCalledWith(sourcePath, destPath);
    });

    it('should handle copy errors', async () => {
      const sourcePath = 'source.txt';
      const destPath = 'dest.txt';
      const error = new Error('File not found');
      
      (mockFs.promises.copyFile as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.copyFile(sourcePath, destPath)).rejects.toThrow('Failed to copy file');
    });
  });

  describe('moveFile', () => {
    it('should move file successfully', async () => {
      const sourcePath = 'source.txt';
      const destPath = 'dest.txt';
      
      (mockFs.promises.rename as jest.Mock).mockResolvedValue(undefined);

      await FileUtils.moveFile(sourcePath, destPath);
      
      expect(mockFs.promises.rename).toHaveBeenCalledWith(sourcePath, destPath);
    });

    it('should handle move errors', async () => {
      const sourcePath = 'source.txt';
      const destPath = 'dest.txt';
      const error = new Error('Permission denied');
      
      (mockFs.promises.rename as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.moveFile(sourcePath, destPath)).rejects.toThrow('Failed to move file');
    });
  });

  describe('isAbsolute', () => {
    it('should return true for absolute paths', () => {
      expect(FileUtils.isAbsolute('/absolute/path')).toBe(true);
      // Test Windows-style absolute path only on Windows
      if (process.platform === 'win32') {
        expect(FileUtils.isAbsolute('C:\\absolute\\path')).toBe(true);
      }
    });

    it('should return false for relative paths', () => {
      expect(FileUtils.isAbsolute('relative/path')).toBe(false);
      expect(FileUtils.isAbsolute('./relative/path')).toBe(false);
      expect(FileUtils.isAbsolute('../relative/path')).toBe(false);
    });
  });

  describe('writeFile advanced options', () => {
    it('should handle backup option', async () => {
      const filePath = 'test.txt';
      const content = 'test content';
      
      // Mock exists to return true (file exists)
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      (mockFs.promises.copyFile as jest.Mock).mockResolvedValue(undefined);
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      await FileUtils.writeFile(filePath, content, { backup: true, overwrite: true });
      
      expect(mockFs.promises.copyFile).toHaveBeenCalledWith(filePath, filePath + '.backup');
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(filePath, content, 'utf8');
    });

    it('should handle createDir option', async () => {
      const filePath = 'test/dir/test.txt';
      const content = 'test content';
      
      jest.spyOn(FileUtils, 'ensureDirectory').mockResolvedValue(undefined);
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(false); // File doesn't exist
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      await FileUtils.writeFile(filePath, content, { createDir: true });
      
      expect(FileUtils.ensureDirectory).toHaveBeenCalledWith('test/dir');
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(filePath, content, 'utf8');
    });

    it('should throw error when file exists and overwrite is false', async () => {
      const filePath = 'test.txt';
      const content = 'test content';
      
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      await expect(FileUtils.writeFile(filePath, content, { overwrite: false }))
        .rejects.toThrow('Failed to write file');
    });

    it('should write file when overwrite is true', async () => {
      const filePath = 'test.txt';
      const content = 'test content';
      
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      (mockFs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      await FileUtils.writeFile(filePath, content, { overwrite: true });
      
      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(filePath, content, 'utf8');
    });
  });

  describe('getStats error handling', () => {
    it('should handle getStats errors', async () => {
      const filePath = 'test.txt';
      const error = new Error('File not found');
      
      (mockFs.promises.stat as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.getStats(filePath)).rejects.toThrow('Failed to get file stats');
    });
  });

  describe('listDirectory error handling', () => {
    it('should handle listDirectory errors', async () => {
      const dirPath = '/invalid/dir';
      const error = new Error('Permission denied');
      
      (mockFs.promises.readdir as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.listDirectory(dirPath)).rejects.toThrow('Failed to list directory');
    });
  });

  describe('backupFile error handling', () => {
    it('should handle backupFile errors', async () => {
      const filePath = 'test.txt';
      const error = new Error('File not found');
      
      (mockFs.promises.copyFile as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.backupFile(filePath)).rejects.toThrow('Failed to backup file');
    });

    it('should use custom backup suffix', async () => {
      const filePath = 'test.txt';
      const customSuffix = '.bak';
      
      (mockFs.promises.copyFile as jest.Mock).mockResolvedValue(undefined);

      const result = await FileUtils.backupFile(filePath, customSuffix);
      
      expect(mockFs.promises.copyFile).toHaveBeenCalledWith(filePath, filePath + customSuffix);
      expect(result).toBe(filePath + customSuffix);
    });
  });

  describe('error handling', () => {
    // it('should handle directory creation errors', async () => {
    //   // Override the default mock for this specific test
    //   const mkdirMock = mockFs.promises.mkdir as jest.Mock;
    //   mkdirMock.mockImplementationOnce(() => Promise.reject(new Error('Permission denied')));
      
    //   try {
    //     await FileUtils.ensureDirectory('/invalid/path');
    //     expect(true).toBe(false); // This should not be reached
    //   } catch (error) {
    //     expect(error).toBeInstanceOf(Error);
    //     expect((error as Error).message).toContain('Failed to create directory');
    //   }
      
    //   // Verify the mock was called
    //   expect(mkdirMock).toHaveBeenCalledWith('/invalid/path', { recursive: true });
      
    //   // Reset the mock for other tests
    //   mkdirMock.mockReset();
    // });

    it('should handle readFile errors', async () => {
      const filePath = 'test.txt';
      const error = new Error('File not found');
      
      (mockFs.promises.readFile as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.readFile(filePath)).rejects.toThrow('Failed to read file');
    });

    it('should handle writeFile errors', async () => {
      const filePath = 'test.txt';
      const content = 'test content';
      const error = new Error('Permission denied');
      
      (mockFs.promises.writeFile as jest.Mock).mockRejectedValue(error);

      await expect(FileUtils.writeFile(filePath, content)).rejects.toThrow('Failed to write file');
    });
  });
});

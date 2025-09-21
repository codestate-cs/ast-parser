/**
 * File operation utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileOperationError } from '../error/CustomErrors';
import { logError } from '../error/ErrorLogger';

/**
 * File operation options
 */
export interface FileOperationOptions {
  /** Encoding */
  encoding?: BufferEncoding;
  /** Create directory if it doesn't exist */
  createDir?: boolean;
  /** Overwrite existing file */
  overwrite?: boolean;
  /** Backup existing file */
  backup?: boolean;
}

/**
 * File statistics
 */
export interface FileStats {
  /** File size in bytes */
  size: number;
  /** Creation time */
  birthtime: Date;
  /** Last access time */
  atime: Date;
  /** Last modified time */
  mtime: Date;
  /** Last status change time */
  ctime: Date;
  /** Is directory */
  isDirectory: boolean;
  /** Is file */
  isFile: boolean;
  /** Is symbolic link */
  isSymbolicLink: boolean;
}

/**
 * File utilities class
 */
export class FileUtils {
  /**
   * Read file content
   */
  static async readFile(filePath: string, options: FileOperationOptions = {}): Promise<string> {
    try {
      const encoding = options.encoding ?? 'utf8';
      const content = await fs.promises.readFile(filePath, encoding);
      return content;
    } catch (error) {
      const message = `Failed to read file: ${filePath}`;
      logError(message, error as Error, { filePath });
      throw new FileOperationError(message, filePath, { error: (error as Error).message });
    }
  }

  /**
   * Write file content
   */
  static async writeFile(
    filePath: string,
    content: string,
    options: FileOperationOptions = {}
  ): Promise<void> {
    try {
      const encoding = options.encoding ?? 'utf8';

      // Create directory if needed
      if (options.createDir) {
        const dir = path.dirname(filePath);
        await this.ensureDirectory(dir);
      }

      // Backup existing file if needed
      if (options.backup && (await this.exists(filePath))) {
        await this.backupFile(filePath);
      }

      // Check if file exists and overwrite is not allowed
      if (!options.overwrite && (await this.exists(filePath))) {
        throw new FileOperationError(
          `File already exists and overwrite is not allowed: ${filePath}`,
          filePath
        );
      }

      await fs.promises.writeFile(filePath, content, encoding);
    } catch (error) {
      const message = `Failed to write file: ${filePath}`;
      logError(message, error as Error, { filePath });
      throw new FileOperationError(message, filePath, { error: (error as Error).message });
    }
  }

  /**
   * Check if file exists
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file statistics
   */
  static async getStats(filePath: string): Promise<FileStats> {
    try {
      const stats = await fs.promises.stat(filePath);
      return {
        size: stats.size,
        birthtime: stats.birthtime,
        atime: stats.atime,
        mtime: stats.mtime,
        ctime: stats.ctime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymbolicLink: stats.isSymbolicLink(),
      };
    } catch (error) {
      const message = `Failed to get file stats: ${filePath}`;
      logError(message, error as Error, { filePath });
      throw new FileOperationError(message, filePath, { error: (error as Error).message });
    }
  }

  /**
   * Ensure directory exists
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      const message = `Failed to create directory: ${dirPath}`;
      logError(message, error as Error, { dirPath });
      throw new FileOperationError(message, dirPath, { error: (error as Error).message });
    }
  }

  /**
   * List directory contents
   */
  static async listDirectory(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(dirPath);
      return files;
    } catch (error) {
      const message = `Failed to list directory: ${dirPath}`;
      logError(message, error as Error, { dirPath });
      throw new FileOperationError(message, dirPath, { error: (error as Error).message });
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      const message = `Failed to delete file: ${filePath}`;
      logError(message, error as Error, { filePath });
      throw new FileOperationError(message, filePath, { error: (error as Error).message });
    }
  }

  /**
   * Copy file
   */
  static async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      await fs.promises.copyFile(sourcePath, destPath);
    } catch (error) {
      const message = `Failed to copy file from ${sourcePath} to ${destPath}`;
      logError(message, error as Error, { sourcePath, destPath });
      throw new FileOperationError(message, sourcePath, { error: (error as Error).message });
    }
  }

  /**
   * Move file
   */
  static async moveFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      await fs.promises.rename(sourcePath, destPath);
    } catch (error) {
      const message = `Failed to move file from ${sourcePath} to ${destPath}`;
      logError(message, error as Error, { sourcePath, destPath });
      throw new FileOperationError(message, sourcePath, { error: (error as Error).message });
    }
  }

  /**
   * Backup file
   */
  static async backupFile(filePath: string, backupSuffix: string = '.backup'): Promise<string> {
    try {
      const backupPath = filePath + backupSuffix;
      await this.copyFile(filePath, backupPath);
      return backupPath;
    } catch (error) {
      const message = `Failed to backup file: ${filePath}`;
      logError(message, error as Error, { filePath });
      throw new FileOperationError(message, filePath, { error: (error as Error).message });
    }
  }

  /**
   * Get file extension
   */
  static getExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Get file name without extension
   */
  static getBaseName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Get file name with extension
   */
  static getFileName(filePath: string): string {
    return path.basename(filePath);
  }

  /**
   * Get directory name
   */
  static getDirName(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Check if path is absolute
   */
  static isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * Resolve path
   */
  static resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Join paths
   */
  static join(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Normalize path
   */
  static normalize(filePath: string): string {
    return path.normalize(filePath);
  }

  /**
   * Get relative path
   */
  static relative(from: string, to: string): string {
    return path.relative(from, to);
  }
}

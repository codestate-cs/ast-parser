/**
 * Hash calculation utilities
 */

import * as crypto from 'crypto';
import { FileUtils } from './FileUtils';
import { logError } from '../error/ErrorLogger';

/**
 * Hash algorithm types
 */
export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';

/**
 * Hash utilities class
 */
export class HashUtils {
  /**
   * Calculate hash of string content
   */
  static hashString(content: string, algorithm: HashAlgorithm = 'sha256'): string {
    const hash = crypto.createHash(algorithm);
    hash.update(content, 'utf8');
    return hash.digest('hex');
  }

  /**
   * Calculate hash of buffer content
   */
  static hashBuffer(buffer: Buffer, algorithm: HashAlgorithm = 'sha256'): string {
    const hash = crypto.createHash(algorithm);
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Calculate hash of file content
   */
  static async hashFile(filePath: string, algorithm: HashAlgorithm = 'sha256'): Promise<string> {
    try {
      const content = await FileUtils.readFile(filePath);
      return this.hashString(content, algorithm);
    } catch (error) {
      logError(`Failed to hash file: ${filePath}`, error as Error, { filePath });
      throw error;
    }
  }

  /**
   * Calculate hash of file stats (size, mtime, etc.)
   */
  static async hashFileStats(
    filePath: string,
    algorithm: HashAlgorithm = 'sha256'
  ): Promise<string> {
    try {
      const stats = await FileUtils.getStats(filePath);
      const statsString = JSON.stringify({
        size: stats.size,
        mtime: stats.mtime.toISOString(),
        ctime: stats.ctime.toISOString(),
      });
      return this.hashString(statsString, algorithm);
    } catch (error) {
      logError(`Failed to hash file stats: ${filePath}`, error as Error, { filePath });
      throw error;
    }
  }

  /**
   * Calculate hash of multiple values
   */
  static hashMultiple(values: string[], algorithm: HashAlgorithm = 'sha256'): string {
    const combined = values.join('|');
    return this.hashString(combined, algorithm);
  }

  /**
   * Calculate hash of object
   */
  static hashObject(obj: Record<string, unknown>, algorithm: HashAlgorithm = 'sha256'): string {
    const jsonString = JSON.stringify(obj, Object.keys(obj).sort());
    return this.hashString(jsonString, algorithm);
  }

  /**
   * Calculate hash of file path
   */
  static hashPath(filePath: string, algorithm: HashAlgorithm = 'sha256'): string {
    return this.hashString(filePath, algorithm);
  }

  /**
   * Generate random hash
   */
  static generateRandomHash(length: number = 8, algorithm: HashAlgorithm = 'sha256'): string {
    const randomBytes = crypto.randomBytes(length);
    const hash = crypto.createHash(algorithm);
    hash.update(randomBytes);
    return hash.digest('hex').substring(0, length);
  }

  /**
   * Verify hash
   */
  static verifyHash(content: string, hash: string, algorithm: HashAlgorithm = 'sha256'): boolean {
    const calculatedHash = this.hashString(content, algorithm);
    return calculatedHash === hash;
  }

  /**
   * Verify file hash
   */
  static async verifyFileHash(
    filePath: string,
    hash: string,
    algorithm: HashAlgorithm = 'sha256'
  ): Promise<boolean> {
    try {
      const calculatedHash = await this.hashFile(filePath, algorithm);
      return calculatedHash === hash;
    } catch (error) {
      logError(`Failed to verify file hash: ${filePath}`, error as Error, { filePath });
      return false;
    }
  }

  /**
   * Calculate checksum of file
   */
  static async calculateChecksum(filePath: string): Promise<string> {
    return this.hashFile(filePath, 'sha256');
  }

  /**
   * Calculate quick hash (MD5 for performance)
   */
  static quickHash(content: string): string {
    return this.hashString(content, 'md5');
  }

  /**
   * Calculate secure hash (SHA256)
   */
  static secureHash(content: string): string {
    return this.hashString(content, 'sha256');
  }

  /**
   * Calculate hash with salt
   */
  static hashWithSalt(content: string, salt: string, algorithm: HashAlgorithm = 'sha256'): string {
    const saltedContent = salt + content;
    return this.hashString(saltedContent, algorithm);
  }

  /**
   * Generate salt
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Calculate hash of directory structure
   */
  static async hashDirectoryStructure(
    dirPath: string,
    algorithm: HashAlgorithm = 'sha256'
  ): Promise<string> {
    try {
      const files = await FileUtils.listDirectory(dirPath);
      const fileHashes: string[] = [];

      for (const file of files) {
        const filePath = FileUtils.join(dirPath, file);
        const stats = await FileUtils.getStats(filePath);

        if (stats.isDirectory) {
          const subDirHash = await this.hashDirectoryStructure(filePath, algorithm);
          fileHashes.push(subDirHash);
        } else {
          const fileHash = await this.hashFile(filePath, algorithm);
          fileHashes.push(fileHash);
        }
      }

      return this.hashMultiple(fileHashes, algorithm);
    } catch (error) {
      logError(`Failed to hash directory structure: ${dirPath}`, error as Error, { dirPath });
      throw error;
    }
  }
}

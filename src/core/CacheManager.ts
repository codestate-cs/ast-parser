/**
 * Cache management for AST parsing
 */

import { ASTNode, Relation } from '../types';
import { FileUtils } from '../utils/file/FileUtils';
import { logInfo, logWarn, logError } from '../utils/error/ErrorLogger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Cache data interface for file persistence
 */
interface CacheData {
  version: string;
  timestamp: string;
  entries: Record<string, CacheEntry>;
  statistics?: {
    hitCount: number;
    missCount: number;
    lastCleanup: string;
  };
}

/**
 * Cache entry interface
 */
export interface CacheEntry {
  hash: string;
  lastModified: string;
  ast: ASTNode;
  relations: Relation[];
  dependencies: string[];
}

/**
 * Cache statistics interface
 */
export interface CacheStatistics {
  totalEntries: number;
  cacheSize: number;
  hitRate: number;
  lastCleanup: string;
  oldestEntry: string;
  newestEntry: string;
}

/**
 * Cache manager options
 */
export interface CacheManagerOptions {
  cacheFile?: string;
  maxCacheSize?: number;
  compressionEnabled?: boolean;
  autoCleanup?: boolean;
  cleanupInterval?: number;
  defaultTTL?: number;
}

/**
 * Default cache manager options
 */
const DEFAULT_CACHE_OPTIONS: Required<CacheManagerOptions> = {
  cacheFile: './.ast-cache.json',
  maxCacheSize: 10000,
  compressionEnabled: false,
  autoCleanup: true,
  cleanupInterval: 300000, // 5 minutes
  defaultTTL: 3600000, // 1 hour
};

/**
 * Cache manager class
 */
export class CacheManager {
  private options: Required<CacheManagerOptions>;
  private cache: Map<string, CacheEntry> = new Map();
  private hitCount: number = 0;
  private missCount: number = 0;
  private lastCleanup: Date = new Date();
  private cleanupTimer?: NodeJS.Timeout | undefined;

  constructor(options: CacheManagerOptions = {}) {
    this.options = this.mergeOptions(DEFAULT_CACHE_OPTIONS, options);
    this.startAutoCleanup();
  }

  /**
   * Set cache entry for a file
   */
  setCache(filePath: string, entry: CacheEntry): void {
    try {
      if (!filePath || !entry) {
        logWarn('Invalid cache entry data', { filePath, entry });
        return;
      }

      // Validate entry data
      if (!this.validateCacheEntry(entry)) {
        logWarn('Invalid cache entry structure', { filePath });
        return;
      }

      this.cache.set(filePath, entry);
      logInfo(`Cached AST data for: ${filePath}`);
    } catch (error) {
      logError(`Failed to set cache for ${filePath}`, error as Error);
    }
  }

  /**
   * Get cache entry for a file
   */
  getCache(filePath: string): CacheEntry | null {
    try {
      if (!filePath) {
        return null;
      }

      const entry = this.cache.get(filePath);
      if (entry) {
        this.hitCount++;
        logInfo(`Cache hit for: ${filePath}`);
        return entry;
      } else {
        this.missCount++;
        logInfo(`Cache miss for: ${filePath}`);
        return null;
      }
    } catch (error) {
      logError(`Failed to get cache for ${filePath}`, error as Error);
      return null;
    }
  }

  /**
   * Check if cache entry exists for a file
   */
  hasCache(filePath: string): boolean {
    try {
      if (!filePath) {
        return false;
      }
      return this.cache.has(filePath);
    } catch (error) {
      logError(`Failed to check cache for ${filePath}`, error as Error);
      return false;
    }
  }

  /**
   * Invalidate cache entry for a file
   */
  invalidateCache(filePath: string): void {
    try {
      if (!filePath) {
        return;
      }

      const deleted = this.cache.delete(filePath);
      if (deleted) {
        logInfo(`Invalidated cache for: ${filePath}`);
      }
    } catch (error) {
      logError(`Failed to invalidate cache for ${filePath}`, error as Error);
    }
  }

  /**
   * Validate file hash against cache
   */
  validateFileHash(filePath: string, currentHash: string): boolean {
    try {
      if (!filePath || !currentHash) {
        return false;
      }

      const entry = this.cache.get(filePath);
      if (!entry) {
        return false;
      }

      return entry.hash === currentHash;
    } catch (error) {
      logError(`Failed to validate file hash for ${filePath}`, error as Error);
      return false;
    }
  }

  /**
   * Persist cache to file
   */
  async persistCache(): Promise<void> {
    try {
      if (this.cache.size === 0) {
        logInfo('No cache entries to persist');
        return;
      }

      const cacheData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        entries: Object.fromEntries(this.cache),
        statistics: {
          hitCount: this.hitCount,
          missCount: this.missCount,
          lastCleanup: this.lastCleanup.toISOString(),
        },
      };

      const cacheDir = path.dirname(this.options.cacheFile);
      await FileUtils.ensureDirectory(cacheDir);

      const data = this.options.compressionEnabled
        ? this.compressData(JSON.stringify(cacheData))
        : JSON.stringify(cacheData, null, 2);

      await fs.writeFile(this.options.cacheFile, data);
      logInfo(`Persisted cache with ${this.cache.size} entries to: ${this.options.cacheFile}`);
    } catch (error) {
      logError('Failed to persist cache', error as Error);
    }
  }

  /**
   * Load cache from file
   */
  async loadCache(): Promise<void> {
    try {
      const cacheExists = await FileUtils.exists(this.options.cacheFile);
      if (!cacheExists) {
        logInfo('No cache file found, starting with empty cache');
        return;
      }

      const data = await fs.readFile(this.options.cacheFile, 'utf-8');
      const cacheData: CacheData = this.options.compressionEnabled
        ? this.decompressData(data)
        : (JSON.parse(data) as CacheData);

      if (!this.validateCacheData(cacheData)) {
        logWarn('Invalid cache file format, starting with empty cache');
        return;
      }

      this.cache = new Map(Object.entries(cacheData.entries ?? {}));

      if (cacheData.statistics) {
        this.hitCount = cacheData.statistics.hitCount ?? 0;
        this.missCount = cacheData.statistics.missCount ?? 0;
        this.lastCleanup = new Date(cacheData.statistics.lastCleanup ?? Date.now());
      }

      logInfo(`Loaded cache with ${this.cache.size} entries from: ${this.options.cacheFile}`);
    } catch (error) {
      logError('Failed to load cache', error as Error);
      this.cache.clear();
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredEntries(ttl: number = this.options.defaultTTL): void {
    try {
      const now = Date.now();
      const expiredFiles: string[] = [];

      for (const [filePath, entry] of this.cache.entries()) {
        const entryTime = new Date(entry.lastModified).getTime();
        if (now - entryTime > ttl) {
          expiredFiles.push(filePath);
        }
      }

      for (const filePath of expiredFiles) {
        this.cache.delete(filePath);
      }

      if (expiredFiles.length > 0) {
        logInfo(`Cleaned up ${expiredFiles.length} expired cache entries`);
      }

      this.lastCleanup = new Date();
    } catch (error) {
      logError('Failed to cleanup expired entries', error as Error);
    }
  }

  /**
   * Clean up cache by size limit
   */
  cleanupBySize(): void {
    try {
      if (this.cache.size <= this.options.maxCacheSize) {
        return;
      }

      // Convert to array and sort by lastModified (oldest first)
      const entries = Array.from(this.cache.entries())
        .map(([path, entry]) => ({ path, entry }))
        .sort(
          (a, b) =>
            new Date(a.entry.lastModified).getTime() - new Date(b.entry.lastModified).getTime()
        );

      // Remove oldest entries until we're under the limit
      const toRemove = entries.slice(0, entries.length - this.options.maxCacheSize);
      for (const { path } of toRemove) {
        this.cache.delete(path);
      }

      if (toRemove.length > 0) {
        logInfo(`Cleaned up ${toRemove.length} cache entries by size limit`);
      }
    } catch (error) {
      logError('Failed to cleanup by size', error as Error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): CacheStatistics {
    try {
      const entries = Array.from(this.cache.entries());
      const totalRequests = this.hitCount + this.missCount;
      const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

      let oldestEntry = '';
      let newestEntry = '';
      let cacheSize = 0;

      if (entries.length > 0) {
        const sortedEntries = entries.sort(
          (a, b) => new Date(a[1].lastModified).getTime() - new Date(b[1].lastModified).getTime()
        );

        oldestEntry = sortedEntries[0]?.[1]?.lastModified ?? '';
        newestEntry = sortedEntries[sortedEntries.length - 1]?.[1]?.lastModified ?? '';

        // Calculate approximate cache size
        cacheSize = JSON.stringify(Object.fromEntries(this.cache)).length;
      }

      return {
        totalEntries: this.cache.size,
        cacheSize,
        hitRate,
        lastCleanup: this.lastCleanup.toISOString(),
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      logError('Failed to get cache statistics', error as Error);
      return {
        totalEntries: 0,
        cacheSize: 0,
        hitRate: 0,
        lastCleanup: new Date().toISOString(),
        oldestEntry: '',
        newestEntry: '',
      };
    }
  }

  /**
   * Invalidate dependent files
   */
  invalidateDependents(filePath: string): void {
    try {
      if (!filePath) {
        return;
      }

      const dependents = this.findDependents(filePath);
      for (const dependent of dependents) {
        this.invalidateCache(dependent);
      }

      if (dependents.length > 0) {
        logInfo(`Invalidated ${dependents.length} dependent files for: ${filePath}`);
      }
    } catch (error) {
      logError(`Failed to invalidate dependents for ${filePath}`, error as Error);
    }
  }

  /**
   * Find files that depend on a given file
   */
  findDependents(filePath: string): string[] {
    try {
      if (!filePath) {
        return [];
      }

      const dependents: string[] = [];

      for (const [cachedPath, entry] of this.cache.entries()) {
        if (entry.dependencies.includes(filePath)) {
          dependents.push(cachedPath);
        }
      }

      return dependents;
    } catch (error) {
      logError(`Failed to find dependents for ${filePath}`, error as Error);
      return [];
    }
  }

  /**
   * Get all cache entries
   */
  getAllCacheEntries(): Map<string, CacheEntry> {
    return new Map(this.cache);
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    try {
      this.cache.clear();
      this.hitCount = 0;
      this.missCount = 0;
      logInfo('Cleared all cache entries');
    } catch (error) {
      logError('Failed to clear cache', error as Error);
    }
  }

  /**
   * Start auto cleanup timer
   */
  private startAutoCleanup(): void {
    if (!this.options.autoCleanup) {
      return;
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredEntries();
        await this.cleanupBySize();
      } catch (error) {
        logError('Auto cleanup failed', error as Error);
      }
    }, this.options.cleanupInterval);
  }

  /**
   * Stop auto cleanup timer
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(
    defaults: Required<CacheManagerOptions>,
    options: CacheManagerOptions
  ): Required<CacheManagerOptions> {
    return {
      cacheFile: options.cacheFile ?? defaults.cacheFile,
      maxCacheSize: options.maxCacheSize ?? defaults.maxCacheSize,
      compressionEnabled: options.compressionEnabled ?? defaults.compressionEnabled,
      autoCleanup: options.autoCleanup ?? defaults.autoCleanup,
      cleanupInterval: options.cleanupInterval ?? defaults.cleanupInterval,
      defaultTTL: options.defaultTTL ?? defaults.defaultTTL,
    };
  }

  /**
   * Validate cache entry structure
   */
  private validateCacheEntry(entry: CacheEntry): boolean {
    try {
      return !!(
        entry &&
        typeof entry.hash === 'string' &&
        typeof entry.lastModified === 'string' &&
        entry.ast &&
        Array.isArray(entry.relations) &&
        Array.isArray(entry.dependencies) &&
        !isNaN(new Date(entry.lastModified).getTime())
      );
    } catch {
      return false;
    }
  }

  /**
   * Validate cache data structure
   */
  private validateCacheData(data: unknown): data is CacheData {
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }
      
      const obj = data as Record<string, unknown>;
      return !!(
        'version' in obj &&
        'timestamp' in obj &&
        'entries' in obj &&
        typeof obj['version'] === 'string' &&
        typeof obj['timestamp'] === 'string' &&
        typeof obj['entries'] === 'object'
      );
    } catch {
      return false;
    }
  }

  /**
   * Compress data (placeholder implementation)
   */
  private compressData(data: string): string {
    // In a real implementation, you would use compression libraries like zlib
    // For now, we'll just return the data as-is
    return data;
  }

  /**
   * Decompress data (placeholder implementation)
   */
  private decompressData(data: string): CacheData {
    // In a real implementation, you would use decompression libraries like zlib
    // For now, we'll just parse the data as JSON
    return JSON.parse(data) as CacheData;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    try {
      this.stopAutoCleanup();
      this.cache.clear();
    } catch (error) {
      logError('Failed to dispose cache manager', error as Error);
    }
  }
}

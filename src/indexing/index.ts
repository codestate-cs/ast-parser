/**
 * Indexing System Module Exports
 *
 * This module provides a comprehensive indexing system for managing and searching
 * parsed project information. It includes core indexing components, search capabilities,
 * and maintenance utilities.
 */

// Core indexing components
export { ProjectIndex } from './ProjectIndex';
export { GlobalIndex } from './GlobalIndex';
export { IndexBuilder } from './IndexBuilder';
export { SearchEngine } from './SearchEngine';
export { IndexManager } from './IndexManager';

// Maintenance components
export { IndexValidator } from './maintenance/IndexValidator';
export { IndexOptimizer } from './maintenance/IndexOptimizer';
export { IndexCleanup } from './maintenance/IndexCleanup';

// Import classes for factory
import { IndexBuilder } from './IndexBuilder';
import { SearchEngine } from './SearchEngine';
import { IndexManager } from './IndexManager';
import { IndexValidator } from './maintenance/IndexValidator';
import { IndexOptimizer } from './maintenance/IndexOptimizer';
import { IndexCleanup } from './maintenance/IndexCleanup';

// Re-export all indexing types
export * from '../types/indexing';

/**
 * Indexing System Factory
 *
 * Provides convenient factory methods for creating indexing system components
 * with sensible defaults and configurations.
 */
export class IndexingSystemFactory {
  /**
   * Create a new IndexManager with default configuration
   */
  static createIndexManager(
    options?: Partial<import('../types/indexing').IndexManagerOptions>
  ): IndexManager {
    return new IndexManager(options);
  }

  /**
   * Create a new SearchEngine with default configuration
   */
  static createSearchEngine(
    options?: Partial<import('../types/indexing').SearchEngineOptions>
  ): SearchEngine {
    return new SearchEngine(options);
  }

  /**
   * Create a new IndexBuilder with default configuration
   */
  static createIndexBuilder(
    options?: Partial<import('../types/indexing').IndexBuilderOptions>
  ): IndexBuilder {
    return new IndexBuilder(options);
  }

  /**
   * Create a new IndexValidator with default configuration
   */
  static createIndexValidator(options?: Record<string, unknown>): IndexValidator {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new IndexValidator(options as any);
  }

  /**
   * Create a new IndexOptimizer with default configuration
   */
  static createIndexOptimizer(options?: Record<string, unknown>): IndexOptimizer {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new IndexOptimizer(options as any);
  }

  /**
   * Create a new IndexCleanup with default configuration
   */
  static createIndexCleanup(options?: Record<string, unknown>): IndexCleanup {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new IndexCleanup(options as any);
  }
}

/**
 * Default Indexing System Configuration
 *
 * Provides sensible defaults for the indexing system components
 */
export const DEFAULT_INDEXING_CONFIG = {
  indexManager: {
    autoMaintenance: true,
    maintenanceInterval: 24 * 60 * 60 * 1000, // 24 hours
    config: {
      autoUpdate: true,
      updateInterval: 60 * 60 * 1000, // 1 hour
      maxIndexSize: 1000,
      compression: true,
      storagePath: './index-storage',
      enableSearch: true,
      searchConfig: {
        fullTextSearch: true,
        maxSearchIndexSize: 10000,
        searchCacheSize: 100,
      },
    },
    searchOptions: {
      enableCaching: true,
      cacheSize: 100,
      enableFuzzySearch: true,
      enableRegexSearch: true,
      maxResults: 100,
      defaultSortBy: 'score',
    },
    builderOptions: {
      forceRebuild: false,
      includeMetadata: true,
      parallelProcessing: true,
      maxConcurrency: 4,
      onProgress: () => {},
    },
  },
  searchEngine: {
    enableCaching: true,
    cacheSize: 100,
    enableFuzzySearch: true,
    enableRegexSearch: true,
    maxResults: 100,
    defaultSortBy: 'score',
  },
  indexBuilder: {
    forceRebuild: false,
    includeMetadata: true,
    parallelProcessing: true,
    maxConcurrency: 4,
    onProgress: () => {},
  },
  validator: {
    strictMode: false,
    maxErrors: 100,
    enableWarnings: true,
    validateMetadata: true,
    validateStructure: true,
    validateConsistency: true,
  },
  optimizer: {
    enableCompression: true,
    enableDeduplication: true,
    enableCaching: true,
    compressionLevel: 6,
    maxOptimizationTime: 30000,
    enableParallelOptimization: true,
  },
  cleanup: {
    enableOrphanCleanup: true,
    enableDuplicateCleanup: true,
    enableStaleCleanup: true,
    staleThresholdDays: 30,
    maxCleanupItems: 1000,
  },
} as const;

/**
 * Indexing System Version
 */
export const INDEXING_SYSTEM_VERSION = '1.0.0';

/**
 * Indexing System Information
 */
export const INDEXING_SYSTEM_INFO = {
  version: INDEXING_SYSTEM_VERSION,
  name: 'AST Parser Indexing System',
  description:
    'Comprehensive indexing system for managing and searching parsed project information',
  components: [
    'ProjectIndex',
    'GlobalIndex',
    'IndexBuilder',
    'SearchEngine',
    'IndexManager',
    'IndexValidator',
    'IndexOptimizer',
    'IndexCleanup',
  ],
  features: [
    'Project indexing and management',
    'Global project search and filtering',
    'Full-text search with fuzzy matching',
    'Index validation and integrity checking',
    'Index optimization and compression',
    'Automatic cleanup and maintenance',
    'Caching and performance optimization',
    'Event-driven architecture',
  ],
} as const;

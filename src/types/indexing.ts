/**
 * Indexing system types and interfaces
 */

import { ProjectType, Language } from './core';

/**
 * Index entry for a project
 */
export interface ProjectIndexEntry {
  /** Unique project identifier */
  id: string;
  /** Project name */
  name: string;
  /** Project type */
  type: ProjectType;
  /** Project root path */
  rootPath: string;
  /** Project version */
  version: string;
  /** Project description */
  description?: string;
  /** Project author */
  author?: string;
  /** Project repository URL */
  repository?: string;
  /** Project languages */
  languages: Language[];
  /** Project tags */
  tags: string[];
  /** Last analysis date */
  lastAnalyzed: Date;
  /** Last modified date */
  lastModified: Date;
  /** Project size in bytes */
  size: number;
  /** Number of files */
  fileCount: number;
  /** Number of lines of code */
  linesOfCode: number;
  /** Project metadata */
  metadata: Record<string, unknown>;
}

/**
 * Version index entry
 */
export interface VersionIndexEntry {
  /** Version identifier */
  id: string;
  /** Version string */
  version: string;
  /** Version type */
  type: 'semantic' | 'timestamp' | 'branch' | 'custom';
  /** Branch name */
  branch?: string;
  /** Commit hash */
  commitHash?: string;
  /** Version creation date */
  createdAt: Date;
  /** Version metadata */
  metadata: Record<string, unknown>;
}

/**
 * Branch index entry
 */
export interface BranchIndexEntry {
  /** Branch name */
  name: string;
  /** Branch type */
  type: 'main' | 'develop' | 'feature' | 'hotfix' | 'release' | 'other';
  /** Is active branch */
  isActive: boolean;
  /** Last commit date */
  lastCommit: Date;
  /** Commit count */
  commitCount: number;
  /** Branch metadata */
  metadata: Record<string, unknown>;
}

/**
 * Individual project index
 */
export interface ProjectIndex {
  /** Project entry */
  project: ProjectIndexEntry;
  /** Version history */
  versions: VersionIndexEntry[];
  /** Branch information */
  branches: BranchIndexEntry[];
  /** Current version */
  currentVersion: VersionIndexEntry | undefined;
  /** Active branch */
  activeBranch: BranchIndexEntry | undefined;
  /** Index creation date */
  createdAt: Date;
  /** Index last updated */
  updatedAt: Date;
  /** Index metadata */
  metadata: Record<string, unknown>;
}

/**
 * Global project index
 */
export interface GlobalProjectIndex {
  /** All project entries */
  projects: ProjectIndexEntry[];
  /** Index statistics */
  statistics: ProjectStatistics;
  /** Index creation date */
  createdAt: Date;
  /** Index last updated */
  updatedAt: Date;
  /** Index metadata */
  metadata: Record<string, unknown>;
}

/**
 * Project statistics
 */
export interface ProjectStatistics {
  /** Total number of projects */
  totalProjects: number;
  /** Projects by type */
  projectsByType: Record<ProjectType, number>;
  /** Projects by language */
  projectsByLanguage: Record<Language, number>;
  /** Total size in bytes */
  totalSize: number;
  /** Total files */
  totalFiles: number;
  /** Total lines of code */
  totalLinesOfCode: number;
  /** Average project size */
  averageProjectSize: number;
  /** Average files per project */
  averageFilesPerProject: number;
  /** Average lines per project */
  averageLinesPerProject: number;
}

/**
 * Search query interface
 */
export interface SearchQuery {
  /** Search criteria */
  criteria: {
    /** Project name pattern */
    name?: string;
    /** Project type */
    type?: ProjectType;
    /** Project language */
    language?: Language;
    /** Project tags */
    tags?: string[];
    /** Path pattern */
    path?: string;
    /** Version pattern */
    version?: string;
    /** Branch name */
    branch?: string;
    /** Author name */
    author?: string;
    /** Repository URL pattern */
    repository?: string;
  };
  /** Search options */
  options: {
    /** Case sensitive search */
    caseSensitive?: boolean;
    /** Exact match */
    exactMatch?: boolean;
    /** Include metadata in search */
    includeMetadata?: boolean;
    /** Result limit */
    limit?: number;
    /** Result offset */
    offset?: number;
    /** Sort field */
    sortBy?: 'name' | 'type' | 'lastModified' | 'size' | 'fileCount' | 'linesOfCode';
    /** Sort order */
    sortOrder?: 'asc' | 'desc';
  };
}

/**
 * Search result interface
 */
export interface SearchResult {
  /** Project entry */
  project: ProjectIndexEntry;
  /** Match score (0-1) */
  score: number;
  /** Match reasons */
  matchReasons: string[];
  /** Highlighted fields */
  highlights: Record<string, string[]>;
}

/**
 * Project filters for listing
 */
export interface ProjectFilters {
  /** Filter by project type */
  type?: ProjectType;
  /** Filter by language */
  language?: Language;
  /** Filter by tags */
  tags?: string[];
  /** Filter by author */
  author?: string;
  /** Filter by date range */
  dateRange?: {
    from: Date;
    to: Date;
  };
  /** Filter by size range */
  sizeRange?: {
    min: number;
    max: number;
  };
  /** Filter by file count range */
  fileCountRange?: {
    min: number;
    max: number;
  };
}

/**
 * Index configuration
 */
export interface IndexConfig {
  /** Auto-update indexes */
  autoUpdate: boolean;
  /** Update interval in minutes */
  updateInterval: number;
  /** Maximum index size in bytes */
  maxIndexSize: number;
  /** Compress index files */
  compression: boolean;
  /** Index storage path */
  storagePath: string;
  /** Enable search indexing */
  enableSearch: boolean;
  /** Search index configuration */
  searchConfig: {
    /** Enable full-text search */
    fullTextSearch: boolean;
    /** Search index size limit */
    maxSearchIndexSize: number;
    /** Search result cache size */
    searchCacheSize: number;
  };
}

/**
 * Index validation result
 */
export interface ValidationResult {
  /** Is index valid */
  isValid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationWarning[];
  /** Validation statistics */
  statistics: {
    /** Total entries checked */
    totalEntries: number;
    /** Valid entries */
    validEntries: number;
    /** Invalid entries */
    invalidEntries: number;
    /** Orphaned entries */
    orphanedEntries: number;
  };
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error type */
  type: 'missing_file' | 'invalid_data' | 'corrupted_entry' | 'orphaned_entry';
  /** Error message */
  message: string;
  /** Affected entry ID */
  entryId?: string;
  /** Error details */
  details: Record<string, unknown>;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning type */
  type: 'outdated_entry' | 'large_entry' | 'duplicate_entry' | 'suspicious_entry';
  /** Warning message */
  message: string;
  /** Affected entry ID */
  entryId?: string;
  /** Warning details */
  details: Record<string, unknown>;
}

/**
 * Index optimization result
 */
export interface OptimizationResult {
  /** Optimization performed */
  optimizations: OptimizationType[];
  /** Performance improvements */
  improvements: {
    /** Size reduction in bytes */
    sizeReduction: number;
    /** Performance improvement percentage */
    performanceImprovement: number;
    /** Memory usage reduction */
    memoryReduction: number;
  };
  /** Optimization statistics */
  statistics: {
    /** Entries processed */
    entriesProcessed: number;
    /** Entries optimized */
    entriesOptimized: number;
    /** Time taken in milliseconds */
    timeTaken: number;
  };
}

/**
 * Optimization type
 */
export type OptimizationType =
  | 'compression'
  | 'deduplication'
  | 'cleanup'
  | 'reindexing'
  | 'sorting'
  | 'indexing';

/**
 * Index cleanup result
 */
export interface CleanupResult {
  /** Cleanup operations performed */
  operations: CleanupOperation[];
  /** Cleanup statistics */
  statistics: {
    /** Entries processed */
    entriesProcessed: number;
    /** Entries removed */
    entriesRemoved: number;
    /** Space freed in bytes */
    spaceFreed: number;
    /** Time taken in milliseconds */
    timeTaken: number;
  };
}

/**
 * Cleanup operation
 */
export interface CleanupOperation {
  /** Operation type */
  type: 'remove_orphaned' | 'remove_outdated' | 'remove_duplicates' | 'compress';
  /** Operation description */
  description: string;
  /** Entries affected */
  entriesAffected: number;
  /** Space freed */
  spaceFreed: number;
}

/**
 * Index builder options
 */
export interface IndexBuilderOptions {
  /** Force rebuild */
  forceRebuild: boolean;
  /** Include metadata */
  includeMetadata: boolean;
  /** Parallel processing */
  parallelProcessing: boolean;
  /** Max concurrent operations */
  maxConcurrency: number;
  /** Progress callback */
  onProgress?: (progress: IndexBuildProgress) => void;
}

/**
 * Index build progress
 */
export interface IndexBuildProgress {
  /** Current step */
  step: string;
  /** Progress percentage */
  progress: number;
  /** Current item */
  currentItem?: string;
  /** Items processed */
  itemsProcessed: number;
  /** Total items */
  totalItems: number;
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
}

/**
 * Search engine options
 */
export interface SearchEngineOptions {
  /** Enable fuzzy search */
  fuzzySearch: boolean;
  /** Fuzzy search threshold */
  fuzzyThreshold: number;
  /** Enable regex search */
  regexSearch: boolean;
  /** Case sensitive by default */
  caseSensitive: boolean;
  /** Max results */
  maxResults: number;
  /** Result cache size */
  cacheSize: number;
  /** Cache TTL in milliseconds */
  cacheTTL: number;
}

/**
 * Index manager options
 */
export interface IndexManagerOptions {
  /** Index configuration */
  config: IndexConfig;
  /** Search engine options */
  searchOptions: SearchEngineOptions;
  /** Index builder options */
  builderOptions: IndexBuilderOptions;
  /** Enable auto-maintenance */
  autoMaintenance: boolean;
  /** Maintenance interval in minutes */
  maintenanceInterval: number;
}

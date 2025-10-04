/**
 * Versioning system types
 *
 * This module defines all the types and interfaces needed for the versioning system,
 * including versioning strategies, version comparison, change detection, and storage abstraction.
 */

import { ProjectAnalysisOutput } from './project';

/**
 * Base versioning strategy interface
 */
export interface BaseVersioningStrategy {
  /**
   * Generate a version identifier based on the strategy
   */
  generateVersion(metadata: VersionMetadata): Promise<string>;

  /**
   * Parse a version string to extract metadata
   */
  parseVersion(version: string): Promise<VersionMetadata>;

  /**
   * Compare two versions and return the relationship
   */
  compareVersions(version1: string, version2: string): Promise<VersionComparison>;

  /**
   * Get the strategy name
   */
  getStrategyName(): string;

  /**
   * Validate if a version string is valid for this strategy
   */
  isValidVersion(version: string): boolean;
}

/**
 * Version metadata interface
 */
export interface VersionMetadata {
  /**
   * The version string
   */
  version: string;

  /**
   * Version creation timestamp
   */
  createdAt: string;

  /**
   * Version strategy used
   */
  strategy?: string;

  /**
   * Project name
   */
  projectName?: string;

  /**
   * Project path
   */
  projectPath?: string;

  /**
   * Version description
   */
  description?: string;

  /**
   * Version author
   */
  author?: string;

  /**
   * Version tags
   */
  tags: string[];

  /**
   * Branch information (for branch-based versioning)
   */
  branch?: BranchInfo;

  /**
   * Commit information (for git-based versioning)
   */
  commit?: CommitInfo;

  /**
   * Change information (for change-based versioning)
   */
  changes?: ChangeInfo;

  /**
   * Semantic version components (for semantic versioning)
   */
  semantic?: SemanticVersionInfo;

  /**
   * Timestamp information (for timestamp-based versioning)
   */
  timestamp?: TimestampInfo;

  /**
   * Custom version data (for custom versioning)
   */
  custom?: CustomVersionInfo;
}

/**
 * Branch information
 */
export interface BranchInfo {
  /**
   * Branch name
   */
  name: string;

  /**
   * Branch type (main, feature, develop, etc.)
   */
  type: 'main' | 'feature' | 'develop' | 'release' | 'hotfix' | 'custom';

  /**
   * Branch description
   */
  description?: string;

  /**
   * Branch protection rules
   */
  protection?: BranchProtection;
}

/**
 * Branch protection rules
 */
export interface BranchProtection {
  /**
   * Require pull request reviews
   */
  requirePullRequestReviews: boolean;

  /**
   * Require status checks
   */
  requireStatusChecks: boolean;

  /**
   * Require up-to-date branches
   */
  requireUpToDateBranches: boolean;

  /**
   * Restrict pushes
   */
  restrictPushes: boolean;
}

/**
 * Commit information
 */
export interface CommitInfo {
  /**
   * Commit hash
   */
  hash: string;

  /**
   * Commit message
   */
  message: string;

  /**
   * Commit author
   */
  author: string;

  /**
   * Commit date
   */
  date: string;

  /**
   * Parent commit hashes
   */
  parents: string[];

  /**
   * Files changed in this commit
   */
  filesChanged: string[];
}

/**
 * Change information
 */
export interface ChangeInfo {
  /**
   * List of changed files
   */
  filesChanged: string[];

  /**
   * Types of changes
   */
  changeTypes: ChangeType[];

  /**
   * Total number of changes
   */
  changeCount: number;

  /**
   * Hash of all changes
   */
  changeHash: string;

  /**
   * Change categories
   */
  categories: ChangeCategory[];
}

/**
 * Change type enumeration
 */
export type ChangeType = 'added' | 'modified' | 'deleted' | 'renamed' | 'moved';

/**
 * Change category enumeration
 */
export type ChangeCategory =
  | 'breaking'
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'chore';

/**
 * Semantic version information
 */
export interface SemanticVersionInfo {
  /**
   * Major version number
   */
  major: number;

  /**
   * Minor version number
   */
  minor: number;

  /**
   * Patch version number
   */
  patch: number;

  /**
   * Pre-release identifier
   */
  prerelease?: string;

  /**
   * Build identifier
   */
  build?: string;

  /**
   * Full semantic version string
   */
  full: string;
}

/**
 * Timestamp information
 */
export interface TimestampInfo {
  /**
   * ISO timestamp
   */
  iso: string;

  /**
   * Unix timestamp
   */
  unix: number;

  /**
   * Human-readable format
   */
  readable: string;

  /**
   * Timezone information
   */
  timezone?: string;
}

/**
 * Custom version information
 */
export interface CustomVersionInfo {
  /**
   * Custom version identifier
   */
  identifier?: string;

  /**
   * Custom prefix
   */
  prefix?: string;

  /**
   * Custom suffix
   */
  suffix?: string;

  /**
   * Custom separator
   */
  separator?: string;

  /**
   * Custom metadata - flexible object for any custom data
   */
  [key: string]: unknown;
}

/**
 * Custom versioning configuration
 */
export interface CustomVersioningConfig {
  /**
   * Custom pattern for version generation
   */
  pattern?: string;

  /**
   * Validation regex for versions
   */
  validation?: RegExp;

  /**
   * Custom version generation function
   */
  generateFunction?: (metadata: VersionMetadata) => string;

  /**
   * Custom version parsing function
   */
  parseFunction?: (version: string) => Record<string, unknown> | null;

  /**
   * Custom version comparison function
   */
  compareFunction?: (
    version1: string,
    version2: string
  ) => {
    result: 'greater' | 'less' | 'equal' | 'incompatible';
    difference?: number;
  };

  /**
   * Custom validation function
   */
  validationFunction?: (version: string) => boolean;
}

/**
 * Version information interface
 */
export interface VersionInfo {
  /**
   * Unique version identifier
   */
  id: string;

  /**
   * Version string
   */
  version: string;

  /**
   * Version metadata
   */
  metadata: VersionMetadata;

  /**
   * Project analysis data
   */
  data: ProjectAnalysisOutput;

  /**
   * Version creation timestamp
   */
  createdAt: string;

  /**
   * Version last update timestamp
   */
  updatedAt: string;
}

/**
 * Version comparison result
 */
export interface VersionComparison {
  /**
   * Comparison result
   */
  result: 'greater' | 'less' | 'equal' | 'incompatible';

  /**
   * Numeric difference (for semantic versions)
   */
  difference?: number;

  /**
   * Comparison details
   */
  details: ComparisonDetails;

  /**
   * Summary of changes
   */
  summary?: {
    totalChanges: number;
    newFeatures: number;
    breakingChanges: number;
    bugFixes: number;
  };

  /**
   * Recommendations
   */
  recommendations?: {
    migrationGuide: string;
    testingStrategy: string;
    documentationUpdates: string[];
  };
}

/**
 * Comparison details
 */
export interface ComparisonDetails {
  /**
   * Whether versions are compatible
   */
  compatible: boolean;

  /**
   * Breaking changes detected
   */
  breakingChanges: boolean;

  /**
   * New features detected
   */
  newFeatures: boolean;

  /**
   * Bug fixes detected
   */
  bugFixes: boolean;

  /**
   * Detailed comparison information
   */
  information: string;
}

/**
 * Version diff interface
 */
export interface VersionDiff {
  /**
   * Breaking changes
   */
  breakingChanges: BreakingChange[];

  /**
   * New features
   */
  newFeatures: Feature[];

  /**
   * Bug fixes
   */
  bugFixes: BugFix[];

  /**
   * Deprecated items
   */
  deprecated: DeprecatedItem[];

  /**
   * Summary of changes
   */
  summary: DiffSummary;
}

/**
 * Breaking change information
 */
export interface BreakingChange {
  /**
   * Change type
   */
  type: 'api' | 'behavior' | 'dependency' | 'configuration';

  /**
   * Change description
   */
  description: string;

  /**
   * Affected files or components
   */
  affected: string[];

  /**
   * Migration guide
   */
  migrationGuide?: string;

  /**
   * Severity level
   */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Feature information
 */
export interface Feature {
  /**
   * Feature name
   */
  name: string;

  /**
   * Feature description
   */
  description: string;

  /**
   * Feature type
   */
  type: 'api' | 'behavior' | 'ui' | 'performance' | 'security';

  /**
   * Implementation files
   */
  files: string[];

  /**
   * Usage examples
   */
  examples?: string[];
}

/**
 * Bug fix information
 */
export interface BugFix {
  /**
   * Bug description
   */
  description: string;

  /**
   * Bug type
   */
  type: 'crash' | 'performance' | 'security' | 'behavior' | 'ui';

  /**
   * Fixed files
   */
  files: string[];

  /**
   * Fix details
   */
  details: string;
}

/**
 * Deprecated item information
 */
export interface DeprecatedItem {
  /**
   * Item name
   */
  name: string;

  /**
   * Deprecation reason
   */
  reason: string;

  /**
   * Replacement suggestion
   */
  replacement?: string;

  /**
   * Deprecation date
   */
  deprecatedAt: string;

  /**
   * Removal date
   */
  removalDate?: string;
}

/**
 * Diff summary
 */
export interface DiffSummary {
  /**
   * Total number of changes
   */
  totalChanges: number;

  /**
   * Number of breaking changes
   */
  breakingChanges: number;

  /**
   * Number of new features
   */
  newFeatures: number;

  /**
   * Number of bug fixes
   */
  bugFixes: number;

  /**
   * Number of deprecated items
   */
  deprecated: number;

  /**
   * Files added
   */
  filesAdded: string[];

  /**
   * Files modified
   */
  filesModified: string[];

  /**
   * Files deleted
   */
  filesDeleted: string[];
}

/**
 * Diff report interface
 */
export interface DiffReport {
  /**
   * Diff format
   */
  format: string;

  /**
   * Diff content
   */
  content: string;

  /**
   * Diff metadata
   */
  metadata: {
    generatedAt: string;
    version1: string;
    version2: string;
    totalChanges: number;
  };
}

/**
 * Change detector interface
 */
export interface ChangeDetector {
  /**
   * Detect changes between two versions
   */
  detectChanges(oldVersion: string, newVersion: string): Promise<VersionDiff>;

  /**
   * Detect file changes
   */
  detectFileChanges(oldFiles: string[], newFiles: string[]): Promise<FileChange[]>;

  /**
   * Detect API changes
   */
  detectAPIChanges(
    oldAPI: ProjectAnalysisOutput,
    newAPI: ProjectAnalysisOutput
  ): Promise<APIChange[]>;

  /**
   * Detect breaking changes
   */
  detectBreakingChanges(diff: VersionDiff): Promise<BreakingChange[]>;
}

/**
 * File change information
 */
export interface FileChange {
  /**
   * File path
   */
  path: string;

  /**
   * Change type
   */
  type: ChangeType;

  /**
   * Change details
   */
  details: string;

  /**
   * Lines changed
   */
  linesChanged?: number;

  /**
   * Change hash
   */
  hash: string;
}

/**
 * API change information
 */
export interface APIChange {
  /**
   * API name
   */
  name: string;

  /**
   * Change type
   */
  type: 'added' | 'removed' | 'modified' | 'deprecated';

  /**
   * Change description
   */
  description: string;

  /**
   * Affected files
   */
  files: string[];

  /**
   * Breaking change indicator
   */
  breaking: boolean;
}

/**
 * Storage abstraction interface
 */
export interface BaseStorage {
  /**
   * Store version data
   */
  store(version: string, data: ProjectAnalysisOutput): Promise<void>;

  /**
   * Retrieve version data
   */
  retrieve(version: string): Promise<ProjectAnalysisOutput | null>;

  /**
   * List all versions
   */
  listVersions(): Promise<string[]>;

  /**
   * Delete version data
   */
  delete(version: string): Promise<void>;

  /**
   * Check if version exists
   */
  exists(version: string): Promise<boolean>;

  /**
   * Get storage information
   */
  getInfo(): Promise<StorageInfo>;
}

/**
 * Storage information
 */
export interface StorageInfo {
  /**
   * Storage type
   */
  type: 'local' | 'remote' | 'database';

  /**
   * Storage path or URL
   */
  path: string;

  /**
   * Storage capacity
   */
  capacity?: number;

  /**
   * Used space
   */
  used?: number;

  /**
   * Available space
   */
  available?: number;

  /**
   * Storage metadata
   */
  metadata: Record<string, unknown>;
}

/**
 * Version manager interface
 */
export interface VersionManager {
  /**
   * Set versioning strategy
   */
  setStrategy(strategy: BaseVersioningStrategy): void;

  /**
   * Get current strategy
   */
  getStrategy(): BaseVersioningStrategy;

  /**
   * Create a new version
   */
  createVersion(metadata: VersionMetadata): Promise<string>;

  /**
   * Compare two versions
   */
  compareVersions(version1: string, version2: string): Promise<VersionComparison>;

  /**
   * Generate version diff
   */
  generateDiff(version1: string, version2: string): Promise<VersionDiff>;

  /**
   * Get version history
   */
  getVersionHistory(): Promise<VersionMetadata[]>;

  /**
   * Get latest version
   */
  getLatestVersion(): Promise<string>;

  /**
   * Set storage backend
   */
  setStorage(storage: BaseStorage): void;

  /**
   * Get storage backend
   */
  getStorage(): BaseStorage;
}

/**
 * Versioning configuration
 */
export interface VersioningConfig {
  /**
   * Default versioning strategy
   */
  defaultStrategy: string;

  /**
   * Storage configuration
   */
  storage: StorageConfig;

  /**
   * Version retention policy
   */
  retention: RetentionPolicy;

  /**
   * Version comparison settings
   */
  comparison: ComparisonConfig;
}

/**
 * Version storage information
 */
export interface VersionStorage {
  /**
   * Storage ID
   */
  id: string;

  /**
   * Version ID
   */
  versionId: string;

  /**
   * Storage path
   */
  path: string;

  /**
   * Storage metadata
   */
  metadata: {
    storedAt: string;
    size: number;
    checksum: string;
    [key: string]: unknown;
  };
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /**
   * Storage type
   */
  type: 'local' | 'remote' | 'database';

  /**
   * Storage path or URL
   */
  path: string;

  /**
   * Storage options
   */
  options: Record<string, unknown>;
}

/**
 * Retention policy
 */
export interface RetentionPolicy {
  /**
   * Maximum number of versions to keep
   */
  maxVersions: number;

  /**
   * Versions to keep forever
   */
  keepForever: string[];

  /**
   * Auto-cleanup enabled
   */
  autoCleanup: boolean;

  /**
   * Cleanup interval (in days)
   */
  cleanupInterval: number;
}

/**
 * Comparison configuration
 */
export interface ComparisonConfig {
  /**
   * Enable diff generation
   */
  enableDiff: boolean;

  /**
   * Diff format
   */
  diffFormat: 'json' | 'markdown' | 'html';

  /**
   * Include quality metrics
   */
  includeMetrics: boolean;

  /**
   * Include breaking changes
   */
  includeBreakingChanges: boolean;
}

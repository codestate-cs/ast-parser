import { BaseVersioningStrategy } from './strategies/BaseVersioningStrategy';
import { BranchVersioning } from './strategies/BranchVersioning';
import { TimestampVersioning } from './strategies/TimestampVersioning';
import { CustomVersioning } from './strategies/CustomVersioning';
import { VersionComparator } from './comparison/VersionComparator';
import { ProjectAnalysisOutput } from '../types/project';
import {
  VersioningConfig,
  VersionMetadata,
  VersionInfo,
  VersionComparison,
  DiffReport,
  StorageConfig,
} from '../types/versioning';

export interface VersionManagerOptions {
  config?: Partial<VersioningConfig>;
  strategies?: Map<string, BaseVersioningStrategy>;
  storage?: StorageConfig;
}

export interface VersionStorage {
  id: string;
  versionId: string;
  storedAt: string;
  storage: StorageConfig;
  metadata: Record<string, unknown>;
}

export interface VersionUpdateOptions {
  metadata?: Partial<VersionMetadata>;
  description?: string;
  tags?: string[];
}

export interface CleanupOptions {
  maxVersions: number;
  keepForever: string[];
  autoCleanup: boolean;
  cleanupInterval?: number;
}

export interface CleanupResult {
  deletedCount: number;
  keptCount: number;
  errors: string[];
}

export interface VersionQuery {
  strategy?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Main orchestrator for the versioning system
 * Manages different versioning strategies, storage, and comparison operations
 */
export class VersionManager {
  private config: VersioningConfig;
  private strategies: Map<string, BaseVersioningStrategy>;
  private versionStorage: Map<string, VersionStorage>;
  private versionData: Map<string, VersionInfo>;
  private comparator: VersionComparator;

  constructor(options: VersionManagerOptions = {}) {
    this.config = this.mergeDefaultConfig(options.config ?? {});
    this.strategies = this.initializeStrategies(options.strategies);
    this.versionStorage = new Map();
    this.versionData = new Map();
    this.comparator = new VersionComparator();
  }

  /**
   * Create a new version using the specified strategy
   */
  async createVersion(
    projectAnalysis: ProjectAnalysisOutput,
    options: {
      strategy?: string;
      version?: string;
      metadata?: Partial<VersionMetadata>;
    } = {}
  ): Promise<VersionInfo> {
    try {
      if (!projectAnalysis) {
        throw this.createError('Project analysis is required', 'INVALID_PROJECT_ANALYSIS');
      }

      const strategyName = options.strategy ?? this.config.defaultStrategy;
      const strategy = this.strategies.get(strategyName);

      if (!strategy) {
        throw this.createError(`Strategy '${strategyName}' not found`, 'STRATEGY_NOT_FOUND');
      }

      const metadata: VersionMetadata = {
        version: options.version ?? projectAnalysis.project.version,
        createdAt: new Date().toISOString(),
        tags: [],
        strategy: strategyName,
        ...options.metadata,
      };

      const versionString = await strategy.generateVersion(metadata);
      const parsedMetadata = await strategy.parseVersion(versionString);

      const versionInfo: VersionInfo = {
        id: this.generateVersionId(),
        version: versionString,
        metadata: {
          ...parsedMetadata,
          ...metadata,
          projectName: projectAnalysis.project.name,
          projectPath: projectAnalysis.project.rootPath,
        },
        data: projectAnalysis,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return versionInfo;
    } catch (error) {
      this.handleError(error as Error, 'createVersion');
      throw error;
    }
  }

  /**
   * Store a version in the specified storage backend
   */
  async storeVersion(
    versionInfo: VersionInfo,
    storageConfig?: Partial<StorageConfig>
  ): Promise<VersionStorage> {
    try {
      if (!versionInfo) {
        throw this.createError('Version info is required', 'INVALID_VERSION_INFO');
      }

      const storage = this.mergeStorageConfig(storageConfig ?? {});

      // Validate storage type
      const validStorageTypes = ['local', 'remote', 'database'];
      if (!validStorageTypes.includes(storage.type)) {
        throw this.createError(`Invalid storage type: ${storage.type}`, 'INVALID_STORAGE_TYPE');
      }

      const storageId = this.generateStorageId();

      const versionStorage: VersionStorage = {
        id: storageId,
        versionId: versionInfo.id,
        storedAt: new Date().toISOString(),
        storage,
        metadata: {
          version: versionInfo.version,
          strategy: versionInfo.metadata.strategy,
          projectName: versionInfo.metadata.projectName,
        },
      };

      // Store in memory (in a real implementation, this would use actual storage)
      await Promise.resolve(); // Placeholder for actual async storage operation
      this.versionStorage.set(storageId, versionStorage);
      this.versionData.set(versionInfo.id, versionInfo);

      return versionStorage;
    } catch (error) {
      this.handleError(error as Error, 'storeVersion');
      throw error;
    }
  }

  /**
   * Retrieve a version by ID
   */
  async getVersion(versionId: string): Promise<VersionInfo | null> {
    try {
      if (!versionId) {
        throw this.createError('Version ID is required', 'INVALID_VERSION_ID');
      }

      await Promise.resolve(); // Placeholder for actual async retrieval operation
      return this.versionData.get(versionId) ?? null;
    } catch (error) {
      this.handleError(error as Error, 'getVersion');
      throw error;
    }
  }

  /**
   * Retrieve versions based on query criteria
   */
  async getVersions(query: VersionQuery = {}): Promise<VersionInfo[]> {
    try {
      let versions = Array.from(this.versionData.values());

      // Filter by strategy
      if (query.strategy) {
        versions = versions.filter(v => v.metadata.strategy === query.strategy);
      }

      // Filter by metadata
      if (query.metadata) {
        versions = versions.filter(v => {
          return Object.entries(query.metadata ?? {}).every(
            ([key, value]) => (v.metadata as unknown as Record<string, unknown>)[key] === value
          );
        });
      }

      // Filter by tags
      if (query.tags && query.tags.length > 0) {
        versions = versions.filter(v => query.tags?.some(tag => v.metadata.tags?.includes(tag)));
      }

      // Apply pagination
      if (query.offset) {
        versions = versions.slice(query.offset);
      }
      if (query.limit) {
        versions = versions.slice(0, query.limit);
      }

      await Promise.resolve(); // Placeholder for actual async query operation
      return versions;
    } catch (error) {
      this.handleError(error as Error, 'getVersions');
      throw error;
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<VersionComparison> {
    try {
      if (!versionId1 || !versionId2) {
        throw this.createError('Both version IDs are required', 'INVALID_VERSION_IDS');
      }

      const version1 = await this.getVersion(versionId1);
      const version2 = await this.getVersion(versionId2);

      if (!version1 || !version2) {
        throw this.createError('One or both versions not found', 'VERSION_NOT_FOUND');
      }

      const comparisonResult = await this.comparator.compareVersions(version1.data, version2.data);

      // Convert ComparisonResult to VersionComparison
      const versionComparison: VersionComparison = {
        result: 'equal', // Default result
        details: {
          compatible: true,
          breakingChanges: false,
          newFeatures: false,
          bugFixes: false,
          information: 'Version comparison completed',
        },
        summary: comparisonResult.summary,
        recommendations: comparisonResult.recommendations,
      };

      return versionComparison;
    } catch (error) {
      this.handleError(error as Error, 'compareVersions');
      throw error;
    }
  }

  /**
   * Generate diff between two versions
   */
  async generateDiff(
    versionId1: string,
    versionId2: string,
    format: 'json' | 'markdown' | 'html' = 'json'
  ): Promise<DiffReport> {
    try {
      if (!versionId1 || !versionId2) {
        throw this.createError('Both version IDs are required', 'INVALID_VERSION_IDS');
      }

      const version1 = await this.getVersion(versionId1);
      const version2 = await this.getVersion(versionId2);

      if (!version1 || !version2) {
        throw this.createError('One or both versions not found', 'VERSION_NOT_FOUND');
      }

      return await this.comparator.generateDiffReport(version1.data, version2.data, format);
    } catch (error) {
      this.handleError(error as Error, 'generateDiff');
      throw error;
    }
  }

  /**
   * Update version metadata
   */
  async updateVersion(
    versionId: string,
    options: VersionUpdateOptions
  ): Promise<VersionInfo | null> {
    try {
      if (!versionId) {
        throw this.createError('Version ID is required', 'INVALID_VERSION_ID');
      }

      const version = await this.getVersion(versionId);
      if (!version) {
        return null;
      }

      const updatedMetadata: VersionMetadata = {
        ...version.metadata,
        ...options.metadata,
      };

      // Only update description if provided
      if (options.description !== undefined) {
        updatedMetadata.description = options.description;
      }

      // Only update tags if provided
      if (options.tags !== undefined) {
        updatedMetadata.tags = options.tags;
      }

      const updatedVersion: VersionInfo = {
        ...version,
        metadata: updatedMetadata,
        updatedAt: new Date().toISOString(),
      };

      this.versionData.set(versionId, updatedVersion);
      return updatedVersion;
    } catch (error) {
      this.handleError(error as Error, 'updateVersion');
      throw error;
    }
  }

  /**
   * Delete a version
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    try {
      if (!versionId) {
        throw this.createError('Version ID is required', 'INVALID_VERSION_ID');
      }

      const version = await this.getVersion(versionId);
      if (!version) {
        return false;
      }

      // Remove from storage
      for (const [storageId, storage] of this.versionStorage) {
        if (storage.versionId === versionId) {
          this.versionStorage.delete(storageId);
        }
      }

      // Remove from data
      this.versionData.delete(versionId);
      return true;
    } catch (error) {
      this.handleError(error as Error, 'deleteVersion');
      throw error;
    }
  }

  /**
   * Cleanup old versions based on retention policy
   */
  async cleanupVersions(options: CleanupOptions): Promise<CleanupResult> {
    try {
      const versions = Array.from(this.versionData.values());
      const errors: string[] = [];
      let deletedCount = 0;
      let keptCount = 0;

      // Sort by creation date (oldest first)
      versions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Calculate versions to delete
      const versionsToDelete = versions.slice(
        0,
        Math.max(0, versions.length - options.maxVersions)
      );
      const versionsToKeep = versions.slice(Math.max(0, versions.length - options.maxVersions));

      // Delete versions
      for (const version of versionsToDelete) {
        if (
          !options.keepForever.includes(version.id) &&
          !options.keepForever.includes(version.version)
        ) {
          try {
            await this.deleteVersion(version.id);
            deletedCount++;
          } catch (error) {
            errors.push(`Failed to delete version ${version.id}: ${(error as Error).message}`);
          }
        } else {
          keptCount++;
        }
      }

      keptCount += versionsToKeep.length;

      return {
        deletedCount,
        keptCount,
        errors,
      };
    } catch (error) {
      this.handleError(error as Error, 'cleanupVersions');
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VersioningConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<VersioningConfig>): void {
    this.config = this.mergeDefaultConfig(config);
  }

  /**
   * Reset to default configuration
   */
  resetConfig(): void {
    this.config = this.getDefaultConfig();
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get strategy by name
   */
  getStrategy(name: string): BaseVersioningStrategy | null {
    return this.strategies.get(name) ?? null;
  }

  /**
   * Validate strategy configuration
   */
  validateStrategyConfig(strategyName: string, config: unknown): boolean {
    try {
      const strategy = this.strategies.get(strategyName);
      if (!strategy) {
        return false;
      }

      // Basic validation - in a real implementation, this would be more comprehensive
      return typeof config === 'object' && config !== null;
    } catch {
      return false;
    }
  }

  /**
   * Initialize versioning strategies
   */
  private initializeStrategies(
    customStrategies?: Map<string, BaseVersioningStrategy>
  ): Map<string, BaseVersioningStrategy> {
    const strategies = new Map<string, BaseVersioningStrategy>();

    // Add default strategies
    strategies.set('branch', new BranchVersioning());
    strategies.set('timestamp', new TimestampVersioning());
    strategies.set('custom', new CustomVersioning());

    // Add custom strategies if provided
    if (customStrategies) {
      for (const [name, strategy] of customStrategies) {
        strategies.set(name, strategy);
      }
    }

    return strategies;
  }

  /**
   * Merge default configuration with provided config
   */
  private mergeDefaultConfig(config: Partial<VersioningConfig>): VersioningConfig {
    const defaultConfig = this.getDefaultConfig();

    return {
      defaultStrategy: config.defaultStrategy ?? defaultConfig.defaultStrategy,
      storage: {
        ...defaultConfig.storage,
        ...config.storage,
      },
      retention: {
        ...defaultConfig.retention,
        ...config.retention,
      },
      comparison: {
        ...defaultConfig.comparison,
        ...config.comparison,
      },
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): VersioningConfig {
    return {
      defaultStrategy: 'branch',
      storage: {
        type: 'local',
        path: './versions',
        options: {},
      },
      retention: {
        maxVersions: 10,
        keepForever: [],
        autoCleanup: true,
        cleanupInterval: 24,
      },
      comparison: {
        enableDiff: true,
        diffFormat: 'json',
        includeMetrics: true,
        includeBreakingChanges: true,
      },
    };
  }

  /**
   * Merge storage configuration
   */
  private mergeStorageConfig(config: Partial<StorageConfig>): StorageConfig {
    return {
      type: config.type ?? this.config.storage.type,
      path: config.path ?? this.config.storage.path,
      options: {
        ...this.config.storage.options,
        ...config.options,
      },
    };
  }

  /**
   * Generate unique version ID
   */
  private generateVersionId(): string {
    return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique storage ID
   */
  private generateStorageId(): string {
    return `storage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create error with code
   */
  private createError(message: string, code: string): Error {
    return new Error(`${code}: ${message}`);
  }

  /**
   * Handle errors with logging
   */
  private handleError(_error: Error, _method: string): void {
    // Error logging would be implemented here in a real application
    // console.error(`Error in VersionManager.${method}:`, error.message);
  }
}

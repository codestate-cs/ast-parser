import { StorageConfig, VersionInfo, VersionStorage } from '../../types/versioning';

/**
 * Abstract base class for version storage implementations
 * Provides common interface and functionality for all storage backends
 */
export abstract class BaseStorage {
  protected config: StorageConfig;
  protected initialized: boolean = false;

  constructor(config?: Partial<StorageConfig>) {
    this.config = this.mergeConfig(config || {});
  }

  /**
   * Store version information
   */
  abstract store(versionInfo: VersionInfo, config?: Partial<StorageConfig>): Promise<VersionStorage>;

  /**
   * Retrieve version information
   */
  abstract retrieve(versionId: string, config?: Partial<StorageConfig>): Promise<VersionInfo | null>;

  /**
   * Delete version information
   */
  abstract delete(versionId: string, config?: Partial<StorageConfig>): Promise<boolean>;

  /**
   * List all stored versions
   */
  abstract list(config?: Partial<StorageConfig>): Promise<VersionStorage[]>;

  /**
   * Check if version exists
   */
  abstract exists(versionId: string, config?: Partial<StorageConfig>): Promise<boolean>;

  /**
   * Get version metadata
   */
  abstract getMetadata(versionId: string, config?: Partial<StorageConfig>): Promise<any>;

  /**
   * Update version metadata
   */
  abstract updateMetadata(versionId: string, metadata: any, config?: Partial<StorageConfig>): Promise<boolean>;

  /**
   * Cleanup storage
   */
  abstract cleanup(config?: Partial<StorageConfig>): Promise<number>;

  /**
   * Validate storage configuration
   */
  abstract validate(config: StorageConfig): Promise<boolean>;

  /**
   * Initialize storage
   */
  abstract initialize(config: StorageConfig): Promise<void>;

  /**
   * Dispose storage resources
   */
  abstract dispose(): Promise<void>;

  /**
   * Get default configuration
   */
  public getDefaultConfig(): StorageConfig {
    return {
      type: 'local',
      path: './versions',
      options: {}
    };
  }

  /**
   * Merge configuration with defaults
   */
  protected mergeConfig(config: Partial<StorageConfig>): StorageConfig {
    const defaultConfig = this.getDefaultConfig();
    return {
      type: config.type || defaultConfig.type,
      path: config.path || defaultConfig.path,
      options: { ...defaultConfig.options, ...config.options }
    };
  }

  /**
   * Validate configuration format
   */
  public validateConfig(config: any): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    if (!config.type || typeof config.type !== 'string') {
      return false;
    }

    if (!config.path || typeof config.path !== 'string') {
      return false;
    }

    if (config.options && typeof config.options !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * Validate version info
   */
  protected validateVersionInfo(versionInfo: any): boolean {
    if (!versionInfo || typeof versionInfo !== 'object') {
      return false;
    }

    if (!versionInfo.id || typeof versionInfo.id !== 'string') {
      return false;
    }

    if (!versionInfo.version || typeof versionInfo.version !== 'string') {
      return false;
    }

    if (!versionInfo.metadata || typeof versionInfo.metadata !== 'object') {
      return false;
    }

    if (!versionInfo.data) {
      return false;
    }

    if (!versionInfo.createdAt || typeof versionInfo.createdAt !== 'string') {
      return false;
    }

    if (!versionInfo.updatedAt || typeof versionInfo.updatedAt !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Validate version ID
   */
  protected validateVersionId(versionId: any): boolean {
    return versionId && typeof versionId === 'string' && versionId.trim().length > 0;
  }

  /**
   * Create error with context
   */
  protected createError(message: string, code: string, context?: any): Error {
    const error = new Error(message) as any;
    error.code = code;
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  }

  /**
   * Handle errors with logging
   */
  protected handleError(error: Error, operation: string, context?: any): void {
    const errorInfo = {
      operation,
      message: error.message,
      code: (error as any).code || 'UNKNOWN_ERROR',
      context,
      timestamp: new Date().toISOString()
    };

    // Log error (in real implementation, this would use proper logging)
    console.error(`Storage error in ${operation}:`, errorInfo);
  }

  /**
   * Generate storage ID
   */
  protected generateStorageId(versionId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `storage-${versionId}-${timestamp}-${random}`;
  }

  /**
   * Generate storage path
   */
  protected generateStoragePath(versionId: string, config?: Partial<StorageConfig>): string {
    const storageConfig = config ? this.mergeConfig(config) : this.config;
    return `${storageConfig.path}/${versionId}`;
  }

  /**
   * Calculate data size
   */
  protected calculateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Generate checksum for data
   */
  protected generateChecksum(data: any): string {
    try {
      const dataString = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      return 'error';
    }
  }

  /**
   * Create storage metadata
   */
  protected createStorageMetadata(versionInfo: VersionInfo, additionalMetadata?: any): any {
    return {
      storedAt: new Date().toISOString(),
      size: this.calculateDataSize(versionInfo.data),
      checksum: this.generateChecksum(versionInfo.data),
      version: versionInfo.version,
      strategy: versionInfo.metadata.strategy,
      ...additionalMetadata
    };
  }

  /**
   * Check if storage is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw this.createError('Storage not initialized', 'STORAGE_NOT_INITIALIZED');
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<StorageConfig>): void {
    this.config = this.mergeConfig(config);
  }

  /**
   * Check if storage is ready
   */
  public isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get storage statistics
   */
  public async getStatistics(config?: Partial<StorageConfig>): Promise<any> {
    try {
      const versions = await this.list(config);
      
      return {
        totalVersions: versions.length,
        totalSize: versions.reduce((sum, v) => sum + (v.metadata.size || 0), 0),
        averageSize: versions.length > 0 ? 
          versions.reduce((sum, v) => sum + (v.metadata.size || 0), 0) / versions.length : 0,
        oldestVersion: versions.length > 0 ? 
          Math.min(...versions.map(v => new Date(v.metadata.storedAt).getTime())) : null,
        newestVersion: versions.length > 0 ? 
          Math.max(...versions.map(v => new Date(v.metadata.storedAt).getTime())) : null,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this.handleError(error as Error, 'getStatistics');
      throw error;
    }
  }

  /**
   * Batch operations
   */
  public async batchStore(versions: VersionInfo[], config?: Partial<StorageConfig>): Promise<VersionStorage[]> {
    const results: VersionStorage[] = [];
    
    for (const version of versions) {
      try {
        const result = await this.store(version, config);
        results.push(result);
      } catch (error) {
        this.handleError(error as Error, 'batchStore', { versionId: version.id });
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Batch delete operations
   */
  public async batchDelete(versionIds: string[], config?: Partial<StorageConfig>): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const versionId of versionIds) {
      try {
        const result = await this.delete(versionId, config);
        results.push(result);
      } catch (error) {
        this.handleError(error as Error, 'batchDelete', { versionId });
        results.push(false);
      }
    }
    
    return results;
  }

  /**
   * Search versions by metadata
   */
  public async searchVersions(query: any, config?: Partial<StorageConfig>): Promise<VersionStorage[]> {
    try {
      const allVersions = await this.list(config);
      
      return allVersions.filter(version => {
        return this.matchesQuery(version, query);
      });
    } catch (error) {
      this.handleError(error as Error, 'searchVersions');
      throw error;
    }
  }

  /**
   * Check if version matches search query
   */
  protected matchesQuery(version: VersionStorage, query: any): boolean {
    if (!query || typeof query !== 'object') {
      return true;
    }

    for (const [key, value] of Object.entries(query)) {
      if (key === 'versionId') {
        if (version.versionId !== value) {
          return false;
        }
      } else if (key === 'path') {
        if (!version.path.includes(value as string)) {
          return false;
        }
      } else if (key === 'metadata') {
        if (!this.matchesMetadata(version.metadata, value)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if metadata matches query
   */
  protected matchesMetadata(metadata: any, query: any): boolean {
    if (!query || typeof query !== 'object') {
      return true;
    }

    for (const [key, value] of Object.entries(query)) {
      if (metadata[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Export storage data
   */
  public async exportData(config?: Partial<StorageConfig>): Promise<any> {
    try {
      const versions = await this.list(config);
      const statistics = await this.getStatistics(config);
      
      return {
        metadata: {
          exportedAt: new Date().toISOString(),
          storageType: this.config.type,
          version: '1.0.0'
        },
        statistics,
        versions: versions.map(v => ({
          id: v.id,
          versionId: v.versionId,
          path: v.path,
          metadata: v.metadata
        }))
      };
    } catch (error) {
      this.handleError(error as Error, 'exportData');
      throw error;
    }
  }

  /**
   * Import storage data
   */
  public async importData(data: any, _config?: Partial<StorageConfig>): Promise<void> {
    try {
      if (!data || !data.versions || !Array.isArray(data.versions)) {
        throw this.createError('Invalid import data format', 'INVALID_IMPORT_DATA');
      }

      for (const _versionData of data.versions) {
        // This would need to be implemented by concrete storage classes
        // as they need to know how to reconstruct the actual version data
        throw this.createError('Import not implemented', 'IMPORT_NOT_IMPLEMENTED');
      }
    } catch (error) {
      this.handleError(error as Error, 'importData');
      throw error;
    }
  }
}

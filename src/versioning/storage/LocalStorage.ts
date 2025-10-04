import { BaseStorage } from './BaseStorage';
import { VersionInfo, StorageConfig, VersionStorage } from '../../types/versioning';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Local filesystem storage implementation for version data
 */
export class LocalStorage extends BaseStorage {
  private storagePath: string;
  override initialized: boolean = false;

  constructor(config?: Partial<StorageConfig>) {
    super({
      type: 'local',
      path: './versions',
      options: {
        createDirectories: true,
        atomicWrites: true,
        backupEnabled: false,
        compressionEnabled: false
      },
      ...config
    });
    
    this.storagePath = this.config.path;
  }

  /**
   * Initialize the local storage
   */
  async initialize(): Promise<void> {
    try {
      await fs.access(this.storagePath);
    } catch (error) {
      if (this.config.options?.['createDirectories']) {
        await fs.mkdir(this.storagePath, { recursive: true });
      } else {
        throw this.createError('Storage directory does not exist', 'STORAGE_INIT_ERROR', {
          path: this.storagePath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    this.initialized = true;
  }

  /**
   * Store version data to local file
   */
  async store(versionInfo: VersionInfo, _config?: Partial<StorageConfig>): Promise<VersionStorage> {
    this.ensureInitialized();
    
    const filePath = this.getVersionFilePath(versionInfo.id);
    const data = JSON.stringify(versionInfo, null, 2);
    
    try {
      // Create backup if enabled and file exists
      if (this.config.options?.['backupEnabled']) {
        await this.createBackup(filePath);
      }
      
      await fs.writeFile(filePath, data, 'utf8');
      
      const metadata = this.createStorageMetadata(versionInfo);
      return {
        id: this.generateStorageId(versionInfo.id),
        versionId: versionInfo.id,
        path: filePath,
        metadata
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'store', {
        versionId: versionInfo.id,
        path: filePath
      });
      throw errorObj;
    }
  }

  /**
   * Retrieve version data from local file
   */
  async retrieve(versionId: string, _config?: Partial<StorageConfig>): Promise<VersionInfo | null> {
    this.ensureInitialized();
    
    const filePath = this.getVersionFilePath(versionId);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'retrieve', {
        versionId,
        path: filePath
      });
      throw errorObj;
    }
  }

  /**
   * Delete version file
   */
  async delete(versionId: string, _config?: Partial<StorageConfig>): Promise<boolean> {
    this.ensureInitialized();
    
    const filePath = this.getVersionFilePath(versionId);
    
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'delete', {
        versionId,
        path: filePath
      });
      throw errorObj;
    }
  }

  /**
   * List all version files
   */
  async list(_config?: Partial<StorageConfig>): Promise<VersionStorage[]> {
    this.ensureInitialized();
    
    try {
      const files = await fs.readdir(this.storagePath);
      const versionFiles = files.filter((file: string | { name: string }) => {
        const fileName = typeof file === 'string' ? file : file.name;
        const ext = path.extname(fileName);
        return ext === '.json' && !fileName.endsWith('.backup');
      });
      
      const versions: VersionStorage[] = [];
      
      for (const file of versionFiles) {
        const fileName = typeof file === 'string' ? file : (file as { name: string }).name;
        const versionId = path.basename(fileName, '.json');
        const filePath = path.join(this.storagePath, fileName);
        
        try {
          const stats = await fs.stat(filePath);
          versions.push({
            id: this.generateStorageId(versionId),
            versionId,
            path: filePath,
            metadata: {
              storedAt: stats.mtime.toISOString(),
              size: stats.size,
              checksum: await this.generateChecksumFromFile(filePath)
            }
          });
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }
      
      return versions;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'list', {
        path: this.storagePath
      });
      throw errorObj;
    }
  }

  /**
   * Check if version file exists
   */
  async exists(versionId: string, _config?: Partial<StorageConfig>): Promise<boolean> {
    this.ensureInitialized();
    
    const filePath = this.getVersionFilePath(versionId);
    
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(versionId: string, _config?: Partial<StorageConfig>): Promise<any> {
    this.ensureInitialized();
    
    const filePath = this.getVersionFilePath(versionId);
    
    try {
      const stats = await fs.stat(filePath);
      return {
        storedAt: stats.mtime.toISOString(),
        size: stats.size,
        checksum: await this.generateChecksumFromFile(filePath)
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'getMetadata', {
        versionId,
        path: filePath
      });
      throw errorObj;
    }
  }

  /**
   * Update version metadata
   */
  async updateMetadata(versionId: string, metadata: any, _config?: Partial<StorageConfig>): Promise<boolean> {
    this.ensureInitialized();
    
    const filePath = this.getVersionFilePath(versionId);
    
    try {
      const versionInfo = await this.retrieve(versionId);
      if (!versionInfo) {
        throw this.createError('Version not found', 'VERSION_NOT_FOUND');
      }
      versionInfo.metadata = { ...versionInfo.metadata, ...metadata };
      
      await fs.writeFile(filePath, JSON.stringify(versionInfo, null, 2), 'utf8');
      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'updateMetadata', {
        versionId,
        path: filePath
      });
      throw errorObj;
    }
  }

  /**
   * Cleanup old versions based on retention policy
   */
  async cleanup(_config?: Partial<StorageConfig>): Promise<number> {
    this.ensureInitialized();
    
    try {
      const versions = await this.list();
      const now = Date.now();
      let deletedCount = 0;
      
      // Sort by creation time (newest first)
      versions.sort((a, b) => 
        new Date(b.metadata.storedAt).getTime() - new Date(a.metadata.storedAt).getTime()
      );
      
      const keepLatest = 5; // Default value
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days default
      const maxVersions = 10; // Default value
      
      for (let i = keepLatest; i < versions.length; i++) {
        const version = versions[i];
        if (!version) continue;
        
        const versionAge = now - new Date(version.metadata.storedAt).getTime();
        
        if (versionAge > maxAge || versions.length > maxVersions) {
          try {
            await this.delete(version.versionId);
            deletedCount++;
          } catch (error) {
            // Continue with other deletions even if one fails
            continue;
          }
        }
      }
      
      return deletedCount;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'cleanup', {
        config: _config
      });
      throw errorObj;
    }
  }

  /**
   * Validate storage configuration and accessibility
   */
  async validate(_config: StorageConfig): Promise<boolean> {
    const errors: string[] = [];
    
    try {
      await fs.access(this.storagePath);
    } catch (error) {
      errors.push(`Storage path not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return errors.length === 0;
  }

  /**
   * Dispose storage resources
   */
  async dispose(): Promise<void> {
    this.initialized = false;
  }

  /**
   * Export all version data
   */
  override async exportData(): Promise<{
    versions: VersionInfo[];
    metadata: {
      exportedAt: string;
      totalVersions: number;
      storageType: string;
    };
  }> {
    this.ensureInitialized();
    
    try {
      const versions = await this.list();
      const versionData: VersionInfo[] = [];
      
      for (const version of versions) {
        try {
          const data = await this.retrieve(version.versionId);
        if (data) {
          versionData.push(data);
        }
        } catch (error) {
          // Skip versions that can't be read
          continue;
        }
      }
      
      return {
        versions: versionData,
        metadata: {
          exportedAt: new Date().toISOString(),
          totalVersions: versionData.length,
          storageType: 'local'
        }
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'exportData', {
        path: this.storagePath
      });
      throw errorObj;
    }
  }

  /**
   * Import version data
   */
  override async importData(_data: any, _config?: Partial<StorageConfig>): Promise<void> {
    this.ensureInitialized();
    
    // Import not implemented - throw error
    throw this.createError('Import not implemented', 'IMPORT_NOT_IMPLEMENTED');
  }

  /**
   * Get the file path for a version
   */
  private getVersionFilePath(versionId: string): string {
    // Sanitize version ID to be filesystem-safe
    const sanitizedId = versionId.replace(/[^a-zA-Z0-9._-]/g, '_');
    return path.join(this.storagePath, `${sanitizedId}.json`);
  }

  /**
   * Create backup of existing file
   */
  private async createBackup(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      const backupPath = `${filePath}.backup`;
      await fs.copyFile(filePath, backupPath);
    } catch {
      // File doesn't exist, no backup needed
    }
  }

  /**
   * Generate checksum from file content
   */
  private async generateChecksumFromFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return this.generateChecksum(content);
    } catch {
      return '';
    }
  }

  /**
   * Ensure storage is initialized
   */
  override ensureInitialized(): void {
    if (!this.initialized) {
      throw this.createError('Storage not initialized', 'STORAGE_NOT_INITIALIZED');
    }
  }
}

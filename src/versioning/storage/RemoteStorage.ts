import { BaseStorage } from './BaseStorage';
import { VersionInfo, StorageConfig, VersionStorage } from '../../types/versioning';

/**
 * Remote API storage implementation for version data
 */
export class RemoteStorage extends BaseStorage {
  private apiBaseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private retries: number;

  constructor(config?: Partial<StorageConfig>) {
    super({
      type: 'remote',
      path: 'https://api.example.com/versions',
      options: {
        apiKey: undefined,
        timeout: 10000,
        retries: 3,
        compressionEnabled: false,
      },
      ...config,
    });

    this.apiBaseUrl = this.config.path;
    this.apiKey = this.config.options?.['apiKey'] as string;
    this.timeout = (this.config.options?.['timeout'] as number) ?? 10000;
    this.retries = (this.config.options?.['retries'] as number) ?? 3;
  }

  /**
   * Initialize the remote storage
   */
  async initialize(): Promise<void> {
    try {
      const response = await this.makeRequest('GET', '/health');
      if (!response.ok) {
        throw this.createError('Remote storage initialization failed', 'REMOTE_INIT_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'initialize', {
        url: this.apiBaseUrl,
      });
      throw errorObj;
    }

    this.initialized = true;
  }

  /**
   * Store version data to remote API
   */
  async store(versionInfo: VersionInfo, _config?: Partial<StorageConfig>): Promise<VersionStorage> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '', versionInfo as unknown as Record<string, unknown>);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createError('Failed to store version', 'STORE_ERROR', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
      }

      const result = (await response.json()) as {
        id?: string;
        path?: string;
        metadata?: Record<string, unknown>;
      };
      return {
        id: result.id ?? this.generateStorageId(versionInfo.id),
        versionId: versionInfo.id,
        path: result.path ?? `${this.apiBaseUrl}/${versionInfo.id}`,
        metadata: result.metadata ?? (this.createStorageMetadata(versionInfo) as any),
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'store', {
        versionId: versionInfo.id,
      });
      throw errorObj;
    }
  }

  /**
   * Retrieve version data from remote API
   */
  async retrieve(versionId: string, _config?: Partial<StorageConfig>): Promise<VersionInfo | null> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', `/${versionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw this.createError('Failed to retrieve version', 'RETRIEVE_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      return (await response.json()) as VersionInfo;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'retrieve', {
        versionId,
      });
      throw errorObj;
    }
  }

  /**
   * Delete version from remote API
   */
  async delete(versionId: string, _config?: Partial<StorageConfig>): Promise<boolean> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('DELETE', `/${versionId}`);

      if (!response.ok) {
        throw this.createError('Failed to delete version', 'DELETE_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'delete', {
        versionId,
      });
      throw errorObj;
    }
  }

  /**
   * List all versions from remote API
   */
  async list(_config?: Partial<StorageConfig>): Promise<VersionStorage[]> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', '');

      if (!response.ok) {
        throw this.createError('Failed to list versions', 'LIST_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      const result = (await response.json()) as { versions?: VersionStorage[] };
      return result.versions ?? [];
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'list', {
        url: this.apiBaseUrl,
      });
      throw errorObj;
    }
  }

  /**
   * Check if version exists on remote API
   */
  async exists(versionId: string, _config?: Partial<StorageConfig>): Promise<boolean> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('HEAD', `/${versionId}/exists`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get version metadata from remote API
   */
  async getMetadata(
    versionId: string,
    _config?: Partial<StorageConfig>
  ): Promise<Record<string, unknown>> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', `/${versionId}/metadata`);

      if (!response.ok) {
        throw this.createError('Failed to get metadata', 'METADATA_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'getMetadata', {
        versionId,
      });
      throw errorObj;
    }
  }

  /**
   * Update version metadata on remote API
   */
  async updateMetadata(
    versionId: string,
    metadata: Record<string, unknown>,
    _config?: Partial<StorageConfig>
  ): Promise<boolean> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('PATCH', `/${versionId}/metadata`, metadata);

      if (!response.ok) {
        throw this.createError('Failed to update metadata', 'UPDATE_METADATA_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'updateMetadata', {
        versionId,
      });
      throw errorObj;
    }
  }

  /**
   * Cleanup old versions via remote API
   */
  async cleanup(_config?: Partial<StorageConfig>): Promise<number> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/cleanup');

      if (!response.ok) {
        throw this.createError('Failed to cleanup versions', 'CLEANUP_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      const result = (await response.json()) as { deletedCount?: number };
      return result.deletedCount ?? 0;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'cleanup', {
        config: _config,
      });
      throw errorObj;
    }
  }

  /**
   * Validate remote storage configuration and accessibility
   */
  async validate(_config: StorageConfig): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Dispose remote storage resources
   */
  async dispose(): Promise<void> {
    this.initialized = false;
  }

  /**
   * Export all version data from remote API
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
      const response = await this.makeRequest('GET', '/export');

      if (!response.ok) {
        throw this.createError('Failed to export data', 'EXPORT_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      return (await response.json()) as {
        versions: VersionInfo[];
        metadata: {
          exportedAt: string;
          totalVersions: number;
          storageType: string;
        };
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'exportData', {
        url: this.apiBaseUrl,
      });
      throw errorObj;
    }
  }

  /**
   * Import version data via remote API
   */
  override async importData(
    data: Record<string, unknown>,
    _config?: Partial<StorageConfig>
  ): Promise<void> {
    this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', '/import', data);

      if (!response.ok) {
        throw this.createError('Failed to import data', 'IMPORT_ERROR', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      // Import completed successfully
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.handleError(errorObj, 'importData', {
        url: this.apiBaseUrl,
      });
      throw errorObj;
    }
  }

  /**
   * Make HTTP request to remote API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<Response> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError ?? new Error('Request failed after all retries');
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

/**
 * Base versioning strategy abstract class
 * 
 * This abstract class provides the foundation for all versioning strategies,
 * implementing common functionality and ensuring consistent behavior across
 * different versioning approaches.
 */

import { 
  BaseVersioningStrategy as IBaseVersioningStrategy,
  VersionMetadata, 
  VersionComparison,
  VersioningConfig 
} from '../../types/versioning';
import { ErrorHandler, DefaultErrorHandler } from '../../utils/error/ErrorHandler';
import { ErrorSeverity } from '../../utils/error/CustomErrors';

/**
 * Abstract base class for versioning strategies
 */
export abstract class BaseVersioningStrategy implements IBaseVersioningStrategy {
  protected config: VersioningConfig;
  protected errorHandler: ErrorHandler;

  constructor(config?: Partial<VersioningConfig>) {
    this.config = this.mergeWithDefaults(config || {});
    this.errorHandler = new DefaultErrorHandler();
  }

  /**
   * Generate a version identifier based on the strategy
   */
  abstract generateVersion(metadata: VersionMetadata): Promise<string>;

  /**
   * Parse a version string to extract metadata
   */
  abstract parseVersion(version: string): Promise<VersionMetadata>;

  /**
   * Compare two versions and return the relationship
   */
  abstract compareVersions(version1: string, version2: string): Promise<VersionComparison>;

  /**
   * Get the strategy name
   */
  abstract getStrategyName(): string;

  /**
   * Validate if a version string is valid for this strategy
   */
  abstract isValidVersion(version: string): boolean;

  /**
   * Get the current configuration
   */
  getConfig(): VersioningConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  setConfig(config: Partial<VersioningConfig>): void {
    this.config = this.mergeWithDefaults(config);
  }

  /**
   * Validate version metadata
   */
  protected validateMetadata(metadata: VersionMetadata): boolean {
    if (!metadata.version || typeof metadata.version !== 'string') {
      return false;
    }

    if (!metadata.createdAt || typeof metadata.createdAt !== 'string') {
      return false;
    }

    if (!Array.isArray(metadata.tags)) {
      return false;
    }

    // Validate timestamp format
    try {
      new Date(metadata.createdAt);
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Format version string with common patterns
   */
  protected formatVersion(version: string, prefix?: string, suffix?: string): string {
    let formatted = version;

    if (prefix) {
      formatted = `${prefix}${formatted}`;
    }

    if (suffix) {
      formatted = `${formatted}${suffix}`;
    }

    return formatted;
  }

  /**
   * Generate a timestamp string
   */
  protected generateTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Generate a readable timestamp
   */
  protected generateReadableTimestamp(): string {
    return new Date().toLocaleString();
  }

  /**
   * Calculate version difference for numeric versions
   */
  protected calculateNumericDifference(version1: string, version2: string): number {
    const v1 = this.extractNumericVersion(version1);
    const v2 = this.extractNumericVersion(version2);

    if (v1 === null || v2 === null) {
      return 0;
    }

    return v1 - v2;
  }

  /**
   * Extract numeric version from string
   */
  protected extractNumericVersion(version: string): number | null {
    const match = version.match(/(\d+)/);
    return match ? parseInt(match[1]!, 10) : null;
  }

  /**
   * Check if two versions are compatible
   */
  protected areVersionsCompatible(version1: string, version2: string): boolean {
    // Default implementation - can be overridden by subclasses
    return this.isValidVersion(version1) && this.isValidVersion(version2);
  }

  /**
   * Generate comparison details
   */
  protected generateComparisonDetails(
    version1: string, 
    version2: string, 
    result: 'greater' | 'less' | 'equal' | 'incompatible'
  ): VersionComparison['details'] {
    const compatible = this.areVersionsCompatible(version1, version2);
    
    return {
      compatible,
      breakingChanges: result === 'incompatible',
      newFeatures: result === 'greater',
      bugFixes: result === 'greater' && compatible,
      information: this.generateComparisonInformation(version1, version2, result)
    };
  }

  /**
   * Generate comparison information text
   */
  protected generateComparisonInformation(
    version1: string, 
    version2: string, 
    result: 'greater' | 'less' | 'equal' | 'incompatible'
  ): string {
    switch (result) {
      case 'greater':
        return `Version ${version1} is greater than ${version2}`;
      case 'less':
        return `Version ${version1} is less than ${version2}`;
      case 'equal':
        return `Version ${version1} is equal to ${version2}`;
      case 'incompatible':
        return `Version ${version1} is incompatible with ${version2}`;
      default:
        return `Unable to compare ${version1} with ${version2}`;
    }
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(config: Partial<VersioningConfig>): VersioningConfig {
    const defaults: VersioningConfig = {
      defaultStrategy: 'semantic',
      storage: {
        type: 'local',
        path: './versions',
        options: {}
      },
      retention: {
        maxVersions: 10,
        keepForever: [],
        autoCleanup: true,
        cleanupInterval: 30
      },
      comparison: {
        enableDiff: true,
        diffFormat: 'json',
        includeMetrics: true,
        includeBreakingChanges: true
      }
    };

    return {
      ...defaults,
      ...config,
      storage: {
        ...defaults.storage,
        ...config.storage
      },
      retention: {
        ...defaults.retention,
        ...config.retention
      },
      comparison: {
        ...defaults.comparison,
        ...config.comparison
      }
    };
  }

  /**
   * Handle errors with proper logging
   */
  protected handleError(error: Error, context: string): void {
    this.errorHandler.handle(error, {
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date(),
      data: {
        context: `BaseVersioningStrategy.${context}`,
        strategy: this.getStrategyName(),
        config: this.config
      }
    });
  }

  /**
   * Create a standardized error
   */
  protected createError(message: string, code: string): Error {
    const error = new Error(message);
    error.name = `${this.getStrategyName()}VersioningError`;
    (error as any).code = code;
    return error;
  }

  /**
   * Validate configuration
   */
  protected validateConfig(config: VersioningConfig): boolean {
    if (!config.defaultStrategy || typeof config.defaultStrategy !== 'string') {
      return false;
    }

    if (!config.storage || !config.storage.type || !config.storage.path) {
      return false;
    }

    if (!config.retention || typeof config.retention.maxVersions !== 'number') {
      return false;
    }

    if (!config.comparison || typeof config.comparison.enableDiff !== 'boolean') {
      return false;
    }

    return true;
  }

  /**
   * Get strategy-specific options
   */
  protected getStrategyOptions(): Record<string, any> {
    return this.config.storage.options || {};
  }

  /**
   * Set strategy-specific options
   */
  protected setStrategyOptions(options: Record<string, any>): void {
    this.config.storage.options = {
      ...this.config.storage.options,
      ...options
    };
  }

  /**
   * Check if a feature is enabled
   */
  protected isFeatureEnabled(feature: keyof VersioningConfig['comparison']): boolean {
    return Boolean(this.config.comparison[feature]);
  }

  /**
   * Get retention policy
   */
  protected getRetentionPolicy() {
    return this.config.retention;
  }

  /**
   * Check if version should be kept forever
   */
  protected shouldKeepForever(version: string): boolean {
    return this.config.retention.keepForever.includes(version);
  }

  /**
   * Check if auto-cleanup is enabled
   */
  protected isAutoCleanupEnabled(): boolean {
    return this.config.retention.autoCleanup;
  }

  /**
   * Get cleanup interval in days
   */
  protected getCleanupInterval(): number {
    return this.config.retention.cleanupInterval;
  }
}

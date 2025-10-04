import { BaseVersioningStrategy } from './BaseVersioningStrategy';
import {
  VersionMetadata,
  VersionComparison,
  VersioningConfig,
  CustomVersioningConfig,
  CustomVersionInfo
} from '../../types/versioning';

export class CustomVersioning extends BaseVersioningStrategy {
  private customConfig: CustomVersioningConfig;

  constructor(config?: Partial<CustomVersioningConfig>) {
    super();
    this.customConfig = this.mergeCustomDefaults(config || {});
  }

  async generateVersion(metadata: VersionMetadata): Promise<string> {
    try {
      if (!metadata || typeof metadata !== 'object') {
        throw this.createError('Invalid metadata provided', 'INVALID_METADATA');
      }

      // Use custom generate function if provided
      if (this.customConfig.generateFunction) {
        return this.customConfig.generateFunction(metadata);
      }

      // Use pattern-based generation
      if (this.customConfig.pattern) {
        return this.processPattern(metadata);
      }

      // Fallback to basic version
      return metadata.version || '1.0.0';
    } catch (error) {
      this.handleError(error as Error, 'generateVersion');
      throw error;
    }
  }

  async parseVersion(version: string): Promise<VersionMetadata> {
    try {
      if (!version || typeof version !== 'string') {
        return {
          version: version || '',
          createdAt: new Date().toISOString(),
          tags: []
        };
      }

      // Use custom parse function if provided
      if (this.customConfig.parseFunction) {
        try {
          const customData = this.customConfig.parseFunction(version);
          return {
            version,
            createdAt: new Date().toISOString(),
            tags: [],
            custom: customData as CustomVersionInfo
          };
        } catch (error) {
          this.handleError(error as Error, 'parseVersion');
          return {
            version,
            createdAt: new Date().toISOString(),
            tags: []
          };
        }
      }

      // Basic parsing - just return the version
      return {
        version,
        createdAt: new Date().toISOString(),
        tags: []
      };
    } catch (error) {
      this.handleError(error as Error, 'parseVersion');
      return {
        version: version || '',
        createdAt: new Date().toISOString(),
        tags: []
      };
    }
  }

  async compareVersions(version1: string, version2: string): Promise<VersionComparison> {
    try {
      if (!version1 || !version2) {
        return {
          result: 'incompatible',
          details: {
            compatible: false,
            breakingChanges: false,
            newFeatures: false,
            bugFixes: false,
            information: `Cannot compare versions: ${version1} and ${version2}`
          }
        };
      }

      // Use custom compare function if provided
      if (this.customConfig.compareFunction) {
        try {
          const comparison = this.customConfig.compareFunction(version1, version2);
          return {
            result: comparison.result,
            difference: comparison.difference || 0,
            details: {
              compatible: comparison.result !== 'incompatible',
              breakingChanges: false,
              newFeatures: comparison.result === 'greater',
              bugFixes: false,
              information: this.generateComparisonInformation(version1, version2, comparison.result)
            }
          };
        } catch (error) {
          this.handleError(error as Error, 'compareVersions');
          return {
            result: 'incompatible',
            details: {
              compatible: false,
              breakingChanges: false,
              newFeatures: false,
              bugFixes: false,
              information: `Error comparing versions: ${version1} and ${version2}`
            }
          };
        }
      }

      // Basic string comparison
      if (version1 === version2) {
        return {
          result: 'equal',
          difference: 0,
          details: {
            compatible: true,
            breakingChanges: false,
            newFeatures: false,
            bugFixes: false,
            information: `Versions are identical: ${version1}`
          }
        };
      }

      // Simple lexicographic comparison
      const comparison = version1.localeCompare(version2);
      const result = comparison > 0 ? 'greater' : 'less';
      const difference = Math.abs(comparison);

      return {
        result,
        difference,
        details: {
          compatible: true,
          breakingChanges: false,
          newFeatures: result === 'greater',
          bugFixes: false,
          information: this.generateComparisonInformation(version1, version2, result)
        }
      };
    } catch (error) {
      this.handleError(error as Error, 'compareVersions');
      return {
        result: 'incompatible',
        details: {
          compatible: false,
          breakingChanges: false,
          newFeatures: false,
          bugFixes: false,
          information: `Error comparing versions: ${version1} and ${version2}`
        }
      };
    }
  }

  getStrategyName(): string {
    return 'custom';
  }

  isValidVersion(version: string): boolean {
    if (!version || typeof version !== 'string') {
      return false;
    }

    try {
      // Use custom validation function if provided
      if (this.customConfig.validationFunction) {
        try {
          return this.customConfig.validationFunction(version);
        } catch (error) {
          this.handleError(error as Error, 'isValidVersion');
          return false;
        }
      }

      // Use regex validation if provided
      if (this.customConfig.validation) {
        return this.customConfig.validation.test(version);
      }

      // Basic validation - non-empty string
      return version.trim().length > 0;
    } catch (error) {
      this.handleError(error as Error, 'isValidVersion');
      return false;
    }
  }

  override getConfig(): VersioningConfig {
    return {
      defaultStrategy: 'custom',
      storage: {
        type: 'local',
        path: './versions',
        options: {}
      },
      retention: {
        maxVersions: 10,
        keepForever: [],
        autoCleanup: true,
        cleanupInterval: 24
      },
      comparison: {
        enableDiff: true,
        diffFormat: 'json',
        includeMetrics: true,
        includeBreakingChanges: true
      }
    };
  }

  getCustomConfig(): CustomVersioningConfig {
    return { ...this.customConfig };
  }

  setCustomConfig(config: Partial<CustomVersioningConfig>): void {
    this.customConfig = this.mergeCustomDefaults(config);
  }

  /**
   * Process pattern with placeholders
   */
  processPattern(metadata: VersionMetadata): string {
    if (!this.customConfig.pattern) {
      return metadata.version || '1.0.0';
    }

    let pattern = this.customConfig.pattern;
    const custom = (metadata.custom as Record<string, unknown>) || {};

    // Replace placeholders with values from custom metadata
    pattern = pattern.replace(/\{(\w+)\}/g, (match, key) => {
      const value = custom[key];
      if (value !== undefined && value !== null) {
        return String(value);
      }
      return match; // Keep placeholder if value not found
    });

    return pattern;
  }

  /**
   * Merge custom configuration with defaults
   */
  private mergeCustomDefaults(config: Partial<CustomVersioningConfig>): CustomVersioningConfig {
    const result: CustomVersioningConfig = {
      pattern: config.pattern || ''
    };
    
    if (config.validation !== undefined) {
      result.validation = config.validation;
    }
    if (config.generateFunction !== undefined) {
      result.generateFunction = config.generateFunction;
    }
    if (config.parseFunction !== undefined) {
      result.parseFunction = config.parseFunction;
    }
    if (config.compareFunction !== undefined) {
      result.compareFunction = config.compareFunction;
    }
    if (config.validationFunction !== undefined) {
      result.validationFunction = config.validationFunction;
    }
    
    return result;
  }
}

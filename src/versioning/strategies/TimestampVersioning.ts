import { BaseVersioningStrategy } from './BaseVersioningStrategy';
import {
  VersionMetadata,
  VersionComparison,
  TimestampInfo,
  VersioningConfig
} from '../../types/versioning';

/**
 * Configuration options for TimestampVersioning
 */
export interface TimestampVersioningConfig {
  /** Timestamp format */
  format: 'iso' | 'unix' | 'readable';
  /** Precision level */
  precision: 'microsecond' | 'millisecond' | 'second' | 'minute' | 'hour' | 'day';
  /** Timezone for formatting */
  timezone: string;
  /** Version prefix */
  prefix: string;
  /** Version suffix */
  suffix: string;
}

/**
 * Timestamp-based versioning strategy
 * 
 * Generates versions based on timestamps, providing chronological ordering
 * and human-readable time-based versioning.
 */
export class TimestampVersioning extends BaseVersioningStrategy {
  private timestampConfig: TimestampVersioningConfig;

  constructor(config?: Partial<TimestampVersioningConfig>) {
    super();
    this.timestampConfig = this.mergeTimestampDefaults(config || {});
  }

  /**
   * Generate a timestamp-based version
   */
  async generateVersion(metadata: VersionMetadata): Promise<string> {
    try {
      // Validate metadata
      if (!metadata || typeof metadata !== 'object') {
        throw this.createError('Invalid metadata provided', 'INVALID_METADATA');
      }

      // Get timestamp from metadata or use current time
      let timestamp: Date;
      if (metadata.createdAt && this.isValidTimestamp(metadata.createdAt)) {
        timestamp = new Date(metadata.createdAt);
      } else {
        timestamp = new Date();
      }

      // Format timestamp according to configuration
      const formattedTimestamp = this.formatTimestamp(
        timestamp,
        this.timestampConfig.precision,
        this.timestampConfig.format,
        this.timestampConfig.timezone
      );

      // Add prefix and suffix
      let version = formattedTimestamp;
      if (this.timestampConfig.prefix) {
        version = `${this.timestampConfig.prefix}${version}`;
      }
      if (this.timestampConfig.suffix) {
        version = `${version}-${this.timestampConfig.suffix}`;
      }

      return version;
    } catch (error) {
      this.handleError(error as Error, 'generateVersion');
      throw error;
    }
  }

  /**
   * Parse a timestamp-based version string
   */
  async parseVersion(version: string): Promise<VersionMetadata> {
    try {
      if (!this.isValidVersion(version)) {
        return {
          version,
          createdAt: new Date().toISOString(),
          tags: []
        };
      }

      // Extract timestamp from version (remove prefix/suffix)
      const timestamp = this.extractTimestamp(version);
      if (!timestamp) {
        return {
          version,
          createdAt: new Date().toISOString(),
          tags: []
        };
      }

      // Parse timestamp
      const parsedTimestamp = this.parseTimestamp(timestamp, this.timestampConfig.format);
      if (!parsedTimestamp) {
        return {
          version,
          createdAt: new Date().toISOString(),
          tags: []
        };
      }

      // Generate timestamp info
      const timestampInfo: TimestampInfo = {
        iso: parsedTimestamp.toISOString(),
        unix: Math.floor(parsedTimestamp.getTime() / 1000),
        readable: this.timestampConfig.format === 'readable' ? timestamp : this.formatTimestamp(parsedTimestamp, 'second', 'readable', 'UTC'),
        timezone: this.timestampConfig.timezone
      };

      return {
        version,
        createdAt: parsedTimestamp.toISOString(),
        tags: [],
        timestamp: timestampInfo
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

  /**
   * Compare two timestamp-based versions
   */
  async compareVersions(version1: string, version2: string): Promise<VersionComparison> {
    try {
      // Parse both versions
      const metadata1 = await this.parseVersion(version1);
      const metadata2 = await this.parseVersion(version2);

      // Check if both versions have valid timestamps
      if (!metadata1.timestamp || !metadata2.timestamp) {
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

      // Compare timestamps
      const time1 = metadata1.timestamp.unix;
      const time2 = metadata2.timestamp.unix;

      let result: 'greater' | 'less' | 'equal';
      let difference: number | undefined;

      if (time1 > time2) {
        result = 'greater';
        difference = time1 - time2;
      } else if (time1 < time2) {
        result = 'less';
        difference = time2 - time1;
      } else {
        result = 'equal';
        difference = 0;
      }

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

  /**
   * Get the strategy name
   */
  getStrategyName(): string {
    return 'timestamp';
  }

  /**
   * Validate if a version string is valid for this strategy
   */
  isValidVersion(version: string): boolean {
    if (!version || typeof version !== 'string') {
      return false;
    }

    try {
      const timestamp = this.extractTimestamp(version);
      if (!timestamp) {
        return false;
      }

      return this.parseTimestamp(timestamp, this.timestampConfig.format) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration
   */
  override getConfig(): VersioningConfig {
    return {
      defaultStrategy: 'timestamp',
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

  /**
   * Get timestamp-specific configuration
   */
  getTimestampConfig(): TimestampVersioningConfig {
    return { ...this.timestampConfig };
  }

  /**
   * Set timestamp-specific configuration
   */
  setTimestampConfig(config: Partial<TimestampVersioningConfig>): void {
    this.timestampConfig = this.mergeTimestampDefaults(config);
  }

  /**
   * Format timestamp according to configuration
   */
  formatTimestamp(
    date: Date,
    precision: TimestampVersioningConfig['precision'] = 'second',
    format: TimestampVersioningConfig['format'] = 'iso',
    timezone: string = 'UTC'
  ): string {
    try {
      switch (format) {
        case 'iso':
          return this.formatISOTimestamp(date, precision, timezone);
        case 'unix':
          return this.formatUnixTimestamp(date, precision);
        case 'readable':
          return this.formatReadableTimestamp(date, precision, timezone);
        default:
          return this.formatISOTimestamp(date, precision, timezone);
      }
    } catch (error) {
      this.handleError(error as Error, 'formatTimestamp');
      return date.toISOString();
    }
  }

  /**
   * Parse timestamp string
   */
  parseTimestamp(
    timestamp: string | null,
    format: TimestampVersioningConfig['format'] = 'iso'
  ): Date | null {
    if (!timestamp) {
      return null;
    }
    
    try {
      switch (format) {
        case 'iso':
          return this.parseISOTimestamp(timestamp);
        case 'unix':
          return this.parseUnixTimestamp(timestamp);
        case 'readable':
          return this.parseReadableTimestamp(timestamp);
        default:
          return this.parseISOTimestamp(timestamp);
      }
    } catch (error) {
      this.handleError(error as Error, 'parseTimestamp');
      return null;
    }
  }

  /**
   * Format ISO timestamp
   */
  private formatISOTimestamp(
    date: Date,
    precision: TimestampVersioningConfig['precision'],
    _timezone: string
  ): string {
    const isoString = date.toISOString();
    
    switch (precision) {
      case 'microsecond':
        return isoString;
      case 'millisecond':
        return isoString;
      case 'second':
        return isoString.substring(0, 19) + 'Z';
      case 'minute':
        return isoString.substring(0, 16) + 'Z';
      case 'hour':
        return isoString.substring(0, 13) + 'Z';
      case 'day':
        return isoString.substring(0, 10) + 'Z';
      default:
        return isoString.substring(0, 19) + 'Z';
    }
  }

  /**
   * Format Unix timestamp
   */
  private formatUnixTimestamp(
    date: Date,
    precision: TimestampVersioningConfig['precision']
  ): string {
    const timestamp = date.getTime();
    
    switch (precision) {
      case 'microsecond':
        return (timestamp * 1000).toString();
      case 'millisecond':
        return timestamp.toString();
      case 'second':
        return Math.floor(timestamp / 1000).toString();
      case 'minute':
        return Math.floor(timestamp / 60000).toString();
      case 'hour':
        return Math.floor(timestamp / 3600000).toString();
      case 'day':
        return Math.floor(timestamp / 86400000).toString();
      default:
        return Math.floor(timestamp / 1000).toString();
    }
  }

  /**
   * Format readable timestamp
   */
  private formatReadableTimestamp(
    date: Date,
    precision: TimestampVersioningConfig['precision'],
    _timezone: string
  ): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    const minute = String(date.getUTCMinutes()).padStart(2, '0');
    const second = String(date.getUTCSeconds()).padStart(2, '0');
    const millisecond = String(date.getUTCMilliseconds()).padStart(3, '0');
    const microsecond = String(Math.floor(date.getTime() % 1000)).padStart(3, '0');

    switch (precision) {
      case 'microsecond':
        return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}${microsecond}`;
      case 'millisecond':
        return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millisecond}`;
      case 'second':
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
      case 'minute':
        return `${year}-${month}-${day} ${hour}:${minute}`;
      case 'hour':
        return `${year}-${month}-${day} ${hour}`;
      case 'day':
        return `${year}-${month}-${day}`;
      default:
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
  }

  /**
   * Parse ISO timestamp
   */
  private parseISOTimestamp(timestamp: string): Date | null {
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Parse Unix timestamp
   */
  private parseUnixTimestamp(timestamp: string): Date | null {
    try {
      const num = parseInt(timestamp, 10);
      if (isNaN(num)) {
        return null;
      }

      // Handle different Unix timestamp formats
      if (timestamp.length === 10) {
        // Seconds since epoch
        return new Date(num * 1000);
      } else if (timestamp.length === 13) {
        // Milliseconds since epoch
        return new Date(num);
      } else if (timestamp.length === 16) {
        // Microseconds since epoch
        return new Date(num / 1000);
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Parse readable timestamp
   */
  private parseReadableTimestamp(timestamp: string): Date | null {
    try {
      // Handle formats like "2024-01-15 10:30:45" or "2024-01-15 10:30:45.123"
      const match = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/);
      if (!match) {
        return null;
      }

      const [, year, month, day, hour, minute, second, fraction] = match;
      const date = new Date(
        parseInt(year!, 10),
        parseInt(month!, 10) - 1,
        parseInt(day!, 10),
        parseInt(hour!, 10),
        parseInt(minute!, 10),
        parseInt(second!, 10),
        fraction ? parseInt(fraction.padEnd(3, '0').substring(0, 3), 10) : 0
      );

      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Extract timestamp from version string (remove prefix/suffix)
   */
  private extractTimestamp(version: string): string | null {
    try {
      let timestamp = version;

      // Remove prefix
      if (this.timestampConfig.prefix && timestamp.startsWith(this.timestampConfig.prefix)) {
        timestamp = timestamp.substring(this.timestampConfig.prefix.length);
      }

      // Remove suffix
      if (this.timestampConfig.suffix && timestamp.endsWith(`-${this.timestampConfig.suffix}`)) {
        timestamp = timestamp.substring(0, timestamp.length - this.timestampConfig.suffix.length - 1);
      }

      return timestamp;
    } catch {
      return null;
    }
  }

  /**
   * Check if timestamp string is valid
   */
  private isValidTimestamp(timestamp: string): boolean {
    try {
      const date = new Date(timestamp);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Merge configuration with defaults
   */
  private mergeTimestampDefaults(config: Partial<TimestampVersioningConfig>): TimestampVersioningConfig {
    return {
      format: config.format || 'iso',
      precision: config.precision || 'second',
      timezone: config.timezone || 'UTC',
      prefix: config.prefix || '',
      suffix: config.suffix || ''
    };
  }
}

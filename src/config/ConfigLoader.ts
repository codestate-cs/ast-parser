/**
 * @fileoverview Configuration loader
 * Loads configuration from various sources (files, environment variables, etc.)
 */

import { ConfigOptions, LoaderOptions } from './types';
import { DefaultConfig } from './DefaultConfig';
import { ConfigValidator } from './ConfigValidator';
import * as fs from 'fs';

/**
 * Configuration loader class
 * Provides functionality to load configuration from various sources
 */
export class ConfigLoader {
  private validator: ConfigValidator;

  /**
   * Creates a new ConfigLoader instance
   */
  constructor() {
    this.validator = new ConfigValidator();
  }

  /**
   * Loads configuration with default options
   * @param options Loader options
   * @returns Loaded configuration
   */
  load(options: LoaderOptions = {}): ConfigOptions {
    const {
      configFile,
      envPrefix = 'CODESTATE_',
      mergeWithDefaults = true,
      validate = true,
    } = options;

    let config: ConfigOptions;

    // Load from file if specified
    if (configFile) {
      config = this.loadFromFile(configFile);
    } else {
      // Load from environment variables
      config = this.loadFromEnvironment(envPrefix);
    }

    // Merge with defaults if requested
    if (mergeWithDefaults) {
      config = this.mergeWithDefaults(config as unknown as Record<string, unknown>);
    }

    // Validate configuration if requested
    if (validate) {
      const validation = this.validator.validate(config);
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return config;
  }

  /**
   * Loads configuration from a file
   * @param filePath Path to configuration file
   * @returns Loaded configuration
   */
  loadFromFile(filePath: string): ConfigOptions {
    try {
      // In a real implementation, this would read from the file system
      // For now, we'll return a mock configuration
      const content = fs.readFileSync(filePath, 'utf8');

      // Parse JSON configuration
      const config = JSON.parse(content) as ConfigOptions;

      // Validate the loaded configuration
      const validation = this.validator.validate(config);
      if (!validation.isValid) {
        throw new Error(`Configuration file validation failed: ${validation.errors.join(', ')}`);
      }

      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration from file '${filePath}': ${String(error)}`);
    }
  }

  /**
   * Loads configuration from environment variables
   * @param prefix Environment variable prefix
   * @returns Loaded configuration
   */
  loadFromEnvironment(prefix: string = 'CODESTATE_'): ConfigOptions {
    const config: Partial<ConfigOptions> = {};

    // Load analyzer configuration
    config.analyzers = {
      dependency: {
        includeExternal: this.getEnvBoolean(`${prefix}ANALYZERS_DEPENDENCY_INCLUDE_EXTERNAL`, true),
        includeInternal: this.getEnvBoolean(`${prefix}ANALYZERS_DEPENDENCY_INCLUDE_INTERNAL`, true),
        maxDepth: this.getEnvNumber(`${prefix}ANALYZERS_DEPENDENCY_MAX_DEPTH`, 10),
        includeCircular: this.getEnvBoolean(`${prefix}ANALYZERS_DEPENDENCY_INCLUDE_CIRCULAR`, true),
      },
      entryPoint: {
        includeMain: this.getEnvBoolean(`${prefix}ANALYZERS_ENTRY_POINT_INCLUDE_MAIN`, true),
        includeTypes: this.getEnvBoolean(`${prefix}ANALYZERS_ENTRY_POINT_INCLUDE_TYPES`, true),
        includePatterns: this.getEnvBoolean(
          `${prefix}ANALYZERS_ENTRY_POINT_INCLUDE_PATTERNS`,
          true
        ),
        maxEntryPoints: this.getEnvNumber(`${prefix}ANALYZERS_ENTRY_POINT_MAX_ENTRY_POINTS`, 100),
      },
      structure: {
        includeFiles: this.getEnvBoolean(`${prefix}ANALYZERS_STRUCTURE_INCLUDE_FILES`, true),
        includeDirectories: this.getEnvBoolean(
          `${prefix}ANALYZERS_STRUCTURE_INCLUDE_DIRECTORIES`,
          true
        ),
        maxDepth: this.getEnvNumber(`${prefix}ANALYZERS_STRUCTURE_MAX_DEPTH`, 20),
        includeSize: this.getEnvBoolean(`${prefix}ANALYZERS_STRUCTURE_INCLUDE_SIZE`, true),
      },
      complexity: {
        includeCyclomatic: this.getEnvBoolean(
          `${prefix}ANALYZERS_COMPLEXITY_INCLUDE_CYCLOMATIC`,
          true
        ),
        includeCognitive: this.getEnvBoolean(
          `${prefix}ANALYZERS_COMPLEXITY_INCLUDE_COGNITIVE`,
          true
        ),
        includeLinesOfCode: this.getEnvBoolean(
          `${prefix}ANALYZERS_COMPLEXITY_INCLUDE_LINES_OF_CODE`,
          true
        ),
        includeFunctionCount: this.getEnvBoolean(
          `${prefix}ANALYZERS_COMPLEXITY_INCLUDE_FUNCTION_COUNT`,
          true
        ),
        includeClassCount: this.getEnvBoolean(
          `${prefix}ANALYZERS_COMPLEXITY_INCLUDE_CLASS_COUNT`,
          true
        ),
        includeInterfaceCount: this.getEnvBoolean(
          `${prefix}ANALYZERS_COMPLEXITY_INCLUDE_INTERFACE_COUNT`,
          true
        ),
      },
    };

    // Load parser configuration
    config.parsers = {
      typescript: {
        includeTypes: this.getEnvBoolean(`${prefix}PARSERS_TYPESCRIPT_INCLUDE_TYPES`, true),
        includeJSDoc: this.getEnvBoolean(`${prefix}PARSERS_TYPESCRIPT_INCLUDE_JSDOC`, true),
        includeDecorators: this.getEnvBoolean(
          `${prefix}PARSERS_TYPESCRIPT_INCLUDE_DECORATORS`,
          true
        ),
        includeGenerics: this.getEnvBoolean(`${prefix}PARSERS_TYPESCRIPT_INCLUDE_GENERICS`, true),
        maxDepth: this.getEnvNumber(`${prefix}PARSERS_TYPESCRIPT_MAX_DEPTH`, 15),
      },
      enhancedTypeScript: {
        includeAdvancedTypes: this.getEnvBoolean(
          `${prefix}PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_ADVANCED_TYPES`,
          true
        ),
        includeMethodSignatures: this.getEnvBoolean(
          `${prefix}PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_METHOD_SIGNATURES`,
          true
        ),
        includeProperties: this.getEnvBoolean(
          `${prefix}PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_PROPERTIES`,
          true
        ),
        includeParameters: this.getEnvBoolean(
          `${prefix}PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_PARAMETERS`,
          true
        ),
        includeExports: this.getEnvBoolean(
          `${prefix}PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_EXPORTS`,
          true
        ),
        maxDepth: this.getEnvNumber(`${prefix}PARSERS_ENHANCED_TYPESCRIPT_MAX_DEPTH`, 20),
      },
    };

    // Load output configuration
    config.output = {
      formats: {
        default: process.env[`${prefix}OUTPUT_FORMATS_DEFAULT`] ?? 'json',
        available: this.getEnvArray(`${prefix}OUTPUT_FORMATS_AVAILABLE`, [
          'json',
          'xml',
          'yaml',
          'csv',
        ]),
        options: this.getEnvObject(`${prefix}OUTPUT_FORMATS_OPTIONS`, {}),
      },
      naming: {
        default: process.env[`${prefix}OUTPUT_NAMING_DEFAULT`] ?? 'project',
        available: this.getEnvArray(`${prefix}OUTPUT_NAMING_AVAILABLE`, [
          'project',
          'timestamp',
          'version',
          'custom',
        ]),
        options: this.getEnvObject(`${prefix}OUTPUT_NAMING_OPTIONS`, {}),
      },
    };

    // Load global configuration
    config.global = {
      verbose: this.getEnvBoolean(`${prefix}GLOBAL_VERBOSE`, false),
      debug: this.getEnvBoolean(`${prefix}GLOBAL_DEBUG`, false),
      maxProcessingTime: this.getEnvNumber(`${prefix}GLOBAL_MAX_PROCESSING_TIME`, 300000),
      parallel: this.getEnvBoolean(`${prefix}GLOBAL_PARALLEL`, true),
    };

    return config as ConfigOptions;
  }

  /**
   * Merges configuration with defaults
   * @param config Configuration to merge
   * @returns Merged configuration
   */
  private mergeWithDefaults(config: Record<string, unknown>): ConfigOptions {
    return { ...DefaultConfig, ...config } as ConfigOptions;
  }

  /**
   * Gets boolean value from environment variable
   * @param key Environment variable key
   * @param defaultValue Default value
   * @returns Boolean value
   */
  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }

  /**
   * Gets number value from environment variable
   * @param key Environment variable key
   * @param defaultValue Default value
   * @returns Number value
   */
  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Gets array value from environment variable
   * @param key Environment variable key
   * @param defaultValue Default value
   * @returns Array value
   */
  private getEnvArray(key: string, defaultValue: string[]): string[] {
    const value = process.env[key];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    try {
      return JSON.parse(value) as string[];
    } catch {
      return value.split(',').map(item => item.trim());
    }
  }

  /**
   * Gets object value from environment variable
   * @param key Environment variable key
   * @param defaultValue Default value
   * @returns Object value
   */
  private getEnvObject(
    key: string,
    defaultValue: Record<string, unknown>
  ): Record<string, unknown> {
    const value = process.env[key];
    if (value === undefined || value === null) {
      return defaultValue;
    }
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return defaultValue;
    }
  }
}

/**
 * Output management system for project analysis results
 */

import { ProjectInfo, OutputOptions } from '../types';
import { BaseFormat } from './formats/BaseFormat';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Output generation result
 */
export interface OutputResult {
  success: boolean;
  data?: string;
  outputPath?: string;
  stream?: NodeJS.ReadableStream;
  error?: string;
  metadata?: {
    format: string;
    strategy: string;
    size?: number;
    timestamp: Date;
  };
}

/**
 * Output manager for coordinating different output formats and strategies
 */
export class OutputManager {
  private formats: Map<string, BaseFormat> = new Map();
  private defaultOptions: Partial<OutputOptions> = {
    format: 'json',
    strategy: 'file',
    prettyPrint: true,
    encoding: 'utf8',
    compression: 'none',
  };

  /**
   * Register an output format
   */
  public registerFormat(name: string, format: BaseFormat): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Format name must be a non-empty string');
    }
    if (!format) {
      throw new Error('Format instance is required');
    }
    this.formats.set(name.toLowerCase(), format);
  }

  /**
   * Unregister an output format
   */
  public unregisterFormat(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    return this.formats.delete(name.toLowerCase());
  }

  /**
   * Check if a format is registered
   */
  public hasFormat(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }
    return this.formats.has(name.toLowerCase());
  }

  /**
   * Get list of available formats
   */
  public getAvailableFormats(): string[] {
    return Array.from(this.formats.keys());
  }

  /**
   * Generate output for project data
   */
  public async generateOutput(
    data: ProjectInfo,
    options?: Partial<OutputOptions>
  ): Promise<OutputResult> {
    try {
      // Validate input data
      if (!data || typeof data !== 'object') {
        return {
          success: false,
          error: 'Invalid project data provided',
          metadata: {
            format: options?.format ?? this.defaultOptions.format ?? 'unknown',
            strategy: options?.strategy ?? this.defaultOptions.strategy ?? 'unknown',
            timestamp: new Date(),
          },
        };
      }

      // Merge options with defaults
      const mergedOptions = this.mergeOptions(options);

      // Get format
      const format = this.getFormat(mergedOptions.format);
      if (!format) {
        return {
          success: false,
          error: `Unsupported format: ${mergedOptions.format}`,
          metadata: {
            format: mergedOptions.format,
            strategy: mergedOptions.strategy ?? 'file',
            timestamp: new Date(),
          },
        };
      }

      // Validate data with format
      const isValid = await format.validate(data);
      if (!isValid) {
        return {
          success: false,
          error: 'Project data validation failed',
          metadata: {
            format: mergedOptions.format,
            strategy: mergedOptions.strategy ?? 'file',
            timestamp: new Date(),
          },
        };
      }

      // Generate output based on strategy
      const result = await this.executeStrategy(data, format, mergedOptions);

      return {
        success: true,
        ...result,
        metadata: {
          format: mergedOptions.format,
          strategy: mergedOptions.strategy!,
          size: result.data?.length ?? 0,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          format: options?.format ?? this.defaultOptions.format ?? 'unknown',
          strategy: options?.strategy ?? this.defaultOptions.strategy ?? 'unknown',
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Set default options
   */
  public setDefaultOptions(options: Partial<OutputOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Get default options
   */
  public getDefaultOptions(): Partial<OutputOptions> {
    return { ...this.defaultOptions };
  }

  /**
   * Merge provided options with defaults
   */
  private mergeOptions(options?: Partial<OutputOptions>): OutputOptions {
    const merged = { ...this.defaultOptions, ...options };

    // Ensure required fields have defaults and preserve all properties
    return {
      ...merged,
      format: merged.format ?? 'json',
      strategy: merged.strategy ?? 'file',
      prettyPrint: merged.prettyPrint ?? true,
      encoding: merged.encoding ?? 'utf8',
      compression: merged.compression ?? 'none',
    } as OutputOptions;
  }

  /**
   * Get format instance
   */
  private getFormat(formatName: string): BaseFormat | null {
    return this.formats.get(formatName.toLowerCase()) ?? null;
  }

  /**
   * Execute output strategy
   */
  private async executeStrategy(
    data: ProjectInfo,
    format: BaseFormat,
    options: OutputOptions
  ): Promise<{ data?: string; outputPath?: string; stream?: NodeJS.ReadableStream }> {
    switch (options.strategy) {
      case 'file':
        return await this.executeFileStrategy(data, format, options);
      case 'stream':
        return await this.executeStreamStrategy(data, format, options);
      case 'memory':
        return await this.executeMemoryStrategy(data, format, options);
      default:
        throw new Error(`Unsupported strategy: ${options.strategy}`);
    }
  }

  /**
   * Execute file output strategy
   */
  private async executeFileStrategy(
    data: ProjectInfo,
    format: BaseFormat,
    options: OutputOptions
  ): Promise<{ outputPath: string }> {
    const outputPath = this.generateOutputPath(data, options);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Generate output data
    const outputData = await format.serialize(data, options);

    // Write to file
    await fs.writeFile(outputPath, outputData, { encoding: options.encoding as BufferEncoding });

    return { outputPath };
  }

  /**
   * Execute stream output strategy
   */
  private async executeStreamStrategy(
    data: ProjectInfo,
    format: BaseFormat,
    options: OutputOptions
  ): Promise<{ stream: NodeJS.ReadableStream }> {
    const outputData = await format.serialize(data, options);

    // Create readable stream
    const { Readable } = require('stream');
    const stream = new Readable({
      read(): void {
        this.push(outputData);
        this.push(null); // End stream
      },
    });

    return { stream };
  }

  /**
   * Execute memory output strategy
   */
  private async executeMemoryStrategy(
    data: ProjectInfo,
    format: BaseFormat,
    options: OutputOptions
  ): Promise<{ data: string }> {
    const outputData = await format.serialize(data, options);
    return { data: outputData };
  }

  /**
   * Generate output file path
   */
  private generateOutputPath(data: ProjectInfo, options: OutputOptions): string {
    // Use provided output file if available
    if (options.outputFile) {
      if (path.isAbsolute(options.outputFile)) {
        return options.outputFile;
      } else if (options.outputDir) {
        return path.join(options.outputDir, options.outputFile);
      } else {
        return path.resolve(options.outputFile);
      }
    }

    // Generate filename from project data
    const baseName = this.sanitizeFileName(data.name);
    const extension = this.getFileExtension(options.format);
    const timestamp = options.includeTimestamp ? `-${new Date().toISOString().split('T')[0]}` : '';

    const fileName = `${baseName}${timestamp}.${extension}`;

    // Use output directory if provided
    if (options.outputDir) {
      return path.join(options.outputDir, fileName);
    }

    // Default to current directory
    return path.resolve(fileName);
  }

  /**
   * Sanitize filename to be filesystem-safe
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  /**
   * Get file extension for format
   */
  private getFileExtension(format: string): string {
    const formatInstance = this.getFormat(format);
    if (formatInstance?.supportedExtensions?.length && formatInstance.supportedExtensions.length > 0) {
      return formatInstance.supportedExtensions[0]?.substring(1) ?? 'txt'; // Remove leading dot
    }

    // Default extensions
    const defaultExtensions: Record<string, string> = {
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      csv: 'csv',
    };

    return defaultExtensions[format] ?? 'txt';
  }
}

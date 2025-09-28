/**
 * BaseFormat - Abstract base class for output formats
 * 
 * This abstract class provides a common interface for all output formats,
 * ensuring consistency, validation, and extensibility across different
 * output format implementations.
 */

import { ProjectInfo } from '../../types/core';
import { OutputOptions } from '../../types/options';

/**
 * Abstract base class for output formats
 * 
 * Provides common functionality for:
 * - Data validation
 * - Serialization
 * - Error handling
 * - Configuration management
 */
export abstract class BaseFormat {
  /** Format name identifier */
  public abstract readonly formatName: string;
  
  /** Supported file extensions for this format */
  public abstract readonly supportedExtensions: string[];

  /**
   * Validate project analysis data
   * 
   * @param data - Project analysis data to validate
   * @returns Promise<boolean> - True if data is valid
   */
  public async validate(data: ProjectInfo): Promise<boolean> {
    try {
      if (!data) {
        return false;
      }
      
      return this.validateData(data);
    } catch (error) {
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Serialize project analysis data to string
   * 
   * @param data - Project analysis data to serialize
   * @param options - Output options
   * @returns Promise<string> - Serialized data
   */
  public async serialize(data: ProjectInfo, options?: Partial<OutputOptions>): Promise<string> {
    try {
      if (!data) {
        throw new Error('Data is required for serialization');
      }

      const mergedOptions = this.mergeOptions(options);
      return await this.serializeData(data, mergedOptions);
    } catch (error) {
      throw new Error(`Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Format project analysis data with full processing
   * 
   * @param data - Project analysis data to format
   * @param options - Output options
   * @returns Promise<string> - Formatted output
   */
  public async format(data: ProjectInfo, options?: Partial<OutputOptions>): Promise<string> {
    try {
      // Validate data first
      const isValid = await this.validate(data);
      if (!isValid) {
        throw new Error('Invalid project analysis data');
      }

      // Serialize data
      return await this.serialize(data, options);
    } catch (error) {
      throw new Error(`Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if format supports the given file extension
   * 
   * @param extension - File extension to check
   * @returns boolean - True if extension is supported
   */
  public supportsExtension(extension: string): boolean {
    if (!extension) {
      return false;
    }
    
    const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;
    return this.supportedExtensions.includes(normalizedExtension);
  }

  /**
   * Merge provided options with defaults
   * 
   * @param options - Provided options
   * @returns OutputOptions - Merged options
   */
  protected mergeOptions(options?: Partial<OutputOptions>): OutputOptions {
    const defaults = this.getDefaultOptions();
    
    if (!options) {
      return defaults;
    }

    return {
      ...defaults,
      ...options,
      // Handle nested objects if needed
      ...(options.format && { format: options.format }),
      ...(options.compression && { compression: options.compression })
    };
  }

  /**
   * Abstract method to serialize data (must be implemented by subclasses)
   * 
   * @param data - Project analysis data
   * @param options - Output options
   * @returns Promise<string> - Serialized data
   */
  protected abstract serializeData(data: ProjectInfo, options: OutputOptions): Promise<string>;

  /**
   * Abstract method to validate data (must be implemented by subclasses)
   * 
   * @param data - Project analysis data
   * @returns boolean - True if data is valid
   */
  protected abstract validateData(data: ProjectInfo): boolean;

  /**
   * Abstract method to get default options (must be implemented by subclasses)
   * 
   * @returns OutputOptions - Default options for this format
   */
  protected abstract getDefaultOptions(): OutputOptions;
}
/**
 * JSON output format implementation
 */

import { ProjectInfo, OutputOptions } from '../../types';
import { BaseFormat } from './BaseFormat';

/**
 * JSON format implementation for project data serialization
 */
export class JSONFormat extends BaseFormat {
  /**
   * Format name identifier
   */
  public readonly formatName: string = 'JSON';

  /**
   * Supported file extensions
   */
  public readonly supportedExtensions: string[] = ['.json'];

  /**
   * Serialize project data to JSON format
   */
  protected async serializeData(data: ProjectInfo, options?: OutputOptions): Promise<string> {
    try {
      const prettyPrint = options?.prettyPrint ?? this.getDefaultOptions().prettyPrint;
      
      if (prettyPrint) {
        return JSON.stringify(data, null, 2);
      } else {
        return JSON.stringify(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`JSON serialization failed: ${error.message}`);
      } else {
        throw new Error('JSON serialization failed: Unknown error');
      }
    }
  }

  /**
   * Validate project data for JSON serialization
   */
  protected validateData(data: ProjectInfo): boolean {
    try {
      // Check if data is valid and serializable
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Check required properties
      if (!data.name || typeof data.name !== 'string') {
        return false;
      }

      if (!data.version || typeof data.version !== 'string') {
        return false;
      }

      if (!data.type || typeof data.type !== 'string') {
        return false;
      }

      if (!data.rootPath || typeof data.rootPath !== 'string') {
        return false;
      }

      // Check structure property
      if (!data.structure || typeof data.structure !== 'object') {
        return false;
      }

      // Check complexity property
      if (!data.complexity || typeof data.complexity !== 'object') {
        return false;
      }

      // Check quality property
      if (!data.quality || typeof data.quality !== 'object') {
        return false;
      }

      // Try to serialize to check for circular references
      JSON.stringify(data);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get default options for JSON format
   */
  protected getDefaultOptions(): OutputOptions {
    return {
      prettyPrint: true,
      encoding: 'utf8',
      strategy: 'file',
      compression: 'none',
      format: 'json'
    };
  }
}

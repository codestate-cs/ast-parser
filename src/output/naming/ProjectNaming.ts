/**
 * @fileoverview Concrete implementation of NamingStrategy for project-specific naming
 * Provides project-specific naming conventions for output files and directories
 */

import { NamingStrategy, NamingOptions } from './NamingStrategy';
import { ProjectInfo } from '../../types';

/**
 * Concrete implementation of NamingStrategy for project-specific naming
 * Provides project-specific naming conventions for output files and directories
 */
export class ProjectNaming extends NamingStrategy {
  /**
   * Creates a new ProjectNaming instance
   * @param options Configuration options for the naming strategy
   */
  constructor(options: NamingOptions = {}) {
    super({
      prefix: '',
      suffix: '.json',
      includeTimestamp: false,
      includeVersion: false,
      separator: '-',
      maxLength: 255,
      format: '{prefix}{name}{version}{timestamp}{suffix}',
      ...options
    });
  }

  /**
   * Generates a file name for the given project
   * @param projectInfo Project information
   * @param options Additional options for name generation
   * @returns Generated file name
   */
  generateFileName(projectInfo: ProjectInfo, options?: NamingOptions): string {
    if (!projectInfo) {
      throw new Error('Project info is required');
    }

    const mergedOptions = { ...this.options, ...options };
    const projectName = this.getProjectName(projectInfo);
    const projectVersion = this.getProjectVersion(projectInfo);

    // Build name parts
    const parts: {
      prefix?: string;
      name?: string;
      version?: string;
      timestamp?: string;
      suffix?: string;
    } = {
      prefix: mergedOptions.prefix || '',
      name: projectName,
      suffix: mergedOptions.suffix || ''
    };

    // Add version if enabled
    if (mergedOptions.includeVersion && projectVersion) {
      parts.version = `-${projectVersion}`;
    }

    // Add timestamp if enabled
    if (mergedOptions.includeTimestamp) {
      const timestamp = this.generateTimestamp();
      // Format timestamp for filename (replace colons and dots)
      const formattedTimestamp = timestamp
        .replace(/:/g, '-')
        .replace(/\./g, '-')
        .replace('T', '-')
        .replace('Z', '');
      parts.timestamp = `-${formattedTimestamp}`;
    }

    // Generate the formatted name
    const fileName = this.formatName(parts);

    // Add file extension if not already present
    if (!fileName.includes('.') && mergedOptions.suffix && !mergedOptions.suffix.startsWith('.')) {
      return `${fileName}.json`;
    }

    return fileName;
  }

  /**
   * Generates a directory name for the given project
   * @param projectInfo Project information
   * @param options Additional options for name generation
   * @returns Generated directory name
   */
  generateDirectoryName(projectInfo: ProjectInfo, options?: NamingOptions): string {
    if (!projectInfo) {
      throw new Error('Project info is required');
    }

    const mergedOptions = { ...this.options, ...options };
    const projectName = this.getProjectName(projectInfo);
    const projectVersion = this.getProjectVersion(projectInfo);

    // Build name parts for directory
    const parts: {
      prefix?: string;
      name?: string;
      version?: string;
      timestamp?: string;
      suffix?: string;
    } = {
      prefix: mergedOptions.prefix || '',
      name: projectName,
      suffix: '-output'
    };

    // Add version if enabled
    if (mergedOptions.includeVersion && projectVersion) {
      parts.version = `-${projectVersion}`;
    }

    // Add timestamp if enabled
    if (mergedOptions.includeTimestamp) {
      const timestamp = this.generateTimestamp();
      // Format timestamp for directory name (replace colons and dots)
      const formattedTimestamp = timestamp
        .replace(/:/g, '-')
        .replace(/\./g, '-')
        .replace('T', '-')
        .replace('Z', '');
      parts.timestamp = `-${formattedTimestamp}`;
    }

    // Generate the formatted name
    return this.formatName(parts);
  }

  /**
   * Generates a timestamp string
   * @returns ISO timestamp string
   */
  override generateTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Validates a generated name
   * @param name Name to validate
   * @returns True if name is valid, false otherwise
   */
  override validateName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    // Check length
    if (name.length === 0 || name.length > (this.options.maxLength || 255)) {
      return false;
    }

    // Check for invalid characters (basic validation)
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(name)) {
      return false;
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reservedNames.includes(name.toUpperCase())) {
      return false;
    }

    return true;
  }

  /**
   * Sanitizes a name by removing or replacing invalid characters
   * @param name Name to sanitize
   * @returns Sanitized name
   */
  override sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    let sanitized = name;

    // Replace invalid characters with separator
    sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, this.options.separator || '-');

    // Replace multiple consecutive separators with single separator
    const separator = this.options.separator || '-';
    const separatorRegex = new RegExp(`\\${separator}+`, 'g');
    sanitized = sanitized.replace(separatorRegex, separator);

    // Remove leading and trailing separators
    sanitized = sanitized.replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '');

    // Truncate if too long
    const maxLength = this.options.maxLength || 255;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      // Remove trailing separator if truncated
      sanitized = sanitized.replace(new RegExp(`\\${separator}+$`, 'g'), '');
    }

    return sanitized;
  }

  /**
   * Formats a name using the configured format string
   * @param parts Parts to include in the formatted name
   * @returns Formatted name
   */
  protected override formatName(parts: {
    prefix?: string;
    name?: string;
    version?: string;
    timestamp?: string;
    suffix?: string;
  }): string {
    const format = this.options.format || '{prefix}{name}{version}{timestamp}{suffix}';
    
    let formatted = format;
    
    // Replace placeholders with actual values
    formatted = formatted.replace('{prefix}', parts.prefix || '');
    formatted = formatted.replace('{name}', parts.name || '');
    formatted = formatted.replace('{version}', parts.version || '');
    formatted = formatted.replace('{timestamp}', parts.timestamp || '');
    formatted = formatted.replace('{suffix}', parts.suffix || '');

    // Clean up any remaining empty placeholders
    formatted = formatted.replace(/\{[^}]+\}/g, '');

    return this.sanitizeName(formatted);
  }

  /**
   * Gets the project name, handling cases where it might be undefined
   * @param projectInfo Project information
   * @returns Project name or fallback
   */
  protected override getProjectName(projectInfo: ProjectInfo): string {
    return projectInfo.name || 'project';
  }

  /**
   * Gets the project version, handling cases where it might be undefined
   * @param projectInfo Project information
   * @returns Project version or empty string
   */
  protected override getProjectVersion(projectInfo: ProjectInfo): string {
    return projectInfo.version || '';
  }

  /**
   * Gets the project type, handling cases where it might be undefined
   * @param projectInfo Project information
   * @returns Project type or 'unknown'
   */
  protected override getProjectType(projectInfo: ProjectInfo): string {
    return projectInfo.type || 'unknown';
  }
}

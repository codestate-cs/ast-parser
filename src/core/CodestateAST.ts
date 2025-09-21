/**
 * Main Codestate AST orchestrator class
 */

import { ProjectInfo } from '../types';
import { ParsingOptions, DEFAULT_PARSING_OPTIONS } from '../types/options';
import { ProjectParser } from './ProjectParser';
import { ProjectDetector } from './ProjectDetector';
import { logInfo, logError } from '../utils/error/ErrorLogger';

/**
 * Main Codestate AST class
 */
export class CodestateAST {
  private options: ParsingOptions;

  constructor(options: Partial<ParsingOptions> = {}) {
    this.options = this.mergeOptions(DEFAULT_PARSING_OPTIONS, options);
  }

  /**
   * Parse project from path
   */
  async parseProject(projectPath: string, options?: Partial<ParsingOptions>): Promise<ProjectInfo> {
    try {
      logInfo(`Starting Codestate AST parsing: ${projectPath}`);

      // Merge options
      const mergedOptions = options ? this.mergeOptions(this.options, options) : this.options;

      // Create parser with options
      const parser = new ProjectParser(mergedOptions);

      // Parse project
      const result = await parser.parseProject(projectPath);

      logInfo(`Codestate AST parsing completed: ${result.name}`);
      return result;
    } catch (error) {
      logError(`Codestate AST parsing failed: ${projectPath}`, error as Error, { projectPath });
      throw error;
    }
  }

  /**
   * Detect project type
   */
  async detectProjectType(projectPath: string): Promise<string> {
    const result = await ProjectDetector.detectProjectType(projectPath);
    return result.type;
  }

  /**
   * Check if path is a valid project
   */
  async isValidProject(projectPath: string): Promise<boolean> {
    return ProjectDetector.isValidProject(projectPath);
  }

  /**
   * Get project root directory
   */
  async getProjectRoot(projectPath: string): Promise<string> {
    return await ProjectDetector.getProjectRoot(projectPath);
  }

  /**
   * Update parsing options
   */
  updateOptions(options: Partial<ParsingOptions>): void {
    this.options = this.mergeOptions(this.options, options);
  }

  /**
   * Get current options
   */
  getOptions(): ParsingOptions {
    return { ...this.options };
  }

  /**
   * Reset options to defaults
   */
  resetOptions(): void {
    this.options = { ...DEFAULT_PARSING_OPTIONS };
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(defaults: ParsingOptions, options: Partial<ParsingOptions>): ParsingOptions {
    return {
      filtering: { ...defaults.filtering, ...options.filtering },
      mode: options.mode ?? defaults.mode,
      output: { ...defaults.output, ...options.output },
      documentation: { ...defaults.documentation, ...options.documentation },
      performance: { ...defaults.performance, ...options.performance },
      cache: { ...defaults.cache, ...options.cache },
    };
  }
}

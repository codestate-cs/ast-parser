/**
 * @fileoverview Index validation functionality
 */

import { ProjectIndex } from '../ProjectIndex';
import { GlobalIndex } from '../GlobalIndex';
import { 
  ValidationResult, 
  ValidationError,
  ValidationWarning
} from '../../types/indexing';

/**
 * Validation options interface
 */
interface ValidationOptions {
  validateStructure?: boolean;
  validateMetadata?: boolean;
  validateConsistency?: boolean;
  strictMode?: boolean;
  maxErrors?: number;
}

/**
 * Index validation result interface
 */
interface IndexValidationResult extends ValidationResult {
  totalProjects: number;
  validProjects: number;
  invalidProjects: number;
}

/**
 * Index validator class for validating project and global indexes
 */
export class IndexValidator {
  private options: Required<ValidationOptions>;
  private validationStats: {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    totalValidationTime: number;
  };

  constructor(options: Partial<ValidationOptions> = {}) {
    this.options = {
      validateStructure: options.validateStructure ?? true,
      validateMetadata: options.validateMetadata ?? true,
      validateConsistency: options.validateConsistency ?? true,
      strictMode: options.strictMode ?? false,
      maxErrors: options.maxErrors ?? 100
    };

    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      totalValidationTime: 0
    };
  }

  /**
   * Validate a project index
   */
  async validateProjectIndex(projectIndex: ProjectIndex | null): Promise<ValidationResult> {
    const startTime = Date.now();
    this.validationStats.totalValidations++;

    if (!projectIndex) {
      this.validationStats.failedValidations++;
      this.validationStats.totalValidationTime += Date.now() - startTime;
      return this.createValidationResult(false, [this.createError('invalid_data', 'Project index is null or undefined')], []);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate structure if enabled
      if (this.options.validateStructure) {
        const structureResult = await this.validateProjectStructure(projectIndex);
        errors.push(...structureResult.errors);
        warnings.push(...structureResult.warnings);
      }

      // Validate metadata if enabled
      if (this.options.validateMetadata) {
        const metadataResult = await this.validateProjectMetadata(projectIndex);
        errors.push(...metadataResult.errors);
        warnings.push(...metadataResult.warnings);
      }

      // Limit errors based on maxErrors setting
      const limitedErrors = errors.slice(0, this.options.maxErrors);
      const isValid = limitedErrors.length === 0;

      if (isValid) {
        this.validationStats.successfulValidations++;
      } else {
        this.validationStats.failedValidations++;
      }

      this.validationStats.totalValidationTime += Date.now() - startTime;

      return this.createValidationResult(isValid, limitedErrors, warnings);
    } catch (error) {
      this.validationStats.failedValidations++;
      this.validationStats.totalValidationTime += Date.now() - startTime;
      return this.createValidationResult(false, [this.createError('invalid_data', `Validation error: ${error}`)], []);
    }
  }

  /**
   * Validate a global index
   */
  async validateGlobalIndex(globalIndex: GlobalIndex | null): Promise<IndexValidationResult> {
    const startTime = Date.now();
    this.validationStats.totalValidations++;

    if (!globalIndex) {
      this.validationStats.failedValidations++;
      this.validationStats.totalValidationTime += Date.now() - startTime;
      return this.createIndexValidationResult(false, [this.createError('invalid_data', 'Global index is null or undefined')], []);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validate consistency if enabled
      if (this.options.validateConsistency) {
        const consistencyResult = await this.validateIndexConsistency(globalIndex);
        errors.push(...consistencyResult.errors);
        warnings.push(...consistencyResult.warnings);
      }

      // Validate each project in the global index
      const projects = globalIndex.listProjects();
      for (const project of projects) {
        const projectIndex = new ProjectIndex(project);
        const projectResult = await this.validateProjectIndex(projectIndex);
        errors.push(...projectResult.errors);
        warnings.push(...projectResult.warnings);
      }

      // Limit errors based on maxErrors setting
      const limitedErrors = errors.slice(0, this.options.maxErrors);
      const isValid = limitedErrors.length === 0;

      if (isValid) {
        this.validationStats.successfulValidations++;
      } else {
        this.validationStats.failedValidations++;
      }

      this.validationStats.totalValidationTime += Date.now() - startTime;

      return this.createIndexValidationResult(isValid, limitedErrors, warnings);
    } catch (error) {
      this.validationStats.failedValidations++;
      this.validationStats.totalValidationTime += Date.now() - startTime;
      return this.createIndexValidationResult(false, [this.createError('invalid_data', `Validation error: ${error}`)], []);
    }
  }

  /**
   * Validate project structure
   */
  async validateProjectStructure(projectIndex: ProjectIndex): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const project = projectIndex.getProject();

    // Validate required fields
    if (!project.name || project.name.trim() === '') {
      errors.push(this.createError('invalid_data', 'Project name is required', project.id));
    }

    if (!project.type) {
      errors.push(this.createError('invalid_data', 'Project type is required', project.id));
    }

    if (!project.rootPath || project.rootPath.trim() === '') {
      errors.push(this.createError('invalid_data', 'Project root path is required', project.id));
    }

    if (!project.version || project.version.trim() === '') {
      errors.push(this.createError('invalid_data', 'Project version is required', project.id));
    }

    // Validate field formats
    if (project.repository && !this.isValidUrl(project.repository)) {
      errors.push(this.createError('invalid_data', 'Repository URL format is invalid', project.id));
    }

    if (project.version && !this.isValidVersion(project.version)) {
      errors.push(this.createError('invalid_data', 'Version format is invalid', project.id));
    }

    // Validate data types
    if (typeof project.size !== 'number' || project.size < 0) {
      errors.push(this.createError('invalid_data', 'Project size must be a non-negative number', project.id));
    }

    if (typeof project.fileCount !== 'number' || project.fileCount < 0) {
      errors.push(this.createError('invalid_data', 'File count must be a non-negative number', project.id));
    }

    if (typeof project.linesOfCode !== 'number' || project.linesOfCode < 0) {
      errors.push(this.createError('invalid_data', 'Lines of code must be a non-negative number', project.id));
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Validate project metadata
   */
  async validateProjectMetadata(projectIndex: ProjectIndex): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const metadata = projectIndex.getMetadata();
    const project = projectIndex.getProject();

    // Check if metadata exists (only warn in strict mode)
    if (!metadata || Object.keys(metadata).length === 0) {
      if (this.options.strictMode) {
        errors.push(this.createError('invalid_data', 'Project metadata is required', project.id));
      }
      // Don't warn about empty metadata by default
    }

    // Validate metadata structure
    if (metadata && typeof metadata !== 'object') {
      errors.push(this.createError('invalid_data', 'Project metadata must be an object', project.id));
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Validate index consistency
   */
  async validateIndexConsistency(globalIndex: GlobalIndex): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const projects = globalIndex.listProjects();

    // Check for duplicate project IDs
    const projectIds = new Set<string>();
    for (const project of projects) {
      if (projectIds.has(project.id)) {
        errors.push(this.createError('invalid_data', `Duplicate project ID found: ${project.id}`, project.id));
      }
      projectIds.add(project.id);
    }

    // Check for duplicate project names
    const projectNames = new Set<string>();
    for (const project of projects) {
      if (projectNames.has(project.name)) {
        warnings.push(this.createWarning('duplicate_entry', `Duplicate project name found: ${project.name}`, project.id));
      }
      projectNames.add(project.name);
    }

    return this.createValidationResult(errors.length === 0, errors, warnings);
  }

  /**
   * Validate multiple project indexes
   */
  async validateProjectIndexes(projectIndexes: ProjectIndex[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const projectIndex of projectIndexes) {
      const result = await this.validateProjectIndex(projectIndex);
      results.push(result);
    }

    return results;
  }

  /**
   * Update validation options
   */
  updateOptions(newOptions: Partial<ValidationOptions>): void {
    this.options = {
      ...this.options,
      ...newOptions
    };
  }

  /**
   * Get current validation options
   */
  getOptions(): Required<ValidationOptions> {
    return { ...this.options };
  }

  /**
   * Get validation statistics
   */
  getValidationStatistics() {
    return {
      totalValidations: this.validationStats.totalValidations,
      successfulValidations: this.validationStats.successfulValidations,
      failedValidations: this.validationStats.failedValidations,
      averageValidationTime: this.validationStats.totalValidations > 0 
        ? this.validationStats.totalValidationTime / this.validationStats.totalValidations 
        : 0
    };
  }

  /**
   * Create a validation result
   */
  private createValidationResult(isValid: boolean, errors: ValidationError[], warnings: ValidationWarning[]): ValidationResult {
    return {
      isValid,
      errors,
      warnings,
      statistics: {
        totalEntries: 1,
        validEntries: isValid ? 1 : 0,
        invalidEntries: isValid ? 0 : 1,
        orphanedEntries: 0
      }
    };
  }

  /**
   * Create an index validation result
   */
  private createIndexValidationResult(isValid: boolean, errors: ValidationError[], warnings: ValidationWarning[]): IndexValidationResult {
    return {
      isValid,
      errors,
      warnings,
      statistics: {
        totalEntries: 0,
        validEntries: 0,
        invalidEntries: 0,
        orphanedEntries: 0
      },
      totalProjects: 0,
      validProjects: 0,
      invalidProjects: 0
    };
  }

  /**
   * Create a validation error
   */
  private createError(type: ValidationError['type'], message: string, entryId?: string): ValidationError {
    return {
      type,
      message,
      ...(entryId && { entryId }),
      details: {}
    };
  }

  /**
   * Create a validation warning
   */
  private createWarning(type: ValidationWarning['type'], message: string, entryId?: string): ValidationWarning {
    return {
      type,
      message,
      ...(entryId && { entryId }),
      details: {}
    };
  }

  /**
   * Check if a string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a string is a valid version
   */
  private isValidVersion(version: string): boolean {
    // Simple version validation (semver-like)
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return versionRegex.test(version);
  }
}

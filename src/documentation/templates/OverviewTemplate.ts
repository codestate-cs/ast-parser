import { BaseTemplate, BaseTemplateOptions, TemplateProcessingResult, ConfigurationValidationResult } from './BaseTemplate';

/**
 * Options for OverviewTemplate
 */
export interface OverviewTemplateOptions extends BaseTemplateOptions {
  /** Whether to include project statistics */
  includeStatistics: boolean;
  /** Whether to include complexity metrics */
  includeComplexity: boolean;
  /** Whether to include file overview */
  includeFileOverview: boolean;
  /** Custom overview style */
  overviewStyle: 'simple' | 'detailed' | 'comprehensive';
  /** Maximum number of files to display in overview */
  maxFilesDisplay: number;
}

/**
 * Result of overview data validation
 */
export interface OverviewValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: any;
}

/**
 * Overview template for generating project overview documentation
 */
export class OverviewTemplate extends BaseTemplate {
  protected override options: OverviewTemplateOptions;

  constructor(options: Partial<OverviewTemplateOptions> = {}) {
    const defaultOptions: OverviewTemplateOptions = {
      format: 'markdown',
      encoding: 'utf-8',
      validateTemplate: true,
      validateConfiguration: true,
      templateVariables: {},
      inheritance: {
        enabled: false
      },
      includeStatistics: true,
      includeComplexity: true,
      includeFileOverview: true,
      overviewStyle: 'detailed',
      maxFilesDisplay: 50,
      ...options
    };
    
    super(defaultOptions);
    this.options = defaultOptions;
  }

  /**
   * Process template with project overview data
   */
  public override processTemplate(template: string, variables: Record<string, unknown>): TemplateProcessingResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const variablesUsed: string[] = [];
    const variablesMissing: string[] = [];

    try {
      // Validate template if enabled
      if (this.options.validateTemplate) {
        const validation = this.validateTemplate(template);
        if (!validation.isValid) {
          errors.push(...validation.errors);
        }
      }

      // Extract variables from template
      const templateVariables = this.extractVariables(template);
      
      // Process template
      let processedContent = template;
      
      for (const variable of templateVariables) {
        variablesUsed.push(variable);
        
        if (variables.hasOwnProperty(variable)) {
          const value = this.getVariableValue(variables, variable);
          const regex = new RegExp(`\\{\\{${this.escapeRegex(variable)}\\}\\}`, 'g');
          processedContent = processedContent.replace(regex, String(value));
        } else {
          variablesMissing.push(variable);
        }
      }

      // Handle nested variables
      processedContent = this.processNestedVariables(processedContent, variables);

      return {
        content: processedContent,
        processingTime: Date.now() - startTime,
        success: errors.length === 0,
        errors,
        variablesUsed,
        variablesMissing
      };
    } catch (error) {
      return {
        content: template,
        processingTime: Date.now() - startTime,
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        variablesUsed,
        variablesMissing
      };
    }
  }

  /**
   * Generate content from project overview data
   */
  public override generateContent(data: Record<string, unknown>): string {
    try {
      if (!data) {
        return this.generateEmptyOverview();
      }

      // Validate overview data
      const validation = this.validateOverviewData(data);
      if (!validation.isValid && this.options.validateConfiguration) {
        return `Overview data validation failed: ${validation.errors.join(', ')}`;
      }

      let content = '';

      // Generate project header
      content += this.generateProjectHeader(data);

      // Generate statistics section if enabled
      if (this.options.includeStatistics) {
        content += this.generateStatisticsSection(data);
      }

      // Generate complexity section if enabled
      if (this.options.includeComplexity) {
        content += this.generateComplexitySection(data);
      }

      // Generate file overview section if enabled
      if (this.options.includeFileOverview) {
        content += this.generateFileOverviewSection(data);
      }

      // Generate project description
      content += this.generateProjectDescription(data);

      return content;
    } catch (error) {
      return `Error generating overview content: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Validate overview data structure
   */
  public validateOverviewData(data: any): OverviewValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data) {
      errors.push('Overview data is required');
      return { isValid: false, errors, warnings, data };
    }

    if (typeof data !== 'object') {
      errors.push('Overview data must be an object');
      return { isValid: false, errors, warnings, data };
    }

    // Check required fields
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Project name is required and must be a string');
    }

    if (!data.version || typeof data.version !== 'string') {
      errors.push('Project version is required and must be a string');
    }

    if (!data.description || typeof data.description !== 'string') {
      warnings.push('Project description is recommended');
    }

    if (!data.rootPath || typeof data.rootPath !== 'string') {
      warnings.push('Project root path is recommended');
    }

    // Validate statistics if present
    if (data.statistics) {
      if (typeof data.statistics !== 'object') {
        errors.push('Statistics must be an object');
      } else {
        const stats = data.statistics;
        if (stats.totalFiles !== undefined && typeof stats.totalFiles !== 'number') {
          errors.push('totalFiles must be a number');
        }
        if (stats.totalLines !== undefined && typeof stats.totalLines !== 'number') {
          errors.push('totalLines must be a number');
        }
      }
    }

    // Validate complexity if present
    if (data.complexity) {
      if (typeof data.complexity !== 'object') {
        errors.push('Complexity must be an object');
      } else {
        const complexity = data.complexity;
        if (complexity.averageComplexity !== undefined && typeof complexity.averageComplexity !== 'number') {
          errors.push('averageComplexity must be a number');
        }
        if (complexity.maxComplexity !== undefined && typeof complexity.maxComplexity !== 'number') {
          errors.push('maxComplexity must be a number');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data
    };
  }

  /**
   * Generate project header section
   */
  private generateProjectHeader(data: any): string {
    const name = data.name || 'Unknown Project';
    const version = data.version || 'Unknown Version';
    
    return `# ${name} v${version}\n\n`;
  }

  /**
   * Generate project description section
   */
  private generateProjectDescription(data: any): string {
    const description = data.description || 'No description available';
    const rootPath = data.rootPath || 'Unknown path';
    
    return `## Project Description\n\n${description}\n\n**Project Path:** \`${rootPath}\`\n\n`;
  }

  /**
   * Generate statistics section
   */
  public generateStatisticsSection(data: any): string {
    const stats = data.statistics || {};
    
    let content = '## Project Statistics\n\n';
    content += '| Metric | Value |\n';
    content += '|--------|-------|\n';
    
    if (stats.totalFiles !== undefined) {
      content += `| Total Files | ${stats.totalFiles} |\n`;
    }
    if (stats.totalLines !== undefined) {
      content += `| Total Lines | ${stats.totalLines} |\n`;
    }
    if (stats.totalFunctions !== undefined) {
      content += `| Total Functions | ${stats.totalFunctions} |\n`;
    }
    if (stats.totalClasses !== undefined) {
      content += `| Total Classes | ${stats.totalClasses} |\n`;
    }
    if (stats.totalInterfaces !== undefined) {
      content += `| Total Interfaces | ${stats.totalInterfaces} |\n`;
    }
    
    content += '\n';
    return content;
  }

  /**
   * Generate complexity section
   */
  public generateComplexitySection(data: any): string {
    const complexity = data.complexity || {};
    
    let content = '## Complexity Metrics\n\n';
    content += '| Metric | Value |\n';
    content += '|--------|-------|\n';
    
    if (complexity.averageComplexity !== undefined) {
      content += `| Average Complexity | ${complexity.averageComplexity.toFixed(2)} |\n`;
    }
    if (complexity.maxComplexity !== undefined) {
      content += `| Max Complexity | ${complexity.maxComplexity} |\n`;
    }
    if (complexity.highComplexityFiles !== undefined) {
      content += `| High Complexity Files | ${complexity.highComplexityFiles} |\n`;
    }
    
    content += '\n';
    return content;
  }

  /**
   * Generate file overview section
   */
  public generateFileOverviewSection(data: any): string {
    const files = data.files || [];
    const maxFiles = this.options.maxFilesDisplay;
    
    let content = '## File Overview\n\n';
    
    if (files.length === 0) {
      content += 'No files found.\n\n';
      return content;
    }
    
    content += '| File | Size |\n';
    content += '|------|------|\n';
    
    const filesToShow = files.slice(0, maxFiles);
    for (const file of filesToShow) {
      const fileName = file.name || 'Unknown';
      const fileSize = file.size || 0;
      content += `| ${fileName} | ${fileSize} bytes |\n`;
    }
    
    if (files.length > maxFiles) {
      content += `| ... and ${files.length - maxFiles} more files |\n`;
    }
    
    content += '\n';
    return content;
  }

  /**
   * Generate empty overview when no data is provided
   */
  private generateEmptyOverview(): string {
    return `# Project Overview\n\nNo project data available.\n\n`;
  }

  /**
   * Get default options for OverviewTemplate
   */
  protected getDefaultOptions(): OverviewTemplateOptions {
    return {
      format: 'markdown',
      encoding: 'utf-8',
      validateTemplate: true,
      validateConfiguration: true,
      templateVariables: {},
      inheritance: {
        enabled: false
      },
      includeStatistics: true,
      includeComplexity: true,
      includeFileOverview: true,
      overviewStyle: 'detailed',
      maxFilesDisplay: 50
    };
  }

  /**
   * Update template options
   */
  public override updateOptions(options: Partial<OverviewTemplateOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  public override getOptions(): OverviewTemplateOptions {
    return { ...this.options };
  }

  /**
   * Validate configuration
   */
  public override validateConfiguration(config: Partial<OverviewTemplateOptions> = this.options): ConfigurationValidationResult {
    const errors: string[] = [];

    // Validate base configuration
    const baseValidation = super.validateConfiguration(config);
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    // Validate overview-specific options
    if (this.options.includeStatistics !== undefined && typeof this.options.includeStatistics !== 'boolean') {
      errors.push('includeStatistics must be a boolean');
    }

    if (this.options.includeComplexity !== undefined && typeof this.options.includeComplexity !== 'boolean') {
      errors.push('includeComplexity must be a boolean');
    }

    if (this.options.includeFileOverview !== undefined && typeof this.options.includeFileOverview !== 'boolean') {
      errors.push('includeFileOverview must be a boolean');
    }

    if (this.options.overviewStyle && !['simple', 'detailed', 'comprehensive'].includes(this.options.overviewStyle)) {
      errors.push('overviewStyle must be one of: simple, detailed, comprehensive');
    }

    if (this.options.maxFilesDisplay !== undefined && (typeof this.options.maxFilesDisplay !== 'number' || this.options.maxFilesDisplay < 0)) {
      errors.push('maxFilesDisplay must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      configuration: this.options
    };
  }
}

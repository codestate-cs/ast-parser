// BaseTemplate implementation

/**
 * Base template options interface
 */
export interface BaseTemplateOptions {
  /** Output format (html, markdown, text) */
  format: 'html' | 'markdown' | 'text';
  /** Character encoding */
  encoding: string;
  /** Whether to validate template syntax */
  validateTemplate: boolean;
  /** Whether to validate configuration */
  validateConfiguration: boolean;
  /** Custom template variables */
  templateVariables: Record<string, unknown>;
  /** Template inheritance settings */
  inheritance: {
    enabled: boolean;
    baseTemplate?: string;
  };
}

/**
 * Template processing result
 */
export interface TemplateProcessingResult {
  /** Processed template content */
  content: string;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Variables used in processing */
  variablesUsed: string[];
  /** Variables missing */
  variablesMissing: string[];
  /** Processing errors */
  errors: string[];
  /** Whether processing was successful */
  success: boolean;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  /** Whether template is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Template metadata */
  metadata: {
    variables: string[];
    complexity: number;
    size: number;
  };
}

/**
 * Template loading result
 */
export interface TemplateLoadingResult {
  /** Whether loading was successful */
  success: boolean;
  /** Loaded template content */
  template?: string;
  /** Loading error */
  error?: string;
  /** Template metadata */
  metadata?: {
    variables: string[];
    size: number;
    format: string;
  };
}

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  /** Whether configuration is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validated configuration */
  configuration?: BaseTemplateOptions | undefined;
}

/**
 * Template metadata interface
 */
export interface TemplateMetadata {
  /** Template variables */
  variables: string[];
  /** Template complexity score */
  complexity: number;
  /** Template size in characters */
  size: number;
  /** Template format */
  format: string;
  /** Last modified timestamp */
  lastModified: number;
}

/**
 * Base template class providing common template functionality
 */
export class BaseTemplate {
  protected options: BaseTemplateOptions;
  protected currentTemplate: string | null = null;
  protected templateMetadata: TemplateMetadata | null = null;

  /**
   * Constructor
   * 
   * @param options - Template options
   */
  constructor(options: Partial<BaseTemplateOptions> = {}) {
    this.options = this.mergeOptions(options);
  }

  /**
   * Process template with variable substitution
   * 
   * @param template - Template content
   * @param variables - Variables for substitution
   * @returns Processing result
   */
  public processTemplate(
    template: string,
    variables: Record<string, unknown> = {}
  ): TemplateProcessingResult {
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
        variablesUsed,
        variablesMissing,
        errors,
        success: errors.length === 0
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown processing error');
      
      return {
        content: template,
        processingTime: Date.now() - startTime,
        variablesUsed,
        variablesMissing,
        errors,
        success: false
      };
    }
  }

  /**
   * Generate content from structured data
   * 
   * @param data - Structured data
   * @returns Generated content
   */
  public generateContent(data: Record<string, unknown>): string {
    try {
      // Basic content generation based on format
      switch (this.options.format) {
        case 'html':
          return this.generateHTMLContent(data);
        case 'markdown':
          return this.generateMarkdownContent(data);
        case 'text':
          return this.generateTextContent(data);
        default:
          return this.generateTextContent(data);
      }
    } catch (error) {
      return `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Validate template syntax
   * 
   * @param template - Template content
   * @returns Validation result
   */
  public validateTemplate(template: string): TemplateValidationResult {
    const errors: string[] = [];
    const variables: string[] = [];

    try {
      if (!template) {
        errors.push('Template is empty');
        return {
          isValid: false,
          errors,
          metadata: {
            variables,
            complexity: 0,
            size: 0
          }
        };
      }

      // Check for balanced braces
      const openBraces = (template.match(/\{\{/g) || []).length;
      const closeBraces = (template.match(/\}\}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        errors.push('Unbalanced template braces');
      }

      // Extract and validate variables
      const templateVariables = this.extractVariables(template);
      variables.push(...templateVariables);

      // Check for invalid variable syntax
      const invalidVariables = templateVariables.filter(variable => 
        !/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(variable)
      );
      
      if (invalidVariables.length > 0) {
        errors.push(`Invalid variable names: ${invalidVariables.join(', ')}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata: {
          variables,
          complexity: this.calculateComplexity(template),
          size: template.length
        }
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
      
      return {
        isValid: false,
        errors,
        metadata: {
          variables,
          complexity: 0,
          size: template.length
        }
      };
    }
  }

  /**
   * Load template from string
   * 
   * @param templateContent - Template content
   * @returns Loading result
   */
  public loadTemplate(templateContent: string): TemplateLoadingResult {
    try {
      if (!templateContent) {
        return {
          success: false,
          error: 'Template content is empty'
        };
      }

      // Validate template if enabled
      if (this.options.validateTemplate) {
        const validation = this.validateTemplate(templateContent);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Template validation failed: ${validation.errors.join(', ')}`
          };
        }
      }

      this.currentTemplate = templateContent;
      this.templateMetadata = {
        variables: this.extractVariables(templateContent),
        complexity: this.calculateComplexity(templateContent),
        size: templateContent.length,
        format: this.options.format,
        lastModified: Date.now()
      };

      return {
        success: true,
        template: templateContent,
        metadata: {
          variables: this.templateMetadata.variables,
          size: this.templateMetadata.size,
          format: this.templateMetadata.format
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown loading error'
      };
    }
  }

  /**
   * Get template metadata
   * 
   * @returns Template metadata
   */
  public getTemplateMetadata(): TemplateMetadata {
    if (!this.templateMetadata) {
      return {
        variables: [],
        complexity: 0,
        size: 0,
        format: this.options.format,
        lastModified: 0
      };
    }

    return { ...this.templateMetadata };
  }

  /**
   * Extend template with inheritance
   * 
   * @param childTemplate - Child template content
   * @returns Extension result
   */
  public extendTemplate(childTemplate: string): TemplateLoadingResult {
    try {
      if (!this.options.inheritance.enabled) {
        return this.loadTemplate(childTemplate);
      }

      if (!this.currentTemplate) {
        return {
          success: false,
          error: 'No base template loaded for inheritance'
        };
      }

      // Simple template inheritance - replace {{content}} in base template
      const extendedTemplate = this.currentTemplate.replace(
        /\{\{content\}\}/g,
        childTemplate
      );

      return this.loadTemplate(extendedTemplate);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extension error'
      };
    }
  }

  /**
   * Update template options
   * 
   * @param newOptions - New options
   */
  public updateOptions(newOptions: Partial<BaseTemplateOptions>): void {
    this.options = this.mergeOptions(newOptions);
  }

  /**
   * Get current options
   * 
   * @returns Current options
   */
  public getOptions(): BaseTemplateOptions {
    return { ...this.options };
  }

  /**
   * Validate configuration
   * 
   * @param config - Configuration to validate
   * @returns Validation result
   */
  public validateConfiguration(config: Partial<BaseTemplateOptions>): ConfigurationValidationResult {
    const errors: string[] = [];

    try {
      // Validate format
      if (config.format && !['html', 'markdown', 'text'].includes(config.format)) {
        errors.push(`Invalid format: ${config.format}`);
      }

      // Validate encoding
      if (config.encoding && typeof config.encoding !== 'string') {
        errors.push('Encoding must be a string');
      }

      // Validate boolean options
      if (config.validateTemplate !== undefined && typeof config.validateTemplate !== 'boolean') {
        errors.push('validateTemplate must be a boolean');
      }

      if (config.validateConfiguration !== undefined && typeof config.validateConfiguration !== 'boolean') {
        errors.push('validateConfiguration must be a boolean');
      }

      // Validate template variables
      if (config.templateVariables && typeof config.templateVariables !== 'object') {
        errors.push('templateVariables must be an object');
      }

      // Validate inheritance
      if (config.inheritance) {
        if (typeof config.inheritance !== 'object') {
          errors.push('inheritance must be an object');
        } else {
          if (config.inheritance.enabled !== undefined && typeof config.inheritance.enabled !== 'boolean') {
            errors.push('inheritance.enabled must be a boolean');
          }
          if (config.inheritance.baseTemplate !== undefined && typeof config.inheritance.baseTemplate !== 'string') {
            errors.push('inheritance.baseTemplate must be a string');
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        configuration: errors.length === 0 ? this.mergeOptions(config) : undefined
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
      
      return {
        isValid: false,
        errors
      };
    }
  }

  /**
   * Extract variables from template
   * 
   * @param template - Template content
   * @returns Array of variable names
   */
  protected extractVariables(template: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      const variable = match[1]?.trim();
      if (variable && !variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  /**
   * Get variable value from nested object
   * 
   * @param variables - Variables object
   * @param variablePath - Variable path (e.g., 'user.name')
   * @returns Variable value
   */
  protected getVariableValue(variables: Record<string, unknown>, variablePath: string): unknown {
    const parts = variablePath.split('.');
    let value: unknown = variables;

    for (const part of parts) {
      if (value && typeof value === 'object' && value !== null) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Process nested variables in template
   * 
   * @param template - Template content
   * @param variables - Variables object
   * @returns Processed template
   */
  protected processNestedVariables(template: string, variables: Record<string, unknown>): string {
    const nestedVariableRegex = /\{\{([^}]+(?:\.[^}]+)*)\}\}/g;
    
    return template.replace(nestedVariableRegex, (match, variablePath) => {
      const value = this.getVariableValue(variables, variablePath);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Escape regex special characters
   * 
   * @param string - String to escape
   * @returns Escaped string
   */
  protected escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Calculate template complexity
   * 
   * @param template - Template content
   * @returns Complexity score
   */
  protected calculateComplexity(template: string): number {
    const variables = this.extractVariables(template);
    const nestedVariables = variables.filter(v => v.includes('.'));
    const conditionalBlocks = (template.match(/\{\{#[^}]+\}\}/g) || []).length;
    
    return variables.length + nestedVariables.length * 2 + conditionalBlocks * 3;
  }

  /**
   * Generate HTML content
   * 
   * @param data - Data object
   * @returns HTML content
   */
  protected generateHTMLContent(data: Record<string, unknown>): string {
    const title = data['title'] || 'Document';
    const content = data['content'] || '';
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
</head>
<body>
    <h1>${title}</h1>
    <div>${content}</div>
</body>
</html>`;
  }

  /**
   * Generate Markdown content
   * 
   * @param data - Data object
   * @returns Markdown content
   */
  protected generateMarkdownContent(data: Record<string, unknown>): string {
    const title = data['title'] || 'Document';
    const content = data['content'] || '';
    
    return `# ${title}\n\n${content}`;
  }

  /**
   * Generate text content
   * 
   * @param data - Data object
   * @returns Text content
   */
  protected generateTextContent(data: Record<string, unknown>): string {
    const title = data['title'] || 'Document';
    const content = data['content'] || '';
    
    return `${title}\n\n${content}`;
  }

  /**
   * Merge options with defaults
   * 
   * @param options - Options to merge
   * @returns Merged options
   */
  protected mergeOptions(options: Partial<BaseTemplateOptions>): BaseTemplateOptions {
    return {
      format: 'text',
      encoding: 'utf-8',
      validateTemplate: true,
      validateConfiguration: true,
      templateVariables: {},
      inheritance: {
        enabled: false
      },
      ...options
    };
  }
}

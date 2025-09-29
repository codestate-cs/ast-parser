import { BaseTemplate, BaseTemplateOptions, TemplateProcessingResult, ConfigurationValidationResult } from './BaseTemplate';

/**
 * Options for APITemplate
 */
export interface APITemplateOptions extends BaseTemplateOptions {
  /** Whether to include method signatures */
  includeMethodSignatures: boolean;
  /** Whether to include type definitions */
  includeTypeDefinitions: boolean;
  /** Whether to include parameter descriptions */
  includeParameterDescriptions: boolean;
  /** Whether to include return type information */
  includeReturnTypes: boolean;
  /** Custom API documentation style */
  apiStyle: 'simple' | 'detailed' | 'comprehensive';
  /** Maximum number of methods to display per class/interface */
  maxMethodsDisplay: number;
}

/**
 * Result of API data validation
 */
export interface APIValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: any;
}

/**
 * API template for generating API reference documentation
 */
export class APITemplate extends BaseTemplate {
  protected override options: APITemplateOptions;

  constructor(options: Partial<APITemplateOptions> = {}) {
    const defaultOptions: APITemplateOptions = {
      format: 'markdown',
      encoding: 'utf-8',
      validateTemplate: true,
      validateConfiguration: true,
      templateVariables: {},
      inheritance: {
        enabled: false
      },
      includeMethodSignatures: true,
      includeTypeDefinitions: true,
      includeParameterDescriptions: true,
      includeReturnTypes: true,
      apiStyle: 'detailed',
      maxMethodsDisplay: 20,
      ...options
    };
    
    super(defaultOptions);
    this.options = defaultOptions;
  }

  /**
   * Process template with API data
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
   * Generate content from API data
   */
  public override generateContent(data: Record<string, unknown>): string {
    try {
      if (!data) {
        return this.generateEmptyAPI();
      }

      // Validate API data
      const validation = this.validateAPIData(data);
      if (!validation.isValid && this.options.validateConfiguration) {
        return `API data validation failed: ${validation.errors.join(', ')}`;
      }

      let content = '';

      // Generate API header
      content += this.generateAPIHeader(data);

      // Generate class documentation if enabled
      if (this.options.includeTypeDefinitions) {
        content += this.generateClassDocumentation(data);
      }

      // Generate interface documentation if enabled
      if (this.options.includeTypeDefinitions) {
        content += this.generateInterfaceDocumentation(data);
      }

      // Generate method documentation if enabled
      if (this.options.includeMethodSignatures) {
        content += this.generateMethodDocumentation(data);
      }

      // Generate API description
      content += this.generateAPIDescription(data);

      return content;
    } catch (error) {
      return `Error generating API content: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Validate API data structure
   */
  public validateAPIData(data: any): APIValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data) {
      errors.push('API data is required');
      return { isValid: false, errors, warnings, data };
    }

    if (typeof data !== 'object') {
      errors.push('API data must be an object');
      return { isValid: false, errors, warnings, data };
    }

    // Check required fields
    if (!data.name || typeof data.name !== 'string') {
      errors.push('API name is required and must be a string');
    }

    if (!data.version || typeof data.version !== 'string') {
      errors.push('API version is required and must be a string');
    }

    if (!data.description || typeof data.description !== 'string') {
      warnings.push('API description is recommended');
    }

    if (!data.rootPath || typeof data.rootPath !== 'string') {
      warnings.push('API root path is recommended');
    }

    // Validate nodes if present
    if (data.nodes) {
      if (!Array.isArray(data.nodes)) {
        errors.push('API nodes must be an array');
      } else {
        data.nodes.forEach((node: any, index: number) => {
          if (!node.id || typeof node.id !== 'string') {
            errors.push(`Node ${index}: id is required and must be a string`);
          }
          if (!node.name || typeof node.name !== 'string') {
            errors.push(`Node ${index}: name is required and must be a string`);
          }
          if (!node.type || typeof node.type !== 'string') {
            errors.push(`Node ${index}: type is required and must be a string`);
          }
        });
      }
    }

    // Validate statistics if present
    if (data.statistics) {
      if (typeof data.statistics !== 'object') {
        errors.push('Statistics must be an object');
      } else {
        const stats = data.statistics;
        if (stats.totalClasses !== undefined && typeof stats.totalClasses !== 'number') {
          errors.push('totalClasses must be a number');
        }
        if (stats.totalInterfaces !== undefined && typeof stats.totalInterfaces !== 'number') {
          errors.push('totalInterfaces must be a number');
        }
        if (stats.totalMethods !== undefined && typeof stats.totalMethods !== 'number') {
          errors.push('totalMethods must be a number');
        }
        if (stats.totalProperties !== undefined && typeof stats.totalProperties !== 'number') {
          errors.push('totalProperties must be a number');
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
   * Generate API header section
   */
  private generateAPIHeader(data: any): string {
    const name = data.name || 'Unknown API';
    const version = data.version || 'Unknown Version';
    
    return `# ${name} API Reference v${version}\n\n`;
  }

  /**
   * Generate API description section
   */
  private generateAPIDescription(data: any): string {
    const description = data.description || 'No description available';
    const rootPath = data.rootPath || 'Unknown path';
    
    return `## API Description\n\n${description}\n\n**API Path:** \`${rootPath}\`\n\n`;
  }

  /**
   * Generate class documentation section
   */
  public generateClassDocumentation(data: any): string {
    const nodes = data.nodes || [];
    const classes = nodes.filter((node: any) => node.type === 'ClassDeclaration');
    
    if (classes.length === 0) {
      return '';
    }

    let content = '## Classes\n\n';
    
    classes.forEach((classNode: any) => {
      const className = classNode.name || 'Unknown Class';
      const description = classNode.properties?.description || 'No description available';
      
      content += `### ${className}\n\n${description}\n\n`;
      
      // Add methods if available
      if (classNode.properties?.methods && this.options.includeMethodSignatures) {
        content += '**Methods:**\n\n';
        const methods = classNode.properties.methods.slice(0, this.options.maxMethodsDisplay);
        
        methods.forEach((method: any) => {
          const methodName = method.name || 'Unknown Method';
          const methodDesc = method.description || 'No description available';
          const returnType = method.returnType || 'void';
          
          content += `- **${methodName}**: ${methodDesc}\n`;
          if (this.options.includeReturnTypes) {
            content += `  - Returns: \`${returnType}\`\n`;
          }
          
          if (method.parameters && this.options.includeParameterDescriptions) {
            method.parameters.forEach((param: any) => {
              const paramName = param.name || 'param';
              const paramType = param.type || 'any';
              const paramDesc = param.description || 'No description';
              content += `  - \`${paramName}\` (\`${paramType}\`): ${paramDesc}\n`;
            });
          }
          content += '\n';
        });
      }
      
      // Add properties if available
      if (classNode.properties?.properties && this.options.includeTypeDefinitions) {
        content += '**Properties:**\n\n';
        classNode.properties.properties.forEach((prop: any) => {
          const propName = prop.name || 'Unknown Property';
          const propType = prop.type || 'any';
          const propDesc = prop.description || 'No description available';
          content += `- **${propName}** (\`${propType}\`): ${propDesc}\n`;
        });
        content += '\n';
      }
    });
    
    return content;
  }

  /**
   * Generate interface documentation section
   */
  public generateInterfaceDocumentation(data: any): string {
    const nodes = data.nodes || [];
    const interfaces = nodes.filter((node: any) => node.type === 'InterfaceDeclaration');
    
    if (interfaces.length === 0) {
      return '';
    }

    let content = '## Interfaces\n\n';
    
    interfaces.forEach((interfaceNode: any) => {
      const interfaceName = interfaceNode.name || 'Unknown Interface';
      const description = interfaceNode.properties?.description || 'No description available';
      
      content += `### ${interfaceName}\n\n${description}\n\n`;
      
      // Add methods if available
      if (interfaceNode.properties?.methods && this.options.includeMethodSignatures) {
        content += '**Methods:**\n\n';
        const methods = interfaceNode.properties.methods.slice(0, this.options.maxMethodsDisplay);
        
        methods.forEach((method: any) => {
          const methodName = method.name || 'Unknown Method';
          const methodDesc = method.description || 'No description available';
          const returnType = method.returnType || 'void';
          
          content += `- **${methodName}**: ${methodDesc}\n`;
          if (this.options.includeReturnTypes) {
            content += `  - Returns: \`${returnType}\`\n`;
          }
          
          if (method.parameters && this.options.includeParameterDescriptions) {
            method.parameters.forEach((param: any) => {
              const paramName = param.name || 'param';
              const paramType = param.type || 'any';
              const paramDesc = param.description || 'No description';
              content += `  - \`${paramName}\` (\`${paramType}\`): ${paramDesc}\n`;
            });
          }
          content += '\n';
        });
      }
    });
    
    return content;
  }

  /**
   * Generate method documentation section
   */
  public generateMethodDocumentation(data: any): string {
    const nodes = data.nodes || [];
    const allMethods: any[] = [];
    
    // Collect all methods from classes and interfaces
    nodes.forEach((node: any) => {
      if (node.properties?.methods) {
        node.properties.methods.forEach((method: any) => {
          allMethods.push({
            ...method,
            parentName: node.name,
            parentType: node.type
          });
        });
      }
    });
    
    if (allMethods.length === 0) {
      return '';
    }

    let content = '## Methods\n\n';
    
    allMethods.slice(0, this.options.maxMethodsDisplay).forEach((method: any) => {
      const methodName = method.name || 'Unknown Method';
      const parentName = method.parentName || 'Unknown Parent';
      const methodDesc = method.description || 'No description available';
      const returnType = method.returnType || 'void';
      
      content += `### ${methodName}\n\n`;
      content += `**Parent:** ${parentName}\n\n`;
      content += `**Description:** ${methodDesc}\n\n`;
      
      if (this.options.includeReturnTypes) {
        content += `**Returns:** \`${returnType}\`\n\n`;
      }
      
      if (method.parameters && this.options.includeParameterDescriptions) {
        content += '**Parameters:**\n\n';
        method.parameters.forEach((param: any) => {
          const paramName = param.name || 'param';
          const paramType = param.type || 'any';
          const paramDesc = param.description || 'No description';
          content += `- \`${paramName}\` (\`${paramType}\`): ${paramDesc}\n`;
        });
        content += '\n';
      }
    });
    
    return content;
  }

  /**
   * Generate empty API when no data is provided
   */
  private generateEmptyAPI(): string {
    return `# API Reference\n\nNo API data available.\n\n`;
  }

  /**
   * Get default options for APITemplate
   */
  protected getDefaultOptions(): APITemplateOptions {
    return {
      format: 'markdown',
      encoding: 'utf-8',
      validateTemplate: true,
      validateConfiguration: true,
      templateVariables: {},
      inheritance: {
        enabled: false
      },
      includeMethodSignatures: true,
      includeTypeDefinitions: true,
      includeParameterDescriptions: true,
      includeReturnTypes: true,
      apiStyle: 'detailed',
      maxMethodsDisplay: 20
    };
  }

  /**
   * Update template options
   */
  public override updateOptions(options: Partial<APITemplateOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  public override getOptions(): APITemplateOptions {
    return { ...this.options };
  }

  /**
   * Validate configuration
   */
  public override validateConfiguration(config: Partial<APITemplateOptions> = this.options): ConfigurationValidationResult {
    const errors: string[] = [];

    // Validate base configuration
    const baseValidation = super.validateConfiguration(config);
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    // Validate API-specific options
    if (this.options.includeMethodSignatures !== undefined && typeof this.options.includeMethodSignatures !== 'boolean') {
      errors.push('includeMethodSignatures must be a boolean');
    }

    if (this.options.includeTypeDefinitions !== undefined && typeof this.options.includeTypeDefinitions !== 'boolean') {
      errors.push('includeTypeDefinitions must be a boolean');
    }

    if (this.options.includeParameterDescriptions !== undefined && typeof this.options.includeParameterDescriptions !== 'boolean') {
      errors.push('includeParameterDescriptions must be a boolean');
    }

    if (this.options.includeReturnTypes !== undefined && typeof this.options.includeReturnTypes !== 'boolean') {
      errors.push('includeReturnTypes must be a boolean');
    }

    if (this.options.apiStyle && !['simple', 'detailed', 'comprehensive'].includes(this.options.apiStyle)) {
      errors.push('apiStyle must be one of: simple, detailed, comprehensive');
    }

    if (this.options.maxMethodsDisplay !== undefined && (typeof this.options.maxMethodsDisplay !== 'number' || this.options.maxMethodsDisplay < 0)) {
      errors.push('maxMethodsDisplay must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      configuration: this.options
    };
  }
}

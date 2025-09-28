/**
 * @fileoverview Configuration validator
 * Validates configuration objects against expected schemas
 */

import { ValidationResult } from './types';

/**
 * Configuration validator class
 * Provides validation functionality for configuration objects
 */
export class ConfigValidator {
  /**
   * Validates a configuration object
   * @param config Configuration object to validate
   * @returns Validation result
   */
  validate(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Configuration must be an object');
      return { isValid: false, errors, warnings };
    }

    // Validate analyzers configuration
    if (!config.analyzers) {
      errors.push('Analyzers configuration is required');
    } else {
      this.validateAnalyzers(config.analyzers, errors, warnings);
    }

    // Validate parsers configuration
    if (!config.parsers) {
      errors.push('Parsers configuration is required');
    } else {
      this.validateParsers(config.parsers, errors, warnings);
    }

    // Validate output configuration
    if (!config.output) {
      errors.push('Output configuration is required');
    } else {
      this.validateOutput(config.output, errors, warnings);
    }

    // Validate global configuration
    if (!config.global) {
      warnings.push('Global configuration is missing, using defaults');
    } else {
      this.validateGlobal(config.global, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates analyzer configuration
   * @param analyzers Analyzer configuration
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateAnalyzers(analyzers: any, errors: string[], warnings: string[]): void {
    const requiredAnalyzers = ['dependency', 'entryPoint', 'structure', 'complexity'];
    
    requiredAnalyzers.forEach(analyzer => {
      if (!analyzers[analyzer]) {
        errors.push(`Analyzer configuration for '${analyzer}' is required`);
      } else {
        this.validateAnalyzerConfig(analyzer, analyzers[analyzer], errors, warnings);
      }
    });
  }

  /**
   * Validates individual analyzer configuration
   * @param analyzerName Analyzer name
   * @param config Analyzer configuration
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateAnalyzerConfig(analyzerName: string, config: any, errors: string[], _warnings: string[]): void {
    if (typeof config !== 'object') {
      errors.push(`Analyzer configuration for '${analyzerName}' must be an object`);
      return;
    }

    // Validate common properties
    if (config.maxDepth !== undefined && (typeof config.maxDepth !== 'number' || config.maxDepth < 0)) {
      errors.push(`Max depth for '${analyzerName}' must be a non-negative number`);
    }

    // Validate boolean properties
    const booleanProps = ['includeExternal', 'includeInternal', 'includeCircular', 'includeMain', 'includeTypes', 'includePatterns', 'includeFiles', 'includeDirectories', 'includeSize', 'includeCyclomatic', 'includeCognitive', 'includeLinesOfCode', 'includeFunctionCount', 'includeClassCount', 'includeInterfaceCount'];
    
    booleanProps.forEach(prop => {
      if (config[prop] !== undefined && typeof config[prop] !== 'boolean') {
        errors.push(`Property '${prop}' for '${analyzerName}' must be a boolean`);
      }
    });

    // Validate numeric properties
    const numericProps = ['maxEntryPoints'];
    
    numericProps.forEach(prop => {
      if (config[prop] !== undefined && (typeof config[prop] !== 'number' || config[prop] < 0)) {
        errors.push(`Property '${prop}' for '${analyzerName}' must be a non-negative number`);
      }
    });
  }

  /**
   * Validates parser configuration
   * @param parsers Parser configuration
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateParsers(parsers: any, errors: string[], warnings: string[]): void {
    const requiredParsers = ['typescript', 'enhancedTypeScript'];
    
    requiredParsers.forEach(parser => {
      if (!parsers[parser]) {
        errors.push(`Parser configuration for '${parser}' is required`);
      } else {
        this.validateParserConfig(parser, parsers[parser], errors, warnings);
      }
    });
  }

  /**
   * Validates individual parser configuration
   * @param parserName Parser name
   * @param config Parser configuration
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateParserConfig(parserName: string, config: any, errors: string[], _warnings: string[]): void {
    if (typeof config !== 'object') {
      errors.push(`Parser configuration for '${parserName}' must be an object`);
      return;
    }

    // Validate max depth
    if (config.maxDepth !== undefined && (typeof config.maxDepth !== 'number' || config.maxDepth < 0)) {
      errors.push(`Max depth for '${parserName}' must be a non-negative number`);
    }

    // Validate boolean properties
    const booleanProps = ['includeTypes', 'includeJSDoc', 'includeDecorators', 'includeGenerics', 'includeAdvancedTypes', 'includeMethodSignatures', 'includeProperties', 'includeParameters', 'includeExports'];
    
    booleanProps.forEach(prop => {
      if (config[prop] !== undefined && typeof config[prop] !== 'boolean') {
        errors.push(`Property '${prop}' for '${parserName}' must be a boolean`);
      }
    });
  }

  /**
   * Validates output configuration
   * @param output Output configuration
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateOutput(output: any, errors: string[], warnings: string[]): void {
    if (typeof output !== 'object') {
      errors.push('Output configuration must be an object');
      return;
    }

    // Validate formats
    if (!output.formats) {
      errors.push('Output formats configuration is required');
    } else {
      this.validateFormats(output.formats, errors, warnings);
    }

    // Validate naming
    if (!output.naming) {
      errors.push('Output naming configuration is required');
    } else {
      this.validateNaming(output.naming, errors, warnings);
    }
  }

  /**
   * Validates formats configuration
   * @param formats Formats configuration
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateFormats(formats: any, errors: string[], _warnings: string[]): void {
    if (typeof formats !== 'object') {
      errors.push('Formats configuration must be an object');
      return;
    }

    if (!formats.default || typeof formats.default !== 'string') {
      errors.push('Default format must be a string');
    }

    if (!Array.isArray(formats.available)) {
      errors.push('Available formats must be an array');
    }

    if (formats.options && typeof formats.options !== 'object') {
      errors.push('Format options must be an object');
    }
  }

  /**
   * Validates naming configuration
   * @param naming Naming configuration
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateNaming(naming: any, errors: string[], _warnings: string[]): void {
    if (typeof naming !== 'object') {
      errors.push('Naming configuration must be an object');
      return;
    }

    if (!naming.default || typeof naming.default !== 'string') {
      errors.push('Default naming strategy must be a string');
    }

    if (!Array.isArray(naming.available)) {
      errors.push('Available naming strategies must be an array');
    }

    if (naming.options && typeof naming.options !== 'object') {
      errors.push('Naming options must be an object');
    }
  }

  /**
   * Validates global configuration
   * @param global Global configuration
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateGlobal(global: any, errors: string[], _warnings: string[]): void {
    if (typeof global !== 'object') {
      errors.push('Global configuration must be an object');
      return;
    }

    // Validate boolean properties
    const booleanProps = ['verbose', 'debug', 'parallel'];
    
    booleanProps.forEach(prop => {
      if (global[prop] !== undefined && typeof global[prop] !== 'boolean') {
        errors.push(`Global property '${prop}' must be a boolean`);
      }
    });

    // Validate numeric properties
    if (global.maxProcessingTime !== undefined && (typeof global.maxProcessingTime !== 'number' || global.maxProcessingTime < 0)) {
      errors.push('Global maxProcessingTime must be a non-negative number');
    }
  }

  /**
   * Validates configuration schema
   * @param config Configuration object
   * @param schema Schema object
   * @returns Validation result
   */
  validateSchema(config: any, schema: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!schema || typeof schema !== 'object') {
      errors.push('Schema must be an object');
      return { isValid: false, errors, warnings };
    }

    // Basic schema validation
    this.validateAgainstSchema(config, schema, '', errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates object against schema recursively
   * @param obj Object to validate
   * @param schema Schema to validate against
   * @param path Current path in object
   * @param errors Error array to populate
   * @param warnings Warning array to populate
   */
  private validateAgainstSchema(obj: any, schema: any, path: string, errors: string[], warnings: string[]): void {
    if (typeof obj !== 'object' || obj === null) {
      if (schema.type === 'object') {
        errors.push(`Expected object at path '${path}', got ${typeof obj}`);
      }
      return;
    }

    // Validate required properties
    if (schema.required) {
      schema.required.forEach((prop: string) => {
        if (!(prop in obj)) {
          errors.push(`Required property '${prop}' missing at path '${path}'`);
        }
      });
    }

    // Validate properties
    if (schema.properties) {
      Object.keys(obj).forEach(key => {
        const propPath = path ? `${path}.${key}` : key;
        const propSchema = schema.properties[key];
        
        if (propSchema) {
          this.validateAgainstSchema(obj[key], propSchema, propPath, errors, warnings);
        } else if (!schema.additionalProperties) {
          warnings.push(`Unknown property '${key}' at path '${path}'`);
        }
      });
    }
  }
}

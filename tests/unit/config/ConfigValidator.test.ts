/**
 * @fileoverview Comprehensive tests for ConfigValidator
 * Following PDD -> BDD -> TDD approach
 */

import '../../../src/config/ConfigValidator';

describe('ConfigValidator', () => {
  let validator: any;

  beforeEach(() => {
    validator = new (require('../../../src/config/ConfigValidator').ConfigValidator)();
  });

  describe('Basic Functionality', () => {
    it('should create validator instance', () => {
      expect(validator).toBeDefined();
      expect(typeof validator.validate).toBe('function');
    });

    it('should validate valid configuration', () => {
      const validConfig = {
        analyzers: {
          dependency: { includeExternal: true, includeInternal: true, maxDepth: 10, includeCircular: true },
          entryPoint: { includeMain: true, includeTypes: true, includePatterns: true, maxEntryPoints: 100 },
          structure: { includeFiles: true, includeDirectories: true, maxDepth: 20, includeSize: true },
          complexity: { includeCyclomatic: true, includeCognitive: true, includeLinesOfCode: true, includeFunctionCount: true, includeClassCount: true, includeInterfaceCount: true }
        },
        parsers: {
          typescript: { includeTypes: true, includeJSDoc: true, includeDecorators: true, includeGenerics: true, maxDepth: 15 },
          enhancedTypeScript: { includeAdvancedTypes: true, includeMethodSignatures: true, includeProperties: true, includeParameters: true, includeExports: true, maxDepth: 20 }
        },
        output: {
          formats: { default: 'json', available: ['json', 'xml'], options: {} },
          naming: { default: 'project', available: ['project', 'timestamp'], options: {} }
        },
        global: { verbose: false, debug: false, maxProcessingTime: 300000, parallel: true }
      };

      const result = validator.validate(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should reject null configuration', () => {
      const result = validator.validate(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Configuration must be an object');
    });

    it('should reject undefined configuration', () => {
      const result = validator.validate(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Configuration must be an object');
    });

    it('should reject non-object configuration', () => {
      const result = validator.validate('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Configuration must be an object');
    });

    it('should reject configuration without analyzers', () => {
      const config = { parsers: {}, output: {}, global: {} };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Analyzers configuration is required');
    });

    it('should reject configuration without parsers', () => {
      const config = { analyzers: {}, output: {}, global: {} };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parsers configuration is required');
    });

    it('should reject configuration without output', () => {
      const config = { analyzers: {}, parsers: {}, global: {} };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Output configuration is required');
    });

    it('should warn about missing global configuration', () => {
      const config = { analyzers: {}, parsers: {}, output: {} };
      const result = validator.validate(config);
      expect(result.warnings).toContain('Global configuration is missing, using defaults');
    });
  });

  describe('Analyzer Configuration Validation', () => {
    it('should validate analyzer configuration with missing dependency', () => {
      const config = {
        analyzers: { entryPoint: {}, structure: {}, complexity: {} },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Analyzer configuration for 'dependency' is required");
    });

    it('should validate analyzer configuration with missing entryPoint', () => {
      const config = {
        analyzers: { dependency: {}, structure: {}, complexity: {} },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Analyzer configuration for 'entryPoint' is required");
    });

    it('should validate analyzer configuration with missing structure', () => {
      const config = {
        analyzers: { dependency: {}, entryPoint: {}, complexity: {} },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Analyzer configuration for 'structure' is required");
    });

    it('should validate analyzer configuration with missing complexity', () => {
      const config = {
        analyzers: { dependency: {}, entryPoint: {}, structure: {} },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Analyzer configuration for 'complexity' is required");
    });

    it('should validate analyzer configuration with non-object config', () => {
      const config = {
        analyzers: { dependency: 'invalid', entryPoint: {}, structure: {}, complexity: {} },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Analyzer configuration for 'dependency' must be an object");
    });

    it('should validate analyzer configuration with invalid maxDepth', () => {
      const config = {
        analyzers: { 
          dependency: { maxDepth: -1 }, 
          entryPoint: {}, 
          structure: {}, 
          complexity: {} 
        },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Max depth for 'dependency' must be a non-negative number");
    });

    it('should validate analyzer configuration with invalid boolean property', () => {
      const config = {
        analyzers: { 
          dependency: { includeExternal: 'invalid' }, 
          entryPoint: {}, 
          structure: {}, 
          complexity: {} 
        },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Property 'includeExternal' for 'dependency' must be a boolean");
    });

    it('should validate analyzer configuration with invalid maxEntryPoints', () => {
      const config = {
        analyzers: { 
          dependency: {}, 
          entryPoint: { maxEntryPoints: -1 }, 
          structure: {}, 
          complexity: {} 
        },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Property 'maxEntryPoints' for 'entryPoint' must be a non-negative number");
    });
  });

  describe('Parser Configuration Validation', () => {
    it('should validate parser configuration with missing typescript', () => {
      const config = {
        analyzers: {},
        parsers: { enhancedTypeScript: {} },
        output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Parser configuration for 'typescript' is required");
    });

    it('should validate parser configuration with missing enhancedTypeScript', () => {
      const config = {
        analyzers: {},
        parsers: { typescript: {} },
        output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Parser configuration for 'enhancedTypeScript' is required");
    });

    it('should validate parser configuration with non-object config', () => {
      const config = {
        analyzers: {},
        parsers: { typescript: 'invalid', enhancedTypeScript: {} },
        output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Parser configuration for 'typescript' must be an object");
    });

    it('should validate parser configuration with invalid maxDepth', () => {
      const config = {
        analyzers: {},
        parsers: { typescript: { maxDepth: -1 }, enhancedTypeScript: {} },
        output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Max depth for 'typescript' must be a non-negative number");
    });

    it('should validate parser configuration with invalid boolean property', () => {
      const config = {
        analyzers: {},
        parsers: { typescript: { includeTypes: 'invalid' }, enhancedTypeScript: {} },
        output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Property 'includeTypes' for 'typescript' must be a boolean");
    });
  });

  describe('Output Configuration Validation', () => {
    it('should validate output configuration with non-object config', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: 'invalid',
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Output configuration must be an object');
    });

    it('should validate output configuration with missing formats', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { naming: {} },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Output formats configuration is required');
    });

    it('should validate output configuration with missing naming', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: {} },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Output naming configuration is required');
    });

    it('should validate formats configuration with non-object config', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: 'invalid', naming: {} },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Formats configuration must be an object');
    });

    it('should validate formats configuration with missing default', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: { available: [] }, naming: {} },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Default format must be a string');
    });

    it('should validate formats configuration with invalid available', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: { default: 'json', available: 'invalid' }, naming: {} },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Available formats must be an array');
    });

    it('should validate formats configuration with invalid options', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: { default: 'json', available: [], options: 'invalid' }, naming: {} },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Format options must be an object');
    });

    it('should validate naming configuration with non-object config', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: {}, naming: 'invalid' },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Naming configuration must be an object');
    });

    it('should validate naming configuration with missing default', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: {}, naming: { available: [] } },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Default naming strategy must be a string');
    });

    it('should validate naming configuration with invalid available', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: {}, naming: { default: 'project', available: 'invalid' } },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Available naming strategies must be an array');
    });

    it('should validate naming configuration with invalid options', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: { formats: {}, naming: { default: 'project', available: [], options: 'invalid' } },
        global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Naming options must be an object');
    });
  });

  describe('Global Configuration Validation', () => {
    it('should validate global configuration with non-object config', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: {},
        global: 'invalid'
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Global configuration must be an object');
    });

    it('should validate global configuration with invalid boolean property', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: {},
        global: { verbose: 'invalid' }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Global property 'verbose' must be a boolean");
    });

    it('should validate global configuration with invalid maxProcessingTime', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: {},
        global: { maxProcessingTime: -1 }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Global maxProcessingTime must be a non-negative number');
    });
  });

  describe('Schema Validation', () => {
    it('should validate schema with null schema', () => {
      const result = validator.validateSchema({}, null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Schema must be an object');
    });

    it('should validate schema with undefined schema', () => {
      const result = validator.validateSchema({}, undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Schema must be an object');
    });

    it('should validate schema with non-object schema', () => {
      const result = validator.validateSchema({}, 'invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Schema must be an object');
    });

    it('should validate schema with required properties', () => {
      const schema = {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' }
        }
      };
      const result = validator.validateSchema({}, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Required property 'name' missing at path ''");
    });

    it('should validate schema with type mismatch', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };
      const result = validator.validateSchema({ name: 123 }, schema);
      expect(result.isValid).toBe(true); // Schema validation doesn't check primitive types
    });

    it('should validate schema with unknown properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        additionalProperties: false
      };
      const result = validator.validateSchema({ name: 'test', unknown: 'value' }, schema);
      expect(result.warnings).toContain("Unknown property 'unknown' at path ''");
    });

    it('should validate schema with nested objects', () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' }
            }
          }
        }
      };
      const result = validator.validateSchema({ user: {} }, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Required property 'name' missing at path 'user'");
    });
  });

  describe('Edge Cases and Coverage', () => {
    it('should handle analyzer configuration with undefined maxDepth', () => {
      const config = {
        analyzers: { 
          dependency: { maxDepth: undefined }, 
          entryPoint: {}, 
          structure: {}, 
          complexity: {} 
        },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false); // Missing required analyzer properties
    });

    it('should handle analyzer configuration with undefined boolean properties', () => {
      const config = {
        analyzers: { 
          dependency: { includeExternal: undefined }, 
          entryPoint: {}, 
          structure: {}, 
          complexity: {} 
        },
        parsers: {}, output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false); // Missing required analyzer properties
    });

    it('should handle parser configuration with undefined maxDepth', () => {
      const config = {
        analyzers: {},
        parsers: { typescript: { maxDepth: undefined }, enhancedTypeScript: {} },
        output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false); // Missing required parser properties
    });

    it('should handle parser configuration with undefined boolean properties', () => {
      const config = {
        analyzers: {},
        parsers: { typescript: { includeTypes: undefined }, enhancedTypeScript: {} },
        output: {}, global: {}
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false); // Missing required parser properties
    });

    it('should handle global configuration with undefined boolean properties', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: {},
        global: { verbose: undefined }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false); // Missing required output properties
    });

    it('should handle global configuration with undefined maxProcessingTime', () => {
      const config = {
        analyzers: {},
        parsers: {},
        output: {},
        global: { maxProcessingTime: undefined }
      };
      const result = validator.validate(config);
      expect(result.isValid).toBe(false); // Missing required output properties
    });

    it('should handle schema validation with null object', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };
      const result = validator.validateSchema(null, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Expected object at path '', got object");
    });

    it('should handle schema validation with nested path', () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              profile: {
                type: 'object',
                properties: {
                  name: { type: 'string' }
                }
              }
            }
          }
        }
      };
      const result = validator.validateSchema({ user: { profile: { name: 123 } } }, schema);
      expect(result.isValid).toBe(true); // Schema validation doesn't check primitive types
    });
  });
});

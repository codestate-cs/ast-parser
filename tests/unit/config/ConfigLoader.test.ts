/**
 * @fileoverview Comprehensive tests for ConfigLoader
 * Following PDD -> BDD -> TDD approach
 */

import '../../../src/config/ConfigLoader';

describe('ConfigLoader', () => {
  let loader: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    loader = new (require('../../../src/config/ConfigLoader').ConfigLoader)();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Basic Functionality', () => {
    it('should create loader instance', () => {
      expect(loader).toBeDefined();
      expect(typeof loader.load).toBe('function');
      expect(typeof loader.loadFromFile).toBe('function');
      expect(typeof loader.loadFromEnvironment).toBe('function');
    });

    it('should load configuration with default options', () => {
      const config = loader.load();
      expect(config).toBeDefined();
      expect(config.analyzers).toBeDefined();
      expect(config.parsers).toBeDefined();
      expect(config.output).toBeDefined();
      expect(config.global).toBeDefined();
    });

    it('should load configuration with custom options', () => {
      const options = {
        envPrefix: 'TEST_',
        mergeWithDefaults: true,
        validate: true
      };
      const config = loader.load(options);
      expect(config).toBeDefined();
    });
  });

  describe('File Loading', () => {
    it('should load configuration from file', () => {
      const mockConfig = {
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

      // Mock fs module
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockConfig));

      const config = loader.loadFromFile('/path/to/config.json');
      expect(config).toBeDefined();
      expect(config.analyzers).toBeDefined();

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    it('should handle file loading errors', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => {
        loader.loadFromFile('/path/to/nonexistent.json');
      }).toThrow('Failed to load configuration from file');

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    it('should handle JSON parsing errors', () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockReturnValue('invalid json');

      expect(() => {
        loader.loadFromFile('/path/to/invalid.json');
      }).toThrow('Failed to load configuration from file');

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    it('should handle configuration validation errors', () => {
      const invalidConfig = { invalid: 'config' };
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidConfig));

      expect(() => {
        loader.loadFromFile('/path/to/invalid-config.json');
      }).toThrow('Configuration file validation failed');

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });
  });

  describe('Environment Variable Loading', () => {
    it('should load configuration from environment variables', () => {
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_EXTERNAL'] = 'false';
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_MAX_DEPTH'] = '5';
      process.env['CODESTATE_GLOBAL_VERBOSE'] = 'true';

      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.includeExternal).toBe(false);
      expect(config.analyzers.dependency.maxDepth).toBe(5);
      expect(config.global.verbose).toBe(true);
    });

    it('should load configuration with custom prefix', () => {
      process.env['TEST_ANALYZERS_DEPENDENCY_INCLUDE_EXTERNAL'] = 'false';
      process.env['TEST_GLOBAL_VERBOSE'] = 'true';

      const config = loader.loadFromEnvironment('TEST_');
      expect(config.analyzers.dependency.includeExternal).toBe(false);
      expect(config.global.verbose).toBe(true);
    });

    it('should use default values when environment variables are not set', () => {
      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.includeExternal).toBe(true);
      expect(config.analyzers.dependency.maxDepth).toBe(10);
      expect(config.global.verbose).toBe(false);
    });

    it('should handle boolean environment variables', () => {
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_EXTERNAL'] = 'true';
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_INTERNAL'] = 'false';
      process.env['CODESTATE_GLOBAL_VERBOSE'] = 'TRUE';
      process.env['CODESTATE_GLOBAL_DEBUG'] = 'FALSE';

      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.includeExternal).toBe(true);
      expect(config.analyzers.dependency.includeInternal).toBe(false);
      expect(config.global.verbose).toBe(true);
      expect(config.global.debug).toBe(false);
    });

    it('should handle number environment variables', () => {
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_MAX_DEPTH'] = '15';
      process.env['CODESTATE_ANALYZERS_ENTRY_POINT_MAX_ENTRY_POINTS'] = '200';
      process.env['CODESTATE_GLOBAL_MAX_PROCESSING_TIME'] = '600000';

      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.maxDepth).toBe(15);
      expect(config.analyzers.entryPoint.maxEntryPoints).toBe(200);
      expect(config.global.maxProcessingTime).toBe(600000);
    });

    it('should handle invalid number environment variables', () => {
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_MAX_DEPTH'] = 'invalid';
      process.env['CODESTATE_GLOBAL_MAX_PROCESSING_TIME'] = 'not-a-number';

      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.maxDepth).toBe(10); // Default value
      expect(config.global.maxProcessingTime).toBe(300000); // Default value
    });

    it('should handle array environment variables', () => {
      process.env['CODESTATE_OUTPUT_FORMATS_AVAILABLE'] = '["json", "xml", "yaml"]';
      process.env['CODESTATE_OUTPUT_NAMING_AVAILABLE'] = 'project,timestamp,version';

      const config = loader.loadFromEnvironment();
      expect(config.output.formats.available).toEqual(['json', 'xml', 'yaml']);
      expect(config.output.naming.available).toEqual(['project', 'timestamp', 'version']);
    });

    it('should handle object environment variables', () => {
      process.env['CODESTATE_OUTPUT_FORMATS_OPTIONS'] = '{"json": {"prettyPrint": true}}';
      process.env['CODESTATE_OUTPUT_NAMING_OPTIONS'] = '{"project": {"prefix": "test"}}';

      const config = loader.loadFromEnvironment();
      expect(config.output.formats.options).toEqual({ json: { prettyPrint: true } });
      expect(config.output.naming.options).toEqual({ project: { prefix: 'test' } });
    });

    it('should handle invalid JSON in array environment variables', () => {
      process.env['CODESTATE_OUTPUT_FORMATS_AVAILABLE'] = 'invalid-json';

      const config = loader.loadFromEnvironment();
      expect(config.output.formats.available).toEqual(['invalid-json']); // Split by comma
    });

    it('should handle invalid JSON in object environment variables', () => {
      process.env['CODESTATE_OUTPUT_FORMATS_OPTIONS'] = 'invalid-json';

      const config = loader.loadFromEnvironment();
      expect(config.output.formats.options).toEqual({}); // Default value
    });
  });

  describe('Configuration Merging', () => {
    it('should merge configuration with defaults', () => {
      const config = loader.load({ configFile: null, mergeWithDefaults: true });
      expect(config).toBeDefined();
    });

    it('should not merge with defaults when disabled', () => {
      const config = loader.load({ mergeWithDefaults: false });
      expect(config).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration when enabled', () => {
      const config = loader.load({ validate: true });
      expect(config).toBeDefined();
    });

    it('should skip validation when disabled', () => {
      const config = loader.load({ validate: false });
      expect(config).toBeDefined();
    });

    it('should throw error for invalid configuration', () => {
      // Mock environment to create invalid config
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_MAX_DEPTH'] = '-1';

      expect(() => {
        loader.load({ validate: true });
      }).toThrow('Configuration validation failed');
    });
  });

  describe('Edge Cases and Coverage', () => {
    it('should handle empty environment variables', () => {
      // Clear all environment variables
      Object.keys(process.env).forEach(key => {
        if (key.startsWith('CODESTATE_')) {
          delete process.env[key];
        }
      });

      const config = loader.loadFromEnvironment();
      expect(config).toBeDefined();
      expect(config.analyzers).toBeDefined();
      expect(config.parsers).toBeDefined();
      expect(config.output).toBeDefined();
      expect(config.global).toBeDefined();
    });

    it('should handle undefined environment variables', () => {
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_EXTERNAL'] = undefined as any;
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_MAX_DEPTH'] = undefined as any;

      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.includeExternal).toBe(true); // Default value
      expect(config.analyzers.dependency.maxDepth).toBe(10); // Default value
    });

    it('should handle null environment variables', () => {
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_EXTERNAL'] = null as any;
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_MAX_DEPTH'] = null as any;

      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.includeExternal).toBe(true); // Default value
      expect(config.analyzers.dependency.maxDepth).toBe(10); // Default value
    });

    it('should handle empty string environment variables', () => {
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_EXTERNAL'] = '';
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_MAX_DEPTH'] = '';

      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.includeExternal).toBe(false); // Empty string is falsy
      expect(config.analyzers.dependency.maxDepth).toBe(10); // Default value for invalid number
    });

    it('should handle whitespace in array environment variables', () => {
      process.env['CODESTATE_OUTPUT_FORMATS_AVAILABLE'] = 'json, xml , yaml ';

      const config = loader.loadFromEnvironment();
      expect(config.output.formats.available).toEqual(['json', 'xml', 'yaml']);
    });

    it('should handle complex nested objects in environment variables', () => {
      process.env['CODESTATE_OUTPUT_FORMATS_OPTIONS'] = '{"json": {"prettyPrint": true, "indent": 2}, "xml": {"includeDeclaration": true}}';

      const config = loader.loadFromEnvironment();
      expect(config.output.formats.options).toEqual({
        json: { prettyPrint: true, indent: 2 },
        xml: { includeDeclaration: true }
      });
    });

    it('should handle deep merge with nested objects', () => {
      const config = loader.load({ mergeWithDefaults: true });
      expect(config).toBeDefined();
    });

    it('should handle file loading with validation disabled', () => {
      const mockConfig = { invalid: 'config' };
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockConfig));

      // This should throw because validation is always enabled in loadFromFile
      expect(() => {
        loader.loadFromFile('/path/to/config.json');
      }).toThrow('Configuration file validation failed');

      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    it('should handle all analyzer configuration properties', () => {
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_EXTERNAL'] = 'false';
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_INTERNAL'] = 'false';
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_MAX_DEPTH'] = '5';
      process.env['CODESTATE_ANALYZERS_DEPENDENCY_INCLUDE_CIRCULAR'] = 'false';
      process.env['CODESTATE_ANALYZERS_ENTRY_POINT_INCLUDE_MAIN'] = 'false';
      process.env['CODESTATE_ANALYZERS_ENTRY_POINT_INCLUDE_TYPES'] = 'false';
      process.env['CODESTATE_ANALYZERS_ENTRY_POINT_INCLUDE_PATTERNS'] = 'false';
      process.env['CODESTATE_ANALYZERS_ENTRY_POINT_MAX_ENTRY_POINTS'] = '50';
      process.env['CODESTATE_ANALYZERS_STRUCTURE_INCLUDE_FILES'] = 'false';
      process.env['CODESTATE_ANALYZERS_STRUCTURE_INCLUDE_DIRECTORIES'] = 'false';
      process.env['CODESTATE_ANALYZERS_STRUCTURE_MAX_DEPTH'] = '10';
      process.env['CODESTATE_ANALYZERS_STRUCTURE_INCLUDE_SIZE'] = 'false';
      process.env['CODESTATE_ANALYZERS_COMPLEXITY_INCLUDE_CYCLOMATIC'] = 'false';
      process.env['CODESTATE_ANALYZERS_COMPLEXITY_INCLUDE_COGNITIVE'] = 'false';
      process.env['CODESTATE_ANALYZERS_COMPLEXITY_INCLUDE_LINES_OF_CODE'] = 'false';
      process.env['CODESTATE_ANALYZERS_COMPLEXITY_INCLUDE_FUNCTION_COUNT'] = 'false';
      process.env['CODESTATE_ANALYZERS_COMPLEXITY_INCLUDE_CLASS_COUNT'] = 'false';
      process.env['CODESTATE_ANALYZERS_COMPLEXITY_INCLUDE_INTERFACE_COUNT'] = 'false';

      const config = loader.loadFromEnvironment();
      expect(config.analyzers.dependency.includeExternal).toBe(false);
      expect(config.analyzers.dependency.includeInternal).toBe(false);
      expect(config.analyzers.dependency.maxDepth).toBe(5);
      expect(config.analyzers.dependency.includeCircular).toBe(false);
      expect(config.analyzers.entryPoint.includeMain).toBe(false);
      expect(config.analyzers.entryPoint.includeTypes).toBe(false);
      expect(config.analyzers.entryPoint.includePatterns).toBe(false);
      expect(config.analyzers.entryPoint.maxEntryPoints).toBe(50);
      expect(config.analyzers.structure.includeFiles).toBe(false);
      expect(config.analyzers.structure.includeDirectories).toBe(false);
      expect(config.analyzers.structure.maxDepth).toBe(10);
      expect(config.analyzers.structure.includeSize).toBe(false);
      expect(config.analyzers.complexity.includeCyclomatic).toBe(false);
      expect(config.analyzers.complexity.includeCognitive).toBe(false);
      expect(config.analyzers.complexity.includeLinesOfCode).toBe(false);
      expect(config.analyzers.complexity.includeFunctionCount).toBe(false);
      expect(config.analyzers.complexity.includeClassCount).toBe(false);
      expect(config.analyzers.complexity.includeInterfaceCount).toBe(false);
    });

    it('should handle all parser configuration properties', () => {
      process.env['CODESTATE_PARSERS_TYPESCRIPT_INCLUDE_TYPES'] = 'false';
      process.env['CODESTATE_PARSERS_TYPESCRIPT_INCLUDE_JSDOC'] = 'false';
      process.env['CODESTATE_PARSERS_TYPESCRIPT_INCLUDE_DECORATORS'] = 'false';
      process.env['CODESTATE_PARSERS_TYPESCRIPT_INCLUDE_GENERICS'] = 'false';
      process.env['CODESTATE_PARSERS_TYPESCRIPT_MAX_DEPTH'] = '5';
      process.env['CODESTATE_PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_ADVANCED_TYPES'] = 'false';
      process.env['CODESTATE_PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_METHOD_SIGNATURES'] = 'false';
      process.env['CODESTATE_PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_PROPERTIES'] = 'false';
      process.env['CODESTATE_PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_PARAMETERS'] = 'false';
      process.env['CODESTATE_PARSERS_ENHANCED_TYPESCRIPT_INCLUDE_EXPORTS'] = 'false';
      process.env['CODESTATE_PARSERS_ENHANCED_TYPESCRIPT_MAX_DEPTH'] = '10';

      const config = loader.loadFromEnvironment();
      expect(config.parsers.typescript.includeTypes).toBe(false);
      expect(config.parsers.typescript.includeJSDoc).toBe(false);
      expect(config.parsers.typescript.includeDecorators).toBe(false);
      expect(config.parsers.typescript.includeGenerics).toBe(false);
      expect(config.parsers.typescript.maxDepth).toBe(5);
      expect(config.parsers.enhancedTypeScript.includeAdvancedTypes).toBe(false);
      expect(config.parsers.enhancedTypeScript.includeMethodSignatures).toBe(false);
      expect(config.parsers.enhancedTypeScript.includeProperties).toBe(false);
      expect(config.parsers.enhancedTypeScript.includeParameters).toBe(false);
      expect(config.parsers.enhancedTypeScript.includeExports).toBe(false);
      expect(config.parsers.enhancedTypeScript.maxDepth).toBe(10);
    });

    it('should handle all global configuration properties', () => {
      process.env['CODESTATE_GLOBAL_VERBOSE'] = 'true';
      process.env['CODESTATE_GLOBAL_DEBUG'] = 'true';
      process.env['CODESTATE_GLOBAL_MAX_PROCESSING_TIME'] = '600000';
      process.env['CODESTATE_GLOBAL_PARALLEL'] = 'false';

      const config = loader.loadFromEnvironment();
      expect(config.global.verbose).toBe(true);
      expect(config.global.debug).toBe(true);
      expect(config.global.maxProcessingTime).toBe(600000);
      expect(config.global.parallel).toBe(false);
    });
  });
});
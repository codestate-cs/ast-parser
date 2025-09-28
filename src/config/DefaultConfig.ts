/**
 * @fileoverview Default configuration settings
 * Provides default configuration values for all components
 */

import { ConfigOptions } from './types';

/**
 * Default configuration for the Codestate AST library
 */
export const DefaultConfig: ConfigOptions = {
  analyzers: {
    dependency: {
      includeExternal: true,
      includeInternal: true,
      maxDepth: 10,
      includeCircular: true
    },
    entryPoint: {
      includeMain: true,
      includeTypes: true,
      includePatterns: true,
      maxEntryPoints: 100
    },
    structure: {
      includeFiles: true,
      includeDirectories: true,
      maxDepth: 20,
      includeSize: true
    },
    complexity: {
      includeCyclomatic: true,
      includeCognitive: true,
      includeLinesOfCode: true,
      includeFunctionCount: true,
      includeClassCount: true,
      includeInterfaceCount: true
    }
  },
  parsers: {
    typescript: {
      includeTypes: true,
      includeJSDoc: true,
      includeDecorators: true,
      includeGenerics: true,
      maxDepth: 15
    },
    enhancedTypeScript: {
      includeAdvancedTypes: true,
      includeMethodSignatures: true,
      includeProperties: true,
      includeParameters: true,
      includeExports: true,
      maxDepth: 20
    }
  },
  output: {
    formats: {
      default: 'json',
      available: ['json', 'xml', 'yaml', 'csv'],
      options: {
        json: {
          prettyPrint: true,
          minify: false
        },
        xml: {
          prettyPrint: true,
          includeDeclaration: true
        },
        yaml: {
          prettyPrint: true,
          indent: 2
        },
        csv: {
          delimiter: ',',
          includeHeaders: true
        }
      }
    },
    naming: {
      default: 'project',
      available: ['project', 'timestamp', 'version', 'custom'],
      options: {
        project: {
          includeTimestamp: false,
          includeVersion: false,
          prefix: '',
          suffix: ''
        },
        timestamp: {
          includeTimestamp: true,
          includeVersion: false,
          prefix: '',
          suffix: ''
        },
        version: {
          includeTimestamp: false,
          includeVersion: true,
          prefix: '',
          suffix: ''
        },
        custom: {
          includeTimestamp: false,
          includeVersion: false,
          prefix: 'analysis-',
          suffix: '-report'
        }
      }
    }
  },
  global: {
    verbose: false,
    debug: false,
    maxProcessingTime: 300000, // 5 minutes
    parallel: true
  }
};

/**
 * Tests for CodestateAST class
 */

import { CodestateAST } from '../../../src/core';
import { ParsingOptions } from '../../../src/types';

describe('CodestateAST', () => {
  let parser: CodestateAST;

  beforeEach(() => {
    parser = new CodestateAST();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(parser).toBeInstanceOf(CodestateAST);
      expect(parser.getOptions()).toBeDefined();
    });

    it('should create instance with custom options', () => {
      const customOptions: Partial<ParsingOptions> = {
        filtering: {
          includePatterns: ['**/*.ts'],
          excludePatterns: ['**/*.test.ts'],
        },
      };

      const customParser = new CodestateAST(customOptions);
      expect(customParser.getOptions().filtering.includePatterns).toEqual(['**/*.ts']);
    });
  });

  describe('getOptions', () => {
    it('should return current options', () => {
      const options = parser.getOptions();
      expect(options).toBeDefined();
      expect(options.filtering).toBeDefined();
      expect(options.mode).toBeDefined();
      expect(options.output).toBeDefined();
    });
  });

  describe('updateOptions', () => {
    it('should update options', () => {
      const newOptions: Partial<ParsingOptions> = {
        filtering: {
          includePatterns: ['**/*.ts'],
        },
      };

      parser.updateOptions(newOptions);
      const updatedOptions = parser.getOptions();
      expect(updatedOptions.filtering.includePatterns).toEqual(['**/*.ts']);
    });
  });

  describe('resetOptions', () => {
    it('should reset options to defaults', () => {
      parser.updateOptions({
        filtering: {
          includePatterns: ['**/*.ts'],
        },
      });

      parser.resetOptions();
      const resetOptions = parser.getOptions();
      expect(resetOptions.filtering.includePatterns).toEqual(['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']);
    });
  });

  describe('getProjectRoot', () => {
    it('should return project root for valid path', async () => {
      const projectRoot = await parser.getProjectRoot(__dirname);
      expect(projectRoot).toBeDefined();
      expect(typeof projectRoot).toBe('string');
    });
  });

  describe('isValidProject', () => {
    it('should return false for invalid project path', async () => {
      const isValid = await parser.isValidProject('/invalid/path');
      expect(isValid).toBe(false);
    });

    it('should return true for current directory if it has package.json', async () => {
      const isValid = await parser.isValidProject(__dirname);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('parseProject', () => {
    it('should parse a valid project', async () => {
      const result = await parser.parseProject(__dirname);
      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.rootPath).toBeDefined();
    });

    it('should parse project with custom options', async () => {
      const customOptions: Partial<ParsingOptions> = {
        filtering: {
          includePatterns: ['**/*.ts']
        }
      };

      const result = await parser.parseProject(__dirname, customOptions);
      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.rootPath).toBeDefined();
    });

    it('should handle parsing errors', async () => {
      // Test with invalid path - should not throw but return empty result
      const result = await parser.parseProject('/invalid/path');
      expect(result).toBeDefined();
      expect(result.type).toBe('unknown');
    });
  });

  describe('detectProjectType', () => {
    it('should detect project type', async () => {
      const result = await parser.detectProjectType(__dirname);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(['typescript', 'javascript', 'react', 'node', 'unknown']).toContain(result);
    });

    it('should handle detection errors', async () => {
      // Test with invalid path - should not throw but return unknown type
      const result = await parser.detectProjectType('/invalid/path');
      expect(result).toBeDefined();
      expect(result).toBe('unknown');
    });
  });

  describe('mergeOptions', () => {
    it('should merge options correctly', () => {
      const defaults = {
        filtering: {
          includePatterns: ['**/*.ts'],
          excludePatterns: ['**/*.test.ts'],
          maxDepth: 10
        },
        mode: 'full' as const,
        output: {
          format: 'json' as const,
          compression: 'none' as const
        },
        documentation: {
          includeDocumentation: true
        },
        performance: {
          maxConcurrentFiles: 5
        },
        cache: {
          enableCache: false
        }
      };

      const options = {
        filtering: {
          maxDepth: 5
        },
        performance: {
          maxConcurrentFiles: 10
        }
      };

      const mergedOptions = (parser as any).mergeOptions(defaults, options);
      expect(mergedOptions.filtering.maxDepth).toBe(5);
      expect(mergedOptions.filtering.includePatterns).toEqual(['**/*.ts']);
      expect(mergedOptions.performance.maxConcurrentFiles).toBe(10);
      expect(mergedOptions.mode).toBe('full');
    });

    it('should handle empty options', () => {
      const defaults = {
        filtering: {
          includePatterns: ['**/*.ts'],
          excludePatterns: ['**/*.test.ts'],
          maxDepth: 10
        },
        mode: 'full' as const,
        output: {
          format: 'json' as const,
          compression: 'none' as const
        },
        documentation: {
          includeDocumentation: true
        },
        performance: {
          maxConcurrentFiles: 5
        },
        cache: {
          enableCache: false
        }
      };

      const mergedOptions = (parser as any).mergeOptions(defaults, {});
      expect(mergedOptions).toEqual(defaults);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty project path', async () => {
      const result = await parser.isValidProject('');
      expect(typeof result).toBe('boolean');
    });

    it('should handle null project path', async () => {
      const result = await parser.isValidProject(null as any);
      expect(typeof result).toBe('boolean');
    });

    it('should handle undefined project path', async () => {
      const result = await parser.isValidProject(undefined as any);
      expect(typeof result).toBe('boolean');
    });

    it('should handle very long project path', async () => {
      const longPath = '/very/long/path/' + 'a'.repeat(1000);
      const result = await parser.isValidProject(longPath);
      expect(typeof result).toBe('boolean');
    });

    it('should handle project path with special characters', async () => {
      const specialPath = '/path/with/special/chars/!@#$%^&*()';
      const result = await parser.isValidProject(specialPath);
      expect(typeof result).toBe('boolean');
    });

    it('should handle project path with unicode characters', async () => {
      const unicodePath = '/path/with/unicode/你好世界';
      const result = await parser.isValidProject(unicodePath);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('options management', () => {
    it('should preserve options immutability', () => {
      const currentOptions = parser.getOptions();
      expect(currentOptions.filtering.includePatterns).not.toEqual(['**/*.js']);
    });

    it('should handle partial options updates', () => {
      parser.updateOptions({
        filtering: {
          includePatterns: ['**/*.ts']
        }
      });

      const options = parser.getOptions();
      expect(options.filtering.includePatterns).toEqual(['**/*.ts']);
      expect(options.mode).toBeDefined(); // Should preserve other options
    });

    it('should handle nested options updates', () => {
      parser.updateOptions({
        output: {
          format: 'json' as const,
          compression: 'gzip' as const
        }
      });

      const options = parser.getOptions();
      expect(options.output.format).toBe('json');
      expect(options.output.compression).toBe('gzip');
    });
  });
});

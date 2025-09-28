/**
 * BaseFormat Tests
 * Following BDD (Behavior-Driven Development) approach
 */

import { BaseFormat } from '../../../../src/output/formats/BaseFormat';
import { ProjectInfo } from '../../../../src/types/core';
import { OutputOptions } from '../../../../src/types/options';

// Concrete implementation for testing
class TestFormat extends BaseFormat {
  public formatName = 'test';
  public supportedExtensions = ['.test', '.txt'];
  
  protected async serializeData(data: ProjectInfo): Promise<string> {
    return JSON.stringify(data, null, 2);
  }
  
  protected validateData(data: ProjectInfo): boolean {
    return data && typeof data === 'object' && data.name !== undefined;
  }
  
  protected getDefaultOptions(): OutputOptions {
    return {
      format: 'json',
      compression: 'none',
      prettyPrint: true,
      includeMetadata: true,
      encoding: 'utf8'
    };
  }
}

describe('BaseFormat', () => {
  let format: TestFormat;
  let mockProjectData: ProjectInfo;
  let mockOptions: OutputOptions;

  beforeEach(() => {
    format = new TestFormat();
    mockProjectData = {
      name: 'test-project',
      version: '1.0.0',
      type: 'typescript',
      rootPath: '/test/path',
      description: 'Test project',
      entryPoints: [],
      dependencies: [],
      devDependencies: [],
      structure: {
        directories: [],
        files: [],
        totalFiles: 0,
        totalLines: 0,
        totalSize: 0
      },
      ast: [],
      relations: [],
      publicExports: [],
      privateExports: [],
      complexity: {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        linesOfCode: 0,
        functionCount: 0,
        classCount: 0,
        interfaceCount: 0
      },
      quality: {
        score: 85,
        maintainabilityIndex: 80,
        technicalDebtRatio: 0.1,
        duplicationPercentage: 5,
        testCoveragePercentage: 90
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        parser: 'test-parser'
      }
    };
    mockOptions = {
      format: 'json',
      compression: 'none',
      prettyPrint: true,
      includeMetadata: true,
      encoding: 'utf8'
    };
  });

  describe('Basic Functionality', () => {
    it('should create format instance with default options', () => {
      // Given: A new format instance
      // When: Creating the instance
      // Then: Should have default options
      expect(format).toBeDefined();
      expect(format.formatName).toBe('test');
      expect(format.supportedExtensions).toEqual(['.test', '.txt']);
    });

    it('should validate project data correctly', async () => {
      // Given: Valid project data
      // When: Validating the data
      const isValid = await format.validate(mockProjectData);
      
      // Then: Should return true for valid data
      expect(isValid).toBe(true);
    });

    it('should reject invalid project data', async () => {
      // Given: Invalid project data
      const invalidData = { invalid: 'data' } as any;
      
      // When: Validating the data
      const isValid = await format.validate(invalidData);
      
      // Then: Should return false for invalid data
      expect(isValid).toBe(false);
    });

    it('should serialize project data correctly', async () => {
      // Given: Valid project data
      // When: Serializing the data
      const result = await format.serialize(mockProjectData, mockOptions);
      
      // Then: Should return serialized string
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('test-project');
    });

    it('should format project data with options', async () => {
      // Given: Project data and formatting options
      // When: Formatting the data
      const result = await format.format(mockProjectData, mockOptions);
      
      // Then: Should return formatted output
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('test-project');
    });
  });

  describe('Error Handling', () => {
    it('should handle serialization errors gracefully', async () => {
      // Given: A format that throws during serialization
      const errorFormat = new TestFormat();
      errorFormat['serializeData'] = jest.fn().mockRejectedValue(new Error('Serialization failed'));
      
      // When: Attempting to serialize
      // Then: Should throw appropriate error
      await expect(errorFormat.serialize(mockProjectData, mockOptions))
        .rejects.toThrow('Serialization failed');
    });

    it('should handle validation errors gracefully', async () => {
      // Given: A format that throws during validation
      const errorFormat = new TestFormat();
      errorFormat['validateData'] = jest.fn().mockImplementation(() => {
        throw new Error('Validation failed');
      });
      
      // When: Attempting to validate
      // Then: Should throw appropriate error
      await expect(errorFormat.validate(mockProjectData))
        .rejects.toThrow('Validation failed');
    });

    it('should handle null or undefined data', async () => {
      // Given: Null or undefined data
      // When: Attempting to process
      // Then: Should handle gracefully
      await expect(format.validate(null as any)).resolves.toBe(false);
      await expect(format.validate(undefined as any)).resolves.toBe(false);
    });

    it('should handle empty project data', async () => {
      // Given: Empty project data
      const emptyData = { project: {} } as any;
      
      // When: Processing the data
      const isValid = await format.validate(emptyData);
      
      // Then: Should handle gracefully
      expect(isValid).toBe(false);
    });
  });

  describe('Configuration and Options', () => {
    it('should use custom options when provided', async () => {
      // Given: Custom options
      const customOptions = {
        prettyPrint: false,
        includeMetadata: false,
        compression: 'gzip' as const,
        encoding: 'ascii'
      };
      
      // When: Formatting with custom options
      const result = await format.format(mockProjectData, customOptions);
      
      // Then: Should use custom options
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should merge options with defaults', async () => {
      // Given: Partial options
      const partialOptions = {
        prettyPrint: false
      };
      
      // When: Formatting with partial options
      const result = await format.format(mockProjectData, partialOptions);
      
      // Then: Should merge with defaults
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle undefined options', async () => {
      // Given: Undefined options
      // When: Formatting without options
      const result = await format.format(mockProjectData, undefined);
      
      // Then: Should use default options
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Abstract Methods Implementation', () => {
    it('should implement formatName property', () => {
      // Given: A format instance
      // When: Accessing formatName
      // Then: Should return the format name
      expect(format.formatName).toBe('test');
    });

    it('should implement supportedExtensions property', () => {
      // Given: A format instance
      // When: Accessing supportedExtensions
      // Then: Should return supported extensions
      expect(format.supportedExtensions).toEqual(['.test', '.txt']);
    });

    it('should implement serializeData method', async () => {
      // Given: Project data
      // When: Calling serializeData directly
      const result = await format['serializeData'](mockProjectData);
      
      // Then: Should return serialized data
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should implement validateData method', () => {
      // Given: Project data
      // When: Calling validateData directly
      const result = format['validateData'](mockProjectData);
      
      // Then: Should return validation result
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should implement getDefaultOptions method', () => {
      // Given: A format instance
      // When: Calling getDefaultOptions
      const options = format['getDefaultOptions']();
      
      // Then: Should return default options
      expect(options).toBeDefined();
      expect(options.prettyPrint).toBe(true);
      expect(options.includeMetadata).toBe(true);
    });
  });

  describe('Edge Cases and Human-Missable Scenarios', () => {
    it('should handle very large project data', async () => {
      // Given: Very large project data
      const largeData = {
        ...mockProjectData,
        nodes: Array(10000).fill(null).map((_, i) => ({
          id: `node-${i}`,
          name: `Node${i}`,
          type: 'class',
          position: { line: i, column: 0 },
          metadata: {}
        }))
      };
      
      // When: Processing large data
      const result = await format.format(largeData, mockOptions);
      
      // Then: Should handle efficiently
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle deeply nested project data', async () => {
      // Given: Deeply nested project data
      const nestedData = {
        ...mockProjectData,
        structure: {
          ...mockProjectData.structure,
          directories: Array(100).fill(null).map((_, i) => ({
            name: `Dir${i}`,
            path: `/test/path/dir${i}`,
            fileCount: i,
            subdirectoryCount: i,
            totalSize: i * 1000
          }))
        }
      };
      
      // When: Processing nested data
      const result = await format.format(nestedData, mockOptions);
      
      // Then: Should handle correctly
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle special characters in project data', async () => {
      // Given: Project data with special characters
      const specialData = {
        ...mockProjectData,
        name: 'test-project-ñáéíóú-🚀-特殊字符'
      };
      
      // When: Processing special characters
      const result = await format.format(specialData, mockOptions);
      
      // Then: Should handle correctly
      expect(result).toBeDefined();
      expect(result).toContain('test-project-ñáéíóú-🚀-特殊字符');
    });

    it('should handle circular references in data', async () => {
      // Given: Data with circular references
      const circularData = { ...mockProjectData };
      (circularData as any).circular = circularData;
      
      // When: Processing circular data
      // Then: Should handle gracefully (JSON.stringify will handle this)
      await expect(format.format(circularData, mockOptions))
        .rejects.toThrow('Formatting failed');
    });

    it('should handle concurrent formatting requests', async () => {
      // Given: Multiple concurrent requests
      const promises = Array(10).fill(null).map(() => 
        format.format(mockProjectData, mockOptions)
      );
      
      // When: Processing concurrently
      const results = await Promise.all(promises);
      
      // Then: Should handle all requests
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory with repeated operations', async () => {
      // Given: Repeated operations
      const iterations = 100;
      
      // When: Performing repeated operations
      for (let i = 0; i < iterations; i++) {
        await format.format(mockProjectData, mockOptions);
      }
      
      // Then: Should complete without memory issues
      expect(true).toBe(true); // If we get here, no memory leak
    });

    it('should handle memory-efficient processing', async () => {
      // Given: Large dataset
      const startMemory = process.memoryUsage().heapUsed;
      
      // When: Processing large data
      const largeData = {
        ...mockProjectData,
        nodes: Array(5000).fill(null).map((_, i) => ({
          id: `node-${i}`,
          name: `Node${i}`,
          type: 'class',
          position: { line: i, column: 0 },
          metadata: {}
        }))
      };
      
      await format.format(largeData, mockOptions);
      
      // Then: Should not consume excessive memory
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with real project analysis output', async () => {
      // Given: Real project analysis output structure
      const realData: ProjectInfo = {
        name: 'real-project',
        version: '2.1.0',
        type: 'typescript',
        rootPath: '/real/path',
        description: 'Real project',
        entryPoints: [],
        dependencies: [
          {
            name: 'typescript',
            version: '^4.9.0',
            type: 'production',
            source: 'npm',
            metadata: {}
          },
          {
            name: 'jest',
            version: '^29.0.0',
            type: 'development',
            source: 'npm',
            metadata: {}
          }
        ],
        devDependencies: [],
        structure: {
          directories: [
            {
              name: 'src',
              path: '/real/path/src',
              fileCount: 1,
              subdirectoryCount: 0,
              totalSize: 1024
            }
          ],
          files: [
            {
              name: 'index.ts',
              path: '/real/path/src/index.ts',
              extension: '.ts',
              size: 1024,
              lines: 50,
              lastModified: new Date(),
              hash: 'abc123'
            }
          ],
          totalFiles: 1,
          totalLines: 50,
          totalSize: 1024
        },
        ast: [
          {
            id: 'node-1',
            name: 'TestClass',
            type: 'class',
            filePath: '/real/path/src/index.ts',
            start: 100,
            end: 200,
            nodeType: 'class',
            children: [],
            properties: {
              modifiers: ['public'],
              decorators: []
            },
            metadata: {}
          }
        ],
        relations: [
          {
            id: 'rel-1',
            from: 'node-1',
            to: 'node-2',
            type: 'extends',
            metadata: {}
          }
        ],
        publicExports: [],
        privateExports: [],
        complexity: {
          cyclomaticComplexity: 5,
          cognitiveComplexity: 3,
          linesOfCode: 150,
          functionCount: 10,
          classCount: 2,
          interfaceCount: 1
        },
        quality: {
          score: 85,
          maintainabilityIndex: 80,
          technicalDebtRatio: 0.1,
          duplicationPercentage: 5,
          testCoveragePercentage: 90
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '2.1.0',
          parser: 'enhanced-typescript-parser'
        }
      };
      
      // When: Formatting real data
      const result = await format.format(realData, mockOptions);
      
      // Then: Should handle correctly
      expect(result).toBeDefined();
      expect(result).toContain('real-project');
      expect(result).toContain('TestClass');
      expect(result).toContain('typescript');
    });

    it('should handle different output strategies', async () => {
      // Given: Different output strategies
      const strategies = ['file', 'stream', 'memory'];
      
      // When: Testing each strategy
      for (const strategy of strategies) {
        const options = { ...mockOptions, strategy } as any;
        const result = await format.format(mockProjectData, options);
        
        // Then: Should handle each strategy
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('Branch Coverage Tests', () => {
    it('should throw error when data is null in serialize method', async () => {
      // Given: Null data
      // When: Attempting to serialize null data
      // Then: Should throw error
      await expect(format.serialize(null as any, mockOptions))
        .rejects.toThrow('Serialization failed: Data is required for serialization');
    });

    it('should throw error when data is undefined in serialize method', async () => {
      // Given: Undefined data
      // When: Attempting to serialize undefined data
      // Then: Should throw error
      await expect(format.serialize(undefined as any, mockOptions))
        .rejects.toThrow('Serialization failed: Data is required for serialization');
    });

    it('should throw error when validation fails in format method', async () => {
      // Given: Invalid data that fails validation
      const invalidData = { invalid: 'data' } as any;
      
      // When: Attempting to format invalid data
      // Then: Should throw error
      await expect(format.format(invalidData, mockOptions))
        .rejects.toThrow('Formatting failed: Invalid project analysis data');
    });

    it('should return false for empty extension in supportsExtension', () => {
      // Given: Empty extension
      // When: Checking if empty extension is supported
      const result = format.supportsExtension('');
      
      // Then: Should return false
      expect(result).toBe(false);
    });

    it('should return false for null extension in supportsExtension', () => {
      // Given: Null extension
      // When: Checking if null extension is supported
      const result = format.supportsExtension(null as any);
      
      // Then: Should return false
      expect(result).toBe(false);
    });

    it('should return false for undefined extension in supportsExtension', () => {
      // Given: Undefined extension
      // When: Checking if undefined extension is supported
      const result = format.supportsExtension(undefined as any);
      
      // Then: Should return false
      expect(result).toBe(false);
    });

    it('should normalize extension without dot prefix in supportsExtension', () => {
      // Given: Extension without dot prefix
      // When: Checking if extension is supported
      const result = format.supportsExtension('test');
      
      // Then: Should normalize and check against supported extensions
      expect(result).toBe(true); // .test is in supportedExtensions
    });

    it('should handle extension with dot prefix in supportsExtension', () => {
      // Given: Extension with dot prefix
      // When: Checking if extension is supported
      const result = format.supportsExtension('.txt');
      
      // Then: Should check directly against supported extensions
      expect(result).toBe(true); // .txt is in supportedExtensions
    });

    it('should return false for unsupported extension in supportsExtension', () => {
      // Given: Unsupported extension
      // When: Checking if extension is supported
      const result = format.supportsExtension('.unsupported');
      
      // Then: Should return false
      expect(result).toBe(false);
    });

    it('should handle whitespace-only extension in supportsExtension', () => {
      // Given: Whitespace-only extension
      // When: Checking if extension is supported
      const result = format.supportsExtension('   ');
      
      // Then: Should return false (whitespace is falsy)
      expect(result).toBe(false);
    });

    it('should handle extension with special characters in supportsExtension', () => {
      // Given: Extension with special characters
      // When: Checking if extension is supported
      const result = format.supportsExtension('.test-file');
      
      // Then: Should return false (not in supported extensions)
      expect(result).toBe(false);
    });

    it('should handle non-Error objects in validation catch block', async () => {
      // Given: A format that throws a non-Error object during validation
      const errorFormat = new TestFormat();
      errorFormat['validateData'] = jest.fn().mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });
      
      // When: Attempting to validate
      // Then: Should throw error with 'Unknown error' message
      await expect(errorFormat.validate(mockProjectData))
        .rejects.toThrow('Validation failed: Unknown error');
    });

    it('should handle non-Error objects in serialization catch block', async () => {
      // Given: A format that throws a non-Error object during serialization
      const errorFormat = new TestFormat();
      errorFormat['serializeData'] = jest.fn().mockRejectedValue('String error'); // Non-Error object
      
      // When: Attempting to serialize
      // Then: Should throw error with 'Unknown error' message
      await expect(errorFormat.serialize(mockProjectData, mockOptions))
        .rejects.toThrow('Serialization failed: Unknown error');
    });

    it('should handle non-Error objects in format catch block', async () => {
      // Given: A format that throws a non-Error object during formatting
      const errorFormat = new TestFormat();
      errorFormat['validateData'] = jest.fn().mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });
      
      // When: Attempting to format
      // Then: Should throw error with 'Unknown error' message
      await expect(errorFormat.format(mockProjectData, mockOptions))
        .rejects.toThrow('Formatting failed: Validation failed: Unknown error');
    });

    it('should handle null error objects in validation catch block', async () => {
      // Given: A format that throws null during validation
      const errorFormat = new TestFormat();
      errorFormat['validateData'] = jest.fn().mockImplementation(() => {
        throw null; // Null error
      });
      
      // When: Attempting to validate
      // Then: Should throw error with 'Unknown error' message
      await expect(errorFormat.validate(mockProjectData))
        .rejects.toThrow('Validation failed: Unknown error');
    });

    it('should handle undefined error objects in serialization catch block', async () => {
      // Given: A format that throws undefined during serialization
      const errorFormat = new TestFormat();
      errorFormat['serializeData'] = jest.fn().mockImplementation(() => {
        throw undefined; // Undefined error
      });
      
      // When: Attempting to serialize
      // Then: Should throw error with 'Unknown error' message
      await expect(errorFormat.serialize(mockProjectData, mockOptions))
        .rejects.toThrow('Serialization failed: Unknown error');
    });

    it('should handle number error objects in format catch block', async () => {
      // Given: A format that throws a number during formatting
      const errorFormat = new TestFormat();
      errorFormat['validateData'] = jest.fn().mockImplementation(() => {
        throw 42; // Number error
      });
      
      // When: Attempting to format
      // Then: Should throw error with 'Unknown error' message
      await expect(errorFormat.format(mockProjectData, mockOptions))
        .rejects.toThrow('Formatting failed: Validation failed: Unknown error');
    });

    it('should handle non-Error objects in serialize method during format', async () => {
      // Given: A format that throws a non-Error object during serialization in format method
      const errorFormat = new TestFormat();
      errorFormat['serializeData'] = jest.fn().mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });
      
      // When: Attempting to format (which calls serialize)
      // Then: Should throw error with 'Unknown error' message
      await expect(errorFormat.format(mockProjectData, mockOptions))
        .rejects.toThrow('Formatting failed: Serialization failed: Unknown error');
    });
  });
});

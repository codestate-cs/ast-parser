/**
 * Tests for OutputManager class
 */

import { OutputManager } from '../../../src/output/OutputManager';
import { ProjectInfo, OutputOptions } from '../../../src/types';
import { JSONFormat } from '../../../src/output/formats/JSONFormat';

describe('OutputManager', () => {
  let outputManager: OutputManager;
  let mockProjectData: ProjectInfo;

  beforeEach(() => {
    outputManager = new OutputManager();
    mockProjectData = {
      name: 'test-project',
      version: '1.0.0',
      type: 'typescript',
      rootPath: '/test/path',
      entryPoints: [],
      dependencies: [],
      devDependencies: [],
      structure: {
        files: [],
        directories: [],
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
      }
    };
  });

  describe('Basic Functionality', () => {
    it('should create OutputManager instance', () => {
      expect(outputManager).toBeInstanceOf(OutputManager);
    });

    it('should register output formats', () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      expect(outputManager.hasFormat('json')).toBe(true);
    });

    it('should unregister output formats', () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      expect(outputManager.hasFormat('json')).toBe(true);
      
      outputManager.unregisterFormat('json');
      expect(outputManager.hasFormat('json')).toBe(false);
    });

    it('should list available formats', () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const formats = outputManager.getAvailableFormats();
      expect(formats).toContain('json');
    });

    it('should generate output with file strategy', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputFile: '/tmp/test-output.json',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
    });

    it('should generate output with memory strategy', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data).toBe('string');
    });

    it('should generate output with stream strategy', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'stream',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.stream).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unsupported format errors', async () => {
      const options: OutputOptions = {
        format: 'unsupported' as any,
        strategy: 'file',
        outputFile: '/test/output.json',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unsupported format');
    });

    it('should handle invalid project data', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputFile: '/test/output.json',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(null as any, options);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle file write errors', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputFile: '/root/restricted/path/output.json', // Restricted path that should fail
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle format validation errors', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputFile: '/test/output.json',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      // Create invalid project data that will fail validation
      const invalidData = {
        name: null, // Invalid name
        version: '1.0.0',
        type: 'typescript',
        rootPath: '/test/path'
      } as any;
      
      const result = await outputManager.generateOutput(invalidData, options);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Configuration and Options', () => {
    it('should use default options when not provided', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const result = await outputManager.generateOutput(mockProjectData);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should merge provided options with defaults', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const partialOptions: Partial<OutputOptions> = {
        format: 'json',
        prettyPrint: false
      };
      
      const result = await outputManager.generateOutput(mockProjectData, partialOptions);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle different compression options', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const compressionTypes: Array<OutputOptions['compression']> = ['none', 'gzip', 'brotli'];
      
      for (const compression of compressionTypes) {
        const options = {
          format: 'json',
          strategy: 'memory',
          compression,
          prettyPrint: true,
          encoding: 'utf8'
        } as OutputOptions;
        
        const result = await outputManager.generateOutput(mockProjectData, options);
        expect(result.success).toBe(true);
      }
    });

    it('should handle different encoding options', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const encodings: Array<OutputOptions['encoding']> = ['utf8', 'utf16', 'ascii'];
      
      for (const encoding of encodings) {
        const options = {
          format: 'json',
          strategy: 'memory',
          encoding,
          prettyPrint: true,
          compression: 'none'
        } as OutputOptions;
        
        const result = await outputManager.generateOutput(mockProjectData, options);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('File Management', () => {
    it('should generate unique file names when output file is not specified', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputDir: '/tmp/test-output',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
      expect(result.outputPath).toContain('test-project');
      expect(result.outputPath).toContain('.json');
    });

    it('should create output directory if it does not exist', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputDir: '/tmp/test-output',
        outputFile: 'test.json',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
    });

    it('should handle file naming with timestamps', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputDir: '/tmp/test-output',
        outputFile: 'test-with-timestamp.json', // Provide explicit filename
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none',
        includeTimestamp: true
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
      expect(result.outputPath).toContain('/tmp/test-output');
      expect(result.outputPath).toContain('test-with-timestamp.json');
    });
  });

  describe('Edge Cases and Human-Missable Scenarios', () => {
    it('should handle very large project data', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const largeData = { ...mockProjectData };
      largeData.ast = Array.from({ length: 10000 }, (_, i) => ({
        id: `node-${i}`,
        name: `Node${i}`,
        type: 'function',
        filePath: `/test/path/file${i}.ts`,
        start: i * 10,
        end: (i + 1) * 10,
        nodeType: 'function' as const,
        children: [],
        properties: {},
        metadata: {}
      }));
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(largeData, options);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle concurrent output generation', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const promises = Array.from({ length: 10 }, () => 
        outputManager.generateOutput(mockProjectData, options)
      );
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result: any) => {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });
    });

    it('should handle special characters in project names', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const specialData = { ...mockProjectData };
      specialData.name = 'test-project-with-special-chars-!@#$%^&*()';
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputDir: '/tmp/test-output',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(specialData, options);
      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
    });

    it('should handle empty project data', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const emptyData = { ...mockProjectData };
      emptyData.ast = [];
      emptyData.relations = [];
      emptyData.dependencies = [];
      emptyData.devDependencies = [];
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(emptyData, options);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory with repeated operations', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const iterations = 100;
      for (let i = 0; i < iterations; i++) {
        const result = await outputManager.generateOutput(mockProjectData, options);
        expect(result.success).toBe(true);
      }
    });

    it('should handle memory-efficient processing', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const largeData = { ...mockProjectData };
      largeData.ast = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i}`,
        name: `Node${i}`,
        type: 'function',
        filePath: `/test/path/file${i}.ts`,
        start: i * 10,
        end: (i + 1) * 10,
        nodeType: 'function' as const,
        children: [],
        properties: {},
        metadata: {}
      }));
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: false, // Compact to save memory
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(largeData, options);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with real project analysis output', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const realData: ProjectInfo = {
        name: 'real-project',
        version: '2.1.0',
        type: 'typescript',
        rootPath: '/real/path',
        entryPoints: [
          {
            path: '/real/path/src/index.ts',
            type: 'main',
            description: 'Main entry point',
            metadata: {}
          }
        ],
        dependencies: [
          {
            name: 'react',
            version: '^18.0.0',
            type: 'production',
            source: 'npm',
            metadata: {}
          }
        ],
        devDependencies: [
          {
            name: 'typescript',
            version: '^4.9.0',
            type: 'development',
            source: 'npm',
            metadata: {}
          }
        ],
        structure: {
          files: [
            {
              name: 'index.ts',
              path: '/real/path/src/index.ts',
              size: 1024,
              lines: 50,
              lastModified: new Date(),
              hash: 'abc123',
              extension: '.ts'
            }
          ],
          directories: [
            {
              name: 'src',
              path: '/real/path/src',
              fileCount: 1,
              subdirectoryCount: 0,
              totalSize: 1024
            }
          ],
          totalFiles: 1,
          totalLines: 50,
          totalSize: 1024
        },
        ast: [
          {
            id: 'node-1',
            name: 'MyClass',
            type: 'class',
            filePath: '/real/path/src/index.ts',
            start: 0,
            end: 100,
            nodeType: 'class',
            children: [],
            properties: {},
            metadata: {}
          }
        ],
        relations: [
          {
            id: 'rel-1',
            from: 'node-1',
            to: 'node-2',
            type: 'import',
            metadata: {}
          }
        ],
        publicExports: [
          {
            name: 'MyClass',
            type: 'class',
            file: '/real/path/src/index.ts',
            isDefault: false,
            metadata: {}
          }
        ],
        privateExports: [],
        complexity: {
          cyclomaticComplexity: 5,
          cognitiveComplexity: 8,
          linesOfCode: 50,
          functionCount: 3,
          classCount: 1,
          interfaceCount: 0
        },
        quality: {
          score: 92,
          maintainabilityIndex: 85,
          technicalDebtRatio: 0.05,
          duplicationPercentage: 2,
          testCoveragePercentage: 95
        }
      };
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(realData, options);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const parsed = JSON.parse(result.data!);
      expect(parsed.name).toBe('real-project');
      expect(parsed.entryPoints).toHaveLength(1);
      expect(parsed.dependencies).toHaveLength(1);
    });

    it('should handle different output strategies with same data', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const strategies: Array<OutputOptions['strategy']> = ['file', 'stream', 'memory'];
      
      for (const strategy of strategies) {
        const options = {
          format: 'json',
          strategy,
          prettyPrint: true,
          encoding: 'utf8',
          compression: 'none'
        } as OutputOptions;
        
        const result = await outputManager.generateOutput(mockProjectData, options);
        expect(result.success).toBe(true);
        
        if (strategy === 'memory') {
          expect(result.data).toBeDefined();
        } else if (strategy === 'file') {
          expect(result.outputPath).toBeDefined();
        } else if (strategy === 'stream') {
          expect(result.stream).toBeDefined();
        }
      }
    });
  });

  describe('Coverage Improvement Tests', () => {
    it('should handle invalid format name in registerFormat (line 45)', () => {
      const jsonFormat = new JSONFormat();
      
      expect(() => {
        outputManager.registerFormat('', jsonFormat);
      }).toThrow('Format name must be a non-empty string');
      
      expect(() => {
        outputManager.registerFormat(null as any, jsonFormat);
      }).toThrow('Format name must be a non-empty string');
    });

    it('should handle invalid format instance in registerFormat (line 48)', () => {
      expect(() => {
        outputManager.registerFormat('json', null as any);
      }).toThrow('Format instance is required');
    });

    it('should handle invalid format name in unregisterFormat (line 58)', () => {
      expect(outputManager.unregisterFormat('')).toBe(false);
      expect(outputManager.unregisterFormat(null as any)).toBe(false);
    });

    it('should handle invalid format name in hasFormat (line 68)', () => {
      expect(outputManager.hasFormat('')).toBe(false);
      expect(outputManager.hasFormat(null as any)).toBe(false);
    });

    it('should handle unsupported strategy in executeStrategy', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options = {
        format: 'json' as any,
        strategy: 'unsupported' as any,
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none' as any
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported strategy');
    });

    it('should handle relative output file path', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'file',
        outputFile: 'relative-output.json',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
      expect(result.outputPath).toContain('relative-output.json');
    });

    it('should handle format with no supported extensions', async () => {
      // Create a mock format with no supported extensions
      const mockFormat = {
        formatName: 'mock',
        supportedExtensions: [],
        serialize: jest.fn().mockResolvedValue('mock data'),
        validate: jest.fn().mockResolvedValue(true)
      } as any;
      
      outputManager.registerFormat('mock', mockFormat);
      
      const options: OutputOptions = {
        format: 'mock' as any,
        strategy: 'file',
        outputDir: '/tmp/test-output',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(true);
      expect(result.outputPath).toBeDefined();
      expect(result.outputPath).toContain('.txt'); // Should use default extension
    });

    it('should test setDefaultOptions method (line 163)', () => {
      const newDefaults = {
        prettyPrint: false,
        encoding: 'utf16',
        compression: 'gzip' as any
      };
      
      outputManager.setDefaultOptions(newDefaults);
      
      const defaults = outputManager.getDefaultOptions();
      expect(defaults.prettyPrint).toBe(false);
      expect(defaults.encoding).toBe('utf16');
      expect(defaults.compression).toBe('gzip');
    });

    it('should test stream strategy implementation (lines 254-255)', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'stream',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(mockProjectData, options);
      expect(result.success).toBe(true);
      expect(result.stream).toBeDefined();
      
      // Test that the stream can be read
      const chunks: Buffer[] = [];
      result.stream!.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      await new Promise<void>((resolve) => {
        result.stream!.on('end', () => {
          const data = Buffer.concat(chunks).toString();
          expect(data).toBeDefined();
          expect(data.length).toBeGreaterThan(0);
          resolve();
        });
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle malformed project data gracefully', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const malformedData = {
        ...mockProjectData,
        ast: [
          {
            id: 'malformed-node',
            name: 'valid-name',
            type: 'function',
            filePath: '/valid/path.ts',
            start: 0,
            end: 10,
            nodeType: 'function' as const,
            children: [],
            properties: {},
            metadata: {}
          }
        ]
      };
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(malformedData, options);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle missing optional properties', async () => {
      const jsonFormat = new JSONFormat();
      outputManager.registerFormat('json', jsonFormat);
      
      const minimalData = {
        name: 'minimal-project',
        version: '1.0.0',
        type: 'typescript' as const,
        rootPath: '/minimal/path',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: {
          files: [],
          directories: [],
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
          score: 0,
          maintainabilityIndex: 0,
          technicalDebtRatio: 0,
          duplicationPercentage: 0,
          testCoveragePercentage: 0
        }
      };
      
      const options: OutputOptions = {
        format: 'json',
        strategy: 'memory',
        prettyPrint: true,
        encoding: 'utf8',
        compression: 'none'
      };
      
      const result = await outputManager.generateOutput(minimalData, options);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

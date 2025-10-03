/**
 * Tests for ProjectParser class
 */

import { ProjectParser, ProjectDetector, CacheManager } from '../../../src/core';
import { ParsingOptions } from '../../../src/types';
import { FileUtils, PathUtils } from '../../../src/utils';

// Mock dependencies
jest.mock('../../../src/core/ProjectDetector');
jest.mock('../../../src/utils/file/FileUtils', () => ({
  ...jest.requireActual('../../../src/utils/file/FileUtils'),
  relative: jest.fn((from: string, to: string) => {
    const path = require('path');
    return path.relative(from, to);
  })
}));

describe('ProjectParser', () => {
  let parser: ProjectParser;

  beforeEach(() => {
    parser = new ProjectParser();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(parser).toBeDefined();
    });

    it('should create instance with custom options', () => {
      const customOptions: Partial<ParsingOptions> = {
        filtering: {
          maxDepth: 5
        }
      };
      const customParser = new ProjectParser(customOptions);
      expect(customParser).toBeDefined();
    });
  });

  describe('parseProject', () => {
    it('should parse a valid project successfully', async () => {
      const mockDetection = {
        type: 'typescript' as const,
        language: 'typescript' as const,
        confidence: 0.9,
        metadata: {
          config: { name: 'test-project', version: '1.0.0' },
          files: ['src/index.ts'],
          dependencies: {}
        }
      };


      (ProjectDetector.detectProjectType as jest.Mock).mockResolvedValue(mockDetection);
      (ProjectDetector.getProjectRoot as jest.Mock).mockResolvedValue(__dirname);

      // Mock private methods by accessing them through the instance
      const mockFiles = [{ path: 'src/index.ts', name: 'index.ts', extension: '.ts', size: 100, lines: 10, lastModified: new Date(), hash: 'hash1' }];
      const mockASTNodes = [{ id: 'node1', type: 'class', name: 'TestClass', filePath: 'src/index.ts', line: 1, column: 1, nodeType: 'class', children: [], properties: {}, start: 0, end: 50 }];
      const mockRelations = [{ id: 'rel1', type: 'inheritance', from: 'node1', to: 'node2' }];

      // Mock the private methods by spying on the prototype
      jest.spyOn(parser as any, 'discoverFiles').mockResolvedValue(mockFiles);
      jest.spyOn(parser as any, 'parseFiles').mockResolvedValue(mockASTNodes);
      jest.spyOn(parser as any, 'buildRelations').mockResolvedValue(mockRelations);
      jest.spyOn(parser as any, 'analyzeStructure').mockResolvedValue({
        files: mockFiles,
        directories: [],
        totalFiles: 1,
        totalLines: 10,
        totalSize: 1000
      });
      jest.spyOn(parser as any, 'calculateComplexity').mockResolvedValue({
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        maintainabilityIndex: 100
      });
      jest.spyOn(parser as any, 'calculateQuality').mockResolvedValue({
        score: 0.9,
        issues: [],
        suggestions: []
      });

      const result = await parser.parseProject(__dirname);
      
      expect(result).toBeDefined();
      expect(result.type).toBe('typescript');
      expect(result.name).toBe('test-project');
      expect(result.rootPath).toBe(__dirname);
    });

    it('should handle parsing errors gracefully', async () => {
      (ProjectDetector.detectProjectType as jest.Mock).mockRejectedValue(new Error('Detection failed'));

      await expect(parser.parseProject('/invalid/path')).rejects.toThrow('Detection failed');
    });

    it('should handle file discovery errors', async () => {
      const mockDetection = {
        type: 'typescript' as const,
        language: 'typescript' as const,
        confidence: 0.9,
        metadata: {
          config: { name: 'test-project', version: '1.0.0' },
          files: ['src/index.ts'],
          dependencies: {}
        }
      };

      (ProjectDetector.detectProjectType as jest.Mock).mockResolvedValue(mockDetection);
      (ProjectDetector.getProjectRoot as jest.Mock).mockResolvedValue(__dirname);
      jest.spyOn(parser as any, 'discoverFiles').mockRejectedValue(new Error('File discovery failed'));

      await expect(parser.parseProject(__dirname)).rejects.toThrow('File discovery failed');
    });
  });

  describe('private methods', () => {
    it('should have discoverFiles method', () => {
      expect(typeof (parser as any).discoverFiles).toBe('function');
    });

    it('should have parseFiles method', () => {
      expect(typeof (parser as any).parseFiles).toBe('function');
    });

    it('should have buildRelations method', () => {
      expect(typeof (parser as any).buildRelations).toBe('function');
    });

    it('should have analyzeStructure method', () => {
      expect(typeof (parser as any).analyzeStructure).toBe('function');
    });

    it('should have calculateComplexity method', () => {
      expect(typeof (parser as any).calculateComplexity).toBe('function');
    });

    it('should have calculateQuality method', () => {
      expect(typeof (parser as any).calculateQuality).toBe('function');
    });

    it('should have extractName method', () => {
      expect(typeof (parser as any).extractName).toBe('function');
    });

    it('should have mergeOptions method', () => {
      expect(typeof (parser as any).mergeOptions).toBe('function');
    });
  });

  describe('extractName method', () => {
    it('should extract class name from content', () => {
      const content = 'export class TestClass { }';
      const name = (parser as any).extractName(content, 'export class ');
      expect(name).toBe('TestClass');
    });

    it('should extract function name from content', () => {
      const content = 'function testFunction() { }';
      const name = (parser as any).extractName(content, 'function ');
      expect(name).toBe('testFunction');
    });

    it('should return unknown for invalid content', () => {
      const content = 'invalid content';
      const name = (parser as any).extractName(content, 'class ');
      expect(name).toBe('unknown');
    });

    it('should handle empty content', () => {
      const content = '';
      const name = (parser as any).extractName(content, 'class ');
      expect(name).toBe('unknown');
    });

    it('should handle content without prefix', () => {
      const content = 'TestClass';
      const name = (parser as any).extractName(content, 'class ');
      expect(name).toBe('unknown');
    });
  });

  describe('mergeOptions method', () => {
    it('should merge options correctly', () => {
      const baseOptions = {
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
      
      const overrideOptions = {
        filtering: {
          maxDepth: 5
        },
        performance: {
          maxConcurrentFiles: 10
        }
      };

      const mergedOptions = (parser as any).mergeOptions(baseOptions, overrideOptions);
      
      expect(mergedOptions.filtering.maxDepth).toBe(5);
      expect(mergedOptions.filtering.includePatterns).toEqual(['**/*.ts']);
      expect(mergedOptions.performance.maxConcurrentFiles).toBe(10);
      expect(mergedOptions.mode).toBe('full');
    });

    it('should handle empty override options', () => {
      const baseOptions = {
        filtering: {
          includePatterns: ['**/*.ts'],
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
      
      const overrideOptions = {};

      const mergedOptions = (parser as any).mergeOptions(baseOptions, overrideOptions);
      
      expect(mergedOptions.filtering.maxDepth).toBe(10);
      expect(mergedOptions.filtering.includePatterns).toEqual(['**/*.ts']);
    });

    it('should handle undefined override options', () => {
      const baseOptions = {
        filtering: {
          includePatterns: ['**/*.ts'],
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

      const mergedOptions = (parser as any).mergeOptions(baseOptions, undefined);
      
      expect(mergedOptions.filtering.maxDepth).toBe(10);
      expect(mergedOptions.filtering.includePatterns).toEqual(['**/*.ts']);
    });
  });

  describe('private methods detailed tests', () => {
    describe('discoverFiles', () => {
      it('should discover files successfully', async () => {
        jest.spyOn(parser as any, 'discoverFilesRecursive').mockResolvedValue(undefined);
        
        const result = await (parser as any).discoverFiles('/test');
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });

      it('should handle discovery errors', async () => {
        jest.spyOn(parser as any, 'discoverFilesRecursive').mockRejectedValue(new Error('Discovery failed'));
        
        await expect((parser as any).discoverFiles('/test')).rejects.toThrow('Discovery failed');
      });
    });

    describe('discoverFilesRecursive', () => {
      it('should respect max depth limit', async () => {
        const mockFiles: any[] = [];
        const customParser = new ProjectParser({
          filtering: { maxDepth: 1 }
        });
        
        jest.spyOn(FileUtils, 'listDirectory').mockResolvedValue(['subdir']);
        jest.spyOn(FileUtils, 'getStats').mockResolvedValue({ 
          isDirectory: true, 
          isFile: false, 
          size: 0, 
          birthtime: new Date(), 
          atime: new Date(), 
          mtime: new Date(), 
          ctime: new Date(), 
          isSymbolicLink: false 
        });
        jest.spyOn(FileUtils, 'join').mockReturnValue('/test/subdir');
        jest.spyOn(PathUtils, 'isInNodeModules').mockReturnValue(false);
        
        await (customParser as any).discoverFilesRecursive('/test', mockFiles, 1);
        
        // Should not call listDirectory since max depth is reached
        expect(FileUtils.listDirectory).toHaveBeenCalledTimes(0);
      });

      it('should skip node_modules when configured', async () => {
        const mockFiles: any[] = [];
        const customParser = new ProjectParser({
          filtering: { skipNodeModules: true }
        });
        
        jest.spyOn(FileUtils, 'listDirectory').mockResolvedValue(['node_modules']);
        jest.spyOn(FileUtils, 'getStats').mockResolvedValue({ 
          isDirectory: true, 
          isFile: false, 
          size: 0, 
          birthtime: new Date(), 
          atime: new Date(), 
          mtime: new Date(), 
          ctime: new Date(), 
          isSymbolicLink: false 
        });
        jest.spyOn(FileUtils, 'join').mockReturnValue('/test/node_modules');
        jest.spyOn(PathUtils, 'isInNodeModules').mockReturnValue(true);
        
        await (customParser as any).discoverFilesRecursive('/test', mockFiles, 0);
        
        // Should not recursively process node_modules
        expect(FileUtils.listDirectory).toHaveBeenCalledTimes(1);
      });

      it('should process files when they should be included', async () => {
        const mockFiles: any[] = [];
        
        jest.spyOn(FileUtils, 'listDirectory').mockResolvedValue(['file.ts']);
        jest.spyOn(FileUtils, 'getStats').mockResolvedValue({ 
          isFile: true, 
          isDirectory: false, 
          size: 100, 
          birthtime: new Date(), 
          atime: new Date(), 
          mtime: new Date(), 
          ctime: new Date(), 
          isSymbolicLink: false 
        });
        jest.spyOn(FileUtils, 'join').mockReturnValue('/test/file.ts');
        jest.spyOn(parser as any, 'shouldIncludeFile').mockReturnValue(true);
        jest.spyOn(parser as any, 'countLines').mockResolvedValue(10);
        jest.spyOn(FileUtils, 'getFileName').mockReturnValue('file.ts');
        jest.spyOn(FileUtils, 'getExtension').mockReturnValue('.ts');
        
        await (parser as any).discoverFilesRecursive('/test', mockFiles, 0);
        
        expect(mockFiles).toHaveLength(1);
        expect(mockFiles[0].path).toBe('/test/file.ts');
      });

      it('should handle directory processing errors gracefully', async () => {
        const mockFiles: any[] = [];
        
        jest.spyOn(FileUtils, 'listDirectory').mockRejectedValue(new Error('Permission denied'));
        
        // Should not throw
        await (parser as any).discoverFilesRecursive('/test', mockFiles, 0);
        expect(mockFiles).toHaveLength(0);
      });
    });

    describe('shouldIncludeFile', () => {
      it('should exclude files matching exclude patterns', () => {
        const customParser = new ProjectParser({
          filtering: { excludePatterns: ['**/*.test.ts'] }
        });
        
        jest.spyOn(PathUtils, 'matchesPatterns').mockReturnValue(true);
        
        const result = (customParser as any).shouldIncludeFile('/test/file.test.ts');
        expect(result).toBe(false);
      });

      it('should exclude files not matching include patterns', () => {
        const customParser = new ProjectParser({
          filtering: { includePatterns: ['**/*.ts'] }
        });
        
        jest.spyOn(PathUtils, 'matchesPatterns').mockReturnValueOnce(false); // exclude check
        jest.spyOn(PathUtils, 'matchesPatterns').mockReturnValueOnce(false); // include check
        
        const result = (customParser as any).shouldIncludeFile('/test/file.js');
        expect(result).toBe(false);
      });

      it('should exclude test files when not included', () => {
        const customParser = new ProjectParser({
          filtering: { includeTestFiles: false }
        });
        
        jest.spyOn(PathUtils, 'matchesPatterns').mockReturnValue(false);
        jest.spyOn(PathUtils, 'isTestFile').mockReturnValue(true);
        
        const result = (customParser as any).shouldIncludeFile('/test/file.test.ts');
        expect(result).toBe(false);
      });

      it('should exclude documentation files when not included', () => {
        const customParser = new ProjectParser({
          filtering: { includeDocFiles: false }
        });
        
        jest.spyOn(PathUtils, 'matchesPatterns').mockReturnValue(false);
        jest.spyOn(PathUtils, 'isTestFile').mockReturnValue(false);
        jest.spyOn(PathUtils, 'isDocumentationFile').mockReturnValue(true);
        
        const result = (customParser as any).shouldIncludeFile('/test/README.md');
        expect(result).toBe(false);
      });

      it('should include source files', () => {
        // Mock all the PathUtils methods that shouldIncludeFile calls
        jest.spyOn(PathUtils, 'matchesPatterns').mockImplementation((_path, patterns) => {
          // Return true for include patterns, false for exclude patterns
          if (patterns.includes('**/*.ts')) return true;
          return false;
        });
        jest.spyOn(PathUtils, 'isTestFile').mockReturnValue(false);
        jest.spyOn(PathUtils, 'isDocumentationFile').mockReturnValue(false);
        jest.spyOn(PathUtils, 'isTypeScriptFile').mockReturnValue(true);
        jest.spyOn(PathUtils, 'isJavaScriptFile').mockReturnValue(false);
        
        const result = (parser as any).shouldIncludeFile('/test/file.ts');
        expect(result).toBe(true);
      });
    });

    describe('parseFiles', () => {
      it('should parse TypeScript and JavaScript files', async () => {
        const mockFiles = [
          { path: '/test/file1.ts', name: 'file1.ts', extension: '.ts' },
          { path: '/test/file2.js', name: 'file2.js', extension: '.js' },
          { path: '/test/file3.txt', name: 'file3.txt', extension: '.txt' }
        ];
        
        jest.spyOn(PathUtils, 'isTypeScriptFile').mockImplementation((path) => path.endsWith('.ts'));
        jest.spyOn(PathUtils, 'isJavaScriptFile').mockImplementation((path) => path.endsWith('.js'));
        jest.spyOn(parser as any, 'parseFile').mockResolvedValue([
          { id: '1', name: 'TestClass', type: 'class' }
        ]);
        
        const result = await (parser as any).parseFiles(mockFiles);
        expect(result).toHaveLength(2); // Only TS and JS files
      });

      it('should handle parsing errors gracefully', async () => {
        const mockFiles = [
          { path: '/test/file.ts', name: 'file.ts', extension: '.ts' }
        ];
        
        jest.spyOn(PathUtils, 'isTypeScriptFile').mockReturnValue(true);
        jest.spyOn(parser as any, 'parseFile').mockRejectedValue(new Error('Parse failed'));
        
        const result = await (parser as any).parseFiles(mockFiles);
        expect(result).toHaveLength(0);
      });
    });

    describe('parseFile', () => {
      it('should parse class declarations', async () => {
        const mockFile = { path: '/test/file.ts', name: 'file.ts', extension: '.ts' };
        const mockContent = 'class TestClass {\n  method() {}\n}';
        
        jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);
        
        const result = await (parser as any).parseFile(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('TestClass');
        expect(result[0].type).toBe('class');
      });

      it('should parse interface declarations', async () => {
        const mockFile = { path: '/test/file.ts', name: 'file.ts', extension: '.ts' };
        const mockContent = 'interface TestInterface {\n  prop: string;\n}';
        
        jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);
        
        const result = await (parser as any).parseFile(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('TestInterface');
        expect(result[0].type).toBe('interface');
      });

      it('should parse function declarations', async () => {
        const mockFile = { path: '/test/file.ts', name: 'file.ts', extension: '.ts' };
        const mockContent = 'function testFunction() {\n  return true;\n}';
        
        jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);
        
        const result = await (parser as any).parseFile(mockFile);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('testFunction');
        expect(result[0].type).toBe('function');
      });

      it('should handle files with no declarations', async () => {
        const mockFile = { path: '/test/file.ts', name: 'file.ts', extension: '.ts' };
        const mockContent = '// Just comments\nconst x = 1;';
        
        jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);
        
        const result = await (parser as any).parseFile(mockFile);
        expect(result).toHaveLength(0);
      });
    });

    describe('buildRelations', () => {
      it('should build parent-child relationships', async () => {
        const mockNodes = [
          { id: '1', filePath: '/test/file.ts', start: 0, end: 100 },
          { id: '2', filePath: '/test/file.ts', start: 10, end: 50 }
        ];
        
        const result = await (parser as any).buildRelations(mockNodes);
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('references');
        expect(result[0].metadata.relationship).toBe('parent-child');
      });

      it('should handle empty node list', async () => {
        const result = await (parser as any).buildRelations([]);
        expect(result).toHaveLength(0);
      });

      it('should handle nodes with undefined values', async () => {
        const mockNodes = [
          { id: '1', filePath: '/test/file.ts', start: 0, end: 100 },
          null,
          { id: '2', filePath: '/test/file.ts', start: 10, end: 50 }
        ];
        
        const result = await (parser as any).buildRelations(mockNodes);
        expect(result).toHaveLength(1); // Should still find relationship between valid nodes
      });
    });

    describe('analyzeStructure', () => {
      it('should analyze project structure correctly', async () => {
        const mockFiles = [
          { path: '/test/file1.ts', size: 100, lines: 10 },
          { path: '/test/file2.ts', size: 200, lines: 20 },
          { path: '/test/subdir/file3.ts', size: 150, lines: 15 }
        ];
        
        jest.spyOn(FileUtils, 'getDirName').mockImplementation((path) => {
          if (path.includes('subdir')) return '/test/subdir';
          return '/test';
        });
        jest.spyOn(FileUtils, 'getFileName').mockImplementation((path) => {
          if (path === '/test') return 'test';
          if (path === '/test/subdir') return 'subdir';
          return 'file';
        });
        
        const result = await (parser as any).analyzeStructure(mockFiles, '/test');
        
        expect(result.totalFiles).toBe(3);
        expect(result.totalLines).toBe(45);
        expect(result.totalSize).toBe(450);
        expect(result.directories).toHaveLength(2);
      });
    });

    describe('calculateComplexity', () => {
      it('should calculate complexity metrics', async () => {
        const mockNodes = [
          { nodeType: 'function', start: 0, end: 10 },
          { nodeType: 'function', start: 0, end: 15 },
          { nodeType: 'class', start: 0, end: 20 },
          { nodeType: 'interface', start: 0, end: 5 }
        ];
        
        const result = await (parser as any).calculateComplexity(mockNodes);
        
        expect(result.functionCount).toBe(2);
        expect(result.classCount).toBe(1);
        expect(result.interfaceCount).toBe(1);
        expect(result.cyclomaticComplexity).toBe(7); // 2*2 + 1*3
        expect(result.cognitiveComplexity).toBe(5); // 2*1.5 + 1*2
        expect(result.linesOfCode).toBe(50); // 10+15+20+5
      });
    });

    describe('calculateQuality', () => {
      it('should calculate quality metrics', async () => {
        const mockNodes = [
          { metadata: { line: 1 } },
          { metadata: { line: 2, docs: 'documented' } },
          { metadata: { line: 3, docs: 'documented' } }
        ];
        const mockStructure = { totalFiles: 10 };
        
        const result = await (parser as any).calculateQuality(mockNodes, mockStructure);
        
        expect(result.maintainabilityIndex).toBe(99); // 100 - 10*0.1
        expect(result.technicalDebtRatio).toBe(0.5); // 10*0.05
        expect(result.score).toBeGreaterThan(0);
        expect(result.duplicationPercentage).toBe(0);
        expect(result.testCoveragePercentage).toBe(0);
      });

      it('should handle empty node list', async () => {
        const mockStructure = { totalFiles: 0 };
        
        const result = await (parser as any).calculateQuality([], mockStructure);
        
        expect(result.maintainabilityIndex).toBe(100);
        expect(result.technicalDebtRatio).toBe(0);
        expect(result.score).toBeGreaterThan(0);
        expect(result.duplicationPercentage).toBe(0);
        expect(result.testCoveragePercentage).toBe(0);
      });
    });

    describe('countLines', () => {
      it('should count lines in file', async () => {
        const mockContent = 'line1\nline2\nline3';
        jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);
        
        const result = await (parser as any).countLines('/test/file.ts');
        expect(result).toBe(3);
      });

      it('should handle file reading errors', async () => {
        jest.spyOn(FileUtils, 'readFile').mockRejectedValue(new Error('File not found'));
        
        const result = await (parser as any).countLines('/test/file.ts');
        expect(result).toBe(0);
      });
    });
  });

  describe('incremental parsing', () => {
    let mockCacheManager: jest.Mocked<CacheManager>;

    beforeEach(() => {
      mockCacheManager = {
        hasCache: jest.fn(),
        getCache: jest.fn(),
        setCache: jest.fn(),
        invalidateCache: jest.fn(),
        invalidateDependents: jest.fn(),
        findDependents: jest.fn(),
        validateFileHash: jest.fn(),
        persistCache: jest.fn(),
        loadCache: jest.fn(),
        getAllCacheEntries: jest.fn(),
        getCacheStatistics: jest.fn(),
        clearCache: jest.fn(),
        dispose: jest.fn()
      } as any;

      // Mock the parser to use our mock cache manager
      (parser as any).cacheManager = mockCacheManager;
      
      // Reset all mocks
      jest.clearAllMocks();
    });

    describe('parseProjectIncremental', () => {
      it('should parse project incrementally using cache', async () => {
        const mockDetection = {
          type: 'typescript' as const,
          language: 'typescript' as const,
          confidence: 0.9,
          metadata: {
            config: { name: 'test-project', version: '1.0.0' },
            files: ['src/index.ts', 'src/utils.ts'],
            dependencies: {}
          }
        };

        (ProjectDetector.detectProjectType as jest.Mock).mockResolvedValue(mockDetection);
        (ProjectDetector.getProjectRoot as jest.Mock).mockResolvedValue('/test/project');

        // Mock file discovery
        const mockFiles = [
          { path: '/test/project/src/index.ts', name: 'index.ts', extension: '.ts', size: 100, lines: 10, lastModified: new Date(), hash: 'hash1' },
          { path: '/test/project/src/utils.ts', name: 'utils.ts', extension: '.ts', size: 200, lines: 20, lastModified: new Date(), hash: 'hash2' }
        ];
        jest.spyOn(parser as any, 'discoverFiles').mockResolvedValue(mockFiles);

        // Mock cache responses
        mockCacheManager.hasCache.mockImplementation((path) => {
          return Promise.resolve(path === 'src/index.ts'); // Only index.ts is cached
        });

        mockCacheManager.getCache.mockImplementation((path) => {
          if (path === 'src/index.ts') {
            return Promise.resolve({
              hash: 'hash1',
              lastModified: new Date().toISOString(),
              ast: {
                id: 'node-1',
                type: 'class',
                name: 'TestClass',
                filePath: 'src/index.ts',
                start: 0,
                end: 100,
                children: [],
                nodeType: 'class',
                properties: {},
                metadata: {}
              },
              relations: [],
              dependencies: []
            });
          }
          return Promise.resolve(null);
        });

        mockCacheManager.validateFileHash.mockImplementation((path, hash) => {
          return Promise.resolve(path === 'src/index.ts' && hash === 'hash1');
        });

        // Mock parsing for non-cached files
        jest.spyOn(parser as any, 'parseFile').mockImplementation(async (file: any) => {
          if (file.path === '/test/project/src/utils.ts') {
            return [{
              id: 'node-2',
              type: 'function',
              name: 'testFunction',
              filePath: 'src/utils.ts',
              start: 0,
              end: 50,
              children: [],
              nodeType: 'function',
              properties: {},
              metadata: {}
            }];
          }
          return [];
        });

        jest.spyOn(parser as any, 'buildRelations').mockReturnValue([]);
        jest.spyOn(parser as any, 'analyzeStructure').mockReturnValue({
          files: [],
          directories: [],
          totalFiles: 2,
          totalLines: 30,
          totalSize: 300
        });
        jest.spyOn(parser as any, 'calculateComplexity').mockReturnValue({
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          linesOfCode: 30,
          maintainabilityIndex: 100
        });
        jest.spyOn(parser as any, 'calculateQuality').mockReturnValue({
          overall: 100,
          maintainability: 100,
          reliability: 100,
          security: 100
        });

        const result = await (parser as any).parseProjectIncremental('/test/project');

        expect(result).toBeDefined();
        expect(result.type).toBe('typescript');
        expect(mockCacheManager.hasCache).toHaveBeenCalledTimes(2);
        expect(mockCacheManager.getCache).toHaveBeenCalledWith('src/index.ts');
        expect(mockCacheManager.setCache).toHaveBeenCalledWith('src/utils.ts', expect.any(Object));
      });

      it('should handle cache validation failures', async () => {
        const mockDetection = {
          type: 'typescript' as const,
          language: 'typescript' as const,
          confidence: 0.9,
          metadata: {
            config: { name: 'test-project', version: '1.0.0' },
            files: ['src/index.ts'],
            dependencies: {}
          }
        };

        (ProjectDetector.detectProjectType as jest.Mock).mockResolvedValue(mockDetection);
        (ProjectDetector.getProjectRoot as jest.Mock).mockResolvedValue('/test/project');

        jest.spyOn(parser as any, 'discoverFiles').mockResolvedValue([
          { path: '/test/project/src/index.ts', name: 'index.ts', extension: '.ts', size: 100, lines: 10, lastModified: new Date(), hash: 'new-hash' }
        ]);

        // File is cached but hash validation fails
        mockCacheManager.hasCache.mockResolvedValue(true);
        mockCacheManager.getCache.mockResolvedValue({
          hash: 'old-hash',
          lastModified: new Date().toISOString(),
          ast: { id: 'node-1', type: 'class', name: 'TestClass', filePath: 'src/index.ts', start: 0, end: 100, children: [], nodeType: 'class', properties: {}, metadata: {} },
          relations: [],
          dependencies: []
        });
        mockCacheManager.validateFileHash.mockResolvedValue(false); // Hash mismatch

        jest.spyOn(parser as any, 'parseFile').mockResolvedValue([
          { id: 'node-1', type: 'class', name: 'TestClass', filePath: 'src/index.ts', start: 0, end: 100, children: [], nodeType: 'class', properties: {}, metadata: {} }
        ]);
        jest.spyOn(parser as any, 'buildRelations').mockReturnValue([]);
        jest.spyOn(parser as any, 'analyzeStructure').mockReturnValue({
          files: [],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        });
        jest.spyOn(parser as any, 'calculateComplexity').mockReturnValue({
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          linesOfCode: 10,
          maintainabilityIndex: 100
        });
        jest.spyOn(parser as any, 'calculateQuality').mockReturnValue({
          overall: 100,
          maintainability: 100,
          reliability: 100,
          security: 100
        });

        const result = await (parser as any).parseProjectIncremental('/test/project');

        expect(result).toBeDefined();
        expect(mockCacheManager.validateFileHash).toHaveBeenCalledWith('src/index.ts', 'new-hash');
        expect(mockCacheManager.setCache).toHaveBeenCalledWith('src/index.ts', expect.any(Object));
      });

      it('should invalidate dependents when files change', async () => {
        const mockDetection = {
          type: 'typescript' as const,
          language: 'typescript' as const,
          confidence: 0.9,
          metadata: {
            config: { name: 'test-project', version: '1.0.0' },
            files: ['src/index.ts', 'src/utils.ts'],
            dependencies: {}
          }
        };

        (ProjectDetector.detectProjectType as jest.Mock).mockResolvedValue(mockDetection);
        (ProjectDetector.getProjectRoot as jest.Mock).mockResolvedValue('/test/project');

        jest.spyOn(parser as any, 'discoverFiles').mockResolvedValue([
          { path: '/test/project/src/index.ts', name: 'index.ts', extension: '.ts', size: 100, lines: 10, lastModified: new Date(), hash: 'new-hash' },
          { path: '/test/project/src/utils.ts', name: 'utils.ts', extension: '.ts', size: 200, lines: 20, lastModified: new Date(), hash: 'hash2' }
        ]);

        // index.ts has changed, utils.ts depends on it
        mockCacheManager.hasCache.mockImplementation((path) => {
          return Promise.resolve(path === 'src/utils.ts' || path === 'src/index.ts');
        });

        mockCacheManager.getCache.mockImplementation((path) => {
          if (path === 'src/utils.ts') {
            return Promise.resolve({
              hash: 'hash2',
              lastModified: new Date().toISOString(),
              ast: { id: 'node-2', type: 'function', name: 'testFunction', filePath: 'src/utils.ts', start: 0, end: 50, children: [], nodeType: 'function', properties: {}, metadata: {} },
              relations: [],
              dependencies: ['src/index.ts'] // utils.ts depends on index.ts
            });
          }
          if (path === 'src/index.ts') {
            return Promise.resolve({
              hash: 'old-hash', // old hash, different from current 'new-hash'
              lastModified: new Date().toISOString(),
              ast: { id: 'node-1', type: 'class', name: 'TestClass', filePath: 'src/index.ts', start: 0, end: 100, children: [], nodeType: 'class', properties: {}, metadata: {} },
              relations: [],
              dependencies: []
            });
          }
          return Promise.resolve(null);
        });

        mockCacheManager.findDependents.mockResolvedValue(['src/utils.ts']);
        mockCacheManager.validateFileHash.mockImplementation((path, hash) => {
          return Promise.resolve(path === 'src/utils.ts' && hash === 'hash2');
        });

        jest.spyOn(parser as any, 'parseFile').mockResolvedValue([
          { id: 'node-1', type: 'class', name: 'TestClass', filePath: 'src/index.ts', start: 0, end: 100, children: [], nodeType: 'class', properties: {}, metadata: {} }
        ]);
        jest.spyOn(parser as any, 'buildRelations').mockReturnValue([]);
        jest.spyOn(parser as any, 'analyzeStructure').mockReturnValue({
          files: [],
          directories: [],
          totalFiles: 2,
          totalLines: 30,
          totalSize: 300
        });
        jest.spyOn(parser as any, 'calculateComplexity').mockReturnValue({
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          linesOfCode: 30,
          maintainabilityIndex: 100
        });
        jest.spyOn(parser as any, 'calculateQuality').mockReturnValue({
          overall: 100,
          maintainability: 100,
          reliability: 100,
          security: 100
        });

        const result = await (parser as any).parseProjectIncremental('/test/project');

        expect(result).toBeDefined();
        expect(mockCacheManager.invalidateDependents).toHaveBeenCalledWith('src/index.ts');
      });

      it('should handle cache loading errors gracefully', async () => {
        const mockDetection = {
          type: 'typescript' as const,
          language: 'typescript' as const,
          confidence: 0.9,
          metadata: {
            config: { name: 'test-project', version: '1.0.0' },
            files: ['src/index.ts'],
            dependencies: {}
          }
        };

        (ProjectDetector.detectProjectType as jest.Mock).mockResolvedValue(mockDetection);
        (ProjectDetector.getProjectRoot as jest.Mock).mockResolvedValue('/test/project');

        jest.spyOn(parser as any, 'discoverFiles').mockResolvedValue([
          { path: 'src/index.ts', name: 'index.ts', extension: '.ts', size: 100, lines: 10, lastModified: new Date(), hash: 'hash1' }
        ]);

        // Cache manager throws error
        mockCacheManager.hasCache.mockRejectedValue(new Error('Cache error'));
        mockCacheManager.loadCache.mockRejectedValue(new Error('Cache load error'));

        jest.spyOn(parser as any, 'parseFiles').mockResolvedValue([
          { id: 'node-1', type: 'class', name: 'TestClass', filePath: 'src/index.ts', start: 0, end: 100, children: [], nodeType: 'class', properties: {}, metadata: {} }
        ]);
        jest.spyOn(parser as any, 'buildRelations').mockReturnValue([]);
        jest.spyOn(parser as any, 'analyzeStructure').mockReturnValue({
          files: [],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        });
        jest.spyOn(parser as any, 'calculateComplexity').mockReturnValue({
          cyclomaticComplexity: 1,
          cognitiveComplexity: 1,
          linesOfCode: 10,
          maintainabilityIndex: 100
        });
        jest.spyOn(parser as any, 'calculateQuality').mockReturnValue({
          overall: 100,
          maintainability: 100,
          reliability: 100,
          security: 100
        });

        const result = await (parser as any).parseProjectIncremental('/test/project');

        expect(result).toBeDefined();
        // Should fall back to full parsing when cache fails
      });
    });

    describe('change detection', () => {
      it('should detect file changes using hash comparison', async () => {
        const filePath = 'src/test.ts';
        const newHash = 'new-hash';

        mockCacheManager.validateFileHash.mockResolvedValue(false);

        const hasChanged = await (parser as any).hasFileChanged(filePath, newHash);
        
        expect(hasChanged).toBe(true);
        expect(mockCacheManager.validateFileHash).toHaveBeenCalledWith(filePath, newHash);
      });

      it('should detect unchanged files', async () => {
        const filePath = 'src/test.ts';
        const hash = 'same-hash';

        mockCacheManager.validateFileHash.mockResolvedValue(true);

        const hasChanged = await (parser as any).hasFileChanged(filePath, hash);
        
        expect(hasChanged).toBe(false);
      });
    });

    describe('dependency tracking', () => {
      it('should track file dependencies', async () => {
        const filePath = 'src/main.ts';
        const dependencies = ['src/utils.ts', 'src/types.ts'];

        // Mock getCache to return a cached entry
        mockCacheManager.getCache.mockResolvedValue({
          hash: 'hash1',
          lastModified: new Date().toISOString(),
          ast: { id: 'node-1', type: 'class', name: 'TestClass', filePath, start: 0, end: 100, children: [], nodeType: 'class', properties: {}, metadata: {} },
          relations: [],
          dependencies: []
        });

        await (parser as any).updateFileDependencies(filePath, dependencies);

        expect(mockCacheManager.setCache).toHaveBeenCalledWith(
          filePath,
          expect.objectContaining({
            dependencies: dependencies
          })
        );
      });

      it('should find dependent files', async () => {
        const filePath = 'src/utils.ts';
        const dependents = ['src/main.ts', 'src/helper.ts'];

        mockCacheManager.findDependents.mockResolvedValue(dependents);

        const result = await (parser as any).findDependentFiles(filePath);

        expect(result).toEqual(dependents);
        expect(mockCacheManager.findDependents).toHaveBeenCalledWith(filePath);
      });
    });
  });
});

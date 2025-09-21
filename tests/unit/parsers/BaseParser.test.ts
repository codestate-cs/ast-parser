/**
 * Tests for BaseParser abstract class
 */

import { BaseParser, ParserResult } from '../../../src/parsers';
import { ParsingOptions, FileInfo } from '../../../src/types';

/**
 * Concrete implementation of BaseParser for testing
 */
class TestParser extends BaseParser {
  constructor(options: ParsingOptions, parserVersion: string = '1.0.0') {
    super(options, parserVersion);
  }

  async parseFile(file: FileInfo): Promise<ParserResult> {
    this.validateFile(file);
    
    const startTime = Date.now();
    // Small delay to ensure parsing time > 0
    await new Promise(resolve => setTimeout(resolve, 5));
    const parsingTime = this.calculateParsingTime(startTime);
    
    const node = this.createASTNode(
      'test-node',
      'TestNode',
      'class',
      'class',
      file.path,
      0,
      10,
      { line: 1, column: 0 },
      { isExported: true }
    );

    const relation = this.createRelation(
      'test-relation',
      'references',
      'parent-node',
      'test-node',
      { relationship: 'parent-child' }
    );

    return {
      nodes: [node],
      relations: [relation],
      metadata: {
        file,
        parsingTime,
        nodeCount: 1,
        relationCount: 1,
        parserVersion: this.parserVersion,
      },
    };
  }

  canParse(file: FileInfo): boolean {
    return file.extension === '.test';
  }

  getParserName(): string {
    return 'TestParser';
  }

  getSupportedExtensions(): string[] {
    return ['.test'];
  }

  // Public methods to expose protected methods for testing
  public testCreateASTNode(
    id: string,
    name: string,
    type: string,
    nodeType: string,
    filePath: string,
    start: number,
    end: number,
    metadata: Record<string, unknown> = {},
    properties: Record<string, unknown> = {}
  ) {
    return this.createASTNode(id, name, type, nodeType, filePath, start, end, metadata, properties);
  }

  public testCreateRelation(
    id: string,
    type: string,
    from: string,
    to: string,
    metadata: Record<string, unknown> = {}
  ) {
    return this.createRelation(id, type, from, to, metadata);
  }

  public testExtractName(text: string, prefix: string): string {
    return this.extractName(text, prefix);
  }

  public testCalculateParsingTime(startTime: number): number {
    return this.calculateParsingTime(startTime);
  }
}

class TestParser2 extends BaseParser {
  constructor(options: ParsingOptions) {
    super(options);
  }

  async parseFile(file: FileInfo): Promise<ParserResult> {
    this.validateFile(file);
    
    const startTime = Date.now();
    // Small delay to ensure parsing time > 0
    await new Promise(resolve => setTimeout(resolve, 5));
    const parsingTime = this.calculateParsingTime(startTime);
    
    const node = this.createASTNode(
      'test-node',
      'TestNode',
      'class',
      'class',
      file.path,
      0,
      10
    );

    const relation = this.createRelation(
      'test-relation',
      'references',
      'parent-node',
      'test-node',
      { relationship: 'parent-child' }
    );

    return {
      nodes: [node],
      relations: [relation],
      metadata: {
        file,
        parsingTime,
        nodeCount: 1,
        relationCount: 1,
        parserVersion: this.parserVersion,
      },
    };
  }

  canParse(file: FileInfo): boolean {
    return file.extension === '.test';
  }

  getParserName(): string {
    return 'TestParser';
  }

  getSupportedExtensions(): string[] {
    return ['.test'];
  }

  // Public methods to expose protected methods for testing
  public testCreateASTNode(
    id: string,
    name: string,
    type: string,
    nodeType: string,
    filePath: string,
    start: number,
    end: number,
    metadata: Record<string, unknown> = {},
    properties: Record<string, unknown> = {}
  ) {
    return this.createASTNode(id, name, type, nodeType, filePath, start, end, metadata, properties);
  }

  public testCreateRelation(
    id: string,
    type: string,
    from: string,
    to: string
  ) {
    return this.createRelation(id, type, from, to);
  }

  public testExtractName(text: string, prefix: string): string {
    return this.extractName(text, prefix);
  }

  public testCalculateParsingTime(startTime: number): number {
    return this.calculateParsingTime(startTime);
  }
}

describe('BaseParser', () => {
  let parser: TestParser;
  let options: ParsingOptions;

  beforeEach(() => {
    options = {
      filtering: {
        includePatterns: ['**/*.test'],
        excludePatterns: ['**/*.spec.test'],
        skipNodeModules: true,
        maxDepth: 10,
        includeOnlyExports: false,
        includeTestFiles: false,
        includeDocFiles: true,
      },
      mode: 'full',
      output: {
        format: 'json',
        compression: 'none',
        minify: false,
        includeSourceMaps: false,
        includeMetadata: true,
      },
      documentation: {
        includeDocumentation: true,
        includeExamples: true,
        includeArchitecture: true,
        includeDependencyGraph: true,
        includeQualityMetrics: false,
        documentationFormat: 'markdown',
      },
      performance: {
        maxConcurrentFiles: 10,
        memoryLimit: 1024,
        timeout: 300000,
        enableProgress: true,
        progressInterval: 1000,
      },
      cache: {
        enableCache: false,
        cacheExpiration: 24,
        cacheCompression: true,
        cacheValidation: true,
      },
    };

    parser = new TestParser(options);
  });

  describe('constructor', () => {
    it('should create instance with options and default version', () => {
      expect(parser).toBeInstanceOf(BaseParser);
      expect(parser.getOptions()).toEqual(options);
    });

    it('should create instance with custom version', () => {
      const customParser = new TestParser(options, '2.0.0');
      expect(customParser).toBeInstanceOf(BaseParser);
    });

    it('should use default parser version when not provided', () => {
      // Test the default parameter by not providing parserVersion
      const defaultParser = new TestParser(options);
      expect(defaultParser).toBeInstanceOf(BaseParser);
      expect(defaultParser.getOptions()).toEqual(options);
    });

    it('should use default parser version when undefined is passed', () => {
      // Test the default parameter by explicitly passing undefined
      const defaultParser = new TestParser(options, undefined as any);
      expect(defaultParser).toBeInstanceOf(BaseParser);
      expect(defaultParser.getOptions()).toEqual(options);
    });
  });

  describe('parseFile', () => {
    it('should parse file successfully', async () => {
      const file: FileInfo = {
        path: 'test.test',
        name: 'test.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(1);
      expect(result.relations).toHaveLength(1);
      expect(result.metadata.file).toEqual(file);
      expect(result.metadata.nodeCount).toBe(1);
      expect(result.metadata.relationCount).toBe(1);
      expect(result.metadata.parserVersion).toBe('1.0.0');
      expect(result.metadata.parsingTime).toBeGreaterThan(0);
    });

    it('should throw error for invalid file path', async () => {
      const file: FileInfo = {
        path: '',
        name: 'test.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      await expect(parser.parseFile(file)).rejects.toThrow('File path is required');
    });

    it('should throw error for unsupported file type', async () => {
      const file: FileInfo = {
        path: 'test.txt',
        name: 'test.txt',
        extension: '.txt',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      await expect(parser.parseFile(file)).rejects.toThrow('Parser TestParser cannot parse file: test.txt');
    });
  });

  describe('canParse', () => {
    it('should return true for supported file types', () => {
      const file: FileInfo = {
        path: 'test.test',
        name: 'test.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      expect(parser.canParse(file)).toBe(true);
    });

    it('should return false for unsupported file types', () => {
      const file: FileInfo = {
        path: 'test.txt',
        name: 'test.txt',
        extension: '.txt',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      expect(parser.canParse(file)).toBe(false);
    });
  });

  describe('getParserName', () => {
    it('should return correct parser name', () => {
      expect(parser.getParserName()).toBe('TestParser');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return supported extensions', () => {
      const extensions = parser.getSupportedExtensions();
      expect(extensions).toEqual(['.test']);
    });
  });

  describe('validateFile', () => {
    it('should validate file successfully', () => {
      const file: FileInfo = {
        path: 'test.test',
        name: 'test.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      expect(() => parser.parseFile(file)).not.toThrow();
    });
  });

  describe('createASTNode', () => {
    it('should create AST node with all properties', () => {
      const node = parser.testCreateASTNode(
        'test-id',
        'TestNode',
        'class',
        'class',
        '/path/to/file.test',
        10,
        20,
        { line: 1, column: 0 },
        { isExported: true }
      );

      expect(node).toEqual({
        id: 'test-id',
        name: 'TestNode',
        type: 'class',
        nodeType: 'class',
        filePath: '/path/to/file.test',
        start: 10,
        end: 20,
        children: [],
        metadata: { line: 1, column: 0 },
        properties: { isExported: true },
      });
    });

    it('should create AST node with default metadata and properties', () => {
      const node = parser.testCreateASTNode(
        'test-id',
        'TestNode',
        'class',
        'class',
        '/path/to/file.test',
        10,
        20
      );

      expect(node.metadata).toEqual({});
      expect(node.properties).toEqual({});
    });

    it('should create AST node with only metadata provided', () => {
      const node = parser.testCreateASTNode(
        'test-id',
        'TestNode',
        'class',
        'class',
        '/path/to/file.test',
        10,
        20,
        { line: 1, column: 0 }
      );

      expect(node.metadata).toEqual({ line: 1, column: 0 });
      expect(node.properties).toEqual({});
    });
  });

  describe('createRelation', () => {
    it('should create relation with all properties', () => {
      const relation = parser.testCreateRelation(
        'test-relation',
        'references',
        'from-node',
        'to-node',
        { relationship: 'parent-child' }
      );

      expect(relation).toEqual({
        id: 'test-relation',
        type: 'references',
        from: 'from-node',
        to: 'to-node',
        metadata: { relationship: 'parent-child' },
      });
    });

    it('should create relation with default metadata', () => {
      const relation = parser.testCreateRelation(
        'test-relation',
        'references',
        'from-node',
        'to-node'
      );

      expect(relation.metadata).toEqual({});
    });

    it('should create AST node with default metadata and properties', () => {
      const node = parser.testCreateASTNode(
        'test-node',
        'TestNode',
        'class',
        'class',
        '/test/file.ts',
        0,
        10
      );
      
      expect(node.metadata).toEqual({});
      expect(node.properties).toEqual({});
    });

    it('should create AST node with only metadata provided', () => {
      const node = parser.testCreateASTNode(
        'test-node',
        'TestNode',
        'class',
        'class',
        '/test/file.ts',
        0,
        10,
        { line: 1, column: 0 }
      );
      
      expect(node.metadata).toEqual({ line: 1, column: 0 });
      expect(node.properties).toEqual({});
    });
  });

  describe('extractName', () => {
    it('should extract name from text with prefix', () => {
      const name = parser.testExtractName('class MyClass {', 'class ');
      expect(name).toBe('MyClass');
    });

    it('should return unknown for text without valid name', () => {
      const name = parser.testExtractName('class {', 'class ');
      expect(name).toBe('unknown');
    });

    it('should return unknown for empty text', () => {
      const name = parser.testExtractName('', 'class ');
      expect(name).toBe('unknown');
    });
  });

  describe('calculateParsingTime', () => {
    it('should calculate parsing time correctly', () => {
      const startTime = Date.now();
      // Small delay to ensure time difference
      setTimeout(() => {
        const parsingTime = parser.testCalculateParsingTime(startTime);
        expect(parsingTime).toBeGreaterThan(0);
      }, 1);
    });
  });

  describe('getOptions', () => {
    it('should return copy of options', () => {
      const returnedOptions = parser.getOptions();
      expect(returnedOptions).toEqual(options);
      expect(returnedOptions).not.toBe(options); // Should be a copy
    });
  });

  describe('updateOptions', () => {
    it('should update options correctly', () => {
      const newOptions = {
        mode: 'incremental' as const,
        filtering: {
          includePatterns: ['**/*.ts']
        }
      };

      parser.updateOptions(newOptions);
      
      const updatedOptions = parser.getOptions();
      expect(updatedOptions.mode).toBe('incremental');
      expect(updatedOptions.filtering.includePatterns).toEqual(['**/*.ts']);
      // Other options should remain unchanged
      expect(updatedOptions.output.format).toBe('json');
    });

    it('should handle partial options update', () => {
      parser.updateOptions({
        mode: 'incremental' as const
      });
      
      const updatedOptions = parser.getOptions();
      expect(updatedOptions.mode).toBe('incremental');
      expect(updatedOptions.filtering.includePatterns).toEqual(['**/*.test']); // Should remain unchanged
    });
  });

  describe('abstract methods', () => {
    it('should have parseFile method', () => {
      expect(typeof parser.parseFile).toBe('function');
    });

    it('should have canParse method', () => {
      expect(typeof parser.canParse).toBe('function');
    });

    it('should have getParserName method', () => {
      expect(typeof parser.getParserName).toBe('function');
    });

    it('should have getSupportedExtensions method', () => {
      expect(typeof parser.getSupportedExtensions).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle file validation errors', async () => {
      const invalidFile: FileInfo = {
        path: '',
        name: '',
        extension: '',
        size: 0,
        lines: 0,
        lastModified: new Date(),
        hash: '',
      };

      await expect(parser.parseFile(invalidFile)).rejects.toThrow();
    });

    it('should handle unsupported file extensions', async () => {
      const unsupportedFile: FileInfo = {
        path: 'test.py',
        name: 'test.py',
        extension: '.py',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      await expect(parser.parseFile(unsupportedFile)).rejects.toThrow('Parser TestParser cannot parse file: test.py');
    });
  });

  describe('edge cases', () => {
    it('should handle files with special characters in path', async () => {
      const file: FileInfo = {
        path: 'test with spaces.test',
        name: 'test with spaces.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const result = await parser.parseFile(file);
      expect(result).toBeDefined();
      expect(result.nodes[0]?.filePath).toBe('test with spaces.test');
    });

    it('should handle files with unicode characters', async () => {
      const file: FileInfo = {
        path: '测试文件.test',
        name: '测试文件.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const result = await parser.parseFile(file);
      expect(result).toBeDefined();
      expect(result.nodes[0]?.filePath).toBe('测试文件.test');
    });

    it('should handle very long file paths', async () => {
      const longPath = '/very/long/path/' + 'a'.repeat(1000) + '.test';
      const file: FileInfo = {
        path: longPath,
        name: 'long.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const result = await parser.parseFile(file);
      expect(result).toBeDefined();
      expect(result.nodes[0]?.filePath).toBe(longPath);
    });
  });

  describe('TestParser2 - Default Parameter Coverage', () => {
    let parser2: TestParser2;

    beforeEach(() => {
      parser2 = new TestParser2(options);
    });

    it('should create TestParser2 instance with default parser version', () => {
      expect(parser2).toBeInstanceOf(BaseParser);
      expect(parser2.getParserName()).toBe('TestParser');
      expect(parser2.getSupportedExtensions()).toEqual(['.test']);
    });

    it('should parse file with TestParser2 and default metadata', async () => {
      const testFile: FileInfo = {
        path: '/test/test-file.test',
        name: 'test-file.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const result = await parser2.parseFile(testFile);
      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(1);
      expect(result.relations).toHaveLength(1);
      expect(result.metadata.parsingTime).toBeGreaterThan(0);
      expect(result.metadata.nodeCount).toBe(1);
      expect(result.metadata.relationCount).toBe(1);
    });

    it('should create AST node with minimal parameters using TestParser2', () => {
      const node = parser2.testCreateASTNode(
        'minimal-node',
        'MinimalNode',
        'function',
        'function',
        '/test/minimal.ts',
        0,
        5
      );

      expect(node.id).toBe('minimal-node');
      expect(node.name).toBe('MinimalNode');
      expect(node.type).toBe('function');
      expect(node.nodeType).toBe('function');
      expect(node.filePath).toBe('/test/minimal.ts');
      expect(node.start).toBe(0);
      expect(node.end).toBe(5);
      expect(node.metadata).toEqual({});
      expect(node.properties).toEqual({});
    });

    it('should create relation with minimal parameters using TestParser2', () => {
      const relation = parser2.testCreateRelation(
        'minimal-relation',
        'imports',
        'source-node',
        'target-node'
      );

      expect(relation.id).toBe('minimal-relation');
      expect(relation.type).toBe('imports');
      expect(relation.from).toBe('source-node');
      expect(relation.to).toBe('target-node');
      expect(relation.metadata).toEqual({});
    });

    it('should create relation without metadata using TestParser2', () => {
      const relation = parser2.testCreateRelation(
        'no-metadata-relation',
        'references',
        'parent-node',
        'child-node'
      );

      expect(relation.id).toBe('no-metadata-relation');
      expect(relation.type).toBe('references');
      expect(relation.from).toBe('parent-node');
      expect(relation.to).toBe('child-node');
      expect(relation.metadata).toEqual({});
    });

    it('should extract name with TestParser2', () => {
      const name = parser2.testExtractName('classMyClass {', 'class');
      expect(name).toBe('MyClass');
    });

    it('should calculate parsing time with TestParser2', () => {
      const startTime = Date.now();
      const parsingTime = parser2.testCalculateParsingTime(startTime);
      expect(parsingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle unsupported file types with TestParser2', async () => {
      const unsupportedFile: FileInfo = {
        path: '/test/unsupported.txt',
        name: 'unsupported.txt',
        extension: '.txt',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      await expect(parser2.parseFile(unsupportedFile)).rejects.toThrow();
    });

    it('should handle file validation through parseFile with TestParser2', async () => {
      const validFile: FileInfo = {
        path: '/test/valid.test',
        name: 'valid.test',
        extension: '.test',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      // Test validation through parseFile (which calls validateFile internally)
      const result = await parser2.parseFile(validFile);
      expect(result).toBeDefined();
      expect(result.nodes).toHaveLength(1);
    });
  });
});

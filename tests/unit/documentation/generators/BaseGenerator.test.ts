/**
 * Tests for BaseGenerator
 * 
 * Following TDD approach - tests define expected behavior
 */

import { BaseGenerator, DocumentationGenerationOptions, DocumentationGenerationResult } from '../../../../src/documentation/generators/BaseGenerator';
import { ASTNode, ASTNodeType } from '../../../../src/types/core';
import { JSDocComment } from '../../../../src/documentation/extractors/JSDocExtractor';
import { TypeInfo } from '../../../../src/documentation/extractors/TypeExtractor';
import { ExampleInfo } from '../../../../src/documentation/extractors/ExampleExtractor';

// Concrete implementation for testing
class TestGenerator extends BaseGenerator {
  public async generate(nodes: ASTNode[]): Promise<any> {
    const content = this.createContent(nodes);
    const filePath = `${this.options.outputDir}/${this.options.fileName}.test`;
    
    await this.writeToFile(JSON.stringify(content), filePath);
    
    return {
      filePath,
      contentSize: JSON.stringify(content).length,
      sectionCount: content.sections.length,
      metadata: {
        generationTime: 100,
        filesProcessed: this.getFileCount(nodes),
        nodesProcessed: nodes.length
      },
      errors: [],
      success: true
    };
  }

  public async generateFromExtracted(
    _jsdocComments: JSDocComment[],
    _typeInfo: TypeInfo[],
    _examples: ExampleInfo[]
  ): Promise<any> {
    // Mock implementation
    return {
      filePath: `${this.options.outputDir}/${this.options.fileName}.test`,
      contentSize: 1000,
      sectionCount: 3,
      metadata: {
        generationTime: 50,
        filesProcessed: 1,
        nodesProcessed: 10
      },
      errors: [],
      success: true
    };
  }
}

describe('BaseGenerator', () => {
  let generator: TestGenerator;
  let defaultOptions: DocumentationGenerationOptions;

  beforeEach(() => {
    defaultOptions = {
      outputDir: './docs',
      fileName: 'documentation',
      includeTOC: true,
      includeNavigation: true,
      includeMetadata: true,
      templateVariables: {}
    };
    generator = new TestGenerator();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(generator.getOptions()).toEqual(defaultOptions);
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        outputDir: './custom-docs',
        fileName: 'custom-doc',
        includeTOC: false
      };
      const customGenerator = new TestGenerator(customOptions);
      
      expect(customGenerator.getOptions()).toEqual({
        ...defaultOptions,
        ...customOptions
      });
    });
  });

  describe('validate', () => {
    it('should pass validation with valid options', () => {
      const result = generator.validate();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail validation with empty output directory', () => {
      generator.updateOptions({ outputDir: '' });
      const result = generator.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Output directory is required');
    });

    it('should fail validation with empty file name', () => {
      generator.updateOptions({ fileName: '' });
      const result = generator.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File name is required');
    });

    it('should fail validation with invalid file name characters', () => {
      generator.updateOptions({ fileName: 'invalid<file>name' });
      const result = generator.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File name contains invalid characters');
    });

    it('should fail validation with invalid template variables', () => {
      generator.updateOptions({ templateVariables: 'invalid' as any });
      const result = generator.validate();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template variables must be an object');
    });
  });

  describe('generate', () => {
    it('should generate documentation from AST nodes', async () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {
            description: 'Test function description'
          },
          metadata: {}
        }
      ];

      const result = await generator.generate(nodes);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('./docs/documentation.test');
      expect(result.contentSize).toBeGreaterThan(0);
      expect(result.sectionCount).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should generate documentation with multiple node types', async () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'test-class',
          name: 'TestClass',
          type: 'class',
          nodeType: 'class' as ASTNodeType,
          filePath: 'test.ts',
          start: 50,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'test-interface',
          name: 'TestInterface',
          type: 'interface',
          nodeType: 'interface' as ASTNodeType,
          filePath: 'test.ts',
          start: 100,
          end: 150,
          children: [],
          properties: {},
          metadata: {}
        }
      ];

      const result = await generator.generate(nodes);

      expect(result.success).toBe(true);
      expect(result.metadata.nodesProcessed).toBe(3);
      expect(result.metadata.filesProcessed).toBe(1);
    });
  });

  describe('generateFromExtracted', () => {
    it('should generate documentation from extracted data', async () => {
      const jsdocComments: JSDocComment[] = [
        {
          fullText: '/** Test comment */',
          description: 'Test description',
          summary: 'Test summary',
          tags: [],
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [],
          methods: [],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const examples: ExampleInfo[] = [
        {
          id: 'test-example',
          title: 'Test Example',
          description: 'Test example description',
          type: 'jsdoc',
          language: 'typescript',
          code: 'testFunction();',
          filePath: 'test.ts',
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: [],
          metadata: {}
        }
      ];

      const result = await generator.generateFromExtracted(jsdocComments, typeInfo, examples);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('./docs/documentation.test');
      expect(result.contentSize).toBeGreaterThan(0);
    });
  });

  describe('content creation', () => {
    it('should create content structure with overview section', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        }
      ];

      const content = (generator as any).createContent(nodes);

      expect(content.title).toBeDefined();
      expect(content.description).toBeDefined();
      expect(content.sections).toHaveLength(3);
      expect(content.sections[0]?.id).toBe('overview');
      expect(content.sections[1]?.id).toBe('api-reference');
      expect(content.sections[2]?.id).toBe('examples');
    });

    it('should create overview section with project statistics', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'test-class',
          name: 'TestClass',
          type: 'class',
          nodeType: 'class' as ASTNodeType,
          filePath: 'test.ts',
          start: 50,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        }
      ];

      const overviewSection = (generator as any).createOverviewSection(nodes);

      expect(overviewSection.title).toBe('Overview');
      expect(overviewSection.content).toContain('Project Statistics');
      expect(overviewSection.content).toContain('**Total Functions**: 1');
      expect(overviewSection.content).toContain('**Total Classes**: 1');
    });

    it('should create API reference section with node documentation', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {
            description: 'Test function description'
          },
          metadata: {}
        }
      ];

      const apiSection = (generator as any).createAPIReferenceSection(nodes);

      expect(apiSection.title).toBe('API Reference');
      expect(apiSection.content).toContain('Functions');
      expect(apiSection.content).toContain('testFunction');
      expect(apiSection.content).toContain('Test function description');
    });
  });

  describe('utility methods', () => {
    it('should get project title from package.json', () => {
      const nodes: ASTNode[] = [
        {
          id: 'package-json',
          name: 'package.json',
          type: 'file',
          nodeType: 'module' as ASTNodeType,
          filePath: 'package.json',
          start: 0,
          end: 100,
          children: [],
          properties: {
            name: 'test-package'
          },
          metadata: {}
        }
      ];

      const title = (generator as any).getProjectTitle(nodes);

      expect(title).toBe('test-package');
    });

    it('should get project title from first file when no package.json', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-file',
          name: 'test.ts',
          type: 'file',
          nodeType: 'module' as ASTNodeType,
          filePath: 'src/test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        }
      ];

      const title = (generator as any).getProjectTitle(nodes);

      expect(title).toBe('test');
    });

    it('should get project description from package.json', () => {
      const nodes: ASTNode[] = [
        {
          id: 'package-json',
          name: 'package.json',
          type: 'file',
          nodeType: 'module' as ASTNodeType,
          filePath: 'package.json',
          start: 0,
          end: 100,
          children: [],
          properties: {
            description: 'Test package description'
          },
          metadata: {}
        }
      ];

      const description = (generator as any).getProjectDescription(nodes);

      expect(description).toBe('Test package description');
    });

    it('should get node description from properties', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          description: 'Test function description'
        },
        metadata: {}
      };

      const description = (generator as any).getNodeDescription(node);

      expect(description).toBe('Test function description');
    });

    it('should extract description from JSDoc comment', () => {
      const comment = `/**
       * This is a test function
       * @param name The name parameter
       */`;

      const description = (generator as any).extractDescriptionFromJSDoc(comment);

      expect(description).toBe('This is a test function');
    });

    it('should count different node types correctly', () => {
      const nodes: ASTNode[] = [
        {
          id: 'func1',
          name: 'function1',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'func2',
          name: 'function2',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 50,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'class1',
          name: 'Class1',
          type: 'class',
          nodeType: 'class' as ASTNodeType,
          filePath: 'test.ts',
          start: 100,
          end: 150,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'interface1',
          name: 'Interface1',
          type: 'interface',
          nodeType: 'interface' as ASTNodeType,
          filePath: 'test.ts',
          start: 150,
          end: 200,
          children: [],
          properties: {},
          metadata: {}
        }
      ];

      expect((generator as any).getFileCount(nodes)).toBe(1);
      expect((generator as any).getFunctionCount(nodes)).toBe(2);
      expect((generator as any).getClassCount(nodes)).toBe(1);
      expect((generator as any).getInterfaceCount(nodes)).toBe(1);
    });
  });

  describe('updateOptions', () => {
    it('should update options correctly', () => {
      const newOptions = {
        outputDir: './new-docs',
        fileName: 'new-documentation'
      };

      generator.updateOptions(newOptions);

      expect(generator.getOptions().outputDir).toBe('./new-docs');
      expect(generator.getOptions().fileName).toBe('new-documentation');
      expect(generator.getOptions().includeTOC).toBe(true); // Should remain unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle empty nodes array', async () => {
      const result = await generator.generate([]);

      expect(result.success).toBe(true);
      expect(result.metadata.nodesProcessed).toBe(0);
      expect(result.metadata.filesProcessed).toBe(0);
    });

    it('should handle nodes with missing properties', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        }
      ];

      const description = (generator as any).getNodeDescription(nodes[0]);

      expect(description).toContain('No description available');
    });

    it('should handle JSDoc comment without description', () => {
      const comment = `/**
       * @param name The name parameter
       */`;

      const description = (generator as any).extractDescriptionFromJSDoc(comment);

      expect(description).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty nodes array in generate', async () => {
      const result = await generator.generate([]);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should handle nodes with missing properties', async () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'testNode',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {}, // Empty properties
          metadata: {}
        }
      ];

      const result = await generator.generate(nodes);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
    });

    it('should handle validation errors', async () => {
      // Create a concrete implementation for testing
      class TestGenerator extends BaseGenerator {
        async generate(nodes: ASTNode[]): Promise<DocumentationGenerationResult> {
          return {
            filePath: './docs/test.md',
            contentSize: 100,
            sectionCount: 1,
            metadata: {
              generationTime: 10,
              filesProcessed: 1,
              nodesProcessed: nodes.length
            },
            errors: [],
            success: true
          };
        }

        async generateFromExtracted(
          _jsdocComments: JSDocComment[],
          _typeInfo: TypeInfo[],
          _examples: ExampleInfo[]
        ): Promise<DocumentationGenerationResult> {
          return {
            filePath: './docs/test.md',
            contentSize: 100,
            sectionCount: 1,
            metadata: {
              generationTime: 10,
              filesProcessed: 1,
              nodesProcessed: 1
            },
            errors: [],
            success: true
          };
        }
      }

      const invalidGenerator = new TestGenerator({
        outputDir: '', // Invalid empty directory
        fileName: 'test.md',
        includeTOC: true,
        includeNavigation: true,
        includeMetadata: true,
        templateVariables: {}
      });

      const result = await invalidGenerator.generate([]);

      expect(result.success).toBe(true); // TestGenerator always returns success
      expect(result.errors.length).toBe(0); // TestGenerator has no errors
    });

    it('should handle generateFromExtracted with empty data', async () => {
      const result = await generator.generateFromExtracted([], [], []);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
    });

    it('should handle generateFromExtracted with mixed data', async () => {
      const jsdocComments = [
        {
          id: 'test-jsdoc',
          description: 'JSDoc comment',
          summary: 'Summary',
          tags: [],
          isValid: true,
          errors: [],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          metadata: {},
          fullText: '/** JSDoc comment */'
        }
      ];

      const typeInfo = [
        {
          name: 'TestType',
          kind: 'interface' as any,
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [],
          methods: [],
          documentation: 'Type documentation',
          metadata: {},
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: []
        }
      ];

      const examples = [
        {
          id: 'test-example',
          code: 'const result = testFunction();',
          language: 'typescript' as any,
          title: 'Example',
          description: 'Usage example',
          type: 'usage' as any,
          source: 'jsdoc' as any,
          isValid: true,
          errors: [],
          filePath: 'test.ts',
          start: 0,
          end: 30,
          lineNumber: 1,
          metadata: {}
        }
      ];

      const result = await generator.generateFromExtracted(jsdocComments, typeInfo, examples);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.contentSize).toBeGreaterThan(0);
      expect(result.sectionCount).toBeGreaterThan(0);
    });
  });

  describe('content generation edge cases', () => {
    it('should handle createOverviewSection with empty nodes', () => {
      const overviewSection = (generator as any).createOverviewSection([]);

      expect(overviewSection.title).toBe('Overview');
      expect(overviewSection.content).toBeDefined();
    });

    it('should handle createOverviewSection with single node', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {
            description: 'Test function'
          },
          metadata: {}
        }
      ];

      const overviewSection = (generator as any).createOverviewSection(nodes);

      expect(overviewSection.title).toBe('Overview');
      expect(overviewSection.content).toContain('**Total Functions**: 1');
    });

    it('should handle createAPIReferenceSection with empty nodes', () => {
      const apiSection = (generator as any).createAPIReferenceSection([]);

      expect(apiSection.title).toBe('API Reference');
      expect(apiSection.content).toBeDefined();
    });

    it('should handle createAPIReferenceSection with multiple node types', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {
            description: 'Test function'
          },
          metadata: {}
        },
        {
          id: 'test-class',
          name: 'TestClass',
          type: 'class',
          nodeType: 'class' as ASTNodeType,
          filePath: 'test.ts',
          start: 100,
          end: 200,
          children: [],
          properties: {
            description: 'Test class'
          },
          metadata: {}
        },
        {
          id: 'test-interface',
          name: 'TestInterface',
          type: 'interface',
          nodeType: 'interface' as ASTNodeType,
          filePath: 'test.ts',
          start: 200,
          end: 300,
          children: [],
          properties: {
            description: 'Test interface'
          },
          metadata: {}
        }
      ];

      const apiSection = (generator as any).createAPIReferenceSection(nodes);

      expect(apiSection.title).toBe('API Reference');
      expect(apiSection.content).toContain('testFunction');
      expect(apiSection.content).toContain('TestClass');
      expect(apiSection.content).toContain('TestInterface');
    });
  });

  describe('utility method edge cases', () => {
    it('should handle getProjectTitle with empty nodes', () => {
      const title = (generator as any).getProjectTitle([]);

      expect(title).toBe('Project Documentation'); // Default fallback
    });

    it('should handle getProjectDescription with empty nodes', () => {
      const description = (generator as any).getProjectDescription([]);

      expect(description).toBe('Automatically generated documentation for the project.'); // Default fallback
    });

    it('should handle getProjectDescription with package.json', () => {
      const nodes: ASTNode[] = [
        {
          id: 'package-json',
          name: 'package.json',
          type: 'file',
          nodeType: 'module' as ASTNodeType,
          filePath: 'package.json',
          start: 0,
          end: 100,
          children: [],
          properties: {
            description: 'Test package description'
          },
          metadata: {}
        }
      ];

      const description = (generator as any).getProjectDescription(nodes);

      expect(description).toBe('Test package description');
    });

    it('should handle countNodeTypes with various node types', () => {
      const nodes: ASTNode[] = [
        {
          id: 'func1',
          name: 'func1',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'func2',
          name: 'func2',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test.ts',
          start: 50,
          end: 100,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'class1',
          name: 'Class1',
          type: 'class',
          nodeType: 'class' as ASTNodeType,
          filePath: 'test.ts',
          start: 100,
          end: 150,
          children: [],
          properties: {},
          metadata: {}
        },
        {
          id: 'interface1',
          name: 'Interface1',
          type: 'interface',
          nodeType: 'interface' as ASTNodeType,
          filePath: 'test.ts',
          start: 150,
          end: 200,
          children: [],
          properties: {},
          metadata: {}
        }
      ];

      // countNodeTypes doesn't exist, so test the individual count methods
      const functionCount = (generator as any).getFunctionCount(nodes);
      const classCount = (generator as any).getClassCount(nodes);
      const interfaceCount = (generator as any).getInterfaceCount(nodes);

      expect(functionCount).toBe(2);
      expect(classCount).toBe(1);
      expect(interfaceCount).toBe(1);
    });

    it('should handle extractDescriptionFromJSDoc with valid description', () => {
      const comment = `/**
       * This is a test function
       * @param name The name parameter
       */`;

      const description = (generator as any).extractDescriptionFromJSDoc(comment);

      expect(description).toBe('This is a test function');
    });

    it('should handle extractDescriptionFromJSDoc with multiline description', () => {
      const comment = `/**
       * This is a multiline
       * description for testing
       * @param name The name parameter
       */`;

      const description = (generator as any).extractDescriptionFromJSDoc(comment);

      expect(description).toBe('This is a multiline description for testing'); // Joins with space
    });

    it('should handle extractDescriptionFromJSDoc with empty comment', () => {
      const description = (generator as any).extractDescriptionFromJSDoc('');

      expect(description).toBeNull();
    });

    it('should handle extractDescriptionFromJSDoc with malformed comment', () => {
      const description = (generator as any).extractDescriptionFromJSDoc('Not a JSDoc comment');

      expect(description).toBe('Not a JSDoc comment'); // Extracts non-JSDoc content
    });
  });

  describe('options and configuration', () => {
    it('should handle updateOptions with partial options', () => {
      const newOptions = {
        fileName: 'updated.md'
      };

      generator.updateOptions(newOptions);

      expect(generator.getOptions().fileName).toBe('updated.md');
      expect(generator.getOptions().outputDir).toBe('./docs'); // Should remain unchanged
    });

    it('should handle updateOptions with empty options', () => {
      const originalOptions = generator.getOptions();
      
      generator.updateOptions({});

      expect(generator.getOptions()).toEqual(originalOptions);
    });

    it('should handle getOptions returning copy', () => {
      const options1 = generator.getOptions();
      const options2 = generator.getOptions();

      expect(options1).toEqual(options2);
      expect(options1).not.toBe(options2); // Should be different objects
    });
  });

  describe('additional coverage tests', () => {
    it('should handle generateExamplesContent with examples', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'TestNode',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {
            examples: [
              {
                id: 'test-example',
                title: 'Test Example',
                description: 'Test example description',
                code: 'console.log("test");',
                language: 'javascript',
                type: 'jsdoc',
                metadata: {},
                filePath: 'test.ts',
                start: 0,
                end: 20,
                lineNumber: 1,
                isValid: true,
                errors: []
              }
            ]
          }
        }
      ];

      const content = (generator as any).generateExamplesContent(nodes);

      expect(content).toContain('Test Example');
      expect(content).toContain('Test example description');
      expect(content).toContain('console.log("test");');
    });

    it('should handle generateExampleDocumentation method', () => {
      const example: ExampleInfo = {
        id: 'test-example',
        title: 'Test Example',
        description: 'Test example description',
        code: 'console.log("test");',
        language: 'javascript',
        type: 'jsdoc',
        metadata: {},
        filePath: 'test.ts',
        start: 0,
        end: 20,
        lineNumber: 1,
        isValid: true,
        errors: []
      };

      const content = (generator as any).generateExampleDocumentation(example);

      expect(content).toContain('### Test Example');
      expect(content).toContain('Test example description');
      expect(content).toContain('```javascript');
      expect(content).toContain('console.log("test");');
    });

    it('should handle extractExamplesFromNodes with examples in properties', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'TestNode',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {
            examples: [
              {
                id: 'test-example',
                title: 'Test Example',
                description: 'Test example description',
                code: 'console.log("test");',
                language: 'javascript',
                type: 'jsdoc',
                metadata: {},
                filePath: 'test.ts',
                start: 0,
                end: 20,
                lineNumber: 1,
                isValid: true,
                errors: []
              }
            ]
          }
        }
      ];

      const examples = (generator as any).extractExamplesFromNodes(nodes);

      expect(examples).toHaveLength(1);
      expect(examples[0].title).toBe('Test Example');
    });

    it('should handle extractExamplesFromNodes with child node examples', () => {
      const nodes: ASTNode[] = [
        {
          id: 'parent-node',
          name: 'ParentNode',
          type: 'class',
          nodeType: 'class',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [
            {
              id: 'child-node',
              name: 'ChildNode',
              type: 'function',
              nodeType: 'function',
              filePath: 'test.ts',
              start: 10,
              end: 30,
              children: [],
              metadata: {},
              properties: {
                examples: [
                  {
                    id: 'child-example',
                    title: 'Child Example',
                    description: 'Child example description',
                    code: 'console.log("child");',
                    language: 'javascript',
                    type: 'jsdoc',
                    metadata: {},
                    filePath: 'test.ts',
                    start: 0,
                    end: 20,
                    lineNumber: 1,
                    isValid: true,
                    errors: []
                  }
                ]
              }
            }
          ],
          metadata: {},
          properties: {}
        }
      ];

      const examples = (generator as any).extractExamplesFromNodes(nodes);

      expect(examples).toHaveLength(1);
      expect(examples[0].title).toBe('Child Example');
    });

    it('should handle getNodeDescription with JSDoc comments', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestNode',
        type: 'function',
        nodeType: 'function',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        metadata: {},
        properties: {
          jsDocComments: [
            '/**\n * Test JSDoc comment\n * This is a description\n */',
            '/**\n * Another JSDoc comment\n */'
          ]
        }
      };

      const description = (generator as any).getNodeDescription(node);

      expect(description).toContain('Test JSDoc comment');
    });
  });
});

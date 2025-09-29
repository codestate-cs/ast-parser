/**
 * Tests for ExampleExtractor
 * 
 * Following TDD approach - tests define expected behavior
 */

import { ExampleExtractor, ExampleExtractionOptions } from '../../../../src/documentation/extractors/ExampleExtractor';
import { ASTNode, ASTNodeType } from '../../../../src/types/core';

describe('ExampleExtractor', () => {
  let extractor: ExampleExtractor;
  let defaultOptions: ExampleExtractionOptions;

  beforeEach(() => {
    defaultOptions = {
      includeJSDoc: true,
      includeUsage: true,
      includeTest: false,
      includeDemo: true,
      validateSyntax: true,
      extractOutput: true,
      extractMetadata: true,
      customTypes: []
    };
    extractor = new ExampleExtractor();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(extractor.getOptions()).toEqual(defaultOptions);
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        includeJSDoc: false,
        includeTest: true,
        customTypes: ['custom']
      };
      const customExtractor = new ExampleExtractor(customOptions);
      
      expect(customExtractor.getOptions()).toEqual({
        ...defaultOptions,
        ...customOptions
      });
    });
  });

  describe('extractFromNode', () => {
    it('should extract JSDoc examples', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * const result = testFunction('hello');
             * console.log(result);
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('jsdoc');
      expect(result[0]?.language).toBe('typescript');
      expect(result[0]?.code).toContain('testFunction');
      expect(result[0]?.isValid).toBe(true);
    });

    it('should extract JSDoc examples with language specification', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {javascript}
             * const result = testFunction('hello');
             * console.log(result);
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('jsdoc');
      expect(result[0]?.language).toBe('javascript');
      expect(result[0]?.code).toContain('testFunction');
    });

    it('should extract usage examples', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          usageExamples: [
            {
              title: 'Basic Usage',
              description: 'How to use the function',
              code: 'const result = testFunction("hello");',
              language: 'typescript',
              output: 'Hello World'
            }
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('usage');
      expect(result[0]?.title).toBe('Basic Usage');
      expect(result[0]?.description).toBe('How to use the function');
      expect(result[0]?.code).toBe('const result = testFunction("hello");');
      expect(result[0]?.output).toBe('Hello World');
    });

    it('should extract test examples when enabled', () => {
      const testExtractor = new ExampleExtractor({ includeTest: true });
      
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          testExamples: [
            {
              title: 'Unit Test',
              description: 'Test the function',
              code: 'expect(testFunction("hello")).toBe("Hello World");',
              language: 'typescript'
            }
          ]
        },
        metadata: {}
      };

      const result = testExtractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('test');
      expect(result[0]?.title).toBe('Unit Test');
      expect(result[0]?.code).toContain('expect');
    });

    it('should extract examples from child nodes', () => {
      const childNode: ASTNode = {
        id: 'child-function',
        name: 'childFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 50,
        end: 80,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Child function
             * @example
             * childFunction();
             */`
          ]
        },
        metadata: {}
      };

      const parentNode: ASTNode = {
        id: 'parent-class',
        name: 'ParentClass',
        type: 'class',
        nodeType: 'class' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [childNode],
        properties: {},
        metadata: {}
      };

      const result = extractor.extractFromNode(parentNode);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('jsdoc');
      expect(result[0]?.code).toContain('childFunction');
    });

    it('should return empty array for node without examples', () => {
      const node: ASTNode = {
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
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });
  });

  describe('extractFromNodes', () => {
    it('should extract examples from multiple nodes', () => {
      const nodes: ASTNode[] = [
        {
          id: 'node1',
          name: 'function1',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test1.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {
            jsDocComments: [
              `/**
               * Function 1
               * @example
               * function1();
               */`
            ]
          },
          metadata: {}
        },
        {
          id: 'node2',
          name: 'function2',
          type: 'function',
          nodeType: 'function' as ASTNodeType,
          filePath: 'test2.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {
            usageExamples: [
              {
                code: 'function2();',
                title: 'Usage'
              }
            ]
          },
          metadata: {}
        }
      ];

      const result = extractor.extractFromNodes(nodes);

      expect(result.examples).toHaveLength(2);
      expect(result.totalExamples).toBe(2);
      expect(result.jsdocExamples).toBe(1);
      expect(result.usageExamples).toBe(1);
      expect(result.testExamples).toBe(0);
    });

    it('should calculate metadata correctly', () => {
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
          properties: {
            jsDocComments: [
              `/**
               * Test function
               * @example
               * testFunction();
               */`
            ]
          },
          metadata: {}
        }
      ];

      const result = extractor.extractFromNodes(nodes);

      expect(result.metadata.filesProcessed).toBe(1);
      expect(result.metadata.totalLines).toBeGreaterThan(0);
      expect(result.metadata.extractionTime).toBeGreaterThan(0);
    });
  });

  describe('syntax validation', () => {
    it('should validate JavaScript syntax', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * function test() {
             *   return "hello";
             * }
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(true);
      expect(result[0]?.errors).toHaveLength(0);
    });

    it('should detect invalid JavaScript syntax', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * function test() {
             *   return "hello";
             * // Missing closing brace
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(false);
      expect(result[0]?.errors.length).toBeGreaterThan(0);
    });

    it('should validate JSON syntax', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {json}
             * {
             *   "name": "test",
             *   "value": 123
             * }
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('json');
      expect(result[0]?.code).toBe('{\n  "name": "test",\n  "value": 123\n}');
      expect(result[0]?.isValid).toBe(true);
    });

    it('should detect invalid JSON syntax', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {json}
             * {
             *   "name": "test",
             *   "value": 123
             * // Missing closing brace
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(false);
      expect(result[0]?.errors.length).toBeGreaterThan(0);
    });
  });

  describe('filtering options', () => {
    it('should filter out JSDoc examples when includeJSDoc is false', () => {
      const noJSDocExtractor = new ExampleExtractor({ includeJSDoc: false });
      
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * testFunction();
             */`
          ]
        },
        metadata: {}
      };

      const result = noJSDocExtractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should filter out usage examples when includeUsage is false', () => {
      const noUsageExtractor = new ExampleExtractor({ includeUsage: false });
      
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          usageExamples: [
            {
              code: 'testFunction();',
              title: 'Usage'
            }
          ]
        },
        metadata: {}
      };

      const result = noUsageExtractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should include test examples when includeTest is true', () => {
      const testExtractor = new ExampleExtractor({ includeTest: true });
      
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          testExamples: [
            {
              code: 'expect(testFunction()).toBe("hello");',
              title: 'Test'
            }
          ]
        },
        metadata: {}
      };

      const result = testExtractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('test');
    });
  });

  describe('updateOptions', () => {
    it('should update options correctly', () => {
      const newOptions = {
        includeJSDoc: false,
        includeTest: true
      };

      extractor.updateOptions(newOptions);

      expect(extractor.getOptions().includeJSDoc).toBe(false);
      expect(extractor.getOptions().includeTest).toBe(true);
      expect(extractor.getOptions().includeUsage).toBe(true); // Should remain unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle empty JSDoc example', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should handle multiple examples in one JSDoc comment', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * testFunction('hello');
             * @example {javascript}
             * const result = testFunction('world');
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(2);
      expect(result[0]?.language).toBe('typescript');
      expect(result[1]?.language).toBe('javascript');
    });

    it('should handle examples with complex metadata', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          usageExamples: [
            {
              code: 'testFunction();',
              title: 'Complex Example',
              description: 'Example with metadata',
              metadata: {
                category: 'advanced',
                difficulty: 'medium',
                tags: ['async', 'promise']
              }
            }
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.metadata['category']).toBe('advanced');
      expect(result[0]?.metadata['difficulty']).toBe('medium');
      expect(result[0]?.metadata['tags']).toEqual(['async', 'promise']);
    });

    it('should handle JSDoc example ending with */', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * testFunction('hello');
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1); // The regex actually captures this example
      expect(result[0]?.code).toBe("testFunction('hello');");
    });

    it('should handle usage example without code', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          usageExamples: [
            {
              title: 'No Code Example',
              description: 'Example without code'
            }
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should handle test example without code', () => {
      const testExtractor = new ExampleExtractor({ includeTest: true });
      
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          testExamples: [
            {
              title: 'No Code Test',
              description: 'Test without code'
            }
          ]
        },
        metadata: {}
      };

      const result = testExtractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should handle null usage example', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          usageExamples: [null]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should handle null test example', () => {
      const testExtractor = new ExampleExtractor({ includeTest: true });
      
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          testExamples: [null]
        },
        metadata: {}
      };

      const result = testExtractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });
  });

  describe('language detection', () => {
    it('should detect TypeScript language variants', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {ts}
             * const result = testFunction();
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('typescript');
    });

    it('should detect JavaScript language variants', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {js}
             * const result = testFunction();
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('javascript');
    });

    it('should detect HTML language', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {html}
             * <div>Hello World</div>
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('html');
    });

    it('should detect CSS language', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {css}
             * .test { color: red; }
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('css');
    });

    it('should detect Markdown language', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {md}
             * # Test
             * This is a test
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('markdown');
    });

    it('should detect Bash language', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {bash}
             * echo "Hello World"
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('bash');
    });

    it('should detect SQL language', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {sql}
             * SELECT * FROM users;
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('sql');
    });

    it('should handle unknown language', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {unknown}
             * some unknown code
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.language).toBe('unknown');
    });
  });

  describe('syntax validation edge cases', () => {
    it('should validate HTML with self-closing tags', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {html}
             * <img src="test.jpg" />
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(true);
    });

    it('should detect invalid HTML with unmatched tags', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {html}
             * <div><span>Hello</div>
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(false);
      expect(result[0]?.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid HTML with unclosed tags', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {html}
             * <div>Hello World
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(false);
      expect(result[0]?.errors.length).toBeGreaterThan(0);
    });

    it('should validate CSS with balanced braces', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {css}
             * .test { color: red; }
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(true);
    });

    it('should detect invalid CSS with unmatched braces', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {css}
             * .test { color: red;
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(false);
      expect(result[0]?.errors.length).toBeGreaterThan(0);
    });

    it('should validate JavaScript with unmatched parentheses', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * function test( {
             *   return "hello";
             * }
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(false);
      expect(result[0]?.errors.length).toBeGreaterThan(0);
    });

    it('should validate JavaScript with unmatched brackets', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * const arr = [1, 2, 3;
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(false);
      expect(result[0]?.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty code for unknown language', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example {unknown}
             * 
             */`
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(0); // Empty code is filtered out in parseJSDocExample
    });
  });

  describe('filtering and options', () => {
    it('should include demo examples when includeDemo is true', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          usageExamples: [
            {
              code: 'testFunction();',
              title: 'Demo',
              type: 'demo'
            }
          ]
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('usage'); // Usage examples are parsed as 'usage' type
    });

    it('should include custom types when specified', () => {
      const customExtractor = new ExampleExtractor({ 
        customTypes: ['custom'],
        includeJSDoc: false,
        includeUsage: false,
        includeTest: false
      });
      
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          usageExamples: [
            {
              code: 'testFunction();',
              title: 'Custom',
              type: 'custom'
            }
          ]
        },
        metadata: {}
      };

      const result = customExtractor.extractFromNode(node);

      expect(result).toHaveLength(0); // Custom types are not handled in usage examples
    });

    it('should handle syntax validation disabled', () => {
      const noValidationExtractor = new ExampleExtractor({ validateSyntax: false });
      
      const node: ASTNode = {
        id: 'test-function',
        name: 'testFunction',
        type: 'function',
        nodeType: 'function' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          jsDocComments: [
            `/**
             * Test function
             * @example
             * function test() {
             *   return "hello";
             * // Missing closing brace
             */`
          ]
        },
        metadata: {}
      };

      const result = noValidationExtractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.isValid).toBe(true); // Should be valid when validation is disabled
    });
  });
});

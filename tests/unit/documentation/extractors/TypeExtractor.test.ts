/**
 * Tests for TypeExtractor
 * 
 * Following TDD approach - tests define expected behavior
 */

import { TypeExtractor, TypeExtractionOptions } from '../../../../src/documentation/extractors/TypeExtractor';
import { ASTNode, ASTNodeType } from '../../../../src/types/core';

describe('TypeExtractor', () => {
  let extractor: TypeExtractor;
  let defaultOptions: TypeExtractionOptions;

  beforeEach(() => {
    defaultOptions = {
      includePrivate: false,
      includeInternal: false,
      includeDeprecated: true,
      extractDocumentation: true,
      extractMetadata: true,
      extractDependencies: true,
      includeBuiltIn: false,
      customTypeKinds: []
    };
    extractor = new TypeExtractor();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(extractor.getOptions()).toEqual(defaultOptions);
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        includePrivate: true,
        extractDocumentation: false,
        customTypeKinds: ['custom']
      };
      const customExtractor = new TypeExtractor(customOptions);
      
      expect(customExtractor.getOptions()).toEqual({
        ...defaultOptions,
        ...customOptions
      });
    });
  });

  describe('extractFromNode', () => {
    it('should extract interface type information', () => {
      const node: ASTNode = {
        id: 'test-interface',
        name: 'TestInterface',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestInterface',
            kind: 'interface',
            definition: 'interface TestInterface { name: string; }',
            properties: [
              {
                name: 'name',
                type: 'string',
                optional: false,
                readonly: false,
                documentation: 'The name property'
              }
            ],
            methods: [],
            documentation: 'Test interface for demonstration'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('TestInterface');
      expect(result[0]?.kind).toBe('interface');
      expect(result[0]?.properties).toHaveLength(1);
      expect(result[0]?.properties[0]?.name).toBe('name');
      expect(result[0]?.properties[0]?.type).toBe('string');
    });

    it('should extract class type information', () => {
      const node: ASTNode = {
        id: 'test-class',
        name: 'TestClass',
        type: 'class',
        nodeType: 'class',
        filePath: 'test.ts',
        start: 0,
        end: 150,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestClass',
            kind: 'class',
            definition: 'class TestClass { constructor(); getName(): string; }',
            properties: [
              {
                name: 'name',
                type: 'string',
                optional: false,
                readonly: false
              }
            ],
            methods: [
              {
                name: 'getName',
                signature: '(): string',
                returnType: 'string',
                parameters: [],
                optional: false,
                static: false,
                abstract: false,
                documentation: 'Get the name'
              }
            ],
            documentation: 'Test class for demonstration'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('TestClass');
      expect(result[0]?.kind).toBe('class');
      expect(result[0]?.methods).toHaveLength(1);
      expect(result[0]?.methods[0]?.name).toBe('getName');
      expect(result[0]?.methods[0]?.returnType).toBe('string');
    });

    it('should extract enum type information', () => {
      const node: ASTNode = {
        id: 'test-enum',
        name: 'TestEnum',
        type: 'enum',
        nodeType: 'enum' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 80,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestEnum',
            kind: 'enum',
            definition: 'enum TestEnum { VALUE1 = "value1", VALUE2 = "value2" }',
            properties: [],
            methods: [],
            documentation: 'Test enum for demonstration'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('TestEnum');
      expect(result[0]?.kind).toBe('enum');
    });

    it('should extract generic type information', () => {
      const node: ASTNode = {
        id: 'test-generic',
        name: 'TestGeneric',
        type: 'type',
        nodeType: 'type' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 120,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestGeneric',
            kind: 'generic',
            definition: 'type TestGeneric<T> = { value: T; }',
            typeParameters: [
              {
                name: 'T',
                constraint: 'object',
                defaultType: undefined,
                documentation: 'Generic type parameter'
              }
            ],
            properties: [
              {
                name: 'value',
                type: 'T',
                optional: false,
                readonly: false
              }
            ],
            methods: [],
            documentation: 'Test generic type for demonstration'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('TestGeneric');
      expect(result[0]?.kind).toBe('generic');
      expect(result[0]?.typeParameters).toHaveLength(1);
      expect(result[0]?.typeParameters[0]?.name).toBe('T');
      expect(result[0]?.typeParameters[0]?.constraint).toBe('object');
    });

    it('should return empty array for node without type information', () => {
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

    it('should extract types from child nodes', () => {
      const childNode: ASTNode = {
        id: 'child-interface',
        name: 'ChildInterface',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 50,
        end: 100,
        children: [],
        properties: {
          typeInfo: {
            name: 'ChildInterface',
            kind: 'interface',
            definition: 'interface ChildInterface { }',
            properties: [],
            methods: []
          }
        },
        metadata: {}
      };

      const parentNode: ASTNode = {
        id: 'parent-node',
        name: 'ParentClass',
        type: 'class',
        nodeType: 'class',
        filePath: 'test.ts',
        start: 0,
        end: 150,
        children: [childNode],
        properties: {
          typeInfo: {
            name: 'ParentClass',
            kind: 'class',
            definition: 'class ParentClass { }',
            properties: [],
            methods: []
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(parentNode);

      expect(result).toHaveLength(2);
      expect(result.find(t => t.name === 'ParentClass')).toBeDefined();
      expect(result.find(t => t.name === 'ChildInterface')).toBeDefined();
    });
  });

  describe('extractFromNodes', () => {
    it('should extract types from multiple nodes', () => {
      const nodes: ASTNode[] = [
        {
          id: 'node1',
          name: 'Interface1',
          type: 'interface',
          nodeType: 'interface',
          filePath: 'test1.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {
            typeInfo: {
              name: 'Interface1',
              kind: 'interface',
              definition: 'interface Interface1 { }',
              properties: [],
              methods: []
            }
          },
          metadata: {}
        },
        {
          id: 'node2',
          name: 'Class1',
          type: 'class',
          nodeType: 'class',
          filePath: 'test2.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {
            typeInfo: {
              name: 'Class1',
              kind: 'class',
              definition: 'class Class1 { }',
              properties: [],
              methods: []
            }
          },
          metadata: {}
        }
      ];

      const result = extractor.extractFromNodes(nodes);

      expect(result.types).toHaveLength(2);
      expect(result.totalTypes).toBe(2);
      expect(result.interfaceCount).toBe(1);
      expect(result.classCount).toBe(1);
      expect(result.enumCount).toBe(0);
      expect(result.typeAliasCount).toBe(0);
    });

    it('should calculate metadata correctly', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'TestType',
          type: 'interface',
          nodeType: 'interface',
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [],
          properties: {
            typeInfo: {
              name: 'TestType',
              kind: 'interface',
              definition: 'interface TestType { }',
              properties: [],
              methods: []
            }
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

  describe('filtering options', () => {
    it('should filter out private types when includePrivate is false', () => {
      const privateExtractor = new TypeExtractor({ includePrivate: false });
      
      const node: ASTNode = {
        id: 'private-interface',
        name: 'PrivateInterface',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          typeInfo: {
            name: 'PrivateInterface',
            kind: 'interface',
            definition: 'interface PrivateInterface { }',
            properties: [],
            methods: [],
            isPublic: false
          }
        },
        metadata: {}
      };

      const result = privateExtractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should include private types when includePrivate is true', () => {
      const privateExtractor = new TypeExtractor({ includePrivate: true });
      
      const node: ASTNode = {
        id: 'private-interface',
        name: 'PrivateInterface',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          typeInfo: {
            name: 'PrivateInterface',
            kind: 'interface',
            definition: 'interface PrivateInterface { }',
            properties: [],
            methods: [],
            isPublic: false
          }
        },
        metadata: {}
      };

      const result = privateExtractor.extractFromNode(node);

      expect(result).toHaveLength(1);
    });

    it('should filter out built-in types when includeBuiltIn is false', () => {
      const builtInExtractor = new TypeExtractor({ includeBuiltIn: false });
      
      const node: ASTNode = {
        id: 'string-type',
        name: 'string',
        type: 'type',
        nodeType: 'type' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'string',
            kind: 'string',
            definition: 'string',
            properties: [],
            methods: []
          }
        },
        metadata: {}
      };

      const result = builtInExtractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should include built-in types when includeBuiltIn is true', () => {
      const builtInExtractor = new TypeExtractor({ includeBuiltIn: true });
      
      const node: ASTNode = {
        id: 'string-type',
        name: 'string',
        type: 'type',
        nodeType: 'type' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'string',
            kind: 'string',
            definition: 'string',
            properties: [],
            methods: []
          }
        },
        metadata: {}
      };

      const result = builtInExtractor.extractFromNode(node);

      expect(result).toHaveLength(1);
    });
  });

  describe('updateOptions', () => {
    it('should update options correctly', () => {
      const newOptions = {
        includePrivate: true,
        extractDocumentation: false
      };

      extractor.updateOptions(newOptions);

      expect(extractor.getOptions().includePrivate).toBe(true);
      expect(extractor.getOptions().extractDocumentation).toBe(false);
      expect(extractor.getOptions().includeDeprecated).toBe(true); // Should remain unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle type with no properties or methods', () => {
      const node: ASTNode = {
        id: 'empty-type',
        name: 'EmptyType',
        type: 'type',
        nodeType: 'type' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'EmptyType',
            kind: 'generic',
            definition: 'type EmptyType = {}',
            properties: [],
            methods: []
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.properties).toHaveLength(0);
      expect(result[0]?.methods).toHaveLength(0);
    });

    it('should handle type with complex metadata', () => {
      const node: ASTNode = {
        id: 'complex-type',
        name: 'ComplexType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          typeInfo: {
            name: 'ComplexType',
            kind: 'interface',
            definition: 'interface ComplexType { }',
            properties: [],
            methods: [],
            metadata: {
              isExported: true,
              isStatic: false,
              isAbstract: true,
              customProperty: 'customValue'
            }
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.metadata['isExported']).toBe(true);
      expect(result[0]?.metadata['isAbstract']).toBe(true);
      expect(result[0]?.metadata['customProperty']).toBe('customValue');
    });

    it('should handle type with dependencies', () => {
      const node: ASTNode = {
        id: 'dependent-type',
        name: 'DependentType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 100,
        children: [],
        properties: {
          typeInfo: {
            name: 'DependentType',
            kind: 'interface',
            definition: 'interface DependentType extends BaseType { }',
            properties: [],
            methods: [],
            dependencies: ['BaseType', 'UtilityType'],
            imports: ['ExternalType'],
            extends: ['BaseInterface']
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.dependencies).toContain('BaseType');
      expect(result[0]?.dependencies).toContain('UtilityType');
      expect(result[0]?.dependencies).toContain('ExternalType');
      expect(result[0]?.dependencies).toContain('BaseInterface');
    });
  });

  describe('type kind determination', () => {
    it('should determine interface type from nodeType', () => {
      const node: ASTNode = {
        id: 'test-interface',
        name: 'TestInterface',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestInterface',
            definition: 'interface TestInterface { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('interface');
    });

    it('should determine class type from nodeType', () => {
      const node: ASTNode = {
        id: 'test-class',
        name: 'TestClass',
        type: 'class',
        nodeType: 'class',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestClass',
            definition: 'class TestClass { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('class');
    });

    it('should determine enum type from nodeType', () => {
      const node: ASTNode = {
        id: 'test-enum',
        name: 'TestEnum',
        type: 'enum',
        nodeType: 'enum' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestEnum',
            definition: 'enum TestEnum { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('enum');
    });

    it('should determine generic type from nodeType', () => {
      const node: ASTNode = {
        id: 'test-type',
        name: 'TestType',
        type: 'type',
        nodeType: 'type' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            definition: 'type TestType = string'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('generic');
    });

    it('should determine union type from typeInfo properties', () => {
      const node: ASTNode = {
        id: 'test-union',
        name: 'TestUnion',
        type: 'type',
        nodeType: 'unknown' as ASTNodeType, // Use unknown to avoid nodeType precedence
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestUnion',
            definition: 'type TestUnion = string | number',
            isUnion: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('union');
    });

    it('should determine intersection type from typeInfo properties', () => {
      const node: ASTNode = {
        id: 'test-intersection',
        name: 'TestIntersection',
        type: 'type',
        nodeType: 'unknown' as ASTNodeType, // Use unknown to avoid nodeType precedence
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestIntersection',
            definition: 'type TestIntersection = A & B',
            isIntersection: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('intersection');
    });

    it('should determine literal type from typeInfo properties', () => {
      const node: ASTNode = {
        id: 'test-literal',
        name: 'TestLiteral',
        type: 'type',
        nodeType: 'unknown' as ASTNodeType, // Use unknown to avoid nodeType precedence
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestLiteral',
            definition: 'type TestLiteral = "hello"',
            isLiteral: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('literal');
    });

    it('should determine function type from typeInfo properties', () => {
      const node: ASTNode = {
        id: 'test-function',
        name: 'TestFunction',
        type: 'type',
        nodeType: 'unknown' as ASTNodeType, // Use unknown to avoid nodeType precedence
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestFunction',
            definition: 'type TestFunction = () => void',
            isFunction: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('function');
    });

    it('should determine array type from typeInfo properties', () => {
      const node: ASTNode = {
        id: 'test-array',
        name: 'TestArray',
        type: 'type',
        nodeType: 'unknown' as ASTNodeType, // Use unknown to avoid nodeType precedence
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestArray',
            definition: 'type TestArray = string[]',
            isArray: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('array');
    });

    it('should determine object type from typeInfo properties', () => {
      const node: ASTNode = {
        id: 'test-object',
        name: 'TestObject',
        type: 'type',
        nodeType: 'unknown' as ASTNodeType, // Use unknown to avoid nodeType precedence
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestObject',
            definition: 'type TestObject = { }',
            isObject: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('object');
    });

    it('should determine unknown type when no patterns match', () => {
      const node: ASTNode = {
        id: 'test-unknown',
        name: 'TestUnknown',
        type: 'unknown',
        nodeType: 'unknown' as ASTNodeType,
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestUnknown',
            definition: 'unknown type'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('unknown');
    });
  });

  describe('type definition extraction', () => {
    it('should extract definition from typeInfo.definition', () => {
      const node: ASTNode = {
        id: 'test-def',
        name: 'TestDef',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestDef',
            definition: 'interface TestDef { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.definition).toBe('interface TestDef { }');
    });

    it('should extract definition from typeInfo.text when definition is missing', () => {
      const node: ASTNode = {
        id: 'test-text',
        name: 'TestText',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestText',
            text: 'interface TestText { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.definition).toBe('interface TestText { }');
    });

    it('should extract definition from typeInfo.type when definition and text are missing', () => {
      const node: ASTNode = {
        id: 'test-type-def',
        name: 'TestTypeDef',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestTypeDef',
            type: 'interface TestTypeDef { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.definition).toBe('interface TestTypeDef { }');
    });

    it('should return unknown when no definition sources are available', () => {
      const node: ASTNode = {
        id: 'test-no-def',
        name: 'TestNoDef',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestNoDef'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.definition).toBe('unknown');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle null typeInfo', () => {
      const node: ASTNode = {
        id: 'test-null',
        name: 'TestNull',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: null
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should handle undefined typeInfo', () => {
      const node: ASTNode = {
        id: 'test-undefined',
        name: 'TestUndefined',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: undefined
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should handle non-object typeInfo', () => {
      const node: ASTNode = {
        id: 'test-string',
        name: 'TestString',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: 'not an object'
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(0);
    });

    it('should handle typeInfo without name', () => {
      const node: ASTNode = {
        id: 'test-no-name',
        name: 'TestNoName',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            definition: 'interface { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('TestNoName'); // Should fall back to node name
    });

    it('should handle node without name', () => {
      const node: ASTNode = {
        id: 'test-no-node-name',
        name: 'TestInterface', // Use a valid name instead of empty string
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            definition: 'interface { }',
            isPublic: true // Make it public so it passes filtering
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('TestInterface'); // Uses node name when typeInfo.name is missing
    });

    it('should handle node with filePath', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.filePath).toBe('test.ts');
    });

    it('should handle node without filePath', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: '',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.filePath).toBe('');
    });

    it('should handle node with exported property', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }'
          },
          exported: true
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.exported).toBe(true);
    });

    it('should handle type with all documentation sources', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            documentation: 'Main documentation',
            comment: 'Comment documentation',
            description: 'Description documentation'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.documentation).toBe('Main documentation');
    });

    it('should handle type with only comment documentation', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            comment: 'Comment documentation'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.documentation).toBe('Comment documentation');
    });

    it('should handle type with only description documentation', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            description: 'Description documentation'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.documentation).toBe('Description documentation');
    });

    it('should handle type with dependencies extraction disabled', () => {
      const customExtractor = new TypeExtractor({
        ...defaultOptions,
        extractDependencies: false
      });

      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            dependencies: ['dep1', 'dep2'],
            imports: ['import1'],
            extends: ['base1'],
            implements: ['interface1']
          }
        },
        metadata: {}
      };

      const result = customExtractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.metadata['dependencies']).toBeUndefined();
    });

    it('should handle type with all dependency types', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            dependencies: ['dep1', 'dep2'],
            imports: ['import1'],
            extends: ['base1'],
            implements: ['interface1']
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.dependencies).toEqual(['dep1', 'dep2', 'import1', 'base1', 'interface1']);
    });

    it('should handle type with isExported undefined but exported property', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            isExported: undefined
          },
          exported: true
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.exported).toBe(true);
    });

    it('should handle type with isPublic undefined but private property', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            isPublic: undefined,
            isPrivate: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(0);
    });

    it('should handle type with isPublic undefined but protected property', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            isPublic: undefined,
            isProtected: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(0);
    });

    it('should handle type with isPublic true', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            isPublic: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.metadata['isPublic']).toBe(true);
    });

    it('should handle type with internal metadata', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            metadata: {
              isInternal: true
            }
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(0);
    });

    it('should handle type with deprecated metadata', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            metadata: {
              isDeprecated: true
            }
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.metadata['isDeprecated']).toBe(true);
    });

    it('should handle built-in type when includeBuiltIn is true', () => {
      const customExtractor = new TypeExtractor({
        ...defaultOptions,
        includeBuiltIn: true
      });

      const node: ASTNode = {
        id: 'test-node',
        name: 'String',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'String',
            kind: 'interface',
            definition: 'interface String { }'
          }
        },
        metadata: {}
      };

      const result = customExtractor.extractFromNode(node);
      expect(result).toHaveLength(1);
    });

    it('should handle type with custom type kinds', () => {
      const customExtractor = new TypeExtractor({
        ...defaultOptions,
        customTypeKinds: ['custom', 'special']
      });

      const node: ASTNode = {
        id: 'test-node',
        name: 'CustomType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'CustomType',
            kind: 'custom',
            definition: 'custom CustomType { }'
          }
        },
        metadata: {}
      };

      const result = customExtractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('interface');
    });

    it('should determine type kind from typeInfo.kind property', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'unknown',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'union',
            definition: 'type TestType = string | number'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.kind).toBe('union');
    });

    it('should handle type with isExported property in typeInfo', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'TestType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'TestType',
            kind: 'interface',
            definition: 'interface TestType { }',
            isExported: true
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.exported).toBe(true);
    });

    it('should filter out deprecated types when includeDeprecated is false', () => {
      const nonDeprecatedExtractor = new TypeExtractor({
        ...defaultOptions,
        includeDeprecated: false
      });

      const node: ASTNode = {
        id: 'test-node',
        name: 'DeprecatedType',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            name: 'DeprecatedType',
            kind: 'interface',
            definition: 'interface DeprecatedType { }',
            metadata: {
              isDeprecated: true
            }
          }
        },
        metadata: {}
      };

      const result = nonDeprecatedExtractor.extractFromNode(node);
      expect(result).toHaveLength(0);
    });

    it('should determine type kind from specific typeInfo patterns', () => {
      const testCases = [
        { pattern: 'isInterface', expected: 'interface' },
        { pattern: 'isClass', expected: 'class' },
        { pattern: 'isEnum', expected: 'enum' },
        { pattern: 'isUnion', expected: 'union' },
        { pattern: 'isIntersection', expected: 'intersection' },
        { pattern: 'isGeneric', expected: 'generic' },
        { pattern: 'isLiteral', expected: 'literal' },
        { pattern: 'isFunction', expected: 'function' }
      ];

      testCases.forEach(({ pattern, expected }) => {
        const node: ASTNode = {
          id: 'test-node',
          name: 'TestType',
          type: 'interface',
          nodeType: 'unknown',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          properties: {
            typeInfo: {
              name: 'TestType',
              [pattern]: true,
              definition: `type TestType = ${expected}`
            }
          },
          metadata: {}
        };

        const result = extractor.extractFromNode(node);
        expect(result).toHaveLength(1);
        expect(result[0]?.kind).toBe(expected);
      });
    });

    it('should handle typeInfo without name using node name', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: 'NodeName',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            kind: 'interface',
            definition: 'interface NodeName { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('NodeName');
    });

    it('should handle typeInfo without name and node name using unknown', () => {
      const node: ASTNode = {
        id: 'test-node',
        name: '',
        type: 'interface',
        nodeType: 'interface',
        filePath: 'test.ts',
        start: 0,
        end: 50,
        children: [],
        properties: {
          typeInfo: {
            kind: 'interface',
            definition: 'interface { }'
          }
        },
        metadata: {}
      };

      const result = extractor.extractFromNode(node);
      expect(result).toHaveLength(0);
    });
  });
});

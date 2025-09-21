/**
 * Tests for TypeScriptParser class
 */

import { TypeScriptParser } from '../../../src/parsers';
import { ParsingOptions, FileInfo } from '../../../src/types';
import { FileUtils } from '../../../src/utils';

describe('TypeScriptParser', () => {
  let parser: TypeScriptParser;
  let options: ParsingOptions;

  beforeEach(() => {
    options = {
      filtering: {
        includePatterns: ['**/*.ts'],
        excludePatterns: ['**/*.test.ts'],
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

    parser = new TypeScriptParser(options);
  });

  describe('constructor', () => {
    it('should create instance with options', () => {
      expect(parser).toBeInstanceOf(TypeScriptParser);
      expect(parser.getOptions()).toEqual(options);
    });
  });

  describe('canParse', () => {
    it('should return true for TypeScript files', () => {
      const file: FileInfo = {
        path: 'test.ts',
        name: 'test.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      expect(parser.canParse(file)).toBe(true);
    });

    it('should return true for TypeScript JSX files', () => {
      const file: FileInfo = {
        path: 'test.tsx',
        name: 'test.tsx',
        extension: '.tsx',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      expect(parser.canParse(file)).toBe(true);
    });

    it('should return true for JavaScript files', () => {
      const file: FileInfo = {
        path: 'test.js',
        name: 'test.js',
        extension: '.js',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      expect(parser.canParse(file)).toBe(true);
    });

    it('should return true for JavaScript JSX files', () => {
      const file: FileInfo = {
        path: 'test.jsx',
        name: 'test.jsx',
        extension: '.jsx',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      expect(parser.canParse(file)).toBe(true);
    });

    it('should return false for non-JavaScript/TypeScript files', () => {
      const file: FileInfo = {
        path: 'test.py',
        name: 'test.py',
        extension: '.py',
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
      expect(parser.getParserName()).toBe('TypeScriptParser');
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return supported extensions', () => {
      const extensions = parser.getSupportedExtensions();
      expect(extensions).toEqual(['.ts', '.tsx', '.js', '.jsx']);
    });
  });

  describe('parseFile', () => {
    it('should parse simple TypeScript file', async () => {
      const file: FileInfo = {
        path: 'test.ts',
        name: 'test.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      // Mock file content
      const mockContent = `
        class TestClass {
          method(): void {}
        }
        
        interface TestInterface {
          property: string;
        }
        
        function testFunction(): void {}
      `;

      // Mock FileUtils.readFile
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.relations).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.file).toEqual(file);
      expect(result.metadata.nodeCount).toBeGreaterThan(0);
    });

    it('should throw error for invalid file', async () => {
      const file: FileInfo = {
        path: 'test.py',
        name: 'test.py',
        extension: '.py',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      await expect(parser.parseFile(file)).rejects.toThrow();
    });
  });

  describe('additional methods', () => {
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
    it('should handle file reading errors', async () => {
      const file: FileInfo = {
        path: 'nonexistent.ts',
        name: 'nonexistent.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      // Mock FileUtils.readFile to throw error
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockRejectedValue(new Error('File not found'));

      await expect(parser.parseFile(file)).rejects.toThrow('File not found');
    });

    it('should handle invalid TypeScript syntax', async () => {
      const file: FileInfo = {
        path: 'invalid.ts',
        name: 'invalid.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      // Mock file content with invalid syntax
      const mockContent = `
        class TestClass {
          invalid syntax here
        }
      `;

      // Mock FileUtils.readFile
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      // Should not throw error - TypeScript parser is tolerant
      const result = await parser.parseFile(file);
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
    });
  });

  describe('complex TypeScript features', () => {
    it('should parse class with decorators', async () => {
      const file: FileInfo = {
        path: 'decorated.ts',
        name: 'decorated.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        @Component({
          selector: 'app-test'
        })
        export class TestComponent {
          @Input() property: string;
          
          @Output() event = new EventEmitter();
          
          @HostListener('click')
          onClick() {}
        }
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Check for class node
      const classNode = result.nodes.find(node => node.nodeType === 'class');
      expect(classNode).toBeDefined();
      expect(classNode?.name).toBe('TestComponent');
    });

    it('should parse interface with generics', async () => {
      const file: FileInfo = {
        path: 'generic.ts',
        name: 'generic.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        interface GenericInterface<T, U> {
          property: T;
          method(param: U): T;
        }
        
        class GenericClass<T> implements GenericInterface<T, string> {
          property: T;
          method(param: string): T {
            return this.property;
          }
        }
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Check for interface node
      const interfaceNode = result.nodes.find(node => node.nodeType === 'interface');
      expect(interfaceNode).toBeDefined();
      expect(interfaceNode?.name).toBe('GenericInterface');
    });

    it('should parse enum declarations', async () => {
      const file: FileInfo = {
        path: 'enum.ts',
        name: 'enum.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        enum Status {
          PENDING = 'pending',
          APPROVED = 'approved',
          REJECTED = 'rejected'
        }
        
        const enum Direction {
          UP,
          DOWN,
          LEFT,
          RIGHT
        }
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Check for enum nodes
      const enumNodes = result.nodes.filter(node => node.nodeType === 'enum');
      expect(enumNodes.length).toBeGreaterThan(0);
    });

    it('should parse import/export statements', async () => {
      const file: FileInfo = {
        path: 'imports.ts',
        name: 'imports.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        import { Component, Input, Output } from '@angular/core';
        import * as React from 'react';
        import defaultExport from './module';
        
        export { TestClass } from './test';
        export * from './utils';
        export default class MainClass {}
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Check for import/export nodes
      const importNodes = result.nodes.filter(node => node.nodeType === 'import');
      const exportNodes = result.nodes.filter(node => node.nodeType === 'export');
      expect(importNodes.length).toBeGreaterThan(0);
      expect(exportNodes.length).toBeGreaterThan(0);
    });

    it('should parse arrow functions', async () => {
      const file: FileInfo = {
        path: 'arrows.ts',
        name: 'arrows.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        const arrowFunction = (param: string) => {
          return param.toUpperCase();
        };
        
        const asyncArrow = async (data: any) => {
          return await processData(data);
        };
        
        const simpleArrow = (x: number) => x * 2;
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Check for arrow function nodes
      const arrowNodes = result.nodes.filter(node => node.nodeType === 'function');
      expect(arrowNodes.length).toBeGreaterThan(0);
    });

    it('should parse type aliases', async () => {
      const file: FileInfo = {
        path: 'types.ts',
        name: 'types.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        type UserID = string;
        type UserRole = 'admin' | 'user' | 'guest';
        
        type User = {
          id: UserID;
          name: string;
          role: UserRole;
          createdAt: Date;
        };
        
        type ApiResponse<T> = {
          data: T;
          status: number;
          message: string;
        };
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.nodes.length).toBeGreaterThan(0);
      
      // Check for type alias nodes
      const typeNodes = result.nodes.filter(node => node.nodeType === 'type');
      expect(typeNodes.length).toBeGreaterThan(0);
    });
  });

  describe('node properties and metadata', () => {
    it('should extract correct node properties', async () => {
      const file: FileInfo = {
        path: 'properties.ts',
        name: 'properties.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        export abstract class BaseClass {
          public readonly property: string = 'test';
          private optional?: number;
          
          public async method(): Promise<void> {}
          
          protected abstract abstractMethod(): void;
        }
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      
      // Check class properties
      const classNode = result.nodes.find(node => node.nodeType === 'class');
      expect(classNode).toBeDefined();
      expect(classNode?.properties).toBeDefined();
    });

    it('should handle nodes without names', async () => {
      const file: FileInfo = {
        path: 'anonymous.ts',
        name: 'anonymous.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        const anonymous = function() {
          return 'anonymous';
        };
        
        const arrow = () => 'arrow';
        
        interface {
          property: string;
        }
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      
      // Should handle anonymous functions gracefully
      const functionNodes = result.nodes.filter(node => 
        node.nodeType === 'function'
      );
      expect(functionNodes.length).toBeGreaterThan(0);
    });
  });

  describe('relations and dependencies', () => {
    it('should build parent-child relations', async () => {
      const file: FileInfo = {
        path: 'relations.ts',
        name: 'relations.ts',
        extension: '.ts',
        size: 100,
        lines: 10,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const mockContent = `
        class ParentClass {
          childMethod() {
            return 'child';
          }
          
          get childProperty() {
            return 'property';
          }
          
          set childProperty(value: string) {
            // setter
          }
        }
      `;

      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(mockContent);

      const result = await parser.parseFile(file);
      
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
      expect(result.relations).toBeDefined();
      
      // Should have parent-child relations
      expect(result.relations.length).toBeGreaterThan(0);
      
      const parentChildRelations = result.relations.filter(rel => 
        rel.metadata?.['relationship'] === 'parent-child'
      );
      expect(parentChildRelations.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases and uncovered branches', () => {
    it('should handle namespace export declarations', async () => {
      const content = `
        export namespace MyNamespace {
          export const value = 42;
        }
      `;

      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(content);

      const file: FileInfo = {
        path: 'test.ts',
        name: 'test.ts',
        extension: '.ts',
        size: content.length,
        lines: content.split('\n').length,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const result = await parser.parseFile(file);
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
    });

    it('should handle module declarations', async () => {
      const content = `
        declare module 'my-module' {
          export const value: string;
        }
      `;

      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(content);

      const file: FileInfo = {
        path: 'test.ts',
        name: 'test.ts',
        extension: '.ts',
        size: content.length,
        lines: content.split('\n').length,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const result = await parser.parseFile(file);
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
    });

    it('should handle decorators', async () => {
      const content = `
        @Component({
          selector: 'my-component'
        })
        export class MyComponent {
          @Input() value: string;
        }
      `;

      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(content);

      const file: FileInfo = {
        path: 'test.ts',
        name: 'test.ts',
        extension: '.ts',
        size: content.length,
        lines: content.split('\n').length,
        lastModified: new Date(),
        hash: 'test-hash',
      };

      const result = await parser.parseFile(file);
      expect(result).toBeDefined();
      expect(result.nodes).toBeDefined();
    });
  });
});

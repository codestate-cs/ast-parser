/**
 * Test utilities and helpers
 */

import { FileInfo } from '../../src/types';

/**
 * Create mock file info for testing
 */
export function createMockFileInfo(overrides: Partial<FileInfo> = {}): FileInfo {
  return {
    path: 'test.ts',
    name: 'test.ts',
    extension: '.ts',
    size: 100,
    lines: 10,
    lastModified: new Date(),
    hash: 'test-hash',
    ...overrides,
  };
}

/**
 * Create mock TypeScript content
 */
export function createMockTypeScriptContent(): string {
  return `
    class TestClass {
      private property: string;
      
      constructor(property: string) {
        this.property = property;
      }
      
      public getProperty(): string {
        return this.property;
      }
    }
    
    interface TestInterface {
      id: number;
      name: string;
    }
    
    function testFunction(): void {
      console.log('test');
    }
  `;
}

/**
 * Create mock JavaScript content
 */
export function createMockJavaScriptContent(): string {
  return `
    class TestClass {
      constructor(property) {
        this.property = property;
      }
      
      getProperty() {
        return this.property;
      }
    }
    
    function testFunction() {
      console.log('test');
    }
  `;
}

/**
 * Wait for specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock console methods
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.info = jest.fn();
    console.debug = jest.fn();
  });
  
  afterEach(() => {
    Object.assign(console, originalConsole);
  });
}

/**
 * Create mock project path
 */
export function createMockProjectPath(): string {
  return '/mock/project/path';
}

/**
 * Create mock parsing options
 */
export function createMockParsingOptions() {
  return {
    filtering: {
      includePatterns: ['**/*.ts', '**/*.tsx'],
      excludePatterns: ['**/*.test.ts'],
      skipNodeModules: true,
      maxDepth: 10,
      includeOnlyExports: false,
      includeTestFiles: false,
      includeDocFiles: true,
    },
    mode: 'full' as const,
    output: {
      format: 'json' as const,
      compression: 'none' as const,
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
      documentationFormat: 'markdown' as const,
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
}

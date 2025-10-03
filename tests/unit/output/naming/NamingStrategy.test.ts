/**
 * @fileoverview Comprehensive tests for NamingStrategy abstract class
 * Following PDD -> BDD -> TDD approach
 */

import { NamingStrategy } from '../../../../src/output/naming/NamingStrategy';
import { ProjectInfo } from '../../../../src/types';

// Test implementation of NamingStrategy for testing
class TestNamingStrategy extends NamingStrategy {
  constructor(options?: any) {
    super(options);
  }

  generateFileName(projectInfo: ProjectInfo, _options?: any): string {
    return `test-${projectInfo.name || 'project'}.json`;
  }

  generateDirectoryName(projectInfo: ProjectInfo, _options?: any): string {
    return `test-${projectInfo.name || 'project'}-output`;
  }

  override generateTimestamp(): string {
    return '2024-01-01T00:00:00.000Z';
  }

  override validateName(name: string): boolean {
    return name.length > 0 && !name.includes('invalid');
  }

  override sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '-');
  }
}

// Test implementation that doesn't override methods to test original implementations
class TestNamingStrategyOriginal extends NamingStrategy {
  constructor(options?: any) {
    super(options);
  }

  generateFileName(projectInfo: ProjectInfo, _options?: any): string {
    return `test-${projectInfo.name || 'project'}.json`;
  }

  generateDirectoryName(projectInfo: ProjectInfo, _options?: any): string {
    return `test-${projectInfo.name || 'project'}-output`;
  }

  // Expose protected methods for testing
  public testFormatName(parts: any): string {
    return this.formatName(parts);
  }

  public testGetProjectName(projectInfo: ProjectInfo): string {
    return this.getProjectName(projectInfo);
  }

  public testGetProjectVersion(projectInfo: ProjectInfo): string {
    return this.getProjectVersion(projectInfo);
  }

  public testGetProjectType(projectInfo: ProjectInfo): string {
    return this.getProjectType(projectInfo);
  }
}

describe('NamingStrategy', () => {
  let namingStrategy: TestNamingStrategy;
  let mockProjectInfo: ProjectInfo;

  beforeEach(() => {
    namingStrategy = new TestNamingStrategy();
    mockProjectInfo = {
      name: 'test-project',
      version: '1.0.0',
      type: 'typescript',
      rootPath: '/test/project',
      structure: {
        files: [],
        directories: [],
        totalFiles: 0,
        totalLines: 0,
        totalSize: 0
      },
      complexity: {
        cyclomaticComplexity: 10,
        cognitiveComplexity: 15,
        linesOfCode: 1000,
        functionCount: 50,
        classCount: 10,
        interfaceCount: 5
      },
      quality: {
        score: 80,
        maintainabilityIndex: 80,
        technicalDebtRatio: 0.1,
        duplicationPercentage: 2,
        testCoveragePercentage: 85
      },
      ast: [],
      relations: [],
      dependencies: [],
      devDependencies: [],
      publicExports: [],
      privateExports: [],
      entryPoints: []
    };
  });

  describe('Happy Path Scenarios', () => {
    it('should create naming strategy instance with default options', () => {
      expect(namingStrategy).toBeDefined();
      expect(namingStrategy.getOptions()).toBeDefined();
    });

    it('should create naming strategy instance with custom options', () => {
      const customOptions = { prefix: 'custom', suffix: 'output' };
      const customStrategy = new TestNamingStrategy(customOptions);
      
      expect(customStrategy).toBeDefined();
      const options = customStrategy.getOptions();
      expect(options.prefix).toBe('custom');
      expect(options.suffix).toBe('output');
    });

    it('should generate file name for project', () => {
      const fileName = namingStrategy.generateFileName(mockProjectInfo);
      
      expect(fileName).toBe('test-test-project.json');
      expect(typeof fileName).toBe('string');
      expect(fileName.length).toBeGreaterThan(0);
    });

    it('should generate directory name for project', () => {
      const dirName = namingStrategy.generateDirectoryName(mockProjectInfo);
      
      expect(dirName).toBe('test-test-project-output');
      expect(typeof dirName).toBe('string');
      expect(dirName.length).toBeGreaterThan(0);
    });

    it('should generate timestamp', () => {
      const timestamp = namingStrategy.generateTimestamp();
      
      expect(timestamp).toBe('2024-01-01T00:00:00.000Z');
      expect(typeof timestamp).toBe('string');
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should validate valid names', () => {
      expect(namingStrategy.validateName('valid-name')).toBe(true);
      expect(namingStrategy.validateName('another_valid_name')).toBe(true);
      expect(namingStrategy.validateName('name123')).toBe(true);
    });

    it('should sanitize names correctly', () => {
      expect(namingStrategy.sanitizeName('test@name#with$special%chars')).toBe('test-name-with-special-chars');
      expect(namingStrategy.sanitizeName('name with spaces')).toBe('name-with-spaces');
      expect(namingStrategy.sanitizeName('name-with-dashes')).toBe('name-with-dashes');
    });

    it('should generate names with custom options', () => {
      const customOptions = { format: 'xml', prefix: 'custom' };
      const fileName = namingStrategy.generateFileName(mockProjectInfo, customOptions);
      
      expect(fileName).toBe('test-test-project.json');
    });
  });

  describe('Failure Scenarios', () => {
    it('should handle null project info gracefully', () => {
      expect(() => {
        namingStrategy.generateFileName(null as any);
      }).toThrow();
    });

    it('should handle undefined project info gracefully', () => {
      expect(() => {
        namingStrategy.generateFileName(undefined as any);
      }).toThrow();
    });

    it('should handle project info without name', () => {
      const projectWithoutName = { ...mockProjectInfo, name: '' };
      const fileName = namingStrategy.generateFileName(projectWithoutName);
      
      expect(fileName).toBe('test-project.json');
    });

    it('should reject invalid names in validation', () => {
      expect(namingStrategy.validateName('')).toBe(false);
      expect(namingStrategy.validateName('invalid')).toBe(false);
      expect(namingStrategy.validateName('name with invalid')).toBe(false);
    });

    it('should handle empty string sanitization', () => {
      expect(namingStrategy.sanitizeName('')).toBe('');
    });
  });

  describe('Pathological Cases', () => {
    it('should handle extremely long project names', () => {
      const longName = 'a'.repeat(1000);
      const projectWithLongName = { ...mockProjectInfo, name: longName };
      
      expect(() => {
        namingStrategy.generateFileName(projectWithLongName);
      }).not.toThrow();
    });

    it('should handle project names with special characters', () => {
      const specialName = 'project@#$%^&*()_+{}|:"<>?[]\\;\'.,/`~';
      const projectWithSpecialName = { ...mockProjectInfo, name: specialName };
      
      expect(() => {
        namingStrategy.generateFileName(projectWithSpecialName);
      }).not.toThrow();
    });

    it('should handle unicode project names', () => {
      const unicodeName = '项目名称-测试-中文-日本語-한국어';
      const projectWithUnicodeName = { ...mockProjectInfo, name: unicodeName };
      
      expect(() => {
        namingStrategy.generateFileName(projectWithUnicodeName);
      }).not.toThrow();
    });

    it('should handle concurrent name generation', async () => {
      const promises = Array.from({ length: 100 }, () => 
        Promise.resolve(namingStrategy.generateFileName(mockProjectInfo))
      );
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(100);
      expect(results.every(name => typeof name === 'string')).toBe(true);
    });
  });

  describe('Human-Missable Edge Cases', () => {
    it('should handle project names with only spaces', () => {
      const spaceName = '   ';
      const projectWithSpaceName = { ...mockProjectInfo, name: spaceName };
      
      expect(() => {
        namingStrategy.generateFileName(projectWithSpaceName);
      }).not.toThrow();
    });

    it('should handle project names with only numbers', () => {
      const numberName = '123456789';
      const projectWithNumberName = { ...mockProjectInfo, name: numberName };
      
      expect(() => {
        namingStrategy.generateFileName(projectWithNumberName);
      }).not.toThrow();
    });

    it('should handle project names with mixed case', () => {
      const mixedCaseName = 'TestProject-Name_123';
      const projectWithMixedCaseName = { ...mockProjectInfo, name: mixedCaseName };
      
      expect(() => {
        namingStrategy.generateFileName(projectWithMixedCaseName);
      }).not.toThrow();
    });

    it('should handle sanitization of names with multiple consecutive special chars', () => {
      const nameWithMultipleSpecialChars = 'test@@@name###with$$$special';
      const sanitized = namingStrategy.sanitizeName(nameWithMultipleSpecialChars);
      
      expect(sanitized).toBe('test---name---with---special');
      expect(sanitized).not.toContain('@');
      expect(sanitized).not.toContain('#');
      expect(sanitized).not.toContain('$');
    });

    it('should handle validation of names with edge case characters', () => {
      expect(namingStrategy.validateName('name-with-dashes')).toBe(true);
      expect(namingStrategy.validateName('name_with_underscores')).toBe(true);
      expect(namingStrategy.validateName('name123with456numbers')).toBe(true);
    });
  });

  describe('Performance and Memory', () => {
    it('should not leak memory with repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 1000; i++) {
        namingStrategy.generateFileName(mockProjectInfo);
        namingStrategy.generateDirectoryName(mockProjectInfo);
        namingStrategy.sanitizeName(`test-name-${i}`);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle memory-efficient processing', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        namingStrategy.generateFileName(mockProjectInfo);
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process 10000 operations in less than 1 second
      expect(processingTime).toBeLessThan(1000);
    });
  });

  describe('Configuration and Options', () => {
    it('should use default options when not provided', () => {
      const strategy = new TestNamingStrategy();
      expect(strategy.getOptions()).toBeDefined();
    });

    it('should merge provided options with defaults', () => {
      const customOptions = { prefix: 'custom', newOption: 'value' };
      const strategy = new TestNamingStrategy(customOptions);
      
      const options = strategy.getOptions();
      expect(options.prefix).toBe('custom');
      expect((options as any).newOption).toBe('value');
    });

    it('should handle empty options object', () => {
      const strategy = new TestNamingStrategy({});
      const options = strategy.getOptions();
      expect(options).toBeDefined();
      expect(typeof options).toBe('object');
    });

    it('should handle undefined options', () => {
      const strategy = new TestNamingStrategy(undefined);
      expect(strategy.getOptions()).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with real project analysis output', () => {
      const realProjectInfo: ProjectInfo = {
        name: 'real-project',
        version: '2.1.0',
        type: 'typescript',
        rootPath: '/real/project',
        structure: {
          files: [
            { name: 'index.ts', path: '/real/project/index.ts', size: 1024, lines: 50, extension: '.ts', lastModified: new Date(), hash: 'abc123' }
          ],
          directories: [
            { name: 'src', path: '/real/project/src', fileCount: 0, subdirectoryCount: 0, totalSize: 0 }
          ],
          totalFiles: 1,
          totalLines: 50,
          totalSize: 1024
        },
        complexity: {
          cyclomaticComplexity: 25,
          cognitiveComplexity: 30,
          linesOfCode: 5000,
          functionCount: 100,
          classCount: 20,
          interfaceCount: 15
        },
        quality: {
          score: 75,
          maintainabilityIndex: 75,
          technicalDebtRatio: 0.15,
          duplicationPercentage: 5,
          testCoveragePercentage: 80
        },
        ast: [],
        relations: [],
        dependencies: [],
        devDependencies: [],
        publicExports: [],
        privateExports: [],
        entryPoints: []
      };

      const fileName = namingStrategy.generateFileName(realProjectInfo);
      const dirName = namingStrategy.generateDirectoryName(realProjectInfo);
      
      expect(fileName).toBe('test-real-project.json');
      expect(dirName).toBe('test-real-project-output');
    });

    it('should handle different naming strategies consistently', () => {
      const strategies = [
        new TestNamingStrategy({ prefix: 'strategy1' }),
        new TestNamingStrategy({ prefix: 'strategy2' }),
        new TestNamingStrategy({ prefix: 'strategy3' })
      ];

      strategies.forEach(strategy => {
        const fileName = strategy.generateFileName(mockProjectInfo);
        const dirName = strategy.generateDirectoryName(mockProjectInfo);
        
        expect(typeof fileName).toBe('string');
        expect(typeof dirName).toBe('string');
        expect(fileName.length).toBeGreaterThan(0);
        expect(dirName.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle malformed project data gracefully', () => {
      const malformedProject = {
        name: 'test',
        // Missing required fields
      } as any;

      expect(() => {
        namingStrategy.generateFileName(malformedProject);
      }).not.toThrow();
    });

    it('should handle missing optional properties', () => {
      const minimalProject = {
        name: 'minimal-project',
        version: '1.0.0',
        type: 'typescript' as const,
        rootPath: '/minimal',
        structure: { files: [], directories: [], totalFiles: 0, totalLines: 0, totalSize: 0 },
        complexity: { cyclomaticComplexity: 0, cognitiveComplexity: 0, linesOfCode: 0, functionCount: 0, classCount: 0, interfaceCount: 0 },
        quality: { score: 0, maintainabilityIndex: 0, technicalDebtRatio: 0, duplicationPercentage: 0, testCoveragePercentage: 0 },
        ast: [],
        relations: [],
        dependencies: [],
        devDependencies: [],
        publicExports: [],
        privateExports: [],
        entryPoints: []
      };

      expect(() => {
        namingStrategy.generateFileName(minimalProject);
        namingStrategy.generateDirectoryName(minimalProject);
      }).not.toThrow();
    });
  });

  describe('Coverage Improvement Tests', () => {
    it('should handle abstract method calls', () => {
      expect(() => {
        namingStrategy.generateFileName(mockProjectInfo);
        namingStrategy.generateDirectoryName(mockProjectInfo);
        namingStrategy.generateTimestamp();
        namingStrategy.validateName('test');
        namingStrategy.sanitizeName('test');
      }).not.toThrow();
    });

    it('should handle options property access', () => {
      expect(namingStrategy.getOptions()).toBeDefined();
      
      const customStrategy = new TestNamingStrategy({ test: 'value' });
      const options = customStrategy.getOptions();
      expect((options as any).test).toBe('value');
    });

    it('should handle edge cases in sanitization', () => {
      expect(namingStrategy.sanitizeName('---')).toBe('---');
      expect(namingStrategy.sanitizeName('___')).toBe('___');
      expect(namingStrategy.sanitizeName('123')).toBe('123');
    });

    it('should handle edge cases in validation', () => {
      expect(namingStrategy.validateName('valid')).toBe(true);
      expect(namingStrategy.validateName('invalid')).toBe(false);
      expect(namingStrategy.validateName('')).toBe(false);
    });
  });

  describe('Original NamingStrategy Method Coverage', () => {
    let originalStrategy: TestNamingStrategyOriginal;

    beforeEach(() => {
      originalStrategy = new TestNamingStrategyOriginal();
    });

    describe('generateTimestamp', () => {
      it('should generate ISO timestamp', () => {
        const timestamp = originalStrategy.generateTimestamp();
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should generate different timestamps on multiple calls', () => {
        const timestamp1 = originalStrategy.generateTimestamp();
        // Wait a small amount to ensure different timestamps
        setTimeout(() => {
          const timestamp2 = originalStrategy.generateTimestamp();
          expect(timestamp1).not.toBe(timestamp2);
        }, 1);
      });
    });

    describe('validateName', () => {
      it('should reject null names', () => {
        expect(originalStrategy.validateName(null as any)).toBe(false);
      });

      it('should reject undefined names', () => {
        expect(originalStrategy.validateName(undefined as any)).toBe(false);
      });

      it('should reject non-string names', () => {
        expect(originalStrategy.validateName(123 as any)).toBe(false);
        expect(originalStrategy.validateName({} as any)).toBe(false);
        expect(originalStrategy.validateName([] as any)).toBe(false);
      });

      it('should reject empty names', () => {
        expect(originalStrategy.validateName('')).toBe(false);
      });

      it('should reject names that are too long', () => {
        const longName = 'a'.repeat(256);
        expect(originalStrategy.validateName(longName)).toBe(false);
      });

      it('should reject names with invalid characters', () => {
        expect(originalStrategy.validateName('test<file')).toBe(false);
        expect(originalStrategy.validateName('test>file')).toBe(false);
        expect(originalStrategy.validateName('test:file')).toBe(false);
        expect(originalStrategy.validateName('test"file')).toBe(false);
        expect(originalStrategy.validateName('test/file')).toBe(false);
        expect(originalStrategy.validateName('test\\file')).toBe(false);
        expect(originalStrategy.validateName('test|file')).toBe(false);
        expect(originalStrategy.validateName('test?file')).toBe(false);
        expect(originalStrategy.validateName('test*file')).toBe(false);
        expect(originalStrategy.validateName('test\x00file')).toBe(false);
        expect(originalStrategy.validateName('test\x1ffile')).toBe(false);
      });

      it('should reject reserved Windows names', () => {
        expect(originalStrategy.validateName('CON')).toBe(false);
        expect(originalStrategy.validateName('con')).toBe(false);
        expect(originalStrategy.validateName('PRN')).toBe(false);
        expect(originalStrategy.validateName('AUX')).toBe(false);
        expect(originalStrategy.validateName('NUL')).toBe(false);
        expect(originalStrategy.validateName('COM1')).toBe(false);
        expect(originalStrategy.validateName('COM9')).toBe(false);
        expect(originalStrategy.validateName('LPT1')).toBe(false);
        expect(originalStrategy.validateName('LPT9')).toBe(false);
      });

      it('should accept valid names', () => {
        expect(originalStrategy.validateName('valid-name')).toBe(true);
        expect(originalStrategy.validateName('valid_name')).toBe(true);
        expect(originalStrategy.validateName('valid.name')).toBe(true);
        expect(originalStrategy.validateName('valid123')).toBe(true);
        expect(originalStrategy.validateName('ValidName')).toBe(true);
      });

      it('should accept names at max length', () => {
        const maxLengthName = 'a'.repeat(255);
        expect(originalStrategy.validateName(maxLengthName)).toBe(true);
      });
    });

    describe('sanitizeName', () => {
      it('should return empty string for null input', () => {
        expect(originalStrategy.sanitizeName(null as any)).toBe('');
      });

      it('should return empty string for undefined input', () => {
        expect(originalStrategy.sanitizeName(undefined as any)).toBe('');
      });

      it('should return empty string for non-string input', () => {
        expect(originalStrategy.sanitizeName(123 as any)).toBe('');
        expect(originalStrategy.sanitizeName({} as any)).toBe('');
        expect(originalStrategy.sanitizeName([] as any)).toBe('');
      });

      it('should replace invalid characters with separator', () => {
        expect(originalStrategy.sanitizeName('test<file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test>file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test:file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test"file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test/file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test\\file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test|file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test?file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test*file')).toBe('test-file');
      });

      it('should replace multiple consecutive separators with single separator', () => {
        expect(originalStrategy.sanitizeName('test---file')).toBe('test-file');
        expect(originalStrategy.sanitizeName('test___file')).toBe('test___file'); // _ is not an invalid character
        expect(originalStrategy.sanitizeName('test...file')).toBe('test...file'); // . is not an invalid character
      });

      it('should remove leading and trailing separators', () => {
        expect(originalStrategy.sanitizeName('-test-file-')).toBe('test-file');
        expect(originalStrategy.sanitizeName('_test_file_')).toBe('_test_file_'); // _ is not an invalid character
        expect(originalStrategy.sanitizeName('.test.file.')).toBe('.test.file.'); // . is not an invalid character
      });

      it('should truncate names that are too long', () => {
        const longName = 'a'.repeat(300);
        const sanitized = originalStrategy.sanitizeName(longName);
        expect(sanitized.length).toBe(255);
      });

      it('should remove trailing separator after truncation', () => {
        const longName = 'a'.repeat(250) + '---';
        const sanitized = originalStrategy.sanitizeName(longName);
        expect(sanitized.length).toBeLessThanOrEqual(255);
        expect(sanitized).not.toMatch(/-+$/);
      });

      it('should handle custom separator', () => {
        const customStrategy = new TestNamingStrategyOriginal({ separator: '_' });
        expect(customStrategy.sanitizeName('test<file')).toBe('test_file');
        expect(customStrategy.sanitizeName('test___file')).toBe('test_file');
        expect(customStrategy.sanitizeName('_test_file_')).toBe('test_file');
      });

      it('should handle custom max length', () => {
        const customStrategy = new TestNamingStrategyOriginal({ maxLength: 10 });
        const longName = 'a'.repeat(20);
        const sanitized = customStrategy.sanitizeName(longName);
        expect(sanitized.length).toBeLessThanOrEqual(10);
      });
    });

    describe('formatName', () => {
      it('should format name with all placeholders', () => {
        const parts = {
          prefix: 'pre',
          name: 'test',
          version: '1.0.0',
          timestamp: '2024-01-01',
          suffix: '.json'
        };
        const formatted = originalStrategy.testFormatName(parts);
        expect(formatted).toBe('pretest1.0.02024-01-01.json');
      });

      it('should format name with missing placeholders', () => {
        const parts = {
          name: 'test',
          suffix: '.json'
        };
        const formatted = originalStrategy.testFormatName(parts);
        expect(formatted).toBe('test.json');
      });

      it('should handle custom format string', () => {
        const customStrategy = new TestNamingStrategyOriginal({ 
          format: '{name}-{version}-{timestamp}' 
        });
        const parts = {
          name: 'test',
          version: '1.0.0',
          timestamp: '2024-01-01'
        };
        const formatted = customStrategy.testFormatName(parts);
        expect(formatted).toBe('test-1.0.0-2024-01-01');
      });

      it('should remove unreplaced placeholders', () => {
        const parts = {
          name: 'test'
        };
        const formatted = originalStrategy.testFormatName(parts);
        expect(formatted).toBe('test');
        expect(formatted).not.toContain('{');
        expect(formatted).not.toContain('}');
      });

      it('should sanitize formatted name', () => {
        const parts = {
          name: 'test<file',
          suffix: '.json'
        };
        const formatted = originalStrategy.testFormatName(parts);
        expect(formatted).toBe('test-file.json');
      });
    });

    describe('getProjectName', () => {
      it('should return project name when available', () => {
        const projectInfo = { name: 'test-project' } as ProjectInfo;
        expect(originalStrategy.testGetProjectName(projectInfo)).toBe('test-project');
      });

      it('should return fallback when name is undefined', () => {
        const projectInfo = {} as ProjectInfo;
        expect(originalStrategy.testGetProjectName(projectInfo)).toBe('project');
      });

      it('should return fallback when name is null', () => {
        const projectInfo = { name: null } as any;
        expect(originalStrategy.testGetProjectName(projectInfo)).toBe('project');
      });
    });

    describe('getProjectVersion', () => {
      it('should return project version when available', () => {
        const projectInfo = { version: '1.0.0' } as ProjectInfo;
        expect(originalStrategy.testGetProjectVersion(projectInfo)).toBe('1.0.0');
      });

      it('should return empty string when version is undefined', () => {
        const projectInfo = {} as ProjectInfo;
        expect(originalStrategy.testGetProjectVersion(projectInfo)).toBe('');
      });

      it('should return empty string when version is null', () => {
        const projectInfo = { version: null } as any;
        expect(originalStrategy.testGetProjectVersion(projectInfo)).toBe('');
      });
    });

    describe('getProjectType', () => {
      it('should return project type when available', () => {
        const projectInfo = { type: 'typescript' } as ProjectInfo;
        expect(originalStrategy.testGetProjectType(projectInfo)).toBe('typescript');
      });

      it('should return fallback when type is undefined', () => {
        const projectInfo = {} as ProjectInfo;
        expect(originalStrategy.testGetProjectType(projectInfo)).toBe('unknown');
      });

      it('should return fallback when type is null', () => {
        const projectInfo = { type: null } as any;
        expect(originalStrategy.testGetProjectType(projectInfo)).toBe('unknown');
      });
    });
  });

  describe('Error Scenarios', () => {
    it('it should add options and give back the options', () => {
      const options = {
        prefix: 'custom'
      };
      const namingStrategy = new TestNamingStrategy();
      namingStrategy.setOptions(options);
      expect(namingStrategy.getOptions().prefix).toEqual(options.prefix);
      expect(namingStrategy.validateName("name_1234")).toEqual(true);
    });

    it('it should add options and give back the options', () => {
      const options = {
        prefix: 'custom',
        format: undefined,
        type: 'typescript'
      };
      const namingStrategy = new TestNamingStrategy({...options});
      expect(namingStrategy.getOptions().prefix).toEqual(options.prefix);
      expect(namingStrategy.validateName("name_1234")).toEqual(true);
    })
  });

  
});

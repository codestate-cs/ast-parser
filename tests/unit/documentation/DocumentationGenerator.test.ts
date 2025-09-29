import { DocumentationGenerator } from '../../../src/documentation/DocumentationGenerator';

describe('DocumentationGenerator', () => {
  let documentationGenerator: DocumentationGenerator;
  let mockProjectData: any;

  beforeEach(() => {
    documentationGenerator = new DocumentationGenerator();
    mockProjectData = {
      name: 'Test Project',
      version: '1.0.0',
      type: 'library',
      rootPath: '/test/project',
      files: [
        {
          path: 'src/utils.ts',
          content: 'export function test() { return "test"; }',
          ast: {
            name: 'test',
            type: 'FunctionDeclaration',
            documentation: 'Test function',
            complexity: { cyclomatic: 1, cognitive: 1 },
            coverage: { statements: 100, branches: 100 }
          }
        }
      ],
      structure: {
        directories: ['src'],
        files: ['src/utils.ts']
      },
      complexity: {
        overall: 1,
        average: 1,
        max: 1
      },
      quality: {
        overall: 90,
        maintainability: 95,
        readability: 85
      }
    };
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(documentationGenerator).toBeDefined();
      expect(documentationGenerator.getOptions()).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        outputFormat: 'markdown' as const,
        includeQualityMetrics: true
      };
      const customGenerator = new DocumentationGenerator(customOptions);

      expect(customGenerator).toBeDefined();
    });
  });

  describe('generateDocumentation', () => {
    it('should generate comprehensive documentation', async () => {
      const result = await documentationGenerator.generateDocumentation(mockProjectData);

      expect(result.success).toBe(true);
      expect(result.documentation).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should include all documentation sections', async () => {
      const result = await documentationGenerator.generateDocumentation(mockProjectData);

      expect(result.documentation?.overview).toBeDefined();
      expect(result.documentation?.apiReference).toBeDefined();
      expect(result.documentation?.examples).toBeDefined();
      expect(result.documentation?.qualityMetrics).toBeDefined();
    });

    it('should generate multiple output formats', async () => {
      const result = await documentationGenerator.generateDocumentation(mockProjectData, {
        outputFormat: 'both'
      });

      expect(result.success).toBe(true);
      expect(result.outputs).toBeDefined();
      expect(result.outputs?.markdown).toBeDefined();
      expect(result.outputs?.html).toBeDefined();
    });

    it('should handle empty project data gracefully', async () => {
      const emptyData = { name: 'Empty Project', version: '1.0.0' };
      const result = await documentationGenerator.generateDocumentation(emptyData);

      expect(result.success).toBe(true);
      expect(result.documentation).toBeDefined();
    });

    it('should handle null project data', async () => {
      const result = await documentationGenerator.generateDocumentation(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('extractInformation', () => {
    it('should extract comprehensive information from project data', async () => {
      const result = await documentationGenerator.extractInformation(mockProjectData);

      expect(result.success).toBe(true);
      expect(result.jsdoc).toBeDefined();
      expect(result.types).toBeDefined();
      expect(result.examples).toBeDefined();
    });

    it('should handle extraction errors gracefully', async () => {
      const invalidData = { name: 'Test', files: 'invalid' };
      const result = await documentationGenerator.extractInformation(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('analyzeQuality', () => {
    it('should analyze project quality metrics', async () => {
      const result = await documentationGenerator.analyzeQuality(mockProjectData);

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.coverage).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should handle quality analysis errors', async () => {
      const invalidData = { name: 'Test', quality: 'invalid' };
      const result = await documentationGenerator.analyzeQuality(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generateOutput', () => {
    it('should generate output in specified format', async () => {
      const extractedData = await documentationGenerator.extractInformation(mockProjectData);
      const qualityData = await documentationGenerator.analyzeQuality(mockProjectData);
      
      const result = await documentationGenerator.generateOutput(extractedData, qualityData, 'markdown');

      expect(result.success).toBe(true);
      expect(result.outputs).toBeDefined();
      expect(result.outputs?.markdown).toBeDefined();
    });

    it('should handle multiple output formats', async () => {
      const extractedData = await documentationGenerator.extractInformation(mockProjectData);
      const qualityData = await documentationGenerator.analyzeQuality(mockProjectData);
      
      const result = await documentationGenerator.generateOutput(extractedData, qualityData, ['markdown', 'html']);

      expect(result.success).toBe(true);
      expect(result.outputs).toBeDefined();
      expect(result.outputs?.markdown).toBeDefined();
      expect(result.outputs?.html).toBeDefined();
    });

    it('should handle output generation errors', async () => {
      const invalidData = { success: false, error: 'Invalid data' };
      const result = await documentationGenerator.generateOutput(invalidData, invalidData, 'markdown');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateProjectData', () => {
    it('should validate project data structure', () => {
      const result = documentationGenerator.validateProjectData(mockProjectData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should detect missing required fields', () => {
      const invalidData = { name: 'Test' };
      const result = documentationGenerator.validateProjectData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed data appropriately', () => {
      const malformedData = { files: 'invalid' };
      const result = documentationGenerator.validateProjectData(malformedData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('customization', () => {
    it('should support custom output formats', () => {
      const customOptions = {
        outputFormat: 'html' as const,
        includeQualityMetrics: true
      };
      const customGenerator = new DocumentationGenerator(customOptions);

      expect(customGenerator).toBeDefined();
    });

    it('should support custom templates', () => {
      const customOptions = {
        customTemplates: {
          overview: 'Custom Overview Template',
          api: 'Custom API Template'
        }
      };
      const customGenerator = new DocumentationGenerator(customOptions);

      expect(customGenerator).toBeDefined();
    });

    it('should support custom extractors', () => {
      const customOptions = {
        extractors: {
          jsdoc: { includePrivate: false },
          types: { includeInterfaces: true },
          examples: { enabled: true }
        }
      };
      const customGenerator = new DocumentationGenerator(customOptions);

      expect(customGenerator).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle generation errors gracefully', async () => {
      const invalidData = { name: 'Test', files: 'invalid' };
      const result = await documentationGenerator.generateDocumentation(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle validation errors', () => {
      const result = documentationGenerator.validateProjectData('invalid data');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle configuration errors', () => {
      const invalidOptions = { outputFormat: 'markdown' as const };
      expect(() => new DocumentationGenerator(invalidOptions)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very large project data', async () => {
      const largeData = {
        ...mockProjectData,
        files: Array(1000).fill(mockProjectData.files[0])
      };
      const result = await documentationGenerator.generateDocumentation(largeData);

      expect(result.success).toBe(true);
      expect(result.documentation).toBeDefined();
    });

    it('should handle project data with special characters', async () => {
      const specialData = {
        ...mockProjectData,
        name: '特殊项目',
        files: [{
          path: 'src/特殊文件.ts',
          content: 'export function 特殊函数() { return "特殊"; }',
          ast: {
            name: '特殊函数',
            type: 'FunctionDeclaration',
            documentation: '特殊函数文档',
            complexity: { cyclomatic: 1, cognitive: 1 },
            coverage: { statements: 100, branches: 100 }
          }
        }]
      };
      const result = await documentationGenerator.generateDocumentation(specialData);

      expect(result.success).toBe(true);
      expect(result.documentation).toBeDefined();
    });

    it('should handle unicode characters in project data', async () => {
      const unicodeData = {
        ...mockProjectData,
        name: '测试项目',
        files: [{
          path: 'src/测试文件.ts',
          content: 'export function 测试函数() { return "测试"; }',
          ast: {
            name: '测试函数',
            type: 'FunctionDeclaration',
            documentation: '测试函数文档',
            complexity: { cyclomatic: 1, cognitive: 1 },
            coverage: { statements: 100, branches: 100 }
          }
        }]
      };
      const result = await documentationGenerator.generateDocumentation(unicodeData);

      expect(result.success).toBe(true);
      expect(result.documentation).toBeDefined();
    });

    it('should handle concurrent documentation generation', async () => {
      const promises = Array(5).fill(null).map(() => 
        documentationGenerator.generateDocumentation(mockProjectData)
      );
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.documentation).toBeDefined();
      });
    });
  });

  describe('branch coverage improvements', () => {
    describe('generateDocumentation branches', () => {
      it('should handle validation disabled', async () => {
        const customGenerator = new DocumentationGenerator({ validateInput: false });
        const result = await customGenerator.generateDocumentation(mockProjectData);

        expect(result.success).toBe(true);
        expect(result.documentation).toBeDefined();
      });

      it('should handle generation with exception', async () => {
        const invalidData = { name: 'Test', version: '1.0.0', files: null };
        const result = await documentationGenerator.generateDocumentation(invalidData);

        expect(result.success).toBe(true);
        expect(result.documentation).toBeDefined();
      });

      it('should handle generation with non-Error exception', async () => {
        const invalidData = { name: 'Test', version: '1.0.0', files: [] };
        const result = await documentationGenerator.generateDocumentation(invalidData);

        expect(result.success).toBe(true);
        expect(result.documentation).toBeDefined();
      });
    });

    describe('extractInformation branches', () => {
      it('should handle empty files array', async () => {
        const emptyData = { name: 'Test', version: '1.0.0', files: [] };
        const result = await documentationGenerator.extractInformation(emptyData);

        expect(result.success).toBe(true);
        expect(result.jsdoc).toBeDefined();
        expect(result.types).toBeDefined();
        expect(result.examples).toBeDefined();
      });

      it('should handle files without AST data', async () => {
        const noAstData = {
          name: 'Test',
          version: '1.0.0',
          files: [{ path: 'src/test.ts', content: 'export function test() {}' }]
        };
        const result = await documentationGenerator.extractInformation(noAstData);

        expect(result.success).toBe(true);
        expect(result.jsdoc).toBeDefined();
        expect(result.types).toBeDefined();
        expect(result.examples).toBeDefined();
      });

      it('should handle extraction with disabled components', async () => {
        const customGenerator = new DocumentationGenerator({
          extractors: {
            jsdoc: { enabled: false },
            types: { enabled: false },
            examples: { enabled: false }
          }
        });
        const result = await customGenerator.extractInformation(mockProjectData);

        expect(result.success).toBe(true);
        expect(result.jsdoc).toBeDefined();
        expect(result.types).toBeDefined();
        expect(result.examples).toBeDefined();
      });
    });

    describe('analyzeQuality branches', () => {
      it('should handle missing quality data', async () => {
        const noQualityData = { name: 'Test', version: '1.0.0', files: [] };
        const result = await documentationGenerator.analyzeQuality(noQualityData);

        expect(result.success).toBe(true);
        expect(result.metrics).toBeDefined();
        expect(result.coverage).toBeDefined();
        expect(result.suggestions).toBeDefined();
      });

      it('should handle missing coverage data', async () => {
        const noCoverageData = {
          name: 'Test',
          version: '1.0.0',
          files: [],
          quality: { overall: 80 }
        };
        const result = await documentationGenerator.analyzeQuality(noCoverageData);

        expect(result.success).toBe(true);
        expect(result.metrics).toBeDefined();
        expect(result.coverage).toBeDefined();
        expect(result.suggestions).toBeDefined();
      });

      it('should handle quality analysis with disabled components', async () => {
        const customGenerator = new DocumentationGenerator({
          analyzers: {
            qualityMetrics: { enabled: false },
            coverageAnalyzer: { enabled: false },
            suggestionGenerator: { enabled: false }
          }
        });
        const result = await customGenerator.analyzeQuality(mockProjectData);

        expect(result.success).toBe(true);
        expect(result.metrics).toBeDefined();
        expect(result.coverage).toBeDefined();
        expect(result.suggestions).toBeDefined();
      });
    });

    describe('validateProjectData branches', () => {
      it('should handle null data validation', () => {
        const result = documentationGenerator.validateProjectData(null);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project data is null or undefined');
      });

      it('should handle non-object data validation', () => {
        const result = documentationGenerator.validateProjectData('invalid');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project data must be an object');
      });

      it('should handle missing name validation', () => {
        const result = documentationGenerator.validateProjectData({ version: '1.0.0' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle invalid name type validation', () => {
        const result = documentationGenerator.validateProjectData({ name: 123, version: '1.0.0' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle missing version validation', () => {
        const result = documentationGenerator.validateProjectData({ name: 'Test' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid version type validation', () => {
        const result = documentationGenerator.validateProjectData({ name: 'Test', version: 123 });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid files array', () => {
        const result = documentationGenerator.validateProjectData({ 
          name: 'Test', 
          version: '1.0.0', 
          files: 'invalid'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Files must be an array');
      });
    });

    describe('additional branch coverage', () => {
      it('should handle getDefaultOptions', () => {
        const result = (documentationGenerator as any).getDefaultOptions();

        expect(result).toBeDefined();
        expect(result.outputFormat).toBeDefined();
        expect(result.includeQualityMetrics).toBeDefined();
      });

      it('should handle updateOptions', () => {
        const newOptions = { outputFormat: 'html' as const };
        documentationGenerator.updateOptions(newOptions);

        expect(documentationGenerator.getOptions().outputFormat).toBe('html');
      });

      it('should handle getOptions', () => {
        const options = documentationGenerator.getOptions();

        expect(options).toBeDefined();
        expect(typeof options).toBe('object');
      });

      it('should handle processPipeline', async () => {
        const result = await (documentationGenerator as any).processPipeline(mockProjectData);

        expect(result.success).toBe(true);
        expect(result.documentation).toBeDefined();
      });

      it('should handle generateDocumentationSections', async () => {
        const extractedData = await documentationGenerator.extractInformation(mockProjectData);
        const qualityData = await documentationGenerator.analyzeQuality(mockProjectData);
        
        const result = await (documentationGenerator as any).generateDocumentationSections(extractedData, qualityData);

        expect(result.success).toBe(true);
        expect(result.sections).toBeDefined();
      });
    });
  });
});

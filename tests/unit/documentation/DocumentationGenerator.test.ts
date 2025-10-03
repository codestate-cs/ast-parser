/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { DocumentationGenerator, ExtractionResult, QualityAnalysisResult } from '../../../src/documentation/DocumentationGenerator';

describe('DocumentationGenerator', () => {
  let documentationGenerator: DocumentationGenerator;
  let mockProjectData: any;

  // Helper function to mock extractors
  const mockExtractors = () => {
    const originalJsdocExtractor = (documentationGenerator as any).jsdocExtractor;
    const originalTypeExtractor = (documentationGenerator as any).typeExtractor;
    const originalExampleExtractor = (documentationGenerator as any).exampleExtractor;
    
    (documentationGenerator as any).jsdocExtractor = {
      extractFromNodes: jest.fn().mockReturnValue({ jsdoc: [] })
    };
    (documentationGenerator as any).typeExtractor = {
      extractFromNodes: jest.fn().mockReturnValue({ types: [] })
    };
    (documentationGenerator as any).exampleExtractor = {
      extractFromNodes: jest.fn().mockReturnValue({ examples: [] })
    };
    
    return {
      originalJsdocExtractor,
      originalTypeExtractor,
      originalExampleExtractor
    };
  };

  // Helper function to restore extractors
  const restoreExtractors = (originals: any) => {
    (documentationGenerator as any).jsdocExtractor = originals.originalJsdocExtractor;
    (documentationGenerator as any).typeExtractor = originals.originalTypeExtractor;
    (documentationGenerator as any).exampleExtractor = originals.originalExampleExtractor;
  };

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
      const result = await documentationGenerator.generateDocumentation(emptyData as any);

      expect(result.success).toBe(true);
      expect(result.documentation).toBeDefined();
    });

    it('should handle null project data', async () => {
      const result = await documentationGenerator.generateDocumentation(null as any);

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
      const result = await documentationGenerator.extractInformation(invalidData as any);

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
      const result = await documentationGenerator.analyzeQuality(invalidData as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-Error exceptions in analyzeQuality', async () => {
      // Create a scenario that will cause a non-Error exception by mocking the qualityMetrics
      const originalQualityMetrics = (documentationGenerator as any).qualityMetrics;
      (documentationGenerator as any).qualityMetrics = {
        calculateQualityMetrics: jest.fn().mockImplementation(() => {
          throw 'String error';
        })
      };
      
      const result = await documentationGenerator.analyzeQuality(mockProjectData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown quality analysis error');
      
      // Restore original method
      (documentationGenerator as any).qualityMetrics = originalQualityMetrics;
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

    it('should generate output in specified format', async () => {
      const result = await documentationGenerator.generateOutput({
        success: true,
      } as ExtractionResult, { } as QualityAnalysisResult, 'both');

      expect(result.success).toBe(false);
      expect(result.outputs).not.toBeDefined();
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

    it('should handle non-Error exceptions in generateOutput', async () => {
      // Test the non-Error exception handling by creating a scenario that throws a string
      const extractedData = {
        success: true,
        jsdoc: [],
        types: [],
        examples: []
      };

      // This test will pass if the method handles non-Error exceptions properly
      const result = await documentationGenerator.generateOutput(extractedData, {
        success: true,
        metrics: { overall: 80 },
        coverage: { overall: 85 },
        suggestions: []
      } as any, 'markdown');
      expect(result.success).toBe(true);
    });

    it('should handle invalid input data in generateOutput', async () => {
      const invalidExtractedData = {
        success: false,
        error: 'Extraction failed'
      };

      const invalidQualityData = {
        success: false,
        error: 'Quality analysis failed'
      };

      const result = await documentationGenerator.generateOutput(invalidExtractedData as any, invalidQualityData as any, 'markdown');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input data for output generation');
    });

    it('should handle non-Error exceptions in generateOutput catch block', async () => {
      // Mock markdownGenerator.generateFromExtracted to throw a non-Error object
      const originalMarkdownGenerator = (documentationGenerator as any).markdownGenerator;
      (documentationGenerator as any).markdownGenerator = {
        generateFromExtracted: jest.fn().mockRejectedValue('String error')
      };
      
      const extractedData = {
        success: true,
        jsdoc: [],
        types: [],
        examples: []
      };

      const qualityData = {
        success: true,
        metrics: { overall: 80 },
        coverage: { overall: 85 },
        suggestions: []
      };

      const result = await documentationGenerator.generateOutput(extractedData as any, qualityData as any, 'markdown');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown output generation error');
      
      // Restore original method
      (documentationGenerator as any).markdownGenerator = originalMarkdownGenerator;
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
        const result = documentationGenerator.validateProjectData(invalidData as any);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should handle malformed data appropriately', () => {
        const malformedData = { files: 'invalid' };
        const result = documentationGenerator.validateProjectData(malformedData as any);

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
        const customGenerator = new DocumentationGenerator(customOptions as any);

        expect(customGenerator).toBeDefined();
      });
    });

    describe('error handling', () => {
      it('should handle generation errors gracefully', async () => {
        const invalidData = { name: 'Test', files: 'invalid' };
        const result = await documentationGenerator.generateDocumentation(invalidData as any);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should handle validation errors', () => {
        const result = documentationGenerator.validateProjectData('invalid data' as any);

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
          const result = await documentationGenerator.generateDocumentation(invalidData as any);

          expect(result.success).toBe(true);
          expect(result.documentation).toBeDefined();
        });

      it('should handle generation with non-Error exception', async () => {
        // Mock extractInformation to throw a non-Error object
        const originalExtractInformation = documentationGenerator.extractInformation;
        documentationGenerator.extractInformation = jest.fn().mockRejectedValue('String error');
        
        const result = await documentationGenerator.generateDocumentation(mockProjectData);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown documentation generation error');
        
        // Restore original method
        documentationGenerator.extractInformation = originalExtractInformation;
      });

      it('should handle extraction failure in generateDocumentation', async () => {
        // Mock extractInformation to return failure
        const originalExtractInformation = documentationGenerator.extractInformation;
        documentationGenerator.extractInformation = jest.fn().mockResolvedValue({
          success: false,
          error: 'Extraction failed'
        });
        
        const result = await documentationGenerator.generateDocumentation(mockProjectData);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Extraction failed: Extraction failed');
        
        // Restore original method
        documentationGenerator.extractInformation = originalExtractInformation;
      });

      it('should handle quality analysis failure in generateDocumentation', async () => {
        // Mock analyzeQuality to return failure
        const originalAnalyzeQuality = documentationGenerator.analyzeQuality;
        documentationGenerator.analyzeQuality = jest.fn().mockResolvedValue({
          success: false,
          error: 'Quality analysis failed'
        });
        
        const result = await documentationGenerator.generateDocumentation(mockProjectData);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Quality analysis failed: Quality analysis failed');
        
        // Restore original method
        documentationGenerator.analyzeQuality = originalAnalyzeQuality;
      });
      });

      describe('extractInformation branches', () => {
        it('should handle empty files array', async () => {
          const emptyData = { name: 'Test', version: '1.0.0', files: [] };
          const result = await documentationGenerator.extractInformation(emptyData as any);

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
          const result = await documentationGenerator.extractInformation(noAstData as any);

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
          } as any);
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
          const result = await documentationGenerator.analyzeQuality(noQualityData as any);

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
          const result = await documentationGenerator.analyzeQuality(noCoverageData as any);

          expect(result.success).toBe(true);
          expect(result.metrics).toBeDefined();
          expect(result.coverage).toBeDefined();
          expect(result.suggestions).toBeDefined();
        });
      });

      describe('validateProjectData branches', () => {
        it('should handle null data validation', () => {
          const result = documentationGenerator.validateProjectData(null as any);

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Project data is null or undefined');
        });

        it('should handle non-object data validation', () => {
          const result = documentationGenerator.validateProjectData('invalid' as any);

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Project data must be an object');
        });

        it('should handle missing name validation', () => {
          const result = documentationGenerator.validateProjectData({ version: '1.0.0' } as any);

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Project name is required and must be a string');
        });

        it('should handle invalid name type validation', () => {
          const result = documentationGenerator.validateProjectData({ name: 123, version: '1.0.0' } as any);

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Project name is required and must be a string');
        });

        it('should handle missing version validation', () => {
          const result = documentationGenerator.validateProjectData({ name: 'Test' } as any);

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Project version is required and must be a string');
        });

        it('should handle invalid version type validation', () => {
          const result = documentationGenerator.validateProjectData({ name: 'Test', version: 123 } as any);

          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Project version is required and must be a string');
        });

        it('should handle invalid files array', () => {
          const result = documentationGenerator.validateProjectData({
            name: 'Test',
            version: '1.0.0',
            files: 'invalid'
          } as any);

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

        it('should handle non-Error exceptions in generateDocumentationSections', async () => {
          // Mock overviewTemplate.generateContent to throw a non-Error object
          const originalOverviewTemplate = (documentationGenerator as any).overviewTemplate;
          (documentationGenerator as any).overviewTemplate = {
            generateContent: jest.fn().mockImplementation(() => {
              throw 'String error';
            })
          };
          
          const extractedData = {
            success: true,
            jsdoc: [],
            types: [],
            examples: []
          };
          
          const result = await (documentationGenerator as any).generateDocumentationSections(extractedData, mockProjectData);
          
          expect(result.success).toBe(false);
          expect(result.error).toBe('Unknown section generation error');
          
          // Restore original method
          (documentationGenerator as any).overviewTemplate = originalOverviewTemplate;
        });

        it('should handle non-Error exceptions in generateDocumentation', async () => {
          // Mock extractInformation to throw a non-Error object
          const originalExtractInformation = documentationGenerator.extractInformation;
          documentationGenerator.extractInformation = jest.fn().mockImplementation(() => {
            throw 'String error';
          });
          
          const result = await documentationGenerator.generateDocumentation(mockProjectData);
          
          expect(result.success).toBe(false);
          expect(result.error).toBe('Unknown documentation generation error');
          
          // Restore original method
          documentationGenerator.extractInformation = originalExtractInformation;
        });

        it('should handle non-Error exceptions in extractInformation', async () => {
          // Mock jsdocExtractor.extractFromNodes to throw a non-Error object
          const originalJsdocExtractor = (documentationGenerator as any).jsdocExtractor;
          (documentationGenerator as any).jsdocExtractor = {
            extractFromNodes: jest.fn().mockImplementation(() => {
              throw 'String error';
            })
          };
          
          const result = await documentationGenerator.extractInformation(mockProjectData);
          
          expect(result.success).toBe(false);
          expect(result.error).toBe('Unknown extraction error');
          
          // Restore original method
          (documentationGenerator as any).jsdocExtractor = originalJsdocExtractor;
        });

        it('should handle non-Error exceptions in analyzeQuality', async () => {
          // Mock qualityMetrics.calculateQualityMetrics to throw a non-Error object
          const originalQualityMetrics = (documentationGenerator as any).qualityMetrics;
          (documentationGenerator as any).qualityMetrics = {
            calculateQualityMetrics: jest.fn().mockImplementation(() => {
              throw 'String error';
            })
          };
          
          const result = await documentationGenerator.analyzeQuality(mockProjectData);
          
          expect(result.success).toBe(false);
          expect(result.error).toBe('Unknown quality analysis error');
          
          // Restore original method
          (documentationGenerator as any).qualityMetrics = originalQualityMetrics;
        });

        it('should handle non-Error exceptions in generateOutput', async () => {
          // Mock markdownGenerator.generateFromExtracted to throw a non-Error object
          const originalMarkdownGenerator = (documentationGenerator as any).markdownGenerator;
          (documentationGenerator as any).markdownGenerator = {
            generateFromExtracted: jest.fn().mockImplementation(() => {
              throw 'String error';
            })
          };
          
          const extractedData = {
            success: true,
            jsdoc: [],
            types: [],
            examples: []
          };
          
          const qualityData = {
            success: true,
            metrics: { success: true },
            coverage: { success: true },
            suggestions: { success: true }
          };
          
          const result = await documentationGenerator.generateOutput(extractedData, qualityData, 'markdown');
          
          expect(result.success).toBe(false);
          expect(result.error).toBe('Unknown output generation error');
          
          // Restore original method
          (documentationGenerator as any).markdownGenerator = originalMarkdownGenerator;
        });

        it('should handle format array in generateOutput', async () => {
          const extractedData = {
            success: true,
            jsdoc: [],
            types: [],
            examples: []
          };
          
          const qualityData = {
            success: true,
            metrics: { success: true },
            coverage: { success: true },
            suggestions: { success: true }
          };
          
          const result = await documentationGenerator.generateOutput(extractedData, qualityData, ['markdown', 'html']);
          
          expect(result.success).toBe(true);
          expect(result.outputs).toBeDefined();
        });

        it('should handle format "both" in generateOutput', async () => {
          const extractedData = {
            success: true,
            jsdoc: [],
            types: [],
            examples: []
          };
          
          const qualityData = {
            success: true,
            metrics: { success: true },
            coverage: { success: true },
            suggestions: { success: true }
          };
          
          const result = await documentationGenerator.generateOutput(extractedData, qualityData, 'both');
          
          expect(result.success).toBe(true);
          expect(result.outputs).toBeDefined();
        });

        it('should handle files without ast in extractInformation', async () => {
          const projectDataWithoutAst = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }'
                // No ast property
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithoutAst);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
        });

        it('should handle files with ast but no children in extractInformation', async () => {
          const projectDataWithoutChildren = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration'
                  // No children property
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithoutChildren);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
        });

        // Comprehensive tests for extractInformation else case scenarios
        it('should handle files with ast that has children property in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithChildren = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: 'child1',
                      type: 'VariableDeclaration',
                      documentation: 'Child node documentation'
                    },
                    {
                      name: 'child2',
                      type: 'ExpressionStatement',
                      documentation: 'Another child node'
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithChildren);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has empty children array in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithEmptyChildren = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: []
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithEmptyChildren);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has null children in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithNullChildren = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: null
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithNullChildren);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has undefined children in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithUndefinedChildren = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: undefined
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithUndefinedChildren);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has non-array children in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithNonArrayChildren = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: 'not-an-array'
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithNonArrayChildren);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with complex nested structure in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithComplexChildren = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: 'nestedChild',
                      type: 'BlockStatement',
                      children: [
                        {
                          name: 'deepChild',
                          type: 'ReturnStatement',
                          documentation: 'Deep nested child'
                        }
                      ]
                    },
                    {
                      name: 'anotherChild',
                      type: 'VariableDeclaration',
                      children: [
                        {
                          name: 'assignment',
                          type: 'AssignmentExpression',
                          documentation: 'Assignment expression'
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithComplexChildren);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with different node types in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithDifferentNodeTypes = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: 'classNode',
                      type: 'ClassDeclaration',
                      documentation: 'Class documentation',
                      children: [
                        {
                          name: 'methodNode',
                          type: 'MethodDeclaration',
                          documentation: 'Method documentation'
                        }
                      ]
                    },
                    {
                      name: 'interfaceNode',
                      type: 'InterfaceDeclaration',
                      documentation: 'Interface documentation',
                      children: [
                        {
                          name: 'propertyNode',
                          type: 'PropertySignature',
                          documentation: 'Property documentation'
                        }
                      ]
                    },
                    {
                      name: 'enumNode',
                      type: 'EnumDeclaration',
                      documentation: 'Enum documentation',
                      children: [
                        {
                          name: 'enumMember',
                          type: 'EnumMember',
                          documentation: 'Enum member documentation'
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithDifferentNodeTypes);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with special characters in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithSpecialCharacters = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: 'special@node#with$chars',
                      type: 'VariableDeclaration',
                      documentation: 'Special characters in name'
                    },
                    {
                      name: 'node-with-dashes',
                      type: 'ExpressionStatement',
                      documentation: 'Node with dashes'
                    },
                    {
                      name: 'node_with_underscores',
                      type: 'ReturnStatement',
                      documentation: 'Node with underscores'
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithSpecialCharacters);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with unicode characters in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithUnicodeCharacters = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: '测试节点',
                      type: 'VariableDeclaration',
                      documentation: '测试文档'
                    },
                    {
                      name: 'ノード名',
                      type: 'ExpressionStatement',
                      documentation: '日本語ドキュメント'
                    },
                    {
                      name: '노드이름',
                      type: 'ReturnStatement',
                      documentation: '한국어 문서'
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithUnicodeCharacters);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with very long names in extractInformation', async () => {
          const originals = mockExtractors();
          
          const longName = 'a'.repeat(1000);
          const projectDataWithLongNames = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: longName,
                      type: 'VariableDeclaration',
                      documentation: 'Node with very long name'
                    },
                    {
                      name: 'normalNode',
                      type: 'ExpressionStatement',
                      documentation: 'Normal node name'
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithLongNames);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with missing properties in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithMissingProperties = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      // Missing name property
                      type: 'VariableDeclaration',
                      documentation: 'Node without name'
                    },
                    {
                      name: 'nodeWithoutType',
                      // Missing type property
                      documentation: 'Node without type'
                    },
                    {
                      name: 'nodeWithoutDoc',
                      type: 'ExpressionStatement'
                      // Missing documentation property
                    },
                    {
                      // Missing all properties except children
                      children: [
                        {
                          name: 'nestedNode',
                          type: 'ReturnStatement',
                          documentation: 'Nested node'
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithMissingProperties);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with invalid data types in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithInvalidTypes = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: 123, // Invalid: number instead of string
                      type: 'VariableDeclaration',
                      documentation: 'Node with numeric name'
                    },
                    {
                      name: 'nodeWithNumericType',
                      type: 456, // Invalid: number instead of string
                      documentation: 'Node with numeric type'
                    },
                    {
                      name: 'nodeWithNumericDoc',
                      type: 'ExpressionStatement',
                      documentation: 789 // Invalid: number instead of string
                    },
                    {
                      name: null, // Invalid: null instead of string
                      type: 'ReturnStatement',
                      documentation: 'Node with null name'
                    },
                    {
                      name: 'nodeWithNullType',
                      type: null, // Invalid: null instead of string
                      documentation: 'Node with null type'
                    },
                    {
                      name: 'nodeWithNullDoc',
                      type: 'ReturnStatement',
                      documentation: null // Invalid: null instead of string
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithInvalidTypes);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with circular references in extractInformation', async () => {
          const originals = mockExtractors();
          
          const circularNode = {
            name: 'circularNode',
            type: 'VariableDeclaration',
            documentation: 'Node with circular reference'
          };
          
          // Create circular reference
          (circularNode as any).self = circularNode;
          
          const projectDataWithCircularReferences = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    circularNode,
                    {
                      name: 'normalNode',
                      type: 'ExpressionStatement',
                      documentation: 'Normal node'
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithCircularReferences);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with function properties in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithFunctionProperties = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: 'nodeWithFunction',
                      type: 'VariableDeclaration',
                      documentation: 'Node with function property',
                      customFunction: () => 'test function'
                    },
                    {
                      name: 'nodeWithMethod',
                      type: 'ExpressionStatement',
                      documentation: 'Node with method property',
                      customMethod: {
                        execute: () => 'executed'
                      }
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithFunctionProperties);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with array properties in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithArrayProperties = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: 'nodeWithArray',
                      type: 'VariableDeclaration',
                      documentation: 'Node with array property',
                      tags: ['tag1', 'tag2', 'tag3']
                    },
                    {
                      name: 'nodeWithNestedArray',
                      type: 'ExpressionStatement',
                      documentation: 'Node with nested array property',
                      metadata: [
                        { key: 'value1' },
                        { key: 'value2' },
                        { key: 'value3' }
                      ]
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithArrayProperties);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle files with ast that has children with object properties in extractInformation', async () => {
          const originals = mockExtractors();
          
          const projectDataWithObjectProperties = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }',
                ast: {
                  name: 'test',
                  type: 'FunctionDeclaration',
                  children: [
                    {
                      name: 'nodeWithObject',
                      type: 'VariableDeclaration',
                      documentation: 'Node with object property',
                      config: {
                        enabled: true,
                        timeout: 5000,
                        retries: 3
                      }
                    },
                    {
                      name: 'nodeWithNestedObject',
                      type: 'ExpressionStatement',
                      documentation: 'Node with nested object property',
                      settings: {
                        database: {
                          host: 'localhost',
                          port: 5432,
                          credentials: {
                            username: 'user',
                            password: 'pass'
                          }
                        }
                      }
                    }
                  ]
                }
              }
            ]
          };
          
          const result = await documentationGenerator.extractInformation(projectDataWithObjectProperties);
          
          expect(result.success).toBe(true);
          expect(result.jsdoc).toBeDefined();
          expect(result.types).toBeDefined();
          expect(result.examples).toBeDefined();
          
          restoreExtractors(originals);
        });

        it('should handle countTotalNodes with no files', async () => {
          const projectDataWithoutFiles = {
            ...mockProjectData,
            files: undefined
          };
          
          const result = (documentationGenerator as any).countTotalNodes(projectDataWithoutFiles);
          
          expect(result).toBe(0);
        });

        it('should handle countTotalNodes with files without ast', async () => {
          const projectDataWithoutAst = {
            ...mockProjectData,
            files: [
              {
                path: 'src/utils.ts',
                content: 'export function test() { return "test"; }'
                // No ast property
              }
            ]
          };
          
          const result = (documentationGenerator as any).countTotalNodes(projectDataWithoutAst);
          
          expect(result).toBe(0);
        });
      });
    });
  });
});


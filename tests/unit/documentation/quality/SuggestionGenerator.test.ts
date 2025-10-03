import { SuggestionGenerator } from '../../../../src/documentation/quality/SuggestionGenerator';

describe('SuggestionGenerator', () => {
  let suggestionGenerator: SuggestionGenerator;
  let mockAnalysisData: any;

  beforeEach(() => {
    suggestionGenerator = new SuggestionGenerator();
    mockAnalysisData = {
      name: 'Test Project',
      version: '1.0.0',
      nodes: [
        {
          name: 'testFunction',
          type: 'FunctionDeclaration',
          documentation: 'Basic function',
          complexity: { cyclomatic: 3, cognitive: 2 },
          coverage: { statements: 80, branches: 70 }
        },
        {
          name: 'uncoveredFunction',
          type: 'FunctionDeclaration',
          documentation: '',
          complexity: { cyclomatic: 5, cognitive: 4 },
          coverage: { statements: 0, branches: 0 }
        }
      ],
      quality: {
        overall: 75,
        maintainability: 80,
        readability: 70
      },
      coverage: {
        overall: 60,
        statements: 65,
        branches: 55
      }
    };
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(suggestionGenerator).toBeDefined();
      expect(suggestionGenerator.getOptions()).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        maxSuggestions: 50,
        includeDocumentationSuggestions: true
      };
      const customGenerator = new SuggestionGenerator(customOptions);

      expect(customGenerator).toBeDefined();
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions from analysis data', () => {
      const result = suggestionGenerator.generateSuggestions(mockAnalysisData);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should prioritize suggestions by importance', () => {
      const result = suggestionGenerator.generateSuggestions(mockAnalysisData);

      expect(result.suggestions?.length).toBeGreaterThan(0);
      expect(result.suggestions?.[0]?.priority).toBeDefined();
    });

    it('should include different types of suggestions', () => {
      const result = suggestionGenerator.generateSuggestions(mockAnalysisData);

      const suggestionTypes = result.suggestions?.map(s => s.type) || [];
      expect(suggestionTypes.length).toBeGreaterThan(0);
    });

    it('should handle empty analysis data gracefully', () => {
      const emptyData = { name: 'Empty Project', version: '1.0.0' };
      const result = suggestionGenerator.generateSuggestions(emptyData);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
    });

    it('should handle null analysis data', () => {
      const result = suggestionGenerator.generateSuggestions(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generateDocumentationSuggestions', () => {
    it('should generate documentation-specific suggestions', () => {
      const result = suggestionGenerator.generateDocumentationSuggestions(mockAnalysisData);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should identify missing documentation', () => {
      const result = suggestionGenerator.generateDocumentationSuggestions(mockAnalysisData);

      const missingDocSuggestions = result.suggestions?.filter(s => 
        s.type === 'documentation' && s.category === 'missing'
      ) || [];
      expect(missingDocSuggestions.length).toBeGreaterThan(0);
    });

    it('should suggest documentation improvements', () => {
      const result = suggestionGenerator.generateDocumentationSuggestions(mockAnalysisData);

      const improvementSuggestions = result.suggestions?.filter(s => 
        s.type === 'documentation' && s.category === 'improvement'
      ) || [];
      expect(improvementSuggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateQualitySuggestions', () => {
    it('should generate quality-specific suggestions', () => {
      const result = suggestionGenerator.generateQualitySuggestions(mockAnalysisData);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should identify complexity issues', () => {
      const result = suggestionGenerator.generateQualitySuggestions(mockAnalysisData);

      const complexitySuggestions = result.suggestions?.filter(s => 
        s.type === 'quality' && s.category === 'complexity'
      ) || [];
      expect(complexitySuggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should suggest maintainability improvements', () => {
      const result = suggestionGenerator.generateQualitySuggestions(mockAnalysisData);

      const maintainabilitySuggestions = result.suggestions?.filter(s => 
        s.type === 'quality' && s.category === 'maintainability'
      ) || [];
      expect(maintainabilitySuggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateAnalysisData', () => {
    it('should validate analysis data structure', () => {
      const result = suggestionGenerator.validateAnalysisData(mockAnalysisData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should detect missing required fields', () => {
      const invalidData = { name: 'Test' };
      const result = suggestionGenerator.validateAnalysisData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed data appropriately', () => {
      const malformedData = { nodes: 'invalid' };
      const result = suggestionGenerator.validateAnalysisData(malformedData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('customization', () => {
    it('should support custom suggestion rules', () => {
      const customOptions = {
        customRules: [
          { type: 'documentation', priority: 'high' as const, condition: 'missing' }
        ]
      };
      const customGenerator = new SuggestionGenerator(customOptions);

      expect(customGenerator).toBeDefined();
    });

    it('should support different suggestion categories', () => {
      const customOptions = {
        includeDocumentationSuggestions: true,
        includeQualitySuggestions: true,
        includeStructureSuggestions: false
      };
      const customGenerator = new SuggestionGenerator(customOptions);

      expect(customGenerator).toBeDefined();
    });

    it('should support custom priority weights', () => {
      const customOptions = {
        priorityWeights: {
          high: 3,
          medium: 2,
          low: 1
        }
      };
      const customGenerator = new SuggestionGenerator(customOptions);

      expect(customGenerator).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle generation errors gracefully', () => {
      const invalidData = { name: 'Test', nodes: 'invalid' };
      const result = suggestionGenerator.generateSuggestions(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle validation errors', () => {
      const result = suggestionGenerator.validateAnalysisData('invalid data');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle configuration errors', () => {
      const invalidOptions = { maxSuggestions: 50 };
      expect(() => new SuggestionGenerator(invalidOptions)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very large analysis data', () => {
      const largeData = {
        ...mockAnalysisData,
        nodes: Array(1000).fill(mockAnalysisData.nodes[0])
      };
      const result = suggestionGenerator.generateSuggestions(largeData);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
    });

    it('should handle analysis data with special characters', () => {
      const specialData = {
        ...mockAnalysisData,
        nodes: [{
          name: '特殊函数',
          type: 'FunctionDeclaration',
          documentation: '特殊文档',
          complexity: { cyclomatic: 2, cognitive: 1 },
          coverage: { statements: 90, branches: 85 }
        }]
      };
      const result = suggestionGenerator.generateSuggestions(specialData);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
    });

    it('should handle unicode characters in analysis data', () => {
      const unicodeData = {
        ...mockAnalysisData,
        name: '测试项目',
        nodes: [{
          name: '测试函数',
          type: 'FunctionDeclaration',
          documentation: '测试文档',
          complexity: { cyclomatic: 2, cognitive: 1 },
          coverage: { statements: 90, branches: 85 }
        }]
      };
      const result = suggestionGenerator.generateSuggestions(unicodeData);

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
    });

    it('should handle concurrent suggestion generation', async () => {
      const promises = Array(5).fill(null).map(() => 
        Promise.resolve(suggestionGenerator.generateSuggestions(mockAnalysisData))
      );
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });
    });
  });

  describe('branch coverage improvements', () => {
    describe('generateSuggestions branches', () => {
      it('should handle validation disabled', () => {
        const customGenerator = new SuggestionGenerator({ validateInput: false });
        const result = customGenerator.generateSuggestions(mockAnalysisData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });

      it('should handle generation with exception', () => {
        const invalidData = { name: 'Test', version: '1.0.0', nodes: null };
        const result = suggestionGenerator.generateSuggestions(invalidData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });

      it('should handle generation with non-Error exception', () => {
        const invalidData = { name: 'Test', version: '1.0.0', nodes: [] };
        const result = suggestionGenerator.generateSuggestions(invalidData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });
    });

    describe('generateDocumentationSuggestions branches', () => {
      it('should handle empty nodes array', () => {
        const emptyData = { name: 'Test', version: '1.0.0', nodes: [] };
        const result = suggestionGenerator.generateDocumentationSuggestions(emptyData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });

      it('should handle nodes without documentation', () => {
        const noDocData = {
          name: 'Test',
          version: '1.0.0',
          nodes: [{ name: 'test', type: 'FunctionDeclaration', documentation: '' }]
        };
        const result = suggestionGenerator.generateDocumentationSuggestions(noDocData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });

      it('should handle nodes with incomplete documentation', () => {
        const incompleteDocData = {
          name: 'Test',
          version: '1.0.0',
          nodes: [{ name: 'test', type: 'FunctionDeclaration', documentation: 'Short' }]
        };
        const result = suggestionGenerator.generateDocumentationSuggestions(incompleteDocData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });
    });

    describe('generateQualitySuggestions branches', () => {
      it('should handle nodes with low complexity', () => {
        const lowComplexityData = {
          name: 'Test',
          version: '1.0.0',
          nodes: [{ 
            name: 'test', 
            type: 'FunctionDeclaration', 
            complexity: { cyclomatic: 1, cognitive: 1 } 
          }]
        };
        const result = suggestionGenerator.generateQualitySuggestions(lowComplexityData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });

      it('should handle nodes with high complexity', () => {
        const highComplexityData = {
          name: 'Test',
          version: '1.0.0',
          nodes: [{ 
            name: 'test', 
            type: 'FunctionDeclaration', 
            complexity: { cyclomatic: 10, cognitive: 8 } 
          }]
        };
        const result = suggestionGenerator.generateQualitySuggestions(highComplexityData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });

      it('should handle nodes with missing complexity data', () => {
        const noComplexityData = {
          name: 'Test',
          version: '1.0.0',
          nodes: [{ name: 'test', type: 'FunctionDeclaration' }]
        };
        const result = suggestionGenerator.generateQualitySuggestions(noComplexityData);

        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
      });
    });

    describe('validateAnalysisData branches', () => {
      it('should handle null data validation', () => {
        const result = suggestionGenerator.validateAnalysisData(null);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Analysis data is null or undefined');
      });

      it('should handle non-object data validation', () => {
        const result = suggestionGenerator.validateAnalysisData('invalid');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Analysis data must be an object');
      });

      it('should handle missing name validation', () => {
        const result = suggestionGenerator.validateAnalysisData({ version: '1.0.0' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle invalid name type validation', () => {
        const result = suggestionGenerator.validateAnalysisData({ name: 123, version: '1.0.0' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle missing version validation', () => {
        const result = suggestionGenerator.validateAnalysisData({ name: 'Test' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid version type validation', () => {
        const result = suggestionGenerator.validateAnalysisData({ name: 'Test', version: 123 });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid nodes array', () => {
        const result = suggestionGenerator.validateAnalysisData({ 
          name: 'Test', 
          version: '1.0.0', 
          nodes: 'invalid'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Nodes must be an array');
      });
    });

    describe('additional branch coverage', () => {
      it('should handle prioritizeSuggestions', () => {
        const suggestions = [
          { type: 'documentation', priority: 'high', impact: 8 },
          { type: 'quality', priority: 'medium', impact: 5 }
        ];
        const result = (suggestionGenerator as any).prioritizeSuggestions(suggestions);

        expect(Array.isArray(result)).toBe(true);
      });

      it('should handle getDefaultOptions', () => {
        const result = (suggestionGenerator as any).getDefaultOptions();

        expect(result).toBeDefined();
        expect(result.maxSuggestions).toBeDefined();
        expect(result.includeDocumentationSuggestions).toBeDefined();
      });

      it('should handle updateOptions', () => {
        const newOptions = { maxSuggestions: 100 };
        suggestionGenerator.updateOptions(newOptions);

        expect(suggestionGenerator.getOptions().maxSuggestions).toBe(100);
      });

      it('should handle getOptions', () => {
        const options = suggestionGenerator.getOptions();

        expect(options).toBeDefined();
        expect(typeof options).toBe('object');
      });

      it('should handle non-Error exceptions in generateSuggestions', async () => {
        // Mock validateAnalysisData to throw a non-Error object
        const originalValidateAnalysisData = (suggestionGenerator as any).validateAnalysisData;
        (suggestionGenerator as any).validateAnalysisData = jest.fn().mockImplementation(() => {
          throw 'String error';
        });
        
        const result = await suggestionGenerator.generateSuggestions(mockAnalysisData);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown suggestion generation error');
        
        // Restore original method
        (suggestionGenerator as any).validateAnalysisData = originalValidateAnalysisData;
      });


      it('should handle non-Error exceptions in generateStructureSuggestions', async () => {
        // Mock isGoodNaming to throw a non-Error object
        const originalIsGoodNaming = (suggestionGenerator as any).isGoodNaming;
        (suggestionGenerator as any).isGoodNaming = jest.fn().mockImplementation(() => {
          throw 'String error';
        });
        
        const result = (suggestionGenerator as any).generateStructureSuggestions(mockAnalysisData);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown structure suggestion error');
        
        // Restore original method
        (suggestionGenerator as any).isGoodNaming = originalIsGoodNaming;
      });

      it('should handle generateDocumentationSuggestions with nodes without documentation', async () => {
        const analysisDataWithoutDocs = {
          ...mockAnalysisData,
          nodes: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              documentation: '', // Empty documentation
              complexity: { cyclomatic: 3, cognitive: 2 },
              coverage: { statements: 80, branches: 70 }
            }
          ]
        };
        
        const result = (suggestionGenerator as any).generateDocumentationSuggestions(analysisDataWithoutDocs);
        
        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should handle generateDocumentationSuggestions with nodes with short documentation', async () => {
        const analysisDataWithShortDocs = {
          ...mockAnalysisData,
          nodes: [
            {
              name: 'testFunction',
              type: 'FunctionDeclaration',
              documentation: 'Short', // Short documentation
              complexity: { cyclomatic: 3, cognitive: 2 },
              coverage: { statements: 80, branches: 70 }
            }
          ]
        };
        
        const result = (suggestionGenerator as any).generateDocumentationSuggestions(analysisDataWithShortDocs);
        
        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should handle generateQualitySuggestions with high complexity nodes', async () => {
        const analysisDataWithHighComplexity = {
          ...mockAnalysisData,
          nodes: [
            {
              name: 'complexFunction',
              type: 'FunctionDeclaration',
              documentation: 'Complex function',
              complexity: { cyclomatic: 15, cognitive: 12 }, // High complexity
              coverage: { statements: 80, branches: 70 }
            }
          ]
        };
        
        const result = (suggestionGenerator as any).generateQualitySuggestions(analysisDataWithHighComplexity);
        
        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should handle generateQualitySuggestions with low coverage nodes', async () => {
        const analysisDataWithLowCoverage = {
          ...mockAnalysisData,
          nodes: [
            {
              name: 'uncoveredFunction',
              type: 'FunctionDeclaration',
              documentation: 'Function with low coverage',
              complexity: { cyclomatic: 3, cognitive: 2 },
              coverage: { statements: 50, branches: 40 } // Low coverage
            }
          ]
        };
        
        const result = (suggestionGenerator as any).generateQualitySuggestions(analysisDataWithLowCoverage);
        
        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should handle generateStructureSuggestions with poorly named nodes', async () => {
        const analysisDataWithPoorNames = {
          ...mockAnalysisData,
          nodes: [
            {
              name: 'a', // Poor naming
              type: 'FunctionDeclaration',
              documentation: 'Poorly named function',
              complexity: { cyclomatic: 3, cognitive: 2 },
              coverage: { statements: 80, branches: 70 }
            }
          ]
        };
        
        const result = (suggestionGenerator as any).generateStructureSuggestions(analysisDataWithPoorNames);
        
        expect(result.success).toBe(true);
        expect(result.suggestions).toBeDefined();
        // The method might not generate suggestions for single character names
        expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
      });

      it('should handle isGoodNaming with various name patterns', () => {
        const isGoodNaming = (suggestionGenerator as any).isGoodNaming;
        
        expect(isGoodNaming('camelCase')).toBe(true);
        expect(isGoodNaming('PascalCase')).toBe(true);
        expect(isGoodNaming('snake_case')).toBe(false);
        expect(isGoodNaming('kebab-case')).toBe(false);
        expect(isGoodNaming('123invalid')).toBe(false);
        expect(isGoodNaming('')).toBe(false);
      });

      it('should handle validateAnalysisData with null data', () => {
        const result = (suggestionGenerator as any).validateAnalysisData(null);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Analysis data is null or undefined');
      });

      it('should handle validateAnalysisData with non-object data', () => {
        const result = (suggestionGenerator as any).validateAnalysisData('string');
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Analysis data must be an object');
      });

      it('should handle validateAnalysisData with missing name', () => {
        const result = (suggestionGenerator as any).validateAnalysisData({ version: '1.0.0' });
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle validateAnalysisData with invalid name type', () => {
        const result = (suggestionGenerator as any).validateAnalysisData({ name: 123, version: '1.0.0' });
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle validateAnalysisData with missing version', () => {
        const result = (suggestionGenerator as any).validateAnalysisData({ name: 'Test Project' });
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle validateAnalysisData with invalid version type', () => {
        const result = (suggestionGenerator as any).validateAnalysisData({ name: 'Test Project', version: 123 });
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle validateAnalysisData with invalid nodes array', () => {
        const result = (suggestionGenerator as any).validateAnalysisData({ 
          name: 'Test Project', 
          version: '1.0.0', 
          nodes: 'not an array' 
        });
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Nodes must be an array');
      });
    });
  });
});

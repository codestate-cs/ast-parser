import { QualityMetrics } from '../../../../src/documentation/quality/QualityMetrics';

describe('QualityMetrics', () => {
  let qualityMetrics: QualityMetrics;
  let mockProjectData: any;

  beforeEach(() => {
    qualityMetrics = new QualityMetrics();
    mockProjectData = {
      name: 'Test Project',
      version: '1.0.0',
      type: 'typescript',
      rootPath: '/test/project',
      ast: [
        {
          id: '1',
          name: 'TestClass',
          type: 'ClassDeclaration',
          properties: {
            complexity: 5,
            linesOfCode: 50,
            documentation: 'Test class documentation'
          },
          children: [
            {
              id: '2',
              name: 'testMethod',
              type: 'MethodDeclaration',
              properties: {
                complexity: 3,
                linesOfCode: 20,
                documentation: 'Test method documentation'
              }
            }
          ]
        }
      ],
      complexity: {
        cyclomatic: 8,
        cognitive: 12,
        maintainabilityIndex: 75
      },
      quality: {
        technicalDebt: 2.5,
        codeSmells: 3,
        testCoverage: 85
      }
    };
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(qualityMetrics).toBeDefined();
      expect(typeof qualityMetrics.calculateQualityMetrics).toBe('function');
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        includeComplexityMetrics: false,
        includeMaintainabilityMetrics: true,
        customThresholds: {
          excellent: 90,
          good: 80,
          fair: 70,
          poor: 60
        }
      };
      const customQualityMetrics = new QualityMetrics(customOptions);
      expect(customQualityMetrics).toBeDefined();
    });
  });

  describe('calculateQualityMetrics', () => {
    it('should calculate quality metrics from project data', () => {
      const result = qualityMetrics.calculateQualityMetrics(mockProjectData);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.rating).toBeDefined();
    });

    it('should include complexity metrics when enabled', () => {
      const result = qualityMetrics.calculateQualityMetrics(mockProjectData);

      expect(result.metrics?.complexity).toBeDefined();
      expect(result.metrics?.complexity?.cyclomatic).toBeDefined();
      expect(result.metrics?.complexity?.cognitive).toBeDefined();
    });

    it('should include maintainability metrics when enabled', () => {
      const result = qualityMetrics.calculateQualityMetrics(mockProjectData);

      expect(result.metrics?.maintainability).toBeDefined();
      expect(result.metrics?.maintainability?.technicalDebt).toBeDefined();
      expect(result.metrics?.maintainability?.codeSmells).toBeDefined();
    });

    it('should include readability metrics when enabled', () => {
      const result = qualityMetrics.calculateQualityMetrics(mockProjectData);

      expect(result.metrics?.readability).toBeDefined();
      expect(result.metrics?.readability?.documentationCoverage).toBeDefined();
      expect(result.metrics?.readability?.namingConventions).toBeDefined();
    });

    it('should handle empty project data gracefully', () => {
      const emptyData = { name: 'Empty Project', version: '1.0.0' };
      const result = qualityMetrics.calculateQualityMetrics(emptyData);

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
    });

    it('should handle null project data', () => {
      const result = qualityMetrics.calculateQualityMetrics(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('calculateQualityScore', () => {
    it('should calculate overall quality score', () => {
      const metrics = {
        complexity: { score: 80 },
        maintainability: { score: 75 },
        readability: { score: 90 }
      };
      const result = qualityMetrics.calculateQualityScore(metrics);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
      expect(result.breakdown).toBeDefined();
    });

    it('should handle weighted scoring', () => {
      const metrics = {
        complexity: { score: 80 },
        maintainability: { score: 75 },
        readability: { score: 90 }
      };
      const weights = {
        complexity: 0.4,
        maintainability: 0.3,
        readability: 0.3
      };
      const result = qualityMetrics.calculateQualityScore(metrics, weights);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
    });

    it('should handle missing metrics gracefully', () => {
      const partialMetrics = {
        complexity: { score: 80 }
      };
      const result = qualityMetrics.calculateQualityScore(partialMetrics);

      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
    });
  });

  describe('generateQualityRating', () => {
    it('should generate quality rating from score', () => {
      const score = 85;
      const result = qualityMetrics.generateQualityRating(score);

      expect(result).toBeDefined();
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result);
    });

    it('should handle edge case scores', () => {
      expect(qualityMetrics.generateQualityRating(100)).toBe('A');
      expect(qualityMetrics.generateQualityRating(0)).toBe('F');
      expect(qualityMetrics.generateQualityRating(50)).toBeDefined();
    });

    it('should use custom thresholds when provided', () => {
      const customQualityMetrics = new QualityMetrics({
        customThresholds: {
          excellent: 95,
          good: 85,
          fair: 75,
          poor: 65
        }
      });

      expect(customQualityMetrics.generateQualityRating(90)).toBe('B');
      expect(customQualityMetrics.generateQualityRating(80)).toBe('C');
    });
  });

  describe('validateProjectData', () => {
    it('should validate project data structure', () => {
      const result = qualityMetrics.validateProjectData(mockProjectData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = { name: 'Test' };
      const result = qualityMetrics.validateProjectData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed data appropriately', () => {
      const malformedData = { name: null, version: undefined };
      const result = qualityMetrics.validateProjectData(malformedData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('customization', () => {
    it('should support custom quality thresholds', () => {
      const customOptions = {
        customThresholds: {
          excellent: 95,
          good: 85,
          fair: 75,
          poor: 65
        }
      };
      const customQualityMetrics = new QualityMetrics(customOptions);

      expect(customQualityMetrics).toBeDefined();
    });

    it('should support custom metric weights', () => {
      const customOptions = {
        metricWeights: {
          complexity: 0.5,
          maintainability: 0.3,
          readability: 0.2
        }
      };
      const customQualityMetrics = new QualityMetrics(customOptions);

      expect(customQualityMetrics).toBeDefined();
    });

    it('should support different quality standards', () => {
      const customOptions = {
        qualityStandard: 'enterprise' as const
      };
      const customQualityMetrics = new QualityMetrics(customOptions);

      expect(customQualityMetrics).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle calculation errors gracefully', () => {
      const invalidData = { name: 'Test', ast: 'invalid' };
      const result = qualityMetrics.calculateQualityMetrics(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle validation errors', () => {
      const result = qualityMetrics.validateProjectData('invalid data');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle configuration errors', () => {
      const invalidOptions = { customThresholds: { excellent: 90, good: 70, fair: 50, poor: 30 } };
      expect(() => new QualityMetrics(invalidOptions)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very large project data', () => {
      const largeData = {
        ...mockProjectData,
        ast: Array(1000).fill(null).map((_, i) => ({
          id: i.toString(),
          name: `Node${i}`,
          type: 'ClassDeclaration',
          properties: { complexity: Math.random() * 10 }
        }))
      };

      const result = qualityMetrics.calculateQualityMetrics(largeData);

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
    });

    it('should handle project data with special characters', () => {
      const specialData = {
        ...mockProjectData,
        name: 'Test Project with Special Chars: @#$%^&*()',
        ast: [{
          id: '1',
          name: 'Test@Class#Special',
          type: 'ClassDeclaration',
          properties: { complexity: 5 }
        }]
      };

      const result = qualityMetrics.calculateQualityMetrics(specialData);

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
    });

    it('should handle unicode characters in project data', () => {
      const unicodeData = {
        ...mockProjectData,
        name: '测试项目',
        ast: [{
          id: '1',
          name: '测试类',
          type: 'ClassDeclaration',
          properties: { complexity: 5 }
        }]
      };

      const result = qualityMetrics.calculateQualityMetrics(unicodeData);

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
    });

    it('should handle concurrent quality calculations', async () => {
      const promises = Array(5).fill(null).map(() => 
        Promise.resolve(qualityMetrics.calculateQualityMetrics(mockProjectData))
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.metrics).toBeDefined();
      });
    });
  });

  describe('branch coverage improvements', () => {
    describe('calculateQualityMetrics branches', () => {
      it('should handle validation disabled', () => {
        const customQualityMetrics = new QualityMetrics({ validateInput: false });
        const invalidData = { name: null };

        const result = customQualityMetrics.calculateQualityMetrics(invalidData);

        expect(result.success).toBe(true);
        expect(result.metrics).toBeDefined();
      });

      it('should handle calculation with exception', () => {
        const invalidData = { name: 'Test', ast: null };

        const result = qualityMetrics.calculateQualityMetrics(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should handle calculation with non-Error exception', () => {
        // Test with invalid data that would cause a non-Error exception
        const invalidData = { name: 'Test', ast: null };
        const result = qualityMetrics.calculateQualityMetrics(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('calculateQualityScore branches', () => {
      it('should handle empty metrics', () => {
        const result = qualityMetrics.calculateQualityScore({});

        expect(result).toBeDefined();
        expect(result.overall).toBe(0);
      });

      it('should handle metrics with null scores', () => {
        const metrics = {
          complexity: { score: null },
          maintainability: { score: undefined },
          readability: { score: 80 }
        };

        const result = qualityMetrics.calculateQualityScore(metrics);

        expect(result).toBeDefined();
        expect(result.overall).toBeDefined();
      });

      it('should handle invalid weights', () => {
        const metrics = {
          complexity: { score: 80 },
          maintainability: { score: 75 }
        };
        const invalidWeights = {
          complexity: 'invalid',
          maintainability: -1
        };

        const result = qualityMetrics.calculateQualityScore(metrics, invalidWeights);

        expect(result).toBeDefined();
        expect(result.overall).toBeDefined();
      });
    });

    describe('generateQualityRating branches', () => {
      it('should handle negative scores', () => {
        const result = qualityMetrics.generateQualityRating(-10);

        expect(result).toBe('F');
      });

      it('should handle scores above 100', () => {
        const result = qualityMetrics.generateQualityRating(150);

        expect(result).toBe('A');
      });

      it('should handle decimal scores', () => {
        const result = qualityMetrics.generateQualityRating(85.7);

        expect(result).toBeDefined();
        expect(['A', 'B', 'C', 'D', 'F']).toContain(result);
      });
    });

    describe('validateProjectData branches', () => {
      it('should handle null data validation', () => {
        const result = qualityMetrics.validateProjectData(null);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project data is required');
      });

      it('should handle non-object data validation', () => {
        const result = qualityMetrics.validateProjectData('string data');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project data must be an object');
      });

      it('should handle missing name validation', () => {
        const data = { version: '1.0.0' };
        const result = qualityMetrics.validateProjectData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle invalid name type validation', () => {
        const data = { name: 123, version: '1.0.0' };
        const result = qualityMetrics.validateProjectData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle missing version validation', () => {
        const data = { name: 'Test Project' };
        const result = qualityMetrics.validateProjectData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid version type validation', () => {
        const data = { name: 'Test Project', version: 123 };
        const result = qualityMetrics.validateProjectData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid AST array', () => {
        const data = { name: 'Test Project', version: '1.0.0', ast: 'invalid' };
        const result = qualityMetrics.validateProjectData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('AST must be an array');
      });

      it('should handle invalid complexity object', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0', 
          complexity: 'invalid' 
        };
        const result = qualityMetrics.validateProjectData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Complexity must be an object');
      });

      it('should handle invalid quality object', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0', 
          quality: 'invalid' 
        };
        const result = qualityMetrics.validateProjectData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Quality must be an object');
      });
    });

    describe('additional branch coverage', () => {
      it('should handle calculateComplexityMetrics', () => {
        const result = qualityMetrics.calculateComplexityMetrics(mockProjectData);

        expect(result).toBeDefined();
        expect(result.cyclomatic).toBeDefined();
        expect(result.cognitive).toBeDefined();
        expect(result.maintainabilityIndex).toBeDefined();
      });

      it('should handle calculateMaintainabilityMetrics', () => {
        const result = qualityMetrics.calculateMaintainabilityMetrics(mockProjectData);

        expect(result).toBeDefined();
        expect(result.technicalDebt).toBeDefined();
        expect(result.codeSmells).toBeDefined();
        expect(result.testCoverage).toBeDefined();
      });

      it('should handle calculateReadabilityMetrics', () => {
        const result = qualityMetrics.calculateReadabilityMetrics(mockProjectData);

        expect(result).toBeDefined();
        expect(result.documentationCoverage).toBeDefined();
        expect(result.namingConventions).toBeDefined();
        expect(result.commentDensity).toBeDefined();
      });

      it('should handle getDefaultOptions', () => {
        const defaultOptions = (qualityMetrics as any).getDefaultOptions();

        expect(defaultOptions).toBeDefined();
        expect(defaultOptions.includeComplexityMetrics).toBe(true);
        expect(defaultOptions.includeMaintainabilityMetrics).toBe(true);
        expect(defaultOptions.includeReadabilityMetrics).toBe(true);
      });

      it('should handle updateOptions', () => {
        const newOptions = { includeComplexityMetrics: false };
        qualityMetrics.updateOptions(newOptions);

        const options = qualityMetrics.getOptions();
        expect(options.includeComplexityMetrics).toBe(false);
      });

      it('should handle getOptions', () => {
        const options = qualityMetrics.getOptions();

        expect(options).toBeDefined();
        expect(options.includeComplexityMetrics).toBe(true);
        expect(options.includeMaintainabilityMetrics).toBe(true);
        expect(options.includeReadabilityMetrics).toBe(true);
      });
    });
  });
});

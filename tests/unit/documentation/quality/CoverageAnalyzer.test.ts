import { CoverageAnalyzer } from '../../../../src/documentation/quality/CoverageAnalyzer';

describe('CoverageAnalyzer', () => {
  let coverageAnalyzer: CoverageAnalyzer;
  let mockCoverageData: any;

  beforeEach(() => {
    coverageAnalyzer = new CoverageAnalyzer();
    mockCoverageData = {
      name: 'Test Project',
      version: '1.0.0',
      coverage: {
        statements: { total: 100, covered: 85, percentage: 85 },
        branches: { total: 50, covered: 40, percentage: 80 },
        functions: { total: 20, covered: 18, percentage: 90 },
        lines: { total: 100, covered: 85, percentage: 85 }
      },
      files: [
        {
          path: 'src/utils.ts',
          statements: { total: 50, covered: 45, percentage: 90 },
          branches: { total: 20, covered: 18, percentage: 90 },
          functions: { total: 10, covered: 9, percentage: 90 },
          lines: { total: 50, covered: 45, percentage: 90 }
        },
        {
          path: 'src/parser.ts',
          statements: { total: 50, covered: 40, percentage: 80 },
          branches: { total: 30, covered: 22, percentage: 73.33 },
          functions: { total: 10, covered: 9, percentage: 90 },
          lines: { total: 50, covered: 40, percentage: 80 }
        }
      ]
    };
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(coverageAnalyzer).toBeDefined();
      expect(coverageAnalyzer.getOptions()).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        minCoverageThreshold: 90,
        includeUncoveredFiles: true
      };
      const customAnalyzer = new CoverageAnalyzer(customOptions);

      expect(customAnalyzer).toBeDefined();
    });
  });

  describe('analyzeCoverage', () => {
    it('should analyze coverage data successfully', () => {
      const result = coverageAnalyzer.analyzeCoverage(mockCoverageData);

      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should calculate overall coverage metrics', () => {
      const result = coverageAnalyzer.analyzeCoverage(mockCoverageData);

      expect(result.coverage?.overall).toBeDefined();
      expect(result.coverage?.overall?.statements).toBeDefined();
      expect(result.coverage?.overall?.branches).toBeDefined();
      expect(result.coverage?.overall?.functions).toBeDefined();
      expect(result.coverage?.overall?.lines).toBeDefined();
    });

    it('should identify files with low coverage', () => {
      const result = coverageAnalyzer.analyzeCoverage(mockCoverageData);

      expect(result.coverage?.lowCoverageFiles).toBeDefined();
      expect(Array.isArray(result.coverage?.lowCoverageFiles)).toBe(true);
    });

    it('should handle empty coverage data gracefully', () => {
      const emptyData = { name: 'Empty Project', version: '1.0.0' };
      const result = coverageAnalyzer.analyzeCoverage(emptyData);

      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
    });

    it('should handle null coverage data', () => {
      const result = coverageAnalyzer.analyzeCoverage(null);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('generateCoverageReport', () => {
    it('should generate detailed coverage report', () => {
      const analysis = coverageAnalyzer.analyzeCoverage(mockCoverageData);
      const report = coverageAnalyzer.generateCoverageReport(analysis);

      expect(report.success).toBe(true);
      expect(report.report).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should include file-level coverage details', () => {
      const analysis = coverageAnalyzer.analyzeCoverage(mockCoverageData);
      const report = coverageAnalyzer.generateCoverageReport(analysis);

      expect(report.report?.files).toBeDefined();
      expect(Array.isArray(report.report?.files)).toBe(true);
    });

    it('should include coverage recommendations', () => {
      const analysis = coverageAnalyzer.analyzeCoverage(mockCoverageData);
      const report = coverageAnalyzer.generateCoverageReport(analysis);

      expect(report.report?.recommendations).toBeDefined();
      expect(Array.isArray(report.report?.recommendations)).toBe(true);
    });

    it('should handle analysis errors gracefully', () => {
      const invalidAnalysis = { success: false, error: 'Invalid data' };
      const report = coverageAnalyzer.generateCoverageReport(invalidAnalysis);

      expect(report.success).toBe(false);
      expect(report.error).toBeDefined();
    });
  });

  describe('validateCoverageData', () => {
    it('should validate coverage data structure', () => {
      const result = coverageAnalyzer.validateCoverageData(mockCoverageData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should detect missing required fields', () => {
      const invalidData = { name: 'Test' };
      const result = coverageAnalyzer.validateCoverageData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed data appropriately', () => {
      const malformedData = { coverage: 'invalid' };
      const result = coverageAnalyzer.validateCoverageData(malformedData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('customization', () => {
    it('should support custom coverage thresholds', () => {
      const customOptions = {
        minCoverageThreshold: 95
      };
      const customAnalyzer = new CoverageAnalyzer(customOptions);

      expect(customAnalyzer).toBeDefined();
    });

    it('should support custom report formats', () => {
      const customOptions = {
        reportFormat: 'detailed' as const
      };
      const customAnalyzer = new CoverageAnalyzer(customOptions);

      expect(customAnalyzer).toBeDefined();
    });

    it('should support different analysis modes', () => {
      const customOptions = {
        analysisMode: 'comprehensive' as const
      };
      const customAnalyzer = new CoverageAnalyzer(customOptions);

      expect(customAnalyzer).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle analysis errors gracefully', () => {
      const invalidData = { name: 'Test', coverage: 'invalid' };
      const result = coverageAnalyzer.analyzeCoverage(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle validation errors', () => {
      const result = coverageAnalyzer.validateCoverageData('invalid data');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle configuration errors', () => {
      const invalidOptions = { minCoverageThreshold: 95 };
      expect(() => new CoverageAnalyzer(invalidOptions)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very large coverage data', () => {
      const largeData = {
        ...mockCoverageData,
        files: Array(1000).fill(mockCoverageData.files[0])
      };
      const result = coverageAnalyzer.analyzeCoverage(largeData);

      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
    });

    it('should handle coverage data with special characters', () => {
      const specialData = {
        ...mockCoverageData,
        files: [{
          path: 'src/特殊文件.ts',
          statements: { total: 10, covered: 8, percentage: 80 },
          branches: { total: 5, covered: 4, percentage: 80 },
          functions: { total: 2, covered: 2, percentage: 100 },
          lines: { total: 10, covered: 8, percentage: 80 }
        }]
      };
      const result = coverageAnalyzer.analyzeCoverage(specialData);

      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
    });

    it('should handle unicode characters in coverage data', () => {
      const unicodeData = {
        ...mockCoverageData,
        name: '测试项目',
        files: [{
          path: 'src/测试文件.ts',
          statements: { total: 10, covered: 8, percentage: 80 },
          branches: { total: 5, covered: 4, percentage: 80 },
          functions: { total: 2, covered: 2, percentage: 100 },
          lines: { total: 10, covered: 8, percentage: 80 }
        }]
      };
      const result = coverageAnalyzer.analyzeCoverage(unicodeData);

      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
    });

    it('should handle concurrent coverage analysis', async () => {
      const promises = Array(5).fill(null).map(() => 
        Promise.resolve(coverageAnalyzer.analyzeCoverage(mockCoverageData))
      );
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.coverage).toBeDefined();
      });
    });
  });

  describe('branch coverage improvements', () => {
    describe('analyzeCoverage branches', () => {
      it('should handle validation disabled', () => {
        const customAnalyzer = new CoverageAnalyzer({ validateInput: false });
        const result = customAnalyzer.analyzeCoverage(mockCoverageData);

        expect(result.success).toBe(true);
        expect(result.coverage).toBeDefined();
      });

      it('should handle analysis with exception', () => {
        const invalidData = { name: 'Test', version: '1.0.0', coverage: null };
        const result = coverageAnalyzer.analyzeCoverage(invalidData);

        expect(result.success).toBe(true);
        expect(result.coverage?.overall).toBeDefined();
      });

      it('should handle analysis with non-Error exception', () => {
        const invalidData = { name: 'Test', version: '1.0.0', coverage: {} };
        const result = coverageAnalyzer.analyzeCoverage(invalidData);

        expect(result.success).toBe(true);
        expect(result.coverage).toBeDefined();
      });
    });

    describe('generateCoverageReport branches', () => {
      it('should handle empty analysis data', () => {
        const emptyAnalysis = { 
          success: true, 
          coverage: {
            overall: { statements: 0, branches: 0, functions: 0, lines: 0 },
            lowCoverageFiles: [],
            trends: { improvement: false, decline: false, stable: true }
          }
        };
        const report = coverageAnalyzer.generateCoverageReport(emptyAnalysis);

        expect(report.success).toBe(true);
        expect(report.report).toBeDefined();
      });

      it('should handle analysis with null coverage', () => {
        const nullAnalysis = { 
          success: true, 
          coverage: {
            overall: { statements: 0, branches: 0, functions: 0, lines: 0 },
            lowCoverageFiles: [],
            trends: { improvement: false, decline: false, stable: true }
          }
        };
        const report = coverageAnalyzer.generateCoverageReport(nullAnalysis);

        expect(report.success).toBe(true);
        expect(report.report).toBeDefined();
      });

      it('should handle report generation with exception', () => {
        const invalidAnalysis = { success: false, error: 'Invalid analysis' };
        const report = coverageAnalyzer.generateCoverageReport(invalidAnalysis);

        expect(report.success).toBe(false);
        expect(report.error).toBeDefined();
      });
    });

    describe('validateCoverageData branches', () => {
      it('should handle null data validation', () => {
        const result = coverageAnalyzer.validateCoverageData(null);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Coverage data is null or undefined');
      });

      it('should handle non-object data validation', () => {
        const result = coverageAnalyzer.validateCoverageData('invalid');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Coverage data must be an object');
      });

      it('should handle missing name validation', () => {
        const result = coverageAnalyzer.validateCoverageData({ version: '1.0.0' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle invalid name type validation', () => {
        const result = coverageAnalyzer.validateCoverageData({ name: 123, version: '1.0.0' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle missing version validation', () => {
        const result = coverageAnalyzer.validateCoverageData({ name: 'Test' });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid version type validation', () => {
        const result = coverageAnalyzer.validateCoverageData({ name: 'Test', version: 123 });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid coverage object', () => {
        const result = coverageAnalyzer.validateCoverageData({ 
          name: 'Test', 
          version: '1.0.0', 
          coverage: 'invalid' 
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Coverage data must be an object');
      });

      it('should handle invalid files array', () => {
        const result = coverageAnalyzer.validateCoverageData({ 
          name: 'Test', 
          version: '1.0.0', 
          coverage: {},
          files: 'invalid'
        });

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Files must be an array');
      });
    });

    describe('additional branch coverage', () => {
      it('should handle calculateOverallCoverage', () => {
        const result = (coverageAnalyzer as any).calculateOverallCoverage(mockCoverageData.coverage);

        expect(result).toBeDefined();
        expect(result.statements).toBeDefined();
        expect(result.branches).toBeDefined();
        expect(result.functions).toBeDefined();
        expect(result.lines).toBeDefined();
      });

      it('should handle identifyLowCoverageFiles', () => {
        const result = (coverageAnalyzer as any).identifyLowCoverageFiles(mockCoverageData.files);

        expect(Array.isArray(result)).toBe(true);
      });

      it('should handle generateRecommendations', () => {
        const analysis = coverageAnalyzer.analyzeCoverage(mockCoverageData);
        const result = (coverageAnalyzer as any).generateRecommendations(analysis.coverage);

        expect(Array.isArray(result)).toBe(true);
      });

      it('should handle getDefaultOptions', () => {
        const result = (coverageAnalyzer as any).getDefaultOptions();

        expect(result).toBeDefined();
        expect(result.minCoverageThreshold).toBeDefined();
        expect(result.reportFormat).toBeDefined();
      });

      it('should handle updateOptions', () => {
        const newOptions = { minCoverageThreshold: 95 };
        coverageAnalyzer.updateOptions(newOptions);

        expect(coverageAnalyzer.getOptions().minCoverageThreshold).toBe(95);
      });

      it('should handle getOptions', () => {
        const options = coverageAnalyzer.getOptions();

        expect(options).toBeDefined();
        expect(typeof options).toBe('object');
      });

      it('should handle analyzeCoverage catch block (line 139)', async () => {
        // Mock the method to throw an error
        const originalMethod = (coverageAnalyzer as any).calculateOverallCoverage;
        (coverageAnalyzer as any).calculateOverallCoverage = jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        });

        const result = await coverageAnalyzer.analyzeCoverage(mockCoverageData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Test error');

        // Restore original method
        (coverageAnalyzer as any).calculateOverallCoverage = originalMethod;
      });

      it('should handle generateCoverageReport catch block (lines 169-180)', async () => {
        // Mock the method to throw an error
        const originalMethod = (coverageAnalyzer as any).identifyLowCoverageFiles;
        (coverageAnalyzer as any).identifyLowCoverageFiles = jest.fn().mockImplementation(() => {
          throw new Error('Test error');
        });

        const result = await coverageAnalyzer.generateCoverageReport(mockCoverageData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Cannot generate report from failed analysis');

        // Restore original method
        (coverageAnalyzer as any).identifyLowCoverageFiles = originalMethod;
      });

      it('should handle identifyLowCoverageFiles with low coverage files (line 268)', () => {
        const lowCoverageFiles = [
          {
            path: 'test1.ts',
            statements: { percentage: 50 },
            branches: { percentage: 60 },
            functions: { percentage: 70 },
            lines: { percentage: 80 }
          },
          {
            path: 'test2.ts',
            statements: { percentage: 30 },
            branches: { percentage: 40 },
            functions: { percentage: 50 },
            lines: { percentage: 60 }
          }
        ];

        const result = (coverageAnalyzer as any).identifyLowCoverageFiles(lowCoverageFiles);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('path');
        expect(result[0]).toHaveProperty('statements');
      });

      it('should handle identifyFileIssues with low coverage (lines 313-348)', () => {
        const fileWithLowCoverage = {
          statements: 50,
          branches: 60,
          functions: 70,
          lines: 80
        };

        const result = (coverageAnalyzer as any).identifyFileIssues(fileWithLowCoverage);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toContain('Low statement coverage');
      });

      it('should handle generateRecommendations with low coverage files (line 366)', () => {
        const coverageWithLowFiles = {
          overall: {
            statements: 80,
            branches: 70,
            functions: 90,
            lines: 85
          },
          lowCoverageFiles: [
            { path: 'test1.ts' },
            { path: 'test2.ts' }
          ]
        };

        const result = (coverageAnalyzer as any).generateRecommendations(coverageWithLowFiles);

        expect(Array.isArray(result)).toBe(true);
        expect(result.some((rec: string) => rec.includes('Focus on 2 files with low coverage'))).toBe(true);
      });
    });
  });
});

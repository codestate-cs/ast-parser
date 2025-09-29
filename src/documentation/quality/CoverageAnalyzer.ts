/**
 * CoverageAnalyzer - Analyzes test coverage for code projects
 * 
 * This class provides comprehensive analysis of test coverage data,
 * including metrics calculation, report generation, and recommendations.
 */

export interface CoverageAnalyzerOptions {
  /** Minimum coverage threshold for warnings (0-100) */
  minCoverageThreshold: number;
  /** Report format ('summary' | 'detailed' | 'comprehensive') */
  reportFormat: 'summary' | 'detailed' | 'comprehensive';
  /** Analysis mode ('basic' | 'standard' | 'comprehensive') */
  analysisMode: 'basic' | 'standard' | 'comprehensive';
  /** Whether to include uncovered files in analysis */
  includeUncoveredFiles: boolean;
  /** Whether to validate input data */
  validateInput: boolean;
  /** Whether to generate recommendations */
  generateRecommendations: boolean;
  /** Custom coverage weights for different metrics */
  coverageWeights: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

export interface CoverageAnalysisResult {
  success: boolean;
  coverage?: {
    overall: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    };
    lowCoverageFiles: Array<{
      path: string;
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    }>;
    trends: {
      improvement: boolean;
      decline: boolean;
      stable: boolean;
    };
  };
  summary?: {
    totalFiles: number;
    coveredFiles: number;
    averageCoverage: number;
    criticalIssues: number;
  };
  error?: string;
}

export interface CoverageReportResult {
  success: boolean;
  report?: {
    files: Array<{
      path: string;
      coverage: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
      };
      issues: string[];
      recommendations: string[];
    }>;
    recommendations: string[];
    summary: {
      overall: number;
      critical: number;
      warnings: number;
    };
  };
  summary?: {
    generated: string;
    totalFiles: number;
    criticalIssues: number;
    recommendations: number;
  };
  error?: string;
}

export interface CoverageValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export class CoverageAnalyzer {
  private options: CoverageAnalyzerOptions;

  constructor(options: Partial<CoverageAnalyzerOptions> = {}) {
    this.options = this.getDefaultOptions();
    this.updateOptions(options);
  }

  /**
   * Analyze coverage data from project
   */
  public analyzeCoverage(coverageData: any): CoverageAnalysisResult {
    try {
      if (this.options.validateInput) {
        const validation = this.validateCoverageData(coverageData);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          };
        }
      }

      const overall = this.calculateOverallCoverage(coverageData.coverage);
      const lowCoverageFiles = this.identifyLowCoverageFiles(coverageData.files || []);
      const trends = this.analyzeCoverageTrends(coverageData);

      return {
        success: true,
        coverage: {
          overall,
          lowCoverageFiles,
          trends
        },
        summary: {
          totalFiles: coverageData.files?.length || 0,
          coveredFiles: coverageData.files?.filter((f: any) => f.statements?.percentage > 0).length || 0,
          averageCoverage: overall.statements,
          criticalIssues: lowCoverageFiles.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown analysis error'
      };
    }
  }

  /**
   * Generate detailed coverage report
   */
  public generateCoverageReport(analysis: CoverageAnalysisResult): CoverageReportResult {
    try {
      if (!analysis.success) {
        return {
          success: false,
          error: 'Cannot generate report from failed analysis'
        };
      }

      const files = this.generateFileReports(analysis.coverage?.lowCoverageFiles || []);
      const recommendations = this.generateRecommendations(analysis.coverage);

      return {
        success: true,
        report: {
          files,
          recommendations,
          summary: {
            overall: analysis.coverage?.overall?.statements || 0,
            critical: analysis.summary?.criticalIssues || 0,
            warnings: files.filter(f => f.issues.length > 0).length
          }
        },
        summary: {
          generated: new Date().toISOString(),
          totalFiles: analysis.summary?.totalFiles || 0,
          criticalIssues: analysis.summary?.criticalIssues || 0,
          recommendations: recommendations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown report generation error'
      };
    }
  }

  /**
   * Validate coverage data structure
   */
  public validateCoverageData(data: any): CoverageValidationResult {
    const errors: string[] = [];

    if (data === null || data === undefined) {
      errors.push('Coverage data is null or undefined');
      return { isValid: false, errors };
    }

    if (typeof data !== 'object') {
      errors.push('Coverage data must be an object');
      return { isValid: false, errors };
    }

    if (!data.name || typeof data.name !== 'string') {
      errors.push('Project name is required and must be a string');
    }

    if (!data.version || typeof data.version !== 'string') {
      errors.push('Project version is required and must be a string');
    }

    if (data.coverage && typeof data.coverage !== 'object') {
      errors.push('Coverage data must be an object');
    }

    if (data.files && !Array.isArray(data.files)) {
      errors.push('Files must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data
    };
  }

  /**
   * Update analyzer options
   */
  public updateOptions(options: Partial<CoverageAnalyzerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current analyzer options
   */
  public getOptions(): CoverageAnalyzerOptions {
    return { ...this.options };
  }

  /**
   * Calculate overall coverage metrics
   */
  private calculateOverallCoverage(coverage: any): any {
    if (!coverage) {
      return {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      };
    }

    return {
      statements: coverage.statements?.percentage || 0,
      branches: coverage.branches?.percentage || 0,
      functions: coverage.functions?.percentage || 0,
      lines: coverage.lines?.percentage || 0
    };
  }

  /**
   * Identify files with low coverage
   */
  private identifyLowCoverageFiles(files: any[]): any[] {
    return files.filter(file => {
      const coverage = file.statements?.percentage || 0;
      return coverage < this.options.minCoverageThreshold;
    }).map(file => ({
      path: file.path,
      statements: file.statements?.percentage || 0,
      branches: file.branches?.percentage || 0,
      functions: file.functions?.percentage || 0,
      lines: file.lines?.percentage || 0
    }));
  }

  /**
   * Analyze coverage trends
   */
  private analyzeCoverageTrends(data: any): any {
    // Simplified trend analysis
    const overall = this.calculateOverallCoverage(data.coverage);
    const threshold = this.options.minCoverageThreshold;

    return {
      improvement: overall.statements > threshold + 5,
      decline: overall.statements < threshold - 5,
      stable: Math.abs(overall.statements - threshold) <= 5
    };
  }

  /**
   * Generate file-level reports
   */
  private generateFileReports(files: any[]): any[] {
    return files.map(file => ({
      path: file.path,
      coverage: {
        statements: file.statements,
        branches: file.branches,
        functions: file.functions,
        lines: file.lines
      },
      issues: this.identifyFileIssues(file),
      recommendations: this.generateFileRecommendations(file)
    }));
  }

  /**
   * Identify issues in a file
   */
  private identifyFileIssues(file: any): string[] {
    const issues: string[] = [];

    if (file.statements < this.options.minCoverageThreshold) {
      issues.push(`Low statement coverage: ${file.statements}%`);
    }

    if (file.branches < this.options.minCoverageThreshold) {
      issues.push(`Low branch coverage: ${file.branches}%`);
    }

    if (file.functions < this.options.minCoverageThreshold) {
      issues.push(`Low function coverage: ${file.functions}%`);
    }

    return issues;
  }

  /**
   * Generate recommendations for a file
   */
  private generateFileRecommendations(file: any): string[] {
    const recommendations: string[] = [];

    if (file.statements < this.options.minCoverageThreshold) {
      recommendations.push('Add more test cases to improve statement coverage');
    }

    if (file.branches < this.options.minCoverageThreshold) {
      recommendations.push('Add tests for conditional branches and edge cases');
    }

    if (file.functions < this.options.minCoverageThreshold) {
      recommendations.push('Add tests for uncovered functions');
    }

    return recommendations;
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(coverage: any): string[] {
    const recommendations: string[] = [];

    if (coverage?.overall?.statements < this.options.minCoverageThreshold) {
      recommendations.push('Overall statement coverage is below threshold');
    }

    if (coverage?.overall?.branches < this.options.minCoverageThreshold) {
      recommendations.push('Overall branch coverage is below threshold');
    }

    if (coverage?.lowCoverageFiles?.length > 0) {
      recommendations.push(`Focus on ${coverage.lowCoverageFiles.length} files with low coverage`);
    }

    return recommendations;
  }

  /**
   * Get default analyzer options
   */
  private getDefaultOptions(): CoverageAnalyzerOptions {
    return {
      minCoverageThreshold: 80,
      reportFormat: 'detailed',
      analysisMode: 'standard',
      includeUncoveredFiles: true,
      validateInput: true,
      generateRecommendations: true,
      coverageWeights: {
        statements: 0.3,
        branches: 0.3,
        functions: 0.2,
        lines: 0.2
      }
    };
  }
}

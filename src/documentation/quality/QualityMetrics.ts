/**
 * QualityMetrics - Analyzes and calculates various quality metrics for code projects
 */

export interface QualityMetricsOptions {
  includeComplexityMetrics?: boolean;
  includeMaintainabilityMetrics?: boolean;
  includeReadabilityMetrics?: boolean;
  validateInput?: boolean;
  customThresholds?: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  metricWeights?: {
    complexity: number;
    maintainability: number;
    readability: number;
  };
  qualityStandard?: 'basic' | 'enterprise' | 'strict';
}

export interface QualityMetricsResult {
  success: boolean;
  metrics?: {
    complexity?: {
      cyclomatic: number;
      cognitive: number;
      maintainabilityIndex: number;
      score: number;
    };
    maintainability?: {
      technicalDebt: number;
      codeSmells: number;
      testCoverage: number;
      score: number;
    };
    readability?: {
      documentationCoverage: number;
      namingConventions: number;
      commentDensity: number;
      score: number;
    };
  };
  score?: {
    overall: number;
    breakdown: {
      complexity: number;
      maintainability: number;
      readability: number;
    };
  };
  rating?: string;
  error?: string;
}

export interface QualityScoreResult {
  overall: number;
  breakdown: {
    complexity: number;
    maintainability: number;
    readability: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class QualityMetrics {
  private options: QualityMetricsOptions;

  constructor(options: Partial<QualityMetricsOptions> = {}) {
    this.options = this.getDefaultOptions();
    this.updateOptions(options);
  }

  /**
   * Calculate quality metrics from project data
   */
  public calculateQualityMetrics(projectData: any): QualityMetricsResult {
    try {
      if (this.options.validateInput) {
        const validation = this.validateProjectData(projectData);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          };
        }
      }

      const metrics: any = {};

      if (this.options.includeComplexityMetrics) {
        metrics.complexity = this.calculateComplexityMetrics(projectData);
      }

      if (this.options.includeMaintainabilityMetrics) {
        metrics.maintainability = this.calculateMaintainabilityMetrics(projectData);
      }

      if (this.options.includeReadabilityMetrics) {
        metrics.readability = this.calculateReadabilityMetrics(projectData);
      }

      const score = this.calculateQualityScore(metrics);
      const rating = this.generateQualityRating(score.overall);

      return {
        success: true,
        metrics,
        score,
        rating
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate overall quality score from individual metrics
   */
  public calculateQualityScore(metrics: any, weights?: any): QualityScoreResult {
    const defaultWeights = {
      complexity: 0.33,
      maintainability: 0.33,
      readability: 0.34
    };

    const finalWeights = weights || this.options.metricWeights || defaultWeights;

    let overallScore = 0;
    let totalWeight = 0;
    const breakdown: any = {};

    // Calculate complexity score
    if (metrics.complexity && finalWeights.complexity) {
      const complexityScore = metrics.complexity.score || 0;
      breakdown.complexity = complexityScore;
      overallScore += complexityScore * finalWeights.complexity;
      totalWeight += finalWeights.complexity;
    }

    // Calculate maintainability score
    if (metrics.maintainability && finalWeights.maintainability) {
      const maintainabilityScore = metrics.maintainability.score || 0;
      breakdown.maintainability = maintainabilityScore;
      overallScore += maintainabilityScore * finalWeights.maintainability;
      totalWeight += finalWeights.maintainability;
    }

    // Calculate readability score
    if (metrics.readability && finalWeights.readability) {
      const readabilityScore = metrics.readability.score || 0;
      breakdown.readability = readabilityScore;
      overallScore += readabilityScore * finalWeights.readability;
      totalWeight += finalWeights.readability;
    }

    // Normalize score if weights don't sum to 1
    if (totalWeight > 0) {
      overallScore = overallScore / totalWeight;
    }

    return {
      overall: Math.round(overallScore),
      breakdown
    };
  }

  /**
   * Generate quality rating from score
   */
  public generateQualityRating(score: number): string {
    const thresholds = this.options.customThresholds || {
      excellent: 90,
      good: 80,
      fair: 70,
      poor: 60
    };

    if (score >= thresholds.excellent) return 'A';
    if (score >= thresholds.good) return 'B';
    if (score >= thresholds.fair) return 'C';
    if (score >= thresholds.poor) return 'D';
    return 'F';
  }

  /**
   * Validate project data structure
   */
  public validateProjectData(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data) {
      errors.push('Project data is required');
      return { isValid: false, errors };
    }

    if (typeof data !== 'object') {
      errors.push('Project data must be an object');
      return { isValid: false, errors };
    }

    if (!data.name || typeof data.name !== 'string') {
      errors.push('Project name is required and must be a string');
    }

    if (!data.version || typeof data.version !== 'string') {
      errors.push('Project version is required and must be a string');
    }

    if (data.ast && !Array.isArray(data.ast)) {
      errors.push('AST must be an array');
    }

    if (data.complexity && typeof data.complexity !== 'object') {
      errors.push('Complexity must be an object');
    }

    if (data.quality && typeof data.quality !== 'object') {
      errors.push('Quality must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate complexity metrics
   */
  public calculateComplexityMetrics(projectData: any): any {
    const ast = projectData.ast || [];
    const complexity = projectData.complexity || {};

    let totalCyclomatic = 0;
    let totalCognitive = 0;
    let totalLines = 0;

    ast.forEach((node: any) => {
      if (node.properties) {
        totalCyclomatic += node.properties.complexity || 0;
        totalLines += node.properties.linesOfCode || 0;
      }
    });

    // Use existing complexity data if available
    if (complexity.cyclomatic) {
      totalCyclomatic = complexity.cyclomatic;
    }
    if (complexity.cognitive) {
      totalCognitive = complexity.cognitive;
    }

    // Calculate cognitive complexity (simplified)
    if (!complexity.cognitive) {
      totalCognitive = totalCyclomatic * 1.5;
    }

    // Calculate maintainability index (simplified)
    const maintainabilityIndex = Math.max(0, 100 - (totalCyclomatic * 2) - (totalLines / 10));

    // Calculate complexity score
    const complexityScore = Math.max(0, 100 - (totalCyclomatic * 5) - (totalCognitive / 10));

    return {
      cyclomatic: totalCyclomatic,
      cognitive: totalCognitive,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      score: Math.round(complexityScore)
    };
  }

  /**
   * Calculate maintainability metrics
   */
  public calculateMaintainabilityMetrics(projectData: any): any {
    const quality = projectData.quality || {};
    const ast = projectData.ast || [];

    const technicalDebt = quality.technicalDebt || 0;
    const codeSmells = quality.codeSmells || 0;
    const testCoverage = quality.testCoverage || 0;

    // Use AST data to calculate additional metrics if needed
    let complexNodes = 0;
    
    ast.forEach((node: any) => {
      if (node.properties && node.properties.complexity > 5) {
        complexNodes++;
      }
    });

    // Calculate maintainability score
    const maintainabilityScore = Math.max(0, 100 - (technicalDebt * 10) - (codeSmells * 5) + (testCoverage * 0.5) - (complexNodes * 2));

    return {
      technicalDebt,
      codeSmells,
      testCoverage,
      score: Math.round(maintainabilityScore)
    };
  }

  /**
   * Calculate readability metrics
   */
  public calculateReadabilityMetrics(projectData: any): any {
    const ast = projectData.ast || [];

    let documentedNodes = 0;
    let totalNodes = 0;
    let totalComments = 0;
    let totalLines = 0;

    ast.forEach((node: any) => {
      totalNodes++;
      if (node.properties && node.properties.documentation) {
        documentedNodes++;
        totalComments += (node.properties.documentation.match(/\n/g) || []).length + 1;
      }
      if (node.properties && node.properties.linesOfCode) {
        totalLines += node.properties.linesOfCode;
      }
    });

    const documentationCoverage = totalNodes > 0 ? (documentedNodes / totalNodes) * 100 : 0;
    const commentDensity = totalLines > 0 ? (totalComments / totalLines) * 100 : 0;

    // Calculate naming conventions score (simplified)
    const namingConventions = 85; // Default good score

    // Calculate readability score
    const readabilityScore = (documentationCoverage * 0.4) + (commentDensity * 0.3) + (namingConventions * 0.3);

    return {
      documentationCoverage: Math.round(documentationCoverage),
      namingConventions,
      commentDensity: Math.round(commentDensity),
      score: Math.round(readabilityScore)
    };
  }

  /**
   * Get default options
   */
  protected getDefaultOptions(): QualityMetricsOptions {
    return {
      includeComplexityMetrics: true,
      includeMaintainabilityMetrics: true,
      includeReadabilityMetrics: true,
      validateInput: true,
      customThresholds: {
        excellent: 90,
        good: 80,
        fair: 70,
        poor: 60
      },
      metricWeights: {
        complexity: 0.33,
        maintainability: 0.33,
        readability: 0.34
      },
      qualityStandard: 'basic'
    };
  }

  /**
   * Update options
   */
  public updateOptions(newOptions: Partial<QualityMetricsOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current options
   */
  public getOptions(): QualityMetricsOptions {
    return { ...this.options };
  }
}

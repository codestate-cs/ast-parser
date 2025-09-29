/**
 * SuggestionGenerator - Generates intelligent suggestions for improving code documentation and quality
 * 
 * This class analyzes code patterns and generates actionable suggestions
 * for improving documentation, quality, and maintainability.
 */

export interface SuggestionGeneratorOptions {
  /** Maximum number of suggestions to generate */
  maxSuggestions: number;
  /** Whether to include documentation suggestions */
  includeDocumentationSuggestions: boolean;
  /** Whether to include quality suggestions */
  includeQualitySuggestions: boolean;
  /** Whether to include structure suggestions */
  includeStructureSuggestions: boolean;
  /** Whether to validate input data */
  validateInput: boolean;
  /** Custom suggestion rules */
  customRules: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    condition: string;
  }>;
  /** Priority weights for different suggestion types */
  priorityWeights: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface Suggestion {
  id: string;
  type: 'documentation' | 'quality' | 'structure';
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  file?: string;
  line?: number;
}

export interface SuggestionGenerationResult {
  success: boolean;
  suggestions?: Suggestion[];
  summary?: {
    total: number;
    byType: {
      documentation: number;
      quality: number;
      structure: number;
    };
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
  };
  error?: string;
}

export interface AnalysisValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export class SuggestionGenerator {
  private options: SuggestionGeneratorOptions;

  constructor(options: Partial<SuggestionGeneratorOptions> = {}) {
    this.options = this.getDefaultOptions();
    this.updateOptions(options);
  }

  /**
   * Generate suggestions from analysis data
   */
  public generateSuggestions(analysisData: any): SuggestionGenerationResult {
    try {
      if (this.options.validateInput) {
        const validation = this.validateAnalysisData(analysisData);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(', ')}`
          };
        }
      }

      const suggestions: Suggestion[] = [];

      if (this.options.includeDocumentationSuggestions) {
        const docSuggestions = this.generateDocumentationSuggestions(analysisData);
        if (docSuggestions.success && docSuggestions.suggestions) {
          suggestions.push(...docSuggestions.suggestions);
        }
      }

      if (this.options.includeQualitySuggestions) {
        const qualitySuggestions = this.generateQualitySuggestions(analysisData);
        if (qualitySuggestions.success && qualitySuggestions.suggestions) {
          suggestions.push(...qualitySuggestions.suggestions);
        }
      }

      if (this.options.includeStructureSuggestions) {
        const structureSuggestions = this.generateStructureSuggestions(analysisData);
        if (structureSuggestions.success && structureSuggestions.suggestions) {
          suggestions.push(...structureSuggestions.suggestions);
        }
      }

      const prioritizedSuggestions = this.prioritizeSuggestions(suggestions);
      const limitedSuggestions = prioritizedSuggestions.slice(0, this.options.maxSuggestions);

      return {
        success: true,
        suggestions: limitedSuggestions,
        summary: {
          total: limitedSuggestions.length,
          byType: {
            documentation: limitedSuggestions.filter(s => s.type === 'documentation').length,
            quality: limitedSuggestions.filter(s => s.type === 'quality').length,
            structure: limitedSuggestions.filter(s => s.type === 'structure').length
          },
          byPriority: {
            high: limitedSuggestions.filter(s => s.priority === 'high').length,
            medium: limitedSuggestions.filter(s => s.priority === 'medium').length,
            low: limitedSuggestions.filter(s => s.priority === 'low').length
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown suggestion generation error'
      };
    }
  }

  /**
   * Generate documentation-specific suggestions
   */
  public generateDocumentationSuggestions(analysisData: any): SuggestionGenerationResult {
    try {
      const suggestions: Suggestion[] = [];
      const nodes = analysisData.nodes || [];

      nodes.forEach((node: any, index: number) => {
        if (!node.documentation || node.documentation.trim() === '') {
          suggestions.push({
            id: `doc-missing-${index}`,
            type: 'documentation',
            category: 'missing',
            priority: 'high',
            title: 'Missing Documentation',
            description: `Function "${node.name}" lacks documentation`,
            recommendation: 'Add JSDoc comments to describe the function\'s purpose, parameters, and return value',
            impact: 8,
            effort: 'medium',
            file: node.file,
            line: node.line
          });
        } else if (node.documentation.length < 50) {
          suggestions.push({
            id: `doc-incomplete-${index}`,
            type: 'documentation',
            category: 'improvement',
            priority: 'medium',
            title: 'Incomplete Documentation',
            description: `Function "${node.name}" has minimal documentation`,
            recommendation: 'Expand documentation to include detailed parameter descriptions and usage examples',
            impact: 6,
            effort: 'low',
            file: node.file,
            line: node.line
          });
        }
      });

      return {
        success: true,
        suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown documentation suggestion error'
      };
    }
  }

  /**
   * Generate quality-specific suggestions
   */
  public generateQualitySuggestions(analysisData: any): SuggestionGenerationResult {
    try {
      const suggestions: Suggestion[] = [];
      const nodes = analysisData.nodes || [];

      nodes.forEach((node: any, index: number) => {
        if (node.complexity) {
          if (node.complexity.cyclomatic > 10) {
            suggestions.push({
              id: `quality-complexity-${index}`,
              type: 'quality',
              category: 'complexity',
              priority: 'high',
              title: 'High Cyclomatic Complexity',
              description: `Function "${node.name}" has high cyclomatic complexity (${node.complexity.cyclomatic})`,
              recommendation: 'Consider breaking down the function into smaller, more focused functions',
              impact: 9,
              effort: 'high',
              file: node.file,
              line: node.line
            });
          }

          if (node.complexity.cognitive > 8) {
            suggestions.push({
              id: `quality-cognitive-${index}`,
              type: 'quality',
              category: 'complexity',
              priority: 'medium',
              title: 'High Cognitive Complexity',
              description: `Function "${node.name}" has high cognitive complexity (${node.complexity.cognitive})`,
              recommendation: 'Simplify the logic flow and reduce nested conditions',
              impact: 7,
              effort: 'medium',
              file: node.file,
              line: node.line
            });
          }
        }

        if (node.coverage && node.coverage.statements < 80) {
          suggestions.push({
            id: `quality-coverage-${index}`,
            type: 'quality',
            category: 'coverage',
            priority: 'medium',
            title: 'Low Test Coverage',
            description: `Function "${node.name}" has low test coverage (${node.coverage.statements}%)`,
            recommendation: 'Add comprehensive unit tests to improve code coverage',
            impact: 6,
            effort: 'medium',
            file: node.file,
            line: node.line
          });
        }
      });

      return {
        success: true,
        suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown quality suggestion error'
      };
    }
  }

  /**
   * Generate structure-specific suggestions
   */
  public generateStructureSuggestions(analysisData: any): SuggestionGenerationResult {
    try {
      const suggestions: Suggestion[] = [];
      const nodes = analysisData.nodes || [];

      // Analyze naming patterns
      const namingIssues = nodes.filter((node: any) => 
        node.name && !this.isGoodNaming(node.name)
      );

      namingIssues.forEach((node: any, index: number) => {
        suggestions.push({
          id: `structure-naming-${index}`,
          type: 'structure',
          category: 'naming',
          priority: 'low',
          title: 'Poor Naming Convention',
          description: `Function "${node.name}" doesn't follow naming conventions`,
          recommendation: 'Use descriptive names that clearly indicate the function\'s purpose',
          impact: 4,
          effort: 'low',
          file: node.file,
          line: node.line
        });
      });

      return {
        success: true,
        suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown structure suggestion error'
      };
    }
  }

  /**
   * Validate analysis data structure
   */
  public validateAnalysisData(data: any): AnalysisValidationResult {
    const errors: string[] = [];

    if (data === null || data === undefined) {
      errors.push('Analysis data is null or undefined');
      return { isValid: false, errors };
    }

    if (typeof data !== 'object') {
      errors.push('Analysis data must be an object');
      return { isValid: false, errors };
    }

    if (!data.name || typeof data.name !== 'string') {
      errors.push('Project name is required and must be a string');
    }

    if (!data.version || typeof data.version !== 'string') {
      errors.push('Project version is required and must be a string');
    }

    if (data.nodes && !Array.isArray(data.nodes)) {
      errors.push('Nodes must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data
    };
  }

  /**
   * Update generator options
   */
  public updateOptions(options: Partial<SuggestionGeneratorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current generator options
   */
  public getOptions(): SuggestionGeneratorOptions {
    return { ...this.options };
  }

  /**
   * Prioritize suggestions based on impact and priority
   */
  private prioritizeSuggestions(suggestions: Suggestion[]): Suggestion[] {
    return suggestions.sort((a, b) => {
      const priorityWeightA = this.options.priorityWeights[a.priority];
      const priorityWeightB = this.options.priorityWeights[b.priority];
      
      const scoreA = priorityWeightA * a.impact;
      const scoreB = priorityWeightB * b.impact;
      
      return scoreB - scoreA;
    });
  }

  /**
   * Check if naming follows good conventions
   */
  private isGoodNaming(name: string): boolean {
    if (!name) return false;
    
    // Check for camelCase or PascalCase
    const camelCase = /^[a-z][a-zA-Z0-9]*$/;
    const pascalCase = /^[A-Z][a-zA-Z0-9]*$/;
    
    return camelCase.test(name) || pascalCase.test(name);
  }

  /**
   * Get default generator options
   */
  private getDefaultOptions(): SuggestionGeneratorOptions {
    return {
      maxSuggestions: 20,
      includeDocumentationSuggestions: true,
      includeQualitySuggestions: true,
      includeStructureSuggestions: true,
      validateInput: true,
      customRules: [],
      priorityWeights: {
        high: 3,
        medium: 2,
        low: 1
      }
    };
  }
}

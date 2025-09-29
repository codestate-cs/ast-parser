/**
 * Quality Module Index
 * 
 * Centralized exports for all quality-related components.
 * This module provides a clean API for importing quality functionality.
 */

// Import all components for default export
import { QualityMetrics } from './QualityMetrics';
import { CoverageAnalyzer } from './CoverageAnalyzer';
import { SuggestionGenerator } from './SuggestionGenerator';

// Main Quality Components
export { QualityMetrics } from './QualityMetrics';
export { CoverageAnalyzer } from './CoverageAnalyzer';
export { SuggestionGenerator } from './SuggestionGenerator';

// Type Exports - Quality Interfaces
export type {
  QualityMetricsOptions,
  QualityMetricsResult,
  QualityMetrics as QualityMetricsType
} from './QualityMetrics';

export type {
  CoverageAnalyzerOptions,
  CoverageAnalysisResult,
  CoverageReportResult,
  CoverageValidationResult
} from './CoverageAnalyzer';

export type {
  SuggestionGeneratorOptions,
  SuggestionGenerationResult,
  Suggestion
} from './SuggestionGenerator';

// Default export for convenience
export default {
  QualityMetrics,
  CoverageAnalyzer,
  SuggestionGenerator
};

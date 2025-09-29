/**
 * Documentation Module Index
 * 
 * Centralized exports for all documentation-related components.
 * This module provides a clean API for importing documentation functionality.
 */

// Import all components for default export
import { DocumentationGenerator } from './DocumentationGenerator';
import { QualityMetrics } from './quality/QualityMetrics';
import { CoverageAnalyzer } from './quality/CoverageAnalyzer';
import { SuggestionGenerator } from './quality/SuggestionGenerator';
import { JSDocExtractor } from './extractors/JSDocExtractor';
import { TypeExtractor } from './extractors/TypeExtractor';
import { ExampleExtractor } from './extractors/ExampleExtractor';
import { BaseGenerator } from './generators/BaseGenerator';
import { MarkdownGenerator } from './generators/MarkdownGenerator';
import { HTMLGenerator } from './generators/HTMLGenerator';
import { BaseTemplate } from './templates/BaseTemplate';
import { OverviewTemplate } from './templates/OverviewTemplate';
import { APITemplate } from './templates/APITemplate';

// Main Documentation Components
export { DocumentationGenerator } from './DocumentationGenerator';
export { QualityMetrics } from './quality/QualityMetrics';
export { CoverageAnalyzer } from './quality/CoverageAnalyzer';
export { SuggestionGenerator } from './quality/SuggestionGenerator';

// Extractors
export { JSDocExtractor } from './extractors/JSDocExtractor';
export { TypeExtractor } from './extractors/TypeExtractor';
export { ExampleExtractor } from './extractors/ExampleExtractor';

// Generators
export { BaseGenerator } from './generators/BaseGenerator';
export { MarkdownGenerator } from './generators/MarkdownGenerator';
export { HTMLGenerator } from './generators/HTMLGenerator';

// Templates
export { BaseTemplate } from './templates/BaseTemplate';
export { OverviewTemplate } from './templates/OverviewTemplate';
export { APITemplate } from './templates/APITemplate';

// Type Exports - Main Interfaces
export type { 
  DocumentationGeneratorOptions,
  DocumentationResult,
  ExtractionResult,
  QualityAnalysisResult,
  ProjectValidationResult
} from './DocumentationGenerator';

export type {
  QualityMetricsOptions,
  QualityMetricsResult,
  QualityMetrics as QualityMetricsType
} from './quality/QualityMetrics';

export type {
  CoverageAnalyzerOptions,
  CoverageAnalysisResult,
  CoverageReportResult,
  CoverageValidationResult
} from './quality/CoverageAnalyzer';

export type {
  SuggestionGeneratorOptions,
  SuggestionGenerationResult,
  Suggestion
} from './quality/SuggestionGenerator';

// Type Exports - Extractors
export type {
  JSDocExtractionOptions,
  JSDocComment,
  JSDocTag,
  JSDocExtractionResult,
  JSDocTagType
} from './extractors/JSDocExtractor';

export type {
  TypeExtractionOptions,
  TypeInfo,
  TypeExtractionResult
} from './extractors/TypeExtractor';

export type {
  ExampleExtractionOptions,
  ExampleInfo,
  ExampleExtractionResult
} from './extractors/ExampleExtractor';

// Default export for convenience
export default {
  DocumentationGenerator,
  QualityMetrics,
  CoverageAnalyzer,
  SuggestionGenerator,
  JSDocExtractor,
  TypeExtractor,
  ExampleExtractor,
  BaseGenerator,
  MarkdownGenerator,
  HTMLGenerator,
  BaseTemplate,
  OverviewTemplate,
  APITemplate
};
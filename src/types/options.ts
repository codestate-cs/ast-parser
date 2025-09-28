/**
 * Configuration options and interfaces
 */

import { ParsingMode, OutputFormat, CompressionType } from './core';

/**
 * Main parsing options
 */
export interface ParsingOptions {
  /** File filtering options */
  filtering: FilteringOptions;
  /** Parsing mode */
  mode: ParsingMode;
  /** Output options */
  output: OutputOptions;
  /** Documentation options */
  documentation: DocumentationOptions;
  /** Performance options */
  performance: PerformanceOptions;
  /** Cache options */
  cache: CacheOptions;
}

/**
 * File filtering options
 */
export interface FilteringOptions {
  /** Include patterns */
  includePatterns?: string[];
  /** Exclude patterns */
  excludePatterns?: string[];
  /** Skip node_modules */
  skipNodeModules?: boolean;
  /** Maximum directory depth */
  maxDepth?: number;
  /** Include only exported symbols */
  includeOnlyExports?: boolean;
  /** Include test files */
  includeTestFiles?: boolean;
  /** Include documentation files */
  includeDocFiles?: boolean;
}

/**
 * Output options
 */
export interface OutputOptions {
  /** Output file path */
  outputFile?: string;
  /** Output directory */
  outputDir?: string;
  /** Output format */
  format: OutputFormat;
  /** Compression type */
  compression: CompressionType;
  /** Minify output */
  minify?: boolean;
  /** Include source maps */
  includeSourceMaps?: boolean;
  /** Include metadata */
  includeMetadata?: boolean;
  /** Pretty print output */
  prettyPrint?: boolean;
  /** Output encoding */
  encoding?: string;
  /** Output strategy */
  strategy?: 'file' | 'stream' | 'memory';
  /** Include timestamp in filename */
  includeTimestamp?: boolean;
}

/**
 * Documentation options
 */
export interface DocumentationOptions {
  /** Include documentation generation */
  includeDocumentation?: boolean;
  /** Include examples */
  includeExamples?: boolean;
  /** Include architecture analysis */
  includeArchitecture?: boolean;
  /** Include dependency graph */
  includeDependencyGraph?: boolean;
  /** Include quality metrics */
  includeQualityMetrics?: boolean;
  /** Documentation format */
  documentationFormat?: OutputFormat;
  /** Documentation output directory */
  documentationOutputDir?: string;
}

/**
 * Performance options
 */
export interface PerformanceOptions {
  /** Maximum concurrent files */
  maxConcurrentFiles?: number;
  /** Memory limit in MB */
  memoryLimit?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Enable progress reporting */
  enableProgress?: boolean;
  /** Progress update interval */
  progressInterval?: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Cache file path */
  cacheFile?: string;
  /** Enable caching */
  enableCache?: boolean;
  /** Cache expiration time in hours */
  cacheExpiration?: number;
  /** Cache compression */
  cacheCompression?: boolean;
  /** Cache validation */
  cacheValidation?: boolean;
}

/**
 * Incremental parsing options
 */
export interface IncrementalParsingOptions extends ParsingOptions {
  /** Cache file path */
  cacheFile: string;
  /** Since timestamp */
  since?: string;
  /** Changed files */
  changedFiles?: string[];
  /** Git diff options */
  gitDiff?: GitDiffOptions;
  /** Update dependents */
  updateDependents?: boolean;
}

/**
 * Git diff options
 */
export interface GitDiffOptions {
  /** Enable git diff */
  enabled: boolean;
  /** Git branch to compare against */
  branch?: string;
  /** Git commit to compare against */
  commit?: string;
  /** Include staged changes */
  includeStaged?: boolean;
  /** Include untracked files */
  includeUntracked?: boolean;
}

/**
 * Streaming options
 */
export interface StreamingOptions extends ParsingOptions {
  /** Stream output */
  stream: boolean;
  /** Chunk size */
  chunkSize?: number;
  /** Stream format */
  streamFormat?: 'json' | 'jsonl' | 'csv';
  /** Stream compression */
  streamCompression?: boolean;
}

/**
 * Chunked output options
 */
export interface ChunkedOutputOptions extends ParsingOptions {
  /** Enable chunked output */
  chunked: boolean;
  /** Chunk size */
  chunkSize: number;
  /** Output directory for chunks */
  chunkOutputDir: string;
  /** Chunk format */
  chunkFormat?: OutputFormat;
  /** Chunk compression */
  chunkCompression?: CompressionType;
}

/**
 * Default configuration
 */
export const DEFAULT_PARSING_OPTIONS: ParsingOptions = {
  filtering: {
    includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    excludePatterns: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'node_modules/**',
    ],
    skipNodeModules: true,
    maxDepth: 10,
    includeOnlyExports: false,
    includeTestFiles: false,
    includeDocFiles: true,
  },
  mode: 'full',
  output: {
    format: 'json',
    compression: 'none',
    minify: false,
    includeSourceMaps: false,
    includeMetadata: true,
  },
  documentation: {
    includeDocumentation: true,
    includeExamples: true,
    includeArchitecture: true,
    includeDependencyGraph: true,
    includeQualityMetrics: false,
    documentationFormat: 'markdown',
  },
  performance: {
    maxConcurrentFiles: 10,
    memoryLimit: 1024,
    timeout: 300000, // 5 minutes
    enableProgress: true,
    progressInterval: 1000,
  },
  cache: {
    enableCache: false,
    cacheExpiration: 24,
    cacheCompression: true,
    cacheValidation: true,
  },
};

/**
 * Validation result for options
 */
export interface OptionsValidationResult {
  /** Is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Validated options */
  options: ParsingOptions;
}

/**
 * Entry point analysis options
 */
export interface EntryPointAnalysisOptions {
  /** Custom entry point patterns */
  entryPointPatterns?: string[];
  /** Include patterns for filtering */
  includePatterns?: string[];
  /** Exclude patterns for filtering */
  excludePatterns?: string[];
  /** Whether to analyze package.json */
  analyzePackageJson?: boolean;
  /** Whether to analyze AST nodes */
  analyzeASTNodes?: boolean;
  /** Whether to analyze exports field */
  analyzeExports?: boolean;
  /** Whether to deduplicate entry points */
  deduplicate?: boolean;
}

/**
 * Structure analysis options
 */
export interface StructureAnalysisOptions {
  /** Include patterns for filtering */
  includePatterns?: string[];
  /** Exclude patterns for filtering */
  excludePatterns?: string[];
  /** Whether to analyze project depth */
  analyzeDepth?: boolean;
  /** Whether to analyze project breadth */
  analyzeBreadth?: boolean;
  /** Whether to analyze project organization */
  analyzeOrganization?: boolean;
  /** Whether to analyze project patterns */
  analyzePatterns?: boolean;
  /** Whether to analyze project architecture */
  analyzeArchitecture?: boolean;
  /** Maximum depth for analysis */
  maxDepth?: number;
  /** Whether to include file statistics */
  includeFileStats?: boolean;
  /** Whether to include directory statistics */
  includeDirectoryStats?: boolean;
}

/**
 * Complexity analysis options
 */
export interface ComplexityAnalysisOptions {
  /** Include patterns for filtering */
  includePatterns?: string[];
  /** Exclude patterns for filtering */
  excludePatterns?: string[];
  /** Whether to calculate cyclomatic complexity */
  calculateCyclomaticComplexity?: boolean;
  /** Whether to calculate cognitive complexity */
  calculateCognitiveComplexity?: boolean;
  /** Whether to count lines of code */
  countLinesOfCode?: boolean;
  /** Whether to count functions */
  countFunctions?: boolean;
  /** Whether to count classes */
  countClasses?: boolean;
  /** Whether to count interfaces */
  countInterfaces?: boolean;
  /** Maximum cyclomatic complexity threshold */
  maxCyclomaticComplexity?: number;
  /** Maximum cognitive complexity threshold */
  maxCognitiveComplexity?: number;
  /** Whether to include detailed metrics per file */
  includeFileMetrics?: boolean;
  /** Whether to include aggregated metrics */
  includeAggregatedMetrics?: boolean;
}

/**
 * Options validator interface
 */
export interface OptionsValidator {
  /** Validate options */
  validate(options: ParsingOptions): OptionsValidationResult;
  /** Validate specific option */
  validateOption(key: string, value: unknown): boolean;
  /** Get option schema */
  getSchema(): Record<string, unknown>;
}

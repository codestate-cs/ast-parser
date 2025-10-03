/**
 * @fileoverview Configuration types and interfaces
 * Defines the structure for configuration objects used throughout the application
 */

/**
 * Configuration for analyzers
 */
export interface AnalyzerConfig {
  /** Dependency analyzer configuration */
  dependency: {
    /** Include external dependencies */
    includeExternal: boolean;
    /** Include internal dependencies */
    includeInternal: boolean;
    /** Maximum dependency depth */
    maxDepth: number;
    /** Include circular dependencies */
    includeCircular: boolean;
  };
  /** Entry point analyzer configuration */
  entryPoint: {
    /** Include main entry points */
    includeMain: boolean;
    /** Include type entry points */
    includeTypes: boolean;
    /** Include pattern-based entry points */
    includePatterns: boolean;
    /** Maximum entry points to analyze */
    maxEntryPoints: number;
  };
  /** Structure analyzer configuration */
  structure: {
    /** Include file structure */
    includeFiles: boolean;
    /** Include directory structure */
    includeDirectories: boolean;
    /** Maximum directory depth */
    maxDepth: number;
    /** Include size information */
    includeSize: boolean;
  };
  /** Complexity analyzer configuration */
  complexity: {
    /** Include cyclomatic complexity */
    includeCyclomatic: boolean;
    /** Include cognitive complexity */
    includeCognitive: boolean;
    /** Include lines of code */
    includeLinesOfCode: boolean;
    /** Include function count */
    includeFunctionCount: boolean;
    /** Include class count */
    includeClassCount: boolean;
    /** Include interface count */
    includeInterfaceCount: boolean;
  };
}

/**
 * Configuration for parsers
 */
export interface ParserConfig {
  /** TypeScript parser configuration */
  typescript: {
    /** Include type information */
    includeTypes: boolean;
    /** Include JSDoc comments */
    includeJSDoc: boolean;
    /** Include decorators */
    includeDecorators: boolean;
    /** Include generics */
    includeGenerics: boolean;
    /** Maximum parsing depth */
    maxDepth: number;
  };
  /** Enhanced TypeScript parser configuration */
  enhancedTypeScript: {
    /** Include advanced type information */
    includeAdvancedTypes: boolean;
    /** Include method signatures */
    includeMethodSignatures: boolean;
    /** Include property information */
    includeProperties: boolean;
    /** Include parameter information */
    includeParameters: boolean;
    /** Include export information */
    includeExports: boolean;
    /** Maximum parsing depth */
    maxDepth: number;
  };
}

/**
 * Configuration for output
 */
export interface OutputConfig {
  /** Output formats configuration */
  formats: {
    /** Default output format */
    default: string;
    /** Available formats */
    available: string[];
    /** Format-specific options */
    options: Record<string, unknown>;
  };
  /** Naming configuration */
  naming: {
    /** Default naming strategy */
    default: string;
    /** Available strategies */
    available: string[];
    /** Strategy-specific options */
    options: Record<string, unknown>;
  };
}

/**
 * Main configuration options
 */
/**
 * Configuration for performance monitoring and optimization
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Enable memory management */
  enableMemoryManagement: boolean;
  /** Enable caching */
  enableCaching: boolean;
  /** Maximum concurrent files */
  maxConcurrentFiles: number;
  /** Memory limit in MB */
  memoryLimit: number;
  /** Timeout in milliseconds */
  timeout: number;
  /** Enable progress reporting */
  enableProgress: boolean;
  /** Progress update interval */
  progressInterval: number;
  /** Performance monitor configuration */
  performanceMonitor: {
    /** Enable memory tracking */
    enableMemoryTracking: boolean;
    /** Enable CPU tracking */
    enableCpuTracking: boolean;
    /** Enable auto reporting */
    enableAutoReporting: boolean;
    /** Report interval in milliseconds */
    reportInterval: number;
    /** Memory threshold in MB */
    memoryThreshold: number;
    /** CPU threshold percentage */
    cpuThreshold: number;
    /** Enable profiling */
    enableProfiling: boolean;
    /** Maximum operation history */
    maxOperationHistory: number;
    /** Enable detailed metrics */
    enableDetailedMetrics: boolean;
  };
  /** Memory manager configuration */
  memoryManager: {
    /** Enable monitoring */
    enableMonitoring: boolean;
    /** Enable auto garbage collection */
    enableAutoGC: boolean;
    /** Memory threshold in MB */
    memoryThreshold: number;
    /** Garbage collection threshold */
    gcThreshold: number;
    /** Monitoring interval in milliseconds */
    monitoringInterval: number;
    /** Enable leak detection */
    enableLeakDetection: boolean;
    /** Maximum memory history */
    maxMemoryHistory: number;
    /** Enable optimization */
    enableOptimization: boolean;
  };
  /** Cache manager configuration */
  cacheManager: {
    /** Cache file path */
    cacheFile: string;
    /** Maximum cache size */
    maxCacheSize: number;
    /** Default TTL in milliseconds */
    defaultTTL: number;
    /** Enable persistence */
    enablePersistence: boolean;
    /** Enable compression */
    enableCompression: boolean;
    /** Enable auto cleanup */
    enableAutoCleanup: boolean;
    /** Cleanup interval in milliseconds */
    cleanupInterval: number;
  };
}

export interface ConfigOptions {
  /** Analyzer configurations */
  analyzers: AnalyzerConfig;
  /** Parser configurations */
  parsers: ParserConfig;
  /** Output configurations */
  output: OutputConfig;
  /** Global options */
  global: {
    /** Enable verbose logging */
    verbose: boolean;
    /** Enable debug mode */
    debug: boolean;
    /** Maximum processing time */
    maxProcessingTime: number;
    /** Enable parallel processing */
    parallel: boolean;
  };
  /** Performance configurations */
  performance: PerformanceConfig;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Loader options
 */
export interface LoaderOptions {
  /** Configuration file path */
  configFile?: string;
  /** Environment variables prefix */
  envPrefix?: string;
  /** Merge with default configuration */
  mergeWithDefaults?: boolean;
  /** Validate loaded configuration */
  validate?: boolean;
}

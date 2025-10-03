/**
 * Performance monitoring types and interfaces
 */

import { MemoryUsageInfo, MemoryReport } from './memory';

export interface PerformanceMetrics {
  /** Total number of operations performed */
  totalOperations: number;

  /** Total duration of all operations in milliseconds */
  totalDuration: number;

  /** Average duration per operation in milliseconds */
  averageDuration: number;

  /** Peak memory usage in MB */
  memoryPeak: number;

  /** Current memory usage in MB */
  memoryCurrent: number;

  /** Memory growth during operations in MB */
  memoryGrowth: number;

  /** Cache hit rate (0-1) */
  cacheHitRate: number;

  /** File processing rate (files per second) */
  fileProcessingRate: number;

  /** Operations per second */
  operationsPerSecond: number;

  /** Resource usage statistics */
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  /** CPU usage percentage */
  cpuUsage: number;

  /** Memory usage percentage */
  memoryUsage: number;

  /** Disk I/O operations per second */
  diskIO: number;
}

export interface OperationTiming {
  /** Unique operation ID */
  id: string;

  /** Operation type (e.g., 'parseFile', 'analyzeStructure') */
  operation: string;

  /** File being processed */
  file: string;

  /** Start time in milliseconds */
  startTime: number;

  /** End time in milliseconds */
  endTime?: number;

  /** Duration in milliseconds */
  duration?: number;

  /** Memory usage at start in MB */
  memoryStart?: number;

  /** Memory usage at end in MB */
  memoryEnd?: number;

  /** Memory growth during operation in MB */
  memoryGrowth?: number;

  /** CPU usage at start */
  cpuStart?: CpuUsage;

  /** CPU usage at end */
  cpuEnd?: CpuUsage;

  /** File size in bytes */
  fileSize?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface CpuUsage {
  /** User CPU time in microseconds */
  user: number;

  /** System CPU time in microseconds */
  system: number;
}

export interface MemoryUsage {
  /** Resident Set Size in bytes */
  rss: number;

  /** Total heap size in bytes */
  heapTotal: number;

  /** Used heap size in bytes */
  heapUsed: number;

  /** External memory in bytes */
  external: number;

  /** Array buffers in bytes */
  arrayBuffers: number;
}

export interface PerformanceReport {
  /** Report generation timestamp */
  timestamp: Date;

  /** Performance summary */
  summary: PerformanceSummary;

  /** Detailed metrics */
  metrics: PerformanceMetrics;

  /** Optimization recommendations */
  recommendations: PerformanceRecommendation[];

  /** Operation history */
  operationHistory: OperationTiming[];
}

export interface PerformanceSummary {
  /** Total operations performed */
  totalOperations: number;

  /** Average operation duration in milliseconds */
  averageDuration: number;

  /** Memory usage summary */
  memoryUsage: {
    current: number;
    peak: number;
    growth: number;
  };

  /** Performance score (0-100) */
  performanceScore: number;

  /** Cache efficiency */
  cacheEfficiency: number;

  /** File processing efficiency */
  fileProcessingEfficiency: number;
}

export interface PerformanceRecommendation {
  /** Recommendation type */
  type: 'memory' | 'cpu' | 'cache' | 'io' | 'general';

  /** Recommendation description */
  description: string;

  /** Expected impact level */
  impact: 'low' | 'medium' | 'high';

  /** Specific action to take */
  action?: string;

  /** Additional context */
  context?: string;
}

export interface PerformanceMonitorOptions {
  /** Enable memory usage tracking */
  enableMemoryTracking?: boolean;

  /** Enable CPU usage tracking */
  enableCpuTracking?: boolean;

  /** Enable disk I/O tracking */
  enableDiskIOTracking?: boolean;

  /** Maximum number of operations to keep in history */
  maxMetricsHistory?: number;

  /** Report generation interval in milliseconds */
  reportInterval?: number;

  /** Enable automatic reporting */
  enableAutoReporting?: boolean;

  /** Performance thresholds */
  thresholds?: PerformanceThresholds;
}

export interface PerformanceThresholds {
  /** Maximum acceptable operation duration in milliseconds */
  maxOperationDuration?: number;

  /** Maximum acceptable memory usage in MB */
  maxMemoryUsage?: number;

  /** Minimum acceptable cache hit rate (0-1) */
  minCacheHitRate?: number;

  /** Maximum acceptable memory growth in MB */
  maxMemoryGrowth?: number;
}

export interface CacheStatistics {
  /** Total cache hits */
  hits: number;

  /** Total cache misses */
  misses: number;

  /** Cache hit rate (0-1) */
  hitRate: number;

  /** Total cache operations */
  totalOperations: number;
}

export interface FileProcessingStatistics {
  /** Total files processed */
  totalFiles: number;

  /** Total bytes processed */
  totalBytes: number;

  /** Average file size in bytes */
  averageFileSize: number;

  /** Processing rate (files per second) */
  processingRate: number;

  /** Bytes processed per second */
  bytesPerSecond: number;
}

export interface PerformanceConfig {
  enablePerformanceMonitoring: boolean;
  enableMemoryTracking: boolean;
  enableCpuTracking: boolean;
  enableAutoReporting: boolean;
  reportInterval: number;
  memoryThreshold: number;
  cpuThreshold: number;
  enableProfiling: boolean;
  maxOperationHistory: number;
  enableDetailedMetrics: boolean;
}

export interface PerformanceReport {
  metrics: PerformanceMetrics;
  report: PerformanceSummary;
  recommendations: PerformanceRecommendation[];
  memory?: {
    usage: MemoryUsageInfo;
    report: MemoryReport;
  };
  cache?: {
    hitRate: number;
    statistics: CacheStatistics;
  };
}

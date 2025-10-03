import { PerformanceMonitor } from '../utils/performance/PerformanceMonitor';
import { MemoryManager } from '../utils/performance/MemoryManager';
import { CacheManager } from '../core/CacheManager';
import {
  PerformanceMetrics,
  PerformanceSummary,
  PerformanceRecommendation,
  CacheStatistics,
} from './performance';
import { MemoryUsageInfo, MemoryReport } from './memory';

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

export interface MemoryManagementConfig {
  enableMemoryManagement: boolean;
  enableMonitoring: boolean;
  enableAutoGC: boolean;
  memoryThreshold: number;
  gcThreshold: number;
  monitoringInterval: number;
  enableLeakDetection: boolean;
  maxMemoryHistory: number;
  enableOptimization: boolean;
}

export interface CachingConfig {
  enableCaching: boolean;
  maxCacheSize: number;
  ttl: number;
  enablePersistence: boolean;
  enableCompression: boolean;
  enableEncryption: boolean;
  cacheDirectory: string;
  enableAutoCleanup: boolean;
  cleanupInterval: number;
}

export interface IntegrationConfig {
  enablePerformanceMonitoring: boolean;
  enableMemoryManagement: boolean;
  enableCaching: boolean;
  enableIncrementalParsing: boolean;
  enableOptimization: boolean;
  enableReporting: boolean;
  enableProfiling: boolean;
  enableDebugging: boolean;
}

export interface PerformanceIntegrationOptions {
  enablePerformanceMonitoring?: boolean;
  enableMemoryManagement?: boolean;
  enableCaching?: boolean;
  performanceMonitor?: PerformanceMonitor;
  memoryManager?: MemoryManager;
  cacheManager?: CacheManager;
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

export interface ProjectInfoWithPerformance {
  performance?: PerformanceReport;
}

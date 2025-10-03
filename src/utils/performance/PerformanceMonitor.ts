import { 
  PerformanceMetrics, 
  PerformanceReport, 
  OperationTiming, 
  PerformanceMonitorOptions,
  PerformanceSummary,
  PerformanceRecommendation,
  MemoryUsage,
  CpuUsage,
  CacheStatistics,
  FileProcessingStatistics
} from '../../types/performance';
import { logInfo, logWarn, logError } from '../error/ErrorLogger';

/**
 * Performance monitoring and metrics collection
 */
export class PerformanceMonitor {
  private options: Required<PerformanceMonitorOptions>;
  private operationTimings: Map<string, OperationTiming> = new Map();
  private operationHistory: OperationTiming[] = [];
  private cacheStats: CacheStatistics = { hits: 0, misses: 0, hitRate: 0, totalOperations: 0 };
  private fileStats: FileProcessingStatistics = { 
    totalFiles: 0, 
    totalBytes: 0, 
    averageFileSize: 0, 
    processingRate: 0, 
    bytesPerSecond: 0 
  };
  private startTime: number = Date.now();
  private memoryPeak: number = 0;
  private reportTimer?: NodeJS.Timeout;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = this.mergeOptions(options);
    this.initializeMemoryTracking();
    this.startAutoReporting();
  }

  /**
   * Start timing an operation
   */
  startOperation(operation: string, file: string, metadata?: Record<string, any>): string {
    try {
      const operationId = this.generateOperationId();
      const startTime = this.getCurrentTime();
      
      const timing: OperationTiming = {
        id: operationId,
        operation: operation || 'unknown',
        file: file || 'unknown',
        startTime,
        metadata: metadata || {}
      };

      // Track memory usage if enabled
      if (this.options.enableMemoryTracking) {
        try {
          timing.memoryStart = this.getMemoryUsageInMB();
        } catch (error) {
          logWarn('Failed to track memory usage at operation start', { error: (error as Error).message });
        }
      }

      // Track CPU usage if enabled
      if (this.options.enableCpuTracking) {
        try {
          timing.cpuStart = this.getCpuUsage();
        } catch (error) {
          logWarn('Failed to track CPU usage at operation start', { error: (error as Error).message });
        }
      }

      this.operationTimings.set(operationId, timing);
      
      return operationId;
    } catch (error) {
      logError('Failed to start operation timing', error as Error);
      return 'error-' + Date.now();
    }
  }

  /**
   * End timing an operation and record metrics
   */
  endOperation(operationId: string): OperationTiming | undefined {
    try {
      const timing = this.operationTimings.get(operationId);
      if (!timing) {
        logWarn(`Operation ${operationId} not found`);
        return undefined;
      }

      const endTime = this.getCurrentTime();
      timing.endTime = endTime;
      timing.duration = endTime - timing.startTime;

      // Track memory usage if enabled
      if (this.options.enableMemoryTracking && timing.memoryStart !== undefined) {
        try {
          timing.memoryEnd = this.getMemoryUsageInMB();
          timing.memoryGrowth = timing.memoryEnd - timing.memoryStart;
          
          // Update memory peak
          if (timing.memoryEnd > this.memoryPeak) {
            this.memoryPeak = timing.memoryEnd;
          }
        } catch (error) {
          logWarn('Failed to track memory usage at operation end', { error: (error as Error).message });
        }
      }

      // Track CPU usage if enabled
      if (this.options.enableCpuTracking && timing.cpuStart) {
        try {
          timing.cpuEnd = this.getCpuUsage();
        } catch (error) {
          logWarn('Failed to track CPU usage at operation end', { error: (error as Error).message });
        }
      }

      // Move to history and clean up
      this.operationHistory.push({ ...timing });
      this.operationTimings.delete(operationId);
      
      // Limit history size
      if (this.operationHistory.length > this.options.maxMetricsHistory) {
        this.operationHistory = this.operationHistory.slice(-this.options.maxMetricsHistory);
      }

      return timing;
    } catch (error) {
      logError('Failed to end operation timing', error as Error);
      return undefined;
    }
  }

  /**
   * Record a cache hit
   */
  recordCacheHit(_file: string): void {
    try {
      this.cacheStats.hits++;
      this.cacheStats.totalOperations++;
      this.cacheStats.hitRate = this.cacheStats.hits / this.cacheStats.totalOperations;
    } catch (error) {
      logError('Failed to record cache hit', error as Error);
    }
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(_file: string): void {
    try {
      this.cacheStats.misses++;
      this.cacheStats.totalOperations++;
      this.cacheStats.hitRate = this.cacheStats.hits / this.cacheStats.totalOperations;
    } catch (error) {
      logError('Failed to record cache miss', error as Error);
    }
  }

  /**
   * Record file processing
   */
  recordFileProcessed(_file: string, size: number): void {
    try {
      this.fileStats.totalFiles++;
      this.fileStats.totalBytes += Math.max(0, size);
      this.fileStats.averageFileSize = this.fileStats.totalBytes / this.fileStats.totalFiles;
      
      // Calculate processing rate
      const elapsedTime = (Date.now() - this.startTime) / 1000; // seconds
      if (elapsedTime > 0) {
        this.fileStats.processingRate = this.fileStats.totalFiles / elapsedTime;
        this.fileStats.bytesPerSecond = this.fileStats.totalBytes / elapsedTime;
      }
    } catch (error) {
      logError('Failed to record file processing', error as Error);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    try {
      const totalOperations = this.operationHistory.length;
      const totalDuration = this.operationHistory.reduce((sum, op) => sum + (op.duration || 0), 0);
      const averageDuration = totalOperations > 0 ? totalDuration / totalOperations : 0;
      
      const currentMemory = this.getMemoryUsageInMB();
      const memoryGrowth = currentMemory - this.getInitialMemoryUsage();
      
      const elapsedTime = (Date.now() - this.startTime) / 1000; // seconds
      const operationsPerSecond = elapsedTime > 0 ? totalOperations / elapsedTime : 0;

      return {
        totalOperations,
        totalDuration,
        averageDuration,
        memoryPeak: this.memoryPeak,
        memoryCurrent: currentMemory,
        memoryGrowth: Math.max(0, memoryGrowth),
        cacheHitRate: this.cacheStats.hitRate,
        fileProcessingRate: this.fileStats.processingRate,
        operationsPerSecond,
        resourceUsage: {
          cpuUsage: this.getCpuUsagePercentage(),
          memoryUsage: this.getMemoryUsagePercentage(),
          diskIO: this.getDiskIOUsage()
        }
      };
    } catch (error) {
      logError('Failed to get performance metrics', error as Error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get operation history
   */
  getOperationHistory(): OperationTiming[] {
    return [...this.operationHistory];
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    try {
      const metrics = this.getMetrics();
      const summary = this.generateSummary(metrics);
      const recommendations = this.generateRecommendations(metrics);

      return {
        timestamp: new Date(),
        summary,
        metrics,
        recommendations,
        operationHistory: this.getOperationHistory(),
        report: summary
      };
    } catch (error) {
      logError('Failed to generate performance report', error as Error);
      return this.getDefaultReport();
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    try {
      this.operationTimings.clear();
      this.operationHistory = [];
      this.cacheStats = { hits: 0, misses: 0, hitRate: 0, totalOperations: 0 };
      this.fileStats = { 
        totalFiles: 0, 
        totalBytes: 0, 
        averageFileSize: 0, 
        processingRate: 0, 
        bytesPerSecond: 0 
      };
      this.startTime = Date.now();
      this.memoryPeak = 0;
      this.initializeMemoryTracking();
    } catch (error) {
      logError('Failed to reset performance monitor', error as Error);
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsage {
    try {
      return process.memoryUsage();
    } catch (error) {
      logError('Failed to get memory usage', error as Error);
      return {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0
      };
    }
  }

  /**
   * Get current CPU usage
   */
  getCpuUsage(): CpuUsage {
    try {
      return process.cpuUsage();
    } catch (error) {
      logError('Failed to get CPU usage', error as Error);
      return { user: 0, system: 0 };
    }
  }

  /**
   * Dispose of the performance monitor
   */
  dispose(): void {
    try {
      this.stopAutoReporting();
      this.reset();
    } catch (error) {
      logError('Failed to dispose performance monitor', error as Error);
    }
  }

  // Private methods

  private mergeOptions(options: PerformanceMonitorOptions): Required<PerformanceMonitorOptions> {
    return {
      enableMemoryTracking: options.enableMemoryTracking ?? true,
      enableCpuTracking: options.enableCpuTracking ?? true,
      enableDiskIOTracking: options.enableDiskIOTracking ?? false,
      maxMetricsHistory: options.maxMetricsHistory ?? 1000,
      reportInterval: options.reportInterval ?? 30000, // 30 seconds
      enableAutoReporting: options.enableAutoReporting ?? false,
      thresholds: options.thresholds ?? {
        maxOperationDuration: 5000, // 5 seconds
        maxMemoryUsage: 1024, // 1GB
        minCacheHitRate: 0.8, // 80%
        maxMemoryGrowth: 100 // 100MB
      }
    };
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentTime(): number {
    try {
      const [seconds, nanoseconds] = process.hrtime();
      return seconds * 1000 + nanoseconds / 1000000;
    } catch (error) {
      return Date.now();
    }
  }

  private getMemoryUsageInMB(): number {
    try {
      const usage = process.memoryUsage();
      return usage.rss / (1024 * 1024); // Convert to MB
    } catch (error) {
      return 0;
    }
  }

  private getInitialMemoryUsage(): number {
    // This would be set during initialization
    return this.getMemoryUsageInMB();
  }

  private getCpuUsagePercentage(): number {
    try {
      const usage = process.cpuUsage();
      const total = usage.user + usage.system;
      return total / 1000000; // Convert to percentage (rough approximation)
    } catch (error) {
      return 0;
    }
  }

  private getMemoryUsagePercentage(): number {
    try {
      const usage = process.memoryUsage();
      return (usage.heapUsed / usage.heapTotal) * 100;
    } catch (error) {
      return 0;
    }
  }

  private getDiskIOUsage(): number {
    // This would require additional system monitoring
    // For now, return 0 as disk I/O tracking is not implemented
    return 0;
  }

  private generateSummary(metrics: PerformanceMetrics): PerformanceSummary {
    const performanceScore = this.calculatePerformanceScore(metrics);
    
    return {
      totalOperations: metrics.totalOperations,
      averageDuration: metrics.averageDuration,
      memoryUsage: {
        current: metrics.memoryCurrent,
        peak: metrics.memoryPeak,
        growth: metrics.memoryGrowth
      },
      performanceScore,
      cacheEfficiency: metrics.cacheHitRate,
      fileProcessingEfficiency: metrics.fileProcessingRate
    };
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // Penalize slow operations
    if (metrics.averageDuration > 1000) score -= 20;
    else if (metrics.averageDuration > 500) score -= 10;
    
    // Penalize high memory usage
    if (metrics.memoryCurrent > 500) score -= 15;
    else if (metrics.memoryCurrent > 200) score -= 10;
    
    // Penalize low cache hit rate
    if (metrics.cacheHitRate < 0.5) score -= 25;
    else if (metrics.cacheHitRate < 0.8) score -= 15;
    
    // Penalize high memory growth
    if (metrics.memoryGrowth > 50) score -= 20;
    else if (metrics.memoryGrowth > 20) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(metrics: PerformanceMetrics): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    // Memory recommendations
    if (metrics.memoryCurrent > (this.options.thresholds.maxMemoryUsage || 1024)) {
      recommendations.push({
        type: 'memory',
        description: 'High memory usage detected',
        impact: 'high',
        action: 'Consider implementing memory cleanup or reducing cache size',
        context: `Current usage: ${metrics.memoryCurrent.toFixed(2)}MB`
      });
    }
    
    if (metrics.memoryGrowth > (this.options.thresholds.maxMemoryGrowth || 100)) {
      recommendations.push({
        type: 'memory',
        description: 'Significant memory growth detected',
        impact: 'medium',
        action: 'Check for memory leaks or implement garbage collection',
        context: `Growth: ${metrics.memoryGrowth.toFixed(2)}MB`
      });
    }
    
    // Performance recommendations
    if (metrics.averageDuration > (this.options.thresholds.maxOperationDuration || 5000)) {
      recommendations.push({
        type: 'general',
        description: 'Slow operation performance detected',
        impact: 'high',
        action: 'Optimize parsing algorithms or implement caching',
        context: `Average duration: ${metrics.averageDuration.toFixed(2)}ms`
      });
    }
    
    // Cache recommendations
    if (metrics.cacheHitRate < (this.options.thresholds.minCacheHitRate || 0.8)) {
      recommendations.push({
        type: 'cache',
        description: 'Low cache hit rate detected',
        impact: 'medium',
        action: 'Review cache invalidation strategy or increase cache size',
        context: `Hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`
      });
    }
    
    // General recommendations
    if (metrics.operationsPerSecond < 1) {
      recommendations.push({
        type: 'general',
        description: 'Low operation throughput',
        impact: 'medium',
        action: 'Consider parallel processing or algorithm optimization',
        context: `Throughput: ${metrics.operationsPerSecond.toFixed(2)} ops/sec`
      });
    }
    
    return recommendations;
  }

  private initializeMemoryTracking(): void {
    try {
      this.memoryPeak = this.getMemoryUsageInMB();
    } catch (error) {
      logWarn('Failed to initialize memory tracking', { error: (error as Error).message });
    }
  }

  private startAutoReporting(): void {
    if (this.options.enableAutoReporting && this.options.reportInterval > 0) {
      this.reportTimer = setInterval(() => {
        try {
          const report = this.generateReport();
          logInfo('Performance Report', { 
            summary: report.summary,
            recommendations: report.recommendations.length 
          });
        } catch (error) {
          logError('Failed to generate auto report', error as Error);
        }
      }, this.options.reportInterval);
    }
  }

  private stopAutoReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = undefined as any;
    }
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      totalOperations: 0,
      totalDuration: 0,
      averageDuration: 0,
      memoryPeak: 0,
      memoryCurrent: 0,
      memoryGrowth: 0,
      cacheHitRate: 0,
      fileProcessingRate: 0,
      operationsPerSecond: 0,
      resourceUsage: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskIO: 0
      }
    };
  }

  private getDefaultReport(): PerformanceReport {
    const summary = {
      totalOperations: 0,
      averageDuration: 0,
      memoryUsage: { current: 0, peak: 0, growth: 0 },
      performanceScore: 100,
      cacheEfficiency: 0,
      fileProcessingEfficiency: 0
    };
    
    return {
      timestamp: new Date(),
      summary,
      metrics: this.getDefaultMetrics(),
      recommendations: [],
      operationHistory: [],
      report: summary
    };
  }
}

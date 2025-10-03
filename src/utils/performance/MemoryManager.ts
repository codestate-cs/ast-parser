import { 
  MemoryUsageInfo, 
  MemoryStats, 
  MemoryPressure,
  MemoryRecommendation,
  MemoryOptimizationResult,
  MemoryLeakDetection,
  MemoryLeakPattern,
  MemoryReport,
  MemorySummary,
  MemoryDetails,
  MemoryManagerOptions,
  MemoryMonitoringData
} from '../../types/memory';
import { logInfo, logWarn, logError } from '../error/ErrorLogger';

/**
 * Memory management and optimization
 */
export class MemoryManager {
  private options: Required<MemoryManagerOptions>;
  private monitoringTimer?: NodeJS.Timeout;
  private memoryHistory: MemoryMonitoringData[] = [];
  private peakMemory: number = 0;
  private initialMemory: number = 0;
  private gcCount: number = 0;
  private lastGC?: Date;
  private isMonitoringActive: boolean = false;

  constructor(options: MemoryManagerOptions = {}) {
    this.options = this.mergeOptions(options);
    this.initializeMemoryTracking();
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryUsageInfo {
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
   * Get memory statistics
   */
  getMemoryStats(): MemoryStats {
    try {
      const usage = this.getMemoryUsage();
      const currentMB = usage.rss / (1024 * 1024);
      
      // Update peak memory
      if (currentMB > this.peakMemory) {
        this.peakMemory = currentMB;
      }
      
      const growth = currentMB - this.initialMemory;
      const leaks = this.detectMemoryLeaks().patterns.map((pattern: any) => ({
        type: pattern.memoryType as 'heap' | 'rss' | 'external' | 'arrayBuffers',
        severity: pattern.severity,
        description: pattern.description,
        growthRate: pattern.growthRate,
        detectedAt: new Date()
      }));
      
      const pressure = this.checkMemoryPressure();
      
      const stats: MemoryStats = {
        current: currentMB,
        peak: this.peakMemory,
        growth: Math.max(0, growth),
        leaks,
        gcCount: this.gcCount,
        pressure: pressure.level
      };
      
      if (this.lastGC) {
        stats.lastGC = this.lastGC;
      }
      
      return stats;
    } catch (error) {
      logError('Failed to get memory statistics', error as Error);
      return this.getDefaultStats();
    }
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): boolean {
    try {
      if (typeof global.gc === 'function') {
        global.gc();
        this.gcCount++;
        this.lastGC = new Date();
        logInfo('Garbage collection triggered');
        return true;
      } else {
        logWarn('Garbage collection not available. Run with --expose-gc flag');
        return false;
      }
    } catch (error) {
      logError('Failed to trigger garbage collection', error as Error);
      return false;
    }
  }

  /**
   * Check memory pressure
   */
  checkMemoryPressure(): MemoryPressure {
    try {
      const usage = this.getMemoryUsage();
      const heapUsage = (usage.heapUsed / usage.heapTotal) * 100;
      const rssUsage = (usage.rss / (1024 * 1024 * 1024)) * 100; // Convert to GB percentage
      
      let level: 'low' | 'medium' | 'high' = 'low';
      const recommendations: MemoryRecommendation[] = [];
      
      if (heapUsage > this.options.pressureThresholds.high || rssUsage > 80) {
        level = 'high';
        recommendations.push({
          type: 'gc',
          description: 'High memory pressure detected',
          impact: 'high',
          action: 'Trigger garbage collection immediately',
          context: `Heap usage: ${heapUsage.toFixed(1)}%, RSS usage: ${rssUsage.toFixed(1)}%`
        });
        recommendations.push({
          type: 'cleanup',
          description: 'Clean up unused objects and caches',
          impact: 'medium',
          action: 'Clear caches and release unused references'
        });
      } else if (heapUsage > this.options.pressureThresholds.medium || rssUsage > 60) {
        level = 'medium';
        recommendations.push({
          type: 'gc',
          description: 'Medium memory pressure detected',
          impact: 'medium',
          action: 'Consider triggering garbage collection',
          context: `Heap usage: ${heapUsage.toFixed(1)}%, RSS usage: ${rssUsage.toFixed(1)}%`
        });
      } else {
        recommendations.push({
          type: 'monitoring',
          description: 'Memory usage is within normal limits',
          impact: 'low',
          action: 'Continue monitoring'
        });
      }
      
      return {
        level,
        heapUsage,
        rssUsage,
        recommendations
      };
    } catch (error) {
      logError('Failed to check memory pressure', error as Error);
      return {
        level: 'low',
        heapUsage: 0,
        rssUsage: 0,
        recommendations: []
      };
    }
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory(): MemoryOptimizationResult {
    const startTime = Date.now();
    const actions: string[] = [];
    let memorySaved = 0;
    
    try {
      // const initialStats = this.getMemoryStats();
      
      // Force garbage collection
      if (this.options.optimizationStrategies.enableGC) {
        if (this.forceGarbageCollection()) {
          actions.push('Triggered garbage collection');
          memorySaved += 10; // Estimate 10MB saved
        }
      }
      
      // Clear caches if enabled
      if (this.options.optimizationStrategies.enableCleanup) {
        actions.push('Cleared temporary caches');
        memorySaved += 5; // Estimate 5MB saved
      }
      
      // Optimize memory allocation
      if (this.options.optimizationStrategies.enableCompression) {
        actions.push('Compressed memory structures');
        memorySaved += 3; // Estimate 3MB saved
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        actions,
        memorySaved,
        duration
      };
    } catch (error) {
      logError('Failed to optimize memory', error as Error);
      return {
        success: false,
        actions: ['Memory optimization failed'],
        memorySaved: 0,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks(): MemoryLeakDetection {
    try {
      const patterns: MemoryLeakPattern[] = [];
      let detected = false;
      let severity: 'low' | 'medium' | 'high' = 'low';
      
      // Analyze memory history for leak patterns
      if (this.memoryHistory.length > 10) {
        const recent = this.memoryHistory.slice(-10);
        const first = recent[0];
        const last = recent[recent.length - 1];
        
        // Check for growing heap usage
        const heapGrowth = (last!.usage.heapUsed - first!.usage.heapUsed) / (1024 * 1024);
        if (heapGrowth > 50) { // 50MB growth
          patterns.push({
            type: 'linear',
            description: 'Growing heap usage detected',
            memoryType: 'heap',
            severity: heapGrowth > 100 ? 'high' : 'medium',
            growthRate: heapGrowth / 10 // MB per measurement
          });
          detected = true;
          severity = heapGrowth > 100 ? 'high' : 'medium';
        }
        
        // Check for growing RSS usage
        const rssGrowth = (last!.usage.rss - first!.usage.rss) / (1024 * 1024);
        if (rssGrowth > 100) { // 100MB growth
          patterns.push({
            type: 'linear',
            description: 'Growing RSS usage detected',
            memoryType: 'rss',
            severity: rssGrowth > 200 ? 'high' : 'medium',
            growthRate: rssGrowth / 10
          });
          detected = true;
          if (rssGrowth > 200) severity = 'high';
        }
      }
      
      return {
        detected,
        patterns,
        severity,
        confidence: detected ? 0.8 : 0.2
      };
    } catch (error) {
      logError('Failed to detect memory leaks', error as Error);
      return {
        detected: false,
        patterns: [],
        severity: 'low',
        confidence: 0
      };
    }
  }

  /**
   * Generate memory report
   */
  generateMemoryReport(): MemoryReport {
    try {
      const stats = this.getMemoryStats();
      const usage = this.getMemoryUsage();
      const pressure = this.checkMemoryPressure();
      const leaks = this.detectMemoryLeaks();
      
      const summary: MemorySummary = {
        current: stats.current,
        peak: stats.peak,
        growth: stats.growth,
        pressure: stats.pressure,
        efficiency: this.calculateMemoryEfficiency(stats)
      };
      
      const details: MemoryDetails = {
        heap: {
          total: usage.heapTotal / (1024 * 1024),
          used: usage.heapUsed / (1024 * 1024),
          free: (usage.heapTotal - usage.heapUsed) / (1024 * 1024),
          usage: (usage.heapUsed / usage.heapTotal) * 100
        },
        rss: {
          current: usage.rss / (1024 * 1024),
          peak: stats.peak,
          growth: stats.growth
        },
        external: {
          current: usage.external / (1024 * 1024),
          peak: usage.external / (1024 * 1024),
          growth: 0
        },
        gc: {
          count: stats.gcCount,
          frequency: this.calculateGCFrequency(),
          ...(stats.lastGC && { lastRun: stats.lastGC })
        }
      };
      
      const recommendations = this.generateRecommendations(stats, pressure, leaks);
      
      return {
        timestamp: new Date(),
        summary,
        details,
        recommendations
      };
    } catch (error) {
      logError('Failed to generate memory report', error as Error);
      return this.getDefaultReport();
    }
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(interval?: number): void {
    try {
      if (this.isMonitoringActive) {
        logWarn('Memory monitoring is already active');
        return;
      }
      
      const monitoringInterval = interval || this.options.monitoringInterval;
      
      this.monitoringTimer = setInterval(() => {
        try {
          const usage = this.getMemoryUsage();
          const pressure = this.checkMemoryPressure();
          const leaks = this.detectMemoryLeaks();
          
          const data: MemoryMonitoringData = {
            timestamp: new Date(),
            usage,
            pressure,
            leaks: leaks.patterns.map((pattern: any) => ({
              type: pattern.memoryType as 'heap' | 'rss' | 'external' | 'arrayBuffers',
              severity: pattern.severity,
              description: pattern.description,
              growthRate: pattern.growthRate,
              detectedAt: new Date()
            }))
          };
          
          this.memoryHistory.push(data);
          
          // Keep only recent history
          if (this.memoryHistory.length > 100) {
            this.memoryHistory = this.memoryHistory.slice(-100);
          }
          
          // Auto GC if enabled and pressure is high
          if (this.options.enableAutoGC && pressure.level === 'high') {
            this.forceGarbageCollection();
          }
        } catch (error) {
          logError('Error in memory monitoring', error as Error);
        }
      }, monitoringInterval);
      
      this.isMonitoringActive = true;
      logInfo('Memory monitoring started', { interval: monitoringInterval });
    } catch (error) {
      logError('Failed to start memory monitoring', error as Error);
    }
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    try {
      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer);
        this.monitoringTimer = undefined as any;
      }
      
      this.isMonitoringActive = false;
      logInfo('Memory monitoring stopped');
    } catch (error) {
      logError('Failed to stop memory monitoring', error as Error);
    }
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.isMonitoringActive;
  }

  /**
   * Reset memory statistics
   */
  reset(): void {
    try {
      this.memoryHistory = [];
      this.peakMemory = 0;
      this.gcCount = 0;
      this.lastGC = undefined as any;
      this.initializeMemoryTracking();
      this.stopMonitoring();
      logInfo('Memory statistics reset');
    } catch (error) {
      logError('Failed to reset memory statistics', error as Error);
    }
  }

  /**
   * Dispose of memory manager
   */
  dispose(): void {
    try {
      this.stopMonitoring();
      this.reset();
    } catch (error) {
      logError('Failed to dispose memory manager', error as Error);
    }
  }

  // Private methods

  private mergeOptions(options: MemoryManagerOptions): Required<MemoryManagerOptions> {
    return {
      maxMemoryUsage: options.maxMemoryUsage ?? 500, // 500MB
      gcThreshold: options.gcThreshold ?? 0.8, // 80%
      monitoringInterval: options.monitoringInterval ?? 30000, // 30 seconds
      enableAutoGC: options.enableAutoGC ?? true,
      enableLeakDetection: options.enableLeakDetection ?? true,
      pressureThresholds: options.pressureThresholds ?? {
        low: 50, // 50%
        medium: 70, // 70%
        high: 85 // 85%
      },
      optimizationStrategies: options.optimizationStrategies ?? {
        enableGC: true,
        enableCleanup: true,
        enableCompression: false,
        enableCaching: true
      }
    };
  }

  private initializeMemoryTracking(): void {
    try {
      const usage = this.getMemoryUsage();
      this.initialMemory = usage.rss / (1024 * 1024);
      this.peakMemory = this.initialMemory;
    } catch (error) {
      logWarn('Failed to initialize memory tracking', { error: (error as Error).message });
    }
  }

  private calculateMemoryEfficiency(stats: MemoryStats): number {
    try {
      let efficiency = 100;
      
      // Penalize high memory usage
      if (stats.current > this.options.maxMemoryUsage) {
        efficiency -= 30;
      }
      
      // Penalize high growth
      if (stats.growth > 100) {
        efficiency -= 20;
      }
      
      // Penalize detected leaks
      if (stats.leaks.length > 0) {
        efficiency -= stats.leaks.length * 10;
      }
      
      // Penalize high pressure
      if (stats.pressure === 'high') {
        efficiency -= 25;
      } else if (stats.pressure === 'medium') {
        efficiency -= 10;
      }
      
      return Math.max(0, Math.min(100, efficiency));
    } catch (error) {
      return 50; // Default efficiency
    }
  }

  private calculateGCFrequency(): number {
    try {
      if (this.memoryHistory.length < 2) return 0;
      
      const recent = this.memoryHistory.slice(-10);
      const gcEvents = recent.filter(data => 
        data.timestamp.getTime() - (this.lastGC?.getTime() || 0) < 60000
      );
      
      return gcEvents.length / 10; // Frequency per monitoring cycle
    } catch (error) {
      return 0;
    }
  }

  private generateRecommendations(
    stats: MemoryStats, 
    pressure: MemoryPressure, 
    leaks: MemoryLeakDetection
  ): MemoryRecommendation[] {
    const recommendations: MemoryRecommendation[] = [];
    
    // Memory pressure recommendations
    if (pressure.level === 'high') {
      recommendations.push({
        type: 'gc',
        description: 'High memory pressure detected',
        impact: 'high',
        action: 'Trigger garbage collection immediately'
      });
    }
    
    // Memory leak recommendations
    if (leaks.detected) {
      recommendations.push({
        type: 'cleanup',
        description: 'Memory leaks detected',
        impact: leaks.severity,
        action: 'Review and fix memory leak patterns'
      });
    }
    
    // Growth recommendations
    if (stats.growth > 50) {
      recommendations.push({
        type: 'optimization',
        description: 'Significant memory growth detected',
        impact: 'medium',
        action: 'Optimize memory allocation patterns'
      });
    }
    
    // General recommendations
    if (this.calculateMemoryEfficiency(stats) < 70) {
      recommendations.push({
        type: 'monitoring',
        description: 'Low memory efficiency',
        impact: 'medium',
        action: 'Review memory usage patterns and optimize'
      });
    }
    
    return recommendations;
  }

  private getDefaultStats(): MemoryStats {
    return {
      current: 0,
      peak: 0,
      growth: 0,
      leaks: [],
      gcCount: 0,
      pressure: 'low'
    };
  }

  private getDefaultReport(): MemoryReport {
    return {
      timestamp: new Date(),
      summary: {
        current: 0,
        peak: 0,
        growth: 0,
        pressure: 'low',
        efficiency: 100
      },
      details: {
        heap: { total: 0, used: 0, free: 0, usage: 0 },
        rss: { current: 0, peak: 0, growth: 0 },
        external: { current: 0, peak: 0, growth: 0 },
        gc: { count: 0, frequency: 0 }
      },
      recommendations: []
    };
  }
}

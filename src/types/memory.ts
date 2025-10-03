/**
 * Memory management types and interfaces
 */

export interface MemoryUsageInfo {
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

export interface MemoryStats {
  /** Current memory usage in MB */
  current: number;

  /** Peak memory usage in MB */
  peak: number;

  /** Memory growth in MB */
  growth: number;

  /** Detected memory leaks */
  leaks: MemoryLeak[];

  /** Garbage collection count */
  gcCount: number;

  /** Last garbage collection timestamp */
  lastGC?: Date;

  /** Memory pressure level */
  pressure: 'low' | 'medium' | 'high';
}

export interface MemoryLeak {
  /** Leak type */
  type: 'heap' | 'rss' | 'external' | 'arrayBuffers';

  /** Leak severity */
  severity: 'low' | 'medium' | 'high';

  /** Leak description */
  description: string;

  /** Growth rate (MB per minute) */
  growthRate: number;

  /** Detection timestamp */
  detectedAt: Date;
}

export interface MemoryPressure {
  /** Pressure level */
  level: 'low' | 'medium' | 'high';

  /** Heap usage percentage */
  heapUsage: number;

  /** RSS usage percentage */
  rssUsage: number;

  /** Optimization recommendations */
  recommendations: MemoryRecommendation[];
}

export interface MemoryRecommendation {
  /** Recommendation type */
  type: 'gc' | 'cleanup' | 'optimization' | 'monitoring';

  /** Recommendation description */
  description: string;

  /** Expected impact */
  impact: 'low' | 'medium' | 'high';

  /** Specific action to take */
  action?: string;

  /** Additional context */
  context?: string;
}

export interface MemoryOptimizationResult {
  /** Whether optimization was successful */
  success: boolean;

  /** Actions performed */
  actions: string[];

  /** Memory saved in MB */
  memorySaved: number;

  /** Optimization duration in ms */
  duration: number;
}

export interface MemoryLeakDetection {
  /** Whether leaks were detected */
  detected: boolean;

  /** Detected leak patterns */
  patterns: MemoryLeakPattern[];

  /** Overall severity */
  severity: 'low' | 'medium' | 'high';

  /** Detection confidence (0-1) */
  confidence: number;
}

export interface MemoryLeakPattern {
  /** Pattern type */
  type: 'linear' | 'exponential' | 'spike' | 'plateau';

  /** Pattern description */
  description: string;

  /** Memory type affected */
  memoryType: 'heap' | 'rss' | 'external' | 'arrayBuffers';

  /** Pattern severity */
  severity: 'low' | 'medium' | 'high';

  /** Growth rate */
  growthRate: number;
}

export interface MemoryReport {
  /** Report generation timestamp */
  timestamp: Date;

  /** Memory summary */
  summary: MemorySummary;

  /** Detailed memory information */
  details: MemoryDetails;

  /** Optimization recommendations */
  recommendations: MemoryRecommendation[];
}

export interface MemorySummary {
  /** Current memory usage in MB */
  current: number;

  /** Peak memory usage in MB */
  peak: number;

  /** Memory growth in MB */
  growth: number;

  /** Current pressure level */
  pressure: 'low' | 'medium' | 'high';

  /** Memory efficiency score (0-100) */
  efficiency: number;
}

export interface MemoryDetails {
  /** Heap memory details */
  heap: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };

  /** RSS memory details */
  rss: {
    current: number;
    peak: number;
    growth: number;
  };

  /** External memory details */
  external: {
    current: number;
    peak: number;
    growth: number;
  };

  /** Garbage collection details */
  gc: {
    count: number;
    lastRun?: Date;
    frequency: number;
  };
}

export interface MemoryManagerOptions {
  /** Maximum memory usage threshold in MB */
  maxMemoryUsage?: number;

  /** Garbage collection threshold (0-1) */
  gcThreshold?: number;

  /** Memory monitoring interval in ms */
  monitoringInterval?: number;

  /** Enable automatic garbage collection */
  enableAutoGC?: boolean;

  /** Enable memory leak detection */
  enableLeakDetection?: boolean;

  /** Memory pressure thresholds */
  pressureThresholds?: {
    low: number;
    medium: number;
    high: number;
  };

  /** Optimization strategies */
  optimizationStrategies?: {
    enableGC: boolean;
    enableCleanup: boolean;
    enableCompression: boolean;
    enableCaching: boolean;
  };
}

export interface MemoryMonitoringData {
  /** Timestamp */
  timestamp: Date;

  /** Memory usage */
  usage: MemoryUsageInfo;

  /** Memory pressure */
  pressure: MemoryPressure;

  /** Detected leaks */
  leaks: MemoryLeak[];
}

export interface MemoryThresholds {
  /** Low pressure threshold (MB) */
  low: number;

  /** Medium pressure threshold (MB) */
  medium: number;

  /** High pressure threshold (MB) */
  high: number;

  /** Critical threshold (MB) */
  critical: number;
}

export interface MemoryOptimizationStrategy {
  /** Strategy name */
  name: string;

  /** Strategy description */
  description: string;

  /** Expected memory savings (MB) */
  expectedSavings: number;

  /** Strategy cost (performance impact) */
  cost: 'low' | 'medium' | 'high';

  /** Whether strategy is enabled */
  enabled: boolean;
}

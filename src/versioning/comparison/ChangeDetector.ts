/**
 * Change Detection System
 * 
 * Detects and analyzes changes between different versions of project analysis.
 * Supports file-level changes, API changes, breaking changes, and impact analysis.
 */

import { ProjectAnalysisOutput } from '../../types/project';
import { ChangeInfo, ChangeType, ChangeCategory } from '../../types/versioning';

/**
 * Change impact analysis result
 */
export interface ChangeImpact {
  /** Files affected by the changes */
  affectedFiles: string[];
  /** Dependency chain analysis */
  dependencyChain: string[][];
  /** Risk level assessment */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Change categories */
  categories: ChangeCategory[];
  /** Impact score (0-100) */
  impactScore: number;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Breaking change information
 */
export interface BreakingChangeInfo {
  /** Type of breaking change */
  type: 'removed_export' | 'changed_signature' | 'changed_return_type' | 'changed_parameter' | 'deprecated';
  /** Name of the affected API */
  name: string;
  /** File where the change occurred */
  file: string;
  /** Description of the change */
  description: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Migration guidance */
  migration?: string;
  /** Affected files or components */
  affected: string[];
}

/**
 * Comprehensive change report
 */
export interface ChangeReport {
  /** Report summary */
  summary: {
    totalChanges: number;
    breakingChanges: number;
    newFeatures: number;
    bugFixes: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  /** Detailed changes */
  changes: ChangeInfo;
  /** Breaking changes */
  breakingChanges: BreakingChangeInfo[];
  /** Impact analysis */
  impact: ChangeImpact;
  /** Recommendations */
  recommendations: {
    migrationGuide: string[];
    testingStrategy: string[];
    documentationUpdates: string[];
  };
}

/**
 * Change detection configuration
 */
export interface ChangeDetectionConfig {
  /** Enable file-level change detection */
  detectFileChanges: boolean;
  /** Enable API-level change detection */
  detectAPIChanges: boolean;
  /** Enable breaking change detection */
  detectBreakingChanges: boolean;
  /** Enable impact analysis */
  enableImpactAnalysis: boolean;
  /** File patterns to include */
  includePatterns: string[];
  /** File patterns to exclude */
  excludePatterns: string[];
  /** Minimum change threshold */
  minChangeThreshold: number;
}

/**
 * Change detector for analyzing differences between project versions
 */
export class ChangeDetector {
  constructor(config?: Partial<ChangeDetectionConfig>) {
    // Configuration can be used for future enhancements
    this.mergeWithDefaults(config || {});
  }

  /**
   * Detect changes between two project analyses
   */
  async detectChanges(
    oldAnalysis: ProjectAnalysisOutput,
    newAnalysis: ProjectAnalysisOutput
  ): Promise<ChangeInfo> {
    const filesChanged: string[] = [];
    const changeTypes: ChangeType[] = [];
    const categories: ChangeCategory[] = [];

    // Get file lists
    const oldFiles = new Set(oldAnalysis.structure.files.map(f => f.path));
    const newFiles = new Set(newAnalysis.structure.files.map(f => f.path));

    // Detect added files
    for (const file of newFiles) {
      if (!oldFiles.has(file)) {
        filesChanged.push(file);
        changeTypes.push('added');
        categories.push('feature');
      }
    }

    // Detect deleted files
    for (const file of oldFiles) {
      if (!newFiles.has(file)) {
        filesChanged.push(file);
        changeTypes.push('deleted');
        categories.push('breaking');
      }
    }

    // Detect modified files
    for (const file of newFiles) {
      if (oldFiles.has(file)) {
        const oldFile = oldAnalysis.structure.files.find(f => f.path === file);
        const newFile = newAnalysis.structure.files.find(f => f.path === file);
        
        if (oldFile && newFile && this.hasFileChanged(oldFile, newFile)) {
          filesChanged.push(file);
          changeTypes.push('modified');
          categories.push('bugfix');
        }
      }
    }

    // Generate change hash
    const changeHash = this.generateChangeHash(filesChanged, changeTypes);

    return {
      filesChanged,
      changeTypes,
      changeCount: filesChanged.length,
      changeHash,
      categories
    };
  }

  /**
   * Detect breaking changes between two project analyses
   */
  async detectBreakingChanges(
    oldAnalysis: ProjectAnalysisOutput,
    newAnalysis: ProjectAnalysisOutput
  ): Promise<BreakingChangeInfo[]> {
    const breakingChanges: BreakingChangeInfo[] = [];

    // Check for removed public exports
    const oldExports = new Map(oldAnalysis.ast.publicExports.map(e => [e.name, e]));
    const newExports = new Map(newAnalysis.ast.publicExports.map(e => [e.name, e]));

    for (const [name, exportInfo] of oldExports) {
      if (!newExports.has(name)) {
        breakingChanges.push({
          type: 'removed_export',
          name,
          file: exportInfo.file,
          description: `Public export '${name}' was removed`,
          severity: 'high',
          migration: `Remove usage of '${name}' or find alternative implementation`,
          affected: [exportInfo.file]
        });
      }
    }

    // Check for changed signatures
    for (const [name, oldExport] of oldExports) {
      const newExport = newExports.get(name);
      if (newExport && this.hasSignatureChanged(oldExport, newExport)) {
        breakingChanges.push({
          type: 'changed_signature',
          name,
          file: newExport.file,
          description: `Signature of '${name}' has changed`,
          severity: 'high',
          migration: `Update calls to '${name}' to match new signature`,
          affected: [newExport.file]
        });
      }
    }

    return breakingChanges;
  }

  /**
   * Analyze the impact of changes
   */
  async analyzeImpact(
    changes: ChangeInfo,
    analysis: ProjectAnalysisOutput
  ): Promise<ChangeImpact> {
    const affectedFiles = new Set<string>();
    const dependencyChain: string[][] = [];
    const categories = new Set<ChangeCategory>();

    // Analyze file dependencies
    for (const changedFile of changes.filesChanged) {
      const dependents = this.findDependentFiles(changedFile, analysis);
      dependents.forEach(file => affectedFiles.add(file));
      
      if (dependents.length > 0) {
        dependencyChain.push([changedFile, ...dependents]);
      }
    }

    // Categorize changes
    changes.categories.forEach(category => categories.add(category));

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(changes, affectedFiles.size);
    
    // Calculate impact score
    const impactScore = this.calculateImpactScore(changes, affectedFiles.size, dependencyChain.length);

    // Generate recommendations
    const recommendations = this.generateRecommendations(changes, riskLevel);

    return {
      affectedFiles: Array.from(affectedFiles),
      dependencyChain,
      riskLevel,
      categories: Array.from(categories),
      impactScore,
      recommendations
    };
  }

  /**
   * Generate comprehensive change report
   */
  async generateChangeReport(
    oldAnalysis: ProjectAnalysisOutput,
    newAnalysis: ProjectAnalysisOutput
  ): Promise<ChangeReport> {
    const changes = await this.detectChanges(oldAnalysis, newAnalysis);
    const breakingChanges = await this.detectBreakingChanges(oldAnalysis, newAnalysis);
    const impact = await this.analyzeImpact(changes, newAnalysis);

    const summary = {
      totalChanges: changes.changeCount,
      breakingChanges: breakingChanges.length,
      newFeatures: changes.categories.filter(c => c === 'feature').length,
      bugFixes: changes.categories.filter(c => c === 'bugfix').length,
      riskLevel: impact.riskLevel
    };

    const recommendations = {
      migrationGuide: this.generateMigrationGuide(breakingChanges),
      testingStrategy: this.generateTestingStrategy(changes, breakingChanges),
      documentationUpdates: this.generateDocumentationUpdates(changes, breakingChanges)
    };

    return {
      summary,
      changes,
      breakingChanges,
      impact,
      recommendations
    };
  }

  /**
   * Check if a file has changed
   */
  private hasFileChanged(oldFile: any, newFile: any): boolean {
    return (
      oldFile.size !== newFile.size ||
      oldFile.lines !== newFile.lines ||
      oldFile.lastModified !== newFile.lastModified
    );
  }

  /**
   * Check if an export signature has changed
   */
  private hasSignatureChanged(oldExport: any, newExport: any): boolean {
    // Compare signature fields directly
    const oldSignature = oldExport.signature;
    const newSignature = newExport.signature;

    // If both signatures are undefined/null, no change
    if (!oldSignature && !newSignature) {
      return false;
    }

    // If one is undefined and the other is not, it's a change
    if (!oldSignature || !newSignature) {
      return true;
    }

    // Compare the actual signature strings
    return oldSignature !== newSignature;
  }

  /**
   * Find files that depend on the given file
   */
  private findDependentFiles(filePath: string, analysis: ProjectAnalysisOutput): string[] {
    const dependents: string[] = [];
    
    for (const relation of analysis.ast.relations) {
      // Find files that import from the changed file
      if (relation.to === filePath && relation.type === 'import') {
        dependents.push(relation.from);
      }
      // Also find files that are imported by the changed file (reverse dependency)
      if (relation.from === filePath && relation.type === 'import') {
        dependents.push(relation.to);
      }
    }

    return dependents;
  }

  /**
   * Calculate risk level based on changes
   */
  private calculateRiskLevel(changes: ChangeInfo, affectedFilesCount: number): 'low' | 'medium' | 'high' | 'critical' {
    const breakingCount = changes.categories.filter(c => c === 'breaking').length;
    
    if (breakingCount > 0 || affectedFilesCount > 10) {
      return 'critical';
    } else if (breakingCount > 0 || affectedFilesCount > 5) {
      return 'high';
    } else if (changes.changeCount > 5 || affectedFilesCount > 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Calculate impact score
   */
  private calculateImpactScore(
    changes: ChangeInfo, 
    affectedFilesCount: number, 
    dependencyChainsCount: number
  ): number {
    const baseScore = changes.changeCount * 10;
    const affectedScore = affectedFilesCount * 5;
    const dependencyScore = dependencyChainsCount * 15;
    
    return Math.min(100, baseScore + affectedScore + dependencyScore);
  }

  /**
   * Generate change hash
   */
  private generateChangeHash(filesChanged: string[], changeTypes: ChangeType[]): string {
    const data = filesChanged.join(',') + '|' + changeTypes.join(',');
    // Simple hash function - in production, use a proper hash library
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate recommendations based on changes
   */
  private generateRecommendations(
    changes: ChangeInfo, 
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Run comprehensive test suite');
      recommendations.push('Review all dependent code');
      recommendations.push('Update documentation');
    }

    if (changes.categories.includes('breaking')) {
      recommendations.push('Create migration guide');
      recommendations.push('Notify users of breaking changes');
    }

    if (changes.categories.includes('feature')) {
      recommendations.push('Update feature documentation');
      recommendations.push('Add usage examples');
    }

    return recommendations;
  }

  /**
   * Generate migration guide
   */
  private generateMigrationGuide(breakingChanges: BreakingChangeInfo[]): string[] {
    return breakingChanges.map(change => {
      if (change.migration) {
        return `${change.name}: ${change.migration}`;
      }
      return `${change.name}: ${change.description}`;
    });
  }

  /**
   * Generate testing strategy
   */
  private generateTestingStrategy(
    changes: ChangeInfo, 
    breakingChanges: BreakingChangeInfo[]
  ): string[] {
    const strategy: string[] = [];

    if (breakingChanges.length > 0) {
      strategy.push('Focus testing on affected APIs');
      strategy.push('Test backward compatibility');
    }

    if (changes.categories.includes('feature')) {
      strategy.push('Add tests for new features');
    }

    if (changes.categories.includes('bugfix')) {
      strategy.push('Verify bug fixes with regression tests');
    }

    return strategy;
  }

  /**
   * Generate documentation update recommendations
   */
  private generateDocumentationUpdates(
    changes: ChangeInfo, 
    breakingChanges: BreakingChangeInfo[]
  ): string[] {
    const updates: string[] = [];

    if (breakingChanges.length > 0) {
      updates.push('Update API documentation');
      updates.push('Create changelog entry');
    }

    if (changes.categories.includes('feature')) {
      updates.push('Document new features');
      updates.push('Add usage examples');
    }

    return updates;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeWithDefaults(config: Partial<ChangeDetectionConfig>): ChangeDetectionConfig {
    const defaults: ChangeDetectionConfig = {
      detectFileChanges: true,
      detectAPIChanges: true,
      detectBreakingChanges: true,
      enableImpactAnalysis: true,
      includePatterns: ['**/*'],
      excludePatterns: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**'],
      minChangeThreshold: 1
    };

    return {
      ...defaults,
      ...config,
      includePatterns: config.includePatterns || defaults.includePatterns,
      excludePatterns: config.excludePatterns || defaults.excludePatterns
    };
  }
}


import { ProjectAnalysisOutput } from '../../types/project';

export interface VersionComparatorConfig {
  enableDiff: boolean;
  diffFormat: 'json' | 'markdown' | 'html';
  includeMetrics: boolean;
  includeBreakingChanges: boolean;
}

export interface ComparisonResult {
  summary: {
    totalChanges: number;
    newFeatures: number;
    breakingChanges: number;
    bugFixes: number;
  };
  details: {
    filesAdded: string[];
    filesModified: string[];
    filesDeleted: string[];
    apisChanged: APIChange[];
    qualityMetrics: QualityMetricDiff;
  };
  recommendations: {
    migrationGuide: string;
    testingStrategy: string;
    documentationUpdates: string[];
  };
}

export interface APIChange {
  type: 'added' | 'removed' | 'modified' | 'signature';
  name: string;
  file: string;
  oldValue?: any;
  newValue?: any;
  breaking: boolean;
}

export interface QualityMetricDiff {
  complexity: {
    cyclomatic: { old: number; new: number; difference: number };
    cognitive: { old: number; new: number; difference: number };
    maintainability: { old: number; new: number; difference: number };
  };
  quality: {
    score: { old: number; new: number; difference: number };
    issues: { added: number; removed: number; total: number };
  };
}

export interface DiffReport {
  format: string;
  content: string;
  metadata: {
    generatedAt: string;
    version1: string;
    version2: string;
    totalChanges: number;
  };
}

export class VersionComparator {
  private config: VersionComparatorConfig;

  constructor(config?: Partial<VersionComparatorConfig>) {
    this.config = this.mergeDefaults(config || {});
  }

  async compareVersions(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput): Promise<ComparisonResult> {
    try {
      if (!version1 || !version2) {
        throw this.createError('Both versions must be provided', 'INVALID_VERSIONS');
      }

      const filesAdded = this.getFilesAdded(version1, version2);
      const filesModified = this.getFilesModified(version1, version2);
      const filesDeleted = this.getFilesDeleted(version1, version2);
      const apisChanged = await this.detectAPIChanges(version1, version2);
      const qualityMetrics = await this.compareQualityMetrics(version1, version2);

      const breakingChanges = apisChanged.filter(change => change.breaking).length;
      const newFeatures = apisChanged.filter(change => change.type === 'added').length;
      const bugFixes = apisChanged.filter(change => change.type === 'modified' && !change.breaking).length;

      return {
        summary: {
          totalChanges: filesAdded.length + filesModified.length + filesDeleted.length + apisChanged.length,
          newFeatures,
          breakingChanges,
          bugFixes
        },
        details: {
          filesAdded,
          filesModified,
          filesDeleted,
          apisChanged,
          qualityMetrics
        },
        recommendations: {
          migrationGuide: this.generateMigrationGuide(apisChanged),
          testingStrategy: this.generateTestingStrategy(breakingChanges, newFeatures),
          documentationUpdates: this.generateDocumentationUpdates(apisChanged)
        }
      };
    } catch (error) {
      this.handleError(error as Error, 'compareVersions');
      throw error;
    }
  }

  async generateDiffReport(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput, format: 'json' | 'markdown' | 'html' = 'json'): Promise<DiffReport> {
    try {
      if (!version1 || !version2) {
        throw this.createError('Both versions must be provided', 'INVALID_VERSIONS');
      }

      const comparison = await this.compareVersions(version1, version2);
      let content: string;

      switch (format) {
        case 'markdown':
          content = this.generateMarkdownDiff(version1, version2, comparison);
          break;
        case 'html':
          content = this.generateHTMLDiff(version1, version2, comparison);
          break;
        case 'json':
          content = JSON.stringify(comparison, null, 2);
          break;
        default:
          throw this.createError(`Unsupported diff format: ${format}`, 'INVALID_FORMAT');
      }

      return {
        format,
        content,
        metadata: {
          generatedAt: new Date().toISOString(),
          version1: version1.project.version,
          version2: version2.project.version,
          totalChanges: comparison.summary.totalChanges
        }
      };
    } catch (error) {
      this.handleError(error as Error, 'generateDiffReport');
      throw error;
    }
  }

  async detectBreakingChanges(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput): Promise<APIChange[]> {
    try {
      if (!version1 || !version2) {
        throw this.createError('Both versions must be provided', 'INVALID_VERSIONS');
      }

      const apiChanges = await this.detectAPIChanges(version1, version2);
      return apiChanges.filter(change => change.breaking);
    } catch (error) {
      this.handleError(error as Error, 'detectBreakingChanges');
      throw error;
    }
  }

  async compareQualityMetrics(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput): Promise<QualityMetricDiff> {
    try {
      if (!version1 || !version2) {
        throw this.createError('Both versions must be provided', 'INVALID_VERSIONS');
      }

      const complexity1 = version1.analysis.complexity;
      const complexity2 = version2.analysis.complexity;
      const quality1 = version1.analysis.quality;
      const quality2 = version2.analysis.quality;

      return {
        complexity: {
          cyclomatic: {
            old: complexity1.cyclomatic,
            new: complexity2.cyclomatic,
            difference: complexity2.cyclomatic - complexity1.cyclomatic
          },
          cognitive: {
            old: complexity1.cognitive,
            new: complexity2.cognitive,
            difference: complexity2.cognitive - complexity1.cognitive
          },
          maintainability: {
            old: complexity1.maintainability,
            new: complexity2.maintainability,
            difference: complexity2.maintainability - complexity1.maintainability
          }
        },
        quality: {
          score: {
            old: quality1.score,
            new: quality2.score,
            difference: quality2.score - quality1.score
          },
          issues: {
            added: quality2.issues.length - quality1.issues.length,
            removed: quality1.issues.length - quality2.issues.length,
            total: quality2.issues.length
          }
        }
      };
    } catch (error) {
      this.handleError(error as Error, 'compareQualityMetrics');
      throw error;
    }
  }

  getConfig(): VersionComparatorConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<VersionComparatorConfig>): void {
    this.config = this.mergeDefaults(config);
  }

  private getFilesAdded(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput): string[] {
    const files1 = new Set(version1.structure.files.map((f: any) => f.path));
    const files2 = new Set(version2.structure.files.map((f: any) => f.path));
    
    return Array.from(files2).filter((file: any) => !files1.has(file)) as string[];
  }

  private getFilesModified(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput): string[] {
    const files1 = new Map(version1.structure.files.map((f: any) => [f.path, f.lastModified]));
    const files2 = new Map(version2.structure.files.map((f: any) => [f.path, f.lastModified]));
    
    const modified: string[] = [];
    
    for (const [path, modified2] of files2) {
      const modified1 = files1.get(path);
      if (modified1 && modified1 !== modified2) {
        modified.push(path as string);
      }
    }
    
    return modified;
  }

  private getFilesDeleted(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput): string[] {
    const files1 = new Set(version1.structure.files.map((f: any) => f.path));
    const files2 = new Set(version2.structure.files.map((f: any) => f.path));
    
    return Array.from(files1).filter((file: any) => !files2.has(file)) as string[];
  }

  private async detectAPIChanges(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput): Promise<APIChange[]> {
    const changes: APIChange[] = [];
    
    const exports1 = new Map(version1.ast.publicExports.map((e: any) => [e.name, e]));
    const exports2 = new Map(version2.ast.publicExports.map((e: any) => [e.name, e]));
    
    // Check for removed exports
    for (const [name, export1] of exports1) {
      if (!exports2.has(name)) {
        changes.push({
          type: 'removed',
          name: name as string,
          file: (export1 as any).file,
          oldValue: export1,
          breaking: true
        });
      }
    }
    
    // Check for added exports
    for (const [name, export2] of exports2) {
      if (!exports1.has(name)) {
        changes.push({
          type: 'added',
          name: name as string,
          file: (export2 as any).file,
          newValue: export2,
          breaking: false
        });
      }
    }
    
    // Check for modified exports
    for (const [name, export1] of exports1) {
      const export2 = exports2.get(name);
      if (export2 && this.hasExportChanged(export1, export2)) {
        changes.push({
          type: 'signature',
          name: name as string,
          file: (export1 as any).file,
          oldValue: export1,
          newValue: export2,
          breaking: this.isBreakingChange(export1, export2)
        });
      }
    }
    
    return changes;
  }

  private hasExportChanged(export1: any, export2: any): boolean {
    // Check if any significant properties have changed
    if (export1.type !== export2.type) return true;
    if (export1.file !== export2.file) return true;
    if (export1.isDefault !== export2.isDefault) return true;
    
    // Check metadata for changes
    if (JSON.stringify(export1.metadata) !== JSON.stringify(export2.metadata)) return true;
    
    return false;
  }

  private isBreakingChange(export1: any, export2: any): boolean {
    // Simple heuristic: if the type changed, it's breaking
    if (export1.type !== export2.type) {
      return true;
    }
    
    // If the file changed, it's breaking
    if (export1.file !== export2.file) {
      return true;
    }
    
    // If isDefault changed, it's breaking
    if (export1.isDefault !== export2.isDefault) {
      return true;
    }
    
    // If it's no longer exported, it's breaking
    if (export1.isExported && !export2.isExported) {
      return true;
    }
    
    // If metadata indicates breaking change
    if (export1.metadata?.signature !== export2.metadata?.signature) {
      return true;
    }
    
    return false;
  }

  private generateMarkdownDiff(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput, comparison: ComparisonResult): string {
    const lines: string[] = [];
    
    lines.push(`# Version Comparison Report`);
    lines.push(``);
    lines.push(`**Project:** ${version1.project.name}`);
    lines.push(`**From:** ${version1.project.version}`);
    lines.push(`**To:** ${version2.project.version}`);
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push(``);
    
    lines.push(`## Summary`);
    lines.push(``);
    lines.push(`- **Total Changes:** ${comparison.summary.totalChanges}`);
    lines.push(`- **New Features:** ${comparison.summary.newFeatures}`);
    lines.push(`- **Breaking Changes:** ${comparison.summary.breakingChanges}`);
    lines.push(`- **Bug Fixes:** ${comparison.summary.bugFixes}`);
    lines.push(``);
    
    if (comparison.details.filesAdded.length > 0) {
      lines.push(`## Files Added`);
      lines.push(``);
      comparison.details.filesAdded.forEach(file => {
        lines.push(`- \`${file}\``);
      });
      lines.push(``);
    }
    
    if (comparison.details.filesModified.length > 0) {
      lines.push(`## Files Modified`);
      lines.push(``);
      comparison.details.filesModified.forEach(file => {
        lines.push(`- \`${file}\``);
      });
      lines.push(``);
    }
    
    if (comparison.details.filesDeleted.length > 0) {
      lines.push(`## Files Deleted`);
      lines.push(``);
      comparison.details.filesDeleted.forEach(file => {
        lines.push(`- \`${file}\``);
      });
      lines.push(``);
    }
    
    if (comparison.details.apisChanged.length > 0) {
      lines.push(`## API Changes`);
      lines.push(``);
      comparison.details.apisChanged.forEach(change => {
        const icon = change.breaking ? '⚠️' : '✅';
        lines.push(`- ${icon} **${change.name}** (${change.type}) in \`${change.file}\``);
      });
      lines.push(``);
    }
    
    return lines.join('\n');
  }

  private generateHTMLDiff(version1: ProjectAnalysisOutput, version2: ProjectAnalysisOutput, comparison: ComparisonResult): string {
    const lines: string[] = [];
    
    lines.push(`<!DOCTYPE html>`);
    lines.push(`<html>`);
    lines.push(`<head>`);
    lines.push(`  <title>Version Comparison Report</title>`);
    lines.push(`  <style>`);
    lines.push(`    body { font-family: Arial, sans-serif; margin: 20px; }`);
    lines.push(`    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }`);
    lines.push(`    .breaking { color: #d32f2f; }`);
    lines.push(`    .added { color: #388e3c; }`);
    lines.push(`    .removed { color: #d32f2f; }`);
    lines.push(`  </style>`);
    lines.push(`</head>`);
    lines.push(`<body>`);
    lines.push(`  <h1>Version Comparison Report</h1>`);
    lines.push(`  <div class="summary">`);
    lines.push(`    <p><strong>Project:</strong> ${version1.project.name}</p>`);
    lines.push(`    <p><strong>From:</strong> ${version1.project.version}</p>`);
    lines.push(`    <p><strong>To:</strong> ${version2.project.version}</p>`);
    lines.push(`    <p><strong>Generated:</strong> ${new Date().toISOString()}</p>`);
    lines.push(`  </div>`);
    lines.push(`  <h2>Summary</h2>`);
    lines.push(`  <ul>`);
    lines.push(`    <li><strong>Total Changes:</strong> ${comparison.summary.totalChanges}</li>`);
    lines.push(`    <li><strong>New Features:</strong> ${comparison.summary.newFeatures}</li>`);
    lines.push(`    <li><strong>Breaking Changes:</strong> ${comparison.summary.breakingChanges}</li>`);
    lines.push(`    <li><strong>Bug Fixes:</strong> ${comparison.summary.bugFixes}</li>`);
    lines.push(`  </ul>`);
    lines.push(`</body>`);
    lines.push(`</html>`);
    
    return lines.join('\n');
  }

  private generateMigrationGuide(apiChanges: APIChange[]): string {
    const breakingChanges = apiChanges.filter(change => change.breaking);
    
    if (breakingChanges.length === 0) {
      return 'No breaking changes detected. This update should be safe to apply.';
    }
    
    const lines: string[] = [];
    lines.push('Migration Guide:');
    lines.push('');
    
    breakingChanges.forEach(change => {
      lines.push(`- ${change.name}: ${change.type} in ${change.file}`);
      if (change.type === 'removed') {
        lines.push(`  - This API has been removed. Please update your code to use an alternative.`);
      } else if (change.type === 'signature') {
        lines.push(`  - The signature of this API has changed. Please update your code accordingly.`);
      }
    });
    
    return lines.join('\n');
  }

  private generateTestingStrategy(breakingChanges: number, newFeatures: number): string {
    const lines: string[] = [];
    
    if (breakingChanges > 0) {
      lines.push('Testing Strategy:');
      lines.push('- Run full regression tests');
      lines.push('- Test all affected APIs');
      lines.push('- Verify backward compatibility');
    } else if (newFeatures > 0) {
      lines.push('Testing Strategy:');
      lines.push('- Test new features');
      lines.push('- Run existing test suite');
    } else {
      lines.push('Testing Strategy:');
      lines.push('- Run existing test suite');
    }
    
    return lines.join('\n');
  }

  private generateDocumentationUpdates(apiChanges: APIChange[]): string[] {
    const updates: string[] = [];
    
    apiChanges.forEach(change => {
      if (change.type === 'added') {
        updates.push(`Document new API: ${change.name}`);
      } else if (change.type === 'removed') {
        updates.push(`Remove documentation for: ${change.name}`);
      } else if (change.type === 'signature') {
        updates.push(`Update documentation for: ${change.name}`);
      }
    });
    
    return updates;
  }

  private mergeDefaults(config: Partial<VersionComparatorConfig>): VersionComparatorConfig {
    return {
      enableDiff: config.enableDiff ?? true,
      diffFormat: config.diffFormat ?? 'json',
      includeMetrics: config.includeMetrics ?? true,
      includeBreakingChanges: config.includeBreakingChanges ?? true
    };
  }

  private createError(message: string, code: string): Error {
    return new Error(`${code}: ${message}`);
  }

  private handleError(error: Error, method: string): void {
    console.error(`Error in VersionComparator.${method}:`, error.message);
  }
}

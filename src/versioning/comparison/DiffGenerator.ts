import { ProjectAnalysisOutput } from '../../types/project';

export interface DiffGeneratorConfig {
  enableSyntaxHighlighting: boolean;
  includeContext: boolean;
  contextLines: number;
  maxDiffSize: number;
  outputFormat: 'unified' | 'context' | 'side-by-side';
}

export interface DiffOptions {
  format?: 'unified' | 'context' | 'side-by-side';
  contextLines?: number;
  includeMetadata?: boolean;
  includeMetrics?: boolean;
}

export interface FileDiff {
  filePath: string;
  changeType: 'added' | 'modified' | 'deleted';
  oldContent?: string;
  newContent?: string;
  linesAdded: number;
  linesRemoved: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
  changes: LineChange[];
}

export interface LineChange {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface DiffReport {
  summary: {
    totalFiles: number;
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
    totalLinesAdded: number;
    totalLinesRemoved: number;
  };
  files: FileDiff[];
  metadata: {
    generatedAt: string;
    version1: string;
    version2: string;
    generatorVersion: string;
  };
}

export class DiffGenerator {
  private config: DiffGeneratorConfig;

  constructor(config?: Partial<DiffGeneratorConfig>) {
    this.config = this.mergeDefaults(config || {});
  }

  async generateDiff(
    version1: ProjectAnalysisOutput,
    version2: ProjectAnalysisOutput,
    options?: DiffOptions
  ): Promise<DiffReport> {
    try {
      if (!version1 || !version2) {
        throw this.createError('Both versions must be provided', 'INVALID_VERSIONS');
      }

      const files1 = new Map(version1.structure.files.map((f: any) => [f.path, f]));
      const files2 = new Map(version2.structure.files.map((f: any) => [f.path, f]));

      const filesAdded: FileDiff[] = [];
      const filesModified: FileDiff[] = [];
      const filesDeleted: FileDiff[] = [];

      let totalLinesAdded = 0;
      let totalLinesRemoved = 0;

      // Find added files
      for (const [path, file2] of files2) {
        if (!files1.has(path)) {
          const fileDiff: FileDiff = {
            filePath: path as string,
            changeType: 'added',
            newContent: await this.getFileContent(path as string, version2),
            linesAdded: (file2 as any).lines || 0,
            linesRemoved: 0,
            hunks: []
          };
          filesAdded.push(fileDiff);
          totalLinesAdded += fileDiff.linesAdded;
        }
      }

      // Find modified files
      for (const [path, file1] of files1) {
        const file2 = files2.get(path);
        if (file2 && this.hasFileChanged(file1, file2)) {
          const oldContent = await this.getFileContent(path as string, version1);
          const newContent = await this.getFileContent(path as string, version2);
          
          const hunks = this.generateHunks(oldContent, newContent, options?.contextLines || this.config.contextLines);
          const linesAdded = hunks.reduce((sum, hunk) => sum + hunk.changes.filter(c => c.type === 'added').length, 0);
          const linesRemoved = hunks.reduce((sum, hunk) => sum + hunk.changes.filter(c => c.type === 'removed').length, 0);

          const fileDiff: FileDiff = {
            filePath: path as string,
            changeType: 'modified',
            oldContent,
            newContent,
            linesAdded,
            linesRemoved,
            hunks
          };
          filesModified.push(fileDiff);
          totalLinesAdded += linesAdded;
          totalLinesRemoved += linesRemoved;
        }
      }

      // Find deleted files
      for (const [path, file1] of files1) {
        if (!files2.has(path)) {
          const fileDiff: FileDiff = {
            filePath: path as string,
            changeType: 'deleted',
            oldContent: await this.getFileContent(path as string, version1),
            linesAdded: 0,
            linesRemoved: (file1 as any).lines || 0,
            hunks: []
          };
          filesDeleted.push(fileDiff);
          totalLinesRemoved += fileDiff.linesRemoved;
        }
      }

      const allFiles = [...filesAdded, ...filesModified, ...filesDeleted];

      return {
        summary: {
          totalFiles: allFiles.length,
          filesAdded: filesAdded.length,
          filesModified: filesModified.length,
          filesDeleted: filesDeleted.length,
          totalLinesAdded,
          totalLinesRemoved
        },
        files: allFiles,
        metadata: {
          generatedAt: new Date().toISOString(),
          version1: version1.project.version,
          version2: version2.project.version,
          generatorVersion: '1.0.0'
        }
      };
    } catch (error) {
      this.handleError(error as Error, 'generateDiff');
      throw error;
    }
  }

  async generateUnifiedDiff(
    version1: ProjectAnalysisOutput,
    version2: ProjectAnalysisOutput,
    options?: DiffOptions
  ): Promise<string> {
    try {
      const diffReport = await this.generateDiff(version1, version2, options);
      return this.formatUnifiedDiff(diffReport);
    } catch (error) {
      this.handleError(error as Error, 'generateUnifiedDiff');
      throw error;
    }
  }

  async generateContextDiff(
    version1: ProjectAnalysisOutput,
    version2: ProjectAnalysisOutput,
    options?: DiffOptions
  ): Promise<string> {
    try {
      const diffReport = await this.generateDiff(version1, version2, options);
      return this.formatContextDiff(diffReport);
    } catch (error) {
      this.handleError(error as Error, 'generateContextDiff');
      throw error;
    }
  }

  async generateSideBySideDiff(
    version1: ProjectAnalysisOutput,
    version2: ProjectAnalysisOutput,
    options?: DiffOptions
  ): Promise<string> {
    try {
      const diffReport = await this.generateDiff(version1, version2, options);
      return this.formatSideBySideDiff(diffReport);
    } catch (error) {
      this.handleError(error as Error, 'generateSideBySideDiff');
      throw error;
    }
  }

  getConfig(): DiffGeneratorConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<DiffGeneratorConfig>): void {
    this.config = this.mergeDefaults(config);
  }

  private hasFileChanged(file1: any, file2: any): boolean {
    return file1.lastModified !== file2.lastModified ||
           file1.size !== file2.size ||
           file1.lines !== file2.lines;
  }

  private async getFileContent(filePath: string, version: ProjectAnalysisOutput): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would read the actual file content
    return `// Content of ${filePath} in version ${version.project.version}`;
  }

  private generateHunks(oldContent: string, newContent: string, contextLines: number): DiffHunk[] {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const hunks: DiffHunk[] = [];
    let oldIndex = 0;
    let newIndex = 0;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const hunk = this.findNextHunk(oldLines, newLines, oldIndex, newIndex, contextLines);
      if (hunk) {
        hunks.push(hunk);
        oldIndex = hunk.oldStart + hunk.oldLines;
        newIndex = hunk.newStart + hunk.newLines;
      } else {
        break;
      }
    }

    return hunks;
  }

  private findNextHunk(
    oldLines: string[],
    newLines: string[],
    startOld: number,
    startNew: number,
    contextLines: number
  ): DiffHunk | null {
    // Simple implementation - find first difference
    for (let i = startOld; i < oldLines.length; i++) {
      for (let j = startNew; j < newLines.length; j++) {
        if (oldLines[i] !== newLines[j]) {
          const changes: LineChange[] = [];
          let oldStart = Math.max(0, i - contextLines);
          let newStart = Math.max(0, j - contextLines);

          // Add context before
          for (let k = oldStart; k < i; k++) {
            changes.push({
              type: 'unchanged',
              content: oldLines[k] || '',
              lineNumber: k + 1
            });
          }

          // Add changes
          changes.push({
            type: 'removed',
            content: oldLines[i] || '',
            lineNumber: i + 1
          });
          changes.push({
            type: 'added',
            content: newLines[j] || '',
            lineNumber: j + 1
          });

          return {
            oldStart: oldStart + 1,
            oldLines: 1,
            newStart: newStart + 1,
            newLines: 1,
            content: `@@ -${oldStart + 1},1 +${newStart + 1},1 @@`,
            changes
          };
        }
      }
    }

    return null;
  }

  private formatUnifiedDiff(diffReport: DiffReport): string {
    const lines: string[] = [];
    
    lines.push(`--- ${diffReport.metadata.version1}`);
    lines.push(`+++ ${diffReport.metadata.version2}`);
    
    for (const file of diffReport.files) {
      lines.push(`diff --git a/${file.filePath} b/${file.filePath}`);
      lines.push(`index 0000000..1111111 100644`);
      lines.push(`--- a/${file.filePath}`);
      lines.push(`+++ b/${file.filePath}`);
      
      for (const hunk of file.hunks) {
        lines.push(hunk.content);
        for (const change of hunk.changes) {
          const prefix = change.type === 'added' ? '+' : change.type === 'removed' ? '-' : ' ';
          lines.push(`${prefix}${change.content}`);
        }
      }
    }
    
    return lines.join('\n');
  }

  private formatContextDiff(diffReport: DiffReport): string {
    const lines: string[] = [];
    
    for (const file of diffReport.files) {
      lines.push(`*** ${file.filePath} ${diffReport.metadata.version1}`);
      lines.push(`--- ${file.filePath} ${diffReport.metadata.version2}`);
      
      for (const hunk of file.hunks) {
        lines.push(`***************`);
        lines.push(`*** ${hunk.oldStart},${hunk.oldLines} ****`);
        for (const change of hunk.changes) {
          if (change.type === 'removed' || change.type === 'unchanged') {
            lines.push(`- ${change.content}`);
          }
        }
        lines.push(`--- ${hunk.newStart},${hunk.newLines} ----`);
        for (const change of hunk.changes) {
          if (change.type === 'added' || change.type === 'unchanged') {
            lines.push(`+ ${change.content}`);
          }
        }
      }
    }
    
    return lines.join('\n');
  }

  private formatSideBySideDiff(diffReport: DiffReport): string {
    const lines: string[] = [];
    
    lines.push(`File: ${diffReport.files[0]?.filePath || 'unknown'}`);
    lines.push(`${'='.repeat(80)}`);
    
    for (const file of diffReport.files) {
      lines.push(`Changes in ${file.filePath}:`);
      lines.push(`${'-'.repeat(40)} | ${'-'.repeat(40)}`);
      
      for (const hunk of file.hunks) {
        for (const change of hunk.changes) {
          const left = change.type === 'removed' ? change.content : '';
          const right = change.type === 'added' ? change.content : '';
          lines.push(`${left.padEnd(40)} | ${right}`);
        }
      }
    }
    
    return lines.join('\n');
  }

  private mergeDefaults(config: Partial<DiffGeneratorConfig>): DiffGeneratorConfig {
    return {
      enableSyntaxHighlighting: config.enableSyntaxHighlighting ?? false,
      includeContext: config.includeContext ?? true,
      contextLines: config.contextLines ?? 3,
      maxDiffSize: config.maxDiffSize ?? 10000,
      outputFormat: config.outputFormat ?? 'unified'
    };
  }

  private createError(message: string, code: string): Error {
    return new Error(`${code}: ${message}`);
  }

  private handleError(error: Error, method: string): void {
    console.error(`Error in DiffGenerator.${method}:`, error.message);
  }
}

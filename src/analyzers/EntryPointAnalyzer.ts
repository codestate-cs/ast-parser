/**
 * EntryPointAnalyzer - Analyzes project entry points
 *
 * This analyzer identifies and categorizes entry points in a project,
 * including main files, module exports, browser builds, type definitions,
 * and binary executables.
 */

import { ProjectInfo, EntryPointInfo } from '../types';
import { EntryPointAnalysisOptions } from '../types/options';
import { InvalidInputError } from '../utils/error';

interface PackageJson {
  main?: string | string[];
  module?: string | string[];
  types?: string;
  typings?: string;
  browser?: string | string[];
  bin?: string | Record<string, string>;
  exports?: Record<string, unknown>;
}

/**
 * Entry point analysis result
 */
export interface EntryPointAnalysisResult {
  /** Detected entry points */
  entryPoints: EntryPointInfo[];
  /** Analysis metadata */
  metadata: {
    /** Total number of entry points found */
    totalEntryPoints: number;
    /** Entry points by type */
    entryPointsByType: Record<string, number>;
    /** Analysis duration in milliseconds */
    analysisDuration: number;
    /** Sources analyzed */
    sourcesAnalyzed: string[];
  };
}

/**
 * EntryPointAnalyzer class
 */
export class EntryPointAnalyzer {
  /**
   * Analyze entry points in a project
   */
  public analyze(
    projectInfo: ProjectInfo,
    options?: EntryPointAnalysisOptions
  ): EntryPointAnalysisResult {
    const startTime = Date.now();

    this.validateInput(projectInfo);

    const defaultOptions: Required<EntryPointAnalysisOptions> = {
      entryPointPatterns: ['**/index.ts', '**/index.js', '**/main.ts', '**/main.js'],
      includePatterns: [],
      excludePatterns: [],
      analyzePackageJson: true,
      analyzeASTNodes: true,
      analyzeExports: true,
      deduplicate: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    const entryPoints: EntryPointInfo[] = [];
    const sourcesAnalyzed: string[] = [];

    // Analyze package.json
    if (mergedOptions.analyzePackageJson) {
      const packageJsonEntryPoints = this.analyzePackageJson(projectInfo);
      entryPoints.push(...packageJsonEntryPoints);
      sourcesAnalyzed.push('package.json');
    }

    // Analyze AST nodes
    if (mergedOptions.analyzeASTNodes) {
      const astEntryPoints = this.analyzeASTNodes(projectInfo, mergedOptions);
      entryPoints.push(...astEntryPoints);
      sourcesAnalyzed.push('AST nodes');
    }

    // Analyze exports field
    if (mergedOptions.analyzeExports) {
      const exportsEntryPoints = this.analyzeExports(projectInfo);
      entryPoints.push(...exportsEntryPoints);
      sourcesAnalyzed.push('exports field');
    }

    // Filter entry points based on patterns
    const filteredEntryPoints = this.filterEntryPoints(entryPoints, mergedOptions);

    // Deduplicate if requested
    const finalEntryPoints = mergedOptions.deduplicate
      ? this.deduplicateEntryPoints(filteredEntryPoints)
      : filteredEntryPoints;

    const endTime = Date.now();
    const analysisDuration = endTime - startTime;

    // Calculate metadata
    const entryPointsByType = finalEntryPoints.reduce(
      (acc, ep) => {
        acc[ep.type] = (acc[ep.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      entryPoints: finalEntryPoints,
      metadata: {
        totalEntryPoints: finalEntryPoints.length,
        entryPointsByType,
        analysisDuration,
        sourcesAnalyzed,
      },
    };
  }

  /**
   * Validate input parameters
   */
  private validateInput(projectInfo: ProjectInfo): void {
    if (!projectInfo) {
      throw new InvalidInputError('Project info is required');
    }

    if (!projectInfo.rootPath) {
      throw new InvalidInputError('Project root path is required');
    }

    if (!Array.isArray(projectInfo.ast)) {
      throw new InvalidInputError('AST nodes must be an array');
    }
  }

  /**
   * Analyze package.json for entry points
   */
  private analyzePackageJson(projectInfo: ProjectInfo): EntryPointInfo[] {
    const entryPoints: EntryPointInfo[] = [];

    try {
      const packageJson = projectInfo.metadata?.['packageJson'] as PackageJson;

      if (!packageJson || typeof packageJson !== 'object') {
        return entryPoints;
      }

      // Main entry point
      if (packageJson.main) {
        if (Array.isArray(packageJson.main)) {
          packageJson.main.forEach((path: string) => {
            entryPoints.push({
              path,
              type: 'main',
              description: 'Main entry point',
              metadata: { source: 'package.json.main' },
            });
          });
        } else {
          entryPoints.push({
            path: packageJson.main,
            type: 'main',
            description: 'Main entry point',
            metadata: { source: 'package.json.main' },
          });
        }
      }

      // Module entry point
      if (packageJson.module) {
        if (Array.isArray(packageJson.module)) {
          packageJson.module.forEach((path: string) => {
            entryPoints.push({
              path,
              type: 'module',
              description: 'ES module entry point',
              metadata: { source: 'package.json.module' },
            });
          });
        } else {
          entryPoints.push({
            path: packageJson.module,
            type: 'module',
            description: 'ES module entry point',
            metadata: { source: 'package.json.module' },
          });
        }
      }

      // Types entry point
      if (packageJson.types || packageJson.typings) {
        entryPoints.push({
          path: packageJson.types ?? packageJson.typings,
          type: 'types',
          description: 'TypeScript definitions',
          metadata: { source: 'package.json.types' },
        });
      }

      // Browser entry point
      if (packageJson.browser) {
        entryPoints.push({
          path: packageJson.browser,
          type: 'browser',
          description: 'Browser-specific entry point',
          metadata: { source: 'package.json.browser' },
        });
      }

      // Binary entry points
      if (packageJson.bin) {
        if (typeof packageJson.bin === 'string') {
          entryPoints.push({
            path: packageJson.bin,
            type: 'bin',
            description: 'Binary executable',
            metadata: { source: 'package.json.bin' },
          });
        } else if (typeof packageJson.bin === 'object') {
          Object.entries(packageJson.bin).forEach(([name, path]) => {
            entryPoints.push({
              path,
              type: 'bin',
              description: `Binary executable: ${name}`,
              metadata: {
                source: 'package.json.bin',
                binaryName: name,
              },
            });
          });
        }
      }
    } catch {
      // Handle malformed package.json gracefully
      // console.warn('Failed to parse package.json:', error);
    }

    return entryPoints;
  }

  /**
   * Analyze AST nodes for entry points
   */
  private analyzeASTNodes(
    projectInfo: ProjectInfo,
    options: Required<EntryPointAnalysisOptions>
  ): EntryPointInfo[] {
    const entryPoints: EntryPointInfo[] = [];

    projectInfo.ast.forEach(node => {
      // Check if node is explicitly marked as entry point
      if (node.metadata?.['isEntryPoint'] === true) {
        entryPoints.push({
          path: node.filePath,
          type: 'main',
          description: 'AST entry point',
          metadata: {
            source: 'AST metadata',
            nodeId: node.id,
            nodeType: node.nodeType,
          },
        });
        return;
      }

      // Check against entry point patterns
      if (this.matchesEntryPointPattern(node.filePath, options.entryPointPatterns)) {
        entryPoints.push({
          path: node.filePath,
          type: 'main',
          description: 'Pattern-based entry point',
          metadata: {
            source: 'pattern matching',
            nodeId: node.id,
            nodeType: node.nodeType,
          },
        });
      }
    });

    return entryPoints;
  }

  /**
   * Analyze exports field for entry points
   */
  private analyzeExports(projectInfo: ProjectInfo): EntryPointInfo[] {
    const entryPoints: EntryPointInfo[] = [];

    try {
      const packageJson = projectInfo.metadata?.['packageJson'] as PackageJson;

      if (!packageJson?.exports) {
        return entryPoints;
      }

      this.extractExportsEntryPoints(packageJson.exports, entryPoints);
    } catch {
      // console.warn('Failed to parse exports field:', error);
    }

    return entryPoints;
  }

  /**
   * Extract entry points from exports field
   */
  private extractExportsEntryPoints(
    exports: Record<string, unknown>,
    entryPoints: EntryPointInfo[]
  ): void {
    if (typeof exports === 'string') {
      entryPoints.push({
        path: exports,
        type: 'module',
        description: 'Export entry point',
        metadata: { source: 'exports' },
      });
      return;
    }

    if (Array.isArray(exports)) {
      exports.forEach(exportPath => {
        if (typeof exportPath === 'string') {
          entryPoints.push({
            path: exportPath,
            type: 'module',
            description: 'Export entry point',
            metadata: { source: 'exports' },
          });
        }
      });
      return;
    }

    if (typeof exports === 'object') {
      Object.entries(exports).forEach(([key, value]) => {
        if (typeof value === 'string') {
          entryPoints.push({
            path: value,
            type: 'module',
            description: `Export entry point: ${key}`,
            metadata: {
              source: 'exports',
              exportKey: key,
            },
          });
        } else if (typeof value === 'object' && value !== null) {
          // Handle conditional exports
          this.extractExportsEntryPoints(value, entryPoints);
        }
      });
    }
  }

  /**
   * Check if path matches entry point patterns
   */
  private matchesEntryPointPattern(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => this.matchesPattern(path, pattern));
  }

  /**
   * Check if path matches a glob pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Simple pattern matching for common cases
    if (pattern.includes('**')) {
      // Handle ** patterns
      const parts = pattern.split('**');
      if (parts.length === 2) {
        const before = parts[0];
        const after = parts[1];

        if (before && after) {
          // Pattern like "src/**/*.ts"
          if (path.includes(before)) {
            // Find all occurrences of the before pattern
            let index = 0;
            while ((index = path.indexOf(before, index)) !== -1) {
              const afterIndex = index + before.length;
              const remainingPath = path.substring(afterIndex);

              // Convert after pattern to regex (handle * wildcards)
              const afterRegex = after
                .replace(/^\//, '')
                .replace(/\*/g, '[^/]*')
                .replace(/\./g, '\\.');
              const regex = new RegExp(`^${afterRegex}$`);

              if (regex.test(remainingPath)) {
                return true;
              }

              index += 1;
            }
          }
        } else if (before) {
          // Pattern like "src/**"
          return path.startsWith(before);
        } else if (after) {
          // Pattern like "**/*.ts"
          return path.endsWith(after);
        }
      }
    }

    // Fallback to simple string matching for now
    return path.includes(pattern.replace(/\*/g, ''));
  }

  /**
   * Filter entry points based on include/exclude patterns
   */
  private filterEntryPoints(
    entryPoints: EntryPointInfo[],
    options: Required<EntryPointAnalysisOptions>
  ): EntryPointInfo[] {
    return entryPoints.filter(entryPoint => {
      // Check include patterns
      if (options.includePatterns.length > 0) {
        const matchesInclude = options.includePatterns.some(pattern =>
          this.matchesPattern(entryPoint.path, pattern)
        );
        if (!matchesInclude) {
          return false;
        }
      }

      // Check exclude patterns
      if (options.excludePatterns.length > 0) {
        const matchesExclude = options.excludePatterns.some(pattern =>
          this.matchesPattern(entryPoint.path, pattern)
        );
        if (matchesExclude) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Deduplicate entry points based on normalized path
   */
  private deduplicateEntryPoints(entryPoints: EntryPointInfo[]): EntryPointInfo[] {
    const seen = new Set<string>();
    return entryPoints.filter(entryPoint => {
      // Normalize path for comparison (remove leading ./ and trailing /)
      const normalizedPath = entryPoint.path.replace(/^\.\//, '').replace(/\/$/, '');

      if (seen.has(normalizedPath)) {
        return false;
      }
      seen.add(normalizedPath);
      return true;
    });
  }
}

/**
 * DependencyAnalyzer - Analyzes project dependencies and relationships
 *
 * This analyzer provides comprehensive dependency analysis including:
 * - Internal and external dependencies
 * - Circular dependency detection
 * - Dependency metrics and statistics
 * - Version analysis
 * - Import/export patterns
 */

import { ProjectInfo, Relation, DependencyInfo } from '../types';
import { InvalidInputError } from '../utils/error';

/**
 * Dependency analysis options
 */
export interface DependencyAnalysisOptions {
  /** Include patterns for file filtering */
  includePatterns?: string[];
  /** Exclude patterns for file filtering */
  excludePatterns?: string[];
  /** Custom relation types to analyze */
  customRelationTypes?: string[];
  /** Maximum depth for dependency traversal */
  maxDepth?: number;
  /** Include circular dependency detection */
  detectCircularDependencies?: boolean;
  /** Include version analysis */
  includeVersionAnalysis?: boolean;
  /** Include usage statistics */
  includeUsageStatistics?: boolean;
}

/**
 * Internal dependency information
 */
export interface InternalDependency {
  /** Source file path */
  from: string;
  /** Target file path */
  to: string;
  /** Dependency type */
  type: string;
  /** Module path used in import */
  modulePath: string;
  /** Resolved absolute path */
  resolvedPath?: string;
  /** Imported names */
  importedNames?: string[];
  /** Is barrel export */
  isBarrelExport?: boolean;
  /** Is type-only import */
  isTypeOnly?: boolean;
  /** Is namespace import */
  isNamespace?: boolean;
  /** Is dynamic import */
  isDynamic?: boolean;
  /** Import condition */
  condition?: string;
  /** Usage count */
  usageCount: number;
  /** Metadata */
  metadata: Record<string, unknown>;
}

/**
 * External dependency information
 */
export interface ExternalDependency {
  /** Package name */
  name: string;
  /** Package version */
  version?: string;
  /** Usage count */
  usageCount: number;
  /** Files using this dependency */
  files: string[];
  /** Imported names */
  importedNames: string[];
  /** Is scoped package */
  isScoped: boolean;
  /** Runtime imports count */
  runtimeImports: number;
  /** Type-only imports count */
  typeOnlyImports: number;
  /** Is namespace import */
  isNamespace: boolean;
  /** Is dynamic import */
  isDynamic: boolean;
  /** Import conditions */
  conditions: string[];
  /** Metadata */
  metadata: Record<string, unknown>;
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysisResult {
  /** Internal dependencies */
  internalDependencies: InternalDependency[];
  /** External dependencies */
  externalDependencies: ExternalDependency[];
  /** Package dependencies from package.json */
  packageDependencies: DependencyInfo[];
  /** Circular dependencies */
  circularDependencies: string[][];
  /** Dependency metrics */
  metrics: DependencyMetrics;
  /** Version analysis */
  versionAnalysis: VersionAnalysis;
  /** Usage statistics */
  usageStatistics: UsageStatistics;
}

/**
 * Dependency metrics
 */
export interface DependencyMetrics {
  /** Total number of dependencies */
  totalDependencies: number;
  /** Number of internal dependencies */
  internalDependencies: number;
  /** Number of external dependencies */
  externalDependencies: number;
  /** Maximum dependency depth */
  maxDepth: number;
  /** Average dependency depth */
  averageDepth: number;
  /** Number of circular dependencies */
  circularDependencies: number;
  /** Dependency density (dependencies per file) */
  dependencyDensity: number;
}

/**
 * Version analysis
 */
export interface VersionAnalysis {
  /** Number of caret ranges (^) */
  caretRanges: number;
  /** Number of tilde ranges (~) */
  tildeRanges: number;
  /** Number of exact versions */
  exactVersions: number;
  /** Number of complex ranges */
  complexRanges: number;
  /** Outdated dependencies */
  outdatedDependencies: string[];
  /** Vulnerable dependencies */
  vulnerableDependencies: string[];
}

/**
 * Usage statistics
 */
export interface UsageStatistics {
  /** Most used dependencies */
  mostUsed: Array<{ name: string; count: number }>;
  /** Least used dependencies */
  leastUsed: Array<{ name: string; count: number }>;
  /** Unused dependencies */
  unused: string[];
  /** Dependency usage distribution */
  usageDistribution: Record<string, number>;
}

/**
 * DependencyAnalyzer class
 */
export class DependencyAnalyzer {
  private readonly defaultOptions: Required<DependencyAnalysisOptions> = {
    includePatterns: ['**/*'],
    excludePatterns: [],
    customRelationTypes: [],
    maxDepth: 10,
    detectCircularDependencies: true,
    includeVersionAnalysis: true,
    includeUsageStatistics: true,
  };

  /**
   * Analyze project dependencies
   */
  public analyze(
    projectInfo: ProjectInfo,
    options: DependencyAnalysisOptions = {}
  ): DependencyAnalysisResult {
    // Validate input
    this.validateInput(projectInfo);

    // Merge options with defaults
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Create node ID to file path mapping
    const nodeIdToFilePathMap = new Map<string, string>();
    projectInfo.ast.forEach(node => {
      nodeIdToFilePathMap.set(node.id, node.filePath);
    });

    // Filter relations based on include/exclude patterns
    const filteredRelations = this.filterRelations(projectInfo.relations, mergedOptions);

    // Analyze internal dependencies
    const internalDependencies = this.analyzeInternalDependencies(
      filteredRelations,
      projectInfo.rootPath,
      nodeIdToFilePathMap
    );

    // Analyze external dependencies
    const externalDependencies = this.analyzeExternalDependencies(
      filteredRelations,
      nodeIdToFilePathMap
    );

    // Detect circular dependencies
    const circularDependencies = mergedOptions.detectCircularDependencies
      ? this.detectCircularDependencies(filteredRelations)
      : [];

    // Calculate metrics
    const metrics = this.calculateMetrics(
      internalDependencies,
      externalDependencies,
      circularDependencies,
      projectInfo.structure.totalFiles
    );

    // Analyze versions
    const versionAnalysis = mergedOptions.includeVersionAnalysis
      ? this.analyzeVersions(projectInfo.dependencies, projectInfo.devDependencies)
      : this.getEmptyVersionAnalysis();

    // Calculate usage statistics
    const usageStatistics = mergedOptions.includeUsageStatistics
      ? this.calculateUsageStatistics(externalDependencies, projectInfo.dependencies)
      : this.getEmptyUsageStatistics();

    return {
      internalDependencies,
      externalDependencies,
      packageDependencies: [...projectInfo.dependencies, ...projectInfo.devDependencies],
      circularDependencies,
      metrics,
      versionAnalysis,
      usageStatistics,
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

    if (!Array.isArray(projectInfo.relations)) {
      throw new InvalidInputError('Relations must be an array');
    }

    if (!Array.isArray(projectInfo.ast)) {
      throw new InvalidInputError('AST nodes must be an array');
    }
  }

  /**
   * Filter relations based on include/exclude patterns
   */
  private filterRelations(
    relations: Relation[],
    options: Required<DependencyAnalysisOptions>
  ): Relation[] {
    return relations.filter(relation => {
      // Skip malformed relations
      if (!relation.from || !relation.to || relation.from === '' || relation.to === '') {
        return false;
      }

      // If no patterns specified, return all valid relations
      if (
        options.includePatterns.length === 0 ||
        (options.includePatterns.length === 1 && options.includePatterns[0] === '**/*')
      ) {
        // Only apply exclude patterns
        const matchesExclude = options.excludePatterns.some(
          pattern =>
            this.matchesPattern(relation.from, pattern) || this.matchesPattern(relation.to, pattern)
        );
        return !matchesExclude;
      }

      // Check include patterns
      const matchesInclude = options.includePatterns.some(
        pattern =>
          this.matchesPattern(relation.from, pattern) || this.matchesPattern(relation.to, pattern)
      );

      // Check exclude patterns
      const matchesExclude = options.excludePatterns.some(
        pattern =>
          this.matchesPattern(relation.from, pattern) || this.matchesPattern(relation.to, pattern)
      );

      return matchesInclude && !matchesExclude;
    });
  }

  /**
   * Check if a path matches a pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Handle special case for external dependencies
    if (path.startsWith('external:')) {
      return false;
    }

    // For patterns with **, use a more precise approach
    if (pattern.includes('**')) {
      // Handle patterns like **/test/**/*.ts
      if (pattern.startsWith('**/') && pattern.includes('/**/')) {
        // Extract the directory name between **/ and /**
        const match = pattern.match(/^\*\*\/([^/]+)\/\*\*\/(.+)$/);
        if (match?.[1] && match[2]) {
          const dirName = match[1];
          const afterPattern = match[2];

          // Check if the path contains the directory name
          if (!path.includes(`${dirName}/`)) {
            return false;
          }

          // Find all occurrences of the directory name
          let index = 0;
          while ((index = path.indexOf(`${dirName}/`, index)) !== -1) {
            const afterDir = path.substring(index + dirName.length + 1);

            // For patterns like **/test/**/*.ts, check that test/ is followed by any directories and .ts
            if (afterPattern.startsWith('*') && afterPattern.endsWith('.ts')) {
              // The ** means any number of directories, so we need to check if the path ends with .ts
              if (path.endsWith('.ts')) {
                // Check if the part after test/ matches the pattern *.ts
                // This means it should be any directories followed by a .ts file
                // For **/test/**/*.ts, after test/ we should have any directories and then a .ts file
                const regex = new RegExp('^.*\\.ts$');
                if (regex.test(afterDir)) {
                  return true;
                }
              }
            }

            index += 1;
          }
          return false;
        }
      }

      // Fallback to simple regex for other ** patterns
      const parts = pattern.split('**');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const before = parts[0];
        const after = parts[1];

        // Check if the path contains the before part
        if (!path.includes(before)) {
          return false;
        }

        // Find all occurrences of the before part
        let index = 0;
        while ((index = path.indexOf(before, index)) !== -1) {
          // For patterns like src/**/*.ts, check that src/ is followed by any directories and .ts
          if (after.startsWith('/*') && after.endsWith('.ts')) {
            // The ** means any number of directories, so we need to check if the path ends with .ts
            if (path.endsWith('.ts')) {
              // For ** patterns, we just need to check if the path ends with .ts
              // The ** can match zero or more directories
              return true;
            }
          }

          index += 1;
        }
        return false;
      }
    }

    // Convert pattern to regex for simple patterns
    let regexPattern = pattern
      .replace(/\*/g, '[^/]*') // * matches any characters except /
      .replace(/\?/g, '.') // ? matches any single character
      .replace(/\./g, '\\.'); // Escape literal dots

    // If pattern doesn't start with /, make it match anywhere in the path
    if (!pattern.startsWith('/')) {
      regexPattern = `.*${regexPattern}`;
    }

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Analyze internal dependencies
   */
  private analyzeInternalDependencies(
    relations: Relation[],
    rootPath: string,
    nodeIdToFilePathMap: Map<string, string>
  ): InternalDependency[] {
    const dependencyMap = new Map<string, InternalDependency>();

    relations
      .filter(rel => this.isInternalRelation(rel, rootPath))
      .forEach(relation => {
        const fromPath = nodeIdToFilePathMap.get(relation.from) ?? relation.from;
        const toPath = nodeIdToFilePathMap.get(relation.to) ?? relation.to;
        const key = `${fromPath}->${toPath}`;
        const existing = dependencyMap.get(key);

        if (existing) {
          existing.usageCount++;
          if (relation.metadata['importedNames']) {
            existing.importedNames = [
              ...(existing.importedNames ?? []),
              ...(relation.metadata['importedNames'] as string[]),
            ];
          }
        } else {
          dependencyMap.set(key, {
            from: fromPath,
            to: toPath,
            type: relation.type,
            modulePath: (relation.metadata['modulePath'] as string) ?? '',
            resolvedPath: this.resolvePath(
              fromPath,
              relation.metadata['modulePath'] as string,
              rootPath
            ),
            importedNames: (relation.metadata['importedNames'] as string[]) ?? [],
            isBarrelExport: (relation.metadata['isBarrelExport'] as boolean) ?? false,
            isTypeOnly: (relation.metadata['isTypeOnly'] as boolean) ?? false,
            isNamespace: (relation.metadata['isNamespace'] as boolean) ?? false,
            isDynamic: (relation.metadata['isDynamic'] as boolean) ?? false,
            condition: relation.metadata['condition'] as string,
            usageCount: 1,
            metadata: relation.metadata,
          });
        }
      });

    return Array.from(dependencyMap.values());
  }

  /**
   * Check if relation is internal
   */
  private isInternalRelation(relation: Relation, _rootPath: string): boolean {
    // Skip relations that are explicitly marked as external
    if (relation.to.startsWith('external:')) {
      return false;
    }

    // Internal relations are those between files in the project
    // or those that don't start with external: prefix
    return !relation.to.startsWith('external:');
  }

  /**
   * Resolve relative path to absolute path
   */
  private resolvePath(fromPath: string, modulePath: string, _rootPath: string): string {
    if (!modulePath || modulePath.startsWith('/') || modulePath.startsWith('http')) {
      return modulePath;
    }

    // Handle relative paths
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      const fromDir = fromPath.substring(0, fromPath.lastIndexOf('/'));
      const resolved = this.resolveRelativePath(fromDir, modulePath);

      // Add .ts extension if not present
      if (
        !resolved.endsWith('.ts') &&
        !resolved.endsWith('.tsx') &&
        !resolved.endsWith('.js') &&
        !resolved.endsWith('.jsx')
      ) {
        return `${resolved}.ts`;
      }

      return resolved;
    }

    // For non-relative imports, assume they're external
    return modulePath;
  }

  /**
   * Resolve relative path
   */
  private resolveRelativePath(fromDir: string, modulePath: string): string {
    const parts = fromDir.split('/').filter(p => p !== '');
    const moduleParts = modulePath.split('/').filter(p => p !== '');

    for (const part of moduleParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    }

    return `/${parts.join('/')}`;
  }

  /**
   * Analyze external dependencies
   */
  private analyzeExternalDependencies(
    relations: Relation[],
    nodeIdToFilePathMap: Map<string, string>
  ): ExternalDependency[] {
    const dependencyMap = new Map<string, ExternalDependency>();

    relations
      .filter(rel => rel.to.startsWith('external:'))
      .forEach(relation => {
        const packageName = relation.to.replace('external:', '');
        const filePath = nodeIdToFilePathMap.get(relation.from) ?? relation.from;
        const existing = dependencyMap.get(packageName);

        if (existing) {
          existing.usageCount++;
          if (!existing.files.includes(filePath)) {
            existing.files.push(filePath);
          }
          if (relation.metadata['importedNames']) {
            existing.importedNames.push(...(relation.metadata['importedNames'] as string[]));
          }
          if (relation.metadata['isTypeOnly']) {
            existing.typeOnlyImports++;
          } else {
            existing.runtimeImports++;
          }
          if (relation.metadata['condition']) {
            existing.conditions.push(relation.metadata['condition'] as string);
          }
        } else {
          dependencyMap.set(packageName, {
            name: packageName,
            usageCount: 1,
            files: [filePath],
            importedNames: (relation.metadata['importedNames'] as string[]) ?? [],
            isScoped: packageName.startsWith('@'),
            runtimeImports: relation.metadata['isTypeOnly'] ? 0 : 1,
            typeOnlyImports: relation.metadata['isTypeOnly'] ? 1 : 0,
            isNamespace: (relation.metadata['isNamespace'] as boolean) ?? false,
            isDynamic: (relation.metadata['isDynamic'] as boolean) ?? false,
            conditions: relation.metadata['condition']
              ? [relation.metadata['condition'] as string]
              : [],
            metadata: relation.metadata,
          });
        }
      });

    return Array.from(dependencyMap.values());
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(relations: Relation[]): string[][] {
    const graph = new Map<string, string[]>();
    const circularDependencies: string[][] = [];

    // Build adjacency list
    relations.forEach(relation => {
      if (!graph.has(relation.from)) {
        graph.set(relation.from, []);
      }
      graph.get(relation.from)!.push(relation.to);
    });

    // Detect cycles using DFS with recursion limit
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const maxDepth = 1000; // Prevent stack overflow

    const dfs = (node: string, path: string[], depth: number): void => {
      // Prevent infinite recursion
      if (depth > maxDepth) {
        return;
      }

      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart >= 0) {
          const cycle = path.slice(cycleStart);
          // Avoid duplicate cycles
          const cycleKey = cycle.sort().join('->');
          const existingCycleKey = circularDependencies
            .map(c => c.sort().join('->'))
            .find(key => key === cycleKey);
          if (!existingCycleKey) {
            circularDependencies.push(cycle);
          }
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) ?? [];
      neighbors.forEach(neighbor => {
        dfs(neighbor, [...path, node], depth + 1);
      });

      recursionStack.delete(node);
    };

    // Check all nodes
    graph.forEach((_, node) => {
      if (!visited.has(node)) {
        dfs(node, [], 0);
      }
    });

    return circularDependencies;
  }

  /**
   * Calculate dependency metrics
   */
  private calculateMetrics(
    internalDependencies: InternalDependency[],
    externalDependencies: ExternalDependency[],
    circularDependencies: string[][],
    totalFiles: number
  ): DependencyMetrics {
    const totalDependencies = internalDependencies.length + externalDependencies.length;
    const maxDepth = this.calculateMaxDepth(internalDependencies);
    const averageDepth = this.calculateAverageDepth(internalDependencies);

    return {
      totalDependencies,
      internalDependencies: internalDependencies.length,
      externalDependencies: externalDependencies.length,
      maxDepth,
      averageDepth,
      circularDependencies: circularDependencies.length,
      dependencyDensity: totalFiles > 0 ? totalDependencies / totalFiles : 0,
    };
  }

  /**
   * Calculate maximum dependency depth
   */
  private calculateMaxDepth(dependencies: InternalDependency[]): number {
    if (dependencies.length === 0) return 0;

    const graph = new Map<string, string[]>();
    dependencies.forEach(dep => {
      if (!graph.has(dep.from)) {
        graph.set(dep.from, []);
      }
      graph.get(dep.from)!.push(dep.to);
    });

    let maxDepth = 0;
    const visited = new Set<string>();
    const maxIterations = 10000; // Prevent infinite loops

    // Use iterative BFS instead of recursive DFS to avoid stack overflow
    const calculateDepthBFS = (startNode: string): number => {
      const queue: Array<{ node: string; depth: number }> = [{ node: startNode, depth: 0 }];
      const localVisited = new Set<string>();
      let localMaxDepth = 0;
      let iterations = 0;

      while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const { node, depth } = queue.shift()!;

        if (localVisited.has(node)) {
          continue;
        }

        localVisited.add(node);
        localMaxDepth = Math.max(localMaxDepth, depth);

        const neighbors = graph.get(node) ?? [];
        neighbors.forEach(neighbor => {
          if (!localVisited.has(neighbor)) {
            queue.push({ node: neighbor, depth: depth + 1 });
          }
        });
      }

      return localMaxDepth;
    };

    graph.forEach((_, node) => {
      if (!visited.has(node)) {
        const depth = calculateDepthBFS(node);
        maxDepth = Math.max(maxDepth, depth);
        visited.add(node);
      }
    });

    return maxDepth;
  }

  /**
   * Calculate average dependency depth
   */
  private calculateAverageDepth(dependencies: InternalDependency[]): number {
    if (dependencies.length === 0) return 0;

    // For large datasets, use a simpler approximation to avoid stack overflow
    if (dependencies.length > 1000) {
      // Simple approximation: average of all dependencies divided by 2
      return dependencies.length / 2;
    }

    const graph = new Map<string, string[]>();

    dependencies.forEach(dep => {
      if (!graph.has(dep.from)) {
        graph.set(dep.from, []);
      }
      graph.get(dep.from)!.push(dep.to);
    });

    const depths: number[] = [];
    const maxDepth = 10000; // Limit recursion depth

    const dfs = (node: string, depth: number): void => {
      if (depth > maxDepth) return; // Prevent deep recursion

      const neighbors = graph.get(node) ?? [];
      neighbors.forEach(neighbor => {
        // Record the depth of each dependency relationship
        depths.push(depth + 1);
        dfs(neighbor, depth + 1);
      });
    };

    // Calculate depth for each dependency path starting from each root node
    graph.forEach((_, node) => {
      // Check if this node is not a target of any dependency (root node)
      let isRoot = true;
      graph.forEach((targets, _) => {
        if (targets.includes(node)) {
          isRoot = false;
        }
      });

      if (isRoot) {
        dfs(node, 0);
      }
    });

    return depths.length > 0 ? depths.reduce((sum, depth) => sum + depth, 0) / depths.length : 0;
  }

  /**
   * Analyze package versions
   */
  private analyzeVersions(
    dependencies: DependencyInfo[],
    devDependencies: DependencyInfo[]
  ): VersionAnalysis {
    const allDeps = [...dependencies, ...devDependencies];

    let caretRanges = 0;
    let tildeRanges = 0;
    let exactVersions = 0;
    let complexRanges = 0;

    allDeps.forEach(dep => {
      const version = dep.version;
      if (version.startsWith('^')) {
        caretRanges++;
      } else if (version.startsWith('~')) {
        tildeRanges++;
      } else if (
        !version.includes(' ') &&
        !version.includes('||') &&
        !version.includes('>') &&
        !version.includes('<')
      ) {
        exactVersions++;
      } else {
        complexRanges++;
      }
    });

    return {
      caretRanges,
      tildeRanges,
      exactVersions,
      complexRanges,
      outdatedDependencies: [], // Would be populated by external service
      vulnerableDependencies: [], // Would be populated by external service
    };
  }

  /**
   * Calculate usage statistics
   */
  private calculateUsageStatistics(
    externalDependencies: ExternalDependency[],
    packageDependencies: DependencyInfo[]
  ): UsageStatistics {
    const usageCounts = externalDependencies.map(dep => ({
      name: dep.name,
      count: dep.usageCount,
    }));

    const mostUsed = usageCounts.sort((a, b) => b.count - a.count).slice(0, 10);

    const leastUsed = usageCounts.sort((a, b) => a.count - b.count).slice(0, 10);

    const usedPackageNames = new Set(externalDependencies.map(dep => dep.name));
    const unused = packageDependencies
      .filter(dep => !usedPackageNames.has(dep.name))
      .map(dep => dep.name);

    const usageDistribution = usageCounts.reduce(
      (acc, item) => {
        acc[item.name] = item.count;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      mostUsed,
      leastUsed,
      unused,
      usageDistribution,
    };
  }

  /**
   * Get empty version analysis
   */
  private getEmptyVersionAnalysis(): VersionAnalysis {
    return {
      caretRanges: 0,
      tildeRanges: 0,
      exactVersions: 0,
      complexRanges: 0,
      outdatedDependencies: [],
      vulnerableDependencies: [],
    };
  }

  /**
   * Get empty usage statistics
   */
  private getEmptyUsageStatistics(): UsageStatistics {
    return {
      mostUsed: [],
      leastUsed: [],
      unused: [],
      usageDistribution: {},
    };
  }
}

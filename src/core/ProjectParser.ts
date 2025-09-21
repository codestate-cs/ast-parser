/**
 * Main project parsing orchestrator
 */

import { FileUtils } from '../utils/file/FileUtils';
import { PathUtils } from '../utils/file/PathUtils';
import {
  ProjectInfo,
  ASTNode,
  Relation,
  FileInfo,
  DirectoryInfo,
  ComplexityMetrics,
  QualityMetrics,
  PackageConfig,
} from '../types';
import { ParsingOptions, DEFAULT_PARSING_OPTIONS } from '../types/options';
import { ProjectDetector } from './ProjectDetector';
import { logInfo, logWarn, logError } from '../utils/error/ErrorLogger';

/**
 * Project parser class
 */
export class ProjectParser {
  private options: ParsingOptions;

  constructor(options: Partial<ParsingOptions> = {}) {
    this.options = this.mergeOptions(DEFAULT_PARSING_OPTIONS, options);
  }

  /**
   * Parse project from path
   */
  async parseProject(projectPath: string): Promise<ProjectInfo> {
    try {
      logInfo(`Starting project parsing: ${projectPath}`);

      // Detect project type
      const detection = await ProjectDetector.detectProjectType(projectPath);
      logInfo(`Project detected: ${detection.type} (${detection.language})`);

      // Get project root
      const projectRoot = await ProjectDetector.getProjectRoot(projectPath);
      logInfo(`Project root: ${projectRoot}`);

      // Discover files
      const files = await this.discoverFiles(projectRoot);
      logInfo(`Discovered ${files.length} files`);

      // Parse files
      const astNodes = await this.parseFiles(files);
      logInfo(`Parsed ${astNodes.length} AST nodes`);

      // Build relationships
      const relations = this.buildRelations(astNodes);
      logInfo(`Built ${relations.length} relationships`);

      // Analyze structure
      const structure = this.analyzeStructure(files, projectRoot);
      logInfo(`Analyzed project structure`);

      // Calculate metrics
      const complexity = this.calculateComplexity(astNodes);
      const quality = this.calculateQuality(astNodes, structure);

      // Build project info
      const config = detection.metadata['config'] as PackageConfig;
      const projectInfo: ProjectInfo = {
        type: detection.type,
        rootPath: projectRoot,
        name: config?.name ?? FileUtils.getBaseName(projectRoot),
        version: config?.version ?? '1.0.0',
        entryPoints: config?.entryPoints ?? [],
        dependencies: config?.dependencies ?? [],
        devDependencies: config?.devDependencies ?? [],
        structure,
        ast: astNodes,
        relations,
        publicExports: [], // Will be implemented in Phase 2
        privateExports: [], // Will be implemented in Phase 2
        complexity,
        quality,
      };

      // Add optional fields conditionally
      if (config?.description) {
        projectInfo.description = config.description;
      }
      if (config?.author) {
        projectInfo.author = config.author;
      }
      if (config?.repository) {
        projectInfo.repository = config.repository;
      }

      logInfo(`Project parsing completed: ${projectInfo.name}`);
      return projectInfo;
    } catch (error) {
      logError(`Failed to parse project: ${projectPath}`, error as Error, { projectPath });
      throw error;
    }
  }

  /**
   * Discover files in project
   */
  private async discoverFiles(projectRoot: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      await this.discoverFilesRecursive(projectRoot, files, 0);
      return files;
    } catch (error) {
      logError(`Failed to discover files: ${projectRoot}`, error as Error, { projectRoot });
      throw error;
    }
  }

  /**
   * Recursively discover files
   */
  private async discoverFilesRecursive(
    dirPath: string,
    files: FileInfo[],
    currentDepth: number
  ): Promise<void> {
    // Check depth limit
    if (this.options.filtering.maxDepth && currentDepth >= this.options.filtering.maxDepth) {
      return;
    }

    try {
      const entries = await FileUtils.listDirectory(dirPath);

      for (const entry of entries) {
        const entryPath = FileUtils.join(dirPath, entry);
        const stats = await FileUtils.getStats(entryPath);

        if (stats.isDirectory) {
          // Skip node_modules if configured
          if (this.options.filtering.skipNodeModules && PathUtils.isInNodeModules(entryPath)) {
            continue;
          }

          // Recursively process subdirectory
          await this.discoverFilesRecursive(entryPath, files, currentDepth + 1);
        } else if (stats.isFile) {
          // Check if file should be included
          if (this.shouldIncludeFile(entryPath)) {
            const fileInfo: FileInfo = {
              path: entryPath,
              name: FileUtils.getFileName(entryPath),
              extension: FileUtils.getExtension(entryPath),
              size: stats.size,
              lines: await this.countLines(entryPath),
              lastModified: stats.mtime,
              hash: '', // Will be calculated when needed
            };

            files.push(fileInfo);
          }
        }
      }
    } catch (error) {
      logWarn(`Failed to process directory: ${dirPath}`, { error: (error as Error).message });
    }
  }

  /**
   * Check if file should be included
   */
  private shouldIncludeFile(filePath: string): boolean {
    const { includePatterns, excludePatterns, includeTestFiles, includeDocFiles } =
      this.options.filtering;

    // Check exclude patterns first
    if (excludePatterns && PathUtils.matchesPatterns(filePath, excludePatterns)) {
      return false;
    }

    // Check include patterns
    if (includePatterns && !PathUtils.matchesPatterns(filePath, includePatterns)) {
      return false;
    }

    // Check test files
    if (!includeTestFiles && PathUtils.isTestFile(filePath)) {
      return false;
    }

    // Check documentation files
    if (!includeDocFiles && PathUtils.isDocumentationFile(filePath)) {
      return false;
    }

    // Check if it's a source file
    return PathUtils.isSourceFile(filePath);
  }

  /**
   * Parse files to AST nodes
   */
  private async parseFiles(files: FileInfo[]): Promise<ASTNode[]> {
    const astNodes: ASTNode[] = [];

    for (const file of files) {
      try {
        if (PathUtils.isTypeScriptFile(file.path) || PathUtils.isJavaScriptFile(file.path)) {
          const nodes = await this.parseFile(file);
          astNodes.push(...nodes);
        }
      } catch (error) {
        logWarn(`Failed to parse file: ${file.path}`, { error: (error as Error).message });
      }
    }

    return astNodes;
  }

  /**
   * Parse individual file
   */
  private async parseFile(file: FileInfo): Promise<ASTNode[]> {
    // This is a simplified implementation for Phase 1
    // Full parsing will be implemented in Phase 1.5 with TypeScriptParser

    const content = await FileUtils.readFile(file.path);
    const lines = content.split('\n');

    // Create basic AST nodes for functions, classes, and interfaces
    const nodes: ASTNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? '';
      const start = content.indexOf(line);
      const end = start + line.length;

      // Simple pattern matching for Phase 1
      if (line.startsWith('class ')) {
        const className = this.extractName(line, 'class ');
        nodes.push({
          id: `${file.path}:${i}`,
          name: className,
          type: 'class',
          nodeType: 'class',
          filePath: file.path,
          start,
          end,
          children: [],
          metadata: { line: i + 1 },
          properties: {},
        });
      } else if (line.startsWith('interface ')) {
        const interfaceName = this.extractName(line, 'interface ');
        nodes.push({
          id: `${file.path}:${i}`,
          name: interfaceName,
          type: 'interface',
          nodeType: 'interface',
          filePath: file.path,
          start,
          end,
          children: [],
          metadata: { line: i + 1 },
          properties: {},
        });
      } else if (line.startsWith('function ')) {
        const functionName = this.extractName(line, 'function ');
        nodes.push({
          id: `${file.path}:${i}`,
          name: functionName,
          type: 'function',
          nodeType: 'function',
          filePath: file.path,
          start,
          end,
          children: [],
          metadata: { line: i + 1 },
          properties: {},
        });
      }
    }

    return nodes;
  }

  /**
   * Extract name from declaration line
   */
  private extractName(line: string, prefix: string): string {
    if (!line.includes(prefix)) {
      return 'unknown';
    }
    const withoutPrefix = line.substring(line.indexOf(prefix) + prefix.length);
    const nameMatch = withoutPrefix.match(/^(\w+)/);
    return nameMatch?.[1] ?? 'unknown';
  }

  /**
   * Build relationships between AST nodes
   */
  private buildRelations(astNodes: ASTNode[]): Relation[] {
    const relations: Relation[] = [];

    // Simple relationship building for Phase 1
    // Full relationship analysis will be implemented in Phase 2

    for (let i = 0; i < astNodes.length; i++) {
      const node = astNodes[i];

      // Find parent-child relationships
      for (let j = i + 1; j < astNodes.length; j++) {
        const otherNode = astNodes[j];

        if (
          node &&
          otherNode &&
          node.filePath === otherNode.filePath &&
          node.start < otherNode.start &&
          node.end > otherNode.end
        ) {
          relations.push({
            id: `parent-child-${node.id}-${otherNode.id}`,
            type: 'references',
            from: node.id,
            to: otherNode.id,
            metadata: { relationship: 'parent-child' },
          });
        }
      }
    }

    return relations;
  }

  /**
   * Analyze project structure
   */
  private analyzeStructure(
    files: FileInfo[],
    _projectRoot: string
  ): {
    files: FileInfo[];
    directories: DirectoryInfo[];
    totalFiles: number;
    totalLines: number;
    totalSize: number;
  } {
    const directories: DirectoryInfo[] = [];
    const directoryMap = new Map<string, DirectoryInfo>();

    // Build directory structure
    for (const file of files) {
      const dirPath = FileUtils.getDirName(file.path);

      if (!directoryMap.has(dirPath)) {
        const dirInfo: DirectoryInfo = {
          path: dirPath,
          name: FileUtils.getFileName(dirPath),
          fileCount: 0,
          subdirectoryCount: 0,
          totalSize: 0,
        };
        directoryMap.set(dirPath, dirInfo);
        directories.push(dirInfo);
      }

      const dirInfo = directoryMap.get(dirPath);
      if (dirInfo) {
        dirInfo.fileCount++;
        dirInfo.totalSize += file.size;
      }
    }

    const totalFiles = files.length;
    const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      files,
      directories,
      totalFiles,
      totalLines,
      totalSize,
    };
  }

  /**
   * Calculate complexity metrics
   */
  private calculateComplexity(astNodes: ASTNode[]): ComplexityMetrics {
    const functionCount = astNodes.filter(node => node.nodeType === 'function').length;
    const classCount = astNodes.filter(node => node.nodeType === 'class').length;
    const interfaceCount = astNodes.filter(node => node.nodeType === 'interface').length;

    // Simple complexity calculation for Phase 1
    const cyclomaticComplexity = functionCount * 2 + classCount * 3;
    const cognitiveComplexity = functionCount * 1.5 + classCount * 2;
    const linesOfCode = astNodes.reduce((sum, node) => sum + (node.end - node.start), 0);

    return {
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode,
      functionCount,
      classCount,
      interfaceCount,
    };
  }

  /**
   * Calculate quality metrics
   */
  private calculateQuality(astNodes: ASTNode[], structure: { totalFiles: number }): QualityMetrics {
    // Simple quality calculation for Phase 1
    const totalNodes = astNodes.length;
    const documentedNodes = astNodes.filter(
      node => node.metadata && Object.keys(node.metadata).length > 1
    ).length;

    const documentationCoverage = totalNodes > 0 ? (documentedNodes / totalNodes) * 100 : 0;
    const maintainabilityIndex = Math.max(0, 100 - structure.totalFiles * 0.1);
    const technicalDebtRatio = Math.min(100, structure.totalFiles * 0.05);
    const duplicationPercentage = 0; // Will be calculated in Phase 2
    const testCoveragePercentage = 0; // Will be calculated in Phase 2

    const score = (documentationCoverage + maintainabilityIndex + (100 - technicalDebtRatio)) / 3;

    return {
      score,
      maintainabilityIndex,
      technicalDebtRatio,
      duplicationPercentage,
      testCoveragePercentage,
    };
  }

  /**
   * Count lines in file
   */
  private async countLines(filePath: string): Promise<number> {
    try {
      const content = await FileUtils.readFile(filePath);
      return content.split('\n').length;
    } catch {
      return 0;
    }
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(
    defaults: ParsingOptions,
    options?: Partial<ParsingOptions>
  ): ParsingOptions {
    if (!options) {
      return defaults;
    }

    return {
      filtering: { ...defaults.filtering, ...options.filtering },
      mode: options.mode ?? defaults.mode,
      output: { ...defaults.output, ...options.output },
      documentation: { ...defaults.documentation, ...options.documentation },
      performance: { ...defaults.performance, ...options.performance },
      cache: { ...defaults.cache, ...options.cache },
    };
  }
}

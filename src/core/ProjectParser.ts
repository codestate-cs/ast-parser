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
  EntryPointInfo,
  ProjectStructure,
} from '../types';
import { ParsingOptions, DEFAULT_PARSING_OPTIONS } from '../types/options';
import { ProjectDetector } from './ProjectDetector';
import { CacheManager } from './CacheManager';
import { PerformanceMonitor } from '../utils/performance/PerformanceMonitor';
import { MemoryManager } from '../utils/performance/MemoryManager';
import { logInfo, logWarn, logError } from '../utils/error/ErrorLogger';
import { EnhancedTypeScriptParser } from '../parsers/EnhancedTypeScriptParser';
import { TypeScriptParser } from '../parsers/TypeScriptParser';
import { EntryPointAnalyzer } from '../analyzers/EntryPointAnalyzer';
import { ComplexityAnalyzer } from '../analyzers/ComplexityAnalyzer';

/**
 * Project parser class
 */
export class ProjectParser {
  private options: ParsingOptions;
  private cacheManager: CacheManager;
  private performanceMonitor?: PerformanceMonitor;
  private memoryManager?: MemoryManager;
  private entryPointAnalyzer: EntryPointAnalyzer;
  private complexityAnalyzer: ComplexityAnalyzer;

  constructor(options: Partial<ParsingOptions> = {}) {
    this.options = this.mergeOptions(DEFAULT_PARSING_OPTIONS, options);
    this.cacheManager = new CacheManager({
      cacheFile: this.options.cache?.cacheFile ?? './.ast-cache.json',
      maxCacheSize: 10000,
      compressionEnabled: this.options.cache?.cacheCompression ?? false,
      autoCleanup: true,
      cleanupInterval: 300000,
      defaultTTL: (this.options.cache?.cacheExpiration ?? 1) * 3600000,
    });

    // Initialize analyzers
    this.entryPointAnalyzer = new EntryPointAnalyzer();
    this.complexityAnalyzer = new ComplexityAnalyzer();

    // Initialize performance components if enabled
    if (
      this.options.performance?.enablePerformanceMonitoring &&
      this.options.performance?.performanceMonitor
    ) {
      this.performanceMonitor = this.options.performance.performanceMonitor;
    }

    if (
      this.options.performance?.enableMemoryManagement &&
      this.options.performance?.memoryManager
    ) {
      this.memoryManager = this.options.performance.memoryManager;
    }

    // Load existing cache
    void this.initializeCache();
  }

  /**
   * Initialize cache by loading existing cache file
   */
  private async initializeCache(): Promise<void> {
    try {
      await this.cacheManager.loadCache();
      logInfo('Cache initialized successfully');
    } catch (error) {
      logWarn('Failed to load cache, starting with empty cache', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * Parse project from path
   */
  async parseProject(projectPath: string): Promise<ProjectInfo> {
    let operationId: string | undefined;
    const timeout = this.options.performance?.timeout ?? 300000; // 5 minutes default

    try {
      // Set overall timeout for the entire parsing operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Project parsing timeout: ${projectPath}`));
        }, timeout);
      });

      // Execute parsing with timeout
      return await Promise.race([
        this.parseProjectInternal(projectPath, operationId),
        timeoutPromise,
      ]);
    } catch (error) {
      // End performance monitoring on error
      if (this.performanceMonitor && operationId) {
        try {
          this.performanceMonitor.endOperation(operationId);
        } catch (endError) {
          logWarn('Performance monitoring end failed on error', {
            error: (endError as Error).message,
          });
        }
      }

      logError(`Failed to parse project: ${projectPath}`, error as Error, { projectPath });
      throw error;
    }
  }

  /**
   * Internal project parsing logic
   */
  private async parseProjectInternal(
    projectPath: string,
    operationId?: string
  ): Promise<ProjectInfo> {
    try {
      // Start performance monitoring
      if (this.performanceMonitor) {
        try {
          operationId = this.performanceMonitor.startOperation('parseProject', projectPath, {
            projectName: projectPath.split('/').pop() ?? 'unknown',
          });
        } catch (error) {
          logWarn('Performance monitoring start failed, continuing without monitoring', {
            error: (error as Error).message,
          });
        }
      }

      // Start memory monitoring
      if (this.memoryManager) {
        try {
          this.memoryManager.startMonitoring();

          // Check memory pressure and optimize if needed
          const memoryPressure = this.memoryManager.checkMemoryPressure();
          if (memoryPressure.level === 'high') {
            this.memoryManager.optimizeMemory();
          }
        } catch (error) {
          logWarn('Memory management start failed, continuing without memory monitoring', {
            error: (error as Error).message,
          });
        }
      }

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

      // Record file processing
      if (this.performanceMonitor) {
        this.performanceMonitor.recordFileProcessed(
          'project',
          files.reduce((sum, file) => sum + (file.size || 0), 0)
        );
      }

      // Parse files
      const parseResult = await this.parseFiles(files);
      const astNodes = parseResult.nodes;
      const parserRelations = parseResult.relations;
      logInfo(`Parsed ${astNodes.length} AST nodes`);

      // Build relationships
      const relations = this.buildRelations(astNodes, parserRelations);
      logInfo(`Built ${relations.length} relationships`);

      // Analyze structure
      const structure = this.analyzeStructure(files, projectRoot);
      logInfo(`Analyzed project structure`);

      // Calculate metrics
      const complexity = this.calculateComplexity(astNodes);
      const quality = this.calculateQuality(astNodes, structure);

      // Analyze entry points
      const entryPointAnalysis = this.analyzeEntryPoints(astNodes, relations, structure);
      logInfo(`Analyzed ${entryPointAnalysis.entryPoints.length} entry points`);

      // Build project info
      const config = detection.metadata['config'] as PackageConfig;
      const projectInfo: ProjectInfo = {
        type: detection.type,
        rootPath: projectRoot,
        name: config?.name ?? FileUtils.getBaseName(projectRoot),
        version: config?.version ?? '1.0.0',
        entryPoints: entryPointAnalysis.entryPoints,
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

      // Generate performance report
      if (this.performanceMonitor) {
        const performanceReport = this.performanceMonitor.generateReport();
        projectInfo.performance = performanceReport;

        // Add cache statistics
        if (projectInfo.performance) {
          projectInfo.performance.cache = {
            hitRate: 0,
            statistics: {
              hits: 0,
              misses: 0,
              totalOperations: 0,
              hitRate: 0,
            },
          };
        }
      }

      // Generate memory report
      if (this.memoryManager) {
        const memoryReport = this.memoryManager.generateMemoryReport();
        if (projectInfo.performance) {
          projectInfo.performance.memory = {
            usage: this.memoryManager.getMemoryUsage(),
            report: memoryReport,
          };
        }
      }

      // End performance monitoring
      if (this.performanceMonitor && operationId) {
        try {
          this.performanceMonitor.endOperation(operationId);
        } catch (error) {
          logWarn('Performance monitoring end failed', { error: (error as Error).message });
        }
      }

      // Persist cache
      try {
        await this.cacheManager.persistCache();
        logInfo('Cache persisted successfully');
      } catch (error) {
        logWarn('Failed to persist cache', { error: (error as Error).message });
      }

      logInfo(`Project parsing completed: ${projectInfo.name}`);
      return projectInfo;
    } catch (error) {
      // End performance monitoring on error
      if (this.performanceMonitor && operationId) {
        try {
          this.performanceMonitor.endOperation(operationId);
        } catch (endError) {
          logWarn('Performance monitoring end failed on error', {
            error: (endError as Error).message,
          });
        }
      }

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
   * Parse files to AST nodes and relations
   */
  private async parseFiles(
    files: FileInfo[]
  ): Promise<{ nodes: ASTNode[]; relations: Relation[] }> {
    const astNodes: ASTNode[] = [];
    const allRelations: Relation[] = [];
    const maxConcurrentFiles = this.options.performance?.maxConcurrentFiles ?? 10;
    const timeout = this.options.performance?.timeout ?? 300000; // 5 minutes default
    const enableProgress = this.options.performance?.enableProgress ?? false;
    const progressInterval = this.options.performance?.progressInterval ?? 1000;

    // Filter files to parse
    const filesToParse = files.filter(
      file => PathUtils.isTypeScriptFile(file.path) || PathUtils.isJavaScriptFile(file.path)
    );

    if (enableProgress) {
      logInfo(
        `Starting to parse ${filesToParse.length} files with concurrency limit: ${maxConcurrentFiles}`
      );
    }

    // Process files in batches with concurrency control
    const batches: FileInfo[][] = [];
    for (let i = 0; i < filesToParse.length; i += maxConcurrentFiles) {
      batches.push(filesToParse.slice(i, i + maxConcurrentFiles));
    }

    let processedFiles = 0;
    let lastProgressTime = Date.now();

    for (const batch of batches) {
      // Check memory pressure before processing batch
      if (this.memoryManager) {
        const memoryPressure = this.memoryManager.checkMemoryPressure();
        if (memoryPressure.level === 'high') {
          logWarn('High memory pressure detected, optimizing memory before processing batch');
          this.memoryManager.optimizeMemory();
        }
      }

      // Process batch with timeout
      const batchPromises = batch.map(file =>
        Promise.race([
          this.parseFileWithTimeout(file, timeout),
          new Promise<{ nodes: ASTNode[]; relations: Relation[] }>((_, reject) =>
            setTimeout(() => reject(new Error(`File parsing timeout: ${file.path}`)), timeout)
          ),
        ])
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);

        // Process results
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            astNodes.push(...result.value.nodes);
            allRelations.push(...result.value.relations);
          } else {
            logWarn(`Failed to parse file in batch: ${result.reason}`);
          }
        }

        processedFiles += batch.length;

        // Progress reporting
        if (enableProgress && Date.now() - lastProgressTime >= progressInterval) {
          const progress = Math.round((processedFiles / filesToParse.length) * 100);
          logInfo(`Progress: ${processedFiles}/${filesToParse.length} files (${progress}%)`);
          lastProgressTime = Date.now();
        }
      } catch (error) {
        logError('Batch processing failed', error as Error);
        throw error;
      }
    }

    if (enableProgress) {
      logInfo(`Completed parsing ${filesToParse.length} files`);
    }

    return { nodes: astNodes, relations: allRelations };
  }

  /**
   * Parse file with timeout and memory limit enforcement
   */
  private async parseFileWithTimeout(
    file: FileInfo,
    timeout: number
  ): Promise<{ nodes: ASTNode[]; relations: Relation[] }> {
    const memoryLimit = this.options.performance?.memoryLimit ?? 1024; // MB

    return new Promise<{ nodes: ASTNode[]; relations: Relation[] }>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`File parsing timeout: ${file.path}`));
      }, timeout);

      this.parseFile(file)
        .then(result => {
          clearTimeout(timer);

          // Check memory usage after parsing
          if (this.memoryManager) {
            const memoryUsage = this.memoryManager.getMemoryUsage();
            const memoryUsageMB = memoryUsage.heapUsed / (1024 * 1024); // Convert to MB
            if (memoryUsageMB > memoryLimit) {
              logWarn(
                `Memory usage (${memoryUsageMB.toFixed(2)}MB) exceeds limit (${memoryLimit}MB) for file: ${file.path}`
              );
              // Trigger memory optimization
              this.memoryManager.optimizeMemory();
            }
          }

          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error as Error);
        });
    });
  }

  /**
   * Parse individual file using proper TypeScript parser
   */
  private async parseFile(file: FileInfo): Promise<{ nodes: ASTNode[]; relations: Relation[] }> {
    try {
      // Determine which parser to use based on file type and options
      const parser = this.createParser();

      if (!parser.canParse(file)) {
        logWarn(`Parser cannot handle file: ${file.path}`);
        return { nodes: [], relations: [] };
      }

      // Parse file with proper TypeScript parser
      const result = await parser.parseFile(file);

      // Convert parser result to ASTNode format
      const nodes: ASTNode[] = result.nodes.map((node: ASTNode) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        nodeType: node.nodeType,
        filePath: node.filePath,
        start: node.start,
        end: node.end,
        children: node.children || [],
        metadata: node.metadata || {},
        properties: node.properties || {},
      }));

      logInfo(
        `Parsed file ${file.path}: ${nodes.length} nodes, ${result.relations.length} relations`
      );
      return { nodes, relations: result.relations };
    } catch (error) {
      logError(`Failed to parse file: ${file.path}`, error as Error);
      return { nodes: [], relations: [] };
    }
  }

  /**
   * Create appropriate parser based on options
   */
  private createParser(): TypeScriptParser | EnhancedTypeScriptParser {
    // Always use enhanced parser for better analysis
    return new EnhancedTypeScriptParser(this.options);
  }

  /**
   * Build relationships between AST nodes using parser results
   */
  private buildRelations(astNodes: ASTNode[], parserRelations: Relation[]): Relation[] {
    const relations: Relation[] = [];

    // Use relations directly from parser results
    relations.push(...parserRelations);

    // Also extract any additional relationships from node metadata
    for (const node of astNodes) {
      if (node.metadata?.['relations']) {
        relations.push(...(node.metadata['relations'] as Relation[]));
      }
    }

    logInfo(`Built ${relations.length} relationships`);
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
   * Calculate complexity metrics using ComplexityAnalyzer
   */
  private calculateComplexity(astNodes: ASTNode[]): ComplexityMetrics {
    try {
      // Create a temporary ProjectInfo for analysis
      const tempProjectInfo: ProjectInfo = {
        type: 'typescript',
        rootPath: '',
        name: '',
        version: '1.0.0',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: {
          files: [],
          directories: [],
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0,
        },
        ast: astNodes,
        relations: [],
        publicExports: [],
        privateExports: [],
        complexity: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          linesOfCode: 0,
          functionCount: 0,
          classCount: 0,
          interfaceCount: 0,
        },
        quality: {
          score: 0,
          maintainabilityIndex: 0,
          technicalDebtRatio: 0,
          duplicationPercentage: 0,
          testCoveragePercentage: 0,
        },
      };

      // Use ComplexityAnalyzer to calculate metrics
      const analysisResult = this.complexityAnalyzer.analyze(tempProjectInfo);
      return analysisResult.complexityMetrics;
    } catch (error) {
      logError('Failed to calculate complexity metrics', error as Error);
      // Return default metrics on error
      return {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        linesOfCode: 0,
        functionCount: 0,
        classCount: 0,
        interfaceCount: 0,
      };
    }
  }

  /**
   * Calculate quality metrics
   */
  private calculateQuality(astNodes: ASTNode[], structure: { totalFiles: number }): QualityMetrics {
    // Basic quality calculation - can be enhanced with dedicated QualityAnalyzer later
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
   * Parse project incrementally using cache
   */
  async parseProjectIncremental(projectPath: string): Promise<ProjectInfo> {
    let operationId: string | undefined;
    const timeout = this.options.performance?.timeout ?? 300000; // 5 minutes default

    try {
      // Set overall timeout for the entire incremental parsing operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Incremental parsing timeout: ${projectPath}`));
        }, timeout);
      });

      // Execute incremental parsing with timeout
      return await Promise.race([
        this.parseProjectIncrementalInternal(projectPath, operationId),
        timeoutPromise,
      ]);
    } catch (error) {
      // End performance monitoring on error
      if (this.performanceMonitor && operationId) {
        try {
          this.performanceMonitor.endOperation(operationId);
        } catch (endError) {
          logWarn('Performance monitoring end failed on error', {
            error: (endError as Error).message,
          });
        }
      }

      logError(`Incremental parsing failed: ${projectPath}`, error as Error);
      // Fall back to full parsing
      return this.parseProject(projectPath);
    }
  }

  /**
   * Internal incremental project parsing logic
   */
  private async parseProjectIncrementalInternal(
    projectPath: string,
    operationId?: string
  ): Promise<ProjectInfo> {
    try {
      // Start performance monitoring
      if (this.performanceMonitor) {
        try {
          operationId = this.performanceMonitor.startOperation(
            'parseProjectIncremental',
            projectPath,
            {
              projectName: projectPath.split('/').pop() ?? 'unknown',
            }
          );
        } catch (error) {
          logWarn('Performance monitoring start failed, continuing without monitoring', {
            error: (error as Error).message,
          });
        }
      }

      // Start memory monitoring
      if (this.memoryManager) {
        try {
          this.memoryManager.startMonitoring();
        } catch (error) {
          logWarn('Memory management start failed, continuing without memory monitoring', {
            error: (error as Error).message,
          });
        }
      }

      logInfo(`Starting incremental project parsing: ${projectPath}`);

      // Load cache
      await this.cacheManager.loadCache();

      // Detect project type
      const detection = await ProjectDetector.detectProjectType(projectPath);
      logInfo(`Project detected: ${detection.type} (${detection.language})`);

      // Get project root
      const projectRoot = await ProjectDetector.getProjectRoot(projectPath);
      logInfo(`Project root: ${projectRoot}`);

      // Discover files
      const files = await this.discoverFiles(projectRoot);
      logInfo(`Discovered ${files.length} files`);

      // Process files incrementally
      const astNodes: ASTNode[] = [];
      const relations: Relation[] = [];
      const changedFiles: string[] = [];
      let cacheHits = 0;
      let cacheMisses = 0;

      for (const file of files) {
        const filePath = FileUtils.relative(projectRoot, file.path);

        try {
          // Check if file is cached and valid
          const hasCache = this.cacheManager.hasCache(filePath);
          let useCache = false;

          if (hasCache) {
            const isValid = this.cacheManager.validateFileHash(filePath, file.hash);
            if (isValid) {
              // Use cached data
              const cached = this.cacheManager.getCache(filePath);
              if (cached) {
                astNodes.push(cached.ast);
                relations.push(...cached.relations);
                useCache = true;
                cacheHits++;
                if (this.performanceMonitor) {
                  this.performanceMonitor.recordCacheHit(filePath);
                }
                logInfo(`Using cached data for: ${filePath}`);
              }
            } else {
              // File has changed, invalidate dependents
              this.cacheManager.invalidateDependents(filePath);
              changedFiles.push(filePath);
              cacheMisses++;
              if (this.performanceMonitor) {
                this.performanceMonitor.recordCacheMiss(filePath);
              }
              logInfo(`File changed, invalidating dependents: ${filePath}`);
            }
          } else {
            cacheMisses++;
            if (this.performanceMonitor) {
              this.performanceMonitor.recordCacheMiss(filePath);
            }
          }

          if (!useCache) {
            // Parse file fresh
            const parseResult = await this.parseFile(file);
            if (parseResult.nodes && parseResult.nodes.length > 0) {
              astNodes.push(...parseResult.nodes);
              relations.push(...parseResult.relations);

              // Extract dependencies from all AST nodes
              const dependencies: string[] = [];
              for (const ast of parseResult.nodes) {
                dependencies.push(...this.extractDependencies(ast));
              }

              // Cache the result (use first AST node as representative)
              if (parseResult.nodes[0]) {
                this.cacheManager.setCache(filePath, {
                  hash: file.hash,
                  lastModified: file.lastModified.toISOString(),
                  ast: parseResult.nodes[0], // Use first AST node as representative
                  relations: parseResult.relations,
                  dependencies: [...new Set(dependencies)], // Remove duplicates
                });
              }

              logInfo(`Parsed and cached: ${filePath}`);
            }
          }
        } catch (error) {
          logError(`Failed to process file: ${filePath}`, error as Error);
        }
      }

      // Build relationships
      const allRelations = this.buildRelations(astNodes, relations);
      logInfo(`Built ${allRelations.length} relationships`);

      // Analyze structure
      const structure = this.analyzeStructure(files, projectRoot);
      logInfo(`Analyzed project structure`);

      // Calculate metrics
      const complexity = this.calculateComplexity(astNodes);
      const quality = this.calculateQuality(astNodes, structure);

      // Analyze entry points
      const entryPointAnalysis = this.analyzeEntryPoints(astNodes, allRelations, structure);
      logInfo(`Analyzed ${entryPointAnalysis.entryPoints.length} entry points`);

      // Build project info
      const config = detection.metadata['config'] as PackageConfig;
      const projectInfo: ProjectInfo = {
        type: detection.type,
        rootPath: projectRoot,
        name: config?.name ?? FileUtils.getBaseName(projectRoot),
        version: config?.version ?? '1.0.0',
        entryPoints: entryPointAnalysis.entryPoints,
        dependencies: config?.dependencies ?? [],
        devDependencies: config?.devDependencies ?? [],
        structure,
        ast: astNodes,
        relations: allRelations,
        publicExports: [],
        privateExports: [],
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

      // Generate performance report
      if (this.performanceMonitor) {
        const performanceReport = this.performanceMonitor.generateReport();
        projectInfo.performance = performanceReport;

        // Add cache statistics
        if (projectInfo.performance) {
          projectInfo.performance.cache = {
            hitRate: cacheHits / (cacheHits + cacheMisses) || 0,
            statistics: {
              hits: cacheHits,
              misses: cacheMisses,
              totalOperations: cacheHits + cacheMisses,
              hitRate: cacheHits / (cacheHits + cacheMisses) || 0,
            },
          };
        }
      }

      // Generate memory report
      if (this.memoryManager) {
        const memoryReport = this.memoryManager.generateMemoryReport();
        if (projectInfo.performance) {
          projectInfo.performance.memory = {
            usage: this.memoryManager.getMemoryUsage(),
            report: memoryReport,
          };
        }
      }

      // End performance monitoring
      if (this.performanceMonitor && operationId) {
        try {
          this.performanceMonitor.endOperation(operationId);
        } catch (error) {
          logWarn('Performance monitoring end failed', { error: (error as Error).message });
        }
      }

      // Persist cache
      try {
        await this.cacheManager.persistCache();
        logInfo('Cache persisted successfully');
      } catch (error) {
        logWarn('Failed to persist cache', { error: (error as Error).message });
      }

      logInfo(
        `Incremental parsing completed. Changed files: ${changedFiles.length}, Cache hits: ${cacheHits}, Cache misses: ${cacheMisses}`
      );
      return projectInfo;
    } catch (error) {
      // End performance monitoring on error
      if (this.performanceMonitor && operationId) {
        try {
          this.performanceMonitor.endOperation(operationId);
        } catch (endError) {
          logWarn('Performance monitoring end failed on error', {
            error: (endError as Error).message,
          });
        }
      }

      logError(`Incremental parsing failed: ${projectPath}`, error as Error);
      // Fall back to full parsing
      return this.parseProject(projectPath);
    }
  }

  /**
   * Check if a file has changed
   */
  hasFileChanged(filePath: string, currentHash: string): boolean {
    try {
      const isValid = this.cacheManager.validateFileHash(filePath, currentHash);
      return !isValid;
    } catch (error) {
      logError(`Failed to check file change: ${filePath}`, error as Error);
      return true; // Assume changed if we can't determine
    }
  }

  /**
   * Update file dependencies in cache
   */
  updateFileDependencies(filePath: string, dependencies: string[]): void {
    try {
      const cached = this.cacheManager.getCache(filePath);
      if (cached) {
        this.cacheManager.setCache(filePath, {
          ...cached,
          dependencies,
        });
      }
    } catch (error) {
      logError(`Failed to update dependencies: ${filePath}`, error as Error);
    }
  }

  /**
   * Find files that depend on a given file
   */
  findDependentFiles(filePath: string): string[] {
    try {
      return this.cacheManager.findDependents(filePath);
    } catch (error) {
      logError(`Failed to find dependents: ${filePath}`, error as Error);
      return [];
    }
  }

  /**
   * Extract dependencies from AST node
   */
  private extractDependencies(node: ASTNode): string[] {
    const dependencies: string[] = [];

    // Extract imports from metadata
    if (node.metadata?.['imports']) {
      const imports = node.metadata['imports'] as string[];
      dependencies.push(...imports);
    }

    // Extract dependencies from children
    for (const child of node.children) {
      dependencies.push(...this.extractDependencies(child));
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Get cache manager instance
   */
  getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Analyze entry points using EntryPointAnalyzer
   */
  private analyzeEntryPoints(
    astNodes: ASTNode[],
    relations: Relation[],
    structure: ProjectStructure
  ): { entryPoints: EntryPointInfo[] } {
    try {
      // Create a temporary ProjectInfo for analysis
      const tempProjectInfo: ProjectInfo = {
        type: 'typescript',
        rootPath: '',
        name: '',
        version: '1.0.0',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure,
        ast: astNodes,
        relations,
        publicExports: [],
        privateExports: [],
        complexity: {
          cyclomaticComplexity: 0,
          cognitiveComplexity: 0,
          linesOfCode: 0,
          functionCount: 0,
          classCount: 0,
          interfaceCount: 0,
        },
        quality: {
          score: 0,
          maintainabilityIndex: 0,
          technicalDebtRatio: 0,
          duplicationPercentage: 0,
          testCoveragePercentage: 0,
        },
      };

      // Use EntryPointAnalyzer to find entry points
      const analysisResult = this.entryPointAnalyzer.analyze(tempProjectInfo);

      return {
        entryPoints: analysisResult.entryPoints,
      };
    } catch (error) {
      logError('Failed to analyze entry points', error as Error);
      return { entryPoints: [] };
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

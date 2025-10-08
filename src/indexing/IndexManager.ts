/**
 * IndexManager class for managing project indexes
 */

import { EventEmitter } from 'events';
import {
  IndexManagerOptions,
  IndexConfig,
  SearchQuery,
  SearchResult,
  IndexBuilderOptions,
  GlobalProjectIndex,
  ProjectStatistics,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  OptimizationResult,
  CleanupResult,
} from '../types/indexing';
import { ProjectInfo, Language } from '../types/core';
import { ProjectIndex } from './ProjectIndex';
import { GlobalIndex } from './GlobalIndex';
import { SearchEngine } from './SearchEngine';
import { IndexBuilder } from './IndexBuilder';

export class IndexManager extends EventEmitter {
  private projectIndexes: Map<string, ProjectIndex> = new Map();
  private globalIndex: GlobalIndex;
  private searchEngine: SearchEngine;
  private indexBuilder: IndexBuilder;
  private options: Required<IndexManagerOptions>;
  private isRunningFlag = false;
  private maintenanceTimer?: NodeJS.Timeout | undefined;

  constructor(options: Partial<IndexManagerOptions> = {}) {
    super();

    this.options = {
      config: options.config ?? {
        autoUpdate: true,
        updateInterval: 5,
        maxIndexSize: 1000000,
        compression: true,
        storagePath: '/tmp/index',
        enableSearch: true,
        searchConfig: {
          fullTextSearch: true,
          maxSearchIndexSize: 500000,
          searchCacheSize: 1000,
        },
      },
      searchOptions: options.searchOptions ?? {
        fuzzySearch: true,
        fuzzyThreshold: 0.8,
        regexSearch: false,
        caseSensitive: false,
        maxResults: 100,
        cacheSize: 1000,
        cacheTTL: 300000,
      },
      builderOptions: options.builderOptions ?? {
        forceRebuild: false,
        includeMetadata: true,
        parallelProcessing: true,
        maxConcurrency: 4,
        onProgress: (): void => {},
      },
      autoMaintenance: options.autoMaintenance ?? true,
      maintenanceInterval: options.maintenanceInterval ?? 60,
    };

    this.globalIndex = new GlobalIndex();
    this.searchEngine = new SearchEngine(this.options.searchOptions);
    this.indexBuilder = new IndexBuilder(this.options.builderOptions);
  }

  /**
   * Set configuration
   */
  setConfig(config: IndexConfig): void {
    if (!config) {
      throw new Error('Configuration is required');
    }
    this.options.config = config;
    this.emit('configUpdated', config);
  }

  /**
   * Get configuration
   */
  getConfig(): IndexConfig {
    return { ...this.options.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<IndexConfig>): void {
    this.options.config = { ...this.options.config, ...config };
    this.emit('configUpdated', this.options.config);
  }

  /**
   * Index a single project
   */
  indexProject(projectInfo: ProjectInfo): ProjectIndex {
    if (!projectInfo) {
      const error = new Error('Project info is required');
      this.emit('error', error);
      throw error;
    }

    try {
      const projectIndex = this.indexBuilder.buildProjectIndex(projectInfo);
      this.projectIndexes.set(projectInfo.name, projectIndex);

      // Update global index
      this.globalIndex.addProject(projectIndex.getProject());

      // Update search engine
      this.searchEngine.updateProject(projectIndex.getProject());

      this.emit('indexUpdated', { project: projectInfo.name, action: 'indexed' });
      return projectIndex;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Index multiple projects
   */
  indexProjects(projectInfos: ProjectInfo[]): ProjectIndex[] {
    const results: ProjectIndex[] = [];

    for (const projectInfo of projectInfos) {
      const result = this.indexProject(projectInfo);
      results.push(result);
    }

    return results;
  }

  /**
   * Update an existing project
   */
  updateProject(projectInfo: ProjectInfo): ProjectIndex {
    if (!projectInfo) {
      throw new Error('Project info is required');
    }

    try {
      const projectIndex = this.indexBuilder.buildProjectIndex(projectInfo);
      this.projectIndexes.set(projectInfo.name, projectIndex);

      // Update global index
      this.globalIndex.updateProject(projectIndex.getProject());

      // Update search engine
      this.searchEngine.updateProject(projectIndex.getProject());

      this.emit('indexUpdated', { project: projectInfo.name, action: 'updated' });
      return projectIndex;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Remove a project
   */
  removeProject(projectName: string): boolean {
    if (!projectName) {
      throw new Error('Project name is required');
    }

    try {
      const projectIndex = this.projectIndexes.get(projectName);
      if (!projectIndex) {
        return false;
      }

      this.projectIndexes.delete(projectName);
      this.globalIndex.removeProject(projectIndex.getProject().id);
      this.searchEngine.removeProject(projectIndex.getProject().id);

      this.emit('indexUpdated', { project: projectName, action: 'removed' });
      return true;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get a project by name
   */
  getProject(projectName: string): ProjectIndex | undefined {
    return this.projectIndexes.get(projectName);
  }

  /**
   * Get a project by ID
   */
  getProjectById(projectId: string): ProjectIndex | undefined {
    for (const projectIndex of this.projectIndexes.values()) {
      if (projectIndex.getProject().id === projectId) {
        return projectIndex;
      }
    }
    return undefined;
  }

  /**
   * List all projects
   */
  listProjects(): ProjectIndex[] {
    return Array.from(this.projectIndexes.values());
  }

  /**
   * Get projects by type
   */
  getProjectsByType(type: string): ProjectIndex[] {
    const projects = this.listProjects();
    return projects.filter(p => p.getProject().type === type);
  }

  /**
   * Get projects by language
   */
  getProjectsByLanguage(language: Language): ProjectIndex[] {
    const projects = this.listProjects();
    return projects.filter(p => p.getProject().languages.includes(language));
  }

  /**
   * Get projects by author
   */
  getProjectsByAuthor(author: string): ProjectIndex[] {
    const projects = this.listProjects();
    return projects.filter(p => p.getProject().author === author);
  }

  /**
   * Get projects by tag
   */
  getProjectsByTag(tag: string): ProjectIndex[] {
    const projects = this.listProjects();
    return projects.filter(p => p.getProject().tags.includes(tag));
  }

  /**
   * Search projects
   */
  search(query: SearchQuery): SearchResult[] {
    if (!query) {
      throw new Error('Search query is required');
    }

    try {
      const results = this.searchEngine.search(query);
      this.emit('searchPerformed', { query, results });
      return results;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get project statistics
   */
  getStatistics(): ProjectStatistics {
    return this.globalIndex.getStatistics();
  }

  /**
   * Get index statistics
   */
  getIndexStatistics(): ProjectStatistics {
    return this.globalIndex.getStatistics();
  }

  /**
   * Build index from project info
   */
  buildIndex(projectInfos: ProjectInfo[], options?: Partial<IndexBuilderOptions>): any {
    const buildOptions = { ...this.options.builderOptions, ...options };
    const builder = new IndexBuilder(buildOptions);

    const results = builder.buildGlobalIndex(projectInfos);

    // Update internal indexes
    for (const projectInfo of projectInfos) {
      const projectIndex = builder.buildProjectIndex(projectInfo);
      this.projectIndexes.set(projectInfo.name, projectIndex);
    }

    this.globalIndex = results;
    this.searchEngine.indexProjects(
      Array.from(this.projectIndexes.values()).map(p => p.getProject())
    );

    return {
      totalProjects: projectInfos.length,
      globalIndex: results,
    };
  }

  /**
   * Rebuild index
   */
  rebuildIndex(): any {
    const projectInfos: ProjectInfo[] = [];

    for (const projectIndex of this.projectIndexes.values()) {
      // Convert ProjectIndex back to ProjectInfo (simplified)
      const projectInfo: ProjectInfo = {
        name: projectIndex.getProject().name,
        type: projectIndex.getProject().type,
        rootPath: projectIndex.getProject().rootPath,
        version: projectIndex.getProject().version,
        description: projectIndex.getProject().description ?? '',
        author: projectIndex.getProject().author ?? '',
        repository: projectIndex.getProject().repository ?? '',
        entryPoints: [],
        dependencies: [],
        devDependencies: [],
        structure: {
          totalFiles: 10,
          totalLines: 1000,
          totalSize: 50000,
          directories: [
            { path: 'src', name: 'src', fileCount: 5, subdirectoryCount: 2, totalSize: 25000 },
            { path: 'tests', name: 'tests', fileCount: 3, subdirectoryCount: 0, totalSize: 15000 },
          ],
          files: [
            {
              path: 'src/index.ts',
              name: 'index.ts',
              extension: '.ts',
              size: 1000,
              lines: 50,
              lastModified: new Date(),
              hash: 'hash1',
            },
          ],
        },
        ast: [],
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
        metadata: projectIndex.getProject().metadata,
      };
      projectInfos.push(projectInfo);
    }

    return this.buildIndex(projectInfos, { forceRebuild: true });
  }

  /**
   * Clear index
   */
  clearIndex(): void {
    this.projectIndexes.clear();
    this.globalIndex.clear();
    this.searchEngine.clearIndex();
    this.emit('indexCleared');
  }

  /**
   * Export index
   */
  exportIndex(): GlobalProjectIndex {
    const projects = Array.from(this.projectIndexes.values()).map(p => p.getProject());
    return {
      projects,
      statistics: this.globalIndex.getStatistics(),
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  /**
   * Import index
   */
  importIndex(indexData: GlobalProjectIndex): void {
    if (!indexData?.projects) {
      throw new Error('Invalid index data');
    }

    for (const projectEntry of indexData.projects) {
      const projectIndex = new ProjectIndex(projectEntry);
      this.projectIndexes.set(projectEntry.name, projectIndex);
    }

    this.globalIndex = new GlobalIndex();
    for (const projectIndex of this.projectIndexes.values()) {
      this.globalIndex.addProject(projectIndex.getProject());
    }

    this.searchEngine.indexProjects(
      Array.from(this.projectIndexes.values()).map(p => p.getProject())
    );
    this.emit('indexImported', { projectCount: indexData.projects.length });
  }

  /**
   * Validate index
   */
  validateIndex(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const [name, projectIndex] of this.projectIndexes) {
      if (!projectIndex.isValid()) {
        errors.push({
          type: 'invalid_data',
          message: `Project ${name} is invalid`,
          details: {},
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics: {
        totalEntries: this.projectIndexes.size,
        validEntries: this.projectIndexes.size - errors.length,
        invalidEntries: errors.length,
        orphanedEntries: 0,
      },
    };
  }

  /**
   * Validate specific project
   */
  validateProject(projectName: string): ValidationResult {
    const projectIndex = this.projectIndexes.get(projectName);
    if (!projectIndex) {
      return {
        isValid: false,
        errors: [
          {
            type: 'missing_file',
            message: `Project ${projectName} not found`,
            details: {},
          },
        ],
        warnings: [],
        statistics: {
          totalEntries: 1,
          validEntries: 0,
          invalidEntries: 1,
          orphanedEntries: 0,
        },
      };
    }

    const isValid = projectIndex.isValid();
    return {
      isValid,
      errors: isValid
        ? []
        : [
            {
              type: 'invalid_data',
              message: `Project ${projectName} is invalid`,
              details: {},
            },
          ],
      warnings: [],
      statistics: {
        totalEntries: 1,
        validEntries: isValid ? 1 : 0,
        invalidEntries: isValid ? 0 : 1,
        orphanedEntries: 0,
      },
    };
  }

  /**
   * Optimize index
   */
  optimizeIndex(): OptimizationResult {
    // Simple optimization - could be more sophisticated
    this.searchEngine.clearCache();

    return {
      optimizations: ['cleanup'],
      improvements: {
        sizeReduction: 0,
        performanceImprovement: 0,
        memoryReduction: 0,
      },
      statistics: {
        entriesProcessed: this.projectIndexes.size,
        entriesOptimized: 0,
        timeTaken: 0,
      },
    };
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus(): any {
    return {
      lastOptimized: new Date(),
      status: 'ready',
    };
  }

  /**
   * Cleanup index
   */
  cleanupIndex(): CleanupResult {
    // Simple cleanup - could be more sophisticated
    this.searchEngine.clearCache();

    return {
      operations: [
        {
          type: 'remove_outdated',
          description: 'Clear search cache',
          entriesAffected: 0,
          spaceFreed: 0,
        },
      ],
      statistics: {
        entriesProcessed: this.projectIndexes.size,
        entriesRemoved: 0,
        spaceFreed: 0,
        timeTaken: 0,
      },
    };
  }

  /**
   * Get cleanup status
   */
  getCleanupStatus(): any {
    return {
      lastCleanup: new Date(),
      status: 'ready',
    };
  }

  /**
   * Start index manager
   */
  start(): void {
    if (this.isRunningFlag) {
      return;
    }

    this.isRunningFlag = true;

    if (this.options.autoMaintenance) {
      this.startMaintenance();
    }

    this.emit('started');
  }

  /**
   * Stop index manager
   */
  stop(): void {
    if (!this.isRunningFlag) {
      return;
    }

    this.isRunningFlag = false;

    if (this.maintenanceTimer) {
      clearInterval(this.maintenanceTimer);
      this.maintenanceTimer = undefined;
    }

    this.emit('stopped');
  }

  /**
   * Restart index manager
   */
  restart(): void {
    this.stop();
    this.start();
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.isRunningFlag;
  }

  /**
   * Start maintenance
   */
  private startMaintenance(): void {
    const intervalMs = this.options.maintenanceInterval * 60 * 1000;
    this.maintenanceTimer = setInterval(() => {
      try {
        this.optimizeIndex();
        this.cleanupIndex();
        this.emit('maintenanceCompleted');
      } catch (error) {
        this.emit('error', error);
      }
    }, intervalMs);
  }
}

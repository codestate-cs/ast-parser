/**
 * Index building functionality
 */

import { ProjectIndex } from './ProjectIndex';
import { GlobalIndex } from './GlobalIndex';
import { ProjectIndexEntry, IndexBuilderOptions, IndexBuildProgress } from '../types/indexing';
import { ProjectInfo, Language } from '../types/core';
import { HashUtils } from '../utils/file/HashUtils';

/**
 * Index builder class
 */
export class IndexBuilder {
  private options: Required<IndexBuilderOptions>;

  constructor(options: Partial<IndexBuilderOptions> = {}) {
    this.options = {
      forceRebuild: options.forceRebuild ?? false,
      includeMetadata: options.includeMetadata ?? true,
      parallelProcessing: options.parallelProcessing ?? false,
      maxConcurrency: options.maxConcurrency ?? 4,
      onProgress: options.onProgress ?? ((): void => {}),
    };
  }

  /**
   * Build a project index from project info
   */
  buildProjectIndex(projectInfo: ProjectInfo): ProjectIndex {
    this.validateProjectInfo(projectInfo);

    this.reportProgress('Building project index', 0, 0, 1);

    const projectEntry = this.createProjectEntry(projectInfo);
    const projectIndex = new ProjectIndex(projectEntry);

    if (this.options.includeMetadata) {
      const metadata = this.extractProjectMetadata(projectInfo);
      projectIndex.setMetadata(metadata);
    }

    this.reportProgress('Project index built', 1, 1, 1);

    return projectIndex;
  }

  /**
   * Build a global index from multiple project infos
   */
  buildGlobalIndex(projectInfos: ProjectInfo[]): GlobalIndex {
    this.reportProgress('Building global index', 0, 0, projectInfos.length);

    const globalIndex = new GlobalIndex();

    for (let i = 0; i < projectInfos.length; i++) {
      const projectInfo = projectInfos[i];

      if (!projectInfo) {
        continue;
      }

      try {
        const projectIndex = this.buildProjectIndex(projectInfo);
        globalIndex.addProject(projectIndex.getProject());

        this.reportProgress(`Processing project ${i + 1}`, i + 1, i + 1, projectInfos.length);
      } catch (error) {
        // Skip invalid projects and continue
        // eslint-disable-next-line no-console
        console.warn(`Skipping invalid project: ${projectInfo.name}`, error);
      }
    }

    this.reportProgress(
      'Global index built',
      projectInfos.length,
      projectInfos.length,
      projectInfos.length
    );

    return globalIndex;
  }

  /**
   * Update an existing project index
   */
  updateProjectIndex(existingIndex: ProjectIndex, updatedProjectInfo: ProjectInfo): ProjectIndex {
    this.validateProjectInfo(updatedProjectInfo);

    this.reportProgress('Updating project index', 0, 0, 1);

    const updatedProjectEntry = this.createProjectEntry(updatedProjectInfo);

    // Preserve the original ID
    updatedProjectEntry.id = existingIndex.getProject().id;

    // Update the project entry
    existingIndex.updateProject(updatedProjectEntry);

    if (this.options.includeMetadata) {
      const metadata = this.extractProjectMetadata(updatedProjectInfo);
      existingIndex.setMetadata(metadata);
    }

    this.reportProgress('Project index updated', 1, 1, 1);

    return existingIndex;
  }

  /**
   * Validate project info
   */
  validateProjectInfo(projectInfo: ProjectInfo): boolean {
    if (!projectInfo) {
      throw new Error('Project info is required');
    }

    if (!projectInfo.name || !projectInfo.type || !projectInfo.rootPath) {
      throw new Error('Project info is missing required fields: name, type, or rootPath');
    }

    if (!projectInfo.structure) {
      throw new Error('Project info is missing structure information');
    }

    return true;
  }

  /**
   * Extract project metadata
   */
  extractProjectMetadata(projectInfo: ProjectInfo): Record<string, unknown> {
    return {
      dependencies: projectInfo.dependencies || [],
      devDependencies: projectInfo.devDependencies || [],
      entryPoints: projectInfo.entryPoints || [],
      complexity: projectInfo.complexity || {},
      quality: projectInfo.quality || {},
      ast: {
        nodeCount: projectInfo.ast?.length || 0,
        relationCount: projectInfo.relations?.length || 0,
        publicExportCount: projectInfo.publicExports?.length || 0,
        privateExportCount: projectInfo.privateExports?.length || 0,
      },
      structure: {
        fileCount: projectInfo.structure.totalFiles,
        lineCount: projectInfo.structure.totalLines,
        size: projectInfo.structure.totalSize,
        directoryCount: projectInfo.structure.directories.length,
      },
    };
  }

  /**
   * Generate a unique project ID
   */
  generateProjectId(projectInfo: ProjectInfo): string {
    const idData = `${projectInfo.name}-${projectInfo.rootPath}-${projectInfo.type}`;
    return HashUtils.hashString(idData);
  }

  /**
   * Create a project entry from project info
   */
  private createProjectEntry(projectInfo: ProjectInfo): ProjectIndexEntry {
    const languages = this.extractLanguages(projectInfo);
    const tags = this.extractTags(projectInfo);

    return {
      id: this.generateProjectId(projectInfo),
      name: projectInfo.name,
      type: projectInfo.type,
      rootPath: projectInfo.rootPath,
      version: projectInfo.version,
      description: projectInfo.description ?? '',
      author: projectInfo.author ?? '',
      repository: projectInfo.repository ?? '',
      languages,
      tags,
      lastAnalyzed: new Date(),
      lastModified: new Date(),
      size: projectInfo.structure.totalSize,
      fileCount: projectInfo.structure.totalFiles,
      linesOfCode: projectInfo.structure.totalLines,
      metadata: {},
    };
  }

  /**
   * Extract languages from project info
   */
  private extractLanguages(projectInfo: ProjectInfo): Language[] {
    const languages: Language[] = [];

    // Determine language from project type
    switch (projectInfo.type) {
      case 'typescript':
        languages.push('typescript');
        break;
      case 'javascript':
        languages.push('javascript');
        break;
      case 'react':
        languages.push('typescript', 'javascript');
        break;
      case 'node':
        languages.push('javascript');
        break;
      default:
        languages.push('javascript');
    }

    // Add additional languages from dependencies or file extensions
    if (projectInfo.dependencies) {
      for (const dep of projectInfo.dependencies) {
        if (dep.name.includes('python') && !languages.includes('python')) {
          languages.push('python');
        }
        if (dep.name.includes('go') && !languages.includes('go')) {
          languages.push('go');
        }
        if (dep.name.includes('java') && !languages.includes('java')) {
          languages.push('java');
        }
      }
    }

    return [...new Set(languages)]; // Remove duplicates
  }

  /**
   * Extract tags from project info
   */
  private extractTags(projectInfo: ProjectInfo): string[] {
    const tags: string[] = [];

    // Add project type as tag
    tags.push(projectInfo.type);

    // Add language tags
    const languages = this.extractLanguages(projectInfo);
    tags.push(...languages);

    // Add framework/library tags from dependencies
    if (projectInfo.dependencies) {
      for (const dep of projectInfo.dependencies) {
        const depName = dep.name.toLowerCase();

        if (depName.includes('react')) {
          tags.push('react');
        }
        if (depName.includes('vue')) {
          tags.push('vue');
        }
        if (depName.includes('angular')) {
          tags.push('angular');
        }
        if (depName.includes('express')) {
          tags.push('express');
        }
        if (depName.includes('koa')) {
          tags.push('koa');
        }
        if (depName.includes('jest') || depName.includes('mocha') || depName.includes('vitest')) {
          tags.push('testing');
        }
        if (depName.includes('eslint') || depName.includes('prettier')) {
          tags.push('linting');
        }
        if (depName.includes('webpack') || depName.includes('vite') || depName.includes('rollup')) {
          tags.push('bundling');
        }
      }
    }

    // Add quality-based tags
    if (projectInfo.quality) {
      if (projectInfo.quality.score >= 90) {
        tags.push('high-quality');
      } else if (projectInfo.quality.score >= 70) {
        tags.push('medium-quality');
      } else {
        tags.push('low-quality');
      }

      if (projectInfo.quality.testCoveragePercentage >= 80) {
        tags.push('well-tested');
      }

      if (projectInfo.quality.duplicationPercentage < 5) {
        tags.push('low-duplication');
      }
    }

    // Add complexity-based tags
    if (projectInfo.complexity) {
      if (projectInfo.complexity.cyclomaticComplexity < 10) {
        tags.push('low-complexity');
      } else if (projectInfo.complexity.cyclomaticComplexity > 20) {
        tags.push('high-complexity');
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Report progress to callback if provided
   */
  private reportProgress(
    step: string,
    itemsProcessed: number,
    currentItem: number,
    totalItems: number
  ): void {
    if (this.options.onProgress) {
      const progress = totalItems > 0 ? (itemsProcessed / totalItems) * 100 : 0;

      const progressInfo: IndexBuildProgress = {
        step,
        progress,
        itemsProcessed,
        totalItems,
        ...(currentItem > 0 && { currentItem: `Item ${currentItem}` }),
      };

      this.options.onProgress(progressInfo);
    }
  }
}

/**
 * Global project index management
 */

import {
  ProjectIndexEntry,
  GlobalProjectIndex,
  ProjectStatistics,
  ProjectFilters,
  SearchResult,
} from '../types/indexing';
import { ProjectType, Language } from '../types/core';

/**
 * Search options for project search
 */
export interface SearchOptions {
  /** Case sensitive search */
  caseSensitive?: boolean;
  /** Exact match */
  exactMatch?: boolean;
  /** Include metadata in search */
  includeMetadata?: boolean;
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
}

/**
 * Global project index class
 */
export class GlobalIndex {
  private projects: Map<string, ProjectIndexEntry> = new Map();
  private createdAt: Date;
  private updatedAt: Date;
  private metadata: Record<string, unknown> = {};

  constructor() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Get all projects
   */
  getProjects(): ProjectIndexEntry[] {
    return Array.from(this.projects.values());
  }

  /**
   * Add a project to the index
   */
  addProject(project: ProjectIndexEntry): void {
    if (!this.projects.has(project.id)) {
      this.projects.set(project.id, { ...project });
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a project from the index
   */
  removeProject(projectId: string): void {
    if (this.projects.has(projectId)) {
      this.projects.delete(projectId);
      this.updatedAt = new Date();
    }
  }

  /**
   * Get project by ID
   */
  getProject(projectId: string): ProjectIndexEntry | undefined {
    return this.projects.get(projectId);
  }

  /**
   * Update an existing project
   */
  updateProject(project: Partial<ProjectIndexEntry>): void {
    if (project.id && this.projects.has(project.id)) {
      // Preserve the original ID
      const originalId = project.id;
      const existingProject = this.projects.get(originalId)!;
      const updatedProject = { ...existingProject, ...project, id: originalId };

      this.projects.set(originalId, updatedProject);
      this.updatedAt = new Date();
    }
  }

  /**
   * Get projects filtered by type
   */
  getProjectsByType(type: ProjectType): ProjectIndexEntry[] {
    return Array.from(this.projects.values()).filter(project => project.type === type);
  }

  /**
   * Get projects filtered by language
   */
  getProjectsByLanguage(language: Language): ProjectIndexEntry[] {
    return Array.from(this.projects.values()).filter(project =>
      project.languages.includes(language)
    );
  }

  /**
   * Get projects filtered by author
   */
  getProjectsByAuthor(author: string): ProjectIndexEntry[] {
    return Array.from(this.projects.values()).filter(project => project.author === author);
  }

  /**
   * Get projects filtered by tag
   */
  getProjectsByTag(tag: string): ProjectIndexEntry[] {
    return Array.from(this.projects.values()).filter(project => project.tags.includes(tag));
  }

  /**
   * Search projects by query string
   */
  searchProjects(query: string, options: SearchOptions = {}): SearchResult[] {
    const results: SearchResult[] = [];
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    for (const project of this.projects.values()) {
      let score = 0;
      const matchReasons: string[] = [];
      const highlights: Record<string, string[]> = {};

      // Search in name
      const projectName = options.caseSensitive ? project.name : project.name.toLowerCase();
      if (projectName.includes(searchQuery)) {
        score += 0.4;
        matchReasons.push('name');
        highlights['name'] = [project.name];
      }

      // Search in description
      if (project.description) {
        const description = options.caseSensitive
          ? project.description
          : project.description.toLowerCase();
        if (description.includes(searchQuery)) {
          score += 0.3;
          matchReasons.push('description');
          highlights['description'] = [project.description];
        }
      }

      // Search in tags
      const matchingTags = project.tags.filter(tag => {
        const tagLower = options.caseSensitive ? tag : tag.toLowerCase();
        return tagLower.includes(searchQuery);
      });
      if (matchingTags.length > 0) {
        score += 0.2;
        matchReasons.push('tags');
        highlights['tags'] = matchingTags;
      }

      // Search in author
      if (project.author) {
        const author = options.caseSensitive ? project.author : project.author.toLowerCase();
        if (author.includes(searchQuery)) {
          score += 0.1;
          matchReasons.push('author');
          highlights['author'] = [project.author];
        }
      }

      if (score > 0) {
        results.push({
          project,
          score,
          matchReasons,
          highlights,
        });
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Apply limit and offset
    const offset = options.offset ?? 0;
    const limit = options.limit ?? results.length;

    return results.slice(offset, offset + limit);
  }

  /**
   * List projects with optional filters
   */
  listProjects(filters?: ProjectFilters): ProjectIndexEntry[] {
    let filteredProjects = Array.from(this.projects.values());

    if (!filters) {
      return filteredProjects;
    }

    // Filter by type
    if (filters.type) {
      filteredProjects = filteredProjects.filter(project => project.type === filters.type);
    }

    // Filter by language
    if (filters.language) {
      filteredProjects = filteredProjects.filter(project =>
        project.languages.includes(filters.language!)
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filteredProjects = filteredProjects.filter(project =>
        filters.tags!.some(tag => project.tags.includes(tag))
      );
    }

    // Filter by author
    if (filters.author) {
      filteredProjects = filteredProjects.filter(project => project.author === filters.author);
    }

    // Filter by date range
    if (filters.dateRange) {
      filteredProjects = filteredProjects.filter(project => {
        const projectDate = project.lastModified;
        return projectDate >= filters.dateRange!.from && projectDate <= filters.dateRange!.to;
      });
    }

    // Filter by size range
    if (filters.sizeRange) {
      filteredProjects = filteredProjects.filter(project => {
        return project.size >= filters.sizeRange!.min && project.size <= filters.sizeRange!.max;
      });
    }

    // Filter by file count range
    if (filters.fileCountRange) {
      filteredProjects = filteredProjects.filter(project => {
        return (
          project.fileCount >= filters.fileCountRange!.min &&
          project.fileCount <= filters.fileCountRange!.max
        );
      });
    }

    return filteredProjects;
  }

  /**
   * Get index statistics
   */
  getStatistics(): ProjectStatistics {
    const projects = Array.from(this.projects.values());
    const totalProjects = projects.length;

    if (totalProjects === 0) {
      return {
        totalProjects: 0,
        projectsByType: {} as Record<ProjectType, number>,
        projectsByLanguage: {} as Record<Language, number>,
        totalSize: 0,
        totalFiles: 0,
        totalLinesOfCode: 0,
        averageProjectSize: 0,
        averageFilesPerProject: 0,
        averageLinesPerProject: 0,
      };
    }

    // Calculate projects by type
    const projectsByType: Record<ProjectType, number> = {} as Record<ProjectType, number>;
    for (const project of projects) {
      projectsByType[project.type] = (projectsByType[project.type] || 0) + 1;
    }

    // Calculate projects by language
    const projectsByLanguage: Record<Language, number> = {} as Record<Language, number>;
    for (const project of projects) {
      for (const language of project.languages) {
        projectsByLanguage[language] = (projectsByLanguage[language] || 0) + 1;
      }
    }

    // Calculate totals
    const totalSize = projects.reduce((sum, project) => sum + project.size, 0);
    const totalFiles = projects.reduce((sum, project) => sum + project.fileCount, 0);
    const totalLinesOfCode = projects.reduce((sum, project) => sum + project.linesOfCode, 0);

    // Calculate averages
    const averageProjectSize = totalSize / totalProjects;
    const averageFilesPerProject = totalFiles / totalProjects;
    const averageLinesPerProject = totalLinesOfCode / totalProjects;

    return {
      totalProjects,
      projectsByType,
      projectsByLanguage,
      totalSize,
      totalFiles,
      totalLinesOfCode,
      averageProjectSize,
      averageFilesPerProject,
      averageLinesPerProject,
    };
  }

  /**
   * Convert to GlobalProjectIndex interface
   */
  toInterface(): GlobalProjectIndex {
    return {
      projects: this.getProjects(),
      statistics: this.getStatistics(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: { ...this.metadata },
    };
  }

  /**
   * Set metadata
   */
  setMetadata(metadata: Record<string, unknown>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  /**
   * Get metadata
   */
  getMetadata(): Record<string, unknown> {
    return { ...this.metadata };
  }

  /**
   * Validate the index
   */
  isValid(): boolean {
    // Validate all projects
    for (const project of this.projects.values()) {
      if (!project.id || !project.name || !project.type || !project.rootPath) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clear all projects
   */
  clear(): void {
    this.projects.clear();
    this.updatedAt = new Date();
  }
}

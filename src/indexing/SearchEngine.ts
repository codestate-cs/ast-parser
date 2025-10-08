/**
 * SearchEngine class for searching through indexed projects
 */

import {
  SearchQuery,
  SearchResult,
  SearchEngineOptions,
  ProjectIndexEntry,
} from '../types/indexing';

export class SearchEngine {
  private projects: Map<string, ProjectIndexEntry> = new Map();
  private cache: Map<string, SearchResult[]> = new Map();
  private options: Required<SearchEngineOptions>;
  private searchStats = {
    totalSearches: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(options: Partial<SearchEngineOptions> = {}) {
    this.options = {
      fuzzySearch: options.fuzzySearch ?? false,
      fuzzyThreshold: options.fuzzyThreshold ?? 0.8,
      regexSearch: options.regexSearch ?? false,
      caseSensitive: options.caseSensitive ?? false,
      maxResults: options.maxResults ?? 100,
      cacheSize: options.cacheSize ?? 1000,
      cacheTTL: options.cacheTTL ?? 300000, // 5 minutes
    };
  }

  /**
   * Index projects for searching
   */
  indexProjects(projects: ProjectIndexEntry[]): void {
    this.projects.clear();
    this.cache.clear();

    for (const project of projects) {
      this.projects.set(project.id, project);
    }
  }

  /**
   * Update a single project in the index
   */
  updateProject(project: ProjectIndexEntry): void {
    this.projects.set(project.id, project);
    this.cache.clear(); // Invalidate cache
  }

  /**
   * Remove a project from the index
   */
  removeProject(projectId: string): void {
    this.projects.delete(projectId);
    this.cache.clear(); // Invalidate cache
  }

  /**
   * Clear the entire index
   */
  clearIndex(): void {
    this.projects.clear();
    this.cache.clear();
  }

  /**
   * Search for projects based on query criteria
   */
  search(query: SearchQuery): SearchResult[] {
    if (!query) {
      throw new Error('Search query is required');
    }

    if (!query.criteria) {
      return [];
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(query);
    if (this.cache.has(cacheKey)) {
      this.searchStats.cacheHits++;
      this.searchStats.totalSearches++;
      return this.cache.get(cacheKey)!;
    }

    this.searchStats.cacheMisses++;
    this.searchStats.totalSearches++;

    const results: SearchResult[] = [];
    const projects = Array.from(this.projects.values());

    for (const project of projects) {
      const score = this.calculateMatchScore(query, project);
      if (score > 0) {
        results.push({
          project,
          score,
          matchReasons: this.getMatchedFields(query, project),
          highlights: this.getHighlights(query, project),
        });
      }
    }

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);

    // Apply limit and offset
    const { limit = 10, offset = 0 } = query.options || {};
    const paginatedResults = results.slice(offset, offset + limit);

    // Cache the results
    this.cache.set(cacheKey, paginatedResults);

    return paginatedResults;
  }

  /**
   * Calculate match score for a project against query criteria
   */
  private calculateMatchScore(query: SearchQuery, project: ProjectIndexEntry): number {
    let score = 0;
    const criteria = query.criteria;

    // Name matching (also search in description)
    if (criteria.name) {
      const nameScore = this.matchString(criteria.name, project.name, query.options);
      let totalScore = nameScore * 2; // Higher weight for name matches

      // Also search in description if available
      if (project.description) {
        const descScore = this.matchString(criteria.name, project.description, query.options);
        if (descScore > 0) {
          totalScore += descScore; // Lower weight for description matches
        }
      }

      if (totalScore > 0) {
        score += totalScore;
      }
    }

    // Type matching
    if (criteria.type && project.type === criteria.type) {
      score += 1;
    }

    // Language matching
    if (criteria.language && project.languages.includes(criteria.language)) {
      score += 1;
    }

    // Tags matching
    if (criteria.tags && criteria.tags.length > 0) {
      const matchingTags = criteria.tags.filter(tag => project.tags.includes(tag));
      score += matchingTags.length * 0.5;
    }

    // Author matching
    if (criteria.author && project.author) {
      const authorScore = this.matchString(criteria.author, project.author, query.options);
      if (authorScore > 0) {
        score += authorScore;
      }
    }

    // Repository matching
    if (criteria.repository && project.repository) {
      const repoScore = this.matchString(criteria.repository, project.repository, query.options);
      if (repoScore > 0) {
        score += repoScore;
      }
    }

    // Path matching
    if (criteria.path && project.rootPath) {
      const pathScore = this.matchString(criteria.path, project.rootPath, query.options);
      if (pathScore > 0) {
        score += pathScore;
      }
    }

    // Version matching
    if (criteria.version && project.version) {
      const versionScore = this.matchString(criteria.version, project.version, query.options);
      if (versionScore > 0) {
        score += versionScore;
      }
    }

    // Branch matching
    if (criteria.branch && project.metadata?.['branch']) {
      const branchScore = this.matchString(
        criteria.branch,
        project.metadata['branch'] as string,
        query.options
      );
      if (branchScore > 0) {
        score += branchScore;
      }
    }

    return score;
  }

  /**
   * Match a string against a target string based on search options
   */
  private matchString(query: string, target: string, options?: SearchQuery['options']): number {
    if (!query || !target) return 0;

    const caseSensitive = options?.caseSensitive ?? this.options.caseSensitive;
    const exactMatch = options?.exactMatch ?? false;
    const fuzzySearch = this.options.fuzzySearch;
    const regexSearch = this.options.regexSearch;

    let searchQuery = query;
    let searchTarget = target;

    if (!caseSensitive) {
      searchQuery = query.toLowerCase();
      searchTarget = target.toLowerCase();
    }

    // Exact match
    if (exactMatch) {
      return searchQuery === searchTarget ? 1 : 0;
    }

    // Regex search
    if (regexSearch) {
      try {
        const regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
        return regex.test(searchTarget) ? 1 : 0;
      } catch {
        return 0; // Invalid regex
      }
    }

    // Fuzzy search
    if (fuzzySearch) {
      const similarity = this.calculateSimilarity(searchQuery, searchTarget);
      return similarity >= this.options.fuzzyThreshold ? similarity : 0;
    }

    // Partial match
    return searchTarget.includes(searchQuery) ? 1 : 0;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [];
      for (let j = 0; j <= str1.length; j++) {
        if (i === 0) {
          matrix[i]![j] = j;
        } else if (j === 0) {
          matrix[i]![j] = i;
        } else if (str2[i - 1] === str1[j - 1]) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1
          );
        }
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length]![str1.length]!) / maxLength;
  }

  /**
   * Get the fields that matched in the search
   */
  private getMatchedFields(query: SearchQuery, project: ProjectIndexEntry): string[] {
    const matchedFields: string[] = [];
    const criteria = query.criteria;

    if (criteria.name && this.matchString(criteria.name, project.name, query.options) > 0) {
      matchedFields.push('name');
    }
    if (criteria.type && project.type === criteria.type) {
      matchedFields.push('type');
    }
    if (criteria.language && project.languages.includes(criteria.language)) {
      matchedFields.push('language');
    }
    if (criteria.tags?.some(tag => project.tags.includes(tag))) {
      matchedFields.push('tags');
    }
    if (
      criteria.author &&
      project.author &&
      this.matchString(criteria.author, project.author, query.options) > 0
    ) {
      matchedFields.push('author');
    }
    if (
      criteria.repository &&
      project.repository &&
      this.matchString(criteria.repository, project.repository, query.options) > 0
    ) {
      matchedFields.push('repository');
    }
    if (
      criteria.path &&
      project.rootPath &&
      this.matchString(criteria.path, project.rootPath, query.options) > 0
    ) {
      matchedFields.push('path');
    }
    if (
      criteria.version &&
      project.version &&
      this.matchString(criteria.version, project.version, query.options) > 0
    ) {
      matchedFields.push('version');
    }
    if (
      criteria.branch &&
      project.metadata?.['branch'] &&
      this.matchString(criteria.branch, project.metadata['branch'] as string, query.options) > 0
    ) {
      matchedFields.push('branch');
    }

    return matchedFields;
  }

  /**
   * Get highlighted fields for search results
   */
  private getHighlights(query: SearchQuery, project: ProjectIndexEntry): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    const criteria = query.criteria;

    if (criteria.name && this.matchString(criteria.name, project.name, query.options) > 0) {
      highlights['name'] = [project.name];
    }
    if (
      criteria.author &&
      project.author &&
      this.matchString(criteria.author, project.author, query.options) > 0
    ) {
      highlights['author'] = [project.author];
    }
    if (
      criteria.repository &&
      project.repository &&
      this.matchString(criteria.repository, project.repository, query.options) > 0
    ) {
      highlights['repository'] = [project.repository];
    }
    if (
      criteria.path &&
      project.rootPath &&
      this.matchString(criteria.path, project.rootPath, query.options) > 0
    ) {
      highlights['path'] = [project.rootPath];
    }
    if (
      criteria.version &&
      project.version &&
      this.matchString(criteria.version, project.version, query.options) > 0
    ) {
      highlights['version'] = [project.version];
    }
    if (
      criteria.branch &&
      project.metadata?.['branch'] &&
      this.matchString(criteria.branch, project.metadata['branch'] as string, query.options) > 0
    ) {
      highlights['branch'] = [project.metadata['branch'] as string];
    }

    return highlights;
  }

  /**
   * Generate cache key for a query
   */
  private generateCacheKey(query: SearchQuery): string {
    return JSON.stringify({
      criteria: query.criteria,
      options: query.options,
    });
  }

  /**
   * Get the number of indexed projects
   */
  getIndexedProjectCount(): number {
    return this.projects.size;
  }

  /**
   * Get search statistics
   */
  getSearchStatistics(): { totalSearches: number; cacheHits: number; cacheMisses: number } {
    return { ...this.searchStats };
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

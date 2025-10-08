/**
 * Individual project index management
 */

import {
  ProjectIndexEntry,
  VersionIndexEntry,
  BranchIndexEntry,
  ProjectIndex as ProjectIndexInterface,
} from '../types/indexing';

/**
 * Project index statistics
 */
export interface ProjectIndexStatistics {
  /** Number of versions */
  versionCount: number;
  /** Number of branches */
  branchCount: number;
  /** Has current version set */
  hasCurrentVersion: boolean;
  /** Has active branch set */
  hasActiveBranch: boolean;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Individual project index class
 */
export class ProjectIndex {
  private project: ProjectIndexEntry;
  private versions: Map<string, VersionIndexEntry> = new Map();
  private branches: Map<string, BranchIndexEntry> = new Map();
  private currentVersionId: string | undefined;
  private activeBranchName: string | undefined;
  private createdAt: Date;
  private updatedAt: Date;
  private metadata: Record<string, unknown> = {};

  constructor(project: ProjectIndexEntry) {
    this.project = { ...project };
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Get the project entry
   */
  getProject(): ProjectIndexEntry {
    return { ...this.project };
  }

  /**
   * Get all versions
   */
  getVersions(): VersionIndexEntry[] {
    return Array.from(this.versions.values());
  }

  /**
   * Get all branches
   */
  getBranches(): BranchIndexEntry[] {
    return Array.from(this.branches.values());
  }

  /**
   * Get current version
   */
  getCurrentVersion(): VersionIndexEntry | undefined {
    if (!this.currentVersionId) {
      return undefined;
    }
    return this.versions.get(this.currentVersionId);
  }

  /**
   * Get active branch
   */
  getActiveBranch(): BranchIndexEntry | undefined {
    if (!this.activeBranchName) {
      return undefined;
    }
    return this.branches.get(this.activeBranchName);
  }

  /**
   * Add a version to the index
   */
  addVersion(version: VersionIndexEntry): void {
    if (!this.versions.has(version.id)) {
      this.versions.set(version.id, { ...version });
      this.updatedAt = new Date();

      // Set as current version if it's the first version
      if (this.versions.size === 1) {
        this.currentVersionId = version.id;
      }
    }
  }

  /**
   * Set current version
   */
  setCurrentVersion(versionId: string): void {
    if (!this.versions.has(versionId)) {
      throw new Error('Version not found');
    }
    this.currentVersionId = versionId;
    this.updatedAt = new Date();
  }

  /**
   * Add a branch to the index
   */
  addBranch(branch: BranchIndexEntry): void {
    if (!this.branches.has(branch.name)) {
      this.branches.set(branch.name, { ...branch });
      this.updatedAt = new Date();

      // Set as active branch if it's the first branch
      if (this.branches.size === 1) {
        this.activeBranchName = branch.name;
      }
    }
  }

  /**
   * Set active branch
   */
  setActiveBranch(branchName: string): void {
    if (!this.branches.has(branchName)) {
      throw new Error('Branch not found');
    }
    this.activeBranchName = branchName;
    this.updatedAt = new Date();
  }

  /**
   * Update the project entry
   */
  updateProject(project: Partial<ProjectIndexEntry>): void {
    // Preserve the original ID
    const originalId = this.project.id;
    this.project = { ...this.project, ...project, id: originalId };
    this.updatedAt = new Date();
  }

  /**
   * Get version by ID
   */
  getVersion(versionId: string): VersionIndexEntry | undefined {
    return this.versions.get(versionId);
  }

  /**
   * Get branch by name
   */
  getBranch(branchName: string): BranchIndexEntry | undefined {
    return this.branches.get(branchName);
  }

  /**
   * Remove version by ID
   */
  removeVersion(versionId: string): void {
    if (this.versions.has(versionId)) {
      this.versions.delete(versionId);
      this.updatedAt = new Date();

      // Clear current version if it was removed
      if (this.currentVersionId === versionId) {
        this.currentVersionId = undefined;
      }
    }
  }

  /**
   * Remove branch by name
   */
  removeBranch(branchName: string): void {
    if (this.branches.has(branchName)) {
      this.branches.delete(branchName);
      this.updatedAt = new Date();

      // Clear active branch if it was removed
      if (this.activeBranchName === branchName) {
        this.activeBranchName = undefined;
      }
    }
  }

  /**
   * Convert to ProjectIndex interface
   */
  toInterface(): ProjectIndexInterface {
    return {
      project: this.getProject(),
      versions: this.getVersions(),
      branches: this.getBranches(),
      currentVersion: this.getCurrentVersion(),
      activeBranch: this.getActiveBranch(),
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
    // Validate project entry
    if (!this.project.id || !this.project.name || !this.project.type || !this.project.rootPath) {
      return false;
    }

    // Validate versions
    for (const version of this.versions.values()) {
      if (!version.id || !version.version || !version.type) {
        return false;
      }
    }

    // Validate branches
    for (const branch of this.branches.values()) {
      if (!branch.name || !branch.type) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get index statistics
   */
  getStatistics(): ProjectIndexStatistics {
    return {
      versionCount: this.versions.size,
      branchCount: this.branches.size,
      hasCurrentVersion: this.currentVersionId !== undefined,
      hasActiveBranch: this.activeBranchName !== undefined,
      lastUpdated: this.updatedAt,
    };
  }
}

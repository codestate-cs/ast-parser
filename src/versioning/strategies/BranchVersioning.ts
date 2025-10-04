/**
 * Branch-based versioning strategy
 * 
 * This strategy creates versions based on git branches, including branch names,
 * commit hashes, and branch-specific metadata. It supports different branch
 * types (main, feature, develop, release, hotfix) with appropriate naming conventions.
 */

import { BaseVersioningStrategy } from './BaseVersioningStrategy';
import { 
  VersionMetadata, 
  VersionComparison, 
  BranchInfo
} from '../../types/versioning';

/**
 * Branch-based versioning strategy
 */
export class BranchVersioning extends BaseVersioningStrategy {
  private readonly branchTypePatterns: Record<string, RegExp> = {
    main: /^(main|master)$/i,
    feature: /^feature/i,
    develop: /^(develop|dev)$/i,
    release: /^release/i,
    hotfix: /^hotfix/i
  };

  /**
   * Generate a version identifier based on branch and commit information
   */
  async generateVersion(metadata: VersionMetadata): Promise<string> {
    try {
      if (!this.validateMetadata(metadata)) {
        throw this.createError('Invalid version metadata', 'INVALID_METADATA');
      }

      const branchName = this.extractBranchName(metadata);
      const commitHash = this.extractCommitHash(metadata);
      const version = metadata.version;

      return this.formatBranchVersion(branchName, commitHash, version);
    } catch (error) {
      this.handleError(error as Error, 'generateVersion');
      throw error;
    }
  }

  /**
   * Parse a branch-based version string to extract metadata
   */
  async parseVersion(version: string): Promise<VersionMetadata> {
    try {
      if (!this.isValidVersion(version)) {
        // Return basic metadata for invalid versions instead of throwing
        return {
          version,
          createdAt: this.generateTimestamp(),
          tags: []
        };
      }

      const parts = this.parseVersionParts(version);
      
      const metadata: VersionMetadata = {
        version,
        createdAt: this.generateTimestamp(),
        tags: []
      };

      if (parts.branch) {
        metadata.branch = {
          name: parts.branch,
          type: this.detectBranchType(parts.branch),
          description: this.generateBranchDescription(parts.branch)
        };
      }

      if (parts.commit) {
        metadata.commit = {
          hash: parts.commit,
          message: '',
          author: '',
          date: this.generateTimestamp(),
          parents: [],
          filesChanged: []
        };
      }

      return metadata;
    } catch (error) {
      this.handleError(error as Error, 'parseVersion');
      // Return basic metadata instead of throwing
      return {
        version,
        createdAt: this.generateTimestamp(),
        tags: []
      };
    }
  }

  /**
   * Compare two branch-based versions
   */
  async compareVersions(version1: string, version2: string): Promise<VersionComparison> {
    try {
      if (!this.isValidVersion(version1) || !this.isValidVersion(version2)) {
        return {
          result: 'incompatible',
          details: this.generateComparisonDetails(version1, version2, 'incompatible')
        };
      }

      const parts1 = this.parseVersionParts(version1);
      const parts2 = this.parseVersionParts(version2);

      // Check if versions are from the same branch
      if (parts1.branch !== parts2.branch) {
        return {
          result: 'incompatible',
          details: {
            compatible: false,
            breakingChanges: true,
            newFeatures: false,
            bugFixes: false,
            information: `Versions from different branches: ${parts1.branch} vs ${parts2.branch}`
          }
        };
      }

      // Compare semantic versions
      const comparison = this.compareSemanticVersions(parts1.version, parts2.version);
      
      const result: VersionComparison = {
        result: comparison.result,
        details: this.generateComparisonDetails(version1, version2, comparison.result)
      };

      if (comparison.difference !== undefined) {
        result.difference = comparison.difference;
      }

      return result;
    } catch (error) {
      this.handleError(error as Error, 'compareVersions');
      throw error;
    }
  }

  /**
   * Get the strategy name
   */
  getStrategyName(): string {
    return 'branch';
  }

  /**
   * Validate if a version string is valid for branch-based versioning
   */
  isValidVersion(version: string): boolean {
    if (!version || typeof version !== 'string') {
      return false;
    }

    // Expected format: branch-commithash-semanticversion
    // Examples: main-a1b2c3d4-1.0.0, feature-auth-b2c3d4e5-1.0.0
    const pattern = /^[a-zA-Z0-9\-]+-[a-f0-9]{8}-[\d\.]+$/;
    return pattern.test(version);
  }

  /**
   * Detect branch type from branch name
   */
  detectBranchType(branchName: string): BranchInfo['type'] {
    for (const [type, pattern] of Object.entries(this.branchTypePatterns)) {
      if (pattern.test(branchName)) {
        return type as BranchInfo['type'];
      }
    }
    return 'custom';
  }

  /**
   * Format branch name for version string
   */
  formatBranchName(branchName: string): string {
    return branchName
      .replace(/[^a-zA-Z0-9\-\.]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  /**
   * Extract branch name from metadata
   */
  private extractBranchName(metadata: VersionMetadata): string {
    if (metadata.branch?.name) {
      return this.formatBranchName(metadata.branch.name);
    }
    return 'unknown';
  }

  /**
   * Extract commit hash from metadata
   */
  private extractCommitHash(metadata: VersionMetadata): string {
    if (metadata.commit?.hash) {
      return metadata.commit.hash.substring(0, 8);
    }
    return '00000000';
  }

  /**
   * Format branch-based version string
   */
  private formatBranchVersion(branchName: string, commitHash: string, version: string): string {
    return `${branchName}-${commitHash}-${version}`;
  }

  /**
   * Parse version string into components
   */
  private parseVersionParts(versionString: string): {
    branch: string;
    commit: string;
    version: string;
  } {
    const parts = versionString.split('-');
    
    if (parts.length < 3) {
      throw this.createError(`Invalid version format: ${versionString}`, 'INVALID_FORMAT');
    }

    // Find the commit hash (8 characters) and semantic version
    let commitIndex = -1;
    let versionIndex = -1;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (!part) continue;
      
      // Check if this part is a commit hash (8 hex characters)
      if (/^[a-f0-9]{8}$/.test(part)) {
        commitIndex = i;
      }
      
      // Check if this part is a semantic version
      if (/^\d+\.\d+/.test(part)) {
        versionIndex = i;
        break;
      }
    }

    if (commitIndex === -1 || versionIndex === -1) {
      throw this.createError(`Could not parse version components: ${versionString}`, 'PARSE_ERROR');
    }

    const branch = parts.slice(0, commitIndex).join('-');
    const commit = parts[commitIndex]!;
    const version = parts.slice(versionIndex).join('.');

    return { branch, commit, version };
  }

  /**
   * Compare semantic versions
   */
  private compareSemanticVersions(version1: string, version2: string): {
    result: 'greater' | 'less' | 'equal' | 'incompatible';
    difference?: number;
  } {
    try {
      const v1Parts = version1.split('.').map(Number);
      const v2Parts = version2.split('.').map(Number);

      // Ensure both versions have the same number of parts
      const maxLength = Math.max(v1Parts.length, v2Parts.length);
      
      while (v1Parts.length < maxLength) v1Parts.push(0);
      while (v2Parts.length < maxLength) v2Parts.push(0);

      for (let i = 0; i < maxLength; i++) {
        const v1Part = v1Parts[i]!;
        const v2Part = v2Parts[i]!;
        
        if (v1Part > v2Part) {
          return { result: 'greater', difference: v1Part - v2Part };
        }
        if (v1Part < v2Part) {
          return { result: 'less', difference: v1Part - v2Part };
        }
      }

      return { result: 'equal', difference: 0 };
    } catch {
      return { result: 'incompatible' };
    }
  }

  /**
   * Generate branch description
   */
  private generateBranchDescription(branchName: string): string {
    const type = this.detectBranchType(branchName);
    
    switch (type) {
      case 'main':
        return 'Main production branch';
      case 'feature':
        return `Feature branch: ${branchName}`;
      case 'develop':
        return 'Development branch';
      case 'release':
        return `Release branch: ${branchName}`;
      case 'hotfix':
        return `Hotfix branch: ${branchName}`;
      default:
        return `Custom branch: ${branchName}`;
    }
  }

  /**
   * Get branch protection rules for branch type
   */
  getBranchProtection(branchType: BranchInfo['type']) {
    const protectionRules = {
      main: {
        requirePullRequestReviews: true,
        requireStatusChecks: true,
        requireUpToDateBranches: true,
        restrictPushes: true
      },
      develop: {
        requirePullRequestReviews: true,
        requireStatusChecks: true,
        requireUpToDateBranches: true,
        restrictPushes: false
      },
      feature: {
        requirePullRequestReviews: false,
        requireStatusChecks: false,
        requireUpToDateBranches: false,
        restrictPushes: false
      },
      release: {
        requirePullRequestReviews: true,
        requireStatusChecks: true,
        requireUpToDateBranches: true,
        restrictPushes: true
      },
      hotfix: {
        requirePullRequestReviews: true,
        requireStatusChecks: true,
        requireUpToDateBranches: false,
        restrictPushes: true
      },
      custom: {
        requirePullRequestReviews: false,
        requireStatusChecks: false,
        requireUpToDateBranches: false,
        restrictPushes: false
      }
    };

    return protectionRules[branchType];
  }

  /**
   * Check if branch is protected
   */
  isBranchProtected(branchType: BranchInfo['type']): boolean {
    const protection = this.getBranchProtection(branchType);
    return protection ? (protection.restrictPushes || protection.requirePullRequestReviews) : false;
  }

  /**
   * Get version priority based on branch type
   */
  getBranchPriority(branchType: BranchInfo['type']): number {
    const priorities = {
      main: 100,
      release: 90,
      hotfix: 80,
      develop: 70,
      feature: 60,
      custom: 50
    };

    return priorities[branchType];
  }

  /**
   * Check if version should be promoted
   */
  shouldPromoteVersion(fromBranch: BranchInfo['type'], toBranch: BranchInfo['type']): boolean {
    const fromPriority = this.getBranchPriority(fromBranch);
    const toPriority = this.getBranchPriority(toBranch);
    
    return toPriority > fromPriority;
  }

  /**
   * Generate version promotion path
   */
  getPromotionPath(currentBranch: BranchInfo['type']): BranchInfo['type'][] {
    const allBranches: BranchInfo['type'][] = ['custom', 'feature', 'develop', 'release', 'main'];
    const currentIndex = allBranches.indexOf(currentBranch);
    
    if (currentIndex === -1) {
      return [];
    }
    
    return allBranches.slice(currentIndex + 1);
  }
}

/**
 * Tests for BranchVersioning strategy
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BranchVersioning } from '../../../../src/versioning/strategies/BranchVersioning';
import { VersionMetadata, BranchInfo } from '../../../../src/types/versioning';

describe('BranchVersioning', () => {
  let strategy: BranchVersioning;

  beforeEach(() => {
    strategy = new BranchVersioning();
  });

  describe('generateVersion', () => {
    it('should generate version with branch and commit info', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        branch: {
          name: 'main',
          type: 'main',
          description: 'Main branch'
        },
        commit: {
          hash: 'a1b2c3d4e5f6',
          message: 'Initial commit',
          author: 'developer@example.com',
          date: new Date().toISOString(),
          parents: [],
          filesChanged: ['src/index.ts']
        }
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toContain('main');
      expect(result).toContain('a1b2c3d4');
    });

    it('should handle feature branches', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['feature'],
        branch: {
          name: 'feature/auth',
          type: 'feature',
          description: 'Authentication feature'
        },
        commit: {
          hash: 'b2c3d4e5f6g7',
          message: 'Add authentication',
          author: 'developer@example.com',
          date: new Date().toISOString(),
          parents: ['a1b2c3d4e5f6'],
          filesChanged: ['src/auth.ts']
        }
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toContain('feature-auth');
      expect(result).toContain('b2c3d4e5');
    });

    it('should handle develop branches', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['develop'],
        branch: {
          name: 'develop',
          type: 'develop',
          description: 'Development branch'
        },
        commit: {
          hash: 'c3d4e5f6g7h8',
          message: 'Development changes',
          author: 'developer@example.com',
          date: new Date().toISOString(),
          parents: ['b2c3d4e5f6g7'],
          filesChanged: ['src/utils.ts']
        }
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toContain('develop');
      expect(result).toContain('c3d4e5f6');
    });

    it('should handle missing branch info', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['unknown']
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toBeDefined();
      expect(result).toContain('1.0.0');
    });
  });

  describe('parseVersion', () => {
    it('should parse branch-based version', async () => {
      const version = 'main-a1b2c3d4-1.0.0';
      const result = await strategy.parseVersion(version);

      expect(result.version).toBe(version);
      expect(result.branch?.name).toBe('main');
      expect(result.commit?.hash).toBe('a1b2c3d4');
    });

    it('should parse feature branch version', async () => {
      const version = 'feature-auth-b2c3d4e5-1.0.0';
      const result = await strategy.parseVersion(version);

      expect(result.version).toBe(version);
      expect(result.branch?.name).toBe('feature-auth');
      expect(result.branch?.type).toBe('feature');
      expect(result.commit?.hash).toBe('b2c3d4e5');
    });

    it('should handle invalid version format', async () => {
      const version = 'invalid-version';
      const result = await strategy.parseVersion(version);

      expect(result.version).toBe(version);
      expect(result.branch).toBeUndefined();
      expect(result.commit).toBeUndefined();
    });
  });

  describe('compareVersions', () => {
    it('should compare versions from same branch', async () => {
      const result = await strategy.compareVersions(
        'main-a1b2c3d4-1.0.0',
        'main-b2c3d4e5-1.1.0'
      );

      expect(result.result).toBe('less');
      expect(result.details.compatible).toBe(true);
    });

    it('should compare versions from different branches', async () => {
      const result = await strategy.compareVersions(
        'main-a1b2c3d4-1.0.0',
        'feature-auth-b2c3d4e5-1.0.0'
      );

      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });

    it('should handle equal versions', async () => {
      const result = await strategy.compareVersions(
        'main-a1b2c3d4-1.0.0',
        'main-a1b2c3d4-1.0.0'
      );

      expect(result.result).toBe('equal');
      expect(result.details.compatible).toBe(true);
    });
  });

  describe('getStrategyName', () => {
    it('should return strategy name', () => {
      expect(strategy.getStrategyName()).toBe('branch');
    });
  });

  describe('isValidVersion', () => {
    it('should validate branch-based versions', () => {
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0')).toBe(true);
      expect(strategy.isValidVersion('feature-auth-b2c3d4e5-1.0.0')).toBe(true);
      expect(strategy.isValidVersion('develop-c3d4e5f6-1.0.0')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(strategy.isValidVersion('invalid-version')).toBe(false);
      expect(strategy.isValidVersion('')).toBe(false);
      expect(strategy.isValidVersion('main-')).toBe(false);
    });
  });

  describe('branch type detection', () => {
    it('should detect main branch type', () => {
      const branchInfo: BranchInfo = {
        name: 'main',
        type: 'main'
      };

      expect(strategy.detectBranchType(branchInfo.name)).toBe('main');
    });

    it('should detect feature branch type', () => {
      expect(strategy.detectBranchType('feature/auth')).toBe('feature');
      expect(strategy.detectBranchType('feature/user-management')).toBe('feature');
    });

    it('should detect develop branch type', () => {
      expect(strategy.detectBranchType('develop')).toBe('develop');
    });

    it('should detect release branch type', () => {
      expect(strategy.detectBranchType('release/1.0.0')).toBe('release');
    });

    it('should detect hotfix branch type', () => {
      expect(strategy.detectBranchType('hotfix/critical-bug')).toBe('hotfix');
    });

    it('should default to custom for unknown patterns', () => {
      expect(strategy.detectBranchType('custom-branch')).toBe('custom');
    });
  });

  describe('version formatting', () => {
    it('should format branch names correctly', () => {
      expect(strategy.formatBranchName('feature/auth')).toBe('feature-auth');
      expect(strategy.formatBranchName('release/1.0.0')).toBe('release-1.0.0');
      expect(strategy.formatBranchName('hotfix/critical-bug')).toBe('hotfix-critical-bug');
    });

    it('should handle special characters in branch names', () => {
      expect(strategy.formatBranchName('feature/user@management')).toBe('feature-user-management');
      expect(strategy.formatBranchName('feature/user_management')).toBe('feature-user-management');
    });
  });

  describe('error handling', () => {
    it('should handle invalid metadata in generateVersion', async () => {
      const invalidMetadata: VersionMetadata = {
        version: '',
        createdAt: 'invalid-date',
        tags: 'not-an-array' as any
      };

      await expect(strategy.generateVersion(invalidMetadata)).rejects.toThrow();
    });

    it('should handle parse errors gracefully', async () => {
      const result = await strategy.parseVersion('invalid-format');
      expect(result.version).toBe('invalid-format');
      expect(result.branch).toBeUndefined();
    });
  });

  describe('branch protection and promotion', () => {
    it('should get branch protection rules', () => {
      const mainProtection = strategy.getBranchProtection('main');
      expect(mainProtection.requirePullRequestReviews).toBe(true);
      expect(mainProtection.restrictPushes).toBe(true);

      const featureProtection = strategy.getBranchProtection('feature');
      expect(featureProtection.requirePullRequestReviews).toBe(false);
      expect(featureProtection.restrictPushes).toBe(false);

      const developProtection = strategy.getBranchProtection('develop');
      expect(developProtection.requirePullRequestReviews).toBe(true);
      expect(developProtection.restrictPushes).toBe(false);

      const releaseProtection = strategy.getBranchProtection('release');
      expect(releaseProtection.requirePullRequestReviews).toBe(true);
      expect(releaseProtection.restrictPushes).toBe(true);

      const hotfixProtection = strategy.getBranchProtection('hotfix');
      expect(hotfixProtection.requirePullRequestReviews).toBe(true);
      expect(hotfixProtection.restrictPushes).toBe(true);

      const customProtection = strategy.getBranchProtection('custom');
      expect(customProtection.requirePullRequestReviews).toBe(false);
      expect(customProtection.restrictPushes).toBe(false);
    });

    it('should check if branch is protected', () => {
      expect(strategy.isBranchProtected('main')).toBe(true);
      expect(strategy.isBranchProtected('feature')).toBe(false);
      expect(strategy.isBranchProtected('develop')).toBe(true);
      expect(strategy.isBranchProtected('release')).toBe(true);
      expect(strategy.isBranchProtected('hotfix')).toBe(true);
      expect(strategy.isBranchProtected('custom')).toBe(false);
    });

    it('should get branch priority', () => {
      expect(strategy.getBranchPriority('main')).toBe(100);
      expect(strategy.getBranchPriority('release')).toBe(90);
      expect(strategy.getBranchPriority('hotfix')).toBe(80);
      expect(strategy.getBranchPriority('develop')).toBe(70);
      expect(strategy.getBranchPriority('feature')).toBe(60);
      expect(strategy.getBranchPriority('custom')).toBe(50);
    });

    it('should check if version should be promoted', () => {
      expect(strategy.shouldPromoteVersion('feature', 'develop')).toBe(true);
      expect(strategy.shouldPromoteVersion('develop', 'feature')).toBe(false);
      expect(strategy.shouldPromoteVersion('main', 'release')).toBe(false);
      expect(strategy.shouldPromoteVersion('release', 'main')).toBe(true);
    });

    it('should get promotion path', () => {
      const featurePath = strategy.getPromotionPath('feature');
      expect(featurePath).toEqual(['develop', 'release', 'main']);

      const developPath = strategy.getPromotionPath('develop');
      expect(developPath).toEqual(['release', 'main']);

      const releasePath = strategy.getPromotionPath('release');
      expect(releasePath).toEqual(['main']);

      const mainPath = strategy.getPromotionPath('main');
      expect(mainPath).toEqual([]);

      const customPath = strategy.getPromotionPath('custom');
      expect(customPath).toEqual(['feature', 'develop', 'release', 'main']);
    });
  });

  describe('semantic version comparison', () => {
    it('should compare semantic versions correctly', async () => {
      const result1 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-b2c3d4e5-1.1.0');
      expect(result1.result).toBe('less');

      const result2 = await strategy.compareVersions('main-b2c3d4e5-1.1.0', 'main-a1b2c3d4-1.0.0');
      expect(result2.result).toBe('greater');

      const result3 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-c3d4e5f6-1.0.0');
      expect(result3.result).toBe('equal');

      const result4 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-a1b2c3d4-2.0.0');
      expect(result4.result).toBe('less');
    });

    it('should handle complex semantic versions', async () => {
      const result1 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-b2c3d4e5-1.0.1');
      expect(result1.result).toBe('less');

      const result2 = await strategy.compareVersions('main-a1b2c3d4-1.2.3', 'main-b2c3d4e5-1.2.4');
      expect(result2.result).toBe('less');

      const result3 = await strategy.compareVersions('main-a1b2c3d4-2.0.0', 'main-b2c3d4e5-1.9.9');
      expect(result3.result).toBe('greater');
    });
  });

  describe('edge cases', () => {
    it('should handle empty branch names', () => {
      expect(strategy.formatBranchName('')).toBe('');
      expect(strategy.formatBranchName('   ')).toBe('');
    });

    it('should handle branch names with multiple special characters', () => {
      expect(strategy.formatBranchName('feature/user@domain.com')).toBe('feature-user-domain.com');
      expect(strategy.formatBranchName('feature/user+test')).toBe('feature-user-test');
    });

    it('should handle very long branch names', () => {
      const longBranch = 'feature/very-long-branch-name-with-many-segments';
      const formatted = strategy.formatBranchName(longBranch);
      expect(formatted).toBe('feature-very-long-branch-name-with-many-segments');
    });

    it('should handle versions with different formats', () => {
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0')).toBe(true);
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0.0')).toBe(true);
      expect(strategy.isValidVersion('main-a1b2c3d4-1')).toBe(true);
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0')).toBe(true);
    });

    it('should handle invalid version parsing gracefully', async () => {
      const invalidVersions = [
        'main-',
        '-a1b2c3d4-1.0.0',
        'main-a1b2c3d4-',
        'main-a1b2c3d4',
        'main-a1b2c3d4-1.0.0-extra'
      ];

      for (const version of invalidVersions) {
        const result = await strategy.parseVersion(version);
        expect(result.version).toBe(version);
        expect(result.branch).toBeUndefined();
        expect(result.commit).toBeUndefined();
      }
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle parseVersionParts errors', async () => {
      // Test invalid version formats that should trigger parseVersionParts errors
      const invalidVersions = [
        'main-a1b2c3d4', // Missing semantic version
        'main-1.0.0', // Missing commit hash
        'a1b2c3d4-1.0.0', // Missing branch name
        'main-a1b2c3d4-1.0.0-extra', // Extra parts
        'main-a1b2c3d4-', // Missing version after dash
        '-a1b2c3d4-1.0.0', // Missing branch before dash
        'main-a1b2c3d4-1.0.0-', // Trailing dash
      ];

      for (const version of invalidVersions) {
        const result = await strategy.parseVersion(version);
        expect(result.version).toBe(version);
        expect(result.branch).toBeUndefined();
        expect(result.commit).toBeUndefined();
      }
    });

    it('should handle compareSemanticVersions edge cases', async () => {
      // Test versions with different number of parts
      const result1 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-a1b2c3d4-1.0.0.0');
      expect(result1.result).toBe('equal'); // Same semantic version, different commit

      const result2 = await strategy.compareVersions('main-a1b2c3d4-1.0.0.0', 'main-a1b2c3d4-1.0.0');
      expect(result2.result).toBe('equal'); // Same semantic version, different commit

      // Test versions with non-numeric parts
      const result3 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-a1b2c3d4-1.0.a');
      expect(result3.result).toBe('incompatible');
    });

    it('should handle generateBranchDescription for all branch types', () => {
      // Test each branch type individually to ensure proper detection
      expect((strategy as any).generateBranchDescription('main')).toContain('Main production branch');
      expect((strategy as any).generateBranchDescription('feature/auth')).toContain('Feature branch');
      expect((strategy as any).generateBranchDescription('develop')).toContain('Development branch');
      expect((strategy as any).generateBranchDescription('release/1.0.0')).toContain('Release branch');
      expect((strategy as any).generateBranchDescription('hotfix/bug')).toContain('Hotfix branch');
      expect((strategy as any).generateBranchDescription('custom-branch')).toContain('Custom branch');
    });

    it('should handle branch name formatting edge cases', () => {
      // Test empty and whitespace-only names
      expect(strategy.formatBranchName('')).toBe('');
      expect(strategy.formatBranchName('   ')).toBe('');
      expect(strategy.formatBranchName('\t\n')).toBe('');

      // Test names with only special characters
      expect(strategy.formatBranchName('@#$%')).toBe('');
      expect(strategy.formatBranchName('---')).toBe('');

      // Test names with multiple consecutive special characters
      expect(strategy.formatBranchName('feature///auth')).toBe('feature-auth');
      expect(strategy.formatBranchName('feature---auth')).toBe('feature-auth');
      expect(strategy.formatBranchName('feature___auth')).toBe('feature-auth');

      // Test names starting/ending with special characters
      expect(strategy.formatBranchName('/feature/auth/')).toBe('feature-auth');
      expect(strategy.formatBranchName('-feature-auth-')).toBe('feature-auth');
    });

    it('should handle version validation edge cases', () => {
      // Test various invalid formats
      expect(strategy.isValidVersion('')).toBe(false);
      expect(strategy.isValidVersion('main')).toBe(false);
      expect(strategy.isValidVersion('main-')).toBe(false);
      expect(strategy.isValidVersion('main-a1b2c3d4')).toBe(false);
      expect(strategy.isValidVersion('main-a1b2c3d4-')).toBe(false);
      expect(strategy.isValidVersion('-a1b2c3d4-1.0.0')).toBe(false);
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0-')).toBe(false);
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0-extra')).toBe(false);

      // Test valid formats with different commit hash lengths
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0')).toBe(true);
      expect(strategy.isValidVersion('main-a1b2c3d-1.0.0')).toBe(false); // 7 chars
      expect(strategy.isValidVersion('main-a1b2c3d45-1.0.0')).toBe(false); // 9 chars

      // Test with different semantic version formats
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0')).toBe(true);
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0.0')).toBe(true);
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0.0.0')).toBe(true);
    });

    it('should handle branch type detection edge cases', () => {
      // Test case insensitive detection
      expect(strategy.detectBranchType('MAIN')).toBe('main');
      expect(strategy.detectBranchType('Main')).toBe('main');
      expect(strategy.detectBranchType('FEATURE/auth')).toBe('feature');
      expect(strategy.detectBranchType('Feature/Auth')).toBe('feature');

      // Test partial matches
      expect(strategy.detectBranchType('feature')).toBe('feature'); // Should match feature pattern
      expect(strategy.detectBranchType('main-branch')).toBe('custom'); // Should not match with suffix

      // Test edge cases
      expect(strategy.detectBranchType('')).toBe('custom');
      expect(strategy.detectBranchType(' ')).toBe('custom');
      expect(strategy.detectBranchType('feature/')).toBe('feature');
      expect(strategy.detectBranchType('/feature')).toBe('custom');
    });

    it('should handle error paths in generateVersion', async () => {
      // Test with invalid metadata that should trigger validation error
      const invalidMetadata: VersionMetadata = {
        version: '',
        createdAt: 'invalid-date',
        tags: 'not-an-array' as any
      };

      await expect(strategy.generateVersion(invalidMetadata)).rejects.toThrow();
    });

    it('should handle error paths in compareVersions', async () => {
      // Test with invalid versions that should trigger parseVersionParts errors
      const result1 = await strategy.compareVersions('invalid-version', 'main-a1b2c3d4-1.0.0');
      expect(result1.result).toBe('incompatible');

      const result2 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'invalid-version');
      expect(result2.result).toBe('incompatible');

      const result3 = await strategy.compareVersions('invalid-version', 'invalid-version');
      expect(result3.result).toBe('incompatible');
    });

    it('should handle error paths in parseVersion', async () => {
      // Test versions that should trigger parseVersionParts errors
      const invalidVersions = [
        'main-a1b2c3d4', // Missing semantic version
        'main-1.0.0', // Missing commit hash
        'a1b2c3d4-1.0.0', // Missing branch name
      ];

      for (const version of invalidVersions) {
        const result = await strategy.parseVersion(version);
        expect(result.version).toBe(version);
        expect(result.branch).toBeUndefined();
        expect(result.commit).toBeUndefined();
      }
    });

    it('should handle catch blocks in compareSemanticVersions', async () => {
      // Test with versions that should trigger the catch block
      const result = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-a1b2c3d4-invalid');
      expect(result.result).toBe('incompatible');
    });

    it('should handle catch blocks in parseVersion', async () => {
      // Test with versions that should trigger parseVersionParts errors
      const result = await strategy.parseVersion('main-a1b2c3d4');
      expect(result.version).toBe('main-a1b2c3d4');
      expect(result.branch).toBeUndefined();
      expect(result.commit).toBeUndefined();
    });

    it('should handle catch blocks in generateVersion', async () => {
      // Test with metadata that should trigger validation error
      const invalidMetadata: VersionMetadata = {
        version: '',
        createdAt: 'invalid-date',
        tags: 'not-an-array' as any
      };

      await expect(strategy.generateVersion(invalidMetadata)).rejects.toThrow();
    });

    it('should handle additional edge cases for branch protection', () => {
      // Test getBranchProtection with edge cases
      const protection1 = strategy.getBranchProtection('unknown-branch' as any);
      expect(protection1).toBeUndefined();

      // Test isBranchProtected with edge cases
      expect(strategy.isBranchProtected('unknown-branch' as any)).toBe(false);
      expect(strategy.isBranchProtected('' as any)).toBe(false);

      // Test getBranchPriority with edge cases
      expect(strategy.getBranchPriority('unknown-branch' as any)).toBeUndefined();
      expect(strategy.getBranchPriority('' as any)).toBeUndefined();

      // Test shouldPromoteVersion with edge cases
      expect(strategy.shouldPromoteVersion('unknown' as any, 'main')).toBe(false);
      expect(strategy.shouldPromoteVersion('main', 'unknown' as any)).toBe(false);

      // Test getPromotionPath with edge cases
      expect(strategy.getPromotionPath('unknown' as any)).toEqual([]);
      expect(strategy.getPromotionPath('' as any)).toEqual([]);
    });

    it('should handle additional edge cases for version validation', () => {
      // Test isValidVersion with edge cases
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0.0.0')).toBe(true);
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0.0.0.0')).toBe(true);
      expect(strategy.isValidVersion('main-a1b2c3d4-1.0.0.0.0.0.0')).toBe(true);
    });

    it('should handle additional edge cases for semantic version comparison', async () => {
      // Test with versions that have different number of parts
      const result1 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-a1b2c3d4-1.0.0.0');
      expect(result1.result).toBe('equal');

      // Test with versions that have non-numeric parts
      const result2 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-a1b2c3d4-1.0.a');
      expect(result2.result).toBe('incompatible');

      // Test with versions that have different commit hashes but same semantic version
      const result3 = await strategy.compareVersions('main-a1b2c3d4-1.0.0', 'main-b2c3d4e5-1.0.0');
      expect(result3.result).toBe('equal');
    });

    it('should handle additional edge cases for branch type detection', () => {
      // Test with various branch name patterns
      expect(strategy.detectBranchType('feature/auth')).toBe('feature');
      expect(strategy.detectBranchType('feature/user-management')).toBe('feature');
      expect(strategy.detectBranchType('feature/user_management')).toBe('feature');
      expect(strategy.detectBranchType('feature/user-management-v2')).toBe('feature');

      expect(strategy.detectBranchType('release/1.0.0')).toBe('release');
      expect(strategy.detectBranchType('release/v1.0.0')).toBe('release');
      expect(strategy.detectBranchType('release/1.0.0-beta')).toBe('release');

      expect(strategy.detectBranchType('hotfix/critical-bug')).toBe('hotfix');
      expect(strategy.detectBranchType('hotfix/security-patch')).toBe('hotfix');

      expect(strategy.detectBranchType('develop')).toBe('develop');
      expect(strategy.detectBranchType('dev')).toBe('develop');

      expect(strategy.detectBranchType('main')).toBe('main');
      expect(strategy.detectBranchType('master')).toBe('main');
    });

    it('should handle additional edge cases for version parsing', async () => {
      // Test parseVersion with edge cases that should trigger parseVersionParts errors
      const result1 = await strategy.parseVersion('main-a1b2c3d4');
      expect(result1.version).toBe('main-a1b2c3d4');
      expect(result1.branch).toBeUndefined();

      const result2 = await strategy.parseVersion('main-1.0.0');
      expect(result2.version).toBe('main-1.0.0');
      expect(result2.branch).toBeUndefined();

      const result3 = await strategy.parseVersion('a1b2c3d4-1.0.0');
      expect(result3.version).toBe('a1b2c3d4-1.0.0');
      expect(result3.branch).toBeUndefined();
    });
  });
});

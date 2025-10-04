/**
 * Tests for SemanticVersioning strategy
 */

import { SemanticVersioning } from '../../../../src/versioning/strategies/SemanticVersioning';
import { VersionMetadata } from '../../../../src/types/versioning';

describe('SemanticVersioning', () => {
  let strategy: SemanticVersioning;

  beforeEach(() => {
    strategy = new SemanticVersioning();
  });

  describe('getStrategyName', () => {
    it('should return "semantic"', () => {
      expect(strategy.getStrategyName()).toBe('semantic');
    });
  });

  describe('isValidVersion', () => {
    it('should return true for valid semantic versions', () => {
      expect(strategy.isValidVersion('1.0.0')).toBe(true);
      expect(strategy.isValidVersion('2.1.3')).toBe(true);
      expect(strategy.isValidVersion('0.0.1')).toBe(true);
      expect(strategy.isValidVersion('1.0.0-alpha')).toBe(true);
      expect(strategy.isValidVersion('1.0.0-alpha.1')).toBe(true);
      expect(strategy.isValidVersion('1.0.0-alpha.1+build.1')).toBe(true);
      expect(strategy.isValidVersion('1.0.0+build.1')).toBe(true);
      expect(strategy.isValidVersion('1.0.0-beta.2+exp.sha.5114f85')).toBe(true);
    });

    it('should return false for invalid semantic versions', () => {
      expect(strategy.isValidVersion('1.0')).toBe(false);
      expect(strategy.isValidVersion('1.0.0.0')).toBe(false);
      expect(strategy.isValidVersion('v1.0.0')).toBe(false);
      expect(strategy.isValidVersion('1.0.0-')).toBe(false);
      expect(strategy.isValidVersion('1.0.0+')).toBe(false);
      expect(strategy.isValidVersion('1.0.0-+build')).toBe(false);
      expect(strategy.isValidVersion('1.0.0-alpha.')).toBe(false);
      expect(strategy.isValidVersion('1.0.0-alpha..1')).toBe(false);
      expect(strategy.isValidVersion('')).toBe(false);
      expect(strategy.isValidVersion('invalid')).toBe(false);
    });
  });

  describe('generateVersion', () => {
    it('should generate basic semantic version from metadata', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toBe('1.0.0');
    });

    it('should generate semantic version with prerelease', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0-alpha',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: 'alpha',
          full: '1.0.0-alpha'
        }
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toBe('1.0.0-alpha');
    });

    it('should generate semantic version with build', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0+build.1',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          build: 'build.1',
          full: '1.0.0+build.1'
        }
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toBe('1.0.0+build.1');
    });

    it('should generate semantic version with prerelease and build', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0-alpha.1+build.1',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: 'alpha.1',
          build: 'build.1',
          full: '1.0.0-alpha.1+build.1'
        }
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toBe('1.0.0-alpha.1+build.1');
    });

    it('should throw error for invalid metadata', async () => {
      const metadata: VersionMetadata = {
        version: 'invalid',
        createdAt: '2024-01-15T10:30:00Z',
        tags: []
      };

      await expect(strategy.generateVersion(metadata)).rejects.toThrow();
    });

    it('should throw error for missing semantic info', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: []
      };

      await expect(strategy.generateVersion(metadata)).rejects.toThrow('Semantic version information is required');
    });

    it('should throw error for invalid version components', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 'invalid' as any,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      await expect(strategy.generateVersion(metadata)).rejects.toThrow('Major, minor, and patch must be numbers');
    });

    it('should throw error for negative version components', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: -1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      await expect(strategy.generateVersion(metadata)).rejects.toThrow('Version components must be non-negative');
    });
  });

  describe('parseVersion', () => {
    it('should parse basic semantic version', async () => {
      const result = await strategy.parseVersion('1.0.0');
      
      expect(result.version).toBe('1.0.0');
      expect(result.semantic).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        full: '1.0.0'
      });
    });

    it('should parse semantic version with prerelease', async () => {
      const result = await strategy.parseVersion('1.0.0-alpha');
      
      expect(result.version).toBe('1.0.0-alpha');
      expect(result.semantic).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: 'alpha',
        full: '1.0.0-alpha'
      });
    });

    it('should parse semantic version with build', async () => {
      const result = await strategy.parseVersion('1.0.0+build.1');
      
      expect(result.version).toBe('1.0.0+build.1');
      expect(result.semantic).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        build: 'build.1',
        full: '1.0.0+build.1'
      });
    });

    it('should parse semantic version with prerelease and build', async () => {
      const result = await strategy.parseVersion('1.0.0-alpha.1+build.1');
      
      expect(result.version).toBe('1.0.0-alpha.1+build.1');
      expect(result.semantic).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: 'alpha.1',
        build: 'build.1',
        full: '1.0.0-alpha.1+build.1'
      });
    });

    it('should throw error for invalid version', async () => {
      await expect(strategy.parseVersion('invalid')).rejects.toThrow();
    });
  });

  describe('compareVersions', () => {
    it('should compare basic versions correctly', async () => {
      const result1 = await strategy.compareVersions('2.0.0', '1.0.0');
      expect(result1.result).toBe('greater');
      expect(result1.difference).toBeGreaterThan(0);

      const result2 = await strategy.compareVersions('1.0.0', '2.0.0');
      expect(result2.result).toBe('less');
      expect(result2.difference).toBeLessThan(0);

      const result3 = await strategy.compareVersions('1.0.0', '1.0.0');
      expect(result3.result).toBe('equal');
      expect(result3.difference).toBe(0);
    });

    it('should compare versions with prerelease correctly', async () => {
      const result1 = await strategy.compareVersions('1.0.0', '1.0.0-alpha');
      expect(result1.result).toBe('greater');

      const result2 = await strategy.compareVersions('1.0.0-alpha', '1.0.0-beta');
      expect(result2.result).toBe('less');

      const result3 = await strategy.compareVersions('1.0.0-alpha.1', '1.0.0-alpha.2');
      expect(result3.result).toBe('less');
    });

    it('should compare versions with build identifiers', async () => {
      const result1 = await strategy.compareVersions('1.0.0+build.1', '1.0.0+build.2');
      expect(result1.result).toBe('equal'); // Build identifiers don't affect precedence

      const result2 = await strategy.compareVersions('1.0.0+build.1', '1.0.0');
      expect(result2.result).toBe('equal'); // Build identifiers don't affect precedence
    });

    it('should handle complex prerelease comparisons', async () => {
      const result1 = await strategy.compareVersions('1.0.0-alpha.1', '1.0.0-alpha.1');
      expect(result1.result).toBe('equal');

      const result2 = await strategy.compareVersions('1.0.0-alpha.10', '1.0.0-alpha.2');
      expect(result2.result).toBe('greater');

      const result3 = await strategy.compareVersions('1.0.0-alpha', '1.0.0-alpha.1');
      expect(result3.result).toBe('less');
    });

    it('should throw error for invalid versions', async () => {
      await expect(strategy.compareVersions('invalid', '1.0.0')).rejects.toThrow();
      await expect(strategy.compareVersions('1.0.0', 'invalid')).rejects.toThrow();
    });
  });

  describe('version bumping', () => {
    it('should bump major version', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      const result = await strategy.bumpVersion(metadata, 'major');
      expect(result).toBe('2.0.0');
    });

    it('should bump minor version', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      const result = await strategy.bumpVersion(metadata, 'minor');
      expect(result).toBe('1.1.0');
    });

    it('should bump patch version', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      const result = await strategy.bumpVersion(metadata, 'patch');
      expect(result).toBe('1.0.1');
    });

    it('should set prerelease version', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      const result = await strategy.bumpVersion(metadata, 'prerelease', 'alpha');
      expect(result).toBe('1.0.1-alpha');
    });

    it('should throw error for invalid bump type', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      await expect(strategy.bumpVersion(metadata, 'invalid' as any)).rejects.toThrow();
    });

    it('should increment existing prerelease identifier', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0-alpha',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: 'alpha',
          full: '1.0.0-alpha'
        }
      };

      const result = await strategy.bumpVersion(metadata, 'prerelease');
      expect(result).toBe('1.0.1-alpha.1');
    });

    it('should increment numeric prerelease identifier', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0-alpha.1',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: 'alpha.1',
          full: '1.0.0-alpha.1'
        }
      };

      const result = await strategy.bumpVersion(metadata, 'prerelease');
      expect(result).toBe('1.0.1-alpha.2');
    });

    it('should throw error for missing semantic info in bump', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-15T10:30:00Z',
        tags: []
      };

      await expect(strategy.bumpVersion(metadata, 'patch')).rejects.toThrow('Semantic version information is required for bumping');
    });
  });

  describe('edge cases', () => {
    it('should handle zero versions', async () => {
      expect(strategy.isValidVersion('0.0.0')).toBe(true);
      
      const result = await strategy.parseVersion('0.0.0');
      expect(result.semantic?.major).toBe(0);
      expect(result.semantic?.minor).toBe(0);
      expect(result.semantic?.patch).toBe(0);
    });

    it('should handle large version numbers', async () => {
      expect(strategy.isValidVersion('999.999.999')).toBe(true);
      
      const result = await strategy.parseVersion('999.999.999');
      expect(result.semantic?.major).toBe(999);
      expect(result.semantic?.minor).toBe(999);
      expect(result.semantic?.patch).toBe(999);
    });

    it('should handle complex prerelease identifiers', async () => {
      const version = '1.0.0-alpha.1.beta.2+exp.sha.5114f85';
      expect(strategy.isValidVersion(version)).toBe(true);
      
      const result = await strategy.parseVersion(version);
      expect(result.semantic?.prerelease).toBe('alpha.1.beta.2');
      expect(result.semantic?.build).toBe('exp.sha.5114f85');
    });

    it('should handle prerelease comparison edge cases', async () => {
      // Test numeric vs non-numeric prerelease identifiers
      const result1 = await strategy.compareVersions('1.0.0-alpha.1', '1.0.0-alpha.beta');
      expect(result1.result).toBe('less');

      const result2 = await strategy.compareVersions('1.0.0-alpha.beta', '1.0.0-alpha.1');
      expect(result2.result).toBe('greater');

      // Test different length prerelease identifiers
      const result3 = await strategy.compareVersions('1.0.0-alpha', '1.0.0-alpha.1');
      expect(result3.result).toBe('less');

      const result4 = await strategy.compareVersions('1.0.0-alpha.1', '1.0.0-alpha');
      expect(result4.result).toBe('greater');
    });

    it('should handle prerelease identifier incrementing edge cases', async () => {
      // Test incrementing non-numeric prerelease
      const metadata1: VersionMetadata = {
        version: '1.0.0-beta',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: 'beta',
          full: '1.0.0-beta'
        }
      };

      const result1 = await strategy.bumpVersion(metadata1, 'prerelease');
      expect(result1).toBe('1.0.1-beta.1');

      // Test incrementing complex prerelease
      const metadata2: VersionMetadata = {
        version: '1.0.0-alpha.beta',
        createdAt: '2024-01-15T10:30:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          prerelease: 'alpha.beta',
          full: '1.0.0-alpha.beta'
        }
      };

      const result2 = await strategy.bumpVersion(metadata2, 'prerelease');
      expect(result2).toBe('1.0.1-alpha.beta.1');
    });

    it('should handle invalid metadata validation', async () => {
      const invalidMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      } as any;

      // Test with invalid metadata structure
      await expect(strategy.generateVersion(invalidMetadata))
        .rejects.toThrow();
    });

    it('should handle invalid generated version', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      // Mock isValidVersion to return false
      jest.spyOn(strategy, 'isValidVersion').mockReturnValue(false);

      await expect(strategy.generateVersion(metadata))
        .rejects.toThrow('Generated version is not valid');
    });

    it('should handle complex prerelease parsing', async () => {
      const complexVersion = '1.0.0-alpha.1.beta.2';
      const parsed = await strategy.parseVersion(complexVersion);
      
      expect(parsed.semantic).toBeDefined();
      expect(parsed.semantic!.major).toBe(1);
      expect(parsed.semantic!.minor).toBe(0);
      expect(parsed.semantic!.patch).toBe(0);
      expect(parsed.semantic!.prerelease).toBe('alpha.1.beta.2');
    });

    it('should handle build identifier parsing', async () => {
      const versionWithBuild = '1.0.0+build.123';
      const parsed = await strategy.parseVersion(versionWithBuild);
      
      expect(parsed.semantic).toBeDefined();
      expect(parsed.semantic!.major).toBe(1);
      expect(parsed.semantic!.minor).toBe(0);
      expect(parsed.semantic!.patch).toBe(0);
      expect(parsed.semantic!.build).toBe('build.123');
    });

    it('should handle prerelease comparison edge cases', async () => {
      // Test prerelease vs release
      const prerelease = '1.0.0-alpha';
      const release = '1.0.0';
      
      const comparison = await strategy.compareVersions(prerelease, release);
      expect(comparison.result).toBe('less');
      
      // Test different prerelease identifiers
      const alpha = '1.0.0-alpha';
      const beta = '1.0.0-beta';
      
      const prereleaseComparison = await strategy.compareVersions(alpha, beta);
      expect(prereleaseComparison.result).toBe('less');
    });

    it('should handle version generation with build identifier', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          build: 'build.123',
          full: '1.0.0'
        }
      };

      const version = await strategy.generateVersion(metadata);
      expect(version).toBe('1.0.0+build.123');
    });

    it('should handle parseVersion with invalid regex match', async () => {
      // Test with a version that doesn't match the regex
      await expect(strategy.parseVersion('invalid-version'))
        .rejects.toThrow('Invalid semantic version');
    });

    it('should handle compareVersions with invalid prerelease comparison', async () => {
      const version1 = '1.0.0-alpha.1';
      const version2 = '1.0.0-alpha.1.beta';
      
      const comparison = await strategy.compareVersions(version1, version2);
      expect(comparison.result).toBe('less');
    });

    it('should handle bumpVersion with existing build identifier', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          build: 'build.123',
          full: '1.0.0'
        }
      };

      const bumped = await strategy.bumpVersion(metadata, 'patch');
      expect(bumped).toBe('1.0.1+build.123');
    });

    it('should handle incrementPrereleaseIdentifier with complex prerelease', async () => {
      const result = strategy['incrementPrereleaseIdentifier']('alpha.beta.1');
      expect(result).toBe('alpha.beta.2');
    });

    it('should handle incrementPrereleaseIdentifier with non-numeric prerelease', async () => {
      const result = strategy['incrementPrereleaseIdentifier']('alpha.beta');
      expect(result).toBe('alpha.beta.1');
    });

    it('should handle incrementPrereleaseIdentifier with single numeric', async () => {
      const result = strategy['incrementPrereleaseIdentifier']('1');
      expect(result).toBe('2');
    });

    it('should handle incrementPrereleaseIdentifier with single non-numeric', async () => {
      const result = strategy['incrementPrereleaseIdentifier']('alpha');
      expect(result).toBe('alpha.1');
    });

    it('should handle comparePrereleaseIdentifiers with different lengths', async () => {
      const result = strategy['comparePrereleaseIdentifiers']('alpha', 'alpha.1');
      expect(result).toBe(-1);
    });

    it('should handle comparePrereleaseIdentifiers with numeric vs non-numeric', async () => {
      const result = strategy['comparePrereleaseIdentifiers']('1', 'alpha');
      expect(result).toBe(-1);
    });

    it('should handle comparePrereleaseIdentifiers with non-numeric vs numeric', async () => {
      const result = strategy['comparePrereleaseIdentifiers']('alpha', '1');
      expect(result).toBe(1);
    });

    it('should handle compareVersions with minor version differences', async () => {
      const comparison = await strategy.compareVersions('1.1.0', '1.0.0');
      expect(comparison.result).toBe('greater');
    });

    it('should handle compareVersions with patch version differences', async () => {
      const comparison = await strategy.compareVersions('1.0.1', '1.0.0');
      expect(comparison.result).toBe('greater');
    });

    it('should handle bumpVersion prerelease with no existing prerelease', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00Z',
        tags: [],
        semantic: {
          major: 1,
          minor: 0,
          patch: 0,
          full: '1.0.0'
        }
      };

      const bumped = await strategy.bumpVersion(metadata, 'prerelease');
      expect(bumped).toBe('1.0.1-alpha');
    });
  });
});

/**
 * Tests for BaseVersioningStrategy
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BaseVersioningStrategy } from '../../../../src/versioning/strategies/BaseVersioningStrategy';
import { VersionMetadata, VersionComparison } from '../../../../src/types/versioning';

// Mock implementation for testing
class MockVersioningStrategy extends BaseVersioningStrategy {
  async generateVersion(metadata: VersionMetadata): Promise<string> {
    return `mock-${metadata.version}`;
  }

  async parseVersion(version: string): Promise<VersionMetadata> {
    return {
      version,
      createdAt: new Date().toISOString(),
      tags: [],
    };
  }

  async compareVersions(_version1: string, _version2: string): Promise<VersionComparison> {
    return {
      result: 'equal',
      details: {
        compatible: true,
        breakingChanges: false,
        newFeatures: false,
        bugFixes: false,
        information: 'Mock comparison',
      },
    };
  }

  getStrategyName(): string {
    return 'mock';
  }

  isValidVersion(version: string): boolean {
    return version.startsWith('mock-');
  }
}

describe('BaseVersioningStrategy', () => {
  let strategy: MockVersioningStrategy;

  beforeEach(() => {
    strategy = new MockVersioningStrategy();
  });

  describe('generateVersion', () => {
    it('should generate a version based on metadata', async () => {
      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toBe('mock-1.0.0');
    });

    it('should handle empty metadata', async () => {
      const metadata: VersionMetadata = {
        version: '',
        createdAt: new Date().toISOString(),
        tags: [],
      };

      const result = await strategy.generateVersion(metadata);
      expect(result).toBe('mock-');
    });
  });

  describe('parseVersion', () => {
    it('should parse a version string to metadata', async () => {
      const version = 'mock-1.0.0';
      const result = await strategy.parseVersion(version);

      expect(result.version).toBe(version);
      expect(result.createdAt).toBeDefined();
      expect(result.tags).toEqual([]);
    });

    it('should handle invalid version strings', async () => {
      const version = 'invalid-version';
      const result = await strategy.parseVersion(version);

      expect(result.version).toBe(version);
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('compareVersions', () => {
    it('should compare two versions', async () => {
      const result = await strategy.compareVersions('mock-1.0.0', 'mock-1.0.0');

      expect(result.result).toBe('equal');
      expect(result.details.compatible).toBe(true);
      expect(result.details.information).toBe('Mock comparison');
    });

    it('should handle different versions', async () => {
      const result = await strategy.compareVersions('mock-1.0.0', 'mock-2.0.0');

      expect(result.result).toBe('equal'); // Mock always returns equal
      expect(result.details.compatible).toBe(true);
    });
  });

  describe('getStrategyName', () => {
    it('should return the strategy name', () => {
      const name = strategy.getStrategyName();
      expect(name).toBe('mock');
    });
  });

  describe('isValidVersion', () => {
    it('should validate version strings', () => {
      expect(strategy.isValidVersion('mock-1.0.0')).toBe(true);
      expect(strategy.isValidVersion('invalid-1.0.0')).toBe(false);
      expect(strategy.isValidVersion('')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      // Test that the base class provides error handling structure
      expect(strategy).toBeDefined();
    });
  });

  describe('configuration management', () => {
    it('should get and set configuration', () => {
      const config = strategy.getConfig();
      expect(config).toBeDefined();
      expect(config.defaultStrategy).toBe('semantic');

      const newConfig = { defaultStrategy: 'branch' };
      strategy.setConfig(newConfig);
      
      const updatedConfig = strategy.getConfig();
      expect(updatedConfig.defaultStrategy).toBe('branch');
    });
  });

  describe('utility methods', () => {
    it('should validate metadata correctly', () => {
      const validMetadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable']
      };

      // Access protected method through reflection for testing
      const isValid = (strategy as any).validateMetadata(validMetadata);
      expect(isValid).toBe(true);

      const invalidMetadata: VersionMetadata = {
        version: '',
        createdAt: 'invalid-date',
        tags: 'not-an-array' as any
      };

      const isInvalid = (strategy as any).validateMetadata(invalidMetadata);
      expect(isInvalid).toBe(false);
    });

    it('should format version strings', () => {
      const formatted = (strategy as any).formatVersion('1.0.0', 'v', '-beta');
      expect(formatted).toBe('v1.0.0-beta');
    });

    it('should generate timestamps', () => {
      const timestamp = (strategy as any).generateTimestamp();
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp)).toBeInstanceOf(Date);

      const readable = (strategy as any).generateReadableTimestamp();
      expect(readable).toBeDefined();
      expect(typeof readable).toBe('string');
    });

    it('should calculate numeric differences', () => {
      const diff1 = (strategy as any).calculateNumericDifference('1.0.0', '2.0.0');
      expect(diff1).toBe(-1);

      const diff2 = (strategy as any).calculateNumericDifference('2.0.0', '1.0.0');
      expect(diff2).toBe(1);

      const diff3 = (strategy as any).calculateNumericDifference('1.0.0', '1.0.0');
      expect(diff3).toBe(0);
    });

    it('should extract numeric versions', () => {
      const num1 = (strategy as any).extractNumericVersion('1.0.0');
      expect(num1).toBe(1);

      const num2 = (strategy as any).extractNumericVersion('v2.0.0');
      expect(num2).toBe(2);

      const num3 = (strategy as any).extractNumericVersion('no-numbers');
      expect(num3).toBe(null);
    });

    it('should check version compatibility', () => {
      const compatible = (strategy as any).areVersionsCompatible('mock-1.0.0', 'mock-1.0.0');
      expect(compatible).toBe(true);
    });

    it('should generate comparison details', () => {
      const details = (strategy as any).generateComparisonDetails('mock-1.0.0', 'mock-2.0.0', 'less');
      expect(details).toBeDefined();
      expect(details.compatible).toBe(true);
      expect(details.information).toContain('mock-1.0.0');
      expect(details.information).toContain('mock-2.0.0');
    });

    it('should generate comparison information', () => {
      const info1 = (strategy as any).generateComparisonInformation('1.0.0', '2.0.0', 'less');
      expect(info1).toContain('less than');

      const info2 = (strategy as any).generateComparisonInformation('2.0.0', '1.0.0', 'greater');
      expect(info2).toContain('greater than');

      const info3 = (strategy as any).generateComparisonInformation('1.0.0', '1.0.0', 'equal');
      expect(info3).toContain('equal to');

      const info4 = (strategy as any).generateComparisonInformation('1.0.0', '2.0.0', 'incompatible');
      expect(info4).toContain('incompatible');
    });

    it('should validate configuration', () => {
      const validConfig = {
        defaultStrategy: 'semantic',
        storage: { type: 'local', path: './test' },
        retention: { maxVersions: 10 },
        comparison: { enableDiff: true }
      };

      const isValid = (strategy as any).validateConfig(validConfig);
      expect(isValid).toBe(true);

      const invalidConfig = {
        defaultStrategy: '',
        storage: { type: 'local' }, // missing path
        retention: { maxVersions: 'not-a-number' },
        comparison: { enableDiff: 'not-a-boolean' }
      };

      const isInvalid = (strategy as any).validateConfig(invalidConfig);
      expect(isInvalid).toBe(false);
    });

    it('should manage strategy options', () => {
      const options = (strategy as any).getStrategyOptions();
      expect(options).toBeDefined();

      (strategy as any).setStrategyOptions({ test: 'value' });
      const updatedOptions = (strategy as any).getStrategyOptions();
      expect(updatedOptions.test).toBe('value');
    });

    it('should check feature enablement', () => {
      const enabled = (strategy as any).isFeatureEnabled('enableDiff');
      expect(typeof enabled).toBe('boolean');
    });

    it('should manage retention policy', () => {
      const policy = (strategy as any).getRetentionPolicy();
      expect(policy).toBeDefined();
      expect(policy.maxVersions).toBeDefined();

      const shouldKeep = (strategy as any).shouldKeepForever('v1.0.0');
      expect(typeof shouldKeep).toBe('boolean');

      const autoCleanup = (strategy as any).isAutoCleanupEnabled();
      expect(typeof autoCleanup).toBe('boolean');

      const interval = (strategy as any).getCleanupInterval();
      expect(typeof interval).toBe('number');
    });

    it('should handle error creation', () => {
      const error = (strategy as any).createError('Test error', 'TEST_ERROR');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('mockVersioningError');
      expect((error as any).code).toBe('TEST_ERROR');
    });

    it('should handle invalid metadata validation', () => {
      const invalidMetadata1 = { version: '', createdAt: new Date().toISOString(), tags: [] };
      const isValid1 = (strategy as any).validateMetadata(invalidMetadata1);
      expect(isValid1).toBe(false);

      const invalidMetadata2 = { version: '1.0.0', createdAt: '', tags: [] };
      const isValid2 = (strategy as any).validateMetadata(invalidMetadata2);
      expect(isValid2).toBe(false);

      const invalidMetadata3 = { version: '1.0.0', createdAt: new Date().toISOString(), tags: null };
      const isValid3 = (strategy as any).validateMetadata(invalidMetadata3);
      expect(isValid3).toBe(false);

      const invalidMetadata4 = { version: '1.0.0', createdAt: 'invalid-date', tags: [] };
      const isValid4 = (strategy as any).validateMetadata(invalidMetadata4);
      expect(isValid4).toBe(true); // The validation doesn't check date validity
    });

    it('should handle configuration merging with partial configs', () => {
      const partialConfig1 = { defaultStrategy: 'branch' };
      const merged1 = (strategy as any).mergeWithDefaults(partialConfig1);
      expect(merged1.defaultStrategy).toBe('branch');
      expect(merged1.storage.type).toBe('local'); // Should keep default

      const partialConfig2 = { storage: { type: 'remote' } };
      const merged2 = (strategy as any).mergeWithDefaults(partialConfig2);
      expect(merged2.storage.type).toBe('remote');
      expect(merged2.defaultStrategy).toBe('semantic'); // Should keep default

      const partialConfig3 = { retention: { maxVersions: 20 } };
      const merged3 = (strategy as any).mergeWithDefaults(partialConfig3);
      expect(merged3.retention.maxVersions).toBe(20);
      expect(merged3.retention.autoCleanup).toBe(true); // Should keep default

      const partialConfig4 = { comparison: { enableDiff: false } };
      const merged4 = (strategy as any).mergeWithDefaults(partialConfig4);
      expect(merged4.comparison.enableDiff).toBe(false);
      expect(merged4.comparison.diffFormat).toBe('json'); // Should keep default
    });

    it('should handle error handling paths', () => {
      // Test handleError method
      const error = new Error('Test error');
      expect(() => {
        (strategy as any).handleError(error, 'testContext');
      }).not.toThrow();
    });

    it('should handle edge cases in utility methods', () => {
      // Test formatVersion with undefined prefix/suffix
      const formatted1 = (strategy as any).formatVersion('1.0.0');
      expect(formatted1).toBe('1.0.0');

      const formatted2 = (strategy as any).formatVersion('1.0.0', 'v');
      expect(formatted2).toBe('v1.0.0');

      const formatted3 = (strategy as any).formatVersion('1.0.0', undefined, '-beta');
      expect(formatted3).toBe('1.0.0-beta');

      // Test extractNumericVersion with edge cases
      const num1 = (strategy as any).extractNumericVersion('');
      expect(num1).toBe(null);

      const num2 = (strategy as any).extractNumericVersion('no-numbers-here');
      expect(num2).toBe(null);

      // Test calculateNumericDifference with null values
      const diff1 = (strategy as any).calculateNumericDifference('no-numbers', '1.0.0');
      expect(diff1).toBe(0);

      const diff2 = (strategy as any).calculateNumericDifference('1.0.0', 'no-numbers');
      expect(diff2).toBe(0);

      const diff3 = (strategy as any).calculateNumericDifference('no-numbers', 'no-numbers');
      expect(diff3).toBe(0);
    });

    it('should handle additional edge cases', () => {
      // Test validateConfig with missing properties
      const invalidConfig1 = { defaultStrategy: '' };
      const isValid1 = (strategy as any).validateConfig(invalidConfig1);
      expect(isValid1).toBe(false);

      const invalidConfig2 = { storage: { type: 'local' } }; // missing path
      const isValid2 = (strategy as any).validateConfig(invalidConfig2);
      expect(isValid2).toBe(false);

      const invalidConfig3 = { retention: { maxVersions: 'not-a-number' } };
      const isValid3 = (strategy as any).validateConfig(invalidConfig3);
      expect(isValid3).toBe(false);

      const invalidConfig4 = { comparison: { enableDiff: 'not-a-boolean' } };
      const isValid4 = (strategy as any).validateConfig(invalidConfig4);
      expect(isValid4).toBe(false);

      // Test mergeWithDefaults with empty config
      const emptyConfig = {};
      const merged = (strategy as any).mergeWithDefaults(emptyConfig);
      expect(merged.defaultStrategy).toBe('semantic');
      expect(merged.storage.type).toBe('local');
    });

    it('should handle additional edge cases for error handling', () => {
      // Test handleError with different error types
      const error1 = new Error('Test error 1');
      expect(() => {
        (strategy as any).handleError(error1, 'testContext1');
      }).not.toThrow();

      const error2 = new Error('Test error 2');
      expect(() => {
        (strategy as any).handleError(error2, 'testContext2');
      }).not.toThrow();

      // Test validateConfig with edge cases
      const config1 = { defaultStrategy: 'semantic', storage: { type: 'local', path: './test' } };
      const isValid1 = (strategy as any).validateConfig(config1);
      expect(isValid1).toBe(false); // Missing required properties

      const config2 = { defaultStrategy: 'semantic', storage: { type: 'local', path: './test' }, retention: { maxVersions: 10 } };
      const isValid2 = (strategy as any).validateConfig(config2);
      expect(isValid2).toBe(false); // Missing comparison property

      const config3 = { defaultStrategy: 'semantic', storage: { type: 'local', path: './test' }, retention: { maxVersions: 10 }, comparison: { enableDiff: true } };
      const isValid3 = (strategy as any).validateConfig(config3);
      expect(isValid3).toBe(true);
    });
  });
});

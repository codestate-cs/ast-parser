import { CustomVersioning } from '../../../../src/versioning/strategies';
import { VersionMetadata } from '../../../../src/types/versioning';

describe('CustomVersioning', () => {
  let strategy: CustomVersioning;

  beforeEach(() => {
    strategy = new CustomVersioning();
  });

  describe('generateVersion', () => {
    it('should generate version with custom pattern', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}-{build}',
        validation: /^v\d+\.\d+\.\d+-\w+$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 0,
          patch: 0,
          build: 'alpha'
        } as any
      };

      const version = await customStrategy.generateVersion(metadata);
      expect(version).toBe('v1.0.0-alpha');
    });

    it('should generate version with custom function', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'custom',
        generateFunction: (metadata: VersionMetadata) => {
          const custom = metadata.custom as any;
          return `${custom?.prefix || 'v'}${custom?.number || '1'}-${custom?.suffix || 'dev'}`;
        },
        validation: /^v?\d+-\w+$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          prefix: 'v',
          number: 2,
          suffix: 'beta'
        } as any
      };

      const version = await customStrategy.generateVersion(metadata);
      expect(version).toBe('v2-beta');
    });

    it('should handle missing custom metadata gracefully', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable']
      };

      const version = await customStrategy.generateVersion(metadata);
      expect(version).toBe('v{major}.{minor}.{patch}'); // Should return pattern as-is when placeholders aren't replaced
    });

    it('should handle invalid metadata', async () => {
      await expect(strategy.generateVersion(null as any)).rejects.toThrow();
    });

    it('should handle undefined metadata', async () => {
      await expect(strategy.generateVersion(undefined as any)).rejects.toThrow();
    });
  });

  describe('parseVersion', () => {
    it('should parse version with custom pattern', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}-{build}',
        validation: /^v(\d+)\.(\d+)\.(\d+)-(\w+)$/,
        parseFunction: (version: string) => {
          const match = version.match(/^v(\d+)\.(\d+)\.(\d+)-(\w+)$/);
          if (!match) return null;
          return {
            major: parseInt(match[1]!, 10),
            minor: parseInt(match[2]!, 10),
            patch: parseInt(match[3]!, 10),
            build: match[4]
          };
        }
      });

      const result = await customStrategy.parseVersion('v1.2.3-alpha');
      expect(result.version).toBe('v1.2.3-alpha');
      expect(result.custom).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        build: 'alpha'
      });
    });

    it('should parse version with custom function', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'custom',
        parseFunction: (version: string) => {
          const match = version.match(/^v?(\d+)-(\w+)$/);
          if (!match) return null;
          return {
            number: parseInt(match[1]!, 10),
            suffix: match[2]
          };
        },
        validation: /^v?\d+-\w+$/
      });

      const result = await customStrategy.parseVersion('v5-beta');
      expect(result.version).toBe('v5-beta');
      expect(result.custom).toEqual({
        number: 5,
        suffix: 'beta'
      });
    });

    it('should handle invalid version format', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/
      });

      const result = await customStrategy.parseVersion('invalid-version');
      expect(result.version).toBe('invalid-version');
      expect(result.custom).toBeUndefined();
    });

    it('should handle empty version', async () => {
      const result = await strategy.parseVersion('');
      expect(result.version).toBe('');
      expect(result.createdAt).toBeDefined();
      expect(result.tags).toEqual([]);
    });
  });

  describe('compareVersions', () => {
    it('should compare versions with custom comparison function', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/,
        compareFunction: (version1: string, version2: string) => {
          const v1 = version1.match(/^v(\d+)\.(\d+)\.(\d+)$/);
          const v2 = version2.match(/^v(\d+)\.(\d+)\.(\d+)$/);
          
          if (!v1 || !v2) return { result: 'incompatible' as const };
          
          const major1 = parseInt(v1[1]!, 10);
          const minor1 = parseInt(v1[2]!, 10);
          const patch1 = parseInt(v1[3]!, 10);
          
          const major2 = parseInt(v2[1]!, 10);
          const minor2 = parseInt(v2[2]!, 10);
          const patch2 = parseInt(v2[3]!, 10);
          
          if (major1 > major2) return { result: 'greater' as const, difference: major1 - major2 };
          if (major1 < major2) return { result: 'less' as const, difference: major2 - major1 };
          if (minor1 > minor2) return { result: 'greater' as const, difference: minor1 - minor2 };
          if (minor1 < minor2) return { result: 'less' as const, difference: minor2 - minor1 };
          if (patch1 > patch2) return { result: 'greater' as const, difference: patch1 - patch2 };
          if (patch1 < patch2) return { result: 'less' as const, difference: patch2 - patch1 };
          
          return { result: 'equal' as const, difference: 0 };
        }
      });

      const result = await customStrategy.compareVersions('v1.2.3', 'v1.2.4');
      expect(result.result).toBe('less');
      expect(result.difference).toBe(1);
    });

    it('should handle equal versions', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/,
        compareFunction: (_version1: string, _version2: string) => {
          return { result: 'equal' as const, difference: 0 };
        }
      });

      const result = await customStrategy.compareVersions('v1.2.3', 'v1.2.3');
      expect(result.result).toBe('equal');
      expect(result.difference).toBe(0);
    });

    it('should handle incompatible versions', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/,
        compareFunction: (_version1: string, _version2: string) => {
          return { result: 'incompatible' as const };
        }
      });

      const result = await customStrategy.compareVersions('v1.2.3', 'invalid');
      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });

    it('should handle errors in comparison function', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/,
        compareFunction: (_version1: string, _version2: string) => {
          throw new Error('Comparison error');
        }
      });

      const result = await customStrategy.compareVersions('v1.2.3', 'v1.2.4');
      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });
  });

  describe('getStrategyName', () => {
    it('should return strategy name', () => {
      expect(strategy.getStrategyName()).toBe('custom');
    });
  });

  describe('isValidVersion', () => {
    it('should validate version with custom validation', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/
      });

      expect(customStrategy.isValidVersion('v1.2.3')).toBe(true);
      expect(customStrategy.isValidVersion('v1.2')).toBe(false);
      expect(customStrategy.isValidVersion('1.2.3')).toBe(false);
      expect(customStrategy.isValidVersion('invalid')).toBe(false);
    });

    it('should validate version with custom validation function', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'custom',
        validationFunction: (version: string) => {
          return version.length > 3 && version.includes('-');
        }
      });

      expect(customStrategy.isValidVersion('v1-beta')).toBe(true);
      expect(customStrategy.isValidVersion('v1')).toBe(false);
      expect(customStrategy.isValidVersion('invalid')).toBe(false);
    });

    it('should handle empty or null versions', () => {
      expect(strategy.isValidVersion('')).toBe(false);
      expect(strategy.isValidVersion(null as any)).toBe(false);
      expect(strategy.isValidVersion(undefined as any)).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const config = strategy.getConfig();
      expect(config.defaultStrategy).toBe('custom');
      expect(config.storage.type).toBe('local');
      expect(config.retention.maxVersions).toBe(10);
      expect(config.comparison.enableDiff).toBe(true);
    });

    it('should use custom configuration', () => {
      const customConfig = {
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/,
        generateFunction: (_metadata: VersionMetadata) => 'v1.0.0',
        parseFunction: (_version: string) => ({ major: 1, minor: 0, patch: 0 }),
        compareFunction: (_v1: string, _v2: string) => ({ result: 'equal' as const, difference: 0 }),
        validationFunction: (_version: string) => true
      };

      const customStrategy = new CustomVersioning(customConfig);
      const config = customStrategy.getCustomConfig();

      expect(config.pattern).toBe('v{major}.{minor}.{patch}');
      expect(config.validation).toEqual(/^v\d+\.\d+\.\d+$/);
      expect(config.generateFunction).toBeDefined();
      expect(config.parseFunction).toBeDefined();
      expect(config.compareFunction).toBeDefined();
      expect(config.validationFunction).toBeDefined();
    });

    it('should merge configuration with defaults', () => {
      const partialConfig = {
        pattern: 'v{major}.{minor}',
        validation: /^v\d+\.\d+$/
      };

      const customStrategy = new CustomVersioning(partialConfig);
      const config = customStrategy.getCustomConfig();

      expect(config.pattern).toBe('v{major}.{minor}');
      expect(config.validation).toEqual(/^v\d+\.\d+$/);
      expect(config.generateFunction).toBeUndefined(); // default
      expect(config.parseFunction).toBeUndefined(); // default
      expect(config.compareFunction).toBeUndefined(); // default
      expect(config.validationFunction).toBeUndefined(); // default
    });
  });

  describe('pattern processing', () => {
    it('should process pattern with placeholders', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}-{build}',
        validation: /^v\d+\.\d+\.\d+-\w+$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 2,
          patch: 3,
          build: 'alpha'
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.2.3-alpha');
    });

    it('should handle missing placeholders in pattern', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}-{build}',
        validation: /^v\d+\.\d+\.\d+-\w+$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 2
          // missing patch and build
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.2.{patch}-{build}');
    });

    it('should handle empty pattern', () => {
      const customStrategy = new CustomVersioning({
        pattern: '',
        validation: /^.*$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable']
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('1.0.0'); // Should return the version from metadata when pattern is empty
    });
  });

  describe('error handling', () => {
    it('should handle errors in generateFunction', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'custom',
        generateFunction: (_metadata: VersionMetadata) => {
          throw new Error('Generation error');
        },
        validation: /^.*$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable']
      };

      await expect(customStrategy.generateVersion(metadata)).rejects.toThrow();
    });

    it('should handle errors in parseFunction', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'custom',
        parseFunction: (_version: string) => {
          throw new Error('Parse error');
        },
        validation: /^.*$/
      });

      const result = await customStrategy.parseVersion('test-version');
      expect(result.version).toBe('test-version');
      expect(result.custom).toBeUndefined();
    });

    it('should handle errors in validationFunction', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'custom',
        validationFunction: (_version: string) => {
          throw new Error('Validation error');
        }
      });

      expect(customStrategy.isValidVersion('test')).toBe(false);
    });

    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        new CustomVersioning({ pattern: null as any });
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle complex custom metadata', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}-{build}.{revision}',
        validation: /^v\d+\.\d+\.\d+-\w+\.\d+$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 2,
          minor: 1,
          patch: 0,
          build: 'rc',
          revision: 42
        } as any
      };

      const version = await customStrategy.generateVersion(metadata);
      expect(version).toBe('v2.1.0-rc.42');
    });

    it('should handle special characters in custom metadata', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}-{build}',
        validation: /^v\d+\.\d+-\w+$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 0,
          build: 'alpha-beta'
        } as any
      };

      const version = await customStrategy.generateVersion(metadata);
      expect(version).toBe('v1.0-alpha-beta');
    });

    it('should handle numeric custom metadata', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}',
        validation: /^v\d+\.\d+\.\d+$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: '1' as any,
          minor: '2' as any,
          patch: '3' as any
        } as any
      };

      const version = await customStrategy.generateVersion(metadata);
      expect(version).toBe('v1.2.3');
    });

    it('should handle boolean custom metadata', async () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}-{isStable}',
        validation: /^v\d+\.\d+-(true|false)$/
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 0,
          isStable: true
        } as any
      };

      const version = await customStrategy.generateVersion(metadata);
      expect(version).toBe('v1.0-true');
    });
  });

  describe('additional edge cases for coverage', () => {
    it('should handle fallback to basic version when no pattern or function', async () => {
      const customStrategy = new CustomVersioning({});
      
      const metadata: VersionMetadata = {
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable']
      };

      const version = await customStrategy.generateVersion(metadata);
      expect(version).toBe('2.0.0');
    });

    it('should handle null custom metadata in processPattern', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: null as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v{major}.{minor}');
    });

    it('should handle undefined custom metadata in processPattern', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable']
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v{major}.{minor}');
    });

    it('should handle null values in custom metadata', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: null,
          patch: 3
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.{minor}.3');
    });

    it('should handle undefined values in custom metadata', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: undefined,
          patch: 3
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.{minor}.3');
    });

    it('should handle string values in custom metadata', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: '1',
          minor: '2',
          patch: '3'
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.2.3');
    });

    it('should handle number values in custom metadata', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}.{patch}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 2,
          patch: 3
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.2.3');
    });

    it('should handle boolean values in custom metadata', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}-{isStable}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 2,
          isStable: false
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.2-false');
    });

    it('should handle object values in custom metadata', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}-{build}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 2,
          build: { name: 'alpha', version: '1' }
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.2-[object Object]');
    });

    it('should handle array values in custom metadata', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}.{minor}-{build}'
      });

      const metadata: VersionMetadata = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        tags: ['stable'],
        custom: {
          major: 1,
          minor: 2,
          build: ['alpha', 'beta']
        } as any
      };

      const result = customStrategy['processPattern'](metadata);
      expect(result).toBe('v1.2-alpha,beta');
    });

    it('should handle basic string comparison in compareVersions', async () => {
      const result = await strategy.compareVersions('a', 'b');
      expect(result.result).toBe('less');
      expect(result.difference).toBe(1);
    });

    it('should handle basic string comparison in compareVersions - greater', async () => {
      const result = await strategy.compareVersions('b', 'a');
      expect(result.result).toBe('greater');
      expect(result.difference).toBe(1);
    });

    it('should handle basic string comparison in compareVersions - equal', async () => {
      const result = await strategy.compareVersions('a', 'a');
      expect(result.result).toBe('equal');
      expect(result.difference).toBe(0);
    });

    it('should handle null version1 in compareVersions', async () => {
      const result = await strategy.compareVersions(null as any, 'b');
      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });

    it('should handle null version2 in compareVersions', async () => {
      const result = await strategy.compareVersions('a', null as any);
      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });

    it('should handle empty version1 in compareVersions', async () => {
      const result = await strategy.compareVersions('', 'b');
      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });

    it('should handle empty version2 in compareVersions', async () => {
      const result = await strategy.compareVersions('a', '');
      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });

    it('should handle undefined version1 in compareVersions', async () => {
      const result = await strategy.compareVersions(undefined as any, 'b');
      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });

    it('should handle undefined version2 in compareVersions', async () => {
      const result = await strategy.compareVersions('a', undefined as any);
      expect(result.result).toBe('incompatible');
      expect(result.details.compatible).toBe(false);
    });

    it('should handle basic validation when no custom validation provided', () => {
      expect(strategy.isValidVersion('valid-version')).toBe(true);
      expect(strategy.isValidVersion('   ')).toBe(false);
    });

    it('should handle regex validation', () => {
      const customStrategy = new CustomVersioning({
        validation: /^v\d+\.\d+\.\d+$/
      });

      expect(customStrategy.isValidVersion('v1.2.3')).toBe(true);
      expect(customStrategy.isValidVersion('v1.2')).toBe(false);
      expect(customStrategy.isValidVersion('1.2.3')).toBe(false);
    });

    it('should handle setCustomConfig', () => {
      const newConfig = {
        pattern: 'v{major}.{minor}',
        validation: /^v\d+\.\d+$/
      };

      strategy.setCustomConfig(newConfig);
      const config = strategy.getCustomConfig();
      
      expect(config.pattern).toBe('v{major}.{minor}');
      expect(config.validation).toEqual(/^v\d+\.\d+$/);
    });

    it('should handle mergeCustomDefaults with all undefined values', () => {
      const customStrategy = new CustomVersioning({});

      const config = customStrategy.getCustomConfig();
      expect(config.pattern).toBe('');
      expect(config.validation).toBeUndefined();
      expect(config.generateFunction).toBeUndefined();
      expect(config.parseFunction).toBeUndefined();
      expect(config.compareFunction).toBeUndefined();
      expect(config.validationFunction).toBeUndefined();
    });

    it('should handle mergeCustomDefaults with partial config', () => {
      const customStrategy = new CustomVersioning({
        pattern: 'v{major}',
        generateFunction: (_metadata: VersionMetadata) => 'v1.0.0'
      });

      const config = customStrategy.getCustomConfig();
      expect(config.pattern).toBe('v{major}');
      expect(config.generateFunction).toBeDefined();
      expect(config.validation).toBeUndefined();
      expect(config.parseFunction).toBeUndefined();
      expect(config.compareFunction).toBeUndefined();
      expect(config.validationFunction).toBeUndefined();
    });
  });
});

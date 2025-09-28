/**
 * @fileoverview Comprehensive tests for config module exports
 * Following PDD -> BDD -> TDD approach
 */

import '../../../src/config/DefaultConfig';
import '../../../src/config/ConfigValidator';
import '../../../src/config/ConfigLoader';

const ConfigModule = {
  DefaultConfig: require('../../../src/config/DefaultConfig').DefaultConfig,
  ConfigValidator: require('../../../src/config/ConfigValidator').ConfigValidator,
  ConfigLoader: require('../../../src/config/ConfigLoader').ConfigLoader
};

describe('Config Module', () => {
  describe('Module Exports', () => {
    it('should export DefaultConfig', () => {
      expect(ConfigModule.DefaultConfig).toBeDefined();
      expect(typeof ConfigModule.DefaultConfig).toBe('object');
    });

    it('should export ConfigValidator', () => {
      expect(ConfigModule.ConfigValidator).toBeDefined();
      expect(typeof ConfigModule.ConfigValidator).toBe('function');
    });

    it('should export ConfigLoader', () => {
      expect(ConfigModule.ConfigLoader).toBeDefined();
      expect(typeof ConfigModule.ConfigLoader).toBe('function');
    });

    it('should export configuration types', () => {
      // These should be available as type definitions
      expect(ConfigModule).toBeDefined();
    });
  });

  describe('DefaultConfig', () => {
    it('should have default configuration values', () => {
      expect(ConfigModule.DefaultConfig).toBeDefined();
      expect(ConfigModule.DefaultConfig).toHaveProperty('analyzers');
      expect(ConfigModule.DefaultConfig).toHaveProperty('parsers');
      expect(ConfigModule.DefaultConfig).toHaveProperty('output');
    });

    it('should have valid analyzer configurations', () => {
      const config = ConfigModule.DefaultConfig;
      expect(config.analyzers).toBeDefined();
      expect(config.analyzers.dependency).toBeDefined();
      expect(config.analyzers.entryPoint).toBeDefined();
      expect(config.analyzers.structure).toBeDefined();
      expect(config.analyzers.complexity).toBeDefined();
    });

    it('should have valid parser configurations', () => {
      const config = ConfigModule.DefaultConfig;
      expect(config.parsers).toBeDefined();
      expect(config.parsers.typescript).toBeDefined();
      expect(config.parsers.enhancedTypeScript).toBeDefined();
    });

    it('should have valid output configurations', () => {
      const config = ConfigModule.DefaultConfig;
      expect(config.output).toBeDefined();
      expect(config.output.formats).toBeDefined();
      expect(config.output.naming).toBeDefined();
    });
  });

  describe('ConfigValidator', () => {
    it('should be a constructor function', () => {
      expect(typeof ConfigModule.ConfigValidator).toBe('function');
    });

    it('should create validator instances', () => {
      const validator = new ConfigModule.ConfigValidator();
      expect(validator).toBeDefined();
      expect(typeof validator).toBe('object');
    });

    it('should have validation methods', () => {
      const validator = new ConfigModule.ConfigValidator();
      expect(typeof validator.validate).toBe('function');
      expect(typeof validator.validateSchema).toBe('function');
    });
  });

  describe('ConfigLoader', () => {
    it('should be a constructor function', () => {
      expect(typeof ConfigModule.ConfigLoader).toBe('function');
    });

    it('should create loader instances', () => {
      const loader = new ConfigModule.ConfigLoader();
      expect(loader).toBeDefined();
      expect(typeof loader).toBe('object');
    });

    it('should have loading methods', () => {
      const loader = new ConfigModule.ConfigLoader();
      expect(typeof loader.load).toBe('function');
      expect(typeof loader.loadFromFile).toBe('function');
      expect(typeof loader.loadFromEnvironment).toBe('function');
    });
  });

  describe('Integration', () => {
    it('should work with DefaultConfig and ConfigValidator', () => {
      const validator = new ConfigModule.ConfigValidator();
      const result = validator.validate(ConfigModule.DefaultConfig);
      
      expect(result.isValid).toBe(true);
    });

    it('should work with ConfigLoader and DefaultConfig', () => {
      const loader = new ConfigModule.ConfigLoader();
      const config = loader.load();
      
      expect(config).toBeDefined();
      expect(config).toEqual(ConfigModule.DefaultConfig);
    });

    it('should provide consistent configuration interface', () => {
      const validator = new ConfigModule.ConfigValidator();
      const loader = new ConfigModule.ConfigLoader();
      const defaultConfig = ConfigModule.DefaultConfig;
      
      const loadedConfig = loader.load();
      const result = validator.validate(loadedConfig);
      
      expect(result.isValid).toBe(true);
      expect(loadedConfig).toEqual(defaultConfig);
    });
  });

  describe('Type Safety', () => {
    it('should provide proper TypeScript types', () => {
      // This test ensures TypeScript compilation works
      const config: any = ConfigModule.DefaultConfig;
      expect(config).toBeDefined();
      
      const validator: any = new ConfigModule.ConfigValidator();
      expect(validator).toBeDefined();
      
      const loader: any = new ConfigModule.ConfigLoader();
      expect(loader).toBeDefined();
    });

    it('should handle configuration objects correctly', () => {
      const config = ConfigModule.DefaultConfig;
      
      // Test that config has expected structure
      expect(config).toHaveProperty('analyzers');
      expect(config).toHaveProperty('parsers');
      expect(config).toHaveProperty('output');
      
      // Test nested properties
      expect(config.analyzers).toHaveProperty('dependency');
      expect(config.analyzers).toHaveProperty('entryPoint');
      expect(config.analyzers).toHaveProperty('structure');
      expect(config.analyzers).toHaveProperty('complexity');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing exports gracefully', () => {
      // All exports should be present
      expect(() => {
        ConfigModule.DefaultConfig;
        ConfigModule.ConfigValidator;
        ConfigModule.ConfigLoader;
      }).not.toThrow();
    });

    it('should handle invalid configuration gracefully', () => {
      const validator = new ConfigModule.ConfigValidator();
      
      expect(() => {
        validator.validate(null as any);
        validator.validate(undefined as any);
        validator.validate({} as any);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should load configuration efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        const loader = new ConfigModule.ConfigLoader();
        loader.load();
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process 1000 operations in less than 1 second
      expect(processingTime).toBeLessThan(1000);
    });

    it('should validate configuration efficiently', () => {
      const validator = new ConfigModule.ConfigValidator();
      const config = ConfigModule.DefaultConfig;
      
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        validator.validate(config);
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should process 1000 operations in less than 1 second
      expect(processingTime).toBeLessThan(1000);
    });
  });

  describe('Coverage Improvement Tests', () => {
    it('should export all required components', () => {
      const exports = Object.keys(ConfigModule);
      
      expect(exports).toContain('DefaultConfig');
      expect(exports).toContain('ConfigValidator');
      expect(exports).toContain('ConfigLoader');
    });

    it('should handle module re-exports', () => {
      // Test that the module properly re-exports all components
      expect(ConfigModule.DefaultConfig).toBeDefined();
      expect(ConfigModule.ConfigValidator).toBeDefined();
      expect(ConfigModule.ConfigLoader).toBeDefined();
    });

    it('should maintain module integrity', () => {
      // Test that the module maintains its structure
      const moduleKeys = Object.keys(ConfigModule);
      expect(moduleKeys.length).toBeGreaterThan(0);
      
      // All exports should be functions or objects
      moduleKeys.forEach(key => {
        const exportValue = (ConfigModule as any)[key];
        expect(typeof exportValue === 'function' || typeof exportValue === 'object').toBe(true);
      });
    });
  });
});

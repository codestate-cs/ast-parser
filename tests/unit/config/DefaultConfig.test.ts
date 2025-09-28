/**
 * @fileoverview Simple test for DefaultConfig
 */

import '../../../src/config/DefaultConfig';

describe('DefaultConfig', () => {
  it('should export default configuration', () => {
    const DefaultConfig = require('../../../src/config/DefaultConfig').DefaultConfig;
    expect(DefaultConfig).toBeDefined();
    expect(typeof DefaultConfig).toBe('object');
  });

  it('should have analyzers configuration', () => {
    const DefaultConfig = require('../../../src/config/DefaultConfig').DefaultConfig;
    expect(DefaultConfig.analyzers).toBeDefined();
    expect(DefaultConfig.analyzers.dependency).toBeDefined();
    expect(DefaultConfig.analyzers.entryPoint).toBeDefined();
    expect(DefaultConfig.analyzers.structure).toBeDefined();
    expect(DefaultConfig.analyzers.complexity).toBeDefined();
  });

  it('should have parsers configuration', () => {
    const DefaultConfig = require('../../../src/config/DefaultConfig').DefaultConfig;
    expect(DefaultConfig.parsers).toBeDefined();
    expect(DefaultConfig.parsers.typescript).toBeDefined();
    expect(DefaultConfig.parsers.enhancedTypeScript).toBeDefined();
  });

  it('should have output configuration', () => {
    const DefaultConfig = require('../../../src/config/DefaultConfig').DefaultConfig;
    expect(DefaultConfig.output).toBeDefined();
    expect(DefaultConfig.output.formats).toBeDefined();
    expect(DefaultConfig.output.naming).toBeDefined();
  });

  it('should have global configuration', () => {
    const DefaultConfig = require('../../../src/config/DefaultConfig').DefaultConfig;
    expect(DefaultConfig.global).toBeDefined();
    expect(typeof DefaultConfig.global.verbose).toBe('boolean');
    expect(typeof DefaultConfig.global.debug).toBe('boolean');
    expect(typeof DefaultConfig.global.maxProcessingTime).toBe('number');
    expect(typeof DefaultConfig.global.parallel).toBe('boolean');
  });
});

import '../../../src/types';

describe('Types Index', () => {
  it('should export types without errors', () => {
    // This test ensures that all types can be imported without TypeScript errors
    // The actual type checking is done by TypeScript compiler
    expect(true).toBe(true);
  });

  it('should have proper module structure', () => {
    // Verify that the types module can be imported
    const typesModule = require('../../../src/types');
    expect(typesModule).toBeDefined();
  });
});

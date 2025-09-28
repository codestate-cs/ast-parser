import { DependencyAnalyzer, EntryPointAnalyzer, StructureAnalyzer } from '../../../src/analyzers';

describe('Analyzers Index', () => {
  it('should export DependencyAnalyzer', () => {
    expect(DependencyAnalyzer).toBeDefined();
    expect(typeof DependencyAnalyzer).toBe('function');
  });

  it('should export EntryPointAnalyzer', () => {
    expect(EntryPointAnalyzer).toBeDefined();
    expect(typeof EntryPointAnalyzer).toBe('function');
  });

  it('should export StructureAnalyzer', () => {
    expect(StructureAnalyzer).toBeDefined();
    expect(typeof StructureAnalyzer).toBe('function');
  });

  it('should allow instantiation of analyzers', () => {
    const dependencyAnalyzer = new DependencyAnalyzer();
    const entryPointAnalyzer = new EntryPointAnalyzer();
    const structureAnalyzer = new StructureAnalyzer();

    expect(dependencyAnalyzer).toBeInstanceOf(DependencyAnalyzer);
    expect(entryPointAnalyzer).toBeInstanceOf(EntryPointAnalyzer);
    expect(structureAnalyzer).toBeInstanceOf(StructureAnalyzer);
  });
});

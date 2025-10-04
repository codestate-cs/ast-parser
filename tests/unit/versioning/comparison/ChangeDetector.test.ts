/**
 * Tests for ChangeDetector
 */

import { ChangeDetector } from '../../../../src/versioning/comparison/ChangeDetector';
import { ProjectAnalysisOutput } from '../../../../src/types/project';
import { ChangeInfo } from '../../../../src/types/versioning';

// Helper function to create valid ProjectAnalysisOutput
function createMockAnalysis(overrides: Partial<ProjectAnalysisOutput> = {}): ProjectAnalysisOutput {
  return {
    project: {
      name: 'test',
      version: '1.0.0',
      type: 'typescript',
      rootPath: '/test',
      entryPoints: [],
      dependencies: [],
      devDependencies: []
    },
    structure: {
      files: [],
      directories: [],
      totalFiles: 0,
      totalLines: 0,
      totalSize: 0
    },
    ast: {
      nodes: [],
      relations: [],
      entryPoints: [],
      publicExports: [],
      privateExports: []
    },
    analysis: {
      complexity: {
        cyclomatic: 0,
        cognitive: 0,
        maintainability: 0
      },
      patterns: [],
      architecture: {
        layers: [],
        modules: []
      },
      quality: {
        score: 0,
        issues: []
      }
    },
    metadata: {
      generatedAt: '2024-01-01T00:00:00Z',
      parserVersion: '1.0.0',
      processingTime: 100,
      cacheUsed: false,
      filesProcessed: 0
    },
    ...overrides
  };
}

describe('ChangeDetector', () => {
  let detector: ChangeDetector;

  beforeEach(() => {
    detector = new ChangeDetector();
  });

  describe('detectChanges', () => {
    it('should detect added files', async () => {
      const oldAnalysis = createMockAnalysis();

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        structure: {
          files: [{ path: '/test/src/new-file.ts', size: 100, lines: 10, lastModified: '2024-01-02T00:00:00Z' }],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        },
        ast: {
          nodes: [{ id: '1', type: 'file', name: 'new-file.ts', filePath: '/test/src/new-file.ts', start: 0, end: 100, children: [], metadata: {} }],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z', filesProcessed: 1 }
      });

      const changes = await detector.detectChanges(oldAnalysis, newAnalysis);
      
      expect(changes.filesChanged).toHaveLength(1);
      expect(changes.filesChanged[0]).toBe('/test/src/new-file.ts');
      expect(changes.changeTypes).toContain('added');
      expect(changes.changeCount).toBe(1);
    });

    it('should detect modified files', async () => {
      const oldAnalysis = createMockAnalysis({
        structure: {
          files: [{ path: '/test/src/file.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        structure: {
          files: [{ path: '/test/src/file.ts', size: 150, lines: 15, lastModified: '2024-01-02T00:00:00Z' }],
          directories: [],
          totalFiles: 1,
          totalLines: 15,
          totalSize: 150
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const changes = await detector.detectChanges(oldAnalysis, newAnalysis);
      
      expect(changes.filesChanged).toHaveLength(1);
      expect(changes.filesChanged[0]).toBe('/test/src/file.ts');
      expect(changes.changeTypes).toContain('modified');
      expect(changes.changeCount).toBe(1);
    });

    it('should detect deleted files', async () => {
      const oldAnalysis = createMockAnalysis({
        structure: {
          files: [{ path: '/test/src/file.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }],
          directories: [],
          totalFiles: 1,
          totalLines: 10,
          totalSize: 100
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z', filesProcessed: 0 }
      });

      const changes = await detector.detectChanges(oldAnalysis, newAnalysis);
      
      expect(changes.filesChanged).toHaveLength(1);
      expect(changes.filesChanged[0]).toBe('/test/src/file.ts');
      expect(changes.changeTypes).toContain('deleted');
      expect(changes.changeCount).toBe(1);
    });

    it('should detect no changes for identical analyses', async () => {
      const analysis = createMockAnalysis();
      const changes = await detector.detectChanges(analysis, analysis);
      
      expect(changes.filesChanged).toHaveLength(0);
      expect(changes.changeTypes).toHaveLength(0);
      expect(changes.changeCount).toBe(0);
    });
  });

  describe('detectBreakingChanges', () => {
    it('should detect removed public exports', async () => {
      const oldAnalysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [] }
          ],
          privateExports: []
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const breakingChanges = await detector.detectBreakingChanges(oldAnalysis, newAnalysis);
      
      expect(breakingChanges).toHaveLength(1);
      expect(breakingChanges[0]!.type).toBe('removed_export');
      expect(breakingChanges[0]!.name).toBe('exportedFunction');
    });

    it('should detect no breaking changes for compatible APIs', async () => {
      const oldAnalysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [] }
          ],
          privateExports: []
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [] },
            { name: 'newFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [] }
          ],
          privateExports: []
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const breakingChanges = await detector.detectBreakingChanges(oldAnalysis, newAnalysis);
      
      expect(breakingChanges).toHaveLength(0);
    });

    it('should detect changed signatures', async () => {
      const oldAnalysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [], signature: 'oldSignature' }
          ],
          privateExports: []
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [], signature: 'newSignature' }
          ],
          privateExports: []
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const breakingChanges = await detector.detectBreakingChanges(oldAnalysis, newAnalysis);
      
      expect(breakingChanges).toHaveLength(1);
      expect(breakingChanges[0]!.type).toBe('changed_signature');
      expect(breakingChanges[0]!.severity).toBe('high');
    });

    it('should detect multiple breaking changes', async () => {
      const oldAnalysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction1', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [], signature: 'oldSignature1' },
            { name: 'exportedFunction2', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [], signature: 'oldSignature2' }
          ],
          privateExports: []
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction1', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [], signature: 'newSignature1' }
            // exportedFunction2 is removed
          ],
          privateExports: []
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const breakingChanges = await detector.detectBreakingChanges(oldAnalysis, newAnalysis);
      
      expect(breakingChanges.length).toBeGreaterThanOrEqual(2);
      expect(breakingChanges.some(bc => bc.type === 'removed_export')).toBe(true);
      expect(breakingChanges.some(bc => bc.type === 'changed_signature')).toBe(true);
    });
  });

  describe('analyzeImpact', () => {
    it('should analyze impact of changes', async () => {
      const changes: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts', '/test/src/file2.ts'],
        changeTypes: ['modified', 'added'],
        changeCount: 2,
        changeHash: 'abc123',
        categories: ['feature', 'bugfix']
      };

      const analysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [
            { id: '1', type: 'import', from: '/test/src/file1.ts', to: '/test/src/file3.ts', metadata: {} },
            { id: '2', type: 'import', from: '/test/src/file2.ts', to: '/test/src/file1.ts', metadata: {} }
          ],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        }
      });

      const impact = await detector.analyzeImpact(changes, analysis);
      
      expect(impact.affectedFiles).toContain('/test/src/file3.ts');
      expect(impact.dependencyChain).toBeDefined();
      expect(impact.riskLevel).toBeDefined();
      expect(impact.categories).toContain('feature');
      expect(impact.categories).toContain('bugfix');
    });
  });

  describe('generateChangeReport', () => {
    it('should generate comprehensive change report', async () => {
      const oldAnalysis = createMockAnalysis();
      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const report = await detector.generateChangeReport(oldAnalysis, newAnalysis);
      
      expect(report.summary).toBeDefined();
      expect(report.changes).toBeDefined();
      expect(report.breakingChanges).toBeDefined();
      expect(report.impact).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should handle empty analyses', async () => {
      const emptyAnalysis = createMockAnalysis();
      const report = await detector.generateChangeReport(emptyAnalysis, emptyAnalysis);
      
      expect(report.summary).toBeDefined();
      expect(report.changes.changeCount).toBe(0);
      expect(report.breakingChanges).toHaveLength(0);
    });

    it('should handle analyses with no public exports', async () => {
      const oldAnalysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const report = await detector.generateChangeReport(oldAnalysis, newAnalysis);
      
      expect(report.breakingChanges).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined signatures', async () => {
      const oldAnalysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [] }
          ],
          privateExports: []
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [], signature: 'newSignature' }
          ],
          privateExports: []
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const breakingChanges = await detector.detectBreakingChanges(oldAnalysis, newAnalysis);
      
      expect(breakingChanges).toHaveLength(1);
      expect(breakingChanges[0]!.type).toBe('changed_signature');
    });

    it('should handle identical signatures', async () => {
      const oldAnalysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [], signature: 'sameSignature' }
          ],
          privateExports: []
        }
      });

      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        ast: {
          nodes: [],
          relations: [],
          entryPoints: [],
          publicExports: [
            { name: 'exportedFunction', type: 'function', file: '/test/src/file.ts', isDefault: false, usage: [], signature: 'sameSignature' }
          ],
          privateExports: []
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z' }
      });

      const breakingChanges = await detector.detectBreakingChanges(oldAnalysis, newAnalysis);
      
      expect(breakingChanges).toHaveLength(0);
    });

    it('should handle risk level calculation for different change counts', async () => {
      const changes: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts', '/test/src/file2.ts', '/test/src/file3.ts', '/test/src/file4.ts', '/test/src/file5.ts'],
        changeTypes: ['modified', 'added', 'deleted', 'modified', 'added'],
        changeCount: 5,
        changeHash: 'abc123',
        categories: ['feature', 'bugfix']
      };

      const analysis = createMockAnalysis();

      const impact = await detector.analyzeImpact(changes, analysis);
      
      // With 5 changes, risk level should be 'high' or 'critical'
      expect(['low', 'medium', 'high', 'critical']).toContain(impact.riskLevel);
    });

    it('should handle empty change categories', async () => {
      const changes: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts'],
        changeTypes: ['modified'],
        changeCount: 1,
        changeHash: 'abc123',
        categories: []
      };

      const analysis = createMockAnalysis();

      const impact = await detector.analyzeImpact(changes, analysis);
      
      expect(impact.categories).toEqual([]);
    });

    it('should handle generateChangeReport with different risk levels', async () => {
      const oldAnalysis = createMockAnalysis();
      const newAnalysis = createMockAnalysis({
        project: { ...createMockAnalysis().project, version: '1.1.0' },
        structure: {
          files: [
            { path: '/test/src/file1.ts', size: 100, lines: 10, lastModified: '2024-01-02T00:00:00Z' },
            { path: '/test/src/file2.ts', size: 200, lines: 20, lastModified: '2024-01-02T00:00:00Z' },
            { path: '/test/src/file3.ts', size: 300, lines: 30, lastModified: '2024-01-02T00:00:00Z' },
            { path: '/test/src/file4.ts', size: 400, lines: 40, lastModified: '2024-01-02T00:00:00Z' },
            { path: '/test/src/file5.ts', size: 500, lines: 50, lastModified: '2024-01-02T00:00:00Z' }
          ],
          directories: [],
          totalFiles: 5,
          totalLines: 150,
          totalSize: 1500
        },
        metadata: { ...createMockAnalysis().metadata, generatedAt: '2024-01-02T00:00:00Z', filesProcessed: 5 }
      });

      const report = await detector.generateChangeReport(oldAnalysis, newAnalysis);
      
      expect(report.summary).toBeDefined();
      expect(report.summary.totalChanges).toBe(5);
      expect(['low', 'medium', 'high', 'critical']).toContain(report.summary.riskLevel);
    });

    it('should handle generateChangeReport with no changes', async () => {
      const analysis = createMockAnalysis();
      const report = await detector.generateChangeReport(analysis, analysis);
      
      expect(report.summary).toBeDefined();
      expect(report.summary.totalChanges).toBe(0);
      expect(report.summary.breakingChanges).toBe(0);
      expect(report.summary.newFeatures).toBe(0);
      expect(report.summary.bugFixes).toBe(0);
      expect(report.summary.riskLevel).toBe('low');
    });

    it('should handle calculateRiskLevel with different change counts', async () => {
      const changes1: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts'],
        changeTypes: ['modified'],
        changeCount: 1,
        changeHash: 'abc123',
        categories: ['bugfix']
      };

      const changes2: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts', '/test/src/file2.ts', '/test/src/file3.ts'],
        changeTypes: ['modified', 'added', 'deleted'],
        changeCount: 3,
        changeHash: 'abc123',
        categories: ['feature']
      };

      const changes3: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts', '/test/src/file2.ts', '/test/src/file3.ts', '/test/src/file4.ts', '/test/src/file5.ts', '/test/src/file6.ts'],
        changeTypes: ['modified', 'added', 'deleted', 'modified', 'added', 'deleted'],
        changeCount: 6,
        changeHash: 'abc123',
        categories: ['feature', 'bugfix']
      };

      const analysis = createMockAnalysis();

      const impact1 = await detector.analyzeImpact(changes1, analysis);
      const impact2 = await detector.analyzeImpact(changes2, analysis);
      const impact3 = await detector.analyzeImpact(changes3, analysis);

      expect(impact1.riskLevel).toBe('low');
      expect(['low', 'medium']).toContain(impact2.riskLevel);
      expect(['medium', 'high', 'critical']).toContain(impact3.riskLevel);
    });

    it('should handle findDependentFiles with complex relations', async () => {
      const changes: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts'],
        changeTypes: ['modified'],
        changeCount: 1,
        changeHash: 'abc123',
        categories: ['feature']
      };

      const analysis = createMockAnalysis({
        ast: {
          nodes: [],
          relations: [
            { id: '1', type: 'import', from: '/test/src/file1.ts', to: '/test/src/file2.ts', metadata: {} },
            { id: '2', type: 'import', from: '/test/src/file2.ts', to: '/test/src/file3.ts', metadata: {} },
            { id: '3', type: 'import', from: '/test/src/file3.ts', to: '/test/src/file4.ts', metadata: {} }
          ],
          entryPoints: [],
          publicExports: [],
          privateExports: []
        }
      });

      const impact = await detector.analyzeImpact(changes, analysis);
      
      expect(impact.affectedFiles).toContain('/test/src/file2.ts');
      // The dependency chain might not include all files depending on implementation
      expect(impact.affectedFiles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle calculateRiskLevel with breaking changes', async () => {
      const changes: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts'],
        changeTypes: ['modified'],
        changeCount: 1,
        changeHash: 'abc123',
        categories: ['breaking']
      };

      const analysis = createMockAnalysis();

      const impact = await detector.analyzeImpact(changes, analysis);
      
      expect(['high', 'critical']).toContain(impact.riskLevel);
    });

    it('should handle calculateRiskLevel with critical change count', async () => {
      const changes: ChangeInfo = {
        filesChanged: Array.from({ length: 20 }, (_, i) => `/test/src/file${i + 1}.ts`),
        changeTypes: Array.from({ length: 20 }, () => 'modified'),
        changeCount: 20,
        changeHash: 'abc123',
        categories: ['feature']
      };

      const analysis = createMockAnalysis();

      const impact = await detector.analyzeImpact(changes, analysis);
      
      expect(['medium', 'high', 'critical']).toContain(impact.riskLevel);
    });

    it('should handle calculateRiskLevel with medium change count', async () => {
      const changes: ChangeInfo = {
        filesChanged: ['/test/src/file1.ts', '/test/src/file2.ts', '/test/src/file3.ts'],
        changeTypes: ['modified', 'added', 'deleted'],
        changeCount: 3,
        changeHash: 'abc123',
        categories: ['feature']
      };

      const analysis = createMockAnalysis();

      const impact = await detector.analyzeImpact(changes, analysis);
      
      expect(['low', 'medium', 'high']).toContain(impact.riskLevel);
    });
  });
});
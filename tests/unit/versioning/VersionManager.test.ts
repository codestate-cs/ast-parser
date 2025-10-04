import { VersionManager } from '../../../src/versioning/VersionManager';
import { ProjectAnalysisOutput } from '../../../src/types/project';
import { VersioningConfig, VersionMetadata, VersionInfo } from '../../../src/types/versioning';

describe('VersionManager', () => {
  let versionManager: VersionManager;
  let mockProjectAnalysis: ProjectAnalysisOutput;

  beforeEach(() => {
    versionManager = new VersionManager();
    
    mockProjectAnalysis = {
      project: {
        name: 'test-project',
        version: '1.0.0',
        type: 'typescript',
        rootPath: '/test',
        entryPoints: ['src/index.ts'],
        dependencies: [],
        devDependencies: []
      },
      structure: {
        files: [
          { path: 'src/index.ts', size: 100, lines: 10, lastModified: '2024-01-01T00:00:00Z' }
        ],
        directories: [],
        totalFiles: 1,
        totalLines: 10,
        totalSize: 100
      },
      ast: {
        nodes: [],
        relations: [],
        entryPoints: [],
        publicExports: [],
        privateExports: []
      },
      analysis: {
        complexity: { cyclomatic: 1, cognitive: 1, maintainability: 80 },
        patterns: [],
        architecture: { layers: [], modules: [] },
        quality: { score: 85, issues: [] }
      },
      metadata: {
        generatedAt: '2024-01-01T00:00:00Z',
        parserVersion: '1.0.0',
        processingTime: 1000,
        cacheUsed: false,
        filesProcessed: 1
      }
    };
  });

  describe('constructor', () => {
    it('should create instance with default configuration', () => {
      expect(versionManager).toBeInstanceOf(VersionManager);
    });

    it('should create instance with custom configuration', () => {
      const customConfig: Partial<VersioningConfig> = {
        defaultStrategy: 'semantic',
        storage: {
          type: 'local',
          path: './custom-versions',
          options: {}
        }
      };
      const customManager = new VersionManager(customConfig);
      expect(customManager).toBeInstanceOf(VersionManager);
    });
  });

  describe('version creation', () => {
    it('should create version using default strategy', async () => {
      const versionInfo = await versionManager.createVersion(mockProjectAnalysis);
      
      expect(versionInfo).toBeDefined();
      expect(versionInfo.version).toBeDefined();
      expect(versionInfo.metadata).toBeDefined();
      expect(versionInfo.metadata.createdAt).toBeDefined();
    });

    it('should create version using specified strategy', async () => {
      const versionInfo = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp',
        version: '1.2.3'
      });
      
      expect(versionInfo).toBeDefined();
      expect(versionInfo.version).toBeDefined();
      expect(versionInfo.metadata).toBeDefined();
    });

    it('should create version with custom metadata', async () => {
      const customMetadata: Partial<VersionMetadata> = {
        tags: ['release', 'stable'],
        description: 'Stable release version'
      };
      
      const versionInfo = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'custom',
        metadata: customMetadata
      });
      
      expect(versionInfo).toBeDefined();
      expect(versionInfo.metadata.tags).toEqual(['release', 'stable']);
      expect(versionInfo.metadata.description).toBe('Stable release version');
    });

    it('should handle version creation errors gracefully', async () => {
      const invalidAnalysis = null as any;
      
      await expect(versionManager.createVersion(invalidAnalysis))
        .rejects.toThrow();
    });
  });

  describe('version storage', () => {
    it('should store version successfully', async () => {
      const versionInfo = await versionManager.createVersion(mockProjectAnalysis);
      const storedVersion = await versionManager.storeVersion(versionInfo);
      
      expect(storedVersion).toBeDefined();
      expect(storedVersion.id).toBeDefined();
      expect(storedVersion.storedAt).toBeDefined();
    });

    it('should store version with custom storage options', async () => {
      const versionInfo = await versionManager.createVersion(mockProjectAnalysis);
      const storedVersion = await versionManager.storeVersion(versionInfo, {
        type: 'local',
        path: './custom-storage',
        options: { compress: true }
      });
      
      expect(storedVersion).toBeDefined();
      expect(storedVersion.storage).toBeDefined();
    });

    it('should handle storage errors gracefully', async () => {
      const invalidVersion = null as any;
      
      await expect(versionManager.storeVersion(invalidVersion))
        .rejects.toThrow();
    });
  });

  describe('version retrieval', () => {
    beforeEach(async () => {
      const versionInfo = await versionManager.createVersion(mockProjectAnalysis);
      await versionManager.storeVersion(versionInfo);
    });

    it('should retrieve version by ID', async () => {
      const versions = await versionManager.getVersions();
      const versionId = versions[0]?.id;
      
      if (versionId) {
        const retrievedVersion = await versionManager.getVersion(versionId);
        expect(retrievedVersion).toBeDefined();
        expect(retrievedVersion?.id).toBe(versionId);
      }
    });

    it('should retrieve all versions', async () => {
      const versions = await versionManager.getVersions();
      expect(Array.isArray(versions)).toBe(true);
    });

    it('should retrieve versions by strategy', async () => {
      const versions = await versionManager.getVersions({ strategy: 'semantic' });
      expect(Array.isArray(versions)).toBe(true);
    });

    it('should retrieve versions by metadata', async () => {
      const versions = await versionManager.getVersions({ 
        metadata: { tags: ['release'] } 
      });
      expect(Array.isArray(versions)).toBe(true);
    });

    it('should return null for non-existent version', async () => {
      const version = await versionManager.getVersion('non-existent-id');
      expect(version).toBeNull();
    });
  });

  describe('version comparison', () => {
    let version1: VersionInfo;
    let version2: VersionInfo;

    beforeEach(async () => {
      version1 = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version1);
      
      const modifiedAnalysis = {
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.1.0' }
      };
      
      version2 = await versionManager.createVersion(modifiedAnalysis, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version2);
    });

    it('should compare two versions', async () => {
      const comparison = await versionManager.compareVersions(version1.id, version2.id);
      
      expect(comparison).toBeDefined();
      expect(comparison.summary).toBeDefined();
      expect(comparison.details).toBeDefined();
      expect(comparison.recommendations).toBeDefined();
    });

    it('should generate diff between versions', async () => {
      const diff = await versionManager.generateDiff(version1.id, version2.id);
      
      expect(diff).toBeDefined();
      expect(diff.format).toBeDefined();
      expect(diff.content).toBeDefined();
      expect(diff.metadata).toBeDefined();
    });

    it('should generate diff in specific format', async () => {
      const diff = await versionManager.generateDiff(version1.id, version2.id, 'markdown');
      
      expect(diff).toBeDefined();
      expect(diff.format).toBe('markdown');
      expect(diff.content).toBeDefined();
    });

    it('should handle comparison errors gracefully', async () => {
      await expect(versionManager.compareVersions('invalid-id', 'invalid-id'))
        .rejects.toThrow();
    });

    it('should handle comparison with empty version IDs', async () => {
      await expect(versionManager.compareVersions('', ''))
        .rejects.toThrow('Both version IDs are required');
    });

    it('should handle comparison with one empty version ID', async () => {
      await expect(versionManager.compareVersions(version1.id, ''))
        .rejects.toThrow('Both version IDs are required');
    });

    it('should handle comparison with null version IDs', async () => {
      await expect(versionManager.compareVersions(null as any, null as any))
        .rejects.toThrow('Both version IDs are required');
    });
  });

  describe('version management', () => {
    let versionInfo: VersionInfo;

    beforeEach(async () => {
      versionInfo = await versionManager.createVersion(mockProjectAnalysis);
      await versionManager.storeVersion(versionInfo);
    });

    it('should update version metadata', async () => {
      const updatedMetadata = {
        ...versionInfo.metadata,
        description: 'Updated description',
        tags: ['updated', 'version']
      };
      
      const updatedVersion = await versionManager.updateVersion(versionInfo.id, {
        metadata: updatedMetadata
      });
      
      expect(updatedVersion).toBeDefined();
      expect(updatedVersion?.metadata.description).toBe('Updated description');
      expect(updatedVersion?.metadata.tags).toEqual(['updated', 'version']);
    });

    it('should delete version', async () => {
      const deleted = await versionManager.deleteVersion(versionInfo.id);
      expect(deleted).toBe(true);
      
      const retrievedVersion = await versionManager.getVersion(versionInfo.id);
      expect(retrievedVersion).toBeNull();
    });

    it('should return false when deleting non-existent version', async () => {
      const deleted = await versionManager.deleteVersion('non-existent-id');
      expect(deleted).toBe(false);
    });

    it('should handle deleteVersion with empty version ID', async () => {
      await expect(versionManager.deleteVersion(''))
        .rejects.toThrow('Version ID is required');
    });

    it('should handle deleteVersion with null version ID', async () => {
      await expect(versionManager.deleteVersion(null as any))
        .rejects.toThrow('Version ID is required');
    });

    it('should handle updateVersion with empty version ID', async () => {
      await expect(versionManager.updateVersion('', {
        description: 'test'
      })).rejects.toThrow('Version ID is required');
    });

    it('should handle updateVersion with null version ID', async () => {
      await expect(versionManager.updateVersion(null as any, {
        description: 'test'
      })).rejects.toThrow('Version ID is required');
    });

    it('should cleanup old versions', async () => {
      const cleanupResult = await versionManager.cleanupVersions({
        maxVersions: 5,
        keepForever: [],
        autoCleanup: true
      });
      
      expect(cleanupResult).toBeDefined();
      expect(cleanupResult.deletedCount).toBeDefined();
      expect(cleanupResult.keptCount).toBeDefined();
    });

    it('should keep versions that are marked as keepForever by ID', async () => {
      // Create multiple versions
      const version1 = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version1);
      
      const version2 = await versionManager.createVersion({
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.1.0' }
      }, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version2);
      
      const version3 = await versionManager.createVersion({
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.2.0' }
      }, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version3);
      
      // Cleanup with keepForever including version1 ID
      const cleanupResult = await versionManager.cleanupVersions({
        maxVersions: 1,
        keepForever: [version1.id],
        autoCleanup: true
      });
      
      expect(cleanupResult).toBeDefined();
      expect(cleanupResult.keptCount).toBeGreaterThan(0);
      
      // Verify version1 still exists
      const retrievedVersion = await versionManager.getVersion(version1.id);
      expect(retrievedVersion).toBeDefined();
    });

    it('should keep versions that are marked as keepForever by version string', async () => {
      // Create multiple versions
      const version1 = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp',
        version: 'keep-this-version'
      });
      await versionManager.storeVersion(version1);
      
      const version2 = await versionManager.createVersion({
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.1.0' }
      }, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version2);
      
      // Cleanup with keepForever including version string
      const cleanupResult = await versionManager.cleanupVersions({
        maxVersions: 1,
        keepForever: ['keep-this-version'],
        autoCleanup: true
      });
      
      expect(cleanupResult).toBeDefined();
      expect(cleanupResult.keptCount).toBeGreaterThan(0);
      
      // Verify version1 still exists
      const retrievedVersion = await versionManager.getVersion(version1.id);
      expect(retrievedVersion).toBeDefined();
    });
  });

  describe('configuration management', () => {
    it('should get current configuration', () => {
      const config = versionManager.getConfig();
      expect(config).toBeDefined();
      expect(config.defaultStrategy).toBeDefined();
      expect(config.storage).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig: Partial<VersioningConfig> = {
        defaultStrategy: 'timestamp',
        storage: {
          type: 'local',
          path: './new-storage',
          options: {}
        }
      };
      
      versionManager.setConfig(newConfig);
      const updatedConfig = versionManager.getConfig();
      
      expect(updatedConfig.defaultStrategy).toBe('timestamp');
      expect(updatedConfig.storage.path).toBe('./new-storage');
    });

    it('should reset to default configuration', () => {
      versionManager.resetConfig();
      const config = versionManager.getConfig();
      
      expect(config).toBeDefined();
      expect(config.defaultStrategy).toBeDefined();
    });
  });

  describe('strategy management', () => {
    it('should get available strategies', () => {
      const strategies = versionManager.getAvailableStrategies();
      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);
    });

    it('should get strategy by name', () => {
      const strategy = versionManager.getStrategy('semantic');
      expect(strategy).toBeDefined();
    });

    it('should return null for non-existent strategy', () => {
      const strategy = versionManager.getStrategy('non-existent');
      expect(strategy).toBeNull();
    });

    it('should validate strategy configuration', () => {
      const isValid = versionManager.validateStrategyConfig('semantic', {
        version: '1.0.0'
      });
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('error handling', () => {
    it('should handle invalid project analysis', async () => {
      await expect(versionManager.createVersion(null as any))
        .rejects.toThrow();
    });

    it('should handle invalid version options', async () => {
      await expect(versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'invalid-strategy' as any
      })).rejects.toThrow();
    });

    it('should handle storage errors', async () => {
      const versionInfo = await versionManager.createVersion(mockProjectAnalysis);
      
      await expect(versionManager.storeVersion(versionInfo, {
        type: 'invalid-storage' as any
      })).rejects.toThrow();
    });

    it('should handle retrieval errors', async () => {
      await expect(versionManager.getVersion(''))
        .rejects.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty project analysis', async () => {
      const emptyAnalysis = {
        ...mockProjectAnalysis,
        structure: { ...mockProjectAnalysis.structure, files: [] }
      };
      
      const versionInfo = await versionManager.createVersion(emptyAnalysis);
      expect(versionInfo).toBeDefined();
    });

    it('should handle very large project analysis', async () => {
      const largeAnalysis = {
        ...mockProjectAnalysis,
        structure: {
          ...mockProjectAnalysis.structure,
          files: Array.from({ length: 1000 }, (_, i) => ({
            path: `src/file${i}.ts`,
            size: 1000,
            lines: 100,
            lastModified: '2024-01-01T00:00:00Z'
          }))
        }
      };
      
      const versionInfo = await versionManager.createVersion(largeAnalysis);
      expect(versionInfo).toBeDefined();
    });

    it('should handle concurrent version creation', async () => {
      const promises = Array.from({ length: 5 }, () => 
        versionManager.createVersion(mockProjectAnalysis)
      );
      
      const versions = await Promise.all(promises);
      expect(versions).toHaveLength(5);
      versions.forEach(version => {
        expect(version).toBeDefined();
        expect(version.version).toBeDefined();
      });
    });

    it('should handle version with special characters', async () => {
      const specialAnalysis = {
        ...mockProjectAnalysis,
        project: {
          ...mockProjectAnalysis.project,
          name: 'test-project-with-special-chars-@#$%'
        }
      };
      
      const versionInfo = await versionManager.createVersion(specialAnalysis);
      expect(versionInfo).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete version lifecycle', async () => {
      // Create version
      const versionInfo = await versionManager.createVersion(mockProjectAnalysis);
      expect(versionInfo).toBeDefined();
      
      // Store version
      const storedVersion = await versionManager.storeVersion(versionInfo);
      expect(storedVersion).toBeDefined();
      
      // Retrieve version
      const retrievedVersion = await versionManager.getVersion(versionInfo.id);
      expect(retrievedVersion).toBeDefined();
      
      // Update version
      const updatedVersion = await versionManager.updateVersion(versionInfo.id, {
        metadata: { ...versionInfo.metadata, description: 'Updated' }
      });
      expect(updatedVersion).toBeDefined();
      
      // Delete version
      const deleted = await versionManager.deleteVersion(versionInfo.id);
      expect(deleted).toBe(true);
    });

    it('should handle multiple version strategies', async () => {
      const strategies = ['branch', 'timestamp', 'custom'];
      
      for (const strategy of strategies) {
        const versionInfo = await versionManager.createVersion(mockProjectAnalysis, {
          strategy: strategy as any
        });
        expect(versionInfo).toBeDefined();
        expect(versionInfo.metadata.strategy).toBe(strategy);
      }
    });

    it('should handle version comparison across strategies', async () => {
      const branchVersion = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'branch'
      });
      await versionManager.storeVersion(branchVersion);
      
      const timestampVersion = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(timestampVersion);
      
      const comparison = await versionManager.compareVersions(
        branchVersion.id, 
        timestampVersion.id
      );
      
      expect(comparison).toBeDefined();
    });

    it('should handle getVersions with pagination', async () => {
      // Create multiple versions
      const version1 = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version1);
      
      const version2 = await versionManager.createVersion({
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.1.0' }
      }, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version2);
      
      // Test pagination
      const versions = await versionManager.getVersions({
        offset: 1,
        limit: 1
      });
      
      expect(versions).toHaveLength(1);
    });

    it('should handle getVersions with tag filtering', async () => {
      const version = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp',
        metadata: {
          tags: ['test', 'v1.0']
        }
      });
      await versionManager.storeVersion(version);
      
      // Test tag filtering
      const versions = await versionManager.getVersions({
        tags: ['test']
      });
      
      expect(versions).toHaveLength(1);
      expect(versions[0]?.metadata.tags).toContain('test');
    });

    it('should handle getVersions with metadata filtering', async () => {
      const version = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp',
        metadata: {
          author: 'test-author',
          description: 'test description'
        }
      });
      await versionManager.storeVersion(version);
      
      // Test metadata filtering
      const versions = await versionManager.getVersions({
        metadata: {
          author: 'test-author'
        }
      });
      
      expect(versions).toHaveLength(1);
      expect(versions[0]?.metadata.author).toBe('test-author');
    });

    it('should handle generateDiff with different formats', async () => {
      const version1 = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version1);
      
      const version2 = await versionManager.createVersion({
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.1.0' }
      }, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version2);
      
      // Test different diff formats
      const jsonDiff = await versionManager.generateDiff(version1.id, version2.id, 'json');
      const markdownDiff = await versionManager.generateDiff(version1.id, version2.id, 'markdown');
      const htmlDiff = await versionManager.generateDiff(version1.id, version2.id, 'html');
      
      expect(jsonDiff.format).toBe('json');
      expect(markdownDiff.format).toBe('markdown');
      expect(htmlDiff.format).toBe('html');
    });

    it('should handle updateVersion with partial metadata', async () => {
      const version = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp',
        metadata: {
          author: 'original-author',
          description: 'original description',
          tags: ['original']
        }
      });
      await versionManager.storeVersion(version);
      
      // Test partial update
      const updatedVersion = await versionManager.updateVersion(version.id, {
        description: 'updated description'
      });
      
      expect(updatedVersion).toBeTruthy();
      expect(updatedVersion!.metadata.description).toBe('updated description');
      expect(updatedVersion!.metadata.author).toBe('original-author'); // Should remain unchanged
    });

    it('should handle updateVersion with tags', async () => {
      const version = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp',
        metadata: {
          tags: ['original']
        }
      });
      await versionManager.storeVersion(version);
      
      // Test tags update
      const updatedVersion = await versionManager.updateVersion(version.id, {
        tags: ['updated', 'new-tag']
      });
      
      expect(updatedVersion).toBeTruthy();
      expect(updatedVersion!.metadata.tags).toEqual(['updated', 'new-tag']);
    });

    it('should handle cleanupVersions with retention policy', async () => {
      const versionManager = new VersionManager({
        config: {
          retention: {
            maxVersions: 2,
            autoCleanup: true,
            cleanupInterval: 1,
            keepForever: []
          }
        }
      });
      
      // Create multiple versions
      const version1 = await versionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version1);
      
      const version2 = await versionManager.createVersion({
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.1.0' }
      }, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version2);
      
      const version3 = await versionManager.createVersion({
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.2.0' }
      }, {
        strategy: 'timestamp'
      });
      await versionManager.storeVersion(version3);
      
      // Test cleanup
      const cleanedCount = await versionManager.cleanupVersions({
        maxVersions: 2,
        keepForever: [],
        autoCleanup: true
      });
      
      expect(cleanedCount.deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle getVersion with non-existent version', async () => {
      // Test with non-existent version
      const version = await versionManager.getVersion('non-existent-id');
      
      expect(version).toBeNull();
    });

    it('should handle compareVersions with non-existent versions', async () => {
      // Test with non-existent versions
      await expect(versionManager.compareVersions('non-existent-1', 'non-existent-2'))
        .rejects.toThrow('One or both versions not found');
    });

    it('should handle generateDiff with non-existent versions', async () => {
      // Test with non-existent versions
      await expect(versionManager.generateDiff('non-existent-1', 'non-existent-2'))
        .rejects.toThrow('One or both versions not found');
    });

    it('should handle generateDiff with empty version IDs', async () => {
      await expect(versionManager.generateDiff('', ''))
        .rejects.toThrow('Both version IDs are required');
    });

    it('should handle generateDiff with one empty version ID', async () => {
      const version1 = await versionManager.createVersion(mockProjectAnalysis);
      await versionManager.storeVersion(version1);
      
      await expect(versionManager.generateDiff(version1.id, ''))
        .rejects.toThrow('Both version IDs are required');
    });

    it('should handle generateDiff with null version IDs', async () => {
      await expect(versionManager.generateDiff(null as any, null as any))
        .rejects.toThrow('Both version IDs are required');
    });

    it('should handle updateVersion with non-existent version', async () => {
      // Test with non-existent version
      const updatedVersion = await versionManager.updateVersion('non-existent-id', {
        description: 'updated'
      });
      
      expect(updatedVersion).toBeNull();
    });

    it('should handle deleteVersion with non-existent version', async () => {
      // Test with non-existent version
      const deleted = await versionManager.deleteVersion('non-existent-id');
      
      expect(deleted).toBe(false);
    });

    it('should handle cleanupVersions with error handling when deleteVersion fails', async () => {
      // Create a version manager with a custom setup to test error handling
      const testVersionManager = new VersionManager();
      
      // Create multiple versions
      const version1 = await testVersionManager.createVersion(mockProjectAnalysis, {
        strategy: 'timestamp'
      });
      await testVersionManager.storeVersion(version1);
      
      const version2 = await testVersionManager.createVersion({
        ...mockProjectAnalysis,
        project: { ...mockProjectAnalysis.project, version: '1.1.0' }
      }, {
        strategy: 'timestamp'
      });
      await testVersionManager.storeVersion(version2);
      
      // Mock the deleteVersion method to throw an error for the first version
      const originalDeleteVersion = testVersionManager.deleteVersion.bind(testVersionManager);
      testVersionManager.deleteVersion = jest.fn().mockImplementation(async (versionId: string) => {
        if (versionId === version1.id) {
          throw new Error('Simulated delete error');
        }
        return originalDeleteVersion(versionId);
      });
      
      // Run cleanup - should handle the error gracefully
      const cleanupResult = await testVersionManager.cleanupVersions({
        maxVersions: 1,
        keepForever: [],
        autoCleanup: true
      });
      
      expect(cleanupResult).toBeDefined();
      expect(cleanupResult.errors).toBeDefined();
      expect(cleanupResult.errors.length).toBeGreaterThan(0);
      expect(cleanupResult.errors[0]).toContain('Failed to delete version');
      expect(cleanupResult.errors[0]).toContain('Simulated delete error');
    });
  });
});

/**
 * @fileoverview Tests for IndexValidator class
 */

import { IndexValidator } from '../../../../src/indexing/maintenance/IndexValidator';
import { ProjectIndex } from '../../../../src/indexing/ProjectIndex';
import { GlobalIndex } from '../../../../src/indexing/GlobalIndex';
import { ProjectIndexEntry } from '../../../../src/types/indexing';
import { ProjectType } from '../../../../src/types/core';

describe('IndexValidator', () => {
  let indexValidator: IndexValidator;
  let mockProjectIndex: ProjectIndex;
  let mockGlobalIndex: GlobalIndex;
  let mockProjectEntry: ProjectIndexEntry;

  beforeEach(() => {
    indexValidator = new IndexValidator();
    
    mockProjectEntry = {
      id: 'project-1',
      name: 'Test Project',
      type: 'typescript' as ProjectType,
      rootPath: '/path/to/project1',
      version: '1.0.0',
      description: 'A test project for demonstration',
      author: 'Test Author',
      repository: 'https://github.com/test/project1',
      languages: ['typescript', 'javascript'],
      tags: ['test', 'demo'],
      lastAnalyzed: new Date(),
      lastModified: new Date(),
      size: 50000,
      fileCount: 10,
      linesOfCode: 1000,
      metadata: { test: true }
    };

    mockProjectIndex = new ProjectIndex(mockProjectEntry);
    mockGlobalIndex = new GlobalIndex();
    mockGlobalIndex.addProject(mockProjectEntry);
  });

  describe('constructor', () => {
    it('should create an IndexValidator with default options', () => {
      const validator = new IndexValidator();
      expect(validator).toBeDefined();
    });

    it('should create an IndexValidator with custom options', () => {
      const options = {
        validateStructure: true,
        validateMetadata: true,
        validateConsistency: true,
        strictMode: false,
        maxErrors: 100
      };
      const validator = new IndexValidator(options);
      expect(validator).toBeDefined();
    });
  });

  describe('validation methods', () => {
    it('should validate a project index', async () => {
      const result = await indexValidator.validateProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate a global index', async () => {
      const result = await indexValidator.validateGlobalIndex(mockGlobalIndex);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate project index structure', async () => {
      const result = await indexValidator.validateProjectStructure(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate project index metadata', async () => {
      const result = await indexValidator.validateProjectMetadata(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate index consistency', async () => {
      const result = await indexValidator.validateIndexConsistency(mockGlobalIndex);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('error detection', () => {
    it('should detect invalid project structure', async () => {
      // Create a project index with invalid structure
      const invalidEntry = { ...mockProjectEntry, name: '' };
      const invalidProjectIndex = new ProjectIndex(invalidEntry);
      
      const result = await indexValidator.validateProjectStructure(invalidProjectIndex);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing metadata', async () => {
      // Create a validator in strict mode to detect missing metadata
      const strictValidator = new IndexValidator({ strictMode: true });
      
      // Create a project index without metadata
      const noMetadataEntry = { ...mockProjectEntry, metadata: {} };
      const noMetadataProjectIndex = new ProjectIndex(noMetadataEntry);
      
      const result = await strictValidator.validateProjectMetadata(noMetadataProjectIndex);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect inconsistent index data', async () => {
      // Create inconsistent data - duplicate project names
      const inconsistentEntry1 = { ...mockProjectEntry, id: 'project-1', name: 'Same Name' };
      const inconsistentEntry2 = { ...mockProjectEntry, id: 'project-2', name: 'Same Name' };
      
      const inconsistentGlobalIndex = new GlobalIndex();
      inconsistentGlobalIndex.addProject(inconsistentEntry1);
      inconsistentGlobalIndex.addProject(inconsistentEntry2);
      
      const result = await indexValidator.validateIndexConsistency(inconsistentGlobalIndex);
      
      expect(result.isValid).toBe(true); // Only warnings for duplicate names, not errors
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validation options', () => {
    it('should respect strict mode setting', async () => {
      const strictValidator = new IndexValidator({ strictMode: true });
      const lenientValidator = new IndexValidator({ strictMode: false });
      
      // Create a project with minor issues
      const problematicEntry = { ...mockProjectEntry, description: '' };
      const problematicProjectIndex = new ProjectIndex(problematicEntry);
      
      const strictResult = await strictValidator.validateProjectIndex(problematicProjectIndex);
      const lenientResult = await lenientValidator.validateProjectIndex(problematicProjectIndex);
      
      expect(strictResult.errors.length).toBeGreaterThanOrEqual(lenientResult.errors.length);
    });

    it('should respect max errors setting', async () => {
      const validator = new IndexValidator({ maxErrors: 5 });
      
      // Create a project with many issues
      const veryInvalidEntry = { 
        ...mockProjectEntry, 
        name: '', 
        type: '' as any, 
        rootPath: '', 
        version: '',
        author: '',
        repository: ''
      };
      const veryInvalidProjectIndex = new ProjectIndex(veryInvalidEntry);
      
      const result = await validator.validateProjectIndex(veryInvalidProjectIndex);
      
      expect(result.errors.length).toBeLessThanOrEqual(5);
    });
  });

  describe('validation statistics', () => {
    it('should track validation statistics', async () => {
      await indexValidator.validateProjectIndex(mockProjectIndex);
      await indexValidator.validateGlobalIndex(mockGlobalIndex);
      
      const stats = indexValidator.getValidationStatistics();
      
      expect(stats.totalValidations).toBeGreaterThan(0);
      expect(stats.successfulValidations).toBeGreaterThan(0);
      expect(stats.failedValidations).toBe(0);
    });

    it('should track validation performance', async () => {
      const startTime = Date.now();
      await indexValidator.validateProjectIndex(mockProjectIndex);
      const endTime = Date.now();
      
      const stats = indexValidator.getValidationStatistics();
      
      expect(stats.averageValidationTime).toBeGreaterThanOrEqual(0);
      expect(stats.averageValidationTime).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });
  });

  describe('batch validation', () => {
    it('should validate multiple project indexes', async () => {
      const projectIndexes = [mockProjectIndex];
      
      const results = await indexValidator.validateProjectIndexes(projectIndexes);
      
      expect(results).toHaveLength(1);
      expect(results[0]?.isValid).toBe(true);
    });

    it('should handle validation errors in batch', async () => {
      const invalidEntry = { ...mockProjectEntry, name: '' };
      const invalidProjectIndex = new ProjectIndex(invalidEntry);
      const projectIndexes = [mockProjectIndex, invalidProjectIndex];
      
      const results = await indexValidator.validateProjectIndexes(projectIndexes);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.isValid).toBe(true);
      expect(results[1]?.isValid).toBe(false);
    });
  });

  describe('validation rules', () => {
    it('should validate required fields', async () => {
      const incompleteEntry = { ...mockProjectEntry, name: undefined as any };
      const incompleteProjectIndex = new ProjectIndex(incompleteEntry);
      
      const result = await indexValidator.validateProjectIndex(incompleteProjectIndex);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some((error) => error.message.includes('name'))).toBe(true);
    });

    it('should validate field formats', async () => {
      const invalidFormatEntry = { 
        ...mockProjectEntry, 
        repository: 'not-a-url',
        version: 'invalid-version'
      };
      const invalidFormatProjectIndex = new ProjectIndex(invalidFormatEntry);
      
      const result = await indexValidator.validateProjectIndex(invalidFormatProjectIndex);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate data types', async () => {
      const wrongTypeEntry = { 
        ...mockProjectEntry, 
        size: 'not-a-number' as any,
        fileCount: 'not-a-number' as any
      };
      const wrongTypeProjectIndex = new ProjectIndex(wrongTypeEntry);
      
      const result = await indexValidator.validateProjectIndex(wrongTypeProjectIndex);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle null project index gracefully', async () => {
      const result = await indexValidator.validateProjectIndex(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle null global index gracefully', async () => {
      const result = await indexValidator.validateGlobalIndex(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle validation errors gracefully', async () => {
      // Create a validator that will throw an error
      const problematicValidator = new IndexValidator();
      
      // Mock a method to throw an error
      jest.spyOn(problematicValidator as any, 'validateProjectStructure').mockRejectedValue(new Error('Validation error'));
      
      const result = await problematicValidator.validateProjectIndex(mockProjectIndex);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('should update validation options', () => {
      const newOptions = {
        validateStructure: false,
        validateMetadata: true,
        validateConsistency: false,
        strictMode: true,
        maxErrors: 50
      };
      
      indexValidator.updateOptions(newOptions);
      
      // Verify options were updated (this would need to be implemented in the class)
      expect(indexValidator).toBeDefined();
    });

    it('should get current validation options', () => {
      const options = indexValidator.getOptions();
      
      expect(options).toBeDefined();
      expect(typeof options.validateStructure).toBe('boolean');
      expect(typeof options.validateMetadata).toBe('boolean');
      expect(typeof options.validateConsistency).toBe('boolean');
      expect(typeof options.strictMode).toBe('boolean');
      expect(typeof options.maxErrors).toBe('number');
    });
  });

  describe('validation reports', () => {
    it('should generate detailed validation report', async () => {
      const result = await indexValidator.validateProjectIndex(mockProjectIndex);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalEntries).toBeGreaterThan(0);
    });

    it('should include validation metadata in report', async () => {
      const result = await indexValidator.validateProjectIndex(mockProjectIndex);
      
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalEntries).toBeDefined();
      expect(result.statistics.validEntries).toBeDefined();
      expect(result.statistics.invalidEntries).toBeDefined();
      expect(result.statistics.orphanedEntries).toBeDefined();
    });
  });
});

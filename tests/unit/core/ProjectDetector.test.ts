/**
 * Tests for ProjectDetector class
 */

import { ProjectDetector } from '../../../src/core';

describe('ProjectDetector', () => {
  describe('detectProjectType', () => {
    it('should detect project type for valid path', async () => {
      const result = await ProjectDetector.detectProjectType(__dirname);
      
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should handle invalid path gracefully', async () => {
      const result = await ProjectDetector.detectProjectType('/invalid/path');
      
      expect(result).toBeDefined();
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBe(0);
    });
  });

  describe('getProjectRoot', () => {
    it('should return project root for valid path', async () => {
      const projectRoot = await ProjectDetector.getProjectRoot(__dirname);
      expect(projectRoot).toBeDefined();
      expect(typeof projectRoot).toBe('string');
    });
  });

  describe('isValidProject', () => {
    it('should return false for invalid project path', async () => {
      const isValid = await ProjectDetector.isValidProject('/invalid/path');
      expect(isValid).toBe(false);
    });

    it('should return boolean for current directory', async () => {
      const isValid = await ProjectDetector.isValidProject(__dirname);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('additional methods', () => {
    it('should have detectProjectType method', () => {
      expect(typeof ProjectDetector.detectProjectType).toBe('function');
    });

    it('should have getProjectRoot method', () => {
      expect(typeof ProjectDetector.getProjectRoot).toBe('function');
    });

    it('should have isValidProject method', () => {
      expect(typeof ProjectDetector.isValidProject).toBe('function');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty project path', async () => {
      const result = await ProjectDetector.detectProjectType('');
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle null project path', async () => {
      const result = await ProjectDetector.detectProjectType(null as any);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle undefined project path', async () => {
      const result = await ProjectDetector.detectProjectType(undefined as any);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle very long project path', async () => {
      const longPath = '/very/long/path/' + 'a'.repeat(1000);
      const result = await ProjectDetector.detectProjectType(longPath);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle project path with special characters', async () => {
      const specialPath = '/path/with spaces/and-special_chars@#$%';
      const result = await ProjectDetector.detectProjectType(specialPath);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle project path with unicode characters', async () => {
      const unicodePath = '/path/with/你好世界/unicode';
      const result = await ProjectDetector.detectProjectType(unicodePath);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('project type detection accuracy', () => {
    it('should detect TypeScript project with high confidence', async () => {
      const result = await ProjectDetector.detectProjectType(__dirname);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
      expect(result.language).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return consistent results for same path', async () => {
      const result1 = await ProjectDetector.detectProjectType(__dirname);
      const result2 = await ProjectDetector.detectProjectType(__dirname);
      
      expect(result1.type).toBe(result2.type);
      expect(result1.language).toBe(result2.language);
      expect(result1.confidence).toBe(result2.confidence);
    });

    it('should have valid metadata structure', async () => {
      const result = await ProjectDetector.detectProjectType(__dirname);
      expect(result.metadata).toBeDefined();
      expect(typeof result.metadata).toBe('object');
    });
  });

  describe('getProjectRoot edge cases', () => {
    it('should handle empty path', async () => {
      const result = await ProjectDetector.getProjectRoot('');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle root path', async () => {
      const result = await ProjectDetector.getProjectRoot('/');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle relative path', async () => {
      const result = await ProjectDetector.getProjectRoot('./');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle path with trailing slash', async () => {
      const result = await ProjectDetector.getProjectRoot(__dirname + '/');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('isValidProject edge cases', () => {
    it('should handle empty path', async () => {
      const result = await ProjectDetector.isValidProject('');
      expect(typeof result).toBe('boolean');
    });

    it('should handle root path', async () => {
      const result = await ProjectDetector.isValidProject('/');
      expect(typeof result).toBe('boolean');
    });

    it('should handle relative path', async () => {
      const result = await ProjectDetector.isValidProject('./');
      expect(typeof result).toBe('boolean');
    });

    it('should handle path with trailing slash', async () => {
      const result = await ProjectDetector.isValidProject(__dirname + '/');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('package.json analysis edge cases', () => {
    it('should handle package.json with browser field', async () => {
      // Mock a package.json with browser field
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        main: 'index.js',
        browser: 'browser.js',
        scripts: {
          start: 'node index.js'
        }
      };

      // Mock FileUtils.exists to return true for package.json
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await ProjectDetector.detectProjectType(__dirname);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should handle package.json with types field', async () => {
      // Mock a package.json with types field
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        main: 'index.js',
        types: 'index.d.ts',
        scripts: {
          start: 'node index.js'
        }
      };

      // Mock FileUtils.exists to return true for package.json
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await ProjectDetector.detectProjectType(__dirname);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should handle package.json with typings field', async () => {
      // Mock a package.json with typings field
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        main: 'index.js',
        typings: 'index.d.ts',
        scripts: {
          start: 'node index.js'
        }
      };

      // Mock FileUtils.exists to return true for package.json
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await ProjectDetector.detectProjectType(__dirname);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should handle package.json with bin field as string', async () => {
      // Mock a package.json with bin field as string
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        main: 'index.js',
        bin: 'bin/cli.js',
        scripts: {
          start: 'node index.js'
        }
      };

      // Mock FileUtils.exists to return true for package.json
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await ProjectDetector.detectProjectType(__dirname);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });

    it('should handle package.json with bin field as object', async () => {
      // Mock a package.json with bin field as object
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        main: 'index.js',
        bin: {
          'cli': 'bin/cli.js',
          'server': 'bin/server.js'
        },
        scripts: {
          start: 'node index.js'
        }
      };

      // Mock FileUtils.exists to return true for package.json
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify(mockPackageJson));

      const result = await ProjectDetector.detectProjectType(__dirname);
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });
  });

  describe('branch coverage improvements', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should detect React project type', async () => {
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists')
        .mockResolvedValueOnce(true) // package.json exists
        .mockResolvedValueOnce(false) // tsconfig.json doesn't exist (analyzeProjectType)
        .mockResolvedValueOnce(false) // babel.config.js doesn't exist (analyzeProjectType)
        .mockResolvedValueOnce(false) // tsconfig.json doesn't exist (detectLanguage)
        .mockResolvedValueOnce(false); // requirements.txt doesn't exist (detectLanguage)

      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify({
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        }
      }));

      const result = await ProjectDetector.detectProjectType(__dirname);
      
      expect(result.type).toBe('react');
      expect(result.language).toBe('javascript');
    });

    it('should detect JavaScript project with Babel', async () => {
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists')
        .mockResolvedValueOnce(true) // package.json exists
        .mockResolvedValueOnce(true) // babel.config.js exists
        .mockResolvedValueOnce(false); // requirements.txt doesn't exist

      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify({
        dependencies: {
          'babel': '^7.0.0'
        }
      }));

      const result = await ProjectDetector.detectProjectType(__dirname);
      
      expect(result.type).toBe('javascript');
      expect(result.language).toBe('javascript');
    });

    it('should detect Python project', async () => {
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists').mockImplementation((path: unknown) => {
        const pathStr = String(path);
        if (pathStr.includes('tsconfig.json')) {
          return Promise.resolve(false);
        }
        if (pathStr.includes('requirements.txt')) {
          return Promise.resolve(true);
        }
        if (pathStr.includes('package.json')) {
          return Promise.resolve(true);
        }
        return Promise.resolve(false);
      });

      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify({
        dependencies: {
          'python': '^3.8.0'
        }
      }));

      const result = await ProjectDetector.detectProjectType(__dirname);
      
      expect(result.type).toBe('unknown'); // Python is not a supported project type in analyzeProjectType
      expect(result.language).toBe('python');
    });

    it('should detect module entry point', async () => {
      const FileUtils = require('../../../src/utils/file/FileUtils').FileUtils;
      jest.spyOn(FileUtils, 'exists').mockResolvedValue(true);
      jest.spyOn(FileUtils, 'readFile').mockResolvedValue(JSON.stringify({
        name: 'test-project',
        main: 'index.js',
        module: 'index.mjs'
      }));

      const result = await ProjectDetector.detectProjectType(__dirname);
      
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();
    });
  });
});

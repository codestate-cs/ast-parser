/**
 * Tests for PathUtils class
 */

import { PathUtils, FileUtils } from '../../../src/utils';

// Mock FileUtils
jest.mock('../../../src/utils/file/FileUtils');

describe('PathUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock FileUtils methods
    (FileUtils.getExtension as jest.Mock).mockImplementation((path: string) => {
      const lowerPath = path.toLowerCase();
      if (lowerPath.endsWith('.ts')) return '.ts';
      if (lowerPath.endsWith('.tsx')) return '.tsx';
      if (lowerPath.endsWith('.js')) return '.js';
      if (lowerPath.endsWith('.jsx')) return '.jsx';
      if (lowerPath.endsWith('.md')) return '.md';
      if (lowerPath.endsWith('.txt')) return '.txt';
      if (lowerPath.endsWith('.rst')) return '.rst';
      return '';
    });

    (FileUtils.getFileName as jest.Mock).mockImplementation((path: string) => {
      return path.split('/').pop() || path.split('\\').pop() || path;
    });

    (FileUtils.getBaseName as jest.Mock).mockImplementation((path: string) => {
      const fileName = path.split('/').pop() || path.split('\\').pop() || path;
      const ext = fileName.toLowerCase();
      if (ext.endsWith('.ts')) return fileName.slice(0, -3);
      if (ext.endsWith('.tsx')) return fileName.slice(0, -4);
      if (ext.endsWith('.js')) return fileName.slice(0, -3);
      if (ext.endsWith('.jsx')) return fileName.slice(0, -4);
      return fileName;
    });

    (FileUtils.getDirName as jest.Mock).mockImplementation((path: string) => {
      const parts = path.split('/');
      if (parts.length > 1) {
        return parts.slice(0, -1).join('/');
      }
      return '.';
    });

    (FileUtils.relative as jest.Mock).mockImplementation((from: string, to: string) => {
      // Simple relative path calculation for tests
      if (from === to) return '';
      if (to.startsWith(from + '/')) {
        return to.substring(from.length + 1);
      }
      
      // Special case: if from is root and to is a file in root
      if (from === '/' && to.startsWith('/') && !to.substring(1).includes('/')) {
        return to.substring(1);
      }
      
      // Handle cases where we need to go up directories
      const fromParts = from.split('/');
      const toParts = to.split('/');
      
      // Find common prefix
      let commonLength = 0;
      for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
        if (fromParts[i] === toParts[i]) {
          commonLength++;
        } else {
          break;
        }
      }
      
      // Calculate relative path
      const upLevels = fromParts.length - commonLength;
      const relativeParts = toParts.slice(commonLength);
      
      if (upLevels === 0) {
        return relativeParts.join('/');
      } else {
        const upPath = '../'.repeat(upLevels);
        return upPath + relativeParts.join('/');
      }
    });

    (FileUtils.resolve as jest.Mock).mockImplementation((path: string) => {
      return path;
    });

    (FileUtils.exists as jest.Mock).mockResolvedValue(false);
  });

  describe('file type detection', () => {

    describe('isTypeScriptFile', () => {
      it('should detect TypeScript files', () => {
        expect(PathUtils.isTypeScriptFile('test.ts')).toBe(true);
        expect(PathUtils.isTypeScriptFile('test.tsx')).toBe(true);
        expect(PathUtils.isTypeScriptFile('TEST.TS')).toBe(true);
        expect(PathUtils.isTypeScriptFile('TEST.TSX')).toBe(true);
      });

      it('should reject non-TypeScript files', () => {
        expect(PathUtils.isTypeScriptFile('test.js')).toBe(false);
        expect(PathUtils.isTypeScriptFile('test.jsx')).toBe(false);
        expect(PathUtils.isTypeScriptFile('test.md')).toBe(false);
        expect(PathUtils.isTypeScriptFile('test.txt')).toBe(false);
        expect(PathUtils.isTypeScriptFile('test')).toBe(false);
      });
    });

    describe('isJavaScriptFile', () => {
      it('should detect JavaScript files', () => {
        expect(PathUtils.isJavaScriptFile('test.js')).toBe(true);
        expect(PathUtils.isJavaScriptFile('test.jsx')).toBe(true);
        expect(PathUtils.isJavaScriptFile('TEST.JS')).toBe(true);
        expect(PathUtils.isJavaScriptFile('TEST.JSX')).toBe(true);
      });

      it('should reject non-JavaScript files', () => {
        expect(PathUtils.isJavaScriptFile('test.ts')).toBe(false);
        expect(PathUtils.isJavaScriptFile('test.tsx')).toBe(false);
        expect(PathUtils.isJavaScriptFile('test.md')).toBe(false);
        expect(PathUtils.isJavaScriptFile('test.txt')).toBe(false);
        expect(PathUtils.isJavaScriptFile('test')).toBe(false);
      });
    });

    describe('isSourceFile', () => {
      it('should detect source files', () => {
        expect(PathUtils.isSourceFile('test.ts')).toBe(true);
        expect(PathUtils.isSourceFile('test.tsx')).toBe(true);
        expect(PathUtils.isSourceFile('test.js')).toBe(true);
        expect(PathUtils.isSourceFile('test.jsx')).toBe(true);
      });

      it('should reject non-source files', () => {
        expect(PathUtils.isSourceFile('test.md')).toBe(false);
        expect(PathUtils.isSourceFile('test.txt')).toBe(false);
        expect(PathUtils.isSourceFile('test')).toBe(false);
      });
    });

    describe('isTestFile', () => {
      it('should detect test files', () => {
        expect(PathUtils.isTestFile('test.test.ts')).toBe(true);
        expect(PathUtils.isTestFile('test.spec.ts')).toBe(true);
        expect(PathUtils.isTestFile('TEST.TEST.TS')).toBe(true);
        expect(PathUtils.isTestFile('TEST.SPEC.TS')).toBe(true);
        expect(PathUtils.isTestFile('component.test.jsx')).toBe(true);
        expect(PathUtils.isTestFile('component.spec.jsx')).toBe(true);
      });

      it('should reject non-test files', () => {
        expect(PathUtils.isTestFile('test.ts')).toBe(false);
        expect(PathUtils.isTestFile('test.js')).toBe(false);
        expect(PathUtils.isTestFile('component.tsx')).toBe(false);
        expect(PathUtils.isTestFile('component.jsx')).toBe(false);
      });
    });

    describe('isDocumentationFile', () => {
      it('should detect documentation files', () => {
        expect(PathUtils.isDocumentationFile('README.md')).toBe(true);
        expect(PathUtils.isDocumentationFile('CHANGELOG.txt')).toBe(true);
        expect(PathUtils.isDocumentationFile('README.MD')).toBe(true);
        expect(PathUtils.isDocumentationFile('CHANGELOG.TXT')).toBe(true);
        expect(PathUtils.isDocumentationFile('docs.rst')).toBe(true);
        expect(PathUtils.isDocumentationFile('DOCS.RST')).toBe(true);
      });

      it('should reject non-documentation files', () => {
        expect(PathUtils.isDocumentationFile('test.ts')).toBe(false);
        expect(PathUtils.isDocumentationFile('test.js')).toBe(false);
        expect(PathUtils.isDocumentationFile('package.json')).toBe(false);
        expect(PathUtils.isDocumentationFile('tsconfig.json')).toBe(false);
      });
    });

    describe('isConfigFile', () => {
      it('should detect configuration files', () => {
        expect(PathUtils.isConfigFile('package.json')).toBe(true);
        expect(PathUtils.isConfigFile('tsconfig.json')).toBe(true);
        expect(PathUtils.isConfigFile('webpack.config.js')).toBe(true);
        expect(PathUtils.isConfigFile('vite.config.ts')).toBe(true);
        expect(PathUtils.isConfigFile('jest.config.js')).toBe(true);
        expect(PathUtils.isConfigFile('eslint.config.js')).toBe(true);
        expect(PathUtils.isConfigFile('prettier.config.js')).toBe(true);
        expect(PathUtils.isConfigFile('.gitignore')).toBe(true);
        expect(PathUtils.isConfigFile('.eslintrc.js')).toBe(true);
        expect(PathUtils.isConfigFile('.prettierrc')).toBe(true);
      });

      it('should reject non-configuration files', () => {
        expect(PathUtils.isConfigFile('file.js')).toBe(false);
        expect(PathUtils.isConfigFile('README.md')).toBe(false);
        expect(PathUtils.isConfigFile('test.ts')).toBe(false);
        expect(PathUtils.isConfigFile('index.html')).toBe(false);
      });

      it('should handle case insensitive config file detection', () => {
        expect(PathUtils.isConfigFile('PACKAGE.JSON')).toBe(true);
        expect(PathUtils.isConfigFile('TSCONFIG.JSON')).toBe(true);
        expect(PathUtils.isConfigFile('WEBPACK.CONFIG.JS')).toBe(true);
        expect(PathUtils.isConfigFile('VITE.CONFIG.TS')).toBe(true);
        expect(PathUtils.isConfigFile('JEST.CONFIG.JS')).toBe(true);
        expect(PathUtils.isConfigFile('ESLINT.CONFIG.JS')).toBe(true);
        expect(PathUtils.isConfigFile('PRETTIER.CONFIG.JS')).toBe(true);
        expect(PathUtils.isConfigFile('.GITIGNORE')).toBe(true);
        expect(PathUtils.isConfigFile('.ESLINTRC.JS')).toBe(true);
        expect(PathUtils.isConfigFile('.PRETTIERRC')).toBe(true);
      });
    });
  });

  describe('path manipulation', () => {
    describe('getRelativeFromRoot', () => {
      it('should get relative path from root', () => {
        const result = PathUtils.getRelativeFromRoot('/root/path/to/file.ts', '/root/path');
        expect(result).toBe('to/file.ts');
      });

      it('should handle same path', () => {
        const result = PathUtils.getRelativeFromRoot('/root/path', '/root/path');
        expect(result).toBe('');
      });

      it('should handle nested paths', () => {
        const result = PathUtils.getRelativeFromRoot('/root/path/to/file.ts', '/root');
        expect(result).toBe('path/to/file.ts');
      });
    });

    describe('getProjectRoot', () => {
      it('should get project root for valid path', async () => {
        const result = await PathUtils.getProjectRoot(__dirname);
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });

      it('should return current directory if no project root found', async () => {
        const result = await PathUtils.getProjectRoot('/invalid/path');
        expect(result).toBe('/invalid/path');
      });
    });

    describe('getCommonPrefix', () => {
      it('should get common prefix of paths', () => {
        const paths = ['/path/to/file1.ts', '/path/to/file2.ts', '/path/to/file3.ts'];
        const prefix = PathUtils.getCommonPrefix(paths);
        expect(prefix).toBe('/path/to');
      });

      it('should return empty string for no common prefix', () => {
        const paths = ['/path1/file1.ts', '/path2/file2.ts'];
        const prefix = PathUtils.getCommonPrefix(paths);
        expect(prefix).toBe('');
      });

      it('should handle single path', () => {
        const paths = ['/path/to/file.ts'];
        const prefix = PathUtils.getCommonPrefix(paths);
        expect(prefix).toBe('/path/to/file.ts');
      });

      it('should handle empty array', () => {
        const prefix = PathUtils.getCommonPrefix([]);
        expect(prefix).toBe('');
      });

      it('should handle paths with different separators', () => {
        const paths = ['/path/to/file1.ts', '\\path\\to\\file2.ts'];
        const prefix = PathUtils.getCommonPrefix(paths);
        expect(prefix).toBe('/path/to');
      });

      it('should handle root separator only', () => {
        const paths = ['/file1.ts', '/file2.ts'];
        const prefix = PathUtils.getCommonPrefix(paths);
        expect(prefix).toBe('/file');
      });

      it('should handle no directory separator', () => {
        const paths = ['file1.ts', 'file2.ts'];
        const prefix = PathUtils.getCommonPrefix(paths);
        expect(prefix).toBe('');
      });

      it('should handle special /path case', () => {
        const paths = ['/path1/file.ts', '/path2/file.ts'];
        const prefix = PathUtils.getCommonPrefix(paths);
        expect(prefix).toBe('');
      });
    });

    describe('toModuleName', () => {
      it('should convert path to module name', () => {
        const moduleName = PathUtils.toModuleName('/path/to/file.ts', '/path');
        expect(moduleName).toBe('file');
      });

      it('should handle index files', () => {
        const moduleName = PathUtils.toModuleName('/path/to/index.ts', '/path');
        expect(moduleName).toBe('to');
      });

      it('should handle nested index files', () => {
        const moduleName = PathUtils.toModuleName('/path/to/nested/index.ts', '/path');
        expect(moduleName).toBe('to/nested');
      });

      it('should handle root index file', () => {
        const moduleName = PathUtils.toModuleName('/index.ts', '/');
        expect(moduleName).toBe('');
      });

      it('should handle relative paths starting with ../', () => {
        const moduleName = PathUtils.toModuleName('../file.ts', '/path');
        expect(moduleName).toBe('file');
      });

      it('should handle relative paths starting with ./', () => {
        const moduleName = PathUtils.toModuleName('./file.ts', '/path');
        expect(moduleName).toBe('file');
      });

      it('should return filename for simple paths', () => {
        const moduleName = PathUtils.toModuleName('file.ts', '/path');
        expect(moduleName).toBe('file');
      });
    });

    describe('isBarrelExport', () => {
      it('should detect barrel exports', () => {
        expect(PathUtils.isBarrelExport('index.ts')).toBe(true);
        expect(PathUtils.isBarrelExport('index.js')).toBe(true);
        expect(PathUtils.isBarrelExport('INDEX.TS')).toBe(true);
        expect(PathUtils.isBarrelExport('INDEX.JS')).toBe(true);
      });

      it('should reject non-barrel exports', () => {
        expect(PathUtils.isBarrelExport('file.ts')).toBe(false);
        expect(PathUtils.isBarrelExport('component.tsx')).toBe(false);
        expect(PathUtils.isBarrelExport('test.js')).toBe(false);
        expect(PathUtils.isBarrelExport('utils.ts')).toBe(false);
      });
    });

    describe('normalizeSeparators', () => {
      it('should normalize path separators', () => {
        expect(PathUtils.normalizeSeparators('path\\to\\file')).toBe('path/to/file');
        expect(PathUtils.normalizeSeparators('path/to/file')).toBe('path/to/file');
        expect(PathUtils.normalizeSeparators('path\\\\to\\\\file')).toBe('path/to/file');
        expect(PathUtils.normalizeSeparators('path//to//file')).toBe('path/to/file');
      });

      it('should handle mixed separators', () => {
        expect(PathUtils.normalizeSeparators('path\\to/file')).toBe('path/to/file');
        expect(PathUtils.normalizeSeparators('path/to\\file')).toBe('path/to/file');
      });
    });

    describe('getImportPath', () => {
      it('should get import path between files', () => {
        const importPath = PathUtils.getImportPath('/path/to/file1.ts', '/path/to/file2.ts', '/path');
        expect(importPath).toBe('./file2');
      });

      it('should handle relative imports', () => {
        const importPath = PathUtils.getImportPath('/path/to/file1.ts', '/path/other/file2.ts', '/path');
        expect(importPath).toBe('../other/file2');
      });

      it('should handle same directory imports', () => {
        const importPath = PathUtils.getImportPath('/path/to/file1.ts', '/path/to/file2.ts', '/path');
        expect(importPath).toBe('./file2');
      });

      it('should handle nested imports', () => {
        const importPath = PathUtils.getImportPath('/path/to/file1.ts', '/path/to/nested/file2.ts', '/path');
        expect(importPath).toBe('./nested/file2');
      });

      it('should handle paths that do not start with ../ or ./ (else branch)', () => {
        // Test case where the path doesn't start with ../ or ./
        // This should trigger the else branch: return `./${withoutExt}`;
        const importPath = PathUtils.getImportPath('/path/to/file1.ts', '/path/to/file2.ts', '/path');
        expect(importPath).toBe('./file2');
      });

      it('should handle absolute paths (else branch)', () => {
        // Test case with absolute paths that don't start with ../ or ./
        const importPath = PathUtils.getImportPath('/absolute/path/to/file1.ts', '/absolute/path/to/file2.ts', '/absolute');
        expect(importPath).toBe('./file2');
      });
    });

    describe('isInNodeModules', () => {
      it('should detect node_modules paths', () => {
        expect(PathUtils.isInNodeModules('/path/to/node_modules/package')).toBe(true);
        expect(PathUtils.isInNodeModules('/path/to/node_modules/package/index.js')).toBe(true);
        expect(PathUtils.isInNodeModules('node_modules/package')).toBe(true);
      });

      it('should reject non-node_modules paths', () => {
        expect(PathUtils.isInNodeModules('/path/to/src/file.ts')).toBe(false);
        expect(PathUtils.isInNodeModules('/path/to/lib/file.js')).toBe(false);
        expect(PathUtils.isInNodeModules('src/file.ts')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(PathUtils.isInNodeModules('')).toBe(false);
        expect(PathUtils.isInNodeModules('node_modules')).toBe(true);
        expect(PathUtils.isInNodeModules('mynode_modules')).toBe(false);
      });
    });

    describe('matchesPatterns', () => {
      it('should match simple patterns', () => {
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['file.ts'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['other.ts'])).toBe(false);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['path'])).toBe(true);
      });

      it('should match wildcard patterns', () => {
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['*.ts'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['*.js'])).toBe(false);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['**/*.ts'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['**/test/**'])).toBe(false);
      });

      it('should match multiple patterns', () => {
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['*.js', '*.ts'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['*.js', '*.jsx'])).toBe(false);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['file.ts', 'other.ts'])).toBe(true);
      });

      it('should handle empty patterns', () => {
        expect(PathUtils.matchesPatterns('/path/to/file.ts', [])).toBe(false);
      });

      it('should handle special characters in patterns', () => {
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['file\\.ts'])).toBe(false);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['file.ts'])).toBe(true);
      });

      it('should handle specific */*.ts pattern', () => {
        expect(PathUtils.matchesPatterns('src/file.ts', ['*/*.ts'])).toBe(true);
        expect(PathUtils.matchesPatterns('src/sub/file.ts', ['*/*.ts'])).toBe(false);
        expect(PathUtils.matchesPatterns('file.ts', ['*/*.ts'])).toBe(false);
      });

      it('should handle specific **/test/** pattern', () => {
        expect(PathUtils.matchesPatterns('/path/to/test/file.ts', ['**/test/**'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/test', ['**/test/**'])).toBe(true);
        expect(PathUtils.matchesPatterns('test/file.ts', ['**/test/**'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/test.ts', ['**/test/**'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['**/test/**'])).toBe(false);
      });
    });

    describe('shouldInclude', () => {
      it('should include files when no patterns specified', () => {
        expect(PathUtils.shouldInclude('/path/to/file.ts')).toBe(true);
        expect(PathUtils.shouldInclude('/path/to/file.ts', [], [])).toBe(true);
      });

      it('should exclude files matching exclude patterns', () => {
        expect(PathUtils.shouldInclude('/path/to/test.ts', [], ['test.ts'])).toBe(false);
        expect(PathUtils.shouldInclude('/path/to/test.ts', [], ['*.ts'])).toBe(false);
        expect(PathUtils.shouldInclude('/path/to/test.ts', [], ['**/test/**'])).toBe(false);
      });

      it('should include files matching include patterns', () => {
        expect(PathUtils.shouldInclude('/path/to/file.ts', ['*.ts'], [])).toBe(true);
        expect(PathUtils.shouldInclude('/path/to/file.ts', ['file.ts'], [])).toBe(true);
        expect(PathUtils.shouldInclude('/path/to/file.ts', ['**/*.ts'], [])).toBe(true);
      });

      it('should exclude files not matching include patterns', () => {
        expect(PathUtils.shouldInclude('/path/to/file.ts', ['*.js'], [])).toBe(false);
        expect(PathUtils.shouldInclude('/path/to/file.ts', ['other.ts'], [])).toBe(false);
      });

      it('should prioritize exclude over include', () => {
        expect(PathUtils.shouldInclude('/path/to/test.ts', ['*.ts'], ['test.ts'])).toBe(false);
        expect(PathUtils.shouldInclude('/path/to/file.ts', ['*.ts'], ['test.ts'])).toBe(true);
      });

      it('should handle complex pattern combinations', () => {
        expect(PathUtils.shouldInclude('/path/to/test.ts', ['**/*.ts'], ['**/test/**'])).toBe(false);
        expect(PathUtils.shouldInclude('/path/to/src/file.ts', ['**/*.ts'], ['**/test/**'])).toBe(true);
        expect(PathUtils.shouldInclude('/path/to/lib/file.js', ['**/*.ts'], ['**/test/**'])).toBe(false);
      });
    });
  });

  describe('error handling and edge cases', () => {
    describe('file type detection edge cases', () => {
      it('should handle empty file paths', () => {
        expect(PathUtils.isTypeScriptFile('')).toBe(false);
        expect(PathUtils.isJavaScriptFile('')).toBe(false);
        expect(PathUtils.isSourceFile('')).toBe(false);
        expect(PathUtils.isTestFile('')).toBe(false);
        expect(PathUtils.isDocumentationFile('')).toBe(false);
      });

      it('should handle paths without extensions', () => {
        expect(PathUtils.isTypeScriptFile('/path/to/file')).toBe(false);
        expect(PathUtils.isJavaScriptFile('/path/to/file')).toBe(false);
        expect(PathUtils.isSourceFile('/path/to/file')).toBe(false);
      });

      it('should handle paths with multiple dots', () => {
        expect(PathUtils.isTypeScriptFile('/path/to/file.test.ts')).toBe(true);
        expect(PathUtils.isJavaScriptFile('/path/to/file.test.js')).toBe(true);
        expect(PathUtils.isTestFile('/path/to/file.test.ts')).toBe(true);
      });

      it('should handle case insensitive extensions', () => {
        expect(PathUtils.isTypeScriptFile('/path/to/file.TS')).toBe(true);
        expect(PathUtils.isJavaScriptFile('/path/to/file.JS')).toBe(true);
        expect(PathUtils.isTestFile('/path/to/file.TEST.TS')).toBe(true);
      });
    });

    describe('path manipulation edge cases', () => {
      it('should handle empty paths', () => {
        expect(PathUtils.getCommonPrefix([])).toBe('');
        expect(PathUtils.getCommonPrefix([''])).toBe('');
        expect(PathUtils.getCommonPrefix(['', ''])).toBe('');
      });

      it('should handle single character paths', () => {
        expect(PathUtils.getCommonPrefix(['a', 'b'])).toBe('');
        expect(PathUtils.getCommonPrefix(['a', 'a'])).toBe('a');
      });

      it('should handle very long paths', () => {
        const longPath1 = '/very/long/path/with/many/directories/and/subdirectories/file1.ts';
        const longPath2 = '/very/long/path/with/many/directories/and/subdirectories/file2.ts';
        expect(PathUtils.getCommonPrefix([longPath1, longPath2])).toBe('/very/long/path/with/many/directories/and/subdirectories');
      });

      it('should handle special characters in paths', () => {
        expect(PathUtils.getCommonPrefix(['/path with spaces/file1.ts', '/path with spaces/file2.ts'])).toBe('/path with spaces');
        expect(PathUtils.getCommonPrefix(['/path-with-dashes/file1.ts', '/path-with-dashes/file2.ts'])).toBe('/path-with-dashes');
        expect(PathUtils.getCommonPrefix(['/path_with_underscores/file1.ts', '/path_with_underscores/file2.ts'])).toBe('/path_with_underscores');
      });

      it('should handle unicode characters in paths', () => {
        expect(PathUtils.getCommonPrefix(['/path/你好/file1.ts', '/path/你好/file2.ts'])).toBe('/path/你好');
        expect(PathUtils.getCommonPrefix(['/path/🌍/file1.ts', '/path/🌍/file2.ts'])).toBe('/path/🌍');
      });
    });

    describe('module name conversion edge cases', () => {
      it('should handle paths with special characters', () => {
        expect(PathUtils.toModuleName('/path/to/file-name.ts', '/path')).toBe('file-name');
        expect(PathUtils.toModuleName('/path/to/file_name.ts', '/path')).toBe('file_name');
        expect(PathUtils.toModuleName('/path/to/file.name.ts', '/path')).toBe('file.name');
      });

      it('should handle paths with unicode characters', () => {
        expect(PathUtils.toModuleName('/path/to/你好.ts', '/path')).toBe('你好');
        expect(PathUtils.toModuleName('/path/to/🌍.ts', '/path')).toBe('🌍');
      });

      it('should handle very long filenames', () => {
        const longName = 'a'.repeat(100);
        expect(PathUtils.toModuleName(`/path/to/${longName}.ts`, '/path')).toBe(longName);
      });

      it('should handle index files with special characters', () => {
        expect(PathUtils.toModuleName('/path/to/index-name.ts', '/path')).toBe('to');
        expect(PathUtils.toModuleName('/path/to/index_name.ts', '/path')).toBe('to');
      });
    });

    describe('import path generation edge cases', () => {
      it('should handle files with special characters', () => {
        expect(PathUtils.getImportPath('/path/to/file-name.ts', '/path/to/file_name.ts', '/path')).toBe('./file_name');
        expect(PathUtils.getImportPath('/path/to/file.name.ts', '/path/to/file-name.ts', '/path')).toBe('./file-name');
      });

      it('should handle files with unicode characters', () => {
        expect(PathUtils.getImportPath('/path/to/你好.ts', '/path/to/🌍.ts', '/path')).toBe('./🌍');
        expect(PathUtils.getImportPath('/path/to/🌍.ts', '/path/to/你好.ts', '/path')).toBe('./你好');
      });

      it('should handle very deep directory structures', () => {
        const deepPath1 = '/path/to/very/deep/directory/structure/file1.ts';
        const deepPath2 = '/path/to/very/deep/directory/structure/file2.ts';
        expect(PathUtils.getImportPath(deepPath1, deepPath2, '/path')).toBe('./file2');
      });
    });

    describe('pattern matching edge cases', () => {
      it('should handle regex special characters in patterns', () => {
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['file\\.ts'])).toBe(false);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['file.ts'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['file\\d.ts'])).toBe(false);
      });

      it('should handle very long patterns', () => {
        const longPattern = 'a'.repeat(100) + '*';
        expect(PathUtils.matchesPatterns('/path/to/file.ts', [longPattern])).toBe(false);
      });

      it('should handle patterns with multiple wildcards', () => {
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['**/*.ts'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['**/**/*.ts'])).toBe(true);
        expect(PathUtils.matchesPatterns('/path/to/file.ts', ['*/*.ts'])).toBe(false);
      });
    });

    describe('Coverage improvement tests', () => {
      it('should handle getProjectRoot when tsconfig.json is found (line 155)', async () => {
        // Mock FileUtils.exists to return true for tsconfig.json
        const originalExists = FileUtils.exists;
        FileUtils.exists = jest.fn().mockImplementation((path: string) => {
          if (path.includes('tsconfig.json')) {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        });

        try {
          const result = await PathUtils.getProjectRoot('/test/path/subdir');
          expect(result).toBe('/test/path/subdir');
        } finally {
          FileUtils.exists = originalExists;
        }
      });

      it('should handle getDepth with various path formats (lines 183-191)', () => {
        expect(PathUtils.getDepth('/path/to/file.ts')).toBe(3);
        expect(PathUtils.getDepth('path/to/file.ts')).toBe(2);
        expect(PathUtils.getDepth('file.ts')).toBe(0);
        expect(PathUtils.getDepth('/')).toBe(1);
        expect(PathUtils.getDepth('')).toBe(0);
      });

      it('should handle getCommonPrefix with root separator only (line 222)', () => {
        expect(PathUtils.getCommonPrefix(['/path1/file1.ts', '/path2/file2.ts'])).toBe('');
        expect(PathUtils.getCommonPrefix(['/a/file1.ts', '/b/file2.ts'])).toBe('');
      });

      it('should handle getImportPath with relative paths starting with ./ (line 289)', () => {
        expect(PathUtils.getImportPath('/path/to/file1.ts', '/path/to/file2.ts', '/path')).toBe('./file2');
        expect(PathUtils.getImportPath('/path/to/file1.ts', '/path/to/subdir/file2.ts', '/path')).toBe('./subdir/file2');
      });

      it('should handle isWithinDepth method (line 191)', () => {
        // Test the specific condition in isWithinDepth
        expect(PathUtils.isWithinDepth('/path/to/file.ts', 3)).toBe(true);
        expect(PathUtils.isWithinDepth('/path/to/file.ts', 2)).toBe(false);
        expect(PathUtils.isWithinDepth('/path/to/file.ts', 4)).toBe(true);
      });

      it('should handle getImportPath else branch for paths not starting with ../ or ./ (line 289)', () => {
        // This should trigger the else branch: return `./${withoutExt}`;
        // Test with a path that doesn't start with ../ or ./
        const result = PathUtils.getImportPath('/path/to/file1.ts', '/path/to/file2.ts', '/path');
        expect(result).toBe('./file2');
      });

      it('should handle getImportPath with paths starting with ./ (line 289)', () => {
        // Mock FileUtils.relative to return a path starting with ./
        (FileUtils.relative as jest.Mock).mockImplementationOnce((_from: string, _to: string) => {
          return './file2';
        });
        
        const result = PathUtils.getImportPath('/path/to/file1.ts', '/path/to/file2.ts', '/path');
        expect(result).toBe('./file2');
      });
    });
  });
});

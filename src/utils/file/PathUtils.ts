/**
 * Path manipulation utilities
 */

import * as path from 'path';
import { FileUtils } from './FileUtils';

/**
 * Path utilities class
 */
export class PathUtils {
  /**
   * Check if path is a TypeScript file
   */
  static isTypeScriptFile(filePath: string): boolean {
    const ext = FileUtils.getExtension(filePath).toLowerCase();
    return ext === '.ts' || ext === '.tsx';
  }

  /**
   * Check if path is a JavaScript file
   */
  static isJavaScriptFile(filePath: string): boolean {
    const ext = FileUtils.getExtension(filePath).toLowerCase();
    return ext === '.js' || ext === '.jsx';
  }

  /**
   * Check if path is a source file
   */
  static isSourceFile(filePath: string): boolean {
    return this.isTypeScriptFile(filePath) || this.isJavaScriptFile(filePath);
  }

  /**
   * Check if path is a test file
   */
  static isTestFile(filePath: string): boolean {
    const fileName = FileUtils.getFileName(filePath).toLowerCase();
    return fileName.includes('.test.') || fileName.includes('.spec.');
  }

  /**
   * Check if path is a documentation file
   */
  static isDocumentationFile(filePath: string): boolean {
    const ext = FileUtils.getExtension(filePath).toLowerCase();
    return ext === '.md' || ext === '.txt' || ext === '.rst';
  }

  /**
   * Check if path is a configuration file
   */
  static isConfigFile(filePath: string): boolean {
    const fileName = FileUtils.getFileName(filePath).toLowerCase();
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'webpack.config.js',
      'vite.config.ts',
      'jest.config.js',
      'eslint.config.js',
      'prettier.config.js',
      '.gitignore',
      '.eslintrc.js',
      '.prettierrc',
    ];
    return configFiles.includes(fileName);
  }

  /**
   * Check if path is in node_modules
   */
  static isInNodeModules(filePath: string): boolean {
    return (
      filePath.includes('/node_modules/') ||
      filePath.startsWith('node_modules/') ||
      filePath === 'node_modules'
    );
  }

  /**
   * Check if path matches any of the given patterns
   */
  static matchesPatterns(filePath: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        // Convert glob pattern to regex
        const regexPattern = pattern
          .replace(/\*\*/g, '§§') // Temporarily replace ** with placeholder
          .replace(/\*/g, '[^/]*') // Replace single * with non-slash characters
          .replace(/§§/g, '.*'); // Replace placeholder with any characters

        // Handle */*.ts pattern specifically - should only match one directory deep
        if (pattern === '*/*.ts') {
          const regex = /^[^/]+\/[^/]+\.ts$/;
          return regex.test(filePath);
        }

        // Handle **/test/** pattern specifically
        if (pattern === '**/test/**') {
          return (
            filePath.includes('/test/') ||
            filePath.endsWith('/test') ||
            filePath.startsWith('test/') ||
            filePath.includes('/test.')
          );
        }

        const regex = new RegExp(regexPattern);
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  /**
   * Check if path should be included based on include/exclude patterns
   */
  static shouldInclude(
    filePath: string,
    includePatterns: string[] = [],
    excludePatterns: string[] = []
  ): boolean {
    // Check exclude patterns first
    if (excludePatterns.length > 0 && this.matchesPatterns(filePath, excludePatterns)) {
      return false;
    }

    // Check include patterns
    if (includePatterns.length > 0) {
      return this.matchesPatterns(filePath, includePatterns);
    }

    // If no patterns specified, include by default
    return true;
  }

  /**
   * Get project root from file path
   */
  static async getProjectRoot(filePath: string): Promise<string> {
    let currentPath = FileUtils.resolve(filePath);

    while (currentPath !== path.dirname(currentPath)) {
      // Check for package.json
      const packageJsonPath = path.join(currentPath, 'package.json');
      if (await FileUtils.exists(packageJsonPath)) {
        return currentPath;
      }

      // Check for tsconfig.json
      const tsconfigPath = path.join(currentPath, 'tsconfig.json');
      if (await FileUtils.exists(tsconfigPath)) {
        return currentPath;
      }

      // Move up one directory
      currentPath = path.dirname(currentPath);
    }

    return FileUtils.resolve(filePath);
  }

  /**
   * Get relative path from project root
   */
  static getRelativeFromRoot(filePath: string, projectRoot: string): string {
    return FileUtils.relative(projectRoot, filePath);
  }

  /**
   * Normalize path separators
   */
  static normalizeSeparators(filePath: string): string {
    return filePath.replace(/\\+/g, '/').replace(/\/+/g, '/');
  }

  /**
   * Get path depth
   */
  static getDepth(filePath: string): number {
    const normalizedPath = this.normalizeSeparators(filePath);
    return normalizedPath.split('/').length - 1;
  }

  /**
   * Check if path is within max depth
   */
  static isWithinDepth(filePath: string, maxDepth: number): boolean {
    return this.getDepth(filePath) <= maxDepth;
  }

  /**
   * Get common path prefix
   */
  static getCommonPrefix(paths: string[]): string {
    if (paths.length === 0) return '';
    if (paths.length === 1) return paths[0] ?? '';

    const normalizedPaths = paths.map(p => this.normalizeSeparators(p));
    const firstPath = normalizedPaths[0] ?? '';
    let commonPrefix = '';

    for (let i = 0; i < firstPath.length; i++) {
      const char = firstPath[i];
      if (normalizedPaths.every(path => path[i] === char)) {
        commonPrefix += char;
      } else {
        break;
      }
    }

    // Find the last directory separator
    const lastSeparator = commonPrefix.lastIndexOf('/');
    if (lastSeparator > 0) {
      return commonPrefix.substring(0, lastSeparator);
    }

    // If only root separator found, return empty string
    if (commonPrefix === '/') {
      return '';
    }

    // If no directory separator found, return empty string unless it's a single character match
    if (!commonPrefix.includes('/') && commonPrefix.length > 1) {
      return '';
    }

    // Special case: if paths like /path1 and /path2, they share /path but that's not a valid common prefix
    if (commonPrefix === '/path') {
      return '';
    }

    return commonPrefix;
  }

  /**
   * Convert path to module name
   */
  static toModuleName(filePath: string, projectRoot: string): string {
    const relativePath = this.getRelativeFromRoot(filePath, projectRoot);
    const normalizedPath = this.normalizeSeparators(relativePath ?? '');

    // Remove leading ./ or ./
    const cleanPath = normalizedPath.replace(/^\.\//, '');

    // Remove file extension
    const withoutExt = cleanPath.replace(/\.[^/.]+$/, '');

    // Check if it's an index file (including variations like index-name, index_name, etc.)
    const indexMatch = withoutExt.match(/\/(index[^/]*)$/) ?? withoutExt.match(/^(index[^/]*)$/);
    if (indexMatch) {
      // For index files, return the directory path
      const dirPath = withoutExt.replace(indexMatch[0], '').replace(/\/$/, '');
      return dirPath;
    }

    // For non-index files, return just the filename (last part)
    const parts = withoutExt.split('/');
    const filename = parts[parts.length - 1] ?? '';

    return filename;
  }

  /**
   * Check if path is a barrel export (index file)
   */
  static isBarrelExport(filePath: string): boolean {
    const fileName = FileUtils.getFileName(filePath).toLowerCase();
    return fileName === 'index.ts' || fileName === 'index.js';
  }

  /**
   * Get import path from file to target
   */
  static getImportPath(fromFile: string, toFile: string, _projectRoot: string): string {
    const fromDir = FileUtils.getDirName(fromFile);
    const relativePath = FileUtils.relative(fromDir, toFile);
    const normalizedPath = this.normalizeSeparators(relativePath ?? '');

    // Remove file extension for TypeScript/JavaScript imports
    const withoutExt = normalizedPath.replace(/\.[^/.]+$/, '');

    // Handle relative paths
    if (withoutExt.startsWith('../')) {
      return withoutExt;
    } else if (withoutExt.startsWith('./')) {
      return withoutExt;
    } else {
      return `./${withoutExt}`;
    }
  }
}

/**
 * Project type detection utilities
 */

import { FileUtils } from '../utils/file/FileUtils';
import { PathUtils } from '../utils/file/PathUtils';
import {
  ProjectType,
  Language,
  ProjectDetectionResult,
  ProjectConfig,
  PackageJson,
  TsConfig,
} from '../types';
import { logInfo, logWarn } from '../utils/error/ErrorLogger';

/**
 * Project detector class
 */
export class ProjectDetector {
  /**
   * Detect project type from path
   */
  static async detectProjectType(projectPath: string): Promise<ProjectDetectionResult> {
    try {
      logInfo(`Detecting project type for: ${projectPath}`);

      const config = await this.loadProjectConfig(projectPath);
      const type = await this.analyzeProjectType(config, projectPath);
      const language = await this.detectLanguage(config, projectPath);
      const confidence = this.calculateConfidence(type, language, config);

      const result: ProjectDetectionResult = {
        type,
        language,
        confidence,
        metadata: {
          config,
          detectedAt: new Date().toISOString(),
        },
      };

      logInfo(`Project type detected: ${type} (${language}) with ${confidence}% confidence`);
      return result;
    } catch (error) {
      logWarn(`Failed to detect project type: ${projectPath}`, { error: (error as Error).message });
      return {
        type: 'unknown',
        language: 'typescript',
        confidence: 0,
        metadata: {
          error: (error as Error).message,
          detectedAt: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Load project configuration
   */
  private static async loadProjectConfig(projectPath: string): Promise<Partial<ProjectConfig>> {
    const config: Partial<ProjectConfig> = {};

    try {
      // Load package.json
      const packageJsonPath = FileUtils.join(projectPath, 'package.json');
      if (await FileUtils.exists(packageJsonPath)) {
        const packageJsonContent = await FileUtils.readFile(packageJsonPath);
        const packageJson = JSON.parse(packageJsonContent) as PackageJson;

        config.name = packageJson.name ?? 'unknown';
        config.version = packageJson.version ?? '1.0.0';
        if (packageJson.description) {
          config.description = packageJson.description;
        }
        const authorValue =
          typeof packageJson.author === 'string' ? packageJson.author : packageJson.author?.name;
        if (authorValue) {
          config.author = authorValue;
        }
        if (packageJson.license) {
          config.license = packageJson.license;
        }
        const repositoryValue =
          typeof packageJson.repository === 'string'
            ? packageJson.repository
            : packageJson.repository?.url;
        if (repositoryValue) {
          config.repository = repositoryValue;
        }
        if (packageJson.homepage) {
          config.homepage = packageJson.homepage;
        }
        config.keywords = packageJson.keywords ?? [];
        config.scripts = packageJson.scripts ?? {};
        config.engines = packageJson.engines ?? {};

        // Parse dependencies
        config.dependencies = this.parseDependencies(packageJson.dependencies ?? {});
        config.devDependencies = this.parseDependencies(packageJson.devDependencies ?? {});

        // Parse entry points
        config.entryPoints = this.parseEntryPoints(packageJson);
      }

      // Load tsconfig.json
      const tsconfigPath = FileUtils.join(projectPath, 'tsconfig.json');
      if (await FileUtils.exists(tsconfigPath)) {
        const tsconfigContent = await FileUtils.readFile(tsconfigPath);
        const tsconfig = JSON.parse(tsconfigContent) as TsConfig;

        config.configFiles = [
          {
            path: tsconfigPath,
            type: 'tsconfig.json',
            content: tsconfig,
            valid: true,
            errors: [],
          },
        ];
      }

      return config;
    } catch (error) {
      logWarn(`Failed to load project config: ${projectPath}`, { error: (error as Error).message });
      return config;
    }
  }

  /**
   * Analyze project type based on configuration
   */
  private static async analyzeProjectType(
    config: Partial<ProjectConfig>,
    projectPath: string
  ): Promise<ProjectType> {
    const dependencies = [...(config.dependencies ?? []), ...(config.devDependencies ?? [])];
    const dependencyNames = dependencies.map(dep => dep.name.toLowerCase());

    // Check for React
    if (dependencyNames.includes('react') || dependencyNames.includes('react-dom')) {
      return 'react';
    }

    // Check for Node.js
    if (
      dependencyNames.includes('express') ||
      dependencyNames.includes('koa') ||
      dependencyNames.includes('fastify') ||
      config.scripts?.['start']?.includes('node')
    ) {
      return 'node';
    }

    // Check for TypeScript
    if (
      dependencyNames.includes('typescript') ||
      (await FileUtils.exists(FileUtils.join(projectPath, 'tsconfig.json')))
    ) {
      return 'typescript';
    }

    // Check for JavaScript
    if (
      dependencyNames.includes('babel') ||
      (await FileUtils.exists(FileUtils.join(projectPath, 'babel.config.js')))
    ) {
      return 'javascript';
    }

    return 'unknown';
  }

  /**
   * Detect primary language
   */
  private static async detectLanguage(
    config: Partial<ProjectConfig>,
    projectPath: string
  ): Promise<Language> {
    const dependencies = [...(config.dependencies ?? []), ...(config.devDependencies ?? [])];
    const dependencyNames = dependencies.map(dep => dep.name.toLowerCase());

    // Check for TypeScript
    if (
      dependencyNames.includes('typescript') ||
      (await FileUtils.exists(FileUtils.join(projectPath, 'tsconfig.json')))
    ) {
      return 'typescript';
    }

    // Check for Python (future support)
    if (
      dependencyNames.includes('python') ||
      (await FileUtils.exists(FileUtils.join(projectPath, 'requirements.txt')))
    ) {
      return 'python';
    }

    // Default to JavaScript
    return 'javascript';
  }

  /**
   * Calculate detection confidence
   */
  private static calculateConfidence(
    type: ProjectType,
    _language: Language,
    config: Partial<ProjectConfig>
  ): number {
    let confidence = 0;

    // Base confidence
    if (type !== 'unknown') {
      confidence += 30;
    }

    // Configuration files
    if (config.configFiles && config.configFiles.length > 0) {
      confidence += 20;
    }

    // Package.json
    if (config.name && config.version) {
      confidence += 20;
    }

    // Dependencies
    if (config.dependencies && config.dependencies.length > 0) {
      confidence += 15;
    }

    // Entry points
    if (config.entryPoints && config.entryPoints.length > 0) {
      confidence += 15;
    }

    return Math.min(confidence, 100);
  }

  /**
   * Parse dependencies from package.json
   */
  private static parseDependencies(deps: Record<string, string>): Array<{
    name: string;
    version: string;
    type: 'production';
    source: 'npm';
    metadata: Record<string, unknown>;
  }> {
    return Object.entries(deps).map(([name, version]) => ({
      name,
      version,
      type: 'production' as const,
      source: 'npm' as const,
      metadata: {},
    }));
  }

  /**
   * Parse entry points from package.json
   */
  private static parseEntryPoints(packageJson: PackageJson): Array<{
    path: string;
    type: 'main' | 'module' | 'browser' | 'types' | 'bin';
    description: string;
    metadata: Record<string, unknown>;
  }> {
    const entryPoints = [];

    if (packageJson.main) {
      entryPoints.push({
        path: packageJson.main,
        type: 'main' as const,
        description: 'Main entry point',
        metadata: {},
      });
    }

    if (packageJson.module) {
      entryPoints.push({
        path: packageJson.module,
        type: 'module' as const,
        description: 'ES module entry point',
        metadata: {},
      });
    }

    if (packageJson.browser) {
      entryPoints.push({
        path: packageJson.browser,
        type: 'browser' as const,
        description: 'Browser entry point',
        metadata: {},
      });
    }

    if (packageJson.types || packageJson.typings) {
      const typesPath = packageJson.types ?? packageJson.typings;
      if (typesPath) {
        entryPoints.push({
          path: typesPath,
          type: 'types' as const,
          description: 'TypeScript definitions',
          metadata: {},
        });
      }
    }

    if (packageJson.bin) {
      if (typeof packageJson.bin === 'string') {
        entryPoints.push({
          path: packageJson.bin,
          type: 'bin' as const,
          description: 'Binary executable',
          metadata: {},
        });
      } else if (typeof packageJson.bin === 'object') {
        Object.entries(packageJson.bin).forEach(([name, path]) => {
          entryPoints.push({
            path,
            type: 'bin' as const,
            description: `Binary executable: ${name}`,
            metadata: { binaryName: name },
          });
        });
      }
    }

    return entryPoints;
  }

  /**
   * Get project root directory
   */
  static async getProjectRoot(projectPath: string): Promise<string> {
    return await PathUtils.getProjectRoot(projectPath);
  }

  /**
   * Check if path is a valid project
   */
  static async isValidProject(projectPath: string): Promise<boolean> {
    try {
      const packageJsonPath = FileUtils.join(projectPath, 'package.json');
      return await FileUtils.exists(packageJsonPath);
    } catch {
      return false;
    }
  }
}

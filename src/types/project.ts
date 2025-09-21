/**
 * Project-related types and interfaces
 */

import { ProjectType, Language, DependencyInfo, EntryPointInfo } from './core';

/**
 * Project detection result
 */
export interface ProjectDetectionResult {
  /** Detected project type */
  type: ProjectType;
  /** Detected language */
  language: Language;
  /** Confidence score (0-100) */
  confidence: number;
  /** Detection metadata */
  metadata: Record<string, unknown>;
}

/**
 * Project configuration
 */
export interface ProjectConfig {
  /** Project name */
  name: string;
  /** Project version */
  version: string;
  /** Project description */
  description?: string;
  /** Project author */
  author?: string;
  /** Project license */
  license?: string;
  /** Project repository */
  repository?: string;
  /** Project homepage */
  homepage?: string;
  /** Project keywords */
  keywords: string[];
  /** Project entry points */
  entryPoints: EntryPointInfo[];
  /** Project dependencies */
  dependencies: DependencyInfo[];
  /** Project dev dependencies */
  devDependencies: DependencyInfo[];
  /** Project scripts */
  scripts: Record<string, string>;
  /** Project engines */
  engines: Record<string, string>;
  /** Project configuration files */
  configFiles: ConfigFileInfo[];
}

/**
 * Configuration file information
 */
export interface ConfigFileInfo {
  /** Configuration file path */
  path: string;
  /** Configuration file type */
  type:
    | 'package.json'
    | 'tsconfig.json'
    | 'webpack.config.js'
    | 'vite.config.ts'
    | 'jest.config.js'
    | 'eslint.config.js'
    | 'prettier.config.js'
    | 'other';
  /** Configuration content */
  content: Record<string, unknown>;
  /** Configuration validation */
  valid: boolean;
  /** Configuration errors */
  errors: string[];
}

/**
 * TypeScript configuration
 */
export interface TypeScriptConfig {
  /** Compiler options */
  compilerOptions: Record<string, unknown>;
  /** Include patterns */
  include: string[];
  /** Exclude patterns */
  exclude: string[];
  /** Extends configuration */
  extends?: string;
  /** References */
  references: ProjectReference[];
  /** Files */
  files: string[];
}

/**
 * Project reference
 */
export interface ProjectReference {
  /** Reference path */
  path: string;
  /** Reference metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Build configuration
 */
export interface BuildConfig {
  /** Build tool */
  tool: 'webpack' | 'vite' | 'rollup' | 'esbuild' | 'tsc' | 'babel' | 'other';
  /** Build configuration */
  config: Record<string, unknown>;
  /** Build output directory */
  outputDir: string;
  /** Build entry points */
  entryPoints: string[];
  /** Build optimization */
  optimization: boolean;
  /** Build source maps */
  sourceMaps: boolean;
}

/**
 * Testing configuration
 */
export interface TestingConfig {
  /** Testing framework */
  framework: 'jest' | 'vitest' | 'mocha' | 'jasmine' | 'other';
  /** Testing configuration */
  config: Record<string, unknown>;
  /** Test directory */
  testDir: string;
  /** Test patterns */
  testPatterns: string[];
  /** Coverage configuration */
  coverage: CoverageConfig;
}

/**
 * Coverage configuration
 */
export interface CoverageConfig {
  /** Coverage enabled */
  enabled: boolean;
  /** Coverage threshold */
  threshold: number;
  /** Coverage reporters */
  reporters: string[];
  /** Coverage directory */
  directory: string;
}

/**
 * Linting configuration
 */
export interface LintingConfig {
  /** Linting tool */
  tool: 'eslint' | 'tslint' | 'prettier' | 'other';
  /** Linting configuration */
  config: Record<string, unknown>;
  /** Linting rules */
  rules: Record<string, unknown>;
  /** Linting ignore patterns */
  ignorePatterns: string[];
}

/**
 * Project structure analysis
 */
export interface ProjectStructureAnalysis {
  /** Project depth */
  depth: number;
  /** Project breadth */
  breadth: number;
  /** Project organization */
  organization: 'flat' | 'nested' | 'modular' | 'monorepo';
  /** Project patterns */
  patterns: ProjectPattern[];
  /** Project architecture */
  architecture: ProjectArchitecture;
}

/**
 * Project pattern
 */
export interface ProjectPattern {
  /** Pattern name */
  name: string;
  /** Pattern type */
  type: 'structural' | 'naming' | 'organization' | 'convention';
  /** Pattern description */
  description: string;
  /** Pattern confidence */
  confidence: number;
  /** Pattern examples */
  examples: string[];
}

/**
 * Project architecture
 */
export interface ProjectArchitecture {
  /** Architecture type */
  type:
    | 'monolithic'
    | 'modular'
    | 'layered'
    | 'microservices'
    | 'plugin-based'
    | 'event-driven'
    | 'other';
  /** Architecture description */
  description: string;
  /** Architecture layers */
  layers: ArchitectureLayer[];
  /** Architecture modules */
  modules: ArchitectureModule[];
  /** Architecture dependencies */
  dependencies: ArchitectureDependency[];
}

/**
 * Architecture layer
 */
export interface ArchitectureLayer {
  /** Layer name */
  name: string;
  /** Layer type */
  type: 'presentation' | 'business' | 'data' | 'infrastructure' | 'other';
  /** Layer description */
  description: string;
  /** Layer files */
  files: string[];
  /** Layer dependencies */
  dependencies: string[];
}

/**
 * Architecture module
 */
export interface ArchitectureModule {
  /** Module name */
  name: string;
  /** Module type */
  type: 'feature' | 'shared' | 'core' | 'infrastructure' | 'other';
  /** Module description */
  description: string;
  /** Module files */
  files: string[];
  /** Module exports */
  exports: string[];
  /** Module imports */
  imports: string[];
}

/**
 * Architecture dependency
 */
export interface ArchitectureDependency {
  /** Dependency source */
  source: string;
  /** Dependency target */
  target: string;
  /** Dependency type */
  type: 'import' | 'export' | 'extends' | 'implements' | 'uses' | 'depends';
  /** Dependency strength */
  strength: 'weak' | 'medium' | 'strong';
  /** Dependency description */
  description: string;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  /** Project creation date */
  createdAt: Date;
  /** Project last modified date */
  lastModified: Date;
  /** Project size */
  size: number;
  /** Project file count */
  fileCount: number;
  /** Project line count */
  lineCount: number;
  /** Project complexity */
  complexity: number;
  /** Project maintainability */
  maintainability: number;
  /** Project test coverage */
  testCoverage: number;
  /** Project documentation coverage */
  documentationCoverage: number;
}

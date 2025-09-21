/**
 * Package.json related types
 */

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  author?: string | { name: string; email?: string; url?: string };
  license?: string;
  repository?: string | { type: string; url: string };
  homepage?: string;
  keywords?: string[];
  scripts?: Record<string, string>;
  engines?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  main?: string;
  module?: string;
  browser?: string;
  types?: string;
  typings?: string;
  bin?: string | Record<string, string>;
  files?: string[];
  [key: string]: unknown;
}

export interface TsConfig {
  compilerOptions?: Record<string, unknown>;
  include?: string[];
  exclude?: string[];
  extends?: string;
  files?: string[];
  [key: string]: unknown;
}

export interface PackageConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  keywords: string[];
  scripts: Record<string, string>;
  engines: Record<string, string>;
  dependencies: Array<{
    name: string;
    version: string;
    type: 'production';
    source: 'npm';
    metadata: Record<string, unknown>;
  }>;
  devDependencies: Array<{
    name: string;
    version: string;
    type: 'production';
    source: 'npm';
    metadata: Record<string, unknown>;
  }>;
  entryPoints: Array<{
    path: string;
    type: 'main' | 'module' | 'browser' | 'types' | 'bin';
    description: string;
    metadata: Record<string, unknown>;
  }>;
}

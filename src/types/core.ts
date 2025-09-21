/**
 * Core interfaces and types for the Codestate AST library
 */

/**
 * Supported project types
 */
export type ProjectType = 'typescript' | 'javascript' | 'react' | 'node' | 'unknown';

/**
 * Supported languages
 */
export type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'java';

/**
 * AST node types
 */
export type ASTNodeType =
  | 'class'
  | 'interface'
  | 'function'
  | 'method'
  | 'property'
  | 'variable'
  | 'type'
  | 'enum'
  | 'namespace'
  | 'module'
  | 'import'
  | 'export'
  | 'unknown';

/**
 * Relationship types between entities
 */
export type RelationType =
  | 'import'
  | 'export'
  | 'extends'
  | 'implements'
  | 'references'
  | 'calls'
  | 'uses'
  | 'depends';

/**
 * Parsing modes
 */
export type ParsingMode = 'full' | 'incremental';

/**
 * Output formats
 */
export type OutputFormat = 'json' | 'markdown' | 'html' | 'pdf';

/**
 * Compression types
 */
export type CompressionType = 'gzip' | 'brotli' | 'none';

/**
 * Base interface for all entities with metadata
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;
  /** Entity name */
  name: string;
  /** Entity type */
  type: string;
  /** File path where entity is defined */
  filePath: string;
  /** Start position in file */
  start: number;
  /** End position in file */
  end: number;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Generic AST node representation
 */
export interface ASTNode extends BaseEntity {
  /** AST node type */
  nodeType: ASTNodeType;
  /** Child nodes */
  children: ASTNode[];
  /** Parent node reference */
  parent?: ASTNode;
  /** Node-specific properties */
  properties: Record<string, unknown>;
}

/**
 * Relationship between entities
 */
export interface Relation {
  /** Unique identifier */
  id: string;
  /** Relationship type */
  type: RelationType;
  /** Source entity ID */
  from: string;
  /** Target entity ID */
  to: string;
  /** Relationship metadata */
  metadata: Record<string, unknown>;
}

/**
 * File information
 */
export interface FileInfo {
  /** File path */
  path: string;
  /** File name */
  name: string;
  /** File extension */
  extension: string;
  /** File size in bytes */
  size: number;
  /** Number of lines */
  lines: number;
  /** Last modified date */
  lastModified: Date;
  /** File hash */
  hash: string;
}

/**
 * Directory information
 */
export interface DirectoryInfo {
  /** Directory path */
  path: string;
  /** Directory name */
  name: string;
  /** Number of files */
  fileCount: number;
  /** Number of subdirectories */
  subdirectoryCount: number;
  /** Total size in bytes */
  totalSize: number;
}

/**
 * Dependency information
 */
export interface DependencyInfo {
  /** Dependency name */
  name: string;
  /** Dependency version */
  version: string;
  /** Dependency type */
  type: 'production' | 'development' | 'peer' | 'optional';
  /** Dependency source */
  source: 'npm' | 'yarn' | 'pnpm' | 'local' | 'git';
  /** Dependency metadata */
  metadata: Record<string, unknown>;
}

/**
 * Entry point information
 */
export interface EntryPointInfo {
  /** Entry point path */
  path: string;
  /** Entry point type */
  type: 'main' | 'module' | 'browser' | 'types' | 'bin';
  /** Entry point description */
  description?: string;
  /** Entry point metadata */
  metadata: Record<string, unknown>;
}

/**
 * Export information
 */
export interface ExportInfo {
  /** Export name */
  name: string;
  /** Export type */
  type: ASTNodeType;
  /** File path */
  file: string;
  /** Is default export */
  isDefault: boolean;
  /** Export metadata */
  metadata: Record<string, unknown>;
}

/**
 * Project structure information
 */
export interface ProjectStructure {
  /** Project files */
  files: FileInfo[];
  /** Project directories */
  directories: DirectoryInfo[];
  /** Total number of files */
  totalFiles: number;
  /** Total number of lines */
  totalLines: number;
  /** Total size in bytes */
  totalSize: number;
}

/**
 * Complexity metrics
 */
export interface ComplexityMetrics {
  /** Cyclomatic complexity */
  cyclomaticComplexity: number;
  /** Cognitive complexity */
  cognitiveComplexity: number;
  /** Lines of code */
  linesOfCode: number;
  /** Number of functions */
  functionCount: number;
  /** Number of classes */
  classCount: number;
  /** Number of interfaces */
  interfaceCount: number;
}

/**
 * Quality metrics
 */
export interface QualityMetrics {
  /** Code quality score (0-100) */
  score: number;
  /** Maintainability index */
  maintainabilityIndex: number;
  /** Technical debt ratio */
  technicalDebtRatio: number;
  /** Code duplication percentage */
  duplicationPercentage: number;
  /** Test coverage percentage */
  testCoveragePercentage: number;
}

/**
 * Main project information structure
 */
export interface ProjectInfo {
  /** Project type */
  type: ProjectType;
  /** Project root path */
  rootPath: string;
  /** Project name */
  name: string;
  /** Project version */
  version: string;
  /** Project description */
  description?: string;
  /** Project author */
  author?: string;
  /** Project repository URL */
  repository?: string;
  /** Project entry points */
  entryPoints: EntryPointInfo[];
  /** Project dependencies */
  dependencies: DependencyInfo[];
  /** Project dev dependencies */
  devDependencies: DependencyInfo[];
  /** Project structure */
  structure: ProjectStructure;
  /** AST nodes */
  ast: ASTNode[];
  /** Relationships */
  relations: Relation[];
  /** Public exports */
  publicExports: ExportInfo[];
  /** Private exports */
  privateExports: ExportInfo[];
  /** Complexity metrics */
  complexity: ComplexityMetrics;
  /** Quality metrics */
  quality: QualityMetrics;
}

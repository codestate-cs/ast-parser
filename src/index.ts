/**
 * Codestate AST - Main entry point
 *
 * A comprehensive AST parser library for TypeScript/JavaScript projects
 * with documentation generation capabilities.
 */

// Re-export all types
export * from './types';

// Core functionality
export { CodestateAST } from './core/CodestateAST';
export { ProjectDetector } from './core/ProjectDetector';
export { ProjectParser } from './core/ProjectParser';

// Parser functionality
export { BaseParser } from './parsers/BaseParser';
export { TypeScriptParser } from './parsers/TypeScriptParser';

// Utility functions will be exported here as we implement them
// export * from './utils';

// Configuration will be exported here as we implement it
// export * from './config';

/**
 * Library version
 */
export const VERSION = '0.1.0';

/**
 * Library name
 */
export const LIBRARY_NAME = 'codestate-ast';

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = ['typescript', 'javascript'] as const;

/**
 * Supported project types
 */
export const SUPPORTED_PROJECT_TYPES = ['typescript', 'javascript', 'react', 'node'] as const;

/**
 * Default configuration
 */
export { DEFAULT_PARSING_OPTIONS } from './types/options';

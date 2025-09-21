/**
 * Custom error types for the Codestate AST library
 */

/**
 * Base error class for all Codestate AST errors
 */
export class CodestateASTError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'CodestateASTError';
    this.code = code;
    this.context = context ?? {};

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodestateASTError);
    }
  }
}

/**
 * Project parsing errors
 */
export class ProjectParsingError extends CodestateASTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PROJECT_PARSING_ERROR', context);
    this.name = 'ProjectParsingError';
  }
}

/**
 * File operation errors
 */
export class FileOperationError extends CodestateASTError {
  constructor(message: string, filePath: string, context?: Record<string, unknown>) {
    super(message, 'FILE_OPERATION_ERROR', { filePath, ...context });
    this.name = 'FileOperationError';
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends CodestateASTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', context);
    this.name = 'ConfigurationError';
  }
}

/**
 * Parser errors
 */
export class ParserError extends CodestateASTError {
  constructor(message: string, parserType: string, context?: Record<string, unknown>) {
    super(message, 'PARSER_ERROR', { parserType, ...context });
    this.name = 'ParserError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends CodestateASTError {
  constructor(message: string, field: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', { field, ...context });
    this.name = 'ValidationError';
  }
}

/**
 * Cache errors
 */
export class CacheError extends CodestateASTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CACHE_ERROR', context);
    this.name = 'CacheError';
  }
}

/**
 * Output errors
 */
export class OutputError extends CodestateASTError {
  constructor(message: string, outputType: string, context?: Record<string, unknown>) {
    super(message, 'OUTPUT_ERROR', { outputType, ...context });
    this.name = 'OutputError';
  }
}

/**
 * Documentation generation errors
 */
export class DocumentationError extends CodestateASTError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DOCUMENTATION_ERROR', context);
    this.name = 'DocumentationError';
  }
}

/**
 * Error codes enumeration
 */
export enum ErrorCodes {
  PROJECT_PARSING_ERROR = 'PROJECT_PARSING_ERROR',
  FILE_OPERATION_ERROR = 'FILE_OPERATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  PARSER_ERROR = 'PARSER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  OUTPUT_ERROR = 'OUTPUT_ERROR',
  DOCUMENTATION_ERROR = 'DOCUMENTATION_ERROR',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context interface
 */
export interface ErrorContext {
  /** Error severity */
  severity: ErrorSeverity;
  /** Error timestamp */
  timestamp: Date;
  /** Error stack trace */
  stack?: string;
  /** Additional context data */
  data?: Record<string, unknown>;
  /** Error recovery suggestions */
  suggestions?: string[];
}

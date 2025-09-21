/**
 * Error handling utilities
 */

import { CodestateASTError, ErrorSeverity, ErrorContext } from './CustomErrors';

/**
 * Error handler interface
 */
export interface ErrorHandler {
  /** Handle an error */
  handle(error: Error, context?: ErrorContext): void;
  /** Handle multiple errors */
  handleMultiple(errors: Error[], context?: ErrorContext): void;
  /** Check if error is recoverable */
  isRecoverable(error: Error): boolean;
  /** Get error recovery suggestions */
  getRecoverySuggestions(error: Error): string[];
}

/**
 * Default error handler implementation
 */
export class DefaultErrorHandler implements ErrorHandler {
  private readonly logErrors: boolean;
  private readonly throwOnCritical: boolean;

  constructor(options: { logErrors?: boolean; throwOnCritical?: boolean } = {}) {
    this.logErrors = options.logErrors ?? true;
    this.throwOnCritical = options.throwOnCritical ?? true;
  }

  /**
   * Handle a single error
   */
  handle(error: Error, context?: ErrorContext): void {
    const severity = this.getErrorSeverity(error);

    if (this.logErrors) {
      this.logError(error, severity, context);
    }

    if (severity === ErrorSeverity.CRITICAL && this.throwOnCritical) {
      throw error;
    }
  }

  /**
   * Handle multiple errors
   */
  handleMultiple(errors: Error[], context?: ErrorContext): void {
    const criticalErrors = errors.filter(
      error => this.getErrorSeverity(error) === ErrorSeverity.CRITICAL
    );

    if (criticalErrors.length > 0 && this.throwOnCritical) {
      const error = criticalErrors[0];
      if (error) {
        throw new Error(error.message);
      }
    }

    errors.forEach(error => this.handle(error, context));
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: Error): boolean {
    const severity = this.getErrorSeverity(error);
    return severity !== ErrorSeverity.CRITICAL;
  }

  /**
   * Get error recovery suggestions
   */
  getRecoverySuggestions(error: Error): string[] {
    const suggestions: string[] = [];

    if (error instanceof CodestateASTError) {
      switch (error.code) {
        case 'FILE_OPERATION_ERROR':
          suggestions.push('Check if the file path exists and is accessible');
          suggestions.push('Verify file permissions');
          break;
        case 'CONFIGURATION_ERROR':
          suggestions.push('Validate configuration file syntax');
          suggestions.push('Check required configuration options');
          break;
        case 'PARSER_ERROR':
          suggestions.push('Check file syntax and structure');
          suggestions.push('Verify file encoding');
          break;
        case 'VALIDATION_ERROR':
          suggestions.push('Check input data format');
          suggestions.push('Verify required fields');
          break;
        default:
          suggestions.push('Check error context for more details');
          suggestions.push('Review error logs for additional information');
          suggestions.push('Try running with verbose logging enabled');
      }
    } else {
      suggestions.push('Check error context for more details');
      suggestions.push('Review error logs for additional information');
      suggestions.push('Try running with verbose logging enabled');
    }

    return suggestions;
  }

  /**
   * Get error severity
   */
  private getErrorSeverity(error: Error): ErrorSeverity {
    if (error instanceof CodestateASTError) {
      switch (error.code) {
        case 'PROJECT_PARSING_ERROR':
          return ErrorSeverity.CRITICAL;
        case 'FILE_OPERATION_ERROR':
        case 'CONFIGURATION_ERROR':
          return ErrorSeverity.HIGH;
        case 'PARSER_ERROR':
        case 'VALIDATION_ERROR':
        case 'OUTPUT_ERROR':
          return ErrorSeverity.MEDIUM;
        case 'CACHE_ERROR':
        case 'DOCUMENTATION_ERROR':
          return ErrorSeverity.LOW;
        default:
          return ErrorSeverity.MEDIUM;
      }
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Log error
   */
  private logError(error: Error, severity: ErrorSeverity, context?: ErrorContext): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      severity,
      name: error.name,
      message: error.message,
      stack: error.stack,
      context: context?.data,
    };

    switch (severity) {
      case ErrorSeverity.CRITICAL:
        // eslint-disable-next-line no-console
        console.error('🚨 CRITICAL ERROR:', errorInfo);
        break;
      case ErrorSeverity.HIGH:
        // eslint-disable-next-line no-console
        console.error('❌ HIGH SEVERITY ERROR:', errorInfo);
        break;
      case ErrorSeverity.MEDIUM:
        // eslint-disable-next-line no-console
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', errorInfo);
        break;
      case ErrorSeverity.LOW:
        // eslint-disable-next-line no-console
        console.info('ℹ️ LOW SEVERITY ERROR:', errorInfo);
        break;
    }
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new DefaultErrorHandler();

/**
 * Utility function to handle errors
 */
export function handleError(error: Error, context?: ErrorContext): void {
  globalErrorHandler.handle(error, context);
}

/**
 * Utility function to handle multiple errors
 */
export function handleMultipleErrors(errors: Error[], context?: ErrorContext): void {
  globalErrorHandler.handleMultiple(errors, context);
}

/**
 * Utility function to check if error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  return globalErrorHandler.isRecoverable(error);
}

/**
 * Utility function to get recovery suggestions
 */
export function getRecoverySuggestions(error: Error): string[] {
  return globalErrorHandler.getRecoverySuggestions(error);
}

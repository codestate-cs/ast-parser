/**
 * Error logging utilities
 */

import { CodestateASTError } from './CustomErrors';

/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry interface
 */
export interface LogEntry {
  /** Log timestamp */
  timestamp: Date;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Log context */
  context?: Record<string, unknown>;
  /** Error details */
  error?: Error;
}

/**
 * Logger interface
 */
export interface Logger {
  /** Log debug message */
  debug(message: string, context?: Record<string, unknown>): void;
  /** Log info message */
  info(message: string, context?: Record<string, unknown>): void;
  /** Log warning message */
  warn(message: string, context?: Record<string, unknown>): void;
  /** Log error message */
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  /** Log entry */
  log(entry: LogEntry): void;
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
  private readonly minLevel: LogLevel;
  private readonly includeTimestamp: boolean;
  private readonly includeContext: boolean;

  constructor(
    options: {
      minLevel?: LogLevel;
      includeTimestamp?: boolean;
      includeContext?: boolean;
    } = {}
  ) {
    this.minLevel = options.minLevel ?? LogLevel.INFO;
    this.includeTimestamp = options.includeTimestamp ?? true;
    this.includeContext = options.includeContext ?? true;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      context: context ?? {},
    });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      context: context ?? {},
    });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      context: context ?? {},
    });
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      error: error ?? new Error('Unknown error'),
      context: context ?? {},
    });
  }

  log(entry: LogEntry): void {
    if (this.shouldLog(entry.level)) {
      const formattedMessage = this.formatMessage(entry);

      switch (entry.level) {
        case LogLevel.DEBUG:
          // eslint-disable-next-line no-console
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          // eslint-disable-next-line no-console
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          // eslint-disable-next-line no-console
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          // eslint-disable-next-line no-console
          console.error(formattedMessage);
          break;
      }
    }
  }

  /**
   * Check if should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Format log message
   */
  private formatMessage(entry: LogEntry): string {
    let message = entry.message;

    if (this.includeTimestamp) {
      const timestamp = entry.timestamp.toISOString();
      message = `[${timestamp}] ${message}`;
    }

    if (this.includeContext && entry.context) {
      message += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      message += ` | Error: ${entry.error.message}`;
      if (entry.error instanceof CodestateASTError) {
        message += ` | Code: ${entry.error.code}`;
      }
    }

    return message;
  }
}

/**
 * File logger implementation
 */
export class FileLogger implements Logger {
  private readonly filePath: string;
  private readonly consoleLogger: ConsoleLogger;

  constructor(
    filePath: string,
    options?: {
      minLevel?: LogLevel;
      includeTimestamp?: boolean;
      includeContext?: boolean;
    }
  ) {
    this.filePath = filePath;
    this.consoleLogger = new ConsoleLogger(options);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      level: LogLevel.DEBUG,
      message,
      context: context ?? {},
    });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      level: LogLevel.INFO,
      message,
      context: context ?? {},
    });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      level: LogLevel.WARN,
      message,
      context: context ?? {},
    });
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      message,
      error: error ?? new Error('Unknown error'),
      context: context ?? {},
    });
  }

  log(entry: LogEntry): void {
    // Log to console as well
    this.consoleLogger.log(entry);

    // Log to file (simplified implementation)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
      const fs = require('fs');
      const logLine = `${JSON.stringify(entry)}\n`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      fs.appendFileSync(this.filePath, logLine);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to write to log file:', error);
    }
  }
}

/**
 * Global logger instance
 */
export const globalLogger = new ConsoleLogger();

/**
 * Utility function to log debug message
 */
export function logDebug(message: string, context?: Record<string, unknown>): void {
  globalLogger.debug(message, context);
}

/**
 * Utility function to log info message
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  globalLogger.info(message, context);
}

/**
 * Utility function to log warning message
 */
export function logWarn(message: string, context?: Record<string, unknown>): void {
  globalLogger.warn(message, context);
}

/**
 * Utility function to log error message
 */
export function logError(message: string, error?: Error, context?: Record<string, unknown>): void {
  globalLogger.error(message, error, context);
}

/**
 * Tests for ErrorLogger utilities
 */

import { 
  ConsoleLogger, 
  FileLogger, 
  LogLevel, 
  LogEntry,
  Logger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  CodestateASTError, 
  ErrorCodes
} from '../../../src/utils';

describe('ErrorLogger', () => {
  describe('LogLevel enum', () => {
    it('should have correct log levels', () => {
      expect(LogLevel.DEBUG).toBe('debug');
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.ERROR).toBe('error');
    });
  });

  describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;
    let consoleDebugSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      logger = new ConsoleLogger({ minLevel: LogLevel.DEBUG }); // Allow debug messages
      consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
      consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleDebugSpy.mockRestore();
      consoleInfoSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log debug messages', () => {
      logger.debug('Debug message', { key: 'value' });
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug message')
      );
    });

    it('should log info messages', () => {
      logger.info('Info message', { key: 'value' });
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Info message')
      );
    });

    it('should log warning messages', () => {
      logger.warn('Warning message', { key: 'value' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message')
      );
    });

    it('should log warning messages with undefined context', () => {
      logger.warn('Warning message', undefined);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message')
      );
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error message', error, { key: 'value' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      );
    });

    it('should log entries', () => {
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
        context: { key: 'value' }
      };

      logger.log(entry);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });

    it('should handle messages without context', () => {
      logger.info('Simple message');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Simple message')
      );
    });

    it('should handle error messages without error', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      );
    });
  });

  describe('FileLogger', () => {
    let logger: FileLogger;
    let mockAppendFileSync: jest.SpyInstance;

    beforeEach(() => {
      logger = new FileLogger('/test/log.txt');
      mockAppendFileSync = jest.spyOn(require('fs'), 'appendFileSync').mockImplementation();
    });

    afterEach(() => {
      mockAppendFileSync.mockRestore();
    });

    it('should log debug messages to file', async () => {
      await logger.debug('Debug message', { key: 'value' });
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Debug message')
      );
    });

    it('should log info messages to file', async () => {
      await logger.info('Info message', { key: 'value' });
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Info message')
      );
    });

    it('should log warning messages to file', async () => {
      await logger.warn('Warning message', { key: 'value' });
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Warning message')
      );
    });

    it('should log error messages to file', async () => {
      const error = new Error('Test error');
      await logger.error('Error message', error, { key: 'value' });
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Error message')
      );
    });

    it('should log entries to file', async () => {
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
        context: { key: 'value' }
      };

      await logger.log(entry);
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Test message')
      );
    });

    it('should handle file write errors', async () => {
      mockAppendFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      // Should not throw since FileLogger catches errors
      await logger.info('Test message');
      expect(mockAppendFileSync).toHaveBeenCalled();
    });

    it('should handle undefined context in debug method', async () => {
      await logger.debug('Debug message', undefined);
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Debug message')
      );
    });

    it('should handle undefined context in info method', async () => {
      await logger.info('Info message', undefined);
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Info message')
      );
    });

    it('should handle undefined context in warn method', async () => {
      await logger.warn('Warn message', undefined);
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Warn message')
      );
    });

    it('should handle undefined context in error method', async () => {
      await logger.error('Error message', undefined, undefined);
      expect(mockAppendFileSync).toHaveBeenCalledWith(
        '/test/log.txt',
        expect.stringContaining('Error message')
      );
    });
  });

  // MemoryLogger tests removed as it's not implemented in the actual ErrorLogger module

  describe('ErrorLogger utility functions', () => {
    let consoleInfoSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleDebugSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    });

    afterEach(() => {
      consoleInfoSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleDebugSpy.mockRestore();
    });

    it('should log info messages', () => {
      logInfo('Test info message', { key: 'value' });
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logError('Test error message', error, { key: 'value' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should log warning messages', () => {
      logWarn('Test warning message', { key: 'value' });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    it('should log debug messages', () => {
      // Create a debug logger that allows debug messages
      const debugLogger = new ConsoleLogger({ minLevel: LogLevel.DEBUG });
      debugLogger.debug('Test debug message', { key: 'value' });
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      );
    });

    it('should handle messages without context', () => {
      logInfo('Simple message');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Simple message')
      );
    });

    it('should handle error messages without error', () => {
      logError('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      );
    });
  });

  describe('Logger interface', () => {
    it('should be implementable', () => {
      const logger: Logger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        log: jest.fn()
      };

      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.log).toBeDefined();
    });
  });

  describe('LogEntry interface', () => {
    it('should create valid log entries', () => {
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Test message',
        context: { key: 'value' },
        error: new Error('Test error')
      };

      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.message).toBe('Test message');
      expect(entry.context).toEqual({ key: 'value' });
      expect(entry.error).toBeInstanceOf(Error);
    });

    it('should create minimal log entries', () => {
      const entry: LogEntry = {
        timestamp: new Date(),
        level: LogLevel.DEBUG,
        message: 'Minimal message'
      };

      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.level).toBe(LogLevel.DEBUG);
      expect(entry.message).toBe('Minimal message');
      expect(entry.context).toBeUndefined();
      expect(entry.error).toBeUndefined();
    });
  });

  describe('error handling', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle CodestateASTError', () => {
      const error = new CodestateASTError(
        'Test error',
        ErrorCodes.PROJECT_PARSING_ERROR,
        { filePath: '/test/file.ts' }
      );

      logError('Parsing failed', error, { context: 'test' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parsing failed')
      );
    });

    it('should handle standard Error', () => {
      const error = new Error('Standard error');
      logError('Operation failed', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed')
      );
    });
  });

  describe('edge cases', () => {
    let consoleInfoSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    });

    afterEach(() => {
      consoleInfoSpy.mockRestore();
    });

    it('should handle empty messages', () => {
      logInfo('');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('')
      );
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000);
      logInfo(longMessage);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(longMessage)
      );
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      logInfo(specialMessage);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage)
      );
    });

    it('should handle unicode characters in messages', () => {
      const unicodeMessage = 'Message with unicode: 你好世界 🌍';
      logInfo(unicodeMessage);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(unicodeMessage)
      );
    });

    it('should handle complex context objects', () => {
      const complexContext = {
        nested: {
          deep: {
            value: 'test'
          }
        },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined
      };

      logInfo('Complex context', complexContext);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Complex context')
      );
    });

    it('should call logDebug utility function', () => {
      // The logDebug function calls globalLogger.debug, but globalLogger has minLevel: LogLevel.INFO
      // so debug messages are filtered out and console.debug is never called.
      // We'll test that the function doesn't throw an error.
      expect(() => {
        logDebug('Debug message', { key: 'value' });
      }).not.toThrow();
    });

    it('should call logDebug utility function with undefined context', () => {
      // Test the context ?? {} branch in the debug method
      expect(() => {
        logDebug('Debug message', undefined);
      }).not.toThrow();
    });
  });
});

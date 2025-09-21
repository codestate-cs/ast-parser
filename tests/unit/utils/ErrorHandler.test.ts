/**
 * Tests for ErrorHandler classes
 */

import { 
  DefaultErrorHandler, 
  ErrorHandler, 
  globalErrorHandler,
  handleError,
  handleMultipleErrors,
  isRecoverableError,
  getRecoverySuggestions,
  CodestateASTError, 
  ErrorSeverity
} from '../../../src/utils';

describe('ErrorHandler', () => {
  let errorHandler: DefaultErrorHandler;

  beforeEach(() => {
    errorHandler = new DefaultErrorHandler();
  });

  describe('DefaultErrorHandler', () => {

    describe('constructor', () => {
      it('should create instance with default options', () => {
        expect(errorHandler).toBeDefined();
      });

      it('should create instance with custom options', () => {
        const customHandler = new DefaultErrorHandler({
          logErrors: false,
          throwOnCritical: false
        });
        expect(customHandler).toBeDefined();
      });
    });

    describe('handle', () => {
      it('should handle standard Error', () => {
        const error = new Error('Test error');
        
        expect(() => errorHandler.handle(error)).not.toThrow();
      });

      it('should handle CodestateASTError', () => {
        const error = new CodestateASTError('Test AST error', 'TEST_ERROR', { test: 'data' });
        
        expect(() => errorHandler.handle(error)).not.toThrow();
      });

      it('should handle error with context', () => {
        const error = new Error('Test error');
        const context = { filePath: 'test.ts', line: 10, severity: 'error' as any, timestamp: new Date() };
        
        expect(() => errorHandler.handle(error, context)).not.toThrow();
      });

      it('should handle critical errors by throwing', () => {
        const criticalError = new CodestateASTError('Critical error', 'PROJECT_PARSING_ERROR', {});
        
        expect(() => errorHandler.handle(criticalError)).toThrow('Critical error');
      });

      it('should not throw on critical errors when throwOnCritical is false', () => {
        const handler = new DefaultErrorHandler({ throwOnCritical: false });
        const criticalError = new CodestateASTError('Critical error', 'PROJECT_PARSING_ERROR', {});
        
        expect(() => handler.handle(criticalError)).not.toThrow();
      });
    });

    describe('handleMultiple', () => {
      it('should handle multiple errors', () => {
        const errors = [
          new Error('Error 1'),
          new Error('Error 2'),
          new CodestateASTError('Error 3', 'TEST_ERROR')
        ];
        
        expect(() => errorHandler.handleMultiple(errors)).not.toThrow();
      });

      it('should handle multiple errors with context', () => {
        const errors = [
          new Error('Error 1'),
          new Error('Error 2')
        ];
        const context = { filePath: 'test.ts', severity: 'error' as any, timestamp: new Date() };
        
        expect(() => errorHandler.handleMultiple(errors, context)).not.toThrow();
      });

      it('should handle empty errors array', () => {
        expect(() => errorHandler.handleMultiple([])).not.toThrow();
      });

      it('should throw on first critical error', () => {
        const errors = [
          new Error('Error 1'),
          new CodestateASTError('Critical error', 'PROJECT_PARSING_ERROR', {}),
          new Error('Error 3')
        ];
        
        expect(() => errorHandler.handleMultiple(errors)).toThrow('Critical error');
      });
    });

    describe('isRecoverable', () => {
      it('should identify CRITICAL errors as non-recoverable', () => {
        const criticalError = new CodestateASTError('Critical error', 'PROJECT_PARSING_ERROR', {});
        
        expect(errorHandler.isRecoverable(criticalError)).toBe(false);
      });

      it('should identify HIGH severity errors as recoverable', () => {
        const fileError = new CodestateASTError('File error', 'FILE_OPERATION_ERROR', {});
        const configError = new CodestateASTError('Config error', 'CONFIGURATION_ERROR', {});
        
        expect(errorHandler.isRecoverable(fileError)).toBe(true);
        expect(errorHandler.isRecoverable(configError)).toBe(true);
      });

      it('should identify MEDIUM severity errors as recoverable', () => {
        const parserError = new CodestateASTError('Parser error', 'PARSER_ERROR', {});
        const validationError = new CodestateASTError('Validation error', 'VALIDATION_ERROR', {});
        const outputError = new CodestateASTError('Output error', 'OUTPUT_ERROR', {});
        
        expect(errorHandler.isRecoverable(parserError)).toBe(true);
        expect(errorHandler.isRecoverable(validationError)).toBe(true);
        expect(errorHandler.isRecoverable(outputError)).toBe(true);
      });

      it('should identify LOW severity errors as recoverable', () => {
        const cacheError = new CodestateASTError('Cache error', 'CACHE_ERROR', {});
        const docError = new CodestateASTError('Documentation error', 'DOCUMENTATION_ERROR', {});
        
        expect(errorHandler.isRecoverable(cacheError)).toBe(true);
        expect(errorHandler.isRecoverable(docError)).toBe(true);
      });

      it('should identify unknown error codes as recoverable (default MEDIUM)', () => {
        const unknownError = new CodestateASTError('Unknown error', 'UNKNOWN_ERROR' as any, {});
        
        expect(errorHandler.isRecoverable(unknownError)).toBe(true);
      });

      it('should identify standard errors as recoverable (default MEDIUM)', () => {
        const standardError = new Error('Standard error');
        
        expect(errorHandler.isRecoverable(standardError)).toBe(true);
      });
    });

    describe('getRecoverySuggestions', () => {
      it('should provide recovery suggestions for known errors', () => {
        const error = new CodestateASTError('File not found', 'FILE_NOT_FOUND');
        const suggestions = errorHandler.getRecoverySuggestions(error);
        
        expect(Array.isArray(suggestions)).toBe(true);
      });

      it('should provide recovery suggestions for standard errors', () => {
        const error = new Error('Standard error');
        const suggestions = errorHandler.getRecoverySuggestions(error);
        
        expect(Array.isArray(suggestions)).toBe(true);
      });

      it('should provide generic suggestions for unknown errors', () => {
        const error = new Error('Unknown error type');
        const suggestions = errorHandler.getRecoverySuggestions(error);
        
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
      });

      it('should provide suggestions for unknown CodestateASTError codes', () => {
        const unknownCodeError = new CodestateASTError('Unknown code error', 'UNKNOWN_CODE' as any, {});
        const suggestions = errorHandler.getRecoverySuggestions(unknownCodeError);
        
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions).toContain('Check error context for more details');
      });

      it('should provide suggestions for FILE_OPERATION_ERROR', () => {
        const fileError = new CodestateASTError('File operation failed', 'FILE_OPERATION_ERROR', {});
        const suggestions = errorHandler.getRecoverySuggestions(fileError);
        
        expect(suggestions).toContain('Check if the file path exists and is accessible');
        expect(suggestions).toContain('Verify file permissions');
      });

      it('should provide suggestions for CONFIGURATION_ERROR', () => {
        const configError = new CodestateASTError('Configuration error', 'CONFIGURATION_ERROR', {});
        const suggestions = errorHandler.getRecoverySuggestions(configError);
        
        expect(suggestions).toContain('Validate configuration file syntax');
        expect(suggestions).toContain('Check required configuration options');
      });

      it('should provide suggestions for PARSER_ERROR', () => {
        const parserError = new CodestateASTError('Parser error', 'PARSER_ERROR', {});
        const suggestions = errorHandler.getRecoverySuggestions(parserError);
        
        expect(suggestions).toContain('Check file syntax and structure');
        expect(suggestions).toContain('Verify file encoding');
      });

      it('should provide suggestions for VALIDATION_ERROR', () => {
        const validationError = new CodestateASTError('Validation error', 'VALIDATION_ERROR', {});
        const suggestions = errorHandler.getRecoverySuggestions(validationError);
        
        expect(suggestions).toContain('Check input data format');
        expect(suggestions).toContain('Verify required fields');
      });
    });
  });

  describe('ErrorHandler interface', () => {
    it('should be implementable', () => {
      const customHandler: ErrorHandler = {
        handle: jest.fn(),
        handleMultiple: jest.fn(),
        isRecoverable: jest.fn().mockReturnValue(true),
        getRecoverySuggestions: jest.fn().mockReturnValue(['suggestion'])
      };

      expect(customHandler).toBeDefined();
      expect(typeof customHandler.handle).toBe('function');
      expect(typeof customHandler.handleMultiple).toBe('function');
      expect(typeof customHandler.isRecoverable).toBe('function');
      expect(typeof customHandler.getRecoverySuggestions).toBe('function');
    });
  });

  describe('error handling scenarios', () => {
    let errorHandler: DefaultErrorHandler;

    beforeEach(() => {
      errorHandler = new DefaultErrorHandler();
    });

    it('should handle parsing errors', () => {
      const parsingError = new CodestateASTError('Parsing failed', 'PARSING_ERROR', { filePath: 'test.ts' });
      
      expect(() => errorHandler.handle(parsingError)).not.toThrow();
      expect(errorHandler.isRecoverable(parsingError)).toBe(true);
    });

    it('should handle file system errors', () => {
      const fsError = new CodestateASTError('Permission denied', 'FILE_SYSTEM_ERROR', { filePath: 'test.ts' });
      
      expect(() => errorHandler.handle(fsError)).not.toThrow();
      expect(errorHandler.isRecoverable(fsError)).toBe(true);
    });

    it('should handle configuration errors', () => {
      const configError = new CodestateASTError('Invalid configuration', 'CONFIG_ERROR', { configFile: 'tsconfig.json' });
      
      expect(() => errorHandler.handle(configError)).not.toThrow();
      expect(errorHandler.isRecoverable(configError)).toBe(true);
    });

    it('should handle network errors', () => {
      const networkError = new CodestateASTError('Network timeout', 'NETWORK_ERROR', { url: 'https://example.com' });
      
      expect(() => errorHandler.handle(networkError)).not.toThrow();
      expect(errorHandler.isRecoverable(networkError)).toBe(true);
    });

    it('should handle memory errors', () => {
      const memoryError = new CodestateASTError('Out of memory', 'PROJECT_PARSING_ERROR', {});
      
      expect(() => errorHandler.handle(memoryError)).toThrow('Out of memory');
      expect(errorHandler.isRecoverable(memoryError)).toBe(false);
    });
  });

  describe('utility functions', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    describe('handleError', () => {
      it('should handle error using global handler', () => {
        const error = new Error('Test error');
        
        expect(() => handleError(error)).not.toThrow();
      });

      it('should handle error with context', () => {
        const error = new Error('Test error');
        const context = { 
          severity: ErrorSeverity.HIGH, 
          timestamp: new Date(),
          data: { filePath: 'test.ts' }
        };
        
        expect(() => handleError(error, context)).not.toThrow();
      });

      it('should handle CodestateASTError', () => {
        const error = new CodestateASTError('Test AST error', 'TEST_ERROR');
        
        expect(() => handleError(error)).not.toThrow();
      });
    });

    describe('handleMultipleErrors', () => {
      it('should handle multiple errors', () => {
        const errors = [
          new Error('Error 1'),
          new Error('Error 2'),
          new CodestateASTError('AST Error', 'TEST_ERROR')
        ];
        
        expect(() => handleMultipleErrors(errors)).not.toThrow();
      });

      it('should handle multiple errors with context', () => {
        const errors = [new Error('Error 1'), new Error('Error 2')];
        const context = { 
          severity: ErrorSeverity.MEDIUM, 
          timestamp: new Date(),
          data: { operation: 'batch' }
        };
        
        expect(() => handleMultipleErrors(errors, context)).not.toThrow();
      });

      it('should handle empty errors array', () => {
        expect(() => handleMultipleErrors([])).not.toThrow();
      });
    });
  });

  describe('global error handler', () => {
    it('should be instance of DefaultErrorHandler', () => {
      expect(globalErrorHandler).toBeInstanceOf(DefaultErrorHandler);
    });

    it('should handle errors', () => {
      const error = new Error('Test error');
      
      expect(() => globalErrorHandler.handle(error)).not.toThrow();
    });

    it('should handle multiple errors', () => {
      const errors = [new Error('Error 1'), new Error('Error 2')];
      
      expect(() => globalErrorHandler.handleMultiple(errors)).not.toThrow();
    });
  });

  describe('error severity classification', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should classify PROJECT_PARSING_ERROR as CRITICAL', () => {
      const error = new CodestateASTError('Parse failed', 'PROJECT_PARSING_ERROR');
      
      expect(() => errorHandler.handle(error)).toThrow();
    });

    it('should classify FILE_OPERATION_ERROR as HIGH', () => {
      const error = new CodestateASTError('File failed', 'FILE_OPERATION_ERROR');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should classify CONFIGURATION_ERROR as HIGH', () => {
      const error = new CodestateASTError('Config failed', 'CONFIGURATION_ERROR');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should classify PARSER_ERROR as MEDIUM', () => {
      const error = new CodestateASTError('Parser failed', 'PARSER_ERROR');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should classify VALIDATION_ERROR as MEDIUM', () => {
      const error = new CodestateASTError('Validation failed', 'VALIDATION_ERROR');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should classify CACHE_ERROR as LOW', () => {
      const error = new CodestateASTError('Cache failed', 'CACHE_ERROR');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should classify OUTPUT_ERROR as MEDIUM', () => {
      const error = new CodestateASTError('Output failed', 'OUTPUT_ERROR');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should classify DOCUMENTATION_ERROR as LOW', () => {
      const error = new CodestateASTError('Doc failed', 'DOCUMENTATION_ERROR');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should classify unknown errors as MEDIUM', () => {
      const error = new CodestateASTError('Unknown error', 'UNKNOWN_ERROR');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });
  });

  describe('console logging', () => {
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should log CRITICAL errors to console.error', () => {
      const error = new CodestateASTError('Critical error', 'PROJECT_PARSING_ERROR');
      
      try {
        errorHandler.handle(error);
      } catch {
        // Expected to throw
      }
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '🚨 CRITICAL ERROR:',
        expect.objectContaining({
          severity: ErrorSeverity.CRITICAL,
          name: 'CodestateASTError',
          message: 'Critical error',
        })
      );
    });

    it('should log HIGH errors to console.error', () => {
      const error = new CodestateASTError('High error', 'FILE_OPERATION_ERROR');
      
      errorHandler.handle(error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ HIGH SEVERITY ERROR:',
        expect.objectContaining({
          severity: ErrorSeverity.HIGH,
          name: 'CodestateASTError',
          message: 'High error',
        })
      );
    });

    it('should log MEDIUM errors to console.warn', () => {
      const error = new CodestateASTError('Medium error', 'PARSER_ERROR');
      
      errorHandler.handle(error);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ MEDIUM SEVERITY ERROR:',
        expect.objectContaining({
          severity: ErrorSeverity.MEDIUM,
          name: 'CodestateASTError',
          message: 'Medium error',
        })
      );
    });

    it('should log LOW errors to console.info', () => {
      const error = new CodestateASTError('Low error', 'CACHE_ERROR');
      
      errorHandler.handle(error);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'ℹ️ LOW SEVERITY ERROR:',
        expect.objectContaining({
          severity: ErrorSeverity.LOW,
          name: 'CodestateASTError',
          message: 'Low error',
        })
      );
    });

    it('should include context data in log', () => {
      const error = new CodestateASTError('Test error', 'FILE_OPERATION_ERROR');
      const context = { 
        severity: ErrorSeverity.HIGH, 
        timestamp: new Date(),
        data: { filePath: 'test.ts', line: 10 }
      };
      
      errorHandler.handle(error, context);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ HIGH SEVERITY ERROR:',
        expect.objectContaining({
          context: { filePath: 'test.ts', line: 10 }
        })
      );
    });
  });

  describe('error handler options', () => {
    it('should respect logErrors: false option', () => {
      const handler = new DefaultErrorHandler({ logErrors: false });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handler.handle(new Error('Test error'));
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should respect throwOnCritical: false option', () => {
      const handler = new DefaultErrorHandler({ throwOnCritical: false });
      const error = new CodestateASTError('Critical error', 'PROJECT_PARSING_ERROR');
      
      expect(() => handler.handle(error)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle errors without stack trace', () => {
      const error = new Error('Test error');
      delete (error as any).stack;
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should handle errors with circular references in context', () => {
      const error = new Error('Test error');
      const context: any = { data: { key: 'value' } };
      context.data.self = context; // Create circular reference
      
      expect(() => errorHandler.handle(error, context)).not.toThrow();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'a'.repeat(10000);
      const error = new Error(longMessage);
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should handle errors with special characters', () => {
      const error = new Error('Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });

    it('should handle errors with unicode characters', () => {
      const error = new Error('Error with unicode: 你好世界 🌍');
      
      expect(() => errorHandler.handle(error)).not.toThrow();
    });
  });

  describe('Utility functions', () => {
    describe('isRecoverableError', () => {
      it('should check if error is recoverable using global handler', () => {
        const recoverableError = new CodestateASTError('Recoverable error', 'PARSER_ERROR', {});
        const nonRecoverableError = new CodestateASTError('Critical error', 'PROJECT_PARSING_ERROR', {});
        
        expect(isRecoverableError(recoverableError)).toBe(true);
        expect(isRecoverableError(nonRecoverableError)).toBe(false);
      });

      it('should handle standard errors as recoverable', () => {
        const standardError = new Error('Standard error');
        
        expect(isRecoverableError(standardError)).toBe(true);
      });
    });

    describe('getRecoverySuggestions', () => {
      it('should get recovery suggestions using global handler', () => {
        const fileError = new CodestateASTError('File error', 'FILE_OPERATION_ERROR', {});
        const suggestions = getRecoverySuggestions(fileError);
        
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions).toContain('Check if the file path exists and is accessible');
      });

      it('should handle standard errors', () => {
        const standardError = new Error('Standard error');
        const suggestions = getRecoverySuggestions(standardError);
        
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions).toContain('Check error context for more details');
      });
    });
  });
});

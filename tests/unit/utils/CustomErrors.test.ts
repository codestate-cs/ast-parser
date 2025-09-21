/**
 * Tests for CustomErrors utilities
 */

import {
  CodestateASTError,
  ProjectParsingError,
  FileOperationError,
  ConfigurationError,
  ParserError,
  ValidationError,
  CacheError,
  OutputError,
  DocumentationError,
  ErrorCodes,
  ErrorSeverity,
  ErrorContext,
} from '../../../src/utils';

describe('CustomErrors', () => {
  describe('CodestateASTError', () => {
    it('should create error with message and code', () => {
      const error = new CodestateASTError('Test error', 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('CodestateASTError');
      expect(error.context).toEqual({});
    });

    it('should create error with context', () => {
      const context = { filePath: '/test/file.ts', line: 10 };
      const error = new CodestateASTError('Test error', 'TEST_ERROR', context);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toEqual(context);
    });

    it('should create error without context', () => {
      const error = new CodestateASTError('Test error', 'TEST_ERROR');
      
      expect(error.context).toEqual({});
    });

    it('should maintain proper stack trace', () => {
      const error = new CodestateASTError('Test error', 'TEST_ERROR');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('CodestateASTError');
    });

    it('should be instance of Error', () => {
      const error = new CodestateASTError('Test error', 'TEST_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CodestateASTError);
    });
  });

  describe('ProjectParsingError', () => {
    it('should create project parsing error', () => {
      const error = new ProjectParsingError('Failed to parse project');
      
      expect(error.message).toBe('Failed to parse project');
      expect(error.code).toBe(ErrorCodes.PROJECT_PARSING_ERROR);
      expect(error.name).toBe('ProjectParsingError');
      expect(error.context).toEqual({});
    });

    it('should create project parsing error with context', () => {
      const context = { projectPath: '/test/project', reason: 'Invalid config' };
      const error = new ProjectParsingError('Failed to parse project', context);
      
      expect(error.message).toBe('Failed to parse project');
      expect(error.code).toBe(ErrorCodes.PROJECT_PARSING_ERROR);
      expect(error.context).toEqual(context);
    });

    it('should be instance of CodestateASTError', () => {
      const error = new ProjectParsingError('Test error');
      
      expect(error).toBeInstanceOf(CodestateASTError);
      expect(error).toBeInstanceOf(ProjectParsingError);
    });
  });

  describe('FileOperationError', () => {
    it('should create file operation error', () => {
      const error = new FileOperationError('Failed to read file', '/test/file.ts');
      
      expect(error.message).toBe('Failed to read file');
      expect(error.code).toBe(ErrorCodes.FILE_OPERATION_ERROR);
      expect(error.name).toBe('FileOperationError');
      expect(error.context).toEqual({ filePath: '/test/file.ts' });
    });

    it('should create file operation error with context', () => {
      const context = { operation: 'read', reason: 'Permission denied' };
      const error = new FileOperationError('Failed to read file', '/test/file.ts', context);
      
      expect(error.message).toBe('Failed to read file');
      expect(error.code).toBe(ErrorCodes.FILE_OPERATION_ERROR);
      expect(error.context).toEqual({ filePath: '/test/file.ts', ...context });
    });

    it('should be instance of CodestateASTError', () => {
      const error = new FileOperationError('Test error', '/test/file.ts');
      
      expect(error).toBeInstanceOf(CodestateASTError);
      expect(error).toBeInstanceOf(FileOperationError);
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Invalid configuration');
      
      expect(error.message).toBe('Invalid configuration');
      expect(error.code).toBe(ErrorCodes.CONFIGURATION_ERROR);
      expect(error.name).toBe('ConfigurationError');
      expect(error.context).toEqual({});
    });

    it('should create configuration error with context', () => {
      const context = { configFile: 'tsconfig.json', property: 'compilerOptions' };
      const error = new ConfigurationError('Invalid configuration', context);
      
      expect(error.message).toBe('Invalid configuration');
      expect(error.code).toBe(ErrorCodes.CONFIGURATION_ERROR);
      expect(error.context).toEqual(context);
    });

    it('should be instance of CodestateASTError', () => {
      const error = new ConfigurationError('Test error');
      
      expect(error).toBeInstanceOf(CodestateASTError);
      expect(error).toBeInstanceOf(ConfigurationError);
    });
  });

  describe('ParserError', () => {
    it('should create parser error', () => {
      const error = new ParserError('Failed to parse file', 'TypeScript');
      
      expect(error.message).toBe('Failed to parse file');
      expect(error.code).toBe(ErrorCodes.PARSER_ERROR);
      expect(error.name).toBe('ParserError');
      expect(error.context).toEqual({ parserType: 'TypeScript' });
    });

    it('should create parser error with context', () => {
      const context = { filePath: '/test/file.ts', line: 5 };
      const error = new ParserError('Failed to parse file', 'TypeScript', context);
      
      expect(error.message).toBe('Failed to parse file');
      expect(error.code).toBe(ErrorCodes.PARSER_ERROR);
      expect(error.context).toEqual({ parserType: 'TypeScript', ...context });
    });

    it('should be instance of CodestateASTError', () => {
      const error = new ParserError('Test error', 'TypeScript');
      
      expect(error).toBeInstanceOf(CodestateASTError);
      expect(error).toBeInstanceOf(ParserError);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid value', 'name');
      
      expect(error.message).toBe('Invalid value');
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.name).toBe('ValidationError');
      expect(error.context).toEqual({ field: 'name' });
    });

    it('should create validation error with context', () => {
      const context = { value: 'invalid', expected: 'string' };
      const error = new ValidationError('Invalid value', 'name', context);
      
      expect(error.message).toBe('Invalid value');
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.context).toEqual({ field: 'name', ...context });
    });

    it('should be instance of CodestateASTError', () => {
      const error = new ValidationError('Test error', 'field');
      
      expect(error).toBeInstanceOf(CodestateASTError);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('CacheError', () => {
    it('should create cache error', () => {
      const error = new CacheError('Failed to cache data');
      
      expect(error.message).toBe('Failed to cache data');
      expect(error.code).toBe(ErrorCodes.CACHE_ERROR);
      expect(error.name).toBe('CacheError');
      expect(error.context).toEqual({});
    });

    it('should create cache error with context', () => {
      const context = { key: 'user:123', operation: 'set' };
      const error = new CacheError('Failed to cache data', context);
      
      expect(error.message).toBe('Failed to cache data');
      expect(error.code).toBe(ErrorCodes.CACHE_ERROR);
      expect(error.context).toEqual(context);
    });

    it('should be instance of CodestateASTError', () => {
      const error = new CacheError('Test error');
      
      expect(error).toBeInstanceOf(CodestateASTError);
      expect(error).toBeInstanceOf(CacheError);
    });
  });

  describe('OutputError', () => {
    it('should create output error', () => {
      const error = new OutputError('Failed to generate output', 'json');
      
      expect(error.message).toBe('Failed to generate output');
      expect(error.code).toBe(ErrorCodes.OUTPUT_ERROR);
      expect(error.name).toBe('OutputError');
      expect(error.context).toEqual({ outputType: 'json' });
    });

    it('should create output error with context', () => {
      const context = { format: 'json', destination: '/output/file.json' };
      const error = new OutputError('Failed to generate output', 'json', context);
      
      expect(error.message).toBe('Failed to generate output');
      expect(error.code).toBe(ErrorCodes.OUTPUT_ERROR);
      expect(error.context).toEqual({ outputType: 'json', ...context });
    });

    it('should be instance of CodestateASTError', () => {
      const error = new OutputError('Test error', 'json');
      
      expect(error).toBeInstanceOf(CodestateASTError);
      expect(error).toBeInstanceOf(OutputError);
    });
  });

  describe('DocumentationError', () => {
    it('should create documentation error', () => {
      const error = new DocumentationError('Failed to generate documentation');
      
      expect(error.message).toBe('Failed to generate documentation');
      expect(error.code).toBe(ErrorCodes.DOCUMENTATION_ERROR);
      expect(error.name).toBe('DocumentationError');
      expect(error.context).toEqual({});
    });

    it('should create documentation error with context', () => {
      const context = { template: 'api.md', source: '/src/api.ts' };
      const error = new DocumentationError('Failed to generate documentation', context);
      
      expect(error.message).toBe('Failed to generate documentation');
      expect(error.code).toBe(ErrorCodes.DOCUMENTATION_ERROR);
      expect(error.context).toEqual(context);
    });

    it('should be instance of CodestateASTError', () => {
      const error = new DocumentationError('Test error');
      
      expect(error).toBeInstanceOf(CodestateASTError);
      expect(error).toBeInstanceOf(DocumentationError);
    });
  });

  describe('ErrorCodes enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.PROJECT_PARSING_ERROR).toBe('PROJECT_PARSING_ERROR');
      expect(ErrorCodes.FILE_OPERATION_ERROR).toBe('FILE_OPERATION_ERROR');
      expect(ErrorCodes.CONFIGURATION_ERROR).toBe('CONFIGURATION_ERROR');
      expect(ErrorCodes.PARSER_ERROR).toBe('PARSER_ERROR');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.CACHE_ERROR).toBe('CACHE_ERROR');
      expect(ErrorCodes.OUTPUT_ERROR).toBe('OUTPUT_ERROR');
      expect(ErrorCodes.DOCUMENTATION_ERROR).toBe('DOCUMENTATION_ERROR');
    });

    it('should have unique error codes', () => {
      const codes = Object.values(ErrorCodes);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('ErrorSeverity enum', () => {
    it('should have all expected severity levels', () => {
      expect(ErrorSeverity.LOW).toBe('low');
      expect(ErrorSeverity.MEDIUM).toBe('medium');
      expect(ErrorSeverity.HIGH).toBe('high');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });

    it('should have unique severity levels', () => {
      const severities = Object.values(ErrorSeverity);
      const uniqueSeverities = new Set(severities);
      expect(uniqueSeverities.size).toBe(severities.length);
    });
  });

  describe('ErrorContext interface', () => {
    it('should create valid error context', () => {
      const context: ErrorContext = {
        severity: ErrorSeverity.HIGH,
        timestamp: new Date(),
        stack: 'Error stack trace',
        data: { key: 'value' },
        suggestions: ['Fix this', 'Try that'],
      };

      expect(context.severity).toBe(ErrorSeverity.HIGH);
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.stack).toBe('Error stack trace');
      expect(context.data).toEqual({ key: 'value' });
      expect(context.suggestions).toEqual(['Fix this', 'Try that']);
    });

    it('should create minimal error context', () => {
      const context: ErrorContext = {
        severity: ErrorSeverity.LOW,
        timestamp: new Date(),
      };

      expect(context.severity).toBe(ErrorSeverity.LOW);
      expect(context.timestamp).toBeInstanceOf(Date);
      expect(context.stack).toBeUndefined();
      expect(context.data).toBeUndefined();
      expect(context.suggestions).toBeUndefined();
    });
  });

  describe('Error inheritance and polymorphism', () => {
    it('should allow polymorphic error handling', () => {
      const errors = [
        new ProjectParsingError('Parse error'),
        new FileOperationError('File error', '/test/file.ts'),
        new ConfigurationError('Config error'),
        new ParserError('Parser error', 'TypeScript'),
        new ValidationError('Validation error', 'field'),
        new CacheError('Cache error'),
        new OutputError('Output error', 'json'),
        new DocumentationError('Doc error'),
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(CodestateASTError);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.name).toBeDefined();
      });
    });

    it('should maintain error chain', () => {
      const originalError = new Error('Original error');
      const wrappedError = new ProjectParsingError('Wrapped error', { original: originalError.message });
      
      expect(wrappedError).toBeInstanceOf(CodestateASTError);
      expect(wrappedError.context?.['original']).toBe('Original error');
    });
  });

  describe('Error serialization', () => {
    it('should serialize error to JSON', () => {
      const error = new ProjectParsingError('Test error', { key: 'value' });
      
      // Test that error properties are accessible
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCodes.PROJECT_PARSING_ERROR);
      expect(error.name).toBe('ProjectParsingError');
      expect(error.context).toEqual({ key: 'value' });
      
      // Test manual serialization
      const serialized = JSON.stringify({
        message: error.message,
        code: error.code,
        name: error.name,
        context: error.context,
      });
      const parsed = JSON.parse(serialized);
      
      expect(parsed.message).toBe('Test error');
      expect(parsed.code).toBe(ErrorCodes.PROJECT_PARSING_ERROR);
      expect(parsed.name).toBe('ProjectParsingError');
      expect(parsed.context).toEqual({ key: 'value' });
    });

    it('should handle circular references in context', () => {
      const context: any = { key: 'value' };
      context.self = context; // Create circular reference
      
      const error = new ProjectParsingError('Test error', context);
      
      // Should not throw when accessing context
      expect(error.context).toBeDefined();
      expect(error.context?.['key']).toBe('value');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty message', () => {
      const error = new CodestateASTError('', 'TEST_ERROR');
      
      expect(error.message).toBe('');
      expect(error.code).toBe('TEST_ERROR');
    });

    it('should handle null context', () => {
      const error = new CodestateASTError('Test error', 'TEST_ERROR', null as any);
      
      expect(error.context).toEqual({});
    });

    it('should handle undefined context', () => {
      const error = new CodestateASTError('Test error', 'TEST_ERROR', undefined);
      
      expect(error.context).toEqual({});
    });

    it('should handle complex context objects', () => {
      const context = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      };
      
      const error = new CodestateASTError('Test error', 'TEST_ERROR', context);
      
      expect(error.context).toEqual(context);
    });
  });
});

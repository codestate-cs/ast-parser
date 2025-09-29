/**
 * Example Extractor for extracting and analyzing code examples
 * 
 * This module provides comprehensive example extraction capabilities including:
 * - JSDoc @example tag extraction and parsing
 * - Code example validation and formatting
 * - Usage example extraction from source code
 * - Example documentation generation
 */

import { ASTNode } from '../../types/core';

/**
 * Example types
 */
export type ExampleType = 
  | 'jsdoc'
  | 'usage'
  | 'test'
  | 'demo'
  | 'snippet'
  | 'tutorial'
  | 'unknown';

/**
 * Example language
 */
export type ExampleLanguage = 
  | 'typescript'
  | 'javascript'
  | 'json'
  | 'html'
  | 'css'
  | 'markdown'
  | 'bash'
  | 'sql'
  | 'unknown';

/**
 * Example information
 */
export interface ExampleInfo {
  /** Example identifier */
  id: string;
  /** Example title */
  title: string;
  /** Example description */
  description: string;
  /** Example type */
  type: ExampleType;
  /** Example language */
  language: ExampleLanguage;
  /** Example code */
  code: string;
  /** Example output (if any) */
  output?: string;
  /** Example metadata */
  metadata: Record<string, unknown>;
  /** File path where example is found */
  filePath: string;
  /** Start position in file */
  start: number;
  /** End position in file */
  end: number;
  /** Line number where example starts */
  lineNumber: number;
  /** Whether example is valid */
  isValid: boolean;
  /** Example validation errors */
  errors: string[];
}

/**
 * Example extraction result
 */
export interface ExampleExtractionResult {
  /** Extracted examples */
  examples: ExampleInfo[];
  /** Total number of examples extracted */
  totalExamples: number;
  /** Number of JSDoc examples */
  jsdocExamples: number;
  /** Number of usage examples */
  usageExamples: number;
  /** Number of test examples */
  testExamples: number;
  /** Number of valid examples */
  validExamples: number;
  /** Number of invalid examples */
  invalidExamples: number;
  /** Extraction metadata */
  metadata: {
    /** Files processed */
    filesProcessed: number;
    /** Total lines processed */
    totalLines: number;
    /** Extraction time in milliseconds */
    extractionTime: number;
  };
}

/**
 * Example extraction options
 */
export interface ExampleExtractionOptions {
  /** Include JSDoc examples */
  includeJSDoc: boolean;
  /** Include usage examples */
  includeUsage: boolean;
  /** Include test examples */
  includeTest: boolean;
  /** Include demo examples */
  includeDemo: boolean;
  /** Validate example syntax */
  validateSyntax: boolean;
  /** Extract example output */
  extractOutput: boolean;
  /** Extract example metadata */
  extractMetadata: boolean;
  /** Custom example types to extract */
  customTypes: string[];
}

/**
 * Example Extractor class
 * 
 * Provides comprehensive example extraction and analysis capabilities
 */
export class ExampleExtractor {
  private options: ExampleExtractionOptions;

  constructor(options: Partial<ExampleExtractionOptions> = {}) {
    this.options = {
      includeJSDoc: true,
      includeUsage: true,
      includeTest: false,
      includeDemo: true,
      validateSyntax: true,
      extractOutput: true,
      extractMetadata: true,
      customTypes: [],
      ...options
    };
  }

  /**
   * Extract examples from AST nodes
   * 
   * @param nodes - AST nodes to extract examples from
   * @returns Example extraction result
   */
  public extractFromNodes(nodes: ASTNode[]): ExampleExtractionResult {
    const startTime = Date.now();
    const examples: ExampleInfo[] = [];
    let filesProcessed = 0;
    let totalLines = 0;

    for (const node of nodes) {
      const nodeExamples = this.extractFromNode(node);
      examples.push(...nodeExamples);
      
      if (node.filePath) {
        filesProcessed++;
        totalLines += this.getNodeLineCount(node);
      }
    }

    const jsdocExamples = examples.filter(e => e.type === 'jsdoc').length;
    const usageExamples = examples.filter(e => e.type === 'usage').length;
    const testExamples = examples.filter(e => e.type === 'test').length;
    const validExamples = examples.filter(e => e.isValid).length;
    const invalidExamples = examples.length - validExamples;

    return {
      examples,
      totalExamples: examples.length,
      jsdocExamples,
      usageExamples,
      testExamples,
      validExamples,
      invalidExamples,
      metadata: {
        filesProcessed,
        totalLines,
        extractionTime: Math.max(1, Date.now() - startTime)
      }
    };
  }

  /**
   * Extract examples from a single AST node
   * 
   * @param node - AST node to extract examples from
   * @returns Array of example information
   */
  public extractFromNode(node: ASTNode): ExampleInfo[] {
    const examples: ExampleInfo[] = [];

    // Extract JSDoc examples
    if (this.options.includeJSDoc) {
      const jsdocExamples = this.extractJSDocExamples(node);
      examples.push(...jsdocExamples);
    }

    // Extract usage examples
    if (this.options.includeUsage) {
      const usageExamples = this.extractUsageExamples(node);
      examples.push(...usageExamples);
    }

    // Extract test examples
    if (this.options.includeTest) {
      const testExamples = this.extractTestExamples(node);
      examples.push(...testExamples);
    }

    // Extract examples from child nodes
    for (const child of node.children) {
      const childExamples = this.extractFromNode(child);
      examples.push(...childExamples);
    }

    return examples;
  }

  /**
   * Extract JSDoc examples from node
   * 
   * @param node - AST node
   * @returns Array of JSDoc examples
   */
  private extractJSDocExamples(node: ASTNode): ExampleInfo[] {
    const examples: ExampleInfo[] = [];

    if (node.properties && node.properties['jsDocComments']) {
      const jsDocComments = node.properties['jsDocComments'] as string[];
      
      for (const comment of jsDocComments) {
        const exampleMatches = this.findExampleTags(comment);
        
        for (const match of exampleMatches) {
          const example = this.parseJSDocExample(match, node);
          if (example && this.shouldIncludeExample(example)) {
            examples.push(example);
          }
        }
      }
    }

    return examples;
  }

  /**
   * Find @example tags in JSDoc comment
   * 
   * @param comment - JSDoc comment text
   * @returns Array of example matches
   */
  private findExampleTags(comment: string): string[] {
    const exampleRegex = /@example\s*(?:\{([^}]+)\})?\s*(.*?)(?=@\w+|\*\/|$)/gs;
    const matches: string[] = [];
    let match;

    while ((match = exampleRegex.exec(comment)) !== null) {
      const language = match[1] || 'typescript';
      let code = match[2]?.trim();
      
      if (code && !code.endsWith('*/')) {
        // Clean up JSDoc comment markers
        code = code.replace(/^\s*\*\s?/gm, '').trim();
        matches.push(`${language}:${code}`);
      }
    }

    return matches;
  }

  /**
   * Parse JSDoc example
   * 
   * @param exampleMatch - Example match string
   * @param node - AST node
   * @returns Parsed example information
   */
  private parseJSDocExample(exampleMatch: string, node: ASTNode): ExampleInfo | null {
    const [language, ...codeParts] = exampleMatch.split(':');
    const code = codeParts.join(':').trim();
    
    if (!code) {
      return null;
    }

    const languageEnum = this.determineLanguage(language || 'typescript');
    const errors: string[] = [];
    let isValid = true;

    // Validate syntax if enabled
    if (this.options.validateSyntax) {
      isValid = this.validateExampleSyntax(code, languageEnum, errors);
    }

    return {
      id: this.generateExampleId(node.id, 'jsdoc'),
      title: `${node.name} Example`,
      description: `JSDoc example for ${node.name}`,
      type: 'jsdoc',
      language: languageEnum,
      code,
      metadata: {
        source: 'jsdoc',
        nodeId: node.id,
        nodeName: node.name
      },
      filePath: node.filePath,
      start: node.start,
      end: node.end,
      lineNumber: this.calculateLineNumber(node.start),
      isValid,
      errors
    };
  }

  /**
   * Extract usage examples from node
   * 
   * @param node - AST node
   * @returns Array of usage examples
   */
  private extractUsageExamples(node: ASTNode): ExampleInfo[] {
    const examples: ExampleInfo[] = [];

    // Look for usage patterns in node properties
    if (node.properties && node.properties['usageExamples']) {
      const usageExamples = node.properties['usageExamples'] as any[];
      
      for (const usage of usageExamples) {
        const example = this.parseUsageExample(usage, node);
        if (example && this.shouldIncludeExample(example)) {
          examples.push(example);
        }
      }
    }

    return examples;
  }

  /**
   * Parse usage example
   * 
   * @param usage - Usage example data
   * @param node - AST node
   * @returns Parsed example information
   */
  private parseUsageExample(usage: any, node: ASTNode): ExampleInfo | null {
    if (!usage || !usage.code) {
      return null;
    }

    const language = this.determineLanguage(usage.language || 'typescript');
    const errors: string[] = [];
    let isValid = true;

    // Validate syntax if enabled
    if (this.options.validateSyntax) {
      isValid = this.validateExampleSyntax(usage.code, language, errors);
    }

    return {
      id: this.generateExampleId(node.id, 'usage'),
      title: usage.title || `${node.name} Usage`,
      description: usage.description || `Usage example for ${node.name}`,
      type: 'usage',
      language,
      code: usage.code,
      output: usage.output,
      metadata: {
        source: 'usage',
        nodeId: node.id,
        nodeName: node.name,
        ...usage.metadata
      },
      filePath: node.filePath,
      start: node.start,
      end: node.end,
      lineNumber: this.calculateLineNumber(node.start),
      isValid,
      errors
    };
  }

  /**
   * Extract test examples from node
   * 
   * @param node - AST node
   * @returns Array of test examples
   */
  private extractTestExamples(node: ASTNode): ExampleInfo[] {
    const examples: ExampleInfo[] = [];

    // Look for test patterns in node properties
    if (node.properties && node.properties['testExamples']) {
      const testExamples = node.properties['testExamples'] as any[];
      
      for (const test of testExamples) {
        const example = this.parseTestExample(test, node);
        if (example && this.shouldIncludeExample(example)) {
          examples.push(example);
        }
      }
    }

    return examples;
  }

  /**
   * Parse test example
   * 
   * @param test - Test example data
   * @param node - AST node
   * @returns Parsed example information
   */
  private parseTestExample(test: any, node: ASTNode): ExampleInfo | null {
    if (!test || !test.code) {
      return null;
    }

    const language = this.determineLanguage(test.language || 'typescript');
    const errors: string[] = [];
    let isValid = true;

    // Validate syntax if enabled
    if (this.options.validateSyntax) {
      isValid = this.validateExampleSyntax(test.code, language, errors);
    }

    return {
      id: this.generateExampleId(node.id, 'test'),
      title: test.title || `${node.name} Test`,
      description: test.description || `Test example for ${node.name}`,
      type: 'test',
      language,
      code: test.code,
      output: test.output,
      metadata: {
        source: 'test',
        nodeId: node.id,
        nodeName: node.name,
        ...test.metadata
      },
      filePath: node.filePath,
      start: node.start,
      end: node.end,
      lineNumber: this.calculateLineNumber(node.start),
      isValid,
      errors
    };
  }

  /**
   * Determine example language
   * 
   * @param language - Language string
   * @returns Example language enum
   */
  private determineLanguage(language: string): ExampleLanguage {
    const normalizedLang = language.toLowerCase().trim();
    
    switch (normalizedLang) {
      case 'ts':
      case 'typescript':
        return 'typescript';
      case 'js':
      case 'javascript':
        return 'javascript';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'sh':
      case 'bash':
      case 'shell':
        return 'bash';
      case 'sql':
        return 'sql';
      default:
        return 'unknown';
    }
  }

  /**
   * Validate example syntax
   * 
   * @param code - Example code
   * @param language - Example language
   * @param errors - Array to collect validation errors
   * @returns Whether example syntax is valid
   */
  private validateExampleSyntax(code: string, language: ExampleLanguage, errors: string[]): boolean {
    let isValid = true;

    // Basic validation based on language
    switch (language) {
      case 'typescript':
      case 'javascript':
        isValid = this.validateJavaScriptSyntax(code, errors);
        break;
      case 'json':
        isValid = this.validateJsonSyntax(code, errors);
        break;
      case 'html':
        isValid = this.validateHtmlSyntax(code, errors);
        break;
      case 'css':
        isValid = this.validateCssSyntax(code, errors);
        break;
      default:
        // For unknown languages, just check for basic structure
        isValid = code.trim().length > 0;
        if (!isValid) {
          errors.push('Empty example code');
        }
    }

    return isValid;
  }

  /**
   * Validate JavaScript/TypeScript syntax
   * 
   * @param code - Code to validate
   * @param errors - Array to collect errors
   * @returns Whether syntax is valid
   */
  private validateJavaScriptSyntax(code: string, errors: string[]): boolean {
    // Basic JavaScript syntax validation
    const lines = code.split('\n');
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      for (const char of line) {
        switch (char) {
          case '{':
            braceCount++;
            break;
          case '}':
            braceCount--;
            break;
          case '(':
            parenCount++;
            break;
          case ')':
            parenCount--;
            break;
          case '[':
            bracketCount++;
            break;
          case ']':
            bracketCount--;
            break;
        }
      }
    }

    if (braceCount !== 0) {
      errors.push('Unmatched braces in JavaScript code');
      return false;
    }

    if (parenCount !== 0) {
      errors.push('Unmatched parentheses in JavaScript code');
      return false;
    }

    if (bracketCount !== 0) {
      errors.push('Unmatched brackets in JavaScript code');
      return false;
    }

    return true;
  }

  /**
   * Validate JSON syntax
   * 
   * @param code - Code to validate
   * @param errors - Array to collect errors
   * @returns Whether syntax is valid
   */
  private validateJsonSyntax(code: string, errors: string[]): boolean {
    try {
      JSON.parse(code);
      return true;
    } catch (error) {
      errors.push(`Invalid JSON syntax: ${error}`);
      return false;
    }
  }

  /**
   * Validate HTML syntax
   * 
   * @param code - Code to validate
   * @param errors - Array to collect errors
   * @returns Whether syntax is valid
   */
  private validateHtmlSyntax(code: string, errors: string[]): boolean {
    // Basic HTML validation - check for balanced tags
    const tagRegex = /<\/?[^>]+>/g;
    const tags = code.match(tagRegex) || [];
    const openTags: string[] = [];

    for (const tag of tags) {
      if (tag.startsWith('</')) {
        // Closing tag
        const tagName = tag.slice(2, -1);
        const lastOpenTag = openTags.pop();
        if (lastOpenTag !== tagName) {
          errors.push(`Unmatched HTML tag: ${tag}`);
          return false;
        }
      } else if (!tag.endsWith('/>')) {
        // Opening tag (not self-closing)
        const tagName = tag.slice(1, -1).split(' ')[0];
        if (tagName) {
          openTags.push(tagName);
        }
      }
    }

    if (openTags.length > 0) {
      errors.push(`Unclosed HTML tags: ${openTags.join(', ')}`);
      return false;
    }

    return true;
  }

  /**
   * Validate CSS syntax
   * 
   * @param code - Code to validate
   * @param errors - Array to collect errors
   * @returns Whether syntax is valid
   */
  private validateCssSyntax(code: string, errors: string[]): boolean {
    // Basic CSS validation - check for balanced braces
    let braceCount = 0;

    for (const char of code) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
      }
    }

    if (braceCount !== 0) {
      errors.push('Unmatched braces in CSS code');
      return false;
    }

    return true;
  }

  /**
   * Generate example ID
   * 
   * @param nodeId - Node ID
   * @param type - Example type
   * @returns Generated example ID
   */
  private generateExampleId(nodeId: string, type: string): string {
    return `${nodeId}-${type}-${Date.now()}`;
  }

  /**
   * Check if example should be included based on options
   * 
   * @param example - Example information
   * @returns Whether example should be included
   */
  private shouldIncludeExample(example: ExampleInfo): boolean {
    // Check if example type is enabled
    switch (example.type) {
      case 'jsdoc':
        return this.options.includeJSDoc;
      case 'usage':
        return this.options.includeUsage;
      case 'test':
        return this.options.includeTest;
      case 'demo':
        return this.options.includeDemo;
      default:
        return this.options.customTypes.includes(example.type);
    }
  }

  /**
   * Calculate line number from position
   * 
   * @param position - Character position
   * @returns Line number
   */
  private calculateLineNumber(position: number): number {
    return Math.floor(position / 80) + 1; // Approximate
  }

  /**
   * Get line count for a node
   * 
   * @param node - AST node
   * @returns Number of lines
   */
  private getNodeLineCount(node: ASTNode): number {
    return Math.max(1, Math.floor((node.end - node.start) / 80));
  }

  /**
   * Update extraction options
   * 
   * @param options - New options to merge
   */
  public updateOptions(options: Partial<ExampleExtractionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current extraction options
   * 
   * @returns Current options
   */
  public getOptions(): ExampleExtractionOptions {
    return { ...this.options };
  }
}

/**
 * JSDoc Extractor for extracting and parsing JSDoc comments from TypeScript/JavaScript files
 * 
 * This module provides comprehensive JSDoc extraction capabilities including:
 * - JSDoc comment extraction from AST nodes
 * - JSDoc tag parsing (@param, @returns, @throws, etc.)
 * - Documentation structure analysis
 * - Type information extraction from JSDoc
 */

import { ASTNode } from '../../types/core';

/**
 * JSDoc tag types
 */
export type JSDocTagType = 
  | 'param'
  | 'returns'
  | 'throws'
  | 'deprecated'
  | 'since'
  | 'version'
  | 'author'
  | 'example'
  | 'see'
  | 'todo'
  | 'description'
  | 'summary'
  | 'default'
  | 'readonly'
  | 'private'
  | 'protected'
  | 'public'
  | 'static'
  | 'abstract'
  | 'override'
  | 'internal'
  | 'beta'
  | 'experimental'
  | 'ignore'
  | 'typedef'
  | 'callback'
  | 'template'
  | 'generic'
  | 'extends'
  | 'implements'
  | 'augments'
  | 'class'
  | 'constructor'
  | 'method'
  | 'property'
  | 'member'
  | 'memberof'
  | 'name'
  | 'kind'
  | 'lends'
  | 'this'
  | 'yields'
  | 'yield';

/**
 * JSDoc tag information
 */
export interface JSDocTag {
  /** Tag type */
  type: JSDocTagType;
  /** Tag name (for named tags like @param) */
  name?: string | undefined;
  /** Tag description */
  description: string;
  /** Tag type information */
  typeInfo?: string | undefined;
  /** Tag metadata */
  metadata: Record<string, unknown>;
}

/**
 * JSDoc comment information
 */
export interface JSDocComment {
  /** Full JSDoc comment text */
  fullText: string;
  /** Description text (main description) */
  description: string;
  /** Summary text (first line) */
  summary: string;
  /** All JSDoc tags */
  tags: JSDocTag[];
  /** Start position in source */
  start: number;
  /** End position in source */
  end: number;
  /** Line number where JSDoc starts */
  lineNumber: number;
  /** Whether JSDoc is properly formatted */
  isValid: boolean;
  /** JSDoc parsing errors */
  errors: string[];
}

/**
 * JSDoc extraction result
 */
export interface JSDocExtractionResult {
  /** Extracted JSDoc comments */
  comments: JSDocComment[];
  /** Total number of comments extracted */
  totalComments: number;
  /** Number of valid JSDoc comments */
  validComments: number;
  /** Number of invalid JSDoc comments */
  invalidComments: number;
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
 * JSDoc extraction options
 */
export interface JSDocExtractionOptions {
  /** Include private JSDoc comments */
  includePrivate: boolean;
  /** Include deprecated JSDoc comments */
  includeDeprecated: boolean;
  /** Include experimental JSDoc comments */
  includeExperimental: boolean;
  /** Include internal JSDoc comments */
  includeInternal: boolean;
  /** Validate JSDoc syntax */
  validateSyntax: boolean;
  /** Extract type information from JSDoc */
  extractTypes: boolean;
  /** Extract examples from JSDoc */
  extractExamples: boolean;
  /** Custom tag types to extract */
  customTags: string[];
}

/**
 * JSDoc Extractor class
 * 
 * Provides comprehensive JSDoc extraction and parsing capabilities
 */
export class JSDocExtractor {
  private options: JSDocExtractionOptions;

  constructor(options: Partial<JSDocExtractionOptions> = {}) {
    this.options = {
      includePrivate: false,
      includeDeprecated: true,
      includeExperimental: true,
      includeInternal: false,
      validateSyntax: true,
      extractTypes: true,
      extractExamples: true,
      customTags: [],
      ...options
    };
  }

  /**
   * Extract JSDoc comments from AST nodes
   * 
   * @param nodes - AST nodes to extract JSDoc from
   * @returns JSDoc extraction result
   */
  public extractFromNodes(nodes: ASTNode[]): JSDocExtractionResult {
    const startTime = Date.now();
    const comments: JSDocComment[] = [];
    let filesProcessed = 0;
    let totalLines = 0;

    for (const node of nodes) {
      const nodeComments = this.extractFromNode(node);
      comments.push(...nodeComments);
      
      if (node.filePath) {
        filesProcessed++;
        totalLines += this.getNodeLineCount(node);
      }
    }

    const validComments = comments.filter(c => c.isValid).length;
    const invalidComments = comments.length - validComments;
    const endTime = Date.now();

    return {
      comments,
      totalComments: comments.length,
      validComments,
      invalidComments,
      metadata: {
        filesProcessed,
        totalLines,
        extractionTime: Math.max(1, endTime - startTime) // Ensure at least 1ms
      }
    };
  }

  /**
   * Extract JSDoc comments from a single AST node
   * 
   * @param node - AST node to extract JSDoc from
   * @returns Array of JSDoc comments
   */
  public extractFromNode(node: ASTNode): JSDocComment[] {
    const comments: JSDocComment[] = [];

    // Extract JSDoc from node properties
    if (node.properties && node.properties['jsDocComments']) {
      const jsDocComments = node.properties['jsDocComments'] as string[];
      for (const commentText of jsDocComments) {
        const comment = this.parseJSDocComment(commentText, node.start, node.end);
        if (this.shouldIncludeComment(comment)) {
          comments.push(comment);
        }
      }
    }

    // Extract JSDoc from child nodes
    for (const child of node.children) {
      const childComments = this.extractFromNode(child);
      comments.push(...childComments);
    }

    return comments;
  }

  /**
   * Parse a JSDoc comment string
   * 
   * @param commentText - Raw JSDoc comment text
   * @param start - Start position in source
   * @param end - End position in source
   * @returns Parsed JSDoc comment
   */
  public parseJSDocComment(commentText: string, start: number, end: number): JSDocComment {
    const errors: string[] = [];
    let isValid = true;

    // Clean up comment text
    const cleanedText = this.cleanJSDocText(commentText);
    
    // Extract description and summary
    const { description, summary } = this.extractDescription(cleanedText);
    
    // Extract tags
    const tags = this.extractTags(cleanedText, errors);
    
    // Validate JSDoc syntax if enabled
    if (this.options.validateSyntax) {
      isValid = this.validateJSDocSyntax(cleanedText, errors);
    }

    return {
      fullText: commentText,
      description,
      summary,
      tags,
      start,
      end,
      lineNumber: this.calculateLineNumber(start),
      isValid,
      errors
    };
  }

  /**
   * Clean JSDoc comment text by removing comment markers
   * 
   * @param text - Raw comment text
   * @returns Cleaned comment text
   */
  private cleanJSDocText(text: string): string {
    return text
      .replace(/^\s*\/\*\*\s*\n?/, '') // Remove opening /** and optional newline
      .replace(/\s*\*\/\s*$/, '') // Remove closing */
      .replace(/^\s*\*\s?/gm, '') // Remove leading * from each line
      .replace(/^\s*\n/gm, '') // Remove empty lines
      .trim();
  }

  /**
   * Extract description and summary from JSDoc text
   * 
   * @param text - Cleaned JSDoc text
   * @returns Description and summary
   */
  private extractDescription(text: string): { description: string; summary: string } {
    const lines = text.split('\n');
    const descriptionLines: string[] = [];
    
    for (const line of lines) {
      // Stop at first tag
      if (line.trim().startsWith('@')) {
        break;
      }
      descriptionLines.push(line.trim());
    }
    
    const description = descriptionLines.join(' ').trim();
    const summary = descriptionLines[0] || '';
    
    return { description, summary };
  }

  /**
   * Extract JSDoc tags from text
   * 
   * @param text - Cleaned JSDoc text
   * @param errors - Array to collect parsing errors
   * @returns Array of parsed JSDoc tags
   */
  private extractTags(text: string, errors: string[]): JSDocTag[] {
    const tags: JSDocTag[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      
      if (line.startsWith('@')) {
        try {
          const tag = this.parseTag(line);
          if (tag) {
            tags.push(tag);
          }
        } catch (error) {
          errors.push(`Error parsing tag at line ${i + 1}: ${error}`);
        }
      }
    }
    
    return tags;
  }

  /**
   * Parse a single JSDoc tag
   * 
   * @param line - Line containing the tag
   * @returns Parsed JSDoc tag
   */
  private parseTag(line: string): JSDocTag | null {
    const tagMatch = line.match(/^@(\w+)(?:\s+(.+))?$/);
    if (!tagMatch) {
      return null;
    }
    
    const [, tagType, content] = tagMatch;
    const tagTypeEnum = tagType as JSDocTagType;
    
    // Parse tag content based on tag type
    let name: string | undefined;
    let description: string;
    let typeInfo: string | undefined;
    
    if (tagTypeEnum === 'param' && content) {
      // Match: {type} name description (handle nested braces)
      const typeFirstMatch = content.match(/^\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\s+(\w+)(?:\s+(.+))?$/);
      if (typeFirstMatch) {
        typeInfo = typeFirstMatch[1];
        name = typeFirstMatch[2];
        description = typeFirstMatch[3] || '';
      } else {
        // Match: name {type} description (handle nested braces)
        const nameFirstMatch = content.match(/^(\w+)(?:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?(?:\s+(.+))?$/);
        if (nameFirstMatch) {
          name = nameFirstMatch[1];
          typeInfo = nameFirstMatch[2];
          description = nameFirstMatch[3] || '';
        } else {
          // Try simpler pattern: just name description
          const simpleMatch = content.match(/^(\w+)\s+(.+)$/);
          if (simpleMatch) {
            name = simpleMatch[1];
            description = simpleMatch[2] || '';
          } else {
            description = content;
          }
        }
      }
    } else if (tagTypeEnum === 'returns' && content) {
      const returnsMatch = content.match(/^(?:\{([^}]+)\})?(?:\s+(.+))?$/);
      if (returnsMatch) {
        typeInfo = returnsMatch[1];
        description = returnsMatch[2] || '';
      } else {
        description = content;
      }
    } else {
      description = content || '';
    }
    
    return {
      type: tagTypeEnum,
      name: name || undefined,
      description,
      typeInfo: typeInfo || undefined,
      metadata: {}
    };
  }

  /**
   * Validate JSDoc syntax
   * 
   * @param text - Cleaned JSDoc text
   * @param errors - Array to collect validation errors
   * @returns Whether JSDoc syntax is valid
   */
  private validateJSDocSyntax(text: string, errors: string[]): boolean {
    let isValid = true;
    
    // Check for proper JSDoc structure
    if (!text.trim()) {
      errors.push('Empty JSDoc comment');
      isValid = false;
    }
    
    // Check for common syntax issues
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      // Check for malformed tags
      if (line.includes('@') && !line.match(/^@\w+/)) {
        errors.push(`Malformed tag at line ${i + 1}: ${line}`);
        isValid = false;
      }
      
      // Check for invalid tag syntax
      if (line.startsWith('@') && !line.match(/^@\w+(?:\s|$)/)) {
        errors.push(`Invalid tag syntax at line ${i + 1}: ${line}`);
        isValid = false;
      }
    }
    
    return isValid;
  }

  /**
   * Check if comment should be included based on options
   * 
   * @param comment - JSDoc comment to check
   * @returns Whether comment should be included
   */
  private shouldIncludeComment(comment: JSDocComment): boolean {
    // Check for private comments
    if (!this.options.includePrivate && comment.tags.some(t => t.type === 'private')) {
      return false;
    }
    
    // Check for deprecated comments
    if (!this.options.includeDeprecated && comment.tags.some(t => t.type === 'deprecated')) {
      return false;
    }
    
    // Check for experimental comments
    if (!this.options.includeExperimental && comment.tags.some(t => t.type === 'experimental')) {
      return false;
    }
    
    // Check for internal comments
    if (!this.options.includeInternal && comment.tags.some(t => t.type === 'internal')) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate line number from position
   * 
   * @param position - Character position
   * @returns Line number
   */
  private calculateLineNumber(position: number): number {
    // This is a simplified calculation - in a real implementation,
    // you'd need access to the source file to count newlines
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
  public updateOptions(options: Partial<JSDocExtractionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current extraction options
   * 
   * @returns Current options
   */
  public getOptions(): JSDocExtractionOptions {
    return { ...this.options };
  }
}

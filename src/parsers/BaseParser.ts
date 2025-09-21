/**
 * Abstract base parser class
 */

import { ASTNode, Relation, FileInfo, ASTNodeType, RelationType } from '../types';
import { ParsingOptions } from '../types/options';

/**
 * Parser result interface
 */
export interface ParserResult {
  /** Parsed AST nodes */
  nodes: ASTNode[];
  /** Relationships between nodes */
  relations: Relation[];
  /** Parsing metadata */
  metadata: {
    /** File that was parsed */
    file: FileInfo;
    /** Parsing time in milliseconds */
    parsingTime: number;
    /** Number of nodes parsed */
    nodeCount: number;
    /** Number of relations found */
    relationCount: number;
    /** Parser version */
    parserVersion: string;
  };
}

/**
 * Abstract base parser class
 */
export abstract class BaseParser {
  protected options: ParsingOptions;
  protected parserVersion: string;

  constructor(options: ParsingOptions, parserVersion: string = '1.0.0') {
    this.options = options;
    this.parserVersion = parserVersion;
  }

  /**
   * Parse file and return AST nodes and relations
   */
  abstract parseFile(file: FileInfo): Promise<ParserResult>;

  /**
   * Check if parser can handle the file
   */
  abstract canParse(file: FileInfo): boolean;

  /**
   * Get parser name
   */
  abstract getParserName(): string;

  /**
   * Get supported file extensions
   */
  abstract getSupportedExtensions(): string[];

  /**
   * Validate file before parsing
   */
  protected validateFile(file: FileInfo): void {
    if (!file.path) {
      throw new Error('File path is required');
    }

    if (!this.canParse(file)) {
      throw new Error(`Parser ${this.getParserName()} cannot parse file: ${file.path}`);
    }
  }

  /**
   * Create AST node
   */
  protected createASTNode(
    id: string,
    name: string,
    type: string,
    nodeType: string,
    filePath: string,
    start: number,
    end: number,
    metadata: Record<string, unknown> = {},
    properties: Record<string, unknown> = {}
  ): ASTNode {
    return {
      id,
      name,
      type,
      nodeType: nodeType as ASTNodeType,
      filePath,
      start,
      end,
      children: [],
      metadata,
      properties,
    };
  }

  /**
   * Create relation
   */
  protected createRelation(
    id: string,
    type: string,
    from: string,
    to: string,
    metadata: Record<string, unknown> = {}
  ): Relation {
    return {
      id,
      type: type as RelationType,
      from,
      to,
      metadata,
    };
  }

  /**
   * Extract name from text
   */
  protected extractName(text: string, prefix: string): string {
    const withoutPrefix = text.substring(prefix.length);
    const nameMatch = withoutPrefix.match(/^(\w+)/);
    return nameMatch?.[1] ?? 'unknown';
  }

  /**
   * Calculate parsing time
   */
  protected calculateParsingTime(startTime: number): number {
    return Date.now() - startTime;
  }

  /**
   * Get parser options
   */
  getOptions(): ParsingOptions {
    return { ...this.options };
  }

  /**
   * Update parser options
   */
  updateOptions(options: Partial<ParsingOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

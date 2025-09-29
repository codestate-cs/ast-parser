/**
 * Type Extractor for extracting and analyzing TypeScript type information
 * 
 * This module provides comprehensive type extraction capabilities including:
 * - TypeScript type information extraction from AST nodes
 * - Complex type parsing (generics, unions, intersections, etc.)
 * - Type documentation and metadata extraction
 * - Type relationship analysis
 */

import { ASTNode } from '../../types/core';

/**
 * TypeScript type kinds
 */
export type TypeKind = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'any'
  | 'unknown'
  | 'never'
  | 'void'
  | 'null'
  | 'undefined'
  | 'object'
  | 'array'
  | 'function'
  | 'class'
  | 'interface'
  | 'enum'
  | 'union'
  | 'intersection'
  | 'generic'
  | 'literal'
  | 'mapped'
  | 'conditional'
  | 'template'
  | 'indexed'
  | 'keyof'
  | 'typeof'
  | 'infer'
  | 'import'
  | 'export'
  | 'namespace'
  | 'module'
  | 'unknown';

/**
 * Type parameter information
 */
export interface TypeParameter {
  /** Parameter name */
  name: string;
  /** Parameter constraint */
  constraint?: string;
  /** Default type */
  defaultType?: string;
  /** Parameter documentation */
  documentation?: string;
}

/**
 * Type property information
 */
export interface TypeProperty {
  /** Property name */
  name: string;
  /** Property type */
  type: string;
  /** Whether property is optional */
  optional: boolean;
  /** Whether property is readonly */
  readonly: boolean;
  /** Property documentation */
  documentation?: string;
  /** Property metadata */
  metadata: Record<string, unknown>;
}

/**
 * Type method information
 */
export interface TypeMethod {
  /** Method name */
  name: string;
  /** Method signature */
  signature: string;
  /** Return type */
  returnType: string;
  /** Method parameters */
  parameters: TypeParameter[];
  /** Whether method is optional */
  optional: boolean;
  /** Whether method is static */
  static: boolean;
  /** Whether method is abstract */
  abstract: boolean;
  /** Method documentation */
  documentation?: string;
  /** Method metadata */
  metadata: Record<string, unknown>;
}

/**
 * Type information structure
 */
export interface TypeInfo {
  /** Type name */
  name: string;
  /** Type kind */
  kind: TypeKind;
  /** Type definition */
  definition: string;
  /** Type parameters (for generics) */
  typeParameters: TypeParameter[];
  /** Type properties */
  properties: TypeProperty[];
  /** Type methods */
  methods: TypeMethod[];
  /** Type documentation */
  documentation?: string | undefined;
  /** Type metadata */
  metadata: Record<string, unknown>;
  /** File path where type is defined */
  filePath: string;
  /** Start position in file */
  start: number;
  /** End position in file */
  end: number;
  /** Line number where type starts */
  lineNumber: number;
  /** Whether type is exported */
  exported: boolean;
  /** Whether type is public */
  public: boolean;
  /** Type dependencies */
  dependencies: string[];
}

/**
 * Type extraction result
 */
export interface TypeExtractionResult {
  /** Extracted type information */
  types: TypeInfo[];
  /** Total number of types extracted */
  totalTypes: number;
  /** Number of interfaces */
  interfaceCount: number;
  /** Number of classes */
  classCount: number;
  /** Number of enums */
  enumCount: number;
  /** Number of type aliases */
  typeAliasCount: number;
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
 * Type extraction options
 */
export interface TypeExtractionOptions {
  /** Include private types */
  includePrivate: boolean;
  /** Include internal types */
  includeInternal: boolean;
  /** Include deprecated types */
  includeDeprecated: boolean;
  /** Extract type documentation */
  extractDocumentation: boolean;
  /** Extract type metadata */
  extractMetadata: boolean;
  /** Extract type dependencies */
  extractDependencies: boolean;
  /** Include built-in types */
  includeBuiltIn: boolean;
  /** Custom type kinds to extract */
  customTypeKinds: string[];
}

/**
 * Type Extractor class
 * 
 * Provides comprehensive type extraction and analysis capabilities
 */
export class TypeExtractor {
  private options: TypeExtractionOptions;

  constructor(options: Partial<TypeExtractionOptions> = {}) {
    this.options = {
      includePrivate: false,
      includeInternal: false,
      includeDeprecated: true,
      extractDocumentation: true,
      extractMetadata: true,
      extractDependencies: true,
      includeBuiltIn: false,
      customTypeKinds: [],
      ...options
    };
  }

  /**
   * Extract type information from AST nodes
   * 
   * @param nodes - AST nodes to extract types from
   * @returns Type extraction result
   */
  public extractFromNodes(nodes: ASTNode[]): TypeExtractionResult {
    const startTime = Date.now();
    const types: TypeInfo[] = [];
    let filesProcessed = 0;
    let totalLines = 0;

    for (const node of nodes) {
      const nodeTypes = this.extractFromNode(node);
      types.push(...nodeTypes);
      
      if (node.filePath) {
        filesProcessed++;
        totalLines += this.getNodeLineCount(node);
      }
    }

    const interfaceCount = types.filter(t => t.kind === 'interface').length;
    const classCount = types.filter(t => t.kind === 'class').length;
    const enumCount = types.filter(t => t.kind === 'enum').length;
    const typeAliasCount = types.filter(t => t.kind === 'generic').length;

    return {
      types,
      totalTypes: types.length,
      interfaceCount,
      classCount,
      enumCount,
      typeAliasCount,
      metadata: {
        filesProcessed,
        totalLines,
        extractionTime: Math.max(1, Date.now() - startTime)
      }
    };
  }

  /**
   * Extract type information from a single AST node
   * 
   * @param node - AST node to extract types from
   * @returns Array of type information
   */
  public extractFromNode(node: ASTNode): TypeInfo[] {
    const types: TypeInfo[] = [];

    // Extract type information from node properties
    if (node.properties && node.properties['typeInfo']) {
      const typeInfo = node.properties['typeInfo'] as any;
      const extractedType = this.parseTypeInfo(typeInfo, node);
      if (extractedType && this.shouldIncludeType(extractedType)) {
        types.push(extractedType);
      }
    }

    // Extract types from child nodes
    for (const child of node.children) {
      const childTypes = this.extractFromNode(child);
      types.push(...childTypes);
    }

    return types;
  }

  /**
   * Parse type information from node properties
   * 
   * @param typeInfo - Raw type information
   * @param node - AST node
   * @returns Parsed type information
   */
  private parseTypeInfo(typeInfo: any, node: ASTNode): TypeInfo | null {
    if (!typeInfo || typeof typeInfo !== 'object') {
      return null;
    }

    const name = typeInfo.name || node.name || 'unknown';
    const kind = this.determineTypeKind(typeInfo, node);
    const definition = this.extractTypeDefinition(typeInfo);
    const typeParameters = this.extractTypeParameters(typeInfo);
    const properties = this.extractTypeProperties(typeInfo);
    const methods = this.extractTypeMethods(typeInfo);
    const documentation = this.extractTypeDocumentation(typeInfo);
    const metadata = this.extractTypeMetadata(typeInfo);
    const dependencies = this.extractTypeDependencies(typeInfo);

    return {
      name,
      kind,
      definition,
      typeParameters,
      properties,
      methods,
      documentation,
      metadata,
      filePath: node.filePath,
      start: node.start,
      end: node.end,
      lineNumber: this.calculateLineNumber(node.start),
      exported: this.isTypeExported(typeInfo, node),
      public: this.isTypePublic(typeInfo, node),
      dependencies
    };
  }

  /**
   * Determine the type kind from type information
   * 
   * @param typeInfo - Type information
   * @param node - AST node
   * @returns Type kind
   */
  private determineTypeKind(typeInfo: any, node: ASTNode): TypeKind {
    // Check node type first
    if (node.nodeType === 'interface') return 'interface';
    if (node.nodeType === 'class') return 'class';
    if (node.nodeType === 'enum') return 'enum';
    if (node.nodeType === 'type') return 'generic';

    // Check type info properties
    if (typeInfo.kind) {
      return typeInfo.kind as TypeKind;
    }

    // Check for specific patterns
    if (typeInfo.isInterface) return 'interface';
    if (typeInfo.isClass) return 'class';
    if (typeInfo.isEnum) return 'enum';
    if (typeInfo.isUnion) return 'union';
    if (typeInfo.isIntersection) return 'intersection';
    if (typeInfo.isGeneric) return 'generic';
    if (typeInfo.isLiteral) return 'literal';
    if (typeInfo.isFunction) return 'function';
    if (typeInfo.isArray) return 'array';
    if (typeInfo.isObject) return 'object';

    return 'unknown';
  }

  /**
   * Extract type definition string
   * 
   * @param typeInfo - Type information
   * @returns Type definition string
   */
  private extractTypeDefinition(typeInfo: any): string {
    if (typeInfo.definition) {
      return typeInfo.definition;
    }

    if (typeInfo.text) {
      return typeInfo.text;
    }

    if (typeInfo.type) {
      return typeInfo.type;
    }

    return 'unknown';
  }

  /**
   * Extract type parameters
   * 
   * @param typeInfo - Type information
   * @returns Array of type parameters
   */
  private extractTypeParameters(typeInfo: any): TypeParameter[] {
    if (!typeInfo.typeParameters || !Array.isArray(typeInfo.typeParameters)) {
      return [];
    }

    return typeInfo.typeParameters.map((param: any) => ({
      name: param.name || 'unknown',
      constraint: param.constraint,
      defaultType: param.defaultType,
      documentation: param.documentation
    }));
  }

  /**
   * Extract type properties
   * 
   * @param typeInfo - Type information
   * @returns Array of type properties
   */
  private extractTypeProperties(typeInfo: any): TypeProperty[] {
    if (!typeInfo.properties || !Array.isArray(typeInfo.properties)) {
      return [];
    }

    return typeInfo.properties.map((prop: any) => ({
      name: prop.name || 'unknown',
      type: prop.type || 'any',
      optional: prop.optional || false,
      readonly: prop.readonly || false,
      documentation: prop.documentation,
      metadata: prop.metadata || {}
    }));
  }

  /**
   * Extract type methods
   * 
   * @param typeInfo - Type information
   * @returns Array of type methods
   */
  private extractTypeMethods(typeInfo: any): TypeMethod[] {
    if (!typeInfo.methods || !Array.isArray(typeInfo.methods)) {
      return [];
    }

    return typeInfo.methods.map((method: any) => ({
      name: method.name || 'unknown',
      signature: method.signature || '() => any',
      returnType: method.returnType || 'any',
      parameters: method.parameters || [],
      optional: method.optional || false,
      static: method.static || false,
      abstract: method.abstract || false,
      documentation: method.documentation,
      metadata: method.metadata || {}
    }));
  }

  /**
   * Extract type documentation
   * 
   * @param typeInfo - Type information
   * @returns Type documentation
   */
  private extractTypeDocumentation(typeInfo: any): string | undefined {
    if (typeInfo.documentation) {
      return typeInfo.documentation;
    }

    if (typeInfo.comment) {
      return typeInfo.comment;
    }

    if (typeInfo.description) {
      return typeInfo.description;
    }

    return undefined;
  }

  /**
   * Extract type metadata
   * 
   * @param typeInfo - Type information
   * @returns Type metadata
   */
  private extractTypeMetadata(typeInfo: any): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    if (typeInfo.metadata) {
      Object.assign(metadata, typeInfo.metadata);
    }

    // Add common metadata
    if (typeInfo['isExported'] !== undefined) metadata['isExported'] = typeInfo['isExported'];
    if (typeInfo['isPublic'] !== undefined) metadata['isPublic'] = typeInfo['isPublic'];
    if (typeInfo['isPrivate'] !== undefined) metadata['isPrivate'] = typeInfo['isPrivate'];
    if (typeInfo['isProtected'] !== undefined) metadata['isProtected'] = typeInfo['isProtected'];
    if (typeInfo['isStatic'] !== undefined) metadata['isStatic'] = typeInfo['isStatic'];
    if (typeInfo['isAbstract'] !== undefined) metadata['isAbstract'] = typeInfo['isAbstract'];
    if (typeInfo['isReadonly'] !== undefined) metadata['isReadonly'] = typeInfo['isReadonly'];
    if (typeInfo['isOptional'] !== undefined) metadata['isOptional'] = typeInfo['isOptional'];

    return metadata;
  }

  /**
   * Extract type dependencies
   * 
   * @param typeInfo - Type information
   * @returns Array of dependency names
   */
  private extractTypeDependencies(typeInfo: any): string[] {
    if (!this.options.extractDependencies) {
      return [];
    }

    const dependencies: string[] = [];

    if (typeInfo.dependencies && Array.isArray(typeInfo.dependencies)) {
      dependencies.push(...typeInfo.dependencies);
    }

    if (typeInfo.imports && Array.isArray(typeInfo.imports)) {
      dependencies.push(...typeInfo.imports);
    }

    if (typeInfo.extends && Array.isArray(typeInfo.extends)) {
      dependencies.push(...typeInfo.extends);
    }

    if (typeInfo.implements && Array.isArray(typeInfo.implements)) {
      dependencies.push(...typeInfo.implements);
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Check if type is exported
   * 
   * @param typeInfo - Type information
   * @param node - AST node
   * @returns Whether type is exported
   */
  private isTypeExported(typeInfo: any, node: ASTNode): boolean {
    if (typeInfo.isExported !== undefined) {
      return typeInfo.isExported;
    }

    if (node.properties && node.properties['exported']) {
      return node.properties['exported'] as boolean;
    }

    return false;
  }

  /**
   * Check if type is public
   * 
   * @param typeInfo - Type information
   * @param node - AST node
   * @returns Whether type is public
   */
  private isTypePublic(typeInfo: any, _node: ASTNode): boolean {
    if (typeInfo.isPublic !== undefined) {
      return typeInfo.isPublic;
    }

    if (typeInfo.isPrivate) {
      return false;
    }

    if (typeInfo.isProtected) {
      return false;
    }

    return true;
  }

  /**
   * Check if type should be included based on options
   * 
   * @param typeInfo - Type information
   * @returns Whether type should be included
   */
  private shouldIncludeType(typeInfo: TypeInfo): boolean {
    // Check for private types
    if (!this.options.includePrivate && !typeInfo.public) {
      return false;
    }

    // Check for internal types
    if (!this.options.includeInternal && typeInfo.metadata['isInternal']) {
      return false;
    }

    // Check for deprecated types
    if (!this.options.includeDeprecated && typeInfo.metadata['isDeprecated']) {
      return false;
    }

    // Check for built-in types
    if (!this.options.includeBuiltIn && this.isBuiltInType(typeInfo.name)) {
      return false;
    }

    return true;
  }

  /**
   * Check if type is a built-in type
   * 
   * @param typeName - Type name
   * @returns Whether type is built-in
   */
  private isBuiltInType(typeName: string): boolean {
    const builtInTypes = [
      'string', 'number', 'boolean', 'any', 'unknown', 'never', 'void',
      'null', 'undefined', 'object', 'Array', 'Function', 'Date', 'RegExp',
      'Error', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet'
    ];

    return builtInTypes.includes(typeName);
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
  public updateOptions(options: Partial<TypeExtractionOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current extraction options
   * 
   * @returns Current options
   */
  public getOptions(): TypeExtractionOptions {
    return { ...this.options };
  }
}

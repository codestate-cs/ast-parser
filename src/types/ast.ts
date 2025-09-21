/**
 * AST-specific types and interfaces
 */

import { ASTNode } from './core';

/**
 * Decorator information
 */
export interface DecoratorInfo {
  name: string;
  arguments: unknown[];
  metadata: Record<string, unknown>;
}

/**
 * TypeScript-specific AST node types
 */
export type TypeScriptNodeType =
  | 'SourceFile'
  | 'ClassDeclaration'
  | 'InterfaceDeclaration'
  | 'FunctionDeclaration'
  | 'MethodDeclaration'
  | 'PropertyDeclaration'
  | 'VariableDeclaration'
  | 'TypeAliasDeclaration'
  | 'EnumDeclaration'
  | 'NamespaceDeclaration'
  | 'ModuleDeclaration'
  | 'ImportDeclaration'
  | 'ExportDeclaration'
  | 'ArrowFunction'
  | 'Constructor'
  | 'GetAccessor'
  | 'SetAccessor'
  | 'Parameter'
  | 'TypeParameter'
  | 'Decorator'
  | 'Comment'
  | 'JSDocComment';

/**
 * TypeScript AST node with specific properties
 */
export interface TypeScriptASTNode extends ASTNode {
  /** TypeScript-specific node type */
  tsNodeType: TypeScriptNodeType;
  /** TypeScript compiler API node */
  tsNode?: unknown;
  /** Type information */
  typeInfo?: TypeInfo;
  /** Modifiers (public, private, static, etc.) */
  modifiers: string[];
  /** Decorators */
  decorators: DecoratorInfo[];
  /** JSDoc comments */
  jsdoc?: JSDocInfo;
}

/**
 * Type information
 */
export interface TypeInfo {
  /** Type name */
  name: string;
  /** Type kind */
  kind: string;
  /** Generic type parameters */
  typeParameters: TypeParameterInfo[];
  /** Type properties */
  properties: PropertyInfo[];
  /** Type methods */
  methods: MethodInfo[];
  /** Base types */
  baseTypes: string[];
  /** Implemented interfaces */
  implementedInterfaces: string[];
  /** Is optional */
  optional: boolean;
  /** Is readonly */
  readonly: boolean;
  /** Default value */
  defaultValue?: string;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Type parameter information
 */
export interface TypeParameterInfo {
  /** Parameter name */
  name: string;
  /** Parameter constraint */
  constraint?: string;
  /** Default type */
  defaultType?: string;
  /** Variance (in, out, or none) */
  variance?: 'in' | 'out' | 'none';
}

/**
 * Property information
 */
export interface PropertyInfo {
  /** Property name */
  name: string;
  /** Property type */
  type: string;
  /** Is optional */
  optional: boolean;
  /** Is readonly */
  readonly: boolean;
  /** Is static */
  static: boolean;
  /** Is public */
  public: boolean;
  /** Is private */
  private: boolean;
  /** Is protected */
  protected: boolean;
  /** Default value */
  defaultValue?: string;
  /** JSDoc documentation */
  documentation?: string;
}

/**
 * Method information
 */
export interface MethodInfo {
  /** Method name */
  name: string;
  /** Return type */
  returnType: string;
  /** Parameters */
  parameters: ParameterInfo[];
  /** Is async */
  async: boolean;
  /** Is generator */
  generator: boolean;
  /** Is static */
  static: boolean;
  /** Is public */
  public: boolean;
  /** Is private */
  private: boolean;
  /** Is protected */
  protected: boolean;
  /** Is abstract */
  abstract: boolean;
  /** JSDoc documentation */
  documentation?: string;
}

/**
 * Parameter information
 */
export interface ParameterInfo {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Is optional */
  optional: boolean;
  /** Default value */
  defaultValue?: string;
  /** Is rest parameter */
  rest: boolean;
  /** JSDoc documentation */
  documentation?: string;
}

/**
 * Decorator information
 */
export interface DecoratorInfo {
  /** Decorator name */
  name: string;
  /** Decorator arguments */
  arguments: unknown[];
  /** Decorator metadata */
  metadata: Record<string, unknown>;
}

/**
 * JSDoc information
 */
export interface JSDocInfo {
  /** Brief description */
  summary: string;
  /** Detailed description */
  description: string;
  /** Parameters documentation */
  parameters: JSDocParameter[];
  /** Return value documentation */
  returns?: JSDocReturn;
  /** Examples */
  examples: string[];
  /** Custom tags */
  tags: Record<string, string>;
  /** See also references */
  seeAlso: string[];
  /** Deprecated flag */
  deprecated: boolean;
  /** Since version */
  since?: string;
  /** Author */
  author?: string;
  /** Version */
  version?: string;
}

/**
 * JSDoc parameter documentation
 */
export interface JSDocParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Parameter description */
  description: string;
  /** Is optional */
  optional: boolean;
  /** Default value */
  defaultValue?: string;
}

/**
 * JSDoc return documentation
 */
export interface JSDocReturn {
  /** Return type */
  type: string;
  /** Return description */
  description: string;
}

/**
 * Import/Export information
 */
export interface ImportExportInfo {
  /** Import/Export type */
  type: 'import' | 'export';
  /** Module path */
  modulePath: string;
  /** Imported/Exported names */
  names: string[];
  /** Is default import/export */
  isDefault: boolean;
  /** Is namespace import/export */
  isNamespace: boolean;
  /** Is type-only import/export */
  isTypeOnly: boolean;
  /** Alias mapping */
  aliases: Record<string, string>;
}

/**
 * Generic type information
 */
export interface GenericTypeInfo {
  /** Generic name */
  name: string;
  /** Generic constraint */
  constraint?: string;
  /** Generic default */
  default?: string;
  /** Generic variance */
  variance?: 'in' | 'out' | 'none';
}

/**
 * Union type information
 */
export interface UnionTypeInfo {
  /** Union type name */
  name: string;
  /** Union members */
  members: string[];
  /** Is discriminated union */
  discriminated: boolean;
  /** Discriminator property */
  discriminator?: string;
}

/**
 * Intersection type information
 */
export interface IntersectionTypeInfo {
  /** Intersection type name */
  name: string;
  /** Intersection members */
  members: string[];
}

/**
 * Conditional type information
 */
export interface ConditionalTypeInfo {
  /** Conditional type name */
  name: string;
  /** Check type */
  checkType: string;
  /** Extends type */
  extendsType: string;
  /** True type */
  trueType: string;
  /** False type */
  falseType: string;
}

/**
 * Mapped type information
 */
export interface MappedTypeInfo {
  /** Mapped type name */
  name: string;
  /** Source type */
  sourceType: string;
  /** Key type */
  keyType: string;
  /** Value type */
  valueType: string;
  /** Readonly modifier */
  readonly: boolean;
  /** Optional modifier */
  optional: boolean;
}

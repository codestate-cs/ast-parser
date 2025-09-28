/**
 * Enhanced TypeScript/JavaScript parser implementation
 * Provides advanced type information extraction, inheritance analysis, and JSDoc support
 */

import * as ts from 'typescript';
import { BaseParser, ParserResult } from './BaseParser';
import {
  Relation,
  FileInfo,
  TypeScriptASTNode,
  TypeScriptNodeType,
  ASTNodeType,
  DecoratorInfo,
  TypeInfo,
  TypeParameterInfo,
  PropertyInfo,
  MethodInfo,
  ParameterInfo,
  JSDocInfo,
} from '../types';
import { ParsingOptions } from '../types/options';
import { FileUtils } from '../utils/file/FileUtils';
import { logInfo, logError } from '../utils/error/ErrorLogger';

/**
 * Enhanced TypeScript parser class
 */
export class EnhancedTypeScriptParser extends BaseParser {
  private sourceFile: ts.SourceFile | null = null;
  private typeChecker: ts.TypeChecker | null = null;
  private program: ts.Program | null = null;

  constructor(options: ParsingOptions) {
    super(options, '2.0.0');
  }

  /**
   * Parse TypeScript/JavaScript file with enhanced analysis
   */
  async parseFile(file: FileInfo, content?: string): Promise<ParserResult> {
    const startTime = Date.now();

    try {
      this.validateFile(file);
      logInfo(`Parsing TypeScript file with enhanced analysis: ${file.path}`);

      // Read file content
      const fileContent = content ?? (await FileUtils.readFile(file.path));

      // Create TypeScript program and source file
      this.createProgram(file.path, fileContent);
      const sourceFile = this.program!.getSourceFile(file.path);

      if (!sourceFile) {
        throw new Error('Failed to create source file');
      }

      this.sourceFile = sourceFile;

      this.typeChecker = this.program!.getTypeChecker();

      // Parse AST nodes with enhanced analysis
      const nodes = this.parseASTNodes(file, fileContent);

      // Build relations
      const relations = this.buildRelations(nodes);

      const parsingTime = this.calculateParsingTime(startTime);

      logInfo(
        `Enhanced TypeScript parsing completed: ${file.path} (${nodes.length} nodes, ${relations.length} relations)`
      );

      return {
        nodes,
        relations,
        metadata: {
          file,
          parsingTime,
          nodeCount: nodes.length,
          relationCount: relations.length,
          parserVersion: this.parserVersion,
        },
      };
    } catch (error) {
      logError(`Enhanced TypeScript parsing failed: ${file.path}`, error as Error, {
        filePath: file.path,
      });
      throw error;
    }
  }

  /**
   * Check if parser can handle the file
   */
  canParse(file: FileInfo): boolean {
    const ext = file.extension.toLowerCase();
    return ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx';
  }

  /**
   * Get parser name
   */
  getParserName(): string {
    return 'EnhancedTypeScriptParser';
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.ts', '.tsx', '.js', '.jsx'];
  }

  /**
   * Create TypeScript program
   */
  private createProgram(filePath: string, content: string): void {
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    };

    const host: ts.CompilerHost = {
      getSourceFile: (fileName: string) => {
        if (fileName === filePath) {
          return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
        }
        return undefined;
      },
      writeFile: () => {},
      getCurrentDirectory: () => '/',
      getDirectories: () => [],
      fileExists: (fileName: string) => fileName === filePath,
      readFile: (fileName: string) => (fileName === filePath ? content : undefined),
      getCanonicalFileName: (fileName: string) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      getDefaultLibFileName: () => 'lib.d.ts',
    };

    this.program = ts.createProgram([filePath], compilerOptions, host);
  }

  /**
   * Parse AST nodes from TypeScript source file with enhanced analysis
   */
  private parseASTNodes(file: FileInfo, _content: string): TypeScriptASTNode[] {
    if (!this.sourceFile || !this.typeChecker) {
      throw new Error('Source file or type checker not initialized');
    }

    const nodes: TypeScriptASTNode[] = [];

    // Visit all nodes in the source file
    const visit = (node: ts.Node, parent?: TypeScriptASTNode): void => {
      const astNode = this.createEnhancedTypeScriptASTNode(node, file, parent);
      if (astNode) {
        nodes.push(astNode);
      }

      // Visit children
      ts.forEachChild(node, child => {
        visit(child, astNode ?? undefined);
      });
    };

    visit(this.sourceFile);
    return nodes;
  }

  /**
   * Create enhanced TypeScript AST node with advanced type information
   */
  private createEnhancedTypeScriptASTNode(
    node: ts.Node,
    file: FileInfo,
    parent?: TypeScriptASTNode
  ): TypeScriptASTNode | null {
    const nodeType = this.getNodeType(node);
    if (!nodeType) {
      return null;
    }

    const name = this.getNodeName(node);
    const start = node.getStart();
    const end = node.getEnd();
    const id = `${file.path}:${start}:${end}`;

    const astNode: TypeScriptASTNode = {
      id,
      name,
      type: this.getNodeKind(node),
      nodeType: this.mapToASTNodeType(nodeType),
      tsNodeType: nodeType,
      tsNode: node,
      filePath: file.path,
      start,
      end,
      children: [],
      metadata: {
        line: this.sourceFile?.getLineAndCharacterOfPosition(start).line ?? 0 + 1,
        column: this.sourceFile?.getLineAndCharacterOfPosition(start).character ?? 0,
        kind: node.kind,
        flags: node.flags,
      },
      properties: this.getNodeProperties(node),
      modifiers: this.getModifiers(node),
      decorators: this.getDecorators(node),
      typeInfo: this.getEnhancedTypeInfo(node),
      jsdoc: this.extractJSDoc(node),
    } as TypeScriptASTNode;

    // Set parent reference
    if (parent) {
      astNode.parent = parent;
      parent.children.push(astNode);
    }

    return astNode;
  }

  /**
   * Get enhanced type information using TypeScript type checker
   */
  private getEnhancedTypeInfo(node: ts.Node): TypeInfo {
    if (!this.typeChecker) {
      return this.getBasicTypeInfo(node);
    }

    try {
      const type = this.typeChecker.getTypeAtLocation(node);
      const symbol = this.typeChecker.getSymbolAtLocation(node);

      return {
        name: this.getTypeName(type, node),
        kind: this.getTypeKind(type),
        typeParameters: this.getTypeParameters(node),
        properties: this.getTypeProperties(type, node),
        methods: this.getTypeMethods(type, node),
        baseTypes: this.getBaseTypes(node),
        implementedInterfaces: this.getImplementedInterfaces(node),
        optional: this.isOptional(node),
        readonly: this.isReadonly(node),
        defaultValue: this.getDefaultValue(node),
        metadata: {
          typeFlags: type.flags,
          symbolFlags: symbol?.flags,
          isUnion: !!(type.flags & ts.TypeFlags.Union),
          isIntersection: !!(type.flags & ts.TypeFlags.Intersection),
          isConditional: !!(type.flags & ts.TypeFlags.Conditional),
        },
      } as TypeInfo;
    } catch {
      // Fallback to basic type info if enhanced analysis fails
      return this.getBasicTypeInfo(node);
    }
  }

  /**
   * Get basic type information as fallback
   */
  private getBasicTypeInfo(node: ts.Node): TypeInfo {
    return {
      name: this.getNodeName(node),
      kind: this.getNodeKind(node),
      typeParameters: [],
      properties: [],
      methods: [],
      baseTypes: [],
      implementedInterfaces: [],
      optional: false,
      readonly: false,
      metadata: {},
    };
  }

  /**
   * Get type name from TypeScript type
   */
  private getTypeName(type: ts.Type, node: ts.Node): string {
    if (!this.typeChecker) {
      return this.getNodeName(node);
    }

    try {
      return this.typeChecker.typeToString(type, node);
    } catch {
      return this.getNodeName(node);
    }
  }

  /**
   * Get type kind from TypeScript type
   */
  private getTypeKind(type: ts.Type): string {
    if (type.flags & ts.TypeFlags.Union) {
      return 'UnionType';
    }
    if (type.flags & ts.TypeFlags.Intersection) {
      return 'IntersectionType';
    }
    if (type.flags & ts.TypeFlags.Conditional) {
      return 'ConditionalType';
    }
    if (type.flags & ts.TypeFlags.Object) {
      return 'ObjectType';
    }
    if (
      type.flags & ts.TypeFlags.String ||
      type.flags & ts.TypeFlags.Number ||
      type.flags & ts.TypeFlags.Boolean
    ) {
      return 'PrimitiveType';
    }
    return 'UnknownType';
  }

  /**
   * Get type parameters for generic types
   */
  private getTypeParameters(node: ts.Node): TypeParameterInfo[] {
    const typeParameters: TypeParameterInfo[] = [];

    if (ts.isClassDeclaration(node) && node.typeParameters) {
      node.typeParameters.forEach(param => {
        typeParameters.push({
          name: param.name.text,
          constraint: param.constraint ? this.getNodeName(param.constraint) : undefined,
          defaultType: param.default ? this.getNodeName(param.default) : undefined,
          variance: 'none', // TypeScript doesn't have variance annotations yet
        } as TypeParameterInfo);
      });
    }

    if (ts.isInterfaceDeclaration(node) && node.typeParameters) {
      node.typeParameters.forEach(param => {
        typeParameters.push({
          name: param.name.text,
          constraint: param.constraint ? this.getNodeName(param.constraint) : undefined,
          defaultType: param.default ? this.getNodeName(param.default) : undefined,
          variance: 'none',
        } as TypeParameterInfo);
      });
    }

    if (ts.isFunctionDeclaration(node) && node.typeParameters) {
      node.typeParameters.forEach(param => {
        typeParameters.push({
          name: param.name.text,
          constraint: param.constraint ? this.getNodeName(param.constraint) : undefined,
          defaultType: param.default ? this.getNodeName(param.default) : undefined,
          variance: 'none',
        } as TypeParameterInfo);
      });
    }

    return typeParameters;
  }

  /**
   * Get type properties
   */
  private getTypeProperties(type: ts.Type, node: ts.Node): PropertyInfo[] {
    const properties: PropertyInfo[] = [];

    if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      const members = type.getProperties();
      members.forEach(member => {
        const memberType = this.typeChecker!.getTypeOfSymbolAtLocation(member, node);
        const declarations = member.getDeclarations();

        if (declarations && declarations.length > 0) {
          const declaration = declarations[0];
          if (
            declaration &&
            (ts.isPropertyDeclaration(declaration) || ts.isPropertySignature(declaration))
          ) {
            properties.push({
              name: member.name,
              type: this.typeChecker!.typeToString(memberType, node),
              optional: !!declaration.questionToken,
              readonly: !!declaration.modifiers?.some(
                m => m.kind === ts.SyntaxKind.ReadonlyKeyword
              ),
              static: !!declaration.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
              public: !declaration.modifiers?.some(
                m =>
                  m.kind === ts.SyntaxKind.PrivateKeyword ||
                  m.kind === ts.SyntaxKind.ProtectedKeyword
              ),
              private: !!declaration.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword),
              protected: !!declaration.modifiers?.some(
                m => m.kind === ts.SyntaxKind.ProtectedKeyword
              ),
              defaultValue: this.getDefaultValue(declaration) ?? undefined,
              documentation: this.extractJSDocForMember(declaration)?.summary ?? undefined,
            } as PropertyInfo);
          }
        }
      });
    }

    return properties;
  }

  /**
   * Get type methods
   */
  private getTypeMethods(type: ts.Type, node: ts.Node): MethodInfo[] {
    const methods: MethodInfo[] = [];

    if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
      const members = type.getProperties();
      members.forEach(member => {
        const memberType = this.typeChecker!.getTypeOfSymbolAtLocation(member, node);
        const declarations = member.getDeclarations();

        if (declarations && declarations.length > 0) {
          const declaration = declarations[0];
          if (
            declaration &&
            (ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration))
          ) {
            const signature = memberType.getCallSignatures()[0];
            const returnType = signature
              ? this.typeChecker!.typeToString(signature.getReturnType(), node)
              : 'void';

            methods.push({
              name: member.name,
              returnType,
              parameters: this.getMethodParameters(declaration),
              async: !!declaration.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
              generator: false, // Simplified for now
              static: !!declaration.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
              public: !declaration.modifiers?.some(
                m =>
                  m.kind === ts.SyntaxKind.PrivateKeyword ||
                  m.kind === ts.SyntaxKind.ProtectedKeyword
              ),
              private: !!declaration.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword),
              protected: !!declaration.modifiers?.some(
                m => m.kind === ts.SyntaxKind.ProtectedKeyword
              ),
              abstract: !!declaration.modifiers?.some(
                m => m.kind === ts.SyntaxKind.AbstractKeyword
              ),
              documentation: this.extractJSDocForMember(declaration)?.summary ?? undefined,
            } as MethodInfo);
          }
        }
      });
    }

    return methods;
  }

  /**
   * Get method parameters
   */
  private getMethodParameters(
    declaration: ts.MethodDeclaration | ts.MethodSignature
  ): ParameterInfo[] {
    const parameters: ParameterInfo[] = [];

    if (declaration.parameters) {
      declaration.parameters.forEach(param => {
        const paramType = this.typeChecker!.getTypeAtLocation(param);
        const typeString = this.typeChecker!.typeToString(paramType, param);

        parameters.push({
          name: param.name && ts.isIdentifier(param.name) ? param.name.text : 'unknown',
          type: typeString,
          optional: !!param.questionToken,
          defaultValue: param.initializer ? this.getNodeName(param.initializer) : undefined,
          rest: !!param.dotDotDotToken,
          documentation: this.extractJSDocForMember(param)?.summary ?? undefined,
        } as ParameterInfo);
      });
    }

    return parameters;
  }

  /**
   * Get base types for inheritance
   */
  private getBaseTypes(node: ts.Node): string[] {
    const baseTypes: string[] = [];

    if (ts.isClassDeclaration(node) && node.heritageClauses) {
      node.heritageClauses.forEach(clause => {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          clause.types.forEach(type => {
            baseTypes.push(this.getNodeName(type));
          });
        }
      });
    }

    return baseTypes;
  }

  /**
   * Get implemented interfaces
   */
  private getImplementedInterfaces(node: ts.Node): string[] {
    const interfaces: string[] = [];

    if (ts.isClassDeclaration(node) && node.heritageClauses) {
      node.heritageClauses.forEach(clause => {
        if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
          clause.types.forEach(type => {
            interfaces.push(this.getNodeName(type));
          });
        }
      });
    }

    return interfaces;
  }

  /**
   * Check if node is optional
   */
  private isOptional(node: ts.Node): boolean {
    return !!(node as ts.HasQuestionToken).questionToken;
  }

  /**
   * Check if node is readonly
   */
  private isReadonly(node: ts.Node): boolean {
    return !!(node as ts.HasModifiers).modifiers?.some(
      (m: ts.Modifier) => m.kind === ts.SyntaxKind.ReadonlyKeyword
    );
  }

  /**
   * Get default value for node
   */
  private getDefaultValue(node: ts.Node): string | undefined {
    const initializer = (node as ts.HasInitializer).initializer;
    if (initializer) {
      return this.getNodeName(initializer);
    }
    return undefined;
  }

  /**
   * Extract JSDoc comments from node
   */
  private extractJSDoc(node: ts.Node): JSDocInfo | undefined {
    const jsdocTags = ts.getJSDocTags(node);
    if (jsdocTags.length === 0) {
      return undefined;
    }

    const jsdoc: JSDocInfo = {
      summary: '',
      description: '',
      parameters: [],
      examples: [],
      tags: {},
      seeAlso: [],
      deprecated: false,
    };

    jsdocTags.forEach(tag => {
      switch (tag.tagName.text) {
        case 'param': {
          const paramTag = tag as ts.JSDocParameterTag;
          if (paramTag.name && paramTag.comment) {
            const name = ts.isIdentifier(paramTag.name) ? paramTag.name.text : 'unknown';
            jsdoc.parameters.push({
              name,
              type: paramTag.typeExpression ? this.getNodeName(paramTag.typeExpression) : 'any',
              description: typeof paramTag.comment === 'string' ? paramTag.comment : '',
              optional: false,
              defaultValue: undefined,
            } as JSDocParameter);
          }
          break;
        }
        case 'returns':
        case 'return': {
          const returnTag = tag as ts.JSDocReturnTag;
          if (returnTag.comment) {
            jsdoc.returns = {
              type: returnTag.typeExpression ? this.getNodeName(returnTag.typeExpression) : 'any',
              description: typeof returnTag.comment === 'string' ? returnTag.comment : '',
            } as JSDocReturn;
          }
          break;
        }
        case 'example':
          if (tag.comment) {
            jsdoc.examples.push(typeof tag.comment === 'string' ? tag.comment : '');
          }
          break;
        case 'deprecated':
          jsdoc.deprecated = true;
          break;
        case 'since':
          if (tag.comment) {
            jsdoc.since = typeof tag.comment === 'string' ? tag.comment : '';
          }
          break;
        case 'author':
          if (tag.comment) {
            jsdoc.author = typeof tag.comment === 'string' ? tag.comment : '';
          }
          break;
        case 'version':
          if (tag.comment) {
            jsdoc.version = typeof tag.comment === 'string' ? tag.comment : '';
          }
          break;
        case 'see':
          if (tag.comment) {
            jsdoc.seeAlso.push(typeof tag.comment === 'string' ? tag.comment : '');
          }
          break;
        default:
          if (tag.comment) {
            jsdoc.tags[tag.tagName.text] = typeof tag.comment === 'string' ? tag.comment : '';
          }
          break;
      }
    });

    // Extract main description from JSDoc comment
    const jsdocComments = ts.getJSDocCommentsAndTags(node);
    if (jsdocComments.length > 0) {
      const firstComment = jsdocComments[0];
      if (typeof firstComment === 'string') {
        jsdoc.summary = firstComment;
        jsdoc.description = firstComment;
      }
    }

    return jsdoc.parameters.length > 0 ||
      jsdoc.returns ||
      jsdoc.examples.length > 0 ||
      Object.keys(jsdoc.tags).length > 0 ||
      jsdoc.deprecated
      ? jsdoc
      : undefined;
  }

  /**
   * Extract JSDoc for specific member
   */
  private extractJSDocForMember(node: ts.Node): JSDocInfo | undefined {
    return this.extractJSDoc(node);
  }

  /**
   * Map TypeScript node type to generic AST node type
   */
  private mapToASTNodeType(tsNodeType: TypeScriptNodeType): ASTNodeType {
    switch (tsNodeType) {
      case 'ClassDeclaration':
        return 'class';
      case 'InterfaceDeclaration':
        return 'interface';
      case 'FunctionDeclaration':
      case 'ArrowFunction':
        return 'function';
      case 'MethodDeclaration':
        return 'method';
      case 'PropertyDeclaration':
        return 'property';
      case 'VariableDeclaration':
        return 'variable';
      case 'TypeAliasDeclaration':
        return 'type';
      case 'EnumDeclaration':
        return 'enum';
      case 'NamespaceDeclaration':
      case 'ModuleDeclaration':
        return 'namespace';
      case 'ImportDeclaration':
        return 'import';
      case 'ExportDeclaration':
        return 'export';
      default:
        return 'unknown';
    }
  }

  /**
   * Get TypeScript node type
   */
  private getNodeType(node: ts.Node): TypeScriptNodeType | null {
    switch (node.kind) {
      case ts.SyntaxKind.SourceFile:
        return 'SourceFile';
      case ts.SyntaxKind.ClassDeclaration:
        return 'ClassDeclaration';
      case ts.SyntaxKind.InterfaceDeclaration:
        return 'InterfaceDeclaration';
      case ts.SyntaxKind.FunctionDeclaration:
        return 'FunctionDeclaration';
      case ts.SyntaxKind.MethodDeclaration:
        return 'MethodDeclaration';
      case ts.SyntaxKind.PropertyDeclaration:
        return 'PropertyDeclaration';
      case ts.SyntaxKind.VariableDeclaration:
        return 'VariableDeclaration';
      case ts.SyntaxKind.TypeAliasDeclaration:
        return 'TypeAliasDeclaration';
      case ts.SyntaxKind.EnumDeclaration:
        return 'EnumDeclaration';
      case ts.SyntaxKind.NamespaceExportDeclaration:
        return 'NamespaceDeclaration';
      case ts.SyntaxKind.ModuleDeclaration:
        return 'ModuleDeclaration';
      case ts.SyntaxKind.ImportDeclaration:
        return 'ImportDeclaration';
      case ts.SyntaxKind.ExportDeclaration:
        return 'ExportDeclaration';
      case ts.SyntaxKind.ArrowFunction:
        return 'ArrowFunction';
      case ts.SyntaxKind.Constructor:
        return 'Constructor';
      case ts.SyntaxKind.GetAccessor:
        return 'GetAccessor';
      case ts.SyntaxKind.SetAccessor:
        return 'SetAccessor';
      case ts.SyntaxKind.Parameter:
        return 'Parameter';
      case ts.SyntaxKind.TypeParameter:
        return 'TypeParameter';
      case ts.SyntaxKind.Decorator:
        return 'Decorator';
      default:
        return null;
    }
  }

  /**
   * Get node kind string
   */
  private getNodeKind(node: ts.Node): string {
    return ts.SyntaxKind[node.kind];
  }

  /**
   * Get node name
   */
  private getNodeName(node: ts.Node): string {
    if (ts.isIdentifier(node)) {
      return node.text;
    }

    if (ts.isClassDeclaration(node) && node.name) {
      return node.name.text;
    }

    if (ts.isInterfaceDeclaration(node) && node.name) {
      return node.name.text;
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text;
    }

    if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      return node.name.text;
    }

    if (ts.isPropertyDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      return node.name.text;
    }

    if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      return node.name.text;
    }

    if (ts.isTypeAliasDeclaration(node) && node.name) {
      return node.name.text;
    }

    if (ts.isEnumDeclaration(node) && node.name) {
      return node.name.text;
    }

    if (ts.isNamespaceExportDeclaration(node)) {
      return 'namespace';
    }

    if (ts.isModuleDeclaration(node) && node.name) {
      return node.name.text;
    }

    return 'unknown';
  }

  /**
   * Get node properties
   */
  private getNodeProperties(node: ts.Node): Record<string, unknown> {
    const properties: Record<string, unknown> = {};

    if (ts.isClassDeclaration(node)) {
      properties['isAbstract'] = !!node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.AbstractKeyword
      );
      properties['isExported'] = !!node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ExportKeyword
      );
    }

    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      properties['isAsync'] = !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
      properties['isGenerator'] = false; // Simplified for now
    }

    if (ts.isPropertyDeclaration(node)) {
      properties['isOptional'] = !!node.questionToken;
      properties['isReadonly'] = !!node.modifiers?.some(
        m => m.kind === ts.SyntaxKind.ReadonlyKeyword
      );
    }

    return properties;
  }

  /**
   * Get node modifiers
   */
  private getModifiers(node: ts.Node): string[] {
    if (!('modifiers' in node) || !node.modifiers) {
      return [];
    }

    return (node.modifiers as ts.Modifier[])
      .map((modifier: ts.Modifier) => ts.SyntaxKind[modifier.kind])
      .filter((item): item is string => Boolean(item));
  }

  /**
   * Get node decorators
   */
  private getDecorators(node: ts.Node): DecoratorInfo[] {
    if (!('decorators' in node) || !node.decorators) {
      return [];
    }

    return (node.decorators as ts.Decorator[]).map((decorator: ts.Decorator) => ({
      name: this.getNodeName(decorator),
      arguments: [],
      metadata: {},
    }));
  }

  /**
   * Build relations between nodes
   */
  private buildRelations(nodes: TypeScriptASTNode[]): Relation[] {
    const relations: Relation[] = [];

    for (const node of nodes) {
      // Find parent-child relationships
      if (node.parent) {
        relations.push(
          this.createRelation(
            `parent-child-${node.id}-${node.parent.id}`,
            'references',
            node.parent.id,
            node.id,
            { relationship: 'parent-child' }
          )
        );
      }

      // Find inheritance relationships
      if (node.typeInfo?.baseTypes) {
        node.typeInfo.baseTypes.forEach(baseType => {
          relations.push(
            this.createRelation(
              `inheritance-${node.id}-${baseType}`,
              'inherits',
              node.id,
              baseType,
              { relationship: 'inheritance', baseType }
            )
          );
        });
      }

      // Find interface implementation relationships
      if (node.typeInfo?.implementedInterfaces) {
        node.typeInfo.implementedInterfaces.forEach(interfaceName => {
          relations.push(
            this.createRelation(
              `implements-${node.id}-${interfaceName}`,
              'implements',
              node.id,
              interfaceName,
              { relationship: 'implements', interfaceName }
            )
          );
        });
      }

      // Find import/export relationships
      if (node.tsNodeType === 'ImportDeclaration' || node.tsNodeType === 'ExportDeclaration') {
        // Enhanced import/export analysis will be implemented here
      }
    }

    return relations;
  }
}

/**
 * TypeScript/JavaScript parser implementation
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
} from '../types';
import { ParsingOptions } from '../types/options';
import { FileUtils } from '../utils/file/FileUtils';
import { logInfo, logError } from '../utils/error/ErrorLogger';

/**
 * TypeScript parser class
 */
export class TypeScriptParser extends BaseParser {
  // private program: ts.Program | null = null;
  private sourceFile: ts.SourceFile | null = null;

  constructor(options: ParsingOptions) {
    super(options, '1.0.0');
  }

  /**
   * Parse TypeScript/JavaScript file
   */
  async parseFile(file: FileInfo): Promise<ParserResult> {
    const startTime = Date.now();

    try {
      this.validateFile(file);
      logInfo(`Parsing TypeScript file: ${file.path}`);

      // Read file content
      const content = await FileUtils.readFile(file.path);

      // Create TypeScript source file
      this.sourceFile = ts.createSourceFile(file.path, content, ts.ScriptTarget.Latest, true);

      // Parse AST nodes
      const nodes = this.parseASTNodes(file, content);

      // Build relations
      const relations = this.buildRelations(nodes);

      const parsingTime = this.calculateParsingTime(startTime);

      logInfo(
        `TypeScript parsing completed: ${file.path} (${nodes.length} nodes, ${relations.length} relations)`
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
      logError(`TypeScript parsing failed: ${file.path}`, error as Error, { filePath: file.path });
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
    return 'TypeScriptParser';
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.ts', '.tsx', '.js', '.jsx'];
  }

  /**
   * Parse AST nodes from TypeScript source file
   */
  private parseASTNodes(file: FileInfo, _content: string): TypeScriptASTNode[] {
    if (!this.sourceFile) {
      throw new Error('Source file not initialized');
    }

    const nodes: TypeScriptASTNode[] = [];

    // Visit all nodes in the source file
    const visit = (node: ts.Node, parent?: TypeScriptASTNode): void => {
      const astNode = this.createTypeScriptASTNode(node, file, parent);
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
   * Create TypeScript AST node
   */
  private createTypeScriptASTNode(
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
      typeInfo: this.getTypeInfo(node),
    };

    // Set parent reference
    if (parent) {
      astNode.parent = parent;
      parent.children.push(astNode);
    }

    return astNode;
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
      properties['isGenerator'] = false; // Simplified for Phase 1
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
   * Get type information
   */
  private getTypeInfo(node: ts.Node): TypeInfo {
    // Simplified type information for Phase 1
    // Full type analysis will be implemented in Phase 2
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

      // Find import/export relationships
      if (node.tsNodeType === 'ImportDeclaration' || node.tsNodeType === 'ExportDeclaration') {
        // Simplified import/export analysis for Phase 1
        // Full analysis will be implemented in Phase 2
      }
    }

    return relations;
  }
}

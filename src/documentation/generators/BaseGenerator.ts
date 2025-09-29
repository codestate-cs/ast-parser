/**
 * Base Generator for documentation generation
 * 
 * This module provides the base class and interfaces for all documentation generators including:
 * - Abstract base class for documentation generators
 * - Common interfaces and types for documentation generation
 * - File writing and formatting utilities
 * - Validation and error handling
 */

import { ASTNode } from '../../types/core';
import { JSDocComment } from '../extractors/JSDocExtractor';
import { TypeInfo } from '../extractors/TypeExtractor';
import { ExampleInfo } from '../extractors/ExampleExtractor';

/**
 * Documentation generation options
 */
export interface DocumentationGenerationOptions {
  /** Output directory path */
  outputDir: string;
  /** Output file name */
  fileName: string;
  /** Include table of contents */
  includeTOC: boolean;
  /** Include navigation */
  includeNavigation: boolean;
  /** Include metadata */
  includeMetadata: boolean;
  /** Custom CSS styles */
  customCSS?: string;
  /** Custom JavaScript */
  customJS?: string;
  /** Template variables */
  templateVariables: Record<string, unknown>;
}

/**
 * Documentation content structure
 */
export interface DocumentationContent {
  /** Content title */
  title: string;
  /** Content description */
  description: string;
  /** Content sections */
  sections: DocumentationSection[];
  /** Content metadata */
  metadata: Record<string, unknown>;
}

/**
 * Documentation section
 */
export interface DocumentationSection {
  /** Section ID */
  id: string;
  /** Section title */
  title: string;
  /** Section content */
  content: string;
  /** Section level */
  level: number;
  /** Section metadata */
  metadata: Record<string, unknown>;
}

/**
 * Documentation generation result
 */
export interface DocumentationGenerationResult {
  /** Generated file path */
  filePath: string;
  /** Generated content size in bytes */
  contentSize: number;
  /** Number of sections generated */
  sectionCount: number;
  /** Generation metadata */
  metadata: {
    /** Generation time in milliseconds */
    generationTime: number;
    /** Files processed */
    filesProcessed: number;
    /** Nodes processed */
    nodesProcessed: number;
  };
  /** Generation errors */
  errors: string[];
  /** Whether generation was successful */
  success: boolean;
}

/**
 * Generator validation result
 */
export interface GeneratorValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}

/**
 * Abstract base class for documentation generators
 * 
 * Provides common functionality and interfaces for all documentation generators
 */
export abstract class BaseGenerator {
  protected options: DocumentationGenerationOptions;

  constructor(options: Partial<DocumentationGenerationOptions> = {}) {
    this.options = {
      outputDir: './docs',
      fileName: 'documentation',
      includeTOC: true,
      includeNavigation: true,
      includeMetadata: true,
      templateVariables: {},
      ...options
    };
  }

  /**
   * Generate documentation from AST nodes
   * 
   * @param nodes - AST nodes to generate documentation from
   * @returns Documentation generation result
   */
  public abstract generate(nodes: ASTNode[]): Promise<DocumentationGenerationResult>;

  /**
   * Generate documentation from extracted data
   * 
   * @param jsdocComments - JSDoc comments
   * @param typeInfo - Type information
   * @param examples - Example information
   * @returns Documentation generation result
   */
  public abstract generateFromExtracted(
    jsdocComments: JSDocComment[],
    typeInfo: TypeInfo[],
    examples: ExampleInfo[]
  ): Promise<DocumentationGenerationResult>;

  /**
   * Validate generator configuration
   * 
   * @returns Validation result
   */
  public validate(): GeneratorValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate output directory
    if (!this.options.outputDir || this.options.outputDir.trim() === '') {
      errors.push('Output directory is required');
    }

    // Validate file name
    if (!this.options.fileName || this.options.fileName.trim() === '') {
      errors.push('File name is required');
    }

    // Check for invalid characters in file name
    if (this.options.fileName && /[<>:"/\\|?*]/.test(this.options.fileName)) {
      errors.push('File name contains invalid characters');
    }

    // Validate template variables
    if (this.options.templateVariables && typeof this.options.templateVariables !== 'object') {
      errors.push('Template variables must be an object');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create documentation content structure
   * 
   * @param nodes - AST nodes
   * @returns Documentation content
   */
  protected createContent(nodes: ASTNode[]): DocumentationContent {
    const sections: DocumentationSection[] = [];

    // Create overview section
    sections.push(this.createOverviewSection(nodes));

    // Create API reference section
    sections.push(this.createAPIReferenceSection(nodes));

    // Create examples section
    sections.push(this.createExamplesSection(nodes));

    return {
      title: this.getProjectTitle(nodes),
      description: this.getProjectDescription(nodes),
      sections,
      metadata: this.createContentMetadata(nodes)
    };
  }

  /**
   * Create overview section
   * 
   * @param nodes - AST nodes
   * @returns Overview section
   */
  protected createOverviewSection(nodes: ASTNode[]): DocumentationSection {
    const content = this.generateOverviewContent(nodes);
    
    return {
      id: 'overview',
      title: 'Overview',
      content,
      level: 1,
      metadata: {
        type: 'overview',
        nodeCount: nodes.length
      }
    };
  }

  /**
   * Create API reference section
   * 
   * @param nodes - AST nodes
   * @returns API reference section
   */
  protected createAPIReferenceSection(nodes: ASTNode[]): DocumentationSection {
    const content = this.generateAPIReferenceContent(nodes);
    
    return {
      id: 'api-reference',
      title: 'API Reference',
      content,
      level: 1,
      metadata: {
        type: 'api-reference',
        nodeCount: nodes.length
      }
    };
  }

  /**
   * Create examples section
   * 
   * @param nodes - AST nodes
   * @returns Examples section
   */
  protected createExamplesSection(nodes: ASTNode[]): DocumentationSection {
    const content = this.generateExamplesContent(nodes);
    
    return {
      id: 'examples',
      title: 'Examples',
      content,
      level: 1,
      metadata: {
        type: 'examples',
        nodeCount: nodes.length
      }
    };
  }

  /**
   * Generate overview content
   * 
   * @param nodes - AST nodes
   * @returns Overview content
   */
  protected generateOverviewContent(nodes: ASTNode[]): string {
    const projectTitle = this.getProjectTitle(nodes);
    const projectDescription = this.getProjectDescription(nodes);
    
    return `# ${projectTitle}

${projectDescription}

## Project Statistics

- **Total Files**: ${this.getFileCount(nodes)}
- **Total Functions**: ${this.getFunctionCount(nodes)}
- **Total Classes**: ${this.getClassCount(nodes)}
- **Total Interfaces**: ${this.getInterfaceCount(nodes)}

## Quick Start

This documentation provides comprehensive information about the project's API, usage examples, and implementation details.`;
  }

  /**
   * Generate API reference content
   * 
   * @param nodes - AST nodes
   * @returns API reference content
   */
  protected generateAPIReferenceContent(nodes: ASTNode[]): string {
    let content = '# API Reference\n\n';
    
    // Group nodes by type
    const functions = nodes.filter(n => n.nodeType === 'function');
    const classes = nodes.filter(n => n.nodeType === 'class');
    const interfaces = nodes.filter(n => n.nodeType === 'interface');
    
    // Generate function documentation
    if (functions.length > 0) {
      content += '## Functions\n\n';
      for (const func of functions) {
        content += this.generateFunctionDocumentation(func);
      }
    }
    
    // Generate class documentation
    if (classes.length > 0) {
      content += '## Classes\n\n';
      for (const cls of classes) {
        content += this.generateClassDocumentation(cls);
      }
    }
    
    // Generate interface documentation
    if (interfaces.length > 0) {
      content += '## Interfaces\n\n';
      for (const iface of interfaces) {
        content += this.generateInterfaceDocumentation(iface);
      }
    }
    
    return content;
  }

  /**
   * Generate examples content
   * 
   * @param nodes - AST nodes
   * @returns Examples content
   */
  protected generateExamplesContent(nodes: ASTNode[]): string {
    let content = '# Examples\n\n';
    
    // Extract examples from nodes
    const examples = this.extractExamplesFromNodes(nodes);
    
    if (examples.length === 0) {
      content += 'No examples found in the project.';
      return content;
    }
    
    for (const example of examples) {
      content += this.generateExampleDocumentation(example);
    }
    
    return content;
  }

  /**
   * Generate function documentation
   * 
   * @param node - Function node
   * @returns Function documentation
   */
  protected generateFunctionDocumentation(node: ASTNode): string {
    const name = node.name;
    const description = this.getNodeDescription(node);
    
    return `### ${name}

${description}

**File**: \`${node.filePath}\`
**Type**: Function
**Position**: ${node.start}-${node.end}

---
`;
  }

  /**
   * Generate class documentation
   * 
   * @param node - Class node
   * @returns Class documentation
   */
  protected generateClassDocumentation(node: ASTNode): string {
    const name = node.name;
    const description = this.getNodeDescription(node);
    
    return `### ${name}

${description}

**File**: \`${node.filePath}\`
**Type**: Class
**Position**: ${node.start}-${node.end}

---
`;
  }

  /**
   * Generate interface documentation
   * 
   * @param node - Interface node
   * @returns Interface documentation
   */
  protected generateInterfaceDocumentation(node: ASTNode): string {
    const name = node.name;
    const description = this.getNodeDescription(node);
    
    return `### ${name}

${description}

**File**: \`${node.filePath}\`
**Type**: Interface
**Position**: ${node.start}-${node.end}

---
`;
  }

  /**
   * Generate example documentation
   * 
   * @param example - Example information
   * @returns Example documentation
   */
  protected generateExampleDocumentation(example: ExampleInfo): string {
    return `### ${example.title}

${example.description}

\`\`\`${example.language}
${example.code}
\`\`\`

${example.output ? `**Output:**\n\`\`\`\n${example.output}\n\`\`\`\n` : ''}

---
`;
  }

  /**
   * Extract examples from nodes
   * 
   * @param nodes - AST nodes
   * @returns Array of example information
   */
  protected extractExamplesFromNodes(nodes: ASTNode[]): ExampleInfo[] {
    const examples: ExampleInfo[] = [];
    
    for (const node of nodes) {
      if (node.properties && node.properties['examples']) {
        const nodeExamples = node.properties['examples'] as ExampleInfo[];
        examples.push(...nodeExamples);
      }
      
      // Extract from child nodes
      for (const child of node.children) {
        const childExamples = this.extractExamplesFromNodes([child]);
        examples.push(...childExamples);
      }
    }
    
    return examples;
  }

  /**
   * Get project title from nodes
   * 
   * @param nodes - AST nodes
   * @returns Project title
   */
  protected getProjectTitle(nodes: ASTNode[]): string {
    // Try to find package.json or similar
    const packageNode = nodes.find(n => n.filePath.includes('package.json'));
    if (packageNode && packageNode.properties && packageNode.properties['name']) {
      return packageNode.properties['name'] as string;
    }
    
    // Fallback to first file name
    if (nodes.length > 0) {
      const firstFile = nodes[0]?.filePath.split('/').pop()?.split('.')[0];
      return firstFile || 'Project Documentation';
    }
    
    return 'Project Documentation';
  }

  /**
   * Get project description from nodes
   * 
   * @param nodes - AST nodes
   * @returns Project description
   */
  protected getProjectDescription(nodes: ASTNode[]): string {
    // Try to find package.json or similar
    const packageNode = nodes.find(n => n.filePath.includes('package.json'));
    if (packageNode && packageNode.properties && packageNode.properties['description']) {
      return packageNode.properties['description'] as string;
    }
    
    return 'Automatically generated documentation for the project.';
  }

  /**
   * Get node description
   * 
   * @param node - AST node
   * @returns Node description
   */
  protected getNodeDescription(node: ASTNode): string {
    if (node.properties && node.properties['description']) {
      return node.properties['description'] as string;
    }
    
    if (node.properties && node.properties['jsDocComments']) {
      const comments = node.properties['jsDocComments'] as string[];
      for (const comment of comments) {
        const description = this.extractDescriptionFromJSDoc(comment);
        if (description) {
          return description;
        }
      }
    }
    
    return `No description available for ${node.name}.`;
  }

  /**
   * Extract description from JSDoc comment
   * 
   * @param comment - JSDoc comment
   * @returns Description text
   */
  protected extractDescriptionFromJSDoc(comment: string): string | null {
    const lines = comment.split('\n');
    const descriptionLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.replace(/^\s*\*\s?/, '').trim();
      
      // Stop at first tag
      if (trimmed.startsWith('@')) {
        break;
      }
      
      if (trimmed && !trimmed.startsWith('/**') && !trimmed.endsWith('*/')) {
        descriptionLines.push(trimmed);
      }
    }
    
    return descriptionLines.length > 0 ? descriptionLines.join(' ') : null;
  }

  /**
   * Get file count from nodes
   * 
   * @param nodes - AST nodes
   * @returns File count
   */
  protected getFileCount(nodes: ASTNode[]): number {
    const files = new Set(nodes.map(n => n.filePath));
    return files.size;
  }

  /**
   * Get function count from nodes
   * 
   * @param nodes - AST nodes
   * @returns Function count
   */
  protected getFunctionCount(nodes: ASTNode[]): number {
    return nodes.filter(n => n.nodeType === 'function').length;
  }

  /**
   * Get class count from nodes
   * 
   * @param nodes - AST nodes
   * @returns Class count
   */
  protected getClassCount(nodes: ASTNode[]): number {
    return nodes.filter(n => n.nodeType === 'class').length;
  }

  /**
   * Get interface count from nodes
   * 
   * @param nodes - AST nodes
   * @returns Interface count
   */
  protected getInterfaceCount(nodes: ASTNode[]): number {
    return nodes.filter(n => n.nodeType === 'interface').length;
  }

  /**
   * Create content metadata
   * 
   * @param nodes - AST nodes
   * @returns Content metadata
   */
  protected createContentMetadata(nodes: ASTNode[]): Record<string, unknown> {
    return {
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      fileCount: this.getFileCount(nodes),
      functionCount: this.getFunctionCount(nodes),
      classCount: this.getClassCount(nodes),
      interfaceCount: this.getInterfaceCount(nodes)
    };
  }

  /**
   * Write content to file
   * 
   * @param content - Content to write
   * @param filePath - File path
   * @returns Promise that resolves when file is written
   */
  protected async writeToFile(content: string, filePath: string): Promise<void> {
    // This is a placeholder - in a real implementation, you would use fs.promises.writeFile
    // For now, we'll just simulate the operation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Writing content to ${filePath} (${content.length} characters)`);
        resolve();
      }, 10);
    });
  }

  /**
   * Update generation options
   * 
   * @param options - New options to merge
   */
  public updateOptions(options: Partial<DocumentationGenerationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current generation options
   * 
   * @returns Current options
   */
  public getOptions(): DocumentationGenerationOptions {
    return { ...this.options };
  }
}

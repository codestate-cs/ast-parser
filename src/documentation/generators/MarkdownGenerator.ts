/**
 * Markdown Generator for documentation generation
 * 
 * This module provides markdown-specific documentation generation including:
 * - Markdown formatting utilities
 * - Table of contents generation
 * - Syntax highlighting support
 * - Template processing
 * - Markdown validation
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

import { BaseGenerator, DocumentationGenerationOptions, DocumentationGenerationResult } from './BaseGenerator';
import { ASTNode } from '../../types/core';
import { JSDocComment } from '../extractors/JSDocExtractor';
import { TypeInfo } from '../extractors/TypeExtractor';
import { ExampleInfo } from '../extractors/ExampleExtractor';
import * as path from 'path';

/**
 * Markdown generator options
 */
export interface MarkdownGeneratorOptions extends DocumentationGenerationOptions {
  /** Markdown flavor to use */
  markdownFlavor?: 'github' | 'gitlab' | 'commonmark';
  /** Enable syntax highlighting */
  enableSyntaxHighlighting?: boolean;
  /** Custom markdown template */
  customTemplate?: string | undefined;
}

/**
 * Markdown formatting utilities
 */
export class MarkdownGenerator extends BaseGenerator {
  private markdownOptions: MarkdownGeneratorOptions;

  constructor(options: Partial<MarkdownGeneratorOptions> = {}) {
    const defaultOptions: MarkdownGeneratorOptions = {
      outputDir: './docs',
      fileName: 'README.md',
      includeTOC: true,
      includeNavigation: true,
      includeMetadata: true,
      templateVariables: {},
      markdownFlavor: 'github',
      enableSyntaxHighlighting: true,
      customTemplate: undefined
    };

    super({ ...defaultOptions, ...options });
    this.markdownOptions = { ...defaultOptions, ...options };
  }

  /**
   * Generate documentation from AST nodes
   * 
   * @param nodes - AST nodes
   * @returns Documentation generation result
   */
  public async generate(nodes: ASTNode[]): Promise<DocumentationGenerationResult> {
    const startTime = Date.now();

    try {
      // Validate options
      const validation = this.validate();
      if (!validation.isValid) {
        return {
          filePath: '',
          contentSize: 0,
          sectionCount: 0,
          metadata: {
            generationTime: Date.now() - startTime,
            filesProcessed: 0,
            nodesProcessed: 0
          },
          errors: validation.errors,
          success: false
        };
      }

      // Generate markdown content
      const content = this.generateMarkdownContentFromNodes(nodes);
      
      // Process template if provided
      const processedContent = this.markdownOptions.customTemplate 
        ? this.processTemplate(this.markdownOptions.customTemplate, {
            content,
            nodes,
            ...this.markdownOptions.templateVariables
          })
        : content;

      // Validate markdown syntax
      const isValidMarkdown = this.validateMarkdown(processedContent);
      if (!isValidMarkdown) {
        return {
          filePath: '',
          contentSize: 0,
          sectionCount: 0,
          metadata: {
            generationTime: Date.now() - startTime,
            filesProcessed: 0,
            nodesProcessed: 0
          },
          errors: ['Invalid markdown syntax generated'],
          success: false
        };
      }

      // Write to file
      const filePath = path.join(this.markdownOptions.outputDir, this.markdownOptions.fileName);
      await this.writeToFile(processedContent, filePath);

      return {
        filePath,
        contentSize: Buffer.byteLength(processedContent, 'utf8'),
        sectionCount: this.countSections(processedContent),
        metadata: {
          generationTime: Date.now() - startTime,
          filesProcessed: 1,
          nodesProcessed: nodes.length
        },
        errors: [],
        success: true
      };
    } catch (error) {
      return {
        filePath: '',
        contentSize: 0,
        sectionCount: 0,
        metadata: {
          generationTime: Date.now() - startTime,
          filesProcessed: 0,
          nodesProcessed: 0
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        success: false
      };
    }
  }

  /**
   * Generate documentation from extracted data
   * 
   * @param jsdocComments - JSDoc comments
   * @param typeInfo - Type information
   * @param examples - Code examples
   * @returns Documentation generation result
   */
  public async generateFromExtracted(
    jsdocComments: JSDocComment[],
    typeInfo: TypeInfo[],
    examples: ExampleInfo[]
  ): Promise<DocumentationGenerationResult> {
    const startTime = Date.now();

    try {
      // Validate options
      const validation = this.validate();
      if (!validation.isValid) {
        return {
          filePath: '',
          contentSize: 0,
          sectionCount: 0,
          metadata: {
            generationTime: Date.now() - startTime,
            filesProcessed: 0,
            nodesProcessed: 0
          },
          errors: validation.errors,
          success: false
        };
      }

      // Generate markdown content
      const content = this.generateMarkdownContent(jsdocComments, typeInfo, examples);
      
      // Process template if provided
      const processedContent = this.markdownOptions.customTemplate 
        ? this.processTemplate(this.markdownOptions.customTemplate, {
            content,
            jsdocComments,
            typeInfo,
            examples,
            ...this.markdownOptions.templateVariables
          })
        : content;

      // Validate markdown syntax
      const isValidMarkdown = this.validateMarkdown(processedContent);
      if (!isValidMarkdown) {
        return {
          filePath: '',
          contentSize: 0,
          sectionCount: 0,
          metadata: {
            generationTime: Date.now() - startTime,
            filesProcessed: 0,
            nodesProcessed: 0
          },
          errors: ['Invalid markdown syntax generated'],
          success: false
        };
      }

      // Write to file
      const filePath = path.join(this.markdownOptions.outputDir, this.markdownOptions.fileName);
      await this.writeToFile(processedContent, filePath);

      return {
        filePath,
        contentSize: Buffer.byteLength(processedContent, 'utf8'),
        sectionCount: this.countSections(processedContent),
        metadata: {
          generationTime: Date.now() - startTime,
          filesProcessed: 1,
          nodesProcessed: jsdocComments.length + typeInfo.length + examples.length
        },
        errors: [],
        success: true
      };
    } catch (error) {
      return {
        filePath: '',
        contentSize: 0,
        sectionCount: 0,
        metadata: {
          generationTime: Date.now() - startTime,
          filesProcessed: 0,
          nodesProcessed: 0
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        success: false
      };
    }
  }

  /**
   * Generate markdown content from AST nodes
   * 
   * @param nodes - AST nodes
   * @returns Markdown content
   */
  private generateMarkdownContentFromNodes(nodes: ASTNode[]): string {
    const sections: Array<{ id: string; title: string; level: number }> = [];
    let content = '';

    // Title
    content += this.formatHeader('Project Documentation', 1) + '\n\n';

    // Table of Contents
    if (this.markdownOptions.includeTOC) {
      const tocSections = [
        { id: 'overview', title: 'Overview', level: 1 },
        { id: 'api-reference', title: 'API Reference', level: 1 }
      ];
      content += this.generateTableOfContents(tocSections) + '\n\n';
    }

    // Overview section
    content += this.formatHeader('Overview', 2) + '\n\n';
    content += this.generateOverviewContent(nodes) + '\n\n';
    sections.push({ id: 'overview', title: 'Overview', level: 2 });

    // API Reference section
    content += this.formatHeader('API Reference', 2) + '\n\n';
    content += this.generateAPIReferenceContent(nodes) + '\n\n';
    sections.push({ id: 'api-reference', title: 'API Reference', level: 2 });

    // Metadata section
    if (this.markdownOptions.includeMetadata) {
      content += this.formatHeader('Metadata', 2) + '\n\n';
      content += this.generateMetadataContentFromNodes(nodes) + '\n\n';
    }

    return content;
  }

  /**
   * Generate markdown content from extracted data
   * 
   * @param jsdocComments - JSDoc comments
   * @param typeInfo - Type information
   * @param examples - Code examples
   * @returns Markdown content
   */
  private generateMarkdownContent(
    jsdocComments: JSDocComment[],
    typeInfo: TypeInfo[],
    examples: ExampleInfo[]
  ): string {
    const sections: Array<{ id: string; title: string; level: number }> = [];
    let content = '';

    // Title
    content += this.formatHeader('Project Documentation', 1) + '\n\n';

    // Table of Contents
    if (this.markdownOptions.includeTOC) {
      const tocSections = [
        { id: 'overview', title: 'Overview', level: 1 },
        { id: 'api-reference', title: 'API Reference', level: 1 },
        { id: 'examples', title: 'Examples', level: 1 }
      ];
      content += this.generateTableOfContents(tocSections) + '\n\n';
    }

    // Overview section
    content += this.formatHeader('Overview', 2) + '\n\n';
    content += this.generateOverviewContentFromExtracted(jsdocComments, typeInfo, examples) + '\n\n';
    sections.push({ id: 'overview', title: 'Overview', level: 2 });

    // API Reference section
    if (typeInfo.length > 0) {
      content += this.formatHeader('API Reference', 2) + '\n\n';
      content += this.generateAPIReferenceContentFromExtracted(typeInfo) + '\n\n';
      sections.push({ id: 'api-reference', title: 'API Reference', level: 2 });
    }

    // Examples section
    if (examples.length > 0) {
      content += this.formatHeader('Examples', 2) + '\n\n';
      content += this.generateExamplesContentFromExtracted(examples) + '\n\n';
      sections.push({ id: 'examples', title: 'Examples', level: 2 });
    }

    // Metadata section
    if (this.markdownOptions.includeMetadata) {
      content += this.formatHeader('Metadata', 2) + '\n\n';
      content += this.generateMetadataContentFromExtracted(jsdocComments, typeInfo, examples) + '\n\n';
    }

    return content;
  }

  /**
   * Generate overview content from extracted data
   * 
   * @param jsdocComments - JSDoc comments
   * @param typeInfo - Type information
   * @param examples - Code examples
   * @returns Overview markdown content
   */
  private generateOverviewContentFromExtracted(
    jsdocComments: JSDocComment[],
    typeInfo: TypeInfo[],
    examples: ExampleInfo[]
  ): string {
    let content = 'This documentation provides comprehensive information about the project.\n\n';

    // Statistics
    const stats = [
      `**Total JSDoc Comments**: ${jsdocComments.length}`,
      `**Total Types**: ${typeInfo.length}`,
      `**Total Examples**: ${examples.length}`
    ];

    content += this.formatHeader('Statistics', 3) + '\n\n';
    content += this.formatList(stats) + '\n\n';

    return content;
  }

  /**
   * Generate API reference content from extracted data
   * 
   * @param typeInfo - Type information
   * @returns API reference markdown content
   */
  private generateAPIReferenceContentFromExtracted(typeInfo: TypeInfo[]): string {
    let content = '';

    for (const type of typeInfo) {
      content += this.formatHeader(type.name, 3) + '\n\n';
      
      if (type.documentation) {
        content += type.documentation + '\n\n';
      }

      // Type definition
      content += this.formatHeader('Definition', 4) + '\n\n';
      content += this.formatCodeBlock(type.definition, 'typescript') + '\n\n';

      // Properties
      if (type.properties && type.properties.length > 0) {
        content += this.formatHeader('Properties', 4) + '\n\n';
        const propertyRows = type.properties.map(prop => [
          prop.name || 'unknown',
          prop.type || 'unknown',
          prop.documentation || 'No description'
        ]);
        content += this.formatTable(['Name', 'Type', 'Description'], propertyRows) + '\n\n';
      }

      // Methods
      if (type.methods && type.methods.length > 0) {
        content += this.formatHeader('Methods', 4) + '\n\n';
        const methodRows = type.methods.map(method => [
          method.name || 'unknown',
          method.returnType || 'unknown',
          method.documentation || 'No description'
        ]);
        content += this.formatTable(['Name', 'Return Type', 'Description'], methodRows) + '\n\n';
      }
    }

    return content;
  }

  /**
   * Generate examples content from extracted data
   * 
   * @param examples - Code examples
   * @returns Examples markdown content
   */
  private generateExamplesContentFromExtracted(examples: ExampleInfo[]): string {
    let content = '';

    for (const example of examples) {
      content += this.formatHeader(example.title || 'Example', 3) + '\n\n';
      
      if (example.description) {
        content += example.description + '\n\n';
      }

      // Determine language for syntax highlighting
      const language = this.detectLanguage(example.language || 'typescript');
      content += this.formatCodeBlock(example.code, language) + '\n\n';
    }

    return content;
  }

  /**
   * Generate metadata content from extracted data
   * 
   * @param jsdocComments - JSDoc comments
   * @param typeInfo - Type information
   * @param examples - Code examples
   * @returns Metadata markdown content
   */
  private generateMetadataContentFromExtracted(
    jsdocComments: JSDocComment[],
    typeInfo: TypeInfo[],
    examples: ExampleInfo[]
  ): string {
    const metadata = [
      `**Generated**: ${new Date().toISOString()}`,
      `**Markdown Flavor**: ${this.markdownOptions.markdownFlavor}`,
      `**Syntax Highlighting**: ${this.markdownOptions.enableSyntaxHighlighting ? 'Enabled' : 'Disabled'}`,
      `**Total Items**: ${jsdocComments.length + typeInfo.length + examples.length}`
    ];

    return this.formatList(metadata);
  }

  /**
   * Generate metadata content from AST nodes
   * 
   * @param nodes - AST nodes
   * @returns Metadata markdown content
   */
  private generateMetadataContentFromNodes(nodes: ASTNode[]): string {
    const metadata = [
      `**Generated**: ${new Date().toISOString()}`,
      `**Markdown Flavor**: ${this.markdownOptions.markdownFlavor}`,
      `**Syntax Highlighting**: ${this.markdownOptions.enableSyntaxHighlighting ? 'Enabled' : 'Disabled'}`,
      `**Total Nodes**: ${nodes.length}`
    ];

    return this.formatList(metadata);
  }
  /**
   * Generate table of contents
   * 
   * @param sections - Document sections
   * @returns Table of contents markdown
   */
  private generateTableOfContents(sections: Array<{ id: string; title: string; level: number }>): string {
    if (!this.markdownOptions.includeTOC || sections.length === 0) {
      return '';
    }

    let toc = this.formatHeader('Table of Contents', 2) + '\n\n';

    for (const section of sections) {
      if (!section.title) continue;
      
      const indent = '  '.repeat(Math.max(0, section.level - 1));
      const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      toc += `${indent}- [${section.title}](#${anchor})\n`;
    }

    return toc;
  }

  /**
   * Format header
   * 
   * @param text - Header text
   * @param level - Header level (1-6)
   * @returns Formatted header
   */
  private formatHeader(text: string, level: number): string {
    const hashCount = Math.min(Math.max(1, level), 6);
    return '#'.repeat(hashCount) + ' ' + (text || '');
  }

  /**
   * Format code block
   * 
   * @param code - Code content
   * @param language - Programming language
   * @returns Formatted code block
   */
  private formatCodeBlock(code: string, language?: string): string {
    const lang = language && this.markdownOptions.enableSyntaxHighlighting ? language : '';
    return `\`\`\`${lang}\n${code || ''}\n\`\`\``;
  }

  /**
   * Format inline code
   * 
   * @param text - Code text
   * @returns Formatted inline code
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private formatInlineCode(text: string): string {
    return `\`${text || ''}\``;
  }

  /**
   * Format bold text
   * 
   * @param text - Text to bold
   * @returns Formatted bold text
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private formatBold(text: string): string {
    return `**${text || ''}**`;
  }

  /**
   * Format italic text
   * 
   * @param text - Text to italicize
   * @returns Formatted italic text
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private formatItalic(text: string): string {
    return `*${text || ''}*`;
  }

  /**
   * Format link
   * 
   * @param text - Link text
   * @param url - Link URL
   * @returns Formatted link
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private formatLink(text: string, url: string): string {
    return `[${text || ''}](${url || ''})`;
  }

  /**
   * Format list
   * 
   * @param items - List items
   * @returns Formatted list
   */
  private formatList(items: string[]): string {
    if (!items || items.length === 0) return '';
    return items.map(item => `- ${item || ''}`).join('\n');
  }

  /**
   * Format numbered list
   * 
   * @param items - List items
   * @returns Formatted numbered list
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private formatNumberedList(items: string[]): string {
    if (!items || items.length === 0) return '';
    return items.map((item, index) => `${index + 1}. ${item || ''}`).join('\n');
  }

  /**
   * Format table
   * 
   * @param headers - Table headers
   * @param rows - Table rows
   * @returns Formatted table
   */
  private formatTable(headers: string[], rows: string[][]): string {
    if (!headers || headers.length === 0) return '';

    // Header row
    let table = `| ${headers.join(' | ')} |\n`;
    
    // Separator row
    table += `| ${headers.map(() => '---').join(' | ')} |\n`;
    
    // Data rows
    if (rows && rows.length > 0) {
      for (const row of rows) {
        const paddedRow = headers.map((_, index) => row[index] || '');
        table += `| ${paddedRow.join(' | ')} |\n`;
      }
    }

    return table;
  }

  /**
   * Detect language from file extension or language name
   * 
   * @param input - File path or language name
   * @returns Detected language
   */
  private detectLanguage(input: string): string {
    if (!input) return 'text';

    const extension = input.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'md': 'markdown',
      'sh': 'bash',
      'sql': 'sql',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'typescript': 'typescript',
      'javascript': 'javascript',
      'markdown': 'markdown',
      'bash': 'bash'
    };

    return languageMap[extension || input.toLowerCase()] || 'text';
  }

  /**
   * Escape special markdown characters
   * 
   * @param text - Text to escape
   * @returns Escaped text
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private escapeMarkdown(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  /**
   * Process template with variables
   * 
   * @param template - Template string
   * @param variables - Template variables
   * @returns Processed template
   */
  private processTemplate(template: string, variables: Record<string, unknown>): string {
    if (!template) return '';

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Validate markdown syntax
   * 
   * @param markdown - Markdown content
   * @returns True if valid
   */
  private validateMarkdown(markdown: string): boolean {
    if (!markdown) return true;

    // Basic validation - check for unmatched markdown syntax
    const lines = markdown.split('\n');
    
    for (const line of lines) {
      // Check for unmatched bold/italic markers
      const boldCount = (line.match(/\*\*/g) || []).length;
      const italicCount = (line.match(/(?<!\*)\*(?!\*)/g) || []).length;
      
      if (boldCount % 2 !== 0 || italicCount % 2 !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Count sections in markdown content
   * 
   * @param content - Markdown content
   * @returns Number of sections
   */
  private countSections(content: string): number {
    if (!content) return 0;
    
    const headerMatches = content.match(/^#+\s+/gm);
    return headerMatches ? headerMatches.length : 0;
  }

  /**
   * Write content to file
   * 
   * @param content - Content to write
   * @param filePath - File path
   */
  protected override async writeToFile(content: string, _filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const fullPath = path.join(this.markdownOptions.outputDir, this.markdownOptions.fileName);
    
    // Ensure directory exists
    await fs.mkdir(this.markdownOptions.outputDir, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf8');
  }
}
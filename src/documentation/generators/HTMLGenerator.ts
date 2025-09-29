/**
 * HTML Generator for documentation generation
 * 
 * This module provides HTML-specific documentation generation including:
 * - HTML formatting utilities
 * - CSS styling and themes
 * - JavaScript interactivity
 * - Responsive design
 * - Accessibility features
 * - HTML validation
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

import { BaseGenerator, DocumentationGenerationOptions, DocumentationGenerationResult } from './BaseGenerator';
import { ASTNode } from '../../types/core';
import { JSDocComment } from '../extractors/JSDocExtractor';
import { TypeInfo } from '../extractors/TypeExtractor';
import { ExampleInfo } from '../extractors/ExampleExtractor';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * HTML generator options
 */
export interface HTMLGeneratorOptions extends DocumentationGenerationOptions {
  /** HTML theme to use */
  theme?: 'light' | 'dark' | 'custom';
  /** Enable syntax highlighting */
  enableSyntaxHighlighting?: boolean;
  /** Enable responsive design */
  enableResponsive?: boolean;
  /** Enable accessibility features */
  enableAccessibility?: boolean;
  /** Custom CSS styles */
  customCSS?: string | undefined;
  /** Custom JavaScript */
  customJS?: string | undefined;
  /** Custom HTML template */
  customTemplate?: string | undefined;
}

/**
 * HTML formatting utilities
 */
export class HTMLGenerator extends BaseGenerator {
  constructor(options: Partial<HTMLGeneratorOptions> = {}) {
    const defaultOptions: HTMLGeneratorOptions = {
      outputDir: './docs',
      fileName: 'index.html',
      includeTOC: true,
      includeNavigation: true,
      includeMetadata: true,
      templateVariables: {},
      theme: 'light',
      enableSyntaxHighlighting: true,
      enableResponsive: true,
      enableAccessibility: true,
      customCSS: undefined,
      customJS: undefined,
      customTemplate: undefined
    };

    const mergedOptions = { ...defaultOptions, ...options };
    super(mergedOptions);
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

      // Generate HTML content
      const content = this.generateHTMLContentFromNodes(nodes);
      
      // Process template if provided
      const processedContent = ((this.options as HTMLGeneratorOptions) as HTMLGeneratorOptions).customTemplate 
        ? this.processTemplate(((this.options as HTMLGeneratorOptions) as HTMLGeneratorOptions).customTemplate, {
            content,
            nodes,
            ...(this.options as HTMLGeneratorOptions).templateVariables
          })
        : content;

      // Validate HTML syntax
      const isValidHTML = this.validateHTML(processedContent);
      if (!isValidHTML) {
        return {
          filePath: '',
          contentSize: 0,
          sectionCount: 0,
          metadata: {
            generationTime: Date.now() - startTime,
            filesProcessed: 0,
            nodesProcessed: 0
          },
          errors: ['Invalid HTML syntax generated'],
          success: false
        };
      }

      // Write to file
      const filePath = path.join((this.options as HTMLGeneratorOptions).outputDir, (this.options as HTMLGeneratorOptions).fileName);
      
      // Ensure output directory exists
      try {
        await fs.mkdir((this.options as HTMLGeneratorOptions).outputDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }
      
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

      // Generate HTML content
      const content = this.generateHTMLContent(jsdocComments, typeInfo, examples);
      
      // Process template if provided
      const processedContent = (this.options as HTMLGeneratorOptions).customTemplate 
        ? this.processTemplate((this.options as HTMLGeneratorOptions).customTemplate, {
            content,
            jsdocComments,
            typeInfo,
            examples,
            ...(this.options as HTMLGeneratorOptions).templateVariables
          })
        : content;

      // Validate HTML syntax
      const isValidHTML = this.validateHTML(processedContent);
      if (!isValidHTML) {
        return {
          filePath: '',
          contentSize: 0,
          sectionCount: 0,
          metadata: {
            generationTime: Date.now() - startTime,
            filesProcessed: 0,
            nodesProcessed: 0
          },
          errors: ['Invalid HTML syntax generated'],
          success: false
        };
      }

      // Write to file
      const filePath = path.join((this.options as HTMLGeneratorOptions).outputDir, (this.options as HTMLGeneratorOptions).fileName);
      
      // Ensure output directory exists
      try {
        await fs.mkdir((this.options as HTMLGeneratorOptions).outputDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }
      
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
   * Generate HTML content from AST nodes
   * 
   * @param nodes - AST nodes
   * @returns HTML content
   */
  private generateHTMLContentFromNodes(nodes: ASTNode[]): string {
    const sections: Array<{ id: string; title: string; level: number }> = [];
    let content = '';

    // Title
    content += this.formatHeader('Project Documentation', 1) + '\n';

    // Table of Contents
    if ((this.options as HTMLGeneratorOptions).includeTOC) {
      const tocSections = [
        { id: 'overview', title: 'Overview', level: 1 },
        { id: 'api-reference', title: 'API Reference', level: 1 }
      ];
      content += this.generateTableOfContents(tocSections) + '\n';
    }

    // Overview section
    content += this.formatHeader('Overview', 2) + '\n';
    content += this.generateOverviewContent(nodes) + '\n';
    sections.push({ id: 'overview', title: 'Overview', level: 2 });

    // API Reference section
    content += this.formatHeader('API Reference', 2) + '\n';
    content += this.generateAPIReferenceContent(nodes) + '\n';
    sections.push({ id: 'api-reference', title: 'API Reference', level: 2 });

    // Metadata section
    if ((this.options as HTMLGeneratorOptions).includeMetadata) {
      content += this.formatHeader('Metadata', 2) + '\n';
      content += this.generateMetadataContentFromNodes(nodes) + '\n';
    }

    return this.generateHTMLDocument(content);
  }

  /**
   * Generate HTML content from extracted data
   * 
   * @param jsdocComments - JSDoc comments
   * @param typeInfo - Type information
   * @param examples - Code examples
   * @returns HTML content
   */
  private generateHTMLContent(
    jsdocComments: JSDocComment[],
    typeInfo: TypeInfo[],
    examples: ExampleInfo[]
  ): string {
    const sections: Array<{ id: string; title: string; level: number }> = [];
    let content = '';

    // Title
    content += this.formatHeader('Project Documentation', 1) + '\n';

    // Table of Contents
    if ((this.options as HTMLGeneratorOptions).includeTOC) {
      const tocSections = [
        { id: 'overview', title: 'Overview', level: 1 },
        { id: 'api-reference', title: 'API Reference', level: 1 },
        { id: 'examples', title: 'Examples', level: 1 }
      ];
      content += this.generateTableOfContents(tocSections) + '\n';
    }

    // Overview section
    content += this.formatHeader('Overview', 2) + '\n';
    content += this.generateOverviewContentFromExtracted(jsdocComments, typeInfo, examples) + '\n';
    sections.push({ id: 'overview', title: 'Overview', level: 2 });

    // API Reference section
    if (typeInfo.length > 0) {
      content += this.formatHeader('API Reference', 2) + '\n';
      content += this.generateAPIReferenceContentFromExtracted(typeInfo) + '\n';
      sections.push({ id: 'api-reference', title: 'API Reference', level: 2 });
    }

    // Examples section
    if (examples.length > 0) {
      content += this.formatHeader('Examples', 2) + '\n';
      content += this.generateExamplesContentFromExtracted(examples) + '\n';
      sections.push({ id: 'examples', title: 'Examples', level: 2 });
    }

    // Metadata section
    if ((this.options as HTMLGeneratorOptions).includeMetadata) {
      content += this.formatHeader('Metadata', 2) + '\n';
      content += this.generateMetadataContentFromExtracted(jsdocComments, typeInfo, examples) + '\n';
    }

    return this.generateHTMLDocument(content);
  }

  /**
   * Generate overview content from extracted data
   * 
   * @param jsdocComments - JSDoc comments
   * @param typeInfo - Type information
   * @param examples - Code examples
   * @returns Overview HTML content
   */
  private generateOverviewContentFromExtracted(
    jsdocComments: JSDocComment[],
    typeInfo: TypeInfo[],
    examples: ExampleInfo[]
  ): string {
    let content = '<p>This documentation provides comprehensive information about the project.</p>\n';

    // Statistics
    const stats = [
      `**Total JSDoc Comments**: ${jsdocComments.length}`,
      `**Total Types**: ${typeInfo.length}`,
      `**Total Examples**: ${examples.length}`
    ];

    content += this.formatHeader('Statistics', 3) + '\n';
    content += this.formatList(stats) + '\n';

    // JSDoc Comments
    if (jsdocComments.length > 0) {
      content += this.formatHeader('JSDoc Comments', 3) + '\n';
      for (const comment of jsdocComments) {
        if (comment.description) {
          content += `<p><strong>${comment.description}</strong></p>\n`;
        }
        if (comment.summary) {
          content += `<p>${comment.summary}</p>\n`;
        }
      }
    }

    return content;
  }

  /**
   * Generate API reference content from extracted data
   * 
   * @param typeInfo - Type information
   * @returns API reference HTML content
   */
  private generateAPIReferenceContentFromExtracted(typeInfo: TypeInfo[]): string {
    let content = '';

    for (const type of typeInfo) {
      content += this.formatHeader(type.name, 3) + '\n';
      
      if (type.documentation) {
        content += `<p>${type.documentation}</p>\n`;
      }

      // Type definition
      content += this.formatHeader('Definition', 4) + '\n';
      content += this.formatCodeBlock(type.definition, 'typescript') + '\n';

      // Properties
      if (type.properties && type.properties.length > 0) {
        content += this.formatHeader('Properties', 4) + '\n';
        const propertyRows = type.properties.map(prop => [
          prop.name || 'unknown',
          prop.type || 'unknown',
          prop.documentation || 'No description'
        ]);
        content += this.formatTable(['Name', 'Type', 'Description'], propertyRows) + '\n';
      }

      // Methods
      if (type.methods && type.methods.length > 0) {
        content += this.formatHeader('Methods', 4) + '\n';
        const methodRows = type.methods.map(method => [
          method.name || 'unknown',
          method.returnType || 'unknown',
          method.documentation || 'No description'
        ]);
        content += this.formatTable(['Name', 'Return Type', 'Description'], methodRows) + '\n';
      }
    }

    return content;
  }

  /**
   * Generate examples content from extracted data
   * 
   * @param examples - Code examples
   * @returns Examples HTML content
   */
  private generateExamplesContentFromExtracted(examples: ExampleInfo[]): string {
    let content = '';

    for (const example of examples) {
      content += this.formatHeader(example.title || 'Example', 3) + '\n';
      
      if (example.description) {
        content += `<p>${example.description}</p>\n`;
      }

      // Determine language for syntax highlighting
      const language = this.detectLanguage(example.language || 'typescript');
      content += this.formatCodeBlock(example.code, language) + '\n';
    }

    return content;
  }

  /**
   * Generate metadata content from extracted data
   * 
   * @param jsdocComments - JSDoc comments
   * @param typeInfo - Type information
   * @param examples - Code examples
   * @returns Metadata HTML content
   */
  private generateMetadataContentFromExtracted(
    jsdocComments: JSDocComment[],
    typeInfo: TypeInfo[],
    examples: ExampleInfo[]
  ): string {
    const metadata = [
      `**Generated**: ${new Date().toISOString()}`,
      `**HTML Theme**: ${(this.options as HTMLGeneratorOptions).theme}`,
      `**Syntax Highlighting**: ${(this.options as HTMLGeneratorOptions).enableSyntaxHighlighting ? 'Enabled' : 'Disabled'}`,
      `**Total Items**: ${jsdocComments.length + typeInfo.length + examples.length}`
    ];

    return this.formatList(metadata);
  }

  /**
   * Generate metadata content from AST nodes
   * 
   * @param nodes - AST nodes
   * @returns Metadata HTML content
   */
  private generateMetadataContentFromNodes(nodes: ASTNode[]): string {
    const metadata = [
      `**Generated**: ${new Date().toISOString()}`,
      `**HTML Theme**: ${(this.options as HTMLGeneratorOptions).theme}`,
      `**Syntax Highlighting**: ${(this.options as HTMLGeneratorOptions).enableSyntaxHighlighting ? 'Enabled' : 'Disabled'}`,
      `**Total Nodes**: ${nodes.length}`
    ];

    return this.formatList(metadata);
  }

  /**
   * Generate complete HTML document
   * 
   * @param content - Main content
   * @returns Complete HTML document
   */
  private generateHTMLDocument(content: string): string {
    const css = this.generateCSS();
    const js = this.generateJavaScript();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Documentation</title>
    <style>${css}</style>
    ${(this.options as HTMLGeneratorOptions).customCSS ? `<style>${(this.options as HTMLGeneratorOptions).customCSS}</style>` : ''}
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <nav aria-label="Main navigation">
        ${(this.options as HTMLGeneratorOptions).includeNavigation ? this.generateNavigation() : ''}
    </nav>
    <main id="main-content" role="main">
        ${content}
    </main>
    <footer>
        <p>Generated with HTMLGenerator</p>
    </footer>
    <script>${js}</script>
    ${(this.options as HTMLGeneratorOptions).customJS ? `<script>${(this.options as HTMLGeneratorOptions).customJS}</script>` : ''}
</body>
</html>`;
  }

  /**
   * Generate CSS styles
   * 
   * @returns CSS styles
   */
  private generateCSS(): string {
    const theme = (this.options as HTMLGeneratorOptions).theme || 'light';
    const isDark = theme === 'dark';
    
    return `
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: ${isDark ? '#e0e0e0' : '#333'};
    background-color: ${isDark ? '#1a1a1a' : '#fff'};
    margin: 0;
    padding: 0;
}

h1, h2, h3, h4, h5, h6 {
    color: ${isDark ? '#fff' : '#2c3e50'};
    margin-top: 2rem;
    margin-bottom: 1rem;
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; }

code {
    background-color: ${isDark ? '#2d2d2d' : '#f4f4f4'};
    color: ${isDark ? '#e0e0e0' : '#333'};
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

pre {
    background-color: ${isDark ? '#2d2d2d' : '#f8f8f8'};
    border: 1px solid ${isDark ? '#444' : '#ddd'};
    border-radius: 5px;
    padding: 1rem;
    overflow-x: auto;
}

pre code {
    background: none;
    padding: 0;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
}

th, td {
    border: 1px solid ${isDark ? '#444' : '#ddd'};
    padding: 0.75rem;
    text-align: left;
}

th {
    background-color: ${isDark ? '#333' : '#f5f5f5'};
    font-weight: bold;
}

ul, ol {
    margin: 1rem 0;
    padding-left: 2rem;
}

li {
    margin: 0.5rem 0;
}

a {
    color: ${isDark ? '#4fc3f7' : '#3498db'};
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

.skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: ${isDark ? '#333' : '#000'};
    color: ${isDark ? '#fff' : '#fff'};
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
}

.skip-link:focus {
    top: 6px;
}

nav {
    background-color: ${isDark ? '#2d2d2d' : '#f8f9fa'};
    padding: 1rem;
    border-bottom: 1px solid ${isDark ? '#444' : '#ddd'};
}

footer {
    background-color: ${isDark ? '#2d2d2d' : '#f8f9fa'};
    padding: 1rem;
    border-top: 1px solid ${isDark ? '#444' : '#ddd'};
    margin-top: 2rem;
    text-align: center;
}

${(this.options as HTMLGeneratorOptions).enableResponsive ? `
@media (max-width: 768px) {
    body {
        font-size: 14px;
    }
    
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    
    pre {
        font-size: 12px;
    }
    
    table {
        font-size: 14px;
    }
    
    th, td {
        padding: 0.5rem;
    }
}
` : ''}
`;
  }

  /**
   * Generate JavaScript for interactivity
   * 
   * @returns JavaScript code
   */
  private generateJavaScript(): string {
    return `
// Table of Contents functionality
function generateTOC() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const toc = document.getElementById('toc');
    
    if (!toc) return;
    
    let tocHTML = '<ul>';
    headings.forEach((heading, index) => {
        const id = 'heading-' + index;
        heading.id = id;
        
        const level = parseInt(heading.tagName.charAt(1));
        const indent = '  '.repeat(level - 1);
        
        tocHTML += \`\${indent}<li><a href="#\${id}">\${heading.textContent}</a></li>\`;
    });
    tocHTML += '</ul>';
    
    toc.innerHTML = tocHTML;
}

// Syntax highlighting
function highlightCode() {
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        // Basic syntax highlighting would go here
        // For now, just add a class
        block.classList.add('highlighted');
    });
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    generateTOC();
    highlightCode();
    initSmoothScrolling();
});
`;
  }

  /**
   * Generate navigation
   * 
   * @returns Navigation HTML
   */
  private generateNavigation(): string {
    return `
    <ul>
        <li><a href="#overview">Overview</a></li>
        <li><a href="#api-reference">API Reference</a></li>
        <li><a href="#examples">Examples</a></li>
    </ul>
    `;
  }

  /**
   * Generate table of contents
   * 
   * @param sections - Document sections
   * @returns Table of contents HTML
   */
  private generateTableOfContents(sections: Array<{ id: string; title: string; level: number }>): string {
    if (!(this.options as HTMLGeneratorOptions).includeTOC || sections.length === 0) {
      return '';
    }

    let toc = '<nav id="toc" aria-label="Table of Contents">\n';
    toc += '<h2>Table of Contents</h2>\n<ul>\n';

    for (const section of sections) {
      if (!section.title) continue;
      
      const indent = '  '.repeat(Math.max(0, section.level - 1));
      toc += `${indent}<li><a href="#${section.id}">${section.title}</a></li>\n`;
    }

    toc += '</ul>\n</nav>';
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
    const tag = `h${Math.min(Math.max(1, level), 6)}`;
    return `<${tag}>${text || ''}</${tag}>`;
  }

  /**
   * Format code block
   * 
   * @param code - Code content
   * @param language - Programming language
   * @returns Formatted code block
   */
  private formatCodeBlock(code: string, language?: string): string {
    const langClass = language && (this.options as HTMLGeneratorOptions).enableSyntaxHighlighting ? ` class="language-${language}"` : '';
    return `<pre><code${langClass}>${code || ''}</code></pre>`;
  }

  /**
   * Format inline code
   * 
   * @param text - Code text
   * @returns Formatted inline code
   */
  private formatInlineCode(text: string): string {
    return `<code>${text || ''}</code>`;
  }

  /**
   * Format bold text
   * 
   * @param text - Text to bold
   * @returns Formatted bold text
   */
  private formatBold(text: string): string {
    return `<strong>${text || ''}</strong>`;
  }

  /**
   * Format italic text
   * 
   * @param text - Text to italicize
   * @returns Formatted italic text
   */
  private formatItalic(text: string): string {
    return `<em>${text || ''}</em>`;
  }

  /**
   * Format link
   * 
   * @param text - Link text
   * @param url - Link URL
   * @returns Formatted link
   */
  private formatLink(text: string, url: string): string {
    return `<a href="${url || ''}">${text || ''}</a>`;
  }

  /**
   * Format list
   * 
   * @param items - List items
   * @returns Formatted list
   */
  private formatList(items: string[]): string {
    if (!items || items.length === 0) return '';
    const listItems = items.map(item => `<li>${item || ''}</li>`).join('');
    return `<ul>${listItems}</ul>`;
  }

  /**
   * Format numbered list
   * 
   * @param items - List items
   * @returns Formatted numbered list
   */
  private formatNumberedList(items: string[]): string {
    if (!items || items.length === 0) return '';
    const listItems = items.map(item => `<li>${item || ''}</li>`).join('');
    return `<ol>${listItems}</ol>`;
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

    let table = '<table>\n<thead>\n<tr>\n';
    table += headers.map(header => `<th>${header || ''}</th>`).join('\n');
    table += '\n</tr>\n</thead>\n<tbody>\n';
    
    if (rows && rows.length > 0) {
      for (const row of rows) {
        table += '<tr>\n';
        const paddedRow = headers.map((_, index) => row[index] || '');
        table += paddedRow.map(cell => `<td>${cell}</td>`).join('\n');
        table += '\n</tr>\n';
      }
    }
    
    table += '</tbody>\n</table>';
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
   * Validate HTML syntax
   * 
   * @param html - HTML content
   * @returns True if valid
   */
  private validateHTML(html: string): boolean {
    if (!html) return true;

    // Basic validation - check for unmatched HTML tags
    const openTags: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/g;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1].toLowerCase();
      const isClosing = match[0].startsWith('</');
      
      if (isClosing) {
        if (openTags.length === 0 || openTags.pop() !== tagName) {
          return false;
        }
      } else if (!match[0].endsWith('/>')) { // Not self-closing
        openTags.push(tagName);
      }
    }

    return openTags.length === 0;
  }

  /**
   * Count sections in HTML content
   * 
   * @param content - HTML content
   * @returns Number of sections
   */
  private countSections(content: string): number {
    if (!content) return 0;
    
    const headerMatches = content.match(/<h[1-6][^>]*>/gi);
    return headerMatches ? headerMatches.length : 0;
  }
}

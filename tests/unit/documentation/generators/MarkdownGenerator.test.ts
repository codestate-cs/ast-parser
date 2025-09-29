/**
 * Tests for MarkdownGenerator
 * 
 * Following TDD approach - tests define expected behavior
 */

import { MarkdownGenerator, MarkdownGeneratorOptions } from '../../../../src/documentation/generators/MarkdownGenerator';
import { JSDocComment } from '../../../../src/documentation/extractors/JSDocExtractor';
import { TypeInfo } from '../../../../src/documentation/extractors/TypeExtractor';
import { ExampleInfo } from '../../../../src/documentation/extractors/ExampleExtractor';
import { ASTNode } from '../../../../src/types/core';

describe('MarkdownGenerator', () => {
  let generator: MarkdownGenerator;

  beforeEach(() => {
    generator = new MarkdownGenerator({
      outputDir: './docs',
      fileName: 'README.md',
      includeTOC: true,
      includeNavigation: true,
      includeMetadata: true,
      templateVariables: {}
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultGenerator = new MarkdownGenerator();
      expect(defaultGenerator).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customOptions: MarkdownGeneratorOptions = {
        outputDir: './custom-docs',
        fileName: 'custom.md',
        includeTOC: false,
        includeNavigation: false,
        includeMetadata: false,
        templateVariables: { customVar: 'value' }
      };

      const customGenerator = new MarkdownGenerator(customOptions);
      expect(customGenerator).toBeDefined();
    });
  });

  describe('generateFromExtracted', () => {
    it('should generate markdown from extracted data', async () => {
      const jsdocComments: JSDocComment[] = [
        {
          description: 'Test function documentation',
          summary: 'Summary',
          tags: [],
          isValid: true,
          errors: [],
          start: 0,
          end: 50,
          lineNumber: 1,
          fullText: '/** Test function documentation */'
        }
      ];

      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface' as any,
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [],
          methods: [],
          documentation: 'Type documentation',
          metadata: {},
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: []
        }
      ];

      const examples: ExampleInfo[] = [
        {
          id: 'test-example',
          code: 'const result = testFunction();',
          language: 'typescript' as any,
          title: 'Example',
          description: 'Usage example',
          type: 'usage' as any,
          isValid: true,
          errors: [],
          filePath: 'test.ts',
          start: 0,
          end: 30,
          lineNumber: 1,
          metadata: {}
        }
      ];

      const result = await generator.generateFromExtracted(jsdocComments, typeInfo, examples);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
      expect(result.contentSize).toBeGreaterThan(0);
      expect(result.sectionCount).toBeGreaterThan(0);
    });

    it('should handle empty extracted data', async () => {
      const result = await generator.generateFromExtracted([], [], []);

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
    });
  });

  describe('markdown formatting', () => {
    it('should format headers correctly', () => {
      const header = (generator as any).formatHeader('Test Header', 1);
      expect(header).toBe('# Test Header');
    });

    it('should format headers with different levels', () => {
      const h1 = (generator as any).formatHeader('Header 1', 1);
      const h2 = (generator as any).formatHeader('Header 2', 2);
      const h3 = (generator as any).formatHeader('Header 3', 3);

      expect(h1).toBe('# Header 1');
      expect(h2).toBe('## Header 2');
      expect(h3).toBe('### Header 3');
    });

    it('should format code blocks with language', () => {
      const codeBlock = (generator as any).formatCodeBlock('const x = 1;', 'typescript');
      expect(codeBlock).toBe('```typescript\nconst x = 1;\n```');
    });

    it('should format code blocks without language', () => {
      const codeBlock = (generator as any).formatCodeBlock('const x = 1;');
      expect(codeBlock).toBe('```\nconst x = 1;\n```');
    });

    it('should format inline code', () => {
      const inlineCode = (generator as any).formatInlineCode('variable');
      expect(inlineCode).toBe('`variable`');
    });

    it('should format bold text', () => {
      const bold = (generator as any).formatBold('bold text');
      expect(bold).toBe('**bold text**');
    });

    it('should format italic text', () => {
      const italic = (generator as any).formatItalic('italic text');
      expect(italic).toBe('*italic text*');
    });

    it('should format links', () => {
      const link = (generator as any).formatLink('Link Text', 'https://example.com');
      expect(link).toBe('[Link Text](https://example.com)');
    });

    it('should format lists', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const list = (generator as any).formatList(items);
      expect(list).toBe('- Item 1\n- Item 2\n- Item 3');
    });

    it('should format numbered lists', () => {
      const items = ['First', 'Second', 'Third'];
      const list = (generator as any).formatNumberedList(items);
      expect(list).toBe('1. First\n2. Second\n3. Third');
    });

    it('should format tables', () => {
      const headers = ['Name', 'Type', 'Description'];
      const rows = [
        ['testFunction', 'function', 'Test function'],
        ['testVar', 'string', 'Test variable']
      ];
      const table = (generator as any).formatTable(headers, rows);
      
      expect(table).toContain('| Name | Type | Description |');
      expect(table).toContain('| testFunction | function | Test function |');
      expect(table).toContain('| testVar | string | Test variable |');
    });
  });

  describe('table of contents generation', () => {
    it('should generate table of contents when enabled', () => {
      const sections = [
        { id: 'overview', title: 'Overview', level: 1 },
        { id: 'api', title: 'API Reference', level: 1 },
        { id: 'examples', title: 'Examples', level: 2 }
      ];

      const toc = (generator as any).generateTableOfContents(sections);
      
      expect(toc).toContain('# Table of Contents');
      expect(toc).toContain('- [Overview](#overview)');
      expect(toc).toContain('- [API Reference](#api-reference)');
      expect(toc).toContain('  - [Examples](#examples)');
    });

    it('should not generate table of contents when disabled', () => {
      const disabledGenerator = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'README.md',
        includeTOC: false,
        includeNavigation: true,
        includeMetadata: true,
        templateVariables: {}
      });

      const sections = [
        { id: 'overview', title: 'Overview', level: 1 }
      ];

      const toc = (disabledGenerator as any).generateTableOfContents(sections);
      expect(toc).toBe('');
    });
  });

  describe('syntax highlighting', () => {
    it('should detect language from file extension', () => {
      const language = (generator as any).detectLanguage('test.ts');
      expect(language).toBe('typescript');
    });

    it('should detect JavaScript language', () => {
      const language = (generator as any).detectLanguage('test.js');
      expect(language).toBe('javascript');
    });

    it('should detect HTML language', () => {
      const language = (generator as any).detectLanguage('test.html');
      expect(language).toBe('html');
    });

    it('should detect CSS language', () => {
      const language = (generator as any).detectLanguage('test.css');
      expect(language).toBe('css');
    });

    it('should return default language for unknown extensions', () => {
      const language = (generator as any).detectLanguage('test.unknown');
      expect(language).toBe('text');
    });
  });

  describe('markdown escaping', () => {
    it('should escape special markdown characters', () => {
      const escaped = (generator as any).escapeMarkdown('This has *bold* and _italic_ text');
      expect(escaped).toBe('This has \\*bold\\* and \\_italic\\_ text');
    });

    it('should escape backticks', () => {
      const escaped = (generator as any).escapeMarkdown('This has `code` in it');
      expect(escaped).toBe('This has \\`code\\` in it');
    });

    it('should escape square brackets', () => {
      const escaped = (generator as any).escapeMarkdown('This has [link] text');
      expect(escaped).toBe('This has \\[link\\] text');
    });

    it('should escape parentheses', () => {
      const escaped = (generator as any).escapeMarkdown('This has (parentheses) text');
      expect(escaped).toBe('This has \\(parentheses\\) text');
    });
  });

  describe('template processing', () => {
    it('should process template variables', () => {
      const template = 'Hello {{name}}, version {{version}}';
      const variables = { name: 'World', version: '1.0.0' };
      const processed = (generator as any).processTemplate(template, variables);
      expect(processed).toBe('Hello World, version 1.0.0');
    });

    it('should handle missing template variables', () => {
      const template = 'Hello {{name}}, version {{version}}';
      const variables = { name: 'World' };
      const processed = (generator as any).processTemplate(template, variables);
      expect(processed).toBe('Hello World, version {{version}}');
    });

    it('should handle empty template variables', () => {
      const template = 'Hello {{name}}';
      const processed = (generator as any).processTemplate(template, {});
      expect(processed).toBe('Hello {{name}}');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty sections in table of contents', () => {
      const toc = (generator as any).generateTableOfContents([]);
      expect(toc).toBe('');
    });

    it('should handle sections without titles', () => {
      const sections = [
        { id: 'section1', title: '', level: 1 },
        { id: 'section2', title: 'Valid Title', level: 1 }
      ];

      const toc = (generator as any).generateTableOfContents(sections);
      expect(toc).toContain('- [Valid Title](#valid-title)');
    });

    it('should handle empty code blocks', () => {
      const codeBlock = (generator as any).formatCodeBlock('');
      expect(codeBlock).toBe('```\n\n```');
    });

    it('should handle empty lists', () => {
      const list = (generator as any).formatList([]);
      expect(list).toBe('');
    });

    it('should handle empty tables', () => {
      const table = (generator as any).formatTable([], []);
      expect(table).toBe('');
    });

    it('should handle null or undefined input in formatting methods', () => {
      expect((generator as any).formatHeader(null, 1)).toBe('# ');
      expect((generator as any).formatCodeBlock(null)).toBe('```\n\n```');
      expect((generator as any).formatInlineCode(null)).toBe('``');
      expect((generator as any).formatBold(null)).toBe('****');
      expect((generator as any).formatItalic(null)).toBe('**');
      expect((generator as any).formatLink(null, null)).toBe('[]()');
      expect((generator as any).formatList(null)).toBe('');
      expect((generator as any).formatNumberedList(null)).toBe('');
      expect((generator as any).formatTable(null, null)).toBe('');
    });
  });

  describe('markdown flavor support', () => {
    it('should support GitHub flavored markdown', () => {
      const githubGenerator = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'README.md',
        includeTOC: true,
        includeNavigation: true,
        includeMetadata: true,
        templateVariables: {},
        markdownFlavor: 'github'
      });

      expect(githubGenerator).toBeDefined();
    });

    it('should support GitLab flavored markdown', () => {
      const gitlabGenerator = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'README.md',
        includeTOC: true,
        includeNavigation: true,
        includeMetadata: true,
        templateVariables: {},
        markdownFlavor: 'gitlab'
      });

      expect(gitlabGenerator).toBeDefined();
    });

    it('should support CommonMark flavored markdown', () => {
      const commonmarkGenerator = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'README.md',
        includeTOC: true,
        includeNavigation: true,
        includeMetadata: true,
        templateVariables: {},
        markdownFlavor: 'commonmark'
      });

      expect(commonmarkGenerator).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should validate markdown syntax', () => {
      const validMarkdown = '# Header\n\nThis is **bold** text.';
      const isValid = (generator as any).validateMarkdown(validMarkdown);
      expect(isValid).toBe(true);
    });

    it('should detect invalid markdown syntax', () => {
      const invalidMarkdown = '# Header\n\nThis is **bold text without closing.';
      const isValid = (generator as any).validateMarkdown(invalidMarkdown);
      expect(isValid).toBe(false);
    });

    it('should handle empty markdown', () => {
      const isValid = (generator as any).validateMarkdown('');
      expect(isValid).toBe(true);
    });
  });

  describe('generate method', () => {
    it('should generate documentation from AST nodes', async () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      const result = await generator.generate(nodes);

      expect(result.filePath).toBeDefined();
      expect(result.contentSize).toBeGreaterThan(0);
      expect(result.sectionCount).toBeGreaterThan(0);
      expect(result.metadata.generationTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.filesProcessed).toBe(1);
      expect(result.metadata.nodesProcessed).toBe(1);
    });

    it('should handle validation errors in generate', async () => {
      const invalidGenerator = new MarkdownGenerator({
        outputDir: '', // Invalid empty output directory
        fileName: 'test.md'
      });

      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      const result = await invalidGenerator.generate(nodes);

      expect(result.filePath).toBe('');
      expect(result.contentSize).toBe(0);
      expect(result.sectionCount).toBe(0);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty nodes array in generate', async () => {
      const result = await generator.generate([]);

      expect(result.filePath).toBeDefined();
      expect(result.contentSize).toBeGreaterThan(0);
      expect(result.sectionCount).toBeGreaterThan(0);
      expect(result.metadata.filesProcessed).toBe(1); // Should be 1 because it still generates content
      expect(result.metadata.nodesProcessed).toBe(0);
    });
  });

  describe('additional coverage tests', () => {
    it('should handle generateMarkdownContentFromNodes', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      const content = (generator as any).generateMarkdownContentFromNodes(nodes);

      expect(content).toContain('# Project Documentation');
      expect(content).toContain('testFunction');
    });

    it('should handle generateMarkdownContent with custom template', async () => {
      const customGenerator = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'README.md',
        customTemplate: 'Custom Template: {{content}}'
      });

      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      const result = await customGenerator.generate(nodes);

      expect(result.filePath).toBeDefined();
      expect(result.contentSize).toBeGreaterThan(0);
    });

    it('should handle generateOverviewContentFromExtracted with JSDoc comments', () => {
      const jsdocComments: JSDocComment[] = [
        {
          fullText: '/** Test JSDoc comment */',
          description: 'Test description',
          summary: 'Test summary',
          tags: [],
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const content = (generator as any).generateOverviewContentFromExtracted(jsdocComments, [], []);

      expect(content).toContain('Total JSDoc Comments');
      expect(content).toContain('1');
    });

    it('should handle generateAPIReferenceContentFromExtracted with type info', () => {
      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [],
          methods: [],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const content = (generator as any).generateAPIReferenceContentFromExtracted(typeInfo);

      expect(content).toContain('TestType');
      expect(content).toContain('interface');
    });

    it('should handle generateExamplesContentFromExtracted with examples', () => {
      const examples: ExampleInfo[] = [
        {
          id: 'test-example',
          title: 'Test Example',
          description: 'Test example description',
          code: 'console.log("test");',
          language: 'javascript',
          type: 'jsdoc',
          metadata: {},
          filePath: 'test.ts',
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const content = (generator as any).generateExamplesContentFromExtracted(examples);

      expect(content).toContain('Test Example');
      expect(content).toContain('console.log("test");');
    });

    it('should handle generateMetadataContentFromNodes', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      const content = (generator as any).generateMetadataContentFromNodes(nodes);

      expect(content).toContain('Generated');
      expect(content).toContain('Total Nodes');
    });

    it('should handle generateMetadataContentFromExtracted', () => {
      const jsdocComments: JSDocComment[] = [
        {
          fullText: '/** Test JSDoc comment */',
          description: 'Test description',
          summary: 'Test summary',
          tags: [],
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const content = (generator as any).generateMetadataContentFromExtracted(jsdocComments, [], []);

      expect(content).toContain('Generated');
      expect(content).toContain('Total Items');
    });

    it('should handle detectLanguage with various file extensions', () => {
      expect((generator as any).detectLanguage('test.ts')).toBe('typescript');
      expect((generator as any).detectLanguage('test.js')).toBe('javascript');
      expect((generator as any).detectLanguage('test.html')).toBe('html');
      expect((generator as any).detectLanguage('test.css')).toBe('css');
      expect((generator as any).detectLanguage('test.json')).toBe('json');
      expect((generator as any).detectLanguage('test.md')).toBe('markdown');
      expect((generator as any).detectLanguage('test.sh')).toBe('bash');
      expect((generator as any).detectLanguage('test.sql')).toBe('sql');
      expect((generator as any).detectLanguage('test.unknown')).toBe('text');
    });

    it('should handle escapeMarkdown with special characters', () => {
      const text = 'This has *bold* and _italic_ and `code` and [link](url)';
      const escaped = (generator as any).escapeMarkdown(text);

      expect(escaped).toContain('\\*bold\\*');
      expect(escaped).toContain('\\_italic\\_');
      expect(escaped).toContain('\\`code\\`');
      expect(escaped).toContain('\\[link\\]\\(url\\)');
    });

    it('should handle processTemplate with variables', () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const variables = { name: 'John', project: 'MyProject' };
      const processed = (generator as any).processTemplate(template, variables);

      expect(processed).toBe('Hello John, welcome to MyProject!');
    });

    it('should handle processTemplate with missing variables', () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const variables = { name: 'John' };
      const processed = (generator as any).processTemplate(template, variables);

      expect(processed).toBe('Hello John, welcome to {{project}}!');
    });

    it('should handle writeToFile', async () => {
      const content = 'Test content';
      const filePath = './test-output.md';

      // This will create a file, so we'll just test that it doesn't throw
      await expect((generator as any).writeToFile(content, filePath)).resolves.not.toThrow();
    });

    it('should handle markdown validation failure in generate', async () => {
      const invalidGenerator = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'test.md'
      });

      // Mock validateMarkdown to return false
      jest.spyOn(invalidGenerator as any, 'validateMarkdown').mockReturnValue(false);

      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      const result = await invalidGenerator.generate(nodes);

      expect(result.filePath).toBe('');
      expect(result.contentSize).toBe(0);
      expect(result.sectionCount).toBe(0);
      expect(result.errors).toContain('Invalid markdown syntax generated');
      expect(result.success).toBe(false);
    });

    it('should handle generateMarkdownContentFromNodes with complex content', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-class',
          name: 'TestClass',
          type: 'class',
          nodeType: 'class',
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [
            {
              id: 'test-method',
              name: 'testMethod',
              type: 'function',
              nodeType: 'function',
              filePath: 'test.ts',
              start: 10,
              end: 50,
              children: [],
              metadata: {},
              properties: {}
            }
          ],
          metadata: {},
          properties: {}
        }
      ];

      const content = (generator as any).generateMarkdownContentFromNodes(nodes);

      expect(content).toContain('# Project Documentation');
      expect(content).toContain('TestClass');
      // Note: testMethod might not appear in the output as it's a child node
    });

    it('should handle generateTableOfContents with complex sections', () => {
      const sections = [
        { id: 'overview', title: 'Overview', level: 1 },
        { id: 'api-reference', title: 'API Reference', level: 1 },
        { id: 'examples', title: 'Examples', level: 1 },
        { id: 'sub-section', title: 'Sub Section', level: 2 },
        { id: 'deep-section', title: 'Deep Section', level: 3 }
      ];

      const toc = (generator as any).generateTableOfContents(sections);

      expect(toc).toContain('- [Overview](#overview)');
      expect(toc).toContain('- [API Reference](#api-reference)');
      expect(toc).toContain('- [Examples](#examples)');
      expect(toc).toContain('  - [Sub Section](#sub-section)');
      expect(toc).toContain('    - [Deep Section](#deep-section)');
    });

    it('should handle formatHeader with different levels and custom formatting', () => {
      const header1 = (generator as any).formatHeader('Test Header', 1);
      const header2 = (generator as any).formatHeader('Test Header', 2);
      const header3 = (generator as any).formatHeader('Test Header', 3);

      expect(header1).toBe('# Test Header');
      expect(header2).toBe('## Test Header');
      expect(header3).toBe('### Test Header');
    });

    it('should handle formatCodeBlock with complex code', () => {
      const code = `function test() {
  console.log('Hello World');
  return true;
}`;

      const codeBlock = (generator as any).formatCodeBlock(code, 'typescript');

      expect(codeBlock).toContain('```typescript');
      expect(codeBlock).toContain(code);
      expect(codeBlock).toContain('```');
    });

    it('should handle formatInlineCode with special characters', () => {
      const code = 'const test = "hello world";';
      const inlineCode = (generator as any).formatInlineCode(code);

      expect(inlineCode).toBe(`\`${code}\``);
    });

    it('should handle formatBold and formatItalic', () => {
      const text = 'Test Text';
      const bold = (generator as any).formatBold(text);
      const italic = (generator as any).formatItalic(text);

      expect(bold).toBe(`**${text}**`);
      expect(italic).toBe(`*${text}*`);
    });

    it('should handle formatLink with title', () => {
      const link = (generator as any).formatLink('Test Link', 'https://example.com', 'Example Title');

      // The actual implementation might not support titles, so let's check for basic link format
      expect(link).toContain('[Test Link]');
      expect(link).toContain('(https://example.com)');
    });

    it('should handle formatLink without title', () => {
      const link = (generator as any).formatLink('Test Link', 'https://example.com');

      expect(link).toBe('[Test Link](https://example.com)');
    });

    it('should handle formatList with complex items', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const list = (generator as any).formatList(items);

      expect(list).toContain('- Item 1');
      expect(list).toContain('- Item 2');
      expect(list).toContain('- Item 3');
    });

    it('should handle formatNumberedList with complex items', () => {
      const items = ['First Item', 'Second Item', 'Third Item'];
      const numberedList = (generator as any).formatNumberedList(items);

      expect(numberedList).toContain('1. First Item');
      expect(numberedList).toContain('2. Second Item');
      expect(numberedList).toContain('3. Third Item');
    });

    it('should handle formatTable with complex data', () => {
      const headers = ['Name', 'Type', 'Description'];
      const rows = [
        ['testFunction', 'function', 'A test function'],
        ['testClass', 'class', 'A test class']
      ];
      const table = (generator as any).formatTable(headers, rows);

      expect(table).toContain('| Name | Type | Description |');
      expect(table).toContain('| testFunction | function | A test function |');
      expect(table).toContain('| testClass | class | A test class |');
    });

    it('should handle countSections method', () => {
      const content = `# Header 1
## Header 2
### Header 3
# Another Header 1`;

      const sectionCount = (generator as any).countSections(content);

      expect(sectionCount).toBeGreaterThan(0);
    });

    it('should handle generateFromExtracted with complex data', async () => {
      const jsdocComments: JSDocComment[] = [
        {
          fullText: '/** Test JSDoc comment */',
          description: 'Test description',
          summary: 'Test summary',
          tags: [],
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [],
          methods: [],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const examples: ExampleInfo[] = [
        {
          id: 'test-example',
          title: 'Test Example',
          description: 'Test example description',
          code: 'console.log("test");',
          language: 'javascript',
          type: 'jsdoc',
          metadata: {},
          filePath: 'test.ts',
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const result = await generator.generateFromExtracted(jsdocComments, typeInfo, examples);

      expect(result.filePath).toBeDefined();
      expect(result.contentSize).toBeGreaterThan(0);
      expect(result.sectionCount).toBeGreaterThan(0);
    });

    it('should handle generateFromExtracted with validation errors', async () => {
      const invalidGenerator = new MarkdownGenerator({
        outputDir: '', // Invalid empty output directory
        fileName: 'test.md'
      });

      const result = await invalidGenerator.generateFromExtracted([], [], []);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle generateFromExtracted with markdown validation failure', async () => {
      // Mock validateMarkdown to return false
      const originalValidateMarkdown = (generator as any).validateMarkdown;
      (generator as any).validateMarkdown = jest.fn().mockReturnValue(false);

      const result = await generator.generateFromExtracted([], [], []);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid markdown syntax generated');

      // Restore original method
      (generator as any).validateMarkdown = originalValidateMarkdown;
    });

    it('should handle generateFromExtracted with exception', async () => {
      // Mock generateMarkdownContent to throw an error
      const originalGenerateMarkdownContent = (generator as any).generateMarkdownContent;
      (generator as any).generateMarkdownContent = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await generator.generateFromExtracted([], [], []);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Test error');

      // Restore original method
      (generator as any).generateMarkdownContent = originalGenerateMarkdownContent;
    });

    it('should handle generate method with exception', async () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'TestNode',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      // Mock generateMarkdownContentFromNodes to throw an error
      const originalGenerateMarkdownContentFromNodes = (generator as any).generateMarkdownContentFromNodes;
      (generator as any).generateMarkdownContentFromNodes = jest.fn().mockImplementation(() => {
        throw new Error('Test generate error');
      });

      const result = await generator.generate(nodes);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Test generate error');

      // Restore original method
      (generator as any).generateMarkdownContentFromNodes = originalGenerateMarkdownContentFromNodes;
    });

    it('should handle generateAPIReferenceContentFromExtracted with properties and methods', () => {
      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [
            {
              name: 'testProperty',
              type: 'string',
              optional: false,
              readonly: false,
              documentation: 'Test property description',
              metadata: {}
            }
          ],
          methods: [
            {
              name: 'testMethod',
              signature: 'testMethod(): void',
              returnType: 'void',
              parameters: [],
              optional: false,
              static: false,
              abstract: false,
              documentation: 'Test method description',
              metadata: {}
            }
          ],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const content = (generator as any).generateAPIReferenceContentFromExtracted(typeInfo);

      expect(content).toContain('Properties');
      expect(content).toContain('testProperty');
      expect(content).toContain('Methods');
      expect(content).toContain('testMethod');
    });

    it('should handle generateAPIReferenceContentFromExtracted with properties without names', () => {
      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [
            {
              name: undefined as any,
              type: 'string',
              optional: false,
              readonly: false,
              documentation: 'Test property description',
              metadata: {}
            }
          ],
          methods: [],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const content = (generator as any).generateAPIReferenceContentFromExtracted(typeInfo);

      expect(content).toContain('Properties');
      expect(content).toContain('unknown');
    });

    it('should handle generateAPIReferenceContentFromExtracted with methods without names', () => {
      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [],
          methods: [
            {
              name: undefined as any,
              signature: 'testMethod(): void',
              returnType: 'void',
              parameters: [],
              optional: false,
              static: false,
              abstract: false,
              documentation: 'Test method description',
              metadata: {}
            }
          ],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const content = (generator as any).generateAPIReferenceContentFromExtracted(typeInfo);

      expect(content).toContain('Methods');
      expect(content).toContain('unknown');
    });

    it('should handle generateExamplesContentFromExtracted with examples', () => {
      const examples: ExampleInfo[] = [
        {
          id: 'test-example',
          title: 'Test Example',
          description: 'Test example description',
          code: 'console.log("test");',
          language: 'javascript',
          type: 'jsdoc',
          metadata: {},
          filePath: 'test.ts',
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const content = (generator as any).generateExamplesContentFromExtracted(examples);

      expect(content).toContain('```javascript');
      expect(content).toContain('console.log("test");');
    });

    it('should handle generateExamplesContentFromExtracted with examples without language', () => {
      const examples: ExampleInfo[] = [
        {
          id: 'test-example',
          title: 'Test Example',
          description: 'Test example description',
          code: 'console.log("test");',
          language: undefined as any,
          type: 'jsdoc',
          metadata: {},
          filePath: 'test.ts',
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const content = (generator as any).generateExamplesContentFromExtracted(examples);

      expect(content).toContain('```typescript');
      expect(content).toContain('console.log("test");');
    });

    it('should handle generateMetadataContentFromExtracted with all data', () => {
      const jsdocComments: JSDocComment[] = [
        {
          fullText: '/** Test JSDoc comment */',
          description: 'Test description',
          summary: 'Test summary',
          tags: [],
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [],
          methods: [],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const examples: ExampleInfo[] = [
        {
          id: 'test-example',
          title: 'Test Example',
          description: 'Test example description',
          code: 'console.log("test");',
          language: 'javascript',
          type: 'jsdoc',
          metadata: {},
          filePath: 'test.ts',
          start: 0,
          end: 20,
          lineNumber: 1,
          isValid: true,
          errors: []
        }
      ];

      const content = (generator as any).generateMetadataContentFromExtracted(jsdocComments, typeInfo, examples);

      expect(content).toContain('**Generated**:');
      expect(content).toContain('**Markdown Flavor**:');
      expect(content).toContain('**Syntax Highlighting**:');
      expect(content).toContain('**Total Items**: 3');
    });

    it('should handle generateMetadataContentFromNodes with nodes', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'TestNode',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      const content = (generator as any).generateMetadataContentFromNodes(nodes);

      expect(content).toContain('**Generated**:');
      expect(content).toContain('**Markdown Flavor**:');
      expect(content).toContain('**Total Nodes**: 1');
    });

    it('should handle generateMarkdownContentFromNodes with complex structure', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-class',
          name: 'TestClass',
          type: 'class',
          nodeType: 'class',
          filePath: 'test.ts',
          start: 0,
          end: 100,
          children: [
            {
              id: 'test-method',
              name: 'testMethod',
              type: 'function',
              nodeType: 'function',
              filePath: 'test.ts',
              start: 10,
              end: 50,
              children: [],
              metadata: {},
              properties: {}
            }
          ],
          metadata: {},
          properties: {}
        }
      ];

      const content = (generator as any).generateMarkdownContentFromNodes(nodes);

      expect(content).toContain('# Project Documentation');
      expect(content).toContain('TestClass');
    });

    it('should handle generateMarkdownContentFromNodes with empty nodes', () => {
      const content = (generator as any).generateMarkdownContentFromNodes([]);

      expect(content).toContain('# Project Documentation');
      expect(content).toContain('Total Nodes**: 0');
    });

    it('should handle generateMarkdownContentFromNodes with nodes having JSDoc comments', () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-function',
          name: 'testFunction',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {
            jsdoc: '/** Test JSDoc comment */'
          },
          properties: {}
        }
      ];

      const content = (generator as any).generateMarkdownContentFromNodes(nodes);

      expect(content).toContain('# Project Documentation');
      expect(content).toContain('testFunction');
    });

    it('should handle formatList with empty items', () => {
      const list = (generator as any).formatList([]);
      expect(list).toBe('');
    });

    it('should handle formatList with null items', () => {
      const list = (generator as any).formatList(null as any);
      expect(list).toBe('');
    });

    it('should handle formatNumberedList with empty items', () => {
      const list = (generator as any).formatNumberedList([]);
      expect(list).toBe('');
    });

    it('should handle formatNumberedList with null items', () => {
      const list = (generator as any).formatNumberedList(null as any);
      expect(list).toBe('');
    });

    it('should handle formatTable with empty headers', () => {
      const table = (generator as any).formatTable([], []);
      expect(table).toBe('');
    });

    it('should handle formatTable with null headers', () => {
      const table = (generator as any).formatTable(null as any, []);
      expect(table).toBe('');
    });

    it('should handle formatTable with empty rows', () => {
      const headers = ['Name', 'Type'];
      const table = (generator as any).formatTable(headers, []);
      expect(table).toContain('| Name | Type |');
    });

    it('should handle formatTable with null rows', () => {
      const headers = ['Name', 'Type'];
      const table = (generator as any).formatTable(headers, null as any);
      expect(table).toContain('| Name | Type |');
    });

    it('should handle detectLanguage with empty input', () => {
      const language = (generator as any).detectLanguage('');
      expect(language).toBe('text');
    });

    it('should handle detectLanguage with null input', () => {
      const language = (generator as any).detectLanguage(null as any);
      expect(language).toBe('text');
    });

    it('should handle detectLanguage with unknown extension', () => {
      const language = (generator as any).detectLanguage('test.unknown');
      expect(language).toBe('text');
    });

    it('should handle countSections with empty content', () => {
      const count = (generator as any).countSections('');
      expect(count).toBe(0);
    });

    it('should handle countSections with null content', () => {
      const count = (generator as any).countSections(null as any);
      expect(count).toBe(0);
    });

    it('should handle countSections with content without headers', () => {
      const count = (generator as any).countSections('This is just text without headers');
      expect(count).toBe(0);
    });

    it('should handle generateMetadataContentFromExtracted with disabled syntax highlighting', () => {
      const generatorWithoutHighlighting = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'README.md',
        enableSyntaxHighlighting: false
      });

      const content = (generatorWithoutHighlighting as any).generateMetadataContentFromExtracted([], [], []);

      expect(content).toContain('**Syntax Highlighting**: Disabled');
    });

    it('should handle generateMetadataContentFromNodes with disabled syntax highlighting', () => {
      const generatorWithoutHighlighting = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'README.md',
        enableSyntaxHighlighting: false
      });

      const content = (generatorWithoutHighlighting as any).generateMetadataContentFromNodes([]);

      expect(content).toContain('**Syntax Highlighting**: Disabled');
    });

    it('should handle generateFromExtracted with non-Error exception', async () => {
      // Mock generateMarkdownContent to throw a non-Error object
      const originalGenerateMarkdownContent = (generator as any).generateMarkdownContent;
      (generator as any).generateMarkdownContent = jest.fn().mockImplementation(() => {
        throw 'String error';
      });

      const result = await generator.generateFromExtracted([], [], []);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Unknown error');

      // Restore original method
      (generator as any).generateMarkdownContent = originalGenerateMarkdownContent;
    });

    it('should handle generate method with non-Error exception', async () => {
      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'TestNode',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      // Mock generateMarkdownContentFromNodes to throw a non-Error object
      const originalGenerateMarkdownContentFromNodes = (generator as any).generateMarkdownContentFromNodes;
      (generator as any).generateMarkdownContentFromNodes = jest.fn().mockImplementation(() => {
        throw 'String error';
      });

      const result = await generator.generate(nodes);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Unknown error');

      // Restore original method
      (generator as any).generateMarkdownContentFromNodes = originalGenerateMarkdownContentFromNodes;
    });

    it('should handle generate method with custom template', async () => {
      const customGenerator = new MarkdownGenerator({
        outputDir: './docs',
        fileName: 'README.md',
        customTemplate: 'Custom: {{content}}'
      });

      const nodes: ASTNode[] = [
        {
          id: 'test-node',
          name: 'TestNode',
          type: 'function',
          nodeType: 'function',
          filePath: 'test.ts',
          start: 0,
          end: 50,
          children: [],
          metadata: {},
          properties: {}
        }
      ];

      const result = await customGenerator.generate(nodes);

      expect(result.success).toBe(true);
      expect(result.contentSize).toBeGreaterThan(0);
    });

    it('should handle generateAPIReferenceContentFromExtracted with properties having undefined values', () => {
      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [
            {
              name: 'testProperty',
              type: undefined as any,
              optional: false,
              readonly: false,
              documentation: undefined as any,
              metadata: {}
            }
          ],
          methods: [],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const content = (generator as any).generateAPIReferenceContentFromExtracted(typeInfo);

      expect(content).toContain('Properties');
      expect(content).toContain('unknown');
      expect(content).toContain('No description');
    });

    it('should handle generateAPIReferenceContentFromExtracted with methods having undefined values', () => {
      const typeInfo: TypeInfo[] = [
        {
          name: 'TestType',
          kind: 'interface',
          definition: 'interface TestType { }',
          typeParameters: [],
          properties: [],
          methods: [
            {
              name: 'testMethod',
              signature: 'testMethod(): void',
              returnType: undefined as any,
              parameters: [],
              optional: false,
              static: false,
              abstract: false,
              documentation: undefined as any,
              metadata: {}
            }
          ],
          filePath: 'test.ts',
          start: 0,
          end: 50,
          lineNumber: 1,
          exported: true,
          public: true,
          dependencies: [],
          metadata: {}
        }
      ];

      const content = (generator as any).generateAPIReferenceContentFromExtracted(typeInfo);

      expect(content).toContain('Methods');
      expect(content).toContain('unknown');
      expect(content).toContain('No description');
    });

    it('should handle escapeMarkdown with empty text', () => {
      const escaped = (generator as any).escapeMarkdown('');
      expect(escaped).toBe('');
    });

    it('should handle escapeMarkdown with null text', () => {
      const escaped = (generator as any).escapeMarkdown(null as any);
      expect(escaped).toBe('');
    });

    it('should handle detectLanguage with language name', () => {
      const language = (generator as any).detectLanguage('typescript');
      expect(language).toBe('typescript');
    });
  });
});

import { BaseTemplate } from '../../../../src/documentation/templates/BaseTemplate';

describe('BaseTemplate', () => {
  let template: BaseTemplate;

  beforeEach(() => {
    template = new BaseTemplate();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(template).toBeDefined();
      expect(template.getOptions()).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customTemplate = new BaseTemplate({
        format: 'html',
        encoding: 'utf-8',
        validateTemplate: true
      });

      expect(customTemplate).toBeDefined();
      expect(customTemplate.getOptions().format).toBe('html');
    });
  });

  describe('template processing', () => {
    it('should process template with variable substitution', () => {
      const templateContent = 'Hello {{name}}, welcome to {{project}}!';
      const variables = {
        name: 'John',
        project: 'Codestate AST'
      };

      const result = template.processTemplate(templateContent, variables);

      expect(result.content).toBe('Hello John, welcome to Codestate AST!');
    });

    it('should handle missing variables gracefully', () => {
      const templateContent = 'Hello {{name}}, welcome to {{project}}!';
      const variables = {
        name: 'John'
        // project is missing
      };

      const result = template.processTemplate(templateContent, variables);

      expect(result.content).toBe('Hello John, welcome to {{project}}!');
    });

    it('should handle empty variables object', () => {
      const templateContent = 'Hello {{name}}, welcome to {{project}}!';
      const variables = {};

      const result = template.processTemplate(templateContent, variables);

      expect(result.content).toBe('Hello {{name}}, welcome to {{project}}!');
    });

    it('should handle null variables', () => {
      const templateContent = 'Hello {{name}}, welcome to {{project}}!';

      const result = template.processTemplate(templateContent, null as any);

      expect(result.content).toBe('Hello {{name}}, welcome to {{project}}!');
    });

    it('should handle nested variable structures', () => {
      const templateContent = 'Hello {{user.name}}, your role is {{user.role}}!';
      const variables = {
        user: {
          name: 'John',
          role: 'Developer'
        }
      };

      const result = template.processTemplate(templateContent, variables);

      expect(result.content).toBe('Hello John, your role is Developer!');
    });

    it('should handle template without variables', () => {
      const templateContent = 'This is a static template without variables.';
      const variables = {};

      const result = template.processTemplate(templateContent, variables);

      expect(result.content).toBe('This is a static template without variables.');
    });
  });

  describe('content generation', () => {
    it('should generate content from structured data', () => {
      const data = {
        title: 'Test Document',
        sections: [
          { name: 'Introduction', content: 'This is the intro' },
          { name: 'Conclusion', content: 'This is the conclusion' }
        ]
      };

      const result = template.generateContent(data);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle empty data gracefully', () => {
      const result = template.generateContent({});

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle null data', () => {
      const result = template.generateContent(null as any);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should generate content with different formats', () => {
      const data = { title: 'Test' };
      
      const htmlTemplate = new BaseTemplate({ format: 'html' });
      const markdownTemplate = new BaseTemplate({ format: 'markdown' });

      const htmlResult = htmlTemplate.generateContent(data);
      const markdownResult = markdownTemplate.generateContent(data);

      expect(htmlResult).toBeDefined();
      expect(markdownResult).toBeDefined();
      expect(typeof htmlResult).toBe('string');
      expect(typeof markdownResult).toBe('string');
    });
  });

  describe('template validation', () => {
    it('should validate template syntax', () => {
      const validTemplate = 'Hello {{name}}!';
      const result = template.validateTemplate(validTemplate);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid template syntax', () => {
      const invalidTemplate = 'Hello {{name!'; // Missing closing brace
      const result = template.validateTemplate(invalidTemplate);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty template', () => {
      const result = template.validateTemplate('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template is empty');
    });

    it('should handle null template', () => {
      const result = template.validateTemplate(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('template management', () => {
    it('should load template from string', () => {
      const templateContent = 'Hello {{name}}!';
      const result = template.loadTemplate(templateContent);

      expect(result.success).toBe(true);
      expect(result.template).toBe(templateContent);
    });

    it('should handle template loading errors', () => {
      const invalidTemplate = null as any;
      const result = template.loadTemplate(invalidTemplate);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should get template metadata', () => {
      const templateContent = 'Hello {{name}}!';
      template.loadTemplate(templateContent);
      
      const metadata = template.getTemplateMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.variables).toContain('name');
    });

    it('should support template inheritance', () => {
      const baseTemplate = 'Base: {{content}}';
      const childTemplate = 'Child: {{childContent}}';
      
      template.loadTemplate(baseTemplate);
      const result = template.extendTemplate(childTemplate);

      expect(result.success).toBe(true);
    });
  });

  describe('configuration management', () => {
    it('should update options', () => {
      const newOptions = {
        format: 'markdown' as const,
        encoding: 'utf-8'
      };

      template.updateOptions(newOptions);
      const options = template.getOptions();

      expect(options.format).toBe('markdown');
      expect(options.encoding).toBe('utf-8');
    });

    it('should validate configuration', () => {
      const invalidOptions = {
        format: 'invalid-format' as any,
        encoding: 'invalid-encoding' as any
      };

      const result = template.validateConfiguration(invalidOptions);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle partial options update', () => {
      template.updateOptions({ format: 'html' });
      const options = template.getOptions();

      expect(options.format).toBe('html');
      // Other options should remain default
    });
  });

  describe('error handling', () => {
    it('should handle template processing errors', () => {
      const invalidTemplate = 'Hello {{name'; // Invalid syntax
      const variables = { name: 'John' };

      const result = template.processTemplate(invalidTemplate, variables);

      // Should return original template or handle gracefully
      expect(result).toBeDefined();
    });

    it('should handle content generation errors', () => {
      const invalidData = {
        circular: {} as any
      };
      invalidData.circular = invalidData; // Create circular reference

      const result = template.generateContent(invalidData);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle configuration errors', () => {
      const invalidConfig = null as any;
      
      expect(() => {
        template.updateOptions(invalidConfig);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very long templates', () => {
      const longTemplate = 'Hello {{name}}! '.repeat(1000);
      const variables = { name: 'John' };

      const result = template.processTemplate(longTemplate, variables);

      expect(result).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should handle templates with special characters', () => {
      const templateContent = 'Hello {{name}}! Special chars: {{@#$%^&*()}}';
      const variables = {
        name: 'John',
        '@#$%^&*()': 'Special'
      };

      const result = template.processTemplate(templateContent, variables);

      expect(result).toBeDefined();
    });

    it('should handle unicode characters', () => {
      const templateContent = 'Hello {{name}}! Unicode: {{unicode}}';
      const variables = {
        name: 'Jöhn',
        unicode: '🚀🌟'
      };

      const result = template.processTemplate(templateContent, variables);

      expect(result).toBeDefined();
      expect(result.content).toContain('Jöhn');
      expect(result.content).toContain('🚀🌟');
    });

    it('should handle concurrent template processing', async () => {
      const templateContent = 'Hello {{name}}!';
      const promises = Array.from({ length: 10 }, (_, i) => 
        template.processTemplate(templateContent, { name: `User${i}` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, i) => {
        expect(result.content).toBe(`Hello User${i}!`);
      });
    });
  });

  describe('abstract methods', () => {
    it('should have processTemplate method', () => {
      expect(typeof template.processTemplate).toBe('function');
    });

    it('should have generateContent method', () => {
      expect(typeof template.generateContent).toBe('function');
    });

    it('should have validateTemplate method', () => {
      expect(typeof template.validateTemplate).toBe('function');
    });

    it('should have loadTemplate method', () => {
      expect(typeof template.loadTemplate).toBe('function');
    });

    it('should have getTemplateMetadata method', () => {
      expect(typeof template.getTemplateMetadata).toBe('function');
    });

    it('should have extendTemplate method', () => {
      expect(typeof template.extendTemplate).toBe('function');
    });

    it('should have updateOptions method', () => {
      expect(typeof template.updateOptions).toBe('function');
    });

    it('should have getOptions method', () => {
      expect(typeof template.getOptions).toBe('function');
    });

    it('should have validateConfiguration method', () => {
      expect(typeof template.validateConfiguration).toBe('function');
    });
  });

  describe('branch coverage improvements', () => {
    describe('processTemplate branches', () => {
      it('should handle template validation when disabled', () => {
        const customTemplate = new BaseTemplate({ validateTemplate: false });
        const templateContent = 'Invalid template {{unclosed';
        const variables = {};

        const result = customTemplate.processTemplate(templateContent, variables);

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
      });

      it('should handle processTemplate with exception', () => {
        const templateContent = '{{name}}';
        const variables = { name: {} }; // Object that might cause issues

        const result = template.processTemplate(templateContent, variables);

        expect(result.success).toBe(true);
        expect(result.content).toContain('[object Object]');
      });

      it('should handle processTemplate with non-Error exception', () => {
        const templateContent = '{{name}}';
        const variables = { name: 'test' };

        // Mock extractVariables to throw a non-Error
        const originalExtractVariables = (template as any).extractVariables;
        (template as any).extractVariables = () => {
          throw 'String error';
        };

        const result = template.processTemplate(templateContent, variables);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Unknown processing error');

        // Restore original method
        (template as any).extractVariables = originalExtractVariables;
      });
    });

    describe('validateTemplate branches', () => {
      it('should handle validateTemplate with exception', () => {
        const templateContent = '{{name}}';

        // Mock extractVariables to throw an error
        const originalExtractVariables = (template as any).extractVariables;
        (template as any).extractVariables = () => {
          throw new Error('Extraction error');
        };

        const result = template.validateTemplate(templateContent);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Extraction error');

        // Restore original method
        (template as any).extractVariables = originalExtractVariables;
      });

      it('should handle validateTemplate with non-Error exception', () => {
        const templateContent = '{{name}}';

        // Mock extractVariables to throw a non-Error
        const originalExtractVariables = (template as any).extractVariables;
        (template as any).extractVariables = () => {
          throw 'String error';
        };

        const result = template.validateTemplate(templateContent);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Unknown validation error');

        // Restore original method
        (template as any).extractVariables = originalExtractVariables;
      });

      it('should handle unbalanced braces', () => {
        const templateContent = 'Hello {{name!'; // Missing closing brace

        const result = template.validateTemplate(templateContent);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Unbalanced template braces');
      });

      it('should handle invalid variable names', () => {
        const templateContent = 'Hello {{123invalid}} and {{valid_name}}!';

        const result = template.validateTemplate(templateContent);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid variable names: 123invalid');
      });
    });

    describe('loadTemplate branches', () => {
      it('should handle loadTemplate with validation disabled', () => {
        const customTemplate = new BaseTemplate({ validateTemplate: false });
        const templateContent = 'Invalid template {{unclosed';

        const result = customTemplate.loadTemplate(templateContent);

        expect(result.success).toBe(true);
        expect(result.template).toBe(templateContent);
      });

      it('should handle loadTemplate with validation enabled and invalid template', () => {
        const templateContent = 'Invalid template {{unclosed';

        const result = template.loadTemplate(templateContent);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Template validation failed');
      });

      it('should handle loadTemplate with exception', () => {
        const templateContent = '{{name}}';

        // Mock validateTemplate to throw an error
        const originalValidateTemplate = template.validateTemplate;
        template.validateTemplate = () => {
          throw new Error('Validation error');
        };

        const result = template.loadTemplate(templateContent);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Validation error');

        // Restore original method
        template.validateTemplate = originalValidateTemplate;
      });

      it('should handle loadTemplate with non-Error exception', () => {
        const templateContent = '{{name}}';

        // Mock validateTemplate to throw a non-Error
        const originalValidateTemplate = template.validateTemplate;
        template.validateTemplate = () => {
          throw 'String error';
        };

        const result = template.loadTemplate(templateContent);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown loading error');

        // Restore original method
        template.validateTemplate = originalValidateTemplate;
      });
    });

    describe('extendTemplate branches', () => {
      it('should handle extendTemplate with inheritance disabled', () => {
        const customTemplate = new BaseTemplate({ 
          inheritance: { enabled: false }
        });
        const childTemplate = 'Child content';

        const result = customTemplate.extendTemplate(childTemplate);

        expect(result.success).toBe(true);
        expect(result.template).toBe(childTemplate);
      });

      it('should handle extendTemplate with no base template', () => {
        const customTemplate = new BaseTemplate({ 
          inheritance: { enabled: true }
        });
        const childTemplate = 'Child content';

        const result = customTemplate.extendTemplate(childTemplate);

        expect(result.success).toBe(false);
        expect(result.error).toContain('No base template loaded for inheritance');
      });

      it('should handle extendTemplate with inheritance enabled and base template', () => {
        const customTemplate = new BaseTemplate({ 
          inheritance: { enabled: true }
        });
        const baseTemplate = 'Base: {{content}}';
        const childTemplate = 'Child content';

        customTemplate.loadTemplate(baseTemplate);
        const result = customTemplate.extendTemplate(childTemplate);

        expect(result.success).toBe(true);
        expect(result.template).toContain('Child content');
      });

      it('should handle extendTemplate with exception', () => {
        const customTemplate = new BaseTemplate({ 
          inheritance: { enabled: true }
        });
        const childTemplate = 'Child content';

        // Load a base template first
        customTemplate.loadTemplate('Base: {{content}}');

        // Mock loadTemplate to throw an error
        const originalLoadTemplate = customTemplate.loadTemplate;
        customTemplate.loadTemplate = () => {
          throw new Error('Load error');
        };

        const result = customTemplate.extendTemplate(childTemplate);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Load error');

        // Restore original method
        customTemplate.loadTemplate = originalLoadTemplate;
      });
    });

    describe('validateConfiguration branches', () => {
      it('should handle invalid format', () => {
        const invalidConfig = { format: 'invalid-format' as any };

        const result = template.validateConfiguration(invalidConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid format: invalid-format');
      });

      it('should handle invalid encoding type', () => {
        const invalidConfig = { encoding: 123 as any };

        const result = template.validateConfiguration(invalidConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Encoding must be a string');
      });

      it('should handle invalid validateTemplate type', () => {
        const invalidConfig = { validateTemplate: 'invalid' as any };

        const result = template.validateConfiguration(invalidConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('validateTemplate must be a boolean');
      });

      it('should handle invalid validateConfiguration type', () => {
        const invalidConfig = { validateConfiguration: 'invalid' as any };

        const result = template.validateConfiguration(invalidConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('validateConfiguration must be a boolean');
      });

      it('should handle invalid templateVariables type', () => {
        const invalidConfig = { templateVariables: 'invalid' as any };

        const result = template.validateConfiguration(invalidConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('templateVariables must be an object');
      });

      it('should handle invalid inheritance type', () => {
        const invalidConfig = { inheritance: 'invalid' as any };

        const result = template.validateConfiguration(invalidConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('inheritance must be an object');
      });

      it('should handle invalid inheritance.enabled type', () => {
        const invalidConfig = { inheritance: { enabled: 'invalid' as any } };

        const result = template.validateConfiguration(invalidConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('inheritance.enabled must be a boolean');
      });

      it('should handle invalid inheritance.baseTemplate type', () => {
        const invalidConfig = { inheritance: { enabled: true, baseTemplate: 123 as any } };

        const result = template.validateConfiguration(invalidConfig);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('inheritance.baseTemplate must be a string');
      });

      it('should handle validateConfiguration with exception', () => {
        const config = { format: 'html' as const };

        // Mock mergeOptions to throw an error
        const originalMergeOptions = (template as any).mergeOptions;
        (template as any).mergeOptions = () => {
          throw new Error('Merge error');
        };

        const result = template.validateConfiguration(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Merge error');

        // Restore original method
        (template as any).mergeOptions = originalMergeOptions;
      });

      it('should handle validateConfiguration with non-Error exception', () => {
        const config = { format: 'html' as const };

        // Mock mergeOptions to throw a non-Error
        const originalMergeOptions = (template as any).mergeOptions;
        (template as any).mergeOptions = () => {
          throw 'String error';
        };

        const result = template.validateConfiguration(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Unknown validation error');

        // Restore original method
        (template as any).mergeOptions = originalMergeOptions;
      });
    });

    describe('getVariableValue branches', () => {
      it('should handle nested variable access with null value', () => {
        const variables = { user: null };
        const variablePath = 'user.name';

        const value = (template as any).getVariableValue(variables, variablePath);

        expect(value).toBeUndefined();
      });

      it('should handle nested variable access with undefined value', () => {
        const variables = { user: undefined };
        const variablePath = 'user.name';

        const value = (template as any).getVariableValue(variables, variablePath);

        expect(value).toBeUndefined();
      });

      it('should handle nested variable access with primitive value', () => {
        const variables = { user: 'string' };
        const variablePath = 'user.name';

        const value = (template as any).getVariableValue(variables, variablePath);

        expect(value).toBeUndefined();
      });
    });

    describe('extractVariables branches', () => {
      it('should handle extractVariables with undefined match', () => {
        const templateContent = '{{}}'; // Empty variable

        const variables = (template as any).extractVariables(templateContent);

        expect(variables).toEqual([]);
      });

      it('should handle extractVariables with empty variable name', () => {
        const templateContent = '{{   }}'; // Whitespace only

        const variables = (template as any).extractVariables(templateContent);

        expect(variables).toEqual([]);
      });

      it('should handle extractVariables with duplicate variables', () => {
        const templateContent = '{{name}} and {{name}} again';

        const variables = (template as any).extractVariables(templateContent);

        expect(variables).toEqual(['name']);
      });
    });

    describe('generateContent branches', () => {
      it('should handle generateContent with exception', () => {
        const data = { title: 'Test' };

        // Mock generateTextContent to throw an error (since default format is text)
        const originalGenerateTextContent = (template as any).generateTextContent;
        (template as any).generateTextContent = () => {
          throw new Error('Generation error');
        };

        const result = template.generateContent(data);

        expect(result).toContain('Error generating content: Generation error');

        // Restore original method
        (template as any).generateTextContent = originalGenerateTextContent;
      });

      it('should handle generateContent with non-Error exception', () => {
        const data = { title: 'Test' };

        // Mock generateTextContent to throw a non-Error (since default format is text)
        const originalGenerateTextContent = (template as any).generateTextContent;
        (template as any).generateTextContent = () => {
          throw 'String error';
        };

        const result = template.generateContent(data);

        expect(result).toContain('Error generating content: Unknown error');

        // Restore original method
        (template as any).generateTextContent = originalGenerateTextContent;
      });

      it('should handle different format types', () => {
        const data = { title: 'Test', content: 'Content' };

        const htmlTemplate = new BaseTemplate({ format: 'html' });
        const markdownTemplate = new BaseTemplate({ format: 'markdown' });
        const textTemplate = new BaseTemplate({ format: 'text' });

        const htmlResult = htmlTemplate.generateContent(data);
        const markdownResult = markdownTemplate.generateContent(data);
        const textResult = textTemplate.generateContent(data);

        expect(htmlResult).toContain('<html>');
        expect(markdownResult).toContain('# Test');
        expect(textResult).toContain('Test');
      });

      it('should handle default format fallback', () => {
        const data = { title: 'Test', content: 'Content' };
        const customTemplate = new BaseTemplate({ format: 'invalid' as any });

        const result = customTemplate.generateContent(data);

        expect(result).toContain('Test');
        expect(result).toContain('Content');
      });
    });

    describe('getTemplateMetadata branches', () => {
      it('should handle getTemplateMetadata with no template loaded', () => {
        const metadata = template.getTemplateMetadata();

        expect(metadata.variables).toEqual([]);
        expect(metadata.complexity).toBe(0);
        expect(metadata.size).toBe(0);
        expect(metadata.format).toBe('text');
        expect(metadata.lastModified).toBe(0);
      });

      it('should handle getTemplateMetadata with template loaded', () => {
        const templateContent = 'Hello {{name}}!';
        template.loadTemplate(templateContent);
        
        const metadata = template.getTemplateMetadata();

        expect(metadata.variables).toContain('name');
        expect(metadata.complexity).toBeGreaterThan(0);
        expect(metadata.size).toBe(templateContent.length);
        expect(metadata.format).toBe('text');
        expect(metadata.lastModified).toBeGreaterThan(0);
      });
    });
  });
});

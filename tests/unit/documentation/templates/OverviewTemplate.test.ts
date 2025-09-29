import { OverviewTemplate } from '../../../../src/documentation/templates/OverviewTemplate';

describe('OverviewTemplate', () => {
  let template: OverviewTemplate;
  let mockProjectData: any;

  beforeEach(() => {
    template = new OverviewTemplate();
    mockProjectData = {
      name: 'Test Project',
      version: '1.0.0',
      description: 'A test project for documentation',
      rootPath: '/test/project',
      files: [
        { name: 'index.ts', path: '/test/project/index.ts', size: 1024 },
        { name: 'utils.ts', path: '/test/project/utils.ts', size: 2048 }
      ],
      statistics: {
        totalFiles: 2,
        totalLines: 150,
        totalFunctions: 10,
        totalClasses: 3,
        totalInterfaces: 5
      },
      complexity: {
        averageComplexity: 2.5,
        maxComplexity: 8,
        highComplexityFiles: 2
      }
    };
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(template).toBeDefined();
      expect(template.getOptions()).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        templateVariables: { customVar: 'value' },
        validateTemplate: false
      };
      const customTemplate = new OverviewTemplate(customOptions);
      
      expect(customTemplate.getOptions().templateVariables).toEqual({ customVar: 'value' });
      expect(customTemplate.getOptions().validateTemplate).toBe(false);
    });
  });

  describe('template processing', () => {
    it('should process overview template with project data', () => {
      const templateContent = 'Project: {{name}} ({{version}})\nDescription: {{description}}';
      const variables = mockProjectData;

      const result = template.processTemplate(templateContent, variables);

      expect(result.success).toBe(true);
      expect(result.content).toContain('Test Project');
      expect(result.content).toContain('1.0.0');
      expect(result.content).toContain('A test project for documentation');
    });

    it('should handle missing project data gracefully', () => {
      const templateContent = 'Project: {{name}} ({{version}})';
      const variables = {};

      const result = template.processTemplate(templateContent, variables);

      expect(result.success).toBe(true);
      expect(result.variablesMissing).toContain('name');
      expect(result.variablesMissing).toContain('version');
    });

    it('should handle nested project data structures', () => {
      const templateContent = 'Files: {{statistics.totalFiles}}, Lines: {{statistics.totalLines}}';
      const variables = mockProjectData;

      const result = template.processTemplate(templateContent, variables);

      expect(result.success).toBe(true);
      expect(result.content).toContain('Files: 2');
      expect(result.content).toContain('Lines: 150');
    });
  });

  describe('content generation', () => {
    it('should generate overview content from project information', () => {
      const result = template.generateContent(mockProjectData);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include project statistics in generated content', () => {
      const result = template.generateContent(mockProjectData);

      expect(result).toBeDefined();
      expect(result).toContain('Test Project');
      expect(result).toContain('1.0.0');
    });

    it('should handle empty project data gracefully', () => {
      const result = template.generateContent({});

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle null project data', () => {
      const result = template.generateContent(null as any);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('data validation', () => {
    it('should validate overview data structure', () => {
      const validation = template.validateOverviewData(mockProjectData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const incompleteData = { name: 'Test' };
      const validation = template.validateOverviewData(incompleteData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed data appropriately', () => {
      const malformedData = { name: null, version: undefined };
      const validation = template.validateOverviewData(malformedData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('customization', () => {
    it('should support custom template variables', () => {
      const customOptions = {
        templateVariables: { 
          customTitle: 'Custom Overview',
          customStyle: 'modern'
        }
      };
      const customTemplate = new OverviewTemplate(customOptions);
      
      const templateContent = '{{customTitle}} - {{customStyle}}';
      const variables = {};

      const result = customTemplate.processTemplate(templateContent, variables);

      expect(result.success).toBe(true);
      expect(result.variablesMissing).toContain('customTitle');
      expect(result.variablesMissing).toContain('customStyle');
    });

    it('should allow template inheritance', () => {
      const baseTemplate = 'Base: {{name}}';
      const extendedTemplate = 'Extended: {{name}} - {{version}}';
      
      template.loadTemplate(baseTemplate);
      const result = template.extendTemplate(extendedTemplate);

      expect(result.success).toBe(true);
      expect(result.template).toBeDefined();
    });

    it('should support different overview styles', () => {
      const styleOptions = {
        templateVariables: { 
          style: 'detailed',
          format: 'markdown'
        }
      };
      const styledTemplate = new OverviewTemplate(styleOptions);
      
      const result = styledTemplate.generateContent(mockProjectData);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('template management', () => {
    it('should load template from string', () => {
      const templateContent = 'Custom Overview Template';
      const result = template.loadTemplate(templateContent);

      expect(result.success).toBe(true);
      expect(template.getTemplateMetadata()).toBeDefined();
    });

    it('should handle template loading errors', () => {
      const result = template.loadTemplate('');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should get template metadata', () => {
      template.loadTemplate('Test Template');
      const metadata = template.getTemplateMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.variables).toBeDefined();
    });
  });

  describe('configuration management', () => {
    it('should update options correctly', () => {
      const newOptions = {
        validateTemplate: false,
        templateVariables: { newVar: 'value' }
      };

      template.updateOptions(newOptions);
      const options = template.getOptions();

      expect(options.validateTemplate).toBe(false);
      expect(options.templateVariables).toEqual({ newVar: 'value' });
    });

    it('should validate configuration', () => {
      const validation = template.validateConfiguration();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should handle partial options update', () => {
      const partialOptions = { validateTemplate: false };
      
      template.updateOptions(partialOptions);
      const options = template.getOptions();

      expect(options.validateTemplate).toBe(false);
      expect(options.validateConfiguration).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle template processing errors', () => {
      const invalidTemplate = '{{invalid.variable.nested.too.deep}}';
      const variables = {};

      const result = template.processTemplate(invalidTemplate, variables);

      expect(result.success).toBe(true);
      expect(result.variablesMissing.length).toBeGreaterThan(0);
    });

    it('should handle content generation errors', () => {
      const invalidData = { circular: {} };
      invalidData.circular = invalidData; // Create circular reference

      const result = template.generateContent(invalidData);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle configuration errors', () => {
      const invalidOptions = {
        validateTemplate: 'invalid' as any,
        templateVariables: 'invalid' as any
      };

      template.updateOptions(invalidOptions);
      const validation = template.validateConfiguration();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large project data', () => {
      const largeData = {
        ...mockProjectData,
        files: Array.from({ length: 1000 }, (_, i) => ({
          name: `file${i}.ts`,
          path: `/test/project/file${i}.ts`,
          size: 1024
        }))
      };

      const result = template.generateContent(largeData);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle project data with special characters', () => {
      const specialData = {
        ...mockProjectData,
        name: 'Test Project & Co. (Ltd.)',
        description: 'A project with "quotes" and <tags>'
      };

      const result = template.generateContent(specialData);

      expect(result).toBeDefined();
      expect(result).toContain('Test Project & Co. (Ltd.)');
    });

    it('should handle unicode characters in project data', () => {
      const unicodeData = {
        ...mockProjectData,
        name: '测试项目',
        description: 'Un projet de test 🚀'
      };

      const result = template.generateContent(unicodeData);

      expect(result).toBeDefined();
      expect(result).toContain('测试项目');
      expect(result).toContain('🚀');
    });

    it('should handle concurrent template processing', async () => {
      const templateContent = 'Project: {{name}}';
      const promises = Array.from({ length: 10 }, (_, i) => 
        template.processTemplate(templateContent, { name: `Project${i}` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result: any, i: number) => {
        expect(result.success).toBe(true);
        expect(result.content).toContain(`Project${i}`);
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

  describe('overview-specific methods', () => {
    it('should have validateOverviewData method', () => {
      expect(typeof template.validateOverviewData).toBe('function');
    });

    it('should generate project statistics section', () => {
      const result = template.generateStatisticsSection(mockProjectData);

      expect(result).toBeDefined();
      expect(result).toContain('Statistics');
    });

    it('should generate complexity metrics section', () => {
      const result = template.generateComplexitySection(mockProjectData);

      expect(result).toBeDefined();
      expect(result).toContain('Complexity');
    });

    it('should generate file overview section', () => {
      const result = template.generateFileOverviewSection(mockProjectData);

      expect(result).toBeDefined();
      expect(result).toContain('File Overview');
    });
  });

  describe('branch coverage improvements', () => {
    describe('processTemplate validation branches', () => {
      it('should handle template validation when disabled', () => {
        const customTemplate = new OverviewTemplate({ validateTemplate: false });
        const templateContent = 'Invalid template {{unclosed';
        const variables = {};

        const result = customTemplate.processTemplate(templateContent, variables);

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
      });

      it('should handle template validation errors', () => {
        const templateContent = 'Invalid template {{unclosed';
        const variables = {};

        const result = template.processTemplate(templateContent, variables);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should handle processTemplate with exception', () => {
        const templateContent = '{{name}}';
        const variables = { name: {} }; // Object that might cause issues

        const result = template.processTemplate(templateContent, variables);

        expect(result.success).toBe(true);
        expect(result.content).toContain('[object Object]');
      });
    });

    describe('generateContent branches', () => {
      it('should handle validation disabled in generateContent', () => {
        const customTemplate = new OverviewTemplate({ validateConfiguration: false });
        const invalidData = { name: null, version: undefined };

        const result = customTemplate.generateContent(invalidData);

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });


      it('should handle options disabled for sections', () => {
        const customTemplate = new OverviewTemplate({
          includeStatistics: false,
          includeComplexity: false,
          includeFileOverview: false
        });

        const result = customTemplate.generateContent(mockProjectData);

        expect(result).toBeDefined();
        expect(result).not.toContain('Statistics');
        expect(result).not.toContain('Complexity');
        expect(result).not.toContain('File Overview');
      });
    });

    describe('validateOverviewData branches', () => {
      it('should handle null data validation', () => {
        const result = template.validateOverviewData(null);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Overview data is required');
      });

      it('should handle non-object data validation', () => {
        const result = template.validateOverviewData('string data');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Overview data must be an object');
      });

      it('should handle missing name validation', () => {
        const data = { version: '1.0.0' };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle invalid name type validation', () => {
        const data = { name: 123, version: '1.0.0' };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project name is required and must be a string');
      });

      it('should handle missing version validation', () => {
        const data = { name: 'Test Project' };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle invalid version type validation', () => {
        const data = { name: 'Test Project', version: 123 };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Project version is required and must be a string');
      });

      it('should handle missing description warning', () => {
        const data = { name: 'Test Project', version: '1.0.0' };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Project description is recommended');
      });

      it('should handle invalid description type warning', () => {
        const data = { name: 'Test Project', version: '1.0.0', description: 123 };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Project description is recommended');
      });

      it('should handle missing rootPath warning', () => {
        const data = { name: 'Test Project', version: '1.0.0' };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Project root path is recommended');
      });

      it('should handle invalid rootPath type warning', () => {
        const data = { name: 'Test Project', version: '1.0.0', rootPath: 123 };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Project root path is recommended');
      });

      it('should handle invalid statistics object', () => {
        const data = { name: 'Test Project', version: '1.0.0', statistics: 'invalid' };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Statistics must be an object');
      });

      it('should handle invalid totalFiles type', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0', 
          statistics: { totalFiles: 'invalid' }
        };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('totalFiles must be a number');
      });

      it('should handle invalid totalLines type', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0', 
          statistics: { totalLines: 'invalid' }
        };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('totalLines must be a number');
      });

      it('should handle invalid complexity object', () => {
        const data = { name: 'Test Project', version: '1.0.0', complexity: 'invalid' };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Complexity must be an object');
      });

      it('should handle invalid averageComplexity type', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0', 
          complexity: { averageComplexity: 'invalid' }
        };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('averageComplexity must be a number');
      });

      it('should handle invalid maxComplexity type', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0', 
          complexity: { maxComplexity: 'invalid' }
        };
        const result = template.validateOverviewData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('maxComplexity must be a number');
      });
    });

    describe('generateStatisticsSection branches', () => {
      it('should handle missing statistics', () => {
        const data = { name: 'Test Project', version: '1.0.0' };
        const result = template.generateStatisticsSection(data);

        expect(result).toBeDefined();
        expect(result).toContain('Statistics');
        expect(result).toContain('| Metric | Value |');
      });

      it('should handle statistics with undefined values', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0',
          statistics: {
            totalFiles: undefined,
            totalLines: undefined,
            totalFunctions: undefined,
            totalClasses: undefined,
            totalInterfaces: undefined
          }
        };
        const result = template.generateStatisticsSection(data);

        expect(result).toBeDefined();
        expect(result).toContain('Statistics');
        expect(result).toContain('| Metric | Value |');
      });
    });

    describe('generateComplexitySection branches', () => {
      it('should handle missing complexity', () => {
        const data = { name: 'Test Project', version: '1.0.0' };
        const result = template.generateComplexitySection(data);

        expect(result).toBeDefined();
        expect(result).toContain('Complexity');
        expect(result).toContain('| Metric | Value |');
      });

      it('should handle complexity with undefined values', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0',
          complexity: {
            averageComplexity: undefined,
            maxComplexity: undefined,
            highComplexityFiles: undefined
          }
        };
        const result = template.generateComplexitySection(data);

        expect(result).toBeDefined();
        expect(result).toContain('Complexity');
        expect(result).toContain('| Metric | Value |');
      });
    });

    describe('generateFileOverviewSection branches', () => {
      it('should handle missing files', () => {
        const data = { name: 'Test Project', version: '1.0.0' };
        const result = template.generateFileOverviewSection(data);

        expect(result).toBeDefined();
        expect(result).toContain('File Overview');
        expect(result).toContain('No files found');
      });

      it('should handle files with missing properties', () => {
        const data = { 
          name: 'Test Project', 
          version: '1.0.0',
          files: [
            { name: 'test.ts' },
            { size: 1024 },
            { name: 'test2.ts', size: 2048 }
          ]
        };
        const result = template.generateFileOverviewSection(data);

        expect(result).toBeDefined();
        expect(result).toContain('File Overview');
        expect(result).toContain('test.ts');
        expect(result).toContain('Unknown');
        expect(result).toContain('test2.ts');
      });

      it('should handle files exceeding maxFilesDisplay', () => {
        const customTemplate = new OverviewTemplate({ maxFilesDisplay: 2 });
        const data = { 
          name: 'Test Project', 
          version: '1.0.0',
          files: [
            { name: 'file1.ts', size: 1024 },
            { name: 'file2.ts', size: 2048 },
            { name: 'file3.ts', size: 3072 },
            { name: 'file4.ts', size: 4096 }
          ]
        };
        const result = customTemplate.generateFileOverviewSection(data);

        expect(result).toBeDefined();
        expect(result).toContain('file1.ts');
        expect(result).toContain('file2.ts');
        expect(result).toContain('... and 2 more files');
      });
    });

    describe('validateConfiguration branches', () => {
      it('should handle invalid includeStatistics type', () => {
        const customTemplate = new OverviewTemplate({ includeStatistics: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('includeStatistics must be a boolean');
      });

      it('should handle invalid includeComplexity type', () => {
        const customTemplate = new OverviewTemplate({ includeComplexity: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('includeComplexity must be a boolean');
      });

      it('should handle invalid includeFileOverview type', () => {
        const customTemplate = new OverviewTemplate({ includeFileOverview: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('includeFileOverview must be a boolean');
      });

      it('should handle invalid overviewStyle', () => {
        const customTemplate = new OverviewTemplate({ overviewStyle: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('overviewStyle must be one of: simple, detailed, comprehensive');
      });

      it('should handle invalid maxFilesDisplay type', () => {
        const customTemplate = new OverviewTemplate({ maxFilesDisplay: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('maxFilesDisplay must be a non-negative number');
      });

      it('should handle negative maxFilesDisplay', () => {
        const customTemplate = new OverviewTemplate({ maxFilesDisplay: -1 });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('maxFilesDisplay must be a non-negative number');
      });

      it('should handle valid overviewStyle values', () => {
        const styles = ['simple', 'detailed', 'comprehensive'];
        
        styles.forEach(style => {
          const customTemplate = new OverviewTemplate({ overviewStyle: style as any });
          const validation = customTemplate.validateConfiguration();
          expect(validation.isValid).toBe(true);
        });
      });
    });

    describe('getVariableValue and processNestedVariables branches', () => {
      it('should handle nested variable processing', () => {
        const templateContent = 'Project: {{project.name}} - {{project.version}}';
        const variables = { project: { name: 'Test', version: '1.0.0' } };

        const result = template.processTemplate(templateContent, variables);

        expect(result.success).toBe(true);
        expect(result.content).toContain('Test');
        expect(result.content).toContain('1.0.0');
      });

      it('should handle missing nested variables', () => {
        const templateContent = 'Project: {{project.name}} - {{project.version}}';
        const variables = { project: { name: 'Test' } };

        const result = template.processTemplate(templateContent, variables);

        expect(result.success).toBe(true);
        expect(result.variablesMissing).toContain('project.version');
      });
    });
  });
});

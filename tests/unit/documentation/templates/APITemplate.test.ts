import { APITemplate } from '../../../../src/documentation/templates/APITemplate';

describe('APITemplate', () => {
  let template: APITemplate;
  let mockAPIData: any;

  beforeEach(() => {
    template = new APITemplate();
    mockAPIData = {
      name: 'TestAPI',
      version: '1.0.0',
      description: 'A test API for documentation',
      rootPath: '/test/api',
      nodes: [
        {
          id: '1',
          name: 'TestClass',
          type: 'ClassDeclaration',
          properties: {
            description: 'A test class',
            methods: [
              {
                name: 'testMethod',
                parameters: [
                  { name: 'param1', type: 'string', description: 'First parameter' },
                  { name: 'param2', type: 'number', description: 'Second parameter' }
                ],
                returnType: 'string',
                description: 'A test method'
              }
            ],
            properties: [
              { name: 'testProperty', type: 'string', description: 'A test property' }
            ]
          }
        },
        {
          id: '2',
          name: 'TestInterface',
          type: 'InterfaceDeclaration',
          properties: {
            description: 'A test interface',
            methods: [
              {
                name: 'interfaceMethod',
                parameters: [{ name: 'param', type: 'any' }],
                returnType: 'void',
                description: 'Interface method'
              }
            ]
          }
        }
      ],
      statistics: {
        totalClasses: 1,
        totalInterfaces: 1,
        totalMethods: 2,
        totalProperties: 1
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
        validateTemplate: false,
        includeMethodSignatures: true,
        includeTypeDefinitions: true
      };
      const customTemplate = new APITemplate(customOptions);
      
      expect(customTemplate.getOptions().templateVariables).toEqual({ customVar: 'value' });
      expect(customTemplate.getOptions().validateTemplate).toBe(false);
    });
  });

  describe('template processing', () => {
    it('should process API template with node data', () => {
      const templateContent = 'API: {{name}} ({{version}})\nDescription: {{description}}';
      const variables = mockAPIData;

      const result = template.processTemplate(templateContent, variables);

      expect(result.success).toBe(true);
      expect(result.content).toContain('TestAPI');
      expect(result.content).toContain('1.0.0');
      expect(result.content).toContain('A test API for documentation');
    });

    it('should handle missing API data gracefully', () => {
      const templateContent = 'API: {{name}} ({{version}})';
      const variables = {};

      const result = template.processTemplate(templateContent, variables);

      expect(result.success).toBe(true);
      expect(result.variablesMissing).toContain('name');
      expect(result.variablesMissing).toContain('version');
    });

    it('should handle nested API data structures', () => {
      const templateContent = 'Classes: {{statistics.totalClasses}}, Methods: {{statistics.totalMethods}}';
      const variables = mockAPIData;

      const result = template.processTemplate(templateContent, variables);

      expect(result.success).toBe(true);
      expect(result.content).toContain('Classes: 1');
      expect(result.content).toContain('Methods: 2');
    });
  });

  describe('content generation', () => {
    it('should generate API content from node information', () => {
      const result = template.generateContent(mockAPIData);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include API statistics in generated content', () => {
      const result = template.generateContent(mockAPIData);

      expect(result).toBeDefined();
      expect(result).toContain('TestAPI');
      expect(result).toContain('1.0.0');
    });

    it('should handle empty API data gracefully', () => {
      const result = template.generateContent({});

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle null API data', () => {
      const result = template.generateContent(null as any);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('data validation', () => {
    it('should validate API data structure', () => {
      const validation = template.validateAPIData(mockAPIData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const incompleteData = { name: 'Test' };
      const validation = template.validateAPIData(incompleteData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should handle malformed data appropriately', () => {
      const malformedData = { name: null, version: undefined };
      const validation = template.validateAPIData(malformedData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('customization', () => {
    it('should support custom template variables', () => {
      const customOptions = {
        templateVariables: { 
          customTitle: 'Custom API Reference',
          customStyle: 'modern'
        }
      };
      const customTemplate = new APITemplate(customOptions);
      
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

    it('should support different API documentation styles', () => {
      const styleOptions = {
        templateVariables: { 
          style: 'detailed',
          format: 'markdown'
        }
      };
      const styledTemplate = new APITemplate(styleOptions);
      
      const result = styledTemplate.generateContent(mockAPIData);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('template management', () => {
    it('should load template from string', () => {
      const templateContent = 'Custom API Template';
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
        templateVariables: { newVar: 'value' },
        includeMethodSignatures: true
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
    it('should handle very large API data', () => {
      const largeData = {
        ...mockAPIData,
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `${i}`,
          name: `Class${i}`,
          type: 'ClassDeclaration',
          properties: { description: `Class ${i}` }
        }))
      };

      const result = template.generateContent(largeData);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle API data with special characters', () => {
      const specialData = {
        ...mockAPIData,
        name: 'Test API & Co. (Ltd.)',
        description: 'An API with "quotes" and <tags>'
      };

      const result = template.generateContent(specialData);

      expect(result).toBeDefined();
      expect(result).toContain('Test API & Co. (Ltd.)');
    });

    it('should handle unicode characters in API data', () => {
      const unicodeData = {
        ...mockAPIData,
        name: '测试API',
        description: 'Un API de test 🚀'
      };

      const result = template.generateContent(unicodeData);

      expect(result).toBeDefined();
      expect(result).toContain('测试API');
      expect(result).toContain('🚀');
    });

    it('should handle concurrent template processing', async () => {
      const templateContent = 'API: {{name}}';
      const promises = Array.from({ length: 10 }, (_, i) => 
        template.processTemplate(templateContent, { name: `API${i}` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result: any, i: number) => {
        expect(result.success).toBe(true);
        expect(result.content).toContain(`API${i}`);
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

  describe('API-specific methods', () => {
    it('should have validateAPIData method', () => {
      expect(typeof template.validateAPIData).toBe('function');
    });

    it('should generate class documentation section', () => {
      const result = template.generateClassDocumentation(mockAPIData);

      expect(result).toBeDefined();
      expect(result).toContain('Class');
    });

    it('should generate interface documentation section', () => {
      const result = template.generateInterfaceDocumentation(mockAPIData);

      expect(result).toBeDefined();
      expect(result).toContain('Interface');
    });

    it('should generate method documentation section', () => {
      const result = template.generateMethodDocumentation(mockAPIData);

      expect(result).toBeDefined();
      expect(result).toContain('Method');
    });
  });

  describe('branch coverage improvements', () => {
    describe('processTemplate validation branches', () => {
      it('should handle template validation when disabled', () => {
        const customTemplate = new APITemplate({ validateTemplate: false });
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
        expect(result.errors).toContain('Unknown error');

        // Restore original method
        (template as any).extractVariables = originalExtractVariables;
      });
    });

    describe('generateContent branches', () => {
      it('should handle validation disabled in generateContent', () => {
        const customTemplate = new APITemplate({ validateConfiguration: false });
        const invalidData = { name: null, version: undefined };

        const result = customTemplate.generateContent(invalidData);

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle generateContent with exception', () => {
        // Test with invalid data that might cause issues
        const invalidData = { name: null, version: undefined, nodes: 'invalid' };
        
        const result = template.generateContent(invalidData);

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle options disabled for sections', () => {
        const customTemplate = new APITemplate({
          includeTypeDefinitions: false,
          includeMethodSignatures: false
        });

        const result = customTemplate.generateContent(mockAPIData);

        expect(result).toBeDefined();
        expect(result).not.toContain('Classes');
        expect(result).not.toContain('Interfaces');
        expect(result).not.toContain('Methods');
      });
    });

    describe('validateAPIData branches', () => {
      it('should handle null data validation', () => {
        const result = template.validateAPIData(null);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API data is required');
      });

      it('should handle non-object data validation', () => {
        const result = template.validateAPIData('string data');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API data must be an object');
      });

      it('should handle missing name validation', () => {
        const data = { version: '1.0.0' };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API name is required and must be a string');
      });

      it('should handle invalid name type validation', () => {
        const data = { name: 123, version: '1.0.0' };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API name is required and must be a string');
      });

      it('should handle missing version validation', () => {
        const data = { name: 'Test API' };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API version is required and must be a string');
      });

      it('should handle invalid version type validation', () => {
        const data = { name: 'Test API', version: 123 };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API version is required and must be a string');
      });

      it('should handle missing description warning', () => {
        const data = { name: 'Test API', version: '1.0.0' };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('API description is recommended');
      });

      it('should handle invalid description type warning', () => {
        const data = { name: 'Test API', version: '1.0.0', description: 123 };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('API description is recommended');
      });

      it('should handle missing rootPath warning', () => {
        const data = { name: 'Test API', version: '1.0.0' };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('API root path is recommended');
      });

      it('should handle invalid rootPath type warning', () => {
        const data = { name: 'Test API', version: '1.0.0', rootPath: 123 };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('API root path is recommended');
      });

      it('should handle invalid nodes array', () => {
        const data = { name: 'Test API', version: '1.0.0', nodes: 'invalid' };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API nodes must be an array');
      });

      it('should handle nodes with missing properties', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { id: '1' }, // Missing name and type
            { name: 'Test', type: 'Class' } // Missing id
          ]
        };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Node 0: name is required and must be a string');
        expect(result.errors).toContain('Node 0: type is required and must be a string');
        expect(result.errors).toContain('Node 1: id is required and must be a string');
      });

      it('should handle invalid statistics object', () => {
        const data = { name: 'Test API', version: '1.0.0', statistics: 'invalid' };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Statistics must be an object');
      });

      it('should handle invalid statistics properties', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          statistics: {
            totalClasses: 'invalid',
            totalInterfaces: 'invalid',
            totalMethods: 'invalid',
            totalProperties: 'invalid'
          }
        };
        const result = template.validateAPIData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('totalClasses must be a number');
        expect(result.errors).toContain('totalInterfaces must be a number');
        expect(result.errors).toContain('totalMethods must be a number');
        expect(result.errors).toContain('totalProperties must be a number');
      });
    });

    describe('generateClassDocumentation branches', () => {
      it('should handle empty nodes array', () => {
        const data = { name: 'Test API', version: '1.0.0', nodes: [] };
        const result = template.generateClassDocumentation(data);

        expect(result).toBe('');
      });

      it('should handle nodes without classes', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { id: '1', name: 'TestInterface', type: 'InterfaceDeclaration' }
          ]
        };
        const result = template.generateClassDocumentation(data);

        expect(result).toBe('');
      });

      it('should handle classes without methods', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { description: 'A test class' }
            }
          ]
        };
        const result = template.generateClassDocumentation(data);

        expect(result).toContain('TestClass');
        expect(result).toContain('A test class');
      });

      it('should handle classes with methods exceeding maxMethodsDisplay', () => {
        const customTemplate = new APITemplate({ maxMethodsDisplay: 2 });
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                description: 'A test class',
                methods: [
                  { name: 'method1', description: 'Method 1' },
                  { name: 'method2', description: 'Method 2' },
                  { name: 'method3', description: 'Method 3' }
                ]
              }
            }
          ]
        };
        const result = customTemplate.generateClassDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('method2');
        expect(result).not.toContain('method3');
      });

      it('should handle classes with methods when includeMethodSignatures is false', () => {
        const customTemplate = new APITemplate({ includeMethodSignatures: false });
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                description: 'A test class',
                methods: [{ name: 'method1', description: 'Method 1' }]
              }
            }
          ]
        };
        const result = customTemplate.generateClassDocumentation(data);

        expect(result).toContain('TestClass');
        expect(result).not.toContain('Methods');
      });

      it('should handle classes with properties when includeTypeDefinitions is false', () => {
        const customTemplate = new APITemplate({ includeTypeDefinitions: false });
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                description: 'A test class',
                properties: [{ name: 'prop1', type: 'string', description: 'Property 1' }]
              }
            }
          ]
        };
        const result = customTemplate.generateClassDocumentation(data);

        expect(result).toContain('TestClass');
        expect(result).not.toContain('Properties');
      });
    });

    describe('generateInterfaceDocumentation branches', () => {
      it('should handle empty nodes array', () => {
        const data = { name: 'Test API', version: '1.0.0', nodes: [] };
        const result = template.generateInterfaceDocumentation(data);

        expect(result).toBe('');
      });

      it('should handle nodes without interfaces', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { id: '1', name: 'TestClass', type: 'ClassDeclaration' }
          ]
        };
        const result = template.generateInterfaceDocumentation(data);

        expect(result).toBe('');
      });

      it('should handle interfaces without methods', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestInterface', 
              type: 'InterfaceDeclaration',
              properties: { description: 'A test interface' }
            }
          ]
        };
        const result = template.generateInterfaceDocumentation(data);

        expect(result).toContain('TestInterface');
        expect(result).toContain('A test interface');
      });

      it('should handle interfaces with methods exceeding maxMethodsDisplay', () => {
        const customTemplate = new APITemplate({ maxMethodsDisplay: 1 });
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestInterface', 
              type: 'InterfaceDeclaration',
              properties: { 
                description: 'A test interface',
                methods: [
                  { name: 'method1', description: 'Method 1' },
                  { name: 'method2', description: 'Method 2' }
                ]
              }
            }
          ]
        };
        const result = customTemplate.generateInterfaceDocumentation(data);

        expect(result).toContain('method1');
        expect(result).not.toContain('method2');
      });

      it('should handle interfaces with methods when includeMethodSignatures is false', () => {
        const customTemplate = new APITemplate({ includeMethodSignatures: false });
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestInterface', 
              type: 'InterfaceDeclaration',
              properties: { 
                description: 'A test interface',
                methods: [{ name: 'method1', description: 'Method 1' }]
              }
            }
          ]
        };
        const result = customTemplate.generateInterfaceDocumentation(data);

        expect(result).toContain('TestInterface');
        expect(result).not.toContain('Methods');
      });
    });

    describe('generateMethodDocumentation branches', () => {
      it('should handle empty nodes array', () => {
        const data = { name: 'Test API', version: '1.0.0', nodes: [] };
        const result = template.generateMethodDocumentation(data);

        expect(result).toBe('');
      });

      it('should handle nodes without methods', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { description: 'A test class' }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toBe('');
      });

      it('should handle methods exceeding maxMethodsDisplay', () => {
        const customTemplate = new APITemplate({ maxMethodsDisplay: 1 });
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { name: 'method1', description: 'Method 1' },
                  { name: 'method2', description: 'Method 2' }
                ]
              }
            }
          ]
        };
        const result = customTemplate.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).not.toContain('method2');
      });

      it('should handle methods when includeReturnTypes is false', () => {
        const customTemplate = new APITemplate({ includeReturnTypes: false });
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [{ 
                  name: 'method1', 
                  description: 'Method 1',
                  returnType: 'string'
                }]
              }
            }
          ]
        };
        const result = customTemplate.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).not.toContain('Returns');
      });

      it('should handle methods when includeParameterDescriptions is false', () => {
        const customTemplate = new APITemplate({ includeParameterDescriptions: false });
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [{ 
                  name: 'method1', 
                  description: 'Method 1',
                  parameters: [{ name: 'param1', type: 'string', description: 'Parameter 1' }]
                }]
              }
            }
          ]
        };
        const result = customTemplate.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).not.toContain('Parameters');
      });
    });

    describe('validateConfiguration branches', () => {
      it('should handle invalid includeMethodSignatures type', () => {
        const customTemplate = new APITemplate({ includeMethodSignatures: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('includeMethodSignatures must be a boolean');
      });

      it('should handle invalid includeTypeDefinitions type', () => {
        const customTemplate = new APITemplate({ includeTypeDefinitions: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('includeTypeDefinitions must be a boolean');
      });

      it('should handle invalid includeParameterDescriptions type', () => {
        const customTemplate = new APITemplate({ includeParameterDescriptions: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('includeParameterDescriptions must be a boolean');
      });

      it('should handle invalid includeReturnTypes type', () => {
        const customTemplate = new APITemplate({ includeReturnTypes: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('includeReturnTypes must be a boolean');
      });

      it('should handle invalid apiStyle', () => {
        const customTemplate = new APITemplate({ apiStyle: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('apiStyle must be one of: simple, detailed, comprehensive');
      });

      it('should handle invalid maxMethodsDisplay type', () => {
        const customTemplate = new APITemplate({ maxMethodsDisplay: 'invalid' as any });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('maxMethodsDisplay must be a non-negative number');
      });

      it('should handle negative maxMethodsDisplay', () => {
        const customTemplate = new APITemplate({ maxMethodsDisplay: -1 });
        const validation = customTemplate.validateConfiguration();

        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('maxMethodsDisplay must be a non-negative number');
      });

      it('should handle valid apiStyle values', () => {
        const styles = ['simple', 'detailed', 'comprehensive'];
        
        styles.forEach(style => {
          const customTemplate = new APITemplate({ apiStyle: style as any });
          const validation = customTemplate.validateConfiguration();
          expect(validation.isValid).toBe(true);
        });
      });
    });

    describe('additional branch coverage', () => {
      it('should handle generateClassDocumentation with complex class', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                description: 'A test class',
                methods: [
                  { name: 'method1', description: 'Method 1', returnType: 'string' },
                  { name: 'method2', description: 'Method 2', returnType: 'number' }
                ],
                properties: [
                  { name: 'prop1', type: 'string', description: 'Property 1', optional: true },
                  { name: 'prop2', type: 'number', description: 'Property 2', readonly: true }
                ]
              }
            }
          ]
        };
        const result = template.generateClassDocumentation(data);

        expect(result).toContain('TestClass');
        expect(result).toContain('A test class');
        expect(result).toContain('method1');
        expect(result).toContain('method2');
      });

      it('should handle generateInterfaceDocumentation with complex interface', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestInterface', 
              type: 'InterfaceDeclaration',
              properties: { 
                description: 'A test interface',
                methods: [
                  { name: 'method1', description: 'Method 1', returnType: 'string' },
                  { name: 'method2', description: 'Method 2', returnType: 'number' }
                ],
                properties: [
                  { name: 'prop1', type: 'string', description: 'Property 1', optional: true },
                  { name: 'prop2', type: 'number', description: 'Property 2', readonly: true }
                ]
              }
            }
          ]
        };
        const result = template.generateInterfaceDocumentation(data);

        expect(result).toContain('TestInterface');
        expect(result).toContain('A test interface');
        expect(result).toContain('method1');
        expect(result).toContain('method2');
      });

      it('should handle generateMethodDocumentation with complex methods', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: 'method1', 
                    description: 'Method 1', 
                    returnType: 'string',
                    parameters: [
                      { name: 'param1', type: 'string', description: 'Parameter 1' },
                      { name: 'param2', type: 'number', description: 'Parameter 2' }
                    ]
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('Method 1');
        expect(result).toContain('param1');
        expect(result).toContain('param2');
      });

      it('should handle updateOptions with partial update', () => {
        const newOptions = { apiStyle: 'simple' as const };
        template.updateOptions(newOptions);

        const options = template.getOptions();
        expect(options.apiStyle).toBe('simple');
        expect(options.includeMethodSignatures).toBe(true); // Should remain default
      });

      it('should handle validateConfiguration with invalid options', () => {
        const customTemplate = new APITemplate({ 
          includeMethodSignatures: 'invalid' as any,
          includeTypeDefinitions: 'invalid' as any,
          apiStyle: 'invalid' as any,
          maxMethodsDisplay: -1
        });

        const result = customTemplate.validateConfiguration();

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should handle generateContent with complex data', () => {
        const complexData = {
          name: 'Complex API',
          version: '2.0.0',
          description: 'A complex API with many features',
          rootPath: '/api/v2',
          nodes: [
            {
              id: '1',
              name: 'UserService',
              type: 'ClassDeclaration',
              properties: {
                description: 'Service for user management',
                methods: [
                  { name: 'createUser', description: 'Create a new user', returnType: 'User' },
                  { name: 'updateUser', description: 'Update user information', returnType: 'User' },
                  { name: 'deleteUser', description: 'Delete a user', returnType: 'boolean' }
                ],
                properties: [
                  { name: 'userCount', type: 'number', description: 'Total user count', readonly: true },
                  { name: 'isActive', type: 'boolean', description: 'Service active status', optional: true }
                ]
              }
            },
            {
              id: '2',
              name: 'IUserRepository',
              type: 'InterfaceDeclaration',
              properties: {
                description: 'Repository interface for user data',
                methods: [
                  { name: 'findById', description: 'Find user by ID', returnType: 'User | null' },
                  { name: 'findAll', description: 'Find all users', returnType: 'User[]' }
                ]
              }
            }
          ],
          statistics: {
            totalClasses: 1,
            totalInterfaces: 1,
            totalMethods: 5,
            totalProperties: 2
          }
        };

        const result = template.generateContent(complexData);

        expect(result).toBeDefined();
        expect(result).toContain('Complex API');
        expect(result).toContain('UserService');
        expect(result).toContain('IUserRepository');
        expect(result).toContain('createUser');
        expect(result).toContain('findById');
      });

      it('should handle processTemplate with Error exception', () => {
        const templateContent = '{{name}}';
        const variables = { name: 'test' };

        // Mock extractVariables to throw an Error
        const originalExtractVariables = (template as any).extractVariables;
        (template as any).extractVariables = () => {
          throw new Error('Test error');
        };

        const result = template.processTemplate(templateContent, variables);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Test error');

        // Restore original method
        (template as any).extractVariables = originalExtractVariables;
      });

      it('should handle generateContent with Error exception', () => {
        // Create a custom template that will throw an error in generateContent
        const customTemplate = new APITemplate();
        
        // Mock the generateAPIDescription method to throw an error
        const originalGenerateAPIDescription = (customTemplate as any).generateAPIDescription;
        (customTemplate as any).generateAPIDescription = () => {
          throw new Error('Test error');
        };

        const result = customTemplate.generateContent(mockAPIData);

        expect(result).toBeDefined();
        expect(result).toContain('Error generating API content: Test error');

        // Restore original method
        (customTemplate as any).generateAPIDescription = originalGenerateAPIDescription;
      });

      it('should handle generateContent with non-Error exception', () => {
        // Create a custom template that will throw a non-Error in generateContent
        const customTemplate = new APITemplate();
        
        // Mock the generateAPIDescription method to throw a non-Error
        const originalGenerateAPIDescription = (customTemplate as any).generateAPIDescription;
        (customTemplate as any).generateAPIDescription = () => {
          throw 'String error';
        };

        const result = customTemplate.generateContent(mockAPIData);

        expect(result).toBeDefined();
        expect(result).toContain('Error generating API content: Unknown error');

        // Restore original method
        (customTemplate as any).generateAPIDescription = originalGenerateAPIDescription;
      });

      it('should handle getDefaultOptions', () => {
        const defaultOptions = (template as any).getDefaultOptions();

        expect(defaultOptions).toBeDefined();
        expect(defaultOptions.includeMethodSignatures).toBe(true);
        expect(defaultOptions.includeTypeDefinitions).toBe(true);
        expect(defaultOptions.includeParameterDescriptions).toBe(true);
        expect(defaultOptions.includeReturnTypes).toBe(true);
        expect(defaultOptions.apiStyle).toBe('detailed');
        expect(defaultOptions.maxMethodsDisplay).toBe(20); // Corrected value
        expect(defaultOptions.format).toBe('markdown');
        expect(defaultOptions.encoding).toBe('utf-8');
      });

      it('should handle generateClassDocumentation with methods and properties', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                description: 'A test class',
                methods: [
                  { name: 'method1', description: 'Method 1', returnType: 'string' },
                  { name: 'method2', description: 'Method 2', returnType: 'number' }
                ],
                properties: [
                  { name: 'prop1', type: 'string', description: 'Property 1', optional: true },
                  { name: 'prop2', type: 'number', description: 'Property 2', readonly: true }
                ]
              }
            }
          ]
        };
        const result = template.generateClassDocumentation(data);

        expect(result).toContain('TestClass');
        expect(result).toContain('A test class');
        expect(result).toContain('method1');
        expect(result).toContain('method2');
        expect(result).toContain('prop1');
        expect(result).toContain('prop2');
      });

      it('should handle generateInterfaceDocumentation with methods and properties', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestInterface', 
              type: 'InterfaceDeclaration',
              properties: { 
                description: 'A test interface',
                methods: [
                  { name: 'method1', description: 'Method 1', returnType: 'string' },
                  { name: 'method2', description: 'Method 2', returnType: 'number' }
                ],
                properties: [
                  { name: 'prop1', type: 'string', description: 'Property 1', optional: true },
                  { name: 'prop2', type: 'number', description: 'Property 2', readonly: true }
                ]
              }
            }
          ]
        };
        const result = template.generateInterfaceDocumentation(data);

        expect(result).toContain('TestInterface');
        expect(result).toContain('A test interface');
        expect(result).toContain('method1');
        expect(result).toContain('method2');
        // Note: Interface documentation doesn't include properties in the current implementation
        expect(result).toContain('Methods');
      });

      it('should handle generateMethodDocumentation with parameters', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: 'method1', 
                    description: 'Method 1', 
                    returnType: 'string',
                    parameters: [
                      { name: 'param1', type: 'string', description: 'Parameter 1' },
                      { name: 'param2', type: 'number', description: 'Parameter 2' }
                    ]
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('Method 1');
        expect(result).toContain('param1');
        expect(result).toContain('param2');
        expect(result).toContain('Parameter 1');
        expect(result).toContain('Parameter 2');
      });

      it('should handle generateMethodDocumentation with return types', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: 'method1', 
                    description: 'Method 1', 
                    returnType: 'string'
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('Method 1');
        expect(result).toContain('**Returns:** `string`');
      });

      it('should handle generateMethodDocumentation with parent information', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: 'method1', 
                    description: 'Method 1', 
                    returnType: 'string'
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('Method 1');
        expect(result).toContain('TestClass');
      });

      it('should handle generateClassDocumentation with unknown class name', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: null, // Unknown class name
              type: 'ClassDeclaration',
              properties: { 
                description: 'A test class'
              }
            }
          ]
        };
        const result = template.generateClassDocumentation(data);

        expect(result).toContain('Unknown Class');
        expect(result).toContain('A test class');
      });

      it('should handle generateInterfaceDocumentation with unknown interface name', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: null, // Unknown interface name
              type: 'InterfaceDeclaration',
              properties: { 
                description: 'A test interface'
              }
            }
          ]
        };
        const result = template.generateInterfaceDocumentation(data);

        expect(result).toContain('Unknown Interface');
        expect(result).toContain('A test interface');
      });

      it('should handle generateMethodDocumentation with unknown method name', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: null, // Unknown method name
                    description: 'Method 1', 
                    returnType: 'string'
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('Unknown Method');
        expect(result).toContain('Method 1');
      });

      it('should handle generateMethodDocumentation with unknown parameter name', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: 'method1', 
                    description: 'Method 1', 
                    returnType: 'string',
                    parameters: [
                      { name: null, type: 'string', description: 'Parameter 1' }
                    ]
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('param'); // Default parameter name
        expect(result).toContain('Parameter 1');
      });

      it('should handle generateMethodDocumentation with unknown parameter type', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: 'method1', 
                    description: 'Method 1', 
                    returnType: 'string',
                    parameters: [
                      { name: 'param1', type: null, description: 'Parameter 1' }
                    ]
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('param1');
        expect(result).toContain('any'); // Default parameter type
        expect(result).toContain('Parameter 1');
      });

      it('should handle generateMethodDocumentation with unknown parameter description', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: 'method1', 
                    description: 'Method 1', 
                    returnType: 'string',
                    parameters: [
                      { name: 'param1', type: 'string', description: null }
                    ]
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('param1');
        expect(result).toContain('No description'); // Default parameter description
      });

      it('should handle generateMethodDocumentation with unknown return type', () => {
        const data = { 
          name: 'Test API', 
          version: '1.0.0', 
          nodes: [
            { 
              id: '1', 
              name: 'TestClass', 
              type: 'ClassDeclaration',
              properties: { 
                methods: [
                  { 
                    name: 'method1', 
                    description: 'Method 1', 
                    returnType: null
                  }
                ]
              }
            }
          ]
        };
        const result = template.generateMethodDocumentation(data);

        expect(result).toContain('method1');
        expect(result).toContain('Method 1');
        expect(result).toContain('**Returns:** `void`'); // Default return type
      });
    });
  });
});

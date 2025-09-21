# AST Parser Library - Analysis and Architecture

## Existing Libraries Analysis

### **Direct Solutions (Close to your requirements):**

1. **TypeDoc** - The closest to what you need:
   - Converts TypeScript comments to HTML/JSON documentation
   - Has JSON output format
   - Extensible via plugin API
   - But focuses on documentation comments, not full AST analysis

2. **typescript-parser** - Good foundation:
   - Uses TypeScript Compiler API
   - Can parse multiple files
   - Creates declaration index with exports/imports
   - But limited to basic parsing, no project structure analysis

### **Building Blocks (What you'd use to build your solution):**

1. **TypeScript Compiler API** - Core parsing engine
2. **ts-morph** - Higher-level abstraction over TypeScript Compiler API
3. **Tree-sitter** - Multi-language parser (good for future Python support)
4. **madge** - Dependency analysis (can find entry points and dependencies)
5. **dependency-cruiser** - Advanced dependency analysis

## **Recommendation: Build Your Own**

After analyzing the existing solutions, I recommend **building your own library** because:

1. **No complete solution exists** that combines:
   - Project type detection
   - Full AST parsing with relations
   - Entry point identification
   - Extensible architecture for multiple languages

2. **Existing libraries are either too specific** (TypeDoc for docs) or **too low-level** (raw TypeScript Compiler API)

3. **Your requirements are unique** - you need a comprehensive project analyzer, not just a documentation generator

## **Proposed Architecture**

Here's how I'd design your library for maximum extensibility:

```
codestate-ast/
├── src/
│   ├── core/
│   │   ├── ProjectDetector.ts      # Detect project type (TS/JS/React/etc)
│   │   ├── ProjectParser.ts        # Main orchestrator
│   │   └── RelationBuilder.ts      # Build relationships between entities
│   ├── parsers/
│   │   ├── TypeScriptParser.ts     # TS/JS specific parsing
│   │   ├── PythonParser.ts         # Future Python support
│   │   └── BaseParser.ts           # Abstract base class
│   ├── analyzers/
│   │   ├── DependencyAnalyzer.ts   # Find imports/exports
│   │   ├── EntryPointAnalyzer.ts   # Identify entry points
│   │   └── StructureAnalyzer.ts     # Analyze project structure
│   └── types/
│       ├── ProjectInfo.ts          # Project metadata
│       ├── ASTNode.ts              # Generic AST node
│       └── Relations.ts            # Relationship types
```

## **Key Features to Implement:**

1. **Project Detection**: Analyze `package.json`, `tsconfig.json`, file structure
2. **AST Parsing**: Use TypeScript Compiler API for comprehensive parsing
3. **Relationship Mapping**: Track imports, exports, dependencies, inheritance
4. **Entry Point Discovery**: Find main files, entry points, public APIs
5. **Extensible Design**: Plugin architecture for future language support

## **Technology Stack:**

- **Core**: TypeScript Compiler API + ts-morph
- **Dependencies**: madge for dependency analysis
- **Future**: Tree-sitter for multi-language support
- **Output**: Structured JSON with full AST + metadata

## **Core Types Structure**

```typescript
interface ProjectInfo {
  type: 'typescript' | 'javascript' | 'react' | 'node' | 'unknown';
  rootPath: string;
  entryPoints: string[];
  dependencies: DependencyInfo[];
  structure: ProjectStructure;
  ast: ASTNode[];
  relations: Relation[];
}

interface ASTNode {
  id: string;
  type: string;
  name: string;
  filePath: string;
  start: number;
  end: number;
  children: ASTNode[];
  metadata: Record<string, any>;
}

interface Relation {
  type: 'import' | 'export' | 'extends' | 'implements' | 'references';
  from: string;
  to: string;
  metadata: Record<string, any>;
}
```

## **Usage Example**

```typescript
import { CodestateAST } from 'codestate-ast';

const parser = new CodestateAST();
const result = await parser.parseProject('./my-project');

console.log(JSON.stringify(result, null, 2));
```

## **Handling Large Projects**

For very large projects, the JSON output can become massive. Here are several strategies to handle this:

### **1. Streaming Output**
```typescript
// Stream results instead of building one large object
const parser = new CodestateAST();
const stream = parser.parseProjectStream('./large-project');

stream.on('file', (fileData) => {
  // Process each file as it's parsed
  console.log(`Parsed: ${fileData.filePath}`);
});

stream.on('relation', (relation) => {
  // Process relations as they're discovered
  console.log(`Relation: ${relation.type} from ${relation.from} to ${relation.to}`);
});
```

### **2. Selective Parsing**
```typescript
const options = {
  includePatterns: ['src/**/*.ts', 'lib/**/*.ts'],  // Only parse specific directories
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts'], // Skip test files
  maxDepth: 3,                                       // Limit directory depth
  includeOnlyExports: true,                          // Only parse exported symbols
  skipNodeModules: true                              // Skip dependencies
};

const result = await parser.parseProject('./large-project', options);
```

### **3. Chunked Output**
```typescript
// Split output into multiple files
const parser = new CodestateAST();
await parser.parseProjectChunked('./large-project', {
  chunkSize: 1000,        // Files per chunk
  outputDir: './output',  // Directory for chunk files
  format: 'json'          // or 'jsonl' for streaming
});
```

### **4. Database Storage**
```typescript
// Store in database instead of JSON
const parser = new CodestateAST();
await parser.parseProjectToDatabase('./large-project', {
  connection: 'postgresql://...',
  tablePrefix: 'ast_'
});
```

### **5. Compression**
```typescript
// Compress output
const result = await parser.parseProject('./large-project', {
  compress: true,           // Use gzip compression
  minify: true             // Remove unnecessary whitespace
});
```

### **6. Incremental Parsing**
```typescript
// Only parse changed files
const parser = new CodestateAST();
const result = await parser.parseProjectIncremental('./large-project', {
  cacheFile: './.ast-cache',
  since: '2024-01-01'      // Only parse files modified since date
});
```

### **7. Memory-Efficient Processing**
```typescript
// Process files one at a time to reduce memory usage
const parser = new CodestateAST();
const results = [];

for await (const fileResult of parser.parseProjectIterator('./large-project')) {
  // Process each file individually
  const processed = await processFile(fileResult);
  results.push(processed);
  
  // Optionally save intermediate results
  if (results.length % 100 === 0) {
    await saveIntermediateResults(results);
    results.length = 0; // Clear array to free memory
  }
}
```

### **8. Output Format Options**
```typescript
// Different output formats for different use cases
const options = {
  format: 'minimal',        // Only essential data
  // format: 'full',        // Complete AST
  // format: 'summary',     // High-level overview only
  // format: 'relations',   // Only relationships
  // format: 'entrypoints'  // Only entry points and public APIs
};
```

### **9. Lazy Loading**
```typescript
// Create a lazy-loaded result object
const parser = new CodestateAST();
const result = await parser.parseProjectLazy('./large-project');

// Data is loaded on-demand
const fileAST = await result.getFileAST('./src/components/Button.tsx');
const relations = await result.getRelations('Button');
```

### **10. Project Size Estimation**
```typescript
// Estimate output size before parsing
const parser = new CodestateAST();
const estimate = await parser.estimateProjectSize('./large-project');

console.log(`Estimated output size: ${estimate.sizeMB}MB`);
console.log(`Files to parse: ${estimate.fileCount}`);
console.log(`Estimated parsing time: ${estimate.timeMinutes} minutes`);

if (estimate.sizeMB > 100) {
  console.log('Consider using streaming or chunked output');
}
```

## **Two Parsing Modes**

### **1. Full Parsing (From Scratch)**
When parsing everything from scratch or when you want a complete fresh analysis:

```typescript
const parser = new CodestateAST();

// Full parse with options
const result = await parser.parseProject('./my-project', {
  mode: 'full',
  includePatterns: ['src/**/*.ts', 'lib/**/*.ts'],
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', 'node_modules/**'],
  skipNodeModules: true,
  includeOnlyExports: false,  // Parse everything, not just exports
  maxDepth: 10
});
```

### **2. Incremental Parsing (Changed Content Only)**
When code has changed and you only want to update the affected parts:

```typescript
const parser = new CodestateAST();

// Incremental parse - only changed files
const result = await parser.parseProjectIncremental('./my-project', {
  mode: 'incremental',
  cacheFile: './.ast-cache.json',
  since: '2024-01-15T10:30:00Z',  // Only files modified since this timestamp
  // OR
  changedFiles: [                 // Explicitly specify changed files
    './src/components/Button.tsx',
    './src/utils/helpers.ts'
  ],
  // OR
  gitDiff: true,                  // Use git to detect changed files
  gitBranch: 'main'               // Compare against this branch
});
```

### **Cache Management**

The incremental parsing relies on a cache file that stores:

```typescript
interface ASTCache {
  version: string;                    // Cache format version
  projectPath: string;               // Project root path
  lastUpdated: string;               // ISO timestamp
  files: {
    [filePath: string]: {
      hash: string;                  // File content hash (SHA-256)
      lastModified: string;          // File modification time
      ast: ASTNode;                  // Cached AST data
      relations: Relation[];         // Cached relations
      dependencies: string[];        // File dependencies
    }
  };
  globalRelations: Relation[];       // Cross-file relations
  entryPoints: string[];             // Project entry points
}
```

### **Change Detection Strategies**

#### **1. File Hash Comparison**
```typescript
// Compare file content hashes
const currentHash = await calculateFileHash('./src/Button.tsx');
const cachedHash = cache.files['./src/Button.tsx']?.hash;

if (currentHash !== cachedHash) {
  // File has changed, needs re-parsing
  await parseFile('./src/Button.tsx');
}
```

#### **2. Modification Time**
```typescript
// Compare file modification times
const currentMtime = await getFileMtime('./src/Button.tsx');
const cachedMtime = cache.files['./src/Button.tsx']?.lastModified;

if (currentMtime > cachedMtime) {
  // File has been modified, needs re-parsing
  await parseFile('./src/Button.tsx');
}
```

#### **3. Git Integration**
```typescript
// Use git to detect changed files
const changedFiles = await getGitChangedFiles('./my-project', {
  since: '2024-01-15T10:30:00Z',
  branch: 'main'
});

for (const file of changedFiles) {
  await parseFile(file);
}
```

### **Dependency-Aware Incremental Parsing**

When a file changes, you might need to re-parse dependent files:

```typescript
// Parse changed file and its dependents
const changedFile = './src/components/Button.tsx';
const dependents = await findDependentFiles(changedFile, cache);

// Re-parse the changed file
await parseFile(changedFile);

// Re-parse files that import from the changed file
for (const dependent of dependents) {
  await parseFile(dependent);
}

// Update relations
await updateRelations(changedFile, dependents);
```

### **Smart Cache Invalidation**

```typescript
interface CacheInvalidation {
  // Invalidate cache when these files change
  invalidateOnChange: string[];
  
  // Invalidate cache when these patterns change
  invalidateOnPattern: string[];
  
  // Invalidate entire cache when these files change
  invalidateAllOnChange: string[];
}

const invalidation: CacheInvalidation = {
  invalidateOnChange: [
    'package.json',           // Dependencies changed
    'tsconfig.json',          // TypeScript config changed
    'webpack.config.js'       // Build config changed
  ],
  invalidateOnPattern: [
    '**/*.d.ts',             // Type definitions changed
    '**/index.ts'            // Barrel exports changed
  ],
  invalidateAllOnChange: [
    'package.json',           // Major dependency changes
    'tsconfig.json'           // TypeScript config changes
  ]
};
```

### **API Usage Examples**

#### **Full Parse**
```typescript
// Complete fresh analysis
const parser = new CodestateAST();
const result = await parser.parseProject('./my-project', {
  mode: 'full',
  outputFile: './project-analysis.json',
  compress: true
});
```

#### **Incremental Parse**
```typescript
// Update only changed content
const parser = new CodestateAST();
const result = await parser.parseProjectIncremental('./my-project', {
  mode: 'incremental',
  cacheFile: './.ast-cache.json',
  outputFile: './project-analysis.json',
  gitDiff: true,
  updateDependents: true  // Also update files that depend on changed files
});
```

#### **Hybrid Approach**
```typescript
// Check if cache exists, otherwise do full parse
const parser = new CodestateAST();
const cacheExists = await parser.cacheExists('./my-project');

if (cacheExists) {
  // Incremental parse
  const result = await parser.parseProjectIncremental('./my-project');
} else {
  // Full parse
  const result = await parser.parseProject('./my-project');
}
```

## **Recommended Approach for Large Projects**

1. **Start with selective parsing** - exclude test files, node_modules, etc.
2. **Use streaming output** for real-time processing
3. **Implement chunked output** for manageable file sizes
4. **Add compression** to reduce file size
5. **Use incremental parsing** for ongoing analysis
6. **Implement smart cache invalidation** for dependency changes

## **Documentation Generation (Without AI)**

Since AI integration is planned for the future, the library needs to generate comprehensive documentation from AST analysis alone. Here's how to achieve this:

### **1. JSDoc/TSDoc Comment Extraction**

```typescript
interface DocumentationData {
  summary: string;           // Brief description
  description: string;       // Detailed description
  parameters: ParameterDoc[]; // Function parameters
  returns: ReturnDoc;        // Return value documentation
  examples: string[];       // Code examples
  tags: Record<string, string>; // Custom tags (@since, @deprecated, etc.)
  seeAlso: string[];         // Related functions/classes
}

interface ParameterDoc {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  defaultValue?: string;
}

// Extract documentation from comments
const extractDocumentation = (node: ASTNode): DocumentationData => {
  const comments = node.leadingComments || [];
  const jsdocComments = comments.filter(comment => 
    comment.text.trim().startsWith('*') || comment.text.trim().startsWith('/**')
  );
  
  return parseJSDocComments(jsdocComments);
};
```

### **2. Type Information Extraction**

```typescript
interface TypeInformation {
  name: string;
  kind: 'interface' | 'type' | 'enum' | 'class' | 'function';
  properties: PropertyInfo[];
  methods: MethodInfo[];
  generics: GenericInfo[];
  extends?: string[];
  implements?: string[];
}

interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
  description?: string;
}

// Extract type information from AST
const extractTypeInfo = (node: ASTNode): TypeInformation => {
  if (node.kind === 'InterfaceDeclaration') {
    return {
      name: node.name,
      kind: 'interface',
      properties: extractInterfaceProperties(node),
      methods: extractInterfaceMethods(node),
      generics: extractGenerics(node)
    };
  }
  // Handle other types...
};
```

### **3. API Surface Analysis**

```typescript
interface APISurface {
  publicExports: ExportInfo[];
  privateExports: ExportInfo[];
  entryPoints: EntryPointInfo[];
  dependencies: DependencyInfo[];
}

interface ExportInfo {
  name: string;
  type: string;
  file: string;
  isDefault: boolean;
  documentation?: DocumentationData;
  usage: UsageInfo[];
}

// Analyze what's publicly available
const analyzeAPISurface = (project: ProjectInfo): APISurface => {
  const publicExports = project.ast
    .filter(node => node.isExported && !node.isPrivate)
    .map(node => ({
      name: node.name,
      type: node.kind,
      file: node.filePath,
      isDefault: node.isDefaultExport,
      documentation: extractDocumentation(node),
      usage: findUsage(node, project)
    }));
    
  return { publicExports, /* ... */ };
};
```

### **4. Usage Pattern Detection**

```typescript
interface UsagePattern {
  pattern: string;
  frequency: number;
  examples: string[];
  context: string[];
}

// Detect common usage patterns
const detectUsagePatterns = (project: ProjectInfo): UsagePattern[] => {
  const patterns: UsagePattern[] = [];
  
  // Detect factory patterns
  const factoryPatterns = detectFactoryPatterns(project);
  patterns.push(...factoryPatterns);
  
  // Detect singleton patterns
  const singletonPatterns = detectSingletonPatterns(project);
  patterns.push(...singletonPatterns);
  
  // Detect observer patterns
  const observerPatterns = detectObserverPatterns(project);
  patterns.push(...observerPatterns);
  
  return patterns;
};
```

### **5. Documentation Templates**

```typescript
interface DocumentationTemplate {
  name: string;
  sections: DocumentationSection[];
  format: 'markdown' | 'html' | 'json';
}

interface DocumentationSection {
  title: string;
  content: string;
  data: any;
  template: string;
}

// Generate documentation sections
const generateDocumentationSections = (project: ProjectInfo): DocumentationSection[] => {
  return [
    {
      title: 'Overview',
      content: generateOverview(project),
      data: project,
      template: 'overview.md'
    },
    {
      title: 'API Reference',
      content: generateAPIReference(project),
      data: project.publicExports,
      template: 'api-reference.md'
    },
    {
      title: 'Examples',
      content: generateExamples(project),
      data: project.examples,
      template: 'examples.md'
    },
    {
      title: 'Architecture',
      content: generateArchitecture(project),
      data: project.structure,
      template: 'architecture.md'
    }
  ];
};
```

### **6. Code Examples Generation**

```typescript
// Extract and generate code examples
const generateCodeExamples = (project: ProjectInfo): CodeExample[] => {
  const examples: CodeExample[] = [];
  
  // Extract examples from JSDoc comments
  project.ast.forEach(node => {
    const doc = extractDocumentation(node);
    if (doc.examples.length > 0) {
      examples.push({
        title: `${node.name} Examples`,
        description: doc.description,
        code: doc.examples,
        language: 'typescript'
      });
    }
  });
  
  // Generate usage examples from actual usage
  const usageExamples = generateUsageExamples(project);
  examples.push(...usageExamples);
  
  // Generate integration examples
  const integrationExamples = generateIntegrationExamples(project);
  examples.push(...integrationExamples);
  
  return examples;
};
```

### **7. Dependency Graph Visualization**

```typescript
interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
}

interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'module' | 'class' | 'function';
  size: number;
  color: string;
}

// Generate dependency graph data
const generateDependencyGraph = (project: ProjectInfo): DependencyGraph => {
  const nodes = project.ast.map(node => ({
    id: node.id,
    label: node.name,
    type: node.kind,
    size: calculateNodeSize(node),
    color: getNodeColor(node.kind)
  }));
  
  const edges = project.relations.map(relation => ({
    source: relation.from,
    target: relation.to,
    type: relation.type,
    weight: calculateRelationWeight(relation)
  }));
  
  return { nodes, edges, clusters: [] };
};
```

### **8. Documentation Output Formats**

```typescript
interface DocumentationOutput {
  format: 'markdown' | 'html' | 'json' | 'pdf';
  sections: DocumentationSection[];
  metadata: DocumentationMetadata;
}

// Generate different output formats
const generateDocumentation = (
  project: ProjectInfo, 
  format: 'markdown' | 'html' | 'json' | 'pdf'
): DocumentationOutput => {
  const sections = generateDocumentationSections(project);
  
  switch (format) {
    case 'markdown':
      return generateMarkdownDocumentation(sections);
    case 'html':
      return generateHTMLDocumentation(sections);
    case 'json':
      return generateJSONDocumentation(sections);
    case 'pdf':
      return generatePDFDocumentation(sections);
  }
};
```

### **9. Smart Documentation Features**

```typescript
// Auto-generate documentation for undocumented code
const generateMissingDocumentation = (project: ProjectInfo): DocumentationSuggestion[] => {
  const suggestions: DocumentationSuggestion[] = [];
  
  project.ast.forEach(node => {
    if (!hasDocumentation(node) && isPublicAPI(node)) {
      suggestions.push({
        node: node,
        type: 'missing-documentation',
        priority: calculatePriority(node),
        suggestedContent: generateSuggestedDocumentation(node)
      });
    }
  });
  
  return suggestions;
};

// Detect breaking changes
const detectBreakingChanges = (
  oldProject: ProjectInfo, 
  newProject: ProjectInfo
): BreakingChange[] => {
  const changes: BreakingChange[] = [];
  
  // Compare API surfaces
  const oldAPI = analyzeAPISurface(oldProject);
  const newAPI = analyzeAPISurface(newProject);
  
  // Detect removed exports
  const removedExports = findRemovedExports(oldAPI, newAPI);
  changes.push(...removedExports);
  
  // Detect changed signatures
  const changedSignatures = findChangedSignatures(oldAPI, newAPI);
  changes.push(...changedSignatures);
  
  return changes;
};
```

### **10. Documentation Quality Metrics**

```typescript
interface DocumentationQuality {
  coverage: number;           // Percentage of documented public APIs
  completeness: number;        // Quality of existing documentation
  examples: number;           // Number of code examples
  freshness: number;          // How up-to-date the docs are
  readability: number;        // Readability score
}

// Calculate documentation quality metrics
const calculateDocumentationQuality = (project: ProjectInfo): DocumentationQuality => {
  const publicAPIs = project.ast.filter(node => isPublicAPI(node));
  const documentedAPIs = publicAPIs.filter(node => hasDocumentation(node));
  
  return {
    coverage: (documentedAPIs.length / publicAPIs.length) * 100,
    completeness: calculateCompletenessScore(documentedAPIs),
    examples: countCodeExamples(project),
    freshness: calculateFreshnessScore(project),
    readability: calculateReadabilityScore(project)
  };
};
```

### **Inputs and Outputs**

### **Inputs**

#### **1. Project Path (Required)**
```typescript
// Absolute or relative path to project root
const projectPath = './my-project';
// OR
const projectPath = '/absolute/path/to/project';
```

#### **2. Parsing Options (Optional)**
```typescript
interface ParsingOptions {
  // File filtering
  includePatterns?: string[];        // ['src/**/*.ts', 'lib/**/*.ts']
  excludePatterns?: string[];       // ['**/*.test.ts', '**/*.spec.ts']
  skipNodeModules?: boolean;         // true (default)
  maxDepth?: number;                // 10 (default)
  
  // Parsing mode
  mode?: 'full' | 'incremental';    // 'full' (default)
  
  // Incremental parsing
  cacheFile?: string;               // './.ast-cache.json'
  since?: string;                   // '2024-01-15T10:30:00Z'
  changedFiles?: string[];          // ['./src/Button.tsx']
  gitDiff?: boolean;                // false
  gitBranch?: string;               // 'main'
  
  // Output options
  outputFile?: string;              // './project-analysis.json'
  compress?: boolean;               // false
  minify?: boolean;                 // false
  
  // Documentation options
  includeDocumentation?: boolean;    // true (default)
  includeExamples?: boolean;        // true (default)
  includeArchitecture?: boolean;    // true (default)
  includeDependencyGraph?: boolean; // true (default)
  qualityMetrics?: boolean;         // false (default)
  
  // Format options
  format?: 'json' | 'markdown' | 'html' | 'pdf'; // 'json' (default)
}
```

#### **3. Documentation Options (Optional)**
```typescript
interface DocumentationOptions {
  format: 'markdown' | 'html' | 'json' | 'pdf';
  outputDir?: string;               // './docs/'
  includeExamples?: boolean;        // true
  includeArchitecture?: boolean;    // true
  includeDependencyGraph?: boolean; // true
  qualityMetrics?: boolean;         // false
  templates?: DocumentationTemplate[];
}
```

### **Outputs**

#### **1. Project Analysis JSON (Default)**
```typescript
interface ProjectAnalysisOutput {
  // Project metadata
  project: {
    name: string;                   // From package.json
    version: string;                // From package.json
    type: 'typescript' | 'javascript' | 'react' | 'node' | 'unknown';
    rootPath: string;
    entryPoints: string[];          // ['src/index.ts', 'src/main.ts']
    dependencies: DependencyInfo[];
    devDependencies: DependencyInfo[];
  };
  
  // File structure
  structure: {
    files: FileInfo[];
    directories: DirectoryInfo[];
    totalFiles: number;
    totalLines: number;
    totalSize: number;
  };
  
  // AST data
  ast: {
    nodes: ASTNode[];
    relations: Relation[];
    entryPoints: EntryPointInfo[];
    publicExports: ExportInfo[];
    privateExports: ExportInfo[];
  };
  
  // Analysis results
  analysis: {
    complexity: ComplexityMetrics;
    patterns: UsagePattern[];
    architecture: ArchitectureInfo;
    quality: QualityMetrics;
  };
  
  // Documentation data
  documentation?: {
    sections: DocumentationSection[];
    quality: DocumentationQuality;
    suggestions: DocumentationSuggestion[];
  };
  
  // Metadata
  metadata: {
    generatedAt: string;            // ISO timestamp
    parserVersion: string;
    processingTime: number;         // milliseconds
    cacheUsed: boolean;
    filesProcessed: number;
  };
}
```

#### **2. Documentation Output (When requested)**
```typescript
interface DocumentationOutput {
  // Generated documentation files
  files: {
    overview: string;               // 'README.md'
    apiReference: string;           // 'API.md'
    examples: string;               // 'EXAMPLES.md'
    architecture: string;           // 'ARCHITECTURE.md'
    changelog: string;             // 'CHANGELOG.md'
  };
  
  // Visual assets
  assets: {
    dependencyGraph: string;        // 'dependency-graph.svg'
    architectureDiagram: string;   // 'architecture.svg'
    complexityChart: string;       // 'complexity-chart.svg'
  };
  
  // Data files
  data: {
    projectAnalysis: string;       // 'project-analysis.json'
    qualityMetrics: string;       // 'quality-metrics.json'
    breakingChanges: string;       // 'breaking-changes.json'
  };
  
  // Metadata
  metadata: {
    generatedAt: string;
    format: string;
    totalFiles: number;
    documentationCoverage: number;
  };
}
```

#### **3. Streaming Output (For large projects)**
```typescript
interface StreamingOutput {
  // File-by-file processing
  onFile: (fileData: FileAnalysisResult) => void;
  onRelation: (relation: Relation) => void;
  onComplete: (summary: ProcessingSummary) => void;
  onError: (error: ProcessingError) => void;
}

interface FileAnalysisResult {
  filePath: string;
  ast: ASTNode;
  relations: Relation[];
  documentation: DocumentationData;
  complexity: ComplexityMetrics;
  processingTime: number;
}
```

#### **4. Chunked Output (For very large projects)**
```typescript
interface ChunkedOutput {
  chunks: {
    [chunkId: string]: {
      files: string[];
      data: ProjectAnalysisOutput;
      metadata: ChunkMetadata;
    };
  };
  
  summary: {
    totalChunks: number;
    totalFiles: number;
    totalSize: number;
    processingTime: number;
  };
}
```

### **Usage Examples**

#### **Basic Usage**
```typescript
const parser = new CodestateAST();

// Parse project and get JSON output
const result = await parser.parseProject('./my-project');
console.log(JSON.stringify(result, null, 2));
```

#### **With Options**
```typescript
const parser = new CodestateAST();

const result = await parser.parseProject('./my-project', {
  includePatterns: ['src/**/*.ts'],
  excludePatterns: ['**/*.test.ts'],
  skipNodeModules: true,
  outputFile: './analysis.json',
  compress: true
});
```

#### **Generate Documentation**
```typescript
const parser = new CodestateAST();

// Parse project
const project = await parser.parseProject('./my-project');

// Generate documentation
const docs = await parser.generateDocumentation(project, {
  format: 'markdown',
  outputDir: './docs/',
  includeExamples: true,
  includeArchitecture: true
});
```

#### **Incremental Parsing**
```typescript
const parser = new CodestateAST();

const result = await parser.parseProjectIncremental('./my-project', {
  cacheFile: './.ast-cache.json',
  gitDiff: true,
  updateDependents: true
});
```

#### **Streaming (Large Projects)**
```typescript
const parser = new CodestateAST();

const stream = parser.parseProjectStream('./large-project');

stream.on('file', (fileData) => {
  console.log(`Processed: ${fileData.filePath}`);
});

stream.on('complete', (summary) => {
  console.log(`Processed ${summary.totalFiles} files in ${summary.processingTime}ms`);
});
```

### **Output File Structure**

The library generates project-specific output directories and files based on the project name and path to avoid conflicts when analyzing multiple projects.

#### **Default Output Structure**
```
{project-name}-analysis/
├── {project-name}-analysis.json          # Main analysis output
├── docs/                                  # Generated documentation
│   ├── README.md                          # Project overview
│   ├── API.md                             # API reference
│   ├── EXAMPLES.md                        # Code examples
│   ├── ARCHITECTURE.md                    # Architecture documentation
│   └── assets/                            # Visual assets
│       ├── dependency-graph.svg
│       └── architecture.svg
├── .{project-name}-ast-cache.json        # Cache file (if incremental)
└── {project-name}-quality-metrics.json   # Quality analysis
```

#### **Custom Output Structure**
```typescript
interface OutputOptions {
  outputDir?: string;                      // Custom output directory
  outputPrefix?: string;                   // Custom prefix for files
  outputSuffix?: string;                   // Custom suffix for files
  useProjectName?: boolean;                // Use project name in output (default: true)
  useTimestamp?: boolean;                 // Add timestamp to avoid conflicts (default: false)
  useHash?: boolean;                       // Use project path hash (default: false)
}

// Examples:
const options1 = {
  outputDir: './analyses',
  useProjectName: true
};
// Output: ./analyses/my-awesome-project-analysis.json

const options2 = {
  outputDir: './analyses',
  outputPrefix: 'ast',
  useTimestamp: true
};
// Output: ./analyses/ast-2024-01-15T10-30-00Z-analysis.json

const options3 = {
  outputDir: './analyses',
  useHash: true
};
// Output: ./analyses/a1b2c3d4-analysis.json (hash of project path)
```

#### **Project Name Detection**
```typescript
interface ProjectNameDetection {
  // Priority order for project name detection:
  sources: {
    packageJson: string;                   // From package.json "name" field
    directoryName: string;                 // From directory name
    gitRepo: string;                       // From git remote origin
    custom: string;                        // User-provided name
  };
  
  // Fallback naming strategy
  fallback: {
    useTimestamp: boolean;                 // Add timestamp if name conflicts
    useHash: boolean;                      // Use hash if name conflicts
    usePath: boolean;                      // Use full path if name conflicts
  };
}

// Examples:
// Project: /home/user/my-awesome-project
// package.json: { "name": "my-awesome-project" }
// Output: my-awesome-project-analysis.json

// Project: /home/user/untitled-project
// package.json: { "name": "untitled-project" }
// Output: untitled-project-analysis.json

// Project: /home/user/project
// package.json: { "name": "project" }
// Output: project-analysis.json
```

#### **Multiple Project Management**
```typescript
interface MultiProjectOptions {
  // Global output directory for all projects
  globalOutputDir?: string;               // './all-analyses'
  
  // Project-specific subdirectories
  useSubdirectories?: boolean;             // true (default)
  
  // Naming strategy for multiple projects
  namingStrategy?: 'project-name' | 'path-hash' | 'timestamp' | 'custom';
  
  // Conflict resolution
  conflictResolution?: 'overwrite' | 'rename' | 'error';
}

// Example: Analyzing multiple projects
const parser = new CodestateAST();

// Project 1: /home/user/project-a
await parser.parseProject('/home/user/project-a', {
  globalOutputDir: './analyses',
  useSubdirectories: true
});
// Output: ./analyses/project-a/project-a-analysis.json

// Project 2: /home/user/project-b
await parser.parseProject('/home/user/project-b', {
  globalOutputDir: './analyses',
  useSubdirectories: true
});
// Output: ./analyses/project-b/project-b-analysis.json

// Project 3: /home/user/project-c
await parser.parseProject('/home/user/project-c', {
  globalOutputDir: './analyses',
  useSubdirectories: true
});
// Output: ./analyses/project-c/project-c-analysis.json
```

#### **Output Directory Structure for Multiple Projects**
```
analyses/
├── project-a/
│   ├── project-a-analysis.json
│   ├── docs/
│   │   ├── README.md
│   │   ├── API.md
│   │   └── assets/
│   ├── .project-a-ast-cache.json
│   └── project-a-quality-metrics.json
├── project-b/
│   ├── project-b-analysis.json
│   ├── docs/
│   │   ├── README.md
│   │   ├── API.md
│   │   └── assets/
│   ├── .project-b-ast-cache.json
│   └── project-b-quality-metrics.json
└── project-c/
    ├── project-c-analysis.json
    ├── docs/
    │   ├── README.md
    │   ├── API.md
    │   └── assets/
    ├── .project-c-ast-cache.json
    └── project-c-quality-metrics.json
```

#### **Usage Examples**

```typescript
// Basic usage with project-specific naming
const parser = new CodestateAST();
const result = await parser.parseProject('./my-awesome-project');
// Output: my-awesome-project-analysis.json

// Custom output directory
const result = await parser.parseProject('./my-awesome-project', {
  outputDir: './analyses',
  useProjectName: true
});
// Output: ./analyses/my-awesome-project-analysis.json

// Multiple projects with subdirectories
const projects = ['./project-a', './project-b', './project-c'];

for (const projectPath of projects) {
  await parser.parseProject(projectPath, {
    globalOutputDir: './analyses',
    useSubdirectories: true,
    conflictResolution: 'rename'
  });
}

// Custom naming strategy
const result = await parser.parseProject('./my-awesome-project', {
  outputDir: './analyses',
  outputPrefix: 'ast',
  outputSuffix: 'analysis',
  useTimestamp: true
});
// Output: ./analyses/ast-my-awesome-project-analysis-2024-01-15T10-30-00Z.json
```

#### **Project Identification**
```typescript
interface ProjectIdentifier {
  name: string;                           // Project name
  path: string;                           // Project path
  hash: string;                           // Path hash
  timestamp: string;                      // Analysis timestamp
  version: string;                        // Project version
}

// Example output metadata
{
  project: {
    name: "my-awesome-project",
    path: "/home/user/my-awesome-project",
    hash: "a1b2c3d4e5f6",
    timestamp: "2024-01-15T10:30:00Z",
    version: "1.0.0"
  }
}
```

## **Versioning and Multiple Iterations**

The library supports multiple versioning strategies to maintain different iterations of project analyses based on branches, changes, or manual versions.

### **1. Branch-Based Versioning**

```typescript
interface BranchVersioning {
  // Git branch information
  branch: {
    name: string;                         // Current branch name
    commit: string;                       // Current commit hash
    commitMessage: string;                // Commit message
    author: string;                       // Commit author
    date: string;                         // Commit date
  };
  
  // Branch-specific output
  output: {
    branchDir: string;                   // Branch-specific directory
    branchSuffix: string;                // Branch suffix for files
    includeCommitHash: boolean;          // Include commit hash in naming
  };
}

// Example: Branch-based output structure
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'branch',
    includeCommitHash: true,
    branchDir: true
  }
});

// Output structure:
// analyses/
// ├── my-awesome-project/
// │   ├── main/
// │   │   ├── my-awesome-project-main-a1b2c3d4-analysis.json
// │   │   ├── docs/
// │   │   └── .my-awesome-project-main-a1b2c3d4-ast-cache.json
// │   ├── feature-auth/
// │   │   ├── my-awesome-project-feature-auth-e5f6g7h8-analysis.json
// │   │   ├── docs/
// │   │   └── .my-awesome-project-feature-auth-e5f6g7h8-ast-cache.json
// │   └── develop/
// │       ├── my-awesome-project-develop-i9j0k1l2-analysis.json
// │       ├── docs/
// │       └── .my-awesome-project-develop-i9j0k1l2-ast-cache.json
```

### **2. Change-Based Versioning**

```typescript
interface ChangeVersioning {
  // Change detection
  changes: {
    filesChanged: string[];               // List of changed files
    changeTypes: string[];                // ['added', 'modified', 'deleted']
    changeCount: number;                  // Total number of changes
    changeHash: string;                   // Hash of all changes
  };
  
  // Version naming
  versioning: {
    useChangeHash: boolean;               // Use change hash in version
    useChangeCount: boolean;              // Use change count in version
    useTimestamp: boolean;                // Use timestamp in version
  };
}

// Example: Change-based versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'changes',
    useChangeHash: true,
    useChangeCount: true
  }
});

// Output structure:
// analyses/
// ├── my-awesome-project/
// │   ├── v1.0.0-changes-3-a1b2c3d4/
// │   │   ├── my-awesome-project-v1.0.0-changes-3-a1b2c3d4-analysis.json
// │   │   └── docs/
// │   ├── v1.0.1-changes-7-e5f6g7h8/
// │   │   ├── my-awesome-project-v1.0.1-changes-7-e5f6g7h8-analysis.json
// │   │   └── docs/
// │   └── v1.1.0-changes-15-i9j0k1l2/
// │       ├── my-awesome-project-v1.1.0-changes-15-i9j0k1l2-analysis.json
// │       └── docs/
```

### **3. Semantic Versioning**

```typescript
interface SemanticVersioning {
  // Version information
  version: {
    major: number;                        // Major version
    minor: number;                        // Minor version
    patch: number;                        // Patch version
    prerelease?: string;                  // Pre-release identifier
    build?: string;                       // Build identifier
  };
  
  // Version comparison
  comparison: {
    previousVersion?: string;              // Previous version for comparison
    versionDiff: VersionDiff;             // Differences between versions
  };
}

interface VersionDiff {
  breakingChanges: BreakingChange[];      // Breaking changes
  newFeatures: Feature[];                 // New features
  bugFixes: BugFix[];                    // Bug fixes
  deprecated: DeprecatedItem[];          // Deprecated items
}

// Example: Semantic versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'semantic',
    version: '1.2.3',
    previousVersion: '1.2.2',
    includeDiff: true
  }
});

// Output structure:
// analyses/
// ├── my-awesome-project/
// │   ├── v1.2.2/
// │   │   ├── my-awesome-project-v1.2.2-analysis.json
// │   │   └── docs/
// │   ├── v1.2.3/
// │   │   ├── my-awesome-project-v1.2.3-analysis.json
// │   │   ├── docs/
// │   │   └── version-diff.json
// │   └── v1.3.0/
// │       ├── my-awesome-project-v1.3.0-analysis.json
// │       ├── docs/
// │       └── version-diff.json
```

### **4. Timestamp-Based Versioning**

```typescript
interface TimestampVersioning {
  // Timestamp information
  timestamp: {
    iso: string;                          // ISO timestamp
    unix: number;                        // Unix timestamp
    readable: string;                     // Human-readable format
  };
  
  // Version naming
  naming: {
    format: 'iso' | 'unix' | 'readable'; // Timestamp format
    precision: 'second' | 'minute' | 'hour' | 'day'; // Precision level
  };
}

// Example: Timestamp-based versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'timestamp',
    format: 'iso',
    precision: 'minute'
  }
});

// Output structure:
// analyses/
// ├── my-awesome-project/
// │   ├── 2024-01-15T10-30/
// │   │   ├── my-awesome-project-2024-01-15T10-30-analysis.json
// │   │   └── docs/
// │   ├── 2024-01-15T11-45/
// │   │   ├── my-awesome-project-2024-01-15T11-45-analysis.json
// │   │   └── docs/
// │   └── 2024-01-15T14-20/
// │       ├── my-awesome-project-2024-01-15T14-20-analysis.json
// │       └── docs/
```

### **5. Custom Versioning**

```typescript
interface CustomVersioning {
  // Custom version identifier
  customVersion: string;                 // User-defined version
  
  // Custom naming
  naming: {
    prefix?: string;                     // Custom prefix
    suffix?: string;                      // Custom suffix
    separator?: string;                   // Separator character
  };
  
  // Metadata
  metadata: {
    description?: string;                // Version description
    tags?: string[];                     // Version tags
    author?: string;                      // Version author
  };
}

// Example: Custom versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'custom',
    customVersion: 'pre-release-alpha',
    naming: {
      prefix: 'v',
      suffix: 'analysis',
      separator: '-'
    },
    metadata: {
      description: 'Pre-release alpha version',
      tags: ['alpha', 'pre-release'],
      author: 'developer@example.com'
    }
  }
});

// Output structure:
// analyses/
// ├── my-awesome-project/
// │   ├── v-pre-release-alpha-analysis/
// │   │   ├── my-awesome-project-v-pre-release-alpha-analysis.json
// │   │   ├── docs/
// │   │   └── version-metadata.json
```

### **6. Version Management**

```typescript
interface VersionManagement {
  // Version storage
  storage: {
    type: 'local' | 'remote' | 'database'; // Storage type
    path?: string;                       // Local storage path
    url?: string;                        // Remote storage URL
    connection?: string;                  // Database connection
  };
  
  // Version retention
  retention: {
    maxVersions: number;                 // Maximum versions to keep
    keepForever: string[];               // Versions to keep forever
    autoCleanup: boolean;                // Auto-cleanup old versions
  };
  
  // Version comparison
  comparison: {
    enableDiff: boolean;                 // Enable version diffs
    diffFormat: 'json' | 'markdown' | 'html'; // Diff format
    includeMetrics: boolean;             // Include quality metrics
  };
}

// Example: Version management
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'semantic',
    version: '1.2.3'
  },
  management: {
    storage: {
      type: 'local',
      path: './analyses'
    },
    retention: {
      maxVersions: 10,
      keepForever: ['v1.0.0', 'v2.0.0'],
      autoCleanup: true
    },
    comparison: {
      enableDiff: true,
      diffFormat: 'markdown',
      includeMetrics: true
    }
  }
});
```

### **7. Version Comparison and Diff**

```typescript
interface VersionComparison {
  // Compare two versions
  compare: (version1: string, version2: string) => VersionDiff;
  
  // Generate diff report
  generateDiff: (version1: string, version2: string) => DiffReport;
  
  // Get version history
  getHistory: (projectName: string) => VersionHistory[];
}

interface DiffReport {
  summary: {
    totalChanges: number;
    breakingChanges: number;
    newFeatures: number;
    bugFixes: number;
  };
  
  details: {
    filesAdded: string[];
    filesModified: string[];
    filesDeleted: string[];
    apisChanged: APIChange[];
    qualityMetrics: QualityMetricDiff;
  };
  
  recommendations: {
    migrationGuide: string;
    testingStrategy: string;
    documentationUpdates: string[];
  };
}

// Example: Version comparison
const parser = new CodestateAST();

// Compare versions
const diff = await parser.compareVersions('./my-awesome-project', 'v1.2.2', 'v1.2.3');

// Generate diff report
const report = await parser.generateDiffReport('./my-awesome-project', 'v1.2.2', 'v1.2.3');

// Get version history
const history = await parser.getVersionHistory('./my-awesome-project');
```

### **8. Usage Examples**

```typescript
// Branch-based versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'branch',
    includeCommitHash: true,
    branchDir: true
  }
});

// Change-based versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'changes',
    useChangeHash: true,
    useChangeCount: true
  }
});

// Semantic versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'semantic',
    version: '1.2.3',
    previousVersion: '1.2.2',
    includeDiff: true
  }
});

// Timestamp-based versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'timestamp',
    format: 'iso',
    precision: 'minute'
  }
});

// Custom versioning
const result = await parser.parseProject('./my-awesome-project', {
  versioning: {
    strategy: 'custom',
    customVersion: 'pre-release-alpha',
    metadata: {
      description: 'Pre-release alpha version',
      tags: ['alpha', 'pre-release']
    }
  }
});
```

### **9. Version Output Structure**

```
analyses/
├── my-awesome-project/
│   ├── main/
│   │   ├── v1.0.0/
│   │   │   ├── my-awesome-project-v1.0.0-analysis.json
│   │   │   ├── docs/
│   │   │   └── version-metadata.json
│   │   ├── v1.1.0/
│   │   │   ├── my-awesome-project-v1.1.0-analysis.json
│   │   │   ├── docs/
│   │   │   ├── version-diff.json
│   │   │   └── version-metadata.json
│   │   └── v1.2.0/
│   │       ├── my-awesome-project-v1.2.0-analysis.json
│   │       ├── docs/
│   │       ├── version-diff.json
│   │       └── version-metadata.json
│   ├── feature-auth/
│   │   ├── v1.2.1-feature-auth/
│   │   │   ├── my-awesome-project-v1.2.1-feature-auth-analysis.json
│   │   │   ├── docs/
│   │   │   └── version-metadata.json
│   │   └── v1.2.2-feature-auth/
│   │       ├── my-awesome-project-v1.2.2-feature-auth-analysis.json
│   │       ├── docs/
│   │       └── version-metadata.json
│   └── develop/
│       ├── v1.3.0-develop/
│       │   ├── my-awesome-project-v1.3.0-develop-analysis.json
│       │   ├── docs/
│       │   └── version-metadata.json
│       └── v1.3.1-develop/
│           ├── my-awesome-project-v1.3.1-develop-analysis.json
│           ├── docs/
│           └── version-metadata.json
```

## **Indexing System**

The library maintains comprehensive indexes for easy discovery and management of project analyses.

### **1. Global Project Index**

```typescript
interface GlobalProjectIndex {
  // Index metadata
  metadata: {
    version: string;                       // Index format version
    lastUpdated: string;                   // Last update timestamp
    totalProjects: number;                 // Total number of projects
    totalAnalyses: number;                 // Total number of analyses
    indexSize: number;                     // Index file size
  };
  
  // Project registry
  projects: {
    [projectId: string]: ProjectIndexEntry;
  };
  
  // Search and filtering
  search: {
    byName: { [name: string]: string[] };  // Project name -> project IDs
    byType: { [type: string]: string[] };  // Project type -> project IDs
    byLanguage: { [language: string]: string[] }; // Language -> project IDs
    byTags: { [tag: string]: string[] };   // Tags -> project IDs
  };
  
  // Statistics
  statistics: {
    projectTypes: { [type: string]: number };
    languages: { [language: string]: number };
    totalFiles: number;
    totalLines: number;
    averageComplexity: number;
  };
}

interface ProjectIndexEntry {
  // Project identification
  id: string;                              // Unique project ID
  name: string;                            // Project name
  path: string;                            // Project path
  type: string;                            // Project type
  language: string;                        // Primary language
  
  // Project metadata
  metadata: {
    description?: string;                   // Project description
    version: string;                       // Project version
    author?: string;                       // Project author
    repository?: string;                    // Repository URL
    tags: string[];                        // Project tags
    createdAt: string;                     // First analysis date
    lastAnalyzed: string;                  // Last analysis date
  };
  
  // Analysis information
  analyses: {
    totalVersions: number;                 // Total number of versions
    latestVersion: string;                 // Latest version
    branches: string[];                    // Available branches
    lastAnalysis: AnalysisSummary;        // Last analysis summary
  };
  
  // File locations
  locations: {
    analysisDir: string;                   // Analysis directory
    indexFile: string;                     // Project index file
    cacheFile?: string;                    // Cache file location
  };
}
```

### **2. Individual Project Index**

```typescript
interface ProjectIndex {
  // Project metadata
  project: {
    id: string;                            // Project ID
    name: string;                          // Project name
    path: string;                          // Project path
    type: string;                          // Project type
    language: string;                      // Primary language
    version: string;                       // Project version
    description?: string;                  // Project description
    repository?: string;                   // Repository URL
    tags: string[];                        // Project tags
  };
  
  // Version history
  versions: {
    [versionId: string]: VersionIndexEntry;
  };
  
  // Branch information
  branches: {
    [branchName: string]: BranchIndexEntry;
  };
  
  // Analysis summary
  summary: {
    totalFiles: number;                    // Total files analyzed
    totalLines: number;                    // Total lines of code
    complexity: ComplexityMetrics;         // Complexity metrics
    quality: QualityMetrics;              // Quality metrics
    lastAnalysis: string;                  // Last analysis timestamp
  };
  
  // File structure
  structure: {
    files: FileIndexEntry[];               // File index
    directories: DirectoryIndexEntry[];    // Directory index
    entryPoints: string[];                 // Entry points
    publicAPIs: string[];                  // Public APIs
  };
  
  // Dependencies
  dependencies: {
    internal: DependencyIndexEntry[];      // Internal dependencies
    external: DependencyIndexEntry[];      // External dependencies
    devDependencies: DependencyIndexEntry[]; // Dev dependencies
  };
}

interface VersionIndexEntry {
  // Version identification
  id: string;                              // Version ID
  version: string;                         // Version string
  branch?: string;                         // Branch name
  commit?: string;                         // Commit hash
  
  // Version metadata
  metadata: {
    createdAt: string;                     // Version creation date
    author?: string;                        // Version author
    description?: string;                  // Version description
    tags: string[];                        // Version tags
  };
  
  // Analysis data
  analysis: {
    filePath: string;                      // Analysis file path
    docsPath: string;                      // Documentation path
    cachePath?: string;                    // Cache file path
    size: number;                          // Analysis file size
    processingTime: number;                // Processing time
  };
  
  // Version comparison
  comparison?: {
    previousVersion?: string;               // Previous version
    diffPath?: string;                     // Diff file path
    breakingChanges: number;                // Number of breaking changes
    newFeatures: number;                   // Number of new features
    bugFixes: number;                      // Number of bug fixes
  };
}

interface BranchIndexEntry {
  // Branch information
  name: string;                            // Branch name
  latestCommit: string;                    // Latest commit hash
  latestVersion: string;                  // Latest version
  
  // Branch metadata
  metadata: {
    createdAt: string;                     // Branch creation date
    lastAnalyzed: string;                  // Last analysis date
    totalAnalyses: number;                 // Total analyses
  };
  
  // Version list
  versions: string[];                      // Available versions
}
```

### **3. Index Management**

```typescript
interface IndexManagement {
  // Index operations
  operations: {
    create: (projectPath: string) => Promise<ProjectIndex>;
    update: (projectId: string) => Promise<void>;
    delete: (projectId: string) => Promise<void>;
    search: (query: SearchQuery) => Promise<SearchResult[]>;
    list: (filters?: ProjectFilters) => Promise<ProjectIndexEntry[]>;
  };
  
  // Index maintenance
  maintenance: {
    rebuild: () => Promise<void>;           // Rebuild all indexes
    validate: () => Promise<ValidationResult>; // Validate index integrity
    cleanup: () => Promise<void>;           // Cleanup orphaned entries
    optimize: () => Promise<void>;          // Optimize index performance
  };
  
  // Index configuration
  config: {
    autoUpdate: boolean;                   // Auto-update indexes
    updateInterval: number;                // Update interval (minutes)
    maxIndexSize: number;                  // Maximum index size
    compression: boolean;                  // Compress index files
  };
}

interface SearchQuery {
  // Search criteria
  criteria: {
    name?: string;                         // Project name
    type?: string;                         // Project type
    language?: string;                     // Language
    tags?: string[];                       // Tags
    path?: string;                         // Path pattern
    version?: string;                      // Version
    branch?: string;                       // Branch
  };
  
  // Search options
  options: {
    caseSensitive?: boolean;               // Case sensitivity
    exactMatch?: boolean;                  // Exact match
    includeMetadata?: boolean;             // Include metadata
    limit?: number;                        // Result limit
    offset?: number;                        // Result offset
  };
}

interface SearchResult {
  // Result metadata
  score: number;                           // Search relevance score
  matchType: 'name' | 'type' | 'language' | 'tag' | 'path'; // Match type
  
  // Project information
  project: ProjectIndexEntry;
  
  // Highlighted matches
  highlights: {
    field: string;                         // Field name
    value: string;                         // Field value
    matches: string[];                     // Matching parts
  }[];
}
```

### **4. Index File Structure**

```
analyses/
├── .index/                               # Global index directory
│   ├── global-index.json                 # Global project index
│   ├── search-index.json                 # Search index
│   ├── statistics.json                   # Global statistics
│   └── cache/                            # Index cache
│       ├── search-cache.json
│       └── statistics-cache.json
├── my-awesome-project/
│   ├── .index/                           # Project index directory
│   │   ├── project-index.json            # Project index
│   │   ├── version-index.json            # Version index
│   │   ├── branch-index.json              # Branch index
│   │   └── search-index.json             # Project search index
│   ├── main/
│   │   ├── v1.0.0/
│   │   │   ├── my-awesome-project-v1.0.0-analysis.json
│   │   │   ├── docs/
│   │   │   └── version-metadata.json
│   │   ├── v1.1.0/
│   │   │   ├── my-awesome-project-v1.1.0-analysis.json
│   │   │   ├── docs/
│   │   │   ├── version-diff.json
│   │   │   └── version-metadata.json
│   │   └── v1.2.0/
│   │       ├── my-awesome-project-v1.2.0-analysis.json
│   │       ├── docs/
│   │       ├── version-diff.json
│   │       └── version-metadata.json
│   ├── feature-auth/
│   │   ├── v1.2.1-feature-auth/
│   │   │   ├── my-awesome-project-v1.2.1-feature-auth-analysis.json
│   │   │   ├── docs/
│   │   │   └── version-metadata.json
│   │   └── v1.2.2-feature-auth/
│   │       ├── my-awesome-project-v1.2.2-feature-auth-analysis.json
│   │       ├── docs/
│   │       └── version-metadata.json
│   └── develop/
│       ├── v1.3.0-develop/
│       │   ├── my-awesome-project-v1.3.0-develop-analysis.json
│       │   ├── docs/
│       │   └── version-metadata.json
│       └── v1.3.1-develop/
│           ├── my-awesome-project-v1.3.1-develop-analysis.json
│           ├── docs/
│           └── version-metadata.json
├── another-project/
│   ├── .index/                           # Project index directory
│   │   ├── project-index.json            # Project index
│   │   ├── version-index.json            # Version index
│   │   ├── branch-index.json              # Branch index
│   │   └── search-index.json             # Project search index
│   └── main/
│       ├── v1.0.0/
│       │   ├── another-project-v1.0.0-analysis.json
│       │   ├── docs/
│       │   └── version-metadata.json
│       └── v1.1.0/
│           ├── another-project-v1.1.0-analysis.json
│           ├── docs/
│           ├── version-diff.json
│           └── version-metadata.json
└── third-project/
    ├── .index/                           # Project index directory
    │   ├── project-index.json            # Project index
    │   ├── version-index.json            # Version index
    │   ├── branch-index.json              # Branch index
    │   └── search-index.json             # Project search index
    └── main/
        ├── v1.0.0/
        │   ├── third-project-v1.0.0-analysis.json
        │   ├── docs/
        │   └── version-metadata.json
        └── v1.1.0/
            ├── third-project-v1.1.0-analysis.json
            ├── docs/
            ├── version-diff.json
            └── version-metadata.json
```

### **5. Index Usage Examples**

```typescript
const parser = new CodestateAST();

// Parse project and automatically update indexes
const result = await parser.parseProject('./my-awesome-project', {
  updateIndex: true,                       // Update indexes
  indexConfig: {
    autoUpdate: true,
    updateInterval: 5,                    // Update every 5 minutes
    compression: true
  }
});

// Search projects
const searchResults = await parser.searchProjects({
  criteria: {
    name: 'awesome',
    type: 'typescript',
    tags: ['web', 'api']
  },
  options: {
    limit: 10,
    includeMetadata: true
  }
});

// List all projects
const allProjects = await parser.listProjects({
  filters: {
    language: 'typescript',
    minVersions: 2
  }
});

// Get project index
const projectIndex = await parser.getProjectIndex('my-awesome-project');

// Get version history
const versionHistory = await parser.getVersionHistory('my-awesome-project');

// Get branch information
const branchInfo = await parser.getBranchInfo('my-awesome-project', 'main');

// Rebuild all indexes
await parser.rebuildIndexes();

// Validate index integrity
const validation = await parser.validateIndexes();
if (!validation.isValid) {
  console.log('Index validation failed:', validation.errors);
}
```

### **6. Index API Methods**

```typescript
interface IndexAPI {
  // Global index operations
  getGlobalIndex(): Promise<GlobalProjectIndex>;
  searchProjects(query: SearchQuery): Promise<SearchResult[]>;
  listProjects(filters?: ProjectFilters): Promise<ProjectIndexEntry[]>;
  getProjectStatistics(): Promise<ProjectStatistics>;
  
  // Project index operations
  getProjectIndex(projectId: string): Promise<ProjectIndex>;
  getVersionHistory(projectId: string): Promise<VersionIndexEntry[]>;
  getBranchInfo(projectId: string, branchName: string): Promise<BranchIndexEntry>;
  getLatestVersion(projectId: string): Promise<VersionIndexEntry>;
  
  // Index management
  rebuildIndexes(): Promise<void>;
  validateIndexes(): Promise<ValidationResult>;
  cleanupIndexes(): Promise<void>;
  optimizeIndexes(): Promise<void>;
  
  // Index configuration
  updateIndexConfig(config: IndexConfig): Promise<void>;
  getIndexConfig(): Promise<IndexConfig>;
}
```

### **7. Index Benefits**

1. **Fast Discovery**: Quickly find projects by name, type, language, or tags
2. **Efficient Search**: Full-text search across project metadata and content
3. **Version Tracking**: Track all versions and branches for each project
4. **Statistics**: Global and project-specific statistics and metrics
5. **Maintenance**: Automatic index updates and integrity validation
6. **Performance**: Optimized indexes for fast queries and updates
7. **Scalability**: Handle large numbers of projects and analyses efficiently

## **Usage Example**

```typescript
const parser = new CodestateAST();
const project = await parser.parseProject('./my-project');

// Generate comprehensive documentation
const documentation = await parser.generateDocumentation(project, {
  format: 'markdown',
  includeExamples: true,
  includeArchitecture: true,
  includeDependencyGraph: true,
  qualityMetrics: true
});

// Output to files
await parser.writeDocumentation(documentation, './docs/');
```

## **Future Extensibility**

The architecture is designed to easily support additional languages:

1. **Python Support**: Add `PythonParser.ts` using Python's `ast` module or `parso`
2. **Go Support**: Add `GoParser.ts` using Go's AST package
3. **Java Support**: Add `JavaParser.ts` using JavaParser or similar

Each parser implements the `BaseParser` interface, ensuring consistent output format across all languages.

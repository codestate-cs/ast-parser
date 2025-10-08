# Codestate AST

A comprehensive AST parser library for TypeScript/JavaScript projects with documentation generation capabilities.

[![CI/CD Pipeline](https://github.com/codestate-cs/ast-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/codestate-cs/ast-parser/actions/workflows/ci.yml)
[![PR Validation](https://github.com/codestate-cs/ast-parser/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/codestate-cs/ast-parser/actions/workflows/pr-validation.yml)
[![codecov](https://codecov.io/gh/codestate-cs/ast-parser/graph/badge.svg?token=2KBNOCDYI0)](https://codecov.io/gh/codestate-cs/ast-parser)
[![npm version](https://badge.fury.io/js/codestate-ast.svg)](https://badge.fury.io/js/codestate-ast)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔍 **Comprehensive AST Parsing**: Parse TypeScript/JavaScript projects with full AST analysis
- 📊 **Project Analysis**: Dependency mapping, complexity metrics, and structure analysis
- 📚 **Documentation Generation**: Generate documentation without AI using JSDoc and type information
- ⚡ **Performance Optimized**: Caching and incremental parsing for large projects
- 🔄 **Versioning Support**: Multiple versioning strategies with change tracking
- 🔍 **Indexing System**: Search and manage multiple projects efficiently
- 🎯 **Extensible**: Plugin system for custom functionality

## Quality Metrics

This project maintains high code quality standards with comprehensive testing:

- ✅ **76 test suites** with comprehensive coverage
- ✅ **4,030 tests passing** across all modules
- ✅ **91.14% branch coverage** across all modules
- ✅ **TypeScript strict mode** with full type safety
- ✅ **ESLint compliance** with zero linting issues
- ✅ **Pre-push validation** ensuring quality gates

### Test Coverage Breakdown
- **Analyzers**: 88.15% branch coverage (Dependency, Entry Point, Structure, Complexity)
- **Parsers**: 89.27% branch coverage (Enhanced TypeScript, Base Parser)
- **Output Management**: 81.81% branch coverage (Formats, Naming Strategies)
- **Configuration**: 96.47% branch coverage (Validation, Loading, Defaults)
- **Core**: 89.18% branch coverage (Project Detection, Parsing)
- **Documentation**: 74.28% branch coverage (Generators, Templates, Quality Metrics)
- **Versioning**: Comprehensive coverage (Multiple strategies, Change detection)
- **Git Integration**: Full test coverage (Repository analysis, Branch detection)
- **Indexing System**: 91.14% branch coverage (Search, Management, Maintenance)

## Installation

```bash
npm install codestate-ast
```

## Quick Start

```typescript
import { CodestateAST } from 'codestate-ast';

const parser = new CodestateAST();
const result = await parser.parseProject('./my-project');

console.log(JSON.stringify(result, null, 2));
```

## Documentation Generation

The library now includes comprehensive documentation generation capabilities:

```typescript
import { DocumentationGenerator } from 'codestate-ast';

const docGenerator = new DocumentationGenerator({
  outputFormat: 'both', // Generate both Markdown and HTML
  includeQualityMetrics: true,
  includeCoverageAnalysis: true,
  includeSuggestions: true
});

const documentation = await docGenerator.generateDocumentation(projectData);
```

### Documentation Features
- 📝 **JSDoc Extraction**: Parse and extract JSDoc comments with full tag support
- 🔍 **Type Documentation**: Generate comprehensive type information documentation
- 📚 **API Reference**: Automatic API reference generation from AST analysis
- 📄 **Multiple Formats**: Markdown and HTML output with customizable templates
- 📊 **Quality Metrics**: Coverage analysis and documentation completeness scoring
- 💡 **Smart Suggestions**: AI-free suggestions for missing or incomplete documentation

## Performance & Caching

The library includes advanced performance monitoring and caching capabilities:

```typescript
import { PerformanceMonitor, CacheManager } from 'codestate-ast';

// Performance monitoring
const monitor = new PerformanceMonitor({
  enableMemoryTracking: true,
  enableCpuTracking: true,
  maxMetricsHistory: 1000
});

// Caching system
const cacheManager = new CacheManager({
  maxSize: 1000,
  ttl: 3600000, // 1 hour
  enableCompression: true
});
```

### Performance Features
- 📊 **Real-time Monitoring**: Track memory usage, CPU usage, and operation timing
- 🚀 **Performance Metrics**: Comprehensive performance scoring and recommendations
- 💾 **Intelligent Caching**: Hit/miss tracking with automatic optimization
- 🔍 **Memory Management**: Advanced memory leak detection and optimization
- 📈 **Performance Reports**: Detailed performance analysis and insights

## Indexing System

The library now includes a comprehensive indexing system for managing multiple projects:

```typescript
import { IndexingSystemFactory } from 'codestate-ast';

// Create indexing system components
const indexManager = IndexingSystemFactory.createIndexManager();
const searchEngine = IndexingSystemFactory.createSearchEngine();

// Index projects
await indexManager.indexProject(projectInfo);

// Search across projects
const results = await searchEngine.search({
  criteria: { name: 'my-project', type: 'typescript' },
  options: { limit: 10, caseSensitive: false }
});
```

### Indexing Features
- 🔍 **Global Project Index**: Comprehensive project registry and search
- 📊 **Project Management**: Individual project indexes with version tracking
- 🔎 **Advanced Search**: Full-text, fuzzy, and regex search capabilities
- 🛠️ **Index Maintenance**: Validation, optimization, and cleanup tools
- 🏭 **Factory Pattern**: Easy component creation with sensible defaults
- 📡 **Event-Driven**: Comprehensive event system for monitoring
- ⚡ **Performance**: Caching, parallel processing, and optimization

## Development Status

✅ **Phase 6 Completed** - Indexing System Implementation

This library is being built incrementally following a comprehensive development roadmap. Phase 6 Indexing System has been successfully completed with comprehensive project discovery and management capabilities.

### 📊 Current Coverage Metrics
- **Statements**: 97.67% ✅
- **Branches**: 91.14% ✅  
- **Functions**: 98.07% ✅
- **Lines**: 97.70% ✅

### 🎯 Completed Phases
- ✅ **Phase 1**: Foundation (MVP) - Basic parsing and analysis
- ✅ **Phase 2**: Enhanced Analysis - Comprehensive metrics and dependency mapping
- ✅ **Phase 3**: Documentation Generation - AI-free documentation generation
- ✅ **Phase 4**: Caching and Performance - Performance monitoring and optimization
- ✅ **Phase 5**: Versioning System - Multiple versioning strategies with change tracking
- ✅ **Phase 6**: Indexing System - Project discovery and management (Completed)

### 🚀 Phase 6 Achievements
- ✅ **Global Project Index**: Comprehensive project registry and search
- ✅ **Project Management**: Individual project indexes and version tracking
- ✅ **Search Engine**: Advanced search capabilities across projects
- ✅ **Index Maintenance**: Validation, optimization, and cleanup tools
- ✅ **Factory Pattern**: Complete factory system for component creation
- ✅ **Event-Driven Architecture**: Comprehensive event system
- ✅ **High Test Coverage**: 91.14% branch coverage with 376 tests

## Roadmap

- [x] **Phase 1**: Foundation (MVP) - Basic parsing and analysis
- [x] **Phase 2**: Enhanced Analysis - Comprehensive metrics and dependency mapping
- [x] **Phase 3**: Documentation Generation - AI-free documentation generation
- [x] **Phase 4**: Caching and Performance - Performance monitoring and optimization
- [x] **Phase 5**: Versioning System - Multiple versioning strategies
- [x] **Phase 6**: Indexing System - Project discovery and management (Completed)
- [ ] **Phase 7**: Advanced Features - Streaming, plugins, advanced analysis
- [ ] **Phase 8**: Testing and Documentation - Production readiness

## Contributing

This project is currently in active development. Phase 6 Indexing System has been completed with 76 test suites and 4,030 tests passing. Contributions are welcome for Phase 7+ development!

### Branch Protection

This repository uses branch protection rules to ensure code quality:

- ✅ **Required Status Checks**: All CI/CD checks must pass before merging
- ✅ **Required Reviews**: At least 1 code review approval required
- ✅ **No Direct Pushes**: All changes must go through pull requests
- ✅ **Quality Gates**: 90%+ test coverage required

#### Setting up Branch Protection

To apply branch protection rules to your repository:

```bash
# Using the provided script (requires GitHub CLI)
./scripts/setup-branch-protection.sh

# Or manually via GitHub web interface:
# Go to Settings > Branches > Add rule
```

#### Required Status Checks

The following checks must pass before merging:
- **CI/CD Pipeline**: Main pipeline with tests, linting, type checking
- **PR Validation**: Pull request validation with coverage checks  
- **Build Check**: Build verification and artifact checking

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Documentation

- [Architecture and Analysis](docs/library-analysis-and-architecture.md)
- [Folder Structure](docs/folder-structure.md)
- [Development Roadmap](docs/development-roadmap.md)

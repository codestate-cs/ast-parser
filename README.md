# Codestate AST

A comprehensive AST parser library for TypeScript/JavaScript projects with documentation generation capabilities.

[![CI/CD Pipeline](https://github.com/codestate-cs/ast-parser/actions/workflows/ci.yml/badge.svg)](https://github.com/codestate-cs/ast-parser/actions/workflows/ci.yml)
[![PR Validation](https://github.com/codestate-cs/ast-parser/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/codestate-cs/ast-parser/actions/workflows/pr-validation.yml)
[![Coverage](https://codecov.io/gh/codestate-cs/ast-parser/branch/main/graph/badge.svg)](https://codecov.io/gh/codestate-cs/ast-parser)
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

- ✅ **1,983 tests passing** with comprehensive coverage
- ✅ **90.03% branch coverage** across all modules
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

## Development Status

✅ **Phase 3 Complete** - Documentation Generation with 90%+ test coverage

This library is being built incrementally following a comprehensive development roadmap. Phase 3 Documentation Generation is now complete with comprehensive documentation generation capabilities, quality metrics, and AI-free documentation features.

### 📊 Current Coverage Metrics
- **Statements**: 96.93% ✅
- **Branches**: 90.03% ✅  
- **Functions**: 96.71% ✅
- **Lines**: 97.38% ✅

### 🎯 Phase 3 Achievements
- ✅ **Complete Documentation System**: JSDoc extraction, type documentation, API reference generation
- ✅ **Multiple Output Formats**: Markdown and HTML generation with template system
- ✅ **Quality Metrics**: Coverage analysis, quality scoring, and documentation suggestions
- ✅ **Comprehensive Testing**: 1,983 tests with 90.03% branch coverage
- ✅ **Perfect Structure**: Follows roadmap specifications exactly

## Roadmap

- [x] **Phase 1**: Foundation (MVP) - Basic parsing and analysis
- [x] **Phase 2**: Enhanced Analysis - Comprehensive metrics and dependency mapping
- [x] **Phase 3**: Documentation Generation - AI-free documentation generation
- [ ] **Phase 4**: Caching and Incremental Parsing - Performance optimization
- [ ] **Phase 5**: Versioning System - Multiple versioning strategies
- [ ] **Phase 6**: Indexing System - Project discovery and management
- [ ] **Phase 7**: Advanced Features - Streaming, plugins, advanced analysis
- [ ] **Phase 8**: Testing and Documentation - Production readiness

## Contributing

This project is currently in active development. Phase 3 Documentation Generation is complete with excellent test coverage. Contributions are welcome for Phase 4 and beyond!

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

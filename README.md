# Codestate AST

A comprehensive AST parser library for TypeScript/JavaScript projects with documentation generation capabilities.

## Features

- 🔍 **Comprehensive AST Parsing**: Parse TypeScript/JavaScript projects with full AST analysis
- 📊 **Project Analysis**: Dependency mapping, complexity metrics, and structure analysis
- 📚 **Documentation Generation**: Generate documentation without AI using JSDoc and type information
- ⚡ **Performance Optimized**: Caching and incremental parsing for large projects
- 🔄 **Versioning Support**: Multiple versioning strategies with change tracking
- 🔍 **Indexing System**: Search and manage multiple projects efficiently
- 🎯 **Extensible**: Plugin system for custom functionality

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

## Development Status

🚧 **Currently in development** - Phase 1 (Foundation/MVP)

This library is being built incrementally following a comprehensive development roadmap. The current focus is on establishing the core foundation with basic parsing capabilities.

## Roadmap

- [x] **Phase 1**: Foundation (MVP) - Basic parsing and analysis
- [ ] **Phase 2**: Enhanced Analysis - Comprehensive metrics and dependency mapping
- [ ] **Phase 3**: Documentation Generation - AI-free documentation generation
- [ ] **Phase 4**: Caching and Incremental Parsing - Performance optimization
- [ ] **Phase 5**: Versioning System - Multiple versioning strategies
- [ ] **Phase 6**: Indexing System - Project discovery and management
- [ ] **Phase 7**: Advanced Features - Streaming, plugins, advanced analysis
- [ ] **Phase 8**: Testing and Documentation - Production readiness

## Contributing

This project is currently in active development. Contributions will be welcome once Phase 1 is complete.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Documentation

- [Architecture and Analysis](docs/library-analysis-and-architecture.md)
- [Folder Structure](docs/folder-structure.md)
- [Development Roadmap](docs/development-roadmap.md)

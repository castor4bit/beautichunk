# TODO - beautichunk

This document tracks planned features, improvements, and known limitations.

## High Priority

### ES6 Module Support
- [ ] Add support for ES6 import/export dependency detection in Analyzer
- [ ] Handle dynamic imports (`import()`)
- [ ] Track re-exports (`export { x } from './module'`)
- **Files to modify**: `src/analyzer.ts`, `src/types/ast.ts`

### Source Map Generation
- [ ] Implement source map generation in Chunker
- [ ] Maintain original line/column mappings
- [ ] Support inline source maps option
- **Files to modify**: `src/chunker.ts`, `src/generator.ts` (future)

## Medium Priority

### Performance Optimization
- [ ] Implement parallel processing using Web Workers for large files
- [ ] Add streaming support for files > 10MB
- [ ] Optimize memory usage in dependency graph construction
- **Files to modify**: `src/chunker.ts`, `src/parser.ts`

### Enhanced Code Analysis
- [ ] Detect and handle dynamic code generation (eval, Function constructor)
- [ ] Support CommonJS require() dependency detection
- [ ] Analyze JSX/TSX files
- **Files to modify**: `src/analyzer.ts`, `src/parser.ts`

### CLI Enhancements
- [ ] Read version from package.json instead of hardcoding
- [ ] Add progress bar for large file processing
- [ ] Support glob patterns for input files
- **Files to modify**: `src/cli.ts`

## Low Priority

### Configuration
- [ ] Support `.beautichunkrc` configuration file
- [ ] Allow custom chunking strategies via plugins
- [ ] Add preset configurations for common use cases

### Documentation
- [ ] Generate API documentation from TypeScript definitions
- [ ] Add more examples for different scenarios
- [ ] Create video tutorial

## Known Limitations

1. **Dynamic Dependencies**: Cannot detect dependencies created at runtime
   - Workaround: Use conservative chunking strategy
   
2. **Binary Files**: Only supports text-based JavaScript files
   - Future: Add support for WASM modules

3. **Circular Dependencies**: While detected, very complex circular dependencies might not be optimally chunked
   - Current: Uses Tarjan's algorithm for SCC detection
   - Future: Implement more sophisticated graph partitioning

4. **Memory Constraints**: Large files (>100MB) may cause memory issues
   - Future: Implement streaming parser

## Contributing

When implementing any of these items:
1. Create a feature branch from `main`
2. Write tests first (TDD)
3. Update this file to mark completed items
4. Create a PR with detailed description

## Completed

- [x] Basic Parser implementation (PR #4)
- [x] Analyzer with dependency detection (PR #5)
- [x] Chunker with multiple strategies (PR #6)
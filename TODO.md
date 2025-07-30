# TODO - beautichunk

This document tracks planned features, improvements, and known limitations.

## High Priority

### Parser Enhancements
- [ ] Support for JSX/TSX syntax parsing
- [ ] Add TypeScript parsing support
- [ ] Handle syntax errors more gracefully with recovery mechanisms
- [ ] Support for parsing newer ECMAScript features (ES2023+)
- [ ] Add streaming parser for very large files
- **Files to modify**: `src/parser.ts`

### Analyzer Enhancements
- [ ] Support for class analysis (methods, properties, inheritance)
- [ ] Detect and analyze async/await dependencies
- [ ] Track object method dependencies
- [ ] Analyze destructuring patterns in parameters and assignments
- [ ] Support for generator functions and yield expressions
- [ ] Detect indirect dependencies through closures
- **Files to modify**: `src/analyzer.ts`, `src/types/ast.ts`

### ES6 Module Support
- [ ] Add support for ES6 import/export dependency detection in Analyzer
- [ ] Handle dynamic imports (`import()`)
- [ ] Track re-exports (`export { x } from './module'`)
- [ ] Support for named imports/exports
- [ ] Handle default exports and imports
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

### Parser Limitations
1. **TypeScript/JSX**: Currently only supports plain JavaScript
   - Workaround: Transpile to JS before processing
   - Future: Add @babel/parser as alternative parser

2. **Syntax Error Recovery**: Parser stops at first syntax error
   - Workaround: Fix syntax errors before processing
   - Future: Implement error recovery mechanisms

3. **ECMAScript Version**: Limited to ES2022 features
   - Workaround: Use transpiled code for newer features
   - Future: Update Acorn or switch to more modern parser

### Analyzer Limitations
1. **Class Analysis**: Classes are not fully analyzed
   - Methods and properties are not tracked
   - Inheritance chains are not detected
   - Static methods are treated as regular functions

2. **Async Dependencies**: async/await flow is not tracked
   - Promise chains are not analyzed
   - Async function dependencies may be missed

3. **Object Methods**: Method calls on objects are not fully tracked
   - `obj.method()` dependencies are simplified
   - Method references (`obj.method`) are not tracked

4. **Destructuring**: Complex destructuring patterns are not analyzed
   - Nested destructuring is ignored
   - Rest parameters are not tracked

5. **Dynamic Dependencies**: Cannot detect dependencies created at runtime
   - Workaround: Use conservative chunking strategy
   
6. **Binary Files**: Only supports text-based JavaScript files
   - Future: Add support for WASM modules

7. **Circular Dependencies**: While detected, very complex circular dependencies might not be optimally chunked
   - Current: Uses Tarjan's algorithm for SCC detection
   - Future: Implement more sophisticated graph partitioning

8. **Memory Constraints**: Large files (>100MB) may cause memory issues
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
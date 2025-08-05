# Beautichunk

Transform obfuscated JavaScript files into readable, chunked modules while maintaining functionality.

## Overview

Beautichunk is a TypeScript-based tool that takes minified or obfuscated JavaScript code and:
- ✨ Beautifies the code for improved readability
- 📦 Splits large files into manageable chunks
- 🔗 Preserves execution order and dependencies
- 🎭 Supports both browser and Node.js environments
- 🚀 Generates appropriate loaders for each environment

## Installation

```bash
npm install -g beautichunk
```

Or use locally in your project:

```bash
npm install beautichunk
```

## Usage

### Command Line

```bash
beautichunk input.js -o ./output
```

Process multiple files:
```bash
beautichunk file1.js file2.js file3.js -o ./output
```

Use glob patterns:
```bash
beautichunk "src/**/*.js" -o ./output
```

#### Options

- `-o, --output <dir>` - Output directory (required)
- `--max-chunk-size <size>` - Maximum chunk size in KB (default: `256`)
- `--source-maps` - Generate source maps
- `--verbose` - Enable verbose logging
- `--strategy <type>` - Chunking strategy: `aggressive`, `conservative`, or `auto` (default: `auto`)
- `--config <file>` - Configuration file path (default: `beautichunk.config.json`)
- `--node-entry` - Generate Node.js entry point (`index.js`) for chunked output
- `--indent-size <size>` - Indentation size (default: `2`)
- `--indent-char <char>` - Indentation character: `space` or `tab` (default: `space`)
- `--preserve-newlines` - Preserve existing newlines

### Node.js Entry Point

When using the `--node-entry` option, Beautichunk generates an `index.js` file that:
- Loads all chunks in the correct order
- Collects and re-exports all module exports
- Maintains the same API as the original file

```bash
# Process a Node.js module
beautichunk large-module.js -o ./output --node-entry

# Run the chunked module just like the original
node ./output/index.js
```

### Programmatic API

```typescript
import { Parser, Analyzer, Chunker, Beautifier, Generator } from 'beautichunk';

// Parse JavaScript code
const parser = new Parser();
const ast = parser.parse(code);

// Analyze dependencies
const analyzer = new Analyzer();
const analysis = analyzer.analyze(ast);

// Split into chunks
const chunker = new Chunker({
  strategy: 'auto',
  maxChunkSize: 256 * 1024
});
const chunks = chunker.chunk(ast, analysis);

// Beautify code
const beautifier = new Beautifier({
  indentSize: 2,
  indentChar: ' '
});
const beautifiedChunks = chunks.map(chunk => beautifier.beautifyChunk(chunk));

// Generate output files
const generator = new Generator({
  outputDir: './output',
  generateSourceMaps: true,
  generateNodeEntry: true
});
await generator.generate(beautifiedChunks);
```

## Configuration

Create a `beautichunk.config.json` file:

```json
{
  "maxChunkSize": 262144,
  "strategy": "conservative",
  "sourceMaps": true,
  "nodeEntry": true,
  "beautifyOptions": {
    "indentSize": 2,
    "indentChar": " ",
    "preserveNewlines": true
  }
}
```

Configuration options:
- `maxChunkSize` - Maximum chunk size in bytes (default: `262144` = 256KB)
- `strategy` - Chunking strategy: `aggressive`, `conservative`, or `auto`
- `sourceMaps` - Generate source maps
- `nodeEntry` - Generate Node.js entry point
- `beautifyOptions` - Code formatting options
  - `indentSize` - Number of spaces/tabs for indentation
  - `indentChar` - Character to use: `" "` (space) or `"\t"` (tab)
  - `preserveNewlines` - Keep original line breaks

## How It Works

1. **Parsing** - JavaScript code is parsed into an Abstract Syntax Tree (AST) using Acorn
2. **Analysis** - Dependencies between functions and variables are mapped using Tarjan's algorithm
3. **Chunking** - Code is intelligently split based on size constraints and dependencies
4. **Beautification** - Each chunk is reformatted for readability using js-beautify
5. **Generation** - Individual chunk files and appropriate loader modules are created
   - For browsers: `loader.js` with async chunk loading
   - For Node.js: `index.js` with synchronous requires

## Chunking Strategies

- **Aggressive** - Prioritizes smaller chunks, may split related code
- **Conservative** - Keeps related code together, may result in larger chunks
- **Auto** - Balances chunk size and code cohesion (recommended)

## Example

### Browser Usage

Input (obfuscated):
```javascript
(function(){var a=1,b=2;function c(){return a+b}console.log(c())})();
```

Output structure:
```
output/
├── chunk_000.js    # Variable declarations
├── chunk_001.js    # Function definitions
├── chunk_002.js    # Execution code
├── loader.js       # Browser loader
└── manifest.json   # Chunk metadata
```

Usage in HTML:
```html
<script src="output/loader.js"></script>
```

### Node.js Usage

For Node.js modules with `--node-entry`:
```
output/
├── chunk_000.js    # Core functionality
├── chunk_001.js    # Additional features
├── index.js        # Node.js entry point
└── manifest.json   # Chunk metadata
```

Usage:
```javascript
// Original: const lib = require('./large-module.js');
// Chunked:  const lib = require('./output/index.js');
```

## Current Limitations

1. **ES6 Modules**: Import/export statements are not yet supported for dependency analysis
2. **Dynamic Code**: Runtime-generated code (eval, Function constructor) cannot be analyzed
3. **File Size**: Very large files (>100MB) may cause memory issues
4. **Binary Files**: Only text-based JavaScript files are supported

See [TODO.md](./TODO.md) for planned improvements and known issues.

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/beautichunk.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

### Project Structure

```
src/
├── parser.ts      # AST parsing using Acorn
├── analyzer.ts    # Dependency and scope analysis
├── chunker.ts     # Code splitting logic
├── beautifier.ts  # Code formatting
├── generator.ts   # Output file generation
├── file-io.ts     # File system operations
├── index.ts       # Main API exports
└── cli.ts         # Command-line interface
```

## Contributing

Contributions are welcome! Please:
1. Check [TODO.md](./TODO.md) for planned features
2. Follow the TDD approach (write tests first)
3. Ensure all tests pass and maintain >80% coverage
4. Submit PRs with detailed descriptions

## License

MIT
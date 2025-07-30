# Beautichunk

Transform obfuscated JavaScript files into readable, chunked modules while maintaining functionality.

## Overview

Beautichunk is a TypeScript-based tool that takes minified or obfuscated JavaScript code and:
- ✨ Beautifies the code for improved readability
- 📦 Splits large files into manageable chunks (< 256KB)
- 🔗 Preserves execution order and dependencies
- 🚀 Generates a loader for seamless integration

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

#### Options

- `-o, --output <dir>` - Output directory (default: `./output`)
- `-s, --max-size <size>` - Maximum chunk size in KB (default: `256`)
- `-m, --source-maps` - Generate source maps
- `-v, --verbose` - Enable verbose logging
- `--strategy <type>` - Chunking strategy: `aggressive`, `conservative`, or `auto` (default: `auto`)
- `-c, --config <file>` - Configuration file path

### Programmatic API

```typescript
import { Beautichunk } from 'beautichunk';

const beautichunk = new Beautichunk({
  input: 'obfuscated.js',
  output: './output',
  maxChunkSize: 256 * 1024,
  generateSourceMaps: true,
  strategy: 'auto'
});

await beautichunk.process();
```

## Configuration

Create a `beautichunk.config.json` file:

```json
{
  "input": "src/obfuscated.js",
  "output": "dist/chunks",
  "maxChunkSize": 262144,
  "beautifyOptions": {
    "indent_size": 2,
    "preserve_newlines": true
  },
  "strategy": "conservative",
  "generateSourceMaps": true
}
```

## How It Works

1. **Parsing** - The obfuscated JavaScript is parsed into an Abstract Syntax Tree (AST)
2. **Beautification** - Code is reformatted for readability using configurable rules
3. **Analysis** - Dependencies between code sections are mapped
4. **Chunking** - Code is intelligently split based on size constraints and dependencies
5. **Generation** - Individual chunk files and a loader module are created

## Chunking Strategies

- **Aggressive** - Prioritizes smaller chunks, may split related code
- **Conservative** - Keeps related code together, may result in larger chunks
- **Auto** - Balances chunk size and code cohesion (recommended)

## Example

Input (obfuscated):
```javascript
(function(){var a=1,b=2;function c(){return a+b}console.log(c())})();
```

Output structure:
```
output/
├── chunk-0.js
├── chunk-1.js
├── loader.js
└── manifest.json
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
├── index.ts       # Main API
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
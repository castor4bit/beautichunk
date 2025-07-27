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

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT
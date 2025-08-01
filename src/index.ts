export interface BeautichunkOptions {
  input: string | string[];
  output: string;
  maxChunkSize?: number;
  beautifyOptions?: object;
  strategy?: 'aggressive' | 'conservative' | 'auto';
  generateSourceMaps?: boolean;
  verbose?: boolean;
}

export class Beautichunk {
  private readonly options: Required<BeautichunkOptions>;

  constructor(options: BeautichunkOptions) {
    this.options = {
      maxChunkSize: 256 * 1024, // 256KB default
      beautifyOptions: {},
      strategy: 'auto',
      generateSourceMaps: false,
      verbose: false,
      ...options,
    };
  }

  async process(): Promise<void> {
    if (this.options.verbose) {
      console.log('Processing with options:', this.options);
    }
    // TODO: Implement the main processing logic
    throw new Error('Not implemented yet');
  }
}

export default Beautichunk;

// Export modules for use as library
export { Parser, type ParseOptions, type ParseError } from './parser.js';
export { Analyzer, type AnalysisResult, type Variable, type FunctionInfo, type Scope } from './analyzer.js';
export { Chunker, type ChunkerOptions, type Chunk } from './chunker.js';
export { Beautifier, type BeautifierOptions } from './beautifier.js';
export { Generator, type GeneratorOptions, type Manifest, type ChunkMetadata } from './generator.js';

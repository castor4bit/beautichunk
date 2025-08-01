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

export {
  type AnalysisResult,
  Analyzer,
  type FunctionInfo,
  type Scope,
  type Variable,
} from './analyzer.js';
export { Beautifier, type BeautifierOptions } from './beautifier.js';
export { type Chunk, Chunker, type ChunkerOptions } from './chunker.js';
export {
  type ChunkMetadata,
  Generator,
  type GeneratorOptions,
  type Manifest,
} from './generator.js';
// Export modules for use as library
export { type ParseError, type ParseOptions, Parser } from './parser.js';

#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import { Command } from 'commander';
import { Analyzer } from './analyzer.js';
import { Beautifier, type BeautifierOptions } from './beautifier.js';
import { Chunker } from './chunker.js';
import { FileIO } from './file-io.js';
import { Generator } from './generator.js';
import { Parser } from './parser.js';

interface CLIOptions {
  output: string;
  maxChunkSize?: string;
  strategy?: 'aggressive' | 'conservative' | 'auto';
  sourceMaps?: boolean;
  verbose?: boolean;
  indentSize?: string;
  indentChar?: 'space' | 'tab';
  preserveNewlines?: boolean;
  config?: string;
}

interface ConfigFile {
  maxChunkSize?: number;
  strategy?: 'aggressive' | 'conservative' | 'auto';
  sourceMaps?: boolean;
  beautifyOptions?: BeautifierOptions;
}

export class CLI {
  private program: Command;
  private fileIO: FileIO;

  constructor() {
    this.program = new Command();
    this.fileIO = new FileIO();
    this.setupProgram();
  }

  private setupProgram(): void {
    this.program
      .name('beautichunk')
      .description('Transform obfuscated JavaScript files into readable, chunked modules')
      .version('0.1.0')
      .argument('<files...>', 'Input files (supports glob patterns)')
      .requiredOption('-o, --output <dir>', 'Output directory')
      .option('--max-chunk-size <size>', 'Maximum chunk size in KB')
      .option('--strategy <strategy>', 'Chunking strategy')
      .option('--source-maps', 'Generate source maps')
      .option('--verbose', 'Enable verbose output')
      .option('--indent-size <size>', 'Indentation size')
      .option('--indent-char <char>', 'Indentation character (space or tab)')
      .option('--preserve-newlines', 'Preserve existing newlines')
      .option('--config <file>', 'Configuration file path', 'beautichunk.config.json');
  }

  async run(args: string[]): Promise<void> {
    try {
      this.program.parse(args);

      const files = this.program.args;
      const options = this.program.opts() as CLIOptions;

      if (files.length === 0) {
        this.program.help();
        return;
      }

      // Load config file if exists
      const configPath = options.config || 'beautichunk.config.json';
      const config = await this.parseConfig(configPath);

      // Merge CLI options with config
      const mergedOptions = this.mergeOptions(options, config);

      // Process files
      await this.processFiles(files, mergedOptions);
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  }

  async parseConfig(configPath: string): Promise<ConfigFile> {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to parse config file: ${(error as Error).message}`);
      }
      return {};
    }
  }

  private mergeOptions(
    cliOptions: CLIOptions,
    config: ConfigFile,
  ): {
    output: string;
    maxChunkSize: number;
    strategy: 'aggressive' | 'conservative' | 'auto';
    sourceMaps: boolean;
    verbose: boolean;
    beautifyOptions: BeautifierOptions;
    indentSize: string;
    indentChar: 'space' | 'tab';
    preserveNewlines: boolean;
    config: string;
  } {
    const maxChunkSize = cliOptions.maxChunkSize
      ? Number.parseInt(cliOptions.maxChunkSize) * 1024
      : config.maxChunkSize || 256 * 1024;

    const beautifyOptions: BeautifierOptions = {
      ...config.beautifyOptions,
      ...(cliOptions.indentSize && { indentSize: Number.parseInt(cliOptions.indentSize) }),
      ...(cliOptions.indentChar && { indentChar: cliOptions.indentChar === 'tab' ? '\t' : ' ' }),
      ...(cliOptions.preserveNewlines && { preserveNewlines: true }),
    };

    return {
      output: cliOptions.output,
      maxChunkSize,
      strategy: cliOptions.strategy || config.strategy || 'auto',
      sourceMaps: cliOptions.sourceMaps || config.sourceMaps || false,
      verbose: cliOptions.verbose || false,
      beautifyOptions,
      indentSize: cliOptions.indentSize || '2',
      indentChar: cliOptions.indentChar || 'space',
      preserveNewlines: cliOptions.preserveNewlines || false,
      config: cliOptions.config || 'beautichunk.config.json',
    };
  }

  private async processFiles(
    filePatterns: string[],
    options: {
      output: string;
      maxChunkSize: number;
      strategy: 'aggressive' | 'conservative' | 'auto';
      sourceMaps: boolean;
      verbose: boolean;
      beautifyOptions: BeautifierOptions;
    },
  ): Promise<void> {
    const { verbose, output } = options;

    if (verbose) {
      console.log('Processing files with options:', options);
    }

    // Expand glob patterns and read files
    const inputFiles = await this.fileIO.readInputFiles(filePatterns);

    if (inputFiles.length === 0) {
      throw new Error('No input files found');
    }

    console.log(`Processing ${inputFiles.length} file(s)...`);

    // Create output directory
    await this.fileIO.createOutputDirectory(output, { clean: true });

    // Process each file
    const parser = new Parser();
    const analyzer = new Analyzer();
    const chunker = new Chunker({
      strategy: options.strategy,
      maxChunkSize: options.maxChunkSize,
    });
    const beautifier = new Beautifier(options.beautifyOptions);
    const generator = new Generator({
      outputDir: output,
      generateSourceMaps: options.sourceMaps,
    });

    const allChunks = [];

    for (let i = 0; i < inputFiles.length; i++) {
      const file = inputFiles[i];
      console.log(`Processing ${i + 1}/${inputFiles.length}: ${file.path}`);

      try {
        // Parse
        if (verbose) console.log('  Parsing...');
        const ast = parser.parse(file.content);

        // Analyze
        if (verbose) console.log('  Analyzing dependencies...');
        const analysis = analyzer.analyze(ast);

        // Chunk
        if (verbose) console.log('  Chunking...');
        const chunks = chunker.chunk(ast, analysis);

        // Beautify
        if (verbose) console.log('  Beautifying...');
        const beautifiedChunks = chunks.map((chunk) => beautifier.beautifyChunk(chunk));

        allChunks.push(...beautifiedChunks);
      } catch (error) {
        console.error(`Failed to process ${file.path}: ${(error as Error).message}`);
        if (!options.verbose) {
          throw error;
        }
      }
    }

    // Generate output files
    console.log('Generating output files...');
    await generator.generate(allChunks);

    console.log(`✓ Successfully processed ${inputFiles.length} file(s)`);
    console.log(`✓ Generated ${allChunks.length} chunk(s) in ${output}/`);
  }
}

// Export CLI class for testing
export default CLI;

// Main entry point - only execute if this is the CLI entry point
if (process.argv[1]?.endsWith('/cli.js')) {
  const cli = new CLI();
  cli.run(process.argv).catch(() => {
    process.exit(1);
  });
}

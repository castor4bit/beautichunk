#!/usr/bin/env node

import { Command } from 'commander';

const version = '0.1.0'; // TODO: Read from package.json

import * as fs from 'node:fs/promises';
import { Beautichunk, type BeautichunkOptions } from './index';

const program = new Command();

program
  .name('beautichunk')
  .description('Transform obfuscated JavaScript files into readable, chunked modules')
  .version(version);

program
  .argument('<input>', 'Input JavaScript file(s)')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-s, --max-size <size>', 'Maximum chunk size in KB', '256')
  .option('-m, --source-maps', 'Generate source maps', false)
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--strategy <type>', 'Chunking strategy (aggressive|conservative|auto)', 'auto')
  .option('-c, --config <file>', 'Configuration file path')
  .action(async (input: string, options: Record<string, unknown>) => {
    try {
      const config: BeautichunkOptions = {
        input,
        output: options.output as string,
        maxChunkSize: parseInt(options.maxSize as string) * 1024,
        generateSourceMaps: options.sourceMaps as boolean,
        verbose: options.verbose as boolean,
        strategy: options.strategy as 'aggressive' | 'conservative' | 'auto',
      };

      if (options.config) {
        const configFile = await fs.readFile(options.config as string, 'utf-8');
        const fileConfig = JSON.parse(configFile);
        Object.assign(config, fileConfig);
      }

      const beautichunk = new Beautichunk(config);
      await beautichunk.process();

      console.log('✅ Processing complete!');
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();

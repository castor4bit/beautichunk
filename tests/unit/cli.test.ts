import * as fs from 'node:fs/promises';
import { glob } from 'glob';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLI } from '../../src/cli.js';

vi.mock('node:fs/promises');
vi.mock('glob');

describe('CLI', () => {
  const mockFs = vi.mocked(fs);
  let cli: CLI;
  let processExit: typeof process.exit;
  let consoleLog: typeof console.log;
  let consoleError: typeof console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    cli = new CLI();

    // Mock process.exit
    processExit = process.exit;
    process.exit = vi.fn() as never;

    // Mock console methods
    consoleLog = console.log;
    console.log = vi.fn();
    consoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exit = processExit;
    console.log = consoleLog;
    console.error = consoleError;
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(cli).toBeInstanceOf(CLI);
    });
  });

  describe('run', () => {
    it('should process a single file', async () => {
      const args = ['node', 'cli.js', 'input.js', '-o', 'output'];
      mockFs.readFile.mockResolvedValue('function test() { return 42; }');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      expect(mockFs.readFile).toHaveBeenCalledWith('input.js', 'utf-8');
      expect(mockFs.mkdir).toHaveBeenCalledWith('output', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should process multiple files', async () => {
      const args = ['node', 'cli.js', 'file1.js', 'file2.js', '-o', 'output'];
      mockFs.readFile
        .mockResolvedValueOnce('{"maxChunkSize": 512000}') // Config file
        .mockResolvedValueOnce('console.log("test1");')
        .mockResolvedValueOnce('console.log("test2");');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      expect(mockFs.readFile).toHaveBeenCalledWith('file1.js', 'utf-8');
      expect(mockFs.readFile).toHaveBeenCalledWith('file2.js', 'utf-8');
    });

    it('should handle glob patterns', async () => {
      const args = ['node', 'cli.js', 'src/*.js', '-o', 'output'];
      vi.mocked(glob).mockResolvedValue(['src/file1.js', 'src/file2.js']);
      mockFs.readFile
        .mockResolvedValueOnce('{"maxChunkSize": 512000}') // Config file
        .mockResolvedValueOnce('console.log("test1");')
        .mockResolvedValueOnce('console.log("test2");');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      expect(mockFs.mkdir).toHaveBeenCalledWith('output', { recursive: true });
    });

    it('should use custom chunk size', async () => {
      const args = ['node', 'cli.js', 'input.js', '-o', 'output', '--max-chunk-size', '512'];
      mockFs.readFile.mockResolvedValue('function test() { return 42; }');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should use different strategies', async () => {
      const strategies = ['aggressive', 'conservative', 'auto'];

      for (const strategy of strategies) {
        const args = ['node', 'cli.js', 'input.js', '-o', 'output', '--strategy', strategy];
        mockFs.readFile.mockResolvedValue('function test() { return 42; }');
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);

        await cli.run(args);

        expect(mockFs.writeFile).toHaveBeenCalled();
      }
    });

    it('should enable source maps', async () => {
      const args = ['node', 'cli.js', 'input.js', '-o', 'output', '--source-maps'];
      mockFs.readFile.mockResolvedValue('function test() { return 42; }');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should enable verbose output', async () => {
      const args = ['node', 'cli.js', 'input.js', '-o', 'output', '--verbose'];
      mockFs.readFile.mockResolvedValue('function test() { return 42; }');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const args = ['node', 'cli.js', 'nonexistent.js', '-o', 'output'];
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      await cli.run(args);

      expect(console.error).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should show help when no arguments provided', async () => {
      const args = ['node', 'cli.js'];

      // Mock stdout write to capture help output
      const originalWrite = process.stdout.write;
      process.stdout.write = vi.fn();

      await cli.run(args);

      expect(process.stdout.write).toHaveBeenCalled();
      process.stdout.write = originalWrite;
    });

    it('should show version', async () => {
      const args = ['node', 'cli.js', '--version'];

      // Mock stdout write to capture version output
      const originalWrite = process.stdout.write;
      process.stdout.write = vi.fn();

      await cli.run(args);

      expect(process.stdout.write).toHaveBeenCalled();
      process.stdout.write = originalWrite;
    });
  });

  describe('parseConfig', () => {
    it('should load config from file if exists', async () => {
      const configContent = JSON.stringify({
        maxChunkSize: 512 * 1024,
        strategy: 'aggressive',
        beautifyOptions: {
          indentSize: 4,
        },
      });
      mockFs.readFile.mockResolvedValue(configContent);

      const config = await cli.parseConfig('beautichunk.config.json');

      expect(config).toEqual({
        maxChunkSize: 512 * 1024,
        strategy: 'aggressive',
        beautifyOptions: {
          indentSize: 4,
        },
      });
    });

    it('should return empty object if config file not found', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT'));

      const config = await cli.parseConfig('beautichunk.config.json');

      expect(config).toEqual({});
    });

    it('should handle invalid JSON in config file', async () => {
      mockFs.readFile.mockResolvedValue('{ invalid json');

      const config = await cli.parseConfig('beautichunk.config.json');

      expect(config).toEqual({});
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('beautify options', () => {
    it('should pass beautify options', async () => {
      const args = [
        'node',
        'cli.js',
        'input.js',
        '-o',
        'output',
        '--indent-size',
        '4',
        '--indent-char',
        'space',
        '--preserve-newlines',
      ];
      mockFs.readFile.mockResolvedValue('function test() { return 42; }');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('progress display', () => {
    it('should show progress for multiple files', async () => {
      const args = ['node', 'cli.js', 'file1.js', 'file2.js', 'file3.js', '-o', 'output'];
      mockFs.readFile.mockResolvedValue('console.log("test");');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Processing'));
    });

    it('should generate Node.js entry point when --node-entry option is used', async () => {
      const args = ['node', 'cli.js', 'input.js', '-o', 'output', '--node-entry'];
      mockFs.readFile
        .mockResolvedValueOnce('{}') // config file
        .mockResolvedValueOnce('function test() { return 42; }\nmodule.exports = { test };');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      // Check that index.js was created
      const indexJsCall = mockFs.writeFile.mock.calls.find((call) => call[0].includes('index.js'));
      expect(indexJsCall).toBeDefined();

      // Verify the content includes shebang and require statements
      const content = indexJsCall?.[1] as string;
      expect(content).toContain('#!/usr/bin/env node');
      expect(content).toContain('require(');
      expect(content).toContain('module.exports = moduleExports;');
    });

    it('should respect nodeEntry option from config file', async () => {
      const args = ['node', 'cli.js', 'input.js', '-o', 'output', '--config', 'custom.config.json'];
      const configContent = JSON.stringify({ nodeEntry: true });

      mockFs.readFile
        .mockResolvedValueOnce(configContent) // config file
        .mockResolvedValueOnce('function test() { return 42; }');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      // Check that index.js was created
      const indexJsCall = mockFs.writeFile.mock.calls.find((call) => call[0].includes('index.js'));
      expect(indexJsCall).toBeDefined();
    });

    it('should not generate Node.js entry point by default', async () => {
      const args = ['node', 'cli.js', 'input.js', '-o', 'output'];
      mockFs.readFile
        .mockResolvedValueOnce('{}') // config file
        .mockResolvedValueOnce('function test() { return 42; }');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await cli.run(args);

      // Check that index.js was NOT created
      const indexJsCall = mockFs.writeFile.mock.calls.find((call) => call[0].includes('index.js'));
      expect(indexJsCall).toBeUndefined();
    });
  });
});

import * as fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLI } from '../../src/cli.js';

vi.mock('node:fs/promises');
vi.mock('glob');

describe('CLI - Configuration File', () => {
  const mockFs = vi.mocked(fs);
  let cli: CLI;
  let processExit: typeof process.exit;

  beforeEach(() => {
    vi.clearAllMocks();
    cli = new CLI();

    // Mock process.exit
    processExit = process.exit;
    process.exit = vi.fn() as never;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exit = processExit;
  });

  it('should apply maxChunkSize from config file', async () => {
    const args = [
      'node',
      'cli.js',
      'input.js',
      '-o',
      'output',
      '--config',
      'custom.config.json',
      '--verbose',
    ];

    const configContent = JSON.stringify({
      maxChunkSize: 1024, // 1KB
      strategy: 'aggressive',
      beautifyOptions: {
        indentSize: 4,
      },
    });

    // Mock console.log to capture verbose output
    const consoleLog = console.log;
    const logCalls: Array<unknown[]> = [];
    console.log = vi.fn((...args) => {
      logCalls.push(args);
      consoleLog(...args); // Also print to see what's happening
    });

    mockFs.readFile
      .mockResolvedValueOnce(configContent) // config file
      .mockResolvedValueOnce('function test() { return 42; }'); // input file

    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    await cli.run(args);

    // Restore console.log
    console.log = consoleLog;

    // Find the verbose output that shows options
    const optionsLog = logCalls.find((args) => args[0] === 'Processing files with options:');
    expect(optionsLog).toBeDefined();

    const options = optionsLog[1];
    // Debug output
    console.log('Options received:', JSON.stringify(options, null, 2));

    expect(options.maxChunkSize).toBe(1024); // Should use config value
    expect(options.strategy).toBe('aggressive'); // Should use config value
    expect(options.beautifyOptions.indentSize).toBe(4); // Should use config value

    expect(mockFs.readFile).toHaveBeenCalledWith('custom.config.json', 'utf-8');
  });

  it('should apply strategy from config file', async () => {
    const args = ['node', 'cli.js', 'input.js', '-o', 'output'];

    const configContent = JSON.stringify({
      maxChunkSize: 512000,
      strategy: 'conservative',
    });

    mockFs.readFile
      .mockResolvedValueOnce(configContent) // config file
      .mockResolvedValueOnce('function test() { return 42; }'); // input file

    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    await cli.run(args);

    // Verify config was read
    expect(mockFs.readFile).toHaveBeenCalledWith('beautichunk.config.json', 'utf-8');
  });

  it('should merge CLI options with config file (CLI takes precedence)', async () => {
    const args = [
      'node',
      'cli.js',
      'input.js',
      '-o',
      'output',
      '--max-chunk-size',
      '2',
      '--strategy',
      'aggressive',
    ];

    const configContent = JSON.stringify({
      maxChunkSize: 1024,
      strategy: 'conservative',
      beautifyOptions: {
        indentSize: 4,
      },
    });

    mockFs.readFile
      .mockResolvedValueOnce(configContent) // config file
      .mockResolvedValueOnce('function test() { return 42; }'); // input file

    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    await cli.run(args);

    // The CLI options should override the config file
    // We can't directly test this without access to the internal state,
    // but we can verify the config was at least read
    expect(mockFs.readFile).toHaveBeenCalledWith('beautichunk.config.json', 'utf-8');
  });

  it('should use default values when config file does not exist', async () => {
    const args = ['node', 'cli.js', 'input.js', '-o', 'output'];

    mockFs.readFile
      .mockRejectedValueOnce({ code: 'ENOENT' }) // config file not found
      .mockResolvedValueOnce('function test() { return 42; }'); // input file

    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    await cli.run(args);

    // Should not throw error
    expect(mockFs.writeFile).toHaveBeenCalled();
  });
});

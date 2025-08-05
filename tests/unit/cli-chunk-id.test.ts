import * as fs from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLI } from '../../src/cli.js';

vi.mock('node:fs/promises');
vi.mock('glob');

describe('CLI - Chunk ID Generation', () => {
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

  it('should generate unique chunk IDs for multiple files', async () => {
    const args = ['node', 'cli.js', 'file1.js', 'file2.js', 'file3.js', '-o', 'output'];

    // Mock file reads
    mockFs.readFile
      .mockResolvedValueOnce('{}') // config file
      .mockResolvedValueOnce('function file1() { return 1; }')
      .mockResolvedValueOnce('function file2() { return 2; }')
      .mockResolvedValueOnce('function file3() { return 3; }');

    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    await cli.run(args);

    // Check that manifest.json was written
    const manifestCall = mockFs.writeFile.mock.calls.find((call) =>
      call[0].includes('manifest.json'),
    );
    expect(manifestCall).toBeDefined();

    // Parse the manifest content
    const manifestContent = JSON.parse(manifestCall?.[1] as string);
    const chunkIds = manifestContent.chunks.map((chunk: { id: string }) => chunk.id);

    // Verify all chunk IDs are unique
    const uniqueIds = new Set(chunkIds);
    expect(uniqueIds.size).toBe(chunkIds.length);
    expect(uniqueIds.size).toBe(3); // We processed 3 files

    // Verify chunk IDs follow expected pattern
    expect(chunkIds).toContain('chunk_000');
    expect(chunkIds).toContain('chunk_001');
    expect(chunkIds).toContain('chunk_002');
  });

  it('should maintain global chunk counter across multiple file processing', async () => {
    const args = ['node', 'cli.js', 'file1.js', 'file2.js', '-o', 'output'];

    // Mock files with multiple functions that will create separate chunks
    const file1Content = `
      function a() { return 1; }
      function b() { return 2; }
      function c() { return 3; }
    `;
    const file2Content = `
      function d() { return 4; }
      function e() { return 5; }
    `;

    mockFs.readFile
      .mockResolvedValueOnce('{}') // config file
      .mockResolvedValueOnce(file1Content)
      .mockResolvedValueOnce(file2Content);

    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);

    await cli.run(args);

    // Check that manifest.json was written
    const manifestCall = mockFs.writeFile.mock.calls.find((call) =>
      call[0].includes('manifest.json'),
    );
    expect(manifestCall).toBeDefined();

    // Parse the manifest content
    const manifestContent = JSON.parse(manifestCall?.[1] as string);
    const chunkIds = manifestContent.chunks.map((chunk: { id: string }) => chunk.id);

    // Should have 2 chunks (one per file in this simple case)
    expect(chunkIds.length).toBe(2);

    // Verify chunk IDs are sequential
    expect(chunkIds[0]).toBe('chunk_000');
    expect(chunkIds[1]).toBe('chunk_001');
  });
});

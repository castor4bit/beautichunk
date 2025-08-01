import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Chunk } from '../../src/chunker.js';
import { Generator } from '../../src/generator.js';

vi.mock('node:fs/promises');

describe('Generator', () => {
  const mockFs = vi.mocked(fs);
  let generator: Generator;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new Generator({
      outputDir: '/tmp/output',
      generateSourceMaps: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with default options', () => {
      const gen = new Generator();
      expect(gen).toBeInstanceOf(Generator);
    });

    it('should accept custom options', () => {
      const gen = new Generator({
        outputDir: './custom-output',
        generateSourceMaps: true,
        loaderTemplate: 'custom-loader.js',
      });
      expect(gen).toBeInstanceOf(Generator);
    });
  });

  describe('generate', () => {
    const mockChunks: Chunk[] = [
      {
        id: 'chunk_001',
        content: 'function foo() { return "foo"; }',
        dependencies: [],
        exports: ['foo'],
        size: 32,
        order: 0,
      },
      {
        id: 'chunk_002',
        content: 'function bar() { return foo() + "bar"; }',
        dependencies: ['chunk_001'],
        exports: ['bar'],
        size: 40,
        order: 1,
      },
    ];

    it('should create output directory if it does not exist', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await generator.generate(mockChunks);

      expect(mockFs.mkdir).toHaveBeenCalledWith('/tmp/output', { recursive: true });
    });

    it('should generate chunk files', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await generator.generate(mockChunks);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join('/tmp/output', 'chunk_001.js'),
        'function foo() { return "foo"; }',
        'utf-8',
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join('/tmp/output', 'chunk_002.js'),
        'function bar() { return foo() + "bar"; }',
        'utf-8',
      );
    });

    it('should generate manifest.json', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await generator.generate(mockChunks);

      const manifestCall = mockFs.writeFile.mock.calls.find((call) =>
        call[0].includes('manifest.json'),
      );
      expect(manifestCall).toBeDefined();

      const manifestPath = manifestCall![0];
      const manifestContent = JSON.parse(manifestCall![1] as string);

      expect(manifestPath).toBe(path.join('/tmp/output', 'manifest.json'));
      expect(manifestContent).toMatchObject({
        version: '1.0.0',
        chunks: [
          {
            id: 'chunk_001',
            filename: 'chunk_001.js',
            dependencies: [],
            exports: ['foo'],
            size: 32,
            order: 0,
          },
          {
            id: 'chunk_002',
            filename: 'chunk_002.js',
            dependencies: ['chunk_001'],
            exports: ['bar'],
            size: 40,
            order: 1,
          },
        ],
        entryPoint: 'loader.js',
        totalSize: 72,
      });
    });

    it('should generate loader.js', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await generator.generate(mockChunks);

      const loaderCall = mockFs.writeFile.mock.calls.find((call) => call[0].includes('loader.js'));
      expect(loaderCall).toBeDefined();

      const loaderPath = loaderCall![0];
      const loaderContent = loaderCall![1] as string;

      expect(loaderPath).toBe(path.join('/tmp/output', 'loader.js'));
      expect(loaderContent).toContain('manifest.json');
      expect(loaderContent).toContain('loadChunk');
      expect(loaderContent).toContain('async');
    });

    it('should handle empty chunks array', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await generator.generate([]);

      expect(mockFs.mkdir).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2); // Only manifest and loader
    });

    it('should throw error if directory creation fails', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(generator.generate(mockChunks)).rejects.toThrow('Permission denied');
    });

    it('should throw error if file writing fails', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

      await expect(generator.generate(mockChunks)).rejects.toThrow('Disk full');
    });
  });

  describe('generateManifest', () => {
    it('should create a valid manifest object', () => {
      const chunks: Chunk[] = [
        {
          id: 'chunk_001',
          content: 'content1',
          dependencies: [],
          exports: ['foo'],
          size: 100,
          order: 0,
        },
        {
          id: 'chunk_002',
          content: 'content2',
          dependencies: ['chunk_001'],
          exports: ['bar'],
          size: 200,
          order: 1,
        },
      ];

      const manifest = generator.generateManifest(chunks);

      expect(manifest).toEqual({
        version: '1.0.0',
        chunks: [
          {
            id: 'chunk_001',
            filename: 'chunk_001.js',
            dependencies: [],
            exports: ['foo'],
            size: 100,
            order: 0,
          },
          {
            id: 'chunk_002',
            filename: 'chunk_002.js',
            dependencies: ['chunk_001'],
            exports: ['bar'],
            size: 200,
            order: 1,
          },
        ],
        entryPoint: 'loader.js',
        totalSize: 300,
        generatedAt: expect.any(String),
      });

      // Check date format
      expect(new Date(manifest.generatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('generateLoader', () => {
    it('should generate a functional loader script', () => {
      const loaderScript = generator.generateLoader();

      expect(loaderScript).toContain('(function() {');
      expect(loaderScript).toContain('manifest.json');
      expect(loaderScript).toContain('async function loadManifest()');
      expect(loaderScript).toContain('async function loadChunk(chunkId)');
      expect(loaderScript).toContain('async function loadAllChunks()');
      expect(loaderScript).toContain('})();');
    });

    it('should include error handling', () => {
      const loaderScript = generator.generateLoader();

      expect(loaderScript).toContain('try {');
      expect(loaderScript).toContain('catch (error)');
      expect(loaderScript).toContain('console.error');
    });

    it('should handle chunk dependencies', () => {
      const loaderScript = generator.generateLoader();

      expect(loaderScript).toContain('dependencies');
      expect(loaderScript).toContain('loadedChunks');
    });
  });

  describe('with custom loader template', () => {
    it('should use custom loader template if provided', async () => {
      const customLoaderContent = '// Custom loader\nconsole.log("Custom");';
      mockFs.readFile.mockResolvedValue(customLoaderContent);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const customGenerator = new Generator({
        outputDir: '/tmp/output',
        loaderTemplate: '/custom/loader.js',
      });

      await customGenerator.generate([]);

      expect(mockFs.readFile).toHaveBeenCalledWith('/custom/loader.js', 'utf-8');

      const loaderCall = mockFs.writeFile.mock.calls.find((call) => call[0].includes('loader.js'));
      expect(loaderCall![1]).toBe(customLoaderContent);
    });

    it('should fall back to default loader if custom template read fails', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const customGenerator = new Generator({
        outputDir: '/tmp/output',
        loaderTemplate: '/custom/loader.js',
      });

      await customGenerator.generate([]);

      const loaderCall = mockFs.writeFile.mock.calls.find((call) => call[0].includes('loader.js'));
      expect(loaderCall![1]).toContain('loadManifest');
    });
  });
});

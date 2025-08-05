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

      const manifestPath = manifestCall?.[0];
      const manifestContent = JSON.parse(manifestCall?.[1] as string);

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

      const loaderPath = loaderCall?.[0];
      const loaderContent = loaderCall?.[1] as string;

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
      expect(loaderCall?.[1]).toBe(customLoaderContent);
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
      expect(loaderCall?.[1]).toContain('loadManifest');
    });
  });

  describe('with Node.js entry point', () => {
    it('should generate index.js when generateNodeEntry is true', async () => {
      const nodeGenerator = new Generator({ generateNodeEntry: true });
      const chunks = [
        {
          id: 'chunk_000',
          content: 'function test() { return 42; }',
          size: 30,
          dependencies: [],
          exports: ['test'],
          order: 0,
        },
      ];

      await nodeGenerator.generate(chunks);

      // Check that index.js was created
      const indexCall = mockFs.writeFile.mock.calls.find((call) => 
        call[0].includes('index.js')
      );
      expect(indexCall).toBeDefined();
      
      const content = indexCall?.[1] as string;
      expect(content).toContain('#!/usr/bin/env node');
      expect(content).toContain("require('./chunk_000.js');");
      expect(content).toContain('module.exports = moduleExports;');
    });

    it('should not generate index.js when generateNodeEntry is false', async () => {
      const generator = new Generator({ generateNodeEntry: false });
      const chunks = [
        {
          id: 'chunk_000',
          content: 'function test() { return 42; }',
          size: 30,
          dependencies: [],
          exports: ['test'],
          order: 0,
        },
      ];

      await generator.generate(chunks);

      // Check that index.js was NOT created
      const indexCall = mockFs.writeFile.mock.calls.find((call) => 
        call[0].includes('index.js')
      );
      expect(indexCall).toBeUndefined();
    });

    it('should handle multiple chunks with exports in correct order', async () => {
      const nodeGenerator = new Generator({ generateNodeEntry: true });
      const chunks = [
        {
          id: 'chunk_001',
          content: 'function b() { return 2; }',
          size: 26,
          dependencies: [],
          exports: ['b'],
          order: 1,
        },
        {
          id: 'chunk_000',
          content: 'function a() { return 1; }',
          size: 26,
          dependencies: [],
          exports: ['a'],
          order: 0,
        },
      ];

      await nodeGenerator.generate(chunks);

      const indexCall = mockFs.writeFile.mock.calls.find((call) => 
        call[0].includes('index.js')
      );
      const content = indexCall?.[1] as string;
      
      // Should load chunks in order
      const chunk0Index = content.indexOf("require('./chunk_000.js');");
      const chunk1Index = content.indexOf("require('./chunk_001.js');");
      expect(chunk0Index).toBeLessThan(chunk1Index);
      
      // Should include exports from both chunks
      expect(content).toContain('Exports from chunk_000');
      expect(content).toContain('Exports from chunk_001');
    });
  });

  describe('generateNodeEntry', () => {
    it('should generate correct Node.js entry point content', () => {
      const generator = new Generator();
      const chunks = [
        {
          id: 'chunk_000',
          content: 'function test() { return 42; }',
          size: 30,
          dependencies: [],
          exports: ['test'],
          order: 0,
        },
        {
          id: 'chunk_001',
          content: 'const utils = {};',
          size: 17,
          dependencies: [],
          exports: ['utils'],
          order: 1,
        },
      ];

      const content = generator.generateNodeEntry(chunks);

      // Check shebang
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
      
      // Check header comment
      expect(content).toContain('Generated by Beautichunk');
      expect(content).toContain('entry point for the chunked Node.js application');
      
      // Check chunk requires in correct order
      expect(content).toContain("require('./chunk_000.js');");
      expect(content).toContain("require('./chunk_001.js');");
      
      // Check exports collection
      expect(content).toContain('const moduleExports = {};');
      expect(content).toContain('Exports from chunk_000');
      expect(content).toContain('Exports from chunk_001');
      expect(content).toContain("if (typeof test !== 'undefined')");
      expect(content).toContain("moduleExports.test = test;");
      expect(content).toContain("if (typeof utils !== 'undefined')");
      expect(content).toContain("moduleExports.utils = utils;");
      
      // Check module.exports fallback
      expect(content).toContain("else if (module.exports.test)");
      expect(content).toContain("moduleExports.test = module.exports.test;");
      
      // Check main module detection
      expect(content).toContain('if (require.main === module)');
      expect(content).toContain('Beautichunk processed module loaded successfully');
      
      // Check final export
      expect(content).toContain('module.exports = moduleExports;');
    });

    it('should handle chunks without exports', () => {
      const generator = new Generator();
      const chunks = [
        {
          id: 'chunk_000',
          content: 'console.log("side effect");',
          size: 28,
          dependencies: [],
          exports: [],
          order: 0,
        },
      ];

      const content = generator.generateNodeEntry(chunks);

      // Should still require the chunk
      expect(content).toContain("require('./chunk_000.js');");
      
      // Should not have export collection for this chunk
      expect(content).not.toContain('Exports from chunk_000');
    });

    it('should sort chunks by order before generating', () => {
      const generator = new Generator();
      const chunks = [
        {
          id: 'chunk_002',
          content: 'const c = 3;',
          size: 12,
          dependencies: [],
          exports: [],
          order: 2,
        },
        {
          id: 'chunk_000',
          content: 'const a = 1;',
          size: 12,
          dependencies: [],
          exports: [],
          order: 0,
        },
        {
          id: 'chunk_001',
          content: 'const b = 2;',
          size: 12,
          dependencies: [],
          exports: [],
          order: 1,
        },
      ];

      const content = generator.generateNodeEntry(chunks);
      
      // Check that chunks are required in order
      const lines = content.split('\n');
      const requireLines = lines.filter(line => line.includes('require('));
      
      expect(requireLines[0]).toContain('chunk_000.js');
      expect(requireLines[1]).toContain('chunk_001.js');
      expect(requireLines[2]).toContain('chunk_002.js');
    });
  });
});

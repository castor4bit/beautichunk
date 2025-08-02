import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileIO } from '../../src/file-io.js';

vi.mock('node:fs/promises');

describe('FileIO', () => {
  const mockFs = vi.mocked(fs);
  let fileIO: FileIO;

  beforeEach(() => {
    vi.clearAllMocks();
    fileIO = new FileIO();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readInputFile', () => {
    it('should read a single file successfully', async () => {
      const content = 'function test() { return 42; }';
      mockFs.readFile.mockResolvedValue(content);

      const result = await fileIO.readInputFile('/path/to/file.js');

      expect(mockFs.readFile).toHaveBeenCalledWith('/path/to/file.js', 'utf-8');
      expect(result).toEqual({
        path: '/path/to/file.js',
        content,
      });
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(fileIO.readInputFile('/path/to/nonexistent.js')).rejects.toThrow(
        'Failed to read file /path/to/nonexistent.js: ENOENT: no such file or directory',
      );
    });

    it('should handle empty files', async () => {
      mockFs.readFile.mockResolvedValue('');

      const result = await fileIO.readInputFile('/path/to/empty.js');

      expect(result).toEqual({
        path: '/path/to/empty.js',
        content: '',
      });
    });

    it('should handle large files', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      mockFs.readFile.mockResolvedValue(largeContent);

      const result = await fileIO.readInputFile('/path/to/large.js');

      expect(result.content).toBe(largeContent);
    });
  });

  describe('readInputFiles', () => {
    it('should read multiple files successfully', async () => {
      const files = ['/path/to/file1.js', '/path/to/file2.js'];
      const contents = ['content1', 'content2'];

      mockFs.readFile.mockResolvedValueOnce(contents[0]).mockResolvedValueOnce(contents[1]);

      const results = await fileIO.readInputFiles(files);

      expect(results).toEqual([
        { path: files[0], content: contents[0] },
        { path: files[1], content: contents[1] },
      ]);
    });

    it('should handle glob patterns', async () => {
      const globPattern = '/path/to/*.js';
      const files = ['/path/to/file1.js', '/path/to/file2.js'];
      const contents = ['content1', 'content2'];

      // Mock glob expansion
      // biome-ignore lint/suspicious/noExplicitAny: Mocking private method for testing
      vi.spyOn(fileIO, 'expandGlob' as any).mockResolvedValue(files);
      mockFs.readFile.mockResolvedValueOnce(contents[0]).mockResolvedValueOnce(contents[1]);

      const results = await fileIO.readInputFiles([globPattern]);

      expect(results).toEqual([
        { path: files[0], content: contents[0] },
        { path: files[1], content: contents[1] },
      ]);
    });

    it('should continue on error if continueOnError is true', async () => {
      const files = ['/path/to/file1.js', '/path/to/file2.js', '/path/to/file3.js'];

      mockFs.readFile
        .mockResolvedValueOnce('content1')
        .mockRejectedValueOnce(new Error('Read error'))
        .mockResolvedValueOnce('content3');

      const results = await fileIO.readInputFiles(files, { continueOnError: true });

      expect(results).toEqual([
        { path: files[0], content: 'content1' },
        { path: files[2], content: 'content3' },
      ]);
    });

    it('should fail on first error if continueOnError is false', async () => {
      const files = ['/path/to/file1.js', '/path/to/file2.js'];

      mockFs.readFile
        .mockResolvedValueOnce('content1')
        .mockRejectedValueOnce(new Error('Read error'));

      await expect(fileIO.readInputFiles(files, { continueOnError: false })).rejects.toThrow(
        'Read error',
      );
    });

    it('should handle empty array', async () => {
      const results = await fileIO.readInputFiles([]);
      expect(results).toEqual([]);
    });
  });

  describe('createOutputDirectory', () => {
    it('should create directory successfully', async () => {
      const outputDir = '/path/to/output';
      mockFs.mkdir.mockResolvedValue(undefined);

      await fileIO.createOutputDirectory(outputDir);

      expect(mockFs.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true });
    });

    it('should handle existing directory', async () => {
      const outputDir = '/path/to/output';
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as fs.Stats);

      await fileIO.createOutputDirectory(outputDir);

      expect(mockFs.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true });
    });

    it('should throw error if path exists but is not a directory', async () => {
      const outputDir = '/path/to/file.txt';
      mockFs.stat.mockResolvedValue({ isDirectory: () => false } as fs.Stats);

      await expect(fileIO.createOutputDirectory(outputDir)).rejects.toThrow(
        'Output path exists but is not a directory: /path/to/file.txt',
      );
    });

    it('should handle permission errors', async () => {
      const outputDir = '/protected/path';
      mockFs.mkdir.mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(fileIO.createOutputDirectory(outputDir)).rejects.toThrow(
        'Failed to create output directory /protected/path: EACCES: permission denied',
      );
    });

    it('should clean directory if clean option is true', async () => {
      const outputDir = '/path/to/output';
      const existingFiles = ['chunk_001.js', 'chunk_002.js', 'manifest.json'];

      // Mock directory exists
      mockFs.stat.mockResolvedValue({ isDirectory: () => true } as fs.Stats);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(existingFiles as unknown as fs.Dirent[]);
      mockFs.unlink.mockResolvedValue(undefined);

      await fileIO.createOutputDirectory(outputDir, { clean: true });

      expect(mockFs.readdir).toHaveBeenCalledWith(outputDir);
      for (const file of existingFiles) {
        expect(mockFs.unlink).toHaveBeenCalledWith(path.join(outputDir, file));
      }
    });
  });

  describe('writeOutputFile', () => {
    it('should write file successfully', async () => {
      const filePath = '/output/chunk_001.js';
      const content = 'console.log("hello");';

      mockFs.writeFile.mockResolvedValue(undefined);

      await fileIO.writeOutputFile(filePath, content);

      expect(mockFs.writeFile).toHaveBeenCalledWith(filePath, content, 'utf-8');
    });

    it('should create parent directory if it does not exist', async () => {
      const filePath = '/output/nested/deep/chunk_001.js';
      const content = 'content';

      mockFs.writeFile.mockRejectedValueOnce({ code: 'ENOENT' });
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValueOnce(undefined);

      await fileIO.writeOutputFile(filePath, content);

      expect(mockFs.mkdir).toHaveBeenCalledWith('/output/nested/deep', { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should handle write errors', async () => {
      const filePath = '/output/chunk_001.js';
      const content = 'content';

      mockFs.writeFile.mockRejectedValue(new Error('ENOSPC: no space left'));

      await expect(fileIO.writeOutputFile(filePath, content)).rejects.toThrow(
        'Failed to write file /output/chunk_001.js: ENOSPC: no space left',
      );
    });
  });

  describe('validatePaths', () => {
    it('should validate paths successfully', async () => {
      const inputPaths = ['/input/file1.js', '/input/file2.js'];
      const outputPath = '/output';

      mockFs.access.mockResolvedValue(undefined);
      mockFs.stat.mockResolvedValue({ isFile: () => true } as fs.Stats);

      const result = await fileIO.validatePaths(inputPaths, outputPath);

      expect(result).toEqual({
        valid: true,
        errors: [],
      });
    });

    it('should detect missing input files', async () => {
      const inputPaths = ['/input/file1.js', '/input/missing.js'];
      const outputPath = '/output';

      mockFs.access.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('ENOENT'));

      const result = await fileIO.validatePaths(inputPaths, outputPath);

      expect(result).toEqual({
        valid: false,
        errors: ['Input file not found: /input/missing.js'],
      });
    });

    it('should validate output parent directory', async () => {
      const inputPaths = ['/input/file.js'];
      const outputPath = '/nonexistent/output';

      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.access.mockRejectedValueOnce(new Error('ENOENT'));

      const result = await fileIO.validatePaths(inputPaths, outputPath);

      expect(result).toEqual({
        valid: false,
        errors: ['Output parent directory not found: /nonexistent'],
      });
    });

    it('should handle empty input paths', async () => {
      const result = await fileIO.validatePaths([], '/output');

      expect(result).toEqual({
        valid: false,
        errors: ['No input files specified'],
      });
    });
  });

  describe('getFileStats', () => {
    it('should return file statistics', async () => {
      const filePath = '/path/to/file.js';
      const stats = {
        size: 1024,
        mtime: new Date('2025-01-01'),
        isFile: () => true,
        isDirectory: () => false,
      };

      mockFs.stat.mockResolvedValue(stats as fs.Stats);

      const result = await fileIO.getFileStats(filePath);

      expect(result).toEqual({
        path: filePath,
        size: 1024,
        modified: stats.mtime,
        isFile: true,
        isDirectory: false,
      });
    });

    it('should handle stat errors', async () => {
      const filePath = '/path/to/nonexistent.js';

      mockFs.stat.mockRejectedValue(new Error('ENOENT'));

      await expect(fileIO.getFileStats(filePath)).rejects.toThrow(
        'Failed to get stats for /path/to/nonexistent.js: ENOENT',
      );
    });
  });
});

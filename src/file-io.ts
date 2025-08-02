import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { glob } from 'glob';

export interface InputFile {
  path: string;
  content: string;
}

export interface ReadOptions {
  continueOnError?: boolean;
}

export interface CreateDirectoryOptions {
  clean?: boolean;
}

export interface FileStats {
  path: string;
  size: number;
  modified: Date;
  isFile: boolean;
  isDirectory: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class FileIO {
  async readInputFile(filePath: string): Promise<InputFile> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        path: filePath,
        content,
      };
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
  }

  async readInputFiles(paths: string[], options: ReadOptions = {}): Promise<InputFile[]> {
    const { continueOnError = false } = options;
    const expandedPaths = await this.expandPaths(paths);
    const results: InputFile[] = [];
    const errors: Error[] = [];

    for (const filePath of expandedPaths) {
      try {
        const file = await this.readInputFile(filePath);
        results.push(file);
      } catch (error) {
        if (continueOnError) {
          errors.push(error as Error);
          console.warn(`Skipping file due to error: ${(error as Error).message}`);
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  async createOutputDirectory(
    outputDir: string,
    options: CreateDirectoryOptions = {},
  ): Promise<void> {
    const { clean = false } = options;

    // Check if path exists
    let dirExists = false;
    try {
      const stats = await fs.stat(outputDir);
      if (!stats.isDirectory()) {
        throw new Error(`Output path exists but is not a directory: ${outputDir}`);
      }
      dirExists = true;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        // Re-throw if it's not a "file not found" error
        if ((error as Error).message.includes('Output path exists')) {
          throw error;
        }
        // If we're here, it's likely a permission issue while checking
        // Let mkdir handle it below
      }
    }

    // Clean directory if requested and it exists
    if (clean && dirExists) {
      try {
        const files = await fs.readdir(outputDir);
        await Promise.all(files.map((file) => fs.unlink(path.join(outputDir, file))));
      } catch (error) {
        throw new Error(
          `Failed to clean output directory ${outputDir}: ${(error as Error).message}`,
        );
      }
    }

    // Create directory
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create output directory ${outputDir}: ${(error as Error).message}`,
      );
    }
  }

  async writeOutputFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        // Parent directory doesn't exist, create it
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
      } else {
        throw new Error(`Failed to write file ${filePath}: ${(error as Error).message}`);
      }
    }
  }

  async validatePaths(inputPaths: string[], outputPath: string): Promise<ValidationResult> {
    const errors: string[] = [];

    if (inputPaths.length === 0) {
      errors.push('No input files specified');
      return { valid: false, errors };
    }

    // Validate input files
    for (const inputPath of inputPaths) {
      try {
        await fs.access(inputPath);
      } catch {
        errors.push(`Input file not found: ${inputPath}`);
      }
    }

    // Validate output parent directory
    const outputParent = path.dirname(outputPath);
    try {
      await fs.access(outputParent);
    } catch {
      errors.push(`Output parent directory not found: ${outputParent}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getFileStats(filePath: string): Promise<FileStats> {
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      throw new Error(`Failed to get stats for ${filePath}: ${(error as Error).message}`);
    }
  }

  private async expandPaths(paths: string[]): Promise<string[]> {
    const expanded: string[] = [];

    for (const inputPath of paths) {
      if (this.isGlobPattern(inputPath)) {
        const matches = await this.expandGlob(inputPath);
        expanded.push(...matches);
      } else {
        expanded.push(inputPath);
      }
    }

    return expanded;
  }

  private isGlobPattern(pattern: string): boolean {
    return (
      pattern.includes('*') ||
      pattern.includes('?') ||
      pattern.includes('{') ||
      pattern.includes('[')
    );
  }

  private async expandGlob(pattern: string): Promise<string[]> {
    try {
      return await glob(pattern, { nodir: true });
    } catch (error) {
      throw new Error(`Failed to expand glob pattern ${pattern}: ${(error as Error).message}`);
    }
  }
}

import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

describe.skip('CLI Integration Tests', () => {
  let tempDir: string;
  const cliPath = path.join(process.cwd(), 'dist/esm/cli.js');

  beforeEach(async () => {
    // Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'beautichunk-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should process a simple JavaScript file', async () => {
    // Create test input file
    const inputPath = path.join(tempDir, 'input.js');
    const outputDir = path.join(tempDir, 'output');
    const inputContent = `
function add(a,b){return a+b}
function multiply(x,y){return x*y}
console.log(add(1,2));
console.log(multiply(3,4));
`;
    await fs.writeFile(inputPath, inputContent);

    // Run CLI
    const { stdout, stderr } = await execAsync(`node ${cliPath} ${inputPath} -o ${outputDir}`);

    // Check output
    expect(stderr).toBe('');
    expect(stdout).toContain('Successfully processed');

    // Check generated files
    const files = await fs.readdir(outputDir);
    expect(files).toContain('chunk_000.js');
    expect(files).toContain('manifest.json');
    expect(files).toContain('loader.js');

    // Check beautified content
    const chunkContent = await fs.readFile(path.join(outputDir, 'chunk_000.js'), 'utf-8');
    expect(chunkContent).toContain('function add(a, b)');
    expect(chunkContent).toContain('function multiply(x, y)');
  });

  it('should handle multiple input files', async () => {
    // Create test input files
    const file1 = path.join(tempDir, 'file1.js');
    const file2 = path.join(tempDir, 'file2.js');
    const outputDir = path.join(tempDir, 'output');

    await fs.writeFile(file1, 'function foo(){return "foo"}');
    await fs.writeFile(file2, 'function bar(){return "bar"}');

    // Run CLI
    const { stdout, stderr } = await execAsync(`node ${cliPath} ${file1} ${file2} -o ${outputDir}`);

    expect(stderr).toBe('');
    expect(stdout).toContain('Processing 2 file(s)');
    expect(stdout).toContain('Successfully processed 2 file(s)');
  });

  it('should respect custom chunk size', async () => {
    // Create a large input file
    const inputPath = path.join(tempDir, 'large.js');
    const outputDir = path.join(tempDir, 'output');

    // Generate content larger than 1KB
    let content = '';
    for (let i = 0; i < 100; i++) {
      content += `function func${i}(){return "${'x'.repeat(50)}"}\n`;
    }
    await fs.writeFile(inputPath, content);

    // Run CLI with 1KB chunk size
    const { stderr } = await execAsync(
      `node ${cliPath} ${inputPath} -o ${outputDir} --max-chunk-size 1`,
    );

    expect(stderr).toBe('');

    // Check multiple chunks were created
    const files = await fs.readdir(outputDir);
    const chunkFiles = files.filter((f) => f.startsWith('chunk_'));
    expect(chunkFiles.length).toBeGreaterThan(1);
  });

  it('should use config file', async () => {
    // Create config file
    const configPath = path.join(tempDir, 'beautichunk.config.json');
    const config = {
      maxChunkSize: 1024,
      beautifyOptions: {
        indentSize: 4,
      },
    };
    await fs.writeFile(configPath, JSON.stringify(config));

    // Create test input
    const inputPath = path.join(tempDir, 'input.js');
    const outputDir = path.join(tempDir, 'output');
    await fs.writeFile(inputPath, 'function test(){return 42}');

    // Run CLI with config
    const { stderr } = await execAsync(
      `node ${cliPath} ${inputPath} -o ${outputDir} --config ${configPath}`,
    );

    expect(stderr).toBe('');

    // Check beautified content has 4-space indentation
    const chunkContent = await fs.readFile(path.join(outputDir, 'chunk_000.js'), 'utf-8');
    expect(chunkContent).toMatch(/^ {4}return 42/m); // 4 spaces
  });

  it('should show help', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --help`);

    expect(stdout).toContain('beautichunk');
    expect(stdout).toContain('Transform obfuscated JavaScript files');
    expect(stdout).toContain('--output');
    expect(stdout).toContain('--max-chunk-size');
  });

  it('should show version', async () => {
    const { stdout } = await execAsync(`node ${cliPath} --version`);

    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should handle errors gracefully', async () => {
    const outputDir = path.join(tempDir, 'output');

    try {
      await execAsync(`node ${cliPath} nonexistent.js -o ${outputDir}`);
      expect.fail('Should have thrown an error');
    } catch (error) {
      const execError = error as { code: number; stderr: string };
      expect(execError.code).toBe(1);
      expect(execError.stderr).toContain('Error:');
    }
  });
});

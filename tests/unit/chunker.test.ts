import { describe, expect, it } from 'vitest';
import { Analyzer } from '../../src/analyzer';
import type { ChunkerOptions } from '../../src/chunker';
import { Chunker } from '../../src/chunker';
import { Parser } from '../../src/parser';

describe('Chunker', () => {
  describe('constructor', () => {
    it('should create a Chunker instance with default options', () => {
      const chunker = new Chunker();
      expect(chunker).toBeInstanceOf(Chunker);
    });

    it('should accept custom options', () => {
      const options: ChunkerOptions = {
        strategy: 'aggressive',
        maxChunkSize: 100 * 1024, // 100KB
      };
      const chunker = new Chunker(options);
      expect(chunker).toBeInstanceOf(Chunker);
    });
  });

  describe('chunk', () => {
    it('should return a single chunk for small code', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker({
        strategy: 'auto',
        maxChunkSize: 256 * 1024,
      });

      const code = 'const x = 1; const y = 2;';
      const ast = parser.parse(code);
      const analysis = analyzer.analyze(ast);
      const chunks = chunker.chunk(ast, analysis);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toContain('const x = 1');
      expect(chunks[0].content).toContain('const y = 2');
    });

    it('should handle ES2022+ syntax without crashing', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker({
        strategy: 'auto',
        maxChunkSize: 256 * 1024,
      });

      // Code with ES2022+ features that escodegen doesn't support
      const codeWithModernSyntax = `
        class MyClass {
          static {
            // Static initialization block (ES2022)
            console.log('Static block');
          }
          #privateField = 42; // Private field (ES2022)
          
          method() {
            const value = obj?.prop?.nested; // Optional chaining
            return value ?? 'default'; // Nullish coalescing
          }
        }
      `;

      const ast = parser.parse(codeWithModernSyntax);
      const analysis = analyzer.analyze(ast);

      // Should not throw error even with unsupported syntax
      expect(() => chunker.chunk(ast, analysis)).not.toThrow();

      const chunks = chunker.chunk(ast, analysis);
      expect(chunks).toBeDefined();
      expect(Array.isArray(chunks)).toBe(true);
    });

    it('should split code when exceeding size limit', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker({
        strategy: 'aggressive',
        maxChunkSize: 50, // Very small for testing
      });

      const code = `
        function longFunction1() { return "a".repeat(30); }
        function longFunction2() { return "b".repeat(30); }
      `;
      const ast = parser.parse(code);
      const analysis = analyzer.analyze(ast);
      const chunks = chunker.chunk(ast, analysis);

      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should preserve dependencies with conservative strategy', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker({
        strategy: 'conservative',
        maxChunkSize: 100,
      });

      const code = `
        function helper() { return 42; }
        function main() { return helper(); }
      `;
      const ast = parser.parse(code);
      const analysis = analyzer.analyze(ast);
      const chunks = chunker.chunk(ast, analysis);

      // With conservative strategy, dependent functions should stay together
      const mainChunk = chunks.find((c) => c.content.includes('function main'));
      expect(mainChunk).toBeDefined();
      if (mainChunk) {
        expect(mainChunk.content).toContain('function helper');
      }
    });

    it('should handle circular dependencies', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker({
        strategy: 'auto',
        maxChunkSize: 256 * 1024,
      });

      const code = `
        function a() { return b(); }
        function b() { return a(); }
      `;
      const ast = parser.parse(code);
      const analysis = analyzer.analyze(ast);
      const chunks = chunker.chunk(ast, analysis);

      // Circular dependencies should be kept in the same chunk
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toContain('function a');
      expect(chunks[0].content).toContain('function b');
    });

    it('should set correct execution order', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker({
        strategy: 'aggressive',
        maxChunkSize: 100,
      });

      const code = `
        const config = { value: 1 };
        function useConfig() { return config.value; }
        useConfig();
      `;
      const ast = parser.parse(code);
      const analysis = analyzer.analyze(ast);
      const chunks = chunker.chunk(ast, analysis);

      if (chunks.length > 1) {
        // Config should come before its usage
        const configChunk = chunks.find((c) => c.content.includes('const config'));
        const useChunk = chunks.find((c) => c.content.includes('useConfig()'));
        if (configChunk && useChunk && configChunk !== useChunk) {
          expect(configChunk.order).toBeLessThan(useChunk.order);
        }
      }
    });

    it('should track chunk dependencies', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker({
        strategy: 'aggressive',
        maxChunkSize: 80,
      });

      const code = `
        function shared() { return 1; }
        function func1() { return shared(); }
        function func2() { return shared(); }
      `;
      const ast = parser.parse(code);
      const analysis = analyzer.analyze(ast);
      const chunks = chunker.chunk(ast, analysis);

      // If split into multiple chunks, dependent chunks should reference shared
      if (chunks.length > 1) {
        const sharedChunk = chunks.find((c) => c.content.includes('function shared'));
        const dependentChunks = chunks.filter(
          (c) => c !== sharedChunk && (c.content.includes('func1') || c.content.includes('func2')),
        );

        dependentChunks.forEach((chunk) => {
          expect(chunk.dependencies).toContain(sharedChunk?.id);
        });
      }
    });

    it('should respect minChunkSize option', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker({
        strategy: 'auto',
        maxChunkSize: 200,
        minChunkSize: 100,
      });

      const code = `
        function small1() { return 1; }
        function small2() { return 2; }
        function small3() { return 3; }
      `;
      const ast = parser.parse(code);
      const analysis = analyzer.analyze(ast);
      const chunks = chunker.chunk(ast, analysis);

      // Small functions should be combined to meet minChunkSize
      chunks.forEach((chunk) => {
        expect(chunk.size).toBeGreaterThanOrEqual(100);
      });
    });

    it('should track exports correctly', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const chunker = new Chunker();

      const code = `
        function publicFunc() { return 1; }
        function privateFunc() { return 2; }
        const publicVar = 3;
      `;
      const ast = parser.parse(code);
      const analysis = analyzer.analyze(ast);
      const chunks = chunker.chunk(ast, analysis);

      // All top-level declarations should be tracked as exports
      expect(chunks[0].exports).toContain('publicFunc');
      expect(chunks[0].exports).toContain('privateFunc');
      expect(chunks[0].exports).toContain('publicVar');
    });
  });
});

import { describe, expect, it } from 'vitest';
import type { BeautifierOptions } from '../../src/beautifier';
import { Beautifier } from '../../src/beautifier';
import type { Chunk } from '../../src/chunker';

describe('Beautifier', () => {
  describe('constructor', () => {
    it('should create a Beautifier instance with default options', () => {
      const beautifier = new Beautifier();
      expect(beautifier).toBeInstanceOf(Beautifier);
    });

    it('should accept custom options', () => {
      const options: BeautifierOptions = {
        indentSize: 4,
        indentChar: '\t',
        preserveNewlines: false,
      };
      const beautifier = new Beautifier(options);
      expect(beautifier).toBeInstanceOf(Beautifier);
    });
  });

  describe('beautify', () => {
    it('should format minified code', () => {
      const beautifier = new Beautifier();
      const minified = 'function test(){return 1+2;}const x=test();console.log(x);';
      const beautified = beautifier.beautify(minified);

      expect(beautified).toContain('function test() {');
      expect(beautified).toContain('  return 1 + 2;');
      expect(beautified).toContain('}\n');
      expect(beautified).toContain('const x = test();');
      expect(beautified).toContain('console.log(x);');
    });

    it('should respect custom indent size', () => {
      const beautifier = new Beautifier({ indentSize: 4 });
      const code = 'function test(){if(true){return 1;}}';
      const beautified = beautifier.beautify(code);

      expect(beautified).toContain('    if (true) {');
      expect(beautified).toContain('        return 1;');
    });

    it('should respect tab indentation', () => {
      const beautifier = new Beautifier({ indentChar: '\t' });
      const code = 'function test(){return 1;}';
      const beautified = beautifier.beautify(code);

      expect(beautified).toContain('\treturn 1;');
    });

    it('should preserve newlines when configured', () => {
      const beautifier = new Beautifier({ preserveNewlines: true });
      const code = 'const a=1;\n\nconst b=2;';
      const beautified = beautifier.beautify(code);

      expect(beautified).toContain('const a = 1;\n\nconst b = 2;');
    });

    it('should limit consecutive newlines', () => {
      const beautifier = new Beautifier({
        preserveNewlines: true,
        maxPreserveNewlines: 2,
      });
      const code = 'const a=1;\n\n\n\nconst b=2;';
      const beautified = beautifier.beautify(code);

      const newlineCount = (beautified.match(/\n\n/g) || []).length;
      expect(newlineCount).toBeLessThanOrEqual(1);
    });

    it('should handle brace styles', () => {
      const beautifier = new Beautifier({ braceStyle: 'expand' });
      const code = 'if(true){console.log("yes");}else{console.log("no");}';
      const beautified = beautifier.beautify(code);

      expect(beautified).toContain('if (true)\n{');
      expect(beautified).toContain('}\nelse\n{');
    });

    it('should handle complex nested structures', () => {
      const beautifier = new Beautifier();
      const code = 'const obj={a:1,b:{c:2,d:[3,4,{e:5}]},f:function(){return this.a;}};';
      const beautified = beautifier.beautify(code);

      expect(beautified).toContain('const obj = {');
      expect(beautified).toContain('  a: 1,');
      expect(beautified).toContain('  b: {');
      expect(beautified).toContain('    c: 2,');
      expect(beautified).toContain('    d: [3, 4, {');
      expect(beautified).toContain('      e: 5');
    });

    it('should preserve comments', () => {
      const beautifier = new Beautifier();
      const code = '// This is a comment\nfunction test(){/* inline */return 1;}';
      const beautified = beautifier.beautify(code);

      expect(beautified).toContain('// This is a comment');
      expect(beautified).toContain('/* inline */');
    });

    it('should handle empty input', () => {
      const beautifier = new Beautifier();
      const beautified = beautifier.beautify('');
      expect(beautified).toBe('');
    });

    it('should handle syntax errors gracefully', () => {
      const beautifier = new Beautifier();
      const invalidCode = 'function test({return 1;}'; // Missing closing paren

      // Should not throw, but return something
      expect(() => beautifier.beautify(invalidCode)).not.toThrow();
    });
  });

  describe('beautifyChunk', () => {
    it('should beautify chunk content', () => {
      const beautifier = new Beautifier();
      const chunk: Chunk = {
        id: 'chunk_001',
        content: 'function test(){return 1;}const x=test();',
        dependencies: [],
        exports: ['test', 'x'],
        size: 41,
        order: 0,
      };

      const beautifiedChunk = beautifier.beautifyChunk(chunk);

      expect(beautifiedChunk.id).toBe(chunk.id);
      expect(beautifiedChunk.content).toContain('function test() {');
      expect(beautifiedChunk.content).toContain('  return 1;');
      expect(beautifiedChunk.dependencies).toEqual(chunk.dependencies);
      expect(beautifiedChunk.exports).toEqual(chunk.exports);
      expect(beautifiedChunk.order).toBe(chunk.order);
      // Size should be updated
      expect(beautifiedChunk.size).toBeGreaterThan(chunk.size);
    });

    it('should update chunk size after beautification', () => {
      const beautifier = new Beautifier();
      const chunk: Chunk = {
        id: 'chunk_001',
        content: 'const a=1;',
        dependencies: [],
        exports: ['a'],
        size: 10,
        order: 0,
      };

      const beautifiedChunk = beautifier.beautifyChunk(chunk);
      const expectedSize = Buffer.byteLength(beautifiedChunk.content, 'utf8');

      expect(beautifiedChunk.size).toBe(expectedSize);
    });
  });

  describe('edge cases', () => {
    it('should handle very long lines', () => {
      const beautifier = new Beautifier({ wrapLineLength: 80 });
      const longVarName = 'veryLongVariableName'.repeat(10);
      const longLine = `const result = ${longVarName} + ${longVarName};`;
      const beautified = beautifier.beautify(longLine);

      // Should contain the long variable names
      expect(beautified).toContain(longVarName);
      // Should still be valid JavaScript
      expect(() => new Function(beautified)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const beautifier = new Beautifier();
      const code = 'const 世界="こんにちは";console.log(世界);';
      const beautified = beautifier.beautify(code);

      expect(beautified).toContain('const 世界 = "こんにちは";');
      expect(beautified).toContain('console.log(世界);');
    });
  });
});

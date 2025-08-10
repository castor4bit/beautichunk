import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';
import { HybridGenerator } from '../../../src/generator/hybrid-generator.js';

describe('ForIn and ForOf statements support', () => {
  const generator = new HybridGenerator();

  describe('ForOfStatement', () => {
    it('should generate code for simple for-of loop', () => {
      const code = 'for (const item of items) { console.log(item); }';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('for');
      expect(generated).toContain('const item of items');
      expect(generated).toContain('console.log(item)');
    });

    it('should handle for-of with array destructuring', () => {
      const code = 'for (const [key, value] of entries) { console.log(key, value); }';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('for');
      expect(generated).toContain('[key, value] of entries');
      expect(generated).toContain('console.log(key, value)');
    });

    it('should handle for-await-of loop', () => {
      const code =
        'async function test() { for await (const item of asyncItems) { console.log(item); } }';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('async function');
      expect(generated).toContain('for await');
      expect(generated).toContain('const item of asyncItems');
    });

    it('should handle for-of with let declaration', () => {
      const code = 'for (let x of array) { x = x * 2; }';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('for');
      expect(generated).toContain('let x of array');
      expect(generated).toContain('x = x * 2');
    });
  });

  describe('ForInStatement', () => {
    it('should generate code for simple for-in loop', () => {
      const code = 'for (const key in object) { console.log(key); }';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('for');
      expect(generated).toContain('const key in object');
      expect(generated).toContain('console.log(key)');
    });

    it('should handle for-in with var declaration', () => {
      const code = 'for (var prop in obj) { result[prop] = obj[prop]; }';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('for');
      expect(generated).toContain('var prop in obj');
      expect(generated).toContain('result[prop] = obj[prop]');
    });

    it('should handle for-in without declaration', () => {
      const code = 'let i; for (i in items) { process(i); }';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('let i');
      expect(generated).toContain('for');
      expect(generated).toContain('i in items');
      expect(generated).toContain('process(i)');
    });

    it('should handle nested for-in and for-of loops', () => {
      const code = `
        for (const key in obj) {
          for (const item of obj[key]) {
            console.log(key, item);
          }
        }
      `;
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('for');
      expect(generated).toContain('const key in obj');
      expect(generated).toContain('const item of obj[key]');
      expect(generated).toContain('console.log(key, item)');
    });
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { HybridGenerator } from '../../../src/generator/hybrid-generator.js';
import type { CodeGenerator } from '../../../src/generator/types.js';
import { Parser } from '../../../src/parser.js';

describe('HybridGenerator', () => {
  let generator: CodeGenerator;
  let parser: Parser;

  beforeEach(() => {
    generator = new HybridGenerator();
    parser = new Parser();
  });

  describe('Basic functionality', () => {
    it('should implement CodeGenerator interface', () => {
      expect(generator.generate).toBeDefined();
      expect(generator.canGenerate).toBeDefined();
      expect(generator.name).toBeDefined();
    });

    it('should generate code for simple ES5 syntax', () => {
      const code = 'const x = 1;';
      const ast = parser.parse(code);
      const generated = generator.generate(ast.body[0]);

      expect(generated).toContain('const x = 1');
    });

    it('should generate code for ES6 classes', () => {
      const code = `
        class MyClass {
          constructor() {
            this.value = 0;
          }
          increment() {
            this.value++;
          }
        }
      `;
      const ast = parser.parse(code);
      const generated = generator.generate(ast.body[0]);

      expect(generated).toContain('class MyClass');
      expect(generated).toContain('constructor()');
      expect(generated).toContain('increment()');
    });
  });

  describe('ES2022+ syntax support', () => {
    it('should handle optional chaining', () => {
      const code = 'const value = obj?.prop?.nested;';
      const ast = parser.parse(code);
      const generated = generator.generate(ast.body[0]);

      expect(generated).toContain('obj?.prop?.nested');
    });

    it('should handle nullish coalescing', () => {
      const code = 'const value = foo ?? "default";';
      const ast = parser.parse(code);
      const generated = generator.generate(ast.body[0]);

      expect(generated).toContain('??');
    });

    it('should handle static blocks in classes', () => {
      const code = `
        class MyClass {
          static {
            console.log('Static initialization');
          }
        }
      `;
      const ast = parser.parse(code);
      const generated = generator.generate(ast.body[0]);

      expect(generated).toContain('static {');
      expect(generated).toContain('console.log');
    });

    it('should handle private fields', () => {
      const code = `
        class MyClass {
          #privateField = 42;
          getPrivate() {
            return this.#privateField;
          }
        }
      `;
      const ast = parser.parse(code);
      const generated = generator.generate(ast.body[0]);

      expect(generated).toContain('#privateField');
    });
  });

  describe('Fallback behavior', () => {
    it('should gracefully handle mixed ES5 and ES2022+ code', () => {
      const code = `
        function oldStyle() {
          return 42;
        }
        
        const newStyle = obj?.method?.();
      `;
      const ast = parser.parse(code);

      // Generate both statements
      const func = generator.generate(ast.body[0]);
      const optional = generator.generate(ast.body[1]);

      expect(func).toContain('function oldStyle');
      expect(optional).toContain('obj?.method?.()');
    });

    it('should maintain consistent formatting', () => {
      const options = {
        format: {
          indent: {
            style: '  ',
            base: 0,
          },
        },
      };

      const code = 'function test() { return 42; }';
      const ast = parser.parse(code);
      const generated = generator.generate(ast.body[0], options);

      expect(generated).toContain('function test()');
      expect(generated).toContain('return 42');
    });
  });

  describe('Performance characteristics', () => {
    it('should use escodegen for ES5/ES6 code', () => {
      const generator = new HybridGenerator();
      const code = 'function test() { return 42; }';
      const ast = parser.parse(code);

      // Should be fast (escodegen path)
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        generator.generate(ast.body[0]);
      }
      const duration = performance.now() - start;

      // Should be faster than 50ms for 1000 iterations of simple code
      expect(duration).toBeLessThan(50);
    });

    it('should use babel for ES2022+ code', () => {
      const generator = new HybridGenerator();
      const code = 'const value = obj?.prop;';
      const ast = parser.parse(code);

      // Will be slower (babel path) but should still work
      const result = generator.generate(ast.body[0]);
      expect(result).toContain('obj?.prop');
    });
  });
});

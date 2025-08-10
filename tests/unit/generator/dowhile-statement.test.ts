import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';
import { HybridGenerator } from '../../../src/generator/hybrid-generator.js';

describe('DoWhileStatement bug fix', () => {
  const generator = new HybridGenerator();

  it('should correctly generate do-while loop', () => {
    const code = 'do { console.log("test"); } while (x < 10);';
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    expect(generated).toContain('do');
    expect(generated).toContain('console.log');
    expect(generated).toContain('while');
    expect(generated).toContain('x < 10');
  });

  it('should handle do-while with complex condition', () => {
    const code = 'do { x++; } while (x < 10 && y > 0);';
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    expect(generated).toContain('do');
    expect(generated).toContain('x++');
    expect(generated).toContain('while');
    expect(generated).toContain('x < 10 && y > 0');
  });

  it('should handle do-while inside a class method', () => {
    const code = `
      class Test {
        method() {
          do {
            this.count++;
          } while (this.count < 10);
        }
      }
    `;
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    expect(generated).toContain('class Test');
    expect(generated).toContain('method()');
    expect(generated).toContain('do');
    expect(generated).toContain('this.count++');
    expect(generated).toContain('while');
    expect(generated).toContain('this.count < 10');
  });

  it('should handle nested do-while loops', () => {
    const code = `
      do {
        let i = 0;
        do {
          i++;
        } while (i < 5);
      } while (condition);
    `;
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    expect(generated).toContain('do');
    expect(generated).toContain('let i = 0');
    expect(generated).toContain('i++');
    expect(generated).toContain('while');
    expect(generated).toContain('i < 5');
    expect(generated).toContain('condition');
  });

  it('should handle malformed do-while test conversion', () => {
    // Test case that might have ExpressionStatement where Expression is expected
    const code = `
      class Example {
        method() {
          do {
            console.log("test");
          } while (true);
        }
      }
    `;
    const ast = acorn.parse(code, { ecmaVersion: 2022 });

    // This should not throw an error
    expect(() => generator.generate(ast)).not.toThrow();

    const generated = generator.generate(ast);
    expect(generated).toContain('class Example');
    expect(generated).toContain('do');
    expect(generated).toContain('while (true)');
  });
});

import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';
import { HybridGenerator } from '../../../src/generator/hybrid-generator.js';

describe('SequenceExpression support', () => {
  const generator = new HybridGenerator();

  it('should generate code for simple sequence expression', () => {
    const code = 'let result = (a = 1, b = 2, a + b);';
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    // Should include the sequence expression
    expect(generated).toContain('a = 1');
    expect(generated).toContain('b = 2');
    expect(generated).toContain('a + b');
  });

  it('should handle sequence expression in for loop', () => {
    const code = 'for (let i = 0, j = 10; i < j; i++, j--) { console.log(i, j); }';
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    expect(generated).toContain('for');
    expect(generated).toContain('i = 0');
    expect(generated).toContain('j = 10');
    expect(generated).toContain('i++');
    expect(generated).toContain('j--');
  });

  it('should handle nested sequence expressions', () => {
    const code = 'let x = (a = 1, (b = 2, c = 3), a + b + c);';
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    expect(generated).toContain('a = 1');
    expect(generated).toContain('b = 2');
    expect(generated).toContain('c = 3');
    expect(generated).toContain('a + b + c');
  });

  it('should handle sequence expression with function calls', () => {
    const code = 'let result = (console.log("first"), console.log("second"), 42);';
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    expect(generated).toContain('console.log');
    expect(generated).toMatch(/['"]first['"]/);
    expect(generated).toMatch(/['"]second['"]/);
    expect(generated).toContain('42');
  });
});

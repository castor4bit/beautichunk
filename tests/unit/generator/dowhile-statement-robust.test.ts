import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';
import { HybridGenerator } from '../../../src/generator/hybrid-generator.js';

describe('DoWhileStatement robust error handling', () => {
  const generator = new HybridGenerator();

  it('should handle normal do-while loop', () => {
    const code = 'do { console.log("test"); } while (x < 10);';
    const ast = acorn.parse(code, { ecmaVersion: 2022 });
    const generated = generator.generate(ast);

    expect(generated).toContain('do');
    expect(generated).toContain('while');
    expect(generated).toContain('x < 10');
  });

  it('should handle malformed AST with ExpressionStatement test', () => {
    // Simulate malformed AST where test is an ExpressionStatement
    const ast = {
      type: 'Program',
      body: [
        {
          type: 'DoWhileStatement',
          body: {
            type: 'BlockStatement',
            body: [
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'console' },
                  arguments: [],
                },
              },
            ],
          },
          test: {
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '<',
              left: { type: 'Identifier', name: 'x' },
              right: { type: 'Literal', value: 10, raw: '10' },
            },
          },
        },
      ],
    };

    const generated = generator.generate(ast);
    expect(generated).toContain('do');
    expect(generated).toContain('while');
    expect(generated).toContain('x < 10');
  });

  it('should handle malformed AST with BlockStatement test', () => {
    // Simulate malformed AST where test is a BlockStatement (invalid but should not crash)
    const ast = {
      type: 'Program',
      body: [
        {
          type: 'DoWhileStatement',
          body: {
            type: 'BlockStatement',
            body: [],
          },
          test: {
            type: 'BlockStatement',
            body: [
              {
                type: 'ExpressionStatement',
                expression: { type: 'Literal', value: true, raw: 'true' },
              },
            ],
          },
        },
      ],
    };

    // Should fallback to true or handle gracefully
    const generated = generator.generate(ast);
    expect(generated).toContain('do');
    expect(generated).toContain('while');
  });

  it('should handle malformed AST with IfStatement test', () => {
    // Simulate malformed AST where test is an IfStatement (invalid but should not crash)
    const ast = {
      type: 'Program',
      body: [
        {
          type: 'DoWhileStatement',
          body: {
            type: 'BlockStatement',
            body: [],
          },
          test: {
            type: 'IfStatement',
            test: { type: 'Literal', value: true, raw: 'true' },
            consequent: {
              type: 'BlockStatement',
              body: [],
            },
            alternate: null,
          },
        },
      ],
    };

    // Should fallback to true or handle gracefully
    const generated = generator.generate(ast);
    expect(generated).toContain('do');
    expect(generated).toContain('while');
  });

  it('should handle malformed AST with EmptyStatement test', () => {
    // Simulate malformed AST where test is an EmptyStatement (invalid but should not crash)
    const ast = {
      type: 'Program',
      body: [
        {
          type: 'DoWhileStatement',
          body: {
            type: 'BlockStatement',
            body: [],
          },
          test: {
            type: 'EmptyStatement',
          },
        },
      ],
    };

    // Should fallback to true or handle gracefully
    const generated = generator.generate(ast);
    expect(generated).toContain('do');
    expect(generated).toContain('while');
  });

  it('should handle do-while in class with various edge cases', () => {
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
    expect(generated).toContain('do');
    expect(generated).toContain('while');
  });
});

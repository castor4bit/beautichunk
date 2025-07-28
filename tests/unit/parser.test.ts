import { describe, expect, it } from 'vitest';
import { Parser } from '../../src/parser';

describe('Parser', () => {
  describe('constructor', () => {
    it('should create a Parser instance', () => {
      const parser = new Parser();
      expect(parser).toBeInstanceOf(Parser);
    });
  });

  describe('parse', () => {
    it('should parse a simple JavaScript code', () => {
      const parser = new Parser();
      const code = 'const x = 1;';
      const ast = parser.parse(code);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('Program');
      expect(ast.body).toHaveLength(1);
    });

    it('should handle empty code', () => {
      const parser = new Parser();
      const ast = parser.parse('');

      expect(ast).toBeDefined();
      expect(ast.type).toBe('Program');
      expect(ast.body).toHaveLength(0);
    });

    it('should throw error for invalid JavaScript', () => {
      const parser = new Parser();
      const invalidCode = 'const x = ;';

      expect(() => parser.parse(invalidCode)).toThrow();
    });

    it('should parse variable declaration correctly', () => {
      const parser = new Parser();
      const code = 'const message = "Hello World";';
      const ast = parser.parse(code);

      expect(ast.body[0].type).toBe('VariableDeclaration');
      expect(ast.body[0].kind).toBe('const');
      expect(ast.body[0].declarations).toHaveLength(1);
      expect(ast.body[0].declarations[0].id.name).toBe('message');
    });

    it('should parse function declaration', () => {
      const parser = new Parser();
      const code = 'function greet(name) { return "Hello " + name; }';
      const ast = parser.parse(code);

      expect(ast.body[0].type).toBe('FunctionDeclaration');
      expect(ast.body[0].id.name).toBe('greet');
      expect(ast.body[0].params).toHaveLength(1);
      expect(ast.body[0].params[0].name).toBe('name');
    });

    it('should parse obfuscated code', () => {
      const parser = new Parser();
      const code = '(function(){var a=1,b=2;function c(){return a+b}console.log(c())})();';
      const ast = parser.parse(code);

      expect(ast.body[0].type).toBe('ExpressionStatement');
      expect(ast.body[0].expression.type).toBe('CallExpression');
      expect(ast.body[0].expression.callee.type).toBe('FunctionExpression');
    });

    it('should handle different sourceTypes', () => {
      const parser = new Parser({ sourceType: 'script' });
      const code = 'var x = 1;';
      const ast = parser.parse(code);

      expect(ast.sourceType).toBe('script');
    });
  });
});

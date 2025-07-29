import { describe, expect, it } from 'vitest';
import { Analyzer } from '../../src/analyzer';
import { Parser } from '../../src/parser';

describe('Analyzer', () => {
  describe('constructor', () => {
    it('should create an Analyzer instance', () => {
      const analyzer = new Analyzer();
      expect(analyzer).toBeInstanceOf(Analyzer);
    });
  });

  describe('analyze', () => {
    it('should analyze a simple variable declaration', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const code = 'const x = 1;';
      const ast = parser.parse(code);
      const result = analyzer.analyze(ast);

      expect(result).toBeDefined();
      expect(result.variables).toHaveLength(1);
      expect(result.variables[0].name).toBe('x');
      expect(result.variables[0].type).toBe('const');
    });

    it('should detect function declarations', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const code = 'function greet(name) { return "Hello " + name; }';
      const ast = parser.parse(code);
      const result = analyzer.analyze(ast);

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('greet');
      expect(result.functions[0].params).toHaveLength(1);
      expect(result.functions[0].params[0]).toBe('name');
    });

    it('should detect dependencies between functions', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const code = `
        function add(a, b) { return a + b; }
        function calculate() { return add(1, 2); }
      `;
      const ast = parser.parse(code);
      const result = analyzer.analyze(ast);

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.calculate).toContain('add');
    });

    it('should handle global variable usage', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const code = `
        const config = { apiUrl: 'https://api.example.com' };
        function fetchData() { return fetch(config.apiUrl); }
      `;
      const ast = parser.parse(code);
      const result = analyzer.analyze(ast);

      // Debug output
      // console.log('Global references:', result.globalReferences);

      expect(result.globalReferences.fetchData).toBeDefined();
      expect(result.globalReferences.fetchData).toContain('config');
    });

    it('should analyze nested scopes', () => {
      const parser = new Parser();
      const analyzer = new Analyzer();
      const code = `
        function outer() {
          const x = 1;
          function inner() {
            return x + 1;
          }
          return inner();
        }
      `;
      const ast = parser.parse(code);
      const result = analyzer.analyze(ast);

      expect(result.scopes).toBeDefined();
      expect(result.scopes.length).toBeGreaterThanOrEqual(3); // at least global, outer, inner
      // Find the outer and inner function scopes
      const outerScope = result.scopes.find((s) => s.functions.some((f) => f.name === 'outer'));
      const innerScopes = result.scopes.filter((s) => s.parent === outerScope);
      expect(innerScopes.length).toBeGreaterThan(0);
    });
  });
});

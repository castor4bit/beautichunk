import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';
import { HybridGenerator } from '../../../src/generator/hybrid-generator.js';

describe('Missing node types support', () => {
  const generator = new HybridGenerator();

  describe('ImportExpression', () => {
    it('should generate code for dynamic import', () => {
      const code = 'const module = import("./module.js");';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('import');
      expect(generated).toMatch(/['"]\.\/module\.js['"]/);
    });

    it('should handle dynamic import in async function', () => {
      const code = 'async function load() { const mod = await import("./lib.js"); }';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('async function');
      expect(generated).toContain('await import');
      expect(generated).toMatch(/['"]\.\/lib\.js['"]/);
    });
  });

  describe('Super', () => {
    it('should generate code for super in constructor', () => {
      const code = `
        class Child extends Parent {
          constructor() {
            super();
          }
        }
      `;
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('class Child extends Parent');
      expect(generated).toContain('super()');
    });

    it('should handle super method calls', () => {
      const code = `
        class Child extends Parent {
          method() {
            super.method();
          }
        }
      `;
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('super.method()');
    });

    it('should handle super property access', () => {
      const code = `
        class Child extends Parent {
          get prop() {
            return super.prop;
          }
        }
      `;
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('super.prop');
    });
  });

  describe('MetaProperty', () => {
    it('should generate code for import.meta', () => {
      const code = 'const url = import.meta.url;';
      const ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });
      const generated = generator.generate(ast);

      expect(generated).toContain('import.meta.url');
    });

    it('should handle new.target', () => {
      const code = `
        function Constructor() {
          if (new.target === Constructor) {
            console.log("called with new");
          }
        }
      `;
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('new.target');
    });
  });

  describe('ClassExpression', () => {
    it('should generate code for anonymous class expression', () => {
      const code = 'const MyClass = class { constructor() {} };';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('class');
      expect(generated).toContain('constructor()');
    });

    it('should handle named class expression', () => {
      const code = 'const MyClass = class NamedClass { method() {} };';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('class NamedClass');
      expect(generated).toContain('method()');
    });

    it('should handle class expression with extends', () => {
      const code = 'const Child = class extends Parent { constructor() { super(); } };';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('class extends Parent');
      expect(generated).toContain('super()');
    });
  });

  describe('EmptyStatement', () => {
    it('should handle empty statement', () => {
      const code = 'if (true) ;';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('if');
      expect(generated).toContain('true');
    });

    it('should handle empty statement in loop', () => {
      const code = 'for (let i = 0; i < 10; i++) ;';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('for');
      expect(generated).toContain('i < 10');
    });

    it('should handle standalone semicolon', () => {
      const code = 'let x = 1;;let y = 2;';
      const ast = acorn.parse(code, { ecmaVersion: 2022 });
      const generated = generator.generate(ast);

      expect(generated).toContain('let x = 1');
      expect(generated).toContain('let y = 2');
    });
  });
});

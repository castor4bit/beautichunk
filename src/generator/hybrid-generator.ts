import type { Node } from 'acorn';
import { BabelAdapter } from './adapters/babel-adapter.js';
import { EscodegenAdapter } from './adapters/escodegen-adapter.js';
import { ASTConverter } from './converter/ast-converter.js';
import type { CodeGenerator, GeneratorOptions } from './types.js';

/**
 * Hybrid code generator that uses escodegen for ES5/ES6 and @babel/generator for ES2022+
 */
export class HybridGenerator implements CodeGenerator {
  readonly name = 'hybrid';

  private escodegenAdapter: EscodegenAdapter;
  private babelAdapter: BabelAdapter;
  private converter: ASTConverter;

  constructor() {
    this.escodegenAdapter = new EscodegenAdapter();
    this.babelAdapter = new BabelAdapter();
    this.converter = new ASTConverter();
  }

  /**
   * Generate code from AST node
   * Tries escodegen first, falls back to @babel/generator if needed
   */
  generate(node: Node, options?: GeneratorOptions): string {
    // Try escodegen first for better performance
    if (this.escodegenAdapter.canGenerate(node)) {
      try {
        return this.escodegenAdapter.generate(node, options);
      } catch {
        // Fall through to babel generator
        console.debug(`Escodegen failed for ${node.type}, falling back to @babel/generator`);
      }
    }

    // Convert to Babel AST and use @babel/generator
    try {
      const babelAst = this.converter.convert(node);
      return this.babelAdapter.generate(babelAst, options);
    } catch (error) {
      console.error(`Failed to generate code for ${node.type}:`, error);
      throw new Error(`Code generation failed for ${node.type}: ${error}`);
    }
  }

  /**
   * Hybrid generator can handle any valid AST node
   */
  canGenerate(): boolean {
    return true;
  }
}

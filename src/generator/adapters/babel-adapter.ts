import generate from '@babel/generator';
import type { CodeGenerator, GeneratorOptions } from '../types';

/**
 * Adapter for @babel/generator
 */
export class BabelAdapter implements CodeGenerator {
  readonly name = '@babel/generator';

  /**
   * Babel can generate any valid AST
   */
  canGenerate(): boolean {
    return true;
  }

  /**
   * Generate code using @babel/generator
   */
  generate(node: any, options?: GeneratorOptions): string {
    const babelOptions = this.toBabelOptions(options);
    const result = generate(node, babelOptions);
    return result.code;
  }

  /**
   * Convert generator options to babel format
   */
  private toBabelOptions(options?: GeneratorOptions): any {
    if (!options) {
      return {
        retainLines: false,
        compact: false,
        concise: false,
        quotes: 'single',
      };
    }

    const format = options.format || {};

    return {
      retainLines: false,
      compact: format.compact || false,
      concise: false,
      quotes: format.quotes || 'single',
      comments: options.comment !== false,
      indent: {
        adjustMultilineComment: true,
        style: format.indent?.style || '  ',
      },
    };
  }
}

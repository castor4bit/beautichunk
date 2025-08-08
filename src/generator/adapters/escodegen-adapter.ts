import type { Node } from 'acorn';
import * as escodegen from 'escodegen';
import type { CodeGenerator, GeneratorOptions } from '../types';

/**
 * Adapter for escodegen generator
 */
export class EscodegenAdapter implements CodeGenerator {
  readonly name = 'escodegen';

  /**
   * Node types that escodegen cannot handle
   */
  private readonly unsupportedTypes = new Set([
    'ChainExpression',
    'StaticBlock',
    'PropertyDefinition',
    'PrivateIdentifier',
  ]);

  /**
   * Check if escodegen can generate code for this node
   */
  canGenerate(node: Node): boolean {
    return !this.containsUnsupportedNode(node);
  }

  /**
   * Generate code using escodegen
   */
  generate(node: Node, options?: GeneratorOptions): string {
    const escodegenOptions = this.toEscodegenOptions(options);
    return escodegen.generate(node as any, escodegenOptions);
  }

  /**
   * Check if node tree contains unsupported node types
   */
  private containsUnsupportedNode(node: Node): boolean {
    if (this.unsupportedTypes.has(node.type)) {
      return true;
    }

    // Recursively check child nodes
    for (const key in node) {
      const value = (node as any)[key];
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && item.type) {
              if (this.containsUnsupportedNode(item)) {
                return true;
              }
            }
          }
        } else if (value.type) {
          if (this.containsUnsupportedNode(value)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Convert generator options to escodegen format
   */
  private toEscodegenOptions(options?: GeneratorOptions): any {
    if (!options) {
      return {
        format: {
          indent: {
            style: '  ',
            base: 0,
          },
        },
      };
    }

    return {
      format: options.format || {
        indent: {
          style: '  ',
          base: 0,
        },
      },
      comment: options.comment,
      sourceMap: options.sourceMap,
      sourceMapWithCode: options.sourceMapWithCode,
    };
  }
}

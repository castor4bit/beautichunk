import type { Node } from 'acorn';

/**
 * Options for code generation
 */
export interface GeneratorOptions {
  format?: {
    indent?: {
      style?: string;
      base?: number;
    };
    quotes?: 'single' | 'double';
    newline?: string;
    space?: string;
    json?: boolean;
    renumber?: boolean;
    hexadecimal?: boolean;
    escapeless?: boolean;
    compact?: boolean;
    parentheses?: boolean;
    semicolons?: boolean;
    safeConcatenation?: boolean;
    preserveBlankLines?: boolean;
  };
  comment?: boolean;
  sourceMap?: boolean;
  sourceMapWithCode?: boolean;
}

/**
 * Code generator interface
 */
export interface CodeGenerator {
  /**
   * Generate code from AST node
   */
  generate(node: Node, options?: GeneratorOptions): string;

  /**
   * Check if this generator can handle the given node
   */
  canGenerate(node: Node): boolean;

  /**
   * Generator name for debugging
   */
  readonly name: string;
}

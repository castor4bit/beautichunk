import type { Options as AcornOptions, Program as AcornProgram, Node } from 'acorn';
import * as acorn from 'acorn';

export interface ParseOptions {
  ecmaVersion?: number;
  sourceType?: 'script' | 'module';
  locations?: boolean;
  ranges?: boolean;
  allowHashBang?: boolean;
  allowReturnOutsideFunction?: boolean;
}

export interface ParseError extends Error {
  pos: number;
  loc?: {
    line: number;
    column: number;
  };
}

export class Parser {
  private options: ParseOptions;

  constructor(options: ParseOptions = {}) {
    this.options = {
      ecmaVersion: 2022, // TODO: Support ES2023+ features
      sourceType: 'module',
      locations: true,
      ...options,
    };
    // TODO: Add support for JSX/TSX parsing
    // TODO: Consider using @babel/parser for TypeScript support
  }

  parse(code: string): AcornProgram {
    try {
      const acornOptions: AcornOptions = {
        ecmaVersion: this.options.ecmaVersion as AcornOptions['ecmaVersion'],
        sourceType: this.options.sourceType,
        locations: this.options.locations,
        ranges: this.options.ranges,
        allowHashBang: this.options.allowHashBang,
        allowReturnOutsideFunction: this.options.allowReturnOutsideFunction,
      };

      const ast = acorn.parse(code, acornOptions) as AcornProgram;
      return ast;
    } catch (error) {
      // TODO: Implement error recovery to continue parsing after syntax errors
      if (error instanceof SyntaxError) {
        const parseError = error as ParseError;
        throw new SyntaxError(`Parse error at position ${parseError.pos}: ${parseError.message}`);
      }
      throw error;
    }
  }

  parseExpression(code: string): Node {
    try {
      const acornOptions: AcornOptions = {
        ecmaVersion: this.options.ecmaVersion as AcornOptions['ecmaVersion'],
        sourceType: this.options.sourceType,
        locations: this.options.locations,
      };

      return acorn.parseExpressionAt(code, 0, acornOptions);
    } catch (error) {
      if (error instanceof SyntaxError) {
        const parseError = error as ParseError;
        throw new SyntaxError(`Parse error at position ${parseError.pos}: ${parseError.message}`);
      }
      throw error;
    }
  }
}

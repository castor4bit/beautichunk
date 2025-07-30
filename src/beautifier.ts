import jsBeautify from 'js-beautify';
import type { Chunk } from './chunker';

export interface BeautifierOptions {
  indentSize?: number;
  indentChar?: ' ' | '\t';
  preserveNewlines?: boolean;
  maxPreserveNewlines?: number;
  wrapLineLength?: number;
  braceStyle?: 'collapse' | 'expand' | 'end-expand' | 'none';
  spaceInParen?: boolean;
  spaceInEmptyParen?: boolean;
  jslintHappy?: boolean;
  unindentChainedMethods?: boolean;
  keepArrayIndentation?: boolean;
  breakChainedMethods?: boolean;
  endWithNewline?: boolean;
}

export class Beautifier {
  private options: BeautifierOptions;

  constructor(options: BeautifierOptions = {}) {
    this.options = {
      indentSize: 2,
      indentChar: ' ',
      preserveNewlines: true,
      maxPreserveNewlines: 10,
      wrapLineLength: 0, // 0 means no wrapping
      braceStyle: 'collapse',
      spaceInParen: false,
      spaceInEmptyParen: false,
      jslintHappy: false,
      unindentChainedMethods: false,
      keepArrayIndentation: false,
      breakChainedMethods: false,
      endWithNewline: true,
      ...options,
    };
  }

  beautify(code: string): string {
    if (!code || code.trim() === '') {
      return '';
    }

    try {
      // Convert our options to js-beautify format
      const jsBeautifyOptions = {
        indent_size: this.options.indentSize,
        indent_char: this.options.indentChar,
        preserve_newlines: this.options.preserveNewlines,
        max_preserve_newlines: this.options.maxPreserveNewlines,
        wrap_line_length: this.options.wrapLineLength,
        brace_style: this.options.braceStyle,
        space_in_paren: this.options.spaceInParen,
        space_in_empty_paren: this.options.spaceInEmptyParen,
        jslint_happy: this.options.jslintHappy,
        unindent_chained_methods: this.options.unindentChainedMethods,
        keep_array_indentation: this.options.keepArrayIndentation,
        break_chained_methods: this.options.breakChainedMethods,
        end_with_newline: this.options.endWithNewline,
        // Additional js-beautify specific options
        indent_level: 0,
        space_after_anon_function: true,
        space_before_conditional: true,
        eval_code: false,
        unescape_strings: false,
      };

      return jsBeautify.js(code, jsBeautifyOptions);
    } catch (error) {
      // If beautification fails, return the original code
      // This ensures the process doesn't break on syntax errors
      console.warn('Beautification failed:', error);
      return code;
    }
  }

  beautifyChunk(chunk: Chunk): Chunk {
    const beautifiedContent = this.beautify(chunk.content);
    const newSize = Buffer.byteLength(beautifiedContent, 'utf8');

    return {
      ...chunk,
      content: beautifiedContent,
      size: newSize,
    };
  }
}

import { describe, expect, it } from 'vitest';
import { Analyzer } from '../../src/analyzer';
import { Chunker } from '../../src/chunker';
import { Parser } from '../../src/parser';

describe('ES2022+ Support Integration', () => {
  const parser = new Parser();
  const analyzer = new Analyzer();
  const chunker = new Chunker();

  it('should process files with optional chaining', () => {
    const code = `
      const userInfo = user?.profile?.name;
      const result = api?.getData?.() ?? 'default';
      
      function processData(data) {
        return data?.items?.map(item => item.value) || [];
      }
    `;

    const ast = parser.parse(code);
    const analysis = analyzer.analyze(ast);
    const chunks = chunker.chunk(ast, analysis);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toContain('user?.profile?.name');
    expect(chunks[0].content).toContain('api?.getData?.()');
    expect(chunks[0].content).toContain('??');
  });

  it('should process classes with static blocks and private fields', () => {
    const code = `
      class DataProcessor {
        #privateKey = 'secret';
        static #sharedSecret = 'shared';
        
        static {
          console.log('Static initialization');
          this.#sharedSecret = process.env.SECRET || 'default';
        }
        
        #privateMethod() {
          return this.#privateKey;
        }
        
        publicMethod() {
          return this.#privateMethod();
        }
      }
    `;

    const ast = parser.parse(code);
    const analysis = analyzer.analyze(ast);
    const chunks = chunker.chunk(ast, analysis);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toContain('class DataProcessor');
    expect(chunks[0].content).toContain('#privateKey');
    expect(chunks[0].content).toContain('static {');
    expect(chunks[0].content).toContain('#privateMethod');
  });

  it('should handle mixed ES5 and ES2022+ syntax', () => {
    const code = `
      // Legacy function
      function oldStyleFunction() {
        var x = 1;
        return x * 2;
      }
      
      // Modern syntax
      const modernFunction = async (data) => {
        const result = await fetch(data?.url ?? '/default');
        return result?.json?.() ?? {};
      };
      
      // Class with both old and new features
      class MixedClass {
        constructor() {
          this.publicProp = 'public';
        }
        
        #privateProp = 'private';
        
        static {
          console.log('Static block');
        }
        
        getAll() {
          return {
            public: this.publicProp,
            private: this.#privateProp
          };
        }
      }
    `;

    const ast = parser.parse(code);
    const analysis = analyzer.analyze(ast);
    const chunks = chunker.chunk(ast, analysis);

    expect(chunks).toHaveLength(1);

    // Check that both old and new syntax are preserved
    expect(chunks[0].content).toContain('function oldStyleFunction()');
    expect(chunks[0].content).toContain('var x = 1');
    expect(chunks[0].content).toContain('const modernFunction');
    expect(chunks[0].content).toContain('data?.url');
    expect(chunks[0].content).toContain('??');
    expect(chunks[0].content).toContain('#privateProp');
    expect(chunks[0].content).toContain('static {');
  });

  it('should handle real-world ES2022+ code', () => {
    const code = `
      class APIClient {
        #baseURL = 'https://api.example.com';
        #authToken = null;
        
        static {
          // Initialize default headers
          this.defaultHeaders = {
            'Content-Type': 'application/json'
          };
        }
        
        async request(endpoint, options = {}) {
          const url = \`\${this.#baseURL}\${endpoint}\`;
          const headers = {
            ...APIClient.defaultHeaders,
            ...options.headers,
            ...(this.#authToken && { Authorization: \`Bearer \${this.#authToken}\` })
          };
          
          try {
            const response = await fetch(url, {
              ...options,
              headers
            });
            
            const data = await response?.json?.();
            return data ?? null;
          } catch (error) {
            console.error(\`Request failed: \${error?.message ?? 'Unknown error'}\`);
            return null;
          }
        }
        
        setAuth(token) {
          this.#authToken = token;
        }
      }
      
      const client = new APIClient();
      const data = await client.request('/users')?.data?.users ?? [];
    `;

    const ast = parser.parse(code);
    const analysis = analyzer.analyze(ast);
    const chunks = chunker.chunk(ast, analysis);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toContain('class APIClient');
    expect(chunks[0].content).toContain('#baseURL');
    expect(chunks[0].content).toContain('#authToken');
    expect(chunks[0].content).toContain('static {');
    expect(chunks[0].content).toContain('response?.json?.()');
    expect(chunks[0].content).toContain('error?.message');
    expect(chunks[0].content).toContain('??');
  });
});

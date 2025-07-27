import { Beautichunk, BeautichunkOptions } from '../../src/index';

describe('Beautichunk', () => {
  describe('constructor', () => {
    it('should create an instance with default options', () => {
      const options: BeautichunkOptions = {
        input: 'test.js',
        output: './output',
      };

      const beautichunk = new Beautichunk(options);
      expect(beautichunk).toBeInstanceOf(Beautichunk);
    });

    it('should accept custom options', () => {
      const options: BeautichunkOptions = {
        input: 'test.js',
        output: './custom-output',
        maxChunkSize: 512 * 1024,
        strategy: 'aggressive',
        generateSourceMaps: true,
        verbose: true,
      };

      const beautichunk = new Beautichunk(options);
      expect(beautichunk).toBeInstanceOf(Beautichunk);
    });
  });

  describe('process', () => {
    it('should throw not implemented error', async () => {
      const options: BeautichunkOptions = {
        input: 'test.js',
        output: './output',
      };

      const beautichunk = new Beautichunk(options);
      await expect(beautichunk.process()).rejects.toThrow('Not implemented yet');
    });
  });
});
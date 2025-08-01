import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Chunk } from './chunker.js';

export interface GeneratorOptions {
  outputDir?: string;
  generateSourceMaps?: boolean;
  loaderTemplate?: string;
}

export interface ChunkMetadata {
  id: string;
  filename: string;
  dependencies: string[];
  exports: string[];
  size: number;
  order: number;
}

export interface Manifest {
  version: string;
  chunks: ChunkMetadata[];
  entryPoint: string;
  totalSize: number;
  generatedAt: string;
}

export class Generator {
  private options: Required<GeneratorOptions>;

  constructor(options: GeneratorOptions = {}) {
    this.options = {
      outputDir: options.outputDir || './output',
      generateSourceMaps: options.generateSourceMaps ?? false,
      loaderTemplate: options.loaderTemplate || '',
    };
  }

  async generate(chunks: Chunk[]): Promise<void> {
    // Create output directory
    await fs.mkdir(this.options.outputDir, { recursive: true });

    // Generate chunk files
    for (const chunk of chunks) {
      const filename = `${chunk.id}.js`;
      const filepath = path.join(this.options.outputDir, filename);
      await fs.writeFile(filepath, chunk.content, 'utf-8');
    }

    // Generate manifest
    const manifest = this.generateManifest(chunks);
    const manifestPath = path.join(this.options.outputDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    // Generate loader
    const loaderContent = await this.getLoaderContent();
    const loaderPath = path.join(this.options.outputDir, 'loader.js');
    await fs.writeFile(loaderPath, loaderContent, 'utf-8');
  }

  generateManifest(chunks: Chunk[]): Manifest {
    const chunkMetadata: ChunkMetadata[] = chunks.map((chunk) => ({
      id: chunk.id,
      filename: `${chunk.id}.js`,
      dependencies: chunk.dependencies,
      exports: chunk.exports,
      size: chunk.size,
      order: chunk.order,
    }));

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);

    return {
      version: '1.0.0',
      chunks: chunkMetadata,
      entryPoint: 'loader.js',
      totalSize,
      generatedAt: new Date().toISOString(),
    };
  }

  generateLoader(): string {
    return `(function() {
  'use strict';

  const loadedChunks = new Set();
  const chunkExports = {};

  async function loadManifest() {
    try {
      const response = await fetch('./manifest.json');
      if (!response.ok) {
        throw new Error(\`Failed to load manifest: \${response.status}\`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading manifest:', error);
      throw error;
    }
  }

  async function loadChunk(chunkId) {
    if (loadedChunks.has(chunkId)) {
      return chunkExports[chunkId];
    }

    try {
      const script = document.createElement('script');
      script.src = \`./$\{chunkId}.js\`;
      script.async = false;

      const loadPromise = new Promise((resolve, reject) => {
        script.onload = () => {
          loadedChunks.add(chunkId);
          resolve(chunkExports[chunkId]);
        };
        script.onerror = () => {
          reject(new Error(\`Failed to load chunk: \${chunkId}\`));
        };
      });

      document.head.appendChild(script);
      return await loadPromise;
    } catch (error) {
      console.error(\`Error loading chunk \${chunkId}:\`, error);
      throw error;
    }
  }

  async function loadChunkWithDependencies(chunk, manifest) {
    // Load dependencies first
    for (const depId of chunk.dependencies) {
      const depChunk = manifest.chunks.find(c => c.id === depId);
      if (depChunk) {
        await loadChunkWithDependencies(depChunk, manifest);
      }
    }

    // Load the chunk itself
    await loadChunk(chunk.id);
  }

  async function loadAllChunks() {
    try {
      const manifest = await loadManifest();
      console.log('Loading', manifest.chunks.length, 'chunks...');

      // Sort chunks by order
      const sortedChunks = [...manifest.chunks].sort((a, b) => a.order - b.order);

      // Load chunks in order, respecting dependencies
      for (const chunk of sortedChunks) {
        await loadChunkWithDependencies(chunk, manifest);
      }

      console.log('All chunks loaded successfully');
      
      // Dispatch custom event to signal completion
      window.dispatchEvent(new CustomEvent('beautichunk:loaded', {
        detail: { manifest, exports: chunkExports }
      }));
    } catch (error) {
      console.error('Failed to load chunks:', error);
      window.dispatchEvent(new CustomEvent('beautichunk:error', {
        detail: { error }
      }));
    }
  }

  // Make chunk exports available globally
  window.__beautichunk__ = {
    loadedChunks,
    chunkExports,
    loadChunk,
    loadAllChunks,
  };

  // Auto-load if not in manual mode
  if (!window.__beautichunk_manual__) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadAllChunks);
    } else {
      loadAllChunks();
    }
  }
})();`;
  }

  private async getLoaderContent(): Promise<string> {
    if (this.options.loaderTemplate) {
      try {
        return await fs.readFile(this.options.loaderTemplate, 'utf-8');
      } catch (error) {
        console.warn(`Failed to read custom loader template: ${error}. Using default loader.`);
      }
    }
    return this.generateLoader();
  }
}

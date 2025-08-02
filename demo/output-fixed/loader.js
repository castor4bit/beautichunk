(function() {
  'use strict';

  const loadedChunks = new Set();
  const chunkExports = {};

  async function loadManifest() {
    try {
      const response = await fetch('./manifest.json');
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status}`);
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
      script.src = `./${chunkId}.js`;
      script.async = false;

      const loadPromise = new Promise((resolve, reject) => {
        script.onload = () => {
          loadedChunks.add(chunkId);
          resolve(chunkExports[chunkId]);
        };
        script.onerror = () => {
          reject(new Error(`Failed to load chunk: ${chunkId}`));
        };
      });

      document.head.appendChild(script);
      return await loadPromise;
    } catch (error) {
      console.error(`Error loading chunk ${chunkId}:`, error);
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
})();
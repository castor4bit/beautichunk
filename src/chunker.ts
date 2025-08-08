import type { Node, Program } from 'acorn';
import type { AnalysisResult } from './analyzer';
import { HybridGenerator } from './generator/hybrid-generator';
import type { CodeGenerator } from './generator/types';

export interface ChunkerOptions {
  strategy: 'aggressive' | 'conservative' | 'auto';
  maxChunkSize: number;
  minChunkSize?: number;
  preserveComments?: boolean;
}

export interface Chunk {
  id: string;
  content: string;
  dependencies: string[];
  exports: string[];
  size: number;
  order: number;
}

interface CodeSegment {
  node: Node;
  code: string;
  size: number;
  dependencies: Set<string>;
  exports: Set<string>;
}

export class Chunker {
  private options: ChunkerOptions;
  protected chunkCounter: number;
  private generator: CodeGenerator;

  constructor(options: Partial<ChunkerOptions> = {}, generator?: CodeGenerator) {
    this.options = {
      strategy: options.strategy || 'auto',
      maxChunkSize: options.maxChunkSize || 256 * 1024, // 256KB default
      minChunkSize: options.minChunkSize,
      preserveComments: options.preserveComments ?? true,
    };
    this.chunkCounter = 0;
    this.generator = generator || new HybridGenerator();
  }

  chunk(ast: Program, analysis: AnalysisResult): Chunk[] {
    // Extract code segments from AST
    const segments = this.extractSegments(ast, analysis);

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(segments, analysis);

    // Apply chunking strategy
    const chunkGroups = this.applyStrategy(segments, dependencyGraph);

    // Generate chunks
    return this.generateChunks(chunkGroups, dependencyGraph);
  }

  private extractSegments(ast: Program, analysis: AnalysisResult): CodeSegment[] {
    const segments: CodeSegment[] = [];

    for (const node of ast.body) {
      let code: string;
      try {
        code = this.generator.generate(node);
      } catch (error) {
        // Handle generation errors
        console.warn(`Warning: Unable to generate code for ${node.type} node. Skipping.`, error);
        continue; // Skip this segment
      }
      const size = Buffer.byteLength(code, 'utf8');
      const nodeExports = new Set<string>();
      const nodeDependencies = new Set<string>();

      // Extract exports from this segment
      switch (node.type) {
        case 'FunctionDeclaration':
          if (node.id) {
            nodeExports.add(node.id.name);
          }
          break;
        case 'VariableDeclaration':
          for (const declarator of node.declarations) {
            if (declarator.id.type === 'Identifier') {
              nodeExports.add(declarator.id.name);
            }
          }
          break;
        // TODO: Add support for ES6 modules
        // case 'ExportNamedDeclaration':
        // case 'ExportDefaultDeclaration':
        // case 'ImportDeclaration':
      }

      // Find dependencies for functions in this segment
      for (const func of analysis.functions) {
        if (nodeExports.has(func.name)) {
          const deps = analysis.dependencies[func.name] || [];
          deps.forEach((dep) => nodeDependencies.add(dep));
        }
      }

      segments.push({
        node,
        code,
        size,
        dependencies: nodeDependencies,
        exports: nodeExports,
      });
    }

    return segments;
  }

  private buildDependencyGraph(
    segments: CodeSegment[],
    _analysis: AnalysisResult,
  ): Map<CodeSegment, Set<CodeSegment>> {
    const graph = new Map<CodeSegment, Set<CodeSegment>>();

    for (const segment of segments) {
      const dependencies = new Set<CodeSegment>();

      for (const dep of segment.dependencies) {
        const depSegment = segments.find((s) => s.exports.has(dep));
        if (depSegment && depSegment !== segment) {
          dependencies.add(depSegment);
        }
      }

      graph.set(segment, dependencies);
    }

    return graph;
  }

  private applyStrategy(
    segments: CodeSegment[],
    dependencyGraph: Map<CodeSegment, Set<CodeSegment>>,
  ): CodeSegment[][] {
    switch (this.options.strategy) {
      case 'aggressive':
        return this.aggressiveStrategy(segments);
      case 'conservative':
        return this.conservativeStrategy(segments, dependencyGraph);
      default:
        return this.autoStrategy(segments, dependencyGraph);
    }
  }

  private aggressiveStrategy(segments: CodeSegment[]): CodeSegment[][] {
    const chunks: CodeSegment[][] = [];
    let currentChunk: CodeSegment[] = [];
    let currentSize = 0;

    for (const segment of segments) {
      if (currentSize + segment.size > this.options.maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }
      currentChunk.push(segment);
      currentSize += segment.size;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private conservativeStrategy(
    segments: CodeSegment[],
    dependencyGraph: Map<CodeSegment, Set<CodeSegment>>,
  ): CodeSegment[][] {
    // Find strongly connected components (circular dependencies)
    const sccs = this.findStronglyConnectedComponents(segments, dependencyGraph);

    // Build a map of which SCC each segment belongs to
    const segmentToScc = new Map<CodeSegment, CodeSegment[]>();
    for (const scc of sccs) {
      for (const segment of scc) {
        segmentToScc.set(segment, scc);
      }
    }

    // Merge SCCs that have dependencies
    const mergedSccs: CodeSegment[][] = [];
    const processedSccs = new Set<CodeSegment[]>();

    for (const scc of sccs) {
      if (processedSccs.has(scc)) continue;

      const merged = [...scc];
      const toProcess = [scc];
      processedSccs.add(scc);

      while (toProcess.length > 0) {
        const currentScc = toProcess.pop();
        if (!currentScc) continue;

        // Find all segments that depend on or are depended on by current SCC
        for (const segment of currentScc) {
          // Check dependencies
          const deps = dependencyGraph.get(segment) || new Set();
          for (const dep of deps) {
            const depScc = segmentToScc.get(dep);
            if (depScc && !processedSccs.has(depScc)) {
              merged.push(...depScc);
              toProcess.push(depScc);
              processedSccs.add(depScc);
            }
          }

          // Check reverse dependencies
          for (const [otherSegment, otherDeps] of dependencyGraph) {
            if (otherDeps.has(segment)) {
              const otherScc = segmentToScc.get(otherSegment);
              if (otherScc && !processedSccs.has(otherScc)) {
                merged.push(...otherScc);
                toProcess.push(otherScc);
                processedSccs.add(otherScc);
              }
            }
          }
        }
      }

      const totalSize = merged.reduce((sum, seg) => sum + seg.size, 0);

      if (totalSize <= this.options.maxChunkSize) {
        mergedSccs.push(merged);
      } else {
        // If merged is too large, keep original SCCs
        for (const originalScc of sccs) {
          if (merged.includes(originalScc[0])) {
            const sccSize = originalScc.reduce((sum, seg) => sum + seg.size, 0);
            if (sccSize <= this.options.maxChunkSize) {
              mergedSccs.push(originalScc);
            } else {
              // If SCC is still too large, fall back to aggressive strategy
              const subChunks = this.aggressiveStrategy(originalScc);
              mergedSccs.push(...subChunks);
            }
          }
        }
      }
    }

    return mergedSccs;
  }

  private autoStrategy(
    segments: CodeSegment[],
    dependencyGraph: Map<CodeSegment, Set<CodeSegment>>,
  ): CodeSegment[][] {
    // Balance between size and dependencies
    const sccs = this.findStronglyConnectedComponents(segments, dependencyGraph);
    const chunks: CodeSegment[][] = [];
    let currentChunk: CodeSegment[] = [];
    let currentSize = 0;

    for (const scc of sccs) {
      const sccSize = scc.reduce((sum, seg) => sum + seg.size, 0);

      if (currentSize + sccSize > this.options.maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }

      if (sccSize > this.options.maxChunkSize) {
        // SCC is too large, split it
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = [];
          currentSize = 0;
        }
        const subChunks = this.aggressiveStrategy(scc);
        chunks.push(...subChunks);
      } else {
        currentChunk.push(...scc);
        currentSize += sccSize;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    // Apply minChunkSize if specified
    if (this.options.minChunkSize) {
      return this.mergeSmallChunks(chunks);
    }

    return chunks;
  }

  private findStronglyConnectedComponents(
    segments: CodeSegment[],
    dependencyGraph: Map<CodeSegment, Set<CodeSegment>>,
  ): CodeSegment[][] {
    // Tarjan's algorithm for finding SCCs
    const index = new Map<CodeSegment, number>();
    const lowlink = new Map<CodeSegment, number>();
    const onStack = new Set<CodeSegment>();
    const stack: CodeSegment[] = [];
    const sccs: CodeSegment[][] = [];
    let currentIndex = 0;

    const strongConnect = (v: CodeSegment) => {
      index.set(v, currentIndex);
      lowlink.set(v, currentIndex);
      currentIndex++;
      stack.push(v);
      onStack.add(v);

      const dependencies = dependencyGraph.get(v) || new Set();
      for (const w of dependencies) {
        if (!index.has(w)) {
          strongConnect(w);
          const vLowlink = lowlink.get(v) ?? currentIndex;
          const wLowlink = lowlink.get(w) ?? currentIndex;
          lowlink.set(v, Math.min(vLowlink, wLowlink));
        } else if (onStack.has(w)) {
          const vLowlink = lowlink.get(v) ?? currentIndex;
          const wIndex = index.get(w) ?? currentIndex;
          lowlink.set(v, Math.min(vLowlink, wIndex));
        }
      }

      if (lowlink.get(v) === index.get(v)) {
        const scc: CodeSegment[] = [];
        let w: CodeSegment | undefined;
        do {
          w = stack.pop();
          if (w) {
            onStack.delete(w);
            scc.push(w);
          }
        } while (w && w !== v);
        sccs.push(scc);
      }
    };

    for (const segment of segments) {
      if (!index.has(segment)) {
        strongConnect(segment);
      }
    }

    return sccs;
  }

  private mergeSmallChunks(chunks: CodeSegment[][]): CodeSegment[][] {
    const merged: CodeSegment[][] = [];
    let currentMerged: CodeSegment[] = [];
    let currentSize = 0;

    for (const chunk of chunks) {
      const chunkSize = chunk.reduce((sum, seg) => sum + seg.size, 0);

      if (this.options.minChunkSize && chunkSize >= this.options.minChunkSize) {
        if (currentMerged.length > 0) {
          merged.push(currentMerged);
          currentMerged = [];
          currentSize = 0;
        }
        merged.push(chunk);
      } else {
        if (currentSize + chunkSize > this.options.maxChunkSize && currentMerged.length > 0) {
          merged.push(currentMerged);
          currentMerged = [];
          currentSize = 0;
        }
        currentMerged.push(...chunk);
        currentSize += chunkSize;
      }
    }

    if (currentMerged.length > 0) {
      merged.push(currentMerged);
    }

    return merged;
  }

  private generateChunks(
    chunkGroups: CodeSegment[][],
    dependencyGraph: Map<CodeSegment, Set<CodeSegment>>,
  ): Chunk[] {
    const chunks: Chunk[] = [];
    const segmentToChunk = new Map<CodeSegment, string>();

    // First pass: create chunks and map segments to chunk IDs
    for (let i = 0; i < chunkGroups.length; i++) {
      const group = chunkGroups[i];
      const chunkId = `chunk_${String(this.chunkCounter++).padStart(3, '0')}`;

      const content = group.map((seg) => seg.code).join('\n');
      const exports: string[] = [];
      const size = Buffer.byteLength(content, 'utf8');

      for (const segment of group) {
        segmentToChunk.set(segment, chunkId);
        segment.exports.forEach((exp) => exports.push(exp));
      }

      chunks.push({
        id: chunkId,
        content,
        dependencies: [], // Will be filled in second pass
        exports,
        size,
        order: i,
      });
    }

    // Second pass: calculate dependencies between chunks
    for (let i = 0; i < chunkGroups.length; i++) {
      const group = chunkGroups[i];
      const chunk = chunks[i];
      const chunkDeps = new Set<string>();

      for (const segment of group) {
        const segmentDeps = dependencyGraph.get(segment) || new Set();
        for (const depSegment of segmentDeps) {
          const depChunkId = segmentToChunk.get(depSegment);
          if (depChunkId && depChunkId !== chunk.id) {
            chunkDeps.add(depChunkId);
          }
        }
      }

      chunk.dependencies = Array.from(chunkDeps);
    }

    return chunks;
  }
}

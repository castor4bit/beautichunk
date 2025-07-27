export interface ChunkInfo {
  id: number;
  filename: string;
  size: number;
  dependencies: number[];
  exports: string[];
  imports: string[];
}

export interface ChunkableNode {
  type: string;
  start: number;
  end: number;
  chunkId?: number;
  dependencies: string[];
  size: number;
}

export interface ProcessingResult {
  chunks: ChunkInfo[];
  loaderFile: string;
  totalSize: number;
  chunkCount: number;
}

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  embedding: number[];
  metadata: {
    page: number;
    chunkIndex: number;
    startIndex: number;
    endIndex: number;
  };
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

interface VectorStoreData {
  chunks: { [id: string]: DocumentChunk };
  documentChunks: { [documentId: string]: string[] }; // documentId -> chunkIds
}

export class VectorStoreService {
  private dataPath: string;
  private data: VectorStoreData;

  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'vector-store.json');
    this.data = this.loadData();
    console.log('向量存储初始化完成:', this.dataPath);
  }

  private loadData(): VectorStoreData {
    try {
      if (fs.existsSync(this.dataPath)) {
        const content = fs.readFileSync(this.dataPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('加载向量数据失败:', error);
    }

    return {
      chunks: {},
      documentChunks: {},
    };
  }

  private saveData(): void {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存向量数据失败:', error);
    }
  }

  /**
   * 添加文档块
   */
  addChunk(chunk: DocumentChunk): void {
    this.data.chunks[chunk.id] = chunk;
    
    if (!this.data.documentChunks[chunk.documentId]) {
      this.data.documentChunks[chunk.documentId] = [];
    }
    
    if (!this.data.documentChunks[chunk.documentId].includes(chunk.id)) {
      this.data.documentChunks[chunk.documentId].push(chunk.id);
    }
    
    this.saveData();
  }

  /**
   * 批量添加文档块
   */
  addChunks(chunks: DocumentChunk[]): void {
    console.log('批量添加文档块:', chunks.length, '个');
    
    for (const chunk of chunks) {
      this.data.chunks[chunk.id] = chunk;
      
      if (!this.data.documentChunks[chunk.documentId]) {
        this.data.documentChunks[chunk.documentId] = [];
      }
      
      if (!this.data.documentChunks[chunk.documentId].includes(chunk.id)) {
        this.data.documentChunks[chunk.documentId].push(chunk.id);
      }
    }
    
    console.log('保存向量数据到:', this.dataPath);
    this.saveData();
    console.log('向量数据保存完成，当前统计:', this.getStats());
  }

  /**
   * 获取文档的所有块
   */
  getDocumentChunks(documentId: string): DocumentChunk[] {
    const chunkIds = this.data.documentChunks[documentId] || [];
    console.log(`获取文档 ${documentId} 的块:`, {
      chunkIds: chunkIds.length,
      exists: !!this.data.documentChunks[documentId],
    });
    
    const chunks = chunkIds
      .map(id => this.data.chunks[id])
      .filter(chunk => chunk !== undefined);
    
    console.log(`实际返回的块数量:`, chunks.length);
    
    return chunks;
  }

  /**
   * 删除文档的所有块
   */
  deleteDocumentChunks(documentId: string): void {
    const chunkIds = this.data.documentChunks[documentId] || [];
    
    for (const chunkId of chunkIds) {
      delete this.data.chunks[chunkId];
    }
    
    delete this.data.documentChunks[documentId];
    this.saveData();
  }

  /**
   * 向量相似度搜索
   */
  search(
    queryEmbedding: number[],
    documentIds?: string[],
    topK: number = 5,
    minSimilarity: number = 0.3
  ): SearchResult[] {
    console.log('向量搜索开始:', {
      queryDim: queryEmbedding.length,
      documentIds,
      topK,
      minSimilarity,
      totalChunks: Object.keys(this.data.chunks).length,
      totalDocs: Object.keys(this.data.documentChunks).length,
    });

    // 获取要搜索的块
    let chunksToSearch: DocumentChunk[] = [];
    
    if (documentIds && documentIds.length > 0) {
      // 只搜索指定文档
      console.log('搜索指定文档:', documentIds);
      for (const docId of documentIds) {
        const docChunks = this.getDocumentChunks(docId);
        console.log(`文档 ${docId} 的块数量:`, docChunks.length);
        chunksToSearch.push(...docChunks);
      }
    } else {
      // 搜索所有文档
      console.log('搜索所有文档');
      chunksToSearch = Object.values(this.data.chunks);
    }

    console.log('待搜索的块总数:', chunksToSearch.length);

    if (chunksToSearch.length === 0) {
      console.warn('没有可搜索的文档块！');
      console.log('当前存储的文档:', Object.keys(this.data.documentChunks));
      return [];
    }

    // 计算相似度
    const results: SearchResult[] = chunksToSearch.map(chunk => {
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      return { chunk, similarity };
    });

    console.log('相似度计算完成，结果数量:', results.length);
    console.log('相似度范围:', {
      max: Math.max(...results.map(r => r.similarity)),
      min: Math.min(...results.map(r => r.similarity)),
      avg: results.reduce((sum, r) => sum + r.similarity, 0) / results.length,
    });

    // 过滤和排序
    const filtered = results.filter(r => r.similarity >= minSimilarity);
    console.log(`过滤后（>= ${minSimilarity}）:`, filtered.length, '个结果');

    const sorted = filtered.sort((a, b) => b.similarity - a.similarity);
    const topResults = sorted.slice(0, topK);
    
    console.log('返回 Top', topK, '结果:', topResults.length, '个');
    if (topResults.length > 0) {
      console.log('Top 结果相似度:', topResults.map(r => r.similarity.toFixed(3)));
    }

    return topResults;
  }

  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalChunks: number;
    totalDocuments: number;
    documentsInfo: Array<{ documentId: string; chunkCount: number }>;
  } {
    const documentsInfo = Object.entries(this.data.documentChunks).map(
      ([documentId, chunkIds]) => ({
        documentId,
        chunkCount: chunkIds.length,
      })
    );

    return {
      totalChunks: Object.keys(this.data.chunks).length,
      totalDocuments: Object.keys(this.data.documentChunks).length,
      documentsInfo,
    };
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.data = {
      chunks: {},
      documentChunks: {},
    };
    this.saveData();
  }
}

export const vectorStoreService = new VectorStoreService();

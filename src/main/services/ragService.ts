import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { documentService, DocumentMetadata } from './documentService';
import { embeddingService } from './embeddingService';
import { vectorStoreService, DocumentChunk } from './vectorStoreService';
import { aiService } from './aiService';

export interface RAGDocument extends DocumentMetadata {
  status: 'processing' | 'ready' | 'error';
  error?: string;
}

export interface RAGAnswer {
  answer: string;
  sources: Array<{
    documentId: string;
    documentName: string;
    page: number;
    content: string;
    similarity: number;
  }>;
}

interface RAGIndexData {
  documents: { [id: string]: RAGDocument };
}

export class RAGService {
  private indexPath: string;
  private indexData: RAGIndexData;

  constructor() {
    this.indexPath = path.join(app.getPath('userData'), 'rag-index.json');
    this.indexData = this.loadIndex();
    console.log('RAG 服务初始化完成');
  }

  private loadIndex(): RAGIndexData {
    try {
      if (fs.existsSync(this.indexPath)) {
        const content = fs.readFileSync(this.indexPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('加载 RAG 索引失败:', error);
    }

    return { documents: {} };
  }

  private saveIndex(): void {
    try {
      const dir = path.dirname(this.indexPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.indexPath, JSON.stringify(this.indexData, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存 RAG 索引失败:', error);
    }
  }

  /**
   * 上传并索引文档
   */
  async uploadDocument(
    filePath: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<string> {
    const documentId = this.generateDocumentId();
    const fileName = path.basename(filePath);

    try {
      // 1. 保存文档
      onProgress?.(10, '保存文档...');
      const savedPath = await documentService.saveDocument(filePath, documentId);
      const fileSize = documentService.getFileSize(savedPath);

      // 2. 创建文档记录
      const document: RAGDocument = {
        id: documentId,
        name: fileName,
        path: savedPath,
        totalPages: 0,
        totalChunks: 0,
        fileSize,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'processing',
      };

      this.indexData.documents[documentId] = document;
      this.saveIndex();

      // 3. 解析 PDF
      onProgress?.(20, '解析 PDF...');
      const parsed = await documentService.parsePDF(savedPath);
      
      document.totalPages = parsed.metadata.totalPages;
      this.saveIndex();

      // 4. 文本分块
      onProgress?.(40, '文本分块...');
      const chunks = this.chunkDocument(parsed.text, documentId, fileName, parsed.pages);
      
      document.totalChunks = chunks.length;
      this.saveIndex();

      // 5. 向量化
      onProgress?.(50, `向量化文本块 (0/${chunks.length})...`);
      const texts = chunks.map(c => c.content);
      const embeddings = await embeddingService.embedBatch(texts);

      // 6. 保存向量
      onProgress?.(80, '保存向量数据...');
      const chunksWithEmbeddings: DocumentChunk[] = chunks.map((chunk, i) => ({
        ...chunk,
        embedding: embeddings[i],
      }));

      vectorStoreService.addChunks(chunksWithEmbeddings);

      // 7. 完成
      document.status = 'ready';
      document.updatedAt = Date.now();
      this.saveIndex();

      onProgress?.(100, '索引完成！');
      
      return documentId;
    } catch (error: any) {
      console.error('文档索引失败:', error);
      
      const document = this.indexData.documents[documentId];
      if (document) {
        document.status = 'error';
        document.error = error.message;
        this.saveIndex();
      }

      throw error;
    }
  }

  /**
   * 文档分块
   */
  private chunkDocument(
    text: string,
    documentId: string,
    documentName: string,
    pages: Array<{ pageNumber: number; text: string }>
  ): Array<Omit<DocumentChunk, 'embedding'>> {
    const chunks: Array<Omit<DocumentChunk, 'embedding'>> = [];
    const chunkSize = 800; // 字符数
    const overlap = 100; // 重叠字符数

    let chunkIndex = 0;
    let currentPage = 1;
    let pageStartIndex = 0;

    // 按页处理
    for (const page of pages) {
      const pageText = page.text;
      let start = 0;

      while (start < pageText.length) {
        const end = Math.min(start + chunkSize, pageText.length);
        const content = pageText.slice(start, end).trim();

        if (content.length > 50) { // 忽略太短的块
          chunks.push({
            id: `${documentId}-chunk-${chunkIndex}`,
            documentId,
            documentName,
            content,
            metadata: {
              page: page.pageNumber,
              chunkIndex,
              startIndex: pageStartIndex + start,
              endIndex: pageStartIndex + end,
            },
          });

          chunkIndex++;
        }

        start += chunkSize - overlap;
      }

      pageStartIndex += pageText.length;
      currentPage++;
    }

    return chunks;
  }

  /**
   * 基于文档的问答
   */
  async answer(
    question: string,
    documentIds?: string[],
    topK: number = 5
  ): Promise<RAGAnswer> {
    try {
      console.log('RAG 问答开始:', { question, documentIds, topK });

      // 1. 向量化问题
      console.log('1. 向量化问题...');
      const questionEmbedding = await embeddingService.embed(question);
      console.log('问题向量维度:', questionEmbedding.length);

      // 2. 检索相关文档块
      console.log('2. 检索相关文档块...');
      const searchResults = vectorStoreService.search(
        questionEmbedding,
        documentIds,
        topK,
        0.0 // 最小相似度阈值（降低到 0，返回所有结果）
      );
      console.log('检索到文档块数量:', searchResults.length);

      // 如果检索结果为空或相似度太低，使用文档的所有内容
      if (searchResults.length === 0) {
        console.warn('未找到高相似度的文档块，使用文档所有内容');
        
        // 获取指定文档的所有块
        const allChunks: Array<{ chunk: any; similarity: number }> = [];
        if (documentIds && documentIds.length > 0) {
          for (const docId of documentIds) {
            const docChunks = vectorStoreService.getDocumentChunks(docId);
            console.log(`文档 ${docId} 共有 ${docChunks.length} 个块`);
            // 将所有块添加到结果中，相似度设为 0
            allChunks.push(...docChunks.map(chunk => ({ chunk, similarity: 0 })));
          }
        }
        
        if (allChunks.length === 0) {
          return {
            answer: '抱歉，无法读取文档内容。请确保文档已正确上传和索引。',
            sources: [],
          };
        }
        
        console.log('使用文档所有内容，共', allChunks.length, '个块');
        searchResults.push(...allChunks);
      }

      // 3. 构建上下文
      console.log('3. 构建上下文...');
      const context = searchResults
        .map((result, i) => {
          return `[文档片段 ${i + 1}] (来自《${result.chunk.documentName}》第 ${result.chunk.metadata.page} 页)\n${result.chunk.content}`;
        })
        .join('\n\n---\n\n');
      console.log('上下文长度:', context.length, '字符');

      // 4. 构建 Prompt
      const prompt = `请基于以下文档内容回答用户的问题。

文档内容：
${context}

用户问题：${question}

请注意：
1. 只基于上述文档内容回答，不要编造信息
2. 如果文档中没有相关信息，请明确说明
3. 回答要准确、简洁、有条理
4. 可以引用文档片段来支持你的回答`;

      // 5. 调用 AI 模型（使用 chatWithContext 以获得更好的文档问答效果）
      console.log('4. 调用 AI 模型...');
      const aiResponse = await aiService.chatWithContext(question, context);
      console.log('AI 响应长度:', aiResponse.response.length, '字符');

      // 6. 构建来源信息
      const sources = searchResults.map(result => ({
        documentId: result.chunk.documentId,
        documentName: result.chunk.documentName,
        page: result.chunk.metadata.page,
        content: result.chunk.content.slice(0, 200) + '...',
        similarity: result.similarity,
      }));

      return {
        answer: aiResponse.response,
        sources,
      };
    } catch (error: any) {
      console.error('RAG 问答失败:', error);
      throw new Error(`问答失败: ${error.message}`);
    }
  }

  /**
   * 获取所有文档
   */
  getAllDocuments(): RAGDocument[] {
    return Object.values(this.indexData.documents).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }

  /**
   * 获取单个文档
   */
  getDocument(documentId: string): RAGDocument | null {
    return this.indexData.documents[documentId] || null;
  }

  /**
   * 获取文档内容（用于阅读器显示）
   */
  async getDocumentContent(documentId: string): Promise<{ content: string; totalPages: number }> {
    const doc = this.getDocument(documentId);
    if (!doc) {
      throw new Error('文档不存在');
    }

    // 从向量存储中获取所有块
    const chunks = vectorStoreService.getDocumentChunks(documentId);
    
    if (chunks.length === 0) {
      throw new Error('文档内容为空');
    }

    // 按页码排序并组合内容
    const pageMap = new Map<number, string[]>();
    
    chunks.forEach(chunk => {
      const page = chunk.metadata.page || 1;
      if (!pageMap.has(page)) {
        pageMap.set(page, []);
      }
      pageMap.get(page)!.push(chunk.content);
    });

    // 按页码顺序组合文本
    const sortedPages = Array.from(pageMap.keys()).sort((a, b) => a - b);
    const content = sortedPages
      .map(page => {
        const pageContent = pageMap.get(page)!.join('\n\n');
        return `========== 第 ${page} 页 ==========\n\n${pageContent}`;
      })
      .join('\n\n\n');

    return {
      content,
      totalPages: doc.totalPages,
    };
  }

  /**
   * 删除文档
   */
  deleteDocument(documentId: string): void {
    // 删除向量数据
    vectorStoreService.deleteDocumentChunks(documentId);

    // 删除文档文件
    documentService.deleteDocument(documentId);

    // 删除索引记录
    delete this.indexData.documents[documentId];
    this.saveIndex();
  }

  /**
   * 获取文档统计
   */
  getStats(): {
    totalDocuments: number;
    readyDocuments: number;
    processingDocuments: number;
    errorDocuments: number;
    totalChunks: number;
  } {
    const documents = Object.values(this.indexData.documents);
    const vectorStats = vectorStoreService.getStats();

    return {
      totalDocuments: documents.length,
      readyDocuments: documents.filter(d => d.status === 'ready').length,
      processingDocuments: documents.filter(d => d.status === 'processing').length,
      errorDocuments: documents.filter(d => d.status === 'error').length,
      totalChunks: vectorStats.totalChunks,
    };
  }

  /**
   * 生成文档 ID
   */
  private generateDocumentId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const ragService = new RAGService();

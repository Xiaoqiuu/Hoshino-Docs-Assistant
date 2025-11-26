import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface DocumentMetadata {
  id: string;
  name: string;
  path: string;
  totalPages: number;
  totalChunks: number;
  fileSize: number;
  createdAt: number;
  updatedAt: number;
}

export interface ParsedDocument {
  text: string;
  pages: Array<{
    pageNumber: number;
    text: string;
  }>;
  metadata: {
    totalPages: number;
    info?: any;
  };
}

export class DocumentService {
  private documentsDir: string;
  private thumbnailsDir: string;

  constructor() {
    this.documentsDir = path.join(app.getPath('userData'), 'documents');
    this.thumbnailsDir = path.join(app.getPath('userData'), 'thumbnails');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.documentsDir)) {
      fs.mkdirSync(this.documentsDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailsDir)) {
      fs.mkdirSync(this.thumbnailsDir, { recursive: true });
    }
  }

  /**
   * 解析 PDF 文档
   * 使用 pdfjs-dist 库
   */
  async parsePDF(filePath: string): Promise<ParsedDocument> {
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
      const dataBuffer = fs.readFileSync(filePath);
      
      // 加载 PDF 文档
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(dataBuffer),
        useSystemFonts: true,
      });
      
      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;
      
      let fullText = '';
      const pages: Array<{ pageNumber: number; text: string }> = [];
      
      // 提取每一页的文本
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        pages.push({
          pageNumber: pageNum,
          text: pageText,
        });
        
        fullText += pageText + '\n';
      }
      
      return {
        text: fullText.trim(),
        pages,
        metadata: {
          totalPages: numPages,
          info: {},
        },
      };
    } catch (error: any) {
      console.error('PDF 解析失败:', error);
      throw new Error(`PDF 解析失败: ${error.message}`);
    }
  }

  /**
   * 简单的文本分页（基于字符数平均分配）
   */
  private splitTextByPages(text: string, numPages: number): string[] {
    const avgCharsPerPage = Math.ceil(text.length / numPages);
    const pages: string[] = [];
    
    for (let i = 0; i < numPages; i++) {
      const start = i * avgCharsPerPage;
      const end = Math.min((i + 1) * avgCharsPerPage, text.length);
      pages.push(text.slice(start, end));
    }
    
    return pages;
  }

  /**
   * 保存上传的文档
   */
  async saveDocument(sourcePath: string, documentId: string): Promise<string> {
    try {
      // 检查源文件是否存在
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`源文件不存在: ${sourcePath}`);
      }

      const ext = path.extname(sourcePath);
      const destPath = path.join(this.documentsDir, `${documentId}${ext}`);
      
      // 确保目标目录存在
      this.ensureDirectories();
      
      // 使用 readFile + writeFile 代替 copyFileSync，避免编码问题
      const fileBuffer = fs.readFileSync(sourcePath);
      fs.writeFileSync(destPath, fileBuffer);
      
      return destPath;
    } catch (error: any) {
      console.error('保存文档失败:', error);
      throw new Error(`保存文档失败: ${error.message}`);
    }
  }

  /**
   * 删除文档文件
   */
  deleteDocument(documentId: string): void {
    const files = fs.readdirSync(this.documentsDir);
    const docFile = files.find(f => f.startsWith(documentId));
    
    if (docFile) {
      const filePath = path.join(this.documentsDir, docFile);
      fs.unlinkSync(filePath);
    }
  }

  /**
   * 获取文档文件大小
   */
  getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * 检查文档是否存在
   */
  documentExists(documentId: string): boolean {
    const files = fs.readdirSync(this.documentsDir);
    return files.some(f => f.startsWith(documentId));
  }

  /**
   * 生成 PDF 第一页的缩略图（简化版，暂时返回空）
   * TODO: 实现真实的缩略图生成
   */
  async generateThumbnail(filePath: string, documentId: string): Promise<string> {
    // 暂时返回空字符串，使用默认图标
    // 完整实现需要 canvas 库，在 Windows 上安装较复杂
    console.log('缩略图生成功能待实现:', documentId);
    return '';
  }

  /**
   * 获取缩略图路径
   */
  getThumbnailPath(documentId: string): string | null {
    const thumbnailPath = path.join(this.thumbnailsDir, `${documentId}.png`);
    if (fs.existsSync(thumbnailPath)) {
      return thumbnailPath;
    }
    return null;
  }

  /**
   * 删除缩略图
   */
  deleteThumbnail(documentId: string): void {
    const thumbnailPath = path.join(this.thumbnailsDir, `${documentId}.png`);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  }
}

export const documentService = new DocumentService();

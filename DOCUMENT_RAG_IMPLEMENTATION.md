# 文档 RAG 系统实现指南

## 第一步：安装依赖

```bash
# PDF 解析
npm install pdf-parse

# 向量嵌入（轻量级，纯 JS）
npm install @xenova/transformers

# 文件处理
npm install mime-types

# 类型定义
npm install --save-dev @types/pdf-parse @types/mime-types
```

## 第二步：创建文档解析服务

文件：`src/main/services/documentService.ts`

这个服务负责：
- PDF 文本提取
- OCR 扫描件处理
- 文档元数据提取

## 第三步：创建向量服务

文件：`src/main/services/embeddingService.ts`

这个服务负责：
- 加载嵌入模型
- 文本向量化
- 向量缓存

## 第四步：创建 RAG 服务

文件：`src/main/services/ragService.ts`

这个服务负责：
- 文档分块
- 向量检索
- Prompt 构建
- 与 AI 模型集成

## 第五步：创建文档库界面

文件：`src/renderer/components/DocumentLibrary.tsx`

这个界面包括：
- 文档上传
- 文档列表
- 文档问答
- 来源引用

## 核心代码示例

### 1. 文档解析（简化版）

```typescript
import pdf from 'pdf-parse';
import { ocrService } from './ocrService';

export class DocumentService {
  async parsePDF(filePath: string): Promise<{
    text: string;
    pages: Array<{ pageNumber: number; text: string }>;
    isScanned: boolean;
  }> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    // 检查是否是扫描件（文本很少）
    const isScanned = data.text.trim().length < 100;
    
    if (isScanned) {
      // 使用 OCR
      return await this.parseScannedPDF(filePath);
    }
    
    return {
      text: data.text,
      pages: data.pages,
      isScanned: false,
    };
  }
  
  async parseScannedPDF(filePath: string): Promise<any> {
    // 使用已有的 OCR 服务
    // 需要将 PDF 转换为图片，然后 OCR
    // 这部分较复杂，可以先提示用户
    throw new Error('扫描件 PDF 需要 OCR 处理，请先转换为文本 PDF');
  }
}
```

### 2. 文档分块

```typescript
export class ChunkingService {
  chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk);
      start += chunkSize - overlap;
    }
    
    return chunks;
  }
}
```

### 3. 向量检索（简化版）

```typescript
export class VectorSearchService {
  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  search(queryVector: number[], documentVectors: Array<{
    id: string;
    vector: number[];
    content: string;
  }>, topK: number = 5) {
    const results = documentVectors.map(doc => ({
      ...doc,
      similarity: this.cosineSimilarity(queryVector, doc.vector),
    }));
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}
```

### 4. RAG 问答

```typescript
export class RAGService {
  async answerQuestion(question: string, documentId: string): Promise<{
    answer: string;
    sources: Array<{ page: number; text: string }>;
  }> {
    // 1. 向量化问题
    const questionVector = await embeddingService.embed(question);
    
    // 2. 检索相关文档块
    const relevantChunks = vectorSearchService.search(
      questionVector,
      documentVectors,
      5
    );
    
    // 3. 构建 Prompt
    const context = relevantChunks.map(c => c.content).join('\n\n');
    const prompt = `基于以下文档内容回答问题：

文档内容：
${context}

问题：${question}

请基于文档内容回答，并指出信息来源。`;
    
    // 4. 调用 AI 模型
    const response = await aiService.chat(prompt);
    
    // 5. 返回答案和来源
    return {
      answer: response.response,
      sources: relevantChunks.map(c => ({
        page: c.metadata.page,
        text: c.content.slice(0, 100) + '...',
      })),
    };
  }
}
```

## 简化实现方案（推荐）

考虑到复杂度，我建议先实现一个**简化版本**：

### 方案 A：基于选中文本的简单 RAG

**已实现**：
- ✅ 用户选中文本
- ✅ 文本作为上下文
- ✅ AI 基于上下文回答

**需要增强**：
- 保存文本到文档库
- 支持多次对话引用同一文档
- 添加来源标注

### 方案 B：轻量级文档问答

**实现步骤**：
1. 用户上传 PDF
2. 提取全文（不分块，不向量化）
3. 将全文作为上下文发送给 AI
4. AI 基于全文回答

**优势**：
- 实现简单
- 无需向量数据库
- 适合小文档（< 10 页）

**限制**：
- 不适合大文档
- 无法精确定位来源

## 推荐实施路径

### 阶段 1：基础文档上传（1-2 天）
```typescript
// 1. 添加文档上传功能
// 2. 提取 PDF 文本
// 3. 保存到本地
```

### 阶段 2：简单问答（1-2 天）
```typescript
// 1. 读取文档内容
// 2. 作为上下文发送给 AI
// 3. 显示答案
```

### 阶段 3：增强功能（1 周）
```typescript
// 1. 文档分块
// 2. 关键词检索（不用向量）
// 3. 来源引用
```

### 阶段 4：完整 RAG（2-3 周）
```typescript
// 1. 向量嵌入
// 2. 向量检索
// 3. 高级 Prompt 工程
```

## 当前建议

鉴于项目已经有很多功能，我建议：

1. **先完善现有功能**
   - OCR 图片识别 ✅
   - 本地模型集成 ✅
   - 导航系统 ✅

2. **实现简化版文档问答**
   - 文档上传
   - 文本提取
   - 基于全文的问答

3. **逐步升级到完整 RAG**
   - 当简化版稳定后
   - 再添加向量检索
   - 最后优化性能

## 需要的时间估算

- **简化版**：3-5 天
- **基础 RAG**：1-2 周
- **完整 RAG**：3-4 周

## 下一步行动

你希望我：
1. ✅ 创建完整的实现计划（已完成）
2. 🔄 实现简化版文档问答（推荐）
3. 🔄 实现完整 RAG 系统（需要更多时间）

请告诉我你的选择，我会继续实现！

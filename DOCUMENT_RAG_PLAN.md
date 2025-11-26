# 文档 RAG 系统实现方案

## 目标

实现基于文档的检索增强生成（RAG）系统，支持 PDF 文档解析（包括 OCR 扫描件）、向量检索和智能问答。

## 技术栈选择

### 方案：纯 JavaScript/TypeScript 实现

**优势**：
- 无需 Python 环境
- 部署简单
- 与现有 Electron 应用无缝集成
- 跨平台兼容性好

**核心库**：
1. **PDF 解析**：`pdf-parse` - 提取文本内容
2. **OCR**：`tesseract.js` - 已集成，用于扫描件
3. **向量化**：`@xenova/transformers` - 本地运行的嵌入模型
4. **向量检索**：自实现简单的余弦相似度检索（轻量级）
5. **文档分块**：自实现基于字符数的智能分块

## 系统架构

```
用户上传 PDF
    ↓
PDF 解析服务
├── 文本 PDF → 直接提取文本
└── 扫描件 PDF → OCR 识别
    ↓
文本分块
├── 按段落/字符数分块
└── 保留元数据（页码、位置）
    ↓
向量化（Embedding）
├── 使用轻量级嵌入模型
└── 生成向量表示
    ↓
向量存储
├── 保存到本地 JSON
└── 建立索引
    ↓
用户提问
    ↓
问题向量化
    ↓
向量检索（Top-K）
├── 余弦相似度计算
└── 返回最相关的文档块
    ↓
构建 Prompt
├── 问题 + 检索到的文档块
└── 发送给 AI 模型
    ↓
生成回答
└── 返回答案 + 来源引用
```

## 实现步骤

### Phase 1: 文档解析服务 ✅
- [x] PDF 文本提取
- [x] OCR 集成（已有 tesseract.js）
- [x] 文档元数据提取（页码、标题）

### Phase 2: 文档分块与向量化
- [ ] 智能文本分块
- [ ] 嵌入模型集成
- [ ] 向量生成

### Phase 3: 向量存储与检索
- [ ] 本地向量数据库
- [ ] 相似度检索
- [ ] 索引管理

### Phase 4: RAG 问答
- [ ] Prompt 构建
- [ ] 与 AI 模型集成
- [ ] 来源引用

### Phase 5: UI 集成
- [ ] 文档上传界面
- [ ] 文档库管理
- [ ] 问答界面

## 轻量级实现方案

考虑到性能和部署复杂度，我们采用以下简化方案：

### 1. 嵌入模型
使用 `@xenova/transformers` 的轻量级模型：
- `Xenova/all-MiniLM-L6-v2` (80MB)
- 纯 JavaScript 运行
- 支持离线使用

### 2. 向量检索
自实现余弦相似度检索：
```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```

### 3. 文档分块策略
- 每块 500-1000 字符
- 保留 100 字符重叠
- 保留段落完整性
- 记录页码和位置

## 数据结构

### 文档块（Chunk）
```typescript
interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  embedding: number[];
  metadata: {
    page: number;
    startIndex: number;
    endIndex: number;
  };
}
```

### 文档索引
```typescript
interface DocumentIndex {
  id: string;
  name: string;
  path: string;
  totalPages: number;
  totalChunks: number;
  createdAt: number;
  updatedAt: number;
}
```

## 性能优化

1. **懒加载**：仅在需要时加载嵌入模型
2. **缓存**：缓存已生成的向量
3. **异步处理**：文档解析和向量化在后台进行
4. **增量索引**：仅处理新增或修改的文档

## 存储方案

使用 JSON 文件存储（与现有 databaseService 一致）：
```
userData/
├── documents/
│   ├── index.json          # 文档索引
│   ├── vectors.json        # 向量数据
│   └── chunks.json         # 文档块
└── uploads/
    └── [document-files]    # 上传的文档
```

## 用户体验

### 文档上传流程
1. 用户点击"文档库"
2. 选择 PDF 文件上传
3. 显示解析进度
4. 完成后显示在文档列表

### 问答流程
1. 选择文档或文档集合
2. 输入问题
3. 显示检索进度
4. 展示答案 + 来源引用
5. 可点击来源跳转到原文

## 限制与未来优化

### 当前限制
- 仅支持 PDF 格式
- 向量检索使用简单算法（非 FAISS）
- 嵌入模型较小（精度有限）

### 未来优化
- 支持更多格式（DOCX、TXT、Markdown）
- 集成真正的 FAISS（通过 WASM）
- 使用更大的嵌入模型
- 支持多文档联合检索
- 添加重排序（Reranking）

## 开发优先级

### P0（MVP）
1. PDF 文本提取
2. 基础文档分块
3. 简单向量检索
4. 基本问答功能

### P1（增强）
1. OCR 扫描件支持
2. 更好的分块策略
3. 来源引用和跳转
4. 文档管理界面

### P2（高级）
1. 多文档检索
2. 高级检索算法
3. 性能优化
4. 导出和分享

---

**目标**：在 2-3 周内完成 MVP，提供基本的文档问答能力。

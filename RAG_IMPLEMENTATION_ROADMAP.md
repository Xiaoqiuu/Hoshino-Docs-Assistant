# RAG 系统完整实现路线图

## 📦 需要安装的依赖

```bash
# PDF 解析
npm install pdf-parse pdf-lib

# 向量嵌入（轻量级）
npm install @xenova/transformers

# 文件处理
npm install mime-types

# 类型定义
npm install --save-dev @types/pdf-parse @types/mime-types
```

## 🏗️ 架构设计

```
文档 RAG 系统
├── 文档解析层
│   ├── PDF 文本提取
│   ├── PDF 转图片（扫描件）
│   └── OCR 识别
├── 文本处理层
│   ├── 智能分块
│   ├── 元数据提取
│   └── 文本清洗
├── 向量化层
│   ├── 嵌入模型加载
│   ├── 文本向量化
│   └── 向量缓存
├── 存储层
│   ├── 文档索引
│   ├── 向量数据库
│   └── 文档块存储
├── 检索层
│   ├── 向量相似度计算
│   ├── Top-K 检索
│   └── 结果排序
└── 问答层
    ├── Prompt 构建
    ├── AI 模型调用
    └── 答案生成
```

## 📝 实现步骤

### Phase 1: 核心服务（本次实现）
1. ✅ 文档解析服务（documentService.ts）
2. ✅ 嵌入服务（embeddingService.ts）
3. ✅ 向量存储服务（vectorStoreService.ts）
4. ✅ RAG 服务（ragService.ts）

### Phase 2: UI 集成（下一步）
1. 文档库界面
2. 文档上传
3. 问答界面
4. 来源引用

### Phase 3: 优化（后续）
1. 性能优化
2. 缓存策略
3. 增量索引
4. 批量处理

## 🎯 本次实现目标

创建以下核心服务文件：
1. `src/main/services/documentService.ts` - 文档解析
2. `src/main/services/embeddingService.ts` - 向量嵌入
3. `src/main/services/vectorStoreService.ts` - 向量存储
4. `src/main/services/ragService.ts` - RAG 主服务

## 📊 数据流程

```
用户上传 PDF
    ↓
documentService.parsePDF()
    ↓
提取文本 + 页码信息
    ↓
ragService.indexDocument()
    ↓
文本分块（500-1000字符/块）
    ↓
embeddingService.embedBatch()
    ↓
生成向量（384维）
    ↓
vectorStoreService.addVectors()
    ↓
保存到本地 JSON
    ↓
索引完成

用户提问
    ↓
embeddingService.embed(question)
    ↓
问题向量化
    ↓
vectorStoreService.search()
    ↓
余弦相似度检索 Top-5
    ↓
ragService.answer()
    ↓
构建 Prompt + 调用 AI
    ↓
返回答案 + 来源
```

## 🔧 技术细节

### 嵌入模型
- 模型：`Xenova/all-MiniLM-L6-v2`
- 维度：384
- 大小：~80MB
- 语言：多语言（包括中文）

### 文档分块策略
- 块大小：500-1000 字符
- 重叠：100 字符
- 保留段落完整性
- 记录页码和位置

### 向量检索
- 算法：余弦相似度
- Top-K：5 个最相关块
- 阈值：相似度 > 0.3

### 存储格式
```json
{
  "documents": {
    "doc-id-1": {
      "id": "doc-id-1",
      "name": "example.pdf",
      "path": "/path/to/file",
      "totalPages": 10,
      "totalChunks": 25,
      "createdAt": 1234567890
    }
  },
  "chunks": {
    "chunk-id-1": {
      "id": "chunk-id-1",
      "documentId": "doc-id-1",
      "content": "文本内容...",
      "embedding": [0.1, 0.2, ...],
      "metadata": {
        "page": 1,
        "startIndex": 0,
        "endIndex": 500
      }
    }
  }
}
```

## ⚠️ 注意事项

1. **首次加载慢**：嵌入模型首次加载需要下载（~80MB）
2. **内存占用**：向量数据会占用内存，大文档需要优化
3. **OCR 性能**：扫描件 OCR 识别较慢
4. **模型精度**：轻量级模型精度有限，可能需要调整

## 📈 性能指标

- 文档解析：~1-2 秒/页
- 文本分块：~100ms
- 向量化：~50ms/块
- 检索：~10ms
- 总体：小文档（10页）约 30 秒完成索引

---

**准备开始实现核心服务代码！**

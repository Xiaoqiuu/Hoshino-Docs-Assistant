# Hoshino 文档助手 - 技术文档

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  ┌────────────────────────────────────┐ │
│  │      Service Layer                 │ │
│  │  - aiService                       │ │
│  │  - ragService                      │ │
│  │  - ocrService                      │ │
│  │  - ollamaService                   │ │
│  │  - databaseService                 │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │      IPC Handlers                  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↕ IPC
┌─────────────────────────────────────────┐
│       Electron Renderer Process         │
│  ┌────────────────────────────────────┐ │
│  │      React Components              │ │
│  │  - App                             │ │
│  │  - Settings                        │ │
│  │  - DocumentLibrary                 │ │
│  │  - SessionHistory                  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 核心服务

### 1. AI Service (`aiService.ts`)

负责与 AI 模型的交互。

**主要功能：**
- 支持云端 API（DeepSeek）和本地模型（Ollama）
- 流式输出和非流式输出
- 多轮对话上下文管理
- 推理模型思维链提取

**关键方法：**

```typescript
// 普通对话
async chat(message: string, messageHistory?: Array<{role: string; content: string}>): Promise<AIResponse>

// 流式对话
async *chatStream(message: string, messageHistory?: Array<{role: string; content: string}>): AsyncGenerator<StreamChunk>

// 带上下文的对话（RAG）
async chatWithContext(message: string, context: string): Promise<AIResponse>

// 余额查询
async checkBalance(): Promise<BalanceInfo>
```

**流式输出实现：**

```typescript
async *chatStream(message: string, messageHistory?: Array<{role: string; content: string}>) {
  const stream = await this.client.chat.completions.create({
    model: modelToUse,
    messages: [...messageHistory, {role: 'user', content: message}],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    
    // 提取思维链
    if (delta.reasoning_content) {
      yield { reasoningContent: delta.reasoning_content, done: false };
    }
    
    // 提取回复内容
    if (delta.content) {
      yield { content: delta.content, done: false };
    }
  }
}
```

### 2. RAG Service (`ragService.ts`)

实现基于检索增强生成的文档问答。

**工作流程：**

1. **文档处理**
   ```typescript
   uploadDocument(filePath: string) {
     // 1. 读取文档
     const content = await documentService.readDocument(filePath);
     
     // 2. 分块
     const chunks = splitIntoChunks(content);
     
     // 3. 生成向量
     const embeddings = await embeddingService.generateEmbeddings(chunks);
     
     // 4. 存储
     await vectorStoreService.addDocuments(chunks, embeddings);
   }
   ```

2. **问答流程**
   ```typescript
   async answer(question: string, documentIds?: string[]) {
     // 1. 生成问题向量
     const questionEmbedding = await embeddingService.generateEmbedding(question);
     
     // 2. 检索相关文档
     const relevantChunks = await vectorStoreService.search(questionEmbedding, topK);
     
     // 3. 构建上下文
     const context = relevantChunks.map(chunk => chunk.content).join('\n\n');
     
     // 4. 生成回答
     return await aiService.chatWithContext(question, context);
   }
   ```

### 3. OCR Service (`ocrService.ts`)

基于 Tesseract.js 的 OCR 识别服务。

**多语言支持：**

```typescript
const SUPPORTED_LANGUAGES = {
  'chi_sim': '简体中文',
  'chi_tra': '繁体中文',
  'jpn': '日语',
  'kor': '韩语',
  'eng': '英语',
  // ... 更多语言
};

async recognizeImage(imageData: Buffer, languages?: string) {
  // 默认使用多语言组合
  const langs = languages || 'chi_sim+chi_tra+jpn+kor+eng';
  
  const worker = await createWorker(langs);
  const { data } = await worker.recognize(imageData);
  
  return {
    text: data.text,
    confidence: data.confidence
  };
}
```

### 4. Ollama Service (`ollamaService.ts`)

管理本地 Ollama 模型。

**功能：**
- 检测 Ollama 安装
- 启动/停止 Ollama 服务
- 列出已安装模型
- 下载新模型

```typescript
async pullModel(modelName: string) {
  const process = spawn('ollama', ['pull', modelName]);
  
  process.stdout.on('data', (data) => {
    // 发送进度到渲染进程
    mainWindow.webContents.send('ollama-pull-progress', {
      progress: parseProgress(data),
      message: data.toString()
    });
  });
}
```

### 5. Database Service (`databaseService.ts`)

基于 JSON 的本地数据库。

**数据结构：**

```typescript
interface Database {
  sessions: Session[];
  messages: Message[];
  settings: Settings;
}

interface Session {
  id: number;
  title: string;
  created_at: number;
  updated_at: number;
}

interface Message {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: string; // JSON string
  created_at: number;
}
```

## 数据流

### 1. 普通对话流程

```
User Input
    ↓
App.tsx (handleSend)
    ↓
IPC: send-message-stream
    ↓
main.ts (IPC Handler)
    ↓
aiService.chatStream(message, history)
    ↓
OpenAI API / Ollama
    ↓
Stream Chunks → IPC: message-stream-chunk
    ↓
App.tsx (onMessageStreamChunk)
    ↓
Update UI (setState)
```

### 2. RAG 文档问答流程

```
Upload Document
    ↓
ragService.uploadDocument()
    ↓
documentService.readDocument()
    ↓
Split into chunks
    ↓
embeddingService.generateEmbeddings()
    ↓
vectorStoreService.addDocuments()
    ↓
Save to vector-store.json

Ask Question
    ↓
ragService.answer(question)
    ↓
embeddingService.generateEmbedding(question)
    ↓
vectorStoreService.search()
    ↓
Retrieve relevant chunks
    ↓
aiService.chatWithContext(question, context)
    ↓
Return answer with sources
```

### 3. OCR 识别流程

```
Copy Image to Clipboard
    ↓
Click OCR Button
    ↓
IPC: ocr-recognize-clipboard
    ↓
ocrService.recognizeFromClipboard()
    ↓
Tesseract.js recognize()
    ↓
Return text + confidence
    ↓
Display in UI
```

## 状态管理

### React State

```typescript
// App.tsx
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
```

### 思维链状态

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoningContent?: string;  // 思维链内容
  isThinking?: boolean;        // 是否正在思考
  reasoningExpanded?: boolean; // 思维链是否展开
}
```

**状态转换：**

```
初始状态:
  isThinking: true
  reasoningExpanded: true
  reasoningContent: ""
  content: ""

收到思维链:
  isThinking: true
  reasoningExpanded: true
  reasoningContent: "思考内容..."
  content: ""

收到第一个回复字符:
  isThinking: false
  reasoningExpanded: false  // 自动折叠
  reasoningContent: "完整思考内容"
  content: "开始回复..."

完成:
  isThinking: false
  reasoningExpanded: false
  reasoningContent: "完整思考内容"
  content: "完整回复"
```

## IPC 通信

### 主要 IPC 通道

```typescript
// 消息相关
'send-message'              // 发送消息（非流式）
'send-message-stream'       // 发送消息（流式）
'message-stream-chunk'      // 流式数据块（事件）

// 配置相关
'get-config'                // 获取配置
'set-config'                // 设置配置
'test-connection'           // 测试连接
'check-balance'             // 查询余额

// 会话相关
'create-session'            // 创建会话
'get-sessions'              // 获取会话列表
'switch-session'            // 切换会话
'delete-session'            // 删除会话

// OCR 相关
'ocr-recognize-clipboard'   // 识别剪贴板
'ocr-recognize-image'       // 识别图片

// RAG 相关
'rag-upload-document'       // 上传文档
'rag-get-documents'         // 获取文档列表
'rag-answer'                // 文档问答
'rag-delete-document'       // 删除文档

// Ollama 相关
'ollama-check-installed'    // 检查安装
'ollama-start-server'       // 启动服务
'ollama-list-models'        // 列出模型
'ollama-pull-model'         // 下载模型
```

## 性能优化

### 1. 向量检索优化

```typescript
// 使用余弦相似度快速检索
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// 只返回 top-k 结果
const topK = 5;
const results = similarities
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, topK);
```

### 2. 嵌入模型缓存

```typescript
// 使用 transformers.js 的本地缓存
const pipeline = await transformers.pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2',
  { cache_dir: path.join(app.getPath('userData'), '.cache') }
);
```

### 3. 流式输出优化

```typescript
// 批量更新 UI，避免频繁渲染
let buffer = '';
const flushInterval = 50; // ms

const handleStreamChunk = debounce((data) => {
  buffer += data.content;
  setMessages(prev => updateLastMessage(prev, buffer));
}, flushInterval);
```

## 安全考虑

### 1. API Key 存储

```typescript
// 加密存储在本地
const configPath = path.join(app.getPath('userData'), 'config.json');
fs.writeFileSync(configPath, JSON.stringify(config), { mode: 0o600 });
```

### 2. 输入验证

```typescript
// 验证文件类型
const allowedExtensions = ['.pdf', '.txt', '.md'];
const ext = path.extname(filePath).toLowerCase();
if (!allowedExtensions.includes(ext)) {
  throw new Error('不支持的文件类型');
}
```

### 3. 内容安全策略

```typescript
// 在 main.ts 中设置 CSP
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true
}
```

## 测试

### 单元测试

```bash
npm run test
```

### E2E 测试

```bash
npm run test:e2e
```

### 测试覆盖率

```bash
npm run test:coverage
```

## 部署

### 打包配置

```json
{
  "build": {
    "appId": "com.hoshino.docs-assistant",
    "productName": "Hoshino 文档助手",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "hoshino_icon.ico"
    }
  }
}
```

### 构建步骤

```bash
# 1. 安装依赖
npm install

# 2. 构建
npm run build

# 3. 打包
npm run package

# 4. 生成安装包
npm run make
```

## 故障排除

### 常见问题

1. **OCR 识别失败**
   - 检查训练数据是否下载
   - 确认图片格式支持
   - 尝试不同语言组合

2. **RAG 检索不准确**
   - 增加文档分块大小
   - 调整 top-k 参数
   - 使用更好的嵌入模型

3. **Ollama 连接失败**
   - 确认 Ollama 服务运行
   - 检查端口是否被占用
   - 验证模型是否下载

4. **流式输出卡顿**
   - 检查网络连接
   - 降低并发请求
   - 使用本地模型

## 贡献指南

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 添加必要的注释
- 编写单元测试

### 提交规范

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建/工具链更新
```

### Pull Request 流程

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

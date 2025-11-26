# Hoshino 文档助手

<div align="center">

![Hoshino](hoshino_icon.png)

一个功能强大的 AI 文档助手，支持多轮对话、RAG 文档问答、OCR 识别等功能。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-latest-47848F.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

</div>

## ✨ 核心功能

### 🤖 AI 对话
- **多轮对话**：自动保持上下文，支持连续追问
- **流式输出**：打字机效果，实时显示 AI 回复
- **思维链展示**：支持 DeepSeek Reasoner/R1 推理模型的思考过程可视化
- **双模式支持**：云端 API（DeepSeek）+ 本地模型（Ollama）

### 📚 RAG 文档问答
- **文档上传**：支持 PDF、TXT、Markdown 等格式
- **向量检索**：基于语义的智能文档检索
- **上下文问答**：基于文档内容的精准回答
- **文档管理**：文档库管理、查看、删除

### 🔍 OCR 文字识别
- **多语言支持**：中文、日语、韩语、英语等 10+ 种语言
- **剪贴板识别**：一键识别剪贴板图片
- **自定义语言**：可选择特定语言提高准确度

### 💰 其他功能
- **API 余额查询**：实时查看 DeepSeek API 余额
- **会话管理**：多会话支持，历史记录保存
- **Markdown 渲染**：支持数学公式、代码高亮
- **本地模型管理**：Ollama 集成，自动下载和管理

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 cnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/Xiaoqiuu/Hoshino-Docs-Assistant.git
cd Hoshino-Docs-Assistant

# 安装依赖
npm install
# 或使用 cnpm
cnpm install

# 启动开发环境
npm run dev
```

### 快速运行

**Windows 用户**：直接双击 `双击我运行.bat` 即可启动应用。

### 配置

1. **云端模式（DeepSeek API）**
   - 获取 API Key：https://platform.deepseek.com
   - 在设置中输入 API Key
   - 选择模型：`deepseek-chat` 或 `deepseek-reasoner`

2. **本地模式（Ollama）**
   - 安装 Ollama：https://ollama.com
   - 下载模型：`ollama pull deepseek-r1:7b`
   - 在设置中启用"使用本地模型"

## 📖 使用指南

### 基础对话

1. 启动应用
2. 在输入框输入问题
3. 按 Enter 或点击发送
4. 查看 AI 回复

### RAG 文档问答

1. 点击"文档库"按钮
2. 上传文档（PDF/TXT/MD）
3. 等待文档处理完成
4. 选中文档内容后提问
5. AI 会基于文档内容回答

### OCR 识别

1. 复制图片到剪贴板
2. 点击 OCR 按钮
3. 选择识别语言（可选）
4. 查看识别结果

### 推理模型使用

1. 选择 `deepseek-reasoner` 模型
2. 启用"显示思维链内容"
3. 发送需要推理的问题
4. 查看思考过程和最终答案

## 🛠️ 技术栈

### 前端
- **框架**：React 18 + TypeScript
- **构建工具**：Vite
- **UI 组件**：自定义组件
- **Markdown**：react-markdown + KaTeX
- **代码高亮**：react-syntax-highlighter

### 后端
- **运行时**：Electron
- **AI SDK**：OpenAI SDK
- **OCR**：Tesseract.js
- **向量数据库**：本地 JSON 存储
- **嵌入模型**：Xenova/transformers.js

### 核心服务
- `aiService`：AI 对话服务
- `ragService`：RAG 文档问答
- `ocrService`：OCR 识别
- `ollamaService`：本地模型管理
- `databaseService`：数据持久化

## 📁 项目结构

```
Hoshino-Docs-Assistant/
├── src/
│   ├── main/              # 主进程
│   │   ├── main.ts        # 入口文件
│   │   ├── preload.ts     # 预加载脚本
│   │   ├── services/      # 核心服务
│   │   └── types.d.ts     # 类型定义
│   └── renderer/          # 渲染进程
│       ├── App.tsx        # 主应用
│       ├── Settings.tsx   # 设置界面
│       └── components/    # UI 组件
├── docs/                  # 文档目录
├── .env.example          # 环境变量示例
├── package.json          # 项目配置
├── tsconfig.json         # TS 配置
├── vite.config.ts        # Vite 配置
└── 双击我运行.bat        # 快速启动脚本
```

## 🎯 核心特性详解

### 多轮对话

应用自动保存对话历史，每次发送消息时会将历史上下文一起发送给 AI，实现真正的多轮对话。

```typescript
// 自动构建消息历史
const messageHistory = messages.map(msg => ({
  role: msg.role,
  content: msg.content
}));

// 发送时包含历史
await sendMessage(currentMessage, undefined, messageHistory);
```

### 流式输出

支持打字机效果的流式输出，提供更好的用户体验。

- 思考阶段：自动展开思维链，实时显示思考过程
- 回复阶段：自动折叠思维链，逐字显示回复内容

### RAG 文档问答

基于向量检索的文档问答系统：

1. 文档分块：将文档切分为语义块
2. 向量化：使用嵌入模型生成向量
3. 存储：保存到本地向量数据库
4. 检索：根据问题检索相关文档块
5. 回答：基于检索结果生成答案

### OCR 多语言支持

支持 10+ 种语言的 OCR 识别：

- 简体中文 (chi_sim)
- 繁体中文 (chi_tra)
- 日语 (jpn)
- 韩语 (kor)
- 英语 (eng)
- 法语 (fra)
- 德语 (deu)
- 西班牙语 (spa)
- 俄语 (rus)
- 阿拉伯语 (ara)

## ⚙️ 配置选项

### 云端模式配置

```typescript
{
  localMode: false,
  apiKey: "sk-xxx",
  baseUrl: "https://api.deepseek.com",
  modelName: "deepseek-chat", // 或 "deepseek-reasoner"
  streamOutput: true,
  showReasoningContent: true
}
```

### 本地模式配置

```typescript
{
  localMode: true,
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "deepseek-r1:7b",
  streamOutput: true,
  showReasoningContent: true
}
```

## 🔧 开发

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 打包

```bash
npm run package
```

## 📝 更新日志


## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

Apache License 2.0

本项目采用 Apache 2.0 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [DeepSeek](https://www.deepseek.com/) - AI 模型提供
- [Ollama](https://ollama.com/) - 本地模型运行时
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR 引擎
- [Electron](https://www.electronjs.org/) - 桌面应用框架

## 📮 联系方式

- GitHub: [@Xiaoqiuu](https://github.com/Xiaoqiuu)
- 项目地址: https://github.com/Xiaoqiuu/Hoshino-Docs-Assistant

---

<div align="center">
Made with ❤️ by Xiaoqiuu
</div>

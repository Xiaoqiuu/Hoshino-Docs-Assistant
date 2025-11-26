# Hoshino 文档助手

基于 Electron + React + TypeScript 构建的轻量级 AI 文档问答助手。

## 功能特性

- 🚀 **全局快捷键唤出**: 按 `Ctrl+Alt+H` 随时唤出助手窗口
- 💬 **双模式对话**: 
  - 普通聊天模式：与 AI 自由对话
  - 文档模式：基于选中文本进行 RAG 问答
- 🤖 **多种 AI 模型支持**:
  - 云端模型：DeepSeek API（需要 API Key）
  - 本地模型：通过 Ollama 运行 DeepSeek-R1、Qwen 等开源模型
- 📸 **OCR 图片识别**: 粘贴截图自动识别文字内容（支持中英文）
- 🎨 **现代化 UI**: 简洁美观的粉色主题设计
- 📝 **Markdown 渲染**: 支持数学公式（KaTeX）和代码高亮
- 💾 **会话管理**: 自动保存对话历史，支持会话切换
- 🔒 **后台常驻**: 系统托盘常驻，资源占用低
- ⚡ **快速响应**: 毫秒级窗口唤出

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **React 18**: 现代化 UI 框架
- **TypeScript**: 类型安全
- **Vite**: 快速构建工具

## 快速开始

### 安装依赖

项目支持 npm 或 pnpm：

```bash
# 使用 npm
npm install

# 或使用 pnpm（推荐）
pnpm install
```

> 注意：如果使用 pnpm，项目已配置 `.npmrc` 来正确处理 Electron 的依赖结构。

### 开发模式

**方式 1: 使用启动脚本（推荐）**

Windows 批处理：
```bash
dev.bat
```

或 PowerShell：
```bash
.\dev.ps1
```

**方式 2: 手动分步启动**

终端 1 - 启动 Vite：
```bash
npm run dev:renderer
```

终端 2 - 启动 Electron（等待 Vite 启动后）：
```bash
npm run build:main
set NODE_ENV=development
electron .
```

这会启动 Vite 开发服务器（端口 5173）和 Electron 应用。

### 构建应用

```bash
npm run build
```

### 打包发布

```bash
npm run package
```

## 项目结构

```
hoshino-doc-assistant/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── main.ts        # 主进程入口
│   │   └── preload.ts     # 预加载脚本
│   └── renderer/          # React 渲染进程
│       ├── App.tsx        # 主应用组件
│       ├── App.css        # 样式
│       ├── main.tsx       # React 入口
│       └── index.html     # HTML 模板
├── dist/                  # 构建输出
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 使用说明

### 基础使用

1. 启动应用后，会在系统托盘显示图标
2. 按 `Ctrl+Alt+H` 唤出助手窗口
3. 点击右上角 ⚙️ 进入设置
4. 选择使用云端模型或本地模型

### 云端模型配置

1. 在设置中输入 DeepSeek API Key
2. 访问 [platform.deepseek.com](https://platform.deepseek.com) 获取 API Key
3. 测试连接确认配置正确

### 本地模型配置（推荐）

使用 Ollama 运行本地模型，完全免费且保护隐私：

1. 安装 Ollama：访问 [ollama.com](https://ollama.com)
2. 启动服务：`ollama serve`
3. 下载模型：`ollama pull deepseek-r1:7b`
4. 在设置中勾选"使用本地模型"
5. 测试连接确认配置正确

详细说明请查看 [OLLAMA_LOCAL_MODEL.md](./OLLAMA_LOCAL_MODEL.md)

### 对话模式

- **普通聊天**：直接输入问题进行对话
- **文档模式**：选中文本后唤出窗口，基于文本内容问答
- **图片识别**：粘贴截图到输入框，自动识别图片中的文字

## 后续开发计划

### 已完成功能 ✅
- [x] 基础 Electron + React 架构
- [x] 全局快捷键支持
- [x] 双模式 UI 界面
- [x] 集成 DeepSeek API
- [x] 本地模型支持（Ollama）
- [x] OCR 图片识别（Tesseract.js）
- [x] 设置面板（API 配置）
- [x] 会话历史管理
- [x] Markdown 渲染（数学公式 + 代码高亮）
- [x] 粉色主题 UI 设计
- [x] 系统选中文本获取

### 计划中功能 🚧
- [ ] 实现文档解析（PDF/DOCX）
- [ ] 实现 RAG 检索增强
- [ ] 浏览器扩展集成
- [ ] 向量数据库集成（FAISS/Chroma）
- [ ] 文档跳转功能
- [ ] 多文档跨文档检索
- [ ] 图表理解
- [ ] OCR 多语言支持优化

## 许可证

MIT

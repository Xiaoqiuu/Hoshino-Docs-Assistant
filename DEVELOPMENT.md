# 开发指南

## 架构说明

### 主进程 (Main Process)

位于 `src/main/main.ts`，负责：
- 创建和管理窗口
- 注册全局快捷键
- 系统托盘管理
- IPC 通信处理

### 渲染进程 (Renderer Process)

位于 `src/renderer/`，负责：
- UI 渲染和交互
- 用户输入处理
- 消息展示

### 进程间通信 (IPC)

通过 `preload.ts` 暴露安全的 API：
- `hideWindow()`: 隐藏窗口
- `getSelectedText()`: 获取选中文本
- `sendMessage()`: 发送消息到 AI

## 开发注意事项

### 1. 安全性

- 使用 `contextIsolation: true`
- 通过 preload 脚本暴露有限 API
- 不直接在渲染进程使用 Node.js API

### 2. 快捷键

- 使用 `globalShortcut` 注册全局快捷键
- 在应用退出时注销快捷键
- 处理快捷键冲突

### 3. 窗口管理

- 窗口失焦自动隐藏
- 窗口位置居中显示
- 支持多显示器

## 下一步开发任务

### 1. AI 模型集成

在 `src/main/main.ts` 中实现 `send-message` 处理器：

```typescript
ipcMain.handle('send-message', async (_event, message: string, selectedText?: string) => {
  if (selectedText) {
    // RAG 模式
    // 1. 解析文档
    // 2. 向量检索
    // 3. 生成回答
  } else {
    // 普通对话模式
    // 调用 DeepSeek/OpenAI API
  }
});
```

### 2. 文档解析

创建 `src/main/services/documentParser.ts`：
- PDF 解析（使用 pdf-parse）
- DOCX 解析（使用 mammoth）
- 文本分块

### 3. 向量检索

创建 `src/main/services/vectorStore.ts`：
- 文档嵌入生成
- 向量存储和检索
- 相似度计算

### 4. 设置管理

创建设置窗口和配置存储：
- API Key 管理
- 模型选择
- 快捷键自定义

## 调试技巧

### 主进程调试

```bash
# 启动时打开 DevTools
npm run dev
# 在主进程代码中使用 console.log
```

### 渲染进程调试

在应用中按 `Ctrl+Shift+I` 打开 DevTools

### 查看日志

```bash
# Windows
%APPDATA%/hoshino-doc-assistant/logs

# macOS
~/Library/Logs/hoshino-doc-assistant

# Linux
~/.config/hoshino-doc-assistant/logs
```

## 性能优化

1. **窗口显示优化**: 使用 `show: false` + `ready-to-show` 事件
2. **内存管理**: 及时清理不用的文档索引
3. **异步处理**: 文档解析和索引在后台进行
4. **缓存策略**: 缓存常用文档的向量

## 测试

### 单元测试

```bash
npm run test
```

### E2E 测试

使用 Spectron 或 Playwright 进行端到端测试

## 发布流程

1. 更新版本号：`package.json`
2. 构建应用：`npm run build`
3. 打包：`npm run package`
4. 测试安装包
5. 发布到 GitHub Releases

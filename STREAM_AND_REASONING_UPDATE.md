# 流式输出和思维链功能更新

## 🎉 新功能

### 1. 流式输出（Stream Output）
- AI 回复以打字机效果逐字显示
- 提供更流畅的交互体验
- 可在设置中开关

### 2. 思维链显示（Reasoning Content）
- 支持推理模型（DeepSeek Reasoner、DeepSeek-R1）的思维过程展示
- 可折叠的思维链面板
- 独立于主要回复内容
- 可在设置中开关

## 📝 更新内容

### 后端改动

1. **类型定义** (`src/main/types.d.ts`)
   - 添加 `streamOutput` 和 `showReasoningContent` 配置项
   - 添加 `reasoningContent` 到 `AIResponse` 接口

2. **配置服务** (`src/main/services/configService.ts`)
   - 默认启用流式输出和思维链显示

3. **AI 服务** (`src/main/services/aiService.ts`)
   - 新增 `chatStream()` 异步生成器方法
   - 支持流式输出和思维链内容提取

4. **主进程** (`src/main/main.ts`)
   - 新增 `send-message-stream` IPC 处理器
   - 通过事件发送流式数据块

5. **预加载脚本** (`src/main/preload.ts`)
   - 暴露 `sendMessageStream` 和 `onMessageStreamChunk` API

### 前端改动

1. **类型定义** (`src/renderer/global.d.ts`)
   - 添加流式 API 类型定义
   - 添加 `reasoningContent` 到 `Message` 接口

2. **设置界面** (`src/renderer/Settings.tsx`)
   - 添加"启用流式输出"开关
   - 添加"显示思维链内容"开关（仅推理模型）
   - 更新配置加载和保存逻辑

3. **主应用** (`src/renderer/App.tsx`)
   - 实现流式消息接收和显示
   - 添加思维链面板组件
   - 支持流式和非流式模式切换

4. **样式** (`src/renderer/App.css`)
   - 添加思维链面板样式
   - 可折叠/展开效果
   - 滚动和格式化

## 🚀 使用方法

### 启用流式输出
1. 打开设置（⚙️）
2. 勾选"启用流式输出"
3. 保存

### 启用思维链
1. 选择推理模型：
   - 云端：`deepseek-reasoner`
   - 本地：`deepseek-r1:7b`
2. 勾选"显示思维链内容"
3. 保存

### 查看思维链
发送需要推理的问题，点击 "🧠 思维过程" 展开查看。

## 📚 文档

- `流式输出和思维链功能说明.md` - 完整功能说明
- `测试流式输出和思维链.md` - 测试指南

## ✅ 测试建议

### 测试流式输出
```
请写一首关于春天的诗
```

### 测试思维链
```
9.11 和 9.8 哪个更大？
```

## 🔧 技术细节

### 流式输出流程
1. 前端调用 `sendMessageStream()`
2. 主进程创建流式请求
3. 通过 `message-stream-chunk` 事件发送数据块
4. 前端实时更新消息显示

### 思维链提取
1. 检测推理模型
2. 从 `delta.reasoning_content` 提取思维链
3. 独立显示在可折叠面板中

## 🎯 支持的模型

### 推理模型（支持思维链）
- `deepseek-reasoner` (云端)
- `deepseek-r1:7b` (本地)
- `deepseek-r1:14b` (本地)
- `deepseek-r1:32b` (本地)

### 普通模型（不支持思维链）
- `deepseek-chat`
- `qwen2.5:7b`
- `llama3.2:3b`

## ⚠️ 注意事项

1. 流式输出会增加 IPC 通信频率
2. 思维链会增加 token 消耗
3. RAG 模式暂不支持流式输出
4. 需要网络连接下载训练数据（首次使用）

## 🐛 已知问题

- RAG 模式暂不支持流式输出（计划后续支持）

## 📅 更新日期

2024-01-XX

## 👥 贡献者

- Kiro AI Assistant

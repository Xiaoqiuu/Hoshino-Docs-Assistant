# 快速启动指南

## 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 安装步骤

### 1. 克隆项目（如果从 Git 获取）

```bash
git clone <repository-url>
cd hoshino-doc-assistant
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发模式

```bash
npm run dev
```

这会同时启动：
- Vite 开发服务器（端口 5173）
- Electron 应用

## 使用说明

### 基本操作

1. **唤出窗口**: 按 `Ctrl+Alt+H`（Windows/Linux）或 `Cmd+Alt+H`（macOS）
2. **隐藏窗口**: 点击关闭按钮或窗口失焦自动隐藏
3. **系统托盘**: 右键托盘图标查看菜单

### 对话模式

**普通对话**
- 直接在输入框输入问题
- 按回车或点击"发送"按钮
- AI 会给出回答

**文档问答**（当前为模拟模式）
- 选中任意文本
- 按 `Ctrl+Alt+H` 唤出窗口
- 窗口会显示"文档模式"标签
- 提问会基于选中的文本上下文

## 开发调试

### 打开开发者工具

**渲染进程（UI）**
- 在应用窗口按 `Ctrl+Shift+I`

**主进程**
- 查看终端输出的 console.log

### 热重载

- 修改 `src/renderer/` 下的文件会自动热重载
- 修改 `src/main/` 下的文件需要重启应用

### 常见问题

**Q: 快捷键不生效？**
A: 检查是否与其他应用冲突，可以在代码中修改快捷键

**Q: 窗口无法显示？**
A: 检查终端是否有错误信息，确保 Vite 服务器正常运行

**Q: 样式不正常？**
A: 清除缓存后重启：删除 `dist/` 文件夹

## 下一步

### 集成 AI 模型

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的 API Key：
```env
DEEPSEEK_API_KEY=your_api_key_here
```

3. 在 `src/main/main.ts` 中实现 AI 调用逻辑

### 添加文档解析

安装 PDF 解析库：
```bash
npm install pdf-parse
```

在 `src/main/services/` 创建文档解析服务

### 实现 RAG

安装向量数据库：
```bash
npm install @langchain/community faiss-node
```

实现文档检索和生成流程

## 构建和打包

### 构建应用

```bash
npm run build
```

输出在 `dist/` 目录

### 打包为安装程序

```bash
npm run package
```

输出在 `release/` 目录

## 项目结构说明

```
hoshino-doc-assistant/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── main.ts        # 应用入口，窗口管理
│   │   ├── preload.ts     # 安全的 IPC 桥接
│   │   └── types.d.ts     # TypeScript 类型定义
│   └── renderer/          # React UI
│       ├── App.tsx        # 主组件
│       ├── App.css        # 样式
│       ├── main.tsx       # React 入口
│       └── index.html     # HTML 模板
├── dist/                  # 构建输出
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置（渲染进程）
├── tsconfig.main.json     # TypeScript 配置（主进程）
└── vite.config.ts         # Vite 配置
```

## 获取帮助

- 查看 `README.md` 了解项目概况
- 查看 `DEVELOPMENT.md` 了解开发细节
- 查看 `PROJECT_OVERVIEW.md` 了解架构设计
- 查看 `requirement.md` 了解完整需求

## 贡献

欢迎提交 Issue 和 Pull Request！

---

祝你开发愉快！✨

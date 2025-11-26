# 安装依赖说明

## 需要安装的新依赖

由于项目使用了 workspace 协议，需要手动安装以下依赖：

```bash
# 方法 1: 直接安装（推荐）
npm install react-markdown@9.0.1

# 方法 2: 如果上面的命令失败，尝试清理后重新安装
npm cache clean --force
npm install
```

## 新增功能说明

### 1. ✅ 托盘右键设置功能
- 右键点击托盘图标
- 选择"设置"菜单项
- 会自动打开应用并显示设置界面

### 2. ✅ 自动刷新剪贴板
- 每次按 `Ctrl+Alt+H` 唤出窗口时
- 自动读取当前剪贴板内容
- 如果有文本，自动进入文档模式

### 3. ✅ Markdown 渲染
- AI 返回的内容支持 Markdown 格式
- 支持标题、列表、代码块、引用等
- 代码块有语法高亮背景

### 4. ✅ 美化加载动画
- 使用跳动的圆点动画
- 不再是转圈的加载效果
- 更加优雅和现代

## 使用说明

### 剪贴板功能使用
1. 在任何地方选中文本
2. 按 `Ctrl+C` 复制到剪贴板
3. 按 `Ctrl+Alt+H` 唤出 Hoshino
4. 自动检测到剪贴板内容并进入文档模式
5. 输入问题，AI 会基于剪贴板内容回答

### 托盘设置功能
1. 找到系统托盘中的 Hoshino 图标
2. 右键点击图标
3. 选择"设置"
4. 配置 API Key 等信息

## 技术实现

### 剪贴板读取
```typescript
// 使用 Electron 的 clipboard API
const { clipboard } = require('electron');
const text = clipboard.readText();
```

### IPC 通信
```typescript
// 主进程发送事件
mainWindow.webContents.send('window-shown');
mainWindow.webContents.send('open-settings');

// 渲染进程监听事件
window.electronAPI.onWindowShown(() => {
  refreshClipboard();
});
```

### Markdown 渲染
```typescript
import ReactMarkdown from 'react-markdown';

<ReactMarkdown>{msg.content}</ReactMarkdown>
```

## 下一步

运行以下命令启动应用：

```bash
npm install
npm run dev
```

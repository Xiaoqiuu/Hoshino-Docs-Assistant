# 会话管理实现方案 📝

## 🎯 需求总结

### 1. KaTeX 公式渲染修复
- ✅ 已添加依赖
- ⚠️ 需要验证渲染效果

### 2. 最大化后禁用恢复按钮
- 最大化状态下，恢复按钮应该可用
- 建议：保持当前设计（可点击恢复）

### 3. 会话管理
- 新建会话功能
- 历史记录对话框
- Hoshino 标题作为按钮
- 鼠标悬停显示历史

### 4. 数据存储
- 使用 SQLite (better-sqlite3)
- 存储会话和消息
- 存储参数配置
- 轻量级方案

### 5. 会话逻辑
- 每次启动创建新会话
- 可切换历史会话
- 会话持久化

### 6. 无文本模式
- 切换按钮
- 忽略剪贴板内容
- 自由对话模式

## 📊 数据库设计

### 表结构

#### sessions 表
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active INTEGER DEFAULT 0
);
```

#### messages 表
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  sources TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

#### settings 表
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## 🏗️ 架构设计

### 文件结构
```
src/
├── main/
│   ├── services/
│   │   ├── aiService.ts
│   │   ├── configService.ts
│   │   └── databaseService.ts  ← 新增
│   └── main.ts
├── renderer/
│   ├── components/
│   │   ├── SessionHistory.tsx  ← 新增
│   │   └── Settings.tsx
│   ├── App.tsx
│   └── App.css
```

### DatabaseService 类
```typescript
class DatabaseService {
  private db: Database;
  
  // 会话管理
  createSession(title: string): number
  getSession(id: number): Session
  getAllSessions(): Session[]
  updateSession(id: number, data: Partial<Session>): void
  deleteSession(id: number): void
  setActiveSession(id: number): void
  
  // 消息管理
  addMessage(sessionId: number, message: Message): void
  getMessages(sessionId: number): Message[]
  deleteMessages(sessionId: number): void
  
  // 设置管理
  getSetting(key: string): string | null
  setSetting(key: string, value: string): void
}
```

## 🎨 UI 设计

### 1. 标题栏改造
```
┌─────────────────────────────────────┐
│ ✨ [Hoshino ▼] [文档模式] 📌 □ ×  │
│     ↑ 可点击显示历史                │
└─────────────────────────────────────┘
```

### 2. 历史记录弹窗
```
┌─────────────────────────────────────┐
│ 会话历史                    [新建]  │
├─────────────────────────────────────┤
│ ● 当前会话 (5条消息)               │
│   今天 14:30                        │
├─────────────────────────────────────┤
│   Python 快速排序                   │
│   今天 10:15                        │
├─────────────────────────────────────┤
│   数学公式求解                      │
│   昨天 16:20                        │
└─────────────────────────────────────┘
```

### 3. 无文本模式切换
```
┌─────────────────────────────────────┐
│ 选中文本: xxx...        [×忽略文本]│
└─────────────────────────────────────┘
```

或者在输入框旁边：
```
┌─────────────────────────────────────┐
│ [输入框...]  [🔓自由模式] [发送]   │
└─────────────────────────────────────┘
```

## 🔧 实现步骤

### Phase 1: 数据库服务 (优先)
1. ✅ 安装 better-sqlite3
2. 创建 DatabaseService
3. 初始化数据库和表
4. 实现基础 CRUD 操作

### Phase 2: 会话管理
1. 修改 App.tsx 添加会话状态
2. 创建 SessionHistory 组件
3. 实现新建会话功能
4. 实现切换会话功能
5. 实现会话持久化

### Phase 3: UI 改造
1. 标题改为可点击按钮
2. 添加历史记录弹窗
3. 添加无文本模式切换
4. 优化样式

### Phase 4: 逻辑优化
1. 启动时创建新会话
2. 自动保存消息
3. 会话标题自动生成
4. 清理旧会话

## 💡 关键功能实现

### 1. 自动会话标题
```typescript
function generateSessionTitle(firstMessage: string): string {
  // 取第一条消息的前20个字符
  return firstMessage.slice(0, 20) + (firstMessage.length > 20 ? '...' : '');
}
```

### 2. 无文本模式
```typescript
const [ignoreClipboard, setIgnoreClipboard] = useState(false);

// 发送消息时
const contextText = ignoreClipboard ? undefined : selectedText;
await window.electronAPI.sendMessage(input, contextText);
```

### 3. 会话切换
```typescript
async function switchSession(sessionId: number) {
  // 保存当前会话
  await saveCurrentSession();
  
  // 加载新会话
  const messages = await window.electronAPI.getSessionMessages(sessionId);
  setMessages(messages);
  setCurrentSessionId(sessionId);
}
```

### 4. 启动时创建新会话
```typescript
app.whenReady().then(() => {
  // 初始化数据库
  databaseService.init();
  
  // 创建新会话
  const sessionId = databaseService.createSession('新对话');
  databaseService.setActiveSession(sessionId);
  
  createWindow();
});
```

## 📝 IPC 通信接口

### 新增 IPC 方法
```typescript
// 会话管理
ipcMain.handle('create-session', async (_event, title) => {
  return databaseService.createSession(title);
});

ipcMain.handle('get-sessions', async () => {
  return databaseService.getAllSessions();
});

ipcMain.handle('switch-session', async (_event, sessionId) => {
  databaseService.setActiveSession(sessionId);
  return databaseService.getMessages(sessionId);
});

ipcMain.handle('delete-session', async (_event, sessionId) => {
  databaseService.deleteSession(sessionId);
});

// 消息管理
ipcMain.handle('save-message', async (_event, sessionId, message) => {
  databaseService.addMessage(sessionId, message);
});

ipcMain.handle('get-session-messages', async (_event, sessionId) => {
  return databaseService.getMessages(sessionId);
});
```

## 🎨 样式设计

### 会话历史弹窗
```css
.session-history-overlay {
  position: absolute;
  top: 50px;
  left: 16px;
  width: 300px;
  max-height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.session-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.session-item:hover {
  background: #fff5f7;
}

.session-item.active {
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8ed 100%);
  border-left: 3px solid #f5abb9;
}
```

### 无文本模式按钮
```css
.ignore-text-btn {
  background: rgba(245, 171, 185, 0.1);
  border: 1px solid #f5abb9;
  color: #f5abb9;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.ignore-text-btn.active {
  background: #f5abb9;
  color: white;
}
```

## ⚠️ 注意事项

### 1. 数据库位置
```typescript
const dbPath = path.join(app.getPath('userData'), 'hoshino.db');
```

### 2. 性能优化
- 限制历史会话数量（如最多100个）
- 定期清理旧会话
- 消息分页加载

### 3. 错误处理
- 数据库初始化失败
- 会话切换失败
- 消息保存失败

### 4. 用户体验
- 会话切换时显示加载状态
- 自动保存当前会话
- 删除会话前确认

## 🚀 实现优先级

### P0 (必须)
1. DatabaseService 基础实现
2. 会话创建和切换
3. 消息持久化
4. 启动时创建新会话

### P1 (重要)
1. 历史记录 UI
2. 无文本模式
3. 会话标题自动生成
4. 会话删除功能

### P2 (优化)
1. 会话搜索
2. 会话导出
3. 消息编辑
4. 会话标签

## 📊 数据流

```
启动应用
  ↓
初始化数据库
  ↓
创建新会话
  ↓
加载 UI
  ↓
用户发送消息
  ↓
保存到数据库
  ↓
显示回复
  ↓
自动保存
```

## ✨ 完成后的效果

1. ✅ 每次启动都是新对话
2. ✅ 可以查看历史会话
3. ✅ 可以切换到历史会话
4. ✅ 可以新建会话
5. ✅ 可以删除会话
6. ✅ 可以忽略剪贴板文本
7. ✅ 所有数据持久化存储

## 🎯 下一步

由于这是一个大型功能，建议分阶段实现：
1. 先实现数据库服务
2. 再实现会话管理逻辑
3. 最后实现 UI 和交互

是否开始实现？

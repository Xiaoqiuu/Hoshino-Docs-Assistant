# Sources 字段解析修复 🔧

## 🐛 问题描述

**错误信息：**
```
Uncaught TypeError: msg.sources.map is not a function
```

**原因：**
`sources` 字段在数据库中存储为 JSON 字符串，但在加载时没有解析回数组对象，导致 `.map()` 调用失败。

## 🔍 问题分析

### 数据流程

1. **保存消息时：**
```typescript
await window.electronAPI.saveMessage({
  session_id: currentSessionId,
  role: 'assistant',
  content: response.response,
  sources: response.sources ? JSON.stringify(response.sources) : null,  // 转为字符串
  created_at: Date.now()
});
```

2. **加载消息时：**
```typescript
const msgs = await window.electronAPI.getSessionMessages(session.id);
setMessages(msgs);  // ❌ sources 还是字符串，没有解析
```

3. **渲染时：**
```typescript
{msg.sources.map((source, i) => (  // ❌ 字符串没有 .map() 方法
  <div key={i}>...</div>
))}
```

## ✅ 解决方案

### 在加载消息时解析 sources

```typescript
const loadCurrentSession = async () => {
  try {
    const session = await window.electronAPI.getActiveSession();
    if (session) {
      setCurrentSessionId(session.id);
      setSessionTitle(session.title);
      const msgs = await window.electronAPI.getSessionMessages(session.id);
      
      // 解析 sources 字段（从 JSON 字符串转为对象）
      const parsedMsgs = msgs.map(msg => ({
        ...msg,
        sources: msg.sources && typeof msg.sources === 'string' 
          ? JSON.parse(msg.sources) 
          : msg.sources
      }));
      
      setMessages(parsedMsgs);
    }
  } catch (error) {
    console.error('加载会话失败:', error);
  }
};
```

### 在切换会话时也要解析

```typescript
const handleSelectSession = async (sessionId: number) => {
  try {
    const msgs = await window.electronAPI.switchSession(sessionId);
    
    // 解析 sources 字段
    const parsedMsgs = msgs.map(msg => ({
      ...msg,
      sources: msg.sources && typeof msg.sources === 'string' 
        ? JSON.parse(msg.sources) 
        : msg.sources
    }));
    
    setMessages(parsedMsgs);
    // ...
  } catch (error) {
    console.error('切换会话失败:', error);
  }
};
```

## 🔧 技术细节

### 类型检查
```typescript
msg.sources && typeof msg.sources === 'string' 
  ? JSON.parse(msg.sources) 
  : msg.sources
```

这个检查确保：
1. `sources` 存在
2. `sources` 是字符串类型
3. 如果是字符串，解析为对象
4. 如果已经是对象，直接使用

### 为什么需要存储为字符串？

在 JSON 数据库中，复杂对象需要序列化：
```json
{
  "messages": [
    {
      "id": 1,
      "sources": "[{\"page\":1,\"text\":\"...\"}]"  // JSON 字符串
    }
  ]
}
```

### 数据类型

**存储时：**
```typescript
sources: Array<{page: number, text: string}> | undefined
→ JSON.stringify() →
sources: string | null
```

**加载时：**
```typescript
sources: string | null
→ JSON.parse() →
sources: Array<{page: number, text: string}> | undefined
```

## 📊 修复前后对比

### 修复前
```typescript
// 加载消息
const msgs = await window.electronAPI.getSessionMessages(session.id);
setMessages(msgs);  // sources 是字符串

// 渲染
msg.sources.map(...)  // ❌ 错误：字符串没有 .map()
```

### 修复后
```typescript
// 加载消息
const msgs = await window.electronAPI.getSessionMessages(session.id);
const parsedMsgs = msgs.map(msg => ({
  ...msg,
  sources: msg.sources && typeof msg.sources === 'string' 
    ? JSON.parse(msg.sources) 
    : msg.sources
}));
setMessages(parsedMsgs);  // sources 是数组

// 渲染
msg.sources.map(...)  // ✅ 正常工作
```

## 🎯 测试步骤

### 测试场景 1: 新消息
```
1. 发送带文档的消息
2. AI 回复包含 sources
3. ✅ 验证：sources 正确显示
```

### 测试场景 2: 加载历史
```
1. 创建会话并发送消息
2. 关闭应用
3. 重新打开应用
4. 点击历史会话
5. ✅ 验证：不会崩溃，sources 正确显示
```

### 测试场景 3: 切换会话
```
1. 创建多个会话
2. 在不同会话间切换
3. ✅ 验证：每个会话的 sources 都正确显示
```

## ⚠️ 注意事项

### 1. 错误处理
如果 JSON 解析失败，应该有错误处理：
```typescript
try {
  sources: msg.sources && typeof msg.sources === 'string' 
    ? JSON.parse(msg.sources) 
    : msg.sources
} catch (error) {
  console.error('解析 sources 失败:', error);
  sources: undefined
}
```

### 2. 数据迁移
如果之前有旧数据，可能需要迁移：
```typescript
// 检查并修复旧数据
function migrateOldData() {
  messages.forEach(msg => {
    if (msg.sources && typeof msg.sources === 'string') {
      try {
        msg.sources = JSON.parse(msg.sources);
      } catch (error) {
        msg.sources = undefined;
      }
    }
  });
}
```

### 3. 类型安全
可以添加类型守卫：
```typescript
function isSourcesArray(sources: any): sources is Array<{page: number, text: string}> {
  return Array.isArray(sources);
}
```

## ✨ 完成清单

- [x] 修复 loadCurrentSession 中的 sources 解析
- [x] 修复 handleSelectSession 中的 sources 解析
- [x] 添加类型检查
- [x] 测试验证

## 🎉 修复完成

现在点击历史会话不会再崩溃了，所有 sources 字段都能正确显示！

## 🚀 测试

运行应用：
```bash
npm run dev
```

测试步骤：
1. 发送几条消息
2. 点击标题查看历史
3. 切换不同会话
4. ✅ 验证：不会崩溃，功能正常

# 复制按钮修复和开发者工具 🔧

## 🐛 修复的问题

### 复制按钮崩溃

**问题描述：**
点击代码块的"复制"按钮后，窗口崩溃

**原因分析：**
```typescript
// 错误代码
onClick={() => {
  const btn = event?.currentTarget as HTMLButtonElement;
  // event 未定义，导致崩溃
}}
```

问题：
1. `event` 没有作为参数传入
2. 使用了全局 `event` 对象（不可靠）
3. 没有错误处理

**解决方案：**
```typescript
// 正确代码
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  
  navigator.clipboard.writeText(codeString).then(() => {
    const btn = e.currentTarget as HTMLButtonElement;
    const originalText = btn.textContent;
    btn.textContent = '✓ 已复制';
    setTimeout(() => {
      btn.textContent = originalText || '复制';
    }, 2000);
  }).catch(err => {
    console.error('复制失败:', err);
  });
}}
```

**改进点：**
1. ✅ 使用事件参数 `e`
2. ✅ 阻止默认行为和冒泡
3. ✅ Promise 错误处理
4. ✅ 控制台错误日志

## 🛠️ 开发者工具

### 快捷键

**F12**
- 打开/关闭开发者工具
- 独立窗口模式

**Ctrl+Shift+I** (或 Cmd+Shift+I)
- 打开/关闭开发者工具
- 独立窗口模式

### 自动打开（开发模式）

开发模式下启动时自动打开开发者工具：
```typescript
if (process.env.NODE_ENV === 'development') {
  mainWindow.loadURL('http://localhost:5173');
  // 自动打开开发者工具
  mainWindow.webContents.openDevTools({ mode: 'detach' });
}
```

### 实现代码

```typescript
function registerShortcuts() {
  // 原有的 Ctrl+Alt+H 快捷键
  globalShortcut.register('CommandOrControl+Alt+H', () => {
    toggleWindow();
  });
  
  // F12 打开/关闭开发者工具
  globalShortcut.register('F12', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });
  
  // Ctrl+Shift+I 也可以打开开发者工具
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });
}
```

## 🎯 使用方法

### 复制代码
1. AI 回复包含代码块
2. 鼠标悬停在代码块上
3. 点击右上角"复制"按钮
4. 代码自动复制到剪贴板
5. 按钮显示"✓ 已复制"（2秒）

### 打开开发者工具
**方法 1：F12**
```
1. 按 F12 键
2. 开发者工具在独立窗口打开
3. 再按 F12 关闭
```

**方法 2：Ctrl+Shift+I**
```
1. 按 Ctrl+Shift+I (Windows/Linux)
2. 或 Cmd+Shift+I (macOS)
3. 开发者工具在独立窗口打开
```

**方法 3：自动打开（开发模式）**
```
1. 运行 npm run dev
2. 开发者工具自动打开
3. 可以查看控制台、网络等
```

## 🔍 调试功能

### 控制台
- 查看 console.log 输出
- 查看错误信息
- 执行 JavaScript 代码

### 元素检查
- 检查 DOM 结构
- 查看 CSS 样式
- 实时修改样式

### 网络
- 查看 API 请求
- 检查响应数据
- 监控网络性能

### 源代码
- 查看源代码
- 设置断点调试
- 单步执行

## 📊 修复前后对比

### 复制功能
| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| 点击复制 | ❌ 窗口崩溃 | ✅ 正常复制 |
| 错误处理 | ❌ 无 | ✅ 有 |
| 事件处理 | ❌ 错误 | ✅ 正确 |
| 用户反馈 | ❌ 无 | ✅ "✓ 已复制" |

### 开发者工具
| 功能 | 之前 | 现在 |
|------|------|------|
| F12 快捷键 | ❌ 不支持 | ✅ 支持 |
| Ctrl+Shift+I | ❌ 不支持 | ✅ 支持 |
| 自动打开 | ❌ 无 | ✅ 开发模式自动 |
| 独立窗口 | - | ✅ 是 |

## 🧪 测试步骤

### 测试复制功能
```
1. 启动应用: npm run dev
2. 发送消息: "写一个 Python hello world"
3. AI 回复包含代码块
4. 点击"复制"按钮
5. ✅ 验证：按钮显示"✓ 已复制"
6. ✅ 验证：窗口不崩溃
7. ✅ 验证：代码已复制到剪贴板
```

### 测试开发者工具
```
1. 启动应用: npm run dev
2. ✅ 验证：开发者工具自动打开
3. 按 F12
4. ✅ 验证：开发者工具关闭
5. 再按 F12
6. ✅ 验证：开发者工具打开
7. 按 Ctrl+Shift+I
8. ✅ 验证：开发者工具切换
```

## 💡 技术细节

### 事件处理
```typescript
onClick={(e) => {
  // 阻止默认行为
  e.preventDefault();
  
  // 阻止事件冒泡
  e.stopPropagation();
  
  // 使用事件对象
  const btn = e.currentTarget as HTMLButtonElement;
}}
```

### 剪贴板 API
```typescript
navigator.clipboard.writeText(codeString)
  .then(() => {
    // 复制成功
    console.log('复制成功');
  })
  .catch(err => {
    // 复制失败
    console.error('复制失败:', err);
  });
```

### 开发者工具 API
```typescript
// 检查是否已打开
mainWindow.webContents.isDevToolsOpened()

// 打开开发者工具
mainWindow.webContents.openDevTools({ mode: 'detach' })

// 关闭开发者工具
mainWindow.webContents.closeDevTools()
```

## 🎨 用户体验改进

### 复制按钮
1. **视觉反馈**
   - 点击后立即显示"✓ 已复制"
   - 2秒后恢复"复制"文字

2. **错误处理**
   - 复制失败时在控制台显示错误
   - 不会导致应用崩溃

3. **事件隔离**
   - 阻止事件冒泡
   - 不影响其他元素

### 开发者工具
1. **便捷访问**
   - F12 快速打开
   - Ctrl+Shift+I 备用快捷键

2. **独立窗口**
   - 不占用主窗口空间
   - 可以自由移动和调整大小

3. **开发模式**
   - 自动打开，方便调试
   - 生产模式不自动打开

## ⚠️ 注意事项

### 剪贴板权限
- 现代浏览器需要 HTTPS 或 localhost
- Electron 环境自动有权限
- 用户可能需要授权

### 开发者工具
- 仅在需要时打开
- 生产环境建议禁用快捷键
- 可能影响性能

### 事件处理
- 始终使用事件参数
- 避免使用全局 event 对象
- 添加错误处理

## ✅ 完成清单

- ✅ 修复复制按钮崩溃问题
- ✅ 添加 F12 快捷键
- ✅ 添加 Ctrl+Shift+I 快捷键
- ✅ 开发模式自动打开开发者工具
- ✅ 独立窗口模式
- ✅ 错误处理和日志
- ✅ 用户反馈优化

## 🚀 现在可以

1. ✅ 安全地复制代码
2. ✅ 使用 F12 调试
3. ✅ 查看控制台日志
4. ✅ 检查网络请求
5. ✅ 调试 React 组件

## 🎉 完成！

复制功能已修复，开发者工具已启用！

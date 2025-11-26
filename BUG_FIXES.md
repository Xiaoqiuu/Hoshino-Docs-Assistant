# Bug 修复说明

## 🐛 修复的问题

### 1. 最大化后恢复按钮无反应
**问题描述：**
- 点击最大化按钮后，窗口正常最大化
- 再次点击恢复按钮时，窗口没有反应

**原因分析：**
- `unmaximize()` 和 `setSize()` 之间没有等待时间
- 窗口状态切换需要时间完成

**解决方案：**
```typescript
if (isCurrentlyMaximized) {
  mainWindow.unmaximize();
  
  // 等待 unmaximize 完成
  await new Promise(resolve => setTimeout(resolve, 100));
  
  mainWindow.setResizable(false);
  mainWindow.setSize(600, 400);
  mainWindow.center();
  
  return false;
}
```

### 2. 关闭后再唤出报错
**错误信息：**
```
TypeError: Error processing argument at index 0, conversion failure from
at toggleWindow
at Tray.<anonymous>
```

**问题描述：**
- 最大化窗口后关闭
- 再次通过快捷键或托盘唤出时报错
- 错误发生在 `setPosition()` 调用时

**原因分析：**
- 窗口在最大化状态下被隐藏
- 再次显示时尝试对最大化窗口调用 `setPosition()`
- 最大化窗口不能设置位置，导致参数错误

**解决方案：**
```typescript
function toggleWindow() {
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    // 如果窗口是最大化状态，先恢复
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      mainWindow.setResizable(false);
      mainWindow.setSize(600, 400);
    }
    
    // 然后再设置位置
    const { screen } = require('electron');
    const cursorPosition = screen.getCursorScreenPoint();
    const currentDisplay = screen.getDisplayNearestPoint(cursorPosition);
    
    const windowBounds = mainWindow.getBounds();
    const x = Math.round(currentDisplay.bounds.x + (currentDisplay.bounds.width - windowBounds.width) / 2);
    const y = Math.round(currentDisplay.bounds.y + currentDisplay.bounds.height * 0.3);
    
    mainWindow.setPosition(x, y);
    mainWindow.show();
    mainWindow.focus();
    
    mainWindow.webContents.send('window-shown');
  }
}
```

### 3. UI 状态不同步
**问题描述：**
- 窗口隐藏后再显示，UI 仍显示最大化图标

**解决方案：**
```typescript
window.electronAPI.onWindowShown(() => {
  refreshClipboard();
  inputRef.current?.focus();
  // 重置最大化状态
  setIsMaximized(false);
});
```

## ✅ 修复后的行为

### 正常流程 1: 最大化和恢复
```
1. 点击 🗖 按钮 → 窗口最大化
2. 按钮变为 🗗
3. 点击 🗗 按钮 → 窗口恢复到 600x400
4. 按钮变回 🗖
5. 窗口居中显示
```

### 正常流程 2: 最大化后关闭再唤出
```
1. 点击 🗖 按钮 → 窗口最大化
2. 点击 × 关闭窗口
3. 按 Ctrl+Alt+H 唤出
4. 窗口以小窗口模式显示（600x400）
5. 按钮显示为 🗖（未最大化状态）
6. 窗口正常居中
```

### 正常流程 3: 托盘唤出
```
1. 最大化窗口
2. 关闭窗口
3. 点击托盘图标
4. 窗口以小窗口模式显示
5. 不会报错
```

## 🔧 技术细节

### 窗口状态管理
```typescript
// 检查窗口是否最大化
const isMaximized = mainWindow.isMaximized();

// 最大化窗口
mainWindow.setResizable(true);
mainWindow.maximize();

// 恢复窗口
mainWindow.unmaximize();
await new Promise(resolve => setTimeout(resolve, 100)); // 等待完成
mainWindow.setResizable(false);
mainWindow.setSize(600, 400);
mainWindow.center();
```

### 状态同步
```typescript
// 主进程 → 渲染进程
mainWindow.webContents.send('window-shown');

// 渲染进程监听
window.electronAPI.onWindowShown(() => {
  setIsMaximized(false); // 重置状态
});
```

## 🧪 测试步骤

### 测试 1: 最大化恢复
```
1. 启动应用
2. 点击最大化按钮
3. 验证窗口最大化
4. 点击恢复按钮
5. 验证窗口恢复到 600x400
6. 验证窗口居中显示
```

### 测试 2: 最大化后关闭
```
1. 最大化窗口
2. 点击关闭按钮
3. 按 Ctrl+Alt+H 唤出
4. 验证窗口正常显示
5. 验证没有错误
6. 验证按钮状态正确
```

### 测试 3: 托盘操作
```
1. 最大化窗口
2. 关闭窗口
3. 右键托盘图标
4. 点击"显示 Hoshino"
5. 验证窗口正常显示
6. 验证没有错误
```

### 测试 4: 多次切换
```
1. 最大化 → 恢复 → 最大化 → 恢复
2. 验证每次都正常工作
3. 最大化 → 关闭 → 唤出 → 最大化 → 关闭 → 唤出
4. 验证每次都正常工作
```

## 📊 修复前后对比

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 点击恢复按钮 | ❌ 无反应 | ✅ 正常恢复 |
| 最大化后关闭再唤出 | ❌ 报错崩溃 | ✅ 正常显示 |
| UI 状态同步 | ❌ 不同步 | ✅ 同步正确 |
| 窗口位置 | ❌ 可能错误 | ✅ 正确居中 |

## ⚠️ 注意事项

1. **异步等待**
   - `unmaximize()` 后需要等待 100ms
   - 确保窗口状态完全切换

2. **状态检查**
   - 唤出窗口前检查是否最大化
   - 避免对最大化窗口设置位置

3. **UI 同步**
   - 窗口显示时重置 UI 状态
   - 确保按钮图标正确

4. **窗口属性**
   - 小窗口模式：`resizable: false`
   - 最大化模式：`resizable: true`

## 🎯 相关代码位置

- **主进程窗口管理**: `src/main/main.ts` - `toggleWindow()`
- **最大化切换**: `src/main/main.ts` - `toggle-maximize` handler
- **UI 状态管理**: `src/renderer/App.tsx` - `handleToggleMaximize()`
- **状态同步**: `src/renderer/App.tsx` - `onWindowShown` listener

## ✨ 完成

所有 bug 已修复，功能正常工作！

# 窗口管理修复说明

## 🔧 核心问题

### 问题根源
当窗口处于最大化状态时被隐藏，再次显示时调用 `setPosition()` 会导致错误：
```
TypeError: Error processing argument at index 0, conversion failure
```

这是因为：
1. 最大化的窗口不能设置位置
2. 隐藏的最大化窗口 `isMaximized()` 仍返回 true
3. `getBounds()` 返回的尺寸可能不准确

## ✅ 解决方案

### 1. 在所有隐藏操作前恢复窗口

#### 关闭按钮点击
```typescript
ipcMain.handle('hide-window', () => {
  if (!mainWindow) return;
  
  // 如果窗口是最大化状态，先恢复再隐藏
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    mainWindow.setResizable(false);
    mainWindow.setSize(600, 400);
  }
  
  mainWindow.hide();
});
```

#### 失去焦点自动隐藏
```typescript
mainWindow.on('blur', () => {
  if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
    const isPinned = mainWindow.isAlwaysOnTop();
    if (!isPinned) {
      // 如果窗口是最大化状态，先恢复再隐藏
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        mainWindow.setResizable(false);
        mainWindow.setSize(600, 400);
      }
      mainWindow.hide();
    }
  }
});
```

### 2. 显示窗口时使用固定尺寸

```typescript
function toggleWindow() {
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    try {
      // 如果窗口是最大化状态，先恢复
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        mainWindow.setResizable(false);
      }
      
      // 确保窗口大小正确（使用固定值而不是 getBounds）
      mainWindow.setSize(600, 400);
      
      // 计算位置（使用固定宽度 600）
      const x = Math.round(currentDisplay.bounds.x + (currentDisplay.bounds.width - 600) / 2);
      const y = Math.round(currentDisplay.bounds.y + currentDisplay.bounds.height * 0.3);
      
      mainWindow.setPosition(x, y);
      mainWindow.show();
      mainWindow.focus();
      
      mainWindow.webContents.send('window-shown');
    } catch (error) {
      console.error('切换窗口失败:', error);
      // 备用方案
      try {
        mainWindow.setSize(600, 400);
        mainWindow.center();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('window-shown');
      } catch (e) {
        console.error('窗口显示失败:', e);
      }
    }
  }
}
```

### 3. 添加错误处理

使用 try-catch 包裹窗口操作，提供备用方案：
- 主方案：计算位置并设置
- 备用方案：居中显示

## 🎯 修复的场景

### 场景 1: 最大化后点击关闭
```
1. 点击最大化按钮 → 窗口最大化
2. 点击关闭按钮 × 
   → 窗口先恢复到 600x400
   → 然后隐藏
3. 按 Ctrl+Alt+H 唤出
   → 窗口正常显示
   → 不会报错
```

### 场景 2: 最大化后失去焦点
```
1. 点击最大化按钮 → 窗口最大化
2. 点击其他应用（未置顶时）
   → 窗口先恢复到 600x400
   → 然后自动隐藏
3. 按 Ctrl+Alt+H 唤出
   → 窗口正常显示
   → 不会报错
```

### 场景 3: 最大化后托盘操作
```
1. 点击最大化按钮 → 窗口最大化
2. 点击关闭按钮
3. 点击托盘图标
   → 窗口正常显示为小窗口
   → 不会报错
```

### 场景 4: 置顶模式下最大化
```
1. 点击置顶按钮 📌
2. 点击最大化按钮 🗖
3. 点击关闭按钮 ×
   → 窗口恢复并隐藏
4. 再次唤出
   → 正常显示
```

## 🧪 测试步骤

### 测试 1: 基本最大化流程
```bash
1. 启动应用: npm run dev
2. 按 Ctrl+Alt+H 唤出窗口
3. 点击最大化按钮
4. 验证窗口最大化
5. 点击关闭按钮
6. 按 Ctrl+Alt+H 再次唤出
7. ✅ 验证窗口正常显示，无错误
```

### 测试 2: 失去焦点场景
```bash
1. 唤出窗口
2. 点击最大化
3. 点击桌面其他位置（失去焦点）
4. 验证窗口自动隐藏
5. 再次唤出
6. ✅ 验证窗口正常显示，无错误
```

### 测试 3: 托盘操作
```bash
1. 唤出窗口
2. 点击最大化
3. 点击关闭
4. 右键托盘图标
5. 点击"显示 Hoshino"
6. ✅ 验证窗口正常显示，无错误
```

### 测试 4: 置顶模式
```bash
1. 唤出窗口
2. 点击置顶按钮 📌
3. 点击最大化按钮 🗖
4. 点击关闭按钮 ×
5. 再次唤出
6. ✅ 验证窗口正常显示，无错误
```

### 测试 5: 多次切换
```bash
1. 最大化 → 关闭 → 唤出
2. 最大化 → 关闭 → 唤出
3. 最大化 → 关闭 → 唤出
4. ✅ 验证每次都正常工作
```

## 📊 技术细节

### 窗口状态管理流程

```
显示窗口:
  检查 isMaximized() 
    → 是: unmaximize() + setResizable(false)
    → 否: 继续
  setSize(600, 400)
  计算位置
  setPosition(x, y)
  show()

隐藏窗口:
  检查 isMaximized()
    → 是: unmaximize() + setResizable(false) + setSize(600, 400)
    → 否: 继续
  hide()
```

### 关键点

1. **隐藏前恢复**
   - 确保窗口始终以小窗口状态隐藏
   - 下次显示时状态一致

2. **使用固定尺寸**
   - 不依赖 `getBounds()` 的返回值
   - 直接使用 600x400

3. **错误处理**
   - try-catch 包裹所有窗口操作
   - 提供备用显示方案

4. **状态同步**
   - 窗口显示时通知渲染进程
   - 重置 UI 状态

## ⚠️ 注意事项

1. **窗口操作顺序**
   ```typescript
   // 正确顺序
   unmaximize() → setResizable(false) → setSize() → setPosition() → show()
   
   // 错误顺序（会报错）
   setPosition() → unmaximize() → show()
   ```

2. **异步操作**
   - 某些窗口操作可能需要时间
   - 使用 try-catch 处理可能的错误

3. **状态检查**
   - 每次操作前检查 `isMaximized()`
   - 确保窗口处于正确状态

## 🎉 预期结果

修复后，无论窗口处于什么状态（最大化、置顶、普通），都能：
- ✅ 正常关闭
- ✅ 正常唤出
- ✅ 不会报错
- ✅ 位置正确
- ✅ 尺寸正确

## 🔍 调试建议

如果仍有问题，检查：

1. **控制台日志**
   ```typescript
   console.log('窗口状态:', {
     isMaximized: mainWindow.isMaximized(),
     isVisible: mainWindow.isVisible(),
     bounds: mainWindow.getBounds()
   });
   ```

2. **错误捕获**
   - 查看 try-catch 中的错误信息
   - 检查是否进入备用方案

3. **窗口属性**
   - 验证 resizable 状态
   - 验证窗口尺寸

## ✨ 完成

所有窗口管理问题已修复，可以正常使用了！

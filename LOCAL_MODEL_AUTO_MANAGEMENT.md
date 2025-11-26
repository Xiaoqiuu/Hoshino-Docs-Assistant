# 本地模型自动管理功能

## 功能概述

Hoshino 现在支持自动管理 Ollama 服务和本地模型，用户无需手动操作命令行。

## 主要功能

### 1. 自动启动 Ollama 服务

当用户在设置中启用"本地模型"后：
- 应用启动时自动检测 Ollama 是否已安装
- 如果已安装，自动启动 Ollama 服务
- 无需用户手动运行 `ollama serve`

### 2. 可视化状态监控

在设置界面中实时显示：
- ✅ Ollama 安装状态
- ✅ 服务运行状态
- ✅ 已安装的模型列表

### 3. 一键下载模型

- 在设置界面输入模型名称（如 `deepseek-r1:7b`）
- 点击"下载模型"按钮
- 应用内自动下载，无需命令行操作
- 实时显示下载进度提示

### 4. 智能配置同步

- 切换本地/云端模式后，配置立即生效
- AI 服务自动重新加载配置
- 无需重启应用

## 使用流程

### 首次使用本地模型

1. **安装 Ollama**
   - 访问 https://ollama.com 下载安装
   - 安装完成后重启 Hoshino

2. **启用本地模式**
   - 打开设置（点击右上角 ⚙️）
   - 勾选"使用本地模型（Ollama）"
   - 应用会自动检测并启动 Ollama 服务

3. **下载模型**（如果还没有模型）
   - 在"本地模型"输入框输入：`deepseek-r1:7b`
   - 点击"下载 deepseek-r1:7b"按钮
   - 等待下载完成（首次下载约 4.7GB）

4. **测试连接**
   - 点击"测试连接"按钮
   - 看到"✅ 本地模型 deepseek-r1:7b 连接成功"
   - 点击"保存"

5. **开始对话**
   - 关闭设置界面
   - 输入问题，享受本地 AI 对话

### 切换模型

如果想使用其他模型：
1. 在设置中修改"本地模型"为其他模型名（如 `qwen2.5:7b`）
2. 如果该模型未安装，会显示"下载模型"按钮
3. 点击下载，等待完成
4. 测试连接并保存

## 技术实现

### 自动服务管理

```typescript
// 应用启动时
if (config.localMode) {
  // 检查 Ollama 是否安装
  const installCheck = await ollamaService.checkInstalled();
  
  if (installCheck.installed) {
    // 自动启动服务
    await ollamaService.startServer();
    
    // 检查已安装的模型
    await ollamaService.listModels();
  }
}

// 应用退出时
app.on('will-quit', () => {
  // 自动停止 Ollama 服务
  ollamaService.stopServer();
});
```

### 配置热更新

```typescript
// 设置保存时
ipcMain.handle('set-config', async (_event, config) => {
  configService.saveConfig(config);
  
  // 立即重新加载 AI 服务配置
  const fullConfig = configService.getConfig();
  aiService.loadConfigFromService(fullConfig);
});
```

### 模型下载

```typescript
// 一键下载模型
const result = await window.electronAPI.ollmaPullModel('deepseek-r1:7b');
// 应用内调用 ollama pull 命令
// 无需用户打开终端
```

## 支持的操作系统

- ✅ Windows
- ✅ macOS
- ✅ Linux

## 常见问题

### Q: 提示"Ollama 未安装"怎么办？

**A:** 
1. 访问 https://ollama.com 下载安装
2. 安装完成后重启 Hoshino
3. 应用会自动检测并启动服务

### Q: 服务启动失败？

**A:** 
1. 检查 Ollama 是否正确安装
2. 尝试手动运行 `ollama serve` 测试
3. 查看应用日志（位于用户数据目录的 `ollama.log`）

### Q: 模型下载很慢？

**A:** 
- 模型文件较大（7B 约 4.7GB）
- 首次下载需要时间
- 可以在终端运行 `ollama pull deepseek-r1:7b` 查看详细进度

### Q: 如何查看已安装的模型？

**A:** 
- 在设置界面会自动显示已安装模型数量
- 或在终端运行 `ollama list`

### Q: 可以同时使用多个模型吗？

**A:** 
- 可以安装多个模型
- 但同一时间只能使用一个模型
- 在设置中切换即可

## 优势对比

### 传统方式
```bash
# 1. 打开终端
# 2. 启动服务
ollama serve

# 3. 新开终端
# 4. 下载模型
ollama pull deepseek-r1:7b

# 5. 保持终端运行
# 6. 配置应用
```

### 自动管理方式
```
1. 勾选"使用本地模型"
2. 点击"下载模型"
3. 点击"保存"
4. 开始对话 ✨
```

## 日志位置

Ollama 服务日志保存在：
- Windows: `%APPDATA%/hoshino/ollama.log`
- macOS: `~/Library/Application Support/hoshino/ollama.log`
- Linux: `~/.config/hoshino/ollama.log`

## 未来计划

- [ ] 模型下载进度条
- [ ] 模型管理界面（删除、更新）
- [ ] 多模型快速切换
- [ ] 模型性能监控
- [ ] 自动推荐合适的模型

---

**享受零配置的本地 AI 体验！** 🚀

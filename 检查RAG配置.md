# 检查 RAG 配置

## 当前实现确认

✅ **RAG 流程是正确的**：

```
用户提问
  ↓
1. 向量检索（找到相关文档片段）
  ↓
2. 构建上下文（将片段组合）
  ↓
3. 调用 AI 模型（让 AI 基于上下文生成回答）← 这一步使用 AI
  ↓
4. 返回 AI 的回答 + 来源引用
```

## 为什么会回复"抱歉"？

如果 AI 总是回复"抱歉，我无法生成回答"，有以下可能：

### 可能 1：AI 服务未配置

**检查方法**：
1. 打开应用设置
2. 查看"本地模型"部分
3. 确认：
   - ✅ "使用本地模型" 已启用
   - ✅ Ollama 地址正确：`http://localhost:11434`
   - ✅ 模型名称正确：`deepseek-r1:7b`

**测试方法**：
1. 在设置中点击"测试连接"
2. 应该显示"连接成功"
3. 如果失败，说明 Ollama 未启动或配置错误

### 可能 2：Ollama 服务未启动

**检查方法**：
```bash
# Windows PowerShell
Get-Process ollama

# 或者测试 API
curl http://localhost:11434/api/tags
```

**启动方法**：
```bash
ollama serve
```

或在应用设置中点击"启动 Ollama 服务"

### 可能 3：模型未下载

**检查方法**：
```bash
ollama list
```

应该看到你配置的模型（如 `deepseek-r1:7b`）

**下载方法**：
```bash
ollama pull deepseek-r1:7b
```

### 可能 4：AI 返回空内容

这是最可能的原因！查看控制台日志：

```
AI 模型响应: { model: "deepseek-r1:7b", choices: 1, hasContent: false }
```

如果 `hasContent: false`，说明模型返回了空内容。

**原因**：
- 上下文太长，超过模型限制
- 模型加载失败
- Ollama 服务异常

**解决方法**：
1. 重启 Ollama 服务
2. 尝试更小的文档
3. 检查 Ollama 日志

## 完整的检查清单

### 步骤 1：检查 Ollama

```bash
# 1. 检查是否安装
ollama --version

# 2. 检查服务是否运行
# Windows
Get-Process ollama
# 或
curl http://localhost:11434/api/tags

# 3. 检查模型
ollama list

# 4. 测试模型
ollama run deepseek-r1:7b "你好"
```

### 步骤 2：检查应用配置

1. 打开设置 → 本地模型
2. 确认配置：
   ```
   使用本地模型: ✅
   Ollama 地址: http://localhost:11434
   模型名称: deepseek-r1:7b
   ```
3. 点击"测试连接"
4. 应该显示"连接成功"

### 步骤 3：查看控制台日志

1. 按 F12 打开开发者工具
2. 切换到 Console 标签
3. 尝试文档问答
4. 查看日志输出

**正常的日志**：
```
RAG 问答开始: { question: "...", documentIds: [...] }
1. 向量化问题...
问题向量维度: 384
2. 检索相关文档块...
检索到文档块数量: 5
3. 构建上下文...
上下文长度: 2500 字符
4. 调用 AI 模型...
AI 模型响应: { model: "deepseek-r1:7b", choices: 1, hasContent: true }
AI 响应长度: 150 字符
```

**异常的日志**：
```
AI 模型响应: { model: "deepseek-r1:7b", choices: 1, hasContent: false }
❌ AI 模型返回了空内容
```

或

```
Error: ECONNREFUSED
❌ 无法连接到 Ollama 服务
```

### 步骤 4：测试主聊天界面

如果文档库问答失败，尝试在主聊天界面测试：

1. 关闭文档库
2. 在主界面输入问题
3. 查看是否能正常回答

如果主界面也失败，说明是 AI 服务配置问题。
如果主界面正常，说明是 RAG 特定的问题。

## 常见错误及解决方案

### 错误 1：配置未生效

**症状**：设置中启用了本地模式，但仍然提示"API Key 未配置"

**原因**：配置未正确加载到 AI 服务

**解决**：
1. 重启应用
2. 在设置中重新保存配置
3. 查看控制台是否有"已加载配置"日志

### 错误 2：模型名称错误

**症状**：提示"model not found"

**原因**：配置的模型名称与实际下载的不一致

**解决**：
1. 运行 `ollama list` 查看实际模型名称
2. 在设置中更新为正确的名称（注意大小写）
3. 保存配置

### 错误 3：端口冲突

**症状**：Ollama 启动失败或无法连接

**原因**：11434 端口被占用

**解决**：
```bash
# 查找占用端口的进程
netstat -ano | findstr :11434

# 结束进程
taskkill /PID <进程ID> /F

# 重新启动 Ollama
ollama serve
```

### 错误 4：内存不足

**症状**：模型加载失败或响应很慢

**原因**：系统内存不足

**解决**：
1. 关闭其他占用内存的应用
2. 使用更小的模型（如 `mistral:7b`）
3. 增加系统内存

## 调试技巧

### 1. 启用详细日志

代码中已添加详细日志，查看控制台输出即可。

### 2. 单独测试 AI 服务

在主聊天界面测试，排除 RAG 相关问题。

### 3. 使用 curl 测试 Ollama

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "deepseek-r1:7b",
  "prompt": "你好",
  "stream": false
}'
```

### 4. 查看 Ollama 日志

Ollama 日志位置：
- Windows: `%USERPROFILE%\.ollama\logs\`
- macOS/Linux: `~/.ollama/logs/`

或在应用中查看：`用户数据目录/ollama.log`

## 总结

RAG 功能**确实使用了 AI**，流程是：

1. **检索**：从文档中找到相关片段
2. **增强**：将片段作为上下文
3. **生成**：AI 基于上下文生成回答

如果总是回复"抱歉"，99% 是因为：
- Ollama 服务未启动
- 模型未下载
- 配置不正确
- AI 返回空内容

按照上述检查清单逐步排查，应该能解决问题。

## 快速修复

最快的修复方法：

```bash
# 1. 启动 Ollama
ollama serve

# 2. 在另一个终端测试
ollama run deepseek-r1:7b "测试"

# 3. 如果成功，在应用中：
#    - 打开设置
#    - 启用"使用本地模型"
#    - 测试连接
#    - 重启应用
```

如果还有问题，请提供控制台的完整日志，我可以帮你进一步诊断。

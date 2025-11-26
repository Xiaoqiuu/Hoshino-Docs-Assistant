# 本地模型支持 - Ollama 集成

## 功能说明

现在 Hoshino 支持使用本地 AI 模型，通过 Ollama 运行 DeepSeek-R1、Qwen、Llama 等开源模型。

### 优势

- ✅ **完全本地运行**：数据不会发送到云端，保护隐私
- ✅ **无需 API Key**：不需要付费订阅
- ✅ **离线可用**：无需网络连接
- ✅ **多模型支持**：可以使用各种开源模型

## 快速开始

### 1. 安装 Ollama

访问 [ollama.com](https://ollama.com) 下载并安装 Ollama。

**Windows:**
```bash
# 下载安装包并运行
# https://ollama.com/download/windows
```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. 启动 Ollama 服务

```bash
ollama serve
```

服务将在 `http://localhost:11434` 启动。

### 3. 下载模型

推荐使用 DeepSeek-R1 7B 模型（约 4.7GB）：

```bash
ollama pull deepseek-r1:7b
```

其他可选模型：

```bash
# DeepSeek-R1 14B（更强大，需要更多内存）
ollama pull deepseek-r1:14b

# DeepSeek-R1 32B（最强大，需要大量内存）
ollama pull deepseek-r1:32b

# Qwen 2.5 7B（阿里通义千问）
ollama pull qwen2.5:7b

# Llama 3.2 3B（Meta 开源模型）
ollama pull llama3.2:3b

# Mistral 7B（法国 Mistral AI）
ollama pull mistral:7b
```

### 4. 在 Hoshino 中配置

1. 点击右上角 ⚙️ 设置按钮
2. 勾选 **"使用本地模型（Ollama）"**
3. 确认配置：
   - Ollama 服务地址：`http://localhost:11434`
   - 本地模型：`deepseek-r1:7b`（或你下载的其他模型）
4. 点击 **"测试连接"** 确认配置正确
5. 点击 **"保存"**

## 模型推荐

### DeepSeek-R1 系列（推荐）

- **deepseek-r1:7b**：最佳平衡，适合大多数用户
  - 内存需求：~8GB
  - 速度：快
  - 质量：优秀

- **deepseek-r1:14b**：更强大的推理能力
  - 内存需求：~16GB
  - 速度：中等
  - 质量：非常好

- **deepseek-r1:32b**：最强性能
  - 内存需求：~32GB
  - 速度：较慢
  - 质量：极佳

### 其他模型

- **qwen2.5:7b**：中文表现优秀
- **llama3.2:3b**：轻量级，速度快
- **mistral:7b**：英文表现优秀

## 常见问题

### Q: 提示 "无法连接到 Ollama 服务"

**A:** 确保 Ollama 服务已启动：
```bash
ollama serve
```

### Q: 提示 "本地模型请求失败"

**A:** 确保已下载模型：
```bash
ollama list  # 查看已安装的模型
ollama pull deepseek-r1:7b  # 下载模型
```

### Q: 响应速度慢

**A:** 
- 使用更小的模型（如 3B 或 7B）
- 确保有足够的内存
- 关闭其他占用资源的程序

### Q: 内存不足

**A:**
- 使用更小的模型
- 7B 模型需要约 8GB 内存
- 14B 模型需要约 16GB 内存
- 32B 模型需要约 32GB 内存

### Q: 如何切换回云端模型

**A:** 在设置中取消勾选 "使用本地模型（Ollama）"，然后配置 API Key。

## 性能对比

| 模型 | 大小 | 内存需求 | 速度 | 中文能力 | 推理能力 |
|------|------|----------|------|----------|----------|
| deepseek-r1:7b | 4.7GB | ~8GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| deepseek-r1:14b | 9GB | ~16GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| qwen2.5:7b | 4.7GB | ~8GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| llama3.2:3b | 2GB | ~4GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

## 技术细节

### Ollama API 兼容性

Ollama 提供 OpenAI 兼容的 API，因此 Hoshino 可以无缝切换：

```typescript
// 云端模式
baseURL: 'https://api.deepseek.com'
model: 'deepseek-chat'

// 本地模式
baseURL: 'http://localhost:11434/v1'
model: 'deepseek-r1:7b'
```

### 配置存储

配置保存在：
- Windows: `%APPDATA%/hoshino/config.json`
- macOS: `~/Library/Application Support/hoshino/config.json`
- Linux: `~/.config/hoshino/config.json`

## 更多资源

- [Ollama 官网](https://ollama.com)
- [Ollama 模型库](https://ollama.com/library)
- [DeepSeek-R1 介绍](https://github.com/deepseek-ai/DeepSeek-R1)
- [Qwen 介绍](https://github.com/QwenLM/Qwen)

---

**享受本地 AI 的强大能力！** 🚀

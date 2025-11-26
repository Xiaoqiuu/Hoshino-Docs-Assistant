# RAG ES Module 导入问题修复

## 问题描述

启动应用时报错：
```
Error [ERR_REQUIRE_ESM]: require() of ES Module @xenova/transformers not supported.
```

## 原因分析

`@xenova/transformers` 是一个 ES Module 包，但 Electron 的主进程默认使用 CommonJS 模块系统。TypeScript 编译后的代码使用 `require()` 导入，导致冲突。

## 解决方案

使用动态 `import()` 代替静态 `import` 语句。

### 修改前

```typescript
import { pipeline, env } from '@xenova/transformers';

env.cacheDir = './.cache';

export class EmbeddingService {
  private model: any = null;
  
  private async loadModel(): Promise<void> {
    this.model = await pipeline('feature-extraction', this.modelName);
  }
}
```

### 修改后

```typescript
export class EmbeddingService {
  private model: any = null;
  private transformers: any = null;
  
  private async loadTransformers(): Promise<void> {
    if (this.transformers) {
      return;
    }
    
    // 动态导入 ES Module
    this.transformers = await import('@xenova/transformers');
    this.transformers.env.cacheDir = './.cache';
  }
  
  private async loadModel(): Promise<void> {
    await this.loadTransformers();
    this.model = await this.transformers.pipeline('feature-extraction', this.modelName);
  }
}
```

## 关键点

1. **动态导入**：使用 `await import()` 而不是 `import` 语句
2. **懒加载**：只在需要时才导入模块
3. **缓存**：导入后缓存 transformers 对象，避免重复导入
4. **配置**：通过 `this.transformers.env` 访问配置

## 优势

- ✅ 兼容 CommonJS 和 ES Module
- ✅ 按需加载，减少启动时间
- ✅ 不需要修改 tsconfig 或 package.json
- ✅ 保持代码清晰

## 测试

修复后重新构建：
```bash
npm run build:main
npm start
```

应用应该能正常启动，不再报 ES Module 错误。

## 相关文件

- `src/main/services/embeddingService.ts` - 已修复

## 注意事项

这个问题只影响主进程（Electron main process）。渲染进程使用 Vite 构建，原生支持 ES Module，不受影响。

## 参考

- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [Dynamic import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [@xenova/transformers Documentation](https://huggingface.co/docs/transformers.js)

# OCR 多语言支持改进

## 改进内容

### 1. 多语言支持
现在OCR服务支持以下语言：
- **chi_sim** - 简体中文
- **chi_tra** - 繁体中文
- **jpn** - 日语 ✨
- **kor** - 韩语
- **eng** - 英语
- **fra** - 法语
- **deu** - 德语
- **spa** - 西班牙语
- **rus** - 俄语
- **ara** - 阿拉伯语

### 2. 默认多语言识别
为了提高识别准确度，特别是对日语等小语种，现在默认使用多语言组合：
```
chi_sim+chi_tra+jpn+kor+eng
```

这样可以同时识别中文、日文、韩文和英文，大幅提升混合文本的识别准确度。

### 3. 自定义语言选择
可以根据需要指定特定语言进行识别：

```typescript
// 仅识别日语
await window.electronAPI.ocrRecognizeClipboard('jpn');

// 识别日语和英语
await window.electronAPI.ocrRecognizeClipboard('jpn+eng');

// 识别韩语
await window.electronAPI.ocrRecognizeClipboard('kor');

// 使用默认多语言（推荐）
await window.electronAPI.ocrRecognizeClipboard();
```

## 技术改进

### 1. 动态语言加载
- OCR Worker 会根据指定的语言动态加载对应的训练数据
- 首次使用某个语言时会自动下载训练数据（约3-10MB/语言）
- 训练数据缓存在用户数据目录，后续使用无需重新下载

### 2. 智能初始化
- 延迟初始化：只在首次使用时才加载OCR引擎
- 语言切换：当指定不同语言时自动重新初始化
- 避免重复初始化：相同语言配置会复用已有Worker

### 3. 性能优化
- 使用多语言组合时，Tesseract会智能选择最匹配的语言
- 加载进度实时反馈
- 识别进度百分比显示

## 使用建议

### 针对日语文本
1. **纯日语文本**：使用 `'jpn'` 或 `'jpn+eng'`
2. **日英混合**：使用 `'jpn+eng'`（推荐）
3. **中日混合**：使用 `'chi_sim+jpn+eng'`
4. **不确定**：使用默认配置（包含所有常用语言）

### 针对其他小语种
- **韩语**：`'kor'` 或 `'kor+eng'`
- **俄语**：`'rus'` 或 `'rus+eng'`
- **阿拉伯语**：`'ara'` 或 `'ara+eng'`

### 提高识别准确度的技巧
1. **图片质量**：确保图片清晰，分辨率足够
2. **文字大小**：文字不要太小（建议至少12pt）
3. **对比度**：黑白对比清晰的文本识别效果最好
4. **背景**：纯色背景优于复杂背景
5. **倾斜**：尽量保持文字水平，避免倾斜

## API 变更

### ocrService.ts
```typescript
// 新增类型定义
export type SupportedLanguage = 
  | 'chi_sim' | 'chi_tra' | 'jpn' | 'kor' | 'eng'
  | 'fra' | 'deu' | 'spa' | 'rus' | 'ara';

// 更新方法签名
recognizeImage(imageData: string | Buffer, languages?: string | SupportedLanguage[])
recognizeFromClipboard(imageBuffer: Buffer, languages?: string | SupportedLanguage[])
recognizeFromFile(filePath: string, languages?: string | SupportedLanguage[])

// 新增方法
setDefaultLanguages(languages: string | SupportedLanguage[]): void
getCurrentLanguages(): string
```

### IPC API
```typescript
// preload.ts
ocrRecognizeClipboard: (languages?: string) => Promise<...>
ocrRecognizeImage: (imageDataUrl: string, languages?: string) => Promise<...>
```

## 测试建议

1. **测试日语识别**：
   - 准备一张包含日语文本的截图
   - 使用 `ocrRecognizeClipboard('jpn')` 进行识别
   - 对比使用默认多语言配置的效果

2. **测试混合文本**：
   - 准备包含中日英混合的文本
   - 使用默认配置识别
   - 检查各语言文字的识别准确度

3. **性能测试**：
   - 记录首次加载时间（需下载训练数据）
   - 记录后续识别时间
   - 对比单语言和多语言配置的性能差异

## 注意事项

1. **首次使用**：首次使用某个语言时需要下载训练数据，可能需要几秒到几十秒
2. **网络要求**：训练数据从CDN下载，需要网络连接
3. **存储空间**：每个语言的训练数据约3-10MB
4. **内存占用**：多语言配置会占用更多内存（约50-100MB）

## 下一步优化建议

1. **预加载常用语言**：在应用启动时预加载常用语言数据
2. **语言检测**：自动检测图片中的主要语言
3. **用户偏好**：记住用户常用的语言配置
4. **离线包**：提供包含常用语言训练数据的离线安装包
5. **OCR设置界面**：在设置中添加语言选择选项

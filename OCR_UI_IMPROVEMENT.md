# OCR 交互优化 - ChatGPT 风格

## 更新内容

重新设计了 OCR 图片识别的交互方式，模仿 ChatGPT 的体验，提供更直观、更优雅的图片处理流程。

## 主要改进

### 1. 图片预览显示 ✨

**之前**：识别的文字直接添加到输入框，没有图片预览

**现在**：
- 粘贴图片后，在输入框上方显示图片缩略图
- 缩略图大小适中（最大 200x150px）
- 不占用过多空间
- 可以清晰看到粘贴的图片

### 2. OCR 进度显示 📊

**之前**：只显示"识别中"文字提示

**现在**：
- 图片上方显示半透明遮罩
- 显示进度条动画（0% → 100%）
- 显示百分比数字
- 视觉反馈更清晰

### 3. 悬停显示识别结果 💬

**之前**：识别文字直接插入输入框

**现在**：
- 鼠标悬停在图片上
- 弹出黑色半透明提示框
- 显示完整的 OCR 识别文字
- 支持滚动查看长文本
- 不干扰输入框内容

### 4. 一键移除图片 ❌

**新增功能**：
- 图片右上角显示红色 × 按钮
- 点击即可移除图片
- 重新粘贴或修改图片更方便

### 5. 智能消息组合 🔗

**优化逻辑**：
- 发送消息时，自动将 OCR 文字和用户输入组合
- 格式：`用户输入\n\n[图片内容]\n识别的文字`
- AI 可以同时理解图片内容和用户问题

## 使用流程

### 完整交互流程

```
1. 用户截图 (Ctrl+C)
   ↓
2. 在输入框粘贴 (Ctrl+V)
   ↓
3. 显示图片缩略图
   ↓
4. 显示识别进度 (0% → 100%)
   ↓
5. 识别完成
   ↓
6. 鼠标悬停查看识别文字
   ↓
7. 输入问题（可选）
   ↓
8. 点击发送
   ↓
9. AI 基于图片内容和问题回答
```

### 示例场景

**场景 1：识别代码并提问**
1. 截取代码截图
2. 粘贴到 Hoshino
3. 悬停查看识别的代码
4. 输入："这段代码有什么问题？"
5. 发送
6. AI 分析代码并回答

**场景 2：识别错误信息**
1. 截取错误提示
2. 粘贴到 Hoshino
3. 悬停查看识别的错误
4. 输入："如何解决？"
5. 发送
6. AI 提供解决方案

**场景 3：仅识别图片**
1. 截取图片
2. 粘贴到 Hoshino
3. 不输入任何文字
4. 直接发送
5. AI 基于图片内容回答

## UI 设计细节

### 图片预览容器
```css
- 位置：输入框正上方
- 背景：白色卡片
- 圆角：12px
- 阴影：柔和阴影
- 动画：从下向上滑入
```

### 图片缩略图
```css
- 最大宽度：200px
- 最大高度：150px
- 保持宽高比
- 圆角：8px
- 悬停：轻微放大
```

### 移除按钮
```css
- 位置：图片右上角
- 样式：红色圆形按钮
- 边框：白色描边
- 悬停：变深红色 + 放大
```

### 进度遮罩
```css
- 背景：黑色半透明 (70%)
- 进度条：粉色渐变
- 文字：白色
- 动画：平滑过渡
```

### 识别结果提示框
```css
- 触发：鼠标悬停
- 背景：黑色半透明 (90%)
- 位置：图片上方
- 最大宽度：300px
- 最大高度：200px
- 支持滚动
- 箭头指向图片
```

## 代码实现

### 状态管理
```typescript
const [pastedImage, setPastedImage] = useState<string | null>(null);
const [ocrText, setOcrText] = useState<string>('');
const [isOcrProcessing, setIsOcrProcessing] = useState(false);
const [ocrProgress, setOcrProgress] = useState<number>(0);
```

### 粘贴处理
```typescript
const handlePaste = async (e: React.ClipboardEvent) => {
  // 检测图片
  // 读取为 Data URL
  // 显示预览
  // 执行 OCR
  // 更新进度
  // 保存结果
};
```

### 移除图片
```typescript
const handleRemoveImage = () => {
  setPastedImage(null);
  setOcrText('');
  setOcrProgress(0);
  setIsOcrProcessing(false);
};
```

### 发送消息
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // 组合用户输入和 OCR 文字
  let messageContent = input;
  if (pastedImage && ocrText) {
    messageContent = `${input}\n\n[图片内容]\n${ocrText}`;
  }
  
  // 发送消息
  // 清除图片状态
};
```

## 用户体验提升

### 视觉反馈
- ✅ 图片预览：直观看到粘贴的内容
- ✅ 进度显示：了解识别进度
- ✅ 悬停提示：按需查看识别结果
- ✅ 动画效果：流畅的交互体验

### 操作便捷
- ✅ 一键移除：快速删除图片
- ✅ 自动组合：无需手动整理内容
- ✅ 灵活输入：可以只发图片或图片+文字

### 空间利用
- ✅ 缩略图小巧：不占用过多空间
- ✅ 悬停显示：节省界面空间
- ✅ 自动清理：发送后自动清除

## 对比 ChatGPT

### 相似之处
- ✅ 图片预览在输入框上方
- ✅ 缩略图大小适中
- ✅ 可以移除图片
- ✅ 支持图片+文字组合

### 独特优势
- ✅ 本地 OCR 识别
- ✅ 悬停显示识别文字
- ✅ 实时进度显示
- ✅ 完全离线工作

## 技术细节

### 进度模拟
```typescript
// 模拟进度更新
const progressInterval = setInterval(() => {
  setOcrProgress(prev => {
    if (prev >= 90) {
      clearInterval(progressInterval);
      return 90;
    }
    return prev + 10;
  });
}, 200);

// OCR 完成后设置为 100%
setOcrProgress(100);
```

### CSS 悬停效果
```css
.ocr-text-tooltip {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.image-preview-wrapper:hover .ocr-text-tooltip {
  opacity: 1;
  pointer-events: auto;
}
```

### 响应式布局
```css
.image-preview-wrapper {
  max-width: 200px;
}

.image-preview {
  max-height: 150px;
  object-fit: contain;
}
```

## 未来优化

- [ ] 支持多张图片
- [ ] 图片编辑功能（裁剪、旋转）
- [ ] 识别区域选择
- [ ] 识别结果编辑
- [ ] 图片压缩优化
- [ ] 拖拽上传图片

## 相关文件

- `src/renderer/App.tsx` - 主要逻辑实现
- `src/renderer/App.css` - 样式定义
- `src/main/services/ocrService.ts` - OCR 服务

---

**全新的图片识别体验，更接近 ChatGPT 的交互方式！** 🎨✨

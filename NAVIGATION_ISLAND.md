# 导航岛设计文档

## 概述

导航岛（Navigation Island）是 Hoshino 的核心导航组件，提供快速访问各个功能模块的入口。

## 设计理念

### 1. 岛式设计 🏝️
- 悬浮在左侧的独立导航区域
- 半透明毛玻璃效果
- 不遮挡主要内容
- 视觉上独立但不突兀

### 2. 渐进式展开 📖
- 默认状态：仅显示图标（60px 宽）
- 悬停状态：展开显示文字（200px 宽）
- 平滑过渡动画
- 节省空间，按需展示

### 3. 清晰的视觉反馈 ✨
- 活动指示器：粉色渐变条
- 悬停效果：背景色变化 + 轻微位移
- 图标动画：悬停时放大
- 状态徽章：即将推出、已启用等

## 功能模块

### 1. 快速对话 💬
**状态**：已实现 ✅

**功能**：
- 与 AI 自由对话
- 支持文本输入
- 支持图片 OCR
- 会话历史管理

**特点**：
- 实时响应
- Markdown 渲染
- 代码高亮
- 数学公式支持

### 2. 文档库 📚
**状态**：即将推出 🚧

**计划功能**：
- 本地文档管理
- 基于 FAISS 的向量检索
- 文档问答（RAG）
- 支持 PDF、DOCX、TXT 等格式

**技术栈**：
- 本地模型（Ollama）
- FAISS 向量数据库
- 文档解析器
- 嵌入模型

### 3. 百宝箱 🧰
**状态**：部分实现 ⚡

**已实现工具**：
- ✅ OCR 识别：图片文字识别（中英文）

**计划工具**：
- 🚧 翻译助手：多语言实时翻译
- 🚧 文本摘要：长文本智能总结
- 🚧 格式转换：Markdown/JSON/YAML 互转
- 🚧 代码格式化：多语言代码美化
- 🚧 正则测试：正则表达式测试工具

### 4. 设置 ⚙️
**状态**：已实现 ✅

**功能**：
- AI 模型配置（云端/本地）
- Ollama 服务管理
- 模型下载与切换
- 连接测试

## 交互设计

### 导航岛状态

#### 默认状态（收起）
```
┌─────────┐
│  💬     │  快速对话
│  📚     │  文档库
│  🧰     │  百宝箱
│  ⚙️     │  设置
└─────────┘
宽度：60px
```

#### 悬停状态（展开）
```
┌──────────────────────┐
│  💬  快速对话         │
│      与 AI 自由对话   │
│                      │
│  📚  文档库  [即将推出]│
│      基于文档问答     │
│                      │
│  🧰  百宝箱           │
│      OCR 识别等工具   │
│                      │
│  ⚙️  设置             │
│      配置与管理       │
└──────────────────────┘
宽度：200px
```

### 活动指示器

- 位置：导航岛左侧
- 样式：粉色渐变竖条
- 动画：平滑移动到当前活动项
- 高度：与导航项高度一致

### 悬停提示

- 收起状态：显示工具提示（Tooltip）
- 展开状态：隐藏工具提示
- 样式：黑色半透明背景 + 白色文字
- 位置：导航项右侧

## 百宝箱设计

### 工具卡片布局

```
┌─────────────────────────────────────┐
│  🧰 百宝箱                     ×    │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ 📸       │  │ 🌐       │       │
│  │ OCR 识别 │  │ 翻译助手 │       │
│  │ 图片文字 │  │ 多语言   │       │
│  │ [已启用] │  │ [即将推出]│       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ 📝       │  │ ✨       │       │
│  │ 文本摘要 │  │ 格式转换 │       │
│  │ 智能总结 │  │ Markdown │       │
│  │ [即将推出]│  │ [即将推出]│       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 💡 使用提示                  │  │
│  │ • OCR 识别：粘贴图片自动识别 │  │
│  │ • 翻译助手：即将支持多语言   │  │
│  └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### 工具状态

- **已启用**：绿色渐变徽章
- **即将推出**：黄色渐变徽章
- **维护中**：灰色徽章（未来）

## 样式规范

### 颜色方案

```css
/* 主色调 */
--primary: #f5abb9;
--primary-light: #ffc4d0;

/* 背景色 */
--bg-white: rgba(255, 255, 255, 0.95);
--bg-hover: rgba(245, 171, 185, 0.1);
--bg-active: rgba(245, 171, 185, 0.2);

/* 文字颜色 */
--text-primary: #1f2937;
--text-secondary: #6b7280;

/* 状态颜色 */
--status-active: #10b981;
--status-coming: #fbbf24;
```

### 尺寸规范

```css
/* 导航岛 */
--nav-width-collapsed: 60px;
--nav-width-expanded: 200px;
--nav-border-radius: 20px;

/* 导航项 */
--nav-item-height: 56px;
--nav-item-padding: 12px;
--nav-item-gap: 4px;

/* 图标 */
--icon-size: 24px;
--icon-container: 28px;
```

### 动画参数

```css
/* 过渡时间 */
--transition-fast: 0.2s;
--transition-normal: 0.3s;

/* 缓动函数 */
--ease-out: cubic-bezier(0.4, 0, 0.2, 1);
```

## 响应式设计

### 小屏幕适配（高度 < 500px）

```css
.navigation-island {
  top: 20px;
  transform: none;
}
```

### 触摸设备优化

- 增大点击区域
- 移除悬停效果
- 点击展开/收起

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Alt + 1` | 切换到快速对话 |
| `Alt + 2` | 切换到文档库 |
| `Alt + 3` | 打开百宝箱 |
| `Alt + 4` | 打开设置 |

## 技术实现

### 组件结构

```typescript
NavigationIsland
├── nav-items
│   ├── nav-item (chat)
│   ├── nav-item (documents)
│   ├── nav-item (toolbox)
│   └── nav-item (settings)
└── nav-indicator
```

### 状态管理

```typescript
interface NavigationIslandProps {
  currentMode: NavigationMode;
  onModeChange: (mode: NavigationMode) => void;
}

type NavigationMode = 'chat' | 'documents' | 'toolbox' | 'settings';
```

### 展开/收起逻辑

```typescript
const [isExpanded, setIsExpanded] = useState(false);

onMouseEnter={() => setIsExpanded(true)}
onMouseLeave={() => setIsExpanded(false)}
```

### 活动指示器动画

```typescript
style={{ 
  transform: `translateY(${
    navItems.findIndex(item => item.id === currentMode) * 100
  }%)` 
}}
```

## 未来规划

### 短期（v1.1）
- [ ] 键盘快捷键支持
- [ ] 触摸设备优化
- [ ] 自定义导航项顺序
- [ ] 主题切换（浅色/深色）

### 中期（v1.2）
- [ ] 文档库功能实现
- [ ] 更多百宝箱工具
- [ ] 插件系统
- [ ] 自定义工具

### 长期（v2.0）
- [ ] 多工作区支持
- [ ] 云端同步
- [ ] 协作功能
- [ ] API 开放

## 相关文件

- `src/renderer/components/NavigationIsland.tsx` - 导航岛组件
- `src/renderer/components/NavigationIsland.css` - 导航岛样式
- `src/renderer/components/Toolbox.tsx` - 百宝箱组件
- `src/renderer/components/Toolbox.css` - 百宝箱样式
- `src/renderer/App.tsx` - 主应用集成

---

**优雅的导航设计，提升用户体验！** 🎨✨

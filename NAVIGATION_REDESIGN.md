# 导航岛重新设计

## 更新内容

将导航岛从左侧独立位置移到输入框右侧，并根据窗口大小自动切换显示模式。

## 主要改进

### 1. 位置调整 📍
**之前**：固定在左侧中间位置
**现在**：集成在输入框右侧

**优势**：
- 更紧凑的布局
- 不占用额外空间
- 与输入框形成整体
- 更符合现代应用设计

### 2. 双模式显示 🔄

#### 小窗口模式（默认 600x400）
- 显示单个图标按钮
- 点击展开下拉菜单
- 菜单向上弹出
- 节省空间

```
输入框布局：
┌────────────────────────────────────┐
│ [输入框...] [发送] [💬]           │
└────────────────────────────────────┘
                        ↑
                    点击展开
                        ↓
                ┌──────────┐
                │ 💬 快速对话│
                │ 📚 文档库  │
                │ 🧰 百宝箱  │
                │ ⚙️ 设置   │
                └──────────┘
```

#### 大窗口模式（最大化）
- 显示完整导航岛
- 悬停展开显示文字
- 保持原有交互
- 更多信息展示

```
输入框布局：
┌────────────────────────────────────────────┐
│ [输入框...] [发送] [导航岛]               │
└────────────────────────────────────────────┘
                        ↑
                    悬停展开
                        ↓
                ┌──────────────────┐
                │ 💬 快速对话       │
                │    与 AI 自由对话 │
                │ 📚 文档库 [即将]  │
                │    基于文档问答   │
                │ 🧰 百宝箱         │
                │    OCR 识别等工具 │
                │ ⚙️ 设置           │
                │    配置与管理     │
                └──────────────────┘
```

### 3. 智能切换 🎯

**切换逻辑**：
```typescript
// 小窗口：紧凑模式
<NavigationIsland 
  currentMode={currentMode} 
  onModeChange={handleModeChange}
  isMaximized={false}  // 显示单图标
/>

// 大窗口：完整模式
<NavigationIsland 
  currentMode={currentMode} 
  onModeChange={handleModeChange}
  isMaximized={true}   // 显示完整导航
/>
```

**CSS 控制**：
```css
/* 小窗口隐藏完整导航 */
.input-form:not(.maximized) .navigation-island:not(.compact) {
  display: none;
}

/* 大窗口隐藏紧凑导航 */
.input-form.maximized .navigation-island.compact {
  display: none;
}
```

## 紧凑模式设计

### 图标按钮
- 尺寸：40x40px
- 圆角：10px
- 悬停：浅粉色背景
- 图标：20px

### 下拉菜单
- 位置：按钮上方
- 宽度：180px
- 圆角：12px
- 阴影：柔和阴影
- 动画：向上滑入

### 菜单项
- 高度：44px
- 间距：8px
- 图标：20px
- 文字：14px
- 徽章：10px

## 完整模式设计

### 保持原有特性
- 悬停展开
- 活动指示器
- 图标动画
- 工具提示

### 尺寸调整
- 默认：60px 宽
- 展开：200px 宽
- 高度：自适应内容

## 交互流程

### 小窗口模式

```
1. 用户看到当前模式图标（如 💬）
   ↓
2. 点击图标
   ↓
3. 下拉菜单向上弹出
   ↓
4. 选择其他模式
   ↓
5. 菜单关闭，图标切换
```

### 大窗口模式

```
1. 用户看到导航岛（仅图标）
   ↓
2. 鼠标悬停
   ↓
3. 导航岛展开显示文字
   ↓
4. 点击切换模式
   ↓
5. 鼠标移开，导航岛收起
```

## 布局优化

### 输入框布局

**小窗口**：
```
┌─────────────────────────────────┐
│ [textarea] [发送] [💬]         │
└─────────────────────────────────┘
  ↑ flex:1   ↑ 固定  ↑ 40px
```

**大窗口**：
```
┌──────────────────────────────────────────┐
│ [textarea] [发送] [导航岛]              │
└──────────────────────────────────────────┘
  ↑ flex:1   ↑ 固定  ↑ 60-200px
```

### 间距调整
- 元素间距：8px（之前 10px）
- 更紧凑的布局
- 为导航岛留出空间

## 响应式适配

### 窗口大小检测
```typescript
const [isMaximized, setIsMaximized] = useState(false);

// 根据窗口状态切换
<NavigationIsland isMaximized={isMaximized} />
```

### 自动切换
- 小窗口 → 紧凑模式
- 最大化 → 完整模式
- 平滑过渡

## 视觉效果

### 紧凑模式
- 简洁的单图标
- 点击展开菜单
- 向上滑入动画
- 半透明背景

### 完整模式
- 悬浮岛式设计
- 悬停展开
- 活动指示器
- 毛玻璃效果

## 用户体验提升

### 1. 空间利用
- ✅ 不占用额外空间
- ✅ 集成在输入框中
- ✅ 小窗口更紧凑

### 2. 操作便捷
- ✅ 触手可及
- ✅ 一键切换
- ✅ 清晰反馈

### 3. 视觉统一
- ✅ 与输入框整体
- ✅ 风格一致
- ✅ 过渡自然

## 技术实现

### 组件结构
```typescript
NavigationIsland
├── isMaximized: boolean
├── compact mode (小窗口)
│   ├── nav-icon-btn
│   └── nav-dropdown
│       └── nav-dropdown-item[]
└── full mode (大窗口)
    ├── nav-items
    │   └── nav-item[]
    └── nav-indicator
```

### 状态管理
```typescript
// App.tsx
const [currentMode, setCurrentMode] = useState<NavigationMode>('chat');
const [isMaximized, setIsMaximized] = useState(false);

// 传递给导航岛
<NavigationIsland 
  currentMode={currentMode}
  onModeChange={handleModeChange}
  isMaximized={isMaximized}
/>
```

### CSS 类名
```css
.navigation-island          /* 基础样式 */
.navigation-island.compact  /* 紧凑模式 */
.navigation-island.expanded /* 展开状态 */
.nav-icon-btn              /* 图标按钮 */
.nav-dropdown              /* 下拉菜单 */
.nav-dropdown-item         /* 菜单项 */
```

## 对比优化前后

| 特性 | 优化前 | 优化后 |
|------|--------|--------|
| 位置 | 左侧固定 | 输入框右侧 |
| 小窗口 | 完整导航 | 单图标 |
| 大窗口 | 完整导航 | 完整导航 |
| 空间占用 | 独立占用 | 集成布局 |
| 切换方式 | 悬停展开 | 点击/悬停 |

## 相关文件

- `src/renderer/components/NavigationIsland.tsx` - 导航岛组件
- `src/renderer/components/NavigationIsland.css` - 导航岛样式
- `src/renderer/App.tsx` - 主应用集成
- `src/renderer/App.css` - 布局样式

---

**更紧凑、更智能的导航设计！** 🎨✨

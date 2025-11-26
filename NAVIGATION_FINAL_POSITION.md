# 导航岛最终定位方案

## 布局设计

导航岛作为独立元素，定位在输入框右侧，而不是嵌入在输入框内部。

## 视觉布局

### 小窗口模式（600x400）

```
┌────────────────────────────────────┐
│                                    │
│         对话内容区域                │
│                                    │
│                                    │
└────────────────────────────────────┘
┌──────────────────────────┐  ┌───┐
│ [输入框...] [发送]       │  │💬 │
└──────────────────────────┘  └───┘
     输入框                   导航岛
                              (紧凑)
```

### 大窗口模式（最大化）

```
┌────────────────────────────────────────────┐
│                                            │
│              对话内容区域                   │
│                                            │
│                                            │
└────────────────────────────────────────────┘
    ┌──────────────────────┐  ┌──────┐
    │ [输入框...] [发送]   │  │ 💬   │
    └──────────────────────┘  │ 📚   │
         输入框                │ 🧰   │
                              │ ⚙️   │
                              └──────┘
                              导航岛
                              (完整)
```

## 定位方案

### 导航岛容器

```css
.nav-island-container {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 99;
}
```

**特点**：
- 绝对定位
- 底部对齐输入框
- 右侧 16px 边距
- z-index 99（低于弹窗）

### 输入框调整

```css
.input-form {
  right: 72px; /* 为导航岛留出空间 */
}

.input-form.maximized {
  right: calc(20% + 76px); /* 大窗口模式 */
}
```

**计算**：
- 小窗口：56px（导航岛）+ 16px（间距）= 72px
- 大窗口：20%（居中）+ 60px（导航岛）+ 16px（间距）= 20% + 76px

## 响应式适配

### 小窗口模式

**导航岛**：
- 宽度：56px
- 高度：56px
- 显示：单图标
- 交互：点击展开下拉菜单

**输入框**：
- 左边距：16px
- 右边距：72px
- 宽度：自适应

### 大窗口模式

**导航岛**：
- 宽度：60px（默认）→ 200px（展开）
- 高度：自适应（4个按钮）
- 显示：完整导航
- 交互：悬停展开

**输入框**：
- 左边距：20%
- 右边距：20% + 76px
- 宽度：居中显示

## CSS 选择器

### 模式切换

```css
/* 小窗口：隐藏完整导航 */
.app:not(:has(.input-form.maximized)) .navigation-island:not(.compact) {
  display: none;
}

/* 大窗口：隐藏紧凑导航 */
.app:has(.input-form.maximized) .navigation-island.compact {
  display: none;
}
```

**使用 :has() 伪类**：
- 检测输入框是否有 `.maximized` 类
- 根据状态显示/隐藏对应导航岛
- 无需 JavaScript 控制

### 位置调整

```css
/* 大窗口模式下调整导航岛位置 */
.app:has(.input-form.maximized) .nav-island-container {
  right: calc(20% - 8px);
}
```

**计算逻辑**：
- 输入框右边距：20%
- 导航岛与输入框间距：16px
- 导航岛右边距：20% - 8px（视觉居中）

## 间距规范

### 小窗口模式

```
边距：16px
间距：16px

|<-16px->|[输入框]<-16px->[导航岛]<-16px->|
```

### 大窗口模式

```
边距：20%
间距：16px

|<-20%->|[输入框]<-16px->[导航岛]<-20%->|
```

## 交互层级

```
z-index 层级：
1000 - 弹窗（设置、百宝箱、历史）
100  - 导航岛下拉菜单
99   - 导航岛容器
10   - 图片预览
1    - 输入框
0    - 内容区域
```

## 优势

### 1. 独立性 🎯
- 导航岛不受输入框影响
- 可以独立定位和样式
- 更灵活的布局控制

### 2. 清晰性 📐
- 输入框和导航岛分离
- 视觉上更清晰
- 功能区域明确

### 3. 可维护性 🔧
- 代码结构清晰
- 样式独立管理
- 易于调整和优化

### 4. 响应式 📱
- 自动适配窗口大小
- 平滑过渡动画
- 智能显示/隐藏

## 实现细节

### HTML 结构

```tsx
<div className="app">
  {/* 内容区域 */}
  <div className="messages-container">...</div>
  
  {/* 输入框 */}
  <form className="input-form">
    <textarea />
    <button>发送</button>
  </form>
  
  {/* 导航岛 - 独立元素 */}
  <div className="nav-island-container">
    <NavigationIsland />
  </div>
</div>
```

### 定位关系

```
.app (relative)
├── .messages-container
├── .input-form (absolute, bottom: 16px, right: 72px)
└── .nav-island-container (absolute, bottom: 16px, right: 16px)
```

## 浏览器兼容性

### :has() 伪类支持

- ✅ Chrome 105+
- ✅ Edge 105+
- ✅ Safari 15.4+
- ✅ Firefox 121+

**备选方案**（如需兼容旧浏览器）：
```typescript
// 使用 JavaScript 控制
const showCompact = !isMaximized;
const showFull = isMaximized;
```

## 相关文件

- `src/renderer/App.tsx` - 布局结构
- `src/renderer/App.css` - 定位样式
- `src/renderer/components/NavigationIsland.tsx` - 导航岛组件
- `src/renderer/components/NavigationIsland.css` - 导航岛样式

---

**独立、清晰、灵活的导航岛定位方案！** 🎯✨

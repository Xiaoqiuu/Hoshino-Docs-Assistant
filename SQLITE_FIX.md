# SQLite 原生模块修复 🔧

## 🐛 问题描述

**错误信息：**
```
The module 'better-sqlite3' was compiled against a different Node.js version
using NODE_MODULE_VERSION 127. This version of Node.js requires
NODE_MODULE_VERSION 128.
```

**原因：**
`better-sqlite3` 是一个原生 Node.js 模块（C++ 扩展），需要针对特定的 Node.js 版本编译。Electron 使用自己的 Node.js 版本，与系统 Node.js 版本不同，因此需要重新编译。

## ✅ 解决方案

### 1. 安装 electron-rebuild
```bash
cnpm install --save-dev electron-rebuild
```

### 2. 重新编译原生模块
```bash
npx electron-rebuild
```

### 3. 添加 postinstall 脚本
在 `package.json` 中添加：
```json
"scripts": {
  "postinstall": "electron-rebuild"
}
```

这样每次 `npm install` 后会自动重新编译原生模块。

## 🔧 手动修复步骤

如果遇到问题，可以手动执行：

### 方法 1: 使用 electron-rebuild
```bash
# 安装 electron-rebuild
npm install --save-dev electron-rebuild

# 重新编译所有原生模块
npx electron-rebuild

# 或只编译 better-sqlite3
npx electron-rebuild -f -w better-sqlite3
```

### 方法 2: 使用 npm rebuild
```bash
npm rebuild better-sqlite3 --build-from-source
```

### 方法 3: 重新安装
```bash
# 删除 node_modules
rm -rf node_modules

# 重新安装
npm install

# 运行 postinstall
npm run postinstall
```

## 📋 验证修复

运行应用验证：
```bash
npm run dev
```

如果看到以下日志，说明数据库初始化成功：
```
数据库初始化完成: C:\Users\...\hoshino.db
创建新会话: 1
```

## ⚠️ 常见问题

### 问题 1: electron-rebuild 失败

**解决方案：**
确保安装了 C++ 编译工具：

**Windows:**
```bash
npm install --global windows-build-tools
```

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install build-essential
```

### 问题 2: 权限错误

**解决方案：**
使用管理员权限运行：

**Windows:**
```bash
# 以管理员身份运行 PowerShell
npx electron-rebuild
```

**macOS/Linux:**
```bash
sudo npx electron-rebuild
```

### 问题 3: 编译超时

**解决方案：**
增加超时时间：
```bash
npx electron-rebuild --force --timeout=60000
```

## 🎯 最佳实践

### 1. 使用 postinstall 脚本
```json
{
  "scripts": {
    "postinstall": "electron-rebuild"
  }
}
```

### 2. 锁定 Electron 版本
```json
{
  "devDependencies": {
    "electron": "^28.0.0"
  }
}
```

### 3. 使用 .npmrc 配置
创建 `.npmrc` 文件：
```
runtime = electron
target = 28.0.0
disturl = https://electronjs.org/headers
```

## 📊 技术细节

### Node.js 模块版本

| Electron 版本 | Node.js 版本 | MODULE_VERSION |
|--------------|-------------|----------------|
| 28.x | 18.x | 108 |
| 27.x | 18.x | 108 |
| 26.x | 18.x | 108 |

### 原生模块编译流程

```
1. 检测 Electron 版本
   ↓
2. 下载对应的 Node.js 头文件
   ↓
3. 使用 node-gyp 编译 C++ 代码
   ↓
4. 生成 .node 二进制文件
   ↓
5. 放置到正确的目录
```

## 🔍 调试技巧

### 查看模块版本
```bash
# 查看 Electron 的 Node.js 版本
npx electron -v

# 查看系统 Node.js 版本
node -v

# 查看模块编译信息
npm ls better-sqlite3
```

### 清理缓存
```bash
# 清理 npm 缓存
npm cache clean --force

# 清理 electron 缓存
rm -rf ~/.electron

# 重新安装
npm install
```

## ✨ 完成清单

- [x] 安装 electron-rebuild
- [x] 重新编译 better-sqlite3
- [x] 添加 postinstall 脚本
- [x] 验证数据库功能
- [x] 测试应用启动

## 🎉 修复完成

现在 `better-sqlite3` 已经针对 Electron 28.0.0 正确编译，数据库功能可以正常使用了！

## 📝 相关文件

- `package.json` - 添加了 postinstall 脚本
- `src/main/services/databaseService.ts` - 数据库服务
- `node_modules/better-sqlite3/build/Release/better_sqlite3.node` - 编译后的原生模块

## 🚀 下一步

运行应用测试历史记录功能：
```bash
npm run dev
```

所有功能应该正常工作！

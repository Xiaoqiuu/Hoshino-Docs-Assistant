@echo off
echo 正在测试项目构建...
echo.

echo [1/2] 构建主进程...
call npx tsc -p tsconfig.main.json
if %errorlevel% neq 0 (
    echo 主进程构建失败！
    exit /b 1
)
echo 主进程构建成功！
echo.

echo [2/2] 检查渲染进程配置...
if exist "src\renderer\App.tsx" (
    echo 渲染进程文件存在
) else (
    echo 渲染进程文件缺失！
    exit /b 1
)
echo.

echo ========================================
echo 所有检查通过！项目已准备就绪。
echo ========================================
echo.
echo 下一步：
echo 1. 运行 'npm run dev' 启动开发模式
echo 2. 按 Ctrl+Alt+H 唤出窗口
echo.

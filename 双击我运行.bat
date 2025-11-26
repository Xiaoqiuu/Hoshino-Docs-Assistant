@echo off
chcp 65001
echo 启动 Hoshino 开发模式...
echo.

echo [1/3] 编译主进程...
call npx tsc -p tsconfig.main.json
if %errorlevel% neq 0 (
    echo 主进程编译失败！
    pause
    exit /b 1
)
echo 主进程编译完成！
echo.

echo [2/3] 启动 Vite 开发服务器...
start "Vite Dev Server" cmd /c "npm run dev:renderer"

echo 等待 Vite 服务器启动...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] 启动 Electron...
set NODE_ENV=development
electron .

echo.
echo 开发模式已退出

@echo off
echo ========================================
echo Hoshino 依赖安装脚本
echo ========================================
echo.

echo 正在安装 react-markdown...
cnpm install react-markdown

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo cnpm 安装失败，尝试使用 pnpm...
    pnpm add react-markdown
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo pnpm 安装失败，尝试使用 npm...
        npm install react-markdown
    )
)

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 现在可以运行: npm run dev
echo.
pause

@echo off
chcp 65001 >nul
echo ========================================
echo   测试 Hugging Face 连接
echo ========================================
echo.

echo 正在测试直连 Hugging Face...
curl -I -m 10 https://huggingface.co 2>nul
if %errorlevel% equ 0 (
    echo ✓ 直连成功
    echo.
    echo 建议：可以不使用镜像源
) else (
    echo ✗ 直连失败
    echo.
    echo 正在测试镜像源 hf-mirror.com...
    curl -I -m 10 https://hf-mirror.com 2>nul
    if %errorlevel% equ 0 (
        echo ✓ 镜像源可用
        echo.
        echo 建议：使用 hf-mirror.com 镜像源
        echo 运行 "配置镜像源.bat" 进行配置
    ) else (
        echo ✗ 镜像源也无法访问
        echo.
        echo 建议：
        echo 1. 检查网络连接
        echo 2. 配置代理
        echo 3. 查看"模型下载问题解决方案.md"
    )
)

echo.
echo ========================================
echo   检查当前配置
echo ========================================
echo.

if exist .env (
    echo 检测到 .env 文件
    echo.
    findstr /C:"HUGGINGFACE_MIRROR" .env >nul
    if %errorlevel% equ 0 (
        echo 当前镜像源配置：
        findstr /C:"HUGGINGFACE_MIRROR" .env
    ) else (
        echo 未配置镜像源
    )
    echo.
    findstr /C:"HTTP_PROXY" .env >nul
    if %errorlevel% equ 0 (
        echo 当前代理配置：
        findstr /C:"HTTP_PROXY" .env
    ) else (
        echo 未配置代理
    )
) else (
    echo 未找到 .env 文件
    echo 运行 "配置镜像源.bat" 创建配置
)

echo.
pause

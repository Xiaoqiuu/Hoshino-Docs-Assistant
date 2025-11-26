@echo off
chcp 65001 >nul
echo ========================================
echo   配置 Hugging Face 镜像源
echo ========================================
echo.

REM 检查 .env 文件是否存在
if not exist .env (
    echo 正在创建 .env 文件...
    copy .env.example .env >nul
    echo .env 文件已创建
    echo.
)

REM 检查是否已配置镜像源
findstr /C:"HUGGINGFACE_MIRROR" .env >nul
if %errorlevel% equ 0 (
    echo 检测到已配置镜像源
    echo.
    echo 当前配置：
    findstr /C:"HUGGINGFACE_MIRROR" .env
    echo.
    set /p "update=是否要更新配置？(Y/N): "
    if /i not "%update%"=="Y" (
        echo 保持当前配置
        goto :end
    )
    echo.
)

echo 请选择镜像源：
echo.
echo 1. hf-mirror.com (推荐，中国大陆用户)
echo 2. 自定义镜像源
echo 3. 不使用镜像源（直连 Hugging Face）
echo.
set /p "choice=请输入选项 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 正在配置 hf-mirror.com...
    echo HUGGINGFACE_MIRROR=https://hf-mirror.com >> .env
    echo 配置完成！
) else if "%choice%"=="2" (
    echo.
    set /p "custom_mirror=请输入自定义镜像源地址: "
    echo HUGGINGFACE_MIRROR=!custom_mirror! >> .env
    echo 配置完成！
) else if "%choice%"=="3" (
    echo.
    echo 将使用直连方式（可能需要代理）
) else (
    echo 无效的选项
    goto :end
)

echo.
echo ========================================
echo   配置完成！
echo ========================================
echo.
echo 提示：
echo 1. 配置已保存到 .env 文件
echo 2. 请重启应用以使配置生效
echo 3. 如果仍然无法下载，请查看"模型下载问题解决方案.md"
echo.

:end
pause

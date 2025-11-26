@echo off
chcp 65001 >nul
echo ========================================
echo   创建模型目录结构
echo ========================================
echo.

echo 正在创建目录...
mkdir .cache\models\Xenova\all-MiniLM-L6-v2\onnx 2>nul

if %errorlevel% equ 0 (
    echo ✓ 目录创建成功
) else (
    echo ✓ 目录已存在
)

echo.
echo ========================================
echo   目录结构
echo ========================================
echo.
echo %CD%\.cache\
echo └── models\
echo     └── Xenova\
echo         └── all-MiniLM-L6-v2\
echo             ├── config.json              ^<-- 放这里
echo             ├── tokenizer.json           ^<-- 放这里
echo             ├── tokenizer_config.json    ^<-- 放这里
echo             └── onnx\
echo                 ├── model.onnx           ^<-- 放这里
echo                 └── model_quantized.onnx ^<-- 放这里
echo.
echo ========================================
echo   下载地址（镜像源）
echo ========================================
echo.
echo 访问以下网址下载所有文件：
echo https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/tree/main
echo.
echo 或使用直接下载链接：
echo.
echo 1. config.json
echo    https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/config.json
echo.
echo 2. tokenizer.json
echo    https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer.json
echo.
echo 3. tokenizer_config.json
echo    https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer_config.json
echo.
echo 4. model.onnx
echo    https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx
echo.
echo 5. model_quantized.onnx
echo    https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model_quantized.onnx
echo.
echo ========================================
echo   文件放置位置
echo ========================================
echo.
echo 根目录文件（3个）放到：
echo %CD%\.cache\models\Xenova\all-MiniLM-L6-v2\
echo.
echo onnx 文件（2个）放到：
echo %CD%\.cache\models\Xenova\all-MiniLM-L6-v2\onnx\
echo.
echo ========================================
echo   下一步
echo ========================================
echo.
echo 1. 下载上述 5 个文件
echo 2. 按照提示放置到对应目录
echo 3. 运行 "验证模型文件.bat" 检查
echo 4. 重启应用
echo.
pause

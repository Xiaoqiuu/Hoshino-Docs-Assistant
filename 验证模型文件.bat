@echo off
chcp 65001 >nul
echo ========================================
echo   验证模型文件
echo ========================================
echo.

set MODEL_PATH=.cache\models\Xenova\all-MiniLM-L6-v2
set ALL_OK=1

REM 检查目录
if not exist "%MODEL_PATH%" (
    echo ✗ 模型目录不存在
    echo   路径: %CD%\%MODEL_PATH%
    echo.
    echo 请先运行 "创建模型目录.bat" 创建目录
    set ALL_OK=0
    goto :end
)

echo ✓ 模型目录存在
echo.

REM 检查根目录文件
echo 检查根目录文件...
echo.

if exist "%MODEL_PATH%\config.json" (
    echo ✓ config.json 存在
    for %%A in ("%MODEL_PATH%\config.json") do echo   大小: %%~zA 字节
) else (
    echo ✗ config.json 不存在
    set ALL_OK=0
)

if exist "%MODEL_PATH%\tokenizer.json" (
    echo ✓ tokenizer.json 存在
    for %%A in ("%MODEL_PATH%\tokenizer.json") do echo   大小: %%~zA 字节
) else (
    echo ✗ tokenizer.json 不存在
    set ALL_OK=0
)

if exist "%MODEL_PATH%\tokenizer_config.json" (
    echo ✓ tokenizer_config.json 存在
    for %%A in ("%MODEL_PATH%\tokenizer_config.json") do echo   大小: %%~zA 字节
) else (
    echo ✗ tokenizer_config.json 不存在
    set ALL_OK=0
)

echo.
echo 检查 onnx 目录文件...
echo.

if exist "%MODEL_PATH%\onnx\model.onnx" (
    echo ✓ model.onnx 存在
    for %%A in ("%MODEL_PATH%\onnx\model.onnx") do (
        set size=%%~zA
        set /a sizeMB=%%~zA/1024/1024
        echo   大小: !sizeMB! MB
    )
) else (
    echo ✗ model.onnx 不存在
    set ALL_OK=0
)

if exist "%MODEL_PATH%\onnx\model_quantized.onnx" (
    echo ✓ model_quantized.onnx 存在
    for %%A in ("%MODEL_PATH%\onnx\model_quantized.onnx") do (
        set size=%%~zA
        set /a sizeMB=%%~zA/1024/1024
        echo   大小: !sizeMB! MB
    )
) else (
    echo ✗ model_quantized.onnx 不存在
    set ALL_OK=0
)

echo.
echo ========================================

if %ALL_OK% equ 1 (
    echo   ✓ 所有文件验证通过！
    echo ========================================
    echo.
    echo 模型文件已正确放置，可以启动应用了。
    echo.
    echo 下一步：
    echo 1. 双击运行 "双击我运行.bat" 启动应用
    echo 2. 打开文档库
    echo 3. 上传文档测试
) else (
    echo   ✗ 部分文件缺失
    echo ========================================
    echo.
    echo 请检查：
    echo 1. 是否下载了所有 5 个文件
    echo 2. 文件是否放在正确的位置
    echo 3. 查看 "手动下载模型指南.md" 获取详细说明
    echo.
    echo 文件应该放在：
    echo %CD%\%MODEL_PATH%\
)

:end
echo.
pause

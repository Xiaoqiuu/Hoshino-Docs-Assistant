Write-Host "启动 Hoshino 开发模式..." -ForegroundColor Cyan
Write-Host ""

# 编译主进程
Write-Host "[1/3] 编译主进程..." -ForegroundColor Yellow
npx tsc -p tsconfig.main.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "主进程编译失败！" -ForegroundColor Red
    exit 1
}
Write-Host "主进程编译完成！" -ForegroundColor Green
Write-Host ""

# 启动 Vite 开发服务器（后台）
Write-Host "[2/3] 启动 Vite 开发服务器..." -ForegroundColor Yellow
$viteProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev:renderer" -PassThru -WindowStyle Normal

# 等待 Vite 启动
Write-Host "等待 Vite 服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 检查 Vite 是否启动
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "Vite 服务器已就绪！" -ForegroundColor Green
} catch {
    Write-Host "警告: 无法连接到 Vite 服务器，但继续启动 Electron..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] 启动 Electron..." -ForegroundColor Yellow
$env:NODE_ENV = "development"
electron .

# 清理
Write-Host ""
Write-Host "正在关闭 Vite 服务器..." -ForegroundColor Yellow
Stop-Process -Id $viteProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host "开发模式已退出" -ForegroundColor Cyan

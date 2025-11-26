import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export class OllamaService {
  private ollamaProcess: ChildProcess | null = null;
  private isRunning: boolean = false;
  private ollamaPath: string = '';
  private logPath: string = '';

  constructor() {
    const userDataPath = app.getPath('userData');
    this.logPath = path.join(userDataPath, 'ollama.log');
    this.detectOllamaPath();
  }

  private detectOllamaPath(): void {
    // 检测 Ollama 安装路径
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows 常见安装路径
      const possiblePaths = [
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe'),
        'ollama.exe', // 系统 PATH 中
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          this.ollamaPath = p;
          console.log('找到 Ollama:', p);
          return;
        }
      }
      
      // 如果都找不到，尝试使用 PATH 中的
      this.ollamaPath = 'ollama';
    } else if (platform === 'darwin') {
      // macOS
      const possiblePaths = [
        '/usr/local/bin/ollama',
        '/opt/homebrew/bin/ollama',
        'ollama',
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          this.ollamaPath = p;
          console.log('找到 Ollama:', p);
          return;
        }
      }
      
      this.ollamaPath = 'ollama';
    } else {
      // Linux
      this.ollamaPath = 'ollama';
    }
  }

  public async checkInstalled(): Promise<{ installed: boolean; path: string; message: string }> {
    return new Promise((resolve) => {
      const process = spawn(this.ollamaPath, ['--version'], {
        shell: true,
        windowsHide: true,
      });

      let output = '';
      
      process.stdout?.on('data', (data) => {
        output += data.toString();
      });

      process.stderr?.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            installed: true,
            path: this.ollamaPath,
            message: `Ollama 已安装: ${output.trim()}`,
          });
        } else {
          resolve({
            installed: false,
            path: '',
            message: 'Ollama 未安装或无法访问',
          });
        }
      });

      process.on('error', () => {
        resolve({
          installed: false,
          path: '',
          message: 'Ollama 未安装。请访问 https://ollama.com 下载安装',
        });
      });
    });
  }

  public async startServer(): Promise<{ success: boolean; message: string }> {
    if (this.isRunning) {
      return { success: true, message: 'Ollama 服务已在运行' };
    }

    const installCheck = await this.checkInstalled();
    if (!installCheck.installed) {
      return { success: false, message: installCheck.message };
    }

    return new Promise((resolve) => {
      try {
        // 启动 Ollama 服务
        this.ollamaProcess = spawn(this.ollamaPath, ['serve'], {
          shell: true,
          windowsHide: true,
          detached: false,
        });

        const logStream = fs.createWriteStream(this.logPath, { flags: 'a' });

        this.ollamaProcess.stdout?.on('data', (data) => {
          logStream.write(`[STDOUT] ${data}`);
        });

        this.ollamaProcess.stderr?.on('data', (data) => {
          logStream.write(`[STDERR] ${data}`);
        });

        this.ollamaProcess.on('error', (error) => {
          console.error('Ollama 启动失败:', error);
          this.isRunning = false;
          logStream.end();
        });

        this.ollamaProcess.on('exit', (code) => {
          console.log('Ollama 服务退出，代码:', code);
          this.isRunning = false;
          logStream.end();
        });

        // 等待服务启动
        setTimeout(async () => {
          const isReady = await this.checkServerReady();
          if (isReady) {
            this.isRunning = true;
            resolve({ success: true, message: 'Ollama 服务已启动' });
          } else {
            this.stopServer();
            resolve({ success: false, message: 'Ollama 服务启动失败，请查看日志' });
          }
        }, 3000);

      } catch (error: any) {
        resolve({ success: false, message: `启动失败: ${error.message}` });
      }
    });
  }

  public stopServer(): void {
    if (this.ollamaProcess) {
      try {
        if (os.platform() === 'win32') {
          // Windows: 使用 taskkill
          spawn('taskkill', ['/pid', this.ollamaProcess.pid!.toString(), '/f', '/t'], {
            shell: true,
            windowsHide: true,
          });
        } else {
          // Unix: 发送 SIGTERM
          this.ollamaProcess.kill('SIGTERM');
        }
      } catch (error) {
        console.error('停止 Ollama 失败:', error);
      }
      
      this.ollamaProcess = null;
      this.isRunning = false;
    }
  }

  private async checkServerReady(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      return response.ok;
    } catch {
      return false;
    }
  }

  public async listModels(): Promise<{ success: boolean; models: string[]; message: string }> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        return { success: false, models: [], message: 'Ollama 服务未运行' };
      }

      const data: any = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];
      
      return {
        success: true,
        models,
        message: `找到 ${models.length} 个模型`,
      };
    } catch (error: any) {
      return {
        success: false,
        models: [],
        message: `获取模型列表失败: ${error.message}`,
      };
    }
  }

  public async pullModel(modelName: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const process = spawn(this.ollamaPath, ['pull', modelName], {
        shell: true,
        windowsHide: true,
      });

      let output = '';

      process.stdout?.on('data', (data) => {
        output += data.toString();
        console.log('Ollama pull:', data.toString());
      });

      process.stderr?.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            message: `模型 ${modelName} 下载成功`,
          });
        } else {
          resolve({
            success: false,
            message: `模型下载失败: ${output}`,
          });
        }
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          message: `下载失败: ${error.message}`,
        });
      });
    });
  }

  public getStatus(): { running: boolean; path: string } {
    return {
      running: this.isRunning,
      path: this.ollamaPath,
    };
  }

  public getLogPath(): string {
    return this.logPath;
  }
}

export const ollamaService = new OllamaService();

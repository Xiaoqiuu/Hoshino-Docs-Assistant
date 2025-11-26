import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { AppConfig } from '../types';

export class ConfigService {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }

    return {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      modelName: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com',
      localMode: false,
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'deepseek-r1:8b',
      streamOutput: true, // 默认启用流式输出
      showReasoningContent: true, // 默认显示思维链
    };


    /// <summary>
    /// deepseek-reasoner在输出最终回答之前，模型会先输出一段思维链内容，以提升最终答案的准确性。API 向用户开放 deepseek-reasoner 思维链的内容，以供用户查看、展示、蒸馏使用。
    /// </summary>
  }

  public saveConfig(config: Partial<AppConfig>): void {
    this.config = { ...this.config, ...config };
    
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public getApiKey(): string {
    return this.config.apiKey || process.env.DEEPSEEK_API_KEY || '';
  }

  public setApiKey(apiKey: string): void {
    this.saveConfig({ apiKey });
  }
}

export const configService = new ConfigService();

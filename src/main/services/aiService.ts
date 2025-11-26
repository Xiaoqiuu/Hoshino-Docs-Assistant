import OpenAI from 'openai';
import type { AIResponse } from '../types';

export class AIService {
  private client: OpenAI | null = null;
  private apiKey: string = '';
  private baseURL: string = 'https://api.deepseek.com';
  private model: string = 'deepseek-chat';
  private localMode: boolean = false;
  private ollamaUrl: string = 'http://localhost:11434';
  private ollamaModel: string = 'deepseek-r1:7b';
  private streamOutput: boolean = true;
  private showReasoningContent: boolean = true;

  constructor() {
    // 不在构造函数中加载，等待 configService 初始化
  }

  public loadConfigFromService(config: { 
    apiKey?: string; 
    baseUrl?: string; 
    modelName?: string;
    localMode?: boolean;
    ollamaUrl?: string;
    ollamaModel?: string;
    streamOutput?: boolean;
    showReasoningContent?: boolean;
  }) {
    if (config.apiKey) {
      this.apiKey = config.apiKey;
    }
    if (config.baseUrl) {
      this.baseURL = config.baseUrl;
    }
    if (config.modelName) {
      this.model = config.modelName;
    }
    if (config.localMode !== undefined) {
      this.localMode = config.localMode;
    }
    if (config.ollamaUrl) {
      this.ollamaUrl = config.ollamaUrl;
    }
    if (config.ollamaModel) {
      this.ollamaModel = config.ollamaModel;
    }
    if (config.streamOutput !== undefined) {
      this.streamOutput = config.streamOutput;
    }
    if (config.showReasoningContent !== undefined) {
      this.showReasoningContent = config.showReasoningContent;
    }
    
    this.initClient();
  }

  private initClient() {
    if (this.localMode) {
      // 本地模式：使用 Ollama
      this.client = new OpenAI({
        apiKey: 'ollama', // Ollama 不需要真实的 API Key
        baseURL: `${this.ollamaUrl}/v1`,
      });
      console.log(`AI Service: 使用本地模型 ${this.ollamaModel} @ ${this.ollamaUrl}`);
    } else {
      // 云端模式：使用 DeepSeek 或其他 API
      if (!this.apiKey) {
        console.warn('AI Service: API Key 未配置');
        return;
      }
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      });
      console.log(`AI Service: 使用云端模型 ${this.model} @ ${this.baseURL}`);
    }
  }

  public setApiKey(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    if (baseURL) {
      this.baseURL = baseURL;
    }
    this.initClient();
  }

  public isConfigured(): boolean {
    if (this.localMode) {
      return !!this.client;
    }
    return !!this.client && !!this.apiKey;
  }

  async chat(message: string, messageHistory?: Array<{ role: string; content: string }>): Promise<AIResponse> {
    if (!this.isConfigured()) {
      const tip = this.localMode 
        ? '⚠️ 本地模型服务未连接。请确保 Ollama 已启动并在设置中配置正确。'
        : '⚠️ AI 服务未配置。请点击右上角 ⚙️ 设置按钮配置 API Key';
      return {
        response: tip,
        sources: [],
      };
    }

    try {
      const modelToUse = this.localMode ? this.ollamaModel : this.model;
      const isReasonerModel = modelToUse.includes('reasoner');
      
      // 构建消息列表
      const messages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: '你是 Hoshino，一个友好、专业的 AI 助手。请用简洁、清晰的方式回答问题。',
        },
      ];

      // 添加历史消息
      if (messageHistory && messageHistory.length > 0) {
        messages.push(...messageHistory);
      }

      // 添加当前消息
      messages.push({
        role: 'user',
        content: message,
      });

      const completion = await this.client!.chat.completions.create({
        model: modelToUse,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false, // 非流式模式
      });

      const responseText = completion.choices[0]?.message?.content || '抱歉，我无法生成回答。';
      
      // 对于推理模型，尝试提取思维链内容
      let reasoningContent: string | undefined;
      if (isReasonerModel && this.showReasoningContent) {
        // DeepSeek Reasoner 在非流式模式下，思维链可能在 message 的特殊字段中
        const message = completion.choices[0]?.message as any;
        if (message?.reasoning_content) {
          reasoningContent = message.reasoning_content;
        }
      }

      return {
        response: responseText,
        sources: [],
        reasoningContent,
      };
    } catch (error: any) {
      console.error('AI Service Error:', error);
      
      if (this.localMode) {
        if (error.code === 'ECONNREFUSED') {
          return {
            response: '❌ 无法连接到 Ollama 服务。请确保 Ollama 已启动（运行 `ollama serve`）',
            sources: [],
          };
        }
        return {
          response: `❌ 本地模型请求失败: ${error.message || '未知错误'}\n\n提示：请确保已安装模型（运行 \`ollama pull ${this.ollamaModel}\`）`,
          sources: [],
        };
      }
      
      if (error.status === 401) {
        return {
          response: '❌ API Key 无效或已过期，请在设置中检查配置。',
          sources: [],
        };
      }
      
      if (error.status === 429) {
        return {
          response: '⚠️ API 请求频率超限，请稍后再试。',
          sources: [],
        };
      }

      return {
        response: `❌ 请求失败: ${error.message || '未知错误'}`,
        sources: [],
      };
    }
  }

  // 流式聊天方法
  async *chatStream(message: string, messageHistory?: Array<{ role: string; content: string }>): AsyncGenerator<{
    content?: string;
    reasoningContent?: string;
    done: boolean;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      const tip = this.localMode 
        ? '⚠️ 本地模型服务未连接。请确保 Ollama 已启动并在设置中配置正确。'
        : '⚠️ AI 服务未配置。请点击右上角 ⚙️ 设置按钮配置 API Key';
      yield { content: tip, done: true };
      return;
    }

    try {
      const modelToUse = this.localMode ? this.ollamaModel : this.model;
      const isReasonerModel = modelToUse.includes('reasoner');
      
      // 构建消息列表
      const messages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: '你是 Hoshino，一个友好、专业的 AI 助手。请用简洁、清晰的方式回答问题。',
        },
      ];

      // 添加历史消息
      if (messageHistory && messageHistory.length > 0) {
        messages.push(...messageHistory);
      }

      // 添加当前消息
      messages.push({
        role: 'user',
        content: message,
      });

      const stream = await this.client!.chat.completions.create({
        model: modelToUse,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (!delta) continue;

        const result: {
          content?: string;
          reasoningContent?: string;
          done: boolean;
        } = { done: false };

        // 处理思维链内容（仅推理模型）
        if (isReasonerModel && this.showReasoningContent) {
          const reasoningDelta = (delta as any).reasoning_content;
          if (reasoningDelta) {
            result.reasoningContent = reasoningDelta;
          }
        }

        // 处理常规内容
        if (delta.content) {
          result.content = delta.content;
        }

        // 检查是否完成
        if (chunk.choices[0]?.finish_reason) {
          result.done = true;
        }

        yield result;
      }
    } catch (error: any) {
      console.error('AI Service Stream Error:', error);
      
      let errorMessage = '❌ 请求失败';
      
      if (this.localMode && error.code === 'ECONNREFUSED') {
        errorMessage = '❌ 无法连接到 Ollama 服务。请确保 Ollama 已启动';
      } else if (error.status === 401) {
        errorMessage = '❌ API Key 无效或已过期';
      } else if (error.status === 429) {
        errorMessage = '⚠️ API 请求频率超限，请稍后再试';
      } else {
        errorMessage = `❌ 请求失败: ${error.message || '未知错误'}`;
      }

      yield { content: errorMessage, done: true, error: error.message };
    }
  }

  async chatWithContext(message: string, context: string): Promise<AIResponse> {
    if (!this.isConfigured()) {
      const tip = this.localMode 
        ? '⚠️ 本地模型服务未连接。请确保 Ollama 已启动并在设置中配置正确。'
        : '⚠️ AI 服务未配置。请点击右上角 ⚙️ 设置按钮配置 API Key';
      return {
        response: tip,
        sources: [],
      };
    }

    try {
      const modelToUse = this.localMode ? this.ollamaModel : this.model;
      
      const completion = await this.client!.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: '你是 Hoshino，一个专业的文档助手。请基于用户提供的文档内容回答问题，并在回答中引用相关内容。',
          },
          {
            role: 'user',
            content: `文档内容：\n${context}\n\n问题：${message}\n\n请基于上述文档内容回答问题。`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      console.log('AI 模型响应:', {
        model: modelToUse,
        choices: completion.choices?.length,
        hasContent: !!completion.choices[0]?.message?.content,
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        console.error('AI 模型返回空内容:', completion);
        return {
          response: '❌ AI 模型返回了空内容。请检查：\n1. 模型是否正确加载\n2. Ollama 服务是否正常运行\n3. 尝试重启 Ollama 服务',
          sources: [],
        };
      }

      const sources = [
        {
          page: 1,
          text: context.slice(0, 100) + '...',
          documentId: 'selected-text',
        },
      ];

      return {
        response: responseText,
        sources,
      };
    } catch (error: any) {
      console.error('AI Service Error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        localMode: this.localMode,
        model: this.localMode ? this.ollamaModel : this.model,
      });
      
      if (this.localMode && error.code === 'ECONNREFUSED') {
        return {
          response: '❌ 无法连接到 Ollama 服务。请确保 Ollama 已启动（运行 `ollama serve`）',
          sources: [],
        };
      }
      
      if (this.localMode) {
        return {
          response: `❌ 本地模型请求失败: ${error.message || '未知错误'}\n\n可能的原因：\n1. Ollama 服务未启动\n2. 模型未下载（运行 \`ollama pull ${this.ollamaModel}\`）\n3. 模型名称配置错误`,
          sources: [],
        };
      }
      
      return {
        response: `❌ 请求失败: ${error.message || '未知错误'}`,
        sources: [],
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: this.localMode ? 'Ollama 服务未配置' : 'API Key 未配置',
      };
    }

    try {
      const modelToUse = this.localMode ? this.ollamaModel : this.model;
      
      await this.client!.chat.completions.create({
        model: modelToUse,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      return {
        success: true,
        message: this.localMode 
          ? `本地模型 ${this.ollamaModel} 连接成功` 
          : '云端 API 连接成功',
      };
    } catch (error: any) {
      if (this.localMode && error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Ollama 服务未启动，请运行 `ollama serve`',
        };
      }
      return {
        success: false,
        message: error.message || '连接失败',
      };
    }
  }

  async checkBalance(): Promise<{
    success: boolean;
    balance?: {
      is_available: boolean;
      balance_infos: Array<{
        currency: string;
        total_balance: string;
        granted_balance: string;
        topped_up_balance: string;
      }>;
    };
    message?: string;
  }> {
    if (this.localMode) {
      return {
        success: false,
        message: '本地模式不支持余额查询',
      };
    }

    if (!this.apiKey) {
      return {
        success: false,
        message: 'API Key 未配置',
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/user/balance`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as {
        is_available: boolean;
        balance_infos: Array<{
          currency: string;
          total_balance: string;
          granted_balance: string;
          topped_up_balance: string;
        }>;
      };
      
      return {
        success: true,
        balance: data,
      };
    } catch (error: any) {
      console.error('查询余额失败:', error);
      return {
        success: false,
        message: error.message || '查询失败',
      };
    }
  }
}

export const aiService = new AIService();

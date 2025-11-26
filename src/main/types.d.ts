export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  response: string;
  sources?: Source[];
  reasoningContent?: string; // 推理模型的思维链内容
}

export interface Source {
  page: number;
  text: string;
  documentId?: string;
}

export interface AppConfig {
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  localMode: boolean;
  ollamaUrl?: string;
  ollamaModel?: string;
  streamOutput?: boolean; // 是否启用流式输出
  showReasoningContent?: boolean; // 是否显示推理模型的思维链
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    page?: number;
    documentId: string;
    documentName: string;
  };
  embedding?: number[];
}

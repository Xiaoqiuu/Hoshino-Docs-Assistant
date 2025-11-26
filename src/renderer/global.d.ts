export {};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ page: number; text: string }>;
  reasoningContent?: string; // 推理模型的思维链内容
  isThinking?: boolean; // 是否正在思考
  reasoningExpanded?: boolean; // 思维链是否展开
}

declare global {
  interface Window {
    electronAPI: {
      hideWindow: () => Promise<void>;
      getSelectedText: () => Promise<string>;
      sendMessage: (message: string, selectedText?: string, messageHistory?: Array<{ role: string; content: string }>) => Promise<any>;
      sendMessageStream: (message: string, selectedText?: string, messageHistory?: Array<{ role: string; content: string }>) => Promise<any>;
      onMessageStreamChunk: (callback: (data: { type: string; content?: string; done: boolean }) => void) => void;
      getConfig: () => Promise<any>;
      setConfig: (config: any) => Promise<any>;
      testConnection: () => Promise<{ success: boolean; message: string }>;
      checkBalance: () => Promise<{
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
      }>;
      onWindowShown: (callback: () => void) => void;
      onOpenSettings: (callback: () => void) => void;
      togglePin: () => Promise<boolean>;
      toggleMaximize: () => Promise<boolean>;
      
      // 会话管理
      createSession: (title: string) => Promise<number>;
      getSessions: () => Promise<any[]>;
      getActiveSession: () => Promise<any>;
      switchSession: (sessionId: number) => Promise<Message[]>;
      deleteSession: (sessionId: number) => Promise<void>;
      updateSessionTitle: (sessionId: number, title: string) => Promise<void>;
      
      // 消息管理
      saveMessage: (message: any) => Promise<number>;
      getSessionMessages: (sessionId: number) => Promise<Message[]>;
      
      // Ollama 服务管理
      ollamaCheckInstalled: () => Promise<{ installed: boolean; path: string; message: string }>;
      ollamaStartServer: () => Promise<{ success: boolean; message: string }>;
      ollamaStopServer: () => Promise<{ success: boolean; message: string }>;
      ollamaGetStatus: () => Promise<{ running: boolean; path: string }>;
      ollamaListModels: () => Promise<{ success: boolean; models: string[]; message: string }>;
      ollmaPullModel: (modelName: string) => Promise<{ success: boolean; message: string }>;
      
      // OCR 功能
      ocrRecognizeClipboard: (languages?: string) => Promise<{ success: boolean; text: string; confidence: number; error?: string }>;
      ocrRecognizeImage: (imageDataUrl: string, languages?: string) => Promise<{ success: boolean; text: string; confidence: number; error?: string }>;
      ocrGetStatus: () => Promise<{ initialized: boolean }>;
      
      // RAG 文档管理
      ragSelectAndUploadDocument: () => Promise<{ success: boolean; documentId?: string; error?: string }>;
      ragUploadDocument: (filePath: string) => Promise<{ success: boolean; documentId?: string; error?: string }>;
      ragGetDocuments: () => Promise<{ success: boolean; documents?: any[]; error?: string }>;
      ragGetDocument: (documentId: string) => Promise<{ success: boolean; document?: any; error?: string }>;
      ragDeleteDocument: (documentId: string) => Promise<{ success: boolean; error?: string }>;
      ragAnswer: (question: string, documentIds?: string[]) => Promise<{ success: boolean; answer?: any; error?: string }>;
      ragGetStats: () => Promise<{ success: boolean; stats?: any; error?: string }>;
      ragOpenDocument: (documentId: string) => Promise<{ success: boolean; error?: string }>;
      ragGetDocumentContent: (documentId: string) => Promise<{ success: boolean; content?: string; totalPages?: number; error?: string }>;
      onRagUploadProgress: (callback: (data: { progress: number; message: string }) => void) => void;
    };
  }
}

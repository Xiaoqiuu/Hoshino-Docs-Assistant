import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  getSelectedText: () => ipcRenderer.invoke('get-selected-text'),
  sendMessage: (message: string, selectedText?: string, messageHistory?: Array<{ role: string; content: string }>) => 
    ipcRenderer.invoke('send-message', message, selectedText, messageHistory),
  sendMessageStream: (message: string, selectedText?: string, messageHistory?: Array<{ role: string; content: string }>) => 
    ipcRenderer.invoke('send-message-stream', message, selectedText, messageHistory),
  onMessageStreamChunk: (callback: (data: { type: string; content?: string; done: boolean }) => void) => {
    ipcRenderer.on('message-stream-chunk', (_event, data) => callback(data));
  },
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config: any) => ipcRenderer.invoke('set-config', config),
  testConnection: () => ipcRenderer.invoke('test-connection'),
  checkBalance: () => ipcRenderer.invoke('check-balance'),
  onWindowShown: (callback: () => void) => {
    ipcRenderer.on('window-shown', callback);
  },
  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', callback);
  },
  togglePin: () => ipcRenderer.invoke('toggle-pin'),
  toggleMaximize: () => ipcRenderer.invoke('toggle-maximize'),
  
  // 会话管理
  createSession: (title: string) => ipcRenderer.invoke('create-session', title),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  getActiveSession: () => ipcRenderer.invoke('get-active-session'),
  switchSession: (sessionId: number) => ipcRenderer.invoke('switch-session', sessionId),
  deleteSession: (sessionId: number) => ipcRenderer.invoke('delete-session', sessionId),
  updateSessionTitle: (sessionId: number, title: string) => ipcRenderer.invoke('update-session-title', sessionId, title),
  
  // 消息管理
  saveMessage: (message: any) => ipcRenderer.invoke('save-message', message),
  getSessionMessages: (sessionId: number) => ipcRenderer.invoke('get-session-messages', sessionId),
  
  // Ollama 服务管理
  ollamaCheckInstalled: () => ipcRenderer.invoke('ollama-check-installed'),
  ollamaStartServer: () => ipcRenderer.invoke('ollama-start-server'),
  ollamaStopServer: () => ipcRenderer.invoke('ollama-stop-server'),
  ollamaGetStatus: () => ipcRenderer.invoke('ollama-get-status'),
  ollamaListModels: () => ipcRenderer.invoke('ollama-list-models'),
  ollmaPullModel: (modelName: string) => ipcRenderer.invoke('ollama-pull-model', modelName),
  
  // OCR 功能
  ocrRecognizeClipboard: (languages?: string) => ipcRenderer.invoke('ocr-recognize-clipboard', languages),
  ocrRecognizeImage: (imageDataUrl: string, languages?: string) => ipcRenderer.invoke('ocr-recognize-image', imageDataUrl, languages),
  ocrGetStatus: () => ipcRenderer.invoke('ocr-get-status'),
  
  // RAG 文档管理
  ragSelectAndUploadDocument: () => ipcRenderer.invoke('rag-select-and-upload-document'),
  ragUploadDocument: (filePath: string) => ipcRenderer.invoke('rag-upload-document', filePath),
  ragGetDocuments: () => ipcRenderer.invoke('rag-get-documents'),
  ragGetDocument: (documentId: string) => ipcRenderer.invoke('rag-get-document', documentId),
  ragDeleteDocument: (documentId: string) => ipcRenderer.invoke('rag-delete-document', documentId),
  ragAnswer: (question: string, documentIds?: string[]) => ipcRenderer.invoke('rag-answer', question, documentIds),
  ragGetStats: () => ipcRenderer.invoke('rag-get-stats'),
  ragOpenDocument: (documentId: string) => ipcRenderer.invoke('rag-open-document', documentId),
  ragGetDocumentContent: (documentId: string) => ipcRenderer.invoke('rag-get-document-content', documentId),
  onRagUploadProgress: (callback: (data: { progress: number; message: string }) => void) => {
    ipcRenderer.on('rag-upload-progress', (_event, data) => callback(data));
  },
});

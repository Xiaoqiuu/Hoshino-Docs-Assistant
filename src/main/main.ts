import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, clipboard } from 'electron';
import path from 'path';
import { aiService } from './services/aiService';
import { configService } from './services/configService';
import { databaseService } from './services/databaseService';
import { ollamaService } from './services/ollamaService';
import { ocrService } from './services/ocrService';
import { ragService } from './services/ragService';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  // 加载应用图标
  const iconPath = path.join(__dirname, '../../hoshino_icon.png');
  let icon: Electron.NativeImage | undefined;
  
  try {
    const loadedIcon = nativeImage.createFromPath(iconPath);
    if (!loadedIcon.isEmpty()) {
      icon = loadedIcon;
    }
  } catch (error) {
    console.error('加载图标失败:', error);
  }

  mainWindow = new BrowserWindow({
    width: 800,  // 增大宽度
    height: 600, // 增大高度
    minWidth: 700, // 设置最小宽度，防止横向滚动条
    minHeight: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: false, // 默认不置顶
    skipTaskbar: false, // 显示在任务栏
    resizable: false,
    show: false,
    icon: icon, // 设置窗口图标
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // 开发模式下自动打开开发者工具
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 失去焦点时的处理（可通过置顶功能禁用）
  mainWindow.on('blur', () => {
    if (mainWindow && !mainWindow.webContents.isDevToolsOpened()) {
      // 检查是否启用了置顶模式
      const isPinned = mainWindow.isAlwaysOnTop();
      if (!isPinned) {
        // 如果窗口是最大化状态，先恢复再隐藏
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
          mainWindow.setResizable(false);
          mainWindow.setSize(800, 600);
        }
        mainWindow.hide();
      }
    }
  });
}

function createTray() {
  // 使用项目图标
  const iconPath = path.join(__dirname, '../../hoshino_icon.png');
  let icon: Electron.NativeImage;
  
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示 Hoshino', click: () => toggleWindow() },
    { label: '设置', click: () => openSettings() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ]);

  tray.setToolTip('Hoshino 文档助手');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => toggleWindow());
}

function toggleWindow() {
  if (!mainWindow) return;

  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    try {
      // 如果窗口是最大化状态，先恢复
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        mainWindow.setResizable(false);
      }
      
      // 确保窗口大小正确
      mainWindow.setSize(800, 600);
      
      // 获取屏幕信息并计算位置
      const { screen } = require('electron');
      const cursorPosition = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(cursorPosition);
      
      // 计算居中位置
      const x = Math.round(currentDisplay.bounds.x + (currentDisplay.bounds.width - 600) / 2);
      const y = Math.round(currentDisplay.bounds.y + currentDisplay.bounds.height * 0.3);
      
      // 设置位置
      mainWindow.setPosition(x, y);
      
      // 显示窗口
      mainWindow.show();
      mainWindow.focus();
      
      // 通知渲染进程刷新剪贴板内容
      mainWindow.webContents.send('window-shown');
    } catch (error) {
      console.error('切换窗口失败:', error);
      // 如果出错，尝试简单显示
      try {
        mainWindow.setSize(800, 600);
        mainWindow.center();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('window-shown');
      } catch (e) {
        console.error('窗口显示失败:', e);
      }
    }
  }
}

function openSettings() {
  if (!mainWindow) return;
  
  if (!mainWindow.isVisible()) {
    toggleWindow();
  }
  
  // 通知渲染进程打开设置
  mainWindow.webContents.send('open-settings');
}

function registerShortcuts() {
  const ret = globalShortcut.register('CommandOrControl+Alt+H', () => {
    toggleWindow();
  });

  if (!ret) {
    console.log('快捷键注册失败');
  }
  
  // F12 打开/关闭开发者工具
  globalShortcut.register('F12', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });
  
  // Ctrl+Shift+I 也可以打开开发者工具
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });
}

app.whenReady().then(async () => {
  createWindow();
  createTray();
  registerShortcuts();
  
  // 从配置文件加载 AI 服务配置
  const config = configService.getConfig();
  aiService.loadConfigFromService(config);
  console.log('已加载配置:', config.apiKey ? '已配置 API Key' : '未配置 API Key');
  
  // 如果启用了本地模式，自动启动 Ollama
  if (config.localMode) {
    console.log('检测到本地模式，正在启动 Ollama...');
    const installCheck = await ollamaService.checkInstalled();
    
    if (installCheck.installed) {
      const startResult = await ollamaService.startServer();
      console.log('Ollama 启动结果:', startResult.message);
      
      if (startResult.success) {
        // 检查是否已有配置的模型
        const modelsResult = await ollamaService.listModels();
        if (modelsResult.success && modelsResult.models.length === 0) {
          console.log('未找到模型，建议用户下载模型');
        }
      }
    } else {
      console.log('Ollama 未安装:', installCheck.message);
    }
  }
  
  // 创建新会话
  const sessionId = databaseService.createSession('新对话');
  console.log('创建新会话:', sessionId);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', (e: Event) => {
  e.preventDefault();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  // 停止 Ollama 服务
  ollamaService.stopServer();
  // 终止 OCR 服务
  ocrService.terminate();
});

// IPC 处理
ipcMain.handle('hide-window', () => {
  if (!mainWindow) return;
  
  // 如果窗口是最大化状态，先恢复再隐藏
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    mainWindow.setResizable(false);
    mainWindow.setSize(800, 600);
  }
  
  mainWindow.hide();
});

ipcMain.handle('get-selected-text', async () => {
  const { clipboard } = require('electron');
  try {
    const text = clipboard.readText();
    return text || '';
  } catch (error) {
    console.error('读取剪贴板失败:', error);
    return '';
  }
});

ipcMain.handle('send-message', async (_event, message: string, selectedText?: string, messageHistory?: Array<{ role: string; content: string }>) => {
  try {
    if (selectedText) {
      // RAG 模式 - 基于选中文本的问答
      return await aiService.chatWithContext(message, selectedText);
    } else {
      // 普通对话模式 - 支持多轮对话
      return await aiService.chat(message, messageHistory);
    }
  } catch (error: any) {
    console.error('AI Service Error:', error);
    return {
      response: `❌ 发生错误: ${error.message || '未知错误'}`,
      sources: []
    };
  }
});

// 流式消息处理
ipcMain.handle('send-message-stream', async (event, message: string, selectedText?: string, messageHistory?: Array<{ role: string; content: string }>) => {
  try {
    const config = configService.getConfig();
    
    // 如果未启用流式输出，回退到普通模式
    if (!config.streamOutput) {
      if (selectedText) {
        return await aiService.chatWithContext(message, selectedText);
      } else {
        return await aiService.chat(message, messageHistory);
      }
    }

    // 流式输出模式
    let fullContent = '';
    let fullReasoningContent = '';
    
    if (selectedText) {
      // RAG 模式暂时不支持流式，使用普通模式
      return await aiService.chatWithContext(message, selectedText);
    } else {
      // 普通对话的流式模式 - 支持多轮对话
      for await (const chunk of aiService.chatStream(message, messageHistory)) {
        if (chunk.content) {
          fullContent += chunk.content;
          event.sender.send('message-stream-chunk', {
            type: 'content',
            content: chunk.content,
            done: chunk.done,
          });
        }
        
        if (chunk.reasoningContent) {
          fullReasoningContent += chunk.reasoningContent;
          event.sender.send('message-stream-chunk', {
            type: 'reasoning',
            content: chunk.reasoningContent,
            done: chunk.done,
          });
        }
        
        if (chunk.error) {
          event.sender.send('message-stream-chunk', {
            type: 'error',
            content: chunk.error,
            done: true,
          });
          return {
            response: fullContent || `❌ ${chunk.error}`,
            sources: [],
            reasoningContent: fullReasoningContent || undefined,
          };
        }
        
        if (chunk.done) {
          event.sender.send('message-stream-chunk', {
            type: 'done',
            done: true,
          });
          break;
        }
      }
      
      return {
        response: fullContent,
        sources: [],
        reasoningContent: fullReasoningContent || undefined,
      };
    }
  } catch (error: any) {
    console.error('AI Service Stream Error:', error);
    event.sender.send('message-stream-chunk', {
      type: 'error',
      content: error.message || '未知错误',
      done: true,
    });
    return {
      response: `❌ 发生错误: ${error.message || '未知错误'}`,
      sources: []
    };
  }
});

ipcMain.handle('get-config', async () => {
  return configService.getConfig();
});

ipcMain.handle('set-config', async (_event, config) => {
  configService.saveConfig(config);
  
  // 重新加载完整配置到 AI 服务
  const fullConfig = configService.getConfig();
  aiService.loadConfigFromService(fullConfig);
  
  return { success: true };
});

ipcMain.handle('test-connection', async () => {
  return await aiService.testConnection();
});

ipcMain.handle('check-balance', async () => {
  return await aiService.checkBalance();
});

ipcMain.handle('toggle-pin', async () => {
  if (!mainWindow) return false;
  const currentState = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!currentState);
  return !currentState;
});

ipcMain.handle('toggle-maximize', async () => {
  if (!mainWindow) return false;
  
  const isCurrentlyMaximized = mainWindow.isMaximized();
  
  if (isCurrentlyMaximized) {
    // 恢复到小窗口模式
    mainWindow.unmaximize();
    
    // 等待 unmaximize 完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    mainWindow.setResizable(false);
    mainWindow.setSize(800, 600);
    mainWindow.center();
    
    return false;
  } else {
    // 进入最大化模式
    mainWindow.setResizable(true);
    mainWindow.maximize();
    
    return true;
  }
});

// 会话管理
ipcMain.handle('create-session', async (_event, title) => {
  return databaseService.createSession(title);
});

ipcMain.handle('get-sessions', async () => {
  const sessions = databaseService.getAllSessions();
  // 添加消息数量
  return sessions.map(session => ({
    ...session,
    messageCount: databaseService.getMessageCount(session.id)
  }));
});

ipcMain.handle('get-active-session', async () => {
  return databaseService.getActiveSession();
});

ipcMain.handle('switch-session', async (_event, sessionId) => {
  databaseService.setActiveSession(sessionId);
  return databaseService.getMessages(sessionId);
});

ipcMain.handle('delete-session', async (_event, sessionId) => {
  databaseService.deleteSession(sessionId);
});

ipcMain.handle('update-session-title', async (_event, sessionId, title) => {
  databaseService.updateSession(sessionId, { title });
});

// Ollama 服务管理
ipcMain.handle('ollama-check-installed', async () => {
  return await ollamaService.checkInstalled();
});

ipcMain.handle('ollama-start-server', async () => {
  return await ollamaService.startServer();
});

ipcMain.handle('ollama-stop-server', async () => {
  ollamaService.stopServer();
  return { success: true, message: 'Ollama 服务已停止' };
});

ipcMain.handle('ollama-get-status', async () => {
  return ollamaService.getStatus();
});

ipcMain.handle('ollama-list-models', async () => {
  return await ollamaService.listModels();
});

ipcMain.handle('ollama-pull-model', async (_event, modelName) => {
  return await ollamaService.pullModel(modelName);
});

// OCR 功能
ipcMain.handle('ocr-recognize-clipboard', async (_event, languages?: string) => {
  try {
    const image = clipboard.readImage();
    
    if (image.isEmpty()) {
      return {
        success: false,
        text: '',
        confidence: 0,
        error: '剪贴板中没有图片',
      };
    }

    // 将图片转换为 PNG Buffer
    const imageBuffer = image.toPNG();
    
    // 执行 OCR 识别，使用指定语言或默认多语言
    const result = await ocrService.recognizeFromClipboard(imageBuffer, languages);
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error.message || '识别失败',
    };
  }
});

ipcMain.handle('ocr-recognize-image', async (_event, imageDataUrl: string, languages?: string) => {
  try {
    // 从 Data URL 提取 base64 数据
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // 执行 OCR 识别，使用指定语言或默认多语言
    const result = await ocrService.recognizeImage(imageBuffer, languages);
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error.message || '识别失败',
    };
  }
});

ipcMain.handle('ocr-get-status', async () => {
  return ocrService.getStatus();
});

// 消息管理
ipcMain.handle('save-message', async (_event, message) => {
  return databaseService.addMessage(message);
});

ipcMain.handle('get-session-messages', async (_event, sessionId) => {
  return databaseService.getMessages(sessionId);
});

// RAG 文档管理
ipcMain.handle('rag-select-and-upload-document', async () => {
  try {
    const { dialog } = require('electron');
    
    // 打开文件选择对话框
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'PDF 文档', extensions: ['pdf'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: '未选择文件' };
    }

    const filePath = result.filePaths[0];
    
    let progress = 0;
    let message = '';
    
    const documentId = await ragService.uploadDocument(filePath, (p, m) => {
      progress = p;
      message = m;
      // 发送进度更新到渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('rag-upload-progress', { progress, message });
      }
    });
    
    return { success: true, documentId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag-upload-document', async (_event, filePath: string) => {
  try {
    let progress = 0;
    let message = '';
    
    const documentId = await ragService.uploadDocument(filePath, (p, m) => {
      progress = p;
      message = m;
      // 发送进度更新到渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('rag-upload-progress', { progress, message });
      }
    });
    
    return { success: true, documentId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag-get-documents', async () => {
  try {
    const documents = ragService.getAllDocuments();
    return { success: true, documents };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag-get-document', async (_event, documentId: string) => {
  try {
    const document = ragService.getDocument(documentId);
    return { success: true, document };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag-delete-document', async (_event, documentId: string) => {
  try {
    ragService.deleteDocument(documentId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag-answer', async (_event, question: string, documentIds?: string[]) => {
  try {
    const answer = await ragService.answer(question, documentIds);
    return { success: true, answer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag-open-document', async (_event, documentId: string) => {
  try {
    const { shell } = require('electron');
    const document = ragService.getDocument(documentId);
    
    if (!document) {
      return { success: false, error: '文档不存在' };
    }

    // 使用系统默认应用打开文档
    await shell.openPath(document.path);
    
    return { success: true };
  } catch (error: any) {
    console.error('打开文档失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag-get-document-content', async (_event, documentId: string) => {
  try {
    const result = await ragService.getDocumentContent(documentId);
    return { 
      success: true, 
      content: result.content,
      totalPages: result.totalPages
    };
  } catch (error: any) {
    console.error('获取文档内容失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rag-get-stats', async () => {
  try {
    const stats = ragService.getStats();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

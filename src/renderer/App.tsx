import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import './App.css';
import './global.d.ts';
import { Settings } from './Settings';
import { SessionHistory } from './components/SessionHistory';
import { NavigationIsland, NavigationMode } from './components/NavigationIsland';
import { Toolbox } from './components/Toolbox';
import { DocumentLibrary } from './components/DocumentLibrary';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ page: number; text: string }>;
  image?: string; // 用于显示的图片
  reasoningContent?: string; // 推理模型的思维链内容
  isThinking?: boolean; // 是否正在思考
  reasoningExpanded?: boolean; // 思维链是否展开
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [currentMode, setCurrentMode] = useState<NavigationMode>('chat');
  const [isPinned, setIsPinned] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [ignoreClipboard, setIgnoreClipboard] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState('新对话');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshClipboard = async () => {
    const text = await window.electronAPI.getSelectedText();
    setSelectedText(text);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTogglePin = async () => {
    const newPinState = await window.electronAPI.togglePin();
    setIsPinned(newPinState);
  };

  const handleToggleMaximize = async () => {
    const newMaxState = await window.electronAPI.toggleMaximize();
    setIsMaximized(newMaxState);
  };

  useEffect(() => {
    // 初始化：加载当前会话
    loadCurrentSession();

    // 初始加载时获取剪贴板内容
    refreshClipboard();

    // 监听窗口显示事件，刷新剪贴板
    window.electronAPI.onWindowShown(() => {
      refreshClipboard();
      inputRef.current?.focus();
      // 重置最大化状态（窗口隐藏时会恢复小窗口）
      setIsMaximized(false);
    });

    // 监听打开设置事件
    window.electronAPI.onOpenSettings(() => {
      setShowSettings(true);
      setCurrentMode('settings');
    });

    // 自动聚焦输入框
    inputRef.current?.focus();
  }, []);

  const loadCurrentSession = async () => {
    try {
      const session = await window.electronAPI.getActiveSession();
      if (session) {
        setCurrentSessionId(session.id);
        setSessionTitle(session.title);
        const msgs = await window.electronAPI.getSessionMessages(session.id);
        
        // 解析 sources 字段（从 JSON 字符串转为对象）
        const parsedMsgs = msgs.map(msg => ({
          ...msg,
          sources: msg.sources && typeof msg.sources === 'string' 
            ? JSON.parse(msg.sources) 
            : msg.sources
        }));
        
        setMessages(parsedMsgs);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  };

  const handleNewSession = async () => {
    try {
      const sessionId = await window.electronAPI.createSession('新对话');
      setCurrentSessionId(sessionId);
      setSessionTitle('新对话');
      setMessages([]);
      setIgnoreClipboard(false);
    } catch (error) {
      console.error('创建会话失败:', error);
    }
  };

  const handleSelectSession = async (sessionId: number) => {
    try {
      const msgs = await window.electronAPI.switchSession(sessionId);
      setCurrentSessionId(sessionId);
      
      // 解析 sources 字段（从 JSON 字符串转为对象）
      const parsedMsgs = msgs.map(msg => ({
        ...msg,
        sources: msg.sources && typeof msg.sources === 'string' 
          ? JSON.parse(msg.sources) 
          : msg.sources
      }));
      
      setMessages(parsedMsgs);
      
      // 加载会话信息
      const sessions = await window.electronAPI.getSessions();
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setSessionTitle(session.title);
      }
    } catch (error) {
      console.error('切换会话失败:', error);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await window.electronAPI.deleteSession(sessionId);
      if (sessionId === currentSessionId) {
        await handleNewSession();
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  const updateSessionTitleFromMessage = async (firstMessage: string) => {
    if (currentSessionId && sessionTitle === '新对话') {
      const newTitle = firstMessage.slice(0, 20) + (firstMessage.length > 20 ? '...' : '');
      setSessionTitle(newTitle);
      await window.electronAPI.updateSessionTitle(currentSessionId, newTitle);
    }
  };

  // 当消息更新或加载状态改变时，滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
    }
  }, [input]);

  // 处理粘贴事件
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 检查是否有图片
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // 阻止默认粘贴行为
        
        const file = item.getAsFile();
        if (!file) continue;

        // 读取图片为 Data URL
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imageDataUrl = event.target?.result as string;
          setPastedImage(imageDataUrl);
          setOcrText('');
          setOcrProgress(0);
          
          // 执行 OCR 识别
          setIsOcrProcessing(true);
          
          // 模拟进度更新
          const progressInterval = setInterval(() => {
            setOcrProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);
          
          try {
            const result = await window.electronAPI.ocrRecognizeImage(imageDataUrl);
            
            clearInterval(progressInterval);
            setOcrProgress(100);
            
            if (result.success && result.text) {
              setOcrText(result.text);
              console.log(`OCR 识别成功，置信度: ${result.confidence.toFixed(2)}%`);
            } else {
              console.error('OCR 识别失败:', result.error);
              setOcrText(`识别失败: ${result.error || '未知错误'}`);
            }
          } catch (error) {
            console.error('OCR 处理失败:', error);
            clearInterval(progressInterval);
            setOcrText('识别失败');
          } finally {
            setIsOcrProcessing(false);
          }
        };
        
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // 移除图片
  const handleRemoveImage = () => {
    setPastedImage(null);
    setOcrText('');
    setOcrProgress(0);
    setIsOcrProcessing(false);
  };

  // 处理导航模式切换
  const handleModeChange = (mode: NavigationMode) => {
    setCurrentMode(mode);
    
    // 关闭所有弹窗
    setShowSettings(false);
    setShowHistory(false);
    setShowToolbox(false);
    setShowDocuments(false);
    
    // 根据模式打开对应界面
    if (mode === 'settings') {
      setShowSettings(true);
    } else if (mode === 'toolbox') {
      setShowToolbox(true);
    } else if (mode === 'documents') {
      setShowDocuments(true);
    }
    // chat 模式保持在主界面
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !pastedImage) || isLoading || isOcrProcessing) return;

    // 用户看到的消息内容（显示图片）
    const displayContent = input.trim() || ''; // 用户输入的文字
    
    // 实际发送给 AI 的内容（OCR 文字）
    let messageContent = input.trim();
    if (pastedImage && ocrText) {
      messageContent = input.trim() 
        ? `${input.trim()}\n\n[图片内容]\n${ocrText}` 
        : `[图片内容]\n${ocrText}`;
    }

    // 保存当前图片用于显示
    const currentImage = pastedImage;

    // 用户看到的消息（包含图片）
    const userMessage: Message = {
      role: 'user',
      content: displayContent,
      image: currentImage || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPastedImage(null);
    setOcrText('');
    setOcrProgress(0);
    setIsLoading(true);

    // 保存用户消息到数据库
    if (currentSessionId) {
      await window.electronAPI.saveMessage({
        session_id: currentSessionId,
        role: 'user',
        content: messageContent,
        created_at: Date.now()
      });
      
      // 如果是第一条消息，更新会话标题
      if (messages.length === 0) {
        await updateSessionTitleFromMessage(messageContent);
      }
    }

    try {
      // 如果启用了无文本模式，不传递选中文本
      const contextText = ignoreClipboard ? undefined : (selectedText || undefined);
      
      // 构建消息历史（用于多轮对话）
      const messageHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // 获取配置以确定是否使用流式输出
      const config = await window.electronAPI.getConfig();
      
      if (config.streamOutput) {
        // 流式输出模式
        let streamContent = '';
        let streamReasoningContent = '';
        let assistantMessageIndex = -1;
        let hasReceivedContent = false; // 标记是否已收到正式回复
        
        // 添加一个空的助手消息用于流式更新
        setMessages(prev => {
          assistantMessageIndex = prev.length;
          return [...prev, {
            role: 'assistant',
            content: '',
            sources: [],
            reasoningContent: '',
            isThinking: true, // 标记正在思考
            reasoningExpanded: config.showReasoningContent, // 根据配置决定是否展开
          }];
        });
        
        // 监听流式数据块
        const handleStreamChunk = (data: { type: string; content?: string; done: boolean }) => {
          if (data.type === 'reasoning' && data.content) {
            // 收到思维链内容
            streamReasoningContent += data.content;
            
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[assistantMessageIndex] = {
                role: 'assistant',
                content: streamContent,
                sources: [],
                reasoningContent: streamReasoningContent,
                isThinking: !hasReceivedContent, // 如果还没收到正式回复，显示思考中
                reasoningExpanded: true, // 思考阶段自动展开
              };
              return newMessages;
            });
          } else if (data.type === 'content' && data.content) {
            // 收到正式回复内容
            if (!hasReceivedContent) {
              hasReceivedContent = true;
              // 第一次收到正式回复，自动折叠思维链
            }
            
            streamContent += data.content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[assistantMessageIndex] = {
                role: 'assistant',
                content: streamContent,
                sources: [],
                reasoningContent: streamReasoningContent || undefined,
                isThinking: false, // 已收到正式回复，不再显示思考中
                reasoningExpanded: false, // 正式回复阶段自动折叠
              };
              return newMessages;
            });
          } else if (data.type === 'error') {
            streamContent = data.content || '发生错误';
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[assistantMessageIndex] = {
                role: 'assistant',
                content: streamContent,
                sources: [],
                isThinking: false,
              };
              return newMessages;
            });
          }
        };
        
        window.electronAPI.onMessageStreamChunk(handleStreamChunk);
        
        const response = await window.electronAPI.sendMessageStream(
          messageContent,
          contextText,
          contextText ? undefined : messageHistory // 只在非RAG模式下传递历史
        );
        
        // 流式完成后，确保状态正确
        setMessages(prev => {
          const newMessages = [...prev];
          if (assistantMessageIndex >= 0 && assistantMessageIndex < newMessages.length) {
            newMessages[assistantMessageIndex] = {
              ...newMessages[assistantMessageIndex],
              isThinking: false,
              reasoningExpanded: false,
            };
          }
          return newMessages;
        });
        
        // 保存 AI 回复到数据库
        if (currentSessionId) {
          await window.electronAPI.saveMessage({
            session_id: currentSessionId,
            role: 'assistant',
            content: response.response,
            sources: response.sources ? JSON.stringify(response.sources) : null,
            created_at: Date.now()
          });
        }
      } else {
        // 非流式模式（原有逻辑）
        const response = await window.electronAPI.sendMessage(
          messageContent,
          contextText,
          contextText ? undefined : messageHistory // 只在非RAG模式下传递历史
        );

        const assistantMessage: Message = {
          role: 'assistant',
          content: response.response,
          sources: response.sources,
          reasoningContent: response.reasoningContent,
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // 保存 AI 回复到数据库
        if (currentSessionId) {
          await window.electronAPI.saveMessage({
            session_id: currentSessionId,
            role: 'assistant',
            content: response.response,
            sources: response.sources ? JSON.stringify(response.sources) : null,
            created_at: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    window.electronAPI.hideWindow();
  };

  return (
    <div className="app">
      {/* 设置面板 */}
      {showSettings && <Settings onClose={() => {
        setShowSettings(false);
        setCurrentMode('chat');
      }} />}

      {/* 会话历史 */}
      {showHistory && (
        <SessionHistory
          onClose={() => setShowHistory(false)}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          currentSessionId={currentSessionId}
        />
      )}

      {/* 百宝箱 */}
      {showToolbox && <Toolbox onClose={() => {
        setShowToolbox(false);
        setCurrentMode('chat');
      }} />}

      {/* 文档库 */}
      {showDocuments && (
        <DocumentLibrary
          onClose={() => {
            setShowDocuments(false);
            setCurrentMode('chat');
          }}
        />
      )}
      
      <div className="header">
        <div className="title">
          <span className="logo">✨</span>
          <button 
            className="session-title-btn"
            onClick={() => setShowHistory(true)}
            title="查看历史会话"
          >
            {sessionTitle} ▼
          </button>
          {selectedText && !ignoreClipboard && <span className="mode-badge">文档模式</span>}
        </div>
        <div className="header-actions">
          <button 
            className={`pin-btn ${isPinned ? 'active' : ''}`} 
            onClick={handleTogglePin}
            title={isPinned ? '取消置顶' : '置顶窗口'}
          >
            📌
          </button>
          <button 
            className="maximize-btn" 
            onClick={handleToggleMaximize}
            title={isMaximized ? '恢复窗口' : '最大化'}
            disabled={isMaximized}
          >
            {isMaximized ? '◱' : '□'}
          </button>
          <button className="close-btn" onClick={handleClose} title="关闭">×</button>
        </div>
      </div>

      {selectedText && (
        <div className="selected-text-preview">
          <div className="preview-header">
            <div className="preview-label">选中文本:</div>
            <button 
              className={`ignore-text-btn ${ignoreClipboard ? 'active' : ''}`}
              onClick={() => setIgnoreClipboard(!ignoreClipboard)}
              title={ignoreClipboard ? '使用文档模式' : '忽略文本（自由对话）'}
            >
              {ignoreClipboard ? '🔓 自由模式' : '📄 文档模式'}
            </button>
          </div>
          {!ignoreClipboard && (
            <div className="preview-content">{selectedText.slice(0, 100)}...</div>
          )}
        </div>
      )}

      <div className="messages">
        {messages.length === 0 ? (
          <div className="welcome">
            <h2>👋 你好！</h2>
            <p>{selectedText ? '我会基于你选中的文档内容回答问题' : '有什么可以帮你的吗？'}</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <>
                    {/* 思维链内容 */}
                    {msg.reasoningContent && (
                      <details 
                        className="reasoning-content" 
                        open={msg.reasoningExpanded}
                      >
                        <summary>
                          🧠 思维过程
                          {msg.isThinking && <span className="thinking-indicator"> (思考中...)</span>}
                        </summary>
                        <div className="reasoning-text">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {msg.reasoningContent}
                          </ReactMarkdown>
                        </div>
                      </details>
                    )}
                    
                    {/* 正在思考但还没有正式回复 */}
                    {msg.isThinking && !msg.content && !msg.reasoningContent && (
                      <div className="thinking-placeholder">
                        <div className="dots-loading"></div>
                        <span>正在思考...</span>
                      </div>
                    )}
                    
                    {/* 主要回复内容 */}
                    {msg.content && (
                      <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');
                          
                          return !inline && match ? (
                            <div className="code-block-wrapper">
                              <div className="code-block-header">
                                <span className="code-language">{match[1]}</span>
                                <button
                                  className="copy-code-btn"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    navigator.clipboard.writeText(codeString).then(() => {
                                      const btn = e.currentTarget as HTMLButtonElement;
                                      const originalText = btn.textContent;
                                      btn.textContent = '✓ 已复制';
                                      setTimeout(() => {
                                        btn.textContent = originalText || '复制';
                                      }, 2000);
                                    }).catch(err => {
                                      console.error('复制失败:', err);
                                    });
                                  }}
                                >
                                  复制
                                </button>
                              </div>
                              <SyntaxHighlighter
                                style={oneLight}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    )}
                  </>
                ) : (
                  <>
                    {msg.image && (
                      <div className="message-image">
                        <img src={msg.image} alt="User uploaded" />
                      </div>
                    )}
                    {msg.content && <div className="message-text">{msg.content}</div>}
                  </>
                )}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="sources">
                  <div className="sources-label">来源:</div>
                  {msg.sources.map((source, i) => (
                    <div key={i} className="source-item">
                      📄 第 {source.page} 页: {source.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant">
            <div className="loading-container">
              <div className="dots-loading">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="loading-text">思考中</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={`input-form ${isMaximized ? 'maximized' : ''}`} onSubmit={handleSubmit}>
        {pastedImage && (
          <div className="image-preview-container">
            <div className="image-preview-wrapper">
              <img 
                src={pastedImage} 
                alt="Pasted" 
                className="image-preview"
              />
              <button 
                type="button"
                className="remove-image-btn"
                onClick={handleRemoveImage}
                title="移除图片"
              >
                ×
              </button>
              {isOcrProcessing && (
                <div className="ocr-progress-overlay">
                  <div className="ocr-progress-bar">
                    <div 
                      className="ocr-progress-fill" 
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                  <div className="ocr-progress-text">
                    识别中 {ocrProgress}%
                  </div>
                </div>
              )}
              {!isOcrProcessing && ocrText && (
                <div className="ocr-text-tooltip">
                  <div className="ocr-text-content">
                    {ocrText}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={isOcrProcessing ? 'OCR 识别中，可以继续输入...' : (selectedText ? '询问关于文档的问题...' : '输入你的问题或粘贴图片...')}
          disabled={isLoading}
          rows={1}
        />
        <button 
          type="submit" 
          disabled={isLoading || isOcrProcessing || (!input.trim() && !pastedImage)}
          title={isOcrProcessing ? 'OCR 识别中，请稍候...' : ''}
        >
          {isOcrProcessing ? '识别中...' : '发送'}
        </button>
      </form>

      {/* 导航岛 - 独立于输入框 */}
      <div className="nav-island-container">
        <NavigationIsland 
          currentMode={currentMode} 
          onModeChange={handleModeChange}
          isMaximized={isMaximized}
        />
      </div>
    </div>
  );
}

export default App;

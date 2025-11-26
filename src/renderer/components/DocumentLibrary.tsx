import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import './DocumentLibrary.css';
import { DocumentViewer } from './DocumentViewer';

interface RAGDocument {
  id: string;
  name: string;
  totalPages: number;
  totalChunks: number;
  fileSize: number;
  createdAt: number;
  status: 'processing' | 'ready' | 'error';
  error?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ page: number; text: string; documentName?: string }>;
}

interface DocumentLibraryProps {
  onClose: () => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ onClose }) => {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ progress: 0, message: '' });
  const [stats, setStats] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ id: string; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDocuments();
    loadStats();
    
    // 监听上传进度
    window.electronAPI.onRagUploadProgress((data) => {
      setUploadProgress(data);
    });
  }, []);

  const loadDocuments = async () => {
    const result = await window.electronAPI.ragGetDocuments();
    if (result.success && result.documents) {
      setDocuments(result.documents);
    }
  };

  const loadStats = async () => {
    const result = await window.electronAPI.ragGetStats();
    if (result.success && result.stats) {
      setStats(result.stats);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress({ progress: 0, message: '选择文件...' });

    try {
      const result = await window.electronAPI.ragSelectAndUploadDocument();
      
      setUploading(false);
      
      if (result.success) {
        await loadDocuments();
        await loadStats();
        alert('文档上传成功！');
      } else {
        if (result.error !== '未选择文件') {
          alert(`上传失败: ${result.error}`);
        }
      }
    } catch (error: any) {
      setUploading(false);
      alert(`上传失败: ${error.message}`);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('确定要删除这个文档吗？')) return;

    const result = await window.electronAPI.ragDeleteDocument(documentId);
    
    if (result.success) {
      await loadDocuments();
      await loadStats();
      setSelectedDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    } else {
      alert(`删除失败: ${result.error}`);
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      alert('请输入问题');
      return;
    }

    if (selectedDocs.size === 0) {
      alert('请至少选择一个文档');
      return;
    }

    // 显示聊天窗口
    setShowChat(true);
    setIsChatMinimized(false);

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: question,
    };
    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsAsking(true);

    try {
      // 调用 RAG 问答
      const result = await window.electronAPI.ragAnswer(question, Array.from(selectedDocs));
      
      if (result.success && result.answer) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.answer.answer,
          sources: result.answer.sources.map((s: any) => ({
            page: s.page,
            text: s.content,
            documentName: s.documentName,
          })),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(result.error || '问答失败');
      }
    } catch (error: any) {
      let errorContent = `❌ 问答失败: ${error.message}`;
      
      // 检查是否是本地模型相关错误
      if (error.message.includes('Ollama') || error.message.includes('本地模型')) {
        errorContent = `❌ 本地模型服务未连接

请确保：
1. 已安装 Ollama（访问 https://ollama.com 下载）
2. Ollama 服务已启动
3. 在设置中启用了本地模式并配置了模型

提示：可以在设置 → 本地模型中一键启动 Ollama 服务`;
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAsking(false);
    }
  };

  // 滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAsking]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleViewDocument = (documentId: string, documentName: string) => {
    setViewingDocument({ id: documentId, name: documentName });
  };

  return (
    <div className="document-library-fullscreen">
      {/* 顶部工具栏 */}
      <div className="doc-toolbar">
        <div className="toolbar-left">
          <h2 className="toolbar-title">文档库</h2>
          {stats && (
            <div className="toolbar-stats">
              <div className="stat-item">
                <span className="stat-label">文档</span>
                <span className="stat-value">{stats.totalDocuments}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">就绪</span>
                <span className="stat-value ready">{stats.readyDocuments}</span>
              </div>
              {selectedDocs.size > 0 && (
                <>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <span className="stat-label">已选</span>
                    <span className="stat-value selected">{selectedDocs.size}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="toolbar-right">
          <div className="toolbar-hint">
            <svg className="hint-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 13A6 6 0 118 2a6 6 0 010 12z"/>
              <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
            </svg>
            <span className="hint-text">本地模型</span>
          </div>
          <button 
            className="toolbar-btn upload-btn" 
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? '上传中...' : '上传文档'}
          </button>
          <button className="toolbar-btn close-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>

      {/* 上传进度 */}
      {uploading && (
        <div className="upload-progress-bar">
          <div className="progress-fill" style={{ width: `${uploadProgress.progress}%` }} />
          <div className="progress-text">
            {uploadProgress.message} ({uploadProgress.progress}%)
          </div>
        </div>
      )}

      {/* 文档网格 */}
      <div className="documents-grid">
        {documents.length === 0 ? (
          <div className="empty-gallery">
            <svg className="empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="12" y="8" width="40" height="48" rx="2"/>
              <line x1="20" y1="20" x2="44" y2="20"/>
              <line x1="20" y1="28" x2="44" y2="28"/>
              <line x1="20" y1="36" x2="36" y2="36"/>
            </svg>
            <h3>还没有文档</h3>
            <p>点击"上传文档"开始使用</p>
          </div>
        ) : (
          documents.map(doc => (
            <div 
              key={doc.id} 
              className={`doc-card ${doc.status} ${selectedDocs.has(doc.id) ? 'selected' : ''}`}
              onClick={() => doc.status === 'ready' && toggleDocSelection(doc.id)}
              onDoubleClick={() => doc.status === 'ready' && handleViewDocument(doc.id, doc.name)}
            >
              {/* 选择框 */}
              <div className="doc-card-checkbox">
                <input
                  type="checkbox"
                  checked={selectedDocs.has(doc.id)}
                  onChange={() => toggleDocSelection(doc.id)}
                  disabled={doc.status !== 'ready'}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* 删除按钮 */}
              <button 
                className="doc-card-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(doc.id);
                }}
                title="删除文档"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
                  <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>

              {/* 文档缩略图 */}
              <div className="doc-thumbnail">
                <svg className="doc-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="white" strokeWidth="1" fill="none"/>
                </svg>
                <div className="doc-pages">{doc.totalPages} 页</div>
              </div>

              {/* 文档信息 */}
              <div className="doc-card-info">
                <div className="doc-card-name" title={doc.name}>
                  {doc.name}
                </div>
                <div className="doc-card-meta">
                  {doc.status === 'ready' && (
                    <>
                      <span>{doc.totalChunks} 块</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </>
                  )}
                  {doc.status === 'processing' && (
                    <span className="status-processing">处理中...</span>
                  )}
                  {doc.status === 'error' && (
                    <span className="status-error">错误</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 悬浮输入框 */}
      {selectedDocs.size > 0 && (
        <div className="floating-input-container">
          <div className="floating-input-box">
            <div className="floating-input-header">
              <span>向 {selectedDocs.size} 个文档提问</span>
            </div>
            <div className="floating-input-group">
              <input
                type="text"
                className="floating-input"
                placeholder="输入你的问题..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk()}
              />
              <button 
                className="floating-ask-btn"
                onClick={handleAsk}
                disabled={!question.trim() || isAsking}
              >
                {isAsking ? '⏳' : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 文档阅读器 */}
      {viewingDocument && (
        <DocumentViewer
          documentId={viewingDocument.id}
          documentName={viewingDocument.name}
          onClose={() => setViewingDocument(null)}
        />
      )}

      {/* 悬浮聊天窗口 */}
      {showChat && (
        <div className={`floating-chat ${isChatMinimized ? 'minimized' : ''}`}>
          <div className="floating-chat-header">
            <span>对话</span>
            <div className="floating-chat-actions">
              <button 
                className="chat-action-btn"
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                title={isChatMinimized ? '展开' : '最小化'}
              >
                {isChatMinimized ? '□' : '−'}
              </button>
              <button 
                className="chat-action-btn"
                onClick={() => {
                  setShowChat(false);
                  setMessages([]);
                }}
                title="关闭"
              >
                ✕
              </button>
            </div>
          </div>

          {!isChatMinimized && (
            <>
              <div className="floating-chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    <p>开始向文档提问吧！</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                      <div className="chat-message-content">
                        {msg.role === 'assistant' ? (
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
                        ) : (
                          <div className="user-message-text">{msg.content}</div>
                        )}
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="chat-sources">
                          <div className="sources-label">来源:</div>
                          {msg.sources.map((source, i) => (
                            <div key={i} className="source-item">
                              {source.documentName && (
                                <span className="source-doc">{source.documentName}</span>
                              )}
                              <span className="source-page">第 {source.page} 页</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isAsking && (
                  <div className="chat-message assistant">
                    <div className="chat-loading">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

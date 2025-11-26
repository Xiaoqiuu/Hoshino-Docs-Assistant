import { useState, useEffect } from 'react';
import './SessionHistory.css';

interface Session {
  id: number;
  title: string;
  created_at: number;
  updated_at: number;
  is_active: number;
  messageCount?: number;
}

interface SessionHistoryProps {
  onClose: () => void;
  onSelectSession: (sessionId: number) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: number) => void;
  currentSessionId: number | null;
}

export function SessionHistory({ 
  onClose, 
  onSelectSession, 
  onNewSession,
  onDeleteSession,
  currentSessionId 
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const sessionList = await window.electronAPI.getSessions();
      setSessions(sessionList);
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days === 0) return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const handleSelectSession = (sessionId: number) => {
    onSelectSession(sessionId);
    onClose();
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    
    if (confirm('确定要删除这个会话吗？')) {
      try {
        await window.electronAPI.deleteSession(sessionId);
        await loadSessions();
        
        // 如果删除的是当前会话，创建新会话
        if (sessionId === currentSessionId) {
          onNewSession();
        }
      } catch (error) {
        console.error('删除会话失败:', error);
      }
    }
  };

  return (
    <div className="session-history-overlay" onClick={onClose}>
      <div className="session-history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="session-history-header">
          <h3>会话历史</h3>
          <div className="session-history-actions">
            <button className="new-session-btn" onClick={() => { onNewSession(); onClose(); }}>
              ➕ 新建
            </button>
            <button className="close-history-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="session-list">
          {sessions.length === 0 ? (
            <div className="empty-sessions">
              <p>暂无历史会话</p>
              <button onClick={() => { onNewSession(); onClose(); }}>创建第一个会话</button>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="session-info">
                  <div className="session-title">
                    {session.id === currentSessionId && <span className="active-dot">●</span>}
                    {session.title}
                  </div>
                  <div className="session-meta">
                    <span className="session-time">{formatTime(session.updated_at)}</span>
                    {session.messageCount !== undefined && (
                      <span className="session-count">{session.messageCount}条消息</span>
                    )}
                  </div>
                </div>
                <button
                  className="delete-session-btn"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  title="删除会话"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import './DocumentViewer.css';

interface DocumentViewerProps {
  documentId: string;
  documentName: string;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documentId, 
  documentName, 
  onClose 
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.ragGetDocumentContent(documentId);
      
      if (result.success && result.content) {
        setContent(result.content);
        setTotalPages(result.totalPages || 1);
      } else {
        setError(result.error || '加载文档失败');
      }
    } catch (err: any) {
      setError(err.message || '加载文档失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-viewer">
      <div className="viewer-header">
        <div className="viewer-title">
          <svg className="viewer-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
          </svg>
          <span>{documentName}</span>
        </div>
        <div className="viewer-actions">
          {totalPages > 1 && (
            <div className="viewer-pagination">
              <button 
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ←
              </button>
              <span className="page-info">
                {currentPage} / {totalPages}
              </span>
              <button 
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                →
              </button>
            </div>
          )}
          <button className="viewer-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="viewer-content">
        {loading && (
          <div className="viewer-loading">
            <div className="loading-spinner"></div>
            <p>加载中...</p>
          </div>
        )}

        {error && (
          <div className="viewer-error">
            <svg className="error-icon" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h3>加载失败</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={loadDocument}>
              重试
            </button>
          </div>
        )}

        {!loading && !error && content && (
          <div className="viewer-text">
            <pre>{content}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

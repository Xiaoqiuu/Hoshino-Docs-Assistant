import { useState } from 'react';
import './Toolbox.css';

interface ToolboxProps {
  onClose: () => void;
}

export function Toolbox({ onClose }: ToolboxProps) {
  const tools = [
    {
      id: 'ocr',
      icon: '📸',
      name: 'OCR 识别',
      description: '图片文字识别',
      status: 'active',
    },
    {
      id: 'translator',
      icon: '🌐',
      name: '翻译助手',
      description: '多语言翻译',
      status: 'coming',
    },
    {
      id: 'summarizer',
      icon: '📝',
      name: '文本摘要',
      description: '智能总结',
      status: 'coming',
    },
    {
      id: 'formatter',
      icon: '✨',
      name: '格式转换',
      description: 'Markdown/JSON',
      status: 'coming',
    },
  ];

  return (
    <div className="toolbox-overlay">
      <div className="toolbox-panel">
        <div className="toolbox-header">
          <h2>🧰 百宝箱</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="toolbox-content">
          <div className="tools-grid">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className={`tool-card ${tool.status === 'coming' ? 'coming-soon' : ''}`}
              >
                <div className="tool-icon">{tool.icon}</div>
                <div className="tool-info">
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                </div>
                {tool.status === 'active' && (
                  <div className="tool-status active">已启用</div>
                )}
                {tool.status === 'coming' && (
                  <div className="tool-status coming">即将推出</div>
                )}
              </div>
            ))}
          </div>

          <div className="toolbox-info">
            <div className="info-card">
              <h3>💡 使用提示</h3>
              <ul>
                <li><strong>OCR 识别</strong>：在对话框中粘贴图片（Ctrl+V），自动识别文字</li>
                <li><strong>翻译助手</strong>：即将支持多语言实时翻译</li>
                <li><strong>文本摘要</strong>：即将支持长文本智能总结</li>
                <li><strong>格式转换</strong>：即将支持多种格式互转</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>🎯 快捷键</h3>
              <ul>
                <li><kbd>Ctrl</kbd> + <kbd>V</kbd> - 粘贴图片进行 OCR</li>
                <li><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>H</kbd> - 唤出/隐藏窗口</li>
                <li><kbd>Enter</kbd> - 发送消息</li>
                <li><kbd>Shift</kbd> + <kbd>Enter</kbd> - 换行</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

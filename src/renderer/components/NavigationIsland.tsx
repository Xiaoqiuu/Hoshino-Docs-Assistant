import { useState } from 'react';
import './NavigationIsland.css';

export type NavigationMode = 'chat' | 'documents' | 'toolbox' | 'settings';

interface NavigationIslandProps {
  currentMode: NavigationMode;
  onModeChange: (mode: NavigationMode) => void;
  isMaximized?: boolean;
}

export function NavigationIsland({ currentMode, onModeChange, isMaximized = false }: NavigationIslandProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    {
      id: 'chat' as NavigationMode,
      icon: '💬',
      label: '快速对话',
      description: '与 AI 自由对话',
    },
    {
      id: 'documents' as NavigationMode,
      icon: '📚',
      label: '文档库',
      description: '基于文档问答',
    },
    {
      id: 'toolbox' as NavigationMode,
      icon: '🧰',
      label: '百宝箱',
      description: 'OCR 识别等工具',
    },
    {
      id: 'settings' as NavigationMode,
      icon: '⚙️',
      label: '设置',
      description: '配置与管理',
    },
  ];

  // 小窗口模式：只显示当前模式的图标
  if (!isMaximized) {
    const currentItem = navItems.find(item => item.id === currentMode) || navItems[0];
    
    return (
      <div 
        className="navigation-island compact"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="nav-icon-btn" title={currentItem.label}>
          <span className="nav-icon">{currentItem.icon}</span>
        </button>
        
        {isExpanded && (
          <div className="nav-dropdown">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-dropdown-item ${currentMode === item.id ? 'active' : ''} ${item.comingSoon ? 'coming-soon' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.comingSoon) {
                    onModeChange(item.id);
                    setIsExpanded(false);
                  }
                }}
                disabled={item.comingSoon}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.comingSoon && <span className="coming-soon-badge">即将</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 大窗口模式：显示完整导航
  return (
    <div 
      className={`navigation-island ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="nav-items">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentMode === item.id ? 'active' : ''} ${item.comingSoon ? 'coming-soon' : ''}`}
            onClick={() => !item.comingSoon && onModeChange(item.id)}
            title={item.comingSoon ? '即将推出' : item.label}
            disabled={item.comingSoon}
          >
            <span className="nav-icon">{item.icon}</span>
            <div className="nav-label-wrapper">
              <span className="nav-label">{item.label}</span>
              {item.comingSoon && <span className="coming-soon-badge">即将推出</span>}
              <span className="nav-description">{item.description}</span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="nav-indicator" style={{ 
        transform: `translateY(${navItems.findIndex(item => item.id === currentMode) * 100}%)` 
      }} />
    </div>
  );
}

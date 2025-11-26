import { useState, useEffect } from 'react';
import './Settings.css';
import './global.d.ts';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [localMode, setLocalMode] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com');
  const [modelName, setModelName] = useState('deepseek-chat');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('deepseek-r1:7b');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<any>(null);
  
  // Ollama 状态
  const [ollamaInstalled, setOllamaInstalled] = useState(false);
  const [ollamaRunning, setOllamaRunning] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [pullingModel, setPullingModel] = useState(false);
  
  // 新增配置项
  const [streamOutput, setStreamOutput] = useState(true);
  const [showReasoningContent, setShowReasoningContent] = useState(true);

  useEffect(() => {
    loadConfig();
    checkOllamaStatus();
  }, []);
  
  useEffect(() => {
    if (localMode) {
      checkOllamaStatus();
    }
  }, [localMode]);

  const loadConfig = async () => {
    try {
      const config = await window.electronAPI.getConfig();
      setLocalMode(config.localMode || false);
      setApiKey(config.apiKey || '');
      setBaseUrl(config.baseUrl || 'https://api.deepseek.com');
      setModelName(config.modelName || 'deepseek-chat');
      setOllamaUrl(config.ollamaUrl || 'http://localhost:11434');
      setOllamaModel(config.ollamaModel || 'deepseek-r1:7b');
      setStreamOutput(config.streamOutput !== undefined ? config.streamOutput : true);
      setShowReasoningContent(config.showReasoningContent !== undefined ? config.showReasoningContent : true);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };
  
  const checkOllamaStatus = async () => {
    setCheckingOllama(true);
    try {
      const installCheck = await window.electronAPI.ollamaCheckInstalled();
      setOllamaInstalled(installCheck.installed);
      
      if (installCheck.installed) {
        const status = await window.electronAPI.ollamaGetStatus();
        setOllamaRunning(status.running);
        
        if (status.running) {
          const modelsResult = await window.electronAPI.ollamaListModels();
          if (modelsResult.success) {
            setOllamaModels(modelsResult.models);
          }
        }
      }
    } catch (error) {
      console.error('检查 Ollama 状态失败:', error);
    } finally {
      setCheckingOllama(false);
    }
  };
  
  const handleStartOllama = async () => {
    setCheckingOllama(true);
    try {
      const result = await window.electronAPI.ollamaStartServer();
      if (result.success) {
        setOllamaRunning(true);
        await checkOllamaStatus();
      }
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || '启动失败' });
    } finally {
      setCheckingOllama(false);
    }
  };
  
  const handlePullModel = async () => {
    if (!ollamaModel.trim()) {
      setTestResult({ success: false, message: '请输入模型名称' });
      return;
    }
    
    setPullingModel(true);
    setTestResult({ success: true, message: `正在下载 ${ollamaModel}，请稍候...` });
    
    try {
      const result = await window.electronAPI.ollmaPullModel(ollamaModel);
      setTestResult(result);
      
      if (result.success) {
        await checkOllamaStatus();
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || '下载失败' });
    } finally {
      setPullingModel(false);
    }
  };

  const handleTest = async () => {
    if (!localMode && !apiKey.trim()) {
      setTestResult({ success: false, message: '请先输入 API Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      await window.electronAPI.setConfig({ 
        localMode, 
        apiKey, 
        baseUrl, 
        modelName,
        ollamaUrl,
        ollamaModel,
        streamOutput,
        showReasoningContent
      });
      const result = await window.electronAPI.testConnection();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || '测试失败' });
    } finally {
      setTesting(false);
    }
  };

  const handleCheckBalance = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: '请先输入 API Key' });
      return;
    }

    setCheckingBalance(true);
    setBalanceInfo(null);
    setTestResult(null);

    try {
      // 先保存配置
      await window.electronAPI.setConfig({ 
        localMode, 
        apiKey, 
        baseUrl, 
        modelName,
        ollamaUrl,
        ollamaModel,
        streamOutput,
        showReasoningContent
      });

      const result = await window.electronAPI.checkBalance();
      
      if (result.success && result.balance) {
        setBalanceInfo(result.balance);
        setTestResult({ success: true, message: '余额查询成功' });
      } else {
        setTestResult({ success: false, message: result.message || '查询失败' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || '查询失败' });
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.electronAPI.setConfig({ 
        localMode, 
        apiKey, 
        baseUrl, 
        modelName,
        ollamaUrl,
        ollamaModel,
        streamOutput,
        showReasoningContent
      });
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('保存配置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>⚙️ 设置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={localMode}
                onChange={(e) => setLocalMode(e.target.checked)}
                style={{ width: 'auto', marginRight: '8px' }}
              />
              使用本地模型（Ollama）
            </label>
            <small>启用后将使用本地 Ollama 服务，无需 API Key</small>
          </div>

          {!localMode ? (
            <>
              <div className="setting-group">
                <label>API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <small>DeepSeek API Key（在 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">platform.deepseek.com</a> 获取）</small>
              </div>

              <div className="setting-group">
                <label>Base URL</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.deepseek.com"
                />
                <small>API 端点地址（通常不需要修改）</small>
              </div>

              <div className="setting-group">
                <label>云端模型</label>
                <select value={modelName} onChange={(e) => setModelName(e.target.value)}>
                  <option value="deepseek-chat">deepseek-chat</option>
                  <option value="deepseek-reasoner">deepseek-reasoner（推理模型）</option>
                </select>
                <small>选择使用的云端 AI 模型</small>
              </div>
            </>
          ) : (
            <>
              <div className="setting-group">
                <label>Ollama 服务地址</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                />
                <small>Ollama 服务的 URL（默认：http://localhost:11434）</small>
              </div>

              <div className="setting-group">
                <label>本地模型</label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="deepseek-r1:7b"
                  list="ollama-models"
                />
                <datalist id="ollama-models">
                  <option value="deepseek-r1:7b" />
                  <option value="deepseek-r1:14b" />
                  <option value="deepseek-r1:32b" />
                  <option value="qwen2.5:7b" />
                  <option value="llama3.2:3b" />
                  <option value="mistral:7b" />
                </datalist>
                <small>输入已安装的模型名称（如：deepseek-r1:7b）</small>
              </div>

              <div className="ollama-status-box">
                <div className="status-row">
                  <span>Ollama 安装状态：</span>
                  <span className={ollamaInstalled ? 'status-ok' : 'status-error'}>
                    {checkingOllama ? '检查中...' : (ollamaInstalled ? '✅ 已安装' : '❌ 未安装')}
                  </span>
                </div>
                
                {ollamaInstalled && (
                  <>
                    <div className="status-row">
                      <span>服务状态：</span>
                      <span className={ollamaRunning ? 'status-ok' : 'status-warning'}>
                        {ollamaRunning ? '✅ 运行中' : '⚠️ 未运行'}
                      </span>
                    </div>
                    
                    {!ollamaRunning && (
                      <button 
                        className="action-btn"
                        onClick={handleStartOllama}
                        disabled={checkingOllama}
                      >
                        {checkingOllama ? '启动中...' : '启动 Ollama 服务'}
                      </button>
                    )}
                    
                    {ollamaRunning && (
                      <div className="status-row">
                        <span>已安装模型：</span>
                        <span className="model-count">
                          {ollamaModels.length} 个
                          {ollamaModels.length > 0 && (
                            <span className="model-list">
                              ({ollamaModels.slice(0, 3).join(', ')}
                              {ollamaModels.length > 3 && '...'})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    
                    {ollamaRunning && !ollamaModels.includes(ollamaModel) && (
                      <button 
                        className="action-btn download-btn"
                        onClick={handlePullModel}
                        disabled={pullingModel}
                      >
                        {pullingModel ? '下载中...' : `下载 ${ollamaModel}`}
                      </button>
                    )}
                  </>
                )}
                
                {!ollamaInstalled && (
                  <div className="info-box">
                    <strong>💡 安装 Ollama：</strong>
                    <ol>
                      <li>访问 <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">ollama.com</a> 下载安装</li>
                      <li>安装完成后重启本应用</li>
                      <li>应用会自动启动 Ollama 服务</li>
                    </ol>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 输出设置 */}
          <div className="setting-group">
            <h3 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '16px' }}>输出设置</h3>
            
            <label>
              <input
                type="checkbox"
                checked={streamOutput}
                onChange={(e) => setStreamOutput(e.target.checked)}
                style={{ width: 'auto', marginRight: '8px' }}
              />
              启用流式输出
            </label>
            <small>启用后，AI 回复将逐字显示（类似打字效果）</small>
          </div>

          {(modelName === 'deepseek-reasoner' || ollamaModel.includes('reasoner') || ollamaModel.includes('r1')) && (
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={showReasoningContent}
                  onChange={(e) => setShowReasoningContent(e.target.checked)}
                  style={{ width: 'auto', marginRight: '8px' }}
                />
                显示思维链内容
              </label>
              <small>推理模型（如 deepseek-reasoner、deepseek-r1）会展示思考过程</small>
            </div>
          )}

          <div className="setting-actions">
            <button 
              className="test-btn" 
              onClick={handleTest}
              disabled={testing || (!localMode && !apiKey.trim())}
            >
              {testing ? '测试中...' : '测试连接'}
            </button>
            
            {!localMode && (
              <button 
                className="test-btn balance-btn" 
                onClick={handleCheckBalance}
                disabled={checkingBalance || !apiKey.trim()}
              >
                {checkingBalance ? '查询中...' : '查询余额'}
              </button>
            )}
          </div>

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? '✅' : '❌'} {testResult.message}
            </div>
          )}

          {balanceInfo && (
            <div className="balance-info">
              <h4>💰 账户余额</h4>
              <div className="balance-status">
                <span>状态：</span>
                <span className={balanceInfo.is_available ? 'status-ok' : 'status-error'}>
                  {balanceInfo.is_available ? '✅ 可用' : '❌ 不可用'}
                </span>
              </div>
              {balanceInfo.balance_infos && balanceInfo.balance_infos.map((info: any, index: number) => (
                <div key={index} className="balance-detail">
                  <div className="balance-row">
                    <span>货币：</span>
                    <span className="balance-value">{info.currency}</span>
                  </div>
                  <div className="balance-row">
                    <span>总余额：</span>
                    <span className="balance-value">{info.total_balance}</span>
                  </div>
                  <div className="balance-row">
                    <span>赠金余额：</span>
                    <span className="balance-value">{info.granted_balance}</span>
                  </div>
                  <div className="balance-row">
                    <span>充值余额：</span>
                    <span className="balance-value">{info.topped_up_balance}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!localMode && (
            <div className="warning-box">
              <strong>⚠️ 安全提示：</strong>
              <ul>
                <li>API Key 将加密存储在本地</li>
                <li>使用文档模式时，选中的文本会发送到 DeepSeek 服务器</li>
                <li>请勿在敏感文档中使用</li>
              </ul>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={saving || (!localMode && !apiKey.trim())}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

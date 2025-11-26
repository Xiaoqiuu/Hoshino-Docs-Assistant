// OCR 多语言识别使用示例

import React, { useState } from 'react';

export const OCRExample: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');

  // 语言选项
  const languageOptions = [
    { value: 'auto', label: '自动检测（推荐）', langs: 'chi_sim+chi_tra+jpn+kor+eng' },
    { value: 'jpn', label: '日语', langs: 'jpn' },
    { value: 'jpn+eng', label: '日语+英语', langs: 'jpn+eng' },
    { value: 'chi_sim+jpn', label: '中文+日语', langs: 'chi_sim+jpn+eng' },
    { value: 'kor', label: '韩语', langs: 'kor' },
    { value: 'kor+eng', label: '韩语+英语', langs: 'kor+eng' },
    { value: 'chi_sim', label: '简体中文', langs: 'chi_sim' },
    { value: 'chi_tra', label: '繁体中文', langs: 'chi_tra' },
    { value: 'eng', label: '英语', langs: 'eng' },
  ];

  // 从剪贴板识别
  const handleRecognizeClipboard = async () => {
    setLoading(true);
    try {
      const option = languageOptions.find(opt => opt.value === selectedLanguage);
      const languages = option?.value === 'auto' ? undefined : option?.langs;
      
      const response = await window.electronAPI.ocrRecognizeClipboard(languages);
      
      if (response.success) {
        setResult(response.text);
        setConfidence(response.confidence);
      } else {
        setResult(`识别失败: ${response.error}`);
        setConfidence(0);
      }
    } catch (error: any) {
      setResult(`错误: ${error.message}`);
      setConfidence(0);
    } finally {
      setLoading(false);
    }
  };

  // 从文件识别
  const handleRecognizeFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // 读取文件为 Data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        
        const option = languageOptions.find(opt => opt.value === selectedLanguage);
        const languages = option?.value === 'auto' ? undefined : option?.langs;
        
        const response = await window.electronAPI.ocrRecognizeImage(imageDataUrl, languages);
        
        if (response.success) {
          setResult(response.text);
          setConfidence(response.confidence);
        } else {
          setResult(`识别失败: ${response.error}`);
          setConfidence(0);
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      setResult(`错误: ${error.message}`);
      setConfidence(0);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>OCR 文字识别</h2>
      
      {/* 语言选择 */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          识别语言：
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            {languageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          💡 提示：日语文本建议选择"日语"或"日语+英语"以提高准确度
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleRecognizeClipboard}
          disabled={loading}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          {loading ? '识别中...' : '识别剪贴板图片'}
        </button>
        
        <label style={{ 
          padding: '8px 16px', 
          backgroundColor: '#007bff', 
          color: 'white',
          cursor: 'pointer',
          borderRadius: '4px'
        }}>
          选择图片文件
          <input 
            type="file" 
            accept="image/*"
            onChange={handleRecognizeFile}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* 识别结果 */}
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>识别结果：</h3>
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            minHeight: '100px'
          }}>
            {result}
          </div>
          {confidence > 0 && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              置信度: {confidence.toFixed(2)}%
              {confidence < 70 && (
                <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>
                  ⚠️ 置信度较低，建议检查图片质量或尝试其他语言选项
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 使用提示 */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#e7f3ff',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <h4>使用技巧：</h4>
        <ul style={{ marginLeft: '20px' }}>
          <li>确保图片清晰，文字大小适中</li>
          <li>黑白对比清晰的文本识别效果最好</li>
          <li>首次使用某个语言时需要下载训练数据（约3-10MB）</li>
          <li>日语文本推荐使用"日语"或"日语+英语"选项</li>
          <li>混合语言文本可以使用"自动检测"</li>
        </ul>
      </div>
    </div>
  );
};

// 在 App.tsx 或 Toolbox.tsx 中集成的简化版本
export const OCRButton: React.FC = () => {
  const [language, setLanguage] = useState<string>('auto');

  const handleOCR = async () => {
    // 根据用户选择的语言进行识别
    const languageMap: Record<string, string | undefined> = {
      'auto': undefined, // 使用默认多语言
      'jpn': 'jpn+eng',
      'kor': 'kor+eng',
      'chi': 'chi_sim+eng',
    };

    const langs = languageMap[language];
    const result = await window.electronAPI.ocrRecognizeClipboard(langs);
    
    if (result.success) {
      // 将识别结果插入到输入框
      console.log('OCR识别成功:', result.text);
    } else {
      console.error('OCR识别失败:', result.error);
    }
  };

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="auto">自动</option>
        <option value="jpn">日语</option>
        <option value="kor">韩语</option>
        <option value="chi">中文</option>
      </select>
      <button onClick={handleOCR}>OCR识别</button>
    </div>
  );
};

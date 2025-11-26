import { createWorker, Worker } from 'tesseract.js';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 支持的语言列表
export type SupportedLanguage = 
  | 'chi_sim'      // 简体中文
  | 'chi_tra'      // 繁体中文
  | 'jpn'          // 日语
  | 'kor'          // 韩语
  | 'eng'          // 英语
  | 'fra'          // 法语
  | 'deu'          // 德语
  | 'spa'          // 西班牙语
  | 'rus'          // 俄语
  | 'ara';         // 阿拉伯语

export class OCRService {
  private worker: Worker | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;
  private currentLanguages: string = 'chi_sim+eng';

  constructor() {
    // 不在构造函数中初始化，延迟到首次使用
  }

  private async initialize(languages?: string): Promise<void> {
    const targetLanguages = languages || this.currentLanguages;
    
    // 如果已初始化且语言相同，直接返回
    if (this.isInitialized && this.currentLanguages === targetLanguages) {
      return;
    }
    
    // 如果语言不同，需要重新初始化
    if (this.isInitialized && this.currentLanguages !== targetLanguages) {
      await this.terminate();
    }
    
    // 如果正在初始化相同语言，等待完成
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        console.log(`初始化 OCR 服务 (语言: ${targetLanguages})...`);
        
        // 创建 worker
        this.worker = await createWorker(targetLanguages, 1, {
          // 使用应用数据目录存储训练数据
          cachePath: path.join(app.getPath('userData'), 'tesseract-cache'),
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`OCR 进度: ${Math.round(m.progress * 100)}%`);
            } else if (m.status === 'loading language traineddata') {
              console.log(`加载语言数据: ${m.progress}`);
            }
          },
        });

        this.currentLanguages = targetLanguages;
        this.isInitialized = true;
        console.log('OCR 服务初始化完成');
      } catch (error) {
        console.error('OCR 服务初始化失败:', error);
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  public async recognizeImage(
    imageData: string | Buffer,
    languages?: string | SupportedLanguage[]
  ): Promise<{
    success: boolean;
    text: string;
    confidence: number;
    error?: string;
  }> {
    try {
      // 处理语言参数
      let langString: string;
      if (Array.isArray(languages)) {
        langString = languages.join('+');
      } else if (languages) {
        langString = languages;
      } else {
        // 默认使用多语言组合以提高识别准确度
        langString = 'chi_sim+chi_tra+jpn+kor+eng';
      }

      // 确保 worker 已初始化
      await this.initialize(langString);

      if (!this.worker) {
        return {
          success: false,
          text: '',
          confidence: 0,
          error: 'OCR 服务未初始化',
        };
      }

      console.log(`开始 OCR 识别 (语言: ${langString})...`);
      const startTime = Date.now();

      // 执行 OCR 识别
      const { data } = await this.worker.recognize(imageData);
      
      const duration = Date.now() - startTime;
      console.log(`OCR 识别完成，耗时: ${duration}ms，置信度: ${data.confidence}%`);

      return {
        success: true,
        text: data.text.trim(),
        confidence: data.confidence,
      };
    } catch (error: any) {
      console.error('OCR 识别失败:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        error: error.message || '识别失败',
      };
    }
  }

  public async recognizeFromClipboard(
    imageBuffer: Buffer,
    languages?: string | SupportedLanguage[]
  ): Promise<{
    success: boolean;
    text: string;
    confidence: number;
    error?: string;
  }> {
    return this.recognizeImage(imageBuffer, languages);
  }

  public async recognizeFromFile(
    filePath: string,
    languages?: string | SupportedLanguage[]
  ): Promise<{
    success: boolean;
    text: string;
    confidence: number;
    error?: string;
  }> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          text: '',
          confidence: 0,
          error: '文件不存在',
        };
      }

      return this.recognizeImage(filePath, languages);
    } catch (error: any) {
      return {
        success: false,
        text: '',
        confidence: 0,
        error: error.message || '读取文件失败',
      };
    }
  }

  /**
   * 设置默认识别语言
   */
  public setDefaultLanguages(languages: string | SupportedLanguage[]): void {
    if (Array.isArray(languages)) {
      this.currentLanguages = languages.join('+');
    } else {
      this.currentLanguages = languages;
    }
  }

  /**
   * 获取当前使用的语言
   */
  public getCurrentLanguages(): string {
    return this.currentLanguages;
  }

  public async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
        this.initPromise = null;
        console.log('OCR 服务已终止');
      } catch (error) {
        console.error('终止 OCR 服务失败:', error);
      }
    }
  }

  public getStatus(): { initialized: boolean } {
    return {
      initialized: this.isInitialized,
    };
  }
}

export const ocrService = new OCRService();

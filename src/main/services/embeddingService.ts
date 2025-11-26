export class EmbeddingService {
  private model: any = null;
  private modelName: string = 'Xenova/all-MiniLM-L6-v2';
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;
  private transformers: any = null;

  constructor() {
    console.log('EmbeddingService 初始化');
  }

  /**
   * 动态导入 transformers（ES Module）
   */
  private async loadTransformers(): Promise<void> {
    if (this.transformers) {
      return;
    }

    try {
      // 使用 Function 构造器来避免 TypeScript 编译器转换 import()
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      this.transformers = await dynamicImport('@xenova/transformers');
      
      // 配置模型缓存路径
      this.transformers.env.cacheDir = './.cache';
      
      // 如果设置了镜像源，使用镜像源
      const huggingfaceMirror = process.env.HUGGINGFACE_MIRROR;
      if (huggingfaceMirror) {
        console.log(`使用 Hugging Face 镜像源: ${huggingfaceMirror}`);
        this.transformers.env.remoteHost = huggingfaceMirror;
      }
      
      // 配置代理（如果设置）
      const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
      if (httpProxy) {
        console.log(`使用代理: ${httpProxy}`);
        // transformers.js 会自动使用环境变量中的代理设置
      }
    } catch (error: any) {
      console.error('加载 transformers 失败:', error);
      throw new Error(`加载 transformers 失败: ${error.message}`);
    }
  }

  /**
   * 加载嵌入模型（懒加载，带重试机制）
   */
  private async loadModel(): Promise<void> {
    if (this.model) {
      return;
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = (async () => {
      const maxRetries = 3;
      let lastError: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`开始加载嵌入模型: ${this.modelName} (尝试 ${attempt}/${maxRetries})`);
          if (attempt === 1) {
            console.log('首次加载需要下载模型（约 80MB），请耐心等待...');
            console.log('如果网络不稳定，系统会自动重试...');
          }
          
          // 先加载 transformers
          await this.loadTransformers();
          
          // 设置更长的超时时间
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('模型加载超时')), 120000); // 2分钟超时
          });
          
          // 使用 pipeline 创建模型
          const modelPromise = this.transformers.pipeline('feature-extraction', this.modelName, {
            // 添加进度回调
            progress_callback: (progress: any) => {
              if (progress.status === 'progress') {
                console.log(`下载进度: ${progress.file} - ${Math.round(progress.progress || 0)}%`);
              }
            }
          });
          
          this.model = await Promise.race([modelPromise, timeoutPromise]);
          
          console.log('嵌入模型加载完成');
          this.isLoading = false;
          return;
        } catch (error: any) {
          lastError = error;
          console.error(`嵌入模型加载失败 (尝试 ${attempt}/${maxRetries}):`, error.message);
          
          if (attempt < maxRetries) {
            const waitTime = attempt * 2000; // 递增等待时间
            console.log(`等待 ${waitTime/1000} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      // 所有重试都失败
      this.isLoading = false;
      console.error('嵌入模型加载失败，已达到最大重试次数');
      console.error('建议：1) 检查网络连接 2) 使用代理或VPN 3) 手动下载模型');
      throw new Error(`嵌入模型加载失败: ${lastError?.message || '未知错误'}`);
    })();

    return this.loadPromise;
  }

  /**
   * 将文本转换为向量
   */
  async embed(text: string): Promise<number[]> {
    await this.loadModel();

    try {
      // 清理和截断文本
      const cleanText = this.cleanText(text);
      const truncatedText = this.truncateText(cleanText, 512);

      // 生成嵌入向量
      const output = await this.model(truncatedText, {
        pooling: 'mean',
        normalize: true,
      });

      // 转换为普通数组
      const embedding = Array.from(output.data) as number[];
      
      return embedding;
    } catch (error: any) {
      console.error('文本向量化失败:', error);
      throw new Error(`文本向量化失败: ${error.message}`);
    }
  }

  /**
   * 批量向量化
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    await this.loadModel();

    const embeddings: number[][] = [];
    
    for (const text of texts) {
      try {
        const embedding = await this.embed(text);
        embeddings.push(embedding);
      } catch (error) {
        console.error('批量向量化失败，跳过该文本:', error);
        // 使用零向量作为占位符
        embeddings.push(new Array(384).fill(0));
      }
    }

    return embeddings;
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 多个空白字符替换为单个空格
      .replace(/\n+/g, ' ') // 换行符替换为空格
      .trim();
  }

  /**
   * 截断文本（模型最大支持 512 tokens）
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength);
  }

  /**
   * 检查模型是否已加载
   */
  isModelLoaded(): boolean {
    return this.model !== null;
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): { name: string; loaded: boolean; loading: boolean } {
    return {
      name: this.modelName,
      loaded: this.model !== null,
      loading: this.isLoading,
    };
  }
}

export const embeddingService = new EmbeddingService();

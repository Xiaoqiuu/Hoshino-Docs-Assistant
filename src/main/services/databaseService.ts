import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface Session {
  id: number;
  title: string;
  created_at: number;
  updated_at: number;
  is_active: number;
}

export interface Message {
  id?: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: string;
  created_at: number;
}

interface DatabaseData {
  sessions: Session[];
  messages: Message[];
  nextSessionId: number;
  nextMessageId: number;
}

export class DatabaseService {
  private dbPath: string;
  private data: DatabaseData;

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'hoshino-data.json');
    this.data = this.loadData();
    console.log('数据库初始化完成:', this.dbPath);
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }

    return {
      sessions: [],
      messages: [],
      nextSessionId: 1,
      nextMessageId: 1
    };
  }

  private saveData(): void {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  // 会话管理
  createSession(title: string = '新对话'): number {
    const now = Date.now();
    
    // 将所有会话设为非活动
    this.data.sessions.forEach(s => s.is_active = 0);
    
    const session: Session = {
      id: this.data.nextSessionId++,
      title,
      created_at: now,
      updated_at: now,
      is_active: 1
    };

    this.data.sessions.push(session);
    this.saveData();

    return session.id;
  }

  getSession(id: number): Session | null {
    return this.data.sessions.find(s => s.id === id) || null;
  }

  getAllSessions(): Session[] {
    return [...this.data.sessions].sort((a, b) => b.updated_at - a.updated_at);
  }

  getActiveSession(): Session | null {
    return this.data.sessions.find(s => s.is_active === 1) || null;
  }

  updateSession(id: number, data: Partial<Session>): void {
    const session = this.data.sessions.find(s => s.id === id);
    if (session) {
      if (data.title !== undefined) {
        session.title = data.title;
      }
      session.updated_at = Date.now();
      this.saveData();
    }
  }

  setActiveSession(id: number): void {
    this.data.sessions.forEach(s => s.is_active = 0);
    const session = this.data.sessions.find(s => s.id === id);
    if (session) {
      session.is_active = 1;
      this.saveData();
    }
  }

  deleteSession(id: number): void {
    this.data.sessions = this.data.sessions.filter(s => s.id !== id);
    this.data.messages = this.data.messages.filter(m => m.session_id !== id);
    this.saveData();
  }

  // 消息管理
  addMessage(message: Message): number {
    const msg: Message = {
      ...message,
      id: this.data.nextMessageId++
    };

    this.data.messages.push(msg);
    
    // 更新会话的 updated_at
    this.updateSession(message.session_id, {});

    this.saveData();
    return msg.id!;
  }

  getMessages(sessionId: number): Message[] {
    return this.data.messages
      .filter(m => m.session_id === sessionId)
      .sort((a, b) => a.created_at - b.created_at);
  }

  deleteMessages(sessionId: number): void {
    this.data.messages = this.data.messages.filter(m => m.session_id !== sessionId);
    this.saveData();
  }

  getMessageCount(sessionId: number): number {
    return this.data.messages.filter(m => m.session_id === sessionId).length;
  }

  // 清理旧会话（保留最近100个）
  cleanOldSessions(): void {
    const sorted = [...this.data.sessions].sort((a, b) => b.updated_at - a.updated_at);
    const toKeep = sorted.slice(0, 100);
    const toKeepIds = new Set(toKeep.map(s => s.id));
    
    this.data.sessions = this.data.sessions.filter(s => toKeepIds.has(s.id));
    this.data.messages = this.data.messages.filter(m => toKeepIds.has(m.session_id));
    
    this.saveData();
  }

  close(): void {
    this.saveData();
  }
}

export const databaseService = new DatabaseService();

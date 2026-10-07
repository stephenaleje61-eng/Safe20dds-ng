import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  phone: string; // E.164 or normalized (e.g., +2348012345678)
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  isVip: boolean;
  vipTier?: string; // 'Weekly VIP' | '₦2,000 Monthly VIP' | '₦5,000 Monthly Premium'
  vipExpiresAt?: string | null;
  bio?: string;
  avatarUrl?: string;
  securityQuestion?: string;
  securityAnswerHash?: string;
  blockedUserIds: string[];
  friendIds: string[];
  friendRequestsReceived: string[]; // user IDs
  friendRequestsSent: string[]; // user IDs
  createdAt: string;
  isBanned?: boolean;
}

export interface Prediction {
  id: string;
  sport: string; // e.g. 'Football'
  competition: string; // e.g. 'Premier League', 'UEFA Champions League'
  homeTeam: string;
  awayTeam: string;
  matchTime: string; // ISO string
  category: string; // 'Over 2.5 Goals' | 'Both Teams To Score' | 'Home Win (1)' | 'Away Win (2)' | 'Double Chance 1X' | 'Asian Handicap -1' | etc.
  confidence: number; // 75 - 95
  oddsIndicator: string; // analytical reference odd e.g. '1.85'
  adminAnalysis: string; // Tactical summary
  imageUrl?: string;
  isVipOnly: boolean;
  isPinned: boolean;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'REFUND';
  finalScore?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoneMasked: string;
  authorIsVip: boolean;
  content: string;
  imageUrl?: string;
  likes: string[]; // user IDs
  reportsCount: number;
  reportReasons: { userId: string; reason: string; createdAt: string }[];
  isPinned?: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorIsVip: boolean;
  content: string;
  likes: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string; // 'general' | 'epl' | 'ucl' | 'direct_{userId1}_{userId2}'
  senderId: string;
  senderName: string;
  senderIsVip: boolean;
  senderIsAdmin: boolean;
  text: string;
  sharedPredictionId?: string;
  imageUrl?: string;
  reportsCount: number;
  createdAt: string;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  tier: string;
  amountNgn: number;
  paymentReference: string;
  status: 'active' | 'expired';
  startedAt: string;
  expiresAt: string;
}

export interface DatabaseSchema {
  users: User[];
  predictions: Prediction[];
  posts: Post[];
  comments: Comment[];
  chatMessages: ChatMessage[];
  subscriptions: SubscriptionRecord[];
  meta: {
    lastBackup: string;
    version: number;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sureodd_database.json');
const BACKUP_FILE = path.join(DATA_DIR, 'sureodd_database.backup.json');

class PersistentDatabase {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
    // Periodic disk backup every 5 minutes
    setInterval(() => this.backup(), 5 * 60 * 1000);
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.predictions) {
          return parsed;
        }
      } catch (err) {
        console.error('Error loading database file, checking backup...', err);
        if (fs.existsSync(BACKUP_FILE)) {
          try {
            const rawBackup = fs.readFileSync(BACKUP_FILE, 'utf-8');
            return JSON.parse(rawBackup);
          } catch (bErr) {
            console.error('Error loading backup file:', bErr);
          }
        }
      }
    }

    // Default Seed Data
    const defaultData = this.getSeedData();
    this.saveSync(defaultData);
    return defaultData;
  }

  private getSeedData(): DatabaseSchema {
    const now = new Date();
    const isoNow = now.toISOString();

    const futureTime = (hoursAhead: number) => {
      const d = new Date(now.getTime() + hoursAhead * 3600 * 1000);
      return d.toISOString();
    };

    const pastTime = (hoursAgo: number) => {
      const d = new Date(now.getTime() - hoursAgo * 3600 * 1000);
      return d.toISOString();
    };

    return {
      users: [
        {
          id: 'usr_admin_01',
          phone: '+2348000000000',
          username: 'SureOdd_Official',
          // bcrypt hash for "admin123"
          passwordHash: '$2b$10$nYRFtLN5bVaf56XN4LunsOAVV5kwtBW8FpoRcQ7MHnFCqWGB1wdOy',
          role: 'admin',
          isVip: true,
          vipTier: '₦5,000 Monthly Premium',
          vipExpiresAt: new Date(now.getTime() + 365 * 24 * 3600 * 1000).toISOString(),
          bio: 'Head of Sports Analytics & Match Modeling at Sure Odd.',
          securityQuestion: "What is your team's home city?",
          securityAnswerHash: '$2b$10$nYRFtLN5bVaf56XN4LunsOAVV5kwtBW8FpoRcQ7MHnFCqWGB1wdOy',
          blockedUserIds: [],
          friendIds: ['usr_member_01'],
          friendRequestsReceived: [],
          friendRequestsSent: [],
          createdAt: pastTime(240),
          isBanned: false,
        },
        {
          id: 'usr_member_01',
          phone: '+2348123456789',
          username: 'Emeka_Sporty',
          // bcrypt hash for "user1234"
          passwordHash: '$2b$10$r/w.g.iB6vJoKAIwtq.YoOBAZpSW2L3Auxzm29J38c1ls8JbjqTvC',
          role: 'user',
          isVip: true,
          vipTier: '₦2,000 Monthly VIP',
          vipExpiresAt: futureTime(24 * 20),
          bio: 'Passionate football fan. Analytical minds only.',
          blockedUserIds: [],
          friendIds: ['usr_admin_01'],
          friendRequestsReceived: [],
          friendRequestsSent: [],
          createdAt: pastTime(120),
          isBanned: false,
        },
      ],
      predictions: [
        {
          id: 'pred_001',
          sport: 'Football',
          competition: 'UEFA Champions League',
          homeTeam: 'Real Madrid',
          awayTeam: 'Manchester City',
          matchTime: futureTime(6),
          category: 'Both Teams To Score & Over 2.5',
          confidence: 88,
          oddsIndicator: '1.92',
          adminAnalysis:
            'Both teams possess world-class attacking powerhouses with exceptional xG metrics over their last 10 fixtures. Madrid average 2.4 goals per match at the Bernabéu, while City have scored in 18 consecutive European away matches. Defensive rotations point toward an open, high-intensity encounter.',
          imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
          isVipOnly: false,
          isPinned: true,
          status: 'PENDING',
          createdBy: 'usr_admin_01',
          createdAt: pastTime(4),
          updatedAt: pastTime(4),
        },
        {
          id: 'pred_002',
          sport: 'Football',
          competition: 'English Premier League',
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          matchTime: futureTime(24),
          category: 'Home Win (1)',
          confidence: 85,
          oddsIndicator: '1.68',
          adminAnalysis:
            'Arsenal boast the best defensive record at home in the Premier League this season, conceding only 0.75 goals per game. Their high press and set-piece superiority match up strongly against Chelsea transition defense vulnerabilities.',
          isVipOnly: false,
          isPinned: false,
          status: 'PENDING',
          createdBy: 'usr_admin_01',
          createdAt: pastTime(10),
          updatedAt: pastTime(10),
        },
        {
          id: 'pred_003',
          sport: 'Football',
          competition: 'Spanish La Liga',
          homeTeam: 'Barcelona',
          awayTeam: 'Atletico Madrid',
          matchTime: futureTime(28),
          category: 'Over 2.5 Goals',
          confidence: 82,
          oddsIndicator: '1.80',
          adminAnalysis:
            'Historical clashes between these two giants have averaged 3.2 total goals over the last 4 encounters. Barcelona attacking fluid structure creates numerous half-space chances.',
          isVipOnly: true,
          isPinned: false,
          status: 'PENDING',
          createdBy: 'usr_admin_01',
          createdAt: pastTime(14),
          updatedAt: pastTime(14),
        },
        {
          id: 'pred_004',
          sport: 'Football',
          competition: 'Italian Serie A',
          homeTeam: 'Inter Milan',
          awayTeam: 'AC Milan',
          matchTime: pastTime(18),
          category: 'Double Chance (1X) & Under 3.5',
          confidence: 91,
          oddsIndicator: '1.75',
          adminAnalysis:
            'Derby della Madonnina tactical preview: Inter structured 3-5-2 provides solid midfield control. Past fixture delivered exact 1-1 outcome with limited high-risk errors.',
          isVipOnly: false,
          isPinned: false,
          status: 'WON',
          finalScore: '2 - 1',
          createdBy: 'usr_admin_01',
          createdAt: pastTime(36),
          updatedAt: pastTime(16),
        },
        {
          id: 'pred_005',
          sport: 'Football',
          competition: 'German Bundesliga',
          homeTeam: 'Bayern Munich',
          awayTeam: 'Borussia Dortmund',
          matchTime: pastTime(42),
          category: 'Over 3.5 Goals',
          confidence: 84,
          oddsIndicator: '2.05',
          adminAnalysis:
            'Der Klassiker typically features high-scoring transitions with average 4.2 goals per match in recent years.',
          isVipOnly: true,
          isPinned: false,
          status: 'WON',
          finalScore: '3 - 2',
          createdBy: 'usr_admin_01',
          createdAt: pastTime(50),
          updatedAt: pastTime(40),
        },
      ],
      posts: [
        {
          id: 'post_001',
          authorId: 'usr_admin_01',
          authorName: 'SureOdd_Official',
          authorPhoneMasked: '+234 800 *** 000',
          authorIsVip: true,
          content:
            'Welcome to Sure Odd! Reminder: All match models, statistics, and tactical breakdowns here are free-to-play analytical educational content. We promote smart statistical appreciation without gambling risk. Check our UCL breakdown tonight!',
          likes: ['usr_member_01'],
          reportsCount: 0,
          reportReasons: [],
          isPinned: true,
          createdAt: pastTime(24),
        },
        {
          id: 'post_002',
          authorId: 'usr_member_01',
          authorName: 'Emeka_Sporty',
          authorPhoneMasked: '+234 812 *** 789',
          authorIsVip: true,
          content:
            'Really impressive breakdown on the Real Madrid vs Man City tie. City high line against Vinicius Jr and Mbappe pace is going to be the deciding tactical battle. What are your thoughts on corners?',
          likes: ['usr_admin_01'],
          reportsCount: 0,
          reportReasons: [],
          isPinned: false,
          createdAt: pastTime(8),
        },
      ],
      comments: [
        {
          id: 'comm_001',
          postId: 'post_002',
          authorId: 'usr_admin_01',
          authorName: 'SureOdd_Official',
          authorIsVip: true,
          content:
            'Spot on Emeka! City will likely control possession, meaning 6+ corners for City and quick vertical counters for Madrid.',
          likes: ['usr_member_01'],
          createdAt: pastTime(6),
        },
      ],
      chatMessages: [
        {
          id: 'msg_001',
          channelId: 'general',
          senderId: 'usr_admin_01',
          senderName: 'SureOdd_Official',
          senderIsVip: true,
          senderIsAdmin: true,
          text: 'Welcome everyone to the Sure Odd live match analysis lounge! Feel free to share tactical discussions and insights.',
          reportsCount: 0,
          createdAt: pastTime(12),
        },
        {
          id: 'msg_002',
          channelId: 'general',
          senderId: 'usr_member_01',
          senderName: 'Emeka_Sporty',
          senderIsVip: true,
          senderIsAdmin: false,
          text: 'The analysis on Inter vs Milan was spot on yesterday! Looking forward to today’s Champions League game.',
          reportsCount: 0,
          createdAt: pastTime(2),
        },
      ],
      subscriptions: [
        {
          id: 'sub_001',
          userId: 'usr_member_01',
          tier: '₦2,000 Monthly VIP',
          amountNgn: 2000,
          paymentReference: 'SURE_ODD_REF_88194',
          status: 'active',
          startedAt: pastTime(240),
          expiresAt: futureTime(24 * 20),
        },
      ],
      meta: {
        lastBackup: isoNow,
        version: 1,
      },
    };
  }

  // Atomic disk save with temporary file write + rename
  public saveSync(schema?: DatabaseSchema) {
    if (schema) {
      this.data = schema;
    }
    this.ensureDirectory();
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    const json = JSON.stringify(this.data, null, 2);
    try {
      fs.writeFileSync(tempFile, json, 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to atomically write DB:', err);
    }
  }

  // Debounced save
  public scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
      this.saveTimeout = null;
    }, 200);
  }

  public backup() {
    try {
      this.ensureDirectory();
      this.data.meta.lastBackup = new Date().toISOString();
      const json = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(BACKUP_FILE, json, 'utf-8');
    } catch (err) {
      console.error('Failed to create DB backup:', err);
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // User queries
  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByPhone(phone: string): User | undefined {
    // Normalize phone string (remove spaces, hyphens)
    const normalized = phone.replace(/[\s\-()]/g, '');
    return this.data.users.find((u) => u.phone.replace(/[\s\-()]/g, '') === normalized);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.scheduleSave();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.scheduleSave();
    return this.data.users[idx];
  }

  public getAllUsers(): User[] {
    return [...this.data.users];
  }

  // Prediction queries
  public getPredictions(): Prediction[] {
    // Sort pinned first, then by matchTime ascending
    return [...this.data.predictions].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public findPredictionById(id: string): Prediction | undefined {
    return this.data.predictions.find((p) => p.id === id);
  }

  public createPrediction(pred: Prediction): Prediction {
    this.data.predictions.unshift(pred);
    this.scheduleSave();
    return pred;
  }

  public updatePrediction(id: string, updates: Partial<Prediction>): Prediction | null {
    const idx = this.data.predictions.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.predictions[idx] = { ...this.data.predictions[idx], ...updates, updatedAt: new Date().toISOString() };
    this.scheduleSave();
    return this.data.predictions[idx];
  }

  public deletePrediction(id: string): boolean {
    const prevLen = this.data.predictions.length;
    this.data.predictions = this.data.predictions.filter((p) => p.id !== id);
    if (this.data.predictions.length !== prevLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // Social Posts
  public getPosts(limit = 50, offset = 0): { posts: Post[]; total: number } {
    const sorted = [...this.data.posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return {
      posts: sorted.slice(offset, offset + limit),
      total: sorted.length,
    };
  }

  public findPostById(id: string): Post | undefined {
    return this.data.posts.find((p) => p.id === id);
  }

  public createPost(post: Post): Post {
    this.data.posts.unshift(post);
    this.scheduleSave();
    return post;
  }

  public deletePost(id: string): boolean {
    const prevLen = this.data.posts.length;
    this.data.posts = this.data.posts.filter((p) => p.id !== id);
    // Also remove comments
    this.data.comments = this.data.comments.filter((c) => c.postId !== id);
    if (this.data.posts.length !== prevLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  public updatePost(id: string, updates: Partial<Post>): Post | null {
    const idx = this.data.posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.posts[idx] = { ...this.data.posts[idx], ...updates };
    this.scheduleSave();
    return this.data.posts[idx];
  }

  // Comments
  public getComments(postId: string): Comment[] {
    return this.data.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public createComment(comment: Comment): Comment {
    this.data.comments.push(comment);
    this.scheduleSave();
    return comment;
  }

  public deleteComment(id: string): boolean {
    const prevLen = this.data.comments.length;
    this.data.comments = this.data.comments.filter((c) => c.id !== id);
    if (this.data.comments.length !== prevLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // Chat
  public getChatMessages(channelId: string, limit = 50, beforeTimestamp?: string): ChatMessage[] {
    let filtered = this.data.chatMessages.filter((m) => m.channelId === channelId);
    if (beforeTimestamp) {
      filtered = filtered.filter((m) => new Date(m.createdAt).getTime() < new Date(beforeTimestamp).getTime());
    }
    // Sort chronological
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return filtered.slice(-limit);
  }

  public createChatMessage(msg: ChatMessage): ChatMessage {
    this.data.chatMessages.push(msg);
    this.scheduleSave();
    return msg;
  }

  public deleteChatMessage(id: string): boolean {
    const prevLen = this.data.chatMessages.length;
    this.data.chatMessages = this.data.chatMessages.filter((m) => m.id !== id);
    if (this.data.chatMessages.length !== prevLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // Subscriptions
  public createSubscription(sub: SubscriptionRecord): SubscriptionRecord {
    this.data.subscriptions.unshift(sub);
    this.scheduleSave();
    return sub;
  }

  public getSubscriptionsByUser(userId: string): SubscriptionRecord[] {
    return this.data.subscriptions.filter((s) => s.userId === userId);
  }

  public getAllSubscriptions(): SubscriptionRecord[] {
    return [...this.data.subscriptions];
  }
}

export const db = new PersistentDatabase();

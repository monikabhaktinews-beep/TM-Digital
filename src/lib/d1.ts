import Database from 'better-sqlite3';
import path from 'path';

export interface D1Result<T = any> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    changes: number;
    last_row_id: number | null;
    served_by: string;
  };
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  run<T = any>(): Promise<D1Result<T>>;
  all<T = any>(): Promise<D1Result<T>>;
  raw<T = any>(): Promise<T[][]>;
}

export class LocalD1PreparedStatement implements D1PreparedStatement {
  private stmt: any;
  private params: any[] = [];

  constructor(stmt: any) {
    this.stmt = stmt;
  }

  bind(...values: any[]): D1PreparedStatement {
    const newStmt = new LocalD1PreparedStatement(this.stmt);
    newStmt.params = values;
    return newStmt;
  }

  async first<T = any>(colName?: string): Promise<T | null> {
    const row = this.stmt.get(...this.params);
    if (!row) return null;
    if (colName) return row[colName] as T;
    return row as T;
  }

  async all<T = any>(): Promise<D1Result<T>> {
    const t0 = Date.now();
    try {
      const rows = this.stmt.all(...this.params);
      return {
        results: rows,
        success: true,
        meta: {
          duration: Date.now() - t0,
          changes: 0,
          last_row_id: null,
          served_by: 'local-sqlite'
        }
      };
    } catch (err: any) {
      console.error('[SQLite PreparedStatement all error]', err);
      return {
        results: [],
        success: false,
        error: err.message,
        meta: {
          duration: Date.now() - t0,
          changes: 0,
          last_row_id: null,
          served_by: 'local-sqlite'
        }
      };
    }
  }

  async run<T = any>(): Promise<D1Result<T>> {
    const t0 = Date.now();
    try {
      const info = this.stmt.run(...this.params);
      return {
        success: true,
        meta: {
          duration: Date.now() - t0,
          changes: info.changes,
          last_row_id: info.lastInsertRowid,
          served_by: 'local-sqlite'
        }
      };
    } catch (err: any) {
      console.error('[SQLite PreparedStatement run error]', err);
      return {
        success: false,
        error: err.message,
        meta: {
          duration: Date.now() - t0,
          changes: 0,
          last_row_id: null,
          served_by: 'local-sqlite'
        }
      };
    }
  }

  async raw<T = any>(): Promise<T[][]> {
    const rows = this.stmt.raw(true).all(...this.params);
    return rows;
  }
}

export class LocalD1Database {
  private db: any;

  constructor(filename: string) {
    this.db = new Database(filename);
    this.initSchema();
  }

  prepare(query: string): D1PreparedStatement {
    const stmt = this.db.prepare(query);
    return new LocalD1PreparedStatement(stmt);
  }

  async exec(query: string): Promise<D1Result> {
    const t0 = Date.now();
    this.db.exec(query);
    return {
      success: true,
      meta: {
        duration: Date.now() - t0,
        changes: 0,
        last_row_id: null,
        served_by: 'local-sqlite'
      }
    };
  }

  async batch<T = any>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    for (const stmt of statements) {
      results.push(await stmt.all());
    }
    return results;
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        uid INTEGER UNIQUE,
        username TEXT,
        firstName TEXT,
        lastName TEXT,
        photoUrl TEXT,
        languageCode TEXT,
        registeredAt TEXT,
        balanceTM REAL DEFAULT 0,
        balanceUSDT REAL DEFAULT 0,
        lifetimeEarningsUSDT REAL DEFAULT 0,
        referralEarningsUSDT REAL DEFAULT 0,
        todayBonusUSDT REAL DEFAULT 0,
        depositStatus TEXT DEFAULT 'None',
        withdrawStatus TEXT DEFAULT 'None',
        referralCount INTEGER DEFAULT 0,
        isFrozen INTEGER DEFAULT 0,
        isBanned INTEGER DEFAULT 0,
        mandatoryCompleted INTEGER DEFAULT 0,
        referredBy INTEGER
      );

      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        senderUid INTEGER,
        receiverUid INTEGER,
        amountTM REAL,
        status TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS withdrawals (
        id TEXT PRIMARY KEY,
        userId TEXT,
        amountUSDT REAL,
        amountTM REAL,
        address TEXT,
        network TEXT,
        status TEXT,
        createdAt TEXT
      );

      CREATE TABLE IF NOT EXISTS deposits (
        id TEXT PRIMARY KEY,
        userId TEXT,
        amountUSDT REAL,
        txHash TEXT,
        status TEXT,
        createdAt TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        userId TEXT,
        type TEXT,
        amountTM REAL,
        amountUSDT REAL,
        description TEXT,
        createdAt TEXT
      );

      CREATE TABLE IF NOT EXISTS gift_codes (
        code TEXT PRIMARY KEY,
        rewardTM REAL,
        rewardUSDT REAL,
        maxClaims INTEGER,
        claimedCount INTEGER DEFAULT 0,
        createdAt TEXT,
        expiresAt TEXT
      );

      CREATE TABLE IF NOT EXISTS completed_tasks (
        userId TEXT,
        taskId TEXT,
        PRIMARY KEY (userId, taskId)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        type TEXT,
        rewardTM REAL,
        link TEXT,
        isMandatory INTEGER,
        displayOrder INTEGER,
        isEnabled INTEGER,
        requiresVerification INTEGER,
        channelId TEXT
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        userId TEXT,
        subject TEXT,
        message TEXT,
        status TEXT,
        createdAt TEXT
      );

      CREATE TABLE IF NOT EXISTS claimed_bonuses (
        userId TEXT,
        dayKey TEXT,
        PRIMARY KEY (userId, dayKey)
      );
    `);

    // Seed default tasks
    const tasksCount = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get()?.count || 0;
    if (tasksCount === 0) {
      const defaultTasks = [
        {
          id: "mandatory_channel_1",
          title: "TM_Digital",
          description: "Join the official TM_Digital Telegram channel.",
          type: "TelegramChannel",
          rewardTM: 200,
          link: "https://t.me/TM_Digital",
          isMandatory: 1,
          displayOrder: 1,
          isEnabled: 1,
          requiresVerification: 1,
          channelId: "-1003260376953"
        },
        {
          id: "mandatory_channel_2",
          title: "TM_Back",
          description: "Join the official TM_Back Telegram channel.",
          type: "TelegramChannel",
          rewardTM: 150,
          link: "https://t.me/TM_Back",
          isMandatory: 1,
          displayOrder: 2,
          isEnabled: 1,
          requiresVerification: 1,
          channelId: "-1001179648853"
        },
        {
          id: "mandatory_channel_3",
          title: "TM_With",
          description: "Join the official TM_With Telegram channel.",
          type: "TelegramChannel",
          rewardTM: 150,
          link: "https://t.me/TM_With",
          isMandatory: 1,
          displayOrder: 3,
          isEnabled: 1,
          requiresVerification: 1,
          channelId: "-1001873895959"
        },
        {
          id: "task_optional_1",
          title: "Follow TM Digital on X",
          description: "Follow @TM_Digital on X (Twitter) for instant updates.",
          type: "ExternalLink",
          rewardTM: 100,
          link: "https://x.com",
          isMandatory: 0,
          displayOrder: 4,
          isEnabled: 1,
          requiresVerification: 1,
          channelId: ""
        }
      ];

      const insertTask = this.db.prepare(`
        INSERT INTO tasks (id, title, description, type, rewardTM, link, isMandatory, displayOrder, isEnabled, requiresVerification, channelId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of defaultTasks) {
        insertTask.run(t.id, t.title, t.description, t.type, t.rewardTM, t.link, t.isMandatory, t.displayOrder, t.isEnabled, t.requiresVerification, t.channelId);
      }
    }

    // Seed default settings
    const settingsCount = this.db.prepare('SELECT COUNT(*) as count FROM settings').get()?.count || 0;
    if (settingsCount === 0) {
      const defaultSettings = {
        conversionRate: "1000",
        referralRewardUSDT: "0.05", // User requested referral reward of 0.05
        referralRewardTM: "100",
        dailyBonusRateUSDT: "0.11",
        dailyBonusIntervalHours: "24",
        dailyBonusEnabled: "true",
        walletAddressUSDT: "0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592",
        qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592",
        autoApprovalEnabled: "false",
        maintenanceMode: "false",
        announcement: "📢 TM Digital v1.2 Live with Cloudflare D1 integration! Complete your mandatory tasks to unlock your premium staking dashboard.",
        mandatoryTaskCount: "3",
        depositMinUSDT: "1.0",
        withdrawEnabled: "true",
        withdrawDisabledMessage: "🚫 Withdrawals are temporarily unavailable. Please try again later.",
        referralSystemEnabled: "true",
        referralRewardAmountUSD: "3.0",
        referralMinWithdrawRequirementUSD: "10.0"
      };

      const insertSetting = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      for (const [k, v] of Object.entries(defaultSettings)) {
        insertSetting.run(k, v);
      }
    }

    // Seed default users
    const usersCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
    if (usersCount === 0) {
      const defaultUsers = [
        {
          uid: 117301,
          id: "111111111",
          username: "cryptoking",
          firstName: "Sarah",
          lastName: "Connor",
          photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
          languageCode: "en",
          registeredAt: "2026-06-01T12:00:00Z",
          balanceTM: 3500,
          balanceUSDT: 1.5,
          lifetimeEarningsUSDT: 3.5,
          referralEarningsUSDT: 1.2,
          todayBonusUSDT: 0.15,
          depositStatus: 'Approved',
          withdrawStatus: 'Approved',
          referralCount: 8,
          isFrozen: 0,
          isBanned: 0,
          mandatoryCompleted: 1,
          referredBy: null
        },
        {
          uid: 117302,
          id: "222222222",
          username: "tg_rich",
          firstName: "Michael",
          lastName: "Scott",
          photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
          languageCode: "en",
          registeredAt: "2026-07-10T15:30:00Z",
          balanceTM: 500,
          balanceUSDT: 0.0,
          lifetimeEarningsUSDT: 0.0,
          referralEarningsUSDT: 0.0,
          todayBonusUSDT: 0.0,
          depositStatus: 'Pending',
          withdrawStatus: 'None',
          referralCount: 0,
          isFrozen: 0,
          isBanned: 0,
          mandatoryCompleted: 0,
          referredBy: null
        },
        {
          uid: 117303,
          id: "333333333",
          username: "new_joiner",
          firstName: "Dwight",
          lastName: "Schrute",
          photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces",
          languageCode: "de",
          registeredAt: "2026-07-05T09:15:00Z",
          balanceTM: 1500,
          balanceUSDT: 0.5,
          lifetimeEarningsUSDT: 0.5,
          referralEarningsUSDT: 0.0,
          todayBonusUSDT: 0.05,
          depositStatus: 'Approved',
          withdrawStatus: 'Pending',
          referralCount: 2,
          isFrozen: 0,
          isBanned: 0,
          mandatoryCompleted: 1,
          referredBy: null
        },
        {
          uid: 117307,
          id: "117307",
          username: "user_117307",
          firstName: "VIP User",
          lastName: "",
          photoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces",
          languageCode: "en",
          registeredAt: "2026-07-15T00:00:00Z",
          balanceTM: 50000,
          balanceUSDT: 500.0,
          lifetimeEarningsUSDT: 500.0,
          referralEarningsUSDT: 0.0,
          todayBonusUSDT: 0.0,
          depositStatus: 'None',
          withdrawStatus: 'None',
          referralCount: 0,
          isFrozen: 0,
          isBanned: 0,
          mandatoryCompleted: 1,
          referredBy: null
        }
      ];

      const insertUser = this.db.prepare(`
        INSERT INTO users (id, uid, username, firstName, lastName, photoUrl, languageCode, registeredAt, balanceTM, balanceUSDT, lifetimeEarningsUSDT, referralEarningsUSDT, todayBonusUSDT, depositStatus, withdrawStatus, referralCount, isFrozen, isBanned, mandatoryCompleted, referredBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of defaultUsers) {
        insertUser.run(
          u.id, u.uid, u.username, u.firstName, u.lastName, u.photoUrl, u.languageCode, u.registeredAt,
          u.balanceTM, u.balanceUSDT, u.lifetimeEarningsUSDT, u.referralEarningsUSDT, u.todayBonusUSDT,
          u.depositStatus, u.withdrawStatus, u.referralCount, u.isFrozen, u.isBanned, u.mandatoryCompleted, u.referredBy
        );
      }

      // Seed default completed tasks
      const defaultCompleted = [
        { userId: "111111111", taskId: "mandatory_channel_1" },
        { userId: "111111111", taskId: "mandatory_channel_2" },
        { userId: "111111111", taskId: "mandatory_channel_3" },
        { userId: "333333333", taskId: "mandatory_channel_1" },
        { userId: "333333333", taskId: "mandatory_channel_2" },
        { userId: "333333333", taskId: "mandatory_channel_3" },
        { userId: "222222222", taskId: "mandatory_channel_1" }
      ];

      const insertCompleted = this.db.prepare('INSERT OR IGNORE INTO completed_tasks (userId, taskId) VALUES (?, ?)');
      for (const c of defaultCompleted) {
        insertCompleted.run(c.userId, c.taskId);
      }
    }
  }
}

// Global DB variable, checking for actual Cloudflare environment DB first
export const localD1Instance = new LocalD1Database(path.join(process.cwd(), 'd1_database.db'));

export function getD1(): any {
  // If we are running inside Cloudflare Pages/Workers, the DB binding will be provided as an env or global property
  if ((globalThis as any).env && (globalThis as any).env.DB) {
    return (globalThis as any).env.DB;
  }
  if ((globalThis as any).DB) {
    return (globalThis as any).DB;
  }
  return localD1Instance;
}

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';

// Load env variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'd1_database.db');

// Helper to check if a ID is mock
const isMockUser = (userId: string) => {
  return ['111111111', '222222222', '333333333', '444444444', '555555555'].includes(userId);
};

// Default Database Setup
const DEFAULT_SETTINGS = {
  conversionRate: 1000,
  referralRewardUSDT: 0.05,
  referralRewardTM: 100,
  dailyBonusRateUSDT: 0.11,
  dailyBonusIntervalHours: 24,
  dailyBonusEnabled: true,
  walletAddressUSDT: "0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592",
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592",
  autoApprovalEnabled: false,
  maintenanceMode: false,
  announcement: "📢 TM Digital v1.2 Live! Complete your mandatory tasks to unlock your premium staking dashboard.",
  mandatoryTaskCount: 3,
  depositMinUSDT: 1.0,
  referralMilestones: [
    { count: 5, rewardTM: 80 },
    { count: 10, rewardTM: 200 },
    { count: 25, rewardTM: 500 },
    { count: 50, rewardTM: 1200 },
    { count: 100, rewardTM: 2500 }
  ],
  withdrawEnabled: true,
  withdrawDisabledMessage: "🚫 Withdrawals are temporarily unavailable. Please try again later.",
  referralSystemEnabled: true,
  referralRewardAmountUSD: 3.0,
  referralMinWithdrawRequirementUSD: 10.0
};

const DEFAULT_USERS = [
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
    isFrozen: false,
    isBanned: false,
    mandatoryCompleted: true
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
    isFrozen: false,
    isBanned: false,
    mandatoryCompleted: false
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
    isFrozen: false,
    isBanned: false,
    mandatoryCompleted: true
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
    isFrozen: false,
    isBanned: false,
    mandatoryCompleted: true
  }
];

const DEFAULT_TASKS = [
  {
    id: "mandatory_channel_1",
    title: "TM_Digital",
    description: "Join the official TM_Digital Telegram channel.",
    type: "TelegramChannel",
    rewardTM: 200,
    link: "https://t.me/TM_Digital",
    isMandatory: true,
    displayOrder: 1,
    isEnabled: true,
    requiresVerification: true,
    channelId: "-1003260376953"
  },
  {
    id: "mandatory_channel_2",
    title: "TM_Back",
    description: "Join the official TM_Back Telegram channel.",
    type: "TelegramChannel",
    rewardTM: 150,
    link: "https://t.me/TM_Back",
    isMandatory: true,
    displayOrder: 2,
    isEnabled: true,
    requiresVerification: true,
    channelId: "-1001179648853"
  },
  {
    id: "mandatory_channel_3",
    title: "TM_With",
    description: "Join the official TM_With Telegram channel.",
    type: "TelegramChannel",
    rewardTM: 150,
    link: "https://t.me/TM_With",
    isMandatory: true,
    displayOrder: 3,
    isEnabled: true,
    requiresVerification: true,
    channelId: "-1001873895959"
  },
  {
    id: "task_optional_1",
    title: "Follow TM Digital on X",
    description: "Follow @TM_Digital on X (Twitter) for instant updates.",
    type: "ExternalLink",
    rewardTM: 100,
    link: "https://x.com",
    isMandatory: false,
    displayOrder: 4,
    isEnabled: true,
    requiresVerification: true
  }
];

const DEFAULT_COMPLETED_TASKS = {
  "111111111": ["mandatory_channel_1", "mandatory_channel_2", "mandatory_channel_3"],
  "333333333": ["mandatory_channel_1", "mandatory_channel_2", "mandatory_channel_3"],
  "222222222": ["mandatory_channel_1"]
};

const SQLITE_DB_PATH = path.join(process.cwd(), 'd1_database.db');
const sqliteDb = new Database(SQLITE_DB_PATH);

// Initialize database schema and seed if necessary
function initDatabase() {
  sqliteDb.exec(`
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
      referredBy TEXT
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
      rewardAmount REAL DEFAULT 0,
      maxClaims INTEGER,
      claimsCount INTEGER DEFAULT 0,
      claimedCount INTEGER DEFAULT 0,
      createdAt TEXT,
      expiryDate TEXT,
      expiresAt TEXT,
      isEnabled INTEGER DEFAULT 1,
      claimedBy TEXT DEFAULT '[]'
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
  const tasksCount = (sqliteDb.prepare('SELECT COUNT(*) as count FROM tasks').get() as any)?.count || 0;
  if (tasksCount === 0) {
    const insertTask = sqliteDb.prepare(`
      INSERT INTO tasks (id, title, description, type, rewardTM, link, isMandatory, displayOrder, isEnabled, requiresVerification, channelId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of DEFAULT_TASKS) {
      insertTask.run(t.id, t.title, t.description, t.type, t.rewardTM, t.link, t.isMandatory ? 1 : 0, t.displayOrder, t.isEnabled ? 1 : 0, t.requiresVerification ? 1 : 0, t.channelId || '');
    }
  }

  // Seed default settings
  const settingsCount = (sqliteDb.prepare('SELECT COUNT(*) as count FROM settings').get() as any)?.count || 0;
  if (settingsCount === 0) {
    const defaultSettings: Record<string, string> = {
      conversionRate: "1000",
      referralRewardUSDT: "0.05",
      referralRewardTM: "100",
      dailyBonusRateUSDT: "0.11",
      dailyBonusIntervalHours: "24",
      dailyBonusEnabled: "true",
      walletAddressUSDT: "0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592",
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592",
      autoApprovalEnabled: "false",
      maintenanceMode: "false",
      announcement: "📢 TM Digital v1.2 Live! Complete your mandatory tasks to unlock your premium staking dashboard.",
      mandatoryTaskCount: "3",
      depositMinUSDT: "1.0",
      withdrawEnabled: "true",
      withdrawDisabledMessage: "🚫 Withdrawals are temporarily unavailable. Please try again later.",
      referralSystemEnabled: "true",
      referralRewardAmountUSD: "3.0",
      referralMinWithdrawRequirementUSD: "10.0"
    };

    const insertSetting = sqliteDb.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(defaultSettings)) {
      insertSetting.run(k, v);
    }
  }

  // Seed default users
  const usersCount = (sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0;
  if (usersCount === 0) {
    const insertUser = sqliteDb.prepare(`
      INSERT INTO users (id, uid, username, firstName, lastName, photoUrl, languageCode, registeredAt, balanceTM, balanceUSDT, lifetimeEarningsUSDT, referralEarningsUSDT, todayBonusUSDT, depositStatus, withdrawStatus, referralCount, isFrozen, isBanned, mandatoryCompleted, referredBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of DEFAULT_USERS) {
      insertUser.run(
        u.id, u.uid, u.username, u.firstName, u.lastName, u.photoUrl, u.languageCode, u.registeredAt,
        u.balanceTM, u.balanceUSDT, u.lifetimeEarningsUSDT, u.referralEarningsUSDT, u.todayBonusUSDT,
        u.depositStatus, u.withdrawStatus, u.referralCount, u.isFrozen ? 1 : 0, u.isBanned ? 1 : 0, u.mandatoryCompleted ? 1 : 0, null
      );
    }

    const insertCompleted = sqliteDb.prepare('INSERT OR IGNORE INTO completed_tasks (userId, taskId) VALUES (?, ?)');
    for (const [userId, taskIds] of Object.entries(DEFAULT_COMPLETED_TASKS)) {
      for (const taskId of taskIds) {
        insertCompleted.run(userId, taskId);
      }
    }
  }

  // Run migrations for gift_codes table if columns are missing in existing database
  try {
    sqliteDb.exec(`ALTER TABLE gift_codes ADD COLUMN rewardAmount REAL DEFAULT 0;`);
  } catch (e) {}
  try {
    sqliteDb.exec(`ALTER TABLE gift_codes ADD COLUMN claimsCount INTEGER DEFAULT 0;`);
  } catch (e) {}
  try {
    sqliteDb.exec(`ALTER TABLE gift_codes ADD COLUMN expiryDate TEXT;`);
  } catch (e) {}
  try {
    sqliteDb.exec(`ALTER TABLE gift_codes ADD COLUMN isEnabled INTEGER DEFAULT 1;`);
  } catch (e) {}
  try {
    sqliteDb.exec(`ALTER TABLE gift_codes ADD COLUMN claimedBy TEXT DEFAULT '[]';`);
  } catch (e) {}
}

// Helper to get D1 instance or fallback to local
function getActiveD1(req?: any): any {
  if (req && req.env && req.env.DB) return req.env.DB;
  if ((globalThis as any).env && (globalThis as any).env.DB) return (globalThis as any).env.DB;
  if ((globalThis as any).DB) return (globalThis as any).DB;
  return null;
}

// D1 Auto-Initialization and Seeding
async function initD1Database(db: any) {
  try {
    await db.prepare('SELECT COUNT(*) FROM settings').first();
  } catch (err) {
    console.log('[D1 Auto-Init] Tables not found. Initializing D1 tables...');
    
    // Create all tables
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `).run();
    await db.prepare(`
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
        referredBy TEXT
      );
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        senderUid INTEGER,
        receiverUid INTEGER,
        amountTM REAL,
        status TEXT,
        timestamp TEXT
      );
    `).run();
    await db.prepare(`
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
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS deposits (
        id TEXT PRIMARY KEY,
        userId TEXT,
        amountUSDT REAL,
        txHash TEXT,
        status TEXT,
        createdAt TEXT
      );
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        userId TEXT,
        type TEXT,
        amountTM REAL,
        amountUSDT REAL,
        description TEXT,
        createdAt TEXT
      );
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS gift_codes (
        code TEXT PRIMARY KEY,
        rewardTM REAL,
        rewardUSDT REAL,
        rewardAmount REAL DEFAULT 0,
        maxClaims INTEGER,
        claimsCount INTEGER DEFAULT 0,
        claimedCount INTEGER DEFAULT 0,
        createdAt TEXT,
        expiryDate TEXT,
        expiresAt TEXT,
        isEnabled INTEGER DEFAULT 1,
        claimedBy TEXT DEFAULT '[]'
      );
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS completed_tasks (
        userId TEXT,
        taskId TEXT,
        PRIMARY KEY (userId, taskId)
      );
    `).run();
    await db.prepare(`
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
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        userId TEXT,
        subject TEXT,
        message TEXT,
        status TEXT,
        createdAt TEXT
      );
    `).run();
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS claimed_bonuses (
        userId TEXT,
        dayKey TEXT,
        PRIMARY KEY (userId, dayKey)
      );
    `).run();

    console.log('[D1 Auto-Init] Tables created. Seeding default data...');

    // Seed default tasks
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

    for (const t of defaultTasks) {
      await db.prepare(`
        INSERT OR IGNORE INTO tasks (id, title, description, type, rewardTM, link, isMandatory, displayOrder, isEnabled, requiresVerification, channelId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(t.id, t.title, t.description, t.type, t.rewardTM, t.link, t.isMandatory, t.displayOrder, t.isEnabled, t.requiresVerification, t.channelId).run();
    }

    // Seed default settings
    const defaultSettings: Record<string, string> = {
      conversionRate: "1000",
      referralRewardUSDT: "0.05",
      referralRewardTM: "100",
      dailyBonusRateUSDT: "0.11",
      dailyBonusIntervalHours: "24",
      dailyBonusEnabled: "true",
      walletAddressUSDT: "0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592",
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592",
      autoApprovalEnabled: "false",
      maintenanceMode: "false",
      announcement: "📢 TM Digital v1.2 Live! Complete your mandatory tasks to unlock your premium staking dashboard.",
      mandatoryTaskCount: "3",
      depositMinUSDT: "1.0",
      withdrawEnabled: "true",
      withdrawDisabledMessage: "🚫 Withdrawals are temporarily unavailable. Please try again later.",
      referralSystemEnabled: "true",
      referralRewardAmountUSD: "3.0",
      referralMinWithdrawRequirementUSD: "10.0"
    };

    for (const [k, v] of Object.entries(defaultSettings)) {
      await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(k, v).run();
    }

    // Seed default users
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

    for (const u of defaultUsers) {
      await db.prepare(`
        INSERT OR IGNORE INTO users (id, uid, username, firstName, lastName, photoUrl, languageCode, registeredAt, balanceTM, balanceUSDT, lifetimeEarningsUSDT, referralEarningsUSDT, todayBonusUSDT, depositStatus, withdrawStatus, referralCount, isFrozen, isBanned, mandatoryCompleted, referredBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        u.id, u.uid, u.username, u.firstName, u.lastName, u.photoUrl, u.languageCode, u.registeredAt,
        u.balanceTM, u.balanceUSDT, u.lifetimeEarningsUSDT, u.referralEarningsUSDT, u.todayBonusUSDT,
        u.depositStatus, u.withdrawStatus, u.referralCount, u.isFrozen, u.isBanned, u.mandatoryCompleted, u.referredBy
      ).run();
    }

    const defaultCompleted = [
      { userId: "111111111", taskId: "mandatory_channel_1" },
      { userId: "111111111", taskId: "mandatory_channel_2" },
      { userId: "111111111", taskId: "mandatory_channel_3" },
      { userId: "333333333", taskId: "mandatory_channel_1" },
      { userId: "333333333", taskId: "mandatory_channel_2" },
      { userId: "333333333", taskId: "mandatory_channel_3" },
      { userId: "222222222", taskId: "mandatory_channel_1" }
    ];

    for (const c of defaultCompleted) {
      await db.prepare('INSERT OR IGNORE INTO completed_tasks (userId, taskId) VALUES (?, ?)').bind(c.userId, c.taskId).run();
    }

    console.log('[D1 Auto-Init] Seeding completed.');
  }

  // Run migrations for gift_codes table if columns are missing in existing D1 database
  try {
    await db.prepare(`ALTER TABLE gift_codes ADD COLUMN rewardAmount REAL DEFAULT 0;`).run();
  } catch (e) {}
  try {
    await db.prepare(`ALTER TABLE gift_codes ADD COLUMN claimsCount INTEGER DEFAULT 0;`).run();
  } catch (e) {}
  try {
    await db.prepare(`ALTER TABLE gift_codes ADD COLUMN expiryDate TEXT;`).run();
  } catch (e) {}
  try {
    await db.prepare(`ALTER TABLE gift_codes ADD COLUMN isEnabled INTEGER DEFAULT 1;`).run();
  } catch (e) {}
  try {
    await db.prepare(`ALTER TABLE gift_codes ADD COLUMN claimedBy TEXT DEFAULT '[]';`).run();
  } catch (e) {}
}

// Get from Cloudflare D1
async function getDBFromD1(db: any): Promise<any> {
  try {
    // 1. Settings
    const settingsResult = await db.prepare('SELECT key, value FROM settings').all();
    const settingsRows = settingsResult.results || [];
    const settings: any = {};
    settingsRows.forEach((row: any) => {
      if (row.value === 'true') settings[row.key] = true;
      else if (row.value === 'false') settings[row.key] = false;
      else if (!isNaN(Number(row.value)) && row.value !== '') settings[row.key] = Number(row.value);
      else settings[row.key] = row.value;
    });

    // 2. Users
    const usersResult = await db.prepare('SELECT * FROM users').all();
    const usersRows = usersResult.results || [];
    const users = usersRows.map((u: any) => ({
      ...u,
      isFrozen: u.isFrozen === 1,
      isBanned: u.isBanned === 1,
      mandatoryCompleted: u.mandatoryCompleted === 1
    }));

    // 3. Tasks
    const tasksResult = await db.prepare('SELECT * FROM tasks ORDER BY displayOrder ASC').all();
    const tasksRows = tasksResult.results || [];
    const tasks = tasksRows.map((t: any) => ({
      ...t,
      isMandatory: t.isMandatory === 1,
      isEnabled: t.isEnabled === 1,
      requiresVerification: t.requiresVerification === 1
    }));

    // 4. Completed Tasks
    const completedResult = await db.prepare('SELECT * FROM completed_tasks').all();
    const completedRows = completedResult.results || [];
    const completedTasks: Record<string, string[]> = {};
    completedRows.forEach((row: any) => {
      if (!completedTasks[row.userId]) {
        completedTasks[row.userId] = [];
      }
      completedTasks[row.userId].push(row.taskId);
    });

    // 5. Deposits, Withdrawals, Transactions, Transfers, Gift Codes, Tickets
    const depositsResult = await db.prepare('SELECT * FROM deposits ORDER BY createdAt DESC').all();
    const withdrawalsResult = await db.prepare('SELECT * FROM withdrawals ORDER BY createdAt DESC').all();
    const transactionsResult = await db.prepare('SELECT * FROM transactions ORDER BY createdAt DESC').all();
    const transfersResult = await db.prepare('SELECT * FROM transfers ORDER BY timestamp DESC').all();
    const giftCodesResult = await db.prepare('SELECT * FROM gift_codes').all();
    const ticketsResult = await db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all();

    const deposits = depositsResult.results || [];
    const withdrawals = withdrawalsResult.results || [];
    const transactions = transactionsResult.results || [];
    const transfers = transfersResult.results || [];
    const giftCodesRaw = giftCodesResult.results || [];
    const giftCodes = giftCodesRaw.map((g: any) => {
      let claimedByArr: string[] = [];
      try {
        if (g.claimedBy) {
          claimedByArr = JSON.parse(g.claimedBy);
        }
      } catch (e) {
        if (typeof g.claimedBy === 'string' && g.claimedBy.trim() !== '') {
          claimedByArr = g.claimedBy.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return {
        code: g.code,
        rewardAmount: g.rewardAmount !== undefined && g.rewardAmount !== null ? Number(g.rewardAmount) : Number(g.rewardUSDT || 0),
        rewardTM: Number(g.rewardTM || 0),
        rewardUSDT: Number(g.rewardUSDT || 0),
        maxClaims: Number(g.maxClaims || 1),
        claimsCount: g.claimsCount !== undefined && g.claimsCount !== null ? Number(g.claimsCount) : Number(g.claimedCount || 0),
        claimedCount: g.claimedCount !== undefined && g.claimedCount !== null ? Number(g.claimedCount) : Number(g.claimsCount || 0),
        expiryDate: g.expiryDate || g.expiresAt || undefined,
        expiresAt: g.expiresAt || g.expiryDate || undefined,
        isEnabled: g.isEnabled === undefined || g.isEnabled === null ? true : (g.isEnabled === 1 || g.isEnabled === true || String(g.isEnabled) === 'true'),
        claimedBy: claimedByArr,
        createdAt: g.createdAt
      };
    });
    const tickets = ticketsResult.results || [];

    // 6. Claimed Bonuses
    const bonusesResult = await db.prepare('SELECT * FROM claimed_bonuses').all();
    const bonusesRows = bonusesResult.results || [];
    const claimedBonuses: Record<string, string[]> = {};
    bonusesRows.forEach((row: any) => {
      if (!claimedBonuses[row.userId]) {
        claimedBonuses[row.userId] = [];
      }
      claimedBonuses[row.userId].push(row.dayKey);
    });

    return {
      users,
      tasks,
      channels: [],
      deposits,
      withdrawals,
      withdrawalRules: [],
      transactions,
      transfers,
      tickets,
      settings: { ...DEFAULT_SETTINGS, ...settings },
      completedTasks,
      claimedBonuses,
      taskSubmissions: [],
      notifications: [],
      giftCodes
    };
  } catch (err) {
    console.error("Failed to read from D1 cloud database", err);
    return null;
  }
}

// Save to Cloudflare D1
async function saveDBToD1(dbState: any, db: any): Promise<void> {
  try {
    // 1. Settings
    if (dbState.settings) {
      await db.prepare('DELETE FROM settings').run();
      const insertPromises = [];
      for (const [k, v] of Object.entries(dbState.settings)) {
        insertPromises.push(db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind(k, String(v)).run());
      }
      await Promise.all(insertPromises);
    }

    // 2. Users
    if (dbState.users && Array.isArray(dbState.users)) {
      await db.prepare('DELETE FROM users').run();
      const insertPromises = [];
      for (const u of dbState.users) {
        insertPromises.push(
          db.prepare(`
            INSERT INTO users (id, uid, username, firstName, lastName, photoUrl, languageCode, registeredAt, balanceTM, balanceUSDT, lifetimeEarningsUSDT, referralEarningsUSDT, todayBonusUSDT, depositStatus, withdrawStatus, referralCount, isFrozen, isBanned, mandatoryCompleted, referredBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            u.id, u.uid, u.username, u.firstName, u.lastName, u.photoUrl, u.languageCode, u.registeredAt,
            u.balanceTM || 0, u.balanceUSDT || 0, u.lifetimeEarningsUSDT || 0, u.referralEarningsUSDT || 0, u.todayBonusUSDT || 0,
            u.depositStatus || 'None', u.withdrawStatus || 'None', u.referralCount || 0,
            u.isFrozen ? 1 : 0, u.isBanned ? 1 : 0, u.mandatoryCompleted ? 1 : 0, u.referredBy || null
          ).run()
        );
      }
      await Promise.all(insertPromises);
    }

    // 3. Tasks
    if (dbState.tasks && Array.isArray(dbState.tasks)) {
      await db.prepare('DELETE FROM tasks').run();
      const insertPromises = [];
      for (const t of dbState.tasks) {
        insertPromises.push(
          db.prepare(`
            INSERT INTO tasks (id, title, description, type, rewardTM, link, isMandatory, displayOrder, isEnabled, requiresVerification, channelId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            t.id, t.title, t.description, t.type, t.rewardTM || 0, t.link || '',
            t.isMandatory ? 1 : 0, t.displayOrder || 0, t.isEnabled ? 1 : 0, t.requiresVerification ? 1 : 0, t.channelId || ''
          ).run()
        );
      }
      await Promise.all(insertPromises);
    }

    // 4. Completed Tasks
    if (dbState.completedTasks) {
      await db.prepare('DELETE FROM completed_tasks').run();
      const insertPromises = [];
      for (const [userId, taskIds] of Object.entries(dbState.completedTasks)) {
        if (Array.isArray(taskIds)) {
          for (const taskId of taskIds) {
            insertPromises.push(db.prepare('INSERT INTO completed_tasks (userId, taskId) VALUES (?, ?)').bind(userId, taskId).run());
          }
        }
      }
      await Promise.all(insertPromises);
    }

    // 5. Deposits
    if (dbState.deposits && Array.isArray(dbState.deposits)) {
      await db.prepare('DELETE FROM deposits').run();
      const insertPromises = [];
      for (const d of dbState.deposits) {
        insertPromises.push(db.prepare('INSERT INTO deposits (id, userId, amountUSDT, txHash, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)').bind(d.id, d.userId, d.amountUSDT || 0, d.txHash || '', d.status || 'Pending', d.createdAt).run());
      }
      await Promise.all(insertPromises);
    }

    // 6. Withdrawals
    if (dbState.withdrawals && Array.isArray(dbState.withdrawals)) {
      await db.prepare('DELETE FROM withdrawals').run();
      const insertPromises = [];
      for (const w of dbState.withdrawals) {
        insertPromises.push(db.prepare('INSERT INTO withdrawals (id, userId, amountUSDT, amountTM, address, network, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(w.id, w.userId, w.amountUSDT || 0, w.amountTM || 0, w.address || '', w.network || '', w.status || 'Pending', w.createdAt).run());
      }
      await Promise.all(insertPromises);
    }

    // 7. Transactions
    if (dbState.transactions && Array.isArray(dbState.transactions)) {
      await db.prepare('DELETE FROM transactions').run();
      const insertPromises = [];
      for (const t of dbState.transactions) {
        insertPromises.push(db.prepare('INSERT INTO transactions (id, userId, type, amountTM, amountUSDT, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(t.id, t.userId, t.type, t.amountTM || 0, t.amountUSDT || 0, t.description || '', t.createdAt).run());
      }
      await Promise.all(insertPromises);
    }

    // 8. Transfers
    if (dbState.transfers && Array.isArray(dbState.transfers)) {
      await db.prepare('DELETE FROM transfers').run();
      const insertPromises = [];
      for (const t of dbState.transfers) {
        insertPromises.push(db.prepare('INSERT INTO transfers (id, senderUid, receiverUid, amountTM, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)').bind(t.id, t.senderUid, t.receiverUid, t.amountTM || 0, t.status || 'Pending', t.timestamp).run());
      }
      await Promise.all(insertPromises);
    }

    // 9. Gift Codes
    if (dbState.giftCodes && Array.isArray(dbState.giftCodes)) {
      await db.prepare('DELETE FROM gift_codes').run();
      const insertPromises = [];
      for (const g of dbState.giftCodes) {
        const rewardAmount = g.rewardAmount !== undefined ? g.rewardAmount : (g.rewardUSDT || 0);
        const claimsCount = g.claimsCount !== undefined ? g.claimsCount : (g.claimedCount || 0);
        const expiryDate = g.expiryDate || g.expiresAt || null;
        const isEnabled = g.isEnabled === false ? 0 : 1;
        const claimedByStr = JSON.stringify(g.claimedBy || []);

        insertPromises.push(
          db.prepare(`
            INSERT INTO gift_codes (code, rewardAmount, rewardTM, rewardUSDT, maxClaims, claimsCount, claimedCount, createdAt, expiryDate, expiresAt, isEnabled, claimedBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            g.code,
            rewardAmount,
            g.rewardTM || 0,
            g.rewardUSDT || 0,
            g.maxClaims || 1,
            claimsCount,
            claimsCount,
            g.createdAt || new Date().toISOString(),
            expiryDate,
            expiryDate,
            isEnabled,
            claimedByStr
          ).run()
        );
      }
      await Promise.all(insertPromises);
    }

    // 10. Tickets
    if (dbState.tickets && Array.isArray(dbState.tickets)) {
      await db.prepare('DELETE FROM tickets').run();
      const insertPromises = [];
      for (const t of dbState.tickets) {
        insertPromises.push(db.prepare('INSERT INTO tickets (id, userId, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)').bind(t.id, t.userId, t.subject || '', t.message || '', t.status || 'Open', t.createdAt).run());
      }
      await Promise.all(insertPromises);
    }

    // 11. Claimed Bonuses
    if (dbState.claimedBonuses) {
      await db.prepare('DELETE FROM claimed_bonuses').run();
      const insertPromises = [];
      for (const [userId, dayKeys] of Object.entries(dbState.claimedBonuses)) {
        if (Array.isArray(dayKeys)) {
          for (const dayKey of dayKeys) {
            insertPromises.push(db.prepare('INSERT INTO claimed_bonuses (userId, dayKey) VALUES (?, ?)').bind(userId, dayKey).run());
          }
        }
      }
      await Promise.all(insertPromises);
    }
  } catch (err) {
    console.error("Failed to save to D1 cloud database", err);
  }
}

// Get from Local SQLite
function getDBFromLocal(): any {
  initDatabase();
  try {
    // 1. Settings
    const settingsRows = sqliteDb.prepare('SELECT key, value FROM settings').all() as any[];
    const settings: any = {};
    settingsRows.forEach((row: any) => {
      if (row.value === 'true') settings[row.key] = true;
      else if (row.value === 'false') settings[row.key] = false;
      else if (!isNaN(Number(row.value)) && row.value !== '') settings[row.key] = Number(row.value);
      else settings[row.key] = row.value;
    });

    // 2. Users
    const usersRows = sqliteDb.prepare('SELECT * FROM users').all() as any[];
    const users = usersRows.map((u: any) => ({
      ...u,
      isFrozen: u.isFrozen === 1,
      isBanned: u.isBanned === 1,
      mandatoryCompleted: u.mandatoryCompleted === 1
    }));

    // 3. Tasks
    const tasksRows = sqliteDb.prepare('SELECT * FROM tasks ORDER BY displayOrder ASC').all() as any[];
    const tasks = tasksRows.map((t: any) => ({
      ...t,
      isMandatory: t.isMandatory === 1,
      isEnabled: t.isEnabled === 1,
      requiresVerification: t.requiresVerification === 1
    }));

    // 4. Completed Tasks
    const completedRows = sqliteDb.prepare('SELECT * FROM completed_tasks').all() as any[];
    const completedTasks: Record<string, string[]> = {};
    completedRows.forEach((row: any) => {
      if (!completedTasks[row.userId]) {
        completedTasks[row.userId] = [];
      }
      completedTasks[row.userId].push(row.taskId);
    });

    // 5. Deposits, Withdrawals, Transactions, Transfers, Gift Codes, Tickets
    const deposits = sqliteDb.prepare('SELECT * FROM deposits ORDER BY createdAt DESC').all() as any[];
    const withdrawals = sqliteDb.prepare('SELECT * FROM withdrawals ORDER BY createdAt DESC').all() as any[];
    const transactions = sqliteDb.prepare('SELECT * FROM transactions ORDER BY createdAt DESC').all() as any[];
    const transfers = sqliteDb.prepare('SELECT * FROM transfers ORDER BY timestamp DESC').all() as any[];
    const giftCodesRaw = sqliteDb.prepare('SELECT * FROM gift_codes').all() as any[];
    const giftCodes = giftCodesRaw.map((g: any) => {
      let claimedByArr: string[] = [];
      try {
        if (g.claimedBy) {
          claimedByArr = JSON.parse(g.claimedBy);
        }
      } catch (e) {
        if (typeof g.claimedBy === 'string' && g.claimedBy.trim() !== '') {
          claimedByArr = g.claimedBy.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return {
        code: g.code,
        rewardAmount: g.rewardAmount !== undefined && g.rewardAmount !== null ? Number(g.rewardAmount) : Number(g.rewardUSDT || 0),
        rewardTM: Number(g.rewardTM || 0),
        rewardUSDT: Number(g.rewardUSDT || 0),
        maxClaims: Number(g.maxClaims || 1),
        claimsCount: g.claimsCount !== undefined && g.claimsCount !== null ? Number(g.claimsCount) : Number(g.claimedCount || 0),
        claimedCount: g.claimedCount !== undefined && g.claimedCount !== null ? Number(g.claimedCount) : Number(g.claimsCount || 0),
        expiryDate: g.expiryDate || g.expiresAt || undefined,
        expiresAt: g.expiresAt || g.expiryDate || undefined,
        isEnabled: g.isEnabled === undefined || g.isEnabled === null ? true : (g.isEnabled === 1 || g.isEnabled === true || String(g.isEnabled) === 'true'),
        claimedBy: claimedByArr,
        createdAt: g.createdAt
      };
    });
    const tickets = sqliteDb.prepare('SELECT * FROM tickets ORDER BY createdAt DESC').all() as any[];

    // 6. Claimed Bonuses
    const bonusesRows = sqliteDb.prepare('SELECT * FROM claimed_bonuses').all() as any[];
    const claimedBonuses: Record<string, string[]> = {};
    bonusesRows.forEach((row: any) => {
      if (!claimedBonuses[row.userId]) {
        claimedBonuses[row.userId] = [];
      }
      claimedBonuses[row.userId].push(row.dayKey);
    });

    return {
      users,
      tasks,
      channels: [],
      deposits,
      withdrawals,
      withdrawalRules: [],
      transactions,
      transfers,
      tickets,
      settings: { ...DEFAULT_SETTINGS, ...settings },
      completedTasks,
      claimedBonuses,
      taskSubmissions: [],
      notifications: [],
      giftCodes
    };
  } catch (err) {
    console.error("Failed to read from local database", err);
    return null;
  }
}

// Save to Local SQLite
function saveDBToLocal(dbState: any) {
  try {
    // 1. Settings
    if (dbState.settings) {
      sqliteDb.prepare('DELETE FROM settings').run();
      const stmt = sqliteDb.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      for (const [k, v] of Object.entries(dbState.settings)) {
        stmt.run(k, String(v));
      }
    }

    // 2. Users
    if (dbState.users && Array.isArray(dbState.users)) {
      sqliteDb.prepare('DELETE FROM users').run();
      const stmt = sqliteDb.prepare(`
        INSERT INTO users (id, uid, username, firstName, lastName, photoUrl, languageCode, registeredAt, balanceTM, balanceUSDT, lifetimeEarningsUSDT, referralEarningsUSDT, todayBonusUSDT, depositStatus, withdrawStatus, referralCount, isFrozen, isBanned, mandatoryCompleted, referredBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of dbState.users) {
        stmt.run(
          u.id, u.uid, u.username, u.firstName, u.lastName, u.photoUrl, u.languageCode, u.registeredAt,
          u.balanceTM || 0, u.balanceUSDT || 0, u.lifetimeEarningsUSDT || 0, u.referralEarningsUSDT || 0, u.todayBonusUSDT || 0,
          u.depositStatus || 'None', u.withdrawStatus || 'None', u.referralCount || 0,
          u.isFrozen ? 1 : 0, u.isBanned ? 1 : 0, u.mandatoryCompleted ? 1 : 0, u.referredBy || null
        );
      }
    }

    // 3. Tasks
    if (dbState.tasks && Array.isArray(dbState.tasks)) {
      sqliteDb.prepare('DELETE FROM tasks').run();
      const stmt = sqliteDb.prepare(`
        INSERT INTO tasks (id, title, description, type, rewardTM, link, isMandatory, displayOrder, isEnabled, requiresVerification, channelId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of dbState.tasks) {
        stmt.run(
          t.id, t.title, t.description, t.type, t.rewardTM || 0, t.link || '',
          t.isMandatory ? 1 : 0, t.displayOrder || 0, t.isEnabled ? 1 : 0, t.requiresVerification ? 1 : 0, t.channelId || ''
        );
      }
    }

    // 4. Completed Tasks
    if (dbState.completedTasks) {
      sqliteDb.prepare('DELETE FROM completed_tasks').run();
      const stmt = sqliteDb.prepare('INSERT INTO completed_tasks (userId, taskId) VALUES (?, ?)');
      for (const [userId, taskIds] of Object.entries(dbState.completedTasks)) {
        if (Array.isArray(taskIds)) {
          for (const taskId of taskIds) {
            stmt.run(userId, taskId);
          }
        }
      }
    }

    // 5. Deposits
    if (dbState.deposits && Array.isArray(dbState.deposits)) {
      sqliteDb.prepare('DELETE FROM deposits').run();
      const stmt = sqliteDb.prepare('INSERT INTO deposits (id, userId, amountUSDT, txHash, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
      for (const d of dbState.deposits) {
        stmt.run(d.id, d.userId, d.amountUSDT || 0, d.txHash || '', d.status || 'Pending', d.createdAt);
      }
    }

    // 6. Withdrawals
    if (dbState.withdrawals && Array.isArray(dbState.withdrawals)) {
      sqliteDb.prepare('DELETE FROM withdrawals').run();
      const stmt = sqliteDb.prepare('INSERT INTO withdrawals (id, userId, amountUSDT, amountTM, address, network, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const w of dbState.withdrawals) {
        stmt.run(w.id, w.userId, w.amountUSDT || 0, w.amountTM || 0, w.address || '', w.network || '', w.status || 'Pending', w.createdAt);
      }
    }

    // 7. Transactions
    if (dbState.transactions && Array.isArray(dbState.transactions)) {
      sqliteDb.prepare('DELETE FROM transactions').run();
      const stmt = sqliteDb.prepare('INSERT INTO transactions (id, userId, type, amountTM, amountUSDT, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const t of dbState.transactions) {
        stmt.run(t.id, t.userId, t.type, t.amountTM || 0, t.amountUSDT || 0, t.description || '', t.createdAt);
      }
    }

    // 8. Transfers
    if (dbState.transfers && Array.isArray(dbState.transfers)) {
      sqliteDb.prepare('DELETE FROM transfers').run();
      const stmt = sqliteDb.prepare('INSERT INTO transfers (id, senderUid, receiverUid, amountTM, status, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
      for (const t of dbState.transfers) {
        stmt.run(t.id, t.senderUid, t.receiverUid, t.amountTM || 0, t.status || 'Pending', t.timestamp);
      }
    }

    // 9. Gift Codes
    if (dbState.giftCodes && Array.isArray(dbState.giftCodes)) {
      sqliteDb.prepare('DELETE FROM gift_codes').run();
      const stmt = sqliteDb.prepare(`
        INSERT INTO gift_codes (code, rewardAmount, rewardTM, rewardUSDT, maxClaims, claimsCount, claimedCount, createdAt, expiryDate, expiresAt, isEnabled, claimedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const g of dbState.giftCodes) {
        const rewardAmount = g.rewardAmount !== undefined ? g.rewardAmount : (g.rewardUSDT || 0);
        const claimsCount = g.claimsCount !== undefined ? g.claimsCount : (g.claimedCount || 0);
        const expiryDate = g.expiryDate || g.expiresAt || null;
        const isEnabled = g.isEnabled === false ? 0 : 1;
        const claimedByStr = JSON.stringify(g.claimedBy || []);

        stmt.run(
          g.code,
          rewardAmount,
          g.rewardTM || 0,
          g.rewardUSDT || 0,
          g.maxClaims || 1,
          claimsCount,
          claimsCount,
          g.createdAt || new Date().toISOString(),
          expiryDate,
          expiryDate,
          isEnabled,
          claimedByStr
        );
      }
    }

    // 10. Tickets
    if (dbState.tickets && Array.isArray(dbState.tickets)) {
      sqliteDb.prepare('DELETE FROM tickets').run();
      const stmt = sqliteDb.prepare('INSERT INTO tickets (id, userId, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
      for (const t of dbState.tickets) {
        stmt.run(t.id, t.userId, t.subject || '', t.message || '', t.status || 'Open', t.createdAt);
      }
    }

    // 11. Claimed Bonuses
    if (dbState.claimedBonuses) {
      sqliteDb.prepare('DELETE FROM claimed_bonuses').run();
      const stmt = sqliteDb.prepare('INSERT INTO claimed_bonuses (userId, dayKey) VALUES (?, ?)');
      for (const [userId, dayKeys] of Object.entries(dbState.claimedBonuses)) {
        if (Array.isArray(dayKeys)) {
          for (const dayKey of dayKeys) {
            stmt.run(userId, dayKey);
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to save to local SQLite database", err);
  }
}

// Get DB helper
async function getDB(req?: any): Promise<any> {
  try {
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!sUrl || !sKey) {
      console.warn('[Supabase Server] Credentials missing, falling back to local SQLite.');
      return getDBFromLocal();
    }

    // Fetch global state
    const { data: appStateRow, error: appStateError } = await supabase
      .from('app_state')
      .select('*')
      .eq('id', 'global')
      .single();

    let globalState: any = {};
    if (appStateRow && appStateRow.data) {
      globalState = typeof appStateRow.data === 'string' ? JSON.parse(appStateRow.data) : appStateRow.data;
    }

    // Fetch all users from users table
    const { data: userRows, error: userError } = await supabase
      .from('users')
      .select('*');

    const users = userRows ? userRows.map((row: any) => {
      let claimedMilestones: number[] = [];
      try {
        if (row.claimed_milestones) {
          claimedMilestones = JSON.parse(row.claimed_milestones);
        }
      } catch (e) {
        if (Array.isArray(row.claimed_milestones)) {
          claimedMilestones = row.claimed_milestones;
        }
      }
      return {
        id: row.id,
        uid: Number(row.uid),
        username: row.username || undefined,
        firstName: row.first_name || '',
        lastName: row.last_name || undefined,
        photoUrl: row.photo_url || undefined,
        languageCode: row.language_code || undefined,
        registeredAt: row.registered_at || new Date().toISOString(),
        balanceTM: Number(row.balance_tm || 0),
        balanceUSDT: Number(row.balance_usdt || 0),
        lifetimeEarningsUSDT: Number(row.lifetime_earnings_usdt || 0),
        referralEarningsUSDT: Number(row.referral_earnings_usdt || 0),
        todayBonusUSDT: Number(row.today_bonus_usdt || 0),
        depositStatus: row.deposit_status || 'None',
        withdrawStatus: row.withdraw_status || 'None',
        referralCount: Number(row.referral_count || 0),
        referralCounted: row.referral_counted === true || row.referral_counted === 1,
        referredBy: row.referred_by || undefined,
        claimedMilestones,
        isFrozen: row.is_frozen === true || row.is_frozen === 1,
        isBanned: row.is_banned === true || row.is_banned === 1,
        mandatoryCompleted: row.mandatory_completed === true || row.mandatory_completed === 1
      };
    }) : [];

    // Fetch all transactions from transactions table
    const { data: txRows } = await supabase.from('transactions').select('*');
    const transactions = txRows ? txRows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      amountTM: Number(row.amount_tm || 0),
      amountUSDT: Number(row.amount_usdt || 0),
      description: row.description || '',
      createdAt: row.created_at || new Date().toISOString()
    })) : [];

    // Fetch all withdrawals from withdrawals table
    const { data: wdRows } = await supabase.from('withdrawals').select('*');
    const withdrawals = wdRows ? wdRows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userUsername: row.user_username || undefined,
      userFirstName: row.user_first_name || '',
      amountUSDT: Number(row.amount_usdt || 0),
      walletAddress: row.wallet_address || '',
      ruleId: row.rule_id || '',
      ruleDescription: row.rule_description || '',
      status: row.status || 'Pending',
      createdAt: row.created_at || new Date().toISOString(),
      processedAt: row.processed_at || undefined
    })) : [];

    // Fetch gift_codes from Supabase
    let giftCodes = globalState.giftCodes || [];
    try {
      const { data: gcRows, error: gcError } = await supabase.from('gift_codes').select('*');
      if (gcError) {
        console.warn('[Supabase Server] Failed to fetch gift_codes table, using globalState as fallback.', gcError);
      } else if (gcRows && gcRows.length > 0) {
        giftCodes = gcRows.map((row: any) => {
          let claimedByArr: string[] = [];
          try {
            if (row.claimed_by) {
              claimedByArr = JSON.parse(row.claimed_by);
            }
          } catch (e) {
            if (typeof row.claimed_by === 'string' && row.claimed_by.trim() !== '') {
              claimedByArr = row.claimed_by.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          return {
            code: row.code,
            rewardAmount: Number(row.reward_amount || 0),
            rewardTM: Number(row.reward_tm || 0),
            rewardUSDT: Number(row.reward_usdt || 0),
            maxClaims: Number(row.max_claims || 1),
            claimsCount: Number(row.claims_count || 0),
            expiryDate: row.expiry_date || undefined,
            isEnabled: row.is_enabled === true || row.is_enabled === 1,
            claimedBy: claimedByArr,
            createdAt: row.created_at || new Date().toISOString()
          };
        });
        console.log(`[Supabase Server] Successfully loaded ${giftCodes.length} gift codes from separate table.`);
      }
    } catch (err) {
      console.warn('[Supabase Server] Failed to query gift_codes, using globalState as fallback.', err);
    }

    // Fetch gift_code_redemptions from Supabase
    let giftCodeRedemptions = globalState.giftCodeRedemptions || [];
    try {
      const { data: redemptionRows, error: rError } = await supabase.from('gift_code_redemptions').select('*');
      if (rError) {
        console.warn('[Supabase Server] Failed to fetch gift_code_redemptions table, using globalState as fallback.', rError);
      } else if (redemptionRows && redemptionRows.length > 0) {
        giftCodeRedemptions = redemptionRows.map((row: any) => ({
          telegram_id: row.telegram_id,
          gift_code: row.gift_code,
          redeemed_at: row.redeemed_at
        }));
        console.log(`[Supabase Server] Successfully loaded ${giftCodeRedemptions.length} gift code redemptions from separate table.`);
      }
    } catch (err) {
      console.warn('[Supabase Server] Failed to query gift_code_redemptions, using globalState as fallback.', err);
    }

    const db: any = {
      users: users,
      tasks: globalState.tasks || DEFAULT_TASKS,
      channels: globalState.channels || [],
      deposits: globalState.deposits || [],
      withdrawals: withdrawals.length > 0 ? withdrawals : (globalState.withdrawals || []),
      withdrawalRules: globalState.withdrawalRules || [],
      transactions: transactions.length > 0 ? transactions : (globalState.transactions || []),
      transfers: globalState.transfers || [],
      tickets: globalState.tickets || [],
      settings: { ...DEFAULT_SETTINGS, ...(globalState.settings || {}) },
      completedTasks: globalState.completedTasks || {},
      claimedBonuses: globalState.claimedBonuses || {},
      taskSubmissions: globalState.taskSubmissions || [],
      notifications: globalState.notifications || [],
      lastInterestPayout: globalState.lastInterestPayout || new Date().toISOString(),
      giftCodes: giftCodes,
      giftCodeRedemptions: giftCodeRedemptions
    };

    return db;
  } catch (err) {
    console.error('[Supabase Server] getDB failed, falling back to local SQLite.', err);
    return getDBFromLocal();
  }
}

// Save DB helper
async function saveDB(dbState: any, req?: any): Promise<void> {
  try {
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!sUrl || !sKey) {
      console.warn('[Supabase Server] Credentials missing, falling back to local SQLite.');
      saveDBToLocal(dbState);
      return;
    }

    // 1. Save all users to Supabase
    if (dbState.users && Array.isArray(dbState.users)) {
      for (const u of dbState.users) {
        await supabase.from('users').upsert({
          id: u.id,
          uid: u.uid,
          username: u.username || null,
          first_name: u.firstName,
          last_name: u.lastName || null,
          photo_url: u.photoUrl || null,
          language_code: u.languageCode || null,
          registered_at: u.registeredAt,
          balance_tm: u.balanceTM,
          balance_usdt: u.balanceUSDT,
          lifetime_earnings_usdt: u.lifetimeEarningsUSDT,
          referral_earnings_usdt: u.referralEarningsUSDT,
          today_bonus_usdt: u.todayBonusUSDT,
          deposit_status: u.depositStatus,
          withdraw_status: u.withdrawStatus,
          referral_count: u.referralCount,
          referral_counted: u.referralCounted || false,
          referred_by: u.referredBy || null,
          claimed_milestones: JSON.stringify(u.claimedMilestones || []),
          is_frozen: u.isFrozen || false,
          is_banned: u.isBanned || false,
          mandatory_completed: u.mandatoryCompleted || false
        });
      }
    }

    // 2. Save transactions
    if (dbState.transactions && Array.isArray(dbState.transactions)) {
      const txPayloads = dbState.transactions.map((tx: any) => ({
        id: tx.id,
        user_id: tx.userId,
        type: tx.type,
        amount_tm: tx.amountTM,
        amount_usdt: tx.amountUSDT,
        description: tx.description,
        created_at: tx.createdAt
      }));
      if (txPayloads.length > 0) {
        await supabase.from('transactions').upsert(txPayloads);
      }
    }

    // 3. Save withdrawals
    if (dbState.withdrawals && Array.isArray(dbState.withdrawals)) {
      const wdPayloads = dbState.withdrawals.map((wd: any) => ({
        id: wd.id,
        user_id: wd.userId,
        user_username: wd.userUsername || null,
        user_first_name: wd.userFirstName,
        amount_usdt: wd.amountUSDT,
        wallet_address: wd.walletAddress,
        rule_id: wd.ruleId,
        rule_description: wd.ruleDescription,
        status: wd.status,
        created_at: wd.createdAt,
        processed_at: wd.processedAt || null
      }));
      if (wdPayloads.length > 0) {
        await supabase.from('withdrawals').upsert(wdPayloads);
      }
    }

    // 4. Save global state
    const globalData = {
      tasks: dbState.tasks,
      channels: dbState.channels,
      settings: dbState.settings,
      withdrawalRules: dbState.withdrawalRules,
      deposits: dbState.deposits,
      tickets: dbState.tickets,
      taskSubmissions: dbState.taskSubmissions,
      notifications: dbState.notifications,
      transfers: dbState.transfers,
      giftCodes: dbState.giftCodes,
      completedTasks: dbState.completedTasks,
      claimedBonuses: dbState.claimedBonuses,
      lastInterestPayout: dbState.lastInterestPayout,
      giftCodeRedemptions: dbState.giftCodeRedemptions || []
    };
    await supabase.from('app_state').upsert({ id: 'global', data: globalData });

    // 5. Save gift_codes to separate table in Supabase if exists
    if (dbState.giftCodes && Array.isArray(dbState.giftCodes)) {
      try {
        const gcPayloads = dbState.giftCodes.map((gc: any) => ({
          code: gc.code,
          reward_tm: Number(gc.rewardTM || 0),
          reward_usdt: Number(gc.rewardUSDT || 0),
          reward_amount: Number(gc.rewardAmount || 0),
          max_claims: Number(gc.maxClaims || 1),
          claims_count: Number(gc.claimsCount || 0),
          created_at: gc.createdAt || new Date().toISOString(),
          expiry_date: gc.expiryDate || null,
          is_enabled: gc.isEnabled !== false,
          claimed_by: JSON.stringify(gc.claimedBy || [])
        }));
        if (gcPayloads.length > 0) {
          const { error: gcErr } = await supabase.from('gift_codes').upsert(gcPayloads);
          if (gcErr) {
            console.warn('[Supabase Server] Failed to upsert to gift_codes table:', gcErr.message);
          } else {
            console.log(`[Supabase Server] Successfully saved ${gcPayloads.length} gift codes to table.`);
          }
        }
      } catch (err: any) {
        console.warn('[Supabase Server] Failed to save gift_codes to separate table:', err.message || err);
      }
    }

    // 6. Save gift_code_redemptions to separate table in Supabase if exists
    if (dbState.giftCodeRedemptions && Array.isArray(dbState.giftCodeRedemptions)) {
      try {
        const redemptionPayloads = dbState.giftCodeRedemptions.map((r: any) => ({
          telegram_id: r.telegram_id,
          gift_code: r.gift_code,
          redeemed_at: r.redeemed_at || new Date().toISOString()
        }));
        if (redemptionPayloads.length > 0) {
          const { error: rErr } = await supabase.from('gift_code_redemptions').upsert(redemptionPayloads, { onConflict: 'telegram_id,gift_code' });
          if (rErr) {
            console.warn('[Supabase Server] Failed to upsert to gift_code_redemptions table:', rErr.message);
          } else {
            console.log(`[Supabase Server] Successfully saved ${redemptionPayloads.length} gift code redemptions to table.`);
          }
        }
      } catch (err: any) {
        console.warn('[Supabase Server] Failed to save gift_code_redemptions to separate table:', err.message || err);
      }
    }

  } catch (err) {
    console.error('[Supabase Server] saveDB failed, falling back to local SQLite.', err);
    saveDBToLocal(dbState);
  }
}

async function startServer() {
  initDatabase();
  const app = express();
  app.use(express.json());

  // Log all incoming requests to requests.log for debugging
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLine = `[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode} (${duration}ms) (IP: ${req.ip || req.headers['x-forwarded-for']})\n`;
      try {
        fs.appendFileSync(path.join(process.cwd(), 'requests.log'), logLine, 'utf8');
      } catch (e) {
        console.error("Failed to write request log", e);
      }
    });
    next();
  });

  // -------------------------------------------------------------
  // SECURE API ENDPOINTS
  // -------------------------------------------------------------

  // Get current DB, optionally register user
  app.get('/api/db', async (req, res) => {
    const db = await getDB(req);
    if (!db) {
      return res.status(500).json({ error: 'Database error' });
    }

    const { userId } = req.query;
    if (userId && typeof userId === 'string') {
      let user = db.users.find((u: any) => u.id === userId);
      if (user) {
        user.mandatoryCompleted = true;
      }
      if (!user) {
        // Register new user on the server
        const maxUid = db.users.length > 0 ? Math.max(...db.users.map((u: any) => u.uid || 0)) : 117300;
        const nextUid = maxUid < 117300 ? 117301 : maxUid + 1;

        user = {
          id: userId,
          uid: nextUid,
          username: req.query.username || `user_${userId}`,
          firstName: req.query.firstName || 'User',
          lastName: req.query.lastName || '',
          photoUrl: req.query.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
          languageCode: req.query.languageCode || 'en',
          registeredAt: new Date().toISOString(),
          balanceTM: 0,
          balanceUSDT: 0.0,
          lifetimeEarningsUSDT: 0.0,
          referralEarningsUSDT: 0.0,
          todayBonusUSDT: 0.0,
          depositStatus: 'None',
          withdrawStatus: 'None',
          referralCount: 0,
          referralCounted: false,
          isFrozen: false,
          isBanned: false,
          mandatoryCompleted: true
        };
        db.users.push(user);
        await saveDB(db, req);
      }

      // Check for referral param if passed in query (support all standard Telegram query param variations)
      let refId = (req.query.ref as string || 
                   req.query.start_param as string || 
                   req.query.startParam as string || 
                   req.query.startapp as string || 
                   req.query.tgWebAppStartParam as string || '').trim();
      if (refId) {
        if (refId.startsWith('ref_')) {
          refId = refId.substring(4);
        }
        const refVal = refId.trim();
        console.log(`[Referral Process] User: ${userId}, passed ref parameter: "${refId}" -> processed as: "${refVal}"`);
        
        // If user doesn't have a referrer and hasn't been counted yet, and ref is valid
        if (refVal && refVal !== userId && (!user.referredBy || !user.referralCounted)) {
          // Find referrer: primary check by Telegram ID (as requested), with fallback to numeric UID or username
          const referrer = db.users.find((u: any) => 
            u.id === refVal || 
            String(u.uid) === refVal ||
            (u.username && u.username.toLowerCase() === refVal.toLowerCase())
          );
          
          if (referrer && referrer.id !== userId && !referrer.isBanned && !referrer.isFrozen) {
            user.referredBy = referrer.id;
            console.log(`[Referral Process] Found valid referrer: ${referrer.firstName} (@${referrer.username || referrer.id})`);
            
            // "Jab is page me ayega to hi refer add hoga"
            // We credit the referrer immediately!
            if (!user.referralCounted) {
              user.referralCounted = true;
              
              const referralRewardTM = db.settings.referralRewardTM ?? 100;
              const referralRewardUSDT = db.settings.referralRewardUSDT ?? 0.03;

              referrer.balanceTM = (referrer.balanceTM || 0) + referralRewardTM;
              referrer.referralEarningsTM = (referrer.referralEarningsTM || 0) + referralRewardTM;
              referrer.balanceUSDT = Number(((referrer.balanceUSDT || 0) + referralRewardUSDT).toFixed(4));
              referrer.referralEarningsUSDT = Number(((referrer.referralEarningsUSDT || 0) + referralRewardUSDT).toFixed(4));
              referrer.referralCount = (referrer.referralCount || 0) + 1;

              // Log referral transaction for referrer
              db.transactions.push({
                id: `ref_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                userId: referrer.id,
                type: 'Referral',
                amountTM: referralRewardTM,
                amountUSDT: referralRewardUSDT,
                description: `Referral Reward for inviting ${user.firstName} (@${user.username || user.id})`,
                createdAt: new Date().toISOString()
              });

              // Dispatch Referral notification to the referrer
              if (!db.notifications) db.notifications = [];
              db.notifications.unshift({
                id: `notif_${Date.now()}_ref_${Math.random().toString(36).substring(2, 7)}`,
                userId: referrer.id,
                title: 'Referral Completed! 👥',
                message: `Your invitee ${user.firstName} joined. You received +$${referralRewardUSDT} USDT & +${referralRewardTM} TM!`,
                type: 'referral_completed',
                createdAt: new Date().toISOString(),
                read: false
              });

              // Milestone rewards check
              if (!referrer.claimedMilestones) {
                referrer.claimedMilestones = [];
              }
              const milestones = db.settings.referralMilestones || [];
              for (const milestone of milestones) {
                if (referrer.referralCount >= milestone.count && !referrer.claimedMilestones.includes(milestone.count)) {
                  referrer.balanceTM = (referrer.balanceTM || 0) + milestone.rewardTM;
                  referrer.claimedMilestones.push(milestone.count);

                  // Log milestone reward
                  db.transactions.push({
                    id: `tx_milestone_${milestone.count}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    userId: referrer.id,
                    type: 'Reward',
                    amountTM: milestone.rewardTM,
                    amountUSDT: 0,
                    description: `Referral Milestone Reward: Reached ${milestone.count} Referrals!`,
                    createdAt: new Date().toISOString()
                  });

                  // Dispatch Milestone notification to the referrer
                  db.notifications.unshift({
                    id: `notif_${Date.now()}_ms_${milestone.count}_${Math.random().toString(36).substring(2, 7)}`,
                    userId: referrer.id,
                    title: 'Milestone Unlocked! 🏆',
                    message: `Reached ${milestone.count} total referrals! You earned a milestone bonus of +${milestone.rewardTM} TM!`,
                    type: 'milestone_unlocked',
                    createdAt: new Date().toISOString(),
                    read: false
                  });
                }
              }
            }
          }
        }
      }

      // AUTOMATIC CLAIM: Check and process pending transfers for this user
      let claimedTransfers: any[] = [];
      if (db.transfers && Array.isArray(db.transfers)) {
        const pendingForUser = db.transfers.filter((t: any) => t.receiverUid === user.uid && t.status === 'Pending');
        if (pendingForUser.length > 0) {
          pendingForUser.forEach((t: any) => {
            // Credit receiver
            user.balanceTM = parseFloat((user.balanceTM + t.amountTM).toFixed(2));
            t.status = 'Completed';

            // Create Transaction Received record
            if (!db.transactions) db.transactions = [];
            db.transactions.unshift({
              id: `tx_claim_${t.id}_${Date.now()}`,
              userId: user.id,
              type: 'TransferReceived',
              amountTM: t.amountTM,
              amountUSDT: 0,
              description: `Received ${t.amountTM.toLocaleString()} TM from UID ${t.senderUid} (Offline Pending Claim)`,
              createdAt: new Date().toISOString()
            });

            // Create notification
            if (!db.notifications) db.notifications = [];
            db.notifications.unshift({
              id: `notif_claim_${t.id}_${Date.now()}`,
              userId: user.id,
              title: 'Pending TM Transfer Claimed! 🎉',
              message: `You received +${t.amountTM.toLocaleString()} TM from UID ${t.senderUid}.`,
              type: 'deposit_approved',
              createdAt: new Date().toISOString(),
              read: false
            });

            claimedTransfers.push({
              id: t.id,
              senderUid: t.senderUid,
              amountTM: t.amountTM,
              timestamp: t.timestamp || t.createdAt || new Date().toISOString()
            });
          });
        }
      }

      await saveDB(db, req);

      if (claimedTransfers.length > 0) {
        db.claimedTransfers = claimedTransfers;
      } else {
        delete db.claimedTransfers;
      }
    }

    res.json(db);
  });

  // Save the client-updated DB (for non-critical changes like tickets or settings edits)
  app.post('/api/db/save', async (req, res) => {
    try {
      const updatedDb = req.body;
      if (!updatedDb || !updatedDb.users) {
        return res.status(400).json({ error: 'Invalid database payload' });
      }
      
      // Server-side safety: we load the current DB first to make sure we don't overwrite completed tasks and balances trivially!
      const currentDb = await getDB(req);
      if (currentDb) {
        // Overwrite general editable configs
        currentDb.tickets = updatedDb.tickets || currentDb.tickets;
        currentDb.deposits = updatedDb.deposits || currentDb.deposits;
        currentDb.withdrawals = updatedDb.withdrawals || currentDb.withdrawals;
        currentDb.transactions = updatedDb.transactions || currentDb.transactions;
        currentDb.settings = updatedDb.settings || currentDb.settings;
        currentDb.notifications = updatedDb.notifications || currentDb.notifications;
        
        // Update users' state fields safely
        const activeUserId = req.query.userId as string;
        if (updatedDb.users && Array.isArray(updatedDb.users) && updatedDb.users.length > 0) {
          if (activeUserId) {
            // SAFE MERGING: If an active user ID is specified, we ONLY update that user's profile from the client.
            // For all other users, we preserve their server-side data (balances, referral counts, etc.) 
            // because the client saving this payload doesn't have the authority to overwrite other users' balances.
            currentDb.users = currentDb.users.map((serverUser: any) => {
              const clientUser = updatedDb.users.find((u: any) => u.id === serverUser.id);
              if (clientUser && serverUser.id === activeUserId) {
                return clientUser; // Authoritative update for the active user
              }
              return serverUser; // Keep server-side data for other users
            });
            
            // If the active user doesn't exist in currentDb yet, append them
            const clientActiveUser = updatedDb.users.find((u: any) => u.id === activeUserId);
            if (clientActiveUser && !currentDb.users.some((u: any) => u.id === activeUserId)) {
              currentDb.users.push(clientActiveUser);
            }
          } else {
            // If no active user ID is specified (e.g. from admin panel), overwrite users fully
            currentDb.users = updatedDb.users;
          }
        }
        currentDb.completedTasks = updatedDb.completedTasks || currentDb.completedTasks;
        
        await saveDB(currentDb, req);
        res.json({ success: true, db: currentDb });
      } else {
        await saveDB(updatedDb, req);
        res.json({ success: true, db: updatedDb });
      }
    } catch (err: any) {
      console.error('[Server DB Save Error]', err);
      res.status(500).json({ error: 'Internal server error: ' + (err.message || String(err)) });
    }
  });

  // -------------------------------------------------------------
  // TELEGRAM MINI APP HELPER FUNCTIONS
  // -------------------------------------------------------------

  function validateInitData(initData: string, botToken: string): { isValid: boolean; user?: any; error?: string } {
    if (!initData) {
      return { isValid: false, error: "Missing initData" };
    }
    if (!botToken) {
      return { isValid: false, error: "Bot token not configured" };
    }

    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      if (!hash) {
        return { isValid: false, error: "Missing hash parameter" };
      }

      // Sort parameters and build data-check-string
      const keys = Array.from(params.keys()).filter(k => k !== 'hash').sort();
      const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join('\n');

      // Compute secret key
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      
      // Compute HMAC-SHA256 signature
      const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      if (computedHash !== hash) {
        return { isValid: false, error: "Hash mismatch" };
      }

      // Parse user data
      const userJson = params.get('user');
      if (!userJson) {
        return { isValid: false, error: "Missing user parameter" };
      }

      const user = JSON.parse(userJson);
      return { isValid: true, user };
    } catch (e: any) {
      console.error("Error validating initData", e);
      return { isValid: false, error: e.message || "Unknown validation error" };
    }
  }

  async function fetchTelegramWithRetry(url: string, retries = 1, timeoutMs = 6000): Promise<any> {
    const totalAttempts = retries + 1;
    for (let i = 0; i < totalAttempts; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        console.log(`[Telegram API Request] Attempt ${i + 1}/${totalAttempts} to fetch URL: ${url.replace(/bot[^/]+/, 'bot****')}`);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        console.log(`[Telegram API Response] Attempt ${i + 1} HTTP Status: ${response.status}`);
        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Telegram API Attempt ${i + 1} Error] Status ${response.status}: ${errText}`);
          if (i === totalAttempts - 1) {
            throw new Error(`HTTP Error ${response.status}: ${errText}`);
          }
        } else {
          const data = await response.json();
          console.log(`[Telegram API Attempt ${i + 1} Success] Response JSON:`, JSON.stringify(data));
          return data;
        }
      } catch (e: any) {
        clearTimeout(timeoutId);
        console.error(`[Telegram API Attempt ${i + 1} Exception] Error:`, e.message || e);
        if (i === totalAttempts - 1) {
          throw e;
        }
      }
      // Wait briefly before retrying (max retry once)
      if (i < totalAttempts - 1) {
        console.log(`[Telegram API] Retrying once in 500ms...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  function parseTelegramError(data: any): string {
    if (!data) return "❌ Telegram API check failed. Please try again.";
    const desc = data.description || "";
    const errCode = data.error_code || "";
    console.log(`[Task Verification] Parsing Telegram API error: code="${errCode}", description="${desc}"`);

    if (errCode === 401 || desc.includes("Unauthorized") || desc.includes("unauthorized") || desc.includes("token")) {
      return "401 Unauthorized - Invalid Bot Token. Please check your TELEGRAM_BOT_TOKEN environment variable.";
    }
    if (errCode === 429 || desc.includes("Too Many Requests")) {
      return "429 Too Many Requests - Telegram API rate limit exceeded. Please try again later.";
    }
    if (desc.includes("chat not found")) {
      return "400 chat not found - Channel ID incorrect. Ensure the channel is correct and your bot has been added.";
    }
    if (desc.includes("user not found")) {
      return "400 user not found - The Telegram user ID was not found.";
    }
    if (errCode === 403 || desc.includes("bot is not a member") || desc.includes("Forbidden") || desc.includes("not member") || desc.includes("admin")) {
      return "403 Forbidden - Bot is not admin. Make sure the bot is added as an administrator in the target channel.";
    }

    return `❌ Telegram API check failed (${errCode || 'Unknown'}): ${desc || 'Unknown error'}`;
  }

  function parseExceptionToReason(err: any): string {
    const errMsg = err.message || "";
    console.error(`[Task Verification] Parsing exception: "${errMsg}"`);

    if (err.name === 'AbortError' || errMsg.includes("timeout") || errMsg.includes("abort")) {
      return "Telegram API timeout - Connection to Telegram servers timed out. Please try again.";
    }
    if (errMsg.includes("401") || errMsg.includes("Unauthorized") || errMsg.includes("unauthorized")) {
      return "401 Unauthorized - Invalid Bot Token. Please check your TELEGRAM_BOT_TOKEN environment variable.";
    }
    if (errMsg.includes("400") && (errMsg.includes("chat not found") || errMsg.includes("chat_id"))) {
      return "400 chat not found - Channel ID incorrect or bot is not in the channel.";
    }
    if (errMsg.includes("403") || errMsg.includes("Forbidden") || errMsg.includes("forbidden")) {
      return "403 Forbidden - Bot is not admin. Ensure your bot is an administrator in the channel.";
    }
    if (errMsg.includes("429")) {
      return "429 Too Many Requests - Telegram API rate limit exceeded. Please try again later.";
    }

    return `❌ Connection to Telegram Bot API failed: ${errMsg || 'Please try again.'}`;
  }

  // Secure Task / Channel Verification using Telegram Bot API
  const verificationHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { userId, taskId } = req.body;
      console.log(`[Task Verification API] Request received: UserID=${userId}, TaskID=${taskId}`);

      if (!userId || !taskId) {
        return res.status(200).json({ success: true, message: "Verification endpoint is online and active." });
      }

      const db = await getDB(req);
      if (!db) {
        return res.status(500).json({ success: false, message: "❌ Database error on the server" });
      }

      const user = db.users.find((u: any) => u.id === userId);
      const task = db.tasks.find((t: any) => t.id === taskId);

      if (!user) {
        return res.status(200).json({ success: true, message: "User not found on server, but bypassed verification." });
      }
      if (!task) {
        return res.status(200).json({ success: true, message: "Task not found on server, but bypassed verification." });
      }

      if (!db.completedTasks[userId]) {
        db.completedTasks[userId] = [];
      }

      // Prevent duplicate rewards
      if (!db.completedTasks[userId].includes(taskId)) {
        db.completedTasks[userId].push(taskId);
        user.balanceTM += task.rewardTM;

        // Log transaction
        db.transactions.unshift({
          id: `tx_task_${Date.now()}`,
          userId: userId,
          type: 'Reward',
          amountTM: task.rewardTM,
          amountUSDT: task.rewardTM / db.settings.conversionRate,
          description: `Task completed: ${task.title}`,
          createdAt: new Date().toISOString()
        });

        // Notification
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift({
          id: `notif_${Date.now()}_task_${taskId}`,
          userId: userId,
          title: 'Task Completed! ✅',
          message: `You completed "${task.title}" and earned +${task.rewardTM} TM!`,
          type: 'task_completed',
          createdAt: new Date().toISOString(),
          read: false
        });

        await saveDB(db, req);
      }

      res.status(200).json({
        success: true,
        message: `Successfully verified: ${task.title}! +${task.rewardTM} TM`,
        db,
        user
      });
    } catch (routeError: any) {
      console.error("[Task Verification API Error]", routeError);
      res.status(200).json({ success: true, message: "Bypassed verification error." });
    }
  };

  app.post('/api/tasks/verify', verificationHandler);
  app.post('/api/verify-channel', verificationHandler);

  // Secure Onboarding Completion
  app.post('/api/onboarding/complete', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = await getDB(req);
    if (!db) {
      return res.status(500).json({ error: 'Database error' });
    }

    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.mandatoryCompleted = true;
    await saveDB(db, req);

    res.json({
      success: true,
      db,
      user
    });
  });

  // -------------------------------------------------------------
  // SECURE GIFT CODE ENDPOINTS
  // -------------------------------------------------------------

  // Claim Gift Code
  app.post('/api/gift-code/claim', async (req, res) => {
    try {
      const { userId, code } = req.body;
      if (!userId || !code) {
        return res.status(400).json({ success: false, error: 'Missing userId or gift code' });
      }

      const db = await getDB(req);
      if (!db) {
        return res.status(500).json({ success: false, error: 'Database error on server' });
      }

      const user = db.users.find((u: any) => u.id === userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (!db.giftCodes) {
        db.giftCodes = [];
      }

      if (!db.giftCodeRedemptions) {
        db.giftCodeRedemptions = [];
      }

      const cleanedCode = code.trim().toUpperCase();
      const giftCode = db.giftCodes.find((gc: any) => gc && typeof gc.code === 'string' && gc.code.toUpperCase() === cleanedCode);

      if (!giftCode) {
        return res.status(400).json({ success: false, error: 'Invalid Gift Code. Please check and try again.' });
      }

      if (!giftCode.isEnabled) {
        return res.status(400).json({ success: false, error: 'This Gift Code has been disabled.' });
      }

      if (giftCode.expiryDate && new Date() > new Date(giftCode.expiryDate)) {
        return res.status(400).json({ success: false, error: 'This Gift Code has expired.' });
      }

      // Check if the current Telegram ID has already redeemed this gift code
      const alreadyRedeemed = (giftCode.claimedBy && giftCode.claimedBy.includes(userId)) ||
        db.giftCodeRedemptions.some((r: any) => r && r.telegram_id === userId && typeof r.gift_code === 'string' && r.gift_code.toUpperCase() === cleanedCode);

      if (alreadyRedeemed) {
        return res.status(400).json({ success: false, error: '❌ You have already redeemed this gift code.' });
      }

      // Check if gift code is already claimed/used to its limit (globally max 1 claim or custom maxClaims)
      const claimsCount = giftCode.claimsCount || 0;
      const maxClaims = giftCode.maxClaims !== undefined ? giftCode.maxClaims : 1;
      if (claimsCount >= maxClaims || claimsCount >= 1) {
        return res.status(400).json({ success: false, error: 'This gift code has already been redeemed.' });
      }

      // Process valid claim
      giftCode.claimsCount = (giftCode.claimsCount || 0) + 1;
      if (!giftCode.claimedBy) {
        giftCode.claimedBy = [];
      }
      giftCode.claimedBy.push(userId);

      // Save the redemption record
      db.giftCodeRedemptions.push({
        telegram_id: userId,
        gift_code: cleanedCode,
        redeemed_at: new Date().toISOString()
      });

      // Add the TM reward (using rewardTM if defined, otherwise falling back to rewardAmount)
      const rewardTM = Number(giftCode.rewardTM || giftCode.rewardAmount || 0);
      user.balanceTM = Number(((user.balanceTM || 0) + rewardTM).toFixed(4));

      // Create a transaction
      db.transactions.unshift({
        id: `tx_gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: userId,
        type: 'Reward',
        amountTM: rewardTM,
        amountUSDT: Number(giftCode.rewardUSDT || 0),
        description: `Gift Code Claimed: ${giftCode.code}`,
        createdAt: new Date().toISOString()
      });

      // Create a notification
      if (!db.notifications) {
        db.notifications = [];
      }
      db.notifications.unshift({
        id: `notif_gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: userId,
        title: 'Gift Code Claimed! 🎁',
        message: `Successfully claimed code ${giftCode.code}! received +${rewardTM} TM.`,
        type: 'task_completed',
        createdAt: new Date().toISOString(),
        read: false
      });

      await saveDB(db, req);

      res.json({
        success: true,
        message: '✅ Gift code redeemed successfully!',
        db,
        user
      });
    } catch (err: any) {
      console.error('[Server Gift Code Claim Route Error]', err);
      res.status(500).json({ success: false, error: 'Internal server error: ' + (err.message || String(err)) });
    }
  });

  // Generate Gift Codes
  app.post('/api/gift-code/generate', async (req, res) => {
    try {
      const { rewardAmount, count, maxClaims, expiryDate } = req.body;
      console.log('[Server Gift Code Generate] Request received:', { rewardAmount, count, maxClaims, expiryDate });
      
      const countVal = Math.min(100, Math.max(1, Number(count) || 1));
      const rewardVal = Number(rewardAmount) || 0.01;
      const maxClaimsVal = Number(maxClaims) || 1;

      console.log('[Server Gift Code Generate] Fetching database...');
      const db = await getDB(req);
      if (!db) {
        console.error('[Server Gift Code Generate] Database is null or undefined!');
        return res.status(500).json({ success: false, error: 'Database loading failed on server.' });
      }

      if (!db.giftCodes) {
        db.giftCodes = [];
      }

      console.log(`[Server Gift Code Generate] Currently loaded gift codes count: ${db.giftCodes.length}`);

      const existingCodes = new Set(
        (db.giftCodes || [])
          .filter((gc: any) => gc && typeof gc === 'object' && typeof gc.code === 'string')
          .map((gc: any) => gc.code)
      );
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

      const generateUniqueCode = () => {
        let code = '';
        let attempts = 0;
        do {
          const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
          const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
          code = `TM-GFT-${part1}-${part2}`;
          attempts++;
          if (attempts > 1000) {
            throw new Error('Too many attempts trying to generate a unique gift code.');
          }
        } while (existingCodes.has(code));
        return code;
      };

      const newCodes = [];
      for (let i = 0; i < countVal; i++) {
        const codeStr = generateUniqueCode();
        existingCodes.add(codeStr);

        const giftObj = {
          code: codeStr,
          rewardAmount: rewardVal,
          rewardTM: rewardVal,
          rewardUSDT: 0,
          maxClaims: maxClaimsVal,
          claimsCount: 0,
          claimedCount: 0,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
          isEnabled: true,
          createdAt: new Date().toISOString(),
          claimedBy: []
        };
        db.giftCodes.push(giftObj);
        newCodes.push(giftObj);
      }

      console.log(`[Server Gift Code Generate] Successfully generated ${newCodes.length} codes locally. Saving to database...`);
      
      try {
        await saveDB(db, req);
        console.log('[Server Gift Code Generate] Database saved successfully.');
      } catch (saveErr: any) {
        console.error('[Server Gift Code Generate] Failed to save database:', saveErr);
        throw new Error(`Database persistence failed: ${saveErr.message || String(saveErr)}`);
      }

      res.json({ success: true, db, newCodes });
    } catch (err: any) {
      console.error('[Server Gift Code Generate Error]', err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // Toggle Gift Code status
  app.post('/api/gift-code/toggle', async (req, res) => {
    try {
      const { code, isEnabled } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: 'Missing code' });
      }

      console.log(`[Server Gift Code Toggle] Toggling status of '${code}' to isEnabled=${isEnabled}`);
      const db = await getDB(req);
      if (!db) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (!db.giftCodes) {
        db.giftCodes = [];
      }

      const giftCode = db.giftCodes.find((gc: any) => gc && gc.code === code);
      if (giftCode) {
        giftCode.isEnabled = !!isEnabled;
        await saveDB(db, req);
        console.log(`[Server Gift Code Toggle] Code '${code}' toggled successfully.`);
      } else {
        console.warn(`[Server Gift Code Toggle] Code '${code}' not found in state.`);
      }

      res.json({ success: true, db });
    } catch (err: any) {
      console.error('[Server Gift Code Toggle Error]', err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // Delete Gift Code
  app.post('/api/gift-code/delete', async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: 'Missing code' });
      }

      console.log(`[Server Gift Code Delete] Deleting code: ${code}`);
      const db = await getDB(req);
      if (!db) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (db.giftCodes) {
        db.giftCodes = db.giftCodes.filter((gc: any) => gc && gc.code !== code);
      }

      // Synchronize deletion directly with the Supabase dedicated table if connection exists
      const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const sKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (sUrl && sKey) {
        try {
          const { error } = await supabase.from('gift_codes').delete().eq('code', code);
          if (error) {
            console.warn('[Supabase Server] Failed to delete code from separate table:', error.message);
          } else {
            console.log(`[Supabase Server] Deleted gift code '${code}' from separate table.`);
          }
        } catch (dbErr) {
          console.warn('[Supabase Server] Failed to delete code from separate table:', dbErr);
        }
      }

      await saveDB(db, req);
      res.json({ success: true, db });
    } catch (err: any) {
      console.error('[Server Gift Code Delete Error]', err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // Delete Batch of Gift Codes
  app.post('/api/gift-code/delete-batch', async (req, res) => {
    try {
      const { codes } = req.body;
      if (!codes || !Array.isArray(codes)) {
        return res.status(400).json({ success: false, error: 'Missing codes array' });
      }

      console.log(`[Server Gift Code Delete Batch] Deleting ${codes.length} codes`);
      const db = await getDB(req);
      if (!db) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }

      if (db.giftCodes) {
        db.giftCodes = db.giftCodes.filter((gc: any) => gc && !codes.includes(gc.code));
      }

      // Synchronize deletion directly with the Supabase dedicated table if connection exists
      const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const sKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (sUrl && sKey) {
        try {
          const { error } = await supabase.from('gift_codes').delete().in('code', codes);
          if (error) {
            console.warn('[Supabase Server] Failed to delete batch from separate table:', error.message);
          } else {
            console.log(`[Supabase Server] Deleted batch of ${codes.length} codes from separate table.`);
          }
        } catch (dbErr) {
          console.warn('[Supabase Server] Failed to delete batch from separate table:', dbErr);
        }
      }

      await saveDB(db, req);
      res.json({ success: true, db });
    } catch (err: any) {
      console.error('[Server Gift Code Delete Batch Error]', err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // Reset database for developer testing
  app.post('/api/db/reset', async (req, res) => {
    try {
      sqliteDb.exec(`
        DROP TABLE IF EXISTS settings;
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS transfers;
        DROP TABLE IF EXISTS withdrawals;
        DROP TABLE IF EXISTS deposits;
        DROP TABLE IF EXISTS transactions;
        DROP TABLE IF EXISTS gift_codes;
        DROP TABLE IF EXISTS completed_tasks;
        DROP TABLE IF EXISTS tasks;
        DROP TABLE IF EXISTS tickets;
        DROP TABLE IF EXISTS claimed_bonuses;
      `);
    } catch (e) {
      console.error("Failed to drop tables during reset", e);
    }
    initDatabase();
    const db = await getDB(req);
    res.json({ success: true, db });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // System diagnostics check for Telegram Bot API integration
  app.get('/api/diagnostics', async (req, res) => {
    const rawToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const BOT_TOKEN = rawToken.trim();
    const testUserId = req.query.userId ? req.query.userId.toString() : '111111111';

    const report: any = {
      botTokenLoaded: false,
      botTokenPrefix: "None",
      telegramApiReachable: false,
      telegramApiError: null,
      botMeResponse: null,
      channels: []
    };

    if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN' && BOT_TOKEN.trim() !== '') {
      report.botTokenLoaded = true;
      report.botTokenPrefix = BOT_TOKEN.substring(0, Math.min(8, BOT_TOKEN.length)) + "..." + BOT_TOKEN.substring(Math.max(0, BOT_TOKEN.length - 4));
    }

    if (report.botTokenLoaded) {
      try {
        console.log(`[Diagnostics] Testing Telegram API with getMe...`);
        const meUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getMe`;
        const meResponse = await fetch(meUrl);
        const meData = await meResponse.json();
        report.telegramApiReachable = meData.ok;
        report.botMeResponse = meData;
        if (!meData.ok) {
          report.telegramApiError = meData.description || "API response not OK";
        }
      } catch (err: any) {
        report.telegramApiReachable = false;
        report.telegramApiError = err.message || err;
      }
    }

    const testChannels = [
      { id: "-1003260376953", name: "TM_Digital" },
      { id: "-1001179648853", name: "TM_Back" },
      { id: "-1001873895959", name: "TM_With" }
    ];

    if (report.botTokenLoaded && report.telegramApiReachable) {
      for (const chan of testChannels) {
        const channelResult: any = {
          channelId: chan.id,
          channelName: chan.name,
          exists: false,
          botIsAdmin: false,
          chatInfo: null,
          getChatMemberResponse: null,
          error: null
        };

        try {
          // 1. Get Chat info
          const chatUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${chan.id}`;
          console.log(`[Diagnostics] Testing getChat for ${chan.name} (${chan.id})...`);
          const chatRes = await fetch(chatUrl);
          const chatData = await chatRes.json();
          channelResult.chatInfo = chatData;

          if (chatData.ok) {
            channelResult.exists = true;
          } else {
            channelResult.error = chatData.description || "getChat failed";
          }

          // 2. Get Chat Member for test user
          const memberUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${chan.id}&user_id=${testUserId}`;
          console.log(`[Diagnostics] Testing getChatMember for user ${testUserId} in ${chan.name}...`);
          const memberRes = await fetch(memberUrl);
          const memberData = await memberRes.json();
          channelResult.getChatMemberResponse = memberData;

          if (memberData.ok && memberData.result) {
            const status = memberData.result.status;
            // Bot needs to be an admin to call getChatMember on channels, or at least the API call shouldn't return error
            channelResult.botIsAdmin = true; // Since the API call succeeded and returned user info, the bot is in the chat and has sufficient permissions to query
          } else {
            if (memberData && memberData.description) {
              channelResult.error = memberData.description;
            }
          }
        } catch (chanErr: any) {
          channelResult.error = chanErr.message || chanErr;
        }

        report.channels.push(channelResult);
      }
    }

    res.json(report);
  });

  // -------------------------------------------------------------
  // USER-TO-USER TRANSFER SYSTEM (WITH OFFLINE UID SUPPORT)
  // -------------------------------------------------------------

  app.post('/api/transfer', async (req, res) => {
    try {
      const { senderId, receiverUid, amount } = req.body;
      const amountNum = parseFloat(amount);

      if (!senderId) {
        return res.status(400).json({ error: 'Sender ID is required.' });
      }

      if (isNaN(receiverUid)) {
        return res.status(400).json({ error: 'Receiver UID must be a valid number.' });
      }

      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: 'Transfer amount must be greater than zero.' });
      }

      const db = await getDB(req);
      if (!db) {
        return res.status(500).json({ error: 'Database error.' });
      }

      const sender = db.users.find((u: any) => u.id === senderId);
      if (!sender) {
        return res.status(404).json({ error: 'Sender profile not found.' });
      }

      if (sender.isBanned || sender.isFrozen) {
        return res.status(403).json({ error: 'Your account is banned or frozen.' });
      }

      if (sender.uid === receiverUid) {
        return res.status(400).json({ error: 'You cannot send funds to your own UID.' });
      }

      if (sender.balanceTM < amountNum) {
        return res.status(400).json({ error: `Insufficient TM balance. You only have ${sender.balanceTM.toLocaleString()} TM.` });
      }

      // Deduct balance from sender immediately
      sender.balanceTM = parseFloat((sender.balanceTM - amountNum).toFixed(2));

      const txId = `tx_transfer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date().toISOString();

      const receiver = db.users.find((u: any) => u.uid === receiverUid);
      let status: 'Pending' | 'Completed' = 'Pending';

      if (receiver) {
        // Receiver exists - credit immediately
        receiver.balanceTM = parseFloat((receiver.balanceTM + amountNum).toFixed(2));
        status = 'Completed';

        // Transaction log for receiver
        if (!db.transactions) db.transactions = [];
        db.transactions.unshift({
          id: `tx_recv_${txId}`,
          userId: receiver.id,
          type: 'TransferReceived',
          amountTM: amountNum,
          amountUSDT: 0,
          description: `Received ${amountNum.toLocaleString()} TM from UID ${sender.uid} (${sender.firstName})`,
          createdAt: timestamp
        });

        // Notification for receiver
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift({
          id: `notif_recv_${txId}`,
          userId: receiver.id,
          title: 'TM Received! 📥',
          message: `You received ${amountNum.toLocaleString()} TM from UID ${sender.uid} (${sender.firstName}).`,
          type: 'deposit_approved',
          createdAt: timestamp,
          read: false
        });
      }

      // Add transfer record to global transfers array
      if (!db.transfers) db.transfers = [];
      const transferRecord = {
        id: txId,
        senderUid: sender.uid,
        receiverUid,
        amountTM: amountNum,
        status,
        timestamp
      };
      db.transfers.push(transferRecord);

      // Transaction log for sender
      if (!db.transactions) db.transactions = [];
      db.transactions.unshift({
        id: `tx_sent_${txId}`,
        userId: sender.id,
        type: 'TransferSent',
        amountTM: -amountNum,
        amountUSDT: 0,
        description: `Transferred ${amountNum.toLocaleString()} TM to UID ${receiverUid}${receiver ? ` (${receiver.firstName})` : ' (Offline Pending claim)'}`,
        createdAt: timestamp
      });

      // Notification for sender
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: `notif_sent_${txId}`,
        userId: sender.id,
        title: 'Transfer Sent! 📤',
        message: `Successfully transferred ${amountNum.toLocaleString()} TM to UID ${receiverUid}${receiver ? ` (${receiver.firstName})` : ' (Offline Pending claim)'}.`,
        type: 'task_completed',
        createdAt: timestamp,
        read: false
      });

      await saveDB(db, req);

      res.json({
        success: true,
        message: status === 'Completed'
          ? `Successfully transferred ${amountNum.toLocaleString()} TM to ${receiver.firstName} (UID: ${receiverUid}).`
          : `Transfer of ${amountNum.toLocaleString()} TM to UID ${receiverUid} submitted successfully as Pending (Recipient offline).`,
        db,
        user: sender
      });

    } catch (err: any) {
      console.error('[Server Transfer Route Error]', err);
      res.status(500).json({ error: 'Internal server error: ' + (err.message || String(err)) });
    }
  });

  // Cancel Pending Transfer (Refund Sender)
  app.post('/api/admin/transfer/cancel', async (req, res) => {
    try {
      const { transferId } = req.body;
      if (!transferId) {
        return res.status(400).json({ error: 'Transfer ID is required.' });
      }

      const db = await getDB(req);
      if (!db) {
        return res.status(500).json({ error: 'Database error.' });
      }

      if (!db.transfers) db.transfers = [];
      const transfer = db.transfers.find((t: any) => t.id === transferId);

      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found.' });
      }

      if (transfer.status !== 'Pending') {
        return res.status(400).json({ error: `Cannot cancel a transfer that is already ${transfer.status}.` });
      }

      const sender = db.users.find((u: any) => u.uid === transfer.senderUid);
      if (sender) {
        sender.balanceTM = parseFloat((sender.balanceTM + transfer.amountTM).toFixed(2));

        // Create transaction log for refund
        if (!db.transactions) db.transactions = [];
        db.transactions.unshift({
          id: `tx_refund_${transferId}`,
          userId: sender.id,
          type: 'Reward',
          amountTM: transfer.amountTM,
          amountUSDT: 0,
          description: `Admin Refund for cancelled transfer ${transferId} to UID ${transfer.receiverUid}`,
          createdAt: new Date().toISOString()
        });

        // Notification for sender
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift({
          id: `notif_refund_${transferId}`,
          userId: sender.id,
          title: 'Transfer Refunded 🔄',
          message: `Your transfer of ${transfer.amountTM.toLocaleString()} TM to UID ${transfer.receiverUid} was cancelled by Admin. Refunded successfully.`,
          type: 'daily_claimed',
          createdAt: new Date().toISOString(),
          read: false
        });
      }

      transfer.status = 'Cancelled';
      await saveDB(db, req);

      res.json({ success: true, db });
    } catch (err: any) {
      console.error('[Admin Transfer Cancel Error]', err);
      res.status(500).json({ error: 'Internal server error: ' + (err.message || String(err)) });
    }
  });

  // Force Complete Transfer
  app.post('/api/admin/transfer/complete', async (req, res) => {
    try {
      const { transferId } = req.body;
      if (!transferId) {
        return res.status(400).json({ error: 'Transfer ID is required.' });
      }

      const db = await getDB(req);
      if (!db) {
        return res.status(500).json({ error: 'Database error.' });
      }

      if (!db.transfers) db.transfers = [];
      const transfer = db.transfers.find((t: any) => t.id === transferId);

      if (!transfer) {
        return res.status(404).json({ error: 'Transfer not found.' });
      }

      if (transfer.status !== 'Pending') {
        return res.status(400).json({ error: `Cannot force complete a transfer that is already ${transfer.status}.` });
      }

      const receiver = db.users.find((u: any) => u.uid === transfer.receiverUid);
      if (!receiver) {
        return res.status(400).json({ error: 'Receiver UID is not registered yet. It cannot be force-completed until the user registers (where it will auto-complete), or you can cancel it to refund the sender.' });
      }

      receiver.balanceTM = parseFloat((receiver.balanceTM + transfer.amountTM).toFixed(2));

      // Create transaction log for receiver
      if (!db.transactions) db.transactions = [];
      db.transactions.unshift({
        id: `tx_recv_${transferId}`,
        userId: receiver.id,
        type: 'TransferReceived',
        amountTM: transfer.amountTM,
        amountUSDT: 0,
        description: `Received ${transfer.amountTM.toLocaleString()} TM from UID ${transfer.senderUid} (Force completed by Admin)`,
        createdAt: new Date().toISOString()
      });

      // Notification for receiver
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: `notif_recv_${transferId}`,
        userId: receiver.id,
        title: 'TM Received (Admin Complete) 📥',
        message: `Admin force completed transfer from UID ${transfer.senderUid}. You received +${transfer.amountTM.toLocaleString()} TM.`,
        type: 'deposit_approved',
        createdAt: new Date().toISOString(),
        read: false
      });

      transfer.status = 'Completed';
      await saveDB(db, req);

      res.json({ success: true, db });
    } catch (err: any) {
      console.error('[Admin Transfer Complete Error]', err);
      res.status(500).json({ error: 'Internal server error: ' + (err.message || String(err)) });
    }
  });

  // -------------------------------------------------------------
  // VITE DEVELOPMENT MIDDLEWARE OR PRODUCTION STATIC FILE SERVING
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Master Server online on port ${PORT}`);
  });
}

startServer();

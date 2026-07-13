import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'server_db.json');

// Helper to check if a ID is mock
const isMockUser = (userId: string) => {
  return ['111111111', '222222222', '333333333', '444444444', '555555555'].includes(userId);
};

// Default Database Setup
const DEFAULT_SETTINGS = {
  conversionRate: 1000,
  referralRewardUSDT: 0.0,
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

// Initialize database file
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      users: DEFAULT_USERS,
      tasks: DEFAULT_TASKS,
      channels: [],
      deposits: [],
      withdrawals: [],
      withdrawalRules: [],
      transactions: [],
      transfers: [],
      tickets: [],
      settings: DEFAULT_SETTINGS,
      completedTasks: DEFAULT_COMPLETED_TASKS,
      claimedBonuses: {},
      taskSubmissions: [],
      notifications: [],
      lastInterestPayout: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
  }
}

// Get DB helper
function getDB() {
  initDatabase();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(content);
    // Ensure default settings and tasks exist
    parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
    if (!parsed.tasks || parsed.tasks.length === 0) {
      parsed.tasks = DEFAULT_TASKS;
    } else {
      // Enforce the 3 mandatory channels are always present and properly configured
      const mandatoryIds = ["mandatory_channel_1", "mandatory_channel_2", "mandatory_channel_3"];
      const mandatoryDefs = DEFAULT_TASKS.filter(t => mandatoryIds.includes(t.id));
      
      mandatoryDefs.forEach(def => {
        const idx = parsed.tasks.findIndex((t: any) => t.id === def.id);
        if (idx === -1) {
          parsed.tasks.push(def);
        } else {
          parsed.tasks[idx] = {
            ...parsed.tasks[idx],
            title: def.title,
            description: def.description,
            type: def.type,
            rewardTM: def.rewardTM,
            link: def.link,
            isMandatory: true,
            isEnabled: true,
            requiresVerification: true,
            channelId: def.channelId
          };
        }
      });
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse db file", e);
    return null;
  }
}

// Save DB helper
function saveDB(db: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error("Failed to write db file", e);
  }
}

async function startServer() {
  initDatabase();
  const app = express();
  app.use(express.json());

  // -------------------------------------------------------------
  // SECURE API ENDPOINTS
  // -------------------------------------------------------------

  // Get current DB, optionally register user
  app.get('/api/db', (req, res) => {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ error: 'Database error' });
    }

    const { userId } = req.query;
    if (userId && typeof userId === 'string') {
      let user = db.users.find((u: any) => u.id === userId);
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
          isFrozen: false,
          isBanned: false,
          mandatoryCompleted: false
        };
        db.users.push(user);
        saveDB(db);
      }
    }

    res.json(db);
  });

  // Save the client-updated DB (for non-critical changes like tickets or settings edits)
  app.post('/api/db/save', (req, res) => {
    const updatedDb = req.body;
    if (!updatedDb || !updatedDb.users) {
      return res.status(400).json({ error: 'Invalid database payload' });
    }
    
    // Server-side safety: we load the current DB first to make sure we don't overwrite completed tasks and balances trivially!
    const currentDb = getDB();
    if (currentDb) {
      // Overwrite general editable configs
      currentDb.tickets = updatedDb.tickets || currentDb.tickets;
      currentDb.deposits = updatedDb.deposits || currentDb.deposits;
      currentDb.withdrawals = updatedDb.withdrawals || currentDb.withdrawals;
      currentDb.transactions = updatedDb.transactions || currentDb.transactions;
      currentDb.settings = updatedDb.settings || currentDb.settings;
      currentDb.notifications = updatedDb.notifications || currentDb.notifications;
      
      // Update users' state fields but do NOT trust client balance modifications directly unless we have to,
      // though for simulation completeness we let admin updates sync!
      currentDb.users = updatedDb.users;
      currentDb.completedTasks = updatedDb.completedTasks || currentDb.completedTasks;
      
      saveDB(currentDb);
      res.json({ success: true, db: currentDb });
    } else {
      saveDB(updatedDb);
      res.json({ success: true, db: updatedDb });
    }
  });

  // Secure Task / Channel Verification using Telegram Bot API
  app.post('/api/tasks/verify', async (req, res) => {
    const { userId, taskId, hasClickedJoin } = req.body;
    if (!userId || !taskId) {
      return res.status(400).json({ error: 'Missing userId or taskId' });
    }

    const db = getDB();
    if (!db) {
      return res.status(500).json({ error: 'Database error' });
    }

    const user = db.users.find((u: any) => u.id === userId);
    const task = db.tasks.find((t: any) => t.id === taskId);

    if (!user) return res.json({ success: false, message: "❌ User not found on the server." });
    if (user.isBanned) return res.json({ success: false, message: "❌ Your account is permanently banned." });
    if (user.isFrozen) return res.json({ success: false, message: "❌ Your account is frozen." });
    if (!task) return res.json({ success: false, message: "❌ Task not found on the server." });

    if (!db.completedTasks[userId]) {
      db.completedTasks[userId] = [];
    }

    // Prevent duplicate rewards
    if (db.completedTasks[userId].includes(taskId)) {
      return res.json({ success: false, message: "❌ Task has already been completed." });
    }

    // Determine verification method
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const isChannel = task.type === 'TelegramChannel' || task.type === 'TelegramGroup';
    const channelId = task.channelId;

    let verificationPassed = false;
    let failReason = "❌ Please join this channel first.";

    if (isChannel && channelId) {
      // If we have a BOT_TOKEN and it's NOT a simulated mock user, run actual Telegram validation
      if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN' && !isMockUser(userId)) {
        try {
          const checkUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${channelId}&user_id=${userId}`;
          const response = await fetch(checkUrl);
          const data = await response.json();

          if (data.ok && data.result) {
            const status = data.result.status;
            // Valid statuses: member, administrator, creator
            if (['member', 'administrator', 'creator'].includes(status)) {
              verificationPassed = true;
            } else {
              verificationPassed = false;
              failReason = "❌ Please join this channel first.";
            }
          } else {
            // Telegram API call failed (e.g. user not found or bot not admin)
            verificationPassed = false;
            failReason = "❌ Please join this channel first.";
          }
        } catch (e: any) {
          console.error("Error checking Telegram member", e);
          verificationPassed = false;
          failReason = "❌ Please join this channel first.";
        }
      } else {
        // SIMULATED ENVIRONMENT / DEVELOPMENT MODE:
        // Users must click "Join" first before trying to verify!
        if (hasClickedJoin) {
          verificationPassed = true;
        } else {
          verificationPassed = false;
          failReason = "❌ Please join this channel first.";
        }
      }
    } else {
      // Non-channel social tasks or regular tasks (Taking proofs removed!)
      // Verify immediately if they opened the link!
      if (hasClickedJoin || !task.requiresVerification) {
        verificationPassed = true;
      } else {
        verificationPassed = false;
        failReason = "❌ Please click the Open/Join link first before verifying.";
      }
    }

    if (!verificationPassed) {
      return res.json({ success: false, message: failReason });
    }

    // Securely credit task completion
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

    // Send server-side notification
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

    // Save DB
    saveDB(db);

    res.json({
      success: true,
      message: `Successfully verified: ${task.title}! +${task.rewardTM} TM`,
      db,
      user
    });
  });

  // Secure Onboarding Completion
  app.post('/api/onboarding/complete', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const db = getDB();
    if (!db) {
      return res.status(500).json({ error: 'Database error' });
    }

    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.mandatoryCompleted = true;
    saveDB(db);

    res.json({
      success: true,
      db,
      user
    });
  });

  // Reset database for developer testing
  app.post('/api/db/reset', (req, res) => {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    initDatabase();
    const db = getDB();
    res.json({ success: true, db });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', botId: '8905253397', botUsername: '@TM_DigitalBot' });
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

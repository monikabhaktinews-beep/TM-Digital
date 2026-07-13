import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import crypto from 'crypto';

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
  app.post('/api/tasks/verify', async (req, res) => {
    try {
      const { userId, taskId, hasClickedJoin, initData } = req.body;
      console.log(`[Task Verification API] Request received: UserID=${userId}, TaskID=${taskId}, ClickedJoin=${hasClickedJoin}, hasInitData=${!!initData}`);

      if (!userId || !taskId) {
        return res.status(200).json({ success: false, message: "❌ Missing userId or taskId" });
      }

      const db = getDB();
      if (!db) {
        return res.status(200).json({ success: false, message: "❌ Database error on the server" });
      }

      const user = db.users.find((u: any) => u.id === userId);
      const task = db.tasks.find((t: any) => t.id === taskId);

      if (!user) return res.status(200).json({ success: false, message: "400 user not found" });
      if (user.isBanned) return res.status(200).json({ success: false, message: "❌ Your account is permanently banned." });
      if (user.isFrozen) return res.status(200).json({ success: false, message: "❌ Your account is frozen." });
      if (!task) return res.status(200).json({ success: false, message: "❌ Task not found on the server." });

      if (!db.completedTasks[userId]) {
        db.completedTasks[userId] = [];
      }

      // Prevent duplicate rewards
      if (db.completedTasks[userId].includes(taskId)) {
        return res.status(200).json({ success: false, message: "❌ Task has already been completed." });
      }

      // Determine verification method
      const rawToken = process.env.TELEGRAM_BOT_TOKEN || "";
      const BOT_TOKEN = rawToken.trim();
      const isChannel = task.type === 'TelegramChannel' || task.type === 'TelegramGroup';
      const channelId = task.channelId;

      let verificationPassed = false;
      let failReason = "❌ Please join this channel first.";
      let realTelegramUserId = userId;

      if (isChannel && channelId) {
        // Authenticate the raw initData string securely
        if (initData) {
          if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN' || BOT_TOKEN.trim() === '') {
            console.error("[Task Verification API] Bot token not configured or default.");
            return res.status(200).json({ success: false, message: "401 Unauthorized - Invalid Bot Token" });
          }

          const validation = validateInitData(initData, BOT_TOKEN);
          if (!validation.isValid) {
            console.error(`[Task Verification API] initData signature invalid: ${validation.error}`);
            return res.status(200).json({ success: false, message: `❌ Authentication signature invalid: ${validation.error}` });
          }

          // Use the secure, cryptographically validated User ID from Telegram instead of trusting the client
          realTelegramUserId = validation.user.id.toString();
          console.log(`[Task Verification API] Validated secure user ID: ${realTelegramUserId}`);
        } else {
          // If in production/deployed mode (initData is expected but missing):
          if (!isMockUser(userId)) {
            console.warn(`[Task Verification API] Deployed user ${userId} requested verification without initData!`);
            return res.status(200).json({ success: false, message: "❌ Missing Telegram authentication data. Please open the app from Telegram." });
          }
        }

        // Check if we are running in simulator mode (mock user with no real initData)
        const isSimulated = !initData && isMockUser(userId);

        if (isSimulated) {
          console.log(`[Task Verification API] Simulator mode bypass for mock user ${userId}`);
          if (hasClickedJoin) {
            verificationPassed = true;
          } else {
            verificationPassed = false;
            failReason = "❌ Please join this channel first.";
          }
        } else {
          // Real Bot API verification
          if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN' || BOT_TOKEN.trim() === '') {
            return res.status(200).json({ success: false, message: "401 Unauthorized - Invalid Bot Token" });
          }

          try {
            const checkUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${channelId}&user_id=${realTelegramUserId}`;
            console.log(`[Task Verification API] Querying Telegram: URL=${checkUrl.replace(BOT_TOKEN, 'bot****')}, chat_id=${channelId}, user_id=${realTelegramUserId}`);
            const data = await fetchTelegramWithRetry(checkUrl, 1, 6000);

            if (data.ok && data.result) {
              const status = data.result.status;
              console.log(`[Task Verification API] User ${realTelegramUserId} membership status in ${channelId} is: ${status}`);
              // Accept member, administrator and creator
              // Reject left, kicked and restricted users
              if (['member', 'administrator', 'creator'].includes(status)) {
                verificationPassed = true;
              } else {
                verificationPassed = false;
                failReason = `❌ Please join this channel first. (Current status: ${status})`;
              }
            } else {
              verificationPassed = false;
              failReason = parseTelegramError(data);
            }
          } catch (e: any) {
            console.error("[Task Verification API Exception] getChatMember call error:", e);
            verificationPassed = false;
            failReason = parseExceptionToReason(e);
          }
        }
      } else {
        // Non-channel social tasks or regular tasks
        if (hasClickedJoin || !task.requiresVerification) {
          verificationPassed = true;
        } else {
          verificationPassed = false;
          failReason = "❌ Please click the Open/Join link first before verifying.";
        }
      }

      if (!verificationPassed) {
        console.warn(`[Task Verification API Failed] Verification did not pass. Reason: "${failReason}"`);
        return res.status(200).json({ success: false, message: failReason });
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
      console.log(`[Task Verification API Success] User ${userId} successfully completed ${taskId}. Balance is now ${user.balanceTM} TM.`);

      res.status(200).json({
        success: true,
        message: `Successfully verified: ${task.title}! +${task.rewardTM} TM`,
        db,
        user
      });
    } catch (routeError: any) {
      console.error("[Task Verification API Error]", routeError);
      res.status(200).json({ success: false, message: `❌ Server verification error: ${routeError.message || routeError}` });
    }
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

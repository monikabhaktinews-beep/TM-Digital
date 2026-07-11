import { AppDatabase, UserProfile, Task, Channel, DepositRequest, WithdrawalRequest, WithdrawalRule, Transaction, SupportTicket, SystemSettings } from '../types';

const STORAGE_KEY = 'tm_digital_database_v1';

// Initial Mock Setup
const DEFAULT_SETTINGS: SystemSettings = {
  conversionRate: 1000, // 1 USDT = 1000 TM
  referralRewardUSDT: 0.03, // 0.03 USDT
  dailyBonusRateUSDT: 0.05, // 0.05 USDT per 1000 TM
  dailyBonusIntervalHours: 24,
  dailyBonusEnabled: true,
  walletAddressUSDT: "TR7NHqJeE4ntYHg8Bbu96TJvsB5bK6a9j4",
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TR7NHqJeE4ntYHg8Bbu96TJvsB5bK6a9j4",
  autoApprovalEnabled: false,
  maintenanceMode: false,
  announcement: "📢 TM Digital v1.2 Live! Complete your mandatory tasks to unlock your premium staking dashboard."
};

const DEFAULT_WITHDRAWAL_RULES: WithdrawalRule[] = [
  {
    id: "rule_1",
    minAmountUSDT: 0.1,
    maxAmountUSDT: 1.0,
    requiredLifetimeDepositUSDT: 1.0,
    description: "Rule 1 (0.1 - 1.0 USDT): Requires minimum $1.00 lifetime approved deposits."
  },
  {
    id: "rule_2",
    minAmountUSDT: 1.0,
    maxAmountUSDT: 3.0,
    requiredLifetimeDepositUSDT: 2.0,
    description: "Rule 2 (1.0 - 3.0 USDT): Requires minimum $2.00 lifetime approved deposits."
  },
  {
    id: "rule_3",
    minAmountUSDT: 3.0,
    maxAmountUSDT: 10.0,
    requiredLifetimeDepositUSDT: 5.0,
    description: "Rule 3 (3.0 - 10.0 USDT): Requires minimum $5.00 lifetime approved deposits."
  }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: "task_1",
    title: "Join Official Telegram Channel",
    description: "Join the official TM Digital Telegram Channel to get latest updates and code drops.",
    type: "TelegramChannel",
    rewardTM: 200,
    link: "https://t.me/tm_digital_channel_mock",
    isMandatory: true,
    displayOrder: 1,
    isEnabled: true,
    requiresVerification: true
  },
  {
    id: "task_2",
    title: "Join Official Chat Group",
    description: "Join our official Telegram discussion group and discuss stakings with other users.",
    type: "TelegramGroup",
    rewardTM: 200,
    link: "https://t.me/tm_digital_group_mock",
    isMandatory: true,
    displayOrder: 2,
    isEnabled: true,
    requiresVerification: true
  },
  {
    id: "task_3",
    title: "Start TM Verification Bot",
    description: "Click start on our official telegram bot to enable immediate notifications and anti-fraud filters.",
    type: "TelegramBot",
    rewardTM: 100,
    link: "https://t.me/tm_digital_verification_bot_mock",
    isMandatory: true,
    displayOrder: 3,
    isEnabled: true,
    requiresVerification: true
  },
  {
    id: "task_4",
    title: "Claim Daily Telegram Check-in",
    description: "Claim your daily check-in reward simply by tapping the button.",
    type: "DailyCheckIn",
    rewardTM: 50,
    link: "#",
    isMandatory: false,
    displayOrder: 4,
    isEnabled: true,
    requiresVerification: false
  },
  {
    id: "task_5",
    title: "Invite 3 Friends via Telegram",
    description: "Share your automatic referral link with your contacts and invite 3 active users.",
    type: "Referral",
    rewardTM: 300,
    link: "#",
    isMandatory: false,
    displayOrder: 5,
    isEnabled: true,
    requiresVerification: true
  },
  {
    id: "task_6",
    title: "Follow TM Digital on Twitter/X",
    description: "Stay in touch on our primary announcement handle.",
    type: "ExternalLink",
    rewardTM: 150,
    link: "https://twitter.com/tm_digital_mock",
    isMandatory: false,
    displayOrder: 6,
    isEnabled: true,
    requiresVerification: false
  }
];

const DEFAULT_CHANNELS: Channel[] = [
  {
    id: "chan_1",
    name: "TM Digital Announcements",
    username: "@tm_digital_announcements",
    inviteLink: "https://t.me/tm_digital_channel_mock",
    rewardTM: 200,
    isEnabled: true,
    displayOrder: 1,
    isMandatory: true,
    requiresVerification: true
  },
  {
    id: "chan_2",
    name: "TM Digital Community Chat",
    username: "@tm_digital_chat",
    inviteLink: "https://t.me/tm_digital_group_mock",
    rewardTM: 200,
    isEnabled: true,
    displayOrder: 2,
    isMandatory: true,
    requiresVerification: true
  }
];

const DEFAULT_USERS: UserProfile[] = [
  {
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
    isBanned: false
  },
  {
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
    isBanned: false
  },
  {
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
    isBanned: false
  },
  {
    id: "444444444",
    username: "frozentg",
    firstName: "Jim",
    lastName: "Halpert",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces",
    languageCode: "en",
    registeredAt: "2026-07-08T11:45:00Z",
    balanceTM: 0,
    balanceUSDT: 0.0,
    lifetimeEarningsUSDT: 0.0,
    referralEarningsUSDT: 0.0,
    todayBonusUSDT: 0.0,
    depositStatus: 'None',
    withdrawStatus: 'None',
    referralCount: 0,
    isFrozen: true,
    isBanned: false
  },
  {
    id: "555555555",
    username: "banned_user",
    firstName: "Pam",
    lastName: "Beesly",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
    languageCode: "en",
    registeredAt: "2026-07-02T16:20:00Z",
    balanceTM: 2000,
    balanceUSDT: 1.0,
    lifetimeEarningsUSDT: 1.0,
    referralEarningsUSDT: 0.0,
    todayBonusUSDT: 0.1,
    depositStatus: 'Approved',
    withdrawStatus: 'None',
    referralCount: 0,
    isFrozen: false,
    isBanned: true
  }
];

const DEFAULT_DEPOSITS: DepositRequest[] = [
  {
    id: "dep_1",
    userId: "111111111",
    userUsername: "cryptoking",
    userFirstName: "Sarah",
    amountUSDT: 2.5,
    txid: "0xbc534a6ef8d7e63b1189cd1235bc6741ee235ef982c7a6fdf99214abce389c",
    screenshotUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&h=400&fit=crop",
    status: 'Approved',
    createdAt: "2026-06-05T14:30:00Z",
    processedAt: "2026-06-05T14:45:00Z"
  },
  {
    id: "dep_2",
    userId: "222222222",
    userUsername: "tg_rich",
    userFirstName: "Michael",
    amountUSDT: 1.0,
    txid: "0x77ae6522c8a2b34c9c1b2f91a5e12dc4a5b6c7a8d42398ab716fe2a8d4e9c7a4",
    screenshotUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&h=400&fit=crop",
    status: 'Pending',
    createdAt: "2026-07-10T16:00:00Z"
  },
  {
    id: "dep_3",
    userId: "333333333",
    userUsername: "new_joiner",
    userFirstName: "Dwight",
    amountUSDT: 1.0,
    txid: "0x89ee12ff3142abde41c2c3e1e235cb2418a1a3e2c39d8ea4f9c12bcf39de2a3a",
    screenshotUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&h=400&fit=crop",
    status: 'Approved',
    createdAt: "2026-07-06T11:00:00Z",
    processedAt: "2026-07-06T11:15:00Z"
  }
];

const DEFAULT_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: "wd_1",
    userId: "111111111",
    userUsername: "cryptoking",
    userFirstName: "Sarah",
    amountUSDT: 0.5,
    walletAddress: "TMyWalletAddressUSDT11111",
    ruleId: "rule_1",
    ruleDescription: "Rule 1 (0.1 - 1.0 USDT): Requires minimum $1.00 lifetime approved deposits.",
    status: 'Approved',
    createdAt: "2026-06-12T10:00:00Z",
    processedAt: "2026-06-12T10:30:00Z"
  },
  {
    id: "wd_2",
    userId: "333333333",
    userUsername: "new_joiner",
    userFirstName: "Dwight",
    amountUSDT: 0.2,
    walletAddress: "TMyWalletAddressUSDT33333",
    ruleId: "rule_1",
    ruleDescription: "Rule 1 (0.1 - 1.0 USDT): Requires minimum $1.00 lifetime approved deposits.",
    status: 'Pending',
    createdAt: "2026-07-11T05:00:00Z"
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_1",
    userId: "111111111",
    type: "Reward",
    amountTM: 200,
    amountUSDT: 0.2,
    description: "Completed Mandatory Task: Join Official Telegram Channel",
    createdAt: "2026-06-01T12:05:00Z"
  },
  {
    id: "tx_2",
    userId: "111111111",
    type: "Reward",
    amountTM: 200,
    amountUSDT: 0.2,
    description: "Completed Mandatory Task: Join Official Chat Group",
    createdAt: "2026-06-01T12:10:00Z"
  },
  {
    id: "tx_3",
    userId: "111111111",
    type: "Reward",
    amountTM: 100,
    amountUSDT: 0.1,
    description: "Completed Mandatory Task: Start TM Verification Bot",
    createdAt: "2026-06-01T12:12:00Z"
  },
  {
    id: "tx_4",
    userId: "111111111",
    type: "Deposit",
    amountTM: 2500,
    amountUSDT: 2.5,
    description: "Approved Deposit of 2.5 USDT (TXID: 0xbc534a6ef8...)",
    createdAt: "2026-06-05T14:45:00Z"
  },
  {
    id: "tx_5",
    userId: "111111111",
    type: "Withdraw",
    amountTM: -500,
    amountUSDT: -0.5,
    description: "Approved Withdrawal of 0.5 USDT to TMyWalletAddressUSDT11111",
    createdAt: "2026-06-12T10:30:00Z"
  },
  {
    id: "tx_6",
    userId: "333333333",
    type: "Deposit",
    amountTM: 1000,
    amountUSDT: 1.0,
    description: "Approved Deposit of 1.0 USDT (TXID: 0x89ee12ff31...)",
    createdAt: "2026-07-06T11:15:00Z"
  }
];

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: "tick_1",
    userId: "111111111",
    userFirstName: "Sarah",
    userUsername: "cryptoking",
    subject: "USDT Deposit delay TRC20",
    status: 'Replied',
    createdAt: "2026-06-05T14:35:00Z",
    messages: [
      {
        sender: 'user',
        text: "Hi, I sent 2.5 USDT on TRC20 but it has been 5 minutes and hasn't shown up. Can you check my TXID?",
        createdAt: "2026-06-05T14:35:00Z"
      },
      {
        sender: 'admin',
        text: "Hello Sarah! We verified your TXID: 0xbc534a6ef8... and have approved your deposit. 2500 TM has been credited to your balance.",
        createdAt: "2026-06-05T14:45:00Z"
      }
    ]
  },
  {
    id: "tick_2",
    userId: "333333333",
    userFirstName: "Dwight",
    userUsername: "new_joiner",
    subject: "Withdrawal Question",
    status: 'Open',
    createdAt: "2026-07-11T05:30:00Z",
    messages: [
      {
        sender: 'user',
        text: "I submit a withdraw of 0.2 USDT. When will this get approved? Thank you.",
        createdAt: "2026-07-11T05:30:00Z"
      }
    ]
  }
];

const DEFAULT_COMPLETED_TASKS: { [userId: string]: string[] } = {
  "111111111": ["task_1", "task_2", "task_3"], // Sarah has completed mandatory ones
  "333333333": ["task_1", "task_2", "task_3"], // Dwight too
  "222222222": ["task_1"] // Michael only completed 1 mandatory
};

const DEFAULT_CLAIMED_BONUSES: { [userId: string]: string } = {
  "111111111": "2026-07-10T12:00:00Z", // Claimed yesterday, can claim again soon
};

export const getDB = (): AppDatabase => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse database from localStorage, resetting", e);
    }
  }

  // Create initial state
  const db: AppDatabase = {
    users: DEFAULT_USERS,
    tasks: DEFAULT_TASKS,
    channels: DEFAULT_CHANNELS,
    deposits: DEFAULT_DEPOSITS,
    withdrawals: DEFAULT_WITHDRAWALS,
    withdrawalRules: DEFAULT_WITHDRAWAL_RULES,
    transactions: DEFAULT_TRANSACTIONS,
    tickets: DEFAULT_TICKETS,
    settings: DEFAULT_SETTINGS,
    completedTasks: DEFAULT_COMPLETED_TASKS,
    claimedBonuses: DEFAULT_CLAIMED_BONUSES
  };
  saveDB(db);
  return db;
};

export const saveDB = (db: AppDatabase) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const resetDB = () => {
  localStorage.removeItem(STORAGE_KEY);
  return getDB();
};

// State Modifiers
export const getUserProfile = (tgUser: { id: string; username?: string; firstName: string; lastName?: string; photoUrl?: string; languageCode?: string }): UserProfile => {
  const db = getDB();
  let user = db.users.find(u => u.id === tgUser.id);
  
  if (!user) {
    user = {
      id: tgUser.id,
      username: tgUser.username,
      firstName: tgUser.firstName,
      lastName: tgUser.lastName,
      photoUrl: tgUser.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${tgUser.firstName}`,
      languageCode: tgUser.languageCode || 'en',
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
      isBanned: false
    };

    // If there is a referral parameter in Telegram start_param, reward the referrer!
    // We check URL params for 'tgWebAppStartParam' (referral code)
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('tgWebAppStartParam');
    if (startParam && startParam !== tgUser.id) {
      const referrer = db.users.find(u => u.id === startParam);
      if (referrer && !referrer.isBanned && !referrer.isFrozen) {
        user.referredBy = startParam;
        
        // Reward referrer with configured referral amount
        const referralReward = db.settings.referralRewardUSDT;
        referrer.balanceUSDT = Number((referrer.balanceUSDT + referralReward).toFixed(4));
        referrer.lifetimeEarningsUSDT = Number((referrer.lifetimeEarningsUSDT + referralReward).toFixed(4));
        referrer.referralEarningsUSDT = Number((referrer.referralEarningsUSDT + referralReward).toFixed(4));
        referrer.referralCount += 1;

        // Log referral transaction for referrer
        db.transactions.push({
          id: `ref_tx_${Date.now()}`,
          userId: referrer.id,
          type: 'Referral',
          amountTM: 0,
          amountUSDT: referralReward,
          description: `Referral Reward for inviting ${tgUser.firstName} (@${tgUser.username || tgUser.id})`,
          createdAt: new Date().toISOString()
        });
      }
    }

    db.users.push(user);
    saveDB(db);
  } else {
    // Update profile fields if changed from Telegram WebApp
    user.username = tgUser.username || user.username;
    user.firstName = tgUser.firstName;
    user.lastName = tgUser.lastName || user.lastName;
    user.photoUrl = tgUser.photoUrl || user.photoUrl;
    user.languageCode = tgUser.languageCode || user.languageCode;
    saveDB(db);
  }
  
  return user;
};

// Complete a task
export const completeUserTask = (userId: string, taskId: string): { success: boolean; message: string; db: AppDatabase; user: UserProfile } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  const task = db.tasks.find(t => t.id === taskId);
  
  if (!user) return { success: false, message: "User not found", db, user: null as any };
  if (user.isBanned) return { success: false, message: "User account is banned", db, user };
  if (user.isFrozen) return { success: false, message: "User account is frozen", db, user };
  if (!task) return { success: false, message: "Task not found", db, user };
  
  if (!db.completedTasks[userId]) {
    db.completedTasks[userId] = [];
  }
  
  if (db.completedTasks[userId].includes(taskId)) {
    return { success: false, message: "Task already completed", db, user };
  }
  
  db.completedTasks[userId].push(taskId);
  
  // Calculate reward
  const rewardTM = task.rewardTM;
  const rewardUSDT = rewardTM / db.settings.conversionRate;
  
  user.balanceTM += rewardTM;
  // Update lifetime earnings & user fields
  user.lifetimeEarningsUSDT = Number((user.lifetimeEarningsUSDT + rewardUSDT).toFixed(4));
  
  // Log transaction
  db.transactions.push({
    id: `tx_task_${Date.now()}`,
    userId: userId,
    type: 'Reward',
    amountTM: rewardTM,
    amountUSDT: rewardUSDT,
    description: `Task completed: ${task.title}`,
    createdAt: new Date().toISOString()
  });
  
  saveDB(db);
  return { success: true, message: `Completed task and earned ${rewardTM} TM!`, db, user };
};

// Check-in / Claim Daily Bonus
export const claimDailyBonus = (userId: string): { success: boolean; message: string; db: AppDatabase; user: UserProfile } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) return { success: false, message: "User not found", db, user: null as any };
  if (user.isBanned) return { success: false, message: "User account is banned", db, user };
  if (user.isFrozen) return { success: false, message: "User account is frozen", db, user };
  if (!db.settings.dailyBonusEnabled) return { success: false, message: "Daily bonus is currently disabled", db, user };
  
  // Staking bonus rule: Every 1000 TM earns 0.05 USDT every 24 hours. (Formula: (balanceTM / 1000) * bonusRate)
  if (user.balanceTM < 1000) {
    return { success: false, message: "You need at least 1,000 TM balance to claim Daily Bonus.", db, user };
  }
  
  const lastClaim = db.claimedBonuses[userId];
  const now = new Date();
  
  if (lastClaim) {
    const lastClaimDate = new Date(lastClaim);
    const diffHours = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);
    if (diffHours < db.settings.dailyBonusIntervalHours) {
      const remainingMinutes = Math.ceil((db.settings.dailyBonusIntervalHours - diffHours) * 60);
      const remHours = Math.floor(remainingMinutes / 60);
      const remMins = remainingMinutes % 60;
      return { 
        success: false, 
        message: `Please wait ${remHours}h ${remMins}m before claiming your next daily bonus.`, 
        db, 
        user 
      };
    }
  }
  
  // Calculate bonus: 0.05 USDT per 1000 TM
  const thousandsOfTM = Math.floor(user.balanceTM / 1000);
  const bonusUSDT = Number((thousandsOfTM * db.settings.dailyBonusRateUSDT).toFixed(4));
  
  user.balanceUSDT = Number((user.balanceUSDT + bonusUSDT).toFixed(4));
  user.lifetimeEarningsUSDT = Number((user.lifetimeEarningsUSDT + bonusUSDT).toFixed(4));
  user.todayBonusUSDT = bonusUSDT;
  
  db.claimedBonuses[userId] = now.toISOString();
  
  db.transactions.push({
    id: `bonus_claim_${Date.now()}`,
    userId: userId,
    type: 'DailyBonus',
    amountTM: 0,
    amountUSDT: bonusUSDT,
    description: `Claimed Daily Staking Bonus for holding ${user.balanceTM} TM`,
    createdAt: now.toISOString()
  });
  
  saveDB(db);
  return { success: true, message: `Successfully claimed daily bonus of ${bonusUSDT} USDT!`, db, user };
};

// Deposit Submission
export const submitDeposit = (userId: string, amountUSDT: number, txid: string, screenshotUrl: string): { success: boolean; message: string; db: AppDatabase; user: UserProfile } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) return { success: false, message: "User not found", db, user: null as any };
  if (user.isBanned) return { success: false, message: "User account is banned", db, user };
  if (user.isFrozen) return { success: false, message: "User account is frozen", db, user };
  if (amountUSDT <= 0) return { success: false, message: "Amount must be greater than 0 USDT", db, user };
  if (!txid.trim()) return { success: false, message: "TXID is required", db, user };
  
  // Check if TXID already exists to prevent duplicate submissions
  const txidExists = db.deposits.some(d => d.txid.trim().toLowerCase() === txid.trim().toLowerCase());
  if (txidExists) {
    return { success: false, message: "This TXID has already been submitted", db, user };
  }
  
  const deposit: DepositRequest = {
    id: `dep_${Date.now()}`,
    userId: userId,
    userUsername: user.username,
    userFirstName: user.firstName,
    amountUSDT: amountUSDT,
    txid: txid,
    screenshotUrl: screenshotUrl || "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&h=400&fit=crop",
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  
  db.deposits.push(deposit);
  user.depositStatus = 'Pending';
  
  saveDB(db);
  return { success: true, message: "Deposit submitted successfully! Admin will verify and credit TM shortly.", db, user };
};

// Check Lifetime Approved Deposits for withdrawal eligibility
export const getLifetimeApprovedDeposits = (userId: string, db: AppDatabase): number => {
  return db.deposits
    .filter(d => d.userId === userId && d.status === 'Approved')
    .reduce((sum, d) => sum + d.amountUSDT, 0);
};

// Submit Withdrawal Request
export const submitWithdrawal = (userId: string, amountUSDT: number, walletAddress: string): { success: boolean; message: string; db: AppDatabase; user: UserProfile } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) return { success: false, message: "User not found", db, user: null as any };
  if (user.isBanned) return { success: false, message: "User account is banned", db, user };
  if (user.isFrozen) return { success: false, message: "User account is frozen", db, user };
  if (amountUSDT <= 0) return { success: false, message: "Amount must be greater than 0 USDT", db, user };
  if (amountUSDT < 0.1) return { success: false, message: "Minimum withdrawal is 0.1 USDT", db, user };
  if (!walletAddress.trim()) return { success: false, message: "Wallet Address is required", db, user };
  
  if (user.balanceUSDT < amountUSDT) {
    return { success: false, message: `Insufficient USDT balance. You have ${user.balanceUSDT} USDT`, db, user };
  }
  
  // Calculate Approved Deposit History
  const lifetimeDeposits = getLifetimeApprovedDeposits(userId, db);
  
  // Check against Rules
  // Find which rule applies to this withdrawal amount
  const applicableRule = db.withdrawalRules.find(r => amountUSDT >= r.minAmountUSDT && amountUSDT <= r.maxAmountUSDT);
  
  if (applicableRule) {
    if (lifetimeDeposits < applicableRule.requiredLifetimeDepositUSDT) {
      return { 
        success: false, 
        message: `Ineligible: To withdraw ${amountUSDT} USDT (Rule: ${applicableRule.minAmountUSDT}-${applicableRule.maxAmountUSDT} USDT), you need a minimum of $${applicableRule.requiredLifetimeDepositUSDT} lifetime approved deposits. Your current approved deposit history is $${lifetimeDeposits}. (Current balance cannot be used for this requirement).`, 
        db, 
        user 
      };
    }
  } else {
    // If no specific rule matches, check if it exceeds standard max
    const maxRule = db.withdrawalRules.reduce((max, r) => r.maxAmountUSDT > max.maxAmountUSDT ? r : max, db.withdrawalRules[0]);
    if (maxRule && amountUSDT > maxRule.maxAmountUSDT) {
      // Just apply the highest rule
      if (lifetimeDeposits < maxRule.requiredLifetimeDepositUSDT) {
        return { 
          success: false, 
          message: `Ineligible: Withdrawal exceeds maximum. Minimum lifetime approved deposit required: $${maxRule.requiredLifetimeDepositUSDT}`, 
          db, 
          user 
        };
      }
    }
  }
  
  const ruleToSave = applicableRule || { id: "custom", description: "Standard Over-limit Rule" };
  
  const withdrawal: WithdrawalRequest = {
    id: `wd_${Date.now()}`,
    userId: userId,
    userUsername: user.username,
    userFirstName: user.firstName,
    amountUSDT: amountUSDT,
    walletAddress: walletAddress,
    ruleId: ruleToSave.id,
    ruleDescription: ruleToSave.description || "General withdrawal rule applied",
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  
  // Deduct from balance immediately on submission
  user.balanceUSDT = Number((user.balanceUSDT - amountUSDT).toFixed(4));
  user.withdrawStatus = 'Pending';
  
  db.withdrawals.push(withdrawal);
  
  // Log transaction placeholder
  db.transactions.push({
    id: `tx_withdraw_sub_${Date.now()}`,
    userId: userId,
    type: 'Withdraw',
    amountTM: 0,
    amountUSDT: -amountUSDT,
    description: `Submitted withdrawal request for ${amountUSDT} USDT to ${walletAddress} (Pending Approval)`,
    createdAt: new Date().toISOString()
  });
  
  saveDB(db);
  return { success: true, message: `Withdrawal request submitted successfully! Pending admin approval.`, db, user };
};

// Create Support Ticket
export const submitSupportTicket = (userId: string, subject: string, messageText: string): { success: boolean; message: string; db: AppDatabase; tickets: SupportTicket[] } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) return { success: false, message: "User not found", db, tickets: [] };
  if (!subject.trim()) return { success: false, message: "Subject is required", db, tickets: [] };
  if (!messageText.trim()) return { success: false, message: "Message cannot be empty", db, tickets: [] };
  
  const newTicket: SupportTicket = {
    id: `tick_${Date.now()}`,
    userId: userId,
    userFirstName: user.firstName,
    userUsername: user.username,
    subject: subject,
    status: 'Open',
    createdAt: new Date().toISOString(),
    messages: [
      {
        sender: 'user',
        text: messageText,
        createdAt: new Date().toISOString()
      }
    ]
  };
  
  db.tickets.push(newTicket);
  saveDB(db);
  
  const userTickets = db.tickets.filter(t => t.userId === userId);
  return { success: true, message: "Support ticket created successfully!", db, tickets: userTickets };
};

// Reply to Ticket (User side)
export const replyToTicket = (userId: string, ticketId: string, text: string): { success: boolean; message: string; db: AppDatabase; ticket: SupportTicket } => {
  const db = getDB();
  const ticket = db.tickets.find(t => t.id === ticketId);
  
  if (!ticket) return { success: false, message: "Ticket not found", db, ticket: null as any };
  if (!text.trim()) return { success: false, message: "Message cannot be empty", db, ticket };
  
  ticket.messages.push({
    sender: 'user',
    text: text,
    createdAt: new Date().toISOString()
  });
  ticket.status = 'Open'; // Set back to open so admin sees it
  
  saveDB(db);
  return { success: true, message: "Reply sent!", db, ticket };
};


// ==========================================
// ADMIN ACTIONS
// ==========================================

// Approve Deposit
export const adminApproveDeposit = (depositId: string): AppDatabase => {
  const db = getDB();
  const deposit = db.deposits.find(d => d.id === depositId);
  if (!deposit || deposit.status !== 'Pending') return db;
  
  const user = db.users.find(u => u.id === deposit.userId);
  if (!user) return db;
  
  deposit.status = 'Approved';
  deposit.processedAt = new Date().toISOString();
  
  // 1 USDT = settings.conversionRate TM
  const earnedTM = deposit.amountUSDT * db.settings.conversionRate;
  user.balanceTM += earnedTM;
  user.depositStatus = 'Approved';
  
  // Log real TM transaction
  db.transactions.push({
    id: `tx_dep_appr_${Date.now()}`,
    userId: user.id,
    type: 'Deposit',
    amountTM: earnedTM,
    amountUSDT: deposit.amountUSDT,
    description: `Approved deposit of ${deposit.amountUSDT} USDT. Credited ${earnedTM} TM.`,
    createdAt: new Date().toISOString()
  });
  
  saveDB(db);
  return db;
};

// Reject Deposit
export const adminRejectDeposit = (depositId: string): AppDatabase => {
  const db = getDB();
  const deposit = db.deposits.find(d => d.id === depositId);
  if (!deposit || deposit.status !== 'Pending') return db;
  
  const user = db.users.find(u => u.id === deposit.userId);
  
  deposit.status = 'Rejected';
  deposit.processedAt = new Date().toISOString();
  
  if (user) {
    user.depositStatus = 'None';
  }
  
  saveDB(db);
  return db;
};

// Approve Withdrawal
export const adminApproveWithdrawal = (withdrawId: string): AppDatabase => {
  const db = getDB();
  const withdrawal = db.withdrawals.find(w => w.id === withdrawId);
  if (!withdrawal || withdrawal.status !== 'Pending') return db;
  
  const user = db.users.find(u => u.id === withdrawal.userId);
  if (!user) return db;
  
  withdrawal.status = 'Approved';
  withdrawal.processedAt = new Date().toISOString();
  user.withdrawStatus = 'Approved';
  
  // Complete the transaction logs
  db.transactions.push({
    id: `tx_wd_appr_${Date.now()}`,
    userId: user.id,
    type: 'Withdraw',
    amountTM: 0,
    amountUSDT: -withdrawal.amountUSDT,
    description: `Approved withdrawal of ${withdrawal.amountUSDT} USDT to ${withdrawal.walletAddress}.`,
    createdAt: new Date().toISOString()
  });
  
  saveDB(db);
  return db;
};

// Reject Withdrawal
export const adminRejectWithdrawal = (withdrawId: string): AppDatabase => {
  const db = getDB();
  const withdrawal = db.withdrawals.find(w => w.id === withdrawId);
  if (!withdrawal || withdrawal.status !== 'Pending') return db;
  
  const user = db.users.find(u => u.id === withdrawal.userId);
  if (!user) return db;
  
  withdrawal.status = 'Rejected';
  withdrawal.processedAt = new Date().toISOString();
  user.withdrawStatus = 'None';
  
  // Refund USDT balance
  user.balanceUSDT = Number((user.balanceUSDT + withdrawal.amountUSDT).toFixed(4));
  
  // Log rejection refund
  db.transactions.push({
    id: `tx_wd_rej_${Date.now()}`,
    userId: user.id,
    type: 'Withdraw',
    amountTM: 0,
    amountUSDT: withdrawal.amountUSDT,
    description: `Rejected withdrawal of ${withdrawal.amountUSDT} USDT. Balance refunded.`,
    createdAt: new Date().toISOString()
  });
  
  saveDB(db);
  return db;
};

// User Profile Actions
export const adminModifyUserBalance = (userId: string, changeTM: number, changeUSDT: number): AppDatabase => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return db;
  
  user.balanceTM = Math.max(0, user.balanceTM + changeTM);
  user.balanceUSDT = Number(Math.max(0, user.balanceUSDT + changeUSDT).toFixed(4));
  
  db.transactions.push({
    id: `tx_admin_adj_${Date.now()}`,
    userId: userId,
    type: 'Reward',
    amountTM: changeTM,
    amountUSDT: changeUSDT,
    description: `Admin manual balance adjustment (TM: ${changeTM >= 0 ? '+' : ''}${changeTM}, USDT: ${changeUSDT >= 0 ? '+' : ''}${changeUSDT})`,
    createdAt: new Date().toISOString()
  });
  
  saveDB(db);
  return db;
};

export const adminSetUserStatus = (userId: string, action: 'freeze' | 'unfreeze' | 'ban' | 'unban' | 'delete'): AppDatabase => {
  let db = getDB();
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return db;
  
  const user = db.users[userIndex];
  
  if (action === 'freeze') {
    user.isFrozen = true;
  } else if (action === 'unfreeze') {
    user.isFrozen = false;
  } else if (action === 'ban') {
    user.isBanned = true;
  } else if (action === 'unban') {
    user.isBanned = false;
  } else if (action === 'delete') {
    db.users.splice(userIndex, 1);
  }
  
  saveDB(db);
  return db;
};

// Support Replier (Admin side)
export const adminReplyToTicket = (ticketId: string, replyText: string): AppDatabase => {
  const db = getDB();
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket || !replyText.trim()) return db;
  
  ticket.messages.push({
    sender: 'admin',
    text: replyText,
    createdAt: new Date().toISOString()
  });
  ticket.status = 'Replied';
  
  saveDB(db);
  return db;
};

// Close Ticket
export const adminCloseTicket = (ticketId: string): AppDatabase => {
  const db = getDB();
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) return db;
  
  ticket.status = 'Closed';
  saveDB(db);
  return db;
};

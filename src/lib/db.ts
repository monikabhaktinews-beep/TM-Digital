import { AppDatabase, UserProfile, Task, Channel, DepositRequest, WithdrawalRequest, WithdrawalRule, Transaction, SupportTicket, SystemSettings, TaskSubmission } from '../types';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'tm_digital_database_v1';

let currentActiveUserId: string | null = null;
let cachedDb: AppDatabase | null = null;

export const mapUserFromSupabase = (row: any): UserProfile => {
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
    mandatoryCompleted: row.mandatory_completed === true || row.mandatory_completed === 1,
  };
};

export const mapUserToSupabase = (profile: UserProfile) => {
  return {
    id: profile.id,
    uid: profile.uid,
    username: profile.username || null,
    first_name: profile.firstName,
    last_name: profile.lastName || null,
    photo_url: profile.photoUrl || null,
    language_code: profile.languageCode || null,
    registered_at: profile.registeredAt,
    balance_tm: profile.balanceTM,
    balance_usdt: profile.balanceUSDT,
    lifetime_earnings_usdt: profile.lifetimeEarningsUSDT,
    referral_earnings_usdt: profile.referralEarningsUSDT,
    today_bonus_usdt: profile.todayBonusUSDT,
    deposit_status: profile.depositStatus,
    withdraw_status: profile.withdrawStatus,
    referral_count: profile.referralCount,
    referral_counted: profile.referralCounted || false,
    referred_by: profile.referredBy || null,
    claimed_milestones: JSON.stringify(profile.claimedMilestones || []),
    is_frozen: profile.isFrozen || false,
    is_banned: profile.isBanned || false,
    mandatory_completed: profile.mandatoryCompleted || false
  };
};

export const mapTransactionFromSupabase = (row: any): Transaction => {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amountTM: Number(row.amount_tm || 0),
    amountUSDT: Number(row.amount_usdt || 0),
    description: row.description || '',
    createdAt: row.created_at || new Date().toISOString()
  };
};

export const mapTransactionToSupabase = (tx: Transaction) => {
  return {
    id: tx.id,
    user_id: tx.userId,
    type: tx.type,
    amount_tm: tx.amountTM,
    amount_usdt: tx.amountUSDT,
    description: tx.description,
    created_at: tx.createdAt
  };
};

export const mapWithdrawalFromSupabase = (row: any): WithdrawalRequest => {
  return {
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
  };
};

export const mapWithdrawalToSupabase = (wd: WithdrawalRequest) => {
  return {
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
  };
};

// Initial Mock Setup
const DEFAULT_SETTINGS: SystemSettings = {
  conversionRate: 1000, // 1 USDT = 1000 TM
  referralRewardUSDT: 0.03, // 0.03 USDT per referral
  referralRewardTM: 100, // 100 TM Referral reward
  dailyBonusRateUSDT: 0.11, // 0.11 USDT per 1000 TM
  dailyBonusIntervalHours: 24,
  dailyBonusEnabled: true,
  walletAddressUSDT: "0x2FD17882dB69E7eA50E463dBaD37dCD3C2C0d592", // BEP20 BSC Address
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

const DEFAULT_WITHDRAWAL_RULES: WithdrawalRule[] = [
  {
    id: "rule_1",
    minAmountUSDT: 0.1,
    maxAmountUSDT: 1000000.0,
    requiredLifetimeDepositUSDT: 1.0,
    description: "Security Check (Anti-Fake Multi-Account Prevention): Requires a one-time minimum $1.00 approved deposit on BEP20 (BSC Network). Once verified, you unlock unlimited withdrawals for lifetime."
  }
];

const DEFAULT_TASKS: Task[] = [
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

const DEFAULT_CHANNELS: Channel[] = [];

const DEFAULT_USERS: UserProfile[] = [
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
    isBanned: false
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
    isBanned: false
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
    isBanned: false
  },
  {
    uid: 117304,
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
    uid: 117305,
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
    isBanned: false
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
  "111111111": ["mandatory_channel_1", "mandatory_channel_2", "mandatory_channel_3"], // Sarah has completed mandatory ones
  "333333333": ["mandatory_channel_1", "mandatory_channel_2", "mandatory_channel_3"], // Dwight too
  "222222222": ["mandatory_channel_1"] // Michael only completed 1 mandatory
};

const DEFAULT_CLAIMED_BONUSES: { [userId: string]: string } = {
  "111111111": "2026-07-10T12:00:00Z", // Claimed yesterday, can claim again soon
};

export const processAutomaticInterestPayout = (db: AppDatabase) => {
  const now = new Date();
  
  if (!db.lastInterestPayout) {
    db.lastInterestPayout = now.toISOString();
    saveDB(db);
    return;
  }

  const lastPayoutDate = new Date(db.lastInterestPayout);
  
  // Calculate local "12:01 AM" targets that have occurred between lastPayoutDate and now
  let currentTarget = new Date(lastPayoutDate.getTime());
  currentTarget.setHours(0, 1, 0, 0); // set to 12:01 AM of that day
  
  // If lastPayoutDate was already after 12:01 AM of its day, our first target is the next day's 12:01 AM
  if (lastPayoutDate.getTime() >= currentTarget.getTime()) {
    currentTarget.setDate(currentTarget.getDate() + 1);
    currentTarget.setHours(0, 1, 0, 0);
  }

  let payoutsHappened = 0;
  
  // Distribute interest for each 12:01 AM milestone that has passed
  while (currentTarget.getTime() <= now.getTime()) {
    const payoutDateIso = currentTarget.toISOString();
    
    // Distribute to all users in the DB
    db.users.forEach(user => {
      // Per 100 TM = 0.011$ Per Day
      if (user.balanceTM >= 100 && !user.isBanned && !user.isFrozen) {
        // Calculate interest: (balanceTM / 100) * 0.011 USDT
        // Using db.settings.dailyBonusRateUSDT (0.11), rate per 100 TM is db.settings.dailyBonusRateUSDT / 10 = 0.011 USDT.
        const ratePer100 = db.settings.dailyBonusRateUSDT / 10;
        const interestUSDT = Number(((user.balanceTM / 100) * ratePer100).toFixed(4));
        
        if (interestUSDT > 0) {
          user.balanceUSDT = Number((user.balanceUSDT + interestUSDT).toFixed(4));
          user.lifetimeEarningsUSDT = Number((user.lifetimeEarningsUSDT + interestUSDT).toFixed(4));
          user.todayBonusUSDT = interestUSDT; // Store latest bonus
          
          // Log automatic interest transaction
          db.transactions.push({
            id: `interest_auto_${user.id}_${currentTarget.getTime()}`,
            userId: user.id,
            type: 'DailyBonus',
            amountTM: 0,
            amountUSDT: interestUSDT,
            description: `Automatic 12:01 AM Staking Interest (${user.balanceTM.toLocaleString()} TM holding)`,
            createdAt: payoutDateIso
          });
        }
      }
    });

    payoutsHappened++;
    // Advance to next day's 12:01 AM
    currentTarget.setDate(currentTarget.getDate() + 1);
    currentTarget.setHours(0, 1, 0, 0);
  }

  if (payoutsHappened > 0) {
    db.lastInterestPayout = now.toISOString();
    saveDB(db);
  }
};

export const getDB = (): AppDatabase => {
  if (cachedDb) {
    // Ensure withdrawalRules is always present
    cachedDb.withdrawalRules = DEFAULT_WITHDRAWAL_RULES;
    return cachedDb;
  }

  const db: AppDatabase = {
    users: [...DEFAULT_USERS],
    tasks: [...DEFAULT_TASKS],
    channels: [...DEFAULT_CHANNELS],
    deposits: [...DEFAULT_DEPOSITS],
    withdrawals: [...DEFAULT_WITHDRAWALS],
    withdrawalRules: DEFAULT_WITHDRAWAL_RULES,
    transactions: [...DEFAULT_TRANSACTIONS],
    transfers: [],
    tickets: [...DEFAULT_TICKETS],
    settings: { ...DEFAULT_SETTINGS },
    completedTasks: { ...DEFAULT_COMPLETED_TASKS },
    claimedBonuses: { ...DEFAULT_CLAIMED_BONUSES },
    taskSubmissions: [],
    notifications: [],
    lastInterestPayout: new Date().toISOString(),
    giftCodeRedemptions: []
  };
  cachedDb = db;
  return db;
};

export const saveDB = (db: AppDatabase) => {
  cachedDb = db;
  
  // Asynchronously save to Supabase in the background
  (async () => {
    try {
      if (!currentActiveUserId) return;

      const activeUser = db.users.find(u => u.id === currentActiveUserId);
      if (activeUser) {
        // 1. Save user profile to users table
        await supabase.from('users').upsert(mapUserToSupabase(activeUser));
      }

      // 2. Save active user's transactions
      const userTxs = db.transactions.filter(t => t.userId === currentActiveUserId);
      if (userTxs.length > 0) {
        const txPayloads = userTxs.map(mapTransactionToSupabase);
        await supabase.from('transactions').upsert(txPayloads);
      }

      // 3. Save active user's withdrawals
      const userWds = db.withdrawals.filter(w => w.userId === currentActiveUserId);
      if (userWds.length > 0) {
        const wdPayloads = userWds.map(mapWithdrawalToSupabase);
        await supabase.from('withdrawals').upsert(wdPayloads);
      }

      // 4. Save global/shared state
      const globalData = {
        tasks: db.tasks,
        channels: db.channels,
        settings: db.settings,
        withdrawalRules: db.withdrawalRules,
        deposits: db.deposits,
        tickets: db.tickets,
        taskSubmissions: db.taskSubmissions,
        notifications: db.notifications,
        transfers: db.transfers,
        giftCodes: db.giftCodes,
        completedTasks: db.completedTasks,
        claimedBonuses: db.claimedBonuses,
        lastInterestPayout: db.lastInterestPayout,
        giftCodeRedemptions: db.giftCodeRedemptions || []
      };
      await supabase.from('app_state').upsert({ id: 'global', data: globalData });

      // Keep backend API updated in the background
      const url = `/api/db/save?userId=${currentActiveUserId}`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
      });
    } catch (err) {
      console.error("[Supabase] Background save error:", err);
    }
  })();
};

export const verifyTaskOnServer = async (
  userId: string,
  taskId: string,
  hasClickedJoin: boolean = false
): Promise<{ success: boolean; message: string; db: AppDatabase; user: UserProfile }> => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId) || db.users[0];
  const task = db.tasks.find(t => t.id === taskId);

  if (!user || !task) {
    return { success: false, message: "❌ User or task not found.", db, user };
  }

  if (!hasClickedJoin) {
    return { success: false, message: "❌ Please click the 'Join' or 'Open' button first to initiate verification.", db, user };
  }

  if (!db.completedTasks[userId]) {
    db.completedTasks[userId] = [];
  }

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

    saveDB(db);
  }

  return {
    success: true,
    message: `Successfully verified: ${task.title}! +${task.rewardTM} TM`,
    db,
    user
  };
};

export const completeOnboardingOnServer = async (
  userId: string
): Promise<{ success: boolean; db: AppDatabase; user: UserProfile }> => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId) || db.users[0];
  if (user) {
    user.mandatoryCompleted = true;
    saveDB(db);
  }
  return { success: true, db, user };
};

export const loadDBFromServer = async (userId: string, extraData: any = {}): Promise<AppDatabase> => {
  currentActiveUserId = userId;
  try {
    console.log('[Supabase Client] Loading data for user:', userId);

    // 1. Fetch user profile from Supabase
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let userProfile: UserProfile | null = null;

    if (userError || !userRow) {
      console.log('[Supabase Client] User not found, running signup procedure...', userError);

      // Determine sequential numeric UID starting at 117301
      const { data: maxUser } = await supabase
        .from('users')
        .select('uid')
        .order('uid', { ascending: false })
        .limit(1);

      let nextUid = 117301;
      if (maxUser && maxUser.length > 0) {
        nextUid = Number(maxUser[0].uid) + 1;
      }

      userProfile = {
        id: userId,
        uid: nextUid,
        username: extraData.username || undefined,
        firstName: extraData.firstName || 'New User',
        lastName: extraData.lastName || undefined,
        photoUrl: extraData.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${extraData.firstName || userId}`,
        languageCode: extraData.languageCode || 'en',
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
        claimedMilestones: [],
        isFrozen: false,
        isBanned: false,
        mandatoryCompleted: false
      };

      // Process referral parameters if any
      let startParam = '';
      const telegramObj = (window as any).Telegram;
      if (telegramObj?.WebApp?.initDataUnsafe) {
        startParam = telegramObj.WebApp.initDataUnsafe.start_param || telegramObj.WebApp.initDataUnsafe.startParam || '';
      }
      if (!startParam) {
        const urlParams = new URLSearchParams(window.location.search);
        startParam = urlParams.get('tgWebAppStartParam') || urlParams.get('start_param') || urlParams.get('ref') || '';
      }

      if (startParam) {
        let refId = startParam;
        if (refId.startsWith('ref_')) {
          refId = refId.substring(4);
        }
        const refVal = refId.trim();
        if (refVal && refVal !== userId) {
          userProfile.referredBy = refVal;

          // Insert referral relationship record
          await supabase.from('referrals').insert({
            id: `ref_${userId}_${Date.now()}`,
            referrer_id: refVal,
            referee_id: userId,
            created_at: new Date().toISOString()
          });

          // Fetch referrer to reward them
          const { data: referrerRow } = await supabase.from('users').select('*').eq('id', refVal).single();
          if (referrerRow) {
            const referrerProfile = mapUserFromSupabase(referrerRow);
            if (!referrerProfile.isBanned && !referrerProfile.isFrozen) {
              const referralRewardTM = 100;
              const referralRewardUSDT = 0.03;

              referrerProfile.balanceTM = (referrerProfile.balanceTM || 0) + referralRewardTM;
              referrerProfile.balanceUSDT = Number(((referrerProfile.balanceUSDT || 0) + referralRewardUSDT).toFixed(4));
              referrerProfile.referralEarningsUSDT = Number(((referrerProfile.referralEarningsUSDT || 0) + referralRewardUSDT).toFixed(4));
              referrerProfile.referralCount = (referrerProfile.referralCount || 0) + 1;

              await supabase.from('users').upsert(mapUserToSupabase(referrerProfile));

              // Add Transaction record for referrer
              const referralTx: Transaction = {
                id: `ref_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                userId: referrerProfile.id,
                type: 'Referral',
                amountTM: referralRewardTM,
                amountUSDT: referralRewardUSDT,
                description: `Referral Reward for inviting ${userProfile.firstName} (@${userProfile.username || userProfile.id})`,
                createdAt: new Date().toISOString()
              };
              await supabase.from('transactions').insert(mapTransactionToSupabase(referralTx));
            }
          }
        }
      }

      // Save user profile to Supabase users table (signup insert)
      await supabase.from('users').insert(mapUserToSupabase(userProfile));
    } else {
      userProfile = mapUserFromSupabase(userRow);
    }

    // 2. Fetch active user's transactions
    const { data: txRows } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const transactions = txRows ? txRows.map(mapTransactionFromSupabase) : [];

    // 3. Fetch active user's withdrawals
    const { data: wdRows } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const withdrawals = wdRows ? wdRows.map(mapWithdrawalFromSupabase) : [];

    // 4. Fetch global state
    const { data: appStateRow } = await supabase
      .from('app_state')
      .select('*')
      .eq('id', 'global')
      .single();

    let globalState: any = {};
    if (appStateRow && appStateRow.data) {
      globalState = typeof appStateRow.data === 'string' ? JSON.parse(appStateRow.data) : appStateRow.data;
    }

    // Assemble completed database state
    const db: AppDatabase = {
      users: userProfile ? [userProfile] : [],
      tasks: globalState.tasks || DEFAULT_TASKS,
      channels: globalState.channels || DEFAULT_CHANNELS,
      deposits: globalState.deposits || DEFAULT_DEPOSITS,
      withdrawals: withdrawals.length > 0 ? withdrawals : (globalState.withdrawals || DEFAULT_WITHDRAWALS),
      withdrawalRules: globalState.withdrawalRules || DEFAULT_WITHDRAWAL_RULES,
      transactions: transactions.length > 0 ? transactions : (globalState.transactions || DEFAULT_TRANSACTIONS),
      transfers: globalState.transfers || [],
      tickets: globalState.tickets || DEFAULT_TICKETS,
      settings: { ...DEFAULT_SETTINGS, ...(globalState.settings || {}) },
      completedTasks: globalState.completedTasks || DEFAULT_COMPLETED_TASKS,
      claimedBonuses: globalState.claimedBonuses || DEFAULT_CLAIMED_BONUSES,
      taskSubmissions: globalState.taskSubmissions || [],
      notifications: globalState.notifications || [],
      lastInterestPayout: globalState.lastInterestPayout || new Date().toISOString(),
      giftCodes: globalState.giftCodes || [],
      giftCodeRedemptions: globalState.giftCodeRedemptions || []
    };

    if (userProfile && !db.users.some(u => u.id === userProfile!.id)) {
      db.users.push(userProfile);
    }

    cachedDb = db;
    return db;
  } catch (err) {
    console.error('[Supabase Client] loadDBFromServer failed, falling back to cached state', err);
    
    // In case of error, trigger background fallback fetch to local server API
    try {
      const params = new URLSearchParams({ userId, ...extraData });
      const response = await fetch(`/api/db?${params.toString()}`);
      if (response.ok) {
        const localDb = await response.json();
        cachedDb = localDb;
        return localDb;
      }
    } catch (fallbackErr) {
      console.error('[Supabase Client] Local fallback fetch failed:', fallbackErr);
    }

    return getDB();
  }
};

export const resetDB = () => {
  localStorage.removeItem(STORAGE_KEY);
  return getDB();
};

// Notification Helpers
export const addNotification = (
  userId: string,
  title: string,
  message: string,
  type: 'deposit_approved' | 'withdraw_approved' | 'daily_claimed' | 'referral_completed' | 'milestone_unlocked' | 'task_completed'
) => {
  const db = getDB();
  if (!db.notifications) {
    db.notifications = [];
  }
  db.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title,
    message,
    type,
    createdAt: new Date().toISOString(),
    read: false
  });
  saveDB(db);
};

export const markNotificationsAsRead = (userId: string): AppDatabase => {
  const db = getDB();
  if (db.notifications) {
    db.notifications.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
  }
  saveDB(db);
  return db;
};

export const resetUserMandatoryTasks = (userId: string): AppDatabase => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (user) {
    user.mandatoryCompleted = false;
    
    // Clear completed mandatory task IDs
    const enabledTasks = db.tasks.filter(t => t.isEnabled);
    const mandatoryTaskIds = enabledTasks.filter(t => t.isMandatory).map(t => t.id);
    
    if (db.completedTasks[userId]) {
      db.completedTasks[userId] = db.completedTasks[userId].filter(id => !mandatoryTaskIds.includes(id));
    }
    
    // Remove submissions for mandatory tasks
    if (db.taskSubmissions) {
      db.taskSubmissions = db.taskSubmissions.filter(s => !(s.userId === userId && mandatoryTaskIds.includes(s.taskId)));
    }
  }
  saveDB(db);
  return db;
};

// State Modifiers
export const getUserProfile = (tgUser: { id: string; username?: string; firstName: string; lastName?: string; photoUrl?: string; languageCode?: string }): UserProfile => {
  const db = getDB();
  let user = db.users.find(u => u.id === tgUser.id);
  
  if (!user) {
    // Generate permanent unique numeric UID starting at 117301
    const maxUid = db.users.length > 0 ? Math.max(...db.users.map(u => u.uid || 0)) : 117300;
    const nextUid = maxUid < 117300 ? 117301 : maxUid + 1;

    user = {
      id: tgUser.id,
      uid: nextUid,
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
      referralCounted: false,
      claimedMilestones: [],
      isFrozen: false,
      isBanned: false
    };

    let startParam = '';
    
    // 1. Try to get from Telegram WebApp SDK directly (the most robust way inside Telegram)
    const telegramObj = (window as any).Telegram;
    if (telegramObj?.WebApp?.initDataUnsafe) {
      startParam = telegramObj.WebApp.initDataUnsafe.start_param || 
                   telegramObj.WebApp.initDataUnsafe.startParam || '';
    }
    
    // 2. Fallback to URL search parameters
    if (!startParam) {
      const urlParams = new URLSearchParams(window.location.search);
      startParam = urlParams.get('tgWebAppStartParam') || 
                   urlParams.get('start_param') || 
                   urlParams.get('ref') || 
                   urlParams.get('startapp') || 
                   urlParams.get('start') || '';
    }
    
    // 3. Fallback to hash parameters
    if (!startParam && window.location.hash) {
      try {
        const hashParts = window.location.hash.split('?');
        const hashQuery = hashParts[1] || (hashParts[0].includes('?') ? hashParts[0].split('?')[1] : '');
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          startParam = hashParams.get('tgWebAppStartParam') || 
                       hashParams.get('start_param') || 
                       hashParams.get('ref') || 
                       hashParams.get('startapp') || 
                       hashParams.get('start') || '';
        }
      } catch (e) {}
    }

    if (startParam) {
      // Strip 'ref_' prefix if present
      let refId = startParam;
      if (refId.startsWith('ref_')) {
        refId = refId.substring(4);
      }
      
      const refVal = refId.trim();
      if (refVal && refVal !== tgUser.id) {
        // Find referrer by Telegram ID, numeric UID, or username (case-insensitive)
        const referrer = db.users.find(u => 
          u.id === refVal || 
          String(u.uid) === refVal || 
          (u.username && u.username.toLowerCase() === refVal.toLowerCase())
        );
        if (referrer && referrer.id !== tgUser.id && !referrer.isBanned && !referrer.isFrozen) {
          user.referredBy = referrer.id;
          
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

                db.transactions.push({
                  id: `tx_milestone_${milestone.count}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  userId: referrer.id,
                  type: 'Reward',
                  amountTM: milestone.rewardTM,
                  amountUSDT: 0,
                  description: `Referral Milestone Reward: Reached ${milestone.count} Referrals!`,
                  createdAt: new Date().toISOString()
                });

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

// Gating referral rewards behind completed mandatory tasks count
export const checkAndProcessReferral = (userId: string, db: AppDatabase) => {
  const user = db.users.find(u => u.id === userId);
  if (!user || !user.referredBy || user.referralCounted) return;

  const completedTaskIds = db.completedTasks[userId] || [];
  const enabledTasks = db.tasks.filter(t => t.isEnabled);
  const mandatoryTasks = enabledTasks.filter(t => t.isMandatory);
  const completedMandatoryCount = mandatoryTasks.filter(t => completedTaskIds.includes(t.id)).length;

  const reqCount = db.settings.mandatoryTaskCount ?? 3;
  if (completedMandatoryCount >= reqCount) {
    user.referralCounted = true;
    const referrer = db.users.find(u => u.id === user.referredBy);
    if (referrer && !referrer.isBanned && !referrer.isFrozen) {
      const referralRewardTM = db.settings.referralRewardTM ?? 50;
      referrer.balanceTM += referralRewardTM;
      referrer.referralEarningsTM = (referrer.referralEarningsTM || 0) + referralRewardTM;
      referrer.referralCount += 1;

      // Log referral transaction for referrer
      db.transactions.push({
        id: `ref_tx_${Date.now()}`,
        userId: referrer.id,
        type: 'Referral',
        amountTM: referralRewardTM,
        amountUSDT: 0,
        description: `Referral Reward for inviting ${user.firstName} (@${user.username || user.id}) after completing mandatory tasks`,
        createdAt: new Date().toISOString()
      });

      // Dispatch Referral notification to the referrer
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: `notif_${Date.now()}_ref`,
        userId: referrer.id,
        title: 'Referral Completed! 👥',
        message: `Your invitee ${user.firstName} verified all mandatory tasks. You received +${referralRewardTM} TM!`,
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
          referrer.balanceTM += milestone.rewardTM;
          referrer.claimedMilestones.push(milestone.count);

          // Log milestone reward
          db.transactions.push({
            id: `tx_milestone_${milestone.count}_${Date.now()}`,
            userId: referrer.id,
            type: 'Reward',
            amountTM: milestone.rewardTM,
            amountUSDT: 0,
            description: `Referral Milestone Reward: Reached ${milestone.count} Referrals!`,
            createdAt: new Date().toISOString()
          });

          // Dispatch Milestone notification to the referrer
          db.notifications.unshift({
            id: `notif_${Date.now()}_ms_${milestone.count}`,
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
  // NOTE: Lifetime earnings must NOT include task rewards (only staking counts)!
  
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

  // Dispatch Notification
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: `notif_${Date.now()}_task_${taskId}`,
    userId: userId,
    title: 'Task Completed! ✅',
    message: `You completed "${task.title}" and earned +${rewardTM} TM!`,
    type: 'task_completed',
    createdAt: new Date().toISOString(),
    read: false
  });
  
  saveDB(db);
  return { success: true, message: `Completed task and earned ${rewardTM} TM!`, db, user };
};

// Submit a task for verification
export const submitUserTask = (
  userId: string, 
  taskId: string, 
  screenshotUrl?: string, 
  confirmationCode?: string
): { success: boolean; message: string; db: AppDatabase; user: UserProfile } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  const task = db.tasks.find(t => t.id === taskId);
  
  if (!user) return { success: false, message: "User not found", db, user: null as any };
  if (user.isBanned) return { success: false, message: "User account is banned", db, user };
  if (user.isFrozen) return { success: false, message: "User account is frozen", db, user };
  if (!task) return { success: false, message: "Task not found", db, user };

  if (!db.taskSubmissions) {
    db.taskSubmissions = [];
  }

  // Check if they already have an approved or pending submission for this task
  const existing = db.taskSubmissions.find(s => s.userId === userId && s.taskId === taskId);
  if (existing) {
    if (existing.status === 'Approved') {
      return { success: false, message: "You have already completed this task and it has been approved.", db, user };
    }
    if (existing.status === 'Pending') {
      return { success: false, message: "Your submission for this task is already pending verification.", db, user };
    }
  }

  // Remove any older rejected submissions for this task/user
  db.taskSubmissions = db.taskSubmissions.filter(s => !(s.userId === userId && s.taskId === taskId && s.status === 'Rejected'));

  const submission: TaskSubmission = {
    id: `task_sub_${Date.now()}`,
    userId,
    userUsername: user.username,
    userFirstName: user.firstName,
    taskId,
    taskTitle: task.title,
    taskRewardTM: task.rewardTM,
    screenshotUrl,
    confirmationCode,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  db.taskSubmissions.push(submission);
  saveDB(db);

  return { success: true, message: "Task submission received and is pending admin verification!", db, user };
};

// Process a task submission (Approve / Reject)
export const processTaskSubmission = (submissionId: string, status: 'Approved' | 'Rejected'): { success: boolean; message: string; db: AppDatabase } => {
  const db = getDB();
  if (!db.taskSubmissions) {
    db.taskSubmissions = [];
  }
  const submission = db.taskSubmissions.find(s => s.id === submissionId);
  if (!submission) {
    return { success: false, message: "Submission not found", db };
  }

  if (submission.status !== 'Pending') {
    return { success: false, message: `Submission is already ${submission.status}`, db };
  }

  submission.status = status;
  submission.processedAt = new Date().toISOString();

  if (status === 'Approved') {
    // Complete the task and award the rewards
    const user = db.users.find(u => u.id === submission.userId);
    const task = db.tasks.find(t => t.id === submission.taskId);
    if (user && task) {
      if (!db.completedTasks[submission.userId]) {
        db.completedTasks[submission.userId] = [];
      }
      if (!db.completedTasks[submission.userId].includes(submission.taskId)) {
        db.completedTasks[submission.userId].push(submission.taskId);
        
        // Reward user
        const rewardTM = task.rewardTM;
        const rewardUSDT = rewardTM / db.settings.conversionRate;
        user.balanceTM += rewardTM;

        // Log transaction
        db.transactions.push({
          id: `tx_task_${Date.now()}`,
          userId: user.id,
          type: 'Reward',
          amountTM: rewardTM,
          amountUSDT: rewardUSDT,
          description: `Task verified & completed: ${task.title}`,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  saveDB(db);
  return { success: true, message: `Task submission ${status.toLowerCase()} successfully!`, db };
};

// Check-in / Claim Daily Bonus
export const claimDailyBonus = (userId: string): { success: boolean; message: string; db: AppDatabase; user: UserProfile } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) return { success: false, message: "User not found", db, user: null as any };
  if (user.isBanned) return { success: false, message: "User account is banned", db, user };
  if (user.isFrozen) return { success: false, message: "User account is frozen", db, user };
  if (!db.settings.dailyBonusEnabled) return { success: false, message: "Daily bonus is currently disabled", db, user };
  
  // Staking bonus rule: Every 1000 TM earns 0.11 USDT every 24 hours. (Formula: (balanceTM / 1000) * bonusRate)
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
  
  // Calculate bonus: 0.11 USDT per 1000 TM
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

  // Dispatch notification
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: `notif_${Date.now()}_daily_${userId}`,
    userId: userId,
    title: 'Daily Bonus Claimed! 🌟',
    message: `Claimed +${bonusUSDT} USDT bonus for holding ${user.balanceTM.toLocaleString()} TM!`,
    type: 'daily_claimed',
    createdAt: now.toISOString(),
    read: false
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
  
  const minDeposit = db.settings.depositMinUSDT ?? 1.0;
  if (amountUSDT < minDeposit) {
    return { success: false, message: `Minimum deposit amount is ${minDeposit} USDT`, db, user };
  }
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
  if (db.settings.withdrawEnabled === false) {
    return {
      success: false,
      message: db.settings.withdrawDisabledMessage || "🚫 Withdrawals are temporarily unavailable. Please try again later.",
      db,
      user
    };
  }
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

export const checkAndProcessReferralDepositTiers = (user: UserProfile, db: AppDatabase) => {
  // If referral system is disabled or user doesn't have a referrer, exit
  if (db.settings.referralSystemEnabled === false || !user.referredBy) return;

  // Find referrer
  const referrer = db.users.find(u => u.id === user.referredBy || String(u.uid) === user.referredBy);
  if (!referrer || referrer.id === user.id || referrer.isBanned || referrer.isFrozen) return;

  // Initialize arrays if they don't exist
  if (!user.claimedReferralTiers) {
    user.claimedReferralTiers = [];
  }

  // Calculate user's total approved deposits
  const totalApprovedDeposits = db.deposits
    .filter(d => d.userId === user.id && d.status === 'Approved')
    .reduce((sum, d) => sum + d.amountUSDT, 0);

  // Define tiers
  const tiers = [
    { threshold: db.settings.referralMinWithdrawRequirementUSD ?? 10.0, reward: db.settings.referralRewardAmountUSD ?? 3.0 },
    { threshold: 50.0, reward: 10.0 },
    { threshold: 100.0, reward: 15.0 }
  ];

  tiers.forEach(tier => {
    if (totalApprovedDeposits >= tier.threshold && !user.claimedReferralTiers!.includes(tier.threshold)) {
      // Credit referrer
      referrer.balanceUSDT += tier.reward;
      referrer.referralEarningsUSDT = (referrer.referralEarningsUSDT || 0) + tier.reward;
      referrer.lifetimeEarningsUSDT = (referrer.lifetimeEarningsUSDT || 0) + tier.reward;
      
      // If this is the first tier, increment referralCount and set referralCounted
      if (tier.threshold === (db.settings.referralMinWithdrawRequirementUSD ?? 10.0)) {
        referrer.referralCount += 1;
        user.referralCounted = true;
      }

      // Mark tier as claimed for this referred user
      user.claimedReferralTiers!.push(tier.threshold);

      // Add transaction log for the referrer
      db.transactions.push({
        id: `ref_tier_reward_${tier.threshold}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: referrer.id,
        type: 'Referral',
        amountTM: 0,
        amountUSDT: tier.reward,
        description: `Referral Reward ($${tier.reward}) for inviting ${user.firstName} (@${user.username || user.id}) - Tier $${tier.threshold}+ Deposit unlocked`,
        createdAt: new Date().toISOString()
      });

      // Dispatch Notification for referrer
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: `notif_${Date.now()}_ref_tier_${tier.threshold}`,
        userId: referrer.id,
        title: `Referral Milestone Unlocked! 🎁`,
        message: `Your invitee ${user.firstName} deposited a cumulative $${totalApprovedDeposits} USDT (Unlocked Tier $${tier.threshold}+). You have been credited with a $${tier.reward} USDT reward!`,
        type: 'referral_completed',
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  });
};

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

  // Dispatch Notification
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: `notif_${Date.now()}_dep_appr`,
    userId: user.id,
    title: 'Deposit Approved! 💰',
    message: `Your deposit of ${deposit.amountUSDT} USDT was approved! Credited +${earnedTM.toLocaleString()} TM to your holding account.`,
    type: 'deposit_approved',
    createdAt: new Date().toISOString(),
    read: false
  });
  
  // Check and process referral deposit tier rewards
  checkAndProcessReferralDepositTiers(user, db);
  
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

    // Dispatch Notification
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift({
      id: `notif_${Date.now()}_dep_rej`,
      userId: user.id,
      title: 'Deposit Rejected! ❌',
      message: `Your deposit request of ${deposit.amountUSDT} USDT was rejected by the admin. Please verify your TXID and resubmit.`,
      type: 'deposit_approved', // categorizes as deposit status
      createdAt: new Date().toISOString(),
      read: false
    });
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

  // Dispatch Notification
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: `notif_${Date.now()}_wd_appr`,
    userId: user.id,
    title: 'Withdrawal Approved! 💸',
    message: `Your withdrawal request of ${withdrawal.amountUSDT} USDT to ${withdrawal.walletAddress} has been approved and sent!`,
    type: 'withdraw_approved',
    createdAt: new Date().toISOString(),
    read: false
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

  // Dispatch Notification
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: `notif_${Date.now()}_wd_rej`,
    userId: user.id,
    title: 'Withdrawal Rejected! ❌',
    message: `Your withdrawal request of ${withdrawal.amountUSDT} USDT was rejected. ${withdrawal.amountUSDT} USDT has been refunded to your balance.`,
    type: 'withdraw_approved',
    createdAt: new Date().toISOString(),
    read: false
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

// Peer-to-Peer Transfer (TM ID to ID share)
export const transferTMBalance = (
  senderId: string,
  recipientId: string,
  amountTM: number
): { success: boolean; message: string; db: AppDatabase; user?: UserProfile } => {
  const db = getDB();
  const sender = db.users.find(u => u.id === senderId);
  if (!sender) return { success: false, message: "Sender profile not found", db };
  if (sender.isBanned) return { success: false, message: "Your account is banned.", db, user: sender };
  if (sender.isFrozen) return { success: false, message: "Your account is frozen.", db, user: sender };

  if (amountTM <= 0) {
    return { success: false, message: "Transfer amount must be greater than 0.", db, user: sender };
  }

  if (sender.balanceTM < amountTM) {
    return { success: false, message: `Insufficient TM balance. You have ${sender.balanceTM} TM.`, db, user: sender };
  }

  const cleanRecipientId = recipientId.trim();
  if (!cleanRecipientId) {
    return { success: false, message: "Please enter a valid recipient ID.", db, user: sender };
  }

  if (senderId === cleanRecipientId) {
    return { success: false, message: "You cannot transfer TM to yourself.", db, user: sender };
  }

  const recipient = db.users.find(u => u.id === cleanRecipientId);
  if (!recipient) {
    return { success: false, message: `Recipient User ID "${cleanRecipientId}" not found. Please verify the ID.`, db, user: sender };
  }

  if (recipient.isBanned) {
    return { success: false, message: "Recipient account is banned and cannot receive TM.", db, user: sender };
  }

  // Perform the transfer
  sender.balanceTM -= amountTM;
  recipient.balanceTM += amountTM;

  const timestamp = new Date().toISOString();

  // Create transaction logs for both users
  db.transactions.push({
    id: `tx_sent_${Date.now()}_1`,
    userId: senderId,
    type: 'TransferSent',
    amountTM: -amountTM,
    amountUSDT: 0,
    description: `Sent ${amountTM.toLocaleString()} TM to User ID: ${recipient.id} (${recipient.firstName})`,
    createdAt: timestamp
  });

  db.transactions.push({
    id: `tx_recv_${Date.now()}_2`,
    userId: recipient.id,
    type: 'TransferReceived',
    amountTM: amountTM,
    amountUSDT: 0,
    description: `Received ${amountTM.toLocaleString()} TM from User ID: ${sender.id} (${sender.firstName})`,
    createdAt: timestamp
  });

  saveDB(db);
  return {
    success: true,
    message: `Successfully transferred ${amountTM.toLocaleString()} TM to ${recipient.firstName} (ID: ${recipient.id})!`,
    db,
    user: sender
  };
};

// Complete onboarding and credit referral
export const completeUserOnboarding = (userId: string): { success: boolean; db: AppDatabase; user: UserProfile } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return { success: false, db, user: null as any };
  
  user.mandatoryCompleted = true;
  
  saveDB(db);
  return { success: true, db, user };
};

// Process referral on dashboard open
export const processReferralOnDashboardOpen = (userId: string): { success: boolean; db: AppDatabase; user?: UserProfile } => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user || !user.referredBy || user.referralCounted) return { success: false, db };
  
  if (user.mandatoryCompleted) {
    checkAndProcessReferral(userId, db);
    saveDB(db);
    const updatedUser = db.users.find(u => u.id === userId);
    return { success: true, db, user: updatedUser };
  }
  return { success: false, db };
};

// User-to-User Transfer using UID
export const lookupRecipientByUid = (uid: number): { success: boolean; name?: string; uid?: number; message?: string; isOffline?: boolean } => {
  const db = getDB();
  const user = db.users.find(u => u.uid === uid);
  if (!user) {
    return { 
      success: true, 
      name: 'Offline Member', 
      uid: uid,
      isOffline: true,
      message: 'Secure Offline Hold: This member is not registered yet. Funds will be held securely and credited automatically when they join!'
    };
  }
  return { 
    success: true, 
    name: `${user.firstName} ${user.lastName || ''}`.trim(), 
    uid: user.uid,
    isOffline: false
  };
};

export const executeUserTransfer = async (
  senderId: string, 
  receiverUid: number, 
  amount: number,
  currency: 'TM' | 'USDT' = 'TM'
): Promise<{ success: boolean; message: string; db?: AppDatabase }> => {
  try {
    const response = await fetch('/api/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverUid, amount })
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.db) {
        cachedDb = data.db;
      }
      return data;
    } else {
      const err = await response.json();
      return { success: false, message: err.error || 'Transfer failed.' };
    }
  } catch (e: any) {
    console.error('Error in executeUserTransfer', e);
    return { success: false, message: 'Server connection failed.' };
  }
};


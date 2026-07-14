export interface TelegramUser {
  id: string; // Telegram User ID
  username?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
}

export interface UserProfile extends TelegramUser {
  uid: number; // Permanent unique numeric UID starting at 100001
  email?: string; // Optional email
  registeredAt: string;
  balanceTM: number;
  balanceUSDT: number;
  lifetimeEarningsUSDT: number;
  referralEarningsUSDT: number;
  referralEarningsTM?: number; // Earned TM from referrals
  todayBonusUSDT: number;
  depositStatus: 'None' | 'Pending' | 'Approved';
  withdrawStatus: 'None' | 'Pending' | 'Approved';
  referralCount: number;
  referredBy?: string; // User ID or UID of who referred this user
  referralCounted?: boolean; // Referral converted after completing mandatory tasks or first withdrawal
  claimedMilestones?: number[]; // List of referral milestones already rewarded (e.g. [5, 10])
  claimedReferralTiers?: number[]; // List of deposit referral tiers already rewarded to referrer (e.g. [10, 50, 100])
  isFrozen: boolean;
  isBanned: boolean;
  mandatoryCompleted?: boolean; // User has seen and completed mandatory tasks
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deposit_approved' | 'withdraw_approved' | 'daily_claimed' | 'referral_completed' | 'milestone_unlocked' | 'task_completed';
  createdAt: string;
  read: boolean;
}

export type TaskType = 'TelegramChannel' | 'TelegramGroup' | 'TelegramBot' | 'DailyCheckIn' | 'Referral' | 'Custom' | 'ExternalLink';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  rewardTM: number;
  link: string;
  isMandatory: boolean;
  displayOrder: number;
  isEnabled: boolean;
  requiresVerification: boolean;
  channelId?: string; // Optional Channel ID for Bot API checks
}

export interface Channel {
  id: string;
  name: string;
  username: string;
  inviteLink: string;
  rewardTM: number;
  isEnabled: boolean;
  displayOrder: number;
  isMandatory: boolean;
  requiresVerification: boolean;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userUsername?: string;
  userFirstName: string;
  amountUSDT: number;
  txid: string;
  screenshotUrl: string; // Base64 or standard asset url
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  processedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userUsername?: string;
  userFirstName: string;
  amountUSDT: number;
  walletAddress: string;
  ruleId: string;
  ruleDescription: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  processedAt?: string;
}

export interface WithdrawalRule {
  id: string;
  minAmountUSDT: number;
  maxAmountUSDT: number;
  requiredLifetimeDepositUSDT: number;
  description: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'Reward' | 'Deposit' | 'Withdraw' | 'DailyBonus' | 'Referral' | 'TransferSent' | 'TransferReceived';
  amountTM: number;
  amountUSDT: number;
  description: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userFirstName: string;
  userUsername?: string;
  subject: string;
  status: 'Open' | 'Replied' | 'Closed';
  createdAt: string;
  messages: {
    sender: 'user' | 'admin';
    text: string;
    createdAt: string;
  }[];
}

export interface TaskSubmission {
  id: string;
  userId: string;
  userUsername?: string;
  userFirstName: string;
  taskId: string;
  taskTitle: string;
  taskRewardTM: number;
  screenshotUrl?: string; // base64 string
  confirmationCode?: string; // confirmation code or username
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  processedAt?: string;
}

export interface UserTransfer {
  id: string;
  senderUid: number;
  receiverUid: number;
  amountTM: number;
  createdAt: string;
  status: 'Success' | 'Failed';
}

export interface SystemSettings {
  conversionRate: number; // 1 USDT = X TM
  referralRewardUSDT: number; // 0.03 USDT
  referralRewardTM: number; // Reward in TM (e.g. 50 TM)
  dailyBonusRateUSDT: number; // 0.11 USDT per 1000 TM
  dailyBonusIntervalHours: number; // 24 hours
  dailyBonusEnabled: boolean;
  walletAddressUSDT: string;
  qrCodeUrl: string;
  autoApprovalEnabled: boolean;
  maintenanceMode: boolean;
  announcement?: string;
  mandatoryTaskCount: number; // Minimum mandatory tasks required for referral activation
  depositMinUSDT: number; // Minimum deposit in USDT
  referralMilestones: { count: number; rewardTM: number }[]; // Referral milestones
  withdrawEnabled?: boolean; // Admin ON/OFF Toggle
  withdrawDisabledMessage?: string; // Message shown when withdrawals are off
  referralSystemEnabled: boolean; // Enable/Disable referral system
  referralRewardAmountUSD: number; // Reward for successful referral (e.g. $3)
  referralMinWithdrawRequirementUSD: number; // Minimum withdrawal of friend to trigger reward (e.g. $10)
}

export interface AppDatabase {
  users: UserProfile[];
  tasks: Task[];
  channels: Channel[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  withdrawalRules: WithdrawalRule[];
  transactions: Transaction[];
  transfers?: UserTransfer[]; // User-to-User transfer history
  tickets: SupportTicket[];
  settings: SystemSettings;
  completedTasks: { [userId: string]: string[] }; // userId -> taskId[]
  claimedBonuses: { [userId: string]: string }; // userId -> lastClaimedIsoString
  taskSubmissions: TaskSubmission[];
  notifications?: UserNotification[]; // Persisted notification center alert logs
  lastInterestPayout?: string; // ISO string of last automatic interest settlement
  giftCodes?: GiftCode[]; // Gift codes list
}

export interface GiftCode {
  code: string;
  rewardAmount: number;
  maxClaims: number;
  claimsCount: number;
  expiryDate?: string; // Optional expiry date
  isEnabled: boolean;
  createdAt: string;
  claimedBy: string[]; // List of user IDs who claimed this code
}

declare global {
  interface Window {
    Telegram?: any;
  }
}


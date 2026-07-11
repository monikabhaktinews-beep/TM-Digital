export interface TelegramUser {
  id: string; // Telegram User ID
  username?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
}

export interface UserProfile extends TelegramUser {
  registeredAt: string;
  balanceTM: number;
  balanceUSDT: number;
  lifetimeEarningsUSDT: number;
  referralEarningsUSDT: number;
  todayBonusUSDT: number;
  depositStatus: 'None' | 'Pending' | 'Approved';
  withdrawStatus: 'None' | 'Pending' | 'Approved';
  referralCount: number;
  referredBy?: string; // User ID of who referred this user
  isFrozen: boolean;
  isBanned: boolean;
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
  type: 'Reward' | 'Deposit' | 'Withdraw' | 'DailyBonus' | 'Referral';
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

export interface SystemSettings {
  conversionRate: number; // 1 USDT = X TM
  referralRewardUSDT: number; // 0.03 USDT
  dailyBonusRateUSDT: number; // 0.05 USDT per 1000 TM
  dailyBonusIntervalHours: number; // 24 hours
  dailyBonusEnabled: boolean;
  walletAddressUSDT: string;
  qrCodeUrl: string;
  autoApprovalEnabled: boolean;
  maintenanceMode: boolean;
  announcement?: string;
}

export interface AppDatabase {
  users: UserProfile[];
  tasks: Task[];
  channels: Channel[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  withdrawalRules: WithdrawalRule[];
  transactions: Transaction[];
  tickets: SupportTicket[];
  settings: SystemSettings;
  completedTasks: { [userId: string]: string[] }; // userId -> taskId[]
  claimedBonuses: { [userId: string]: string }; // userId -> lastClaimedIsoString
}

declare global {
  interface Window {
    Telegram?: any;
  }
}


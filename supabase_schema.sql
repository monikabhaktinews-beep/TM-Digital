-- Supabase Database Schema Script
-- Run this in your Supabase SQL Editor to provision all required tables and relationships!

-- 1. Create the App State table (for storing global settings, tasks, and system variables)
CREATE TABLE IF NOT EXISTS app_state (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Create the Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Telegram User ID (e.g. '111111111')
    uid BIGINT UNIQUE NOT NULL, -- Sequential numeric UID (starts at 117301)
    username TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    photo_url TEXT,
    language_code TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    balance_tm NUMERIC NOT NULL DEFAULT 0.0,
    balance_usdt NUMERIC NOT NULL DEFAULT 0.0,
    lifetime_earnings_usdt NUMERIC NOT NULL DEFAULT 0.0,
    referral_earnings_usdt NUMERIC NOT NULL DEFAULT 0.0,
    today_bonus_usdt NUMERIC NOT NULL DEFAULT 0.0,
    deposit_status TEXT NOT NULL DEFAULT 'None',
    withdraw_status TEXT NOT NULL DEFAULT 'None',
    referral_count INTEGER NOT NULL DEFAULT 0,
    referral_counted BOOLEAN NOT NULL DEFAULT FALSE,
    referred_by TEXT,
    claimed_milestones TEXT NOT NULL DEFAULT '[]', -- JSON array serialized as text
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    mandatory_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Create the Referrals table to track relationships
CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (referrer_id, referee_id)
);

-- 4. Create the Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount_tm NUMERIC NOT NULL DEFAULT 0.0,
    amount_usdt NUMERIC NOT NULL DEFAULT 0.0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create the Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_username TEXT,
    user_first_name TEXT NOT NULL,
    amount_usdt NUMERIC NOT NULL DEFAULT 0.0,
    wallet_address TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    rule_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);

-- Disable Row Level Security (RLS) for seamless integration, or set up open policies:
ALTER TABLE app_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;

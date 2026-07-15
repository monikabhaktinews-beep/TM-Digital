# ==============================================================================
# TELEGRAM BOT CREATOR / START HANDLER (PYTHON TELEBOT WITH LIVE DB PERSISTENCE)
# ==============================================================================
# 
# This is a complete, copy-paste ready Python script to run your Telegram Bot.
# It reads/writes directly to the database file `server_db.json` on `/start`
# to ensure users are registered, lookups are safe, and referral rewards are applied.
#
# Requirements:
#   pip install pyTelegramBotAPI
#
# How to run:
#   1. Replace 'YOUR_TELEGRAM_BOT_TOKEN' with the token you got from @BotFather.
#   2. Replace 'YOUR_MINI_APP_USERNAME' with your Mini App link username (e.g., 'TMDigitalEarningBot').
#   3. Run the script: `python telegram_bot_creator.py`
#
# ==============================================================================

import os
import json
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton
from datetime import datetime

# 1. CONFIGURE YOUR BOT DETAILS HERE
BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'  # <-- Replace with your real @BotFather token
MINI_APP_USERNAME = 'TMDigitalEarningBot'  # <-- Replace with your Mini App bot / link username
DB_FILE = 'server_db.json'

# Initialize the bot
bot = telebot.TeleBot(BOT_TOKEN)

def load_db():
    if not os.path.exists(DB_FILE):
        # Return blank structure if file doesn't exist
        return {
            "users": [],
            "transactions": [],
            "notifications": [],
            "settings": {
                "conversionRate": 1000,
                "referralRewardUSDT": 0.03,
                "referralRewardTM": 100,
                "dailyBonusRateUSDT": 0.11
            }
        }
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Error reading {DB_FILE}: {e}")
        return None

def save_db(db):
    try:
        with open(DB_FILE, 'w', encoding='utf-8') as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"❌ Error saving database file: {e}")
        return False

print("⚡ Telegram Bot Creator Online and Polling for /start commands...")

@bot.message_handler(commands=['start'])
def handle_start(message):
    chat_id = str(message.chat.id)
    from_user = message.from_user
    username = from_user.username or f"user_{chat_id}"
    first_name = from_user.first_name or "User"
    last_name = from_user.last_name or ""
    photo_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={chat_id}"
    language_code = from_user.language_code or "en"

    # Extract start parameter (referral ID) if passed
    # Example format: "/start ref_117301" or "/start 117301"
    start_param = ""
    command_parts = message.text.split()
    if len(command_parts) > 1:
        start_param = command_parts[1].strip()
        if start_param.startswith('ref_'):
            start_param = start_param[4:]

    # Load database to verify user and process referrals
    db = load_db()
    
    if db is not None:
        # Check if user already exists in the system by their unique Telegram User ID
        user = next((u for u in db.get("users", []) if str(u.get("id")) == chat_id), None)
        
        if user:
            print(f"👤 Existing user {first_name} (@{username}) with ID {chat_id} returned!")
            # Update fields dynamically if username or name changed (prevents broken lookup)
            user["username"] = username
            user["firstName"] = first_name
            if last_name:
                user["lastName"] = last_name
        else:
            # Register new user record securely
            print(f"✨ New user {first_name} (@{username}) with ID {chat_id} registered!")
            
            # Find next unique sequential numeric UID starting from 117301
            existing_uids = [u.get("uid", 0) for u in db.get("users", []) if "uid" in u]
            max_uid = max(existing_uids) if existing_uids else 117300
            next_uid = 117301 if max_uid < 117301 else max_uid + 1

            user = {
                "id": chat_id,
                "uid": next_uid,
                "username": username,
                "firstName": first_name,
                "lastName": last_name,
                "photoUrl": photo_url,
                "languageCode": language_code,
                "registeredAt": datetime.utcnow().isoformat() + "Z",
                "balanceTM": 0,
                "balanceUSDT": 0.0,
                "lifetimeEarningsUSDT": 0.0,
                "referralEarningsUSDT": 0.0,
                "todayBonusUSDT": 0.0,
                "depositStatus": "None",
                "withdrawStatus": "None",
                "referralCount": 0,
                "referralCounted": False,
                "isFrozen": False,
                "isBanned": False,
                "mandatoryCompleted": False
            }
            db.setdefault("users", []).append(user)
            
            # Handle Referral Processing on Registration
            if start_param and start_param != chat_id:
                # Find referrer by ID, numeric UID, or username
                referrer = next((
                    u for u in db.get("users", []) 
                    if str(u.get("id")) == start_param or 
                       str(u.get("uid")) == start_param or 
                       (u.get("username") and u.get("username").lower() == start_param.lower())
                ), None)
                
                if referrer and str(referrer.get("id")) != chat_id and not referrer.get("isBanned") and not referrer.get("isFrozen"):
                    user["referredBy"] = referrer["id"]
                    user["referralCounted"] = True
                    
                    # Grant $0.03 USDT instant referral bonus to the referrer as requested
                    reward_usdt = 0.03
                    referrer["balanceUSDT"] = round(referrer.get("balanceUSDT", 0.0) + reward_usdt, 4)
                    referrer["referralEarningsUSDT"] = round(referrer.get("referralEarningsUSDT", 0.0) + reward_usdt, 4)
                    referrer["referralCount"] = referrer.get("referralCount", 0) + 1
                    
                    # Create transaction log
                    tx_id = f"ref_tx_{int(datetime.utcnow().timestamp())}"
                    db.setdefault("transactions", []).append({
                        "id": tx_id,
                        "userId": referrer["id"],
                        "type": "Referral",
                        "amountTM": 100,
                        "amountUSDT": reward_usdt,
                        "description": f"Referral Reward for inviting {first_name} (@{username})",
                        "createdAt": datetime.utcnow().isoformat() + "Z"
                    })
                    
                    # Create notification
                    notif_id = f"notif_{int(datetime.utcnow().timestamp())}_ref"
                    db.setdefault("notifications", []).insert(0, {
                        "id": notif_id,
                        "userId": referrer["id"],
                        "title": "Referral Completed! 👥",
                        "message": f"Your invitee {first_name} joined. You received +${reward_usdt} USDT & +100 TM!",
                        "type": "referral_completed",
                        "createdAt": datetime.utcnow().isoformat() + "Z",
                        "read": False
                    })
                    print(f"🎁 Reward of ${reward_usdt} USDT successfully credited to Referrer: {referrer['firstName']} (UID: {referrer['uid']})")
        
        save_db(db)

    # Build the direct Website-based or Telegram start URL
    # (Since startapp has constraints, we construct both options)
    webapp_url = f"https://t.me/{MINI_APP_USERNAME}/app"
    if start_param:
        webapp_url += f"?startapp={start_param}"

    # Design the interface welcome message
    welcome_text = (
        f"👋 *Welcome back to TM Digital Earning, {first_name}!*\n\n"
        f"👤 *Your Account Details:*\n"
        f"• *Your UID:* `{user.get('uid', 'N/A')}`\n"
        f"• *Telegram ID:* `{chat_id}`\n"
        f"• *USDT Balance:* `${user.get('balanceUSDT', 0.0):.2f}` USDT\n\n"
        f"🚀 Tap the button below to launch the Mini App and claim your daily interest payouts!"
    ) if user and user.get("registeredAt") else (
        f"👋 *Welcome to TM Digital Earning, {first_name}!*\n\n"
        f"💰 Complete mandatory social tasks, hold TM staking tokens, and earn commissions in USDT!\n\n"
        f"🚀 Tap the button below to launch the Mini App, complete tasks, and withdraw instantly!"
    )

    # Keyboard buttons
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton(text="🚀 Open Mini App", web_app=telebot.types.WebAppInfo(url=webapp_url)))
    markup.add(InlineKeyboardButton(text="📢 Join Official Channel", url="https://t.me/TMDigitalAnnouncements"))

    try:
        bot.send_message(chat_id=chat_id, text=welcome_text, parse_mode='Markdown', reply_markup=markup)
        print(f"✅ Message sent successfully to user {chat_id}!")
    except Exception as e:
        print(f"❌ Failed to send welcome message: {e}")

# Start polling
if __name__ == '__main__':
    bot.infinity_polling()

# ==============================================================================
# TELEGRAM BOT CREATOR / START HANDLER (PYTHON TELEBOT)
# ==============================================================================
# 
# This is a complete, copy-paste ready Python script to run your Telegram Bot.
# It uses the popular `pyTelegramBotAPI` library (commonly imported as `telebot`).
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

import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

# 1. CONFIGURE YOUR BOT DETAILS HERE
BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'  # <-- Replace with your real @BotFather token
MINI_APP_USERNAME = 'TMDigitalEarningBot'  # <-- Replace with your Mini App bot / link username

# Initialize the bot
bot = telebot.TeleBot(BOT_TOKEN)

print("⚡ Telegram Bot Creator Online and Polling for /start commands...")

@bot.message_handler(commands=['start'])
def handle_start(message):
    chat_id = message.chat.id
    user_first_name = message.from_user.first_name
    
    # Extract start parameter (referral ID) if passed
    # Example format: "/start ref_111111111"
    start_param = ""
    command_parts = message.text.split()
    
    if len(command_parts) > 1:
        start_param = command_parts[1]
        print(f"👥 Referral detected! Parameter: {start_param} from User ID: {chat_id}")
    else:
        print(f"👤 Normal join! User ID: {chat_id}")

    # Build the direct WebApp URL with referral code
    # If a referral code exists, append it to startapp; otherwise just open the app.
    if start_param:
        webapp_url = f"https://t.me/{MINI_APP_USERNAME}/app?startapp={start_param}"
    else:
        webapp_url = f"https://t.me/{MINI_APP_USERNAME}/app"

    # 2. DESIGN THE WELCOME INTERFACE WITH ACTION BUTTONS
    welcome_text = (
        f"👋 *Welcome to TM Digital Earning, {user_first_name}!*\n\n"
        f"💰 Complete mandatory social tasks, hold TM staking tokens, and earn commissions in USDT!\n\n"
        f"🎁 *Referral Active:* You joined through an invite link. Complete your mandatory verification "
        f"tasks in the Mini App to unlock the dashboard and claim rewards!"
    ) if start_param else (
        f"👋 *Welcome to TM Digital Earning, {user_first_name}!*\n\n"
        f"💰 Complete mandatory social tasks, hold TM staking tokens, and earn commissions in USDT!\n\n"
        f"🚀 Tap the button below to launch the Mini App and start earning now!"
    )

    # Build Inline Keyboard with Web App Button
    markup = InlineKeyboardMarkup()
    
    # WebApp button that directly launches the Mini App
    webapp_button = InlineKeyboardButton(
        text="🚀 Open Mini App", 
        web_app=telebot.types.WebAppInfo(url=webapp_url)
    )
    markup.add(webapp_button)

    # Optional: Add help and channel buttons
    channel_button = InlineKeyboardButton(
        text="📢 Join Channel", 
        url="https://t.me/TMDigitalAnnouncements"  # <-- Replace with your real Telegram Channel
    )
    markup.add(channel_button)

    # Send message with Markdown formatting
    try:
        bot.send_message(
            chat_id=chat_id, 
            text=welcome_text, 
            parse_mode='Markdown', 
            reply_markup=markup
        )
        print(f"✅ Welcome message sent successfully to user {chat_id}!")
    except Exception as e:
        print(f"❌ Failed to send welcome message: {e}")

# Start polling
if __name__ == '__main__':
    bot.infinity_polling()

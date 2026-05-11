const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log("✅ Bot Active...");

bot.on('polling_error', (error) => {
  console.log(`[POLLING_ERROR] ${error.code}: ${error.message}`);
});

process.on('uncaughtException', (err) => {
  console.log(`[CRITICAL_ERROR] ${err.message}`);
});

// =========================
// PostgreSQL Connection
// =========================
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

db.connect()
  .then(() => console.log("✅ Database Connected Successfully."))
  .catch(err => console.error("❌ Database Error:", err.message));

// =========================
// START COMMAND
// =========================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || "Friend";
  const joinedAt = new Date();

  try {
    const result = await db.query('SELECT * FROM users WHERE telegram_id = $1', [chatId]);

    if (result.rows.length === 0) {
      await db.query(
        "INSERT INTO users (telegram_id, name, points, binance_email, joined_at, balance) VALUES ($1, $2, 10, '', $3, 0)",
        [chatId, firstName, joinedAt]
      );
      console.log(`👤 New User Joined: ${firstName}`);
      sendWelcomeMessage(chatId, firstName, true);
    } else {
      await db.query('UPDATE users SET name = $1 WHERE telegram_id = $2', [firstName, chatId]);
      sendWelcomeMessage(chatId, firstName, false);
    }
  } catch (err) {
    console.error("❌ Start Error:", err.message);
  }
});

function sendWelcomeMessage(chatId, firstName, isNewUser) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Open App & Earn", web_app: { url: "https://YOUR_DOMAIN_HERE/telegram/dashboard.html" } }],
        [
          { text: "🧠 Play Quiz", web_app: { url: "https://YOUR_DOMAIN_HERE/telegram/quiz.html" } },
          { text: "🏦 Withdraw", web_app: { url: "https://YOUR_DOMAIN_HERE/telegram/withdrawals.html" } }
        ]
      ]
    }
  };

  let message = "";

  if (isNewUser) {
    message =
`🚀 *Welcome to the App, ${firstName}!*

🌍 *The Best Quiz App for Earners!*
Turn your knowledge into pocket money. 🤑

📝 *How to Earn? (3 Easy Steps)*
1️⃣ *Play Quiz:* Answer simple questions. 🧠
2️⃣ *Win Coins:* Get rewards for every win. 🪙
3️⃣ *Real Cash:* Convert coins to Real Money! 💸

🎁 *Registration Gift:*
You received *10 Coins* for free! 🎁

*Click "Open App" to start earning!* 👇`;
  } else {
    message =
`👋 *Welcome Back, ${firstName}!*

🧠 *Ready to increase your knowledge?*
Play quizzes and earn more coins today.

💰 *Status:* Active
🚀 *Mode:* Earning ON

*Tap below to continue!* 👇`;
  }

  bot.sendMessage(chatId, message, { parse_mode: "Markdown", ...keyboard });
}

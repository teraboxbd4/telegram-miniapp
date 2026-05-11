const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql2');

const token = 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(token, { polling: true });

console.log("YourAppName Bot Active (Updated Text)...");

// --- ANTI-CRASH SYSTEM ---
bot.on('polling_error', (error) => {
  console.log(`[POLLING_ERROR] ${error.code}: ${error.message}`);
});

process.on('uncaughtException', (err) => {
  console.log(`[CRITICAL_ERROR] ${err.message}`);
});

// --- DATABASE CONNECTION POOL ---
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'YOUR_MYSQL_PASSWORD_HERE',
  database: 'your_database_name',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connection Test
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database Error:", err.message);
  } else {
    console.log("✅ Database Connected Successfully.");
    connection.release(); 
  }
});

// --- START COMMAND ---
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || "Friend";
  const joinedAt = new Date();

  db.query('SELECT * FROM users WHERE telegram_id = ?', [chatId], (err, results) => {
    if (err) {
      console.error("❌ Lookup Error:", err.message);
      return;
    }

    if (results.length === 0) {
      const insertSql = "INSERT INTO users (telegram_id, name, points, binance_email, joined_at, balance) VALUES (?, ?, 10, '', ?, 0)";
      db.query(insertSql, [chatId, firstName, joinedAt], (err2) => {
        if (err2) console.error("❌ Insert Error:", err2.message);
        else console.log(`👤 New User Joined: ${firstName}`);
        sendWelcomeMessage(chatId, firstName, true);
      });
    } else {
      db.query('UPDATE users SET name = ? WHERE telegram_id = ?', [firstName, chatId]);
      sendWelcomeMessage(chatId, firstName, false);
    }
  });
});

// --- NEW ATTRACTIVE MESSAGE FUNCTION ---
function sendWelcomeMessage(chatId, firstName, isNewUser) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "\uD83D\uDE80 Open App & Earn", web_app: { url: "https://yourdomain.com/telegram/dashboard.html" } }
        ],
        [
          { text: "\uD83E\uDDE0 Play Quiz", web_app: { url: "https://yourdomain.com/telegram/quiz.html" } },
          { text: "\uD83C\uDFE6 Withdraw", web_app: { url: "https://yourdomain.com/telegram/withdrawals.html" } }
        ]
      ]
    }
  };

  let message = "";

  if (isNewUser) {
    // New User Message (Detailed Guide)
    message = 
`🚀 *Welcome to YourAppName, ${firstName}!*

🌍 *The Best Quiz App for Students & Learners!*
Turn your knowledge into pocket money. 🤑

📝 *How to Earn? (3 Easy Steps)*
1️⃣ *Play Quiz:* Answer simple questions. \uD83E\uDDE0
2️⃣ *Win Coins:* Get rewards for every win. \uD83E\uDE99
3️⃣ *Real Cash:* Convert coins to Real Money! \uD83D\uDCB8

🎁 *Registration Gift:*
You received *10 Coins* for free! \uD83C\uDF81

*Click "Open App" to start earning!* \uD83D\uDC47`;
  } else {
    // Returning User Message (Short & Sweet)
    message = 
`\uD83D\uDC4B *Welcome Back, ${firstName}!*

🧠 *Ready to increase your knowledge?*
Play quizzes and earn more coins today.

\uD83D\uDCB0 *Status:* Active
🚀 *Mode:* Earning ON

*Tap below to continue!* \uD83D\uDC47`;
  }

  bot.sendMessage(chatId, message, { parse_mode: "Markdown", ...keyboard });
}

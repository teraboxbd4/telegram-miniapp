const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + '/user'));

// =========================
// PostgreSQL Connection
// =========================
const db = new Pool({
  host: "aws-1-ap-southeast-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.ecblqqfxjtxpgvmuqxtd",
  password: "AVNS_hzGH8yeaY28AUeLVWQ4",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

db.connect()
  .then(() => console.log("✅ Connected to PostgreSQL (Supabase)"))
  .catch(err => console.error("❌ DB Connection failed:", err));

// =========================
// Test Route
// =========================
app.get("/", (req, res) => {
  res.send("🚀 Telegram Mini App Backend is Running!");
});

// =========================
// QUIZ ROUTES
// =========================
app.get("/api/quizzes/:telegram_id", async (req, res) => {
  const { telegram_id } = req.params;
  try {
    const result = await db.query(`
      SELECT q.id, q.title, q.total_points
      FROM quizzes q
      WHERE q.id NOT IN (
        SELECT qr.quiz_id FROM quiz_results qr WHERE qr.telegram_id = $1
      )
      ORDER BY q.id DESC
    `, [telegram_id]);
    res.json({ success: true, quizzes: result.rows });
  } catch (err) {
    console.error("❌ Error loading quizzes:", err);
    res.json({ success: false, error: "Database error" });
  }
});

app.get("/api/quiz/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT id, title, total_points,
        question1, option1a, option1b, option1c, option1d, correct1,
        question2, option2a, option2b, option2c, option2d, correct2,
        question3, option3a, option3b, option3c, option3d, correct3,
        question4, option4a, option4b, option4c, option4d, correct4,
        question5, option5a, option5b, option5c, option5d, correct5,
        question6, option6a, option6b, option6c, option6d, correct6,
        question7, option7a, option7b, option7c, option7d, correct7,
        question8, option8a, option8b, option8c, option8d, correct8
      FROM quizzes WHERE id = $1 LIMIT 1
    `, [id]);
    if (!result.rows.length) return res.json({ success: false, message: "Quiz not found" });
    res.json({ success: true, quiz: result.rows[0] });
  } catch (err) {
    res.json({ success: false, error: "Database error" });
  }
});

app.post("/api/submit_quiz", async (req, res) => {
  const { telegram_id, quiz_id } = req.body;
  if (!telegram_id || !quiz_id) return res.json({ success: false, message: "Missing data" });

  try {
    const userRes = await db.query("SELECT is_banned FROM users WHERE telegram_id = $1", [telegram_id]);
    if (!userRes.rows.length) return res.json({ success: false, message: "User not found" });
    if (userRes.rows[0].is_banned) return res.json({ success: false, message: "Action blocked. You are banned." });

    const check = await db.query("SELECT * FROM quiz_results WHERE telegram_id = $1 AND quiz_id = $2", [telegram_id, quiz_id]);
    if (check.rows.length > 0) return res.json({ success: false, message: "Already played" });

    const quizRes = await db.query("SELECT total_points FROM quizzes WHERE id = $1", [quiz_id]);
    if (!quizRes.rows.length) return res.json({ success: false, message: "Quiz not found" });

    const points = quizRes.rows[0].total_points;
    const usd = points * 0.001;

    await db.query("INSERT INTO quiz_results (telegram_id, quiz_id, score) VALUES ($1, $2, $3)", [telegram_id, quiz_id, points]);
    await db.query("UPDATE users SET points = points + $1, balance = balance + $2 WHERE telegram_id = $3", [points, usd, telegram_id]);

    res.json({ success: true, message: "✅ Quiz completed!", added_points: points, added_usd: usd });
  } catch (err) {
    console.error("❌ Submit quiz error:", err);
    res.json({ success: false, error: "Server error" });
  }
});

app.get("/api/user_balance/:telegram_id", async (req, res) => {
  const { telegram_id } = req.params;
  try {
    const result = await db.query(`
      SELECT name, telegram_id,
        ROUND(balance * 1000) AS points,
        balance,
        joined_at,
        COALESCE(is_banned, false) AS is_banned,
        ROUND(balance::numeric, 2) AS usd_from_points,
        ROUND(balance::numeric, 2) AS total_usd
      FROM users WHERE telegram_id = $1
    `, [telegram_id]);
    if (!result.rows.length) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.json({ success: false, error: "Database error" });
  }
});

app.get("/api/user_earning_history/:telegram_id", async (req, res) => {
  const { telegram_id } = req.params;
  try {
    const result = await db.query(`
      SELECT qr.id, q.title AS quiz_title, qr.score,
        (qr.score * 0.001) AS usd_earned, qr.played_at AS created_at
      FROM quiz_results qr
      LEFT JOIN quizzes q ON qr.quiz_id = q.id
      WHERE qr.telegram_id = $1
      ORDER BY qr.id DESC
    `, [telegram_id]);
    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.json({ success: false, error: "Database error" });
  }
});

app.get("/api/withdrawals/:telegram_id", async (req, res) => {
  const { telegram_id } = req.params;
  try {
    const result = await db.query(`
      SELECT w.* FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE u.telegram_id = $1
      ORDER BY w.id DESC
    `, [telegram_id]);
    res.json({ success: true, withdrawals: result.rows });
  } catch (err) {
    res.json({ success: false, error: "Database error" });
  }
});

app.post("/api/request_withdraw", async (req, res) => {
  const { telegram_id, method, email, amount } = req.body;
  if (!telegram_id || !email || !amount) return res.json({ success: false, message: "Missing required fields" });

  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount < 5) return res.json({ success: false, message: "Minimum withdraw is $5" });

  try {
    const userRes = await db.query("SELECT id, balance, is_banned FROM users WHERE telegram_id = $1", [telegram_id]);
    if (!userRes.rows.length) return res.json({ success: false, message: "User not found" });

    const user = userRes.rows[0];
    if (user.is_banned) return res.json({ success: false, message: "Withdraw blocked. You are banned." });

    if (parseFloat(user.balance) < withdrawAmount) return res.json({ success: false, message: "Insufficient balance" });

    const pointsToDeduct = withdrawAmount * 1000;
    await db.query("UPDATE users SET balance = balance - $1, points = points - $2 WHERE id = $3", [withdrawAmount, pointsToDeduct, user.id]);
    await db.query(
      "INSERT INTO withdrawals (user_id, method, binance_email, amount, status) VALUES ($1, $2, $3, $4, 'pending')",
      [user.id, method || "Binance", email, withdrawAmount]
    );

    res.json({ success: true, message: "Withdraw request created successfully" });
  } catch (err) {
    console.error("❌ Withdraw error:", err);
    res.json({ success: false, error: "Server error" });
  }
});

app.post("/api/fail_quiz", async (req, res) => {
  const { telegram_id } = req.body;
  if (!telegram_id) return res.json({ success: false });
  try {
    await db.query("UPDATE users SET failed_quizzes = COALESCE(failed_quizzes, 0) + 1 WHERE telegram_id = $1", [telegram_id]);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

app.post("/api/heartbeat", async (req, res) => {
  const { telegram_id } = req.body;
  if (!telegram_id) return res.json({ success: false });
  try {
    await db.query("UPDATE users SET last_active = NOW() WHERE telegram_id = $1", [telegram_id]);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});

const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

// =========================
// Middleware
// =========================
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + '/user'));

// =========================
// MySQL Connection (Pool)
// =========================
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "YOUR_MYSQL_PASSWORD_HERE", // Yaad se isko baad mein secure kar lena!
  database: "your_database_name",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the pool connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("? MySQL Connection failed:", err);
  } else {
    console.log("? Connected to MySQL Database (Pool)");
    connection.release(); // Connection wapas pool mein
  }
});

// =========================
// Test Route
// =========================
app.get("/", (req, res) => {
  res.send("?? YourAppName Mini App Backend is Running!");
});

// =========================
// QUIZ ROUTES
// =========================
// Fetch only unplayed quizzes
app.get("/api/quizzes/:telegram_id", (req, res) => {
  const { telegram_id } = req.params;

  const sql = `
    SELECT q.id, q.title, q.total_points
    FROM quizzes q
    WHERE q.id NOT IN (
      SELECT qr.quiz_id
      FROM quiz_results qr
      WHERE qr.telegram_id = ?
    )
    ORDER BY q.id DESC
  `;

  db.query(sql, [telegram_id], (err, results) => {
    if (err) {
      console.error("? Error loading quizzes:", err);
      return res.json({ success: false, error: "Database error" });
    }
    res.json({ success: true, quizzes: results });
  });
});

// Fetch single quiz by ID
app.get("/api/quiz/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      id, title, total_points,
      question1, option1a, option1b, option1c, option1d, correct1,
      question2, option2a, option2b, option2c, option2d, correct2,
      question3, option3a, option3b, option3c, option3d, correct3,
      question4, option4a, option4b, option4c, option4d, correct4,
      question5, option5a, option5b, option5c, option5d, correct5,
      question6, option6a, option6b, option6c, option6d, correct6,
      question7, option7a, option7b, option7c, option7d, correct7,
      question8, option8a, option8b, option8c, option8d, correct8
    FROM quizzes
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("? Quiz fetch error:", err.sqlMessage || err);
      return res.json({ success: false, error: "Database error" });
    }

    if (!result.length) {
      return res.json({ success: false, message: "Quiz not found" });
    }

    res.json({ success: true, quiz: result[0] });
  });
});


// Corrected Quiz Submission Route (With Ban Check)
app.post("/api/submit_quiz", (req, res) => {
  const { telegram_id, quiz_id } = req.body;

  if (!telegram_id || !quiz_id)
    return res.json({ success: false, message: "Missing data" });

  // Step 1: Check if user is BANNED
  db.query("SELECT is_banned FROM users WHERE telegram_id = ?", [telegram_id], (err, userRes) => {
    if (err || !userRes.length) return res.json({ success: false, message: "User not found" });
    if (userRes[0].is_banned) return res.json({ success: false, message: "Action blocked. You are banned." });

    // Step 2: Check if already played
    const checkSql = "SELECT * FROM quiz_results WHERE telegram_id = ? AND quiz_id = ?";
    db.query(checkSql, [telegram_id, quiz_id], (err, results) => {
      if (err) return res.json({ success: false, error: "Database error" });
      if (results.length > 0)
        return res.json({ success: false, message: "Already played" });

      // Step 3: Get quiz total points from database
      db.query("SELECT total_points FROM quizzes WHERE id = ?", [quiz_id], (err2, quizRes) => {
        if (err2 || !quizRes.length)
          return res.json({ success: false, message: "Quiz not found" });

        const points = quizRes[0].total_points;
        const usd = points * 0.001;

        // Step 4: Save to quiz_results
        const insertSql = `INSERT INTO quiz_results (telegram_id, quiz_id, score) VALUES (?, ?, ?)`;
        db.query(insertSql, [telegram_id, quiz_id, points], (err3) => {
          if (err3) return res.json({ success: false, error: "Insert failed" });

          // Step 5: Update user total points and balance
          const updateSql = `UPDATE users SET points = points + ?, balance = balance + ? WHERE telegram_id = ?`;
          db.query(updateSql, [points, usd, telegram_id], (err4) => {
            if (err4) return res.json({ success: false, error: "User update failed" });

            res.json({
              success: true,
              message: "? Quiz completed successfully!",
              added_points: points,
              added_usd: usd
            });
          });
        });
      });
    });
  });
});


// Get quizzes user already played
app.get("/api/user_played/:telegram_id", (req, res) => {
  const { telegram_id } = req.params;
  const sql = `
    SELECT q.quiz_id FROM quiz_results q
    JOIN users u ON q.user_id = u.id
    WHERE u.telegram_id = ?
  `;
  db.query(sql, [telegram_id], (err, results) => {
    if (err) return res.json({ success: false, error: err });
    const played = results.map((r) => r.quiz_id);
    res.json({ success: true, played });
  });
});

// Add Points
app.post("/api/add_points", (req, res) => {
  const { telegram_id, points } = req.body;
  if (!telegram_id || !points) return res.json({ success: false });

  const conversionRate = 1000;
  const usd = points / conversionRate;

  db.query("SELECT id FROM users WHERE telegram_id = ?", [telegram_id], (err, rows) => {
    if (err || !rows.length)
      return res.json({ success: false, message: "User not found" });
    const user_id = rows[0].id;

    const sql = `
      UPDATE users 
      SET points = points + ?, balance = balance + ?
      WHERE id = ?
    `;
    db.query(sql, [points, usd, user_id], (err2) => {
      if (err2) return res.json({ success: false, error: err2 });
      res.json({ success: true, added_points: points, added_usd: usd });
    });
  });
});

// Withdrawals
app.get("/api/withdrawals/:telegram_id", (req, res) => {
  const { telegram_id } = req.params;
  const sql = `
    SELECT w.* FROM withdrawals w
    JOIN users u ON w.user_id = u.id
    WHERE u.telegram_id = ?
    ORDER BY w.id DESC
  `;
  db.query(sql, [telegram_id], (err, results) => {
    if (err) return res.json({ success: false, error: err });
    res.json({ success: true, withdrawals: results });
  });
});

// ? 100% SYNCED: User Balance (Double Counting Removed & Points Tied to Balance) ?
app.get("/api/user_balance/:telegram_id", (req, res) => {
  const { telegram_id } = req.params;
  const sql = `
    SELECT 
      name,
      telegram_id,
      (balance * 1000) AS points,          -- Points are now exactly based on the current balance
      balance,
      joined_at,
      is_banned, 
      ROUND(balance, 2) AS usd_from_points, -- Value is exactly equal to current balance
      ROUND(balance, 2) AS total_usd        -- Main USD Balance
    FROM users
    WHERE telegram_id = ?
  `;
  
  db.query(sql, [telegram_id], (err, results) => {
    if (err) return res.json({ success: false, error: err });
    if (!results.length) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, user: results[0] });
  });
});

// Fixed version for /api/user_earning_history
app.get("/api/user_earning_history/:telegram_id", (req, res) => {
  const { telegram_id } = req.params;

  const sql = `
    SELECT 
      qr.id,
      q.title AS quiz_title,
      qr.score,
      (qr.score * 0.001) AS usd_earned,
      qr.played_at AS created_at
    FROM quiz_results qr
    LEFT JOIN quizzes q ON qr.quiz_id = q.id
    WHERE qr.telegram_id = ?
    ORDER BY qr.id DESC
  `;

  db.query(sql, [telegram_id], (err, results) => {
    if (err) {
      console.error("? DB error in /api/user_earning_history:", err);
      return res.json({ success: false, error: err });
    }

    res.json({ success: true, history: results });
  });
});


// ? 100% SYNCED: Withdraw Request API (Strict Balance Check & Point Deduction Added) ?
app.post("/api/request_withdraw", (req, res) => {
  const { telegram_id, method, wallet, email, amount } = req.body;

  if (!telegram_id || !email || !amount)
    return res.json({ success: false, message: "Missing required fields" });

  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount < 5)
    return res.json({ success: false, message: "Minimum withdraw is $5" });

  // Step 1: Find user and check if BANNED
  db.query(
    "SELECT id, balance, is_banned FROM users WHERE telegram_id = ?",
    [telegram_id],
    (err, userResults) => {
      if (err || !userResults.length)
        return res.json({ success: false, message: "User not found" });

      const user = userResults[0];
      
      if (user.is_banned)
        return res.json({ success: false, message: "Withdraw blocked. You are banned." });

      // Safe Float Comparison
      const currentBalance = parseFloat(user.balance);
      if (currentBalance < withdrawAmount)
        return res.json({ success: false, message: "Insufficient balance" });

      // ?? NAYA LOGIC: Calculate points to deduct based on the withdraw amount ??
      const pointsToDeduct = withdrawAmount * 1000;

      // Step 2: Deduct balance AND points simultaneously
      db.query(
        "UPDATE users SET balance = balance - ?, points = points - ? WHERE id = ?",
        [withdrawAmount, pointsToDeduct, user.id],
        (updateErr) => {
          if (updateErr)
            return res.json({ success: false, message: "Balance update failed" });

          // Step 3: Insert withdraw record
          const insertSql = `
            INSERT INTO withdrawals (user_id, method, binance_email, amount, status, created_at)
            VALUES (?, ?, ?, ?, 'Pending', NOW())
          `;

          db.query(
            insertSql,
            [user.id, method || "Binance", email, withdrawAmount],
            (insertErr, result) => {
              if (insertErr) {
                console.error("Withdraw insert error:", insertErr.sqlMessage);
                return res.json({ success: false, message: "Database insert failed" });
              }

              console.log("? Withdraw saved with ID:", result.insertId);
              res.json({
                success: true,
                message: "Withdraw request created successfully"
              });
            }
          );
        }
      );
    }
  );
});


// ==========================================
// ? NEW: TRACK FAILED QUIZZES
// ==========================================
app.post("/api/fail_quiz", (req, res) => {
  const { telegram_id } = req.body;

  if (!telegram_id) {
    return res.json({ success: false, message: "Missing data" });
  }

  const sql = "UPDATE users SET failed_quizzes = failed_quizzes + 1 WHERE telegram_id = ?";
  db.query(sql, [telegram_id], (err, result) => {
    if (err) {
      console.error("? Error updating failed quiz:", err);
      return res.json({ success: false, error: "Database error" });
    }
    res.json({ success: true, message: "Failed quiz recorded" });
  });
});

// ==========================================
// ? NEW: TRACK ONLINE USERS (HEARTBEAT)
// ==========================================
app.post("/api/heartbeat", (req, res) => {
  const { telegram_id } = req.body;

  if (!telegram_id) {
    return res.json({ success: false });
  }

  // NOW() current time ko last_active mein save kar dega
  const sql = "UPDATE users SET last_active = NOW() WHERE telegram_id = ?";
  db.query(sql, [telegram_id], (err, result) => {
    if (err) {
      console.error("? Heartbeat error:", err);
      return res.json({ success: false });
    }
    res.json({ success: true });
  });
});


// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`?? Server started on http://localhost:${PORT}`);
});
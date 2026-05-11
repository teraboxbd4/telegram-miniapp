const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// MySQL connection
// MySQL connection (Updated to Pool)
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "YOUR_MYSQL_PASSWORD_HERE", // apna MySQL password likho
  database: "your_database_name",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the pool connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("? MySQL Connection Failed:", err);
  } else {
    console.log("? Connected to MySQL Database (Pool)");
    connection.release(); // Connection ko wapas pool mein bhej diya
  }
});
// Serve admin frontend
app.use('/admin', express.static(__dirname + '/admin'));
// Serve Telegram Mini App files
app.use(express.static('/home/yourapp'));



// Stats API
// ? FULLY UPDATED: Stats API (Including Failed Quizzes & Online Users) ?
app.get("/api/stats", (req, res) => {
  const stats = {};

  db.query("SELECT COUNT(*) AS total_users FROM users", (err, users) => {
    if (err) return res.status(500).json(err);
    stats.total_users = users[0].total_users;

    db.query("SELECT COUNT(*) AS total_quizzes FROM quizzes", (err, quizzes) => {
      if (err) return res.status(500).json(err);
      stats.total_quizzes = quizzes[0].total_quizzes;

      db.query("SELECT SUM(balance) AS total_earnings FROM users", (err, earnings) => {
        if (err) return res.status(500).json(err);
        stats.total_earnings = earnings && earnings[0] ? parseFloat(earnings[0].total_earnings) || 0 : 0;

        db.query("SELECT COUNT(*) AS pending_withdrawals FROM withdrawals WHERE status='pending'", (err, withdraw) => {
          if (err) return res.status(500).json(err);
          stats.pending_withdrawals = withdraw && withdraw[0] ? parseInt(withdraw[0].pending_withdrawals) || 0 : 0;

          // 1. Quizzes Won Count
          db.query("SELECT COUNT(*) AS quizzes_won FROM quiz_results", (err, wonRes) => {
            if (err) return res.status(500).json(err);
            stats.quizzes_won = wonRes && wonRes[0] ? parseInt(wonRes[0].quizzes_won) : 0;
            
            // 2. Quizzes Failed Count (Uses the new 'failed_quizzes' column in users table)
            db.query("SELECT SUM(failed_quizzes) AS quizzes_failed FROM users", (err, failRes) => {
              if (err) return res.status(500).json(err);
              stats.quizzes_failed = failRes && failRes[0] && failRes[0].quizzes_failed ? parseInt(failRes[0].quizzes_failed) : 0;
              
              // 3. Online Users (Active in the last 5 minutes)
              db.query("SELECT COUNT(*) AS active_users FROM users WHERE last_active >= NOW() - INTERVAL 5 MINUTE", (err, activeRes) => {
                if (err) return res.status(500).json(err);
                stats.active_users = activeRes && activeRes[0] ? parseInt(activeRes[0].active_users) : 0;

                // Send the complete object to frontend
                res.json(stats);
              });
            });
          });
        });
      });
    });
  });
});

// ✅ Updated Withdraw History API with Summary
app.get("/api/withdraw_history/:telegram_id", (req, res) => {
    const telegram_id = req.params.telegram_id;

    db.query("SELECT id FROM users WHERE telegram_id=?", [telegram_id], (err, user) => {
        if (err) return res.status(500).json({ error: "DB error" });
        if (!user || user.length === 0) return res.status(404).json({ error: "User not found" });

        const user_id = user[0].id;

        // Fetch withdraw history + summary
        db.query("SELECT * FROM withdrawals WHERE user_id=?", [user_id], (err, withdrawals) => {
            if (err) return res.status(500).json({ error: "DB error" });

            let total_paid = 0;
            let total_pending = 0;

            withdrawals.forEach(w => {
                if (w.status === "paid") total_paid += parseFloat(w.amount);
                else if (w.status === "pending") total_pending += parseFloat(w.amount);
            });

            res.json({
                history: withdrawals,
                summary: {
                    total_paid: total_paid.toFixed(2),
                    total_pending: total_pending.toFixed(2)
                }
            });
        });
    });
});





// User Management APIs
// ? 100% SYNCED: Update User Points AND Balance ?
app.post("/api/update_user_points", (req, res) => {
    const { user_id, points, action } = req.body;

    if (!user_id || !points) {
        return res.json({ success: false, message: "Missing data" });
    }

    // Points ko wapas USD mein convert karo balance column ke liye
    const usdAmount = points / 1000;

    let sql = "";
    if (action === "add") {
        // Dono mein plus karo
        sql = "UPDATE users SET points = points + ?, balance = balance + ? WHERE id = ?";
    } else if (action === "minus") {
        // Dono mein se minus karo (GREATEST(0) ensures balance minus me na jaye)
        sql = "UPDATE users SET points = GREATEST(0, points - ?), balance = GREATEST(0, balance - ?) WHERE id = ?";
    } else {
        return res.json({ success: false, message: "Invalid action" });
    }

    db.query(sql, [points, usdAmount, user_id], (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.json({ success: false, error: err });
        }
        res.json({ success: true });
    });
});





// Start server
app.listen(PORT, () => {
  console.log(`✅ Admin API running on http://localhost:${PORT}`);
});
// ✅ User data by Telegram ID
app.get("/api/user/:telegram_id", (req, res) => {
  const telegramId = req.params.telegram_id;

  db.query(
    "SELECT name, points, balance FROM users WHERE telegram_id = ?",
    [telegramId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0)
        return res.status(404).json({ error: "User not found" });
      res.json(results[0]);
    }
  );
});
app.post("/api/withdraw", (req, res) => {
    const { telegram_id, binance_email, amount } = req.body;

    if (!telegram_id || !binance_email || !amount) {
        return res.status(400).json({ error: "Missing fields" });
    }

    db.query(
        "SELECT id FROM users WHERE telegram_id = ?",
        [telegram_id],
        (err, user) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (user.length === 0)
                return res.status(404).json({ error: "User not found" });

            db.query(
                "INSERT INTO withdrawals (user_id, amount, status) VALUES (?, ?, 'pending')",
                [user[0].id, amount],
                (err2) => {
                    if (err2)
                        return res.status(500).json({ error: "Failed to insert withdraw" });

                    res.json({ success: true });
                }
            );
        }
    );
});










// ✅ Update withdrawal status to "paid"
app.post("/api/mark_paid", (req, res) => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
        const { id } = JSON.parse(body);
        if (!id) return res.status(400).json({ error: "Missing withdrawal ID" });

        db.query("UPDATE withdrawals SET status='paid' WHERE id=?", [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Withdrawal not found" });

            res.json({ success: true, message: "Marked as paid successfully" });
        });
    });
});

// Fetch all withdrawals
app.get("/api/withdrawals", (req, res) => {
    db.query("SELECT * FROM withdrawals ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(result);
    });
});

// Update withdraw status
app.post("/api/update_withdraw", (req, res) => {
    const { id, status } = req.body;
 console.log("?? Update Request Received:", id, status);
    if (!id || !status) return res.status(400).json({ error: "Missing fields" });

    db.query(
        "UPDATE withdrawals SET status = ? WHERE id = ?",
        [status, id],
        (err) => {
            if (err) return res.status(500).json({ error: "Update failed" });
            res.json({ success: true });
        }
    );
});

// ? Telegram Dashboard API
app.get("/api/user_dashboard/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const sql = `
    SELECT 
      COALESCE(SUM(balance), 0) AS balance,
      (SELECT COUNT(*) FROM withdrawals WHERE user_id = ? ) AS total_withdrawals,
      (SELECT COUNT(*) FROM tasks WHERE user_id = ? ) AS tasks_done,
      (SELECT COUNT(*) FROM referrals WHERE ref_by = ? ) AS referrals
    FROM users WHERE id = ?;
  `;

  db.query(sql, [user_id, user_id, user_id, user_id], (err, result) => {
    if (err) return res.json({ success: false, message: "DB Error" });
    res.json({
      success: true,
      balance: result[0].balance || 0,
      total_withdrawals: result[0].total_withdrawals || 0,
      tasks_done: result[0].tasks_done || 0,
      referrals: result[0].referrals || 0
    });
  });
});



// ✅ When user creates a withdrawal request
app.post("/api/create_withdraw", (req, res) => {
  const { user_id, amount } = req.body;
  const sql = "INSERT INTO withdrawals (user_id, amount, status) VALUES (?, ?, 'pending')";
  db.query(sql, [user_id, amount], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });

    // Add notification
    const note = `New withdrawal request from user #${user_id} for $${amount}`;
    db.query("INSERT INTO notifications (message) VALUES (?)", [note]);

    res.json({ success: true, message: "Withdrawal request created" });
  });
});


// ✅ API for showing all withdraws
app.get("/api/all_withdraws", (req, res) => {
  db.query("SELECT * FROM withdrawals ORDER BY id DESC", (err, result) => {
    if (err) {
      // agar koi error ho
      return res.status(500).json({ error: "DB error" });
    }
    // agar sab sahi chale to pura result return kar do
    res.json(result);
  });
});

// Admin Login API
// ✅ Simple working Admin Login API
app.post("/api/admin_login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: "Missing credentials" });
    }

    db.query(
        "SELECT * FROM admin WHERE username=? AND password=?",
        [username, password],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, error: "DB error" });
            }
            if (result.length === 0) {
                return res.json({ success: false });
            }
            res.json({ success: true });
        }
    );
});


// Fetch withdraw history by Telegram ID
app.get("/api/withdraw_history/:telegram_id", (req, res) => {
    const telegram_id = req.params.telegram_id;
    db.query("SELECT id FROM users WHERE telegram_id=?", [telegram_id], (err, user) => {
        if (err) return res.status(500).json({ error: "DB error" });
        if (user.length === 0) return res.json([]);
        db.query("SELECT * FROM withdrawals WHERE user_id=?", [user[0].id], (err2, result) => {
            if (err2) return res.status(500).json({ error: "DB error" });
            res.json(result);
        });
    });
});
// ✅ Dashboard Stats API
app.get("/api/dashboard_stats", (req, res) => {
  const stats = {};

  // 1️⃣ Total Users
  db.query("SELECT COUNT(*) AS total FROM users", (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    stats.total_users = result[0].total;

    // 2️⃣ Total Paid
    db.query("SELECT COUNT(*) AS total FROM withdrawals WHERE status='paid'", (err2, paidRes) => {
      if (err2) return res.status(500).json({ error: "DB error" });
      stats.total_paid = paidRes[0].total;

      // 3️⃣ Total Pending
      db.query("SELECT COUNT(*) AS total FROM withdrawals WHERE status='pending'", (err3, pendRes) => {
        if (err3) return res.status(500).json({ error: "DB error" });
        stats.total_pending = pendRes[0].total;

        // 4️⃣ Total Rejected
        db.query("SELECT COUNT(*) AS total FROM withdrawals WHERE status='rejected'", (err4, rejRes) => {
          if (err4) return res.status(500).json({ error: "DB error" });
          stats.total_rejected = rejRes[0].total;

          res.json(stats);
        });
      });
    });
  });
});


app.get("/api/user_withdraws/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const sql = `
    SELECT id, amount, status, DATE_FORMAT(requested_at, '%Y-%m-%d %H:%i:%s') AS date
    FROM withdrawals
    WHERE user_id = ?
    ORDER BY id DESC
  `;

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      console.error("? SQL Error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (!result.length) {
      return res.json({ success: true, withdraws: [], message: "No withdrawals found" });
    }

    res.json({ success: true, count: result.length, withdraws: result });
  });
});

// ? 7-Day Summary API
app.get("/api/user_withdraws_summary/:user_id", (req, res) => {
  const user_id = req.params.user_id;
  const sql = `
    SELECT DATE(requested_at) AS day,
           SUM(amount) AS total,
           status
    FROM withdrawals
    WHERE user_id = ? AND requested_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY day, status
    ORDER BY day ASC;
  `;
  db.query(sql, [user_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.json({ success: true, summary: result });
  });
});



// ✅ Withdraw History (7 Days)
app.get("/api/withdraw_history", (req, res) => {
  const sql = `
    SELECT 
      DATE(created_at) as date, 
      SUM(status='paid') AS paid,
      SUM(status='pending') AS pending
    FROM withdrawals
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });

    const data = {
      dates: results.map(r => r.date),
      paid: results.map(r => r.paid),
      pending: results.map(r => r.pending)
    };
    res.json(data);
  });
});


// ✅ Fetch unread notifications
app.get("/api/notifications", (req, res) => {
  db.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10", (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(result);
  });
});

// ✅ Mark all as read
app.post("/api/notifications/read", (req, res) => {
  db.query("UPDATE notifications SET is_read = 1", () => {
    res.json({ success: true });
  });
});

// ? Mark all notifications as read
app.post('/api/mark_read', async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE is_read = 0");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ? Mark a withdraw as rejected
app.post('/api/reject_withdraw', async (req, res) => {
  try {
    const { id } = req.body;
    await db.query("UPDATE withdraws SET status = 'rejected' WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ===============================
// ?? ADD QUIZ (Supports 8 Questions)
// ===============================
app.post("/api/admin/add_quiz", (req, res) => {
  const {
    title,
    question1, option1a, option1b, option1c, option1d, correct1,
    question2, option2a, option2b, option2c, option2d, correct2,
    question3, option3a, option3b, option3c, option3d, correct3,
    question4, option4a, option4b, option4c, option4d, correct4,
    question5, option5a, option5b, option5c, option5d, correct5,
    question6, option6a, option6b, option6c, option6d, correct6,
    question7, option7a, option7b, option7c, option7d, correct7,
    question8, option8a, option8b, option8c, option8d, correct8,
    total_points
  } = req.body;
console.log("?? Received Quiz Data:", req.body);

  const sql = `
    INSERT INTO quizzes (
      title,
      question1, option1a, option1b, option1c, option1d, correct1,
      question2, option2a, option2b, option2c, option2d, correct2,
      question3, option3a, option3b, option3c, option3d, correct3,
      question4, option4a, option4b, option4c, option4d, correct4,
      question5, option5a, option5b, option5c, option5d, correct5,
      question6, option6a, option6b, option6c, option6d, correct6,
      question7, option7a, option7b, option7c, option7d, correct7,
      question8, option8a, option8b, option8c, option8d, correct8,
      total_points
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    title,
    question1, option1a, option1b, option1c, option1d, correct1,
    question2, option2a, option2b, option2c, option2d, correct2,
    question3, option3a, option3b, option3c, option3d, correct3,
    question4, option4a, option4b, option4c, option4d, correct4,
    question5, option5a, option5b, option5c, option5d, correct5,
    question6, option6a, option6b, option6c, option6d, correct6,
    question7, option7a, option7b, option7c, option7d, correct7,
    question8, option8a, option8b, option8c, option8d, correct8,
    total_points
  ], (err) => {
    if (err) {
      console.error("? Quiz insert error:", err);
      return res.json({ success: false, error: err });
    }
    res.json({ success: true, message: "? Quiz added successfully!" });
  });
});


// ? Get All Quizzes (for admin panel)
app.get("/api/admin/quizzes", (req, res) => {
  const sql = "SELECT id, title, total_points FROM quizzes ORDER BY id DESC";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("? Error fetching quizzes:", err);
      return res.json({ success: false, error: err });
    }

    res.json({ success: true, quizzes: result });
  });
});

// ? Delete Quiz
app.delete("/api/admin/delete_quiz/:id", (req, res) => {
  const quizId = req.params.id;
  db.query("DELETE FROM quizzes WHERE id=?", [quizId], (err) => {
    if (err) {
      console.error("? Error deleting quiz:", err);
      return res.json({ success: false, error: err });
    }
    res.json({ success: true, message: "? Quiz deleted successfully!" });
  });
});






// ===============================
// ?? EDIT QUIZ API
// ===============================
app.post("/api/admin/edit_quiz/:id", (req, res) => {
  const quizId = req.params.id;
  const {
    title,
    question1, option1a, option1b, option1c, option1d, correct1,
    question2, option2a, option2b, option2c, option2d, correct2,
    question3, option3a, option3b, option3c, option3d, correct3,
    question4, option4a, option4b, option4c, option4d, correct4,
    question5, option5a, option5b, option5c, option5d, correct5,
    question6, option6a, option6b, option6c, option6d, correct6,
    question7, option7a, option7b, option7c, option7d, correct7,
    question8, option8a, option8b, option8c, option8d, correct8,
    total_points
  } = req.body;

  const sql = `
    UPDATE quizzes SET 
      title=?, 
      question1=?, option1a=?, option1b=?, option1c=?, option1d=?, correct1=?,
      question2=?, option2a=?, option2b=?, option2c=?, option2d=?, correct2=?,
      question3=?, option3a=?, option3b=?, option3c=?, option3d=?, correct3=?,
      question4=?, option4a=?, option4b=?, option4c=?, option4d=?, correct4=?,
      question5=?, option5a=?, option5b=?, option5c=?, option5d=?, correct5=?,
      question6=?, option6a=?, option6b=?, option6c=?, option6d=?, correct6=?,
      question7=?, option7a=?, option7b=?, option7c=?, option7d=?, correct7=?,
      question8=?, option8a=?, option8b=?, option8c=?, option8d=?, correct8=?,
      total_points=?
    WHERE id=?
  `;

  db.query(sql, [
    title,
    question1, option1a, option1b, option1c, option1d, correct1,
    question2, option2a, option2b, option2c, option2d, correct2,
    question3, option3a, option3b, option3c, option3d, correct3,
    question4, option4a, option4b, option4c, option4d, correct4,
    question5, option5a, option5b, option5c, option5d, correct5,
    question6, option6a, option6b, option6c, option6d, correct6,
    question7, option7a, option7b, option7c, option7d, correct7,
    question8, option8a, option8b, option8c, option8d, correct8,
    total_points,
    quizId
  ], (err) => {
    if (err) {
      console.error("? Quiz update error:", err);
      return res.json({ success: false, error: err });
    }
    res.json({ success: true, message: "? Quiz updated successfully!" });
  });
});






// ? Fetch single quiz by ID
app.get("/api/quiz/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM quizzes WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error fetching quiz:", err);
      return res.status(500).json({ success: false, error: err });
    }
    if (!result.length) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }
    res.json({ success: true, quiz: result[0] });
  });
});

// ? Get all ads (for frontend)
app.get("/api/ads_config", (req, res) => {
  db.query("SELECT position, script FROM ads_config", (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json(result);
  });
});


// =============================
// ?? Get All Users (Paginated)
// =============================
// Get All Users API (Updated with Search logic)
app.get("/api/users", (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";

    let sql = `
        SELECT 
            id, telegram_id, name AS username, points, is_banned, 
            ROUND(points / 1000, 2) AS usd_balance 
        FROM users 
    `;
    let params = [];

    if (search) {
        sql += ` WHERE name LIKE ? OR telegram_id LIKE ? `;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Users API Error:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }
        res.json(results);
    });
});

// New Earning History API for Admin
app.get("/api/admin/user_earnings/:id", (req, res) => {
    const userId = req.params.id;
    
    db.query("SELECT telegram_id FROM users WHERE id = ?", [userId], (err, userRows) => {
        if (err || !userRows.length) return res.json({ success: false });
        
        const tgId = userRows[0].telegram_id;
        const sql = `
            SELECT q.title, qr.score, qr.played_at 
            FROM quiz_results qr 
            LEFT JOIN quizzes q ON qr.quiz_id = q.id 
            WHERE qr.telegram_id = ? 
            ORDER BY qr.id DESC LIMIT 15
        `;
        
        db.query(sql, [tgId], (err2, results) => {
            if (err2) return res.json({ success: false });
            res.json({ success: true, history: results });
        });
    });
});


// ? Update ad script (for admin panel)
app.post("/api/update_ad", (req, res) => {
  const { position, script } = req.body;
  db.query(
    "UPDATE ads_config SET script=? WHERE position=?",
    [script, position],
    err => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ success: true, message: "Ad updated successfully" });
    }
  );
});



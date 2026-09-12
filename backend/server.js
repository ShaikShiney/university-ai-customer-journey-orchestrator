const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later."
  }
});

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const app = express();
const PORT = process.env.PORT || 5000;
const db = require("./db");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is missing in backend/.env");
  process.exit(1);
}

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin: "http://localhost:8443",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "0");
  next();
});
const idempotencyStore = new Map();

function idempotencyMiddleware(req, res, next) {
  const key = req.headers["idempotency-key"];

  if (!key) return next();

  const existing = idempotencyStore.get(key);

  if (existing) {
    return res.status(existing.status).json(existing.body);
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    idempotencyStore.set(key, {
      status: res.statusCode,
      body
    });

    // Keep memory limited
    setTimeout(() => idempotencyStore.delete(key), 10 * 60 * 1000);

    return originalJson(body);
  };

  next();
}
app.use("/api", apiLimiter);


/* =========================================================
   AUTHENTICATION & ROLE AUTHORIZATION
========================================================= */

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }
    next();
  };
}

/* =========================================================
   AUTOMATIC BACKEND AUDIT LOGGING
========================================================= */

app.use((req, res, next) => {
  const startTime = Date.now();
  let auditUser = null;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      auditUser = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch (error) {
      auditUser = null;
    }
  }

  res.on("finish", async () => {
    try {
      if (!auditUser) return;

      if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        return;
      }

      const action = `${req.method} ${req.path}`;

      const outcome =
        res.statusCode >= 200 && res.statusCode < 300
          ? "SUCCESS"
          : res.statusCode === 403
          ? "DENIED"
          : "FAILED";

      const entityId =
        req.params?.id ||
        req.params?.studentId ||
        req.params?.aiRunId ||
        req.body?.id ||
        req.body?.student_id ||
        null;

      const entityType = req.path.split("/")[2] || "API";

      const newValue =
        req.body && Object.keys(req.body).length
          ? JSON.stringify(req.body)
          : null;

      await db.query(
        `INSERT INTO audit_logs
        (
          id,
          user_id,
          role_name,
          action,
          entity_type,
          entity_id,
          previous_value,
          new_value,
          outcome,
          reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          auditUser.userId || null,
          auditUser.role || null,
          action,
          entityType,
          entityId ? String(entityId) : null,
          null,
          newValue,
          outcome,
          `Backend operation completed in ${Date.now() - startTime}ms`,
        ]
      );
    } catch (auditError) {
      console.error("Audit logging failed:", auditError.message);
    }
  });

  next();
});

/* =========================================================
   BASIC ROUTES
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "University AI Customer Journey Orchestrator API is running",
  });
});
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    api_version: "v1",
    status: "healthy",
    service: "University AI Customer Journey Orchestrator",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend server is running",
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS connected");

    res.json({
      success: true,
      message: "MySQL connected successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "MySQL connection failed",
    });
  }
});


   

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/auth/login", loginLimiter, async (req, res) => { 
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.password_hash,
        u.status,
        r.name AS role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE LOWER(u.email) = ?
      LIMIT 1
      `,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "This account is inactive",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const role = user.role
      ? user.role.toLowerCase()
      : "customer";

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    await db.query(
      `
      UPDATE users
      SET last_login = NOW()
      WHERE id = ?
      `,
      [user.id]
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        avatar: user.name
          ? user.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
          : "U",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

/* =========================================================
   CURRENT USER
========================================================= */

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.status,
        r.name AS role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ?
      LIMIT 1
      `,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role
          ? user.role.toLowerCase()
          : "customer",
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load current user",
    });
  }
});

/* =========================================================
   STUDENTS
========================================================= */

app.get("/api/students", authenticateToken, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const { search, risk_level } = req.query;

  try {
    let where = "WHERE 1=1";
    const params = [];

    if (search) {
      where += `
        AND (
          name LIKE ?
          OR student_id LIKE ?
          OR email LIKE ?
          OR programme LIKE ?
        )
      `;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (risk_level && risk_level !== "all") {
      where += " AND risk_level = ?";
      params.push(String(risk_level).toUpperCase());
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM students ${where}`,
      params
    );

    const [rows] = await db.query(
      `
      SELECT
        id,
        student_id,
        name,
        email,
        programme,
        department,
        year,
        attendance,
        cgpa,
        journey_stage,
        risk_level,
        engagement_score,
        created_at,
        updated_at
      FROM students
      ${where}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      pagination: {
        page,
        limit,
        total: Number(total),
        total_pages: Math.ceil(Number(total) / limit)
      }
    });
  } catch (error) {
    console.error("Students error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load students"
    });
  }
});

/* =========================================================
   INTERACTIONS
========================================================= */

app.get("/api/interactions", authenticateToken, async (req, res) => {
  try {
    const { student_id } = req.query;

    let query = `
      SELECT
        i.id,
        i.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        i.channel,
        i.interaction_type,
        i.subject,
        i.description,
        i.message,
        i.status,
        i.occurred_at
      FROM interactions i
      JOIN students s ON s.id = i.student_id
    `;

    const params = [];

    if (student_id) {
      query += ` WHERE i.student_id = ? `;
      params.push(student_id);
    }

    query += ` ORDER BY i.occurred_at DESC, i.id DESC `;

    const [rows] = await db.query(query, params);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("Interactions error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load interactions",
    });
  }
});

app.get("/api/interactions/:id", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        i.id,
        i.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        i.channel,
        i.interaction_type,
        i.subject,
        i.description,
        i.message,
        i.status,
        i.occurred_at
      FROM interactions i
      JOIN students s ON s.id = i.student_id
      WHERE i.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Interaction not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Interaction error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load interaction",
    });
  }
});

app.post("/api/interactions", authenticateToken, async (req, res) => {
  try {
    const {
      student_id,
      channel,
      interaction_type,
      subject,
      description,
      message,
      status,
    } = req.body;

    if (!student_id || !channel || !interaction_type || !subject) {
      return res.status(400).json({
        success: false,
        message:
          "student_id, channel, interaction_type and subject are required",
      });
    }

    const allowedChannels = [
      "EMAIL",
      "SMS",
      "CALL",
      "WEB",
      "CHAT",
      "PORTAL",
    ];

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "SUCCESS",
      "CANCELLED",
    ];

    const interactionStatus = status || "OPEN";

    if (!allowedChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interaction channel",
      });
    }

    if (!allowedStatuses.includes(interactionStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interaction status",
      });
    }

    const [student] = await db.query(
      `SELECT id FROM students WHERE id = ? LIMIT 1`,
      [student_id]
    );

    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO interactions
      (
        student_id,
        channel,
        interaction_type,
        subject,
        description,
        message,
        status,
        occurred_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        student_id,
        channel,
        interaction_type,
        subject,
        description || null,
        message || null,
        interactionStatus,
      ]
    );

    const [created] = await db.query(
      `
      SELECT
        i.id,
        i.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        i.channel,
        i.interaction_type,
        i.subject,
        i.description,
        i.message,
        i.status,
        i.occurred_at
      FROM interactions i
      JOIN students s ON s.id = i.student_id
      WHERE i.id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Interaction created successfully",
      data: created[0],
    });
  } catch (error) {
    console.error("Create interaction error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create interaction",
    });
  }
});

app.put("/api/interactions/:id", authenticateToken, async (req, res) => {
  try {
    const {
      channel,
      interaction_type,
      subject,
      description,
      message,
      status,
    } = req.body;

    const allowedChannels = [
      "EMAIL",
      "SMS",
      "CALL",
      "WEB",
      "CHAT",
      "PORTAL",
    ];

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "SUCCESS",,
      "CANCELLED",
    ];

    if (channel && !allowedChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interaction channel",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interaction status",
      });
    }

    const [existing] = await db.query(
      `SELECT id FROM interactions WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Interaction not found",
      });
    }

    await db.query(
      `
      UPDATE interactions
      SET
        channel = COALESCE(?, channel),
        interaction_type = COALESCE(?, interaction_type),
        subject = COALESCE(?, subject),
        description = COALESCE(?, description),
        message = COALESCE(?, message),
        status = COALESCE(?, status)
      WHERE id = ?
      `,
      [
        channel || null,
        interaction_type || null,
        subject || null,
        description || null,
        message || null,
        status || null,
        req.params.id,
      ]
    );

    const [updated] = await db.query(
      `
      SELECT
        i.id,
        i.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        i.channel,
        i.interaction_type,
        i.subject,
        i.description,
        i.message,
        i.status,
        i.occurred_at
      FROM interactions i
      JOIN students s ON s.id = i.student_id
      WHERE i.id = ?
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Interaction updated successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error("Update interaction error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update interaction",
    });
  }
});

/* =========================================================
   CONSENT & PREFERENCES
========================================================= */

app.get("/api/consent/:studentId", authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const [students] = await db.query(
      `
      SELECT id, student_id, name, email
      FROM students
      WHERE student_id = ?
      `,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const student = students[0];

    const [preferences] = await db.query(
      `
      SELECT
        student_id,
        email_consent,
        sms_consent,
        whatsapp_consent,
        call_consent,
        marketing_consent,
        weekly_frequency_cap,
        updated_at
      FROM consent_preferences
      WHERE student_id = ?
      `,
      [student.id]
    );

    if (preferences.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Consent preferences not found",
      });
    }

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          email: student.email,
        },
        preferences: preferences[0],
      },
    });
  } catch (error) {
    console.error("Get consent error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve consent preferences",
    });
  }
});

app.put("/api/consent/:studentId", authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const {
      email_consent,
      sms_consent,
      whatsapp_consent,
      call_consent,
      marketing_consent,
      weekly_frequency_cap,
    } = req.body;

    const [students] = await db.query(
      `SELECT id FROM students WHERE student_id = ?`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const dbStudentId = students[0].id;

    if (
      weekly_frequency_cap !== undefined &&
      (!Number.isInteger(Number(weekly_frequency_cap)) ||
        Number(weekly_frequency_cap) < 0 ||
        Number(weekly_frequency_cap) > 50)
    ) {
      return res.status(400).json({
        success: false,
        message: "Weekly frequency cap must be between 0 and 50",
      });
    }

    const [existing] = await db.query(
      `
      SELECT *
      FROM consent_preferences
      WHERE student_id = ?
      `,
      [dbStudentId]
    );

    if (existing.length === 0) {
      await db.query(
        `
        INSERT INTO consent_preferences
        (
          student_id,
          email_consent,
          sms_consent,
          whatsapp_consent,
          call_consent,
          marketing_consent,
          weekly_frequency_cap
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          dbStudentId,
          email_consent ?? 1,
          sms_consent ?? 1,
          whatsapp_consent ?? 1,
          call_consent ?? 1,
          marketing_consent ?? 0,
          weekly_frequency_cap ?? 5,
        ]
      );
    } else {
      await db.query(
        `
        UPDATE consent_preferences
        SET
          email_consent = COALESCE(?, email_consent),
          sms_consent = COALESCE(?, sms_consent),
          whatsapp_consent = COALESCE(?, whatsapp_consent),
          call_consent = COALESCE(?, call_consent),
          marketing_consent = COALESCE(?, marketing_consent),
          weekly_frequency_cap = COALESCE(?, weekly_frequency_cap)
        WHERE student_id = ?
        `,
        [
          email_consent,
          sms_consent,
          whatsapp_consent,
          call_consent,
          marketing_consent,
          weekly_frequency_cap,
          dbStudentId,
        ]
      );
    }

    const [updated] = await db.query(
      `
      SELECT
        student_id,
        email_consent,
        sms_consent,
        whatsapp_consent,
        call_consent,
        marketing_consent,
        weekly_frequency_cap,
        updated_at
      FROM consent_preferences
      WHERE student_id = ?
      `,
      [dbStudentId]
    );

    res.json({
      success: true,
      message: "Consent preferences updated successfully",
      data: updated[0],
    });
  } catch (error) {
    console.error("Update consent error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update consent preferences",
    });
  }
});

app.post(
  "/api/consent/:studentId/opt-out",
  authenticateToken,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { channel, reason } = req.body;

      const allowedChannels = [
        "EMAIL",
        "SMS",
        "WHATSAPP",
        "CALL",
        "MARKETING",
      ];

      if (!allowedChannels.includes(channel)) {
        return res.status(400).json({
          success: false,
          message: "Invalid opt-out channel",
        });
      }

      const [students] = await db.query(
        `
        SELECT id
        FROM students
        WHERE student_id = ?
        `,
        [studentId]
      );

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      const dbStudentId = students[0].id;

      await db.query(
        `
        INSERT INTO opt_out_events
        (
          id,
          student_id,
          channel,
          reason,
          created_by
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          randomUUID(),
          dbStudentId,
          channel,
          reason || null,
          req.user.userId || null,
        ]
      );

      const consentColumn = {
        EMAIL: "email_consent",
        SMS: "sms_consent",
        WHATSAPP: "whatsapp_consent",
        CALL: "call_consent",
        MARKETING: "marketing_consent",
      }[channel];

      await db.query(
        `
        UPDATE consent_preferences
        SET ${consentColumn} = 0
        WHERE student_id = ?
        `,
        [dbStudentId]
      );

      res.json({
        success: true,
        message: `${channel} opt-out recorded successfully`,
      });
    } catch (error) {
      console.error("Opt-out error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to record opt-out",
      });
    }
  }
);

/* =========================================================
   TICKETS
========================================================= */

function ticketStatusToUi(status) {
  const map = {
    OPEN: "open",
    IN_PROGRESS: "pending",
    RESOLVED: "resolved",
    CLOSED: "resolved",
  };

  return map[status] || String(status || "").toLowerCase();
}

function ticketPriorityToUi(priority) {
  const map = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "critical",
  };

  return map[priority] || String(priority || "").toLowerCase();
}

function buildTicketCategory(title, description) {
  const text = `${title || ""} ${description || ""}`.toLowerCase();

  if (text.includes("placement")) return "Placement";
  if (text.includes("timetable")) return "Timetable Planning";
  if (text.includes("registration")) return "Course Registration";
  if (text.includes("academic")) return "Academic";

  return "Administrative";
}

// GET ALL TICKETS
app.get("/api/tickets", authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT
        t.id,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score,
        t.title AS subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS owner,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== "all") {
      const statusMap = {
        new: "OPEN",
        open: "OPEN",
        pending: "IN_PROGRESS",
        escalated: "IN_PROGRESS",
        resolved: "RESOLVED",
      };

      const dbStatus =
        statusMap[String(status).toLowerCase()] ||
        String(status).toUpperCase();

      query += " AND t.status = ?";
      params.push(dbStatus);
    }

    if (search) {
      query += `
        AND (
          t.title LIKE ?
          OR t.description LIKE ?
          OR s.name LIKE ?
          OR s.student_id LIKE ?
        )
      `;

      const value = `%${search}%`;

      params.push(
        value,
        value,
        value,
        value
      );
    }

    query += `
      ORDER BY t.created_at DESC, t.id DESC
    `;

    const [rows] = await db.query(query, params);

    const data = rows.map((ticket) => ({
      ...ticket,
      category: buildTicketCategory(
        ticket.subject,
        ticket.description
      ),
      ui_status: ticketStatusToUi(ticket.status),
      ui_priority: ticketPriorityToUi(ticket.priority),
    }));

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error("Tickets error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load tickets",
    });
  }
});

// GET SINGLE TICKET
app.get("/api/tickets/:id", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        t.id,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.email,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score,
        t.title AS subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS owner,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const ticket = rows[0];

    res.json({
      success: true,
      data: {
        ...ticket,
        category: buildTicketCategory(
          ticket.subject,
          ticket.description
        ),
        ui_status: ticketStatusToUi(ticket.status),
        ui_priority: ticketPriorityToUi(ticket.priority),
      },
    });
  } catch (error) {
    console.error("Single ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load ticket",
    });
  }
});

// CREATE TICKET
app.post("/api/tickets", authenticateToken, async (req, res) => {
  try {
    const {
      student_id,
      title,
      description,
      priority,
    } = req.body;

    if (!student_id || !title) {
      return res.status(400).json({
        success: false,
        message: "student_id and title are required",
      });
    }

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    const ticketPriority = priority || "MEDIUM";

    if (!allowedPriorities.includes(ticketPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket priority",
      });
    }

    const [student] = await db.query(
      `SELECT id FROM students WHERE id = ? LIMIT 1`,
      [student_id]
    );

    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO tickets
      (
        student_id,
        title,
        description,
        priority,
        status,
        assigned_to,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, 'OPEN', ?, NOW(), NOW())
      `,
      [
        student_id,
        title.trim(),
        description || null,
        ticketPriority,
        req.user.userId,
      ]
    );

    const [created] = await db.query(
      `
      SELECT
        t.id,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score,
        t.title AS subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS owner,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = ?
      `,
      [result.insertId]
    );

    const ticket = created[0];

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: {
        ...ticket,
        category: buildTicketCategory(
          ticket.subject,
          ticket.description
        ),
        ui_status: "open",
        ui_priority: ticketPriorityToUi(ticket.priority),
      },
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create ticket",
    });
  }
});

// UPDATE TICKET
app.put("/api/tickets/:id", authenticateToken, async (req, res) => {
  try {
    const {
      status,
      priority,
      assigned_to,
      ai_summary,
      detected_intent,
      sentiment,
    } = req.body;

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
    ];

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket priority",
      });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    const [existing] = await db.query(
      `SELECT id FROM tickets WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await db.query(
      `
      UPDATE tickets
      SET
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = COALESCE(?, assigned_to),
        ai_summary = COALESCE(?, ai_summary),
        detected_intent = COALESCE(?, detected_intent),
        sentiment = COALESCE(?, sentiment),
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        status || null,
        priority || null,
        assigned_to || null,
        ai_summary || null,
        detected_intent || null,
        sentiment || null,
        req.params.id,
      ]
    );

    const [updated] = await db.query(
      `
      SELECT
        t.id,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score,
        t.title AS subject,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS owner,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = ?
      `,
      [req.params.id]
    );

    const ticket = updated[0];

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: {
        ...ticket,
        category: buildTicketCategory(
          ticket.subject,
          ticket.description
        ),
        ui_status: ticketStatusToUi(ticket.status),
        ui_priority: ticketPriorityToUi(ticket.priority),
      },
    });
  } catch (error) {
    console.error("Update ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update ticket",
    });
  }
});

/* =========================================================
   ADMIN AUTHORIZATION TEST
========================================================= */

app.get(
  "/api/admin/test",
  authenticateToken,
  requireRole("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin authorization working",
      user: req.user,
    });
  }
);
/* =========================================================
   TICKETS
========================================================= */

// Get all tickets
app.get(
  "/api/tickets",
  authenticateToken,
  async (req, res) => {
    try {
      const [tickets] = await db.query(`
        SELECT
          t.id,
          t.student_id,
          s.student_id AS student_code,
          s.name AS student_name,
          s.programme,
          s.journey_stage,
          s.risk_level,
          s.cgpa,
          s.attendance,
          s.engagement_score,
          t.title AS subject,
          t.description,
          t.priority,
          t.status,
          t.assigned_to,
          u.name AS owner,
          t.ai_summary,
          t.detected_intent,
          t.sentiment,
          t.created_at,
          t.updated_at
        FROM tickets t
        LEFT JOIN students s
          ON s.id = t.student_id
        LEFT JOIN users u
          ON u.id = t.assigned_to
        ORDER BY t.created_at DESC
      `);

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      console.error("Get tickets error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load tickets",
      });
    }
  }
);


// Get one ticket
app.get(
  "/api/tickets/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const [tickets] = await db.query(
        `
        SELECT
          t.id,
          t.student_id,
          s.student_id AS student_code,
          s.name AS student_name,
          s.programme,
          s.journey_stage,
          s.risk_level,
          s.cgpa,
          s.attendance,
          s.engagement_score,
          t.title AS subject,
          t.description,
          t.priority,
          t.status,
          t.assigned_to,
          u.name AS owner,
          t.ai_summary,
          t.detected_intent,
          t.sentiment,
          t.created_at,
          t.updated_at
        FROM tickets t
        LEFT JOIN students s
          ON s.id = t.student_id
        LEFT JOIN users u
          ON u.id = t.assigned_to
        WHERE t.id = ?
        LIMIT 1
        `,
        [req.params.id]
      );

      if (tickets.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      res.json({
        success: true,
        data: tickets[0],
      });
    } catch (error) {
      console.error("Get ticket error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load ticket",
      });
    }
  }
);


// Create ticket
app.post(
  "/api/tickets",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        student_id,
        title,
        description,
        priority,
      } = req.body;

      if (!student_id || !title) {
        return res.status(400).json({
          success: false,
          message: "student_id and title are required",
        });
      }

      const [students] = await db.query(
        `SELECT id FROM students WHERE id = ? LIMIT 1`,
        [student_id]
      );

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      const allowedPriorities = [
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
      ];

      const finalPriority =
        allowedPriorities.includes(priority)
          ? priority
          : "MEDIUM";

      const [result] = await db.query(
        `
        INSERT INTO tickets
        (
          student_id,
          title,
          description,
          priority,
          status
        )
        VALUES (?, ?, ?, ?, 'OPEN')
        `,
        [
          student_id,
          title.trim(),
          description || null,
          finalPriority,
        ]
      );

      const [tickets] = await db.query(
        `
        SELECT
          t.id,
          t.student_id,
          s.student_id AS student_code,
          s.name AS student_name,
          s.programme,
          s.journey_stage,
          s.risk_level,
          s.cgpa,
          s.attendance,
          s.engagement_score,
          t.title AS subject,
          t.description,
          t.priority,
          t.status,
          t.assigned_to,
          u.name AS owner,
          t.ai_summary,
          t.detected_intent,
          t.sentiment,
          t.created_at,
          t.updated_at
        FROM tickets t
        LEFT JOIN students s
          ON s.id = t.student_id
        LEFT JOIN users u
          ON u.id = t.assigned_to
        WHERE t.id = ?
        LIMIT 1
        `,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Ticket created successfully",
        data: tickets[0],
      });
    } catch (error) {
      console.error("Create ticket error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to create ticket",
      });
    }
  }
);


// Update ticket
app.put(
  "/api/tickets/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        status,
        priority,
        assigned_to,
        ai_summary,
        detected_intent,
        sentiment,
      } = req.body;

      const [existing] = await db.query(
        `SELECT id FROM tickets WHERE id = ? LIMIT 1`,
        [req.params.id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      const updates = [];
      const values = [];

      if (status !== undefined) {
        const allowedStatuses = [
          "OPEN",
          "IN_PROGRESS",
          "RESOLVED",
          "CLOSED",
        ];

        if (!allowedStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid ticket status",
          });
        }

        updates.push("status = ?");
        values.push(status);
      }

      if (priority !== undefined) {
        const allowedPriorities = [
          "LOW",
          "MEDIUM",
          "HIGH",
          "URGENT",
        ];

        if (!allowedPriorities.includes(priority)) {
          return res.status(400).json({
            success: false,
            message: "Invalid ticket priority",
          });
        }

        updates.push("priority = ?");
        values.push(priority);
      }

      if (assigned_to !== undefined) {
        updates.push("assigned_to = ?");
        values.push(
          assigned_to === null
            ? null
            : Number(assigned_to)
        );
      }

      if (ai_summary !== undefined) {
        updates.push("ai_summary = ?");
        values.push(ai_summary);
      }

      if (detected_intent !== undefined) {
        updates.push("detected_intent = ?");
        values.push(detected_intent);
      }

      if (sentiment !== undefined) {
        updates.push("sentiment = ?");
        values.push(sentiment);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      values.push(req.params.id);

      await db.query(
        `
        UPDATE tickets
        SET ${updates.join(", ")}
        WHERE id = ?
        `,
        values
      );

      const [tickets] = await db.query(
        `
        SELECT
          t.id,
          t.student_id,
          s.student_id AS student_code,
          s.name AS student_name,
          s.programme,
          s.journey_stage,
          s.risk_level,
          s.cgpa,
          s.attendance,
          s.engagement_score,
          t.title AS subject,
          t.description,
          t.priority,
          t.status,
          t.assigned_to,
          u.name AS owner,
          t.ai_summary,
          t.detected_intent,
          t.sentiment,
          t.created_at,
          t.updated_at
        FROM tickets t
        LEFT JOIN students s
          ON s.id = t.student_id
        LEFT JOIN users u
          ON u.id = t.assigned_to
        WHERE t.id = ?
        LIMIT 1
        `,
        [req.params.id]
      );

      res.json({
        success: true,
        message: "Ticket updated successfully",
        data: tickets[0],
      });
    } catch (error) {
      console.error("Update ticket error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update ticket",
      });
    }
  }
);
/* =========================================================
   SERVICE TICKETS API
========================================================= */

// GET ALL TICKETS
app.get("/api/tickets", authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT
        t.id,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.email AS student_email,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS assigned_name,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== "all") {
      if (status === "open") {
        query += ` AND t.status IN ('OPEN','IN_PROGRESS') `;
      } else {
        query += ` AND t.status = ? `;
        params.push(String(status).toUpperCase());
      }
    }

    if (search) {
      query += `
        AND (
          t.title LIKE ?
          OR t.description LIKE ?
          OR s.name LIKE ?
          OR s.student_id LIKE ?
        )
      `;

      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY t.id DESC `;

    const [rows] = await db.query(query, params);

    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    console.error("Tickets GET error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load tickets",
    });
  }
});


// GET SINGLE TICKET
app.get("/api/tickets/:id", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        t.id,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.email AS student_email,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS assigned_name,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Ticket GET error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load ticket",
    });
  }
});


// CREATE TICKET
app.post("/api/tickets", authenticateToken, async (req, res) => {
  try {
    const {
      student_id,
      title,
      description,
      priority = "MEDIUM",
      status = "OPEN",
    } = req.body;

    if (!student_id || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "student_id, title and description are required",
      });
    }

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    if (!allowedPriorities.includes(String(priority).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "PENDING",
      "RESOLVED",
    ];

    if (!allowedStatuses.includes(String(status).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    const [student] = await db.query(
      `SELECT id FROM students WHERE id = ? LIMIT 1`,
      [student_id]
    );

    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO tickets
      (
        student_id,
        title,
        description,
        priority,
        status,
        assigned_to,
        ai_summary,
        detected_intent,
        sentiment
      )
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)
      `,
      [
        student_id,
        title.trim(),
        description.trim(),
        String(priority).toUpperCase(),
        String(status).toUpperCase(),
        description.trim(),
        "General Support",
        "NEUTRAL",
      ]
    );

    const [rows] = await db.query(
      `
      SELECT
        t.*,
        s.student_id AS student_code,
        s.name AS student_name,
        s.email AS student_email,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score
      FROM tickets t
      JOIN students s ON s.id = t.student_id
      WHERE t.id = ?
      `,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Ticket CREATE error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create ticket",
    });
  }
});


// UPDATE TICKET
app.put("/api/tickets/:id", authenticateToken, async (req, res) => {
  try {
    const {
      status,
      assigned_to,
      priority,
      description,
      ai_summary,
      detected_intent,
      sentiment,
    } = req.body;

    const [existingRows] = await db.query(
      `SELECT * FROM tickets WHERE id = ? LIMIT 1`,
      [req.params.id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const existing = existingRows[0];

    const allowedStatuses = [
      "OPEN",
      "IN_PROGRESS",
      "PENDING",
      "RESOLVED",
    ];

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ];

    if (
      status !== undefined &&
      !allowedStatuses.includes(String(status).toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    if (
      priority !== undefined &&
      !allowedPriorities.includes(String(priority).toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket priority",
      });
    }

    if (assigned_to !== undefined && assigned_to !== null) {
      const [users] = await db.query(
        `SELECT id FROM users WHERE id = ? AND status = 'ACTIVE' LIMIT 1`,
        [assigned_to]
      );

      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Assigned user not found or inactive",
        });
      }
    }

    await db.query(
      `
      UPDATE tickets
      SET
        status = COALESCE(?, status),
        assigned_to = ?,
        priority = COALESCE(?, priority),
        description = COALESCE(?, description),
        ai_summary = COALESCE(?, ai_summary),
        detected_intent = COALESCE(?, detected_intent),
        sentiment = COALESCE(?, sentiment)
      WHERE id = ?
      `,
      [
        status !== undefined ? String(status).toUpperCase() : null,
        assigned_to === undefined ? existing.assigned_to : assigned_to,
        priority !== undefined ? String(priority).toUpperCase() : null,
        description !== undefined ? description : null,
        ai_summary !== undefined ? ai_summary : null,
        detected_intent !== undefined ? detected_intent : null,
        sentiment !== undefined ? sentiment : null,
        req.params.id,
      ]
    );

    const [rows] = await db.query(
      `
      SELECT
        t.*,
        s.student_id AS student_code,
        s.name AS student_name,
        s.email AS student_email,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score,
        u.name AS assigned_name
      FROM tickets t
      JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = ?
      LIMIT 1
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Ticket UPDATE error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update ticket",
    });
  }
});
/* =========================================================
   SERVICE TICKETS API
========================================================= */

// Get all tickets
app.get("/api/tickets", authenticateToken, async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT
        t.id,
        CONCAT('TKT-', LPAD(t.id, 6, '0')) AS ticket_number,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.email AS student_email,
        s.programme,
        s.department,
        s.year,
        s.attendance,
        s.cgpa,
        s.journey_stage,
        s.risk_level,
        s.engagement_score,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS assigned_to_name,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      INNER JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== "all") {
      if (status === "pending") {
        sql += " AND t.status = ?";
        params.push("IN_PROGRESS");
      } else {
        sql += " AND LOWER(t.status) = LOWER(?)";
        params.push(status);
      }
    }

    if (search && String(search).trim()) {
      sql += `
        AND (
          t.title LIKE ?
          OR t.description LIKE ?
          OR s.name LIKE ?
          OR s.student_id LIKE ?
        )
      `;

      const q = `%${String(search).trim()}%`;
      params.push(q, q, q, q);
    }

    sql += " ORDER BY t.id DESC";

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: rows.length,
        page: 1,
        limit: rows.length,
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve tickets",
    });
  }
});


// Get single ticket
app.get("/api/tickets/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        t.id,
        CONCAT('TKT-', LPAD(t.id, 6, '0')) AS ticket_number,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.email AS student_email,
        s.programme,
        s.department,
        s.year,
        s.attendance,
        s.cgpa,
        s.journey_stage,
        s.risk_level,
        s.engagement_score,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS assigned_to_name,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      INNER JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve ticket",
    });
  }
});


// Create ticket
app.post("/api/tickets", authenticateToken, async (req, res) => {
  try {
    const {
      student_id,
      title,
      description,
      priority = "MEDIUM",
      status = "NEW",
      ai_summary = null,
      detected_intent = null,
      sentiment = null,
    } = req.body;

    if (!student_id || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "student_id, title and description are required",
      });
    }

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];
    const allowedStatuses = ["NEW", "OPEN", "IN_PROGRESS", "RESOLVED"];

    if (!allowedPriorities.includes(String(priority).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    if (!allowedStatuses.includes(String(status).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket status",
      });
    }

    const [students] = await db.query(
      "SELECT id FROM students WHERE student_id = ?",
      [student_id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const dbStudentId = students[0].id;

    const [result] = await db.query(
      `
      INSERT INTO tickets
      (
        student_id,
        title,
        description,
        priority,
        status,
        assigned_to,
        ai_summary,
        detected_intent,
        sentiment
      )
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?)
      `,
      [
        dbStudentId,
        title.trim(),
        description.trim(),
        String(priority).toUpperCase(),
        String(status).toUpperCase(),
        ai_summary,
        detected_intent,
        sentiment,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: {
        id: result.insertId,
        ticket_number: `TKT-${String(result.insertId).padStart(6, "0")}`,
      },
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create ticket",
    });
  }
});


// Update ticket
app.put("/api/tickets/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      status,
      priority,
      assigned_to,
      ai_summary,
      detected_intent,
      sentiment,
    } = req.body;

    const allowedStatuses = [
      "NEW",
      "OPEN",
      "IN_PROGRESS",
      "RESOLVED",
    ];

    const allowedPriorities = [
      "LOW",
      "MEDIUM",
      "HIGH",
    ];

    const updates = [];
    const params = [];

    if (status !== undefined) {
      const normalizedStatus = String(status).toUpperCase();

      if (!allowedStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket status",
        });
      }

      updates.push("status = ?");
      params.push(normalizedStatus);
    }

    if (priority !== undefined) {
      const normalizedPriority = String(priority).toUpperCase();

      if (!allowedPriorities.includes(normalizedPriority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket priority",
        });
      }

      updates.push("priority = ?");
      params.push(normalizedPriority);
    }

    if (assigned_to !== undefined) {
      if (
        assigned_to !== null &&
        !Number.isInteger(Number(assigned_to))
      ) {
        return res.status(400).json({
          success: false,
          message: "assigned_to must be a valid user id or null",
        });
      }

      updates.push("assigned_to = ?");
      params.push(
        assigned_to === null ? null : Number(assigned_to)
      );
    }

    if (ai_summary !== undefined) {
      updates.push("ai_summary = ?");
      params.push(ai_summary);
    }

    if (detected_intent !== undefined) {
      updates.push("detected_intent = ?");
      params.push(detected_intent);
    }

    if (sentiment !== undefined) {
      updates.push("sentiment = ?");
      params.push(sentiment);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    params.push(id);

    const [result] = await db.query(
      `
      UPDATE tickets
      SET ${updates.join(", ")}
      WHERE id = ?
      `,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        t.id,
        CONCAT('TKT-', LPAD(t.id, 6, '0')) AS ticket_number,
        t.student_id,
        s.student_id AS student_code,
        s.name AS student_name,
        s.email AS student_email,
        s.programme,
        s.journey_stage,
        s.risk_level,
        s.cgpa,
        s.attendance,
        s.engagement_score,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.assigned_to,
        u.name AS assigned_to_name,
        t.ai_summary,
        t.detected_intent,
        t.sentiment,
        t.created_at,
        t.updated_at
      FROM tickets t
      INNER JOIN students s ON s.id = t.student_id
      LEFT JOIN users u ON u.id = t.assigned_to
      WHERE t.id = ?
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: rows[0],
    });
  } catch (error) {
    console.error("Update ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
    });
  }
});
// ==================== OUTCOMES ====================

// Get outcomes and outcome metrics
app.get('/api/outcomes', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        o.id,
        o.student_id,
        s.name AS student_name,
        o.recommendation_id,
        o.message_id,
        o.outcome_type,
        o.outcome_value,
        o.response_received,
        o.converted,
        o.retained,
        o.recorded_at
      FROM outcomes o
      LEFT JOIN students s ON s.id = o.student_id
      ORDER BY o.recorded_at DESC
    `);

    const total = rows.length;

    const responses = rows.filter(r => Number(r.response_received) === 1).length;
    const conversions = rows.filter(r => Number(r.converted) === 1).length;
    const retained = rows.filter(r => Number(r.retained) === 1).length;

    const responseRate = total
      ? Number(((responses / total) * 100).toFixed(1))
      : 0;

    const conversionRate = total
      ? Number(((conversions / total) * 100).toFixed(1))
      : 0;

    const retentionRate = total
      ? Number(((retained / total) * 100).toFixed(1))
      : 0;

    // Group outcomes by type for analytics
    const outcomeTypes = {};

    rows.forEach(row => {
      const type = row.outcome_type || 'Unknown';

      if (!outcomeTypes[type]) {
        outcomeTypes[type] = {
          outcome_type: type,
          total: 0,
          responses: 0,
          conversions: 0,
          retained: 0
        };
      }

      outcomeTypes[type].total += 1;
      outcomeTypes[type].responses += Number(row.response_received) === 1 ? 1 : 0;
      outcomeTypes[type].conversions += Number(row.converted) === 1 ? 1 : 0;
      outcomeTypes[type].retained += Number(row.retained) === 1 ? 1 : 0;
    });

    res.json({
      success: true,
      data: rows,
      metrics: {
        total,
        responses,
        conversions,
        retained,
        responseRate,
        conversionRate,
        retentionRate
      },
      byType: Object.values(outcomeTypes)
    });

  } catch (error) {
    console.error('GET /api/outcomes error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch outcomes',
      error: error.message
    });
  }
});
// ==================== AI PREDICTIONS ====================

app.get('/api/predictions', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.id,
        a.student_id,
        s.name AS student_name,
        s.student_id AS student_code,
        s.programme,
        s.journey_stage,
        s.attendance,
        s.cgpa,
        s.engagement_score,
        s.risk_level,
        a.run_type,
        a.input_snapshot,
        a.output_data,
        a.confidence,
        a.explanation,
        a.status,
        a.latency_ms,
        a.created_at
      FROM ai_runs a
      LEFT JOIN students s ON s.id = a.student_id
      ORDER BY a.created_at DESC
    `);

    const predictions = rows.map(row => {
      let inputSnapshot = row.input_snapshot;
      let outputData = row.output_data;

      try {
        if (typeof inputSnapshot === 'string') {
          inputSnapshot = JSON.parse(inputSnapshot);
        }
      } catch (_) {}

      try {
        if (typeof outputData === 'string') {
          outputData = JSON.parse(outputData);
        }
      } catch (_) {}

      return {
        ...row,
        input_snapshot: inputSnapshot || {},
        output_data: outputData || {},
        confidence: Number(row.confidence || 0),
        latency_ms: Number(row.latency_ms || 0)
      };
    });

    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });

  } catch (error) {
    console.error('GET /api/predictions error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI predictions',
      error: error.message
    });
  }
});
app.get("/api/ai/test", authenticateToken, async (req, res) => {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-3.7-flash",
      contents: "Reply with exactly: Gemini connection successful",
    });

    res.json({
      success: true,
      message: response.text,
    });
  } catch (error) {
    console.error("Gemini test error:", error);
    res.status(500).json({
      success: false,
      message: "Gemini connection failed",
      error: error.message,
    });
  }
});
app.get("/api/ai/predict/:studentId", authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const [students] = await db.query(
      `SELECT id, student_id, name, programme, department, year,
              attendance, cgpa, journey_stage, risk_level, engagement_score
       FROM students
       WHERE id = ?`,
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const student = students[0];

    const [interactions] = await db.query(
      `SELECT interaction_type, channel, subject, description,
              message, status, occurred_at
       FROM interactions
       WHERE student_id = ?
       ORDER BY occurred_at DESC
       LIMIT 10`,
      [studentId]
    );

    const prompt = `
You are an AI decision-support assistant for a university.

Analyze ONLY the observable student data below.

Student:
${JSON.stringify(student)}

Recent interactions:
${JSON.stringify(interactions)}

Return ONLY valid JSON:

{
  "intent": "short description",
  "sentiment": "Positive | Neutral | Negative",
  "churn_risk": 0,
  "conversion_propensity": 0,
  "next_best_action": "recommended action",
  "confidence": 0,
  "explanation": "short evidence-based explanation",
  "evidence": [
    "observable input 1",
    "observable input 2"
  ]
}

Rules:
- Values must be between 0 and 100.
- Do not invent facts.
- Do not use sensitive or prohibited attributes.
- Keep the explanation concise.
`;

    let prediction = null;
    let aiAvailable = false;

    // Try Gemini twice
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await gemini.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt
        });

        let aiText = (response.text || "")
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        
        prediction = JSON.parse(aiText);

const attendance = Number(student.attendance || 0);
const cgpa = Number(student.cgpa || 0);
const engagement = Number(student.engagement_score || 0);

if (
  Number(prediction.churn_risk) === 0 &&
  Number(prediction.conversion_propensity) === 0 &&
  Number(prediction.confidence) === 0
) {
  let churnRisk = 10;

  if (attendance < 60) churnRisk += 30;
  else if (attendance < 75) churnRisk += 15;

  if (cgpa < 6) churnRisk += 20;
  else if (cgpa < 7) churnRisk += 10;

  if (engagement < 40) churnRisk += 25;
  else if (engagement < 60) churnRisk += 10;

  prediction.churn_risk = Math.min(churnRisk, 95);

  prediction.conversion_propensity = Math.max(
    5,
    Math.min(95, Math.round((attendance + engagement) / 2))
  );

  prediction.confidence = 70;
}

aiAvailable = true;
break;

      } catch (aiError) {
        console.error(`Gemini attempt ${attempt} failed:`, aiError.message);

        if (attempt === 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
    }

    // Safe observable-data fallback if Gemini is unavailable
    if (!aiAvailable) {
      const attendance = Number(student.attendance || 0);
      const cgpa = Number(student.cgpa || 0);
      const engagement = Number(student.engagement_score || 0);

      let churnRisk = 10;

      if (attendance < 60) churnRisk += 30;
      else if (attendance < 75) churnRisk += 15;

      if (cgpa < 6) churnRisk += 20;
      else if (cgpa < 7) churnRisk += 10;

      if (engagement < 40) churnRisk += 25;
      else if (engagement < 60) churnRisk += 10;

      churnRisk = Math.min(churnRisk, 95);

      const conversionPropensity = Math.max(
        5,
        Math.min(95, Math.round(
          (attendance + engagement) / 2
        ))
      );

      prediction = {
        intent: student.journey_stage
          ? `${student.journey_stage} support`
          : "Student support",
        sentiment: "Neutral",
        churn_risk: churnRisk,
        conversion_propensity: conversionPropensity,
        next_best_action: churnRisk >= 50
          ? "Review student status and provide appropriate support"
          : "Continue regular student engagement",
        confidence: 70,
        explanation:
          "Fallback prediction based only on observable attendance, academic performance, engagement, and journey-stage data because the AI model was temporarily unavailable.",
        evidence: [
          `Attendance: ${attendance}%`,
          `CGPA: ${cgpa}`,
          `Engagement score: ${engagement}`
        ]
      };
    }
    const aiRunId = randomUUID();

await db.query(
  `INSERT INTO ai_runs
   (
     id,
     student_id,
     model_version_id,
     run_type,
     input_snapshot,
     output_data,
     confidence,
     explanation,
     status,
     latency_ms
   )
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    aiRunId,
    student.id,
    null,
    "CHURN",
    JSON.stringify({
      student,
      interactions
    }),
    JSON.stringify({
      ...prediction,
      model: aiAvailable
        ? "gemini-3.7-flash"
        : "rule-based-fallback"
    }),
    Number(prediction.confidence || 0),
    String(prediction.explanation || ""),
    "SUCCESS",,
    null
  ]
);

    res.json({
      success: true,
      data: {
  student,
  prediction,
  ai_run_id: aiRunId,
  generated_at: new Date().toISOString(),
        model: aiAvailable ? "gemini-3.7-flash" : "rule-based-fallback",
        ai_available: aiAvailable
      }
    });

  } catch (error) {
    console.error("AI prediction error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate AI prediction",
      error: error.message
    });
  }
});
/* =========================================================
   CAMPAIGNS & MESSAGE DELIVERY
========================================================= */

app.post(
  "/api/campaigns",
  authenticateToken,
  idempotencyMiddleware,
  requireRole("admin", "marketing manager"),
  async (req, res) => {
  try {
    const {
      name,
      segment_id = null,
      channel_id = null,
      message_template = "",
      frequency_cap = 5
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campaign name is required"
      });
    }

    const cap = Number(frequency_cap);

    if (!Number.isInteger(cap) || cap < 0 || cap > 50) {
      return res.status(400).json({
        success: false,
        message: "Frequency cap must be between 0 and 50"
      });
    }

    const campaignId = require("crypto").randomUUID();

    await db.query(
      `INSERT INTO campaigns
       (id, name, segment_id, channel_id, message_template,
        status, frequency_cap, created_by)
       VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
      [
        campaignId,
        name.trim(),
        segment_id,
        channel_id,
        message_template,
        cap,
        req.user.userId
      ]
    );

    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: {
        id: campaignId,
        name: name.trim(),
        status: "DRAFT",
        frequency_cap: cap
      }
    });
  } catch (error) {
    console.error("Create campaign error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create campaign"
    });
  }
});


app.get("/api/campaigns", authenticateToken, async (req, res) => {
  try {
    const [campaigns] = await db.query(
      `SELECT *
       FROM campaigns
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error("Get campaigns error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve campaigns"
    });
  }
});


app.post(
  "/api/messages/send",
  authenticateToken,
  idempotencyMiddleware,
  requireRole("admin", "marketing manager", "sales manager", "service agent"),
  async (req, res) => {
  try {
    const {
      student_id,
      campaign_id = null,
      channel = "EMAIL",
      subject = null,
      content
    } = req.body;

    if (!student_id || !content) {
      return res.status(400).json({
        success: false,
        message: "student_id and content are required"
      });
    }

    const [students] = await db.query(
      `SELECT id, name, email
       FROM students
       WHERE id = ?`,
      [student_id]
    );

    if (!students.length) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const [preferences] = await db.query(
      `SELECT email_consent, sms_consent, whatsapp_consent,
              call_consent, marketing_consent, weekly_frequency_cap
       FROM consent_preferences
       WHERE student_id = ?`,
      [student_id]
    );

    if (!preferences.length) {
      return res.status(403).json({
        success: false,
        message: "Consent preferences not found"
      });
    }

    const pref = preferences[0];

    const consentMap = {
      EMAIL: pref.email_consent,
      SMS: pref.sms_consent,
      WHATSAPP: pref.whatsapp_consent,
      CALL: pref.call_consent,
      WEB: 1
    };

    if (!consentMap[channel]) {
      return res.status(403).json({
        success: false,
        message: "Message blocked: channel consent not available",
        reason: "CONSENT_BLOCKED"
      });
    }

    const optOutChannel =
      channel === "WEB" ? "MARKETING" : channel;

    const [optOuts] = await db.query(
      `SELECT id
       FROM opt_out_events
       WHERE student_id = ?
       AND channel = ?
       LIMIT 1`,
      [student_id, optOutChannel]
    );

    if (optOuts.length) {
      return res.status(403).json({
        success: false,
        message: "Message blocked: student opted out",
        reason: "OPTED_OUT"
      });
    }

    const cap = Number(pref.weekly_frequency_cap || 0);

    const [recentMessages] = await db.query(
      `SELECT COUNT(*) AS total
       FROM messages
       WHERE student_id = ?
       AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       AND status IN ('SENT','DELIVERED','RESPONDED')`,
      [student_id]
    );

    const sentThisWeek = Number(recentMessages[0].total || 0);

    if (cap === 0 || sentThisWeek >= cap) {
      return res.status(429).json({
        success: false,
        message: "Message blocked: weekly frequency cap reached",
        reason: "FREQUENCY_CAP",
        frequency_cap: cap,
        sent_this_week: sentThisWeek
      });
    }

    const messageId = require("crypto").randomUUID();

    await db.query(
      `INSERT INTO messages
       (id, student_id, campaign_id, channel, subject, content,
        status, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, 'SENT', NOW())`,
      [
        messageId,
        student_id,
        campaign_id,
        channel,
        subject,
        content
      ]
    );

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        id: messageId,
        student_id,
        channel,
        status: "SENT",
        frequency_cap: cap,
        sent_this_week: sentThisWeek + 1
      }
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
});


app.put(
  "/api/messages/:id/delivered",
  authenticateToken,
  requireRole("admin", "marketing manager", "sales manager", "service agent"),
  async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE messages
       SET status = 'DELIVERED',
           delivered_at = NOW()
       WHERE id = ?`,
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.json({
      success: true,
      message: "Delivery recorded"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to record delivery"
    });
  }
});


app.put(
  "/api/messages/:id/responded",
  authenticateToken,
  requireRole("admin", "marketing manager", "sales manager", "service agent"),
  async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE messages
       SET status = 'RESPONDED',
           response_received = 1,
           responded_at = NOW()
       WHERE id = ?`,
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    res.json({
      success: true,
      message: "Response recorded"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to record response"
    });
  }
});
/* =========================================================
   AI APPROVAL / REVIEW / OVERRIDE
========================================================= */

app.post(
  "/api/ai/approvals",
  authenticateToken,
  idempotencyMiddleware,
  requireRole("admin", "marketing manager", "sales manager", "service agent"),
  async (req, res) => {
  try {
    const {
      ai_run_id,
      decision,
      reason = null
    } = req.body;

    if (!ai_run_id || !decision) {
      return res.status(400).json({
        success: false,
        message: "ai_run_id and decision are required"
      });
    }

    const allowedDecisions = [
      "APPROVED",
      "REJECTED",
      "CORRECTED",
      "OVERRIDDEN",
      "DEFERRED"
    ];

    if (!allowedDecisions.includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid AI decision"
      });
    }

    if (
      ["REJECTED", "CORRECTED", "OVERRIDDEN", "DEFERRED"].includes(decision) &&
      (!reason || !reason.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "A reason is required for this decision"
      });
    }

    // Check AI run exists
    const [runs] = await db.query(
      `SELECT id, student_id, model_version_id, input_snapshot,
              output_data, confidence
       FROM ai_runs
       WHERE id = ?`,
      [ai_run_id]
    );

    if (!runs.length) {
      return res.status(404).json({
        success: false,
        message: "AI run not found"
      });
    }

    const approvalId = require("crypto").randomUUID();

    await db.query(
      `INSERT INTO ai_approvals
       (id, ai_run_id, reviewer_id, decision, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [
        approvalId,
        ai_run_id,
        req.user.userId,
        decision,
        reason
      ]
    );

    res.status(201).json({
      success: true,
      message: "AI decision recorded successfully",
      data: {
        id: approvalId,
        ai_run_id,
        reviewer_id: req.user.userId,
        decision,
        reason
      }
    });

  } catch (error) {
    console.error("AI approval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to record AI decision"
    });
  }
});


app.get("/api/ai/approvals/:aiRunId", authenticateToken, async (req, res) => {
  try {
    const [approvals] = await db.query(
      `SELECT
         a.id,
         a.ai_run_id,
         a.reviewer_id,
         u.name AS reviewer_name,
         a.decision,
         a.reason,
         a.created_at
       FROM ai_approvals a
       LEFT JOIN users u ON u.id = a.reviewer_id
       WHERE a.ai_run_id = ?
       ORDER BY a.created_at DESC`,
      [req.params.aiRunId]
    );

    res.json({
      success: true,
      data: approvals
    });

  } catch (error) {
    console.error("Get AI approvals error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve AI approvals"
    });
  }
});
// API documentation
app.get("/api/docs", (req, res) => {
  res.json({
    name: "University AI Customer Journey Orchestrator API",
    version: "v1",
    endpoints: [
      "POST /api/auth/login",
      "GET /api/auth/me",
      "GET /api/v1/health",
      "GET /api/students?page=1&limit=20&search=&risk_level=",
      "GET /api/students/:id",
      "GET /api/interactions",
      "GET /api/consent/:studentId",
      "POST /api/consent/:studentId/opt-out",
      "GET /api/tickets",
      "GET /api/outcomes",
      "GET /api/predictions",
      "GET /api/ai/predict/:studentId",
      "POST /api/ai/approvals",
      "GET /api/campaigns",
      "POST /api/campaigns",
      "POST /api/messages/send",
      "PUT /api/messages/:id/delivered",
      "PUT /api/messages/:id/responded"
    ],
    authentication: "Bearer JWT",
    features: [
      "RBAC",
      "Rate limiting",
      "Idempotency",
      "Consent enforcement",
      "Frequency-cap enforcement",
      "AI human review",
      "Audit logging",
      "Pagination and filtering"
    ]
  });
});
/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* =========================================================
   SERVER START
========================================================= */
// Global structured API error handler
app.use((err, req, res, next) => {
  console.error("API Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: {
      code: err.code || "INTERNAL_ERROR",
      details: err.details || {}
    }
  });
});
/* =========================================================
   SERVER START
========================================================= */

app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log(`Backend server running on port ${process.env.PORT || 5000}`);
});
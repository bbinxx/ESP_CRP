const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const db = require("./db");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Send initial status
  sendStatus(socket);

  // Send initial logs
  db.getLogs(100, (err, logs) => {
    if (!err) socket.emit("logs", logs);
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Helper to broadcast status to all clients
function sendStatus(target = io) {
  db.getHeartbeat((err, lastHeartbeat) => {
    if (err) return;

    db.getState('ledState', (err, ledState) => {
      if (err) return;

      const now = Date.now();
      const isOnline = lastHeartbeat && (now - lastHeartbeat) < 10000;

      target.emit("status", {
        online: isOnline,
        ledState: ledState || "off",
        lastSeen: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : null
      });
    });
  });
}

// Set LED state (from dashboard)
app.post("/set", (req, res) => {
  const { state } = req.body;

  db.getState('ledState', (err, currentState) => {
    if (err) return res.status(500).json({ error: "Database error" });

    db.setState('ledState', state, (err) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (currentState !== state) {
        db.addLog("WEB", `LED changed: ${currentState} → ${state}`, () => {
          // Broadcast new log to all clients
          db.getLogs(100, (err, logs) => {
            if (!err) io.emit("logs", logs);
          });
        });
      }

      // Broadcast status update
      sendStatus();

      res.json({ ok: true, state: state });
    });
  });
});

// Get LED state (ESP polls this)
app.get("/get", (req, res) => {
  db.getState('ledState', (err, ledState) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ led: ledState || "off" });
  });
});

// Log from ESP
app.post("/log", (req, res) => {
  const { msg } = req.body;

  db.addLog("ESP", msg, (err) => {
    if (err) return res.status(500).json({ error: "Database error" });

    // Broadcast new log to all clients
    db.getLogs(100, (err, logs) => {
      if (!err) io.emit("logs", logs);
    });

    // Broadcast status update (heartbeat changed)
    sendStatus();

    res.json({ ok: true });
  });
});

// Get logs (dashboard polls this - fallback if Socket.IO fails)
app.get("/logs", (req, res) => {
  db.getLogs(100, (err, logs) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(logs);
  });
});

// Status endpoint (ESP online check - fallback)
app.get("/status", (req, res) => {
  db.getHeartbeat((err, lastHeartbeat) => {
    if (err) return res.status(500).json({ error: "Database error" });

    db.getState('ledState', (err, ledState) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const now = Date.now();
      const isOnline = lastHeartbeat && (now - lastHeartbeat) < 10000;

      res.json({
        online: isOnline,
        ledState: ledState || "off",
        lastSeen: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : null
      });
    });
  });
});

// Dashboard UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🗄️  SQLite database initialized`);
  console.log(`⚡ Socket.IO enabled for real-time updates`);
  console.log(`LED State: OFF`);
});

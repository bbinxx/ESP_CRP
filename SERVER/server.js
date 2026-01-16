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
  console.log(`✅ [SOCKET] Client connected: ${socket.id} (IP: ${socket.request.connection.remoteAddress})`);

  // Send initial status immediately
  sendStatus(socket);

  // Send recent logs
  db.getLogs(100, (err, logs) => {
    if (!err) socket.emit("logs", logs);
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ [SOCKET] Client disconnected: ${socket.id} (Reason: ${reason})`);
  });

  // Allow clients to request refresh
  socket.on("refresh", () => {
    console.log(`🔄 [SOCKET] Refresh requested by ${socket.id}`);
    sendStatus(socket);
  });
});

// Helper to broadcast status to all clients
function sendStatus(target = io) {
  db.getHeartbeat((err, lastHeartbeat) => {
    if (err) return console.error("❌ [DB] Error getting heartbeat:", err);

    db.getState('ledState', (err, ledState) => {
      if (err) return console.error("❌ [DB] Error getting LED state:", err);

      const now = Date.now();
      const isOnline = lastHeartbeat && (now - lastHeartbeat) < 12000; // 12s timeout (allows for 1s network latency + 10s polling gap)
      const lastSeenDate = lastHeartbeat ? new Date(parseInt(lastHeartbeat)) : null;

      const statusPayload = {
        online: isOnline,
        ledState: ledState || "off",
        lastSeen: lastSeenDate ? lastSeenDate.toISOString() : null,
        serverTime: now
      };

      // console.log(`📊 [STATUS] Broadcast: Online=${isOnline}, LED=${ledState}`);
      target.emit("status", statusPayload);
    });
  });
}

// Set LED state (from dashboard)
app.post("/set", (req, res) => {
  const { state } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.log(`⚡ [API] POST /set: ${state} (from ${clientIp})`);

  db.getState('ledState', (err, currentState) => {
    if (err) {
      console.error("❌ [DB] Error reading state:", err);
      return res.status(500).json({ error: "Database error" });
    }

    db.setState('ledState', state, (err) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const msg = `LED changed: ${currentState} → ${state} (by Web)`;
      console.log(`📝 [LOG] ${msg}`);

      db.addLog("WEB", msg, () => {
        // Broadcast new log to all clients
        db.getLogs(100, (err, logs) => {
          if (!err) io.emit("logs", logs);
        });
      });

      // Broadcast status update immediately
      sendStatus();

      res.json({ ok: true, state: state });
    });
  });
});

// Get LED state (ESP polls this)
app.get("/get", (req, res) => {
  // Update heartbeat since ESP just contacted us
  db.setState('lastHeartbeat', Date.now(), (err) => {
    if (err) console.error("❌ [DB] Heartbeat update failed:", err);

    // Broadcast "I'm still alive" to dashboard (throttled could be better, but real-time is requested)
    // We only broadcast if we haven't in the last 2 seconds to save bandwidth, 
    // OR if we want pure realtime, we just emit. Let's emit to be safe/responsive.
    sendStatus();
  });

  db.getState('ledState', (err, ledState) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ led: ledState || "off" });
  });
});

// Log from ESP
app.post("/log", (req, res) => {
  const { msg } = req.body;
  console.log(`📡 [API] POST /log from ESP: "${msg}"`);

  db.addLog("ESP", msg, (err) => {
    if (err) return res.status(500).json({ error: "Database error" });

    // Broadcast new log to all clients
    db.getLogs(100, (err, logs) => {
      if (!err) io.emit("logs", logs);
    });

    // ESP just contacted us, so update heartbeat status!
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

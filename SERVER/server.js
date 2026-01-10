const express = require("express");
const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

let ledState = "off";
let logs = [];

// Set LED state (from dashboard)
app.post("/set", (req, res) => {
  const prevState = ledState;
  ledState = req.body.state;
  
  if (prevState !== ledState) {
    addLog("WEB", `LED changed: ${prevState} → ${ledState}`);
  }
  
  res.json({ ok: true, state: ledState });
});

// Get LED state (ESP polls this)
app.get("/get", (req, res) => {
  res.json({ led: ledState });
});

// Log from ESP
app.post("/log", (req, res) => {
  const msg = req.body.msg;
  addLog("ESP", msg);
  res.json({ ok: true });
});

// Get logs (dashboard polls this)
app.get("/logs", (req, res) => {
  res.json(logs.slice(-100));
});

// Dashboard UI
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

function addLog(source, msg) {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  const entry = { 
    time: timestamp, 
    source, 
    msg,
    id: Date.now() 
  };
  
  logs.push(entry);
  if (logs.length > 500) logs.shift();
  
  console.log(`[${timestamp}] ${source}: ${msg}`);
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log("LED State: OFF");
  addLog("SRV", "Server started");
});


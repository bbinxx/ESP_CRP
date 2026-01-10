# ESP8266 Cloud-Connected IoT System

**Power-and-go** IoT device with server-based control, remote logging, and real-time dashboard.

## 🎯 Architecture

```
ESP8266 ←→ Node.js Server ←→ Web Dashboard
(WiFi)      (State Manager)    (Remote Control)
```

**No local webpage on ESP** — All control happens through the server.

## ✨ Features

### 1️⃣ Power-and-Go Behavior
- Plug ESP into power → Auto-connects to WiFi → Goes online
- No buttons, no screen, no manual setup
- Works anywhere your WiFi is available

### 2️⃣ Server-Only Control
- ESP doesn't host any webpage
- Control from any device, anywhere
- No "same network" limitation
- No need to find ESP's IP

### 3️⃣ LED Control System
- Server stores LED state (single source of truth)
- Dashboard buttons update server state
- ESP polls server every 3 seconds
- LED syncs automatically
- Restart-safe: ESP re-syncs state after reboot

### 4️⃣ Live Remote Logging
- ESP sends all activity to server:
  - Boot messages
  - WiFi connection status
  - LED state changes
  - Errors
- View logs from dashboard (replaces Serial Monitor)
- No USB cable needed after initial flash

### 5️⃣ Styled Control Dashboard
- Dark-themed premium UI
- Big LED ON/OFF buttons with gradient effects
- Real-time log panel (auto-refresh every 2s)
- Color-coded logs (ESP/WEB/SRV)
- Smooth animations

### 6️⃣ Two-Way Communication
- **You → ESP**: Dashboard → Server → ESP polls → Executes
- **ESP → You**: ESP logs → Server → Dashboard displays

### 7️⃣ Restart-Safe Design
- ESP restart: Reconnects WiFi + re-syncs LED state
- Server restart: State resets but ESP adapts
- Self-recovering system

## 🛠️ Hardware

- ESP8266 NodeMCU
- Built-in LED (GPIO2)
- USB power supply

## 📁 Project Structure

```
ESP_CRP/
├── ESP_CRP.ino          # WiFi client that polls server
├── SERVER/
│   ├── server.js        # Express backend (state manager)
│   ├── index.html       # Control dashboard
│   └── package.json
└── data/                # (Not used in cloud mode)
```

## 🚀 Setup

### Step 1: Configure WiFi & Server

Edit `ESP_CRP.ino`:

```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:3000";
```

**Finding Server IP**:
- Same computer: Use `192.168.x.x` (local IP)
- Different network: Use public IP + port forwarding
- Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Step 2: Flash ESP8266

1. Install Arduino IDE
2. Add ESP8266 board support
3. **No LittleFS upload needed** (cloud mode)
4. Upload `ESP_CRP.ino`

### Step 3: Start Server

```bash
cd SERVER
npm install
npm start
```

Server runs on `http://localhost:3000`

### Step 4: Access Dashboard

Open browser: `http://localhost:3000`

**From other devices**: Use your computer's IP (e.g., `http://192.168.1.100:3000`)

## 🌐 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/set` | Set LED state from dashboard |
| `GET` | `/get` | ESP polls for current state |
| `POST` | `/log` | ESP sends log messages |
| `GET` | `/logs` | Dashboard fetches last 100 logs |

## 🎮 Usage

1. **Power ESP** → Auto-connects to WiFi
2. **Open Dashboard** → See live logs
3. **Click LED ON/OFF** → ESP syncs within 3 seconds
4. **View Logs** → Real-time activity tracking

## 🔄 How It Works

### Boot Sequence
```
1. ESP powers on
2. Connects to WiFi
3. Sends "ESP booting..." log to server
4. Fetches initial LED state
5. Enters polling loop (every 3s)
```

### Control Flow
```
User clicks "LED ON"
   ↓
Dashboard sends POST /set {"state": "on"}
   ↓
Server stores state + logs action
   ↓
ESP polls GET /get (within 3s)
   ↓
ESP receives {"led": "on"}
   ↓
LED turns ON
```

## 🏗️ What You've Built

This is the foundation of:
- ✅ Smart home systems
- ✅ Remote monitoring
- ✅ Industrial IoT
- ✅ Device fleet management
- ✅ Cloud-connected sensors

**Key Concepts Applied**:
- Client-server architecture
- Polling vs webhooks
- Stateful server design
- Remote device management
- RESTful API design

## 🔐 Production Tips

For real-world use:
- Add authentication (API keys)
- Use HTTPS
- Implement MQTT for better real-time sync
- Add database for persistent logs
- Deploy server to cloud (AWS, Heroku, Render)

## 📡 Troubleshooting

**ESP not connecting**:
- Check WiFi credentials
- Verify server URL and port
- Ensure server is running

**Dashboard not updating**:
- Check browser console for errors
- Verify CORS is enabled
- Refresh logs manually

**LED not responding**:
- ESP polls every 3s (not instant)
- Check server logs for ESP activity
- Verify server state with `/get` endpoint


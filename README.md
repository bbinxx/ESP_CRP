# ⚡ ESP-Pulse

> **Real-time IoT control system** with bidirectional Socket.IO communication, persistent SQLite storage, and a professional management dashboard.

![ESP8266](https://img.shields.io/badge/ESP8266-NodeMCU-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)

## ✨ Features

- **⚡ Instant Control**: Real-time bidirectional communication via **Socket.IO**.
- **📊 Live Dashboard**: Professional, window-style interface with instant status updates.
- **💾 Persistent State**: SQLite database ensures data survives restarts.
- **📡 Robust Connectivity**: Auto-reconnects, reports WiFi RSSI signal strength.
- **🛡️ Reliable**: Heartbeat tracking to detect offline devices immediately.

## 🚀 Quick Start

### 1. Hardware Setup
- **ESP8266 NodeMCU**
- **USB Cable**

### 2. Configure WiFi
Create `config.h` in the root (gitignored):
```cpp
WiFiCred networks[] = {
  {"YourWiFi", "YourPassword"},
  {"BackupWiFi", "BackupPass"}
};
int totalNetworks = 2;
const char* serverUrl = "https://your-app-name.onrender.com";
```

### 3. Deploy Server
1. Push to GitHub.
2. Deploy on **Render** (auto-configured via `render.yaml`).
   - Build: `cd SERVER && npm install`
   - Start: `cd SERVER && npm start`

### 4. Flash Firmware
Open `ESP_CRP.ino` in Arduino IDE and upload to your ESP8266.

## 📂 Project Structure

```
ESP-Pulse/
├── ESP_CRP.ino      # ESP8266 Firmware (C++)
├── SERVER/          # Backend & Frontend
│   ├── server.js    # Express + Socket.IO Server
│   ├── db.js        # SQLite Database Manager
│   ├── index.html   # Professional Dashboard
│   └── data/        # Persistent Storage
├── render.yaml      # Render Deployment Config
└── config.h         # Credentials (Private)
```

## 🔌 API & Events

| Type | Name | Payload | Description |
|------|------|---------|-------------|
| **Socket** | `status` | `{ online, ledState, lastSeen }` | Live device status |
| **Socket** | `logs` | `[{ time, source, msg }]` | Array of recent logs |
| **HTTP** | `POST /set` | `{ state: "on"|"off" }` | Control LED |
| **HTTP** | `POST /log` | `{ msg: "text" }` | Send device log |

## 📄 License
MIT

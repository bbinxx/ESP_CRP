# 🌐 ESP8266 Cloud-Connected IoT Control System

**Professional IoT platform** for remote ESP8266 control with real-time monitoring, persistent storage, and beautiful web dashboard.

![ESP8266](https://img.shields.io/badge/ESP8266-NodeMCU-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)
![Render](https://img.shields.io/badge/Deploy-Render-purple)

## ✨ Features

### 🚀 Power-and-Go Architecture
- **Zero Configuration**: Plug ESP → Auto-connects → Goes online
- **Multi-Network Support**: Try multiple WiFi networks automatically
- **Self-Recovering**: Auto-reconnects on disconnect
- **Portable**: Works anywhere your configured WiFi exists

### 🎛️ Server-Centric Control
- **No Local Webpage**: ESP doesn't host HTTP server
- **Cloud Control**: Manage from anywhere with internet
- **Network Independent**: No "same network" limitation
- **HTTPS Support**: Secure SSL communication

### 💾 Persistent Storage
- **SQLite Database**: State survives restarts
- **Activity Logs**: Up to 500 entries with timestamps
- **Heartbeat Tracking**: Online/offline detection (10s timeout)
- **State Synchronization**: ESP polls every 3 seconds

### 🎨 Premium Dashboard
- **Gradient Design**: Modern, eye-catching UI
- **Real-Time Stats**: LED state, log count, last seen
- **Live Monitoring**: Auto-refresh every 2 seconds
- **Visual Feedback**: Animated buttons, status indicators
- **Responsive**: Works on desktop, tablet, mobile

### 📡 Two-Way Communication
- **User → ESP**: Dashboard → Server → ESP polls → Executes
- **ESP → User**: ESP logs → Server → Dashboard displays
- **Instant Feedback**: Button confirmation, error alerts

## 🛠️ Hardware Requirements

- ESP8266 NodeMCU (or compatible)
- USB cable for flashing
- Power supply (USB)

## 📁 Project Structure

```
ESP_CRP/
├── ESP_CRP.ino           # ESP8266 firmware (WiFi client)
├── config.h              # WiFi credentials (gitignored)
├── config.h.template     # Template for credentials
├── SERVER/
│   ├── server.js         # Express backend
│   ├── db.js             # SQLite database module
│   ├── index.html        # Control dashboard
│   ├── package.json      # Dependencies
│   └── data/
│       ├── schema.sql    # Database schema
│       └── .gitkeep      # Keep directory in Git
├── api/                  # Vercel serverless functions (optional)
├── render.yaml           # Render deployment config
└── README.md
```

## 🚀 Quick Start

### 1. Configure WiFi Credentials

```bash
cp config.h.template config.h
```

Edit `config.h`:
```cpp
WiFiCred networks[] = {
  {"YourHomeWiFi", "your_password"},
  {"YourPhoneHotspot", "hotspot_pass"},
  {"PublicWiFi", ""}  // open network
};

int totalNetworks = 3;

const char* serverUrl = "https://your-app.onrender.com";
```

### 2. Flash ESP8266

1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP8266 board support:
   - File → Preferences → Additional Board URLs:
   - `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
3. Install board: Tools → Board → Boards Manager → "esp8266"
4. Select board: Tools → Board → NodeMCU 1.0
5. Upload `ESP_CRP.ino`

### 3. Deploy Server to Render

#### Option A: One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

#### Option B: Manual Deploy

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New → Web Service
4. Connect GitHub repo
5. Render auto-detects settings from `render.yaml`
6. Click "Create Web Service"

**Settings** (if manual):
- **Build Command**: `cd SERVER && npm install`
- **Start Command**: `cd SERVER && npm start`
- **Environment**: Node

### 4. Update ESP Config

After deployment, update `config.h` with your Render URL:

```cpp
const char* serverUrl = "https://esp-control-xyz.onrender.com";
```

Re-flash ESP.

### 5. Access Dashboard

Open: `https://your-app.onrender.com`

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Web dashboard |
| `POST` | `/set` | Set LED state `{state: "on"\|"off"}` |
| `GET` | `/get` | Get LED state → `{led: "on"\|"off"}` |
| `POST` | `/log` | ESP sends log `{msg: "text"}` |
| `GET` | `/logs` | Get last 100 logs |
| `GET` | `/status` | Device status + heartbeat |

## 🔄 How It Works

### Boot Sequence
```
1. ESP powers on
2. Tries all configured WiFi networks
3. Connects to first available network
4. Sends boot log to server
5. Fetches initial LED state
6. Enters polling loop (every 3s)
```

### Control Flow
```
User clicks "LED ON"
   ↓
POST /set {"state": "on"}
   ↓
Server saves to SQLite
   ↓
ESP polls GET /get (within 3s)
   ↓
ESP receives {"led": "on"}
   ↓
LED turns ON
   ↓
ESP sends log to confirm
```

## 🎨 Dashboard Features

- **Status Indicator**: Live online/offline badge
- **Statistics**: LED state, total logs, last seen
- **LED Controls**: Big ON/OFF buttons with ripple effect
- **Activity Logs**: Color-coded, real-time feed
- **Auto-Refresh**: Updates every 2 seconds
- **Responsive**: Works on all screen sizes

## 🔐 Production Deployment

### Security Enhancements
- [ ] Add API key authentication
- [ ] Implement rate limiting
- [ ] Enable HTTPS only
- [ ] Add user authentication
- [ ] Implement CORS whitelist

### Scalability
- [ ] Migrate to PostgreSQL for production
- [ ] Add Redis for caching
- [ ] Implement WebSockets for real-time updates
- [ ] Add multiple device support
- [ ] Create admin dashboard

### Monitoring
- [ ] Add health check endpoint
- [ ] Implement error logging (Sentry)
- [ ] Set up uptime monitoring
- [ ] Add analytics

## 📊 Database Schema

```sql
-- State table
CREATE TABLE state (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at INTEGER
);

-- Logs table  
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT,
  source TEXT,
  message TEXT,
  created_at INTEGER
);
```

## 🐛 Troubleshooting

### ESP Not Connecting
- ✅ Check WiFi credentials in `config.h`
- ✅ Verify server URL (no trailing slash)
- ✅ Ensure server is running
- ✅ Check Serial Monitor (9600 baud)

### Dashboard Not Updating
- ✅ Check browser console (F12) for errors
- ✅ Verify ESP is online (status badge)
- ✅ Test API endpoints manually
- ✅ Check Render logs

### LED Not Responding
- ✅ ESP polls every 3s (not instant)
- ✅ Check Serial Monitor for errors
- ✅ Verify built-in LED pin (GPIO2)
- ✅ Test `/get` endpoint in browser

### Database Issues
- ✅ Check `SERVER/data/` directory exists
- ✅ Verify write permissions
- ✅ Check Render logs for SQLite errors

## 🏗️ Built With

- **ESP8266**: WiFi microcontroller
- **Arduino**: ESP firmware framework  
- **Node.js**: Server runtime
- **Express**: Web framework
- **SQLite**: Embedded database
- **Render**: Cloud platform
- **HTML/CSS/JS**: Dashboard

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first.

## 🎯 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] MQTT support
- [ ] OTA (Over-The-Air) updates
- [ ] Multiple ESP devices
- [ ] GPIO pin control
- [ ] Sensor data visualization
- [ ] Scheduled tasks
- [ ] Email/SMS notifications

## 📞 Support

Issues? Questions? Open a GitHub issue!

---

**Made with ❤️ for the IoT community**

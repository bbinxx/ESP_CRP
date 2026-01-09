# ESP8266 NodeMCU Control System

IoT project using ESP8266 NodeMCU with WiFi hotspot and LED control via web interface + Node.js server backend.

## Features

- **WiFi Hotspot Mode** - ESP creates its own AP
- **Web Interface** - Control LED via browser
- **Node.js Server** - Centralized state management & logging
- **Real-time Logs** - Track ESP/Web interactions

## Hardware

- ESP8266 NodeMCU
- Built-in LED (GPIO2)

## Project Structure

```
ESP_CRP/
├── ESP_CRP.ino          # Arduino sketch for ESP8266
├── data/
│   └── index.html       # Web UI served from LittleFS
└── SERVER/
    ├── server.js        # Express backend
    ├── index.html       # Web dashboard
    └── package.json
```

## Setup

### ESP8266

1. Install Arduino IDE + ESP8266 board support
2. Upload filesystem (Tools → ESP8266 LittleFS Data Upload)
3. Upload sketch
4. Connect to WiFi: `ESP_NodeMCU` (password: `12345678`)
5. Open: `http://192.168.4.1`

### Node.js Server

```bash
cd SERVER
npm install
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Server

- `POST /set` - Set LED state `{state: "on"|"off"}`
- `GET /get` - Get current LED state
- `POST /log` - Add log entry
- `GET /logs` - Get last 50 logs

### ESP

- `GET /` - Web interface
- `GET /on` - Turn LED on
- `GET /off` - Turn LED off

## Network Info

- **SSID**: ESP_NodeMCU
- **Password**: 12345678
- **ESP IP**: 192.168.4.1
- **Server**: localhost:3000

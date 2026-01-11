#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// Multi-WiFi Support
struct WiFiCred {
  const char* ssid;
  const char* pass;
};

WiFiCred networks[] = {
  {"HomeWiFi", "home12345"},
  {"PhoneHotspot", "phonepass"},
  {"CollegeWiFi", ""},        // open network
  {"YOUR_WIFI_SSID", "YOUR_WIFI_PASSWORD"}
};

int totalNetworks = 4;

// Server Config
const char* serverUrl = "http://YOUR_SERVER_IP:3000";

#define LED_PIN LED_BUILTIN
unsigned long lastPoll = 0;
const long pollInterval = 3000; // 3 seconds

WiFiClient wifiClient;

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);

  Serial.println("\n=== ESP8266 Boot ===");
  sendLog("ESP booting...");

  // Try connecting to WiFi networks
  WiFi.mode(WIFI_STA);
  bool connected = false;

  for (int i = 0; i < totalNetworks && !connected; i++) {
    Serial.print("Trying: ");
    Serial.print(networks[i].ssid);
    
    if (strlen(networks[i].pass) > 0) {
      WiFi.begin(networks[i].ssid, networks[i].pass);
    } else {
      WiFi.begin(networks[i].ssid);  // open network
    }
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      connected = true;
      Serial.println("\n✓ WiFi Connected!");
      Serial.print("Network: ");
      Serial.println(networks[i].ssid);
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
      
      String logMsg = "WiFi connected: " + String(networks[i].ssid) + " (" + WiFi.localIP().toString() + ")";
      sendLog(logMsg);
      
      // Sync LED state from server
      syncLedState();
    } else {
      Serial.println(" Failed");
    }
  }

  if (!connected) {
    Serial.println("\n✗ All WiFi networks failed!");
    sendLog("WiFi: All networks failed");
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, retrying networks...");
    
    // Try all networks again
    for (int i = 0; i < totalNetworks; i++) {
      if (strlen(networks[i].pass) > 0) {
        WiFi.begin(networks[i].ssid, networks[i].pass);
      } else {
        WiFi.begin(networks[i].ssid);
      }
      
      delay(5000);
      
      if (WiFi.status() == WL_CONNECTED) {
        Serial.print("Reconnected to: ");
        Serial.println(networks[i].ssid);
        sendLog("Reconnected: " + String(networks[i].ssid));
        break;
      }
    }
    return;
  }

  // Poll server for LED state
  if (millis() - lastPoll > pollInterval) {
    lastPoll = millis();
    syncLedState();
  }
}

void syncLedState() {
  HTTPClient http;
  String url = String(serverUrl) + "/get";
  
  http.begin(wifiClient, url);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    
    if (payload.indexOf("\"on\"") > 0) {
      digitalWrite(LED_PIN, LOW); // ON
      Serial.println("LED: ON");
    } else {
      digitalWrite(LED_PIN, HIGH); // OFF
      Serial.println("LED: OFF");
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpCode);
  }
  
  http.end();
}

void sendLog(String message) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(serverUrl) + "/log";
  
  http.begin(wifiClient, url);
  http.addHeader("Content-Type", "application/json");
  
  String json = "{\"msg\":\"" + message + "\"}";
  int httpCode = http.POST(json);
  
  if (httpCode > 0) {
    Serial.print("Log sent: ");
    Serial.println(message);
  }
  
  http.end();
}

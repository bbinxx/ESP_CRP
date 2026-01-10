#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// WiFi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

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

  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    sendLog("WiFi connected: " + WiFi.localIP().toString());
    
    // Sync LED state from server
    syncLedState();
  } else {
    Serial.println("\nWiFi Failed!");
    sendLog("WiFi connection failed");
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.begin(ssid, password);
    delay(5000);
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

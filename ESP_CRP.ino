#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include "config.h"  // WiFi credentials & server URL

#define LED_PIN LED_BUILTIN
unsigned long lastPoll = 0;
const long pollInterval = 3000; // 3 seconds

WiFiClientSecure wifiClient;

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);

  Serial.println("\n=== ESP8266 Boot ===");
  
  // Configure SSL (ignore certificate validation for now)
  wifiClient.setInsecure();
  
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
  
  Serial.print("Polling: ");
  Serial.println(url);
  
  http.begin(wifiClient, url);
  http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);  // Follow 308 redirects
  http.setTimeout(5000);  // 5 second timeout
  
  int httpCode = http.GET();

  Serial.print("Response Code: ");
  Serial.println(httpCode);

  if (httpCode == 200) {
    String payload = http.getString();
    Serial.print("Payload: ");
    Serial.println(payload);
    
    if (payload.indexOf("\"on\"") > 0) {
      digitalWrite(LED_PIN, LOW); // ON
      Serial.println("✓ LED: ON");
    } else {
      digitalWrite(LED_PIN, HIGH); // OFF
      Serial.println("✓ LED: OFF");
    }
  } else if (httpCode == 301 || httpCode == 302 || httpCode == 307 || httpCode == 308) {
    Serial.println("⚠ Redirect detected - Check serverUrl (no trailing slash needed)");
    String location = http.header("Location");
    Serial.print("Redirect to: ");
    Serial.println(location);
  } else if (httpCode == -1) {
    Serial.println("✗ Connection timeout");
  } else if (httpCode < 0) {
    Serial.print("✗ HTTP Client Error: ");
    Serial.println(http.errorToString(httpCode));
  } else {
    Serial.print("✗ HTTP Error ");
    Serial.print(httpCode);
    Serial.print(": ");
    Serial.println(http.getString());
  }
  
  http.end();
}

void sendLog(String message) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ Cannot send log: WiFi disconnected");
    return;
  }

  HTTPClient http;
  String url = String(serverUrl) + "/log";
  
  http.begin(wifiClient, url);
  http.setFollowRedirects(HTTPC_FORCE_FOLLOW_REDIRECTS);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  String json = "{\"msg\":\"" + message + "\"}";
  int httpCode = http.POST(json);
  
  if (httpCode == 200) {
    Serial.print("✓ Log sent: ");
    Serial.println(message);
  } else if (httpCode > 0) {
    Serial.print("⚠ Log HTTP ");
    Serial.print(httpCode);
    Serial.print(": ");
    Serial.println(message);
  } else {
    Serial.print("✗ Log failed: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}

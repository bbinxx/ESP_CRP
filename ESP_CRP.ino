#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <LittleFS.h>

const char* ap_ssid = "ESP_NodeMCU";
const char* ap_password = "12345678";   // min 8 chars

ESP8266WebServer server(80);
#define LED_PIN LED_BUILTIN

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);

  // Start Hotspot
  WiFi.softAP(ap_ssid, ap_password);
  IPAddress ip = WiFi.softAPIP();

  Serial.println("Hotspot Started");
  Serial.print("Connect to: ");
  Serial.println(ap_ssid);
  Serial.print("Open: http://");
  Serial.println(ip);

  LittleFS.begin();

  server.on("/", []() {
    File file = LittleFS.open("/index.html", "r");
    server.streamFile(file, "text/html");
    file.close();
  });

  server.on("/on", []() {
    digitalWrite(LED_PIN, LOW);   // ON (built-in LED)
    server.send(200, "text/plain", "LED ON");
  });

  server.on("/off", []() {
    digitalWrite(LED_PIN, HIGH);  // OFF
    server.send(200, "text/plain", "LED OFF");
  });

  server.begin();
  Serial.println("Web server running");
}

void loop() {
  server.handleClient();
}

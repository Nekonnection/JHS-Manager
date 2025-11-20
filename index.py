import websocket
import json
import os
import re
import time
from dotenv import load_dotenv

load_dotenv()

class RustManager:
    def __init__(self):
        self.ip = os.getenv('RCON_IP', '127.0.0.1')
        self.port = os.getenv('RCON_PORT', '28017')
        self.password = os.getenv('RCON_PASSWORD')
        self.reconnect_interval = int(os.getenv('RECONNECT_INTERVAL', 5000)) / 1000 # ms to s

        if not self.password:
            raise ValueError("❌ Error: RCON_PASSWORD is not set in .env")

        self.ws = None
        self.ID_STATUS_REQUEST = 1001

    def connect(self):
        url = f"ws://{self.ip}:{self.port}/{self.password}"
        
        self.ws = websocket.WebSocketApp(url, 
                                         on_open=self.on_open,on_message=self.on_message,
                                         on_error=self.on_error,
                                         on_close=self.on_close)
        
        self.ws.run_forever()

    def on_open(self, ws):
        print(f"[RustManager] Connected to {self.ip}:{self.port}")

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            
            if data.get('Type') == 'Chat':
                self.handle_chat(data.get('Message', ''))

            if data.get('Identifier') == self.ID_STATUS_REQUEST:
                self.handle_status_response(data.get('Message', ''))

        except json.JSONDecodeError:
            print("JSON Parse Error")

    def on_error(self, ws, error):
        print(f"[RustManager] Error: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        print(f"[RustManager] Disconnected. Retrying in {self.reconnect_interval}s...")
        time.sleep(self.reconnect_interval)

        self.connect()

    def send_command(self, command, identifier=-1):
        if self.ws:
            packet = json.dumps({
                "Identifier": identifier,
                "Message": command,
                "Name": "RustBot"
            })
            self.ws.send(packet)

    def handle_chat(self, message):
        if "!pop" in message:
            print("📩 Command received: !pop")
            self.send_command("status", self.ID_STATUS_REQUEST)

    def handle_status_response(self, message):
        
        match = re.search(r'players\s*:\s*(\d+)\s*\(\s*(\d+)\s*max\)', message)
        
        if match:
            current = match.group(1)
            max_players = match.group(2)
            reply = f"現在の接続人数: {current} / {max_players} 人です"
            
            self.send_command(f"say {reply}")
            print(f"Reply sent: {reply}")

if __name__ == "__main__":
    manager = RustManager()
    try:
        manager.connect()
    except KeyboardInterrupt:
        print("\nManager stopped by user")
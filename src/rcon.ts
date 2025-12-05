import WebSocket from 'ws';
import { config } from './config';

export class RconService {
    private ws: WebSocket | null = null;
    private isConnected = false;

    connect() {
        this.ws = new WebSocket(`ws://${config.rcon.ip}:${config.rcon.port}/${config.rcon.password}`);

        this.ws.on('open', () => {
            console.log('[RCON] Connected');
            this.isConnected = true;
        });

        this.ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.Message && message.Message.includes('!pop')) {
                 // ...
            }
        });

        this.ws.on('close', () => {
            console.log('[RCON] Disconnected. Retrying...');
            this.isConnected = false;
            setTimeout(() => this.connect(), 5000);
        });
    }

    public broadcast(message: string) {
        if (!this.isConnected || !this.ws) return;
        const packet = JSON.stringify({
            Identifier: -1,
            Message: `say ${message}`,
            Name: 'RustBot'
        });
        this.ws.send(packet);
    }
}
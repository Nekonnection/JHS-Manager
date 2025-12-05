import WebSocket from 'ws';
import { config } from '../config.js';

type LogCallback = (message: string) => void;

interface RconResponse {
    Identifier: number;
    Message: string;
    Type: string;
}

export class RconService {
    private ws: WebSocket | null = null;
    private _isConnected = false;
    private messageIdCounter = 1000;

    private readonly logListeners: LogCallback[] = [];
    private readonly pendingRequests = new Map<number, (response: string) => void>();

    public constructor() {
        this.connect();
    }

    public get isConnected(): boolean {
        return this._isConnected;
    }

    public onLogMessage(callback: LogCallback): void {
        this.logListeners.push(callback);
    }

    private connect(): void {
        const url = `ws://${config.rcon.ip}:${config.rcon.port}/${config.rcon.password}`;

        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
            console.log('[RCON] Connected to Server.');
            this._isConnected = true;
        });

        this.ws.on('message', (data) => {
            try {
                const json = JSON.parse(data.toString()) as RconResponse;
                
                if (this.pendingRequests.has(json.Identifier)) {
                    const resolve = this.pendingRequests.get(json.Identifier);
                    if (resolve) {
                        resolve(json.Message);
                        this.pendingRequests.delete(json.Identifier);
                    }
                    return;
                }

                if (json.Message) {
                    this.logListeners.forEach((listener) => listener(json.Message));
                }
            } catch (error) {
            }
        });

        this.ws.on('close', () => {
            if (this._isConnected) {
                console.log('[RCON] Connection lost. Waiting for server...');
            }
            this._isConnected = false;
            this.pendingRequests.clear();
            
            setTimeout(() => this.connect(), config.rcon.reconnectInterval);
        });

        this.ws.on('error', (err: Error & { code?: string }) => {
            if (err.code === 'ECONNREFUSED') return;
            console.error(`[RCON] Error: ${err.message}`);
        });
    }

    public send(command: string): void {
        if (!this.ws || !this._isConnected) return;
        try {
            this.ws.send(JSON.stringify({
                Identifier: -1,
                Message: command,
                Name: 'RustBot'
            }));
        } catch (e) {
        }
    }

    public async sendCommand(command: string): Promise<string> {
        if (!this.ws || !this._isConnected) throw new Error('RCON not connected');

        const id = this.messageIdCounter++;
        return new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Timeout'));
                }
            }, 5000);

            this.pendingRequests.set(id, (response) => {
                clearTimeout(timeout);
                resolve(response);
            });

            this.ws?.send(JSON.stringify({
                Identifier: id,
                Message: command,
                Name: 'RustBot'
            }));
        });
    }

    public whisper(steamId: string, message: string): void {
        if (!this._isConnected) return;
        console.log(`[Whisper -> ${steamId}] ${message}`);
        this.send(`bot.pm ${steamId} ${message}`);
    }

    public broadcast(message: string): void {
        if (!this._isConnected) {
            console.log(`[Broadcast (Server Offline)] ${message}`);
            return;
        }
        console.log(`[Broadcast] ${message}`);
        this.send(`say ${message}`);
    }
}
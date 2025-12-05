import WebSocket from 'ws';
import { config } from '../config';

/**
 * RCONを通じてサーバーと通信を行うクラス
 */
export class RconService {
    private ws: WebSocket | null = null;
    private isConnected = false;

    constructor() {
        this.connect();
    }
    /**
     * RCONサーバーへ接続を確立する
     */
    private connect() {
        const url = `ws://${config.rcon.ip}:${config.rcon.port}/${config.rcon.password}`;
        console.log(`[RCON] Connecting to ${url.replace(config.rcon.password, '****')}...`);

        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
            console.log('[RCON] Connected.');
            this.isConnected = true;
        });

        this.ws.on('message', (data) => {
            try {
                const json = JSON.parse(data.toString());
                if (json.Type === 'Chat') {
                    this.chat(json.Message);
                }
            } catch (e) {
            }
        });

        this.ws.on('close', () => {
            console.log('[RCON] Disconnected. Reconnecting...');
            this.isConnected = false;
            setTimeout(() => this.connect(), config.rcon.reconnectInterval);
        });

        this.ws.on('error', (err) => {
            console.error('[RCON] Error:', err.message);
        });
    }
    /**
     * チャットメッセージを処理する
     * @param message チャットメッセージの内容
     */
    private chat(message: string) {
        if (message.includes('!pop')) {
            this.send('status', 1001);
        }
    }
    /**
     * コマンドをRCONサーバーに送信する
     * @param command 送信するコマンド
     * @param identifier コマンドの識別子（デフォルトは-1）
     */
    public send(command: string, identifier = -1) {
        if (!this.ws || !this.isConnected) return;
        this.ws.send(JSON.stringify({
            Identifier: identifier,
            Message: command,
            Name: 'RustBot'
        }));
    }
    /**
     * メッセージをサーバー全体にブロードキャストする
     * @param message ブロードキャストするメッセージ
     */
    public broadcast(message: string) {
        console.log(`[Broadcast] ${message}`);
        this.send(`say ${message}`);
    }
}
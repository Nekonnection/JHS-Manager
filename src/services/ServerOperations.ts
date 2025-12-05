import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';

import { config } from '../config.js';

const execAsync = promisify(exec);

/**
 * サーバーの起動、停止、更新、ファイル削除などのOS操作を担当するクラス
 */
export class ServerOperations {
    private static log(message: string): void {
        console.log(`[ServerOperations] ${message}`);
    }

    public static async stop(): Promise<void> {
        this.log('Stopping server...');
        try {
            await execAsync(config.commands.stop);
        } catch (error) {
            if (error instanceof Error) {
                this.log(`Stop command warning: ${error.message}`);
            }
        }
    }

    public static async start(): Promise<void> {
        this.log('Starting server...');
        await execAsync(config.commands.start);
    }

    public static async update(): Promise<void> {
        this.log('Updating server (SteamCMD)...');
        await execAsync(config.commands.update);
    }

    /**
     * フルワイプ処理
     */
    public static async fullWipe(): Promise<void> {
        this.log('Starting FULL WIPE process...');
        const serverPath = path.join(config.server.dir, 'server', config.server.identity);
        
        const wipePattern = /\.(map|sav|db)$/;

        try {
            await fs.access(serverPath);

            const files = await fs.readdir(serverPath);
            for (const file of files) {
                if (wipePattern.test(file)) {
                    await fs.unlink(path.join(serverPath, file));
                    this.log(`Deleted: ${file}`);
                }
            }
        } catch (error) {
            console.error('[ServerOperations] Wipe error:', error);
        }
    }
}
import cron from 'node-cron';

import { RconService } from './RconService.js';
import { ServerOperations } from './ServerOperations.js';

export class SchedulerService {
    public constructor(private readonly rcon: RconService) {}

    public start(): void {
        console.log('[Scheduler] Started.');

        cron.schedule('0 4 * * *', () => { void this.restart(); }, { timezone: 'Asia/Tokyo' });

        cron.schedule('50 19 * * 5', () => { void this.wipe(); }, { timezone: 'Asia/Tokyo' });
    }

    private async restart(): Promise<void> {
        const today = new Date();
        if (this.isWipeDay(today)) {
            console.log('[Scheduler] Target: Wipe Day Morning (Stop Only)');
            await this.countdown('定期メンテナンス(長時間停止)', async () => {
                await ServerOperations.stop();
            });
        } else {
            console.log('[Scheduler] Target: Daily Restart');
            await this.countdown('定期再起動', async () => {
                await ServerOperations.stop();
                await new Promise((resolve) => setTimeout(resolve, 30000));
                await ServerOperations.start();
            });
        }
    }

    private async wipe(): Promise<void> {
        if (!this.isWipeDay(new Date())) return;

        console.log('[Scheduler] Target: Full Wipe Sequence');
        await ServerOperations.stop();
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await ServerOperations.fullWipe();
        await ServerOperations.update();
        await ServerOperations.start();
        
        console.log('[Scheduler] Full wipe sequence completed.');
    }

    private isWipeDay(date: Date): boolean {
        const dayOfWeek = date.getDay();
        const dayOfMonth = date.getDate();
        if (dayOfWeek !== 5) return false;
        return (dayOfMonth >= 1 && dayOfMonth <= 7) || (dayOfMonth >= 15 && dayOfMonth <= 21);
    }

    private async countdown(actionName: string, callback: () => Promise<void>): Promise<void> {
        const schedule = [
            { min: 60, msg: `1時間後に ${actionName} を行います。` },
            { min: 30, msg: `30分後に ${actionName} を行います。` },
            { min: 10, msg: `10分後に ${actionName} を行います。` },
            { min: 5, msg: `5分後に ${actionName} を行います！安全な場所へ移動してください。` },
            { min: 1, msg: `まもなく ${actionName} を開始します！` }
        ];

        let minutesLeft = 60;

        while (minutesLeft > 0) {
            const entry = schedule.find((s) => s.min === minutesLeft);
            if (entry) {
                this.rcon.broadcast(`[System] ${entry.msg}`);
            }

            await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
            minutesLeft -= 1;
        }

        this.rcon.broadcast('[System] サーバーを停止します...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await callback();
    }
}
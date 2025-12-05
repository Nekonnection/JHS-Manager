import cron from 'node-cron';
import { RconService } from './RconService';
import { ServerOperations } from './ServerOperations';

export class SchedulerService {
    constructor(private rcon: RconService) {}

    start() {
        console.log('[Scheduler] Started.');

        cron.schedule('0 4 * * *', () => this.restartTask(), {
            timezone: "Asia/Tokyo"
        });

        cron.schedule('50 19 * * 5', () => this.wipeTask(), {
            timezone: "Asia/Tokyo"
        });
    }

    private async restartTask() {
        const now = new Date();
        const isWipe = this.isWipeDay(now);

        if (now.getDay() === 5 && isWipe) {
            console.log('[Scheduler] Triggered: Wipe Day Morning Stop');
            await this.countdown('定期メンテナンス(長時間停止)', async () => {
                await ServerOperations.stop();
            });
        } else {
            console.log('[Scheduler] Triggered: Daily Restart');
            await this.countdown('定期再起動', async () => {
                await ServerOperations.stop();
                await new Promise(r => setTimeout(r, 30000));
                await ServerOperations.start();
            });
        }
    }

    private async wipeTask() {
        const now = new Date();
        if (!this.isWipeDay(now)) {
            console.log('[Scheduler] Not a wipe week. Skipping.');
            return;
        }

        console.log('[Scheduler] Triggered: Full Wipe Sequence');
        await ServerOperations.stop();
        await new Promise(r => setTimeout(r, 5000));

        await ServerOperations.fullWipe();
        await ServerOperations.update();
        await ServerOperations.start();
    }

    private isWipeDay(date: Date): boolean {
        const day = date.getDate();
        return (day >= 1 && day <= 7) || (day >= 15 && day <= 21);
    }

    private async countdown(actionName: string, callback: () => Promise<void>) {
        const schedule = [
            { min: 60, msg: `1時間後に ${actionName} を行います。` },
            { min: 30, msg: `30分後に ${actionName} を行います。` },
            { min: 10, msg: `10分後に ${actionName} を行います。` },
            { min: 5,  msg: `5分後に ${actionName} を行います。` },
            { min: 1,  msg: `まもなく ${actionName} を開始します！` },
        ];

        let minutesLeft = 60;
        
        while (minutesLeft > 0) {
            const entry = schedule.find(s => s.min === minutesLeft);
            if (entry) {
                this.rcon.broadcast(`[System] ${entry.msg}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            minutesLeft--;
        }

        this.rcon.broadcast('[System] サーバーを停止します...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await callback();
    }
}
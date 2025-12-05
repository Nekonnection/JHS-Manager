import { RconService } from './services/RconService';
import { SchedulerService } from './services/SchedulerService';

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));

const main = () => {
    console.log('=== Rust Server Manager Starting ===');
    
    const rcon = new RconService();

    const scheduler = new SchedulerService(rcon);
    scheduler.start();

    console.log('=== System Ready. Waiting for schedule... ===');
};

main();
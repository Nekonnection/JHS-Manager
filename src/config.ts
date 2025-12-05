import dotenv from 'dotenv';

dotenv.config();

export const config = {
    server: {
        dir: process.env.SERVER_DIR || '/opt/rust_server/server/RustServer',
        identity: process.env.SERVER_IDENTITY || '/opt/rust_server/server/my_server_identity'
    },
    rcon: {
        ip: process.env.RCON_IP || '127.0.0.1',
        port: parseInt(process.env.RCON_PORT || '28017'),
        password: process.env.RCON_PASSWORD || '',
        reconnectInterval: 5000
    },
    commands: {
        stop: 'sudo systemctl stop rustserver',
        start: 'sudo systemctl start rustserver',
        update: '/home/nekosanq/.steam/steam/steamcmd/steamcmd.sh +login anonymous +app_update 258550 validate +quit'
    }
};
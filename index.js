const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const UserAgent = require('user-agents');
const fs = require('fs');
const Table = require('cli-table3');
const chalk = require('chalk');
const cfonts = require('cfonts');

// Read user_id and device_id from ids.txt
function readIds() {
    try {
        const data = fs.readFileSync('ids.txt', 'utf8').trim();
        if (!data) throw new Error('ids.txt is empty');
        const [userId, deviceId] = data.split('|');
        if (!userId || !deviceId) throw new Error('Invalid format in ids.txt. Expected: user_id|device_id');
        return { userId, deviceId };
    } catch (err) {
        console.log(chalk.red(`[ERROR] Error reading ids.txt: ${err.message}`));
        process.exit(1);
    }
}

const { userId, deviceId } = readIds();

// Logger with cli-table3
const logTable = new Table({
    head: [chalk.cyan('Status'), chalk.cyan('Message'), chalk.cyan('Points')],
    colWidths: [12, 70, 15],
    style: { head: ['cyan'], border: ['gray'] },
    chars: {
        'top': '-' , 'top-mid': '+' , 'top-left': '+' , 'top-right': '+',
        'bottom': '-' , 'bottom-mid': '+' , 'bottom-left': '+' , 'bottom-right': '+',
        'left': '|' , 'left-mid': '+' , 'mid': '-' , 'mid-mid': '+',
        'right': '|' , 'right-mid': '+' , 'middle': '|'
    }
});

const logger = {
    info: (msg, points = 'N/A') => {
        logTable.splice(0, logTable.length);
        logTable.push(['[INFO]', chalk.cyan(msg), chalk.cyan(points)]);
    },
    success: (msg, points = 'N/A') => {
        logTable.splice(0, logTable.length);
        logTable.push(['[SUCCESS]', chalk.green(msg), chalk.green(points)]);
    },
    progress: (msg, points = 'N/A') => {
        logTable.splice(0, logTable.length);
        logTable.push(['[PROGRESS]', chalk.blue(msg), chalk.blue(points)]);
    },
    error: (msg, points = 'N/A') => {
        logTable.splice(0, logTable.length);
        logTable.push(['[ERROR]', chalk.red(msg), chalk.red(points)]);
    },
    warn: (msg, points = 'N/A') => {
        logTable.splice(0, logTable.length);
        logTable.push(['[WARN]', chalk.yellow(msg), chalk.yellow(points)]);
    },
    banner: () => {
        console.clear();
        cfonts.say('Airdrop 888', {
            font: 'block',
            align: 'center',
            colors: ['cyan', 'yellow'],
            background: 'transparent',
            letterSpacing: 1,
            lineHeight: 1,
            space: true,
            maxLength: '0'
        });
        console.log(chalk.yellow.bold('Script coded by - @balveerxyz x @AirdropInsider |some source code by Insider Team || Ping Network Bot\n'));
    },
    display: () => {
        console.clear();
        cfonts.say('Airdrop 888', {
            font: 'block',
            align: 'center',
            colors: ['cyan', 'yellow'],
            background: 'transparent',
            letterSpacing: 1,
            lineHeight: 1,
            space: true,
            maxLength: '0'
        });
        console.log(chalk.yellow.bold('Script coded by - @balveerxyz x @AirdropInsider (some source code by Insider Team) || Ping Network Bot\n'));
        console.log(logTable.toString());
    }
};

const getRandomZoneId = () => Math.floor(Math.random() * 6).toString();
const ZONE_ID = getRandomZoneId();

const userAgent = new UserAgent({ deviceCategory: 'desktop' });
const UA_STRING = userAgent.toString();

const CONFIG = {
    wsUrl: `wss://ws.pingvpn.xyz/pingvpn/v1/clients/${userId}/events`,
    user_id: userId,
    device_id: deviceId,
    proxy: {
        zoneId: ZONE_ID
    },
    headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
        'content-type': 'text/plain;charset=UTF-8',
        'sec-ch-ua': userAgent.data.userAgent,
        'sec-ch-ua-mobile': userAgent.data.isMobile ? '?1' : '?0',
        'sec-ch-ua-platform': `"${userAgent.data.platform}"`,
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'none',
        'sec-fetch-storage-access': 'active',
        'sec-gpc': '1'
    }
};

const WS_HEADERS = {
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'user-agent': UA_STRING
};

async function sendAnalyticsEvent() {
    try {
        logger.progress('Sending analytics event...');
        const payload = {
            client_id: CONFIG.device_id,
            events: [{
                name: 'connect_clicked',
                params: {
                    session_id: Date.now().toString(),
                    engagement_time_msec: 100,
                    zone: CONFIG.proxy.zoneId
                }
            }]
        };
        await axios.post('https://www.google-analytics.com/mp/collect?measurement_id=G-M0F9F7GGW0&api_secret=tdSjjplvRHGSEpXPfPDalA', payload, {
            headers: CONFIG.headers
        });
        logger.success('Analytics event sent successfully');
        logger.display();
    } catch (error) {
        logger.error(`Failed to send analytics: ${error.message}`);
        logger.display();
    }
}

function connectWebSocket() {
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const baseReconnectDelay = 5000;
    let isAlive = false;

    function establishConnection() {
        logger.progress('Establishing WebSocket connection...');
        logger.display();
        ws = new WebSocket(CONFIG.wsUrl, { headers: WS_HEADERS });

        ws.on('open', () => {
            logger.success(`WebSocket connected to ${CONFIG.wsUrl}`);
            logger.display();
            reconnectAttempts = 0;
            isAlive = true;
            sendAnalyticsEvent();
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                logger.info(`Received message: ${JSON.stringify(message)}`);
                isAlive = true;
                if (message.type === 'client_points') {
                    logger.success(`Points updated: ${message.data.amount} (Transaction ID: ${message.data.last_transaction_id})`, message.data.amount);
                } else if (message.type === 'referral_points') {
                    logger.success(`Referral points updated: ${message.data.amount} (Transaction ID: ${message.data.last_transaction_id})`, message.data.amount);
                }
                logger.display();
            } catch (error) {
                logger.error(`Error parsing WebSocket message: ${error.message}`);
                logger.display();
            }
        });

        ws.on('close', () => {
            logger.warn('WebSocket disconnected');
            isAlive = false;
            logger.display();
            attemptReconnect();
        });

        ws.on('error', (error) => {
            logger.error(`WebSocket error: ${error.message}`);
            logger.display();
            isAlive = false;
        });
    }

    function sendPing() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
            logger.info('Sent ping to server');
            logger.display();
        }
    }

    setInterval(() => {
        if (!isAlive && ws && ws.readyState !== WebSocket.CLOSED) {
            logger.warn('No messages received, closing connection...');
            ws.close();
            logger.display();
        } else {
            sendPing();
        }
    }, 60000);

    function attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            logger.error('Max reconnection attempts reached. Stopping reconnection.');
            logger.display();
            return;
        }

        const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
        logger.warn(`Reconnecting in ${delay / 1000} seconds... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
        logger.display();

        setTimeout(() => {
            reconnectAttempts++;
            establishConnection();
        }, delay);
    }

    establishConnection();
    return ws;
}

async function startBot() {
    logger.banner();
    logger.info(`Starting bot with user_id: ${CONFIG.user_id}, device_id: ${CONFIG.device_id}`);
    logger.info(`Using User-Agent: ${UA_STRING}`);
    logger.info(`Selected random zoneId: ${CONFIG.proxy.zoneId}`);
    logger.display();

    connectWebSocket();
}

process.on('SIGINT', () => {
    logger.warn('Shutting down bot...');
    logger.display();
    process.exit(0);
});

startBot().catch((error) => {
    logger.error(`Bot startup failed: ${error.message}`);
    logger.display();
});
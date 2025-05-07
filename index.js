const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const UserAgent = require('user-agents');
const fs = require('fs');
const Table = require('cli-table3');
const chalk = require('chalk');
const cfonts = require('cfonts');

// Read multiple user_id and device_id from ids.txt
function readIds() {
    try {
        const data = fs.readFileSync('ids.txt', 'utf8').trim();
        if (!data) throw new Error('ids.txt is empty');
        const accounts = data.split('\n').map(line => {
            const [userId, deviceId] = line.trim().split('|');
            if (!userId || !deviceId) throw new Error(`Invalid format in ids.txt for line: ${line}. Expected: user_id|device_id`);
            return { userId, deviceId };
        });
        return accounts;
    } catch (err) {
        console.log(chalk.red(`[ERROR] Error reading ids.txt: ${err.message}`));
        process.exit(1);
    }
}

const accounts = readIds();

// Logger with cli-table3
const logTable = new Table({
    head: [chalk.cyan('Account'), chalk.cyan('Status'), chalk.cyan('Message'), chalk.cyan('Points')],
    colWidths: [20, 12, 60, 15],
    style: { head: ['cyan'], border: ['gray'] },
    chars: {
        'top': '-' , 'top-mid': '+' , 'top-left': '+' , 'top-right': '+',
        'bottom': '-' , 'bottom-mid': '+' , 'bottom-left': '+' , 'bottom-right': '+',
        'left': '|' , 'left-mid': '+' , 'mid': '-' , 'mid-mid': '+',
        'right': '|' , 'right-mid': '+' , 'middle': '|'
    }
});

// Store logs for each account
const accountLogs = new Map();

const logger = {
    info: (account, msg, points = 'N/A') => {
        accountLogs.set(account, ['[INFO]', chalk.cyan(msg), chalk.cyan(points)]);
        updateTable();
    },
    success: (account, msg, points = 'N/A') => {
        accountLogs.set(account, ['[SUCCESS]', chalk.green(msg), chalk.green(points)]);
        updateTable();
    },
    progress: (account, msg, points = 'N/A') => {
        accountLogs.set(account, ['[PROGRESS]', chalk.blue(msg), chalk.blue(points)]);
        updateTable();
    },
    error: (account, msg, points = 'N/A') => {
        accountLogs.set(account, ['[ERROR]', chalk.red(msg), chalk.red(points)]);
        updateTable();
    },
    warn: (account, msg, points = 'N/A') => {
        accountLogs.set(account, ['[WARN]', chalk.yellow(msg), chalk.yellow(points)]);
        updateTable();
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
        console.log(chalk.yellow.bold('Script coded by - @balveerxyz x @AirdropInsider |some source code by Insider Team || Ping Network Bot\n'));
        console.log(logTable.toString());
    }
};

// Update table with logs for all accounts
function updateTable() {
    logTable.splice(0, logTable.length);
    accounts.forEach(({ userId }) => {
        const accountLabel = `User ${userId}`;
        const log = accountLogs.get(accountLabel) || ['[PENDING]', chalk.gray('Waiting to start...'), chalk.gray('N/A')];
        logTable.push([chalk.cyan(accountLabel), ...log]);
    });
    logger.display();
}

// Process single account
async function processAccount({ userId, deviceId }) {
    const accountLabel = `User ${userId}`;
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
            logger.progress(accountLabel, 'Sending analytics event...');
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
            logger.success(accountLabel, 'Analytics event sent successfully');
        } catch (error) {
            logger.error(accountLabel, `Failed to send analytics: ${error.message}`);
        }
    }

    function connectWebSocket() {
        let ws;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 10;
        const baseReconnectDelay = 5000;
        let isAlive = false;

        function establishConnection() {
            logger.progress(accountLabel, 'Establishing WebSocket connection...');
            ws = new WebSocket(CONFIG.wsUrl, { headers: WS_HEADERS });

            ws.on('open', () => {
                logger.success(accountLabel, `WebSocket connected to ${CONFIG.wsUrl}`);
                reconnectAttempts = 0;
                isAlive = true;
                sendAnalyticsEvent();
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    logger.info(accountLabel, `Received message: ${JSON.stringify(message)}`);
                    isAlive = true;
                    if (message.type === 'client_points') {
                        logger.success(accountLabel, `Points updated: ${message.data.amount} (Transaction ID: ${message.data.last_transaction_id})`, message.data.amount);
                    } else if (message.type === 'referral_points') {
                        logger.success(accountLabel, `Referral points updated: ${message.data.amount} (Transaction ID: ${message.data.last_transaction_id})`, message.data.amount);
                    }
                } catch (error) {
                    logger.error(accountLabel, `Error parsing WebSocket message: ${error.message}`);
                }
            });

            ws.on('close', () => {
                logger.warn(accountLabel, 'WebSocket disconnected');
                isAlive = false;
                attemptReconnect();
            });

            ws.on('error', (error) => {
                logger.error(accountLabel, `WebSocket error: ${error.message}`);
                isAlive = false;
            });
        }

        function sendPing() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
                logger.info(accountLabel, 'Sent ping to server');
            }
        }

        setInterval(() => {
            if (!isAlive && ws && ws.readyState !== WebSocket.CLOSED) {
                logger.warn(accountLabel, 'No messages received, closing connection...');
                ws.close();
            } else {
                sendPing();
            }
        }, 60000);

        function attemptReconnect() {
            if (reconnectAttempts >= maxReconnectAttempts) {
                logger.error(accountLabel, 'Max reconnection attempts reached. Stopping reconnection.');
                return;
            }

            const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
            logger.warn(accountLabel, `Reconnecting in ${delay / 1000} seconds... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

            setTimeout(() => {
                reconnectAttempts++;
                establishConnection();
            }, delay);
        }

        establishConnection();
        return ws;
    }

    logger.info(accountLabel, `Starting bot with user_id: ${CONFIG.user_id}, device_id: ${CONFIG.device_id}`);
    logger.info(accountLabel, `Using User-Agent: ${UA_STRING}`);
    logger.info(accountLabel, `Selected random zoneId: ${CONFIG.proxy.zoneId}`);

    connectWebSocket();
}

// Main function to process all accounts
async function startBot() {
    logger.banner();
    if (accounts.length === 0) {
        console.log(chalk.red('[ERROR] No accounts found in ids.txt'));
        process.exit(1);
    }
    console.log(chalk.cyan(`[INFO] Processing ${accounts.length} account(s)`));

    // Initialize logs for all accounts
    accounts.forEach(({ userId }) => {
        const accountLabel = `User ${userId}`;
        accountLogs.set(accountLabel, ['[PENDING]', chalk.gray('Waiting to start...'), chalk.gray('N/A')]);
    });
    updateTable();

    // Process all accounts concurrently
    await Promise.all(accounts.map(account => processAccount(account)));
}

process.on('SIGINT', () => {
    logger.warn('Global', 'Shutting down bot...');
    updateTable();
    process.exit(0);
});

startBot().catch((error) => {
    logger.error('Global', `Bot startup failed: ${error.message}`);
    updateTable();
});
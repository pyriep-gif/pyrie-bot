const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const MY_NUMBER = "263775295231";
const WATERMARK = "\n\n> © Sparrow & Pyrie";
let pairingAsked = false; // STOP spam - only ask once

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Pyrie Bot", "Chrome", "1.0.0"]
    });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ Pyrie Bot Connected!');
            pairingAsked = false;
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Disconnected. Reconnecting in 5 seconds...');
            if (shouldReconnect) {
                setTimeout(() => start(), 5000);
            } else {
                console.log('Logged out - need new pairing code');
                pairingAsked = false;
                setTimeout(() => start(), 5000);
            }
        }
    });

    // Pairing Code - ONLY ONCE
    if (!sock.authState.creds.registered && !pairingAsked) {
        pairingAsked = true;
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(MY_NUMBER);
                console.log('================================');
                console.log('YOUR PAIRING CODE IS: ' + code);
                console.log('USE THIS ONE ONLY - IGNORE OLD ONES');
                console.log('================================');
            } catch (e) {
                console.log('Failed to get pairing code: ' + e.message);
                pairingAsked = false; // allow retry after 10 sec
            }
        }, 3000);
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        
        if (text.toLowerCase() === "hi" || text.toLowerCase() === "hello") {
            await sock.sendMessage(from, { text: "Hello! I am Pyrie Bot 🤖" + WATERMARK });
        }
        if (text.toLowerCase() === "ping") {
            await sock.sendMessage(from, { text: "Pong! Bot is alive ✅" + WATERMARK });
        }
    });
}
start();

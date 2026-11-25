const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

// YOUR NUMBER - already set
const MY_NUMBER = "263775295231";
const WATERMARK = "\n\n> © Sparrow & Pyrie";

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
        const { connection } = update;
        if (connection === 'open') {
            console.log('✅ Pyrie Bot Connected!');
        }
        if (connection === 'close') {
            console.log('Disconnected, reconnecting...');
            start();
        }
    });

    // Pairing Code - automatic, no typing needed
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(MY_NUMBER);
                console.log('================================');
                console.log('YOUR PAIRING CODE IS: ' + code);
                console.log('================================');
            } catch (e) {
                console.log('Failed to get pairing code: ' + e.message);
            }
        }, 3000);
    }

    // Bot replies with Sparrow & Pyrie watermark
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

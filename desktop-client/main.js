const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#ffffff'
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Mock Login
ipcMain.handle('auth:login', async (event, username) => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      username: username,
      role: 'renter'
    });
    return { success: true, user: res.data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get Rental Status
ipcMain.handle('rental:getStatus', async (event, userId) => {
  try {
    const res = await axios.get('http://localhost:5000/api/rentals');
    const myRentals = res.data.filter(r => r.renterId === userId && r.status === 'ACTIVE');
    
    // Also fetch files to calculate used storage
    const filesRes = await axios.get('http://localhost:5000/api/files/renter/' + userId).catch(() => ({ data: [] }));
    
    if (myRentals.length > 0) {
      const totalAllocated = myRentals.reduce((sum, r) => sum + r.requestedStorageGB, 0);
      return { 
        success: true, 
        hasActiveRental: true, 
        totalAllocated, 
        rentals: myRentals,
        files: filesRes.data || []
      };
    } else {
      return { success: true, hasActiveRental: false, files: filesRes.data || [] };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Create Rental
ipcMain.handle('rental:create', async (event, rentalData) => {
  try {
    const res = await axios.post('http://localhost:5000/api/rentals', rentalData);
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
});

const keysPath = path.join(app.getPath('userData'), 'decentra_keys.json');

function loadKeys() {
  if (fs.existsSync(keysPath)) {
    return JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  }
  return {};
}

function saveKey(fileId, keyHex) {
  const keys = loadKeys();
  keys[fileId] = { key: keyHex };
  fs.writeFileSync(keysPath, JSON.stringify(keys));
}

// File Upload Handler
ipcMain.handle('file:upload', async (event, filePath, userId) => {
  try {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    const payload = Buffer.concat([iv, authTag, encrypted]);

    const hashSum = crypto.createHash('sha256');
    hashSum.update(payload);
    const hexHash = hashSum.digest('hex');

    const tempPath = path.join(app.getPath('temp'), fileName + '.enc');
    fs.writeFileSync(tempPath, payload);

    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath), { filename: fileName });
    form.append('renterId', userId); // Pass renterId
    
    const uploadRes = await axios.post('http://localhost:5000/api/upload', form, {
      headers: form.getHeaders()
    });

    // Save encryption key persistently
    saveKey(uploadRes.data.file.id, key.toString('hex'));

    fs.unlinkSync(tempPath);

    return { success: true, fileName, hash: hexHash, backendRes: uploadRes.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get Providers
ipcMain.handle('providers:get', async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/providers');
    return { success: true, providers: res.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// File Download Handler
ipcMain.handle('file:download', async (event, fileRecord) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: fileRecord.originalName.replace(/\.enc$/, '')
    });
    
    if (canceled) return { success: false, error: 'Cancelled' };

    // Fetch encrypted file from backend
    const res = await axios.get(`http://localhost:5000/api/files/${fileRecord.storedName}`, { responseType: 'arraybuffer' });
    const encryptedPayload = Buffer.from(res.data);
    
    // Extract IV, AuthTag, and Encrypted Data (IV is 12 bytes, AuthTag is 16 bytes)
    const iv = encryptedPayload.slice(0, 12);
    const authTag = encryptedPayload.slice(12, 28);
    const encryptedData = encryptedPayload.slice(28);
    
    // Retrieve persistent key
    const keys = loadKeys();
    const keyData = keys[fileRecord.id];
    if (!keyData) throw new Error("Encryption key not found on this client");
    const key = Buffer.from(keyData.key, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    
    fs.writeFileSync(filePath, decrypted);
    
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// File Dialog
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

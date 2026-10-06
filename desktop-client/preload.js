const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  login: (username) => ipcRenderer.invoke('auth:login', username),
  getRentalStatus: (userId) => ipcRenderer.invoke('rental:getStatus', userId),
  createRental: (rentalData) => ipcRenderer.invoke('rental:create', rentalData),
  getProviders: () => ipcRenderer.invoke('providers:get'),
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  uploadFile: (filePath, userId) => ipcRenderer.invoke('file:upload', filePath, userId),
  downloadFile: (fileRecord) => ipcRenderer.invoke('file:download', fileRecord)
});

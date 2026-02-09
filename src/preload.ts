// src/preload.ts
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onGenerateThumbnail: (callback: any) => 
        ipcRenderer.on('generate-thumbnail-request', (_event: any, value: any) => callback(value)),
    
    saveThumbnailToDisk: (data: any) => 
        ipcRenderer.invoke('save-thumbnail-to-disk', data)
});
const { contextBridge, ipcRenderer } = require("electron");

const api = {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
    showNotification: (title, body) => ipcRenderer.send("notification:show", title, body),
    getPlatform: () => ipcRenderer.invoke("app:getPlatform"),
};

contextBridge.exposeInMainWorld("electronAPI", api);

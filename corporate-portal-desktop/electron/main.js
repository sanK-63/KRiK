const { app, shell, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage, clipboard } = require("electron");
const path = require("path");

let mainWindow = null;
let tray = null;

function createTray(win) {
    const iconPath = path.join(__dirname, "../public/favicon.svg");
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        if (trayIcon.isEmpty()) trayIcon = nativeImage.createEmpty();
    } catch {
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);
    tray.setToolTip("Corporate Portal");

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Show",
            click: () => { win.show(); win.focus(); }
        },
        {
            label: "Minimize to tray",
            click: () => { win.hide(); }
        },
        { type: "separator" },
        {
            label: "Quit",
            click: () => { win.destroy(); process.exit(0); }
        }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => { win.show(); win.focus(); });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        show: false,
        frame: false,
        titleBarStyle: "hidden",
        backgroundColor: "#212121",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    mainWindow.on("ready-to-show", () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: "deny" };
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools({ mode: "detach" });
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }

    createTray(mainWindow);

    mainWindow.webContents.on("before-input-event", (_event, input) => {
        if (!input.control || input.type !== "keyDown") return;

        const focused = mainWindow.webContents;
        switch (input.key.toLowerCase()) {
            case "c":
                focused.send("ipc-menu-action", "copy");
                break;
            case "v":
                focused.send("ipc-menu-action", "paste");
                break;
            case "x":
                focused.send("ipc-menu-action", "cut");
                break;
            case "a":
                focused.send("ipc-menu-action", "selectAll");
                break;
            case "z":
                focused.send("ipc-menu-action", input.shift ? "redo" : "undo");
                break;
        }
    });

    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: "Edit",
            submenu: [
                { role: "undo", accelerator: "CmdOrCtrl+Z" },
                { role: "redo", accelerator: "CmdOrCtrl+Shift+Z" },
                { type: "separator" },
                { role: "cut", accelerator: "CmdOrCtrl+X" },
                { role: "copy", accelerator: "CmdOrCtrl+C" },
                { role: "paste", accelerator: "CmdOrCtrl+V" },
                { role: "selectAll", accelerator: "CmdOrCtrl+A" },
            ],
        },
        {
            label: "View",
            submenu: [
                { role: "reload", accelerator: "CmdOrCtrl+R" },
                { role: "forceReload", accelerator: "CmdOrCtrl+Shift+R" },
                { role: "toggleDevTools", accelerator: "F12" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        },
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "maximize" },
                { role: "close" },
            ],
        },
    ]));

    mainWindow.on("close", (event) => {
        if (!mainWindow.isDestroyed()) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

app.whenReady().then(() => {
    ipcMain.on("window:minimize", () => mainWindow?.minimize());
    ipcMain.on("window:maximize", () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow?.maximize();
        }
    });
    ipcMain.on("window:close", () => mainWindow?.close());
    ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized() ?? false);

    ipcMain.on("notification:show", (_event, title, body) => {
        if (Notification.isSupported()) {
            const notification = new Notification({ title, body, silent: false });
            notification.show();
        }
    });

    ipcMain.handle("app:getPlatform", () => process.platform);

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  showNotification: (title: string, body: string) => void
  getPlatform: () => Promise<string>
}

interface Electron {
  process: {
    pid: number
    versions: Record<string, string>
    env: Record<string, string>
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
    electron?: Electron
  }
}

import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const check = async () => {
      if (window.electronAPI?.isMaximized) {
        setIsMaximized(await window.electronAPI.isMaximized())
      }
    }
    check()
  }, [])

  const handleMinimize = () => window.electronAPI?.minimize()
  const handleMaximize = async () => {
    window.electronAPI?.maximize()
    if (window.electronAPI?.isMaximized) {
      setIsMaximized(await window.electronAPI.isMaximized())
    }
  }
  const handleClose = () => window.electronAPI?.close()

  return (
    <div
      className="flex items-center justify-between h-8 bg-[#1a1a1a] border-b border-[#3A3A3A] select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-3">
        <span className="text-[10px] font-bold text-[#FA6814] tracking-wider">CORPORATE PORTAL</span>
      </div>

      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="h-full px-3 flex items-center justify-center hover:bg-[#333] transition-colors"
        >
          <Minus size={14} className="text-gray-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-3 flex items-center justify-center hover:bg-[#333] transition-colors"
        >
          {isMaximized ? (
            <Square size={12} className="text-gray-400" />
          ) : (
            <Maximize2 size={12} className="text-gray-400" />
          )}
        </button>
        <button
          onClick={handleClose}
          className="h-full px-3 flex items-center justify-center hover:bg-red-600 transition-colors"
        >
          <X size={14} className="text-gray-400" />
        </button>
      </div>
    </div>
  )
}

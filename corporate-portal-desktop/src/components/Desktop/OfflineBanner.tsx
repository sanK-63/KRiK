import { WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-8 left-0 right-0 z-[9999] bg-red-600/90 text-white text-center py-1.5 text-xs flex items-center justify-center gap-2">
      <WifiOff size={14} />
      <span>Нет подключения к серверу</span>
    </div>
  )
}

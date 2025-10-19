// File: src/components/AppStatusBar.tsx
import { useEffect, useState } from 'react'
import { checkForServiceWorkerUpdate, PWA_OFFLINE_READY_EVENT } from '../pwa'
// package.json からバージョンを取る（tsconfigで resolveJsonModule が有効ならOK）
import pkg from '../../package.json'

export default function AppStatusBar() {
  const [online, setOnline] = useState(navigator.onLine)
  const [offlineReady, setOfflineReady] = useState(false)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const onOfflineReady = () => setOfflineReady(true)
    window.addEventListener(PWA_OFFLINE_READY_EVENT, onOfflineReady)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener(PWA_OFFLINE_READY_EVENT, onOfflineReady)
    }
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-4xl">
        <div className="m-2 rounded-2xl border bg-white/80 backdrop-blur p-2 text-sm shadow">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge label={`v${pkg.version}`} />
            <Badge label={online ? 'オンライン' : 'オフライン'} color={online ? 'green' : 'red'} />
            <Badge label={offlineReady ? 'オフライン準備OK' : 'キャッシュ中…'} color={offlineReady ? 'green' : 'gray'} />
            <button
              className="ml-auto px-3 py-1 rounded-xl border hover:bg-gray-50 active:scale-[0.98]"
              onClick={() => checkForServiceWorkerUpdate()}
              title="Service Worker の更新チェックを実行"
            >
              更新チェック
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Badge({ label, color = 'gray' }: { label: string; color?: 'gray' | 'green' | 'red' }) {
  const base = 'px-2 py-0.5 rounded-full text-xs border'
  const map: Record<string, string> = {
    gray: 'bg-gray-100 border-gray-300 text-gray-700',
    green: 'bg-green-100 border-green-300 text-green-800',
    red: 'bg-red-100 border-red-300 text-red-800',
  }
  return <span className={`${base} ${map[color]}`}>{label}</span>
}

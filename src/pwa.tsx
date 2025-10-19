// File: src/pwa.tsx
import { registerSW } from 'virtual:pwa-register'
import toast from 'react-hot-toast'

function showUpdateToast(onUpdate: () => void) {
  const id = toast((t) => (
    <div className="space-y-2">
      <div>新しいバージョンがあります。</div>
      <div className="flex gap-8">
        <button
          className="px-3 py-1 rounded bg-black text-white"
          onClick={() => { onUpdate(); toast.dismiss(t.id) }}
        >
          更新する
        </button>
        <button
          className="px-3 py-1 rounded border"
          onClick={() => toast.dismiss(t.id)}
        >
          後で
        </button>
      </div>
    </div>
  ), { duration: 10000 })
  return () => toast.dismiss(id)
}

// ✅ 追加：UIから呼べる「更新チェック」関数（Service Workerにupdate要求）
export async function checkForServiceWorkerUpdate() {
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration()
    await reg?.update()
  }
}

// ✅ 追加：onOfflineReadyでUIに知らせるためのイベント名
export const PWA_OFFLINE_READY_EVENT = 'pwa:offlineReady'

export const initPWA = () => {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      showUpdateToast(() => updateSW(true))
      // ※即自動更新にしたいなら↑の1行をコメントアウトして↓を有効化
      // updateSW(true)
    },
    onOfflineReady() {
      // ✅ 追加：UIへ「オフライン準備OK」を通知
      window.dispatchEvent(new Event(PWA_OFFLINE_READY_EVENT))
      // toast.success('オフラインで利用可能になりました') // 任意
    }
  })
}

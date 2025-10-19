// File: src/components/InstallPromptButton.tsx
import { useEffect, useState } from 'react'

// Chrome 等は "beforeinstallprompt" を発火するので一旦保持してから prompt() する
export default function InstallPromptButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  //const [supported, setSupported] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // 既にインストール済みかの検出（目安）
    const mql = window.matchMedia('(display-mode: standalone)')
    if (mql.matches) setInstalled(true)

    const onBefore = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBefore as any)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore as any)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // ブラウザが非対応 or 既にインストール済みなら表示しない
  if (installed) return null

  const handleClick = async () => {
    // 保存済みのイベントからプロンプトを出す
    if (deferred) {
      await deferred.prompt()
      await deferred.userChoice
      // choice.outcome === 'accepted' | 'dismissed'
      setDeferred(null) // 一度使ったら破棄（再表示は次の beforeinstallprompt まで待つ）
    } else {
      // Safari など "beforeinstallprompt" が無い場合はガイド表示
      alert('ブラウザの共有メニューや三点メニューから「ホーム画面に追加」/「アプリをインストール」を選んでください。')
    }
  }

  return (
    <button
      onClick={handleClick}
      title="このアプリをインストール"
      className="px-3 py-1 rounded-xl border hover:bg-gray-50"
      style={{ marginLeft: 'auto' }}
    >
      アプリをインストール
    </button>
  )
}

// 型補助（TSのための宣言）
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

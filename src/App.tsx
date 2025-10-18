// File: src/App.tsx
import { useEffect } from "react";
import { SessionForm, initialSession } from "./components/SessionForm";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Session } from "./types";

export default function App() {
  const [current, setCurrent] = useLocalStorage<Session>(
    "trelog/session/current",
    initialSession()
  );
  const [history, setHistory] = useLocalStorage<Session[]>(
    "trelog/session/history",
    []
  );

  function handleSave() {
    // 最低限のバリデーション：1セット以上に数値の重量・レップがあること
    const valid = current.exercises.some((ex) =>
      ex.sets.some(
        (s) => typeof s.reps === "number" && typeof s.weightKg === "number"
      )
    );
    if (!valid) {
      alert("最低でも1種目・1セット（重量とレップ）が必要です。");
      return;
    }
    setHistory([{ ...current }, ...history]);
    setCurrent(initialSession());
  }

  // Cmd/Ctrl+S で保存
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, history]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <div className="text-xl font-bold tracking-tight">トレログ MVP</div>
          <nav className="ml-auto text-sm text-gray-600 flex gap-4">
            <a className="hover:underline" href="#">
              セッション
            </a>
            <a className="hover:underline" href="#history">
              履歴
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-10">
        <section>
          <SessionForm value={current} onChange={setCurrent} onSave={handleSave} />
        </section>

        <section id="history" className="space-y-3">
          <h2 className="text-lg font-semibold">最近のセッション</h2>
          {history.length === 0 && (
            <p className="text-sm text-gray-600">
              まだ履歴はありません。上のフォームで保存するとここに表示されます。
            </p>
          )}
          <ul className="space-y-2">
            {history.map((s) => (
              <li key={s.id} className="rounded-2xl border bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{s.date}</div>
                  <div className="text-sm text-gray-600">
                    {s.exercises.length} 種目
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Session } from "../types";

type GroupMode = "month" | "week";

export default function LogPage() {
  const [history, setHistory] = useLocalStorage<Session[]>("trelog/session/history", []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<GroupMode>("month");

  function sessionTotalVolume(s: Session) {
    return s.exercises.reduce(
      (acc, ex) =>
        acc +
        ex.sets.reduce(
          (a, set) =>
            a + (typeof set.weightKg === "number" && typeof set.reps === "number" ? set.weightKg * set.reps : 0),
          0
        ),
      0
    );
  }

  function ymKey(date: string | undefined) {
    return (date ?? "").slice(0, 7) || "未設定";
  }
  function ywKey(dateStr: string | undefined) {
    if (!dateStr) return "未設定";
    const d = new Date(dateStr + "T00:00:00");
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const year = monday.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const diff = Math.floor((monday.getTime() - jan1.getTime()) / (24 * 3600 * 1000));
    const week = Math.floor(diff / 7) + 1;
    const ww = String(week).padStart(2, "0");
    return `${year}-W${ww}`;
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>();
    const keyFn = mode === "month" ? ymKey : ywKey;
    for (const s of history) {
      const key = keyFn(s.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([k, list]) => [k, list.sort((a, b) => (a.date < b.date ? 1 : -1))] as const);
  }, [history, mode]);

  function deleteSession(id: string) {
    if (!confirm("このセッションを削除しますか？")) return;
    setHistory(history.filter((h) => h.id !== id));
    if (expanded === id) setExpanded(null);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">トレーニング記録</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-gray-600">表示：</span>
          <button
            className={`rounded-lg border px-3 py-1 ${mode === "month" ? "bg-black text-white" : "hover:bg-gray-50"}`}
            onClick={() => setMode("month")}
          >
            月
          </button>
          <button
            className={`rounded-lg border px-3 py-1 ${mode === "week" ? "bg-black text-white" : "hover:bg-gray-50"}`}
            onClick={() => setMode("week")}
          >
            週
          </button>
        </div>
      </div>

      {history.length === 0 && (
        <p className="text-sm text-gray-600">まだ記録がありません。「トレーニング入力」から保存してください。</p>
      )}

      {grouped.map(([groupKey, list]) => (
        <div key={groupKey} className="space-y-2">
          <div className="text-sm font-semibold text-gray-700">{groupKey}</div>
          <ul className="space-y-2">
            {list.map((s) => {
              const isOpen = expanded === s.id;
              return (
                <li key={s.id} className="rounded-2xl border bg-white">
                  <button
                    type="button"
                    className="w-full px-3 py-3 flex items-center gap-3 text-left"
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                  >
                    <>
                      <div className="font-medium">{s.date}</div>
                      <div className="text-sm text-gray-900 truncate max-w-[40%]">
                        {s.title || "無題セッション"}
                      </div>
                      <div className="ml-auto text-sm text-gray-700">
                        合計: <span className="font-semibold">{sessionTotalVolume(s)} kg</span>
                      </div>
                      <span className="text-gray-500">{isOpen ? "▲" : "▼"}</span>
                    </>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3">
                      {s.notes && <p className="text-sm text-gray-600 whitespace-pre-wrap">{s.notes}</p>}

                      <div className="space-y-3">
                        {s.exercises.map((ex, idx) => (
                          <div key={(ex as any).id ?? idx} className="rounded-xl border p-3">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{ex.name || "種目"}</div>
                              {ex.variant && <div className="text-xs text-gray-500">({ex.variant})</div>}
                              <div className="ml-auto text-xs text-gray-600">セット数: {ex.sets.length}</div>
                            </div>

                            {ex.note && (
                              <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                                種目メモ：{ex.note}
                              </p>
                            )}

                            {ex.sets.length > 0 ? (
                              <>
                                <div className="mt-2 grid grid-cols-12 gap-2 text-xs text-gray-500">
                                  <div className="col-span-1 text-center">#</div>
                                  <div className="col-span-3 text-center">重量(kg)</div>
                                  <div className="col-span-2 text-center">レップ</div>
                                  <div className="col-span-2 text-center">RPE</div>
                                  <div className="col-span-2 text-center">レスト(s)</div>
                                  <div className="col-span-2 text-right">ボリューム</div>
                                </div>

                                <div className="mt-1 space-y-1">
                                  {ex.sets.map((set) => {
                                    const vol =
                                      typeof set.weightKg === "number" && typeof set.reps === "number"
                                        ? set.weightKg * set.reps
                                        : 0;
                                    return (
                                      <div key={set.id} className="grid grid-cols-12 gap-2 text-sm">
                                        <div className="col-span-1 text-center">{set.setNumber}</div>
                                        <div className="col-span-3 text-center">{set.weightKg === "" ? "-" : set.weightKg}</div>
                                        <div className="col-span-2 text-center">{set.reps === "" ? "-" : set.reps}</div>
                                        <div className="col-span-2 text-center">{set.rpe === "" || set.rpe === undefined ? "-" : set.rpe}</div>
                                        <div className="col-span-2 text-center">{set.intervalSec === "" || set.intervalSec === undefined ? "-" : set.intervalSec}</div>
                                        <div className="col-span-2 text-right">{vol ? `${vol} kg` : "-"}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-gray-500 mt-2">セット記録なし（ダッシュ/パワーマックス等）</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-xl border px-3 py-2 text-red-600 hover:bg-red-50"
                          onClick={() => deleteSession(s.id)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {history.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            className="rounded-xl border px-3 py-2 text-red-600 hover:bg-red-50"
            onClick={() => {
              if (confirm("すべての記録を削除しますか？")) setHistory([]);
            }}
          >
            すべて削除
          </button>
        </div>
      )}
    </section>
  );
}

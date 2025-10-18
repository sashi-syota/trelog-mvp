// File: src/pages/LogPage.tsx
import { useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Session, ExerciseBlock } from "../types";

type GroupMode = "month" | "week";

export default function LogPage() {
  const [history, setHistory] = useLocalStorage<Session[]>("trelog/session/history", []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<GroupMode>("month");

  // 🔎 検索状態
  const [query, setQuery] = useState("");
  const [onlyWithSets, setOnlyWithSets] = useState(false); // セット記録のあるものだけ

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

  // --- 週/月キー作成 ---
  function ymKey(date: string | undefined) {
    return (date ?? "").slice(0, 7) || "未設定";
  }
  function ywKey(dateStr: string | undefined) {
    if (!dateStr) return "未設定";
    const d = new Date(dateStr + "T00:00:00");
    const day = (d.getDay() + 6) % 7; // 月=0 … 日=6
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const year = monday.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const diff = Math.floor((monday.getTime() - jan1.getTime()) / (24 * 3600 * 1000));
    const week = Math.floor(diff / 7) + 1;
    const ww = String(week).padStart(2, "0");
    return `${year}-W${ww}`;
  }

  // --- 検索対象文字列を作成 ---
  function normalize(text: unknown) {
    return (text ?? "").toString().toLowerCase();
  }

  function matchExercise(ex: ExerciseBlock, q: string) {
    const hay =
      normalize(ex.name) +
      " " +
      normalize(ex.variant) +
      " " +
      normalize(ex.note) +
      " " +
      ex.sets.map((s) => normalize(s.note)).join(" ");
    return hay.includes(q);
  }

  function matches(session: Session, q: string) {
    if (!q) return true;
    const base =
      normalize(session.title) +
      " " +
      normalize(session.notes) +
      " " +
      normalize(session.date) +
      " " +
      session.exercises.map((ex) => normalize(ex.name) + " " + normalize(ex.variant) + " " + normalize(ex.note)).join(" ");
    if (base.includes(q)) return true;
    return session.exercises.some((ex) => matchExercise(ex, q));
  }

  // --- フィルタを適用 ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((s) => {
      if (onlyWithSets && s.exercises.every((ex) => ex.sets.length === 0)) return false;
      return matches(s, q);
    });
  }, [history, query, onlyWithSets]);

  // --- グルーピング（検索後の結果に対して） ---
  const grouped = useMemo(() => {
    const map = new Map<string, Session[]>();
    const keyFn = mode === "month" ? ymKey : ywKey;
    for (const s of filtered) {
      const key = keyFn(s.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([k, list]) => [k, list.sort((a, b) => (a.date < b.date ? 1 : -1))] as const);
  }, [filtered, mode]);

  function deleteSession(id: string) {
    if (!confirm("このセッションを削除しますか？")) return;
    setHistory(history.filter((h) => h.id !== id));
    if (expanded === id) setExpanded(null);
  }

  // 🔖 クイックフィルタ（ワンタップでクエリ投入）
  const quickChips = [
    "スクワット",
    "ベンチプレス",
    "デッドリフト",
    "ダッシュ",
    "パワーマックス",
    "柔道",
    "チンニング",
  ];

  const totalCount = history.length;
  const filteredCount = filtered.length;

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

      {/* 🔎 検索バー */}
      <div className="rounded-2xl border bg-white p-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="タイトル / メモ / 種目名 / バリアント / 種目メモ で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={onlyWithSets}
                onChange={(e) => setOnlyWithSets(e.target.checked)}
              />
              セット記録のあるものだけ
            </label>
            <button
              type="button"
              className="rounded-xl border px-3 py-2 hover:bg-gray-50"
              onClick={() => {
                setQuery("");
                setOnlyWithSets(false);
              }}
            >
              クリア
            </button>
          </div>
        </div>

        {/* クイックチップ */}
        <div className="mt-2 flex flex-wrap gap-2">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
              onClick={() => setQuery(chip)}
              title={`「${chip}」で検索`}
            >
              #{chip}
            </button>
          ))}
        </div>

        <div className="mt-2 text-xs text-gray-600">
          {filteredCount}/{totalCount} 件
        </div>
      </div>

      {history.length === 0 && (
        <p className="text-sm text-gray-600">まだ記録がありません。「トレーニング入力」から保存してください。</p>
      )}

      {history.length > 0 && filteredCount === 0 && (
        <p className="text-sm text-gray-600">一致する記録が見つかりませんでした。検索条件を調整してください。</p>
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

// File: src/pages/LogPage.tsx
import { useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Session, ExerciseBlock, Template } from "../types";
import toast from "react-hot-toast";
import ChartsPanel from "../components/ChartsPanel";

type GroupMode = "month" | "week";

// バックアップファイルの形（将来の互換用にversion付き）
type BackupFile = {
  __type: "trelog-backup";
  version: 1;
  exportedAt: string; // ISO
  sessions: Session[];
  templates?: Template[];
};

export default function LogPage() {
  const [history, setHistory] = useLocalStorage<Session[]>("trelog/session/history", []);
  const [templates, setTemplates] = useLocalStorage<Template[]>("trelog/templates/v1", []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<GroupMode>("month");

  // 🔎 検索（既存の機能）
  const [query, setQuery] = useState("");
  const [onlyWithSets, setOnlyWithSets] = useState(false);

  // ===== ここから エクスポート / インポート の実装 =====

  function ymd(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function downloadJSON(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 📤 エクスポート（履歴＋テンプレを1つのJSONに同梱）
  function exportAll() {
    const backup: BackupFile = {
      __type: "trelog-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions: history,
      templates,
    };
    downloadJSON(`trelog-backup-${ymd()}.json`, backup);
    toast.success("バックアップ（履歴＋テンプレ）をダウンロードしました。");
  }

  // 📤 履歴のみエクスポート
  function exportSessionsOnly() {
    const backup: BackupFile = {
      __type: "trelog-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions: history,
    };
    downloadJSON(`trelog-sessions-${ymd()}.json`, backup);
    toast.success("バックアップ（履歴のみ）をダウンロードしました。");
  }

  // 📤 テンプレのみエクスポート
  function exportTemplatesOnly() {
    const backup: BackupFile = {
      __type: "trelog-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions: [],
      templates,
    };
    downloadJSON(`trelog-templates-${ymd()}.json`, backup);
    toast.success("バックアップ（テンプレのみ）をダウンロードしました。");
  }

  // 📥 インポート（マージ or 置換）
  type ImportMode = "merge" | "replace";
  function openImport(mode: ImportMode) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        const json = JSON.parse(text);

        // 旧形式や別アプリのJSONにも緩やかに対応
        let sessions: Session[] | undefined;
        let importedTemplates: Template[] | undefined;

        if (json?.__type === "trelog-backup") {
          sessions = Array.isArray(json.sessions) ? json.sessions : [];
          importedTemplates = Array.isArray(json.templates) ? json.templates : [];
        } else if (Array.isArray(json?.sessions)) {
          sessions = json.sessions;
          importedTemplates = Array.isArray(json?.templates) ? json.templates : [];
        } else if (Array.isArray(json)) {
          sessions = json as Session[];
        } else {
          toast.error("このJSONは読み込めませんでした（形式が異なります）。");
          return;
        }

        // 軽いスキーマチェック
        const safeSessions = (sessions ?? []).filter((s) => typeof s?.id === "string" && typeof s?.date === "string");
        const safeTemplates = (importedTemplates ?? []).filter((t) => typeof t?.id === "string" && typeof t?.name === "string");

        if (mode === "replace") {
          if (!confirm("現在の履歴とテンプレートを置き換えます。よろしいですか？")) return;
          if (safeSessions.length > 0) setHistory(safeSessions);
          if (importedTemplates) setTemplates(safeTemplates);
        } else {
          // merge: 既存に追加。id重複は新規側を優先しつつ重複を排除
          const byId = new Map<string, Session>();
          [...history, ...safeSessions].forEach((s) => byId.set(s.id, s));
          setHistory(Array.from(byId.values()));

          if (safeTemplates.length > 0) {
            const tById = new Map<string, Template>();
            [...templates, ...safeTemplates].forEach((t) => tById.set(t.id, t));
            setTemplates(Array.from(tById.values()));
          }
        }

        toast.success("インポートが完了しました。");
      } catch (e) {
        console.error(e);
        toast.error("インポートに失敗しました。");
      }
    };
    input.click();
  }
  // ===== ここまで エクスポート / インポート =====

  function sessionTotalVolume(s: Session) {
    return s.exercises.reduce((acc, ex) => {
      return (
        acc +
        ex.sets.reduce((a, set) => {
          const sc = typeof set.setsCount === "number" ? set.setsCount : 1;
          return a + (typeof set.weightKg === "number" && typeof set.reps === "number" ? set.weightKg * set.reps * sc : 0);
        }, 0)
      );
    }, 0);
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

  // --- フィルタ＆グルーピング ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((s) => {
      if (onlyWithSets && s.exercises.every((ex) => ex.sets.length === 0)) return false;
      return matches(s, q);
    });
  }, [history, query, onlyWithSets]);

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

      {/* 🔐 バックアップ操作バー */}
      <div className="rounded-2xl border bg-white p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border px-3 py-2 hover:bg-gray-50"
            onClick={exportAll}
            title="履歴とテンプレートを1つのJSONに出力"
          >
            エクスポート（履歴＋テンプレ）
          </button>
          <button
            type="button"
            className="rounded-xl border px-3 py-2 hover:bg-gray-50"
            onClick={exportSessionsOnly}
            title="履歴のみをJSONに出力"
          >
            履歴のみエクスポート
          </button>
          <button
            type="button"
            className="rounded-xl border px-3 py-2 hover:bg-gray-50"
            onClick={exportTemplatesOnly}
            title="テンプレートのみをJSONに出力"
          >
            テンプレのみエクスポート
          </button>

            <div className="ml-auto flex gap-2">
            <button
              type="button"
              className="rounded-xl border px-3 py-2 hover:bg-gray-50"
              onClick={() => openImport("merge")}
              title="JSONから読み込んで現在のデータに追加"
            >
              インポート（追加）
            </button>
            <button
              type="button"
              className="rounded-xl border px-3 py-2 hover:bg-gray-50 text-red-600"
              onClick={() => openImport("replace")}
              title="JSONで上書き（現在のデータは置き換え）"
            >
              インポート（置換）
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          JSONは“トレーニング記録（sessions）”と“テンプレート（templates）”を含むテキスト形式のバックアップです。
        </p>
      </div>

      {/* 🔎 検索バー（既存） */}
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
        <div className="mt-2 text-xs text-gray-600">
          {filteredCount}/{totalCount} 件
        </div>
      </div>

      {/* 📊 サマリーグラフ（検索バーの下に配置） */}
      <ChartsPanel sessions={filtered} mode={mode} />

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
                              <div className="ml-auto text-xs text-gray-600">セット行: {ex.sets.length}</div>
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
                                  <div className="col-span-2 text-center">重量(kg)</div>
                                  <div className="col-span-2 text-center">時間(s)</div>
                                  <div className="col-span-2 text-center">レップ</div>
                                  <div className="col-span-1 text-center">セット</div>
                                  <div className="col-span-2 text-center">レスト(s)</div>
                                  <div className="col-span-2 text-center">RPE</div>
                                </div>

                                <div className="mt-1 space-y-1">
                                  {ex.sets.map((set) => {
                                    const sc = typeof set.setsCount === "number" ? set.setsCount : 1;
                                    return (
                                      <div key={set.id} className="grid grid-cols-12 gap-2 text-sm">
                                        <div className="col-span-1 text-center">{set.setNumber}</div>
                                        <div className="col-span-2 text-center">
                                          {set.weightKg === "" ? "-" : set.weightKg}
                                        </div>
                                        <div className="col-span-2 text-center">
                                          {set.durationSec === "" ? "-" : `${set.durationSec}`}
                                        </div>
                                        <div className="col-span-2 text-center">{set.reps === "" ? "-" : set.reps}</div>
                                        <div className="col-span-1 text-center">{sc}</div>
                                        <div className="col-span-2 text-center">
                                          {set.intervalSec === "" || set.intervalSec === undefined ? "-" : set.intervalSec}
                                        </div>
                                        <div className="col-span-2 text-center">
                                          {set.rpe === "" || set.rpe === undefined ? "-" : set.rpe}
                                        </div>
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
    </section>
  );
}

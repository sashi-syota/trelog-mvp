// File: src/pages/LogPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Session, ExerciseBlock, Template } from "../types";
import toast from "react-hot-toast";
import ChartsPanel from "../components/ChartsPanel";
import ConfirmDialog from "../components/ConfirmDialog";
import { migrateBackup } from "../utils/migrate";

type GroupMode = "month" | "week";

// バックアップファイルの形（将来の互換用にversion付き）
type BackupFile = {
  __type: "trelog-backup";
  version: 1;
  exportedAt: string; // ISO
  sessions: Session[];
  templates?: Template[];
};

// ====== インポート解析（このファイル内に実装：別ファイル不要） ======
type ImportAnalyze = {
  sessions: Session[];
  templates: Template[];
  counts: { sessions: number; templates: number };
  dateRange: { min: string | null; max: string | null };
  warnings: string[];
};

function analyzeImportJson(raw: unknown): ImportAnalyze {
  const { sessions, templates } = migrateBackup(raw as any);


  const safeSessions = (sessions ?? []).filter(
    (s: any) => typeof s?.id === "string" && typeof s?.date === "string"
  );
  const safeTemplates = (templates ?? []).filter(
    (t: any) => typeof t?.id === "string" && typeof t?.name === "string"
  );

  const warnings: string[] = [];
  if (safeSessions.length !== (sessions?.length ?? 0)) warnings.push("一部のセッションは形式不正で除外されます。");
  if (safeTemplates.length !== (templates?.length ?? 0)) warnings.push("一部のテンプレートは形式不正で除外されます。");

  const dates = safeSessions.map((s) => s.date).filter(Boolean).sort();
  const range = { min: dates[0] ?? null, max: dates[dates.length - 1] ?? null };

  return {
    sessions: safeSessions,
    templates: safeTemplates,
    counts: { sessions: safeSessions.length, templates: safeTemplates.length },
    dateRange: range,
    warnings,
  };
}

// ====== インポート内容プレビュー用ダイアログ（このファイル内に実装） ======
function ImportPreviewDialog(props: {
  open: boolean;
  data: ImportAnalyze | null;
  onMerge: () => void;
  onReplace: () => void;
  onClose: () => void;
}) {
  const { open, data, onMerge, onReplace, onClose } = props;
  if (!open || !data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[min(92vw,520px)] rounded-2xl bg-white shadow-xl p-4">
        <h2 className="text-lg font-semibold">インポート確認</h2>
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div>セッション: <span className="font-semibold">{data.counts.sessions}</span> 件</div>
          <div>テンプレート: <span className="font-semibold">{data.counts.templates}</span> 件</div>
          <div>日付範囲: {data.dateRange.min ?? "-"} 〜 {data.dateRange.max ?? "-"}</div>
          {data.warnings.length > 0 && (
            <ul className="mt-2 list-disc ml-5 text-red-600">
              {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button className="rounded-xl border px-3 py-2 hover:bg-gray-50" onClick={onClose}>
            やめる
          </button>
          <button
            className="rounded-xl border px-3 py-2 hover:bg-gray-50"
            onClick={onMerge}
            title="現在のデータに追加・マージ"
          >
            追加（マージ）
          </button>
          <button
            className="rounded-xl border px-3 py-2 bg-red-600 text-white hover:opacity-90"
            onClick={onReplace}
            title="現在のデータを置き換え"
          >
            置換（上書き）
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LogPage() {
  const [history, setHistory] = useLocalStorage<Session[]>("trelog/session/history", []);
  const [templates, setTemplates] = useLocalStorage<Template[]>("trelog/templates/v1", []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState<GroupMode>("month");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // 🔎 検索（既存の機能）
  const [query, setQuery] = useState("");
  const [onlyWithSets, setOnlyWithSets] = useState(false);

  // 🔍 インポートプレビューの状態
  const [importPreview, setImportPreview] = useState<ImportAnalyze | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const importBufferRef = useRef<{ sessions: Session[]; templates: Template[] } | null>(null);

  // ===== 自動バックアップ（入力停止から2.5秒後に保存） =====
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const snapshot = {
          __type: "trelog-auto-backup",
          version: 1,
          exportedAt: new Date().toISOString(),
          sessions: history,
          templates,
        };
        localStorage.setItem("trelog/autoBackup/v1", JSON.stringify(snapshot));
      } catch (e) {
        console.error(e);
      }
    }, 2500);
    return () => clearTimeout(id);
  }, [history, templates]);

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

  function downloadCSV(filename: string, rows: string[][]) {
    const csv = rows
      .map((r) =>
        r
          .map((cell) => {
            const s = cell ?? "";
            return `"${String(s).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportFilteredAsCSV() {
    const rows: string[][] = [
      [
        "date",
        "title",
        "exercise",
        "variant",
        "setNumber",
        "setsCount",
        "weightKg",
        "reps",
        "durationSec",
        "intervalSec",
        "rpe",
        "sessionNote",
        "exerciseNote",
        "setNote",
      ],
    ];
    for (const s of filtered) {
      for (const ex of s.exercises) {
        for (const st of ex.sets) {
          const sc = typeof st.setsCount === "number" ? st.setsCount : 1;
          rows.push([
            s.date ?? "",
            s.title ?? "",
            ex.name ?? "",
            ex.variant ?? "",
            String(st.setNumber ?? ""),
            String(sc),
            String(st.weightKg ?? ""),
            String(st.reps ?? ""),
            String(st.durationSec ?? ""),
            String(st.intervalSec ?? ""),
            String(st.rpe ?? ""),
            s.notes ?? "",
            ex.note ?? "",
            st.note ?? "",
          ]);
        }
      }
    }
    const ymdStr = ymd();
    downloadCSV(`trelog-filtered-${ymdStr}.csv`, rows);
    toast.success("CSVをダウンロードしました。");
  }

  // 📤 エクスポート（履歴＋テンプレを1つのJSONに同梱）+ メタ情報
  function exportAll() {
    const sessionsCount = history.length;
    const templatesCount = templates.length;
    const totalVolume = history.reduce((sum, s) => sum + sessionTotalVolume(s), 0);
    const dates = history.map((s) => s.date).filter(Boolean).sort();
    const meta = {
      appName: "trelog-mvp",
      appVersion: "0.1.0",
      counts: { sessions: sessionsCount, templates: templatesCount },
      stats: {
        totalVolume,
        dateRange: { min: dates[0] ?? null, max: dates.at(-1) ?? null },
      },
    };

    const backup: BackupFile = {
      __type: "trelog-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions: history,
      templates,
    };

    downloadJSON(`trelog-backup-${ymd()}.json`, { meta, ...backup });
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

  // 📥 インポート（ファイル選択 → 解析 → プレビュー表示）
  function openImportPreview() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        const json = JSON.parse(text);

        const analyzed = analyzeImportJson(json);
        importBufferRef.current = { sessions: analyzed.sessions, templates: analyzed.templates };
        setImportPreview(analyzed);
        setImportDialogOpen(true);
      } catch (e) {
        console.error(e);
        toast.error("このJSONは読み込めませんでした。");
      }
    };
    input.click();
  }

  function confirmImportMerge() {
    const buf = importBufferRef.current;
    if (!buf) return;
    const safeSessions = buf.sessions;
    const safeTemplates = buf.templates;

    const byId = new Map<string, Session>();
    [...history, ...safeSessions].forEach((s) => byId.set(s.id, s));
    setHistory(Array.from(byId.values()));

    if (safeTemplates.length > 0) {
      const tById = new Map<string, Template>();
      [...templates, ...safeTemplates].forEach((t) => tById.set(t.id, t));
      setTemplates(Array.from(tById.values()));
    }

    setImportDialogOpen(false);
    setImportPreview(null);
    importBufferRef.current = null;
    toast.success("インポート（追加）が完了しました。");
  }

  function confirmImportReplace() {
    const buf = importBufferRef.current;
    if (!buf) return;
    if (!confirm("現在の履歴とテンプレートを置き換えます。よろしいですか？")) return;

    if (buf.sessions.length > 0) setHistory(buf.sessions);
    if (buf.templates.length > 0) setTemplates(buf.templates);

    setImportDialogOpen(false);
    setImportPreview(null);
    importBufferRef.current = null;
    toast.success("インポート（置換）が完了しました。");
  }

  // 自動バックアップから復元
  function restoreFromAutoBackup() {
    try {
      const raw = localStorage.getItem("trelog/autoBackup/v1");
      if (!raw) {
        toast.error("自動バックアップは見つかりませんでした。");
        return;
      }
      const snap = JSON.parse(raw);
      if (Array.isArray(snap.sessions)) setHistory(snap.sessions);
      if (Array.isArray(snap.templates)) setTemplates(snap.templates);
      toast.success("自動バックアップから復元しました。");
    } catch (e) {
      console.error(e);
      toast.error("自動バックアップの読み込みに失敗しました。");
    }
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

  const quickStats = useMemo(() => {
    let volume = 0;
    let rpeSum = 0;
    let setCount = 0;
    for (const s of filtered) {
      for (const ex of s.exercises) {
        for (const st of ex.sets) {
          const sc = typeof st.setsCount === "number" ? st.setsCount : 1;
          if (typeof st.weightKg === "number" && typeof st.reps === "number") {
            volume += st.weightKg * st.reps * sc;
          }
          if (typeof st.rpe === "number") {
            rpeSum += st.rpe * sc;
          }
          setCount += sc;
        }
      }
    }
    const avgRPE = setCount > 0 ? Number((rpeSum / setCount).toFixed(2)) : 0;
    return { volume: Math.round(volume), avgRPE };
  }, [filtered]);

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

  // 削除まわり
  function deleteSession(id: string) {
    setPendingDeleteId(id);
  }
  function confirmDeleteNow() {
    if (!pendingDeleteId) return;
    setHistory(history.filter((h) => h.id !== pendingDeleteId));
    if (expanded === pendingDeleteId) setExpanded(null);
    setPendingDeleteId(null);
    toast.success("セッションを削除しました。");
  }

  const totalCount = history.length;
  const filteredCount = filtered.length;

  return (
    <>
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
              onClick={exportFilteredAsCSV}
              title="現在の表示（検索や週/月切替の結果）をCSVで出力"
            >
              CSVエクスポート（表示中）
            </button>
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
                onClick={restoreFromAutoBackup}
                title="ローカルの自動バックアップから復元"
              >
                自動バックアップから復元
              </button>

              {/* ← 旧「追加/置換」2ボタンの代わりに、プレビュー付き1ボタン */}
              <button
                type="button"
                className="rounded-xl border px-3 py-2 hover:bg-gray-50"
                onClick={openImportPreview}
                title="JSONを解析してプレビュー表示"
              >
                インポート（プレビュー）
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            JSONは“トレーニング記録（sessions）”と“テンプレート（templates）”を含むテキスト形式のバックアップです。
          </p>
          <div className="mt-2 text-xs text-gray-600">
            {filteredCount}/{totalCount} 件
          </div>
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
        </div>

        {/* クイック統計 */}
        <div className="mt-2 text-sm text-gray-700">
          表示中の合計ボリューム：
          <span className="font-semibold">{quickStats.volume.toLocaleString()} kg</span>
          <span className="mx-2">/</span>
          平均RPE：<span className="font-semibold">{quickStats.avgRPE}</span>
        </div>

        {/* 📊 サマリーグラフ */}
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

      {/* ✅ 削除確認ダイアログ */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="削除の確認"
        message={"このセッションを削除します。よろしいですか？\n（この操作は元に戻せません）"}
        confirmText="削除する"
        cancelText="やめる"
        onConfirm={confirmDeleteNow}
        onClose={() => setPendingDeleteId(null)}
      />

      {/* ✅ インポートプレビュー */}
      <ImportPreviewDialog
        open={importDialogOpen}
        data={importPreview}
        onMerge={confirmImportMerge}
        onReplace={confirmImportReplace}
        onClose={() => {
          setImportDialogOpen(false);
          setImportPreview(null);
        }}
      />
    </>
  );
}

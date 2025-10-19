// src/components/ImportPreviewDialog.tsx
import type { ImportAnalyze } from "../utils/validateBackup";

type Props = {
  open: boolean;
  data: ImportAnalyze | null;
  onMerge: () => void;
  onReplace: () => void;
  onClose: () => void;
};

export default function ImportPreviewDialog({ open, data, onMerge, onReplace, onClose }: Props) {
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
          <button className="rounded-xl border px-3 py-2 hover:bg-gray-50" onClick={onMerge} title="現在のデータに追加・マージ">
            追加（マージ）
          </button>
          <button className="rounded-xl border px-3 py-2 bg-red-600 text-white hover:opacity-90" onClick={onReplace} title="現在のデータを置き換え">
            置換（上書き）
          </button>
        </div>
      </div>
    </div>
  );
}

import type { SetEntry } from "../types";

export function SetRow({
  value,
  onChange,
  onRemove,
}: {
  value: SetEntry;
  onChange: (next: SetEntry) => void;
  onRemove: () => void;
}) {
  const setsCount = typeof value.setsCount === "number" ? value.setsCount : 1;
  const volume =
    typeof value.weightKg === "number" && typeof value.reps === "number"
      ? value.weightKg * value.reps * setsCount
      : 0;

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      {/* # */}
      <div className="col-span-1 text-center text-sm text-gray-500">{value.setNumber}</div>

      {/* 重量 */}
      <input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        className="col-span-2 rounded-xl border px-2 py-1"
        value={value.weightKg}
        onChange={(e) =>
          onChange({
            ...value,
            weightKg: e.target.value === "" ? "" : Number(e.target.value),
          })
        }
      />

      {/* 実施時間（秒） */}
      <select
        className="col-span-2 rounded-xl border px-2 py-1"
        value={value.durationSec === "" ? "" : String(value.durationSec)}
        onChange={(e) =>
          onChange({
            ...value,
            durationSec: e.target.value === "" ? "" : Number(e.target.value),
          })
        }
        title="実施時間"
      >
        <option value="">時間</option>
        {[10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240, 300].map((n) => (
          <option key={n} value={n}>
            {n}s
          </option>
        ))}
      </select>

      {/* レップ */}
      <select
        className="col-span-2 rounded-xl border px-2 py-1"
        value={value.reps === "" ? "" : String(value.reps)}
        onChange={(e) =>
          onChange({
            ...value,
            reps: e.target.value === "" ? "" : Number(e.target.value),
          })
        }
      >
        <option value="">reps</option>
        {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      {/* セット数（この行が何セット相当か） */}
      <select
        className="col-span-1 rounded-xl border px-2 py-1"
        value={value.setsCount === "" ? "" : String(value.setsCount)}
        onChange={(e) =>
          onChange({
            ...value,
            setsCount: e.target.value === "" ? "" : Number(e.target.value),
          })
        }
        title="セット数"
      >
        <option value="">set</option>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      {/* レスト */}
      <select
        className="col-span-2 rounded-xl border px-2 py-1"
        value={value.intervalSec === "" ? "" : String(value.intervalSec)}
        onChange={(e) =>
          onChange({
            ...value,
            intervalSec: e.target.value === "" ? "" : Number(e.target.value),
          })
        }
      >
        <option value="">rest</option>
        {[30, 45, 60, 75, 90, 120, 150, 180, 210, 240, 300].map((n) => (
          <option key={n} value={n}>
            {n}s
          </option>
        ))}
      </select>

      {/* RPE */}
      <select
        className="col-span-2 rounded-xl border px-2 py-1"
        value={value.rpe === "" ? "" : String(value.rpe)}
        onChange={(e) =>
          onChange({
            ...value,
            rpe: e.target.value === "" ? "" : (Number(e.target.value) as any),
          })
        }
      >
        <option value="">RPE</option>
        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      {/* ボリューム表示 */}
      <div className="col-span-2 text-right text-sm text-gray-600">{volume ? `${volume} kg` : ""}</div>

      {/* セットメモ & 削除 */}
      <div className="col-span-12 flex gap-2">
        <input
          className="w-full rounded-xl border px-2 py-1"
          placeholder="セットメモ（任意）"
          value={value.note ?? ""}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
        />
        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl border px-3 py-1 text-red-600 hover:bg-red-50"
        >
          削除
        </button>
      </div>
    </div>
  );
}

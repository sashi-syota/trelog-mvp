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
  const volume =
    typeof value.weightKg === "number" && typeof value.reps === "number"
      ? value.weightKg * value.reps
      : 0;

  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-1 text-center text-sm text-gray-500">{value.setNumber}</div>

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
        <option value="">rest(s)</option>
        {[30, 45, 60, 75, 90, 120, 150, 180, 210, 240, 300].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <div className="col-span-2 text-right text-sm text-gray-600">{volume ? `${volume} kg` : ""}</div>

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

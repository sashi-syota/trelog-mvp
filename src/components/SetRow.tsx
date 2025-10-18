import { NumberSelect } from "./NumberSelect";
import { REPS_OPTIONS, RPE_OPTIONS, INTERVAL_OPTIONS_SEC } from "../constants";
import type { SetEntry } from "../types";

export function SetRow({
  entry,
  onChange,
  onDuplicate,
  onRemove
}:{
  entry: SetEntry;
  onChange: (patch: Partial<SetEntry>)=>void;
  onDuplicate: ()=>void;
  onRemove: ()=>void;
}){
  const volume = (typeof entry.weightKg === "number" && typeof entry.reps === "number")
    ? entry.weightKg * entry.reps
    : 0;
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-1 text-center text-sm text-gray-500">{entry.setNumber}</div>
      <input
        type="number"
        inputMode="decimal"
        placeholder="kg"
        className="col-span-2 rounded-xl border px-2 py-1"
        value={entry.weightKg}
        onChange={(e)=> onChange({ weightKg: e.target.value === '' ? '' : Number(e.target.value) })}
      />
      <div className="col-span-2">
        <NumberSelect
          value={entry.reps}
          onChange={(v)=>onChange({ reps: v })}
          options={REPS_OPTIONS as unknown as number[]}
          placeholder="reps"
        />
      </div>
      <div className="col-span-2">
        <NumberSelect
          value={entry.rpe ?? ''}
          onChange={(v)=>onChange({ rpe: v as any })}
          options={RPE_OPTIONS}
          placeholder="RPE"
        />
      </div>
      <div className="col-span-2">
        <NumberSelect
          value={entry.intervalSec ?? ''}
          onChange={(v)=>onChange({ intervalSec: v })}
          options={INTERVAL_OPTIONS_SEC}
          placeholder="rest(s)"
        />
      </div>
      <div className="col-span-2 text-right text-sm text-gray-600">{volume ? `${volume} kg` : ""}</div>
      <div className="col-span-12 flex gap-2">
        <input
          className="w-full rounded-xl border px-2 py-1"
          placeholder="メモ（任意）"
          value={entry.note ?? ''}
          onChange={(e)=>onChange({ note: e.target.value })}
        />
        <button type="button" onClick={onDuplicate} className="rounded-xl border px-3 py-1 hover:bg-gray-50">複製</button>
        <button type="button" onClick={onRemove} className="rounded-xl border px-3 py-1 text-red-600 hover:bg-red-50">削除</button>
      </div>
    </div>
  );
}
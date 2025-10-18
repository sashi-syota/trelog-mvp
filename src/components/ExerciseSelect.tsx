import { EXERCISES } from "../constants";
export function ExerciseSelect({ value, onChange }: {value: string; onChange:(v:string)=>void}) {
  return (
    <select
      className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
      value={value}
      onChange={(e)=>onChange(e.target.value)}
    >
      <option value="" disabled>種目を選択…</option>
      {EXERCISES.map((group) => (
        <optgroup key={group.group} label={group.group}>
          {group.items.map((name) => (
            <option value={name} key={name}>{name}</option>
          ))}
        </optgroup>
      ))}
      <option value="__custom__">＋ カスタム種目名を入力…</option>
    </select>
  );
}
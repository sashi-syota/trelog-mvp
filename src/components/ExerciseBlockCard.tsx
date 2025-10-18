import { useId, useState } from "react";
import { Card, Label, SectionTitle } from "./Field";
import { ExerciseSelect } from "./ExerciseSelect";
import { SetRow } from "./SetRow";
import type { ExerciseBlock, SetEntry } from "../types";

function uid() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); }

export function ExerciseBlockCard({
  value,
  onChange,
  onRemove
}:{
  value: ExerciseBlock;
  onChange: (v: ExerciseBlock)=>void;
  onRemove: ()=>void;
}){
  const [customName, setCustomName] = useState("");
  const selectId = useId();

  const totalVolume = value.sets.reduce((acc, s)=> acc + (typeof s.weightKg === 'number' && typeof s.reps === 'number' ? s.weightKg * s.reps : 0), 0);

  function updateSet(idx: number, patch: Partial<SetEntry>){
    const sets = value.sets.map((s, i)=> i===idx ? { ...s, ...patch } : s);
    onChange({ ...value, sets });
  }
  function addSet(copyFromLast=false){
    const last = value.sets[value.sets.length-1];
    const base: SetEntry = last && copyFromLast ? { ...last, id: uid(), setNumber: value.sets.length+1 } : {
      id: uid(), setNumber: value.sets.length+1, weightKg: "", reps: "", rpe: "", intervalSec: "", note: ""
    };
    onChange({ ...value, sets: [...value.sets, base] });
  }
  function removeSet(idx: number){
    const sets = value.sets.filter((_, i)=> i!==idx).map((s, i)=> ({...s, setNumber: i+1}));
    onChange({ ...value, sets });
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <SectionTitle>
            <span className="mr-2">🏋️</span>
            {value.name || "種目"}
          </SectionTitle>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={selectId}>種目</Label>
              <ExerciseSelect
                value={value.name}
                onChange={(v)=>{
                  if(v === "__custom__") return; // open custom input below
                  onChange({ ...value, name: v });
                }}
              />
              <div className="mt-2">
                <input
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="カスタム種目名（任意）"
                  value={customName}
                  onChange={(e)=> setCustomName(e.target.value)}
                  onBlur={()=>{ if(customName.trim()){ onChange({ ...value, name: customName.trim() }); }}}
                />
              </div>
            </div>
            <div>
              <Label>バリアント（任意）</Label>
              <input
                className="w-full rounded-xl border px-3 py-2"
                placeholder="例：Tempo 3-0-3, Low-bar など"
                value={value.variant ?? ''}
                onChange={(e)=> onChange({ ...value, variant: e.target.value })}
              />
            </div>
          </div>
        </div>
        <button type="button" onClick={onRemove} className="rounded-xl border px-3 py-2 text-red-600 hover:bg-red-50">削除</button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-12 gap-2 text-xs text-gray-500">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-2 text-center">重量(kg)</div>
          <div className="col-span-2 text-center">レップ</div>
          <div className="col-span-2 text-center">RPE</div>
          <div className="col-span-2 text-center">レスト(s)</div>
          <div className="col-span-2 text-right pr-1">ボリューム</div>
          <div className="col-span-12 h-px bg-gray-100" />
        </div>
        {value.sets.map((s, idx)=> (
          <SetRow
            key={s.id}
            entry={s}
            onChange={(patch)=> updateSet(idx, patch)}
            onDuplicate={()=> {
              const clone: SetEntry = { ...s, id: uid(), setNumber: value.sets.length+1 };
              onChange({ ...value, sets: [...value.sets, clone] });
            }}
            onRemove={()=> removeSet(idx)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={()=>addSet(false)} className="rounded-xl border px-3 py-2 hover:bg-gray-50">＋ セット追加</button>
        <button type="button" onClick={()=>addSet(true)} className="rounded-xl border px-3 py-2 hover:bg-gray-50">＋ 前のセットを複製</button>
        <div className="ml-auto text-sm text-gray-700">合計ボリューム: <span className="font-semibold">{totalVolume} kg</span></div>
      </div>
    </Card>
  );
}
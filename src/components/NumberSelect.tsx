export function NumberSelect({
  value,
  onChange,
  options,
  placeholder
}:{
  value: number | "";
  onChange: (v:number | "")=>void;
  options: readonly number[];
  placeholder?: string;
}){
  return (
    <select
      className="min-w-20 rounded-xl border px-2 py-1 focus:outline-none focus:ring"
      value={value === "" ? "" : String(value)}
      onChange={(e)=>{
        const val = e.target.value;
        onChange(val === "" ? "" : Number(val));
      }}
    >
      <option value="">{placeholder ?? "-"}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
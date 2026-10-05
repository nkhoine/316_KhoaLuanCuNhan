import { useEffect, useState } from 'react';
import type { DependencyList } from 'react';
import { errorMessage } from '../../api/client';
import { fmt } from '../../api/user';
export const card='u-card rounded-2xl border p-5 md:p-6 shadow-sm';
export const input='u-input w-full rounded-xl border px-3 py-2.5';
export const button='u-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold disabled:opacity-40';
export const secondary='u-secondary inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 disabled:opacity-40';
export function Notice({error,success}:{error?:string;success?:string}) {return <>{error && <p role="alert" className="u-error rounded-xl p-4">{error}</p>}{success && <p role="status" className="u-success rounded-xl p-4">{success}</p>}</>;}
export function useLoad<T>(loader:()=>Promise<T>,deps:DependencyList=[]) {
 const [data,setData]=useState<T|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [revision,setRevision]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setData(null);setError('');loader().then(value=>{if(active)setData(value);}).catch(e=>{if(active)setError(errorMessage(e));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[...deps,revision]);
 return {data,error,loading,reload:()=>setRevision(v=>v+1)};
}
export function Nutrition({data}:{data:{calories:number;protein:number;carbs:number;fat:number;fiber:number|null}}) {return <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[['Năng lượng',data.calories,'kcal'],['Protein',data.protein,'g'],['Carb',data.carbs,'g'],['Fat',data.fat,'g'],['Chất xơ',data.fiber,'g']].map(([label,value,unit])=><div key={String(label)} className="u-soft rounded-xl p-3"><dt className="u-muted text-xs">{label}</dt><dd className="mt-1 font-bold">{fmt(value as number|null)}{value!=null && ` ${unit}`}</dd></div>)}</dl>;}

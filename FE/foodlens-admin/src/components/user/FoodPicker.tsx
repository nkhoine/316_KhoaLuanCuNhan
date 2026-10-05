import { useState } from 'react';
import type { Food } from '../../api/types';
import { fmt } from '../../api/user';
import { button, card, input, secondary } from './ui';
export default function FoodPicker({foods,busy,onChoose}:{foods:Food[];busy:boolean;onChoose:(food:Food)=>void}){
 const [query,setQuery]=useState('');const [category,setCategory]=useState('');const [page,setPage]=useState(1);
 const categories=[...new Map(foods.filter(f=>f.category).map(f=>[f.category.id,f.category.name])).entries()];
 const normalize=(s:string)=>s.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
 const rows=foods.filter(f=>normalize(`${f.name} ${f.aiLabel||''}`).includes(normalize(query.trim()))&&(!category||String(f.category?.id)===category));
 const pages=Math.max(1,Math.ceil(rows.length/12));const current=Math.min(page,pages);
 return <section className={card}><h3 className="text-xl font-bold">Tra cứu món ăn</h3><div className="my-4 flex flex-wrap gap-3"><input className={`${input} flex-1`} aria-label="Tìm món ăn" placeholder="Tìm tên món…" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/><select className={`${input} sm:w-60`} aria-label="Lọc danh mục" value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">Tất cả danh mục</option>{categories.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></div>
  <div className="grid gap-3 sm:grid-cols-2">{rows.slice((current-1)*12,current*12).map(food=><article key={food.id} className="u-soft rounded-xl p-4"><h4 className="font-bold">{food.name}</h4><p className="u-muted my-2 text-sm">{food.category?.name||'Chưa phân loại'} · {fmt(food.baseServingG)} g · {fmt(food.calories)} kcal</p><button disabled={busy} className={button} onClick={()=>onChoose(food)}>Xem chi tiết / Chọn món</button></article>)}</div>
  {!rows.length&&<p className="u-muted py-6">Không có món phù hợp trong danh sách.</p>}
  <div className="mt-4 flex flex-wrap justify-between gap-3"><span className="u-muted text-sm">{rows.length} món · Trang {current}/{pages}</span><div className="flex gap-2"><button disabled={current===1} className={secondary} onClick={()=>setPage(current-1)}>Trước</button><button disabled={current===pages} className={secondary} onClick={()=>setPage(current+1)}>Sau</button></div></div>
 </section>;
}

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError, errorMessage } from '../../api/client';
import type { DailySummary } from '../../api/types';
import { getDaily, localDate, periodDates, fmt, MEALS, hasMeals } from '../../api/user';
import type { MealItem } from '../../api/user';
import { button, card, input, secondary, Notice, Nutrition } from '../../components/user/ui';
type DayRow={date:string;data:DailySummary|null;error:string};
export default function UserDiaryPage(){
 const [params,setParams]=useSearchParams();const paramDate=params.get('date');const date=paramDate&&/^\d{4}-\d{2}-\d{2}$/.test(paramDate)&&!Number.isNaN(Date.parse(paramDate))?paramDate:localDate();
 const [mode,setMode]=useState<'day'|'week'|'month'>('day');const [rows,setRows]=useState<DayRow[]>([]);const [loading,setLoading]=useState(true);const [revision,setRevision]=useState(0);
 const [edit,setEdit]=useState<MealItem|null>(null);const [grams,setGrams]=useState('');const [busy,setBusy]=useState(false);const saving=useRef(false);const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;let next=0;let stopped=false;const dates=periodDates(date,mode);const result:DayRow[]=dates.map(d=>({date:d,data:null,error:'Chưa tải được dữ liệu'}));
  setRows([]);setLoading(true);setEdit(null);setError('');
  async function worker(){while(active&&!stopped&&next<dates.length){const i=next++;try{const data=await getDaily(dates[i]);result[i]={date:dates[i],data,error:''};}catch(e){result[i]={date:dates[i],data:null,error:errorMessage(e)};if(e instanceof ApiError&&e.status===401)stopped=true;}}}
  void Promise.all(Array.from({length:Math.min(4,dates.length)},()=>worker())).then(()=>{if(active){setRows(result);setLoading(false);}});
  return()=>{active=false;};
 },[date,mode,revision]);
 function chooseDate(value:string){if(value){setParams({date:value});setEdit(null);}}
 async function save(e:React.FormEvent){e.preventDefault();if(!edit||saving.current)return;const weight=Number(grams);if(!Number.isFinite(weight)||weight<0.1||weight>10000){setError('Khẩu phần từ 0,1 đến 10.000 g.');return;}saving.current=true;setBusy(true);setError('');try{await api(`/meal-logs/details/${edit.id}`,'PATCH',{consumedWeightG:weight});setEdit(null);setRevision(v=>v+1);}catch(e){setError(errorMessage(e));}finally{saving.current=false;setBusy(false);}}
 async function remove(item:MealItem){if(saving.current||!confirm(`Xóa ${item.foodName} khỏi nhật ký ngày ${date}?`))return;saving.current=true;setBusy(true);setError('');try{await api(`/meal-logs/details/${item.id}`,'DELETE');setRevision(v=>v+1);}catch(e){setError(errorMessage(e));}finally{saving.current=false;setBusy(false);}}
 const day=rows[0]?.data;const recorded=rows.filter(r=>r.data&&hasMeals(r.data));const failed=rows.filter(r=>r.error);const total=recorded.reduce((n,r)=>n+r.data!.totalDailyCalories,0);
 return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Nhật ký ăn uống</h2><label>Ngày <input disabled={busy} aria-label="Ngày nhật ký" type="date" className={input} value={date} onChange={e=>chooseDate(e.target.value)}/></label></div>
  <div className="flex flex-wrap gap-2">{([['day','Ngày'],['week','Tuần'],['month','Tháng']] as const).map(([v,n])=><button key={v} disabled={busy} className={mode===v?button:secondary} onClick={()=>setMode(v)}>{n}</button>)}<button disabled={busy||loading} className={secondary} onClick={()=>setRevision(v=>v+1)}>Làm mới</button></div>
  <Notice error={error}/>
  {loading?<p>Đang tải nhật ký…</p>:<>
   {!!failed.length&&<Notice error={`${failed.length} ngày chưa tải được. ${failed[0].error} Bấm Làm mới để thử lại.`}/>}
   {mode==='day'&&day&&<><section className={card}><Nutrition data={{calories:day.totalDailyCalories,protein:day.totalDailyProtein,carbs:day.totalDailyCarbs,fat:day.totalDailyFat,fiber:day.totalDailyFiber}}/>{!hasMeals(day)&&<p className="u-muted mt-3">Chưa ghi nhận món ăn trong ngày này.</p>}{!day.fiberComplete&&<p className="u-muted mt-3">Chưa đủ số liệu chất xơ cho tất cả món.</p>}</section>
    {MEALS.map(([key,name])=>{const meal=day.meals.find(m=>m.mealType===key);return <section key={key} className={card}><div className="mb-4 flex flex-wrap justify-between gap-2"><h3 className="text-lg font-bold">{name}</h3><span>{meal?`${fmt(meal.mealCalories)} kcal`:'Chưa ghi nhận'}</span></div><div className="space-y-3">{meal?.items.map(item=><div key={item.id} className="u-soft rounded-xl p-4"><div className="flex flex-wrap justify-between gap-3"><div><h4 className="font-semibold">{item.foodName}</h4><p className="u-muted mt-1 text-sm">{fmt(item.consumedWeightG)} g · {fmt(item.actualCalories)} kcal</p><p className="u-muted text-sm">P {fmt(item.actualProtein)} · C {fmt(item.actualCarbs)} · F {fmt(item.actualFat)} g · Xơ {fmt(item.actualFiber)}{item.actualFiber!=null&&' g'}</p></div><div className="flex items-start gap-2"><button disabled={busy} className={secondary} onClick={()=>{setEdit(item);setGrams(String(item.consumedWeightG));setError('');}}>Sửa gram</button><button disabled={busy} className={secondary} onClick={()=>void remove(item)}>Xóa</button></div></div></div>)}</div><Link className="mt-4 inline-block text-secondary underline" to={`/app/recognize?mode=search&date=${date}&meal=${key}`}>+ Thêm món</Link></section>;})}
   </>}
   {mode!=='day'&&<section className={card}><h3 className="text-lg font-bold">{mode==='week'?'Tuần':'Tháng'} chứa ngày {date}</h3><p className="u-muted mt-2 text-sm">{recorded.length} ngày có nhật ký · Tổng đã tải: {fmt(total)} kcal{recorded.length>0&&` · Trung bình ngày có nhật ký: ${fmt(total/recorded.length)} kcal`}{failed.length>0&&' · Chưa đủ dữ liệu do có ngày tải lỗi'}</p><div className={`mt-5 grid gap-3 ${mode==='month'?'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7':'sm:grid-cols-2'}`}>{rows.map(row=><button key={row.date} disabled={busy} className="u-soft rounded-xl p-4 text-left" onClick={()=>{chooseDate(row.date);setMode('day');}}><p className="text-sm font-semibold">{row.date.slice(8)}/{row.date.slice(5,7)}</p><p className="mt-2 text-sm">{row.error?'Tải lỗi':row.data&&hasMeals(row.data)?`${fmt(row.data.totalDailyCalories)} kcal`:'Chưa ghi nhận'}</p></button>)}</div><p className="u-muted mt-4 text-sm">Chọn một ngày để xem và sửa nhật ký. “Chưa ghi nhận” không có nghĩa bạn đã ăn 0 kcal.</p></section>}
  </>}
  {edit&&<section className={card}><h3 className="font-bold">Sửa khẩu phần: {edit.foodName}</h3><form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-3"><label>Khối lượng (g)<input autoFocus required disabled={busy} className={`${input} mt-2`} type="number" min={0.1} max={10000} step="any" value={grams} onChange={e=>setGrams(e.target.value)}/></label><button disabled={busy} className={button}>Lưu khẩu phần</button><button type="button" disabled={busy} className={secondary} onClick={()=>setEdit(null)}>Hủy</button></form></section>}
 </div>;
}

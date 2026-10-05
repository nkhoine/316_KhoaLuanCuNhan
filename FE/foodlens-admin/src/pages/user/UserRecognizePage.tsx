import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import type { Food, Recognition } from '../../api/types';
import type { MealItem } from '../../api/user';
import { localDate, MEALS, fmt, scaleNutrition } from '../../api/user';
import FoodPicker from '../../components/user/FoodPicker';
import { button, card, input, secondary, Notice, Nutrition, useLoad } from '../../components/user/ui';

export default function UserRecognizePage(){
 const [params,setParams]=useSearchParams();const searchMode=params.get('mode')==='search';const requestedDate=params.get('date');const requestedMeal=params.get('meal');
 const [date,setDate]=useState(localDate());const [meal,setMeal]=useState('BREAKFAST');
 useEffect(()=>{setDate(requestedDate&&/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)&&!Number.isNaN(Date.parse(requestedDate))?requestedDate:localDate());setMeal(MEALS.some(([key])=>key===requestedMeal)?requestedMeal!:'BREAKFAST');},[requestedDate,requestedMeal]);
 const catalogue=useLoad(()=>api<Food[]>('/foods'));
 const [file,setFile]=useState<File|null>(null);const [preview,setPreview]=useState('');const [result,setResult]=useState<Recognition|null>(null);const [label,setLabel]=useState('');
 const [chosen,setChosen]=useState<Food|null>(null);const [confidence,setConfidence]=useState<number|null>(null);const [grams,setGrams]=useState('100');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const working=useRef(false);
 const [saved,setSaved]=useState<{date:string;item:MealItem}|null>(null);
 const uploadRef=useRef<HTMLInputElement>(null);const cameraRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(!file){setPreview('');return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 function reset(){setFile(null);setResult(null);setLabel('');setChosen(null);setConfidence(null);setSaved(null);setError('');if(uploadRef.current)uploadRef.current.value='';if(cameraRef.current)cameraRef.current.value='';}
 function mode(search:boolean){if(working.current)return;reset();const next=new URLSearchParams(params);if(search)next.set('mode','search');else next.delete('mode');setParams(next);}
 function chooseFile(next:File|undefined){if(!next||working.current)return;if(!['image/jpeg','image/png'].includes(next.type)||next.size>10*1024*1024||next.size===0){setError('Chọn ảnh JPEG/PNG không rỗng, tối đa 10 MB.');return;}reset();setFile(next);}
 async function recognize(){if(!file||working.current)return;working.current=true;setBusy(true);setError('');setChosen(null);setResult(null);setSaved(null);try{const body=new FormData();body.append('file',file);const data=await api<Recognition>('/ai/recognize','POST',body);setResult(data);setLabel(data.food_detected?(data.predictions?.[0]?.label||data.ai_prediction||''):'');}catch(e){setError(errorMessage(e));}finally{working.current=false;setBusy(false);}}
 async function choose(food:Food,fromAI=false){if(working.current)return;working.current=true;setBusy(true);setError('');try{const detail=await api<Food>(`/foods/${food.id}`);setChosen(detail);setGrams(String(detail.baseServingG));const p=result?.food_detected&&fromAI?result.predictions.find(p=>p.label===detail.aiLabel&&p.label===label):null;setConfidence(p?.confidence??null);setSaved(null);}catch(e){setError(errorMessage(e));}finally{working.current=false;setBusy(false);}}
 async function save(e:React.FormEvent){e.preventDefault();if(!chosen||saved||working.current)return;const weight=Number(grams);if(!scaleNutrition(chosen,weight)){setError('Khẩu phần từ 0,1 đến 10.000 g; món phải có khẩu phần chuẩn hợp lệ.');return;}if(!date){setError('Chọn ngày ghi nhận.');return;}working.current=true;setBusy(true);setError('');try{const item=await api<MealItem>('/meal-logs/add-food','POST',{logDate:date,mealType:meal,foodId:chosen.id,consumedWeightG:weight,aiConfidenceScore:confidence});setSaved({date,item});}catch(e){setError(errorMessage(e));}finally{working.current=false;setBusy(false);}}
 const foods=catalogue.data??[];
 const candidates=[...new Map([...foods,...(result?.candidates??[]),...(result?.nutrition_info?[result.nutrition_info]:[])].filter(f=>f.aiLabel===label).map(f=>[f.id,f])).values()];
 const nutrition=chosen?scaleNutrition(chosen,Number(grams)):null;
 return <div className="space-y-5"><div className="flex flex-wrap gap-3"><button disabled={busy} className={!searchMode?button:secondary} onClick={()=>mode(false)}>Chụp / Nhận diện ảnh</button><button disabled={busy} className={searchMode?button:secondary} onClick={()=>mode(true)}>Tra cứu / Thêm món thủ công</button></div><Notice error={error}/>
  {saved?<section className={card}><h2 className="text-2xl font-bold">Đã lưu vào nhật ký</h2><p className="my-4">{saved.item.foodName} · {fmt(saved.item.consumedWeightG)} g · {fmt(saved.item.actualCalories)} kcal · Ngày {saved.date}</p><Nutrition data={{calories:saved.item.actualCalories,protein:saved.item.actualProtein,carbs:saved.item.actualCarbs,fat:saved.item.actualFat,fiber:saved.item.actualFiber}}/><div className="mt-5 flex flex-wrap gap-3"><Link className={button} to={`/app/diary?date=${saved.date}`}>Xem nhật ký vừa lưu</Link><button className={secondary} onClick={reset}>Thêm món khác</button></div></section>:<>
   {!chosen&&<>
    {!searchMode&&<section className={card}><h2 className="text-xl font-bold">Nhận diện món ăn</h2><p className="u-muted my-3">Chọn ảnh, xác nhận món rồi nhập khối lượng thực tế. Dinh dưỡng được lấy từ món trong hệ thống.</p>
     <div className="u-soft rounded-xl border-2 border-dashed p-5" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();chooseFile(e.dataTransfer.files[0]);}}>
      <input ref={uploadRef} aria-label="Chọn ảnh món ăn" type="file" accept="image/jpeg,image/png" className="hidden" disabled={busy} onChange={e=>chooseFile(e.target.files?.[0])}/>
      <input ref={cameraRef} aria-label="Chụp ảnh món ăn" type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" disabled={busy} onChange={e=>chooseFile(e.target.files?.[0])}/>
      <div className="flex flex-wrap gap-3"><button disabled={busy} className={secondary} onClick={()=>uploadRef.current?.click()}>Chọn ảnh từ máy</button><button disabled={busy} className={secondary} onClick={()=>cameraRef.current?.click()}>Chụp ảnh</button></div><p className="u-muted mt-3 text-sm">Có thể kéo thả ảnh JPEG/PNG, tối đa 10 MB. Nút chụp ảnh phụ thuộc hỗ trợ của thiết bị.</p>
      {preview&&<img src={preview} alt="Ảnh món ăn bạn chọn" className="mt-4 max-h-80 w-full rounded-xl object-contain"/>}
     </div><button disabled={busy||!file} className={`${button} mt-4`} onClick={()=>void recognize()}>{busy?'Đang xử lý…':'Nhận diện ảnh'}</button>
    </section>}
    {!searchMode&&result&&<section className={card}>{!result.food_detected?<><h3 className="text-xl font-bold">Không phát hiện món ăn</h3><p className="u-muted mt-2">Bạn có thể chọn ảnh khác hoặc tìm món thủ công.</p></>:<><h3 className="text-xl font-bold">Chọn kết quả phù hợp với món thực tế</h3><div className="my-4 flex flex-wrap gap-2">{result.predictions.map((p,i)=><button disabled={busy} key={`${p.label}-${i}`} className={label===p.label?button:secondary} onClick={()=>setLabel(p.label)}>{p.label} · {fmt(p.confidence*100)}%</button>)}</div><p className="u-muted mb-4 text-sm">Đây là các gợi ý cho một món, không phải số món xuất hiện trong ảnh.</p>
     {candidates.length?<div className="space-y-3">{candidates.map(food=><div key={food.id} className="u-soft flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"><div><strong>{food.name}</strong><p className="u-muted text-sm">{fmt(food.baseServingG)} g · {fmt(food.calories)} kcal</p></div><button disabled={busy} className={button} onClick={()=>void choose(food,true)}>Chọn món này</button></div>)}</div>:<p className="u-muted">Chưa tìm thấy món có dữ liệu dinh dưỡng khớp nhãn {label}. Hãy chọn món thủ công hoặc nhờ quản trị viên bổ sung.</p>}
    </>}<button disabled={busy} className={`${secondary} mt-4`} onClick={()=>mode(true)}>Tìm món thủ công</button></section>}
    {searchMode&&(catalogue.loading?<p>Đang tải danh sách món…</p>:<FoodPicker foods={foods} busy={busy} onChoose={food=>void choose(food)}/>)}
    {catalogue.error&&<div className={card}><Notice error={catalogue.error}/><button className={secondary} onClick={catalogue.reload}>Tải lại danh sách món</button></div>}
   </>}
   {chosen&&<section className={card}><h2 className="text-2xl font-bold">{chosen.name}</h2><p className="u-muted my-3">{chosen.category?.name} · Dinh dưỡng theo khẩu phần chuẩn {fmt(chosen.baseServingG)} g</p><Nutrition data={chosen}/>
    <form onSubmit={save} className="mt-6 space-y-5"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-3"><label>Khối lượng đã ăn (g)<input required className={`${input} mt-2`} type="number" min={0.1} max={10000} step="any" value={grams} onChange={e=>setGrams(e.target.value)}/></label><label>Bữa ăn<select className={`${input} mt-2`} value={meal} onChange={e=>setMeal(e.target.value)}>{MEALS.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><label>Ngày ghi nhận<input required className={`${input} mt-2`} type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></fieldset>
     <div><h3 className="mb-3 font-bold">Ước tính theo khẩu phần bạn nhập</h3>{nutrition?<Nutrition data={nutrition}/>:<p className="u-muted">Nhập khẩu phần hợp lệ để xem ước tính.</p>}<p className="u-muted mt-2 text-xs">Kết quả lưu cuối cùng do backend tính lại từ dữ liệu món.</p></div>
     <div className="flex flex-wrap gap-3"><button disabled={busy||!nutrition} className={button}>{busy?'Đang lưu…':'Xác nhận và lưu nhật ký'}</button><button type="button" disabled={busy} className={secondary} onClick={()=>setChosen(null)}>Chọn món khác</button></div>
    </form></section>}
  </>}
 </div>;
}

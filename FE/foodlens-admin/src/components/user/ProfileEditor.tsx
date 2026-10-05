import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import { getProfile, profileBody, GOALS, localDate, shiftDate } from '../../api/user';
import type { Profile } from '../../api/user';
import { button, card, input, Notice, secondary, useLoad } from './ui';

type Draft = {heightCm:string;weightKg:string;goal:string;targetCalories:string;targetProtein:string;targetCarbs:string;targetFat:string;birthDate:string;gender:string;activityLevel:string};
const blank:Draft={heightCm:'',weightKg:'',goal:'MAINTAIN',targetCalories:'',targetProtein:'',targetCarbs:'',targetFat:'',birthDate:'',gender:'',activityLevel:''};
function draftFrom(p:Profile|null):Draft {if(!p)return {...blank};return Object.fromEntries(Object.keys(blank).map(k=>[k,String(p[k as keyof Profile]??'')])) as Draft;}
function toProfile(d:Draft):Profile {
 const number=(value:string,required=false)=>{if(!value.trim()){if(required)throw new Error('Nhập đầy đủ chiều cao và cân nặng.');return null;}const n=Number(value);if(!Number.isFinite(n))throw new Error('Giá trị số không hợp lệ.');return n;};
 return {heightCm:number(d.heightCm,true)!,weightKg:number(d.weightKg,true)!,goal:d.goal,targetCalories:number(d.targetCalories),targetProtein:number(d.targetProtein),targetCarbs:number(d.targetCarbs),targetFat:number(d.targetFat),birthDate:d.birthDate||null,gender:d.gender||null,activityLevel:d.activityLevel||null};
}
export default function ProfileEditor({mode,onSaved}:{mode:'profile'|'goals'|'onboarding';onSaved?:()=>void}) {
 const state=useLoad(async()=>({profile:await getProfile()}));
 const [draft,setDraft]=useState<Draft>({...blank});const [step,setStep]=useState(1);const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const saving=useRef(false);
 useEffect(()=>{if(state.data)setDraft(draftFrom(state.data.profile));},[state.data]);
 function update(key:keyof Draft,value:string){setDraft(old=>({...old,[key]:value}));setMessage('');}
 async function submit(e:FormEvent) {
  e.preventDefault();if(saving.current)return;
  if(mode==='onboarding' && step<3){setStep(step+1);return;}
  saving.current=true;setBusy(true);setError('');setMessage('');
  try {
   // PUT is a full update: refresh and preserve fields from the other editor.
   const current=await getProfile();
   let payload:Profile;
   if(mode==='goals') {
    if(!current)throw new Error('Hãy khởi tạo hồ sơ trước khi lưu mục tiêu.');
    const merged=toProfile({...draftFrom(current),goal:draft.goal,targetCalories:draft.targetCalories,targetProtein:draft.targetProtein,targetCarbs:draft.targetCarbs,targetFat:draft.targetFat});payload=profileBody(merged);
   } else if(mode==='profile') {
    if(!current)throw new Error('Hãy khởi tạo hồ sơ trước.');
    payload=profileBody({...current,heightCm:Number(draft.heightCm),weightKg:Number(draft.weightKg),birthDate:draft.birthDate||null,gender:draft.gender||null,activityLevel:draft.activityLevel||null});
   } else payload=toProfile(draft);
   const saved=await api<Profile>('/profiles/me','PUT',payload);
   setDraft(draftFrom(saved));setMessage('Đã lưu dữ liệu.');onSaved?.();
  }catch(e){setError(errorMessage(e));}finally{saving.current=false;setBusy(false);}
 }
 if(state.loading)return <p>Đang tải hồ sơ…</p>;
 if(state.error)return <div className={card}><Notice error={state.error}/><button className={secondary} onClick={state.reload}>Thử lại</button></div>;
 if(mode!=='onboarding' && !state.data?.profile)return <div className={card}><p>Bạn chưa thiết lập hồ sơ.</p><Link className={`${button} mt-3`} to="/app/onboarding">Khởi tạo hồ sơ</Link></div>;
 if(mode==='onboarding' && state.data?.profile)return <div className={card}><h2 className="text-xl font-bold">Bạn đã có hồ sơ</h2><p className="my-3 u-muted">Bạn có thể cập nhật số đo hoặc thay đổi mục tiêu bất cứ lúc nào.</p><div className="flex gap-3"><Link className={button} to="/app/profile">Sửa hồ sơ</Link><Link className={secondary} to="/app/goals">Sửa mục tiêu</Link></div></div>;
 const showInfo=mode==='profile'||(mode==='onboarding'&&step===1);
 const showGoals=mode==='goals'||(mode==='onboarding'&&step===2);
 return <section className={card}><h2 className="text-xl font-bold">{mode==='goals'?'Mục tiêu hằng ngày':mode==='profile'?'Thông tin cá nhân':'Khởi tạo hồ sơ'}</h2>
  {mode==='onboarding' && <div className="my-5 flex gap-2">{['Thông tin','Mục tiêu','Xác nhận'].map((x,i)=><span key={x} className={`${step===i+1?'u-primary':'u-soft'} rounded-full px-3 py-2 text-sm`}>{i+1}. {x}</span>)}</div>}
  <form onSubmit={submit} className="mt-5 space-y-5"><fieldset disabled={busy} className="space-y-5">
   {showInfo && <div className="grid gap-4 sm:grid-cols-2">
    <label>Chiều cao (cm)<input className={`${input} mt-2`} required type="number" min={30} max={300} step="any" value={draft.heightCm} onChange={e=>update('heightCm',e.target.value)}/></label>
    <label>Cân nặng (kg)<input className={`${input} mt-2`} required type="number" min={1} max={700} step="any" value={draft.weightKg} onChange={e=>update('weightKg',e.target.value)}/></label>
    <label>Ngày sinh (tùy chọn)<input className={`${input} mt-2`} type="date" max={shiftDate(localDate(),-1)} value={draft.birthDate} onChange={e=>update('birthDate',e.target.value)}/></label>
    <label>Giới tính (tùy chọn)<select className={`${input} mt-2`} value={draft.gender} onChange={e=>update('gender',e.target.value)}><option value="">Chưa cung cấp</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label>
    <label className="sm:col-span-2">Mức vận động (tùy chọn)<select className={`${input} mt-2`} value={draft.activityLevel} onChange={e=>update('activityLevel',e.target.value)}>{[['','Chưa cung cấp'],['SEDENTARY','Ít vận động'],['LIGHT','Nhẹ'],['MODERATE','Vừa'],['ACTIVE','Nhiều'],['VERY_ACTIVE','Rất nhiều']].map(([v,n])=><option value={v} key={v}>{n}</option>)}</select></label>
   </div>}
   {showGoals && <><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{GOALS.map(([v,n])=><button type="button" aria-pressed={draft.goal===v} key={v} className={draft.goal===v?button:secondary} onClick={()=>update('goal',v)}>{n}</button>)}</div>
    <p className="u-muted text-sm">Nhập mục tiêu bạn muốn theo dõi. Có thể để trống nếu chưa thiết lập; hệ thống không tự điền chỉ tiêu cho bạn.</p>
    <div className="grid gap-4 sm:grid-cols-2">{([['targetCalories','Năng lượng (kcal)'],['targetProtein','Protein (g)'],['targetCarbs','Carb (g)'],['targetFat','Fat (g)']] as const).map(([key,label])=><label key={key}>{label}<input className={`${input} mt-2`} type="number" min={0} max={999999} step="any" placeholder="Chưa thiết lập" value={draft[key]} onChange={e=>update(key,e.target.value)}/></label>)}</div></>}
   {mode==='onboarding' && step===3 && <div className="u-soft rounded-xl p-5 space-y-2"><p>Chiều cao: {draft.heightCm} cm · Cân nặng: {draft.weightKg} kg</p><p>Mục tiêu: {GOALS.find(([v])=>v===draft.goal)?.[1]}</p><p>Năng lượng: {draft.targetCalories||'Chưa thiết lập'}{draft.targetCalories && ' kcal'}</p><p>Protein / Carb / Fat: {draft.targetProtein||'—'} / {draft.targetCarbs||'—'} / {draft.targetFat||'—'} g</p><p className="u-muted text-sm">Bấm Hoàn tất để lưu hồ sơ.</p></div>}
  </fieldset><Notice error={error} success={message}/><div className="flex flex-wrap gap-3">
   {mode==='onboarding' && step>1 && <button type="button" disabled={busy} className={secondary} onClick={()=>setStep(step-1)}>Quay lại</button>}
   <button disabled={busy} className={button}>{busy?'Đang lưu…':mode==='onboarding'?(step<3?'Tiếp tục':'Hoàn tất'):'Lưu thay đổi'}</button>
   {mode!=='onboarding' && <button type="button" disabled={busy} className={secondary} onClick={()=>{setError('');setMessage('');state.reload();}}>Hủy thay đổi</button>}
  </div></form>
 </section>;
}

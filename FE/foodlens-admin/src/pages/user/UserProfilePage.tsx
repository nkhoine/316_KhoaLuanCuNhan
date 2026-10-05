import { useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import ProfileEditor from '../../components/user/ProfileEditor';
import { useUserTheme } from '../../components/user/theme';
import type { Theme } from '../../components/user/theme';
import { card, input, button, secondary, Notice } from '../../components/user/ui';
export default function UserProfilePage() {
 const {user,reload,logout}=useAuth();const [name,setName]=useState(user?.fullName??'');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const saving=useRef(false);const theme=useUserTheme();
 useEffect(()=>setName(user?.fullName??''),[user?.fullName]);
 async function saveName(e:React.FormEvent){e.preventDefault();if(saving.current)return;saving.current=true;setBusy(true);setError('');try{await api('/account/me','PATCH',{fullName:name.trim()});await reload();}catch(e){setError(errorMessage(e));}finally{saving.current=false;setBusy(false);}}
 async function leave(){if(busy||!confirm('Đăng xuất khỏi tài khoản?'))return;setBusy(true);try{await logout();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
 return <div className="space-y-5"><section className={card}><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan text-xl font-bold text-white">{user?.fullName?.trim().charAt(0).toUpperCase()||'U'}</div><div><h2 className="text-xl font-bold">{user?.fullName}</h2><p className="u-muted break-all">{user?.email} · {user?.role}</p></div></div>
  <form onSubmit={saveName} className="mt-5 space-y-4"><label className="block">Họ tên<input required maxLength={100} className={`${input} mt-2`} value={name} onChange={e=>setName(e.target.value)}/></label><label className="block">Email<input className={`${input} mt-2`} readOnly value={user?.email??''}/></label><Notice error={error}/><div className="flex gap-3"><button className={button} disabled={busy||!name.trim()}>Lưu họ tên</button><button type="button" className={secondary} disabled={busy} onClick={()=>void leave()}>Đăng xuất</button></div></form>
 </section><ProfileEditor mode="profile"/><section className={card}><label>Giao diện<select className={`${input} mt-2 max-w-sm block`} value={theme.preference} onChange={e=>{try{theme.setTheme(e.target.value as Theme);}catch{setError('Trình duyệt không cho lưu tùy chọn giao diện.');}}}><option value="light">Sáng</option><option value="dark">Tối</option><option value="system">Theo hệ thống</option></select></label><p className="u-muted mt-2 text-sm">Tùy chọn giao diện được lưu trên trình duyệt này.</p></section></div>;
}

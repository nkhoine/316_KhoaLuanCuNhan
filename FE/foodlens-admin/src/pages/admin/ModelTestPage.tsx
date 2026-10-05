import { useEffect, useState } from 'react';
import { api, errorMessage } from '../../api/client';
import type { Recognition } from '../../api/types';
export default function ModelTestPage() {
 const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState('');
 const [result, setResult] = useState<Recognition | null>(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
 useEffect(() => { if (!file) {setPreview('');return;} const url=URL.createObjectURL(file);setPreview(url);return () => URL.revokeObjectURL(url); },[file]);
 async function recognize() {
  if(!file || busy) return; setError('');setResult(null);
  if(!['image/jpeg','image/png'].includes(file.type) || file.size>10*1024*1024) {setError('Chọn ảnh JPEG/PNG không quá 10 MB.');return;}
  setBusy(true);
  try {const form=new FormData();form.append('file',file);setResult(await api<Recognition>('/ai/recognize','POST',form));}
  catch(e){setError(errorMessage(e));}finally{setBusy(false);}
 }
 return <div className="space-y-5"><h2 className="text-2xl font-bold text-navy">Kiểm thử nhận diện món ăn</h2>
  <p className="text-muted">Chọn một ảnh món ăn. Kết quả là các gợi ý của mô hình, cần đối chiếu với món thực tế.</p>
  <div className="grid gap-5 lg:grid-cols-2"><section className="space-y-4 rounded-2xl border border-line bg-white p-5">
   <input aria-label="Ảnh món ăn" disabled={busy} type="file" accept="image/jpeg,image/png" onChange={e => {setFile(e.target.files?.[0]??null);setResult(null);setError('');}} />
   {preview && <img src={preview} alt="Ảnh được chọn" className="max-h-80 w-full rounded-xl object-contain" />}
   <button disabled={!file || busy} className="rounded-xl bg-navy px-5 py-3 text-white disabled:opacity-40" onClick={() => void recognize()}>{busy ? 'Đang nhận diện…' : 'Nhận diện'}</button>
  </section><section className="space-y-4 rounded-2xl border border-line bg-white p-5">
   {error && <p role="alert" className="text-red-700">{error}</p>}
   {!result && !error && <p>Chưa có kết quả.</p>}
   {result && <>{!result.food_detected ? <p>Không phát hiện món ăn trong ảnh.</p> : <>
    <h3 className="font-bold">Gợi ý nhận diện</h3>
    {result.predictions.map((p,i) => <div key={`${p.label}-${i}`} className="flex justify-between rounded-xl bg-bg p-3"><span>{p.label}</span><strong>{(p.confidence*100).toFixed(2)}%</strong></div>)}
    <p className="text-xs text-muted">Các nhãn là những dự đoán cho một món; confidence không phải độ chính xác của toàn bộ mô hình.</p>
    {result.nutrition_info && <div className="rounded-xl border border-line p-4"><h4 className="font-bold">{result.nutrition_info.name}</h4><p>Khẩu phần chuẩn: {result.nutrition_info.baseServingG} g</p><p>{result.nutrition_info.calories} kcal · Protein {result.nutrition_info.protein} g · Carb {result.nutrition_info.carbs} g · Fat {result.nutrition_info.fat} g · Xơ {result.nutrition_info.fiber ?? 'Chưa có'}</p></div>}
    {result.candidates?.length ? <div><p>Nhiều món khớp nhãn:</p>{result.candidates.map(f => <p key={f.id}>{f.name} · {f.baseServingG} g · {f.calories} kcal</p>)}</div> : null}
   </>}{result.message && <p>{result.message}</p>}</>}
  </section></div>
 </div>;
}

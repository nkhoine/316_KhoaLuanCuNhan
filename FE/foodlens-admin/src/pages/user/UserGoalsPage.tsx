import ProfileEditor from '../../components/user/ProfileEditor';
import { card, secondary, Notice, useLoad } from '../../components/user/ui';
import { fmt, getDaily, getProfile, localDate, hasMeals } from '../../api/user';
export default function UserGoalsPage(){
 const state=useLoad(async()=>({day:await getDaily(localDate()),profile:await getProfile()}));
 const data=state.data;
 return <div className="space-y-5"><ProfileEditor mode="goals" onSaved={state.reload}/>
  {state.loading?<p>Đang tải tiến độ hôm nay…</p>:state.error?<div><Notice error={state.error}/><button className={secondary} onClick={state.reload}>Thử lại</button></div>:data && <section className={card}><h3 className="text-lg font-bold">Tiến độ hôm nay · {localDate()}</h3>{!hasMeals(data.day)&&<p className="u-muted mt-2">Chưa ghi nhận món ăn hôm nay.</p>}
   <div className="mt-4 grid gap-3 sm:grid-cols-2">{[['Năng lượng',data.day.totalDailyCalories,data.profile?.targetCalories,'kcal'],['Protein',data.day.totalDailyProtein,data.profile?.targetProtein,'g'],['Carb',data.day.totalDailyCarbs,data.profile?.targetCarbs,'g'],['Fat',data.day.totalDailyFat,data.profile?.targetFat,'g']].map(([name,actual,target,unit])=><div className="u-soft rounded-xl p-4" key={String(name)}><p>{name}</p><p className="mt-2 text-xl font-bold">{fmt(actual as number)} {unit}</p><p className="u-muted text-sm">{target==null?'Chưa thiết lập mục tiêu':`${Number(actual)>Number(target)?'Vượt':'Còn'} ${fmt(Math.abs(Number(target)-Number(actual)))} ${unit} so với mục tiêu ${fmt(Number(target))}`}</p></div>)}</div>
  </section>}
 </div>;
}

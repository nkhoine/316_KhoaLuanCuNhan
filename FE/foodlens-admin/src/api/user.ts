import { api, ApiError } from './client';
import type { DailySummary, Food } from './types';
export type Profile = {
 heightCm: number; weightKg: number; goal: string;
 targetCalories: number | null; targetProtein: number | null; targetCarbs: number | null; targetFat: number | null;
 birthDate: string | null; gender: string | null; activityLevel: string | null;
};
export type MealItem = DailySummary['meals'][number]['items'][number] & { aiConfidenceScore?: number | null };
export const MEALS = [['BREAKFAST','Bữa sáng'],['LUNCH','Bữa trưa'],['DINNER','Bữa tối'],['SNACK','Ăn phụ']] as const;
export const GOALS = [['MAINTAIN','Duy trì'],['LOSE_WEIGHT','Giảm cân'],['GAIN_MUSCLE','Tăng cơ'],['GAIN_WEIGHT','Tăng cân']] as const;
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function shiftDate(value: string, amount: number) { const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+amount);return localDate(d); }
export function periodDates(value: string, mode: 'day'|'week'|'month'): string[] {
 if(mode==='day')return [value];
 const d=new Date(`${value}T12:00:00`);
 if(mode==='week') { const start=shiftDate(value,-((d.getDay()+6)%7));return Array.from({length:7},(_,i)=>shiftDate(start,i)); }
 const start=localDate(new Date(d.getFullYear(),d.getMonth(),1));
 const count=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
 return Array.from({length:count},(_,i)=>shiftDate(start,i));
}
export const fmt = (n: number | null | undefined) => n == null || !Number.isFinite(n) ? 'Chưa có' : new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(n);
export const hasMeals = (d: DailySummary) => d.meals.some(m => m.items.length>0);
export function scaleNutrition(food: Food, grams: number) {
 if(!Number.isFinite(grams) || grams<0.1 || grams>10000 || !Number.isFinite(food.baseServingG) || food.baseServingG<=0) return null;
 const ratio=grams/food.baseServingG;
 return {calories:food.calories*ratio,protein:food.protein*ratio,carbs:food.carbs*ratio,fat:food.fat*ratio,fiber:food.fiber==null?null:food.fiber*ratio};
}
export async function getProfile(): Promise<Profile | null> {
 try{return await api<Profile>('/profiles/me');}catch(e){if(e instanceof ApiError && e.status===404)return null;throw e;}
}
export const getDaily = (date: string) => api<DailySummary>(`/meal-logs/daily?date=${encodeURIComponent(date)}`);
export const profileBody = (p: Profile): Profile => ({heightCm:p.heightCm,weightKg:p.weightKg,goal:p.goal,targetCalories:p.targetCalories??null,targetProtein:p.targetProtein??null,targetCarbs:p.targetCarbs??null,targetFat:p.targetFat??null,birthDate:p.birthDate||null,gender:p.gender||null,activityLevel:p.activityLevel||null});

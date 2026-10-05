import { useEffect, useState } from 'react';
export type Theme = 'light'|'dark'|'system';
function readTheme():Theme {try{const v=localStorage.getItem('foodlens.user.theme');return v==='light'||v==='dark'?v:'system';}catch{return 'system';}}
export function useUserTheme() {
 const [preference,setPreference]=useState<Theme>(readTheme);const [dark,setDark]=useState(()=>window.matchMedia('(prefers-color-scheme: dark)').matches);
 useEffect(()=>{const query=window.matchMedia('(prefers-color-scheme: dark)');const change=()=>setDark(query.matches);query.addEventListener('change',change);const sync=()=>setPreference(readTheme());window.addEventListener('storage',sync);window.addEventListener('foodlens:theme',sync);return()=>{query.removeEventListener('change',change);window.removeEventListener('storage',sync);window.removeEventListener('foodlens:theme',sync);};},[]);
 function setTheme(value:Theme) {localStorage.setItem('foodlens.user.theme',value);setPreference(value);window.dispatchEvent(new Event('foodlens:theme'));}
 return {preference,resolved:preference==='system'?(dark?'dark':'light'):preference,setTheme};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = (await readFile(new URL('../src/api/client.ts', import.meta.url), 'utf8')).replace('import.meta.env.VITE_API_BASE_URL', 'undefined');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
const { api, ApiError } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const json = (body, status=200) => new Response(JSON.stringify(body), {status, headers:{'Content-Type':'application/json'}});
function mock(responses) {
 const calls=[];
 globalThis.fetch=async(url, options)=> {calls.push({url,options});assert.ok(responses.length, 'Unexpected extra HTTP request');return responses.shift();};
 return calls;
}
test('GET sends session cookie and no CSRF preflight', async()=>{
 const calls=mock([json([{id:7}])]);assert.deepEqual(await api('/foods'),[{id:7}]);
 assert.equal(calls.length,1);assert.equal(calls[0].url,'/api/foods');assert.equal(calls[0].options.credentials,'include');
});
test('Login uses form body and the header name supplied by the server', async()=>{
 const calls=mock([json({headerName:'X-CSRF-TOKEN',token:'before-login'}),json({message:'ok'})]);
 await api('/auth/login','POST',new URLSearchParams({email:'admin@example.test',password:'example-only'}));
 assert.equal(calls[0].url,'/api/auth/csrf');assert.equal(calls[1].options.headers.get('X-CSRF-TOKEN'),'before-login');
 assert.ok(calls[1].options.body instanceof URLSearchParams);assert.equal(calls[1].options.credentials,'include');
});
test('Next mutation gets a fresh token; JSON preserves nullable fiber and category reference',async()=>{
 const calls=mock([json({headerName:'X-CSRF-TOKEN',token:'after-login'}),json({id:42})]);
 await api('/foods','POST',{name:'Test',category:{id:7},fiber:null});
 assert.equal(calls[1].options.headers.get('X-CSRF-TOKEN'),'after-login');
 assert.equal(calls[1].options.headers.get('Content-Type'),'application/json');
 assert.deepEqual(JSON.parse(calls[1].options.body),{name:'Test',category:{id:7},fiber:null});
});
test('Image upload keeps FormData and lets browser supply multipart boundary',async()=>{
 const calls=mock([json({headerName:'X-CSRF-TOKEN',token:'image-token'}),json({food_detected:false,predictions:[]})]);
 const form=new FormData();form.append('file',new Blob(['sample'],{type:'image/png'}),'sample.png');
 await api('/ai/recognize','POST',form);
 assert.equal(calls[1].options.body,form);assert.equal(calls[1].options.headers.has('Content-Type'),false);
});
test('Logout accepts 204 without parsing empty JSON',async()=>{
 mock([json({headerName:'X-CSRF-TOKEN',token:'logout-token'}),new Response(null,{status:204})]);
 assert.equal(await api('/auth/logout','POST'),undefined);
});
test('401 on protected request notifies auth state and keeps backend message',async()=>{
 const events=[];globalThis.window={dispatchEvent:e=>events.push(e.type)};
 mock([json({message:'Bạn chưa đăng nhập'},401)]);
 await assert.rejects(api('/admin/users'),e=>e instanceof ApiError && e.status===401 && e.message==='Bạn chưa đăng nhập');
 assert.deepEqual(events,['foodlens:unauthorized']);
});
test('403 is surfaced once without automatically retrying a mutation',async()=>{
 const calls=mock([json({headerName:'X-CSRF-TOKEN',token:'token'}),json({message:'Không có quyền'},403)]);
 await assert.rejects(api('/foods/9','DELETE'),e=>e.status===403);assert.equal(calls.length,2);
});

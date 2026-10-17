import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {unzipSync,zipSync,strToU8,strFromU8} from 'fflate';
import {previewEnvironmentImport,environmentImportTemplate} from '../lib/environment-import.js';
const encoded=()=>Buffer.from(environmentImportTemplate()).toString('base64');
const change=fn=>{const files=unzipSync(environmentImportTemplate());files['xl/worksheets/sheet1.xml']=strToU8(fn(strFromU8(files['xl/worksheets/sheet1.xml'])));return Buffer.from(zipSync(files)).toString('base64')};
test('modelo importa dados e atualização por nome preserva identificadores e ausentes',()=>{
 const existing=[{id:'old',nome:'Sala 101',tipo:'sala',capacidade:20,ativo:false},{id:'keep',nome:'Sala preservada',tipo:'sala',capacidade:15,ativo:true}],before=structuredClone(existing),p=previewEnvironmentImport(encoded(),existing);assert.equal(p.created,1);assert.equal(p.updated,1);assert.equal(p.errors.length,0);assert.equal(p.items.length,3);assert.equal(p.items.find(a=>a.nome==='Sala 101').id,'old');assert.equal(p.items.find(a=>a.id==='old').capacidade,30);assert.deepEqual(p.items.find(a=>a.id==='keep'),existing[1]);assert.deepEqual(existing,before);
});
test('rejeita fórmulas, nomes duplicados, capacidade e disponibilidade inválidas',()=>{
 for(const mutate of [s=>s.replace('Laboratório de Informática','Sala 101'),s=>s.replace('<v>30</v>','<f>15+15</f><v>30</v>'),s=>s.replace('<v>30</v>','<v>0</v>'),s=>s.replace('Disponível','Talvez')])assert.ok(previewEnvironmentImport(change(mutate)).errors.length>0);
 assert.throws(()=>previewEnvironmentImport('arquivo inválido'),/xlsx/);assert.throws(()=>previewEnvironmentImport(change(s=>s.replace('Capacidade','Outra coluna'))),/cabeçalho/);
});
test('lê textos compartilhados do Excel e preserva nome e situação quando a célula está vazia',()=>{
 const files=unzipSync(environmentImportTemplate()),shared=[];
 files['xl/worksheets/sheet1.xml']=strToU8(strFromU8(files['xl/worksheets/sheet1.xml']).replace(/<c\b([^>]*?)t="inlineStr"><is><t>([\s\S]*?)<\/t><\/is><\/c>/g,(_,a,value)=>{shared.push(value);return `<c${a}t="s"><v>${shared.length-1}</v></c>`}));
 files['xl/sharedStrings.xml']=strToU8(`<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${shared.map(v=>`<si><t>${v}</t></si>`).join('')}</sst>`);
 const p=previewEnvironmentImport(Buffer.from(zipSync(files)).toString('base64'));assert.equal(p.errors.length,0);assert.equal(p.rows[1].nome,'Laboratório de Informática');
 const empty=change(s=>s.replace('Sala 101','SALA 101').replace('<t>Disponível</t>','<t></t>')),result=previewEnvironmentImport(empty,[{id:'old',nome:'Sala 101',tipo:'sala',capacidade:30,ativo:false}]);assert.equal(result.items[0].ativo,false);assert.equal(result.items[0].nome,'Sala 101');assert.equal(result.unchanged,1);
});
process.env.TURSO_DATABASE_URL='file:'+join(mkdtempSync(join(tmpdir(),'senai-import-')),'test.db');process.env.ADMIN_PASSWORD='senha-import-teste';process.env.SESSION_SECRET='segredo-import-teste';
const {handle}=await import('../lib/core.js');const call=(body,cookie)=>handle(new Request('http://local/api',{method:'POST',headers:{'content-type':'application/json',...cookie?{cookie}:{}},body:JSON.stringify(body)}));
const api=async(body,cookie)=>{const r=await call(body,cookie);assert.equal(r.status,200,await r.clone().text());return r.json()};
let master;
test('somente administrador acessa modelo, prévia e confirmação',async()=>{
 const r=await call({op:'login',password:process.env.ADMIN_PASSWORD});master=r.headers.get('set-cookie').split(';')[0];
 for(const role of ['coord','ambientes','docente']){await api({op:'user_add',login:role,nome:role,password:'senha-padrao-teste',role},master);const login=await call({op:'login',login:role,password:'senha-padrao-teste'}),cookie=login.headers.get('set-cookie').split(';')[0];for(const op of ['environment_import_preview','environment_import_apply'])assert.equal((await call({op,file:encoded(),base:0},cookie)).status,403);assert.equal((await handle(new Request('http://local/api?export=modelo-ambientes',{headers:{cookie}}))).status,403)}
 assert.equal((await call({op:'environment_import_apply',file:encoded(),base:0})).status,401);
});
test('prévia não grava; confirmação valida revisão, rejeita erros e registra importação',async()=>{
 await api({op:'environment_save',base:0,items:[{id:'old',nome:'Sala 101',tipo:'sala',capacidade:20,ativo:true}]},master);const p=await api({op:'environment_import_preview',file:encoded()},master);assert.equal(p.base,1);assert.equal((await api({op:'environment_list'},master)).items.length,1);
 const bad=change(s=>s.replace('Laboratório de Informática','Sala 101'));assert.equal((await call({op:'environment_import_apply',base:p.base,file:bad},master)).status,400);assert.equal((await api({op:'environment_list'},master)).items.length,1);
 await api({op:'environment_save',base:1,items:[{id:'old',nome:'Sala 101',tipo:'sala',capacidade:21,ativo:true}]},master);assert.equal((await call({op:'environment_import_apply',base:p.base,file:encoded()},master)).status,409);
 const fresh=await api({op:'environment_import_preview',file:encoded()},master);await api({op:'environment_import_apply',base:fresh.base,file:encoded()},master);const result=await api({op:'environment_list'},master);assert.equal(result.items.length,2);assert.equal(result.items.find(a=>a.nome==='Sala 101').id,'old');assert.equal(result.items.find(a=>a.id==='old').capacidade,30);
});

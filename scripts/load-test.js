// Carga exclusivamente local, em processo e banco temporários próprios.
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir,cpus,totalmem} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:net';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const profile=process.argv.find(a=>a.startsWith('--profile='))?.split('=')[1]||'mixed';assert.ok(['mixed','static','calendar','board','writes'].includes(profile),'Perfil inválido');
const holdMs=Number(process.argv.find(a=>a.startsWith('--hold-ms='))?.split('=')[1]||0);assert.ok(Number.isInteger(holdMs)&&holdMs>=0&&holdMs<=60000,'Duração de sustentação inválida (0 a 60000 ms).');
const project=fileURLToPath(new URL('../',import.meta.url)),out=join(project,'artifacts','carga',profile);mkdirSync(out,{recursive:true});
const temp=mkdtempSync(join(tmpdir(),'senai-carga-')),probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
const base=`http://127.0.0.1:${port}`,password=randomBytes(24).toString('hex');
const env=Object.fromEntries(['PATH','Path','SystemRoot','SYSTEMROOT','TEMP','TMP','USERPROFILE','LOCALAPPDATA'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
const server=spawn(process.execPath,['server.js'],{cwd:project,env:{...env,PORT:String(port),TURSO_DATABASE_URL:'file:'+join(temp,'carga.db'),ADMIN_PASSWORD:password,SESSION_SECRET:randomBytes(32).toString('hex')},stdio:['ignore','pipe','pipe']});
let output='',cookie='',ready=false;for(const stream of [server.stdout,server.stderr])stream.on('data',b=>{output=(output+b.toString()).slice(-20000);writeFileSync(join(out,'servidor.log'),output)});
const report={at:new Date().toISOString(),environment:{node:process.version,platform:process.platform,cpu:cpus()[0]?.model,logicalCpus:cpus().length,memoryGB:Math.round(totalmem()/1024**3),database:'SQLite/libsql local temporário',target:'Instância local exclusiva; sem serviços externos'},fixture:{turmas:30,docentes:20,ambientes:20,diasPorTurma:60},stages:[]};
const percentile=(xs,p)=>xs.length?xs[Math.min(xs.length-1,Math.ceil(xs.length*p)-1)]:0;
const summary=xs=>{const sorted=[...xs].sort((a,b)=>a-b);return {p50:percentile(sorted,.5),p95:percentile(sorted,.95),p99:percentile(sorted,.99),max:sorted.at(-1)||0}};
const api=async body=>{const r=await fetch(base+'/api',{method:'POST',headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});const data=await r.json();return {r,data}};
const states=[];
async function stage(name,concurrency,durationMs,request){
 const times=[],byEndpoint={},statuses={},errors={};let bytes=0;const start=performance.now(),end=start+durationMs;
 const outcomes=await Promise.allSettled(Array.from({length:concurrency},async(_,worker)=>{let n=0;while(performance.now()<end){if(server.exitCode!==null||server.signalCode!==null)throw Error('Servidor encerrou durante a carga; consulte servidor.log');const at=performance.now();let endpoint='request';try{const result=await request(worker,n++);endpoint=result.endpoint;statuses[result.status]=(statuses[result.status]||0)+1;bytes+=result.bytes||0;if(!result.valid)errors['HTTP ou conteúdo inesperado']=(errors['HTTP ou conteúdo inesperado']||0)+1}catch(e){errors[e.name]=(errors[e.name]||0)+1}const ms=performance.now()-at;times.push(ms);(byEndpoint[endpoint]||=[]).push(ms)}}));
 const elapsed=(performance.now()-start)/1000,total=times.length,failed=Object.values(errors).reduce((a,b)=>a+b,0),result={name,concurrency,durationSeconds:+elapsed.toFixed(2),requests:total,requestsPerSecond:+(total/elapsed).toFixed(2),errors:failed,errorPercent:+(100*failed/total).toFixed(2),statuses,errorTypes:errors,receivedMB:+(bytes/1024**2).toFixed(2),latencyMs:summary(times),endpoints:Object.fromEntries(Object.entries(byEndpoint).map(([k,v])=>[k,{requests:v.length,...summary(v)}]))};const aborted=outcomes.find(x=>x.status==='rejected');if(aborted)result.aborted=aborted.reason.message;report.stages.push(result);writeFileSync(join(out,'resultado.json'),JSON.stringify(report,null,2));console.log(`${name}: concorrência=${concurrency}, ${total} requisições, ${result.requestsPerSecond} req/s, p95=${result.latencyMs.p95.toFixed(1)}ms, erros=${failed}`);if(aborted)throw aborted.reason;
}
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(ready,'Servidor temporário não iniciou');
 const login=await api({op:'login',password});assert.equal(login.r.status,200);cookie=login.r.headers.get('set-cookie').split(';')[0];
 assert.equal((await api({op:'set',id:'geral',base:0,data:{docentes:Array.from({length:20},(_,i)=>({nome:'Docente carga '+i,matricula:String(1000+i)}))}})).r.status,200);
 assert.equal((await api({op:'environment_save',base:0,items:Array.from({length:20},(_,i)=>({id:'lab-'+i,nome:'Laboratório carga '+i,tipo:'laboratorio',capacidade:30,ativo:true}))})).r.status,200);
 for(let i=0;i<30;i++){
  const days=Object.fromEntries(Array.from({length:60},(_,j)=>[new Date(Date.UTC(2027,2,1+j)).toISOString().slice(0,10),{s:['LOG','LOG','LOG','LOG']}]));
  const state={cfg:{turma:'CARGA-'+i,curso:'Curso de validação de carga',turno:['Matutino','Vespertino','Noturno'][i%3],aulasDia:4,inicio:'2027-03-01',termino:'2027-05-31'},ucs:[{sigla:'LOG',nome:'Lógica',ch:240,docente:'Docente carga '+i%20,sala:'Laboratório carga '+i%20}],days,reg:{}};states.push(state);assert.equal((await api({op:'set',id:'turma-carga-'+i,base:0,data:{state}})).r.status,200);
 }
 const request=async(kind)=>{const opts=kind==='static'?{}:kind==='calendar'?{headers:{cookie}}:{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify(kind==='board'?{op:'daily_board',data:'2027-03-01'}:{op:'notification_list'})};const r=await fetch(base+(kind==='static'?'/': '/api'),{...opts,signal:AbortSignal.timeout(15000)}),buf=await r.arrayBuffer();let valid=r.status===200;if(kind!=='static'){const data=JSON.parse(Buffer.from(buf).toString());valid&&=kind==='calendar'?Array.isArray(data.docs)&&data.docs.filter(d=>d.id.startsWith('turma-')).length===30:Array.isArray(data.items)}return {endpoint:kind,status:r.status,bytes:buf.byteLength,valid}};
 await stage('Aquecimento',2,2000,(w,n)=>request(profile==='mixed'?(n%2?'calendar':'board'):profile==='writes'?'calendar':profile));
 if(profile!=='writes')for(const concurrency of [1,10,25,50])await stage(profile==='mixed'?'Leituras mistas':profile,concurrency,6000,(w,n)=>request(profile==='mixed'?['static','calendar','board','notifications'][(w+n)%4]:profile));
 if(holdMs&&profile!=='writes')await stage('Sustentação '+profile,50,holdMs,(w,n)=>request(profile==='mixed'?['static','calendar','board','notifications'][(w+n)%4]:profile));
 if(profile==='mixed'||profile==='writes'){
 const revisions=Array(10).fill(1);
 await stage('Gravações em turmas distintas',10,5000,async(w,n)=>{const state={...states[w],cfg:{...states[w].cfg,curso:'Carga revisão '+n}};const {r,data}=await api({op:'set',id:'turma-carga-'+w,base:revisions[w],data:{state}});if(r.status===200)revisions[w]=data.rev;return {endpoint:'save',status:r.status,valid:r.status===200&&data.rev===n+2}});
 const before=(await(await fetch(base+'/api',{headers:{cookie}})).json()).docs.find(d=>d.id==='turma-carga-0');
 const conflicting=await Promise.all(Array.from({length:25},(_,i)=>api({op:'set',id:before.id,base:before.rev,data:{state:{...states[0],cfg:{...states[0].cfg,curso:'Edição concorrente '+i}}}})));
 const successes=conflicting.filter(x=>x.r.status===200),conflicts=conflicting.filter(x=>x.r.status===409);assert.equal(successes.length,1);assert.equal(conflicts.length,24);
 const finalDocs=(await(await fetch(base+'/api',{headers:{cookie}})).json()).docs;const final=finalDocs.find(d=>d.id===before.id);assert.equal(final.rev,before.rev+1);assert.equal(final.data.state.cfg.curso,'Edição concorrente '+conflicting.findIndex(x=>x.r.status===200));assert.equal(finalDocs.filter(d=>d.id.startsWith('turma-')).length,30);
 report.integrity={parallelEdits:25,saved:successes.length,expectedConflicts:conflicts.length,revisionCorrect:final.rev===before.rev+1,allTurmasPresent:true};
 }
 report.completed=true;report.unexpectedErrors=report.stages.reduce((n,s)=>n+s.errors,0);if(report.unexpectedErrors)process.exitCode=1;
}catch(e){report.failure=e.stack;console.error(e);process.exitCode=1}
finally{
 if(server.exitCode===null&&server.signalCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done}
 report.serverExit={code:server.exitCode,signal:server.signalCode};report.serverErrors=output.split('\n').filter(l=>/error|exception|fatal/i.test(l)).slice(-10);writeFileSync(join(out,'servidor.log'),output);writeFileSync(join(out,'resultado.json'),JSON.stringify(report,null,2));
 if(dirname(resolve(temp))!==resolve(tmpdir())||!basename(temp).startsWith('senai-carga-'))throw Error('Diretório temporário inesperado');rmSync(temp,{recursive:true,force:true});
}

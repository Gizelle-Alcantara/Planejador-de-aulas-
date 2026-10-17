import { blocksForDay,isEAD } from "./schedule.js";
// Agenda anual por docente, preenchida no modelo enviado pelo usuário.
import {excelTemplate} from './excel-templates.js';
import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
const xml=v=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"}[x]));
const col=n=>{let s='';for(;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
const ci=s=>[...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
const serial=d=>(Date.parse(d+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000;
const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const date=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const rowCells=r=>[...r.matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g)];
function template(){return excelTemplate('docente')}
export function teacherCalendarData(docs,nome,year){
 const y=Number(year);if(!Number.isInteger(y)||y<1900||y>2100)throw new Error('Escolha um ano entre 1900 e 2100.');
 const docente=(docs.geral?.docentes||[]).find(d=>d.nome===nome);if(!docente)throw new Error('Docente não encontrado.');
 const subjects=[],entries=[],holidays=new Set(),notes=new Map();
 for(const [id,doc] of Object.entries(docs)){
  if(!id.startsWith('turma-')||!doc.state)continue;const st=doc.state,c=st.cfg||{};
  for(const [iso,d] of Object.entries(st.days||{}))if(valid(iso)&&Number(iso.slice(0,4))===y&&d.t==='feriado')holidays.add(iso);
  for(const uc of st.ucs||[]){if(uc.docente!==nome)continue;if(!uc.sigla||!Number.isFinite(Number(uc.ch||0))||Number(uc.ch||0)<0)throw new Error(`Verifique a sigla e a carga horária da disciplina ${uc.nome||''} na turma ${c.turma||id}.`);const dates=Object.entries(st.days||{}).filter(([iso,d])=>valid(iso)&&Number(iso.slice(0,4))===y&&(d.s||[]).includes(uc.sigla)&&st.reg?.[iso]?.dado!=='nao').map(([iso])=>iso).sort();
   if(!dates.length&&!(valid(c.inicio)&&valid(c.termino)&&c.inicio<=`${y}-12-31`&&c.termino>=`${y}-01-01`))continue;
   const key=subjects.length,subject={key,uc,c,id,dates,allocated:0};subjects.push(subject);
   const count=Number(c.aulasDia)||4;if(!Number.isInteger(count)||count<1||count>12)throw new Error(`Quantidade de aulas por dia inválida na turma ${c.turma}.`);
   for(const iso of dates){const day=st.days[iso],sigs=day.s||[];if(day.h)notes.set(iso,day.h);
    // O planejador registra as UCs do dia, sem divisão por horário. Duas UCs do mesmo docente são um conflito explícito.
    for(const block of blocksForDay(st,iso).filter(b=>b.sigla===uc.sigla))for(const aula of block.aulas){const i=aula-1;const shift=c.turno==='Diurno'?(i<Math.min(4,count)?0:1):/Matutino/i.test(c.turno)?0:/Vespertino/i.test(c.turno)?1:2;const slot=c.turno==='Diurno'&&shift===1?i-Math.min(4,count):i;entries.push({iso,shift,slot,key,sigla:uc.sigla,turma:c.turma||id,cancelled:false,conflict:!isEAD(uc)&&blocksForDay(st,iso).some(other=>other.sigla!==uc.sigla&&other.inicio<block.fim&&block.inicio<other.fim&&(st.ucs||[]).some(u=>u.sigla===other.sigla&&u.docente===nome))});subject.allocated++}
   }
  }
 }
 const repeated=new Map();for(const s of subjects)repeated.set(s.uc.sigla,(repeated.get(s.uc.sigla)||0)+1);
 const taken=new Set(),suffix=new Map();for(const s of subjects){suffix.set(s.uc.sigla,(suffix.get(s.uc.sigla)||0)+1);let label=repeated.get(s.uc.sigla)>1?`${s.uc.sigla}.${suffix.get(s.uc.sigla)}`:s.uc.sigla;if(taken.has(label))label+=` #${s.key+1}`;taken.add(label);s.label=label}
 const cells=new Map();for(const e of entries){const key=`${e.iso}/${e.shift}/${e.slot}`;(cells.get(key)||cells.set(key,[]).get(key)).push(e)}
 return {y,docente,subjects,entries,cells,holidays,notes,slots:[Math.max(5,...entries.filter(e=>e.shift===0).map(e=>e.slot+1)),Math.max(5,...entries.filter(e=>e.shift===1).map(e=>e.slot+1)),Math.max(4,...entries.filter(e=>e.shift===2).map(e=>e.slot+1))]};
}
export function teacherCalendarXlsx(docs,nome,year,contract=''){
 if(!['','Mensalista','Horista','Intermitente','RSA'].includes(contract))throw new Error('Vínculo do docente inválido.');
 const data=teacherCalendarData(docs,nome,year),{y,docente,subjects,entries,cells,holidays,slots}=data;
 const files=unzipSync(new Uint8Array(template())),source=strFromU8(files['xl/worksheets/sheet1.xml']);
 const shared=[...strFromU8(files['xl/sharedStrings.xml']||strToU8('<sst/>')).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m=>decode([...m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>t[1]).join('')));
 const oldRows=new Map([...source.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>[\s\S]*?<\/row>/g)].map(m=>[Number(m[1]),m[0]]));
 const styles=new Map(rowCells(source).map(m=>[m[1],m[0].match(/\bs="(\d+)"/)?.[1]||'0']));
 const styleSource=strFromU8(files['xl/styles.xml']),xfBody=styleSource.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/)[1],xfs=[...xfBody.matchAll(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)].map(m=>m[0]),blockedStyles=new Map(),bandStyles=new Map();
 const fill=xfs[Number(styles.get('U4'))].match(/fillId="(\d+)"/)[1];
 for(const sample of [10,11,20,21,30,31]){const base=xfs[Number(styles.get('D'+sample))],style=String(xfs.length);xfs.push(base.replace(/fillId="\d+"/,`fillId="${fill}"`));blockedStyles.set(sample,style)}
 for(const sample of [10,20,30]){const base=xfs[Number(styles.get('A'+sample))],style=String(xfs.length);xfs.push(base.replace(/<alignment([^>]*)\/>/,(_,attrs)=>`<alignment${attrs.replace(/\stextRotation="[^"]*"/,'')} textRotation="90"/>`));bandStyles.set(sample,style)}
 files['xl/styles.xml']=strToU8(styleSource.replace(/<cellXfs[^>]*>[\s\S]*?<\/cellXfs>/,`<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>`));
 const cell=(ref,v,style=styles.get(ref)||'0')=>{const start=`<c r="${ref}" s="${style}"`;if(v==null||v==='')return start+'/>';if(typeof v==='object')return start+(typeof v.cached==='string'?' t="str"':'')+`><f>${xml(v.formula)}</f><v>${xml(v.cached)}</v></c>`;return typeof v==='number'?start+`><v>${v}</v></c>`:start+` t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`};
 const extra=slots.reduce((a,n)=>a+n,0)*2-28,block=32+extra,summary=391+12*extra,first=summary+3,last=first+Math.max(35,subjects.length)-1;
 const rows=[],merges=[];const formula=(formula,cached)=>({formula,cached});
 const emit=(n,sample,values)=>{let attrs=(oldRows.get(sample)||'<row r="1"></row>').match(/^<row([^>]*)>/)[1].replace(/\br="\d+"/,`r="${n}"`).replace(/\shidden="[^"]*"/g,'').replace(/\sspans="[^"]*"/g,'');const vals=[...values].sort((a,b)=>ci(a[0])-ci(b[0]));rows.push(`<row${attrs}>${vals.map(([c,v,style])=>cell(c+n,v,style??styles.get(c+sample))).join('')}</row>`)};
 for(let r=1;r<=6;r++){const values=rowCells(oldRows.get(r)||'').map(m=>{const c=m[1].match(/^[A-Z]+/)[0],f=m[0].match(/<f[^>]*>([\s\S]*?)<\/f>/),v=m[0].match(/<v>([\s\S]*?)<\/v>/)?.[1];return[c,f?formula(decode(f[1]),''):m[0].includes('t="s"')?shared[Number(v)]:v==null?'':Number(v),styles.get(m[1])]});const updates={D2:nome,D3:docente.emailInstitucional||docente.email||'',D4:docente.meuSenai||'',M2:contract};for(const [ref,v] of Object.entries(updates))if(Number(ref.match(/\d+$/)[0])===r){const c=ref.match(/^[A-Z]+/)[0],found=values.find(x=>x[0]===c);if(found)found[1]=v;else values.push([c,v])}emit(r,r,values)}
 // Keep header/legend merges; calendar merges are recreated for independent daily slots.
 for(const m of source.matchAll(/<mergeCell ref="([^"]+)"\/>/g)){const ref=m[1],r=Number(ref.match(/\d+/)[0]);if(r<7)merges.push(ref)}
 let conflicts=0;
 for(let month=1;month<=12;month++){
  const base=7+(month-1)*block,dim=new Date(Date.UTC(y,month,0)).getUTCDate(),available=[];const total=entries.filter(e=>Number(e.iso.slice(5,7))===month).length;
  for(let d=1;d<=31;d++){const iso=date(y,month,d),wd=d<=dim?new Date(iso+'T00:00:00Z').getUTCDay():0,blocked=(docente.semana||[]).includes(wd)||(docente.bloqueios||[]).some(b=>b.de&&iso>=b.de&&iso<=(b.ate||b.de));available.push(d<=dim&&wd>0&&wd<6&&!blocked&&!holidays.has(iso)?1:0)}
  const avail=available.reduce((a,n)=>a+n,0),max=contract==='Mensalista'?avail*8:contract==='Horista'?90:contract==='Intermitente'?Math.floor(avail*8*.909):'',occup=max?total/max:'';
  const values=[['A',serial(date(y,month,1))],['N','DIAS DISPONÍVEIS:'],['R',formula(`SUM(AJ${base}:BN${base})`,avail)],['S','AULAS ALOCADAS:'],['W',formula(`SUM(AI${base+3}:AI${base+block-2})`,total)],['X','ALOCAÇÃO MÁXIMA:'],['AB',formula(`IF($M$2="Mensalista",R${base}*8,IF($M$2="Horista",90,IF($M$2="Intermitente",ROUNDDOWN(R${base}*8*0.909,0),"")))`,max)],['AC','% DE OCUPAÇÃO:'],['AF',formula(`IF(OR(AB${base}="",AB${base}=0),"",W${base}/AB${base})`,occup)]];
  available.forEach((v,i)=>values.push([col(36+i),v,'0']));emit(base,7,values);
  for(const r of [base+1,base+2]){const sample=r===base+1?8:9,v=[];for(let d=1;d<=31;d++){const iso=date(y,month,d),wd=d<=dim?new Date(iso+'T00:00:00Z').getUTCDay():1,src=wd===6?'E':wd===0?'F':'D';v.push([col(d+2),d<=dim?serial(iso):'',styles.get(src+sample)])}emit(r,sample,v)}
  const startRow=[base+3,base+3+slots[0]*2,base+3+(slots[0]+slots[1])*2];
  for(let shift=0;shift<3;shift++)for(let slot=0;slot<slots[shift];slot++){
   const r=startRow[shift]+slot*2,sample=shift===0?10:shift===1?20:30,top=[['A',slot===0?['MANHÃ','TARDE','NOITE'][shift]:'',bandStyles.get(sample)],['B',`AULA ${slot+1}`]],bottom=[['A',''],['B','']];let rowCount=0;
   for(let d=1;d<=31;d++){const iso=date(y,month,d),wd=d<=dim?new Date(iso+'T00:00:00Z').getUTCDay():1,blocked=(docente.semana||[]).includes(wd)||(docente.bloqueios||[]).some(b=>b.de&&iso>=b.de&&iso<=(b.ate||b.de)),as=d<=dim?cells.get(`${iso}/${shift}/${slot}`)||[]:[],sampleCol=holidays.has(iso)?'C':blocked?'G':wd===6?'E':wd===0?'F':'D';let label=as.map(a=>subjects[a.key].label).join(' + ');if(as.length>1&&!isEAD({docente:nome})){label='CONFLITO: '+label;conflicts++}
    top.push([col(d+2),label||((holidays.has(iso)||blocked)&&slot===0?holidays.has(iso)?'Feriado':'Indisponível':''),blocked&&!holidays.has(iso)?blockedStyles.get(sample):styles.get(sampleCol+sample)]);
    bottom.push([col(d+2),as.length?[...new Set(as.map(a=>a.turma))].join(' / '):'',blocked&&!holidays.has(iso)?blockedStyles.get(sample+1):styles.get(sampleCol+(sample+1))]);rowCount+=as.length;
   }
   // Counting each daily cell remains editable; conflicts keep both lessons in the count.
   const countFormula=Array.from({length:31},(_,i)=>{const ref=col(i+3)+r;return `IF(OR(${ref}="",${ref}="Feriado",${ref}="Indisponível"),0,IF(ISNUMBER(SEARCH(" + ",${ref})),1+(LEN(${ref})-LEN(SUBSTITUTE(${ref}," + ","")))/3,1))`}).join('+');top.push(['AI',formula(countFormula,rowCount),'0']);emit(r,sample,top);emit(r+1,sample+1,bottom);merges.push(`B${r}:B${r+1}`);
  }
  for(let shift=0;shift<3;shift++)merges.push(`A${startRow[shift]}:A${startRow[shift]+slots[shift]*2-1}`);
  merges.push(`A${base}:M${base}`,`N${base}:Q${base}`,`S${base}:V${base}`,`X${base}:AA${base}`,`AC${base}:AE${base}`,`AF${base}:AG${base}`);emit(base+block-1,38,[]);
 }
 // Summary retains the same columns as the supplied model. Duplicate UC siglas receive a turma suffix.
 for(let n=0;n<3;n++){const sample=391+n,values=rowCells(oldRows.get(sample)||'').filter(m=>ci(m[1].match(/^[A-Z]+/)[0])<=33).map(m=>{const c=m[1].match(/^[A-Z]+/)[0],v=m[0].match(/<v>(.*?)<\/v>/)?.[1];return[c,m[0].includes('t="s"')?shared[Number(v)]:'',styles.get(m[1])]});if(n===2){for(const c of ['M','AC','AE']){const sum=c==='M'?subjects.reduce((a,s)=>a+Number(s.uc.ch||0),0):c==='AC'?entries.length:subjects.reduce((a,s)=>a+Math.max(0,Math.ceil(Number(s.uc.ch||0)*60/(s.c.turno==='Matutino NEM'?50:60))-s.allocated),0);const item=values.find(x=>x[0]===c);if(item)item[1]=formula(`SUM(${c}${first}:${c}${last})`,sum);else values.push([c,formula(`SUM(${c}${first}:${c}${last})`,sum)])}}emit(summary+n,sample,values)}
 const topRows=[];for(let month=0;month<12;month++)for(let i=0;i<slots.reduce((a,n)=>a+n,0);i++)topRows.push(7+month*block+3+i*2);
 const end=7+11*block+block-2;
 for(let i=0;i<Math.max(35,subjects.length);i++){const r=first+i,s=subjects[i],v=[];if(s){const {uc,c,dates,allocated,label}=s,need=Math.ceil(Number(uc.ch||0)*60/(c.turno==='Matutino NEM'?50:60)),status=dates.length?(new Date(Date.now()-3*3600e3).toISOString().slice(0,10)<dates[0]?'PLANEJADA':new Date(Date.now()-3*3600e3).toISOString().slice(0,10)>dates.at(-1)?'CONCLUÍDA':'EM ANDAMENTO'):'PLANEJADA';const escaped=`SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(K${r},"~","~~"),"*","~*"),"?","~?")`;topRows.forEach((n,j)=>v.push([col(36+j),formula(`COUNTIF($C$${n}:$AG$${n},${escaped})+COUNTIF($C$${n}:$AG$${n},"CONFLITO: "&${escaped}&" + *")+COUNTIF($C$${n}:$AG$${n},"CONFLITO: * + "&${escaped})+COUNTIF($C$${n}:$AG$${n},"CONFLITO: * + "&${escaped}&" + *")`.replaceAll('CONFLITO: ',isEAD({docente:nome})?'':'CONFLITO: '),entries.filter(e=>e.key===s.key&&7+(Number(e.iso.slice(5,7))-1)*block+3+(e.shift===0?0:e.shift===1?slots[0]*2:(slots[0]+slots[1])*2)+e.slot*2===n).length),'0']));const sums=`SUM(AJ${r}:${col(35+topRows.length)}${r})`;
   for(const [c0,value] of Object.entries({A:uc.nome,K:label,M:Number(uc.ch)||0,N:c.curso||'',S:c.turma||s.id,V:c.turno||'',X:dates.length?serial(dates[0]):'-',Y:dates.length?serial(dates.at(-1)):'-',Z:formula(`IF(X${r}="-","PLANEJADA",IF(X${r}>TODAY(),"PLANEJADA",IF(Y${r}<TODAY(),"CONCLUÍDA","EM ANDAMENTO")))`,status),AC:formula(sums,allocated),AE:formula(`MAX(0,ROUNDUP(M${r}*60/IF(V${r}="Matutino NEM",50,60),0)-AC${r})`,Math.max(0,need-allocated)),AG:formula(`IF(AC${r}=ROUNDUP(M${r}*60/IF(V${r}="Matutino NEM",50,60),0),"OK",IF(AC${r}>ROUNDUP(M${r}*60/IF(V${r}="Matutino NEM",50,60),0),"EXCEDIDO","PENDENTE"))`,allocated===need?'OK':allocated>need?'EXCEDIDO':'PENDENTE')}))v.push([c0,value,styles.get(c0+'394')]);
  }else for(let c0=1;c0<=33;c0++)v.push([col(c0),'',styles.get(col(c0)+'394')]);emit(r,394,v);merges.push(...['A:J','K:L','N:R','S:U','V:W','Z:AB','AE:AF'].map(x=>{const[a,b]=x.split(':');return `${a}${r}:${b}${r}`}))}
 for(const m of source.matchAll(/<mergeCell ref="([^"]+)"\/>/g)){const ref=m[1],r=Number(ref.match(/\d+/)[0]);if(r>=391&&r<=393)merges.push(ref.replace(/\d+/g,n=>String(Number(n)+12*extra)))}
 let sheet=source.replace(/<sheetData>[\s\S]*?<\/sheetData>/,`<sheetData>${rows.join('')}</sheetData>`).replace(/<dimension[^>]*\/>/,`<dimension ref="A1:${col(Math.max(66,35+topRows.length))}${last}"/>`).replace(/<mergeCells[^>]*>[\s\S]*?<\/mergeCells>/,`<mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`).replace(/<hyperlinks>[\s\S]*?<\/hyperlinks>/,'').replace(/<legacyDrawing[^>]*\/>/,'').replace(/<conditionalFormatting\b[^>]*>[\s\S]*?<\/conditionalFormatting>/g,'').replace(/<dataValidations[^>]*>[\s\S]*?<\/dataValidations>/,`<dataValidations count="1"><dataValidation type="list" allowBlank="1" sqref="M2"><formula1>"Mensalista,Horista,Intermitente,RSA"</formula1></dataValidation></dataValidations>`);
 sheet=sheet.replace(/<pageSetup[^>]*\/>/,'<pageSetup paperSize="9" fitToWidth="1" fitToHeight="0" orientation="landscape"/>');files['xl/worksheets/sheet1.xml']=strToU8(sheet);
 let wb=strFromU8(files['xl/workbook.xml']).replace(/<sheet name="[^"]*"/g,`<sheet name="${y}"`).replace(/<definedNames>[\s\S]*?<\/definedNames>/,'').replace(/<calcPr[^>]*\/>/,'<calcPr calcId="191028" fullCalcOnLoad="1" forceFullCalc="1"/>').replace(/<mc:AlternateContent\b[^>]*>[\s\S]*?<\/mc:AlternateContent>/,'');
 wb=wb.replace('</sheets>',`</sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">'${y}'!$A$1:$AG$${last}</definedName></definedNames>`);files['xl/workbook.xml']=strToU8(wb);
 const discarded=['xl/calcChain.xml','xl/sharedStrings.xml',...Object.keys(files).filter(p=>/comments|threadedComment|persons\/|vmlDrawing/i.test(p))];for(const p of discarded)delete files[p];
 for(const p of Object.keys(files).filter(p=>p.endsWith('.rels'))){files[p]=strToU8(strFromU8(files[p]).replace(/<Relationship\b[^>]*\/>/g,r=>/\/calcChain"|\/sharedStrings"|\/comments"|\/threadedComment"|\/person"|\/vmlDrawing"|\/hyperlink"/.test(r)?'':r))}
 files['[Content_Types].xml']=strToU8(strFromU8(files['[Content_Types].xml']).replace(/<Override\b[^>]*\/>/g,r=>discarded.some(p=>r.includes(`PartName="/${p}"`))?'':r));
 return zipSync(files,{level:6});
}

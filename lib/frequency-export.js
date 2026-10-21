import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import {excelTemplate} from './excel-templates.js';
const xml=v=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const labels={draft:'Rascunho — pendente de envio',submitted:'Enviada — aguardando validação',returned:'Devolvida para ajustes',validated:'Validada pela coordenação'};
function patchSheet(source,values){
 source=source.replace(/(<\/?)(?:x:)/g,'$1').replace('xmlns:x=','xmlns=');
 const cells=new Map([...source.matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g)].map(m=>[m[1],m[0]]));
 const rows=new Map([...source.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g)].map(m=>[Number(m[1]),m[0]]));
 for(const [ref,value] of Object.entries(values)){
  const old=cells.get(ref)||'',style=old.match(/\bs="(\d+)"/)?.[1]||'0';
  let cell;if(value&&typeof value==='object'&&value.formula)cell=`<c r="${ref}" s="${style}"><f>${xml(value.formula)}</f><v>${value.value}</v></c>`;
  else if(value==='')cell=`<c r="${ref}" s="${style}"/>`;
  else if(typeof value==='number')cell=`<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  else cell=`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  cells.set(ref,cell);const row=Number(ref.match(/\d+/)[0]);if(!rows.has(row))rows.set(row,`<row r="${row}" ht="32" customHeight="1"></row>`);
 }
 const index=ref=>[...ref.match(/^[A-Z]+/)[0]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
 const content=[...rows].sort((a,b)=>a[0]-b[0]).map(([number,old])=>{
  const cellsInRow=[...cells].filter(([ref])=>Number(ref.match(/\d+/)[0])===number).sort((a,b)=>index(a[0])-index(b[0])).map(([,value])=>value).join('');
  let header=old.slice(0,old.indexOf('>')).replace(/\/$/,'');
  const note=String(values['H'+number]||'');if(note.length>40){header=header.replace(/ ht="[^"]*"/,'').replace(/ customHeight="[^"]*"/,'');header+=' ht="'+Math.max(23,Math.ceil(note.length/40)*17)+'" customHeight="1"';}
  return header+'>'+cellsInRow+'</row>';
 }).join('');
 return source.replace(/<sheetData\b[^>]*>[\s\S]*?<\/sheetData>/,`<sheetData>${content}</sheetData>`).replace(/<dimension\b[^>]*\/>/,'');
}
export function frequencyXlsx(sheet){
 const files=unzipSync(new Uint8Array(excelTemplate('frequencia'))),[year,month]=sheet.month.split('-').map(Number);
 const values={B4:sheet.teacher.matricula,D4:'HORISTA',H4:sheet.month,B5:sheet.teacher.nome,B6:sheet.teacher.unidade,B8:sheet.teacher.unidade,A43:labels[sheet.status],B46:sheet.submission?sheet.teacher.nome+' · '+sheet.submission.at:'Não enviada',I46:sheet.validation?sheet.validation.name+' · '+sheet.validation.at:'Não validada'};
 const daysInMonth=new Date(Date.UTC(year,month,0)).getUTCDate();
 for(let day=1;day<=31;day++){
  const row=day+10,date=`${sheet.month}-${String(day).padStart(2,'0')}`,data=sheet.days.find(d=>d.date===date),periods=data?.periods||[];
  values['A'+row]=day<=daysInMonth?day:'';
  for(const [i,col] of ['B','C','D','E'].entries())values[col+row]=periods[Math.floor(i/2)]?.[i%2]!=null?periods[Math.floor(i/2)][i%2]/1440:'';
  values['F'+row]=data&&sheet.submission?'Conferido no envio':'';
  values['H'+row]=data?[(data.open?'Devolução pendente. ':''),(data.tooMany?'Mais de dois períodos — revisar. ':''),data.note].join(''):'';
  values['L'+row]={formula:`SUM(C${row}-B${row},E${row}-D${row})`,value:(data?.minutes||0)/1440};
  // In drafts with >2 periods, preserve the actual total rather than truncate it.
  if(data?.tooMany)values['L'+row]=data.minutes/1440;
 }
 values.C47={formula:'SUM(L11:L41)',value:sheet.totalMinutes/1440};
 files['xl/worksheets/sheet1.xml']=strToU8(patchSheet(strFromU8(files['xl/worksheets/sheet1.xml']),values));
 const audit={};let row=2;
 for(const day of sheet.days){for(const source of day.sources){const cells=[day.date,source.keyCode,source.turma,source.disciplina,source.pickupAt,source.returnAt||'Pendente',source.pickupEventId,source.returnEventId||'',day.adjustment?.note||'',day.adjustment?.by||''];cells.forEach((v,i)=>audit[String.fromCharCode(65+i)+row]=v);row++;}}
 for(const event of sheet.audit){const cells=[event.at,'Histórico','','',event.action,'','','',JSON.stringify(event.detail),event.by];cells.forEach((v,i)=>audit[String.fromCharCode(65+i)+row]=v);row++;}
 files['xl/worksheets/sheet2.xml']=strToU8(patchSheet(strFromU8(files['xl/worksheets/sheet2.xml']),audit));
 files['xl/workbook.xml']=strToU8(strFromU8(files['xl/workbook.xml']).replace(/<calcPr\b[^>]*\/>/,'<calcPr calcId="191029" fullCalcOnLoad="1"/>'));
 return Buffer.from(zipSync(files,{level:6}));
}

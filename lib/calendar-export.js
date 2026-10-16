import { blocksForDay } from "./schedule.js";
// Preenche o pacote OOXML original. Mantém estilos, imagens, dimensões e a estrutura mensal SENAI.
import { excelTemplate } from './excel-templates.js';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { horarios } from './ics.js';
function templateBytes(){
  return excelTemplate('senai');
}
const xml = value => String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const serial = date => Math.round((Date.parse(date+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000);
const column = n => {let out='';for(;n;n=Math.floor((n-1)/26))out=String.fromCharCode(65+(n-1)%26)+out;return out};
const colIndex = name => [...name].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
const validDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
export function calendarData(state, reservations=[], includeOutside=false) {
  const c=state?.cfg?{...state.cfg}:null;
  if(!c||!validDate(c.inicio)||!validDate(c.termino)||c.inicio>c.termino)throw new Error('Defina início e término válidos na aba Turma antes de exportar.');
  if(includeOutside){const dates=Object.entries(state.days||{}).filter(([d,v])=>validDate(d)&&(v.s||[]).length).map(([d])=>d).sort();if(dates.length){c.inicio=c.inicio<dates[0]?c.inicio:dates[0];c.termino=c.termino>dates.at(-1)?c.termino:dates.at(-1)}}
  if(Number(c.termino.slice(0,4))-Number(c.inicio.slice(0,4))>10)throw new Error('O período de exportação deve ter até 10 anos.');
  const ucs=(state.ucs||[]),records=[];
  for(const [data,day] of Object.entries(state.days||{}).sort()) {
    if(!validDate(data)||data<c.inicio||data>c.termino)continue;
    const cancelled=state.reg?.[data]?.dado==='nao';
    for(const block of blocksForDay(state,data,true)) {
      const {sigla,inicio,fim,quantidade,bloco}=block;
      const uc=ucs.find(u=>u.sigla===sigla);if(!uc)continue;
      const reservation=reservations.find(r=>r.status==='aprovada'&&r.data===data&&r.sigla===sigla&&(!r.bloco||r.inicio===inicio&&r.fim===fim));
      records.push({data,sigla,inicio,fim,quantidade,bloco,disciplina:uc.nome,docente:uc.docente||'',sala:reservation?.ambienteNome||uc.sala||c.local||'',cancelada:cancelled,observacao:[day.h,cancelled?'Aula não realizada':'',reservation?'Reserva aprovada':''].filter(Boolean).join(' · ')});
    }
  }
  return {c,ucs,records};
}
export function calendarXlsx(state, reservations=[], includeOutside=false) {
  const {c,ucs,records}=calendarData(state,reservations,includeOutside), files=unzipSync(new Uint8Array(templateBytes()));
  const source=strFromU8(files['xl/worksheets/sheet1.xml']),wb=strFromU8(files['xl/workbook.xml']),styles=new Map();
  const oldRows=[...source.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>[\s\S]*?<\/row>/g)].map(m=>({n:Number(m[1]),xml:m[0]}));
  for(const m of source.matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g))styles.set(m[1],m[0].match(/\bs="(\d+)"/)?.[1]||'0');
  const lastRow=Math.max(141,123+ucs.length),activeRecords=records.filter(r=>!r.cancelada),countMap=new Map(ucs.map(u=>[u.sigla,activeRecords.filter(r=>r.sigla===u.sigla)]));
  const makeCell=(ref,value,style=styles.get(ref)||'0')=>{
    const start=`<c r="${ref}" s="${style}"`;
    if(value===null||value===undefined||value==='')return start+'/>';
    if(typeof value==='object'&&'formula'in value)return start+(typeof value.cached==='string'?' t="str"':'')+`><f>${xml(value.formula)}</f><v>${xml(value.cached)}</v></c>`;
    return typeof value==='number'?start+`><v>${value}</v></c>`:start+` t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  };
  const firstYear=Number(c.inicio.slice(0,4)),monthCount=(Number(c.termino.slice(0,4))-firstYear)*12+Number(c.termino.slice(5,7)),groups=Math.ceil(monthCount/14),sheetNames=[];
  const sheetOverrides=[],wbSheets=[],wbRels=[],printAreas=[];
  const oldRels=strFromU8(files['xl/worksheets/_rels/sheet1.xml.rels']);
  for(let g=0;g<groups;g++) {
    const startMonth=g*14,name=g===0?String(firstYear):`${firstYear+Math.floor(startMonth/12)}-${String(startMonth%12+1).padStart(2,'0')}`,sheetNum=g+1;
    sheetNames.push(name);wbSheets.push(`<sheet name="${name}" sheetId="${sheetNum}" r:id="rId${sheetNum}"/>`);wbRels.push(`<Relationship Id="rId${sheetNum}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheetNum}.xml"/>`);
    printAreas.push(`<definedName name="_xlnm.Print_Area" localSheetId="${g}">'${name}'!$A$1:$AF$${lastRow}</definedName>`);
    const updates=new Map(),put=(ref,value,style)=>updates.set(ref,makeCell(ref,value,style));
    for(const [ref,v] of Object.entries({C1:c.turma,C3:c.curso,C4:c.turno,C5:c.coord,C6:c.email,L1:c.modalidade||'',L2:c.local||'',L3:c.modulo,L4:serial(c.inicio),L5:serial(c.termino),W1:c.turno==='Matutino NEM'?50:60,W2:Number(c.aulasDia)||4}))put(ref,v);
    put('L6',{formula:`SUM(M124:M${lastRow})`,cached:ucs.reduce((n,u)=>n+Number(u.ch||0),0)});
    const hours=horarios(c);for(let i=0;i<6;i++){put(`Q${i+2}`,hours[i]?i+1:'');put(`R${i+2}`,hours[i]?hours[i].i/1440:'');put(`S${i+2}`,hours[i]?'às':'');put(`T${i+2}`,hours[i]?hours[i].f/1440:'')}
    let pending=0;
    for(let idx=0;idx<Math.max(18,ucs.length);idx++) {
      const r=124+idx,u=ucs[idx],templateRow=idx<18?r:129;
      for(let ci=1;ci<=32;ci++){const ref=column(ci)+r;put(ref,'',styles.get(column(ci)+templateRow))}
      if(!u)continue;
      const ds=countMap.get(u.sigla)||[],Q=Math.ceil(c.turno==='Matutino NEM'?Number(u.ch)*1.2:Number(u.ch)),P=Q/(Number(c.aulasDia)||4),allocated=ds.reduce((n,r)=>n+r.quantidade,0)/(Number(c.aulasDia)||4),missing=Math.max(0,P-allocated);pending+=missing;
      const now=new Date(Date.now()-3*3600e3).toISOString().slice(0,10),status=ds.length&&now>=ds[0].data&&now<=ds.at(-1).data?'EM ANDAMENTO':ds.length&&now>ds.at(-1).data?'CONCLUÍDA':'PLANEJADA';
      const vals={A:u.nome,K:u.sigla,M:Number(u.ch)||0,N:status,P:{formula:`Q${r}/$W$2`,cached:P},Q:{formula:`ROUNDUP(M${r}*60/$W$1,0)`,cached:Q},R:{formula:`ROUNDDOWN(Q${r}*0.25,0)`,cached:Math.floor(Q*.25)},S:ds.length?serial(ds[0].data):'-',T:ds.length?serial(ds.at(-1).data):'-',V:u.docente||'',Y:u.sala||'',AD:{formula:`SUMIFS(Encontros!$H$2:$H$${records.length+2},Encontros!$B$2:$B$${records.length+2},K${r},Encontros!$G$2:$G$${records.length+2},"Programada")/$W$2`,cached:ds.reduce((n,r)=>n+r.quantidade,0)/(Number(c.aulasDia)||4)},AE:{formula:`MAX(0,P${r}-AD${r})`,cached:missing},AF:{formula:`IF(AD${r}=P${r},"OK",IF(AD${r}>P${r},"EXCEDIDO","PENDENTE"))`,cached:allocated===P?'OK':allocated>P?'EXCEDIDO':'PENDENTE'}};
      for(const [col,v] of Object.entries(vals))put(col+r,v,styles.get(col+templateRow));
    }
    const totals = {M:ucs.reduce((n,u)=>n+Number(u.ch||0),0),P:ucs.reduce((n,u)=>n+Math.ceil(Number(u.ch||0)*60/(c.turno==='Matutino NEM'?50:60))/(Number(c.aulasDia)||4),0),Q:ucs.reduce((n,u)=>n+Math.ceil(Number(u.ch||0)*60/(c.turno==='Matutino NEM'?50:60)),0),AE:pending};
    for(const [col,n] of Object.entries(totals))put(col+'123',{formula:`SUM(${col}124:${col}${lastRow})`,cached:n});
    put('S123',{formula:`IF(COUNT(S124:S${lastRow})=0,"",MIN(S124:S${lastRow}))`,cached:activeRecords.length?serial(activeRecords[0].data):''});
    put('T123',{formula:`IF(COUNT(T124:T${lastRow})=0,"",MAX(T124:T${lastRow}))`,cached:activeRecords.length?serial(activeRecords.at(-1).data):''});
    put('U7',{formula:`IF(SUM(AE124:AE${lastRow})=0,"Calendário OK","Aviso: Aulas pendentes de lançamento")`,cached:pending?'Aviso: Aulas pendentes de lançamento':'Calendário OK'});
    for(let m=0;m<14;m++) {
      const absolute=startMonth+m,y=firstYear+Math.floor(absolute/12),month=absolute%12+1,titleRow=9+m*8,dim=new Date(Date.UTC(y,month,0)).getUTCDate();put('A'+titleRow,serial(`${y}-${String(month).padStart(2,'0')}-01`));
      for(let d=1;d<=31;d++) {
        const col=column(d+1),iso=`${y}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`,valid=d<=dim,day=valid&&iso>=c.inicio&&iso<=c.termino?state.days?.[iso]||{}:{},list=valid?records.filter(r=>r.data===iso):[],weekday=valid?new Date(iso+'T00:00:00Z').getUTCDay():1,sample=weekday===6?'D':weekday===0?'E':'C';
        for(let off=1;off<=7;off++)put(col+(titleRow+off),'',styles.get(sample+(9+off)));
        put(col+(titleRow+1),valid?serial(iso):'',styles.get(sample+'10'));
        put(col+(titleRow+2),valid?serial(iso):'',styles.get(sample+'11'));
        put(col+(titleRow+3),list.map(r=>(r.cancelada?r.sigla+' ×':r.sigla)+(Array.isArray(state.days?.[iso]?.grade)?` (${Math.floor(r.inicio/60).toString().padStart(2,'0')}:${String(r.inicio%60).padStart(2,'0')}–${Math.floor(r.fim/60).toString().padStart(2,'0')}:${String(r.fim%60).padStart(2,'0')})`:'')).join(' + '),styles.get(sample+'12'));
        put(col+(titleRow+5),[...new Set(list.map(r=>r.docente))].filter(Boolean).join(' / '),styles.get(sample+'14'));
        put(col+(titleRow+6),[...new Set(list.map(r=>r.sala))].filter(Boolean).join(' / '),styles.get(sample+'15'));
        put(col+(titleRow+7),day.h||list.find(r=>r.cancelada)?.observacao||'',styles.get('B16'));
      }
    }
    const rows=oldRows.map(({n,xml:row})=>{
      if(n>=9&&n<=120){
        const index=startMonth+Math.floor((n-9)/8),y=firstYear+Math.floor(index/12),m=index%12+1,first=`${y}-${String(m).padStart(2,'0')}-01`,last=`${y}-${String(m).padStart(2,'0')}-${new Date(Date.UTC(y,m,0)).getUTCDate()}`;
        row=row.replace(/\shidden="[^"]*"/,'');
        if(first>c.termino||last<c.inicio)row=row.replace('<row','<row hidden="1"');
      }
      if(n>=124){row=row.replace(/\shidden="[^"]*"/,'');if(n>=124+ucs.length)row=row.replace('<row','<row hidden="1"')}
      if(n===7)row=row.replace(/\sht="[^"]*"/,'').replace(/\scustomHeight="[^"]*"/,'').replace('<row','<row ht="30" customHeight="1"');
      row=row.replace(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g,(cell,ref)=>{
        if(colIndex(ref.match(/^[A-Z]+/)[0])>32)return '';
        if(updates.has(ref)){const val=updates.get(ref);updates.delete(ref);return val}
        return cell;
      });
      const missing=[...updates.keys()].filter(ref=>Number(ref.match(/\d+$/)[0])===n).sort((a,b)=>colIndex(a.match(/^[A-Z]+/)[0])-colIndex(b.match(/^[A-Z]+/)[0]));
      // All template cells exist in A:AF; extended UC rows are appended below.
      for(const ref of missing){row=row.replace('</row>',updates.get(ref)+'</row>');updates.delete(ref)}
      // Sparse template rows may lack early columns. Excel requires cells in column order.
      const cells=[...row.matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g)];
      const sorted=cells.sort((a,b)=>colIndex(a[1].match(/^[A-Z]+/)[0])-colIndex(b[1].match(/^[A-Z]+/)[0])).map(m=>m[0]).join('');
      row=row.replace(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g,'').replace('</row>',sorted+'</row>');
      return row;
    });
    for(let n=142;n<=lastRow;n++) {
      const baseRow=oldRows.find(r=>r.n===129).xml.replace(/\br="([A-Z]*)(\d+)"/g,(_,col)=>`r="${col}${n}"`);
      let row=baseRow.replace(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g,(_,ref)=>{const value=updates.get(ref)||'';updates.delete(ref);return value});rows.push(row);
    }
    let out=source.replace(/<sheetData>[\s\S]*?<\/sheetData>/,`<sheetData>${rows.join('')}</sheetData>`).replace(/<dimension ref="[^"]*"\/>/,`<dimension ref="A1:AF${lastRow}"/>`);
    // Observation merges are date-specific in the old calendar; each exported day keeps its own note.
    out=out.replace(/<mergeCells[^>]*>([\s\S]*?)<\/mergeCells>/,(_,body)=>{
      let merges=[...body.matchAll(/<mergeCell ref="([^"]+)"\/>/g)].map(m=>m[1]).filter(ref=>{const n=Number(ref.split(':')[0].match(/\d+$/)[0]);return !(n>=9&&n<=120)});
      for(let m=0;m<14;m++){const row=9+m*8;merges.push(`A${row}:AF${row}`,`A${row+1}:A${row+2}`,`A${row+3}:A${row+4}`);for(let d=1;d<=31;d++)merges.push(`${column(d+1)}${row+3}:${column(d+1)}${row+4}`)}
      for(let n=142;n<=lastRow;n++)merges.push(...['A{n}:J{n}','K{n}:L{n}','N{n}:O{n}','V{n}:X{n}','Y{n}:AC{n}'].map(x=>x.replaceAll('{n}',String(n))));
      return `<mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`;
    });
    out=out.replace(/\$141/g,`$${lastRow}`).replace(/<pageSetup[^>]*\/>/,'<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>');
    const rel=oldRels.replace('drawing1.xml',`drawing${sheetNum}.xml`);
    files[`xl/worksheets/sheet${sheetNum}.xml`]=strToU8(out);files[`xl/worksheets/_rels/sheet${sheetNum}.xml.rels`]=strToU8(rel);
    if(sheetNum>1){files[`xl/drawings/drawing${sheetNum}.xml`]=files['xl/drawings/drawing1.xml'];if(files['xl/drawings/_rels/drawing1.xml.rels'])files[`xl/drawings/_rels/drawing${sheetNum}.xml.rels`]=files['xl/drawings/_rels/drawing1.xml.rels'];sheetOverrides.push(`<Override PartName="/xl/drawings/drawing${sheetNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`)}
    sheetOverrides.push(`<Override PartName="/xl/worksheets/sheet${sheetNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
  }
  // Detail sheet is the formula source and contains no attendance or student personal information.
  const helperNum=groups+1;
  const headers=['Data','Sigla','Disciplina','Docente','Sala/Laboratório','Observação','Situação','Aulas','Início','Fim'];
  const helperRows=[`<row r="1">${headers.map((h,i)=>makeCell(column(i+1)+'1',h,'197')).join('')}</row>`];
  records.forEach((r,i)=>helperRows.push(`<row r="${i+2}">${[serial(r.data),r.sigla,r.disciplina,r.docente,r.sala,r.observacao,r.cancelada?'Não realizada':'Programada',r.quantidade,r.inicio/1440,r.fim/1440].map((v,j)=>makeCell(column(j+1)+(i+2),v,j===0?'205':j>=8?(styles.get('R2')||'195'):'195')).join('')}</row>`));
  files[`xl/worksheets/sheet${helperNum}.xml`]=strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="2" width="14" customWidth="1"/><col min="3" max="3" width="48" customWidth="1"/><col min="4" max="5" width="26" customWidth="1"/><col min="6" max="6" width="48" customWidth="1"/><col min="7" max="7" width="18" customWidth="1"/></cols><sheetData>${helperRows.join('')}</sheetData><autoFilter ref="A1:J${Math.max(1,records.length+1)}"/></worksheet>`);
  wbSheets.push(`<sheet name="Encontros" sheetId="${helperNum}" r:id="rId${helperNum}"/>`);wbRels.push(`<Relationship Id="rId${helperNum}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${helperNum}.xml"/>`);sheetOverrides.push(`<Override PartName="/xl/worksheets/sheet${helperNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
  const originalWbRels=strFromU8(files['xl/_rels/workbook.xml.rels']),otherRels=[...originalWbRels.matchAll(/<Relationship\b[^>]*\/>/g)].map(m=>m[0]).filter(r=>!r.includes('/worksheet"')&&!r.includes('/calcChain"')).map((r,i)=>r.replace(/Id="[^"]+"/,`Id="rId${helperNum+i+1}"`));
  files['xl/_rels/workbook.xml.rels']=strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${wbRels.join('')}${otherRels.join('')}</Relationships>`);
  files['xl/workbook.xml']=strToU8(wb.replace(/<sheets>[\s\S]*?<\/sheets>/,`<sheets>${wbSheets.join('')}</sheets>`).replace(/<definedNames>[\s\S]*?<\/definedNames>/,`<definedNames>${printAreas.join('')}</definedNames>`).replace(/<calcPr[^>]*\/>/,'<calcPr calcId="191028" fullCalcOnLoad="1" forceFullCalc="1"/>').replace(/<mc:AlternateContent\b[^>]*>[\s\S]*?<\/mc:AlternateContent>/,''));
  files['[Content_Types].xml']=strToU8(strFromU8(files['[Content_Types].xml']).replace(/<Override PartName="\/xl\/(?:worksheets\/sheet\d+|calcChain)\.xml"[^>]*\/>/g,'').replace('</Types>',sheetOverrides.join('')+'</Types>'));
  delete files['xl/calcChain.xml'];
  return zipSync(files,{level:6});
}

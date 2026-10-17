import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import {randomUUID} from 'node:crypto';
import {validateEnvironments} from './environments.js';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
const decode=s=>String(s||'').replace(/&#x([\da-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/gi,(_,h,d,n)=>h?String.fromCodePoint(parseInt(h,16)):d?String.fromCodePoint(Number(d)):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[n]));
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1],decode(m[2]??m[3])]));
const text=s=>decode([...String(s).matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m=>m[1]).join(''));
const aliases={nome:['nome','ambiente','nome do ambiente','sala/laboratorio','sala / laboratorio'],tipo:['tipo','tipo de ambiente'],capacidade:['capacidade','lugares','lotacao'],ativo:['disponibilidade','ativo','status']};
export function previewEnvironmentImport(base64,existing=[]){
 if(typeof base64!=='string'||!base64.length||base64.length>2800000||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw Error('Selecione um arquivo Excel .xlsx de até 2 MB.');
 const bytes=Buffer.from(base64,'base64');if(bytes.length>2*1024*1024||bytes[0]!==80||bytes[1]!==75)throw Error('Arquivo inválido. Use uma planilha Excel .xlsx.');
 let files,total=0,count=0;
 try{files=unzipSync(bytes,{filter:f=>{if(++count>500)throw Error('Limite');if(!/^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(f.name))return false;total+=f.originalSize;if(f.originalSize>6*1024*1024||total>12*1024*1024)throw Error('Limite');return true}})}catch{throw Error('Não foi possível ler o Excel. Use um .xlsx válido, sem senha e de até 2 MB.');}
 const read=p=>files[p]?strFromU8(files[p]):'';
 const shared=[...read('xl/sharedStrings.xml').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m=>text(m[1]));
 const rels=new Map([...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*\/?>/g)].map(m=>{const a=attrs(m[0]);return[a.Id,a.Target?.startsWith('/')?a.Target.slice(1):'xl/'+a.Target]}));
 const sheets=[...read('xl/workbook.xml').matchAll(/<sheet\b[^>]*\/?>/g)].map(m=>attrs(m[0])).filter(s=>!s.state||s.state==='visible').sort((a,b)=>Number(norm(b.name)==='ambientes')-Number(norm(a.name)==='ambientes'));
 let selected,rows,columns,header;
 for(const sheet of sheets){const source=read(rels.get(sheet['r:id']));if(!source)continue;const candidates=[];
  for(const match of source.matchAll(/<row\b[^>]*>[\s\S]*?<\/row>/g)){if(candidates.length>=521)throw Error('A planilha deve conter até 500 ambientes.');const row={line:Number(attrs(match[0].slice(0,match[0].indexOf('>')+1)).r)||candidates.length+1,cells:{}};
   for(const cell of match[0].matchAll(/<c\b[^>]*(?:\/>|>[\s\S]*?<\/c>)/g)){const a=attrs(cell[0].slice(0,cell[0].indexOf('>')+1)),col=a.r?.match(/^([A-Z]+)\d+$/)?.[1];if(!col)continue;const value=cell[0].match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1]||'';row.cells[col]={value:a.t==='s'?shared[Number(value)]??'':a.t==='inlineStr'?text(cell[0]):decode(value),formula:/<f\b/.test(cell[0])};}
   if(Object.values(row.cells).some(c=>String(c.value).trim()||c.formula))candidates.push(row);
  }
  for(let i=0;i<Math.min(20,candidates.length);i++){const found={};for(const [col,c] of Object.entries(candidates[i].cells))for(const [key,values] of Object.entries(aliases))if(values.includes(norm(c.value))){if(found[key])throw Error('Há colunas repetidas no cabeçalho da planilha.');found[key]=col;}
   if(found.nome&&found.tipo&&found.capacidade){selected=sheet.name;rows=candidates.slice(i+1);columns=found;header=candidates[i].line;break}
  }if(selected)break;
 }
 if(!selected)throw Error('Não foi encontrado um cabeçalho com Nome, Tipo e Capacidade nas primeiras 20 linhas. Use a planilha modelo.');
 if(!rows.length||rows.length>500)throw Error('Preencha de 1 a 500 ambientes na planilha.');
 const items=existing.map(a=>({...a})),known=new Map(existing.map(a=>[norm(a.nome),a])),seen=new Set(),preview=[];
 for(const row of rows){const values=Object.fromEntries(Object.entries(columns).map(([key,col])=>[key,String(row.cells[col]?.value||'').trim()]));if(!Object.values(values).some(Boolean)&&!Object.values(columns).some(col=>row.cells[col]?.formula))continue;const errors=[];
  if(Object.values(columns).some(col=>row.cells[col]?.formula))errors.push('Use valores preenchidos, sem fórmulas.');
  const key=norm(values.nome),old=known.get(key),tipo=['sala','sala de aula'].includes(norm(values.tipo))?'sala':['laboratorio','lab'].includes(norm(values.tipo))?'laboratorio':'';
  const capacidade=Number(values.capacidade),status=norm(values.ativo),on=['','disponivel','ativo','sim','true','1'],off=['indisponivel','inativo','nao','false','0'];
  if(!values.nome||values.nome.length>100)errors.push('Nome obrigatório, com até 100 caracteres.');if(seen.has(key))errors.push('Nome repetido na planilha.');seen.add(key);
  if(!tipo)errors.push('Tipo deve ser Sala ou Laboratório.');if(!values.capacidade||!Number.isInteger(capacidade)||capacidade<1||capacidade>1000)errors.push('Capacidade deve ser um número inteiro de 1 a 1000.');if(!on.includes(status)&&!off.includes(status))errors.push('Disponibilidade deve ser Disponível ou Indisponível.');
  const item={id:old?.id||randomUUID(),nome:old?.nome||values.nome,tipo,capacidade,ativo:!status&&old?old.ativo:!off.includes(status)},action=old?(['nome','tipo','capacidade','ativo'].every(k=>old[k]===item[k])?'sem alteração':'atualizar'):'criar';
  preview.push({line:row.line,nome:item.nome,tipo:tipo||values.tipo,capacidade:values.capacidade,ativo:item.ativo,action,errors});
  if(!errors.length){if(old)items[items.findIndex(a=>a.id===old.id)]=item;else items.push(item)}
 }
 if(!preview.length)throw Error('Nenhum ambiente preenchido na planilha.');
 const error=validateEnvironments(items).error;
 const errors=preview.flatMap(r=>r.errors.map(e=>`Linha ${r.line}: ${e}`));if(error)errors.push(error);
 return {sheet:selected,header,rows:preview,items,errors,created:preview.filter(r=>r.action==='criar').length,updated:preview.filter(r=>r.action==='atualizar').length,unchanged:preview.filter(r=>r.action==='sem alteração').length};
}
export function environmentImportTemplate(){
 const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const rows=[['Nome','Tipo','Capacidade','Disponibilidade'],['Sala 101','Sala',30,'Disponível'],['Laboratório de Informática','Laboratório',25,'Disponível']];
 const sheet=`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="40" customWidth="1"/><col min="2" max="4" width="23" customWidth="1"/></cols><sheetData>${rows.map((row,i)=>`<row r="${i+1}" ht="24" customHeight="1">${row.map((v,j)=>typeof v==='number'?`<c r="${String.fromCharCode(65+j)}${i+1}"><v>${v}</v></c>`:`<c r="${String.fromCharCode(65+j)}${i+1}" s="${i?0:1}" t="inlineStr"><is><t>${xml(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:D3"/></worksheet>`;
 const files={'[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>','_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>','xl/workbook.xml':'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Ambientes" sheetId="1" r:id="rId1"/></sheets></workbook>','xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>','xl/styles.xml':'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF075AA8"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0" fillId="0" borderId="0" xfId="0"/><xf fontId="1" fillId="2" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>','xl/worksheets/sheet1.xml':sheet};
 return zipSync(Object.fromEntries(Object.entries(files).map(([name,value])=>[name,strToU8(value)])));
}

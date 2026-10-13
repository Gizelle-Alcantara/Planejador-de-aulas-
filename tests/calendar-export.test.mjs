import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarXlsx } from '../lib/calendar-export.js';
import { unzipSync, strFromU8 } from 'fflate';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const state={cfg:{turma:'T-EXPORT',curso:'Desenvolvimento de Sistemas',turno:'Matutino',modulo:'I',coord:'Coordenação',inicio:'2028-02-01',termino:'2028-03-31',aulasDia:4},ucs:[{sigla:'LOG',nome:'Lógica',ch:40,docente:'Ana',sala:'Sala 1'}],days:{'2028-02-29':{s:['LOG']},'2028-03-01':{s:['LOG'],h:'Atividade prática'}},reg:{}};
const getCell=(text,ref)=>text.match(new RegExp(`<c\\b[^>]*r="${ref}"[^>]*?(?:/>|>[\\s\\S]*?</c>)`))?.[0];
test('exportação Excel mantém o modelo original e preenche cabeçalho, datas, salas e fórmulas',()=>{
 const result=unzipSync(calendarXlsx(state,[{status:'aprovada',data:'2028-02-29',sigla:'LOG',ambienteNome:'Maker'}]));
 const template=unzipSync(new Uint8Array(readFileSync(new URL('../lib/assets/calendario-senai-modelo.xlsx',import.meta.url))));
 assert.deepEqual(result['xl/styles.xml'],template['xl/styles.xml']);assert.deepEqual(result['xl/drawings/drawing1.xml'],template['xl/drawings/drawing1.xml']);
 const sheet=strFromU8(result['xl/worksheets/sheet1.xml']);
 assert.match(sheet,/<row(?![^>]*hidden="1")[^>]*r="17"/);assert.match(getCell(sheet,'C1'),/T-EXPORT/);assert.match(getCell(sheet,'C3'),/Desenvolvimento de Sistemas/);
 assert.match(getCell(sheet,'AD20'),/LOG/); // Fevereiro: linha 20, dia 29 = coluna AD.
 assert.match(getCell(sheet,'AD23'),/Maker/);assert.match(getCell(sheet,'B28'),/LOG/);
 assert.ok(!getCell(sheet,'AE18').includes('<v>')); // Fevereiro não tem dia 30.
 assert.match(getCell(sheet,'AD124'),/COUNTIFS/);assert.match(getCell(sheet,'AD124'),/<v>2<\/v>/);
 assert.ok(!sheet.includes('#REF!'));assert.match(strFromU8(result['xl/workbook.xml']),/Encontros/);
 assert.ok(!result['xl/calcChain.xml']);
 const details=strFromU8(result['xl/worksheets/sheet2.xml']);assert.match(details,/Maker/);assert.match(details,/Atividade prática/);
 if(process.env.EXPORT_EVIDENCE_DIR){mkdirSync(process.env.EXPORT_EVIDENCE_DIR,{recursive:true});writeFileSync(process.env.EXPORT_EVIDENCE_DIR+'/calendario.xlsx',calendarXlsx(state));}
});
test('exportação cobre vários blocos de meses e mais de 18 disciplinas sem truncar dados',()=>{
 const extended={...state,cfg:{...state.cfg,inicio:'2028-01-01',termino:'2029-06-30'},ucs:Array.from({length:20},(_,i)=>({sigla:'UC'+i,nome:'Disciplina '+i,ch:8,docente:'Ana',sala:''})),days:{'2029-06-30':{s:['UC19']}}};
 const files=unzipSync(calendarXlsx(extended)),wb=strFromU8(files['xl/workbook.xml']);assert.match(wb,/2029-03/);assert.match(wb,/\$AF\$143/);
 const second=strFromU8(files['xl/worksheets/sheet2.xml']);assert.match(getCell(second,'AE36'),/UC19/);assert.match(getCell(second,'A143'),/Disciplina 19/);
 assert.ok(files['xl/drawings/drawing2.xml']);
});
test('exportação rejeita período inválido e usa texto literal para dados começando por fórmula',()=>{
 assert.throws(()=>calendarXlsx({...state,cfg:{...state.cfg,inicio:'2028-02-30'}}));
 const files=unzipSync(calendarXlsx({...state,cfg:{...state.cfg,turma:'=HYPERLINK("x")'}}));
 assert.match(getCell(strFromU8(files['xl/worksheets/sheet1.xml']),'C1'),/t="inlineStr"/);
});

test('lançamentos fora do período são incluídos somente quando solicitado, sem alterar a turma',()=>{
 const data={...state,days:{...state.days,'2027-12-10':{s:['LOG']}}},old=JSON.stringify(data);
 const a=unzipSync(calendarXlsx(data)),b=unzipSync(calendarXlsx(data,[],true));
 const oldSerial=Math.round((Date.parse('2027-12-10T00:00:00Z')-Date.UTC(1899,11,30))/86400000);assert.ok(!strFromU8(a['xl/worksheets/sheet2.xml']).includes(`<v>${oldSerial}</v>`));
 const extended=Object.entries(b).filter(([k])=>/^xl\/worksheets\/sheet\d+\.xml$/.test(k)).map(([,v])=>strFromU8(v));
 const serial=Math.round((Date.parse('2027-12-10T00:00:00Z')-Date.UTC(1899,11,30))/86400000);
 assert.ok(extended.some(s=>s.includes(`<v>${serial}</v>`)));assert.equal(JSON.stringify(data),old);
});

test('todas as linhas mantêm células únicas em ordem crescente, inclusive meses com observações esparsas',()=>{
 const data={...state,cfg:{...state.cfg,inicio:'2028-01-01',termino:'2029-06-30'},ucs:Array.from({length:20},(_,i)=>({sigla:'UC'+i,nome:'Disciplina '+i,ch:8})),days:{'2029-02-01':{s:['UC0'],h:'Observação'}}};
 const files=unzipSync(calendarXlsx(data));
 const col=ref=>[...ref.match(/^[A-Z]+/)[0]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);
 for(const [path,bytes] of Object.entries(files).filter(([p])=>/^xl\/worksheets\/sheet\d+\.xml$/.test(p))){
  const xml=strFromU8(bytes);
  for(const row of xml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)){
   const refs=[...row[2].matchAll(/<c\b[^>]*r="([A-Z]+\d+)"/g)].map(m=>m[1]);
   assert.equal(new Set(refs).size,refs.length,`${path} linha ${row[1]}: duplicatas`);
   assert.deepEqual(refs.map(col),refs.map(col).sort((a,b)=>a-b),`${path} linha ${row[1]}: ordem de células`);
   assert.ok(refs.every(r=>r.match(/\d+$/)[0]===row[1]));
  }
 }
 assert.ok(!strFromU8(files['xl/workbook.xml']).includes('absPath'));
});

test('caracteres inválidos no XML e datas importadas inválidas não corrompem a exportação',()=>{
 const files=unzipSync(calendarXlsx({...state,cfg:{...state.cfg,curso:'Curso\u0001 & <teste>'},days:{...state.days,'2028-02-30':{s:['LOG']},'2028-02-12x':{s:['LOG']}}}));
 const main=strFromU8(files['xl/worksheets/sheet1.xml']),details=strFromU8(files['xl/worksheets/sheet2.xml']);
 assert.match(main,/Curso &amp; &lt;teste&gt;/);assert.ok(!main.includes('\u0001'));assert.ok(!details.includes('NaN'));
 assert.equal((details.match(/Programada/g)||[]).length,2);
});

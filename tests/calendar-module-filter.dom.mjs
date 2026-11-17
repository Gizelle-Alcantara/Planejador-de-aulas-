import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Exercise the actual creation dialog without depending on a server or database.
const source=readFileSync(new URL('../src/tpl.html',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function openTurmaModal(){'),source.indexOf('function openDuplicateModal('));
const browser=await chromium.launch({headless:true,...process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:{}});
try{
 const page=await browser.newPage();page.setDefaultTimeout(5000);
 await page.setContent('<style>'+source.match(/<style>([\s\S]*?)<\/style>/)[1]+'</style><div id="modalRoot"></div>');
 await page.addScriptTag({content:readFileSync(new URL('../public/courses.js',import.meta.url),'utf8')});
 await page.evaluate(()=>{
  window.units=[{sigla:'A',nome:'Primeira',ch:4,modulo:' I '},{sigla:'B',nome:'Segunda',ch:8,modulo:'II'},{sigla:'C',nome:'Geral',ch:2}];
  window.G={courseCatalogStored:true,cursos:[{id:'one',nome:'Curso A',ucs:units},{id:'two',nome:'Curso B',ucs:[{sigla:'D',nome:'Outra',ch:4,modulo:'III'}]}],docentes:[]};
  window.T={base:{cfg:{curso:'Curso A',cursoId:'one',turma:'BASE',turno:'Matutino'},ucs:structuredClone(units),days:{'2099-01-01':{t:'feriado',h:'Teste'},'2099-01-02':{s:['A']}}}};
  window.S=T.base;window.UI={};window.CUR='base';window.TURNOS=['Matutino'];
  window.classUnitModule=value=>String(value??'').trim().toLocaleLowerCase('pt-BR');
  window.clone=structuredClone;window.esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.slug=value=>value.toLowerCase();window.normalize=()=>{S=T[CUR]};window.save=()=>{};window.renderView=()=>{};window.toast=()=>{};
 });
 await page.addScriptTag({content:code});
 const filter=page.getByLabel('Filtrar disciplinas por módulo',{exact:true});
 const matches=()=>page.evaluate(()=>filteredNewTurmaUnits().map(u=>u.sigla));
 await page.evaluate(()=>openTurmaModal());
 assert.deepEqual(await matches(),['A','B','C']);
 for(const [value,expected] of [['module:i',['A']],['module:ii',['B']],['module:',['C']]]){
  await filter.selectOption(value);assert.deepEqual(await matches(),expected);
  assert.match(await page.locator('#ntModuleSummary').textContent(),/^1 disciplina/);
 }
 await page.locator('#ntCourseCatalog').selectOption('two');
 assert.equal(await filter.inputValue(),'');assert.deepEqual(await matches(),['D']);
 await page.locator('#ntCopy').selectOption('base');
 await filter.selectOption('module:ii');assert.deepEqual(await matches(),['B']);
 await page.locator('#ntCopy').selectOption('');
 assert.deepEqual(await matches(),[]);
 assert.equal(await filter.isVisible(),false);
 await page.locator('#ntCourseCatalog').selectOption('one');
 await page.locator('#ntCopy').selectOption('__course__');await filter.selectOption('module:i');
 await page.locator('#ntCod').fill('MODELO');await page.locator('#ntIni').fill('2099-01-01');await page.locator('#ntFim').fill('2099-06-30');
 await page.evaluate(()=>saveTurma());
 assert.deepEqual(await page.evaluate(()=>T.modelo.ucs.map(u=>u.sigla)),['A']);
 assert.equal(await page.evaluate(()=>T.modelo.cfg.cursoId),'one');
 await page.evaluate(()=>openTurmaModal());
 assert.equal(await filter.inputValue(),'');
 await page.locator('#ntCopy').selectOption('base');await filter.selectOption('module:ii');
 await page.locator('#ntCod').fill('NOVA');await page.locator('#ntCurso').evaluate(e=>e.value='Curso A');
 await page.locator('#ntIni').fill('2099-01-01');await page.locator('#ntFim').fill('2099-06-30');
 await page.evaluate(()=>saveTurma());
 assert.deepEqual(await page.evaluate(()=>T.nova.ucs.map(u=>u.sigla)),['B']);
 assert.deepEqual(await page.evaluate(()=>Object.keys(T.nova.days)),['2099-01-01']);
 await page.evaluate(()=>T.nova.ucs[0].ch=99);
 assert.equal(await page.evaluate(()=>T.base.ucs[1].ch),8);
 assert.equal(await page.evaluate(()=>G.cursos[0].ucs[1].ch),8);
 await page.evaluate(()=>{G.courseCatalogStored=false;openTurmaModal()});
 assert.equal(await filter.isVisible(),false);
 await page.locator('#ntCopy').selectOption('base');
 await filter.selectOption('module:');assert.deepEqual(await matches(),['C']);
 console.log('Filtro: módulos, troca de curso, cópia, turma vazia e independência dos dados aprovados.');
}finally{await browser.close()}

import test from 'node:test';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {dailyDisplayData,dailyDisplayHTML,dailyDisplayXlsx} from '../lib/daily-display.js';
import {senaiLogo} from '../lib/senai-logo.js';
const date='2099-01-06';
const fixture=()=>({ambientes:{items:[{id:'sala',nome:'Sala 1',ativo:true},{id:'lab',nome:'Laboratório',ativo:true}]},reservas:{items:[{id:'r',turmaId:'turma-a',data:date,sigla:'P',bloco:'1-2-3-4',inicio:450,fim:690,status:'aprovada',ambienteId:'lab',ambienteNome:'Laboratório',login:'login-privado',finalidade:'finalidade-secreta'}]},'turma-a':{state:{cfg:{turma:'T1',curso:'Curso',turno:'Matutino',aulasDia:4,local:'Sala 1'},ucs:[{sigla:'P',nome:'Prática <script>alert(1)</script>',docente:'Ana',ch:4},{sigla:'E',nome:'Online',docente:'EAD',ch:4}],days:{[date]:{s:['P','E'],grade:['P','P','P','P'],ead:['E'],h:'nota-privada'}},reg:{[date]:{obs:'observacao-secreta'}},alunos:[{nome:'aluno-secreto'}]}}});
test('programação inclui aulas e EAD e respeita o ambiente da reserva aprovada',()=>{
 const data=dailyDisplayData(fixture(),date);assert.equal(data.lessons.length,2);assert.equal(data.lessons.find(l=>l.modalidade==='Presencial').ambiente,'Laboratório');assert.equal(data.lessons.find(l=>l.modalidade==='Presencial').origem,'Reserva aprovada');assert.equal(data.lessons.find(l=>l.modalidade==='EAD').modalidade,'EAD');assert.equal(dailyDisplayData(fixture(),date,'lab').lessons.length,1);assert.equal(dailyDisplayData(fixture(),date,'sala').lessons.length,0);assert.throws(()=>dailyDisplayData(fixture(),'2099-02-30'),/data válida/);assert.throws(()=>dailyDisplayData(fixture(),date,'inexistente'),/Ambiente/);
});
test('pendências não mudam a sala planejada e cancelamentos não entram na programação',()=>{
 const docs=fixture();docs.reservas.items[0].status='pendente';assert.equal(dailyDisplayData(docs,date).lessons.find(l=>l.modalidade==='Presencial').ambiente,'Sala 1');docs['turma-a'].state.reg[date].dado='nao';assert.equal(dailyDisplayData(docs,date).lessons.length,0);
});
test('painel é independente, escapa conteúdo e não expõe informações internas',()=>{
 const html=dailyDisplayHTML(dailyDisplayData(fixture(),date),senaiLogo);assert.match(html,/data:image\/png;base64/);assert.match(html,/requestFullscreen/);assert.match(html,/12000/);assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);assert.doesNotMatch(html,/login-privado|finalidade-secreta|aluno-secreto|observacao-secreta|nota-privada|fetch\(/);assert.equal((html.match(/class="slide"/g)||[]).length,3);
});
test('Excel contém dados reais, filtros, cabeçalho fixo e total de aulas',()=>{
 const files=unzipSync(dailyDisplayXlsx(dailyDisplayData(fixture(),date))),sheet=strFromU8(files['xl/worksheets/sheet1.xml']);assert.match(sheet,/state="frozen"/);assert.match(sheet,/autoFilter ref="A3:L5"/);assert.match(sheet,/<f>SUM\(L4:L5\)<\/f><v>8<\/v>/);assert.match(sheet,/EAD \(sem ambiente físico\)/);assert.doesNotMatch(sheet,/login-privado|aluno-secreto|finalidade-secreta|<script>/);assert.match(strFromU8(files['xl/workbook.xml']),/Aulas planejadas/);
});
test('dia sem aulas gera arquivos válidos com mensagem e total zero',()=>{
 const data=dailyDisplayData(fixture(),'2099-01-07');assert.equal(data.lessons.length,0);assert.match(dailyDisplayHTML(data,senaiLogo),/Nenhuma aula planejada/);const sheet=strFromU8(unzipSync(dailyDisplayXlsx(data))['xl/worksheets/sheet1.xml']);assert.match(sheet,/<f>0<\/f><v>0<\/v>/);assert.doesNotMatch(sheet,/#REF!|#DIV\/0!/);
});

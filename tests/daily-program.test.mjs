import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_SHIFTS,shiftEvents,dailyProgramCSV} from '../src/static/daily-program.js';
const env={id:'lab',nome:'Laboratório',tipo:'laboratorio',capacidade:30,ativo:true};
test('turnos cobrem o dia sem duplicar eventos que terminam na fronteira',()=>{
 assert.deepEqual(BOARD_SHIFTS.map(s=>[s.inicio,s.fim]),[[0,720],[720,1080],[1080,1440]]);
 const events=[{ambienteId:'lab',inicio:420,fim:720},{ambienteId:'lab',inicio:720,fim:1080},{ambienteId:'lab',inicio:1080,fim:1440}];
 for(const [i,s] of BOARD_SHIFTS.entries())assert.deepEqual(shiftEvents(events,'lab',s),[events[i]]);
});
test('atividade que atravessa turnos aparece em ambos, em ordem e no ambiente correto',()=>{
 const cross={ambienteId:'lab',inicio:690,fim:810},early={ambienteId:'lab',inicio:450,fim:690},other={ambienteId:'sala',inicio:450,fim:800};
 assert.deepEqual(shiftEvents([cross,other,early],'lab',BOARD_SHIFTS[0]),[early,cross]);
 assert.deepEqual(shiftEvents([cross,other,early],'lab',BOARD_SHIFTS[1]),[cross]);
});
test('CSV inclui turnos livres e indisponibilidade, sem inventar horários de atividade',()=>{
 const csv=dailyProgramCSV('2099-01-05',[env,{...env,id:'off',nome:'Sala 2',ativo:false}],[]);
 assert.ok(csv.startsWith('\ufeff'));assert.equal(csv.split('\r\n').length,7);
 assert.match(csv, /"05\/01\/2099";"Matutino";"Laboratório"/);assert.equal((csv.match(/"Livre"/g)||[]).length,3);
 assert.equal((csv.match(/"Indisponível";"Indisponível"/g)||[]).length,3);
});
test('exporta intervalos por turno, status e dados compartilhados sem contatos nem finalidade',()=>{
 const event={ambienteId:'lab',inicio:690,fim:810,status:'bloqueado',motivo:'Manutenção',docente:'Ana',email:'privado@teste',login:'segredo',finalidade:'Finalidade privada',origem:'Bloqueio'};
 const csv=dailyProgramCSV('2099-01-05',[env],[event]);assert.match(csv,/"11:30";"12:00"/);assert.match(csv,/"12:00";"13:30"/);
 assert.doesNotMatch(csv,/privado@teste|segredo|Finalidade privada/);assert.equal((csv.match(/"Bloqueado"/g)||[]).length,2);
});
test('CSV preserva acentos, aspas e linhas e neutraliza fórmulas',()=>{
 const csv=dailyProgramCSV('2099-01-05',[{...env,nome:' =SOMA(1;2)'}],[{ambienteId:'lab',inicio:420,fim:480,status:'aprovada',docente:'+cmd',disciplina:'Lógica "A"\nB'}]);
 assert.match(csv,/"' =SOMA\(1;2\)"/);assert.match(csv,/"'\+cmd"/);assert.match(csv,/"Lógica ""A""\nB"/);
});

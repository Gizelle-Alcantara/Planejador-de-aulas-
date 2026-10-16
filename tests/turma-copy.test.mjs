import test from 'node:test';
import assert from 'node:assert/strict';
import {duplicateTurma} from '../lib/turma-copy.js';
const source={cfg:{turma:'A1',curso:'Curso',turno:'Vespertino',aulasDia:2,modulo:'II',coord:'Coordenação',email:'coord@example.test',local:'Laboratório',destinatarios:'privado@example.test',inicio:'2099-01-01',termino:'2099-06-30',linkAluno:'privado'},ucs:[{sigla:'ABC',nome:'Disciplina',ch:8,docente:'Ana',sala:'Sala 1'}],days:{'2099-01-10':{s:['ABC']},'2099-02-01':{s:[],t:'feriado',h:'Feriado'},'2099-02-02':{s:[],t:'sem',h:'Recesso'},'2098-12-31':{s:[],t:'feriado',h:'Fora do período'}},alunos:[{id:'pessoal',nome:'Aluno'}],reg:{'2099-01-10':{dado:'sim',faltas:{pessoal:1}}},envios:[{texto:'Histórico'}],aviso:{auto:true,lembrete:true},studentCode:'segredo',reservas:[{id:'reserva'}]};
const values={turma:'B1',curso:'Novo curso',inicio:'2099-01-01',termino:'2099-03-01'};
test('duplicação reaproveita estrutura sem copiar registros, contatos, acessos ou avisos automáticos',()=>{
 const before=JSON.stringify(source),copy=duplicateTurma(source,values);
 assert.equal(copy.cfg.turma,'B1');assert.equal(copy.cfg.curso,'Novo curso');assert.equal(copy.cfg.turno,'Vespertino');assert.equal(copy.cfg.aulasDia,2);assert.deepEqual(copy.ucs,source.ucs);
 assert.deepEqual(copy.days,{});assert.deepEqual(copy.alunos,[]);assert.deepEqual(copy.reg,{});assert.deepEqual(copy.envios,[]);assert.equal(copy.cfg.destinatarios,'');assert.equal(copy.aviso.auto,false);assert.equal(copy.aviso.lembrete,false);assert.equal(copy.studentCode,undefined);assert.equal(copy.reservas,undefined);assert.equal(copy.cfg.linkAluno,undefined);
 copy.ucs[0].nome='Alterada';copy.cfg.coord='Outra';assert.equal(JSON.stringify(source),before);
});
test('opções de cópia são independentes e feriados permanecem nas datas dentro do novo período',()=>{
 const copy=duplicateTurma(source,values,{configuracoes:false,docentes:false,ambientes:false,feriados:true});
 assert.equal(copy.cfg.turno,'Matutino');assert.equal(copy.cfg.coord,'');assert.equal(copy.cfg.local,'');assert.equal(copy.ucs[0].docente,'');assert.equal(copy.ucs[0].sala,'');assert.deepEqual(Object.keys(copy.days),['2099-02-01','2099-02-02']);assert.ok(Object.values(copy.days).every(d=>d.s.length===0));
 assert.deepEqual(duplicateTurma(source,values,{disciplinas:false,docentes:true}).ucs,[]);
 assert.deepEqual(duplicateTurma(source,{...values,inicio:'2100-01-01',termino:'2100-12-31'},{feriados:true}).days,{});
});
test('duplicação rejeita código, curso e datas inválidas',()=>{
 for(const invalid of [{turma:'   '},{turma:'!!!'},{turma:'A'.repeat(61)},{curso:''},{inicio:'2099-02-30'},{termino:'2098-01-01'},{inicio:'2099-1-1'}])assert.throws(()=>duplicateTurma(source,{...values,...invalid}));
 assert.throws(()=>duplicateTurma(null,values));assert.equal(duplicateTurma(source,{...values,inicio:values.termino}).cfg.inicio,values.termino);
});

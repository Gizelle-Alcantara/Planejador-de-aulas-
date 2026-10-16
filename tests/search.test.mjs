import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesSearch,normalizeSearch} from '../lib/search.js';
test('busca ignora acentos, caixa e espaços e combina palavras em campos diferentes',()=>{
 const record={text:['T-101','Técnico em Automação'],turno:'Matutino'};
 assert.equal(normalizeSearch('  AUTOMAÇÃO  '),'automacao');assert.equal(matchesSearch(record,'t-101 automacao',{turno:'matutino'}),true);assert.equal(matchesSearch(record,'automacao ausente'),false);assert.equal(matchesSearch({text:['Álvaro',12345]},'alvaro 123'),true);
});
test('filtros são combinados com a busca e distinguem disponibilidade falsa de ausência de filtro',()=>{
 const record={text:['Laboratório de Elétrica'],tipo:'laboratorio',ativo:'false'};
 assert.equal(matchesSearch(record,'eletrica',{tipo:'laboratorio',ativo:'false'}),true);assert.equal(matchesSearch(record,'eletrica',{tipo:'sala',ativo:'false'}),false);assert.equal(matchesSearch(record,'',{ativo:'true'}),false);assert.equal(matchesSearch(record,'',{tipo:'',ativo:''}),true);
});
test('busca trata termos como texto literal e não altera registros',()=>{
 const record={text:['Sala (A)'],tipo:'sala'},before=JSON.stringify(record);assert.equal(matchesSearch(record,'(a)'),true);assert.equal(matchesSearch(record,'.*'),false);assert.equal(matchesSearch({text:[null,undefined]},'undefined'),false);assert.equal(JSON.stringify(record),before);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDocentes} from '../lib/docentes.js';
test('cadastro aceita registros antigos e todos os campos opcionais',()=>{
 assert.equal(validateDocentes([{nome:'Ana'}]),null);
 assert.equal(validateDocentes([{nome:'Ana',matricula:'123',emailInstitucional:'ana@senai.test',tel:'(75) 99999-9999',vinculo:'Horista',observacoes:'Formação técnica'}]),null);
});
test('cadastro rejeita duplicidades e contatos inválidos',()=>{
 for(const list of [[{nome:''}],[{nome:'Ana'},{nome:'ana'}],[{nome:'Ana',matricula:'1'},{nome:'Beto',matricula:'1'}],[{nome:'Ana',email:'inválido'}],[{nome:'Ana',tel:'abc'}],[{nome:'Ana',vinculo:'X'}]])assert.ok(validateDocentes(list));
});

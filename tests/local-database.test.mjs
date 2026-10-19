import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localDatabase} from '../lib/local-database.js';
import {createClient} from '@libsql/client';
import {setImmediate} from 'node:timers/promises';
test('reutiliza a conexão e impede leitura externa dentro de transação',async()=>{
 const calls=[];const db=localDatabase({execute:async sql=>{calls.push(sql);return sql},transaction(){throw Error('Não deve criar conexões por transação')}});
 const tx=await db.transaction('write');const read=db.execute('SELECT externo');await tx.execute('UPDATE interno');assert.deepEqual(calls,['BEGIN IMMEDIATE','UPDATE interno']);await tx.commit();await read;await tx.close();assert.deepEqual(calls,['BEGIN IMMEDIATE','UPDATE interno','COMMIT','SELECT externo']);await assert.rejects(async()=>tx.execute('SELECT fechado'));
});
test('rollback e fechamento liberam a fila sem confirmar alterações',async()=>{
 const calls=[];const db=localDatabase({execute:async sql=>{calls.push(sql)}});const tx=await db.transaction();await tx.execute('UPDATE descartado');const next=db.transaction();await tx.close();const tx2=await next;await tx2.rollback();await tx2.close();assert.deepEqual(calls,['BEGIN IMMEDIATE','UPDATE descartado','ROLLBACK','BEGIN IMMEDIATE','ROLLBACK']);
});
test('falhas ao iniciar ou confirmar não prendem a fila',async()=>{
 let failBegin=true,failCommit=true;const calls=[];const db=localDatabase({execute:async sql=>{calls.push(sql);if(sql==='BEGIN IMMEDIATE'&&failBegin){failBegin=false;throw Error('begin')}if(sql==='COMMIT'&&failCommit){failCommit=false;throw Error('commit')}}});
 await assert.rejects(db.transaction(),/begin/);const tx=await db.transaction();await assert.rejects(tx.commit(),/commit/);await tx.rollback();await db.execute('SELECT depois');assert.equal(calls.at(-1),'SELECT depois');
});
test('SQLite real mantém isolamento, rollback e dados após transações repetidas',async()=>{
 const db=localDatabase(createClient({url:'file::memory:'}));
 try{
  await db.execute('CREATE TABLE counts (n INTEGER NOT NULL)');await db.execute('INSERT INTO counts VALUES(0)');
  const tx=await db.transaction();await tx.execute('UPDATE counts SET n=999');let readFinished=false;const read=db.execute('SELECT n FROM counts').then(r=>{readFinished=true;return r});await setImmediate();assert.equal(readFinished,false);await tx.rollback();await tx.close();assert.equal((await read).rows[0].n,0);
  for(let i=0;i<200;i++){const tx=await db.transaction();await tx.execute('UPDATE counts SET n=n+1');await tx.commit();await tx.close()}
  assert.equal((await db.execute('SELECT n FROM counts')).rows[0].n,200);
 }finally{await db.close()}
});

import {existsSync,readdirSync} from 'node:fs';import {publicationConfig,publicationManualChecks} from '../lib/publication.js';
const target=process.argv.includes('--serverless')?'serverless':undefined,checks=publicationConfig(process.env,target);
const files=new Set(['public/index.html','public/shim.js','public/schedule.js','public/turma-copy.js','public/search.js','lib/assets',...readdirSync(new URL('../src/static/',import.meta.url)).map(name=>'public/'+name)]);
for(const file of files)checks.push({id:file,status:existsSync(new URL('../'+file,import.meta.url))?'ok':'error',title:file,detail:'Arquivo necessário para execução.'});
for(const check of checks)console.log(`[${check.status.toUpperCase()}] ${check.title}: ${check.detail}`);
console.log('\nVerificações manuais obrigatórias:');for(const item of publicationManualChecks)console.log('- '+item);
console.log('\nO banco e os serviços externos não foram acessados por esta checagem.');process.exitCode=checks.some(c=>c.status==='error')?1:0;

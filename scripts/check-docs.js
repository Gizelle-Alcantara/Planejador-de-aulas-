import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url),docs=new URL('docs/',root);
const files=['README.md','MANUAL-COMPLETO.md','CURSOS-E-COORDENACAO.md','FREQUENCIA-HORISTAS.md','REFERENCIA-TECNICA.md','API.md','OPERACAO-E-MANUTENCAO.md','SEGURANCA-E-RECUPERACAO.md','TESTES-E-ACEITE.md','ENTREGA-TECNICA.md','PLANO-DE-IMPLEMENTACAO.md','PROCESSOS-FISICOS.md'];
const errors=[];let links=0;
for(const name of files){
 const text=readFileSync(new URL(name,docs),'utf8');
 if(!text.includes('23/10/2026'))errors.push(name+': revisão documental ausente');
 if(text.includes('\ufffd'))errors.push(`${name}: caractere de substituição UTF-8`);
 if((text.match(/^```/gm)||[]).length%2)errors.push(`${name}: bloco de código não fechado`);
 for(const [,target] of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
  if(/^(https?:|#)/.test(target))continue;
  links++;if(!existsSync(new URL(target.split('#')[0],docs)))errors.push(`${name}: link ausente ${target}`);
 }
}
const source=['lib/core.js','lib/key-control.js','lib/frequency.js'].map(f=>readFileSync(new URL(f,root),'utf8')).join('\n');
const ops=new Set();
for(const m of source.matchAll(/body\.op\s*===\s*['"]([a-z_]+)['"]/g))ops.add(m[1]);
for(const m of source.matchAll(/\[([^\]\n]+)\]\.includes\(body\.op\)/g))for(const v of m[1].matchAll(/['"]([a-z_]+)['"]/g))ops.add(v[1]);
const api=readFileSync(new URL('API.md',docs),'utf8');
for(const op of ops)if(!new RegExp(`\\| ${op} \\|`).test(api))errors.push(`API: operação não documentada ${op}`);
for(const f of ['DOCUMENTACAO.html','README.html','MANUAL-COMPLETO.html','../public/documentacao.html']){
 const html=readFileSync(new URL(f,docs),'utf8');if(!html.includes('name="documentation-edition" content="23/10/2026"'))errors.push(f+': edição HTML antiga');const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const m of html.matchAll(/href="#([^"]+)"/g))if(!ids.has(m[1]))errors.push(`${f}: âncora ausente ${m[1]}`);
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Documentação válida: ${files.length} documentos, ${links} links locais, ${ops.size} operações da API conferidas e âncoras HTML íntegras.`);

// Documentação local: sem dependências, sem leitura de dados operacionais.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../docs/',import.meta.url);
export const documents=['README.md','MANUAL-COMPLETO.md','CURSOS-E-COORDENACAO.md','REFERENCIA-TECNICA.md','API.md','OPERACAO-E-MANUTENCAO.md','SEGURANCA-E-RECUPERACAO.md','TESTES-E-ACEITE.md','ENTREGA-TECNICA.md','PLANO-DE-IMPLEMENTACAO.md','PROCESSOS-FISICOS.md'];
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const id=name=>name.replace('.md','').toLowerCase();
function inline(s){
 const codes=[];
 s=escape(s).replace(/`([^`]+)`/g,(_,v)=>`\u0000${codes.push(`<code>${v}</code>`)-1}\u0000`);
 s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>{
  const [file,fragment]=url.split('#');
  if(documents.includes(file))return `<a href="#${id(file)}">${label}</a>`;
  if(/^(https?:|[^:]+\.html(?:#.*)?$)/.test(url))return `<a href="${url}">${label}</a>`;
  return label;
 }).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 return s.replace(/\u0000(\d+)\u0000/g,(_,n)=>codes[Number(n)]);
}
function render(text,prefix){
 const lines=text.replaceAll('\r','').split('\n');let out=[],i=0;
 while(i<lines.length){
  let line=lines[i];
  if(!line.trim()){i++;continue}
  if(line.startsWith('```')){const lang=line.slice(3);const code=[];i++;while(i<lines.length&&!lines[i].startsWith('```'))code.push(lines[i++]);i++;out.push(`<pre aria-label="Exemplo ${escape(lang)}"><code>${escape(code.join('\n'))}</code></pre>`);continue}
  const heading=line.match(/^(#{1,6}) (.+)$/);
  if(heading){const level=Math.min(6,heading[1].length+1);out.push(`<h${level}>${inline(heading[2])}</h${level}>`);i++;continue}
  if(line.startsWith('|')){
   const rows=[];while(i<lines.length&&lines[i].startsWith('|'))rows.push(lines[i++]);
   const cells=row=>row.trim().slice(1,-1).split('|').map(v=>v.trim());
   const header=cells(rows.shift());if(rows[0]&&/^\|[\s:|\-]+\|$/.test(rows[0]))rows.shift();
   out.push(`<div class="table-wrap"><table><thead><tr>${header.map(v=>`<th scope="col">${inline(v)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${cells(row).map(v=>`<td>${inline(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue;
  }
  if(/^(- |\d+\. )/.test(line)){
   const ordered=/^\d/.test(line),tag=ordered?'ol':'ul',items=[];
   while(i<lines.length&&(ordered?/^\d+\. /:/^- /).test(lines[i]))items.push(lines[i++].replace(/^(?:- |\d+\. )/,''));
   out.push(`<${tag}>${items.map(v=>`<li>${inline(v)}</li>`).join('')}</${tag}>`);continue;
  }
  const paragraph=[];while(i<lines.length&&lines[i].trim()&&!/^(#|\||```|- |\d+\. )/.test(lines[i]))paragraph.push(lines[i++]);
  if(!paragraph.length){paragraph.push(lines[i++])}
  out.push(`<p>${inline(paragraph.join(' '))}</p>`);
 }
 return out.join('\n');
}
const sections=documents.map(file=>({file,text:readFileSync(new URL(file,root),'utf8')}));
const nav=sections.map(({file,text})=>`<li><a href="#${id(file)}">${escape(text.split('\n')[0].replace(/^# /,''))}</a></li>`).join('');
const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Documentação técnica e manuais — Agenda SENAI</title><style>
:root{color-scheme:light;--blue:#075aa8}*{box-sizing:border-box}body{margin:0;background:#f3f6fa;color:#172b40;font:16px/1.65 system-ui,Segoe UI,sans-serif}header{background:#073e70;color:white;padding:42px max(24px,calc((100vw - 1100px)/2))}header p{max-width:760px}h1{font-size:2rem;margin:0}main{max-width:1100px;margin:24px auto;padding:0 20px}nav,article{background:white;padding:30px;border:1px solid #dbe3ec;border-radius:12px;margin-bottom:24px}nav a,a{color:#075aa8}h2{color:#073e70;border-bottom:2px solid #dbe3ec;padding-bottom:12px}h3{margin-top:32px}h4{color:#36516b}.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.93rem}th,td{border:1px solid #cedae7;padding:10px 12px;text-align:left;vertical-align:top}th{background:#eaf2fa}pre{overflow-x:auto;background:#11283e;color:#eef5fc;padding:18px;border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere}code{font-family:Consolas,monospace;font-size:.92em}p,li,td{overflow-wrap:anywhere}a:focus-visible{outline:3px solid #e49a00;outline-offset:3px}.back{font-size:.9rem}@media(max-width:620px){nav,article{padding:18px}h1{font-size:1.6rem}}@media print{body{background:white;font-size:10pt;color:black}header{background:white;color:black;padding:0}main{max-width:none;padding:0}nav{break-after:page}article{border:0;padding:0;break-before:page}h2,h3,h4{break-after:avoid}tr,pre{break-inside:avoid}thead{display:table-header-group}.back{display:none}a{color:inherit;text-decoration:none}.table-wrap{overflow:visible}@page{size:A4;margin:18mm}}
</style></head><body><header><h1>Agenda SENAI</h1><p>Documentação técnica, manual de utilização e operação<br>Edição de 19 de outubro de 2026</p><p>Consulta local e impressão. Para gerar PDF, use Imprimir → Salvar em PDF.</p></header><main><nav id="indice" aria-label="Índice da documentação"><h2>Índice</h2><ol>${nav}</ol></nav>${sections.map(({file,text})=>`<article id="${id(file)}">${render(text,id(file))}<p class="back"><a href="#indice">Voltar ao índice</a></p></article>`).join('\n')}</main></body></html>`;
writeFileSync(new URL('DOCUMENTACAO.html',root),html);
// Endereços antigos continuam abrindo a edição consolidada.
for(const file of ['README.html','MANUAL-COMPLETO.html'])writeFileSync(new URL(file,root),html);
console.log(`Documentação gerada: ${sections.length} capítulos; ${Buffer.byteLength(html)} bytes.`);

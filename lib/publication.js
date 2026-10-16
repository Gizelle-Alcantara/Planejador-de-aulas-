import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
export function publicationConfig(env={},target=env.VERCEL||env.NETLIFY?'serverless':'local'){
 const checks=[],add=(id,status,title,detail)=>checks.push({id,status,title,detail}),placeholder=value=>/defina|troque|seu-site|seudominio|example\.com/i.test(String(value||''));
 add('admin',env.ADMIN_PASSWORD?.length>=12&&!placeholder(env.ADMIN_PASSWORD)?'ok':'error','Senha mestre','Use uma senha própria de pelo menos 12 caracteres.');
 add('session',env.SESSION_SECRET?.length>=32&&env.SESSION_SECRET!==env.ADMIN_PASSWORD&&!placeholder(env.SESSION_SECRET)?'ok':'error','Chave das sessões','Use uma chave aleatória de pelo menos 32 caracteres, diferente da senha mestre.');
 let site;try{site=new URL(env.PUBLIC_URL)}catch{}
 add('url',site?.protocol==='https:'&&!site.username&&!site.password&&!placeholder(env.PUBLIC_URL)?'ok':'error','Endereço público','Configure PUBLIC_URL com o endereço HTTPS definitivo, sem usuário ou senha no endereço.');
 const remote=/^(libsql|https):\/\//.test(env.TURSO_DATABASE_URL||'');
 add('database',remote?(env.TURSO_AUTH_TOKEN?'ok':'error'):target==='serverless'?'error':'warn','Persistência do banco',remote?'Banco remoto: configure o token de acesso e confirme a conectividade.':target==='serverless'?'Hospedagem sem servidor exige banco remoto persistente.':'Banco em arquivo: confirme o volume persistente e mantenha uma cópia externa.');
 add('email',env.RESEND_API_KEY&&env.MAIL_FROM?'ok':'warn','Recuperação e avisos por e-mail',env.RESEND_API_KEY&&env.MAIL_FROM?'Credenciais presentes; a entrega real ainda precisa ser homologada.':'Sem RESEND_API_KEY e MAIL_FROM, recuperação por e-mail e envio de avisos ficam indisponíveis.');
 add('cron',target==='serverless'?(env.CRON_SECRET?.length>=24&&!placeholder(env.CRON_SECRET)?'ok':'error'):'warn','Agendamento de backups',target==='serverless'?'Configure CRON_SECRET com pelo menos 24 caracteres e valide o agendador da hospedagem.':'O servidor local precisa permanecer em execução no horário do agendamento.');
 return checks;
}
const canonical=value=>JSON.stringify(value,(key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a<b?-1:a>b?1:0)):item);
export function inspectPublicationBackup(record,currentHash,now=Date.now()){
 if(!record)return [{id:'backup-integrity',status:'error',title:'Backup completo',detail:'Nenhum backup no banco. Crie e baixe um backup completo antes de publicar.'}];
 let valid=false;
 try{const payload=JSON.parse(gunzipSync(Buffer.from(String(record.data),'base64'),{maxOutputLength:50*1024*1024}).toString('utf8'));const {em,...state}=payload;valid=payload.versao===2&&!!payload.docs&&typeof payload.docs==='object'&&!Array.isArray(payload.docs)&&Array.isArray(payload.users)&&Array.isArray(payload.notifications)&&createHash('sha256').update(canonical(state)).digest('hex')===record.hash}catch{}
 const age=now-Date.parse(record.at),fresh=Number.isFinite(age)&&age>=-60000&&age<=48*60*60*1000;
 return [{id:'backup-integrity',status:valid?'ok':'error',title:'Integridade do último backup',detail:valid?'Backup completo legível e hash conferido. Isso não substitui um teste de restauração.':'O último backup não pôde ser validado como backup completo. Gere outra cópia e investigue antes de publicar.'},
 {id:'backup-current',status:valid&&fresh&&record.hash===currentHash?'ok':'warn',title:'Atualidade do backup',detail:valid&&fresh&&record.hash===currentHash?'Backup recente e correspondente aos dados atuais.':'Há dados posteriores ao backup, a cópia tem mais de 48 horas ou não foi validada. Crie uma cópia atualizada.'}];
}
export const publicationManualChecks=['Baixar e guardar uma cópia externa do backup completo, separada do servidor.','Restaurar a cópia em um banco isolado e conferir contas, turmas, registros e reservas.','Homologar os acessos de coordenação, docente, ambientes e aluno no endereço publicado.','Verificar HTTPS, entrega real de e-mails e execução do agendador na hospedagem.'];

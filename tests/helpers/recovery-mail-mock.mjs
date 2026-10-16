// Preload exclusivo dos testes: nenhuma mensagem sai para o provedor real.
import {writeFileSync} from 'node:fs';
if(!process.env.UI_TEST_MAIL_FILE)throw new Error('Arquivo de teste obrigatório.');
globalThis.fetch=async(url,options)=>{
 if(String(url)!=='https://api.resend.com/emails/batch')throw new Error('Rede externa bloqueada neste teste.');
 writeFileSync(process.env.UI_TEST_MAIL_FILE,options.body);return new Response('{}',{status:200});
};

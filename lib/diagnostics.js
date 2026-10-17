export const diagnosticOperations=new Set(['load','api','ui','xlsx','docente-xlsx','turma-preview','docente-preview','ics','cron','set','set_many','delete','restore','environment_save','reservation_request','reservation_decide','reservation_cancel','reservation_reschedule','planning_preview','planning_apply','management_report','backup_now','backup_download','backup_restore','notify_send','notify_preview','email','whatsapp','recovery_email','password_reset_request','password_reset_confirm']);
export const diagnosticCodes={
 SERVER_UNEXPECTED:{title:'Falha interna',detail:'Tente novamente. Se a falha persistir, informe a referência ao responsável técnico.'},
 DATABASE_FAILURE:{title:'Falha de acesso ao banco',detail:'Confira a disponibilidade do banco e a configuração de conexão no servidor.'},
 CONFIGURATION_FAILURE:{title:'Configuração incompleta',detail:'Confira as variáveis exigidas na aba Publicação e na configuração da hospedagem.'},
 EXPORT_REJECTED:{title:'Exportação não concluída',detail:'Confira os dados, o período e o docente escolhidos. Gere a prévia novamente.'},
 EXPORT_MODEL_MISSING:{title:'Modelo de exportação indisponível',detail:'Confira o build e publique novamente os modelos incorporados ao sistema.'},
 SERVICE_FAILURE:{title:'Falha em serviço externo',detail:'Confira o provedor e a configuração do canal. O diagnóstico não guarda respostas nem destinatários.'},
 CLIENT_NETWORK:{title:'Navegador sem conexão com a API',detail:'Confira a conexão e a disponibilidade do site. Este registro é enviado quando a API volta a responder.'},
 CLIENT_SCRIPT:{title:'Falha de execução na interface',detail:'Atualize a página e tente repetir a ação. Informe a referência e os passos ao suporte.'},
 CLIENT_PROMISE:{title:'Operação da interface interrompida',detail:'Confira se a ação foi concluída antes de tentar novamente. Informe a referência ao suporte.'}
};
export const safeOperation=v=>diagnosticOperations.has(v)?v:'api';
export function failureCode(error){
 const code=String(error?.code||'');
 if(/SQLITE|LIBSQL|SQL_|CONNECT|ECONN|ETIMEDOUT/.test(code))return 'DATABASE_FAILURE';
 const message=String(error?.message||'');
 if(/^Configure (SESSION_SECRET|ADMIN_PASSWORD)/.test(message))return 'CONFIGURATION_FAILURE';
 if(/modelo.*(não encontrado|indisponível)/i.test(message))return 'EXPORT_MODEL_MISSING';
 return 'SERVER_UNEXPECTED';
}
export function responseIncident(operation,status,code){
 if(operation.startsWith('diagnostics_')||[401,403,404,409,429].includes(status))return null;
 if(status<500&&!(['xlsx','docente-xlsx','turma-preview','docente-preview'].includes(operation)&&status===400))return null;
 const exporting=['xlsx','docente-xlsx','turma-preview','docente-preview','ics'].includes(operation);
 const saving=['set','set_many','delete','restore','environment_save','planning_apply','backup_restore'].includes(operation);
 return {source:'servidor',category:exporting?'exportacao':saving?'salvamento':'servidor',severity:status>=500?'erro':'aviso',operation:safeOperation(operation),status,code:exporting&&status===400&&(!code||code==='SERVER_UNEXPECTED')?'EXPORT_REJECTED':diagnosticCodes[code]?code:'SERVER_UNEXPECTED'};
}
export function clientIncident(event,operation){
 if(!['network','script','promise'].includes(event))throw Error('Tipo de ocorrência inválido.');
 return {source:'navegador',category:event==='network'?'conexao':'interface',severity:'erro',operation:safeOperation(operation),status:0,code:event==='network'?'CLIENT_NETWORK':event==='script'?'CLIENT_SCRIPT':'CLIENT_PROMISE'};
}
export const incidentKey=e=>[e.source,e.category,e.operation,e.status,e.code].join(':');

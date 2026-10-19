// O cliente de arquivo abre outra conexão a cada transaction(). Mantemos uma
// conexão e uma fila exclusiva para que leituras não vejam gravações pendentes.
export function localDatabase(client){
 let tail=Promise.resolve();
 async function acquire(){
  const previous=tail;let release;tail=new Promise(resolve=>{release=resolve});
  await previous;return release;
 }
 async function exclusive(work){const release=await acquire();try{return await work()}finally{release()}}
 return {
  execute:(...args)=>exclusive(()=>client.execute(...args)),
  async transaction(mode='write'){
   if(!['write','read','deferred'].includes(mode))throw new Error('Modo de transação inválido.');
   const release=await acquire();let active=true;
   try{await client.execute(mode==='write'?'BEGIN IMMEDIATE':'BEGIN DEFERRED')}catch(error){release();throw error}
   const check=()=>{if(!active)throw new Error('A transação já foi encerrada.')};
   const finish=async sql=>{if(!active)return;try{await client.execute(sql)}finally{if(sql==='ROLLBACK'){active=false;release()}}if(active){active=false;release()}};
   return {
    execute(...args){check();return client.execute(...args)},
    async commit(){check();await finish('COMMIT')},
    rollback:()=>finish('ROLLBACK'),
    close:()=>finish('ROLLBACK'),
    get closed(){return !active}
   };
  },
  close:()=>exclusive(()=>client.close())
 };
}

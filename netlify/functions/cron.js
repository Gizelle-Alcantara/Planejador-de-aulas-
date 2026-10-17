// Netlify Scheduled Function: todo dia às 23:00 UTC (20:00 em Salvador)
import { runDaily } from "../../lib/core.js";
export default async () => { try{await runDaily();console.log('Rotina diária executada. Consulte Diagnóstico para falhas.')}catch{throw new Error('Rotina diária não concluída. Consulte Diagnóstico.')} };
export const config = { schedule: "0 23 * * *" };

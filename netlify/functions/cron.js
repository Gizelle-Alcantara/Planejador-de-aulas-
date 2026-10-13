// Netlify Scheduled Function: todo dia às 23:00 UTC (20:00 em Salvador)
import { runDaily } from "../../lib/core.js";
export default async () => { const r = await runDaily(); console.log(JSON.stringify(r)); };
export const config = { schedule: "0 23 * * *" };

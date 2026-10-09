// Vercel Function (Node.js) — responde em /api
import { handle } from "../lib/core.js";
export default { fetch: (req) => handle(req) };

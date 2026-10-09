// Netlify Function (v2) — responde em /api
import { handle } from "../../lib/core.js";
export default async (req) => handle(req);
export const config = { path: "/api" };

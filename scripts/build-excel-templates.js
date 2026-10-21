import { readFileSync, writeFileSync } from 'node:fs';
import { unzipSync } from 'fflate';

// Incorpora os modelos ao módulo para sobreviver ao empacotamento serverless.
const models = {};
for (const name of ['docente', 'senai', 'frequencia']) {
  const bytes = readFileSync(new URL(name==='frequencia'?'../lib/assets/frequencia-horista-modelo.xlsx':`../lib/assets/calendario-${name}-modelo.xlsx`, import.meta.url));
  const files = unzipSync(bytes);
  if (!files['xl/workbook.xml'] || !files['xl/worksheets/sheet1.xml']) {
    throw new Error(`Modelo Excel inválido: ${name}`);
  }
  models[name] = bytes.toString('base64');
}
writeFileSync(new URL('../lib/excel-templates.js', import.meta.url),
  '// Gerado por scripts/build-excel-templates.js a partir dos modelos originais.\n' +
  `const models = ${JSON.stringify(models)};\n` +
  'export function excelTemplate(name) {\n' +
  '  if (!Object.hasOwn(models, name)) throw new Error("Modelo Excel desconhecido.");\n' +
  '  return Buffer.from(models[name], "base64");\n' +
  '}\n');

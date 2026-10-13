// Gera public/index.html e public/shim.js a partir de src/
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
const rd = (p) => readFileSync(new URL("../src/" + p, import.meta.url), "utf8");
let t = rd("tpl.html");
const rep = (a, b) => { if (!t.includes(a)) throw new Error("trecho não encontrado: " + a.slice(0, 50)); t = t.split(a).join(b); };

t = t.replace("__SEED__", () => rd("seed.json").trim()).replace("__LOGO__", () => rd("logo.b64").trim());
// o shim precisa existir antes do aplicativo
rep("<style>\n/* Layout", '<link rel="manifest" href="/manifest.webmanifest">\n<meta name="theme-color" content="#0b5cab">\n<link rel="icon" href="/icon-192.png">\n<script src="/shim.js"></script>\n<style>\n/* Layout');
rep('const BASE0="https://claude.ai/artifact/CfTYuZKeRR1fAn42uNdZtZ";', 'const BASE0=location.origin+"/";');
// textos de compartilhamento
rep("Compartilhe o artefato como Visualizador na opção Compartilhar.", "Basta enviar o link: quem abre só visualiza.");
rep("Link do artefato (base de todos os links)", "Endereço do site (base de todos os links)");
rep("Só quem recebe acesso de Editor consegue salvar alterações. Todos os outros abrem uma tela para escolher entre a visão do aluno e a do docente.", "Só o coordenador, com a senha, consegue salvar alterações. Todos os outros abrem uma tela para escolher entre a visão do aluno e a do docente.");
rep('step(1,"Abra o menu Compartilhar do artefato","Fica no cabeçalho da página do artefato no claude.ai, fora deste planejador.")', 'step(1,"Copie o link da turma ou do docente","Os links ficam nesta aba. Eles abrem sempre a visão somente leitura.")');
rep('step(2,"Alunos e docentes: acesso de Visualizador","Convide por e-mail ou use o link geral. Quem só visualiza escolhe entre a visão do aluno e a do docente e não altera nada.")', 'step(2,"Alunos e docentes: só visualizam","Não precisam de conta nem de senha. Quem abre o endereço do site escolhe entre a visão do aluno e a do docente e não altera nada.")');
rep('step(3,"Coordenação: o único acesso de Editor","Só o nível Editor edita o calendário. Dê esse acesso apenas ao coordenador. Contribuidores, Comentaristas e Visualizadores ficam sem edição. Quem criou o artefato continua podendo editar.")', 'step(3,"Coordenação: a única que edita","A edição exige a senha do coordenador (variável ADMIN_PASSWORD do servidor). Para entrar, abra o endereço do site seguido de #login.")');
rep("A permissão de acesso é definida no menu Compartilhar. Este planejador não consegue mudá-la. Quem abre precisa estar com a conta ativa para ver os dados ao vivo.", "A permissão é verificada no servidor: sem a senha, nenhuma alteração é gravada.");
rep("A edição do calendário é restrita à coordenação.</p>", 'A edição do calendário é restrita à coordenação. <a href="#login">Acesso do coordenador</a></p>');
mkdirSync(new URL("../public/", import.meta.url), { recursive: true });
writeFileSync(new URL("../public/index.html", import.meta.url), t);
copyFileSync(new URL("../src/shim.js", import.meta.url), new URL("../public/shim.js", import.meta.url));
for (const f of readdirSync(new URL("../src/static/", import.meta.url))) copyFileSync(new URL("../src/static/" + f, import.meta.url), new URL("../public/" + f, import.meta.url));
console.log("public/index.html gerado (" + Math.round(t.length / 1024) + " KB)");

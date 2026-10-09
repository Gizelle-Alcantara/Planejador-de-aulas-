PRAGMA foreign_keys=ON;
CREATE TABLE docentes(id INTEGER PRIMARY KEY, nome TEXT UNIQUE NOT NULL, email TEXT);
CREATE TABLE docente_bloqueio_semana(docente_id INTEGER NOT NULL REFERENCES docentes(id), dia_semana INTEGER NOT NULL CHECK(dia_semana BETWEEN 0 AND 6), PRIMARY KEY(docente_id,dia_semana)); -- 0=domingo
CREATE TABLE docente_bloqueio_periodo(id INTEGER PRIMARY KEY, docente_id INTEGER NOT NULL REFERENCES docentes(id), de DATE NOT NULL, ate DATE NOT NULL, motivo TEXT);
CREATE TABLE turmas(id TEXT PRIMARY KEY, codigo TEXT NOT NULL, curso TEXT, turno TEXT, modulo TEXT, coordenador TEXT, email TEXT, local TEXT, inicio DATE, termino DATE, aulas_por_dia INTEGER, destinatarios TEXT);
CREATE TABLE disciplinas(id INTEGER PRIMARY KEY, turma_id TEXT NOT NULL REFERENCES turmas(id), sigla TEXT NOT NULL, nome TEXT NOT NULL, carga_horaria INTEGER NOT NULL, docente_id INTEGER REFERENCES docentes(id), sala TEXT, UNIQUE(turma_id,sigla));
CREATE TABLE calendario(turma_id TEXT NOT NULL REFERENCES turmas(id), data DATE NOT NULL, tipo TEXT, rotulo TEXT, PRIMARY KEY(turma_id,data));
CREATE TABLE aulas(turma_id TEXT NOT NULL, data DATE NOT NULL, disciplina_id INTEGER NOT NULL REFERENCES disciplinas(id), FOREIGN KEY(turma_id,data) REFERENCES calendario(turma_id,data), PRIMARY KEY(turma_id,data,disciplina_id));
CREATE TABLE envios(id INTEGER PRIMARY KEY, turma_id TEXT NOT NULL REFERENCES turmas(id), enviado_em TEXT, canal TEXT, periodo TEXT, assinatura TEXT);
CREATE VIEW v_aulas AS SELECT t.codigo turma, a.data, d.sigla, d.nome disciplina, o.nome docente FROM aulas a JOIN turmas t ON t.id=a.turma_id JOIN disciplinas d ON d.id=a.disciplina_id LEFT JOIN docentes o ON o.id=d.docente_id ORDER BY a.data;
CREATE VIEW v_resumo_disciplina AS SELECT t.codigo turma, d.sigla, d.nome, d.carga_horaria, o.nome docente, COUNT(a.data) encontros_alocados FROM disciplinas d JOIN turmas t ON t.id=d.turma_id LEFT JOIN docentes o ON o.id=d.docente_id LEFT JOIN aulas a ON a.disciplina_id=d.id GROUP BY d.id;

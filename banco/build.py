import json,glob,sqlite3,os
D='/tmp/claude-0/db1/planejador/'
if os.path.exists('planejador.db'): os.remove('planejador.db')
c=sqlite3.connect('planejador.db'); c.executescript(open('schema.sql').read())
g=json.load(open(D+'geral.json')); dm={}
for x in g['docentes']:
    i=c.execute('insert into docentes(nome,email) values(?,?)',(x['nome'],x.get('email',''))).lastrowid; dm[x['nome']]=i
    for s in x.get('semana',[]): c.execute('insert into docente_bloqueio_semana values(?,?)',(i,s))
    for b in x.get('bloqueios',[]): c.execute('insert into docente_bloqueio_periodo(docente_id,de,ate,motivo) values(?,?,?,?)',(i,b['de'],b['ate'],b.get('motivo')))
for f in sorted(glob.glob(D+'turma-*.json')):
    tid=os.path.basename(f)[6:-5]; s=json.load(open(f))['state']; k=s['cfg']
    c.execute('insert into turmas values(?,?,?,?,?,?,?,?,?,?,?,?)',(tid,k.get('turma'),k.get('curso'),k.get('turno'),k.get('modulo'),k.get('coord'),k.get('email'),k.get('local'),k.get('inicio'),k.get('termino'),k.get('aulasDia'),k.get('destinatarios')))
    um={}
    for u in s.get('ucs',[]):
        d=u.get('docente'); 
        if d and d not in dm: dm[d]=c.execute('insert into docentes(nome) values(?)',(d,)).lastrowid
        um[u['sigla']]=c.execute('insert into disciplinas(turma_id,sigla,nome,carga_horaria,docente_id,sala) values(?,?,?,?,?,?)',(tid,u['sigla'],u['nome'],u['ch'],dm.get(d),u.get('sala'))).lastrowid
    for iso,v in s.get('days',{}).items():
        c.execute('insert into calendario values(?,?,?,?)',(tid,iso,v.get('t'),v.get('h')))
        for sg in v.get('s',[]):
            if sg in um: c.execute('insert into aulas values(?,?,?)',(tid,iso,um[sg]))
    for e in s.get('envios',[]): c.execute('insert into envios(turma_id,enviado_em,canal,periodo,assinatura) values(?,?,?,?,?)',(tid,e.get('em'),e.get('canal'),e.get('periodo'),e.get('sig')))
c.commit()
open('planejador_completo.sql','w').write('\n'.join(c.iterdump()))
for t in ['docentes','turmas','disciplinas','calendario','aulas','envios']: print(t,c.execute(f'select count(*) from {t}').fetchone()[0])
print(c.execute('select * from v_resumo_disciplina').fetchall()[:20])

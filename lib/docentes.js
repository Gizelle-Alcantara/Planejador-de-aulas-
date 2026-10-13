export function validateDocentes(list) {
  if (!Array.isArray(list)) return 'Lista de docentes inválida.';
  const names=new Set(), ids=new Set();
  for(const d of list){
    if(!d||typeof d.nome!=='string'||!d.nome.trim()||d.nome.length>160)return 'Informe um nome válido para o docente (até 160 caracteres).';
    const name=d.nome.trim().toLocaleLowerCase('pt-BR');if(names.has(name))return 'Nome de docente já cadastrado.';names.add(name);
    for(const f of ['email','emailInstitucional','tel','matricula','vinculo','unidade','area','formacao','meuSenai','observacoes'])if(d[f]!=null&&(typeof d[f]!=='string'||d[f].length>(f==='observacoes'?2000:300)))return `Campo ${f} inválido ou muito longo.`;
    for(const f of ['email','emailInstitucional'])if(d[f]&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d[f]))return 'Informe um e-mail válido.';
    if(d.tel&&!/^\+?[\d\s().-]{8,25}$/.test(d.tel))return 'Informe um telefone válido.';
    if(d.vinculo&&!['Mensalista','Horista','Intermitente','RSA'].includes(d.vinculo))return 'Vínculo inválido.';
    if(d.matricula){const id=d.matricula.trim().toLowerCase();if(ids.has(id))return 'Matrícula de docente já cadastrada.';ids.add(id);}
  }
  return null;
}

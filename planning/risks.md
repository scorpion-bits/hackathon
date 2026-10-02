# Riscos

> Revisar a cada checkpoint. Prob./Impacto: B (baixo) · M (médio) · A (alto).

| ID | Risco | Prob. | Impacto | Sinal de alerta | Mitigação | Plano B |
|---|---|---|---|---|---|---|
| R-01 | Dataset grande, sujo ou em formato difícil (PDF, XLS mal formatado, encoding) | M | A | `profile_data.py` falha ou mostra muitos nulos/colunas inválidas | Perfil automático logo cedo; limpar só as colunas usadas pela solução | Usar subconjunto/recorte (um ano, uma cidade) e declarar na apresentação |
| R-02 | Análise/decisão demora demais (paralisia) | M | A | CP3 não fechado às 11h30 | Timebox nos gates; Claude sempre traz recomendação clara | Product Owner decide com base na recomendação |
| R-03 | Escopo cresce durante a construção | A | A | Novas ideias implementadas sem passar por classificação | Regra FAZER AGORA / BACKLOG / DESCARTAR; feature freeze 20h00 | Cortar SHOULD/COULD imediatamente |
| R-04 | Integração quebra no fim (partes não se encaixam) | M | A | Módulos desenvolvidos isolados sem rodar juntos até tarde | Fatia vertical primeiro; contratos de dados definidos no CP5; integrar continuamente | Reverter para último commit funcionando (tag `demo-ok-*`) |
| R-05 | Deploy/ambiente falha na hora da demo | M | A | Deploy ainda não testado às 20h00 | Testar deploy cedo; rodar local como alternativa | Rodar localmente + vídeo gravado da demo |
| R-06 | Internet instável no local | M | M | Downloads lentos / quedas na manhã | Baixar datasets e dependências assim que liberados | Demo 100% offline com dados locais |
| R-07 | Conhecimento da equipe não bate com a stack | M | M | H-002 vazio ou stack escolhida sem afinidade | Escolher stack com base em H-002 | Claude/agentes assumem a parte de menor afinidade |
| R-08 | Conflitos de merge / perda de trabalho | M | M | Várias pessoas editando o mesmo arquivo | Divisão por módulos; commits pequenos e frequentes; push a cada tarefa | Claude resolve conflitos; tags de ponto seguro |
| R-09 | Insights incorretos ou números errados no pitch | B | A | Número sem script reprodutível | Todo número com origem em script/notebook; revisão do Data lead | Remover número duvidoso do pitch |
| R-10 | Pitch deixado para o fim | M | A | Nenhum slide às 20h00 | Rascunho a partir do CP4; Pitch lead dedicado | Template simples com 9 seções de `08-pitch.md` |
| R-11 | Cansaço na madrugada degrada qualidade | A | M | Commits quebrando build após 22h00 | Nada de feature nova após 20h00; revezamento | Reverter ao último estado estável |
| R-12 | Questões de privacidade/LGPD nos dados | B | M | Dados com CPF, nomes, endereços | Agregar/anonimizar; não exibir dados pessoais | Usar apenas dados agregados |
| R-13 | **Ambiente do Claude sem acesso de rede a portais gov.br/ANA/IBGE/INMET** (confirmado 02/10) | A (ocorrendo) | A | downloads retornam 403 | Humanos baixam os arquivos e enviam no chat ou fazem push em `data/raw/` | Liberar domínios no ambiente e abrir sessão nova |

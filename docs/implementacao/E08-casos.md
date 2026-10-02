# E08 — Casos enviados ao técnico, persistidos

> Modelo: **Sonnet** · Esforço: **médio** · ~40 min · Depende de: E07 · Essencial.

## Objetivo
"Enviar meu caso" grava no backend:
- o assunto;
- o **retrato das evidências** naquele momento;
- o órgão, o canal, a observação;
- o **consentimento LGPD** com data e hora.

O backend gera o protocolo (`AB-1001`…). "Meus casos" lê da API, e "Simular resposta (demo)" grava uma resposta de exemplo (D-019).

## Contexto necessário
- Modelo `Case` criado na E01.
- No front, `resolve.ts` tem `EXPERTS` (cati, senar, prefeitura), `sendCase`, `resetCases` e `useCases` (localStorage).
- `pages/Cases.tsx` mostra a linha do tempo Enviado → Recebido pelo órgão → Técnico respondeu.
  - As respostas de exemplo estão em `SAMPLE_REPLY` (por id `i1`…`i6`); passam a ser por `kind` do assunto.
- Instituições são **exemplos de integração**: nenhum convênio existe e nenhum nome de pessoa aparece (`docs/10-business-model.md`).

## Passos (🤖 AGENT EXECUTION)
1. Backend (`routers/cases.py`):
   - `POST /api/cases {topic_key, expert_id, channel, path?, note?, consent: true}`:
     - recusa com 400 se `consent` não for `true`;
     - copia o assunto atual (de `topics.py`) para `snapshot`;
     - gera o protocolo sequencial; `status="recebido"` (simula a entrega ao órgão).
   - `GET /api/cases` lista os casos do produtor.
   - `GET /api/cases/{id}`.
   - `POST /api/cases/{id}/demo-reply` grava `reply` a partir das respostas-modelo por `kind`, com `reply_is_example=True` e `status="respondido"`.
   - `DELETE /api/cases` só para o demo (botão "Recomeçar a demonstração"); também apaga o `TopicState`.
   - Mover os `EXPERTS` para o backend (`GET /api/experts`), com os mesmos textos; `BEST_EXPERT` vira o `expert_id` do assunto (E06).
2. Front:
   - `sendCase`, `useCases` e `resetCases` passam a chamar a API, mantendo o fallback local;
   - `Cases.tsx` mostra o protocolo e a data vindos da API;
   - a resposta mostra o selo "exemplo" quando `reply_is_example`.
3. **Mapa anônimo da demanda** (ativo para o governo, `docs/10`): criar `GET /api/demand?geocode=…`, com contagem de casos por `kind` no município e **supressão de grupos com menos de 3** (D-007). Só a API; a tela é opcional.
4. Testes: sem consentimento → 400; o protocolo é sequencial; o snapshot contém as fontes; a demanda suprime grupos menores que 3.

## Pronto quando
- Enviar um caso → ele aparece em Meus casos → continua lá depois de recarregar.
- "Simular resposta" mostra a resposta de exemplo.
- "Recomeçar a demonstração" limpa os casos e os assuntos resolvidos.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → João → Resolver um assunto → passo 3 → marcar o consentimento → "Enviar meu caso": anote o protocolo.
2. Meus casos → o mesmo protocolo aparece → recarregar (F5) → continua lá → "Simular resposta (demo)".
3. "Recomeçar a demonstração" → a lista fica vazia.

## 👥 Ações humanas
- (Quando o mentor estiver disponível) mostrar ao técnico da CATI o que o caso contém. Pergunta: "o que falta para você atender este produtor?". Anotar a resposta em `docs/10-business-model.md`.

## Scripts de subir
Sem mudanças (aumentar `SCHEMA_VERSION` se `Case` mudou).

# 07 — Testes

> Objetivo: confiança suficiente para apresentar, não cobertura perfeita.
> Checkpoint alvo: CP8. Começar testes assim que o fluxo principal existir (CP6).

## Prioridades
1. Fluxo principal (demo flow de `04-mvp.md`) de ponta a ponta
2. Integração entre módulos
3. Dados (pipeline reproduz `processed` a partir de `raw`; contagens batem)
4. Casos extremos (filtro vazio, valor nulo, entrada inválida)
5. Interface (telas da demo, projetor, resolução)
6. Performance (tempo de carregamento aceitável na demo)

## Testes automatizados
| ID | O que testa | Arquivo | Status |
|---|---|---|---|
| | | | |

Comando: _definir após stack_ (ex.: `pytest tests/`)

## Checklist de teste manual (👥)
- [ ] Demo flow completo executado por alguém que NÃO desenvolveu
- [ ] Rodou na máquina que será usada na apresentação
- [ ] Rodou com a internet do local (ou plano offline validado)
- [ ] Números mostrados na demo conferidos com os dados
- [ ] Textos sem erros de português
- [ ] Funciona em tela de projetor / zoom 125%

## Bugs conhecidos
| ID | Descrição | Severidade | Afeta demo? | Status |
|---|---|---|---|---|
| | | | | |

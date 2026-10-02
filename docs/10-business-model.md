# 10 — Modelo de negócio e responsabilidade técnica (D-015)

> Decisão da equipe em 02/10 ~16h: **modelo A — serviço público ligado à assistência técnica do governo (ATER)**.
> Números marcados "verificar" precisam de fonte antes de entrar no pitch.

## O problema que motivou a mudança
A primeira versão sugeria "soluções" geradas pela IA. A IA **não é especialista**: se o produtor seguir uma sugestão e tiver
prejuízo, a responsabilidade recai sobre a plataforma e os desenvolvedores. Além disso, recomendar defensivo e dose exige
**receituário agronômico assinado por engenheiro agrônomo** (Lei 7.802/89 — Lei dos Agrotóxicos).

## O que o AgroBits passa a ser
**Não decide — prepara o caso e leva ao técnico público.**

```
Dados abertos + contexto do produtor → AgroBits detecta o assunto → mostra os dados oficiais e "caminhos possíveis"
(informação, não prescrição) → monta o caso (talhão, cultura, solo, dados com fonte e data) → envia, com consentimento,
ao órgão de assistência técnica pública → técnico orienta → produtor acompanha em "Meus casos"
```

- O produtor **não paga nada**.
- O técnico recebe o caso **já organizado com dados oficiais** — menos tempo levantando informação, visitas mais certeiras.
- A IA continua útil para **explicar dados** ("o que é o Zarc?", "choveu mais que o normal?"), sempre com fonte e aviso de que não é receita.

## Modelo A — público
| Item | Como fica |
|---|---|
| Quem atende | Técnicos e engenheiros agrônomos da **ATER pública**: em SP, a CATI (Casas da Agricultura nos municípios); em outros estados, Emater/órgão estadual; parceiros como Senar (assistência técnica gratuita) e secretarias municipais de agricultura |
| Quem paga | **Governo** — convênio com a secretaria estadual de agricultura / ANATER (Agência Nacional de ATER, criada pela Lei 12.897/2013), ou programa municipal |
| Por que o governo pagaria | Cobertura de assistência técnica é baixa (Censo Agro 2017/IBGE: cerca de 20% dos estabelecimentos receberam orientação técnica — **verificar**). O AgroBits **multiplica o alcance** de cada técnico: triagem, casos pré-organizados, atendimento remoto quando dá |
| Ativo extra para o governo | **Mapa anônimo da demanda** ("quantos produtores da região relataram seca nesta safra"), agregado com supressão de grupos < 3 (D-007) — ajuda a planejar visitas, cursos e políticas |
| Custo de operação | Baixo: dados abertos gratuitos, hospedagem simples; IA via modelo gratuito/aberto ou modo offline (D-004) |

### Riscos e como mitigar
| Risco | Mitigação |
|---|---|
| Fila: poucos técnicos para muitos casos | Triagem por urgência (ex.: janela de plantio fechando, chuva forte em 48 h); respostas-padrão revisadas por técnicos para dúvidas comuns |
| Dependência de convênio (lento) | Piloto pequeno com **um município** (ex.: Araraquara) e a Casa da Agricultura local; depois, edital de inovação (FAPESP PIPE, Finep) |
| Privacidade (LGPD) | Envio só com consentimento explícito, só para o órgão escolhido; produtor pode cancelar; nada é vendido |
| Responsabilidade | O app mostra **informação com fonte**; a orientação é sempre do técnico habilitado |

## Alternativas consideradas (não escolhidas)
- **B — marketplace pago** (agrônomos particulares, produtor paga): viável, mas exclui quem mais precisa; conflita com o impacto social.
- **C — híbrido** (público para pequenos, particular para médios/grandes): pode ser a evolução natural depois do piloto público.

## Frase para o pitch
*"O AgroBits não substitui o agrônomo — leva a assistência técnica pública até quem nunca foi atendido, com os dados oficiais já organizados."*

## No protótipo
- Tela **Resolver**: 1) o que os dados mostram → 2) caminhos possíveis (aviso "o AgroBits não decide por você") →
  3) **Leve para um técnico — de graça** (órgão indicado, resumo do caso, canal de resposta, consentimento LGPD) → protocolo.
- Tela **Meus casos**: enviado → recebido pelo órgão → técnico respondeu (respostas de exemplo, sem nomes de pessoas).
- Instituições aparecem como **exemplo de integração**; não há convênio firmado.

## Pendências 👥
- Validar o fluxo com um técnico da CATI / Casa da Agricultura de Araraquara (via mentor, quando disponível).
- Confirmar o percentual de assistência técnica no Censo Agro 2017 antes do slide.

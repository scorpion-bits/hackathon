# E14 — Windows sem Docker

> Modelo: **Sonnet** · Esforço: **médio** · ~40 min · Se der tempo (só é necessário se alguém da equipe usar Windows sem Docker Desktop).

## Objetivo
`iniciar.bat` sobe tudo no Windows **sem Docker e sem administrador**, como o `dev.sh` faz no Linux.

## Contexto necessário
- `iniciar.ps1` hoje **exige Docker** (falha na linha que procura `docker`).
- `dev.sh` (Linux) baixa o Node 22 portátil em `.tools/node` e o `uv` em `.tools/uv`; o `uv` traz o próprio Python 3.11.
  Ele reinstala dependências só quando o hash muda, gera os bancos se faltarem e roda `seed_demo.py --if-needed`.
- PowerShell 5.1: usar `$ErrorActionPreference = "Continue"` (stderr de programas nativos) e salvar o `.ps1` com **CRLF** (`.gitattributes`).
- Não há PowerShell neste ambiente de desenvolvimento: **a equipe testa no Windows**.

## Passos (🤖 AGENT EXECUTION)
1. Criar `dev.ps1`, equivalente ao `dev.sh`:
   - baixar o Node zip (`https://nodejs.org/dist/latest-v22.x/`, arquivo `win-x64.zip`) para `.tools\node`;
   - baixar o `uv` (`https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-pc-windows-msvc.zip`) para `.tools\uv`;
   - `uv venv --python 3.11 .venv`, `pip install`, pipeline, seed `--if-needed`;
   - subir a API e o Vite em duas janelas (`Start-Process`), e abrir o navegador.
2. Em `iniciar.ps1`: sem Docker (ou com o daemon parado) → chamar o `dev.ps1`, como o `iniciar.sh` faz com o `dev.sh`.
3. Atualizar o `README.md`.

## 🧪 Como a equipe testa (👥, no Windows)
1. `git pull`, depois dar dois cliques em `iniciar.bat` (ou rodar `iniciar.bat sem-docker`).
2. Na primeira vez demora (downloads). O navegador deve abrir o AgroBits.
3. Se der erro, **copiem a mensagem inteira da janela** e colem no chat.

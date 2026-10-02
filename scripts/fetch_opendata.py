#!/usr/bin/env python3
"""Mantém as bases do MAPA atualizadas consultando a API CKAN de dados.agricultura.gov.br.

Para cada base: pergunta ao portal quais arquivos existem e quando mudaram (metadados CKAN),
baixa SÓ o que mudou desde a última sincronização, e então reconstrói data/opendata.db.
A versão de cada arquivo fica em data/sync_state.json — é dali que sai a "data de extração"
mostrada nos selos de fonte (regra de ética: citar fonte + data).

Bases com dado pessoal (SIPEAGRO aviação, PSR) vão para data/restricted/ (fora do git) e
só entram no produto agregadas por município (D-007).

Uso:
  python scripts/fetch_opendata.py            verifica, baixa o que mudou e reconstrói o banco
  python scripts/fetch_opendata.py --check    só mostra o que mudou (não baixa nada)
  python scripts/fetch_opendata.py --only zarc --force
Agendar (todo dia 06:00):  0 6 * * *  cd /caminho/hackathon && .venv/bin/python scripts/fetch_opendata.py >> data/sync.log 2>&1
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import time
import zipfile
from dataclasses import dataclass
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "2026-10-02T00:00:00"  # data de extração dos arquivos que vieram junto com o repositório
RAW = ROOT / "data" / "raw"
RESTRICTED = ROOT / "data" / "restricted"
STATE = ROOT / "data" / "sync_state.json"
CKAN = "https://dados.agricultura.gov.br/api/3/action"
# O portal recusa (403) clientes sem User-Agent identificável; nos identificamos honestamente.
USER_AGENT = "Mozilla/5.0 (compatible; AgroBits-hackathon/1.0; +https://github.com/scorpion-bits/hackathon)"


@dataclass(frozen=True)
class Spec:
    key: str
    package_ids: tuple[str, ...]  # package_show (id conhecido)
    queries: tuple[str, ...]      # package_search (fallback / descoberta)
    pattern: str                  # regex aplicada ao nome do arquivo do recurso
    dest: Path
    keep_latest: int = 0          # >0: só os N mais recentes pelo 1º grupo da regex (ex.: safra/ano)


SPECS = [
    Spec("zarc", ("6d3d141c-885e-41a4-ab7f-dc8ff323b96f",), ("tabua de risco",),
         r"^dados-abertos-tabua-de-risco-safra-(\d{4}-\d{4})\.csv(\.zip)?$", RAW / "zarc", keep_latest=2),
    Spec("agrofit", ("sistema-de-agrotoxicos-fitossanitarios-agrofit",), ("agrofit",), r"^(agrofitprodutosformulados)\.csv(\.zip)?$", RAW / "agrofit"),
    Spec("sipeagro_aviacao", ("sipeagro",), ("sipeagro",),
         r"^sipeagroaviacaoagricola(registro|autorizacao)\.csv(\.zip)?$", RESTRICTED),
    Spec("psr", ("sisser3",), ("sisser",), r"^dados_abertos_psr_(\d{4})(csv)?\.csv(\.zip)?$", RESTRICTED, keep_latest=1),
]


def filename(resource: dict) -> str:
    return (resource.get("url") or "").rstrip("/").rsplit("/", 1)[-1].split("?")[0]


def version(resource: dict) -> str:
    return resource.get("last_modified") or resource.get("metadata_modified") or resource.get("created") or ""


def select_resources(packages: list[dict], spec: Spec) -> list[dict]:
    """Recursos dos pacotes cujo nome de arquivo casa com a regex; sem duplicatas; N mais recentes se pedido."""
    found: dict[str, dict] = {}
    rx = re.compile(spec.pattern, re.IGNORECASE)
    for pkg in packages:
        for res in pkg.get("resources", []):
            name = filename(res)
            m = rx.match(name)
            if not m:
                continue
            res = {**res, "_file": name, "_group": m.group(1), "_package": pkg.get("name") or pkg.get("id")}
            # mesmo arquivo publicado em dois pacotes: fica o mais novo
            if name not in found or version(res) > version(found[name]):
                found[name] = res
    out = sorted(found.values(), key=lambda r: (r["_group"], r["_file"]))
    if spec.keep_latest:
        groups = sorted({r["_group"] for r in out})[-spec.keep_latest:]
        out = [r for r in out if r["_group"] in groups]
    return out


def local_path(dest: Path, name: str) -> Path:
    """Arquivos .csv são guardados zipados (o CSV do Zarc tem ~200 MB; zipado, ~12 MB)."""
    return dest / (name + ".zip" if name.endswith(".csv") else name)


def needs_check(res: dict, state: dict, dest: Path, force: bool = False) -> str | None:
    """Motivo para baixar, ou None se já conferimos esta versão publicada.

    O MAPA republica os arquivos todo dia (a data muda mesmo sem mudança no conteúdo), então uma data
    nova só significa "conferir": o conteúdo é comparado por hash antes de substituir qualquer coisa.
    """
    if force:
        return "forçado"
    if not local_path(dest, res["_file"]).exists():
        return "arquivo novo"
    known = state.get(res["_file"], {}).get("version", "")
    remote = version(res)
    if not known or (remote and remote[:19] > known[:19]):
        return f"publicado {remote[:16].replace('T', ' ')}"
    return None


def content_hash(path: Path) -> str:
    """sha256 do conteúdo (de dentro do zip, se zipado) — compara com o que o portal entrega."""
    h = hashlib.sha256()
    if path.suffix == ".zip":
        with zipfile.ZipFile(path) as zf, zf.open(zf.namelist()[0]) as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                h.update(chunk)
    else:
        with path.open("rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                h.update(chunk)
    return h.hexdigest()


def ckan(client: httpx.Client, action: str, **params) -> dict:
    for attempt in range(4):
        try:
            r = client.get(f"{CKAN}/{action}", params=params)
            r.raise_for_status()
            body = r.json()
            if not body.get("success"):
                raise RuntimeError(body.get("error"))
            return body["result"]
        except (httpx.TransportError, httpx.HTTPStatusError):
            if attempt == 3:
                raise
            time.sleep(2 ** (attempt + 1))
    raise AssertionError("inalcançável")


def packages_for(client: httpx.Client, spec: Spec) -> list[dict]:
    pkgs = []
    for pid in spec.package_ids:
        try:
            pkgs.append(ckan(client, "package_show", id=pid))
        except Exception as exc:  # noqa: BLE001 — cai para a busca
            print(f"  [{spec.key}] package_show {pid} falhou ({exc}); usando busca")
    for q in spec.queries:
        if pkgs and select_resources(pkgs, spec):
            break
        pkgs += ckan(client, "package_search", q=q, rows=50).get("results", [])
    return pkgs


def download(client: httpx.Client, url: str, name: str, dest: Path, old_hash: str | None) -> tuple[str, int, bool]:
    """Baixa para .part calculando o hash; só substitui o arquivo local se o conteúdo mudou.

    Devolve (hash, bytes baixados, mudou?). A troca é atômica: o arquivo antigo só some quando o novo está completo.
    """
    dest.mkdir(parents=True, exist_ok=True)
    part = dest / (name + ".part")
    h = hashlib.sha256()
    with client.stream("GET", url, follow_redirects=True, timeout=httpx.Timeout(30, read=300)) as r:
        r.raise_for_status()
        with part.open("wb") as fh:
            for chunk in r.iter_bytes(1 << 20):
                h.update(chunk)
                fh.write(chunk)
    digest, size = h.hexdigest(), part.stat().st_size
    if digest == old_hash:
        part.unlink()
        return digest, size, False
    target = local_path(dest, name)
    if name.endswith(".csv"):
        tmp = target.with_suffix(".zip.part")
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
            zf.write(part, arcname=name)
        part.unlink()
        tmp.replace(target)
    else:
        part.replace(target)
    return digest, size, True


def stamp_checked() -> None:
    """Nada mudou: só registra no banco que as fontes foram conferidas hoje (selo "fonte + data")."""
    db = ROOT / "data" / "opendata.db"
    if not db.exists():
        return
    sys.path.insert(0, str(ROOT / "scripts"))
    from pipeline_opendata import extraction_dates  # noqa: PLC0415

    import sqlite3  # noqa: PLC0415
    with sqlite3.connect(db) as con:
        for key, day in extraction_dates().items():
            con.execute("UPDATE data_sources SET extracted_at=? WHERE key=?", (day, key))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="só verifica; não baixa nem reconstrói")
    ap.add_argument("--force", action="store_true", help="baixa mesmo sem mudança")
    ap.add_argument("--only", choices=[s.key for s in SPECS], action="append", help="limita a uma base (repetível)")
    ap.add_argument("--no-pipeline", action="store_true", help="não reconstrói data/opendata.db")
    args = ap.parse_args()

    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    changed: set[str] = set()
    failed: list[str] = []
    now = time.strftime("%Y-%m-%dT%H:%M:%S")

    with httpx.Client(timeout=30, headers={"User-Agent": USER_AGENT}) as client:
        for spec in SPECS:
            if args.only and spec.key not in args.only:
                continue
            print(f"[{spec.key}]")
            try:
                resources = select_resources(packages_for(client, spec), spec)
            except Exception as exc:  # noqa: BLE001 — portal fora do ar: mantém arquivos locais
                print(f"  portal indisponível ({type(exc).__name__}: {exc}) — mantendo arquivos locais")
                failed.append(spec.key)
                continue
            if not resources:
                print("  nenhum arquivo reconhecido no portal (o nome mudou? ajuste o padrão em SPECS)")
                failed.append(spec.key)
                continue
            for res in resources:
                name = res["_file"]
                why = needs_check(res, state, spec.dest, args.force)
                if not why:
                    print(f"  = {name} (já conferido)")
                    continue
                print(f"  ? {name} — {why}")
                if args.check:
                    continue
                path = local_path(spec.dest, name)
                old = state.get(name, {}).get("sha256") or (content_hash(path) if path.exists() else None)
                try:
                    digest, size, is_new = download(client, res["url"], name, spec.dest, old)
                except Exception as exc:  # noqa: BLE001
                    print(f"    falhou: {exc}")
                    failed.append(spec.key)
                    continue
                entry = state.get(name, {})
                entry.update({"source": spec.key, "version": version(res) or now, "checked_at": now,
                              "url": res["url"], "package": res["_package"], "sha256": digest, "bytes": size})
                if is_new:
                    entry["downloaded_at"] = now
                    changed.add(spec.key)
                    print(f"    ↓ conteúdo novo ({size / 1e6:.1f} MB) → {path.relative_to(ROOT)}")
                else:
                    entry.setdefault("downloaded_at", BASELINE)
                    print(f"    = conteúdo idêntico ao local ({size / 1e6:.1f} MB conferidos)")
                state[name] = entry
            state.setdefault("_checked", {})[spec.key] = now

    if args.check:
        return 1 if failed else 0
    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False, sort_keys=True) + "\n")

    if not changed and not args.no_pipeline:
        stamp_checked()
    if changed and not args.no_pipeline:
        py = sys.executable
        if "sipeagro_aviacao" in changed:
            subprocess.run([py, "scripts/aggregate_sipeagro_aviacao.py"], cwd=ROOT, check=True)
        print("Reconstruindo data/opendata.db…")
        subprocess.run([py, "scripts/pipeline_opendata.py"], cwd=ROOT, check=True)
    print(f"Fim: {len(changed)} base(s) atualizada(s){', falhas: ' + ', '.join(failed) if failed else ''}.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

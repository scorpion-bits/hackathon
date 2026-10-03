#!/usr/bin/env python3
"""Gera data/opendata.db (SQLite, somente leitura) a partir dos arquivos oficiais em data/raw.

Tabelas:
  zarc_risk     — Zarc (MAPA) safras 2025-26 e 2026-27: risco por decêndio (string de 36 chars: 0/2/3/4 = 0/20/30/40%)
  municipalities— geocódigo IBGE, UF, nome (derivado do Zarc)
  agrofit       — Agrofit (MAPA) agregado por produto × cultura, com pragas-alvo
  region_stats  — por município: drones/aviões agrícolas (SIPEAGRO), autorizações, apólices PSR (agregados anônimos)
  data_sources  — fontes, órgão, URL, data de extração (selos de fonte na interface)

Uso: python scripts/pipeline_opendata.py
"""
from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
RESTRICTED = ROOT / "data" / "restricted"
OUT = ROOT / "data" / "opendata.db"

STATE = ROOT / "data" / "sync_state.json"  # versões baixadas por scripts/fetch_opendata.py
ZARC_KEEP = 2  # duas safras mais recentes disponíveis localmente
DEC_COLS = [f"dec{i}" for i in range(1, 37)]
EXTRACTED = "2026-10-02"  # data de extração dos arquivos que vieram junto com o repositório
MIN_GROUP = 3  # D-007: suprime agregados com menos de 3 registros de pessoas


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode()
    return " ".join(text.lower().replace("'", " ").split())


def first_existing(folder: Path, stem: str) -> Path:
    """Aceita o arquivo zipado ou não (o portal publica nos dois formatos)."""
    for ext in (".csv.zip", ".csv"):
        if (folder / f"{stem}{ext}").exists():
            return folder / f"{stem}{ext}"
    raise FileNotFoundError(folder / f"{stem}.csv[.zip]")


def zarc_safras() -> list[str]:
    found = {m.group(1) for f in (RAW / "zarc").iterdir()
             if (m := re.match(r"dados-abertos-tabua-de-risco-safra-(\d{4}-\d{4})\.csv(\.zip)?$", f.name))}
    return sorted(found)[-ZARC_KEEP:]


def build_zarc() -> pd.DataFrame:
    frames = []
    for safra in zarc_safras():
        path = first_existing(RAW / "zarc", f"dados-abertos-tabua-de-risco-safra-{safra}")
        df = pd.read_csv(path, sep=";", encoding="utf-8-sig", dtype=str, low_memory=False)
        decs = df[DEC_COLS].apply(pd.to_numeric, errors="coerce").fillna(0).astype(int)
        codes = (decs // 10).astype(str).to_numpy()  # 0/20/30/40 -> "0"/"2"/"3"/"4"
        df["risk"] = ["".join(row) for row in codes]
        df["safra"] = safra.replace("-", "/")
        frames.append(df[["safra", "geocodigo", "UF", "municipio", "Nome_cultura", "Cod_Ciclo",
                          "Cod_Solo", "Nome_Outros_Manejos", "Portaria", "risk"]])
        print(f"[zarc] {safra}: {len(df):,} linhas")
    z = pd.concat(frames, ignore_index=True)
    z.columns = ["safra", "geocode", "uf", "municipality", "crop", "cycle", "soil", "management", "ordinance", "risk"]
    z["management"] = z["management"].fillna("Sequeiro")
    return z.drop_duplicates()


def build_agrofit() -> pd.DataFrame:
    df = pd.read_csv(first_existing(RAW / "agrofit", "agrofitprodutosformulados"), sep=";", dtype=str, low_memory=False)
    df = df.apply(lambda s: s.str.strip())
    grouped = (
        df.groupby(["NR_REGISTRO", "MARCA_COMERCIAL", "CULTURA"], dropna=False)
        .agg(
            ingredient=("INGREDIENTE_ATIVO", "first"),
            product_class=("CLASSE", "first"),
            holder=("TITULAR_DE_REGISTRO", "first"),
            tox_class=("CLASSE_TOXICOLOGICA", "first"),
            env_class=("CLASSE_AMBIENTAL", "first"),
            organic=("ORGANICOS", "first"),
            pests=("PRAGA_NOME_COMUM", lambda s: "; ".join(sorted({p for p in s.dropna()}))[:500]),
        )
        .reset_index()
        .rename(columns={"NR_REGISTRO": "registration", "MARCA_COMERCIAL": "brand", "CULTURA": "crop"})
    )
    grouped["tox_class"] = grouped["tox_class"].str.replace("\x96", "-", regex=False)
    grouped["brand_norm"] = grouped["brand"].map(norm)
    print(f"[agrofit] {len(grouped):,} produto×cultura")
    return grouped


def build_region(munis: pd.DataFrame) -> pd.DataFrame:
    key = (munis.assign(k=munis.uf + "|" + munis.municipality.map(norm))
           .drop_duplicates("k").set_index("k")["geocode"])

    def to_geocode(df: pd.DataFrame) -> pd.Series:
        return (df.uf + "|" + df.municipio.map(norm)).map(key)

    reg = pd.read_csv(PROCESSED / "aviacao_registro_por_municipio.csv")
    reg["geocode"] = to_geocode(reg)
    aut = pd.read_csv(PROCESSED / "aviacao_autorizacoes_por_municipio_ano.csv")
    aut["geocode"] = to_geocode(aut)
    aut_last = aut[aut.ano == aut.ano.max() - 1].groupby("geocode").autorizacoes.sum().rename("authorizations_last_year")
    aut_all = aut.groupby("geocode").autorizacoes.sum().rename("authorizations_total")

    out = munis.set_index("geocode")[["uf", "municipality"]].copy()
    out = out.join(reg.groupby("geocode")[["drones", "avioes"]].sum().rename(columns={"avioes": "planes"}))
    out = out.join(aut_last).join(aut_all)

    psr_files = sorted(PROCESSED.glob("psr_*_por_municipio.csv"))
    if psr_files:
        psr_path = psr_files[-1]  # ano mais recente
        psr = pd.read_csv(psr_path, dtype={"geocode": str}).set_index("geocode")
        out = out.join(psr)
    out = out.fillna({"drones": 0, "planes": 0, "authorizations_last_year": 0, "authorizations_total": 0})
    print(f"[region] {len(out):,} municípios · {int(out.drones.sum())} drones mapeados")
    return out.reset_index()


def latest_psr() -> tuple[Path, str] | None:
    files = [(m.group(1), f) for f in RESTRICTED.glob("dados_abertos_psr_*")
             if (m := re.match(r"dados_abertos_psr_(\d{4})(csv)?\.csv(\.zip)?$", f.name))]
    return (max(files)[1], max(files)[0]) if files else None


def aggregate_psr() -> None:
    """Agrega PSR (dado pessoal) do ano mais recente por município, suprimindo grupos < MIN_GROUP."""
    found = latest_psr()
    if not found:
        print("[psr] arquivo restrito ausente — mantendo agregado existente")
        return
    src, year = found
    p = pd.read_csv(src, sep=";", dtype=str, encoding="latin-1",
                    usecols=["CD_GEOCMU", "NM_CULTURA_GLOBAL", "NR_AREA_TOTAL", "VL_SUBVENCAO_FEDERAL"])
    num = lambda s: pd.to_numeric(s.str.replace(".", "", regex=False).str.replace(",", ".", regex=False), errors="coerce")
    p["area"], p["subsidy"] = num(p.NR_AREA_TOTAL), num(p.VL_SUBVENCAO_FEDERAL)
    g = p.groupby("CD_GEOCMU").agg(insurance_policies=("area", "size"), insured_area_ha=("area", "sum"),
                                   federal_subsidy_brl=("subsidy", "sum"))
    top = (p.groupby(["CD_GEOCMU", "NM_CULTURA_GLOBAL"]).size().rename("n").reset_index()
           .query("n >= @MIN_GROUP").sort_values("n", ascending=False)
           .groupby("CD_GEOCMU").head(3)
           .assign(t=lambda d: d.NM_CULTURA_GLOBAL + " (" + d.n.astype(str) + ")")
           .groupby("CD_GEOCMU").t.agg(", ".join).rename("insurance_top_crops"))
    g = g.join(top)
    g = g[g.insurance_policies >= MIN_GROUP].round(2)
    g.index.name = "geocode"
    g.to_csv(PROCESSED / f"psr_{year}_por_municipio.csv")
    print(f"[psr] {len(g):,} municípios (grupos < {MIN_GROUP} suprimidos)")


SOURCES = [
    ("zarc", "Zoneamento Agrícola de Risco Climático — Tábua de Risco", "MAPA / SPA / CGRA",
     "https://dados.agricultura.gov.br/dataset/6d3d141c-885e-41a4-ab7f-dc8ff323b96f", "safras 2025-26 e 2026-27"),
    ("agrofit", "Agrofit — Produtos Formulados", "MAPA", "https://dados.agricultura.gov.br/dataset/agrofit", "registro vigente"),
    ("sipeagro_aviacao", "SIPEAGRO — Aviação Agrícola (registro e autorizações)", "MAPA / CGTI",
     "https://dados.agricultura.gov.br/dataset/sipeagro", "agregado por município (sem dado pessoal)"),
    ("psr", "Programa de Subvenção ao Prêmio do Seguro Rural — apólices 2025", "MAPA / SISSER",
     "https://dados.agricultura.gov.br/dataset/sisser3", "agregado por município; grupos < 3 suprimidos"),
    ("open_meteo", "Previsão do tempo (modelos globais)", "Open-Meteo (CC-BY 4.0)", "https://open-meteo.com", "consulta em tempo real"),
]


def extraction_dates() -> dict[str, str]:
    """Data de extração por fonte: último download registrado pelo fetch_opendata.py, senão a do repositório."""
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    out: dict[str, str] = {}
    for name, info in state.items():
        if not name.startswith("_"):
            # conferido contra o portal (conteúdo idêntico ou baixado de novo) = dado vigente nessa data
            when = info.get("checked_at") or info.get("downloaded_at") or EXTRACTED
            out[info["source"]] = max(out.get(info["source"], ""), when[:10])
    return out


def main() -> None:
    aggregate_psr()
    zarc = build_zarc()
    munis = zarc[["geocode", "uf", "municipality"]].drop_duplicates("geocode")
    agrofit = build_agrofit()
    region = build_region(munis)
    dates = extraction_dates()
    sources = pd.DataFrame(SOURCES, columns=["key", "name", "agency", "url", "notes"])
    sources["extracted_at"] = sources.key.map(dates).fillna(EXTRACTED)
    sources.loc[sources.key == "zarc", "notes"] = "safras " + " e ".join(s.replace("-20", "-") for s in zarc_safras())

    # Escreve num arquivo temporário e troca no fim: a API continua lendo o banco antigo durante a reconstrução.
    tmp = OUT.with_suffix(".db.tmp")
    tmp.unlink(missing_ok=True)
    con = sqlite3.connect(tmp)
    with con:  # "with" só faz commit; no Windows o arquivo precisa estar FECHADO para ser renomeado
        zarc.to_sql("zarc_risk", con, index=False)
        con.execute("CREATE INDEX ix_zarc ON zarc_risk (geocode, crop)")
        munis.to_sql("municipalities", con, index=False)
        agrofit.to_sql("agrofit", con, index=False)
        con.execute("CREATE INDEX ix_agrofit_brand ON agrofit (brand_norm)")
        con.execute("CREATE INDEX ix_agrofit_crop ON agrofit (crop)")
        region.to_sql("region_stats", con, index=False)
        sources.to_sql("data_sources", con, index=False)
    con.close()
    tmp.replace(OUT)
    print(f"OK → {OUT} ({OUT.stat().st_size / 1e6:.0f} MB)")


if __name__ == "__main__":
    main()

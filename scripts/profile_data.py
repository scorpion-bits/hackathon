#!/usr/bin/env python3
"""Gera um perfil rápido de todos os datasets de um diretório.

Uso:
    python3 scripts/profile_data.py data/raw/ [-o docs/data-profile.md] [--sample 200000]

Suporta: .csv, .tsv, .txt (delimitado), .xlsx, .xls, .json, .parquet.
Detecta encoding e separador automaticamente para arquivos de texto.
Saída: Markdown com dimensões, tipos, nulos, cardinalidade, exemplos e estatísticas.
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import pandas as pd

TEXT_EXT = {".csv", ".tsv", ".txt"}
EXCEL_EXT = {".xlsx", ".xls", ".xlsm"}
SUPPORTED = TEXT_EXT | EXCEL_EXT | {".json", ".parquet"}
ENCODINGS = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]


def detect_encoding(path: Path) -> str:
    raw = path.read_bytes()[:200_000]
    for enc in ENCODINGS:
        try:
            raw.decode(enc)
            return enc
        except UnicodeDecodeError:
            continue
    return "latin-1"


def detect_sep(path: Path, encoding: str) -> str:
    with path.open(encoding=encoding, errors="replace") as f:
        sample = f.read(50_000)
    try:
        return csv.Sniffer().sniff(sample, delimiters=",;\t|").delimiter
    except csv.Error:
        return ";" if sample.count(";") > sample.count(",") else ","


def load(path: Path, sample: int | None) -> dict[str, tuple[pd.DataFrame, str]]:
    """Retorna {nome_tabela: (df, nota)}. Excel pode ter várias abas."""
    ext = path.suffix.lower()
    if ext in TEXT_EXT:
        enc = detect_encoding(path)
        sep = detect_sep(path, enc)
        # Separador ';' costuma vir com decimal ',' (padrão brasileiro)
        decimal = "," if sep == ";" else "."
        df = pd.read_csv(path, sep=sep, encoding=enc, decimal=decimal, nrows=sample, low_memory=False)
        return {path.name: (df, f"encoding `{enc}`, separador `{sep!r}`, decimal `{decimal}`")}
    if ext in EXCEL_EXT:
        sheets = pd.read_excel(path, sheet_name=None, nrows=sample)
        return {f"{path.name} › {name}": (df, "aba Excel") for name, df in sheets.items()}
    if ext == ".json":
        try:
            df = pd.read_json(path)
        except ValueError:
            df = pd.read_json(path, lines=True)
        return {path.name: (df, "JSON")}
    if ext == ".parquet":
        return {path.name: (pd.read_parquet(path), "Parquet")}
    return {}


def fmt(value, limit: int = 40) -> str:
    text = str(value).replace("|", "\\|").replace("\n", " ")
    return text if len(text) <= limit else text[: limit - 1] + "…"


def profile(name: str, df: pd.DataFrame, note: str, sampled: bool) -> str:
    out = [f"## {name}", ""]
    out.append(f"- Linhas × colunas: **{len(df):,} × {df.shape[1]}**" + (" (amostra)" if sampled else ""))
    out.append(f"- Leitura: {note}")
    out.append(f"- Linhas duplicadas: {int(df.duplicated().sum()):,}")
    out.append(f"- Memória: {df.memory_usage(deep=True).sum() / 1e6:.1f} MB")
    out.append("")
    out.append("| Coluna | Tipo | Nulos % | Distintos | Exemplos | Mín | Máx | Média |")
    out.append("|---|---|---|---|---|---|---|---|")
    for col in df.columns:
        s = df[col]
        nulls = s.isna().mean() * 100 if len(s) else 0.0
        examples = ", ".join(fmt(v, 20) for v in s.dropna().unique()[:3])
        lo = hi = mean = ""
        if pd.api.types.is_numeric_dtype(s) and s.notna().any():
            lo, hi, mean = f"{s.min():.4g}", f"{s.max():.4g}", f"{s.mean():.4g}"
        out.append(
            f"| {fmt(col)} | {s.dtype} | {nulls:.1f} | {s.nunique(dropna=True):,} "
            f"| {examples} | {lo} | {hi} | {mean} |"
        )
    out.append("")
    cats = [
        c for c in df.columns
        if not pd.api.types.is_numeric_dtype(df[c]) and 1 < df[c].nunique() <= 30
    ]
    for col in cats[:10]:
        top = df[col].value_counts(dropna=False).head(5)
        out.append(f"**Top valores — `{fmt(col)}`:** " + "; ".join(f"{fmt(k, 25)} ({v:,})" for k, v in top.items()))
        out.append("")
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path", type=Path, help="arquivo ou diretório")
    ap.add_argument("-o", "--output", type=Path, default=Path("docs/data-profile.md"))
    ap.add_argument("--sample", type=int, default=None, help="limitar linhas lidas por arquivo")
    args = ap.parse_args()

    files = [args.path] if args.path.is_file() else sorted(
        p for p in args.path.rglob("*") if p.is_file() and p.suffix.lower() in SUPPORTED
    )
    if not files:
        print(f"Nenhum arquivo suportado em {args.path}", file=sys.stderr)
        return 1

    sections = ["# Perfil automático dos dados", "", f"Gerado por `scripts/profile_data.py` a partir de `{args.path}`.", ""]
    for path in files:
        try:
            tables = load(path, args.sample)
        except Exception as exc:  # noqa: BLE001 — perfil deve seguir mesmo com arquivo ruim
            sections += [f"## {path.name}", "", f"⚠️ Falha ao ler: `{exc}`", ""]
            print(f"[falha] {path}: {exc}", file=sys.stderr)
            continue
        for name, (df, note) in tables.items():
            sections.append(profile(name, df, note, sampled=args.sample is not None and len(df) >= args.sample))
            print(f"[ok] {name}: {df.shape[0]:,} × {df.shape[1]}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(sections), encoding="utf-8")
    print(f"Perfil salvo em {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

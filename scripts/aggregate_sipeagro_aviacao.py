#!/usr/bin/env python3
"""Agrega SIPEAGRO Aviação Agrícola (registro + autorização) por município, sem dado pessoal.

Entrada (local, fora do git): data/restricted/sipeagroaviacaoagricola{registro,autorizacao}.csv.zip
Saída: data/processed/aviacao_registro_por_municipio.csv
       data/processed/aviacao_autorizacoes_por_municipio_ano.csv
Só contagens; nomes, CPF/CNPJ, e-mail, telefone e responsáveis técnicos são descartados.
"""
from pathlib import Path

import pandas as pd

RESTRICTED = Path("data/restricted")
OUT = Path("data/processed")


def src(stem: str) -> Path:
    """Arquivo zipado ou não (o portal publica nos dois formatos)."""
    return next((RESTRICTED / f"{stem}{e}" for e in (".csv.zip", ".csv") if (RESTRICTED / f"{stem}{e}").exists()),
                RESTRICTED / f"{stem}.csv.zip")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    reg = pd.read_csv(
        src("sipeagroaviacaoagricolaregistro"), sep=";", dtype=str,
        usecols=["UNIDADE_DA_FEDERACAO", "MUNICIPIO", "NUMERO_REGISTRO_ESTABELECIMENTO",
                 "STATUS_REGISTRO_ESTABELECIMENTO", "ATIVIDADE", "ESPECIE", "NUMERO_REGISTRO_AERONAVE"],
    )
    reg = reg[reg.STATUS_REGISTRO_ESTABELECIMENTO == "Ativo"].dropna(subset=["NUMERO_REGISTRO_AERONAVE"])
    reg = reg.drop_duplicates(["NUMERO_REGISTRO_ESTABELECIMENTO", "NUMERO_REGISTRO_AERONAVE"])
    reg["tipo"] = reg.ESPECIE.map({"Remotamente Pilotada": "drones", "Convencional": "avioes"})
    agg = (reg.groupby(["UNIDADE_DA_FEDERACAO", "MUNICIPIO", "tipo"]).size()
              .unstack(fill_value=0).reset_index()
              .rename(columns={"UNIDADE_DA_FEDERACAO": "uf", "MUNICIPIO": "municipio"}))
    agg.to_csv(OUT / "aviacao_registro_por_municipio.csv", index=False)

    aut = pd.read_csv(
        src("sipeagroaviacaoagricolaautorizacao"), sep=";", dtype=str,
        usecols=["NUMERO_AUTORIZACAO", "UF_AUTORIZADA", "MUNICIPIO_AUTORIZADO", "DATA_INICIO_VALIDADE"],
    )
    aut["ano"] = aut.DATA_INICIO_VALIDADE.str[:4]
    aut_agg = (aut.drop_duplicates(["NUMERO_AUTORIZACAO", "MUNICIPIO_AUTORIZADO"])
                  .groupby(["UF_AUTORIZADA", "MUNICIPIO_AUTORIZADO", "ano"]).size()
                  .rename("autorizacoes").reset_index()
                  .rename(columns={"UF_AUTORIZADA": "uf", "MUNICIPIO_AUTORIZADO": "municipio"}))
    aut_agg.to_csv(OUT / "aviacao_autorizacoes_por_municipio_ano.csv", index=False)
    print(f"registro: {len(agg)} municípios · autorizações: {len(aut_agg)} linhas")


if __name__ == "__main__":
    main()

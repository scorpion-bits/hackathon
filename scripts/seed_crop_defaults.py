import sqlite3
import os
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OPENDATA_DB = Path(os.environ.get("AGROIA_OPENDATA_DB", DATA / "opendata.db"))

def seed():
    con = sqlite3.connect(f"{OPENDATA_DB}")
    con.execute("""
    CREATE TABLE IF NOT EXISTS crop_defaults (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        crop        TEXT NOT NULL,
        uf          TEXT,
        region      TEXT,
        productivity_sacas_ha REAL NOT NULL,
        price_saca  REAL NOT NULL,
        cost_ha     REAL NOT NULL,
        price_var_pct   REAL DEFAULT 12.0,
        prod_var_pct    REAL DEFAULT 15.0,
        price_source    TEXT NOT NULL,
        prod_source     TEXT NOT NULL,
        cost_source     TEXT NOT NULL,
        price_date      TEXT,
        prod_date       TEXT,
        cost_date       TEXT,
        confidence      TEXT DEFAULT 'high',
        updated_at      TEXT NOT NULL
    )
    """)
    con.execute("DELETE FROM crop_defaults")
    now = datetime.now().isoformat()
    
    data = [
        ("Soja", "SP", None, 60.0, 131.0, 4800.0, 12.0, 15.0, "CONAB ago/2026", "IBGE LSPA Sul", "CONAB custos safra 2025/26", None, None, None, "high", now),
        ("Milho 1ª Safra", "SP", None, 90.0, 72.0, 4200.0, 12.0, 15.0, "CONAB ago/2026", "IBGE LSPA", "CONAB custos safra 2025/26", None, None, None, "high", now),
        ("Feijão", "SP", None, 25.0, 310.0, 5500.0, 12.0, 15.0, "CONAB ago/2026", "IBGE LSPA", "CONAB custos safra 2025/26", None, None, None, "high", now),
        ("Soja", "PR", None, 62.0, 131.0, 4700.0, 12.0, 15.0, "CONAB ago/2026", "IBGE LSPA Sul", "CONAB custos safra 2025/26", None, None, None, "high", now),
        ("Milho 1ª Safra", "PR", None, 95.0, 72.0, 4000.0, 12.0, 15.0, "CONAB ago/2026", "IBGE LSPA", "CONAB custos safra 2025/26", None, None, None, "high", now),
        ("Soja", None, "Nacional", 55.0, 128.0, 4600.0, 12.0, 15.0, "CONAB ago/2026", "IBGE LSPA", "CONAB custos safra 2025/26", None, None, None, "medium", now),
        ("Milho 1ª Safra", None, "Nacional", 85.0, 70.0, 3900.0, 12.0, 15.0, "CONAB ago/2026", "IBGE LSPA", "CONAB custos safra 2025/26", None, None, None, "medium", now),
        ("Feijão", None, "Nacional", 22.0, 300.0, 5200.0, 12.0, 15.0, "CONAB ago/2026", "IBGE LSPA", "CONAB custos safra 2025/26", None, None, None, "medium", now),
    ]
    
    con.executemany("""
    INSERT INTO crop_defaults (crop, uf, region, productivity_sacas_ha, price_saca, cost_ha, price_var_pct, prod_var_pct, price_source, prod_source, cost_source, price_date, prod_date, cost_date, confidence, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, data)
    
    con.commit()
    con.close()
    print("crop_defaults seeded successfully.")

if __name__ == "__main__":
    seed()

"""Contexto do produtor vindo da entrevista (M2): culturas do front ⇄ nomes do Zarc."""
from __future__ import annotations

from . import opendata as od

# id da cultura no front (components/interview/options.ts → CROPS) → nome da cultura na base do Zarc.
# Culturas sem Zarc (hortaliças, pastagem…) guardam um nome legível; a M3 mostra "sem Zarc para esta cultura aqui".
CROP_TO_ZARC: dict[str, str] = {
    "soja": "Soja",
    "milho": "Milho 1ª Safra",
    "feijao": "Feijão",
    "cafe": "Café",
    "cana": "Cana-de-açúcar",
    "laranja": "Citros",
    "amendoim": "Amendoim",
    "mandioca": "Mandioca",
    "hortalicas": "Hortaliças",
    "pastagem": "Pastagem",
    "outra": "Outra",
}


def zarc_name(crop_key: str | None, geocode: str | None = None) -> str | None:
    """Nome a guardar em Field.crop. Se o município tiver no Zarc uma grafia equivalente, usa a do Zarc."""
    if not crop_key:
        return None
    name = CROP_TO_ZARC.get(crop_key, crop_key)
    if geocode:
        try:
            crops = od.zarc_crops(geocode)
        except Exception:  # base de dados abertos ausente: guarda o nome mesmo assim
            crops = []
        wanted = od.norm(name)
        for c in crops:
            if od.norm(c) == wanted:
                return c
        for c in crops:  # ex.: "Citros" ⇄ "Citros (laranja)"
            if od.norm(c).startswith(wanted):
                return c
    return name


def crop_key(name: str | None) -> str | None:
    """Inverso de zarc_name: nome guardado → id da cultura no front (None se não reconhecido)."""
    if not name:
        return None
    n = od.norm(name)
    for key, zarc in CROP_TO_ZARC.items():
        if n == od.norm(zarc) or n.startswith(od.norm(zarc)) or n == key:
            return key
    if n.startswith("milho"):
        return "milho"
    if n.startswith("feijao"):
        return "feijao"
    return "outra"


def has_zarc(geocode: str, crop: str | None) -> bool:
    try:
        return bool(crop) and crop in od.zarc_crops(geocode)
    except Exception:
        return False

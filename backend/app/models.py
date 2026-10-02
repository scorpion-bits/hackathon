"""Modelo de dados compartilhado (D-003). Estoque, custos, situação e alertas são DERIVADOS — não armazenar."""
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Producer(Base):
    __tablename__ = "producer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    is_demo: Mapped[bool] = mapped_column(default=True)
    phone_pref: Mapped[str | None] = mapped_column(String(40))
    contact: Mapped[str | None] = mapped_column(String(160), unique=True)  # e-mail ou celular (login)
    password_hash: Mapped[str | None] = mapped_column(String(200))  # "salt$hash" (pbkdf2-sha256)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class AuthToken(Base):
    __tablename__ = "auth_token"
    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    producer_id: Mapped[int] = mapped_column(ForeignKey("producer.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class Interview(Base):
    """Respostas da entrevista (formato do front: types.ts → Answers)."""
    __tablename__ = "interview"
    producer_id: Mapped[int] = mapped_column(ForeignKey("producer.id"), primary_key=True)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class Case(Base):
    """Caso enviado à assistência técnica pública (D-015). Resposta do técnico é simulada e rotulada (D-019)."""
    __tablename__ = "case"
    id: Mapped[int] = mapped_column(primary_key=True)
    producer_id: Mapped[int] = mapped_column(ForeignKey("producer.id"))
    protocol: Mapped[str] = mapped_column(String(20), unique=True)
    topic_key: Mapped[str] = mapped_column(String(80))
    field_id: Mapped[int | None] = mapped_column(ForeignKey("field.id"))
    expert_id: Mapped[str] = mapped_column(String(40))
    channel: Mapped[str] = mapped_column(String(40))
    path: Mapped[str | None] = mapped_column(String(80))  # caminho escolhido pelo produtor
    note: Mapped[str | None] = mapped_column(Text)
    snapshot: Mapped[dict] = mapped_column(JSON, default=dict)  # dados mostrados ao produtor no envio
    consent_at: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default="enviado")  # enviado|respondido|encerrado
    reply: Mapped[str | None] = mapped_column(Text)
    reply_is_example: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class TopicState(Base):
    """Escolha do produtor em cada assunto do início guiado."""
    __tablename__ = "topic_state"
    producer_id: Mapped[int] = mapped_column(ForeignKey("producer.id"), primary_key=True)
    topic_key: Mapped[str] = mapped_column(String(80), primary_key=True)
    choice: Mapped[str | None] = mapped_column(String(80))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class Farm(Base):
    __tablename__ = "farm"
    id: Mapped[int] = mapped_column(primary_key=True)
    producer_id: Mapped[int] = mapped_column(ForeignKey("producer.id"))
    name: Mapped[str] = mapped_column(String(120))
    geocode: Mapped[str] = mapped_column(String(7))  # IBGE
    municipality: Mapped[str] = mapped_column(String(120))
    uf: Mapped[str] = mapped_column(String(2))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    total_area_ha: Mapped[float | None] = mapped_column(Float)
    producer: Mapped[Producer] = relationship()


class Field(Base):
    """Talhão."""
    __tablename__ = "field"
    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farm.id"))
    name: Mapped[str] = mapped_column(String(80))
    geometry: Mapped[dict] = mapped_column(JSON)  # GeoJSON Polygon
    area_ha: Mapped[float] = mapped_column(Float)
    crop: Mapped[str | None] = mapped_column(String(80))  # nome igual ao Zarc quando houver
    soil: Mapped[str | None] = mapped_column(String(20))  # arenoso | medio | argiloso
    irrigated: Mapped[bool] = mapped_column(default=False)
    seed_rate_kg_ha: Mapped[float | None] = mapped_column(Float)  # declarado pelo produtor
    color: Mapped[str | None] = mapped_column(String(9))
    notes: Mapped[str | None] = mapped_column(Text)


class Season(Base):
    """Safra (ex.: 2026/27)."""
    __tablename__ = "season"
    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farm.id"))
    name: Mapped[str] = mapped_column(String(20))
    start: Mapped[date] = mapped_column(Date)
    end: Mapped[date] = mapped_column(Date)


class StockItem(Base):
    __tablename__ = "stock_item"
    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farm.id"))
    name: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(30))  # semente|fertilizante|defensivo|combustivel|ferramenta|irrigacao|outro
    unit: Mapped[str] = mapped_column(String(10))  # kg|L|un|saco|t
    min_quantity: Mapped[float] = mapped_column(Float, default=0)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    supplier: Mapped[str | None] = mapped_column(String(120))
    crop: Mapped[str | None] = mapped_column(String(80))  # p/ sementes: cultura
    agrofit_registration: Mapped[str | None] = mapped_column(String(20))
    movements: Mapped[list["StockMovement"]] = relationship(back_populates="item", cascade="all, delete-orphan")


class Event(Base):
    """Caderno de campo: tudo que acontece na propriedade."""
    __tablename__ = "event"
    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farm.id"))
    field_id: Mapped[int | None] = mapped_column(ForeignKey("field.id"))
    season_id: Mapped[int | None] = mapped_column(ForeignKey("season.id"))
    type: Mapped[str] = mapped_column(String(20))  # plantio|aplicacao|colheita|compra|observacao|outro
    date: Mapped[date] = mapped_column(Date)
    title: Mapped[str] = mapped_column(String(160))
    details: Mapped[dict] = mapped_column(JSON, default=dict)  # crop, harvested_qty, harvested_unit, ...
    origin: Mapped[str] = mapped_column(String(10), default="manual")  # manual|ia|demo
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    movements: Mapped[list["StockMovement"]] = relationship(back_populates="event")


class StockMovement(Base):
    __tablename__ = "stock_movement"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("stock_item.id"))
    event_id: Mapped[int | None] = mapped_column(ForeignKey("event.id"))
    kind: Mapped[str] = mapped_column(String(10))  # entrada|saida|ajuste
    quantity: Mapped[float] = mapped_column(Float)  # sempre positiva; ajuste pode ser negativo
    unit_price: Mapped[float | None] = mapped_column(Float)  # R$ por unidade (entradas)
    date: Mapped[date] = mapped_column(Date)
    supplier: Mapped[str | None] = mapped_column(String(120))
    note: Mapped[str | None] = mapped_column(String(200))
    item: Mapped[StockItem] = relationship(back_populates="movements")
    event: Mapped[Event | None] = relationship(back_populates="movements")


class AlertState(Base):
    """Alertas são calculados; aqui só guardamos quais foram lidos."""
    __tablename__ = "alert_state"
    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    read_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class ProfileFact(Base):
    """"O que o AgroBits sabe sobre você" — cada fato com origem."""
    __tablename__ = "profile_fact"
    id: Mapped[int] = mapped_column(primary_key=True)
    producer_id: Mapped[int] = mapped_column(ForeignKey("producer.id"))
    label: Mapped[str] = mapped_column(String(80))
    value: Mapped[str] = mapped_column(Text)
    origin: Mapped[str] = mapped_column(String(12))  # declarado|registro|oficial
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class ChatMessage(Base):
    __tablename__ = "chat_message"
    id: Mapped[int] = mapped_column(primary_key=True)
    producer_id: Mapped[int | None] = mapped_column(ForeignKey("producer.id"))
    role: Mapped[str] = mapped_column(String(10))
    content: Mapped[str] = mapped_column(Text)
    sources: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

from datetime import datetime
from typing import List, Optional

from sqlalchemy import create_engine, ForeignKey, String, Text, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session

CONNECTION_STRING = (
    "mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8mb4"
)

engine = create_engine(CONNECTION_STRING, echo=False, pool_recycle=3600)

class Base(DeclarativeBase):
    pass


class Region(Base):
    __tablename__ = "region"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200))

    comunas: Mapped[List["Comuna"]] = relationship(back_populates="region")


class Comuna(Base):
    __tablename__ = "comuna"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200))
    region_id: Mapped[int] = mapped_column(ForeignKey("region.id"))

    region: Mapped["Region"] = relationship(back_populates="comunas")
    voluntarios: Mapped[List["Voluntario"]] = relationship(back_populates="comuna")


class Voluntario(Base):
    __tablename__ = "voluntario"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(80))
    telefono: Mapped[str] = mapped_column(String(15))
    fecha_registro: Mapped[datetime] = mapped_column(DateTime)
    comuna_id: Mapped[int] = mapped_column(ForeignKey("comuna.id"))

    comuna: Mapped["Comuna"] = relationship(back_populates="voluntarios")
    avistamientos: Mapped[List["Avistamiento"]] = relationship(back_populates="voluntario")


class Ave(Base):
    __tablename__ = "ave"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80))

    avistamientos: Mapped[List["Avistamiento"]] = relationship(back_populates="ave")


class Avistamiento(Base):
    __tablename__ = "avistamiento"

    id: Mapped[int] = mapped_column(primary_key=True)
    voluntario_id: Mapped[int] = mapped_column(ForeignKey("voluntario.id"))
    ave_id: Mapped[int] = mapped_column(ForeignKey("ave.id"))
    fecha_hora: Mapped[datetime] = mapped_column(DateTime)
    lugar: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    voluntario: Mapped["Voluntario"] = relationship(back_populates="avistamientos")
    ave: Mapped["Ave"] = relationship(back_populates="avistamientos")
    registros: Mapped[List["Registro"]] = relationship(
        back_populates="avistamiento", cascade="all, delete-orphan"
    )


class Registro(Base):
    __tablename__ = "registro"

    id: Mapped[int] = mapped_column(primary_key=True)
    ruta_archivo: Mapped[str] = mapped_column(String(300))
    nombre_archivo: Mapped[str] = mapped_column(String(300))
    avistamiento_id: Mapped[int] = mapped_column(ForeignKey("avistamiento.id"))

    avistamiento: Mapped["Avistamiento"] = relationship(back_populates="registros")


def get_session():
    return Session(engine)
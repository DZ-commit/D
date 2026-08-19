"""SQLAlchemy 基类与时间戳约定

时间戳：统一 `YYYY-MM-DD HH:MM:SS`（UTC，非严格 ISO8601），对齐《数据库设计文档》§2.7
"""
from datetime import datetime, timezone

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# SQLite 命名约定（统一约束/索引命名，便于迁移）
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def utcnow_str() -> str:
    """应用层时间戳：UTC `YYYY-MM-DD HH:MM:SS`（SQLite CURRENT_TIMESTAMP 同格式）"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

"""数据库引擎与会话 —— 对齐 ADR-001/006

SQLite：sqlite+aiosqlite；连接事件开启 PRAGMA foreign_keys=ON（每次连接，非单次会话）
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import event

from app.core.config import settings
from app.models.base import Base

engine = create_async_engine(settings.database_url, echo=False)


@event.listens_for(engine.sync_engine, "connect")
def _fk_on(dbapi_conn, _record) -> None:  # pragma: no cover
    """SQLite 外键默认不启用，每个连接执行 PRAGMA（数据库设计文档 §2.6/§5 注意①）"""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.close()


AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI 依赖：请求级会话"""
    async with AsyncSessionLocal() as session:
        yield session


async def create_all() -> None:
    """建表（init_db 使用；开发期 DDL 与模型同步，生产迁移见数据库设计文档 §9）"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

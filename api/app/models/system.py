"""系统管理实体（3 张表）—— 对齐《数据库设计文档 v1.8》§4.13–§4.15 / §5 DDL

建表顺序：departments → roles → users（users 引用前两者）
物理外键 3 个：users.department_id、users.role_id、departments.parent_id（自引用），均 ON DELETE RESTRICT
审计人 created_by/updated_by 存 users.id，逻辑关联不建 FK（避免循环依赖）
"""
from sqlalchemy import ForeignKey, Index, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow_str

TS = dict(
    nullable=False,
    server_default=text("CURRENT_TIMESTAMP"),
)


class Department(Base):
    __tablename__ = "departments"
    __table_args__ = (
        Index("idx_departments_parent", "parent_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("departments.id", ondelete="RESTRICT")
    )  # 顶级为 NULL
    is_activate: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    created_by: Mapped[int | None] = mapped_column(Integer)  # users.id 逻辑关联
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_by: Mapped[int | None] = mapped_column(Integer)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = (
        Index("idx_roles_activate", "is_activate"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)  # admin/user
    name: Mapped[str] = mapped_column(Text, nullable=False)  # 展示名
    is_activate: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    created_by: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_by: Mapped[int | None] = mapped_column(Integer)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_department", "department_id"),
        Index("idx_users_role", "role_id"),
        Index("idx_users_activate", "is_activate"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    real_name: Mapped[str | None] = mapped_column(Text)
    nickname: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    gender: Mapped[str | None] = mapped_column(Text)  # male/female，可扩展不加 CHECK
    position: Mapped[str | None] = mapped_column(Text)
    department_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("departments.id", ondelete="RESTRICT")
    )  # 可空：未分配部门权限受限
    role_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="RESTRICT")
    )  # 可空：登录权限据此判断
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)  # bcrypt，禁止明文
    must_change_password: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    is_activate: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    created_by: Mapped[int | None] = mapped_column(Integer)  # users.id 逻辑关联
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_by: Mapped[int | None] = mapped_column(Integer)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)

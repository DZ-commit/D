"""内容/业务实体（11 张表）—— 对齐《数据库设计文档 v1.8》§4.2–§4.12 / §5 DDL

类型映射（§2.2）：String→Text、Boolean→Integer(0/1)、Float→REAL、JSON→Text、DateTime→Text(UTC)
物理外键 2 个：products.series_id、company_contact 无（单行 CHECK）
"""
from sqlalchemy import CheckConstraint, Float, ForeignKey, Index, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, utcnow_str

TS = dict(  # 时间戳列公共定义
    nullable=False,
    server_default=text("CURRENT_TIMESTAMP"),
)


class Banner(Base):
    __tablename__ = "banners"
    __table_args__ = (
        CheckConstraint("status IN ('on','off')", name="banners_status"),
        Index("idx_banners_status_order", "status", "sort_order"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    link_url: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'on'"))
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class ProductSeries(Base):
    __tablename__ = "product_series"
    __table_args__ = (
        CheckConstraint("status IN ('on','off')", name="product_series_status"),
        Index("idx_product_series_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cover_image: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'on'"))
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("status IN ('on','off','draft')", name="products_status"),
        Index("idx_products_series", "series_id"),
        Index("idx_products_category", "category_id"),
        Index("idx_products_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[int | None] = mapped_column(Integer)  # 空间分类 id，逻辑关联，预留分类表
    series_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("product_series.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    product_no: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    cover_image: Mapped[str | None] = mapped_column(Text)
    gallery: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'[]'"))  # JSON 串
    description: Mapped[str | None] = mapped_column(Text)  # 富文本（已净化）
    specs: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'{}'"))  # JSON 串
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'draft'"))  # on/off/draft
    is_top: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class Case(Base):
    __tablename__ = "cases"
    __table_args__ = (
        CheckConstraint("status IN ('on','off')", name="cases_status"),
        Index("idx_cases_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image: Mapped[str | None] = mapped_column(Text)
    gallery: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'[]'"))  # JSON 串
    description: Mapped[str | None] = mapped_column(Text)  # 富文本
    related_products: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'[]'"))  # JSON 产品 id 列表
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'on'"))
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class News(Base):
    __tablename__ = "news"
    __table_args__ = (
        CheckConstraint("category IN ('company','industry')", name="news_category"),
        # 草稿/未发布 publish_date 可空，发布必填（v1.2 CHECK 不变量）
        CheckConstraint("is_published = 0 OR publish_date IS NOT NULL", name="news_publish_date"),
        Index("idx_news_category_date", "category", "publish_date"),
        Index("idx_news_publish_top", "is_published", "is_top"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(Text, nullable=False)  # company/industry
    title: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)  # 富文本 HTML（已净化）
    source: Mapped[str | None] = mapped_column(Text)  # 来源/转载标注
    author: Mapped[str | None] = mapped_column(Text)
    is_published: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    is_top: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    publish_date: Mapped[str | None] = mapped_column(Text)  # YYYY-MM-DD
    deadline: Mapped[str | None] = mapped_column(Text)  # YYYY-MM-DD，过期不再前台展示
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint("category IN ('social','campus')", name="jobs_category"),
        # 下架 publish_date 可空，上架必填（应用层校验非空，DDL 兜底）
        CheckConstraint("status = 'off' OR publish_date IS NOT NULL", name="jobs_publish_date"),
        Index("idx_jobs_category_status", "category", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(Text, nullable=False)  # social/campus
    title: Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    requirements: Mapped[str | None] = mapped_column(Text)
    apply_info: Mapped[str | None] = mapped_column(Text)  # 投递方式（邮箱/说明）
    publish_date: Mapped[str | None] = mapped_column(Text)  # YYYY-MM-DD
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'on'"))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))  # 通用 CRUD 工厂依赖此字段排序
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class FranchiseContent(Base):
    __tablename__ = "franchise_contents"
    __table_args__ = (
        CheckConstraint("status IN ('on','off')", name="franchise_contents_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str | None] = mapped_column(Text)  # 富文本
    image: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'on'"))
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class Store(Base):
    __tablename__ = "stores"
    __table_args__ = (
        CheckConstraint("status IN ('on','off')", name="stores_status"),
        Index("idx_stores_region", "province", "city"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    province: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    lng: Mapped[float | None] = mapped_column(Float)
    lat: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'on'"))
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class ContentPage(Base):
    __tablename__ = "content_pages"
    # 键值式，key 为主键：about_d / brand / history

    key: Mapped[str] = mapped_column(Text, primary_key=True)
    title: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)  # 富文本；history 存结构化时间轴 JSON
    images: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'[]'"))  # JSON 串
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class CompanyContact(Base):
    __tablename__ = "company_contact"
    __table_args__ = (
        CheckConstraint("id = 1", name="company_contact_single_row"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # 单行固定 1
    company_name: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    lng: Mapped[float | None] = mapped_column(Float)
    lat: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)


class Inquiry(Base):
    __tablename__ = "inquiries"
    __table_args__ = (
        CheckConstraint(
            "type IN ('appointment','message','franchise','job')", name="inquiries_type"
        ),
        CheckConstraint(
            "status IN ('pending','done','invalid')", name="inquiries_status"
        ),
        Index("idx_inquiries_type_status", "type", "status", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(Text, nullable=False)  # appointment/message/franchise/job
    name: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str | None] = mapped_column(Text)
    subject: Mapped[str | None] = mapped_column(Text)  # 预约类型/主题；招聘意向职位
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'pending'"))
    note: Mapped[str | None] = mapped_column(Text)  # 管理员备注
    consent_at: Mapped[str | None] = mapped_column(Text)  # 隐私同意时间戳（合规留痕）
    created_at: Mapped[str] = mapped_column(Text, **TS)
    updated_at: Mapped[str] = mapped_column(Text, **TS, onupdate=utcnow_str)

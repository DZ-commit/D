"""内容实体 Schema（Banner/系列/产品/案例/新闻/招聘/招商/门店/关于页/联系信息）

功能：
- 每个资源提供三种模型：公开出参（前台用，精简）、管理入参（后台编辑）、管理出参（含时间戳/状态）
- JSON 字段（gallery/specs/images/related_products）入库为 JSON 字符串，出参自动解析为 list/dict
- 富文本字段在路由层经 clean_html 净化后再入库（不在此处校验 HTML）
"""
import json
from typing import Any

from pydantic import field_validator

from app.schemas.common import ORMModel, TimestampFields


def _parse_json(v: Any, default: Any) -> Any:
    """把数据库 JSON 字符串解析为 list/dict；非法/空值返回默认"""
    if isinstance(v, (list, dict)):
        return v
    if isinstance(v, str) and v.strip():
        try:
            return json.loads(v)
        except (json.JSONDecodeError, TypeError):
            return default
    return default


# ===================== Banner 首页轮播 =====================

class BannerOut(ORMModel):
    """前台轮播出参：仅上架（on）项，按 sort_order 排序"""
    id: int
    title: str | None = None
    image_url: str
    link_url: str | None = None


class BannerAdminOut(BannerOut, TimestampFields):
    """后台轮播出参：含状态与审计时间"""
    sort_order: int = 0
    status: str = "on"


class BannerIn(ORMModel):
    """后台轮播入参：status 枚举 on/off"""
    title: str | None = None
    image_url: str
    link_url: str | None = None
    sort_order: int = 0
    status: str = "on"


# ===================== ProductSeries 产品系列 =====================

class ProductSeriesOut(ORMModel):
    """前台系列出参：产品中心筛选数据源（仅 on）"""
    id: int
    name: str
    cover_image: str | None = None


class ProductSeriesAdminOut(ProductSeriesOut, TimestampFields):
    """后台系列出参：含描述/排序/状态"""
    description: str | None = None
    sort_order: int = 0
    status: str = "on"


class ProductSeriesIn(ORMModel):
    """后台系列入参"""
    name: str
    description: str | None = None
    cover_image: str | None = None
    sort_order: int = 0
    status: str = "on"


# ===================== Product 产品 =====================

class ProductOut(ORMModel):
    """前台产品出参：列表/详情共用；gallery/specs 自动解析为 JSON；series_name 由路由补充"""
    id: int
    category_id: int | None = None
    series_id: int
    name: str
    product_no: str
    cover_image: str | None = None
    gallery: list = []
    description: str | None = None
    specs: dict = {}
    is_top: int = 0
    sort_order: int = 0
    status: str = "draft"
    series_name: str | None = None  # 关联系列名（详情页展示）

    @field_validator("gallery", mode="before")
    @classmethod
    def _gallery(cls, v):
        return _parse_json(v, [])

    @field_validator("specs", mode="before")
    @classmethod
    def _specs(cls, v):
        return _parse_json(v, {})


class ProductAdminOut(ProductOut, TimestampFields):
    """后台产品出参：完整字段（含时间戳）"""
    pass


class ProductIn(ORMModel):
    """后台产品入参：product_no 唯一；status 三态 on/off/draft"""
    category_id: int | None = None
    series_id: int
    name: str
    product_no: str
    cover_image: str | None = None
    gallery: list = []
    description: str | None = None
    specs: dict = {}
    status: str = "draft"
    is_top: int = 0
    sort_order: int = 0


# ===================== Case 案例 =====================

class CaseOut(ORMModel):
    """前台案例出参：related_products 为关联产品 id 列表"""
    id: int
    title: str
    cover_image: str | None = None
    gallery: list = []
    description: str | None = None
    related_products: list = []

    @field_validator("gallery", mode="before")
    @classmethod
    def _gallery(cls, v):
        return _parse_json(v, [])

    @field_validator("related_products", mode="before")
    @classmethod
    def _related(cls, v):
        return _parse_json(v, [])


class CaseAdminOut(CaseOut, TimestampFields):
    """后台案例出参"""
    sort_order: int = 0
    status: str = "on"


class CaseIn(ORMModel):
    """后台案例入参"""
    title: str
    cover_image: str | None = None
    gallery: list = []
    description: str | None = None
    related_products: list = []
    sort_order: int = 0
    status: str = "on"


# ===================== News 新闻 =====================

class NewsListItem(ORMModel):
    """前台新闻列表项：摘要展示，不含正文"""
    id: int
    category: str
    title: str
    cover_image: str | None = None
    summary: str | None = None
    source: str | None = None
    author: str | None = None
    publish_date: str | None = None


class NewsDetailOut(NewsListItem):
    """前台新闻详情：含正文（净化 HTML）"""
    content: str | None = None
    is_top: int = 0
    deadline: str | None = None


class NewsAdminOut(NewsDetailOut, TimestampFields):
    """后台新闻出参：含发布状态/置顶/排序"""
    is_published: int = 0
    sort_order: int = 0


class NewsIn(ORMModel):
    """后台新闻入参：category 枚举 company/industry；is_published=1 时 publish_date 必填（路由层校验）"""
    category: str = "company"  # company/industry（field_validator 校验）
    title: str
    cover_image: str | None = None
    summary: str | None = None
    content: str | None = None
    source: str | None = None
    author: str | None = None
    is_published: int = 0
    is_top: int = 0
    publish_date: str | None = None
    deadline: str | None = None
    sort_order: int = 0

    @field_validator("category")
    @classmethod
    def _category(cls, v: str) -> str:
        """category 封闭枚举（company/industry），对齐数据库 CHECK"""
        if v not in ("company", "industry"):
            raise ValueError("新闻分类仅支持 company/industry")
        return v


# ===================== Job 招聘 =====================

class JobOut(ORMModel):
    """前台职位出参：列表/详情共用（列表不含正文，详情含描述/要求/投递方式）"""
    id: int
    category: str
    title: str
    department: str | None = None
    city: str | None = None
    description: str | None = None
    requirements: str | None = None
    apply_info: str | None = None
    publish_date: str | None = None


class JobAdminOut(JobOut, TimestampFields):
    """后台职位出参"""
    status: str = "on"


class JobIn(ORMModel):
    """后台职位入参：category 枚举 social/campus；status=on 时 publish_date 必填（路由层校验）"""
    category: str = "social"  # social/campus（field_validator 校验）
    title: str
    department: str | None = None
    city: str | None = None
    description: str | None = None
    requirements: str | None = None
    apply_info: str | None = None
    publish_date: str | None = None
    status: str = "on"

    @field_validator("category")
    @classmethod
    def _category(cls, v: str) -> str:
        """category 封闭枚举（social/campus），对齐数据库 CHECK"""
        if v not in ("social", "campus"):
            raise ValueError("招聘分类仅支持 social/campus")
        return v


# ===================== FranchiseContent 招商政策/优势 =====================

class FranchiseOut(ORMModel):
    """前台招商出参：富文本+图"""
    id: int
    title: str
    content: str | None = None
    image: str | None = None


class FranchiseAdminOut(FranchiseOut, TimestampFields):
    """后台招商出参"""
    sort_order: int = 0
    status: str = "on"


class FranchiseIn(ORMModel):
    """后台招商入参"""
    title: str
    content: str | None = None
    image: str | None = None
    sort_order: int = 0
    status: str = "on"


# ===================== Store 门店 =====================

class StoreOut(ORMModel):
    """前台门店出参：含经纬度（地图标点）"""
    id: int
    name: str
    province: str | None = None
    city: str | None = None
    address: str | None = None
    phone: str | None = None
    lng: float | None = None
    lat: float | None = None


class StoreAdminOut(StoreOut, TimestampFields):
    """后台门店出参"""
    status: str = "on"


class StoreIn(ORMModel):
    """后台门店入参"""
    name: str
    province: str | None = None
    city: str | None = None
    address: str | None = None
    phone: str | None = None
    lng: float | None = None
    lat: float | None = None
    status: str = "on"


# ===================== ContentPage 关于我们（键值式） =====================

class AboutPageOut(ORMModel):
    """关于页出参：key 固定 about_d/brand/history；history 的 content 为结构化时间轴 JSON（解析为 list）"""
    key: str
    title: str | None = None
    content: Any | None = None  # 富文本 或 时间轴 JSON
    images: list = []

    @field_validator("content", mode="before")
    @classmethod
    def _content(cls, v):
        # content 可能是纯文本/HTML，也可能是 JSON 数组（history）——统一尝试解析，失败则原样返回
        if isinstance(v, str) and v.strip().startswith("["):
            return _parse_json(v, v)
        return v

    @field_validator("images", mode="before")
    @classmethod
    def _images(cls, v):
        return _parse_json(v, [])


class AboutPageIn(ORMModel):
    """后台关于页入参（PUT，键值固定不删）"""
    title: str | None = None
    content: Any | None = None
    images: list = []


# ===================== CompanyContact 联系信息（单行） =====================

class ContactOut(ORMModel):
    """联系信息出参：前台联系页与页脚共用"""
    company_name: str
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    lng: float | None = None
    lat: float | None = None


class ContactAdminOut(ContactOut, TimestampFields):
    """后台联系信息出参"""
    pass


class ContactIn(ORMModel):
    """后台联系信息入参（PUT，单行 id=1）"""
    company_name: str
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    lng: float | None = None
    lat: float | None = None

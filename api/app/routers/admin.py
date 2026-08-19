"""后台内容管理接口（🔒）—— 对齐《开发技术文档 v1.2》§5.4

功能：
- 仪表盘统计（内容计数 + 待处理询盘）
- 8 个内容资源 CRUD（banners / product-series / products / cases / news / jobs / franchise / stores）
- 关于页（键值固定 GET/PUT /api/admin/about/{key}）、联系信息（单行 GET/PUT /api/admin/contact）
- 图片上传（POST /api/admin/upload，类型/大小校验 + uuid 命名）

通用约定：
- 列表：分页 + status 筛选 + 关键字搜索（name/title）
- JSON 字段（gallery/specs/related_products）入参自动序列化、出参自动解析
- 富文本字段入参经 clean_html 净化后入库（防 XSS，ADR-004）
- news/jobs 发布约束：发布/上架时 publish_date 必填（数据库 CHECK 不变量前置校验）
"""
import json
import uuid
from typing import Callable

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi import Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.errors import bad_request, not_found, too_large
from app.core.sanitize import clean_html
from app.core.security import get_current_user
from app.models import (
    Banner, Case, CompanyContact, ContentPage, FranchiseContent,
    Job, News, Product, ProductSeries, Store,
)
from app.schemas import (
    AboutPageIn, AboutPageOut, BannerAdminOut, BannerIn,
    CaseAdminOut, CaseIn, ContactAdminOut, ContactIn,
    DashboardOut, FranchiseAdminOut, FranchiseIn,
    JobAdminOut, JobIn, NewsAdminOut, NewsIn,
    PageResult, ProductAdminOut, ProductIn,
    ProductSeriesAdminOut, ProductSeriesIn,
    StoreAdminOut, StoreIn,
)

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_user)])

# ============ 字段映射配置（按模型） ============
# JSON 字段：入参为 list/dict，入库序列化为 JSON 字符串
_JSON_FIELDS: dict[type, tuple[str, ...]] = {
    Product: ("gallery", "specs"),
    Case: ("gallery", "related_products"),
}
# 富文本字段：入参经 bleach 白名单净化（ADR-004）
_RICH_FIELDS: dict[type, tuple[str, ...]] = {
    Product: ("description",),
    Case: ("description",),
    News: ("content",),
    FranchiseContent: ("content",),
}


def _serialize_data(model: type, data: dict) -> dict:
    """入参预处理：JSON 字段序列化 + 富文本字段净化"""
    for f in _JSON_FIELDS.get(model, ()):
        if f in data and data[f] is not None and not isinstance(data[f], str):
            data[f] = json.dumps(data[f], ensure_ascii=False)
    for f in _RICH_FIELDS.get(model, ()):
        if f in data and data[f] is not None:
            data[f] = clean_html(data[f])
    return data


# ============ 通用 CRUD 工厂（8 资源共用，减少重复） ============
def _make_crud(
    prefix: str,
    model: type,
    in_schema: type,
    admin_out_schema: type,
    search_fields: tuple[str, ...] = (),
    extra_validate: Callable[[dict], None] | None = None,
    with_list: bool = True,
) -> APIRouter:
    """生成标准 CRUD 路由（列表/新增/详情/更新/删除）
    - search_fields：关键字匹配列（如 name/title）
    - extra_validate：新增/更新前的业务校验回调（如 news 发布必填发布日期）
    - with_list=False：跳过列表路由（由调用方自定义，如 products 多条件筛选）
    """
    r = APIRouter(prefix=prefix, tags=["admin-content"])

    if with_list:
        @r.get("", response_model=PageResult)
        async def list_items(
            db: AsyncSession = Depends(get_db),
            page: int = Query(1, ge=1),
            page_size: int = Query(12, ge=1, le=50),
            status: str | None = Query(None, description="按上下架状态筛选 on/off"),
            q: str | None = Query(None, max_length=50, description="关键字搜索"),
        ) -> PageResult:
            """列表：分页 + status 筛选 + 关键字搜索（可叠加）"""
            from sqlalchemy import or_
            cond = []
            if status:
                cond.append(model.status == status)
            if q and search_fields:
                cond.append(or_(*[getattr(model, f).like(f"%{q}%") for f in search_fields]))
            total = (await db.execute(select(func.count(model.id)).where(*cond))).scalar_one()
            stmt = (
                select(model).where(*cond)
                .order_by(model.sort_order, model.id.desc())
                .offset((page - 1) * page_size).limit(page_size)
            )
            items = (await db.execute(stmt)).scalars().all()
            return PageResult(
                items=[admin_out_schema.model_validate(i) for i in items],
                total=total, page=page, page_size=page_size,
            )

    @r.post("", response_model=admin_out_schema)
    async def create_item(payload: in_schema, db: AsyncSession = Depends(get_db)):
        """新增：入参预处理（JSON 序列化/富文本净化）+ 业务校验 + 入库"""
        data = payload.model_dump(exclude_unset=True)
        if extra_validate:
            extra_validate(data)
        data = _serialize_data(model, data)
        obj = model(**data)
        db.add(obj)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise bad_request("数据冲突：唯一字段（如产品编号）重复")
        await db.refresh(obj)
        return admin_out_schema.model_validate(obj)

    @r.get("/{item_id}", response_model=admin_out_schema)
    async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
        """详情：按 id 查询，不存在返回 404/1004"""
        obj = await db.get(model, item_id)
        if obj is None:
            raise not_found("资源不存在")
        return admin_out_schema.model_validate(obj)

    @r.put("/{item_id}", response_model=admin_out_schema)
    async def update_item(item_id: int, payload: in_schema, db: AsyncSession = Depends(get_db)):
        """更新：仅更新传入字段（exclude_unset），保留其余；updated_at 由 ORM onupdate 维护"""
        obj = await db.get(model, item_id)
        if obj is None:
            raise not_found("资源不存在")
        data = payload.model_dump(exclude_unset=True)
        if extra_validate:
            extra_validate(data)
        data = _serialize_data(model, data)
        for k, v in data.items():
            setattr(obj, k, v)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise bad_request("数据冲突：唯一字段（如产品编号）重复")
        await db.refresh(obj)
        return admin_out_schema.model_validate(obj)

    @r.delete("/{item_id}", status_code=204)
    async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
        """删除：物理删除；受外键 RESTRICT 保护（如系列下有产品）时返回 400 提示"""
        obj = await db.get(model, item_id)
        if obj is None:
            raise not_found("资源不存在")
        await db.delete(obj)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise bad_request("该记录存在关联数据，无法删除（请先处理关联记录）")
        return None

    return r


# ============ 业务校验回调 ============

def _validate_news(data: dict) -> None:
    """新闻发布约束：is_published=1（发布）时 publish_date 必填（对齐数据库 CHECK）"""
    if data.get("is_published") and not data.get("publish_date"):
        raise bad_request("发布新闻必须填写发布时间 publish_date")


def _validate_job(data: dict) -> None:
    """职位发布约束：status=on（上架）时 publish_date 必填（对齐数据库 CHECK）"""
    if data.get("status") == "on" and not data.get("publish_date"):
        raise bad_request("上架职位必须填写发布日期 publish_date")


def _validate_product(data: dict) -> None:
    """产品校验：名称与编号必填（schema 已强制），此处预留扩展"""
    return None


# ============ 8 个内容资源 CRUD ============

router.include_router(_make_crud(
    "/banners", Banner, BannerIn, BannerAdminOut,
    search_fields=("title",),
))
router.include_router(_make_crud(
    "/product-series", ProductSeries, ProductSeriesIn, ProductSeriesAdminOut,
    search_fields=("name",),
))
# 产品：列表路由自定义（支持关键字/系列/空间分类筛选），其余 CRUD 走通用工厂
router.include_router(_make_crud(
    "/products", Product, ProductIn, ProductAdminOut,
    search_fields=("name", "product_no"),
    with_list=False,
))
router.include_router(_make_crud(
    "/cases", Case, CaseIn, CaseAdminOut,
    search_fields=("title",),
))
router.include_router(_make_crud(
    "/news", News, NewsIn, NewsAdminOut,
    search_fields=("title",),
    extra_validate=_validate_news,
))
router.include_router(_make_crud(
    "/jobs", Job, JobIn, JobAdminOut,
    search_fields=("title",),
    extra_validate=_validate_job,
))
router.include_router(_make_crud(
    "/franchise", FranchiseContent, FranchiseIn, FranchiseAdminOut,
    search_fields=("title",),
))
router.include_router(_make_crud(
    "/stores", Store, StoreIn, StoreAdminOut,
    search_fields=("name", "city"),
))


# ============ 产品列表（自定义筛选） ============

@router.get("/products", response_model=PageResult)
async def list_products(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    status: str | None = Query(None, description="按状态筛选 on/off/draft"),
    q: str | None = Query(None, max_length=50, description="关键字（名称/编号）"),
    series_id: int | None = Query(None, description="按系列筛选"),
    category_id: int | None = Query(None, description="按空间分类筛选"),
) -> PageResult:
    """产品列表（后台）：关键字/系列/空间分类/状态多维筛选 + 分页"""
    cond = []
    if status:
        cond.append(Product.status == status)
    if q:
        from sqlalchemy import or_
        cond.append(or_(Product.name.like(f"%{q}%"), Product.product_no.like(f"%{q}%")))
    if series_id is not None:
        cond.append(Product.series_id == series_id)
    if category_id is not None:
        cond.append(Product.category_id == category_id)
    total = (await db.execute(select(func.count(Product.id)).where(*cond))).scalar_one()
    stmt = (
        select(Product).where(*cond)
        .order_by(Product.sort_order, Product.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(
        items=[ProductAdminOut.model_validate(i) for i in items],
        total=total, page=page, page_size=page_size,
    )


# ============ 仪表盘 ============

@router.get("/dashboard", response_model=DashboardOut)
async def dashboard(db: AsyncSession = Depends(get_db)) -> DashboardOut:
    """仪表盘统计：各内容模块计数 + 待处理询盘数（PRD §7.1 / §13 北极星）"""
    from app.models import Inquiry
    counts = {
        "product_series": (await db.execute(select(func.count(ProductSeries.id)))).scalar_one(),
        "products": (await db.execute(select(func.count(Product.id)))).scalar_one(),
        "cases": (await db.execute(select(func.count(Case.id)))).scalar_one(),
        "news": (await db.execute(select(func.count(News.id)))).scalar_one(),
        "stores": (await db.execute(select(func.count(Store.id)))).scalar_one(),
        "pending_inquiries": (
            await db.execute(select(func.count(Inquiry.id)).where(Inquiry.status == "pending"))
        ).scalar_one(),
    }
    return DashboardOut(**counts)


# ============ 关于页（键值式） ============

@router.get("/about/{key}", response_model=AboutPageOut)
async def get_about(key: str, db: AsyncSession = Depends(get_db)) -> AboutPageOut:
    """关于页详情：key ∈ about_d/brand/history"""
    page = await db.get(ContentPage, key)
    if page is None:
        raise not_found("关于页不存在")
    return AboutPageOut.model_validate(page)


@router.put("/about/{key}", response_model=AboutPageOut)
async def update_about(key: str, payload: AboutPageIn, db: AsyncSession = Depends(get_db)) -> AboutPageOut:
    """更新关于页：
    - about_d/brand：content 为富文本（bleach 净化）
    - history：content 为结构化时间轴 JSON 列表 [{year,event,image}]（PRD §8.9）
    """
    page = await db.get(ContentPage, key)
    if page is None:
        raise not_found("关于页不存在")
    data = payload.model_dump(exclude_unset=True)
    if "content" in data and data["content"] is not None:
        if key == "history" and isinstance(data["content"], list):
            # 发展历程：结构化时间轴 → JSON 字符串落库
            data["content"] = json.dumps(data["content"], ensure_ascii=False)
        else:
            # 富文本页：bleach 净化
            data["content"] = clean_html(data["content"])
    if "images" in data and isinstance(data["images"], list):
        data["images"] = json.dumps(data["images"], ensure_ascii=False)
    for k, v in data.items():
        setattr(page, k, v)
    await db.commit()
    await db.refresh(page)
    return AboutPageOut.model_validate(page)


# ============ 联系信息（单行 id=1） ============

@router.get("/contact", response_model=ContactAdminOut)
async def get_contact(db: AsyncSession = Depends(get_db)) -> ContactAdminOut:
    """联系信息详情：单行（id=1，CHECK 约束）"""
    contact = await db.get(CompanyContact, 1)
    if contact is None:
        raise not_found("联系信息未配置")
    return ContactAdminOut.model_validate(contact)


@router.put("/contact", response_model=ContactAdminOut)
async def update_contact(payload: ContactIn, db: AsyncSession = Depends(get_db)) -> ContactAdminOut:
    """更新联系信息：必须显式保持 id=1（数据库设计文档 §7.3 单行约束）"""
    contact = await db.get(CompanyContact, 1)
    if contact is None:
        raise not_found("联系信息未配置")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(contact, k, v)
    await db.commit()
    await db.refresh(contact)
    return ContactAdminOut.model_validate(contact)


# ============ 图片上传 ============

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)) -> dict:
    """图片上传（ADR-003 本地目录存储）：
    - 类型白名单：jpeg/png/webp（配置 ALLOWED_IMAGE_TYPES）
    - 大小上限：MAX_UPLOAD_MB（默认 5MB）
    - 文件名：uuid 生成（避免路径穿越/重名），扩展名取原文件
    - 返回相对 URL（/uploads/xxx），前端直接用于 <img src> 与入库
    """
    # 1) 类型校验
    if file.content_type not in settings.allowed_image_types_list:
        raise too_large(f"仅支持图片类型：{settings.allowed_image_types}")
    # 2) 大小校验（读取前先按配置上限截断检测）
    max_bytes = settings.max_upload_mb * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise too_large(f"图片不能超过 {settings.max_upload_mb}MB")
    # 3) 扩展名安全提取（仅字母数字，防御路径注入）
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp"):
        raise too_large("文件扩展名不支持")
    filename = f"{uuid.uuid4().hex}.{ext}"
    # 4) 写入本地 uploads 目录（Nginx 直出静态文件，ADR-003）
    from pathlib import Path
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(content)
    return {"url": f"/uploads/{filename}"}

"""公开只读接口（🔓，无需鉴权）—— 对齐《开发技术文档 v1.2》§5.1

约定：
- 所有列表仅返回上架/发布内容（status='on' / is_published=1）
- 分页参数 page(默认1) / page_size(默认12，最大50)
- news：deadline 为空=不过期，非空且早于今天=过期不展示；排序 is_top 优先、publish_date 倒序
- products 详情补充系列名 series_name；JSON 字段（gallery/specs）由 Out schema 自动解析
"""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.errors import not_found
from app.models import (
    Banner, Case, CompanyContact, ContentPage, FranchiseContent,
    Job, News, Product, ProductSeries, Store,
)
from app.schemas import (
    BannerOut, CaseOut, ContactOut, FranchiseOut, JobOut,
    NewsDetailOut, NewsListItem, PageResult, ProductOut,
    ProductSeriesOut, StoreOut, AboutPageOut,
)

router = APIRouter(prefix="/api", tags=["public"])

# 分页上限与默认值（技术文档 §5 约定）
DEFAULT_PAGE_SIZE = 12
MAX_PAGE_SIZE = 50


def _page_args(page: int = Query(1, ge=1), page_size: int = Query(12, ge=1, le=50)):
    """分页参数依赖：page>=1，page_size 1~50"""
    return page, page_size


@router.get("/banners", response_model=PageResult)
async def list_banners(
    db: AsyncSession = Depends(get_db),
    page_size: int = Query(50, ge=1, le=MAX_PAGE_SIZE),
) -> PageResult:
    """首页轮播：仅上架（on），按排序值升序，一次返回全部（默认 50 上限）"""
    stmt = (
        select(Banner)
        .where(Banner.status == "on")
        .order_by(Banner.sort_order, Banner.id)
        .limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(items=[BannerOut.model_validate(b) for b in items], total=len(items), page=1, page_size=page_size)


@router.get("/product-series", response_model=PageResult)
async def list_product_series(
    db: AsyncSession = Depends(get_db),
    page_size: int = Query(50, ge=1, le=MAX_PAGE_SIZE),
) -> PageResult:
    """产品系列（产品中心筛选数据源）：仅上架，按排序值升序"""
    stmt = (
        select(ProductSeries)
        .where(ProductSeries.status == "on")
        .order_by(ProductSeries.sort_order, ProductSeries.id)
        .limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(items=[ProductSeriesOut.model_validate(s) for s in items], total=len(items), page=1, page_size=page_size)


@router.get("/products", response_model=PageResult)
async def list_products(
    db: AsyncSession = Depends(get_db),
    q: str | None = Query(None, min_length=1, max_length=50, description="关键字（匹配产品名）"),
    series_id: int | None = Query(None, description="按系列筛选"),
    category_id: int | None = Query(None, description="按空间分类筛选"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=MAX_PAGE_SIZE),
) -> PageResult:
    """产品列表：仅上架；支持关键字/系列/空间分类筛选 + 分页"""
    cond = [Product.status == "on"]
    if q:
        cond.append(Product.name.like(f"%{q}%"))
    if series_id is not None:
        cond.append(Product.series_id == series_id)
    if category_id is not None:
        cond.append(Product.category_id == category_id)

    total = (await db.execute(select(func.count(Product.id)).where(*cond))).scalar_one()
    stmt = (
        select(Product)
        .where(*cond)
        .order_by(Product.is_top.desc(), Product.sort_order, Product.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(
        items=[ProductOut.model_validate(p) for p in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)) -> ProductOut:
    """产品详情：仅上架可见；补充所属系列名（series_name）供前端展示"""
    stmt = (
        select(Product, ProductSeries.name)
        .join(ProductSeries, Product.series_id == ProductSeries.id)
        .where(Product.id == product_id, Product.status == "on")
    )
    row = (await db.execute(stmt)).first()
    if row is None:
        raise not_found("产品不存在或未上架")
    out = ProductOut.model_validate(row[0])
    out.series_name = row[1]
    return out


@router.get("/cases", response_model=PageResult)
async def list_cases(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=MAX_PAGE_SIZE),
) -> PageResult:
    """案例列表：仅上架"""
    cond = [Case.status == "on"]
    total = (await db.execute(select(func.count(Case.id)).where(*cond))).scalar_one()
    stmt = (
        select(Case).where(*cond)
        .order_by(Case.sort_order, Case.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(items=[CaseOut.model_validate(c) for c in items], total=total, page=page, page_size=page_size)


@router.get("/cases/{case_id}", response_model=CaseOut)
async def get_case(case_id: int, db: AsyncSession = Depends(get_db)) -> CaseOut:
    """案例详情：仅上架可见，含图集与关联产品 id 列表"""
    case = await db.get(Case, case_id)
    if case is None or case.status != "on":
        raise not_found("案例不存在或未上架")
    return CaseOut.model_validate(case)


@router.get("/news", response_model=PageResult)
async def list_news(
    db: AsyncSession = Depends(get_db),
    category: str | None = Query(None, pattern="^(company|industry)$", description="company/industry"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=MAX_PAGE_SIZE),
) -> PageResult:
    """新闻列表：仅已发布（is_published=1）且未过期（deadline 为空或 >= 今天）；置顶优先、时间倒序"""
    today = date.today().isoformat()  # YYYY-MM-DD，字符串比较即可
    cond = [News.is_published == 1, or_(News.deadline.is_(None), News.deadline >= today)]
    if category:
        cond.append(News.category == category)
    total = (await db.execute(select(func.count(News.id)).where(*cond))).scalar_one()
    stmt = (
        select(News).where(*cond)
        .order_by(News.is_top.desc(), News.publish_date.desc(), News.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(items=[NewsListItem.model_validate(n) for n in items], total=total, page=page, page_size=page_size)


@router.get("/news/{news_id}", response_model=NewsDetailOut)
async def get_news(news_id: int, db: AsyncSession = Depends(get_db)) -> NewsDetailOut:
    """新闻详情：仅已发布且未过期可见，含正文（入库前已 bleach 净化）"""
    today = date.today().isoformat()
    stmt = (
        select(News).where(
            News.id == news_id,
            News.is_published == 1,
            or_(News.deadline.is_(None), News.deadline >= today),
        )
    )
    news = (await db.execute(stmt)).scalar_one_or_none()
    if news is None:
        raise not_found("新闻不存在或未发布")
    return NewsDetailOut.model_validate(news)


@router.get("/jobs", response_model=PageResult)
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    category: str | None = Query(None, pattern="^(social|campus)$", description="social/campus"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=MAX_PAGE_SIZE),
) -> PageResult:
    """招聘列表：仅上架；按发布时间倒序"""
    cond = [Job.status == "on"]
    if category:
        cond.append(Job.category == category)
    total = (await db.execute(select(func.count(Job.id)).where(*cond))).scalar_one()
    stmt = (
        select(Job).where(*cond)
        .order_by(Job.publish_date.desc(), Job.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(items=[JobOut.model_validate(j) for j in items], total=total, page=page, page_size=page_size)


@router.get("/jobs/{job_id}", response_model=JobOut)
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)) -> JobOut:
    """职位详情：仅上架可见，含职责/要求/投递方式（apply_info）"""
    job = await db.get(Job, job_id)
    if job is None or job.status != "on":
        raise not_found("职位不存在或已下架")
    return JobOut.model_validate(job)


@router.get("/franchise", response_model=PageResult)
async def list_franchise(
    db: AsyncSession = Depends(get_db),
    page_size: int = Query(50, ge=1, le=MAX_PAGE_SIZE),
) -> PageResult:
    """招商政策/优势：仅上架，按排序值升序"""
    stmt = (
        select(FranchiseContent).where(FranchiseContent.status == "on")
        .order_by(FranchiseContent.sort_order, FranchiseContent.id)
        .limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(items=[FranchiseOut.model_validate(f) for f in items], total=len(items), page=1, page_size=page_size)


@router.get("/stores", response_model=PageResult)
async def list_stores(
    db: AsyncSession = Depends(get_db),
    province: str | None = Query(None, max_length=20),
    city: str | None = Query(None, max_length=20),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=MAX_PAGE_SIZE),
) -> PageResult:
    """门店列表：仅上架；支持按省/市筛选；含经纬度供地图标点"""
    cond = [Store.status == "on"]
    if province:
        cond.append(Store.province == province)
    if city:
        cond.append(Store.city == city)
    total = (await db.execute(select(func.count(Store.id)).where(*cond))).scalar_one()
    stmt = (
        select(Store).where(*cond)
        .order_by(Store.province, Store.city, Store.id)
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(items=[StoreOut.model_validate(s) for s in items], total=total, page=page, page_size=page_size)


@router.get("/about/{key}", response_model=AboutPageOut)
async def get_about(key: str, db: AsyncSession = Depends(get_db)) -> AboutPageOut:
    """关于页：key 固定 about_d/brand/history；history 的 content 为结构化时间轴 JSON（自动解析）"""
    page = await db.get(ContentPage, key)
    if page is None:
        raise not_found("关于页不存在")
    return AboutPageOut.model_validate(page)


@router.get("/contact", response_model=ContactOut)
async def get_contact(db: AsyncSession = Depends(get_db)) -> ContactOut:
    """联系信息：单条（id=1），前台联系页与页脚共用"""
    contact = await db.get(CompanyContact, 1)
    if contact is None:
        raise not_found("联系信息未配置")
    return ContactOut.model_validate(contact)


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1, max_length=50, description="搜索关键字"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """站内搜索：产品（名称/系列名）+ 新闻（标题/正文），各返回前 10 条"""
    kw = f"%{q}%"
    # 产品：匹配产品名 或 所属系列名（join product_series）
    p_stmt = (
        select(Product, ProductSeries.name)
        .join(ProductSeries, Product.series_id == ProductSeries.id)
        .where(Product.status == "on", or_(Product.name.like(kw), ProductSeries.name.like(kw)))
        .order_by(Product.id.desc()).limit(10)
    )
    products = []
    for product, series_name in (await db.execute(p_stmt)).all():
        out = ProductOut.model_validate(product)
        out.series_name = series_name
        products.append(out)

    # 新闻：匹配标题或正文，仅已发布
    today = date.today().isoformat()
    n_stmt = (
        select(News).where(
            News.is_published == 1,
            or_(News.deadline.is_(None), News.deadline >= today),
            or_(News.title.like(kw), News.content.like(kw)),
        )
        .order_by(News.id.desc()).limit(10)
    )
    news = (await db.execute(n_stmt)).scalars().all()
    return {"products": products, "news": [NewsListItem.model_validate(n) for n in news]}

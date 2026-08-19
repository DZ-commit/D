"""后台询盘中心（🔒）—— 对齐《开发技术文档 v1.2》§5.5/§5.6

- 列表：type / status / date_from / date_to 多维筛选 + 分页
- 详情：全字段
- PATCH：标记状态（pending/done/invalid）+ 备注（状态机 §5.6）
- CSV 导出：服务端按筛选生成，UTF-8 BOM，文件名含日期（PRD §7.3 P2）
"""
import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.errors import not_found
from app.core.security import get_current_user
from app.models import Inquiry
from app.schemas import InquiryOut, InquiryUpdate, PageResult

router = APIRouter(prefix="/api/admin/inquiries", tags=["admin-inquiries"], dependencies=[Depends(get_current_user)])

# 询盘类型中文映射（CSV 导出展示用）
TYPE_LABEL = {
    "appointment": "在线预约",
    "message": "联系留言",
    "franchise": "招商咨询",
    "job": "招聘意向",
}
STATUS_LABEL = {"pending": "待处理", "done": "已处理", "invalid": "无效"}


@router.get("/export")
async def export_inquiries(
    db: AsyncSession = Depends(get_db),
    type: str | None = Query(None, pattern="^(appointment|message|franchise|job)$"),
    status: str | None = Query(None, pattern="^(pending|done|invalid)$"),
    date_from: str | None = Query(None, description="YYYY-MM-DD"),
    date_to: str | None = Query(None, description="YYYY-MM-DD"),
) -> Response:
    """CSV 导出：按筛选条件生成，UTF-8 含 BOM（Excel 兼容），文件名含日期（技术文档 §18）"""
    cond = _build_conds(type, status, date_from, date_to)
    stmt = select(Inquiry).where(*cond).order_by(Inquiry.id.desc())
    rows = (await db.execute(stmt)).scalars().all()

    # 生成 CSV（BOM 前缀 + utf-8 编码，Excel 可直接打开不乱码）
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["ID", "类型", "姓名", "电话", "邮箱", "主题/意向职位", "留言", "状态", "备注", "提交时间"])
    for r in rows:
        writer.writerow([
            r.id, TYPE_LABEL.get(r.type, r.type), r.name, r.phone, r.email or "",
            r.subject or "", r.message or "", STATUS_LABEL.get(r.status, r.status),
            r.note or "", r.created_at,
        ])
    csv_bytes = ("\ufeff" + buf.getvalue()).encode("utf-8")  # BOM 防乱码

    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="inquiries_{today}.csv"'},
    )


def _build_conds(
    type: str | None, status: str | None, date_from: str | None, date_to: str | None
) -> list:
    """询盘筛选条件构造：类型/状态/创建时间区间（created_at 为 YYYY-MM-DD HH:MM:SS 文本，前缀匹配日期）"""
    cond = []
    if type:
        cond.append(Inquiry.type == type)
    if status:
        cond.append(Inquiry.status == status)
    if date_from:
        cond.append(Inquiry.created_at >= f"{date_from} 00:00:00")
    if date_to:
        cond.append(Inquiry.created_at <= f"{date_to} 23:59:59")
    return cond


@router.get("", response_model=PageResult)
async def list_inquiries(
    db: AsyncSession = Depends(get_db),
    type: str | None = Query(None, pattern="^(appointment|message|franchise|job)$"),
    status: str | None = Query(None, pattern="^(pending|done|invalid)$"),
    date_from: str | None = Query(None, description="YYYY-MM-DD"),
    date_to: str | None = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
) -> PageResult:
    """询盘列表：类型/状态/时间三维筛选 + 分页（默认时间倒序）"""
    cond = _build_conds(type, status, date_from, date_to)
    total = (await db.execute(select(func.count(Inquiry.id)).where(*cond))).scalar_one()
    stmt = (
        select(Inquiry).where(*cond)
        .order_by(Inquiry.id.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )
    items = (await db.execute(stmt)).scalars().all()
    return PageResult(
        items=[InquiryOut.model_validate(i) for i in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{inquiry_id}", response_model=InquiryOut)
async def get_inquiry(inquiry_id: int, db: AsyncSession = Depends(get_db)) -> InquiryOut:
    """询盘详情：全字段"""
    inquiry = await db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise not_found("询盘不存在")
    return InquiryOut.model_validate(inquiry)


@router.patch("/{inquiry_id}", response_model=InquiryOut)
async def update_inquiry(
    inquiry_id: int, payload: InquiryUpdate, db: AsyncSession = Depends(get_db)
) -> InquiryOut:
    """询盘处理：标记状态（待处理/已处理/无效）与填写备注（状态机 §5.6）"""
    inquiry = await db.get(Inquiry, inquiry_id)
    if inquiry is None:
        raise not_found("询盘不存在")
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(inquiry, k, v)
    await db.commit()
    await db.refresh(inquiry)
    return InquiryOut.model_validate(inquiry)

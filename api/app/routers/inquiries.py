"""前台询盘提交（🔓，四类表单统一）—— 对齐《开发技术文档 v1.2》§5.3

- POST /api/inquiries：在线预约/联系留言/招商咨询/招聘意向 统一入库
- 蜜罐防刷（D6）：隐藏字段 hp 有值视为机器人，静默成功（202）不落库
- 合规（PRD §11）：consent_at 记录隐私同意时间戳；message 去除 HTML 标签防 XSS
"""
import bleach
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import Inquiry
from app.schemas import InquiryCreate

router = APIRouter(prefix="/api", tags=["inquiries"])


@router.post("/inquiries", status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    payload: InquiryCreate,
    db: AsyncSession = Depends(get_db),
    response: Response = None,  # type: ignore[assignment]
) -> dict:
    """四类公开表单统一提交：
    1) 蜜罐 hp 有值 → 判定为机器人，返回 202 空响应（不落库，不给攻击者反馈）
    2) 正常提交 → 入库（type/name/phone 由 schema 校验；consent_at 合规留痕）
    """
    if payload.hp:
        # 蜜罐命中：静默丢弃（技术文档 §5.3：hp 有值则丢弃）
        response.status_code = status.HTTP_202_ACCEPTED
        return {}

    inquiry = Inquiry(
        type=payload.type,
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        email=payload.email.strip() if payload.email else None,
        subject=payload.subject.strip() if payload.subject else None,
        # 纯文本留言：去除一切 HTML 标签（防 XSS），保留换行
        message=bleach.clean(payload.message or "", tags=[], strip=True),
        consent_at=payload.consent_at,
        status="pending",  # 初始待处理（询盘状态机 §5.6）
    )
    db.add(inquiry)
    await db.commit()
    await db.refresh(inquiry)
    return {"id": inquiry.id}

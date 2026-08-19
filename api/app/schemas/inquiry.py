"""询盘与仪表盘 Schema

功能：
- 前台四类表单（在线预约/联系留言/招商咨询/招聘意向）统一提交入参，含蜜罐字段 hp（防刷，有值则丢弃）
- 后台询盘中心：状态/备注更新（PATCH）、详情出参
- 仪表盘统计出参
"""
from pydantic import field_validator

from app.schemas.common import ORMModel, PhoneMixin, TimestampFields


class InquiryCreate(PhoneMixin, ORMModel):
    """前台询盘提交入参（四类表单统一）：
    - type：appointment(在线预约)/message(联系留言)/franchise(招商咨询)/job(招聘意向)
    - hp：蜜罐隐藏字段，前端留空；后端检测到有值视为机器人，直接丢弃（不落库）
    - consent_at：隐私同意时间戳（前端勾选隐私提示时记录，合规留痕）
    - subject：预约类型/主题；招聘意向的「意向职位」写入此字段
    """
    type: str
    name: str
    phone: str
    email: str | None = None
    subject: str | None = None
    message: str | None = None
    consent_at: str | None = None
    hp: str | None = None  # 蜜罐（honeypot）

    @field_validator("type")
    @classmethod
    def _type(cls, v: str) -> str:
        """type 封闭枚举校验（对齐数据库 CHECK）"""
        if v not in ("appointment", "message", "franchise", "job"):
            raise ValueError("type 仅支持 appointment/message/franchise/job")
        return v


class InquiryUpdate(ORMModel):
    """后台询盘更新入参（PATCH）：标记状态 / 填写备注"""
    status: str | None = None
    note: str | None = None

    @field_validator("status")
    @classmethod
    def _status(cls, v: str | None) -> str | None:
        """status 封闭枚举校验（pending/done/invalid）"""
        if v is not None and v not in ("pending", "done", "invalid"):
            raise ValueError("status 仅支持 pending/done/invalid")
        return v


class InquiryOut(ORMModel, TimestampFields):
    """询盘出参（后台列表/详情共用）：完整字段"""
    id: int
    type: str
    name: str
    phone: str
    email: str | None = None
    subject: str | None = None
    message: str | None = None
    status: str = "pending"
    note: str | None = None
    consent_at: str | None = None


class DashboardOut(ORMModel):
    """后台仪表盘统计出参：
    - 内容计数：系列/产品/案例/新闻/门店
    - pending_inquiries：待处理询盘数（北极星指标核心）
    """
    product_series: int = 0
    products: int = 0
    cases: int = 0
    news: int = 0
    stores: int = 0
    pending_inquiries: int = 0

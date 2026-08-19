"""通用 Schema 基座
功能：分页出参包装、时间戳字段复用、大陆电话格式校验
说明：所有 Out 模型启用 from_attributes（支持直接从 ORM 对象构造）
"""
from pydantic import BaseModel, ConfigDict, field_validator

import re

# 大陆手机号：1 开头 + 第二位 3-9 + 9 位数字
MOBILE_RE = re.compile(r"^1[3-9]\d{9}$")
# 大陆固话：区号 0 开头 2-3 位（可带 -）+ 7-8 位号码
TEL_RE = re.compile(r"^0\d{2,3}-?\d{7,8}$")


class ORMModel(BaseModel):
    """ORM 兼容基类：允许从 SQLAlchemy 对象直接构建（from_attributes）"""
    model_config = ConfigDict(from_attributes=True)


class TimestampFields(BaseModel):
    """审计时间戳字段（创建/更新时间，文本格式 YYYY-MM-DD HH:MM:SS UTC）
    说明：独立继承 BaseModel（与 ORMModel 为兄弟类），避免多继承 MRO 菱形冲突
    """
    model_config = ConfigDict(from_attributes=True)
    created_at: str | None = None
    updated_at: str | None = None


class PageResult(ORMModel):
    """通用分页包装：items 装载数据列表，total 为总数，page/page_size 回显分页参数"""
    items: list
    total: int
    page: int = 1
    page_size: int = 12


def validate_cn_phone(value: str) -> str:
    """校验大陆手机或固话格式；不匹配则抛出 ValueError（Pydantic 自动转 400）"""
    v = (value or "").strip()
    if not (MOBILE_RE.match(v) or TEL_RE.match(v)):
        raise ValueError("电话需为大陆手机号或固话格式")
    return v


class PhoneMixin(BaseModel):
    """电话校验复用：用于公开表单入参（phone 字段在子类中定义，故 check_fields=False）"""
    @field_validator("phone", check_fields=False)
    @classmethod
    def _check_phone(cls, v: str) -> str:
        return validate_cn_phone(v)

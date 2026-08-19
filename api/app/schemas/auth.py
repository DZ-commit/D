"""鉴权 Schema（登录 / 修改密码 / 当前用户）

功能：
- 登录入参（用户名+密码），登录出参含 JWT token、首次强制改密标记、角色 code
- 密码强度校验：至少 8 位且同时包含字母与数字（PRD §7.1 首次登录强制改密）
- 密码修改：支持首次强改密（仅 new_password）与常规修改（old+new）
"""
import re

from pydantic import field_validator

from app.schemas.common import ORMModel, TimestampFields

# 密码强度：≥8 位，含字母与数字
_PASSWORD_RE = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")


class LoginIn(ORMModel):
    """登录入参：用户名 + 密码"""
    username: str
    password: str


class LoginOut(ORMModel):
    """登录出参：token 为 JWT；role 为 users.role_id→roles.code（视图级权限依据）"""
    token: str
    must_change_password: int
    username: str
    avatar_url: str | None = None
    role: str | None = None


class PasswordChangeIn(ORMModel):
    """修改密码入参：
    - 常规修改：old_password + new_password
    - 首次强制改密：仅 new_password（old_password 可空）
    """
    old_password: str | None = None
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _strength(cls, v: str) -> str:
        """密码强度校验：至少 8 位且同时包含字母与数字"""
        if not _PASSWORD_RE.match(v or ""):
            raise ValueError("新密码需至少 8 位且包含字母与数字")
        return v


class UserOut(ORMModel, TimestampFields):
    """当前用户出参（GET /api/admin/me）：基本信息 + 角色/部门"""
    id: int
    username: str
    real_name: str | None = None
    nickname: str | None = None
    phone: str | None = None
    email: str | None = None
    gender: str | None = None
    position: str | None = None
    department_id: int | None = None
    role_id: int | None = None
    role: str | None = None  # 角色 code（users.role_id→roles.code），视图级权限依据
    avatar_url: str | None = None
    is_activate: int = 1
    must_change_password: int = 1

"""鉴权接口（登录 / 修改密码 / 当前用户 / 头像）—— 对齐《开发技术文档 v1.2》§5.2/§5.4

- POST /api/admin/login：登录签发 JWT（slowapi 限流 5 次/分钟/IP），角色取自 users.role_id→roles.code
- POST /api/admin/password：修改密码；must_change_password=1（首次强改密）时无需旧密码，否则须校验旧密码；改密后清除强改密标记
- GET  /api/admin/me：当前登录用户信息（含 role）
- PUT  /api/admin/avatar：更新当前用户头像 URL
"""
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.errors import bad_request, forbidden
from app.core.security import (
    create_access_token, get_current_user, hash_password, limiter, verify_password,
)
from app.models import Role, User
from app.schemas import LoginIn, LoginOut, PasswordChangeIn, UserOut
from app.schemas.common import ORMModel

router = APIRouter(prefix="/api/admin", tags=["auth"])


class _AvatarIn(ORMModel):
    """头像更新入参：avatar_url 为上传后返回的 /uploads/... 路径"""
    avatar_url: str


async def _resolve_role(db: AsyncSession, user: User) -> str | None:
    """解析用户角色 code：users.role_id → roles.code（用于 JWT 载荷与出参）"""
    if user.role_id is None:
        return None
    role = await db.get(Role, user.role_id)
    return role.code if role and role.is_activate else None


@router.post("/login", response_model=LoginOut)
@limiter.limit("5/minute")
async def login(
    request: Request,  # slowapi 限流依赖：取客户端 IP
    payload: LoginIn,
    db: AsyncSession = Depends(get_db),
) -> LoginOut:
    """管理员登录：
    1) 按 username 查用户，校验激活状态（is_activate=1）
    2) bcrypt 比对密码
    3) 签发 JWT（载荷 {sub, username, role}，role 用于前端视图级权限）
    """
    stmt = select(User).where(User.username == payload.username)
    user = (await db.execute(stmt)).scalar_one_or_none()
    # 统一提示：用户不存在/禁用/密码错误均返回同一错误，避免账号枚举
    if user is None or not user.is_activate or not verify_password(payload.password, user.password_hash):
        raise bad_request("用户名或密码错误")

    role = await _resolve_role(db, user)
    token = create_access_token(user.id, user.username, role)
    return LoginOut(
        token=token,
        must_change_password=user.must_change_password,
        username=user.username,
        avatar_url=user.avatar_url,
        role=role,
    )


@router.post("/password", response_model=UserOut)
async def change_password(
    payload: PasswordChangeIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    """修改密码：
    - 首次强制改密（must_change_password=1）：允许仅传 new_password
    - 常规修改：必须校验旧密码正确
    - 改密成功后清除强改密标记（must_change_password=0），并记录 updated_by 留痕
    """
    if user.must_change_password == 0:
        if not payload.old_password or not verify_password(payload.old_password, user.password_hash):
            raise bad_request("旧密码不正确")
    if verify_password(payload.new_password, user.password_hash):
        raise bad_request("新密码不能与旧密码相同")

    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = 0
    user.updated_by = user.id  # 密码修改留痕（数据库设计文档 §7.5）
    await db.commit()
    await db.refresh(user)

    out = UserOut.model_validate(user)
    out.role = await _resolve_role(db, user)
    return out


@router.get("/me", response_model=UserOut)
async def get_me(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    """当前登录用户信息（含角色 code）"""
    out = UserOut.model_validate(user)
    out.role = await _resolve_role(db, user)
    return out


@router.put("/avatar", response_model=UserOut)
async def update_avatar(
    payload: _AvatarIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    """更新头像：avatar_url 为 /uploads/... 相对路径；无头像时前端回退首字母"""
    user.avatar_url = payload.avatar_url
    user.updated_by = user.id
    await db.commit()
    await db.refresh(user)

    out = UserOut.model_validate(user)
    out.role = await _resolve_role(db, user)
    return out

"""安全核心层 —— 对齐《开发技术文档 v1.2》§4.2

- 密码：passlib[bcrypt] 哈希/校验（禁止明文）
- JWT：python-jose 签发 HS256，载荷 {sub: user_id, username, role}，role 取自 users.role_id→roles.code
- 登录限流：slowapi 5 次/分钟/IP，超限 429
"""
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models import Role, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

limiter = Limiter(key_func=get_remote_address)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(user_id: int, username: str, role: str | None) -> str:
    """签发 JWT：载荷含 sub/username/role，过期分钟数取自配置"""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """解析 Bearer Token → 校验用户存在且激活。401：未登录/token 无效/账号禁用"""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="登录已失效，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(
            credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_alg]
        )
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise unauthorized

    user = await db.get(User, user_id)
    if user is None or not user.is_activate:
        raise unauthorized
    return user


async def get_current_role(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> str | None:
    """当前用户角色 code（users.role_id → roles.code），供前端视图级权限控制"""
    if user.role_id is None:
        return None
    role = await db.get(Role, user.role_id)
    return role.code if role and role.is_activate else None

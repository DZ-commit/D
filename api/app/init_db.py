"""建表 + 种子数据 + 初始管理员 —— 用法：python -m app.init_db

对齐《数据库设计文档 v1.8》§5 初始化种子：
- company_contact 单行（id=1，CHECK(id=1)）
- content_pages 三键（about_d/brand/history）
- roles 双角色（admin/user）
- 初始管理员（密码经 bcrypt 加盐哈希，must_change_password=1，首次登录强制改密）
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, create_all
from app.core.security import hash_password
from app.core.config import settings
from app.models import CompanyContact, ContentPage, Role, User


async def seed(session: AsyncSession) -> None:
    # 1. 公司联系信息（单行，id 固定 1）
    if await session.get(CompanyContact, 1) is None:
        session.add(CompanyContact(id=1, company_name="D全屋家居"))

    # 2. 关于我们富文本页（键值占位）
    for key, title in (("about_d", "关于D"), ("brand", "品牌介绍"), ("history", "发展历程")):
        if await session.get(ContentPage, key) is None:
            session.add(ContentPage(key=key, title=title))

    # 3. 初始角色
    roles = {r.code: r for r in (await session.execute(select(Role))).scalars()}
    if "admin" not in roles:
        session.add(Role(code="admin", name="管理员"))
    if "user" not in roles:
        session.add(Role(code="user", name="普通用户"))
    await session.flush()
    roles = {r.code: r for r in (await session.execute(select(Role))).scalars()}

    # 4. 初始管理员（幂等：username 已存在则跳过）
    existing = await session.execute(select(User).where(User.username == settings.init_admin_user))
    if existing.scalar_one_or_none() is None:
        admin_role = roles.get("admin")
        session.add(
            User(
                username=settings.init_admin_user,
                real_name="系统管理员",
                password_hash=hash_password(settings.init_admin_pass),
                must_change_password=1,  # 首次登录强制改密（PRD §7.1）
                role_id=admin_role.id if admin_role else None,
                created_by=None,  # 初始账号创建人为 NULL（数据库设计文档 §7.5）
            )
        )


async def main() -> None:
    await create_all()
    async with AsyncSessionLocal() as session:
        await seed(session)
        await session.commit()
    print("✓ 建表与种子数据完成（company_contact/content_pages/roles/初始管理员）")


if __name__ == "__main__":
    asyncio.run(main())

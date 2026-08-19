"""路由聚合导出：main.py 统一挂载"""
from app.routers.admin import router as admin_router
from app.routers.admin_inquiries import router as admin_inquiries_router
from app.routers.auth import router as auth_router
from app.routers.inquiries import router as inquiries_router
from app.routers.public import router as public_router

__all__ = [
    "public_router",
    "auth_router",
    "inquiries_router",
    "admin_router",
    "admin_inquiries_router",
]

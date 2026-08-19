"""D全屋家居 后端入口 —— 对齐《开发技术文档 v1.2》§2.1 仓库布局 / §5 接口设计

功能：
- CORS（前台 5173 / 后台 5174）
- 图片静态目录 /uploads 直出（ADR-003）
- slowapi 登录限流异常处理（技术文档 §4.2：5 次/分钟/IP）
- 挂载全部路由：公开只读 / 鉴权 / 询盘 / 后台 CRUD / 询盘中心
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.security import limiter
from app.routers import (
    admin_inquiries_router, admin_router, auth_router, inquiries_router, public_router,
)

app = FastAPI(title="D全屋家居 API", version="1.0.0")

# ---- CORS：仅允许前台/后台两个本地端口（开发期），生产由 Nginx 同源反代收敛 ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- slowapi 登录限流：注册限流器与 429 异常处理器 ----
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---- 图片静态目录直出（本地目录 + Nginx 直出；DB 只存相对 URL）----
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ---- 路由挂载 ----
app.include_router(public_router)            # 公开只读（banners/products/news/...）
app.include_router(inquiries_router)         # 前台四类询盘提交（蜜罐防刷）
app.include_router(auth_router)              # 登录 / 改密 / me / avatar
app.include_router(admin_router)             # 后台内容 CRUD + 仪表盘 + 上传
app.include_router(admin_inquiries_router)   # 询盘中心（筛选/标记/导出）


@app.get("/api/health", tags=["system"])
def health() -> dict:
    """健康检查：用于部署探活与开发冒烟"""
    return {"status": "ok", "app": "d-whole-home", "version": "1.0.0"}

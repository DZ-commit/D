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
from fastapi.responses import FileResponse, JSONResponse
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


# ---- 生产/同源托管：后端直接服务前端 SPA（backend/dist） ----
# 前端（Vite/React）构建产物由本后端同源提供；/api 与 /uploads 仍由路由/挂载处理，
# 其余路径回退到 index.html，以支持前端 history 路由（如 /products、/admin）。
DIST_DIR = Path(__file__).resolve().parent.parent / "backend" / "dist"


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # /api 与 /uploads 不应由此处理（已由上层路由/挂载接管）
    if full_path.startswith("api") or full_path.startswith("uploads"):
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    index_file = DIST_DIR / "index.html"
    if not index_file.exists():
        return JSONResponse(
            status_code=404,
            content={"detail": "前端未构建，请在 backend/ 执行 npm run build"},
        )
    requested = (DIST_DIR / full_path).resolve()
    if requested.is_file() and str(requested).startswith(str(DIST_DIR.resolve())):
        return FileResponse(requested)
    return FileResponse(index_file)

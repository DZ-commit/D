"""D全屋家居 后端入口（Phase 0 骨架，Phase 1 挂载全部路由）

对齐《开发技术文档 v1.2》§2.1 仓库布局 / §2.3 配置
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings

app = FastAPI(title="D全屋家居 API", version="0.1.0")

# CORS：仅允许前台/后台两个本地端口（开发期），生产由 Nginx 同源反代收敛
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 图片静态目录直出（ADR-003：本地目录 + Nginx 直出；DB 只存相对 URL）
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health", tags=["system"])
def health() -> dict:
    return {"status": "ok", "app": "d-whole-home"}

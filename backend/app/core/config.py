"""应用配置 —— 对齐《开发技术文档 v1.2》§2.3 backend/.env"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # 数据库
    database_url: str = "sqlite+aiosqlite:///./app.db"
    # JWT
    jwt_secret: str = "please-change-me"
    jwt_alg: str = "HS256"
    access_token_expire_minutes: int = 1440
    # 上传
    upload_dir: str = "./uploads"
    max_upload_mb: int = 5
    allowed_image_types: str = "image/jpeg,image/png,image/webp"
    # CORS（逗号分隔）
    cors_origins: str = "http://localhost:5173,http://localhost:5174"
    # 高德（仅前端使用，后端透传占位）
    amap_key: str = ""
    # 初始管理员（部署脚本读取）
    init_admin_user: str = "admin"
    init_admin_pass: str = "InitAdmin@2026"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_image_types_list(self) -> list[str]:
        return [t.strip() for t in self.allowed_image_types.split(",") if t.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

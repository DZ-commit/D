# D全屋家居 后端 Docker 镜像（可选交付方式）
# 构建：docker build -f deploy/Dockerfile -t d-home-backend .
# 运行：docker run -d -p 8000:8000 -v d-home-data:/data d-home-backend
# 说明：生产推荐 Nginx(host) + 后端容器 或 全部 systemd 直跑；Docker 仅为可选
FROM python:3.13-slim

WORKDIR /app

# 依赖安装（利用层缓存）
COPY api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 应用代码
COPY api/app /app/app
COPY api/.env.example /app/.env

# 数据目录（SQLite 与上传图片持久化，容器重启不丢失）
RUN mkdir -p /data/uploads
ENV DATABASE_URL=sqlite+aiosqlite:////data/app.db
ENV UPLOAD_DIR=/data/uploads

# 健康检查（可选）
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/api/health')" || exit 1

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

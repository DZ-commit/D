# D全屋家居 —— 单进程全栈镜像
# 前端已预构建（backend/dist），运行时无需 Node，纯 Python 即可启动前后端同源服务。
FROM python:3.13-slim

WORKDIR /app

# 后端代码（含 api/uploads 图片与 api/app.db 数据库，均已提交进仓库）
COPY api/ /app/api/
# 已构建的前端产物
COPY backend/dist/ /app/backend/dist/

WORKDIR /app/api

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

ENV PORT=8000
EXPOSE 8000

# 同源托管：后端在 /api、/uploads 提供接口与图片，其余路径回退前端 index.html
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

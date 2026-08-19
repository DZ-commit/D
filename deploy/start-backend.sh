# D全屋家居 后端生产启动脚本（Linux）
# 用法：chmod +x deploy/start-backend.sh && ./deploy/start-backend.sh
# 说明：生产环境建议配合 systemd（见 deploy/d-home-backend.service）或 supervisor 管理
set -e
cd "$(dirname "$0")/../api"

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "未找到虚拟环境，创建并安装依赖..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi

# 首次部署：建表 + 初始化管理员（幂等，可重复执行）
.venv/bin/python -m app.init_db

# 生产启动：多 worker + 监听 127.0.0.1（由 Nginx 反代；对外 HTTPS 见 nginx.conf）
# 正式环境将 JWT_SECRET 等敏感配置放入 .env 或环境变量
exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2

#!/usr/bin/env bash
# D全屋家居 本地开发一键启动（Git Bash / Linux 均可）
# 用法：bash deploy/start-dev.sh    —— 分别启动 后端/前台/后台（需另开终端时可用下方分命令）
# 说明：Windows 推荐在 Git Bash 中运行；三个服务端口：后端 8000 / 前台 5173 / 后台 5174
set -e
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════"
echo "  D全屋家居 本地开发启动"
echo "  后端 API : http://localhost:8000/docs"
echo "  前台官网 : http://localhost:5173"
echo "  后台管理 : http://localhost:5174"
echo "═══════════════════════════════════════════"

# 后端：建表 + 种子（幂等）+ 启动（--reload 热更新）
( cd backend && .venv/Scripts/python -m app.init_db 2>/dev/null || .venv/bin/python -m app.init_db )
echo "▶ 启动后端 (Ctrl+C 停止)..."
(cd backend && ( .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000 2>/dev/null || .venv/bin/uvicorn app.main:app --reload --port 8000 ))

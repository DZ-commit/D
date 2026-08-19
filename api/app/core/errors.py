"""统一业务错误码工具 —— 对齐《开发技术文档 v1.2》§5.7 错误码

用法：raise api_error(404, 1004, "资源不存在")
前端可按 detail.code 精确处理，按 detail.message 展示
"""
from fastapi import HTTPException


def api_error(status_code: int, code: int, message: str) -> HTTPException:
    """构造统一错误响应：{code, message}"""
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})


# 常用快捷方法（语义化，减少重复）
def not_found(message: str = "资源不存在") -> HTTPException:
    """404 / 1004：资源不存在"""
    return api_error(404, 1004, message)


def forbidden(message: str = "无权限执行此操作") -> HTTPException:
    """403 / 1003：普通用户访问管理员专属功能"""
    return api_error(403, 1003, message)


def bad_request(message: str) -> HTTPException:
    """400 / 1001：入参校验失败（业务层补充校验）"""
    return api_error(400, 1001, message)


def too_large(message: str = "上传文件超限或类型不允许") -> HTTPException:
    """413 / 1005：上传超限"""
    return api_error(413, 1005, message)

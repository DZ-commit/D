"""富文本净化 —— 对齐 ADR-004 / 技术文档 §4.1

bleach 白名单：入库前 clean，strip 未知标签；出参原样返回，前台 prose-custom 受控渲染
外链安全：clean 后正则注入 rel="noopener noreferrer"（bleach 6.x 已移除 filters 参数）
"""
import re

import bleach

ALLOWED_TAGS = [
    "p", "br", "hr",
    "h2", "h3", "h4", "h5",
    "strong", "b", "em", "i", "u", "s",
    "blockquote", "pre", "code",
    "ul", "ol", "li",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "div",
]

ALLOWED_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
    "span": ["style"],
    "*": ["class"],
}

# 外链安全：非站内链接强制 noopener（技术文档 §4.1）
PROTOCOLS = ("http", "https", "mailto")

# 匹配 clean 后规整的 <a href="http(s)://...">（白名单已限定 a 属性，格式可控）
_HTTP_LINK_RE = re.compile(r'<a\s+href="(https?://[^"]*)"')


def clean_html(html: str | None) -> str:
    """净化富文本：白名单标签/属性 + 外链强制 rel=noopener noreferrer；非字符串入参容错返回空串"""
    if not html:
        return ""
    cleaned = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=PROTOCOLS,
        strip=True,
    )
    # 给外链注入安全 rel（防 window.opener 钓鱼，对齐技术文档 §4.1）
    return _HTTP_LINK_RE.sub(
        lambda m: f'<a href="{m.group(1)}" rel="noopener noreferrer"', cleaned
    )

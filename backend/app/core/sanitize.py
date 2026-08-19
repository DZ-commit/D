"""富文本净化 —— 对齐 ADR-004 / 技术文档 §4.1

bleach 白名单：入库前 clean，strip 未知标签；出参原样返回，前台 prose-custom 受控渲染
"""
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


def _add_noopener(attrs, new, _old):
    if attrs.get("href", "").startswith("http"):
        new.setdefault(("a", "rel"), "noopener noreferrer")
    return new


def clean_html(html: str | None) -> str:
    """净化富文本：白名单标签/属性，外链强制 noopener；非字符串入参容错返回空串"""
    if not html:
        return ""
    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=PROTOCOLS,
        strip=True,
        filters=[_add_noopener],
    )

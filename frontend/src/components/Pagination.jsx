/**
 * 数字分页组件 —— 前台列表通用
 * 功能：显示页码数字按钮（最多 7 个：首页/尾页 + 当前页前后各 2 个 + 省略号）
 *       替代原来的「第 x/x 页」纯文本，方便用户直接跳转
 */
import React from 'react'

/**
 * 构造显示页码数组：首页/尾页保留，中间用省略号压缩
 * 例 total=10 page=5 → [1, '...', 3, 4, 5, 6, 7, '...', 10]
 */
function buildPages(total, current) {
  const pages = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 2) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = buildPages(totalPages, page)

  const btnBase =
    'min-w-[2.25rem] h-9 px-3 rounded-full border text-sm transition-colors flex items-center justify-center'

  return (
    <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
      {/* 上一页 */}
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={`${btnBase} border-line hover:border-brass disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        ←
      </button>

      {/* 页码数字 */}
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-muted text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`${btnBase} ${
              p === page
                ? 'bg-brass text-white border-brass'
                : 'border-line text-muted hover:border-brass hover:text-brass'
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* 下一页 */}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={`${btnBase} border-line hover:border-brass disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        →
      </button>
    </div>
  )
}

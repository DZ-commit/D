/** 前台官网设计 Token —— 对齐《UI/UX 文档 v1.1》§3.1 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F5',   // 页面背景 / 卡片底
        ink: '#1F1F1F',     // 主文字 / 标题
        brass: '#B8925F',   // 主强调色（品牌色）
        'brass-dark': '#9A7649', // 强调 hover / 渐变深端
        muted: '#7A7570',   // 次级文字
        line: '#EAE6E1',    // 描边 / 分隔线
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'], // 标题：衬线
        sans: ['"Noto Sans SC"', 'sans-serif'], // 正文：无衬线
      },
      boxShadow: {
        'card-hover': '0 20px 40px rgba(0,0,0,.08)', // 卡片 hover 阴影
      },
    },
  },
  plugins: [],
}

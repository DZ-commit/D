import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'antd/dist/reset.css'

// 注意：不使用 <React.StrictMode>——
// wangeditor 富文本编辑器在 React 18 严格模式下会「挂载→卸载→再挂载」，
// 第二次挂载时编辑器报「DOM already inited」导致整个应用白板（编辑弹窗必现）。
// 本项目为纯展示 CMS，无需严格模式的双重渲染检查，故移除。
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)

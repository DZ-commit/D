/**
 * 后台 API 封装 —— 对齐《开发技术文档 v1.2》§5 接口设计
 * 功能：axios 实例 + token 拦截器（JWT 注入）+ 401 统一跳登录；后台全部资源请求函数
 */
import axios from 'axios'
import { message } from 'antd'

// 创建 axios 实例：基础路径 /api（Vite 代理到后端 8000）
const http = axios.create({ baseURL: '/api', timeout: 15000 })

// 请求拦截器：从 localStorage 取 token 注入 Authorization
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截器：401 清空登录态跳登录页；其他错误提取后端 message
http.interceptors.response.use(
  (resp) => resp.data,
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail
    const msg = typeof detail === 'string' ? detail : detail?.message || error.message || '请求失败'
    if (status === 401) {
      // 登录失效：清除本地登录态，跳转登录页（hash 路由）
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login'
      }
    } else {
      message.error(msg)
    }
    return Promise.reject(new Error(msg))
  },
)

/** 通用请求：成功返回 data，失败抛出 Error（已提示） */
async function request(config) {
  try {
    return await http(config)
  } catch (e) {
    throw e
  }
}

// ===================== 鉴权 =====================

/** 登录：返回 {token, must_change_password, username, avatar_url, role} */
export const adminLogin = (data) => request({ url: '/admin/login', method: 'POST', data })

/** 修改密码（支持首次强制改密：仅 new_password） */
export const changePassword = (data) => request({ url: '/admin/password', method: 'POST', data })

/** 当前用户信息（含 role） */
export const fetchMe = () => request({ url: '/admin/me' })

/** 更新头像 */
export const updateAvatar = (avatar_url) => request({ url: '/admin/avatar', method: 'PUT', data: { avatar_url } })

// ===================== 仪表盘 =====================

/** 仪表盘统计：系列/产品/案例/新闻/门店数 + 待处理询盘数 */
export const fetchDashboard = () => request({ url: '/admin/dashboard' })

// ===================== 内容 CRUD（通用） =====================

/**
 * 生成资源 CRUD 请求集（对齐技术文档 §5.4）
 * @param base 资源路径，如 '/admin/products'
 */
export function crudApi(base) {
  return {
    list: (params = {}) => request({ url: base, params }),
    create: (data) => request({ url: base, method: 'POST', data }),
    get: (id) => request({ url: `${base}/${id}` }),
    update: (id, data) => request({ url: `${base}/${id}`, method: 'PUT', data }),
    remove: (id) => request({ url: `${base}/${id}`, method: 'DELETE' }),
  }
}

// 各资源 CRUD 实例
export const bannerApi = crudApi('/admin/banners')
export const seriesApi = crudApi('/admin/product-series')
export const productApi = crudApi('/admin/products')
export const caseApi = crudApi('/admin/cases')
export const newsApi = crudApi('/admin/news')
export const jobApi = crudApi('/admin/jobs')
export const franchiseApi = crudApi('/admin/franchise')
export const storeApi = crudApi('/admin/stores')

// ===================== 关于页 / 联系信息（键值式/单行） =====================

/** 获取关于页（key: about_d/brand/history） */
export const fetchAboutPage = (key) => request({ url: `/admin/about/${key}` })

/** 更新关于页（富文本 或 history 时间轴 JSON） */
export const updateAboutPage = (key, data) => request({ url: `/admin/about/${key}`, method: 'PUT', data })

/** 获取联系信息（单行） */
export const fetchContactInfo = () => request({ url: '/admin/contact' })

/** 更新联系信息 */
export const updateContactInfo = (data) => request({ url: '/admin/contact', method: 'PUT', data })

// ===================== 询盘中心 =====================

/** 询盘列表：type/status/date_from/date_to 筛选 + 分页 */
export const listInquiries = (params = {}) => request({ url: '/admin/inquiries', params })

/** 询盘详情 */
export const getInquiry = (id) => request({ url: `/admin/inquiries/${id}` })

/** 询盘更新（status/note） */
export const updateInquiry = (id, data) => request({ url: `/admin/inquiries/${id}`, method: 'PATCH', data })

/** 询盘 CSV 导出（携带当前筛选条件，浏览器下载） */
export const exportInquiries = (params = {}) => {
  // 直接以带 token 的方式打开下载链接（axios blob 方式更稳）
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString()
  return request({ url: `/admin/inquiries/export?${qs}`, responseType: 'blob' })
}

// ===================== 上传 =====================

/** 图片上传：返回 {url: "/uploads/xxx"}（AntD Upload 自定义请求用） */
export function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  return request({ url: '/admin/upload', method: 'POST', data: form })
}

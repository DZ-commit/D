/**
 * API 封装层（前台官网）
 * 功能：axios 实例 + 全部公开接口请求函数；开发期由 Vite 代理 /api → 后端 8000
 */
import axios from 'axios'

// 创建 axios 实例：基础路径 /api（Vite dev 代理到后端），10s 超时
const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

/** 通用请求包装：成功返回 data，失败抛出 Error（含后端 message） */
async function request(config) {
  try {
    const resp = await http(config)
    return resp.data
  } catch (e) {
    const msg = e.response?.data?.detail?.message || e.message || '请求失败'
    throw new Error(msg)
  }
}

/** 分页列表参数构造：page 从 1 开始，page_size 默认 12 */
function pageParams(page = 1, pageSize = 12, extra = {}) {
  return { page, page_size: pageSize, ...extra }
}

// ===================== 公开只读接口 =====================

/** 首页轮播图（仅上架） */
export const fetchBanners = () => request({ url: '/banners' })

/** 产品系列（筛选数据源） */
export const fetchSeries = () => request({ url: '/product-series' })

/** 产品列表：支持 q/series_id/category_id/分页 */
export const fetchProducts = (params) =>
  request({ url: '/products', params: pageParams(params.page, params.pageSize, params) })

/** 产品详情（含系列名） */
export const fetchProduct = (id) => request({ url: `/products/${id}` })

/** 案例列表（分页） */
export const fetchCases = (params = {}) =>
  request({ url: '/cases', params: pageParams(params.page, params.pageSize) })

/** 案例详情 */
export const fetchCase = (id) => request({ url: `/cases/${id}` })

/** 新闻列表：category=company/industry */
export const fetchNews = (params = {}) =>
  request({ url: '/news', params: pageParams(params.page, params.pageSize, params) })

/** 新闻详情 */
export const fetchNewsItem = (id) => request({ url: `/news/${id}` })

/** 招聘列表：category=social/campus */
export const fetchJobs = (params = {}) =>
  request({ url: '/jobs', params: pageParams(params.page, params.pageSize, params) })

/** 职位详情 */
export const fetchJob = (id) => request({ url: `/jobs/${id}` })

/** 招商政策/优势列表 */
export const fetchFranchise = () => request({ url: '/franchise' })

/** 门店列表：支持 province/city 筛选 */
export const fetchStores = (params = {}) =>
  request({ url: '/stores', params: { ...params, page_size: 50 } })

/** 关于页：key ∈ about_d/brand/history */
export const fetchAbout = (key) => request({ url: `/about/${key}` })

/** 联系信息（公司地址/电话/邮箱/经纬度） */
export const fetchContact = () => request({ url: '/contact' })

/** 站内搜索：q 关键字，返回产品+新闻 */
export const fetchSearch = (q) => request({ url: '/search', params: { q } })

// ===================== 询盘提交（四类表单统一） =====================

/**
 * 提交询盘（在线预约/联系留言/招商咨询/招聘意向）
 * @param data {type,name,phone,email?,subject?,message,consent_at?,hp?} hp 为蜜罐字段（前端留空）
 */
export const submitInquiry = (data) => request({ url: '/inquiries', method: 'POST', data })

/**
 * 内容管理 8 模块页面 —— 对齐 UI/UX §6 视图2-9 / PRD §7.2
 * 功能：基于通用 CrudPage 配置化生成 产品系列/产品/案例/新闻/招聘/Banner/招商/门店 管理页
 * 说明：产品/案例的 JSON 字段（规格/关联产品）以文本形式编辑，保存时解析
 */
import React, { useEffect, useState } from 'react'
import { Tag } from 'antd'
import CrudPage from '../components/CrudPage'
import {
  bannerApi, caseApi, franchiseApi, jobApi, newsApi, productApi, seriesApi, storeApi,
} from '../api/client'

// 通用状态标签色（UI/UX §4.1 语义色：上架绿/下架灰/草稿橙）
const statusTag = (s) =>
  s === 'on' ? <Tag color="green">上架</Tag>
  : s === 'off' ? <Tag>下架</Tag>
  : <Tag color="orange">草稿</Tag>

// 状态筛选选项（通用 on/off）
const ON_OFF = [
  { value: 'on', label: '上架' },
  { value: 'off', label: '下架' },
]

/** 首页 Banner 管理 */
export function BannersPage() {
  return (
    <CrudPage
      api={bannerApi}
      title="首页 Banner 管理"
      searchHint="搜索标题"
      statusFilter={ON_OFF}
      columns={[
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: '图片', dataIndex: 'image_url', width: 120, render: (v) => v ? <img src={v} alt="" style={{ width: 100, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '-' },
        { title: '标题', dataIndex: 'title' },
        { title: '跳转链接', dataIndex: 'link_url', ellipsis: true },
        { title: '排序', dataIndex: 'sort_order', width: 70 },
        { title: '状态', dataIndex: 'status', width: 80, render: statusTag },
      ]}
      formFields={[
        { name: 'title', label: '标题', placeholder: '轮播标题（可空）' },
        { name: 'image_url', label: '图片', type: 'image', rules: [{ required: true, message: '请上传轮播图片' }] },
        { name: 'link_url', label: '跳转链接', placeholder: '如 /products（可空）' },
        { name: 'sort_order', label: '排序值', type: 'number' },
        { name: 'status', label: '状态', type: 'select', options: ON_OFF },
      ]}
    />
  )
}

/** 产品系列管理 */
export function SeriesPage() {
  return (
    <CrudPage
      api={seriesApi}
      title="产品系列管理"
      searchHint="搜索系列名"
      statusFilter={ON_OFF}
      columns={[
        { title: '封面', dataIndex: 'cover_image', width: 120, render: (v) => v ? <img src={v} alt="" style={{ width: 100, height: 50, objectFit: 'cover', borderRadius: 4 }} /> : '-' },
        { title: '系列名', dataIndex: 'name' },
        { title: '描述', dataIndex: 'description', ellipsis: true },
        { title: '排序', dataIndex: 'sort_order', width: 70 },
        { title: '状态', dataIndex: 'status', width: 80, render: statusTag },
      ]}
      formFields={[
        { name: 'name', label: '系列名', rules: [{ required: true, message: '请输入系列名' }] },
        { name: 'description', label: '描述', type: 'textarea', rows: 3 },
        { name: 'cover_image', label: '封面', type: 'image' },
        { name: 'sort_order', label: '排序值', type: 'number' },
        { name: 'status', label: '状态', type: 'select', options: ON_OFF },
      ]}
    />
  )
}

// 空间分类（应用层常量，对齐前台 Products.jsx）
const CATEGORY_OPTIONS = [
  { value: 1, label: '客厅' },
  { value: 2, label: '卧室' },
  { value: 3, label: '书房' },
  { value: 4, label: '茶室' },
]

/** 产品管理（含图集/规格/三态） */
export function ProductsPage() {
  const [seriesOptions, setSeriesOptions] = useState([])

  // 加载系列列表作为产品表单的系列下拉选项
  useEffect(() => {
    seriesApi.list({ page_size: 50 }).then((r) => {
      setSeriesOptions((r.items || []).map((s) => ({ value: s.id, label: s.name })))
    }).catch(() => {})
  }, [])

  return (
    <CrudPage
      api={productApi}
      title="产品管理"
      searchHint="搜索产品名/编号"
      statusFilter={[
        { value: 'on', label: '上架' },
        { value: 'off', label: '下架' },
        { value: 'draft', label: '草稿' },
      ]}
      columns={[
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: '封面', dataIndex: 'cover_image', width: 120, render: (v) => v ? <img src={v} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }} /> : '-' },
        { title: '名称', dataIndex: 'name' },
        { title: '编号', dataIndex: 'product_no', width: 110 },
        { title: '分类', dataIndex: 'category_id', width: 80, render: (v) => CATEGORY_OPTIONS.find((c) => c.value === v)?.label || '-' },
        { title: '状态', dataIndex: 'status', width: 80, render: statusTag },
        { title: '置顶', dataIndex: 'is_top', width: 70, render: (v) => (v ? '★' : '') },
        { title: '排序', dataIndex: 'sort_order', width: 70 },
      ]}
      formFields={[
        { name: 'series_id', label: '所属系列', type: 'select', options: seriesOptions, rules: [{ required: true, message: '请选择系列' }] },
        { name: 'category_id', label: '空间分类', type: 'select', options: CATEGORY_OPTIONS },
        { name: 'name', label: '产品名称', rules: [{ required: true, message: '请输入产品名称' }] },
        { name: 'product_no', label: '产品编号', rules: [{ required: true, message: '请输入产品编号（唯一）' }] },
        { name: 'cover_image', label: '封面图', type: 'image' },
        { name: 'gallery', label: '图集（多图）', type: 'gallery' },
        { name: 'description', label: '产品详情（富文本）', type: 'rich' },
        { name: 'specs', label: '规格参数（JSON）', type: 'textarea', rows: 4, placeholder: '{"材质":"北美黑胡桃","工艺":"榫卯"}' },
        { name: 'status', label: '发布状态', type: 'select', options: [
          { value: 'on', label: '上架' },
          { value: 'off', label: '下架' },
          { value: 'draft', label: '草稿' },
        ] },
        { name: 'is_top', label: '置顶/推荐', type: 'switch' },
        { name: 'sort_order', label: '排序值', type: 'number' },
      ]}
      onBeforeSave={(p) => {
        // 规格 JSON 文本 → 对象（解析失败置空，由后端校验）
        if (typeof p.specs === 'string') {
          try { p.specs = JSON.parse(p.specs || '{}') } catch { p.specs = {} }
        }
        return p
      }}
    />
  )
}

/** 案例管理 */
export function CasesPage() {
  return (
    <CrudPage
      api={caseApi}
      title="案例管理"
      searchHint="搜索案例标题"
      statusFilter={ON_OFF}
      columns={[
        { title: '封面', dataIndex: 'cover_image', width: 120, render: (v) => v ? <img src={v} alt="" style={{ width: 100, height: 50, objectFit: 'cover', borderRadius: 4 }} /> : '-' },
        { title: '标题', dataIndex: 'title' },
        { title: '排序', dataIndex: 'sort_order', width: 70 },
        { title: '状态', dataIndex: 'status', width: 80, render: statusTag },
      ]}
      formFields={[
        { name: 'title', label: '标题', rules: [{ required: true, message: '请输入标题' }] },
        { name: 'cover_image', label: '封面', type: 'image' },
        { name: 'gallery', label: '图集（多图）', type: 'gallery' },
        { name: 'description', label: '案例说明（富文本）', type: 'rich' },
        { name: 'related_products', label: '关联产品ID（JSON 数组）', type: 'textarea', rows: 3, placeholder: '[1, 2, 3]' },
        { name: 'sort_order', label: '排序值', type: 'number' },
        { name: 'status', label: '状态', type: 'select', options: ON_OFF },
      ]}
      onBeforeSave={(p) => {
        if (typeof p.related_products === 'string') {
          try { p.related_products = JSON.parse(p.related_products || '[]') } catch { p.related_products = [] }
        }
        return p
      }}
    />
  )
}

/** 新闻管理（企业/行业 + 发布状态 + 置顶） */
export function NewsPage() {
  return (
    <CrudPage
      api={newsApi}
      title="新闻管理"
      searchHint="搜索新闻标题"
      columns={[
        { title: '标题', dataIndex: 'title' },
        { title: '分类', dataIndex: 'category', width: 90, render: (v) => (v === 'company' ? <Tag color="blue">企业新闻</Tag> : <Tag color="purple">行业资讯</Tag>) },
        { title: '发布', dataIndex: 'is_published', width: 70, render: (v) => (v ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>) },
        { title: '置顶', dataIndex: 'is_top', width: 70, render: (v) => (v ? '★' : '') },
        { title: '发布日期', dataIndex: 'publish_date', width: 110 },
      ]}
      formFields={[
        { name: 'category', label: '分类', type: 'select', options: [
          { value: 'company', label: '企业新闻' },
          { value: 'industry', label: '行业资讯' },
        ], rules: [{ required: true, message: '请选择分类' }] },
        { name: 'title', label: '标题', rules: [{ required: true, message: '请输入标题' }] },
        { name: 'cover_image', label: '封面图', type: 'image' },
        { name: 'summary', label: '摘要', type: 'textarea', rows: 2 },
        { name: 'content', label: '正文（富文本）', type: 'rich' },
        { name: 'source', label: '来源（转载标注）', placeholder: '如：转载自XX' },
        { name: 'author', label: '作者' },
        { name: 'is_published', label: '是否发布', type: 'switch' },
        { name: 'is_top', label: '置顶/推荐', type: 'switch' },
        { name: 'publish_date', label: '发布时间（发布必填）', type: 'date' },
        { name: 'deadline', label: '截止时间（过期不再展示）', type: 'date' },
        { name: 'sort_order', label: '排序值', type: 'number' },
      ]}
    />
  )
}

/** 招聘管理（社会/校园） */
export function JobsPage() {
  return (
    <CrudPage
      api={jobApi}
      title="招聘管理"
      searchHint="搜索职位名"
      statusFilter={ON_OFF}
      columns={[
        { title: '职位', dataIndex: 'title' },
        { title: '分类', dataIndex: 'category', width: 90, render: (v) => (v === 'social' ? <Tag color="cyan">社会招聘</Tag> : <Tag color="geekblue">校园招聘</Tag>) },
        { title: '部门', dataIndex: 'department', width: 100 },
        { title: '城市', dataIndex: 'city', width: 90 },
        { title: '发布日期', dataIndex: 'publish_date', width: 110 },
        { title: '状态', dataIndex: 'status', width: 80, render: statusTag },
      ]}
      formFields={[
        { name: 'category', label: '分类', type: 'select', options: [
          { value: 'social', label: '社会招聘' },
          { value: 'campus', label: '校园招聘' },
        ], rules: [{ required: true, message: '请选择分类' }] },
        { name: 'title', label: '职位名', rules: [{ required: true, message: '请输入职位名' }] },
        { name: 'department', label: '部门' },
        { name: 'city', label: '城市' },
        { name: 'description', label: '职位描述', type: 'textarea', rows: 4 },
        { name: 'requirements', label: '任职要求', type: 'textarea', rows: 4 },
        { name: 'apply_info', label: '投递方式（邮箱/说明）', type: 'textarea', rows: 2 },
        { name: 'publish_date', label: '发布日期（上架必填）', type: 'date' },
        { name: 'status', label: '状态', type: 'select', options: ON_OFF },
      ]}
    />
  )
}

/** 招商政策/优势管理（仅管理员可见，ADR-010） */
export function FranchisePage() {
  return (
    <CrudPage
      api={franchiseApi}
      title="招商加盟管理"
      searchHint="搜索政策标题"
      statusFilter={ON_OFF}
      columns={[
        { title: '标题', dataIndex: 'title' },
        { title: '配图', dataIndex: 'image', width: 120, render: (v) => v ? <img src={v} alt="" style={{ width: 100, height: 50, objectFit: 'cover', borderRadius: 4 }} /> : '-' },
        { title: '排序', dataIndex: 'sort_order', width: 70 },
        { title: '状态', dataIndex: 'status', width: 80, render: statusTag },
      ]}
      formFields={[
        { name: 'title', label: '标题', rules: [{ required: true, message: '请输入标题' }] },
        { name: 'content', label: '内容（富文本）', type: 'rich' },
        { name: 'image', label: '配图', type: 'image' },
        { name: 'sort_order', label: '排序值', type: 'number' },
        { name: 'status', label: '状态', type: 'select', options: ON_OFF },
      ]}
    />
  )
}

/** 门店管理（含经纬度，供高德地图标点） */
export function StoresPage() {
  return (
    <CrudPage
      api={storeApi}
      title="门店管理"
      searchHint="搜索门店名/城市"
      statusFilter={ON_OFF}
      columns={[
        { title: '名称', dataIndex: 'name' },
        { title: '省', dataIndex: 'province', width: 80 },
        { title: '市', dataIndex: 'city', width: 90 },
        { title: '地址', dataIndex: 'address', ellipsis: true },
        { title: '电话', dataIndex: 'phone', width: 130 },
        { title: '经纬度', width: 150, render: (_, r) => (r.lng ? `${r.lng.toFixed(3)}, ${r.lat?.toFixed(3)}` : '-') },
        { title: '状态', dataIndex: 'status', width: 80, render: statusTag },
      ]}
      formFields={[
        { name: 'name', label: '门店名', rules: [{ required: true, message: '请输入门店名' }] },
        { name: 'province', label: '省' },
        { name: 'city', label: '市' },
        { name: 'address', label: '详细地址' },
        { name: 'phone', label: '电话' },
        { name: 'lng', label: '经度（高德标点）', type: 'number' },
        { name: 'lat', label: '纬度（高德标点）', type: 'number' },
        { name: 'status', label: '状态', type: 'select', options: ON_OFF },
      ]}
    />
  )
}

/**
 * 通用 CRUD 管理页（后台内容管理 8 模块共用）—— 对齐 UI/UX §6 各内容视图 / 技术文档 §5.4
 * 功能：
 * - 列表：关键字搜索 + 状态筛选 + 分页 + 操作列（编辑/删除）
 * - 新增/编辑：Modal + 动态表单（由 formFields 配置驱动）
 * - 删除：Popconfirm 二次确认（PRD §14 谨慎删除）
 * - 字段类型：文本/多行/下拉/数字/日期/开关/富文本/单图/图集
 */
import React, { useCallback, useEffect, useState } from 'react'
import {
  Button, Card, DatePicker, Form, Input, InputNumber, Modal, Popconfirm,
  Select, Switch, Table, Tag, message,
} from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import RichEditor from './RichEditor'
import { GalleryUpload, ImageUpload } from './ImageUpload'

/**
 * CRUD 管理页组件
 * @param api        crudApi 实例（list/create/update/remove）
 * @param columns    AntD Table 列配置（末尾自动追加操作列）
 * @param formFields 表单字段配置 [{name,label,type,options,rules,props}]
 * @param title      页面标题（含新增按钮文案）
 * @param searchHint 搜索框占位提示
 * @param statusFilter 状态筛选选项（null 则不显示，如关于页/联系信息）
 * @param rowKey     主键字段名（默认 id）
 * @param onBeforeSave 保存前数据预处理回调（如 specs JSON 解析）
 */
export default function CrudPage({
  api, columns, formFields, title, searchHint = '搜索...',
  statusFilter = null, rowKey = 'id', onBeforeSave,
}) {
  const [form] = Form.useForm()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null) // 正在编辑的记录（null=新增）

  /** 加载列表（搜索/筛选/分页变化时触发） */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize, q: q || undefined, status: status || undefined }
      const r = await api.list(params)
      setData(r.items || [])
      setTotal(r.total || 0)
    } finally {
      setLoading(false)
    }
  }, [api, page, pageSize, q, status])

  useEffect(() => { load() }, [load])

  // Modal 打开后（内容已挂载）再回填/重置表单。
  // 关键：不能在 openEdit 里直接 setFieldsValue —— Modal 未打开时 Form 未连接，
  // AntD 会静默丢弃这些值，导致"编辑失效/表单空白"。
  const handleModalOpen = (visible) => {
    if (!visible) return
    if (editing) {
      form.setFieldsValue(normalizeEdit(editing, formFields))
    } else {
      form.resetFields()
    }
  }

  /** 打开新增弹窗（仅置状态，回填交给 Modal afterOpenChange） */
  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  /** 打开编辑弹窗（仅置状态，回填交给 Modal afterOpenChange） */
  const openEdit = (record) => {
    setEditing(record)
    setOpen(true)
  }

  /** 编辑回填预处理：JSON/日期字段转可编辑格式
   * - specs/related_products 等 JSON 字段 → JSON 文本（用于 textarea 显示）
   * - 日期字段(YYYY-MM-DD 字符串) → dayjs 对象（DatePicker 才能正确显示）
   * 兜底：所有外部数据都做防御性判断（null/undefined/字符串都安全处理）
   */
  const normalizeEdit = (record, fields) => {
    const vals = { ...(record || {}) }
    // 通用：JSON 对象 → 字符串（products.specs / cases.related_products）
    ['specs', 'related_products'].forEach((k) => {
      const v = vals[k]
      if (v && typeof v === 'object') vals[k] = JSON.stringify(v, null, 2)
    })
    // 日期字段：YYYY-MM-DD 字符串 → dayjs（DatePicker 必需 dayjs 或 Date 对象）
    if (Array.isArray(fields)) {
      fields.forEach((f) => {
        if (!f || !f.name) return
        const v = vals[f.name]
        if (f.type === 'date' && typeof v === 'string' && v.length >= 10) {
          vals[f.name] = dayjs(v)
        }
      })
    }
    return vals
  }

  /** 保存（新增或更新）：校验通过 → 调用 API → 刷新列表 */
  const handleSave = async () => {
    const values = await form.validateFields()
    let payload = { ...values }
    // 日期字段（dayjs）→ YYYY-MM-DD 字符串（后端约定格式）
    Object.keys(payload).forEach((k) => {
      if (payload[k] && dayjs.isDayjs(payload[k])) payload[k] = payload[k].format('YYYY-MM-DD')
    })
    // 预处理回调（如 specs JSON 解析）
    if (onBeforeSave) payload = onBeforeSave(payload)
    try {
      if (editing) {
        await api.update(editing[rowKey], payload)
        message.success('保存成功')
      } else {
        await api.create(payload)
        message.success('新增成功')
      }
      setOpen(false)
      load()
    } catch (e) { /* 错误已提示 */ }
  }

  /** 删除：二次确认（Popconfirm） */
  const handleDelete = async (record) => {
    try {
      await api.remove(record[rowKey])
      message.success('删除成功')
      load()
    } catch (e) { /* 错误已提示 */ }
  }

  /** 根据配置渲染表单项控件 */
  const renderControl = (f) => {
    switch (f.type) {
      case 'textarea':
        return <Input.TextArea rows={f.rows || 4} placeholder={f.placeholder} />
      case 'select':
        return <Select options={f.options} placeholder={f.placeholder} allowClear />
      case 'number':
        return <InputNumber style={{ width: '100%' }} min={0} />
      case 'date':
        return <DatePicker style={{ width: '100%' }} />
      case 'switch':
        return <Switch checkedChildren="是" unCheckedChildren="否" />
      case 'rich':
        return <RichEditor />
      case 'image':
        return <ImageUpload label={f.placeholder || '上传图片'} />
      case 'gallery':
        return <GalleryUpload />
      default:
        return <Input placeholder={f.placeholder} />
    }
  }

  /** 表格列：末尾追加操作列（编辑/删除） */
  const tableColumns = [
    ...columns,
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <span>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该记录吗？" description="删除后不可恢复" onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </span>
      ),
    },
  ]

  return (
    <Card
      title={title}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增
        </Button>
      }
    >
      {/* 搜索与筛选工具栏 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          placeholder={searchHint}
          style={{ width: 260 }}
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
        />
        {statusFilter && (
          <Select
            style={{ width: 140 }}
            placeholder="状态筛选"
            allowClear
            value={status || undefined}
            onChange={(v) => { setStatus(v || ''); setPage(1) }}
            options={statusFilter}
          />
        )}
        <Button icon={<ReloadOutlined />} onClick={() => { setQ(''); setStatus(''); setPage(1); load() }}>
          重置
        </Button>
      </div>

      {/* 数据表格 */}
      <Table
        rowKey={rowKey}
        loading={loading}
        columns={tableColumns}
        dataSource={data}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editing ? '编辑' : '新增'}
        open={open}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        afterOpenChange={handleModalOpen}
        width={720}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {formFields.map((f) => (
            <Form.Item
              key={f.name}
              name={f.name}
              label={f.label}
              rules={f.rules || []}
              valuePropName={f.type === 'switch' ? 'checked' : 'value'}
            >
              {renderControl(f)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </Card>
  )
}

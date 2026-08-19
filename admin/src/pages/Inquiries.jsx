/**
 * 询盘中心 —— 对齐 UI/UX §6 视图10 / PRD §7.3 / 技术文档 §5.5
 * 功能：类型/状态/时间三维筛选；详情 Modal；标记（待处理/已处理/无效）+ 备注；CSV 导出（UTF-8 BOM）
 * 说明：四类表单（在线预约/联系留言/招商咨询/招聘意向）统一管理；状态机见技术文档 §5.6
 */
import React, { useCallback, useEffect, useState } from 'react'
import {
  Button, Card, DatePicker, Descriptions, Input, Modal, Popconfirm,
  Select, Space, Table, Tag, message,
} from 'antd'
import { DownloadOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { exportInquiries, listInquiries, updateInquiry } from '../api/client'

// 类型/状态展示映射（含标签色，对齐 UI/UX §3.1 语义色）
const TYPE_META = {
  appointment: { label: '在线预约', color: 'red' },
  message: { label: '联系留言', color: 'blue' },
  franchise: { label: '招商咨询', color: 'gold' },
  job: { label: '招聘意向', color: 'green' },
}
const STATUS_META = {
  pending: { label: '待处理', color: 'gold' },
  done: { label: '已处理', color: 'green' },
  invalid: { label: '无效', color: 'default' },
}

/** 询盘中心主组件 */
export default function Inquiries() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [range, setRange] = useState(null) // [start, end] dayjs
  const [detail, setDetail] = useState(null) // 详情弹窗数据

  /** 组装筛选参数：date 范围 → date_from/date_to（YYYY-MM-DD） */
  const buildParams = useCallback((p = page, ps = pageSize) => ({
    page: p,
    page_size: ps,
    type: type || undefined,
    status: status || undefined,
    date_from: range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
    date_to: range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
  }), [type, status, range, page, pageSize])

  /** 加载列表 */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await listInquiries(buildParams())
      setData(r.items || [])
      setTotal(r.total || 0)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => { load() }, [load])

  /** 标记状态（状态机 §5.6：pending/done/invalid 互转） */
  const markStatus = async (record, nextStatus) => {
    try {
      await updateInquiry(record.id, { status: nextStatus })
      message.success(`已标记为「${STATUS_META[nextStatus].label}」`)
      load()
    } catch (e) { /* 错误已提示 */ }
  }

  /** 保存备注 */
  const saveNote = async (record, note) => {
    try {
      await updateInquiry(record.id, { note })
      message.success('备注已保存')
      load()
    } catch (e) { /* 错误已提示 */ }
  }

  /** CSV 导出：携带当前筛选条件，blob 下载（UTF-8 BOM，后端已生成） */
  const handleExport = async () => {
    try {
      const blob = await exportInquiries({
        type: type || undefined,
        status: status || undefined,
        date_from: range?.[0] ? range[0].format('YYYY-MM-DD') : undefined,
        date_to: range?.[1] ? range[1].format('YYYY-MM-DD') : undefined,
      })
      // 创建下载链接（文件名含日期，对齐 PRD §7.3 P2）
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `询盘导出_${dayjs().format('YYYYMMDD')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (e) { /* 错误已提示 */ }
  }

  /** 重置筛选 */
  const reset = () => {
    setType(''); setStatus(''); setRange(null); setPage(1)
  }

  return (
    <Card
      title="询盘中心"
      extra={
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出 CSV
        </Button>
      }
    >
      {/* 三维筛选工具栏 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          style={{ width: 140 }}
          placeholder="类型筛选"
          allowClear
          value={type || undefined}
          onChange={(v) => { setType(v || ''); setPage(1) }}
          options={Object.entries(TYPE_META).map(([k, v]) => ({ value: k, label: v.label }))}
        />
        <Select
          style={{ width: 140 }}
          placeholder="状态筛选"
          allowClear
          value={status || undefined}
          onChange={(v) => { setStatus(v || ''); setPage(1) }}
          options={Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))}
        />
        <DatePicker.RangePicker
          value={range}
          onChange={(v) => { setRange(v); setPage(1) }}
          style={{ width: 260 }}
        />
        <Button icon={<ReloadOutlined />} onClick={reset}>重置</Button>
      </div>

      {/* 询盘表格 */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 60 },
          {
            title: '类型', dataIndex: 'type', width: 100,
            render: (v) => <Tag color={TYPE_META[v]?.color}>{TYPE_META[v]?.label || v}</Tag>,
          },
          { title: '姓名', dataIndex: 'name', width: 100 },
          { title: '电话', dataIndex: 'phone', width: 130 },
          { title: '主题/意向', dataIndex: 'subject', ellipsis: true },
          {
            title: '状态', dataIndex: 'status', width: 90,
            render: (v) => <Tag color={STATUS_META[v]?.color}>{STATUS_META[v]?.label || v}</Tag>,
          },
          { title: '提交时间', dataIndex: 'created_at', width: 170 },
          {
            title: '操作', key: 'action', width: 220,
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" onClick={() => setDetail(record)}>详情</Button>
                {record.status !== 'done' && (
                  <Button type="link" size="small" onClick={() => markStatus(record, 'done')}>标记已处理</Button>
                )}
                {record.status !== 'invalid' && (
                  <Popconfirm title="标记为无效？" description="用于垃圾/测试/重复询盘（合规清理）" onConfirm={() => markStatus(record, 'invalid')}>
                    <Button type="link" size="small" danger>无效</Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />

      {/* 详情 Modal：全字段 + 备注编辑 */}
      <Modal
        title="询盘详情"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={560}
      >
        {detail && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="类型">{TYPE_META[detail.type]?.label || detail.type}</Descriptions.Item>
              <Descriptions.Item label="姓名">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="电话">{detail.phone}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detail.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="主题/意向职位">{detail.subject || '-'}</Descriptions.Item>
              <Descriptions.Item label="留言">{detail.message || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_META[detail.status]?.color}>{STATUS_META[detail.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">{detail.created_at}</Descriptions.Item>
              <Descriptions.Item label="隐私同意时间">{detail.consent_at || '-'}</Descriptions.Item>
            </Descriptions>
            {/* 备注编辑（失焦保存） */}
            <div className="mt-4">
              <label className="text-sm text-gray-500 block mb-1">管理员备注</label>
              <Input.TextArea
                rows={3}
                defaultValue={detail.note || ''}
                placeholder="填写跟进备注，失焦自动保存"
                onBlur={(e) => e.target.value !== (detail.note || '') && saveNote(detail, e.target.value)}
              />
            </div>
          </>
        )}
      </Modal>
    </Card>
  )
}

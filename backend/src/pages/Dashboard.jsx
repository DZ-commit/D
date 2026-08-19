/**
 * 仪表盘 —— 对齐 UI/UX §6 视图1 / PRD §7.1 / 技术文档 §5.4
 * 功能：6 张统计卡（系列/产品/案例/新闻/门店/待处理询盘）+ 近 7 天询盘趋势柱状图（CSS 实现）+ 最近询盘列表
 * 说明：趋势图数据从询盘列表按提交日期前端聚合（无独立统计接口，符合轻量定位）
 */
import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Table, Tag } from 'antd'
import dayjs from 'dayjs'
import { fetchDashboard, listInquiries } from '../api/client'

// 统计卡配置（icon/标题/颜色，对齐 UI/UX §3.1 admin 语义色）
const STAT_CARDS = [
  { key: 'product_series', label: '产品系列', color: '#4F46E5' },
  { key: 'products', label: '产品', color: '#059669' },
  { key: 'cases', label: '案例', color: '#D97706' },
  { key: 'news', label: '新闻', color: '#6B7280' },
  { key: 'stores', label: '门店', color: '#DC2626' },
  { key: 'pending_inquiries', label: '待处理询盘', color: '#4F46E5' },
]

const TYPE_LABEL = { appointment: '在线预约', message: '联系留言', franchise: '招商咨询', job: '招聘意向' }
const STATUS_LABEL = { pending: '待处理', done: '已处理', invalid: '无效' }

/** 仪表盘主组件 */
export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [trend, setTrend] = useState([])

  // 加载统计 + 最近询盘 + 趋势数据
  useEffect(() => {
    fetchDashboard().then(setStats).catch(() => {})
    listInquiries({ page_size: 100 }).then((r) => {
      const items = r.items || []
      // 最近 5 条询盘
      setRecent(items.slice(0, 5))
      // 近 7 天询盘数聚合（按 created_at 前 10 位日期）
      const days = Array.from({ length: 7 }, (_, i) =>
        dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD'))
      const counts = days.map((d) => items.filter((it) => (it.created_at || '').startsWith(d)).length)
      setTrend(days.map((d, i) => ({ date: d, count: counts[i] })))
    }).catch(() => {})
  }, [])

  // 统计卡渲染
  const maxTrend = Math.max(1, ...trend.map((t) => t.count))

  return (
    <div className="space-y-6">
      {/* 统计卡（6 张） */}
      <Row gutter={[16, 16]}>
        {STAT_CARDS.map((c) => (
          <Col xs={12} md={8} key={c.key}>
            <Card styles={{ body: { padding: 20 } }}>
              <p className="text-gray-500 text-sm mb-2">{c.label}</p>
              <p className="text-2xl font-bold" style={{ color: c.color }}>
                {stats ? stats[c.key] : '-'}
              </p>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 近 7 天询盘趋势（纯 CSS 柱状图，无图表库依赖） */}
        <Col xs={24} lg={10}>
          <Card title="近 7 天询盘趋势">
            <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
              {trend.map((t) => (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{t.count || ''}</span>
                  <div
                    style={{
                      height: `${Math.max(4, (t.count / maxTrend) * 110)}px`,
                      background: '#4F46E5',
                      borderRadius: '4px 4px 0 0',
                      width: '70%',
                      opacity: t.count > 0 ? 0.9 : 0.25,
                    }}
                  />
                  <span className="text-[10px] text-gray-400">{t.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 最近询盘 */}
        <Col xs={24} lg={14}>
          <Card title="最近询盘">
            <Table
              rowKey="id"
              size="small"
              dataSource={recent}
              pagination={false}
              columns={[
                { title: '姓名', dataIndex: 'name', width: 100 },
                {
                  title: '类型', dataIndex: 'type', width: 100,
                  render: (v) => <Tag>{TYPE_LABEL[v] || v}</Tag>,
                },
                { title: '电话', dataIndex: 'phone', width: 130 },
                {
                  title: '状态', dataIndex: 'status', width: 90,
                  render: (v) => <Tag color={v === 'pending' ? 'gold' : v === 'done' ? 'green' : 'default'}>{STATUS_LABEL[v]}</Tag>,
                },
                { title: '提交时间', dataIndex: 'created_at' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

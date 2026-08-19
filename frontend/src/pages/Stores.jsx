/**
 * 门店分布 —— 对齐 UI/UX §5 视图11 / PRD §6.5 / D1
 * 功能：门店列表（省/市/地址/电话）+ 高德地图嵌入（经纬度标点）；支持按省份筛选
 * 说明：地图组件无 Key 时自动降级为地址卡片 + 高德外链（开发/验收期可用）
 */
import React, { useEffect, useMemo, useState } from 'react'
import { fetchStores } from '../api/client'
import MapEmbed from '../components/MapEmbed'
import { EmptyState, Loading, SectionTitle } from '../components/common'

/** 门店列表主组件 */
export default function Stores() {
  const [stores, setStores] = useState(null)
  const [province, setProvince] = useState('')

  // 加载全部门店（page_size=50）
  useEffect(() => {
    fetchStores()
      .then((r) => setStores(r.items || []))
      .catch(() => setStores([]))
  }, [])

  // 省份筛选：从门店数据去重生成省份列表（简单方案，无独立省表）
  const provinces = useMemo(() => [...new Set((stores || []).map((s) => s.province).filter(Boolean))], [stores])

  // 当前筛选后的门店 + 地图点位
  const filtered = useMemo(
    () => (province ? (stores || []).filter((s) => s.province === province) : stores || []),
    [stores, province],
  )
  const markers = filtered.map((s) => ({ lng: s.lng, lat: s.lat, name: s.name, address: s.address, phone: s.phone }))

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <SectionTitle en="Stores" cn="门店分布" />

      {!stores ? (
        <Loading />
      ) : stores.length === 0 ? (
        <EmptyState text="门店信息准备中" />
      ) : (
        <div className="grid lg:grid-cols-5 gap-8">
          {/* 左：门店列表（地区筛选 + 卡片） */}
          <div className="lg:col-span-2">
            {/* 省份筛选 */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setProvince('')}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  !province ? 'bg-brass text-white border-brass' : 'border-line text-muted hover:border-brass'
                }`}
              >
                全部
              </button>
              {provinces.map((p) => (
                <button
                  key={p}
                  onClick={() => setProvince(p)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    province === p ? 'bg-brass text-white border-brass' : 'border-line text-muted hover:border-brass'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* 门店卡片列表 */}
            <div className="space-y-3">
              {filtered.length === 0 && <p className="text-muted text-sm">该地区暂无门店</p>}
              {filtered.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-line p-5">
                  <p className="font-medium text-ink">{s.name}</p>
                  <p className="text-sm text-muted mt-1.5">{(s.province || '') + (s.city || '')} {s.address || ''}</p>
                  {s.phone && <p className="text-sm text-brass mt-1">电话：{s.phone}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* 右：高德地图（降级地址卡） */}
          <div className="lg:col-span-3">
            <MapEmbed markers={markers} height={520} title="门店地图" />
          </div>
        </div>
      )}
    </main>
  )
}

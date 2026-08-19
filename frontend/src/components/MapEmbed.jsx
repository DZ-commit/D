/**
 * 地图嵌入组件 —— 对齐 PRD D1（高德 JS API）
 * 功能：
 * - 配置了高德 Key（VITE_AMAP_KEY）时：动态加载 AMap，渲染地图 + 门店/公司标记点
 * - 未配置 Key 时：优雅降级为地址卡片 + 「高德地图中打开」外链（开发/验收期可用）
 * 说明：AMap 按需动态加载，不阻塞页面渲染
 */
import React, { useEffect, useRef, useState } from 'react'

/** 高德地图 Key（Vite 环境变量注入，无则降级） */
const AMAP_KEY = import.meta.env.VITE_AMAP_KEY || ''

/** 降级视图：地址卡片列表 + 高德外链 */
function FallbackMap({ markers, title = '地图位置' }) {
  if (!markers || markers.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-white p-8 text-center text-muted text-sm">
        暂无地图点位数据
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <p className="font-medium text-ink mb-4">{title}</p>
      <ul className="space-y-4">
        {markers.map((m) => (
          <li key={`${m.name}-${m.address}`} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">{m.name}</p>
              <p className="text-xs text-muted mt-1">{m.address}</p>
              {m.phone && <p className="text-xs text-muted mt-0.5">{m.phone}</p>}
            </div>
            {/* 高德外链：map.qq.com 需腾讯地图；此处用高德 uri 搜索地址 */}
            {m.address && (
              <a
                href={`https://uri.amap.com/search?keyword=${encodeURIComponent(m.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-brass hover:text-brass-dark"
              >
                高德打开 ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * 地图组件
 * @param markers 点位数组 [{lng,lat,name,address,phone}]
 * @param height 地图高度（默认 420px）
 * @param title 降级视图标题
 */
export default function MapEmbed({ markers = [], height = 420, title }) {
  const mapRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [amapError, setAmapError] = useState(false)

  // 动态加载高德地图（amap-jsapi-loader），仅在配置了 Key 时执行
  useEffect(() => {
    if (!AMAP_KEY || !markers.some((m) => m.lng && m.lat)) {
      setAmapError(true) // 无 Key 或无经纬度 → 降级
      return
    }
    let cancelled = false
    // 动态 import 高德 loader（避免无 Key 时引入大包）
    import('@amap/amap-jsapi-loader')
      .then(({ default: AMapLoader }) =>
        AMapLoader.load({
          key: AMAP_KEY,
          version: '2.0',
          plugins: [],
        }),
      )
      .then((AMap) => {
        if (cancelled || !mapRef.current) return
        const map = new AMap.Map(mapRef.current, {
          zoom: 11,
          center: markers.find((m) => m.lng) ? [markers[0].lng, markers[0].lat] : undefined,
        })
        // 批量添加标记点
        markers.forEach((m) => {
          if (!m.lng || !m.lat) return
          const marker = new AMap.Marker({ position: [m.lng, m.lat], title: m.name })
          marker.setMap(map)
          // 信息窗体：门店名 + 地址
          const info = new AMap.InfoWindow({
            content: `<div style="padding:4px 8px;font-size:13px"><b>${m.name}</b><br/>${m.address || ''}</div>`,
            offset: new AMap.Pixel(0, -30),
          })
          marker.on('click', () => info.open(map, marker.getPosition()))
        })
        setMapReady(true)
      })
      .catch(() => setAmapError(true)) // 加载失败 → 降级
    return () => {
      cancelled = true
    }
  }, [markers])

  // 有 Key 且加载成功 → 渲染地图容器；否则降级视图
  if (AMAP_KEY && !amapError) {
    return <div ref={mapRef} style={{ height }} className="rounded-xl overflow-hidden border border-line" />
  }
  return <FallbackMap markers={markers} title={title} />
}

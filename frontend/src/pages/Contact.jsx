/**
 * 联系我们 —— 对齐 UI/UX §5 视图15 / PRD §6.6
 * 功能：公司地址/电话/邮箱（company_contact）+ 高德地图 + 在线预约表单 + 联系留言表单
 * 说明：URL 参数 scroll=appointment 时自动滚动到预约表单（导航「在线预约」入口）
 */
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchContact } from '../api/client'
import InquiryForm from '../components/InquiryForm'
import MapEmbed from '../components/MapEmbed'
import { Loading, SectionTitle } from '../components/common'

/** 联系信息项：图标 + 标签 + 内容 */
function InfoItem({ label, children }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-line last:border-0">
      <span className="w-9 h-9 rounded-full bg-brass/10 text-brass-dark flex items-center justify-center shrink-0 text-sm">
        {label === '地址' ? '址' : label === '电话' ? '话' : '箱'}
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-ink mt-0.5 break-all">{children}</p>
      </div>
    </div>
  )
}

/** 联系我们主组件 */
export default function Contact() {
  const [params] = useSearchParams()
  const [contact, setContact] = useState(null)
  const appointmentRef = useRef(null)

  // 加载公司联系信息
  useEffect(() => {
    fetchContact().then(setContact).catch(() => setContact(null))
  }, [])

  // 支持 URL 参数 scroll=appointment：进入页面滚动到在线预约表单
  useEffect(() => {
    if (params.get('scroll') === 'appointment' && appointmentRef.current) {
      appointmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [params, contact])

  // 地图点位（公司总部经纬度）
  const markers = contact?.lng && contact?.lat
    ? [{ lng: contact.lng, lat: contact.lat, name: contact.company_name, address: contact.address, phone: contact.phone }]
    : []

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <SectionTitle en="Contact Us" cn="联系我们" />

      <div className="grid lg:grid-cols-2 gap-12">
        {/* 左：联系信息 + 地图 */}
        <div>
          {!contact ? (
            <Loading />
          ) : (
            <div className="bg-white rounded-xl border border-line p-8">
              <h2 className="font-serif text-2xl text-ink mb-6">{contact.company_name}</h2>
              <InfoItem label="地址">{contact.address || '暂无'}</InfoItem>
              <InfoItem label="电话">{contact.phone || '暂无'}</InfoItem>
              <InfoItem label="邮箱">{contact.email || '暂无'}</InfoItem>
            </div>
          )}
          {/* 地图（高德，无 Key 降级） */}
          <div className="mt-6">
            <MapEmbed markers={markers} height={300} title="公司位置" />
          </div>
        </div>

        {/* 右：在线预约表单（锚点：导航「在线预约」滚动定位） */}
        <div ref={appointmentRef} className="scroll-mt-24">
          <div className="bg-white rounded-xl border border-line p-8 mb-8">
            <h2 className="font-serif text-2xl text-ink mb-6">在线预约</h2>
            <InquiryForm kind="appointment" />
          </div>
          <div className="bg-white rounded-xl border border-line p-8">
            <h2 className="font-serif text-2xl text-ink mb-6">联系留言</h2>
            <InquiryForm kind="message" />
          </div>
        </div>
      </div>
    </main>
  )
}

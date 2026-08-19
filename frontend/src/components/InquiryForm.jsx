/**
 * 公开表单组件（前台四类统一）—— 对齐 PRD §11 / UI/UX §9
 * 功能：
 * - 校验：姓名/电话必填、电话格式（大陆手机/固话）、邮箱格式、隐私同意勾选必选
 * - honeypot 蜜罐：隐藏字段 hp 留空（后端检测有值即丢弃，PRD D6）
 * - consent_at：勾选隐私时记录提交时间戳（合规留痕）
 * - 反馈：提交成功绿色提示条（4s 消失）；错误就近红字
 */
import React, { useRef, useState } from 'react'
import { submitInquiry } from '../api/client'

// 大陆手机号正则（与后端一致）
const MOBILE_RE = /^1[3-9]\d{9}$/
// 大陆固话正则（区号 0 开头 2-3 位，可带 -，7-8 位号码）
const TEL_RE = /^0\d{2,3}-?\d{7,8}$/

/** 表单字段配置：type 区分四类询盘，subject 可选（下拉或文本） */
const FORM_CONFIG = {
  appointment: {
    type: 'appointment',
    title: '在线预约',
    fields: ['name', 'phone', 'subject', 'message'],
    subjectLabel: '预约类型',
    subjectOptions: ['量房预约', '到店参观', '定制咨询'],
    subjectPlaceholder: '请选择预约类型',
    messagePlaceholder: '请简单描述您的需求（如空间、风格偏好）',
  },
  message: {
    type: 'message',
    title: '联系留言',
    fields: ['name', 'phone', 'email', 'message'],
    messagePlaceholder: '请留下您的留言',
  },
  franchise: {
    type: 'franchise',
    title: '招商咨询',
    fields: ['name', 'phone', 'message'],
    messagePlaceholder: '请填写您的加盟意向与城市',
  },
  job: {
    type: 'job',
    title: '投递意向',
    fields: ['name', 'phone', 'subject'],
    subjectLabel: '意向职位',
    subjectPlaceholder: '请输入意向职位名称',
  },
}

/** 输入框通用类名（focus 黄铜描边） */
const inputCls =
  'w-full rounded-lg border border-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brass transition-colors'

/** 表单错误提示（就近红字 + aria-live 播报） */
function FieldError({ msg }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-500" aria-live="polite">{msg}</p>
}

/**
 * 询盘表单组件
 * @param kind 表单类型：appointment/message/franchise/job
 * @param defaultSubject 默认意向职位（招聘详情页传入）
 */
export default function InquiryForm({ kind, defaultSubject = '' }) {
  const cfg = FORM_CONFIG[kind]
  // 表单状态：各字段值 + 错误信息
  const [values, setValues] = useState({
    name: '', phone: '', email: '', subject: defaultSubject, message: '',
  })
  const [errors, setErrors] = useState({})
  const [agree, setAgree] = useState(false) // 隐私同意勾选
  const [success, setSuccess] = useState(false) // 成功提示条
  const [submitting, setSubmitting] = useState(false)
  const hpRef = useRef('') // 蜜罐字段（隐藏，必须为空）

  /** 字段变更 */
  const onChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
  }

  /** 校验：必填 + 格式 + 隐私同意 */
  const validate = () => {
    const er = {}
    if (!values.name.trim()) er.name = '请输入姓名'
    const phone = values.phone.trim()
    if (!phone) er.phone = '请输入电话'
    else if (!MOBILE_RE.test(phone) && !TEL_RE.test(phone)) er.phone = '电话格式不正确'
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) er.email = '邮箱格式不正确'
    if (!agree) er.agree = '请先阅读并同意隐私政策'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  /** 提交：校验通过 → 提交（含蜜罐与同意时间戳） → 成功提示 */
  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    try {
      await submitInquiry({
        type: cfg.type,
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim() || undefined,
        subject: values.subject?.trim() || undefined,
        message: values.message?.trim() || undefined,
        hp: hpRef.current, // 蜜罐：留空（后端检测非空即丢弃）
        consent_at: new Date().toISOString().replace('T', ' ').slice(0, 19), // 同意时间戳
      })
      // 提交成功：清空表单 + 绿色提示条（4s 后消失）
      setSuccess(true)
      setValues({ name: '', phone: '', email: '', subject: kind === 'job' ? '' : defaultSubject, message: '' })
      setAgree(false)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setErrors((er) => ({ ...er, form: err.message }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {/* 蜜罐隐藏字段：人类用户不可见，机器人会填写 */}
      <div className="hidden" aria-hidden="true">
        <label>
          网站维护字段
          <input type="text" tabIndex={-1} autoComplete="off" onChange={(e) => (hpRef.current = e.target.value)} />
        </label>
      </div>

      {/* 成功提示条（页面内绿色，4s 自动消失） */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3" role="status">
          ✓ 提交成功，我们将尽快与您联系
        </div>
      )}
      {errors.form && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3" role="alert">
          {errors.form}
        </div>
      )}

      {/* 姓名（必填） */}
      <div>
        <label htmlFor={`${kind}-name`} className="block text-sm mb-1.5">姓名 <span className="text-red-500">*</span></label>
        <input id={`${kind}-name`} value={values.name} onChange={onChange('name')} placeholder="请输入您的姓名" className={inputCls} />
        <FieldError msg={errors.name} />
      </div>

      {/* 电话（必填，格式校验） */}
      <div>
        <label htmlFor={`${kind}-phone`} className="block text-sm mb-1.5">电话 <span className="text-red-500">*</span></label>
        <input id={`${kind}-phone`} value={values.phone} onChange={onChange('phone')} placeholder="手机号或固话" className={inputCls} />
        <FieldError msg={errors.phone} />
      </div>

      {/* 邮箱（可选，格式校验；联系留言显示） */}
      {cfg.fields.includes('email') && (
        <div>
          <label htmlFor={`${kind}-email`} className="block text-sm mb-1.5">邮箱</label>
          <input id={`${kind}-email`} value={values.email} onChange={onChange('email')} placeholder="选填" className={inputCls} />
          <FieldError msg={errors.email} />
        </div>
      )}

      {/* 预约类型/意向职位（subject） */}
      {cfg.fields.includes('subject') && (
        <div>
          <label htmlFor={`${kind}-subject`} className="block text-sm mb-1.5">{cfg.subjectLabel} <span className="text-red-500">*</span></label>
          {cfg.subjectOptions ? (
            <select id={`${kind}-subject`} value={values.subject} onChange={onChange('subject')} className={inputCls}>
              <option value="">{cfg.subjectPlaceholder}</option>
              {cfg.subjectOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input id={`${kind}-subject`} value={values.subject} onChange={onChange('subject')} placeholder={cfg.subjectPlaceholder} className={inputCls} />
          )}
          <FieldError msg={errors.subject} />
        </div>
      )}

      {/* 留言（可选；招聘意向无留言字段） */}
      {cfg.fields.includes('message') && (
        <div>
          <label htmlFor={`${kind}-message`} className="block text-sm mb-1.5">留言</label>
          <textarea id={`${kind}-message`} value={values.message} onChange={onChange('message')} rows={4} placeholder={cfg.messagePlaceholder} className={inputCls} />
        </div>
      )}

      {/* 隐私同意（必选，记录 consent_at 合规留痕，PRD §11） */}
      <div>
        <label className="flex items-start gap-2 text-xs text-muted cursor-pointer">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-brass" />
          <span>我已阅读并同意《隐私政策》，同意 D全屋家居 为提供服务而收集、使用我的联系方式信息（仅用于业务联系，遵循最小必要原则）。</span>
        </label>
        <FieldError msg={errors.agree} />
      </div>

      {/* 提交按钮：黄铜实心（UI/UX §4.1 .btn-primary） */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brass hover:bg-brass-dark text-white py-3 font-medium transition-colors disabled:opacity-60"
      >
        {submitting ? '提交中...' : '提交'}
      </button>
    </form>
  )
}

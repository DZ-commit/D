/**
 * 关于我们管理 —— 对齐 UI/UX §6 视图8 / PRD §7.2 / §8.9
 * 功能：Tabs 分页管理 关于D/品牌介绍（富文本+图集）、发展历程（结构化时间轴 Form.List）、联系信息（单行）
 * 说明：仅管理员可见（ADR-010）；发展历程以 [{year,event,image}] 结构化 JSON 落库（PRD §8.9）
 */
import React, { useEffect, useState } from 'react'
import {
  Button, Card, Form, Input, InputNumber, message, Tabs, Divider,
} from 'antd'
import { MinusCircleOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import RichEditor from '../components/RichEditor'
import { GalleryUpload, ImageUpload } from '../components/ImageUpload'
import { fetchAboutPage, fetchContactInfo, updateAboutPage, updateContactInfo } from '../api/client'

/**
 * 关于页 Tab：富文本 + 图集（about_d / brand 共用）
 * @param pageKey 键值 about_d/brand
 */
function RichPageTab({ pageKey, tabLabel }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // 加载初始内容
  useEffect(() => {
    fetchAboutPage(pageKey).then((p) => {
      form.setFieldsValue({
        title: p.title || '',
        content: typeof p.content === 'string' ? p.content : '',
        images: p.images || [],
      })
    }).catch(() => message.error('内容加载失败'))
  }, [pageKey, form])

  /** 保存：更新富文本页 */
  const onSave = async () => {
    const v = await form.validateFields()
    setSaving(true)
    try {
      await updateAboutPage(pageKey, v)
      message.success('保存成功')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form form={form} layout="vertical">
      <Form.Item name="title" label="标题">
        <Input placeholder="页面标题" />
      </Form.Item>
      <Form.Item name="content" label="正文（富文本）">
        <RichEditor />
      </Form.Item>
      <Form.Item name="images" label="图集（多图）">
        <GalleryUpload max={6} />
      </Form.Item>
      <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
        保存{tabLabel}
      </Button>
    </Form>
  )
}

/** 发展历程 Tab：结构化时间轴动态编辑（year/event/image） */
function HistoryTab() {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // 加载历史时间轴（content 为 JSON 数组）
  useEffect(() => {
    fetchAboutPage('history').then((p) => {
      form.setFieldsValue({ steps: Array.isArray(p.content) ? p.content : [] })
    }).catch(() => message.error('内容加载失败'))
  }, [form])

  /** 保存：steps 数组 → content JSON 落库 */
  const onSave = async () => {
    const v = await form.validateFields()
    setSaving(true)
    try {
      const steps = (v.steps || []).filter((s) => s.year || s.event)
      await updateAboutPage('history', { content: steps })
      message.success('保存成功')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form form={form} layout="vertical">
      {/* Form.List：动态增删时间轴节点 */}
      <Form.List name="steps">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <div key={key} className="flex gap-3 items-start mb-3">
                <Form.Item name={[name, 'year']} label="年份" style={{ marginBottom: 0, width: 90 }}>
                  <InputNumber style={{ width: '100%' }} min={1900} max={2100} placeholder="2026" />
                </Form.Item>
                <Form.Item name={[name, 'event']} label="事件" style={{ marginBottom: 0, flex: 1 }} rules={[{ required: true, message: '请填写事件' }]}>
                  <Input placeholder="事件描述" />
                </Form.Item>
                <Form.Item name={[name, 'image']} label="配图" style={{ marginBottom: 0, width: 120 }}>
                  <ImageUpload label="上传" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 36, color: '#DC2626' }} />
              </div>
            ))}
            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
              添加时间节点
            </Button>
          </>
        )}
      </Form.List>
      <Divider />
      <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
        保存发展历程
      </Button>
    </Form>
  )
}

/** 联系信息 Tab：单行 company_contact（id=1） */
function ContactTab() {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchContactInfo().then((c) => form.setFieldsValue(c)).catch(() => message.error('加载失败'))
  }, [form])

  const onSave = async () => {
    const v = await form.validateFields()
    setSaving(true)
    try {
      await updateContactInfo(v)
      message.success('保存成功')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
      <Form.Item name="company_name" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="address" label="详细地址">
        <Input />
      </Form.Item>
      <Form.Item name="phone" label="电话">
        <Input />
      </Form.Item>
      <Form.Item name="email" label="邮箱">
        <Input />
      </Form.Item>
      <div className="flex gap-4">
        <Form.Item name="lng" label="经度（高德）">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="lat" label="纬度（高德）">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
      </div>
      <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
        保存联系信息
      </Button>
    </Form>
  )
}

/** 关于我们管理主组件（Tabs） */
export default function AboutPage() {
  return (
    <Card title="关于我们管理">
      <Tabs
        items={[
          { key: 'about_d', label: '关于D', children: <RichPageTab pageKey="about_d" tabLabel="关于D" /> },
          { key: 'brand', label: '品牌介绍', children: <RichPageTab pageKey="brand" tabLabel="品牌介绍" /> },
          { key: 'history', label: '发展历程', children: <HistoryTab /> },
          { key: 'contact', label: '联系我们信息', children: <ContactTab /> },
        ]}
      />
    </Card>
  )
}
